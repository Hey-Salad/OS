import { createId, nowIso } from './ids';
import { attachTraceAttributes, recordUsageMetric, withSpan } from './trace';
import type {
  AppBindings,
  AppVariables,
  RagChunkRecord,
  RagDocumentRecord,
  RagIngestRequest,
  RagIngestResponse,
  RagParsedContent,
  RagQueryRequest,
  RagQueryResponse,
  RagRepository,
  RetrievalHit,
  UsageMetric
} from '../types';
import type { Context } from 'hono';

const DEFAULT_CHUNK_SIZE = 900;
const DEFAULT_CHUNK_OVERLAP = 120;
const DEFAULT_TOP_K = 6;
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';
const DEFAULT_EMBEDDING_DIMENSIONS = 768;
const DEFAULT_CHAT_MODEL = 'gpt-5.4';
const OPENAI_RESPONSES_API = 'https://api.openai.com/v1/responses';
const OPENAI_EMBEDDINGS_API = 'https://api.openai.com/v1/embeddings';

export function createRagRepository(env?: AppBindings): RagRepository {
  if (env?.DB) {
    return new D1RagRepository(env.DB, env.DOCUMENTS_BUCKET, env.VECTOR_INDEX, env.OPENAI_API_KEY);
  }
  return getMemoryRagRepository();
}

export async function ingestDocument(
  c: Context<{ Bindings: AppBindings; Variables: AppVariables }>,
  input: RagIngestRequest
): Promise<RagIngestResponse> {
  const repo = createRagRepository(c.env);
  const parsed = await withSpan(c, 'parse_document_content', async () => normalizeDocumentInput(input));
  const chunkConfig = {
    chunkSize: clampNumber(input.chunking?.max_chars, 200, 4000, DEFAULT_CHUNK_SIZE),
    overlap: clampNumber(input.chunking?.overlap_chars, 0, 1000, DEFAULT_CHUNK_OVERLAP)
  };
  const chunks = await withSpan(c, 'chunk_document_content', async () =>
    chunkText(parsed.text, chunkConfig.chunkSize, chunkConfig.overlap)
  );

  const document = await withSpan(c, 'persist_document', async () =>
    repo.createDocument({
      id: input.document_id,
      scope_type: input.scope_type,
      scope_id: input.scope_id,
      title: input.title ?? parsed.title ?? inferTitleFromText(parsed.text),
      source_type: input.source_type ?? parsed.sourceType,
      source_uri: input.source_uri ?? null,
      r2_key: buildR2Key(input, parsed),
      mime_type: parsed.mimeType,
      content_text: parsed.text,
      metadata_json: JSON.stringify({
        metadata: input.metadata ?? {},
        parser: parsed.parser,
        chunking: chunkConfig,
        filename: input.filename ?? null
      })
    })
  );

  const baseChunks: RagChunkRecord[] = chunks.map((chunk, index) => ({
    id: createId('chunk'),
    document_id: document.id,
    chunk_index: index,
    text_content: chunk.text,
    vector_id: null,
    token_count: estimateTokenCount(chunk.text),
    char_count: chunk.text.length,
    start_offset: chunk.start,
    end_offset: chunk.end,
    metadata_json: JSON.stringify({ keywords: chunk.keywords }),
    created_at: nowIso(),
    updated_at: nowIso()
  }));

  const vector = await withSpan(c, 'vector_index_sync', async () => {
    if (!c.env?.VECTOR_INDEX) {
      return { indexed: false, provider: 'd1-keyword-fallback', reason: 'VECTOR_INDEX binding not configured' };
    }

    if (!c.env?.OPENAI_API_KEY) {
      return {
        indexed: false,
        provider: 'cloudflare-vectorize',
        reason: 'VECTOR_INDEX binding present, but OPENAI_API_KEY is not configured'
      };
    }

    const embeddings = await createEmbeddings(
      c.env.OPENAI_API_KEY,
      baseChunks.map((chunk) => chunk.text_content),
      resolveEmbeddingModel(c.env),
      resolveEmbeddingDimensions(c.env)
    );

    const vectors = embeddings.map((values, index) => ({
      id: baseChunks[index].id,
      values,
      metadata: {
        document_id: document.id,
        chunk_id: baseChunks[index].id,
        chunk_index: baseChunks[index].chunk_index,
        scope_type: document.scope_type,
        scope_id: document.scope_id,
        document_title: document.title,
        source_uri: document.source_uri ?? '',
        text_content: baseChunks[index].text_content
      }
    }));

    await upsertVectors(c.env.VECTOR_INDEX, vectors, buildNamespace(document.scope_type, document.scope_id));

    for (const chunk of baseChunks) {
      chunk.vector_id = chunk.id;
    }

    return {
      indexed: true,
      provider: 'openai+cloudflare-vectorize',
      reason: `Indexed ${vectors.length} chunk vectors using ${resolveEmbeddingModel(c.env)} (${resolveEmbeddingDimensions(c.env)} dims)`
    };
  });

  const persistedChunks = await withSpan(c, 'persist_document_chunks', async () =>
    repo.replaceDocumentChunks(document.id, baseChunks)
  );

  attachTraceAttributes(c, {
    'document.id': document.id,
    'document.title': document.title,
    'document.chunk_count': persistedChunks.length,
    'document.mime_type': document.mime_type,
    'resource.has_vectorize': Boolean(c.env?.VECTOR_INDEX),
    'resource.has_openai': Boolean(c.env?.OPENAI_API_KEY)
  });

  recordUsageMetric(c, buildUsageMetric('rag.ingest_document', {
    documentId: document.id,
    scopeType: document.scope_type,
    scopeId: document.scope_id,
    chunkCount: persistedChunks.length,
    inputChars: parsed.text.length,
    inputTokens: estimateTokenCount(parsed.text),
    provider: vector.provider,
    model: vector.indexed ? resolveEmbeddingModel(c.env) : null,
    operation: 'ingest'
  }));

  return {
    ok: true,
    phase: 'phase_2',
    document,
    chunk_count: persistedChunks.length,
    chunks: persistedChunks.map((chunk) => ({
      id: chunk.id,
      chunk_index: chunk.chunk_index,
      char_count: chunk.char_count,
      token_count: chunk.token_count,
      preview: chunk.text_content.slice(0, 160)
    })),
    storage: {
      d1: Boolean(c.env?.DB),
      r2: Boolean(c.env?.DOCUMENTS_BUCKET),
      vectorize: Boolean(c.env?.VECTOR_INDEX),
      vector_sync: vector
    }
  };
}

export async function queryDocuments(
  c: Context<{ Bindings: AppBindings; Variables: AppVariables }>,
  input: RagQueryRequest
): Promise<RagQueryResponse> {
  const repo = createRagRepository(c.env);
  const topK = clampNumber(input.top_k, 1, 20, DEFAULT_TOP_K);

  const retrieval = await withSpan(c, 'retrieve_relevant_chunks', async () =>
    repo.retrieve({
      query: input.query,
      scope_type: input.scope_type,
      scope_id: input.scope_id,
      top_k: topK,
      document_ids: input.document_ids ?? [],
      strategy: input.retrieval?.strategy ?? 'auto'
    })
  );

  const assembledContext = retrieval.hits
    .map((hit, index) => `[#${index + 1}] ${hit.document_title}\n${hit.text_content}`)
    .join('\n\n');

  const generation = await withSpan(c, 'generate_grounded_answer', async () => {
    if (!c.env?.OPENAI_API_KEY) {
      return {
        answer: buildGroundedAnswer(input.query, retrieval.hits),
        provider: c.env?.AI_GATEWAY_BASE_URL ? 'cloudflare-ai-gateway-placeholder' : 'none',
        name: input.model?.name ?? null,
        routed: false,
        reason: c.env?.AI_GATEWAY_BASE_URL
          ? 'AI Gateway base URL configured, but OPENAI_API_KEY is not configured for direct generation'
          : 'OPENAI_API_KEY not configured; returning retrieval-grounded deterministic answer',
        usage: null as null | { inputTokens: number; outputTokens: number }
      };
    }

    if (retrieval.hits.length === 0) {
      return {
        answer: buildGroundedAnswer(input.query, retrieval.hits),
        provider: 'openai',
        name: input.model?.name ?? resolveChatModel(c.env),
        routed: false,
        reason: 'No retrieval hits; returning deterministic no-context response',
        usage: null as null | { inputTokens: number; outputTokens: number }
      };
    }

    const response = await generateGroundedAnswerWithOpenAI({
      apiKey: c.env.OPENAI_API_KEY,
      model: input.model?.name ?? resolveChatModel(c.env),
      query: input.query,
      hits: retrieval.hits
    });

    return {
      answer: response.answer,
      provider: 'openai',
      name: response.model,
      routed: true,
      reason: 'Generated grounded answer with OpenAI using retrieved context',
      usage: response.usage
    };
  });

  const citations = retrieval.hits.map((hit) => ({
    document_id: hit.document_id,
    document_title: hit.document_title,
    chunk_id: hit.chunk_id,
    chunk_index: hit.chunk_index,
    score: hit.score,
    source_uri: hit.source_uri
  }));

  attachTraceAttributes(c, {
    'query.top_k': topK,
    'query.result_count': retrieval.hits.length,
    'retrieval.strategy': retrieval.strategy,
    'resource.has_vectorize': Boolean(c.env?.VECTOR_INDEX),
    'resource.has_openai': Boolean(c.env?.OPENAI_API_KEY),
    'model.routed': generation.routed
  });

  recordUsageMetric(c, buildUsageMetric('rag.query', {
    scopeType: input.scope_type,
    scopeId: input.scope_id,
    inputChars: input.query.length + assembledContext.length,
    inputTokens: generation.usage?.inputTokens ?? estimateTokenCount(input.query + assembledContext),
    outputChars: generation.answer.length,
    outputTokens: generation.usage?.outputTokens ?? estimateTokenCount(generation.answer),
    provider: generation.provider,
    model: generation.name,
    operation: 'query',
    resultCount: retrieval.hits.length
  }));

  return {
    ok: true,
    phase: 'phase_2',
    answer: generation.answer,
    retrieval: {
      strategy: retrieval.strategy,
      provider: retrieval.provider,
      top_k: topK,
      result_count: retrieval.hits.length,
      context_preview: assembledContext.slice(0, 1200)
    },
    citations,
    hits: retrieval.hits,
    model: {
      provider: generation.provider,
      name: generation.name,
      routed: generation.routed,
      reason: generation.reason
    }
  };
}

function normalizeDocumentInput(input: RagIngestRequest): RagParsedContent {
  if (typeof input.content_text === 'string' && input.content_text.trim().length > 0) {
    return {
      text: sanitizeText(input.content_text),
      title: input.title ?? null,
      mimeType: input.mime_type ?? 'text/plain',
      sourceType: input.source_type ?? 'inline_text',
      parser: 'text'
    };
  }

  if (typeof input.content_markdown === 'string' && input.content_markdown.trim().length > 0) {
    const text = markdownToText(input.content_markdown);
    return {
      text,
      title: input.title ?? extractMarkdownTitle(input.content_markdown),
      mimeType: input.mime_type ?? 'text/markdown',
      sourceType: input.source_type ?? 'markdown',
      parser: 'markdown'
    };
  }

  if (typeof input.content_html === 'string' && input.content_html.trim().length > 0) {
    return {
      text: htmlToText(input.content_html),
      title: input.title ?? null,
      mimeType: input.mime_type ?? 'text/html',
      sourceType: input.source_type ?? 'html',
      parser: 'html'
    };
  }

  throw new Error('No supported document body found. Provide content_text, content_markdown, or content_html.');
}

function chunkText(text: string, chunkSize: number, overlap: number): Array<{ text: string; start: number; end: number; keywords: string[] }> {
  const normalized = sanitizeText(text);
  if (!normalized) return [];

  const chunks: Array<{ text: string; start: number; end: number; keywords: string[] }> = [];
  let cursor = 0;

  while (cursor < normalized.length) {
    let end = Math.min(normalized.length, cursor + chunkSize);
    if (end < normalized.length) {
      const boundary = normalized.lastIndexOf('\n', end);
      const sentence = normalized.lastIndexOf('. ', end);
      const preferred = Math.max(boundary, sentence);
      if (preferred > cursor + Math.floor(chunkSize * 0.5)) {
        end = preferred + 1;
      }
    }

    const value = normalized.slice(cursor, end).trim();
    if (value) {
      chunks.push({ text: value, start: cursor, end, keywords: extractKeywords(value) });
    }

    if (end >= normalized.length) break;
    cursor = Math.max(end - overlap, cursor + 1);
  }

  return chunks;
}

function buildR2Key(input: RagIngestRequest, parsed: RagParsedContent): string {
  const safeScopeType = input.scope_type.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeScopeId = input.scope_id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = (input.filename ?? input.title ?? parsed.title ?? 'document').replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${safeScopeType}/${safeScopeId}/${Date.now()}-${filename}`;
}

function buildNamespace(scopeType: string, scopeId: string): string {
  return `${scopeType}:${scopeId}`;
}

function buildGroundedAnswer(query: string, hits: RetrievalHit[]): string {
  if (hits.length === 0) {
    return `No relevant context was found for: "${query}". Try broadening the scope, ingesting source material first, or lowering any document filters.`;
  }

  const lead = hits[0];
  const extra = hits.slice(1, 3).map((hit) => hit.document_title).filter(Boolean);
  const qualifier = extra.length ? ` Additional supporting context came from ${extra.join(', ')}.` : '';
  return `Best match for "${query}": ${lead.text_content.slice(0, 420)}${lead.text_content.length > 420 ? '…' : ''}${qualifier}`;
}

function inferTitleFromText(text: string): string {
  const line = text.split('\n').map((entry) => entry.trim()).find(Boolean);
  return line?.slice(0, 120) || 'Untitled document';
}

function sanitizeText(value: string): string {
  return value.replace(/\r/g, '').replace(/\t/g, ' ').replace(/\u0000/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

function markdownToText(markdown: string): string {
  return sanitizeText(
    markdown
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/[*_~>-]+/g, ' ')
  );
}

function extractMarkdownTitle(markdown: string): string | null {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? null;
}

function htmlToText(html: string): string {
  return sanitizeText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
  );
}

function extractKeywords(text: string): string[] {
  const counts = new Map<string, number>();
  for (const token of text.toLowerCase().match(/[a-z0-9]{4,}/g) ?? []) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([token]) => token);
}

function estimateTokenCount(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function clampNumber(value: number | undefined, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function resolveChatModel(env?: AppBindings): string {
  return env?.OPENAI_CHAT_MODEL?.trim() || DEFAULT_CHAT_MODEL;
}

function resolveEmbeddingModel(env?: AppBindings): string {
  return env?.OPENAI_EMBEDDING_MODEL?.trim() || DEFAULT_EMBEDDING_MODEL;
}

function resolveEmbeddingDimensions(env?: AppBindings): number {
  const raw = env?.OPENAI_EMBEDDING_DIMENSIONS?.trim();
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_EMBEDDING_DIMENSIONS;
}

function buildUsageMetric(
  workflowName: string,
  input: {
    documentId?: string;
    scopeType: string;
    scopeId: string;
    chunkCount?: number;
    inputChars: number;
    inputTokens: number;
    outputChars?: number;
    outputTokens?: number;
    provider: string;
    model?: string | null;
    operation: 'ingest' | 'query';
    resultCount?: number;
  }
): UsageMetric {
  return {
    id: createId('usage'),
    kind: 'rag',
    workflow_name: workflowName,
    provider: input.provider,
    model: input.model ?? null,
    input_tokens: input.inputTokens,
    output_tokens: input.outputTokens ?? 0,
    estimated_cost_usd: 0,
    metadata: {
      document_id: input.documentId ?? null,
      scope_type: input.scopeType,
      scope_id: input.scopeId,
      chunk_count: input.chunkCount ?? 0,
      input_chars: input.inputChars,
      output_chars: input.outputChars ?? 0,
      operation: input.operation,
      result_count: input.resultCount ?? 0
    },
    recorded_at: nowIso()
  };
}

async function createEmbeddings(apiKey: string, input: string[], model: string, dimensions: number): Promise<number[][]> {
  const response = await fetch(OPENAI_EMBEDDINGS_API, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input,
      dimensions
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI embeddings request failed: ${response.status} ${await response.text()}`);
  }

  const json = (await response.json()) as {
    data: Array<{ embedding: number[] }>;
  };

  return json.data.map((entry) => entry.embedding);
}

async function generateGroundedAnswerWithOpenAI(input: {
  apiKey: string;
  model: string;
  query: string;
  hits: RetrievalHit[];
}): Promise<{ answer: string; model: string; usage: { inputTokens: number; outputTokens: number } | null }> {
  const context = input.hits
    .map(
      (hit, index) =>
        `Source ${index + 1}\nTitle: ${hit.document_title}\nChunk: ${hit.chunk_index}\nContent:\n${hit.text_content}`
    )
    .join('\n\n');

  const response = await fetch(OPENAI_RESPONSES_API, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${input.apiKey}`
    },
    body: JSON.stringify({
      model: input.model,
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text:
                'You answer questions using only the supplied retrieved context. Be concise and practical. If the context is insufficient, say so clearly. Do not invent citations or facts.'
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `Question:\n${input.query}\n\nRetrieved context:\n${context}`
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI responses request failed: ${response.status} ${await response.text()}`);
  }

  const json = (await response.json()) as {
    output_text?: string;
    output?: Array<{
      content?: Array<{ type?: string; text?: string }>;
    }>;
    usage?: { input_tokens?: number; output_tokens?: number };
    model?: string;
  };

  const outputText =
    json.output_text ??
    json.output
      ?.flatMap((item) => item.content ?? [])
      .filter((item) => item.type === 'output_text' || typeof item.text === 'string')
      .map((item) => item.text ?? '')
      .join('\n') ??
    '';

  const answer = sanitizeText(outputText || 'No answer returned by model.');
  return {
    answer,
    model: json.model ?? input.model,
    usage: json.usage
      ? {
          inputTokens: json.usage.input_tokens ?? 0,
          outputTokens: json.usage.output_tokens ?? 0
        }
      : null
  };
}

async function upsertVectors(
  index: VectorizeIndex,
  vectors: Array<{
    id: string;
    values: number[];
    metadata: Record<string, unknown>;
  }>,
  namespace: string
): Promise<void> {
  await (index as unknown as { upsert: (items: unknown[], options?: { namespace?: string }) => Promise<unknown> }).upsert(
    vectors,
    { namespace }
  );
}

async function queryVectors(
  index: VectorizeIndex,
  embedding: number[],
  topK: number,
  namespace: string
): Promise<Array<{ id: string; score?: number; metadata?: Record<string, unknown> }>> {
  const result = await (
    index as unknown as {
      query: (
        vector: number[],
        options?: { topK?: number; namespace?: string; returnMetadata?: 'all' | boolean; returnValues?: boolean }
      ) => Promise<{ matches?: Array<{ id: string; score?: number; metadata?: Record<string, unknown> }> }>;
    }
  ).query(embedding, {
    topK,
    namespace,
    returnMetadata: 'all',
    returnValues: false
  });

  return result.matches ?? [];
}

class MemoryRagRepository implements RagRepository {
  private documents: RagDocumentRecord[] = [];
  private chunks: RagChunkRecord[] = [];

  async createDocument(input: Partial<RagDocumentRecord>): Promise<RagDocumentRecord> {
    const record: RagDocumentRecord = {
      id: input.id ?? createId('document'),
      scope_type: input.scope_type ?? 'unknown',
      scope_id: input.scope_id ?? 'unknown',
      title: input.title ?? 'Untitled document',
      source_type: input.source_type ?? 'inline_text',
      source_uri: input.source_uri ?? null,
      r2_key: input.r2_key ?? `memory/${createId('blob')}`,
      mime_type: input.mime_type ?? 'text/plain',
      content_text: input.content_text ?? '',
      metadata_json: input.metadata_json ?? null,
      created_at: input.created_at ?? nowIso(),
      updated_at: input.updated_at ?? nowIso()
    };
    this.documents = [record, ...this.documents.filter((document) => document.id !== record.id)];
    return record;
  }

  async replaceDocumentChunks(documentId: string, chunks: RagChunkRecord[]): Promise<RagChunkRecord[]> {
    this.chunks = [...this.chunks.filter((chunk) => chunk.document_id !== documentId), ...chunks];
    return this.listDocumentChunks(documentId);
  }

  async listDocumentChunks(documentId: string): Promise<RagChunkRecord[]> {
    return this.chunks.filter((chunk) => chunk.document_id === documentId).sort((a, b) => a.chunk_index - b.chunk_index);
  }

  async retrieve(input: {
    query: string;
    scope_type: string;
    scope_id: string;
    top_k: number;
    document_ids?: string[];
    strategy?: string;
  }): Promise<{ strategy: string; provider: string; hits: RetrievalHit[] }> {
    const documents = this.documents.filter(
      (document) =>
        document.scope_type === input.scope_type &&
        document.scope_id === input.scope_id &&
        (!input.document_ids?.length || input.document_ids.includes(document.id))
    );
    const hits = rankChunks(this.chunks, documents, input.query, input.top_k);
    return { strategy: 'd1-keyword-fallback', provider: 'memory-keyword-search', hits };
  }
}

class D1RagRepository implements RagRepository {
  constructor(
    private readonly db: D1Database,
    private readonly bucket?: R2Bucket,
    private readonly vectorIndex?: VectorizeIndex,
    private readonly openAiApiKey?: string
  ) {}

  async createDocument(input: Partial<RagDocumentRecord>): Promise<RagDocumentRecord> {
    const record: RagDocumentRecord = {
      id: input.id ?? createId('document'),
      scope_type: input.scope_type ?? 'unknown',
      scope_id: input.scope_id ?? 'unknown',
      title: input.title ?? 'Untitled document',
      source_type: input.source_type ?? 'inline_text',
      source_uri: input.source_uri ?? null,
      r2_key: input.r2_key ?? createId('r2'),
      mime_type: input.mime_type ?? 'text/plain',
      content_text: input.content_text ?? '',
      metadata_json: input.metadata_json ?? null,
      created_at: input.created_at ?? nowIso(),
      updated_at: input.updated_at ?? nowIso()
    };

    await this.db
      .prepare(`INSERT OR REPLACE INTO documents (id, scope_type, scope_id, title, source_type, source_uri, r2_key, mime_type, content_text, metadata_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        record.id,
        record.scope_type,
        record.scope_id,
        record.title,
        record.source_type,
        record.source_uri,
        record.r2_key,
        record.mime_type,
        record.content_text,
        record.metadata_json,
        record.created_at,
        record.updated_at
      )
      .run();

    if (this.bucket) {
      await this.bucket.put(record.r2_key, record.content_text, {
        httpMetadata: { contentType: record.mime_type ?? 'text/plain' },
        customMetadata: {
          document_id: record.id,
          scope_type: record.scope_type,
          scope_id: record.scope_id,
          source_type: record.source_type
        }
      });
    }

    return record;
  }

  async replaceDocumentChunks(documentId: string, chunks: RagChunkRecord[]): Promise<RagChunkRecord[]> {
    await this.db.prepare('DELETE FROM document_chunks WHERE document_id = ?').bind(documentId).run();
    for (const chunk of chunks) {
      await this.db
        .prepare(`INSERT INTO document_chunks (id, document_id, chunk_index, text_content, vector_id, token_count, char_count, start_offset, end_offset, metadata_json, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(
          chunk.id,
          chunk.document_id,
          chunk.chunk_index,
          chunk.text_content,
          chunk.vector_id,
          chunk.token_count,
          chunk.char_count,
          chunk.start_offset,
          chunk.end_offset,
          chunk.metadata_json,
          chunk.created_at,
          chunk.updated_at
        )
        .run();
    }

    return this.listDocumentChunks(documentId);
  }

  async listDocumentChunks(documentId: string): Promise<RagChunkRecord[]> {
    const result = await this.db
      .prepare('SELECT * FROM document_chunks WHERE document_id = ? ORDER BY chunk_index ASC')
      .bind(documentId)
      .all<RagChunkRecord>();
    return result.results ?? [];
  }

  async retrieve(input: {
    query: string;
    scope_type: string;
    scope_id: string;
    top_k: number;
    document_ids?: string[];
    strategy?: string;
  }): Promise<{ strategy: string; provider: string; hits: RetrievalHit[] }> {
    if (this.vectorIndex && this.openAiApiKey && (input.strategy === 'auto' || input.strategy === 'vector')) {
      const hits = await this.retrieveByVector(input);
      if (hits.length > 0 || input.strategy === 'vector') {
        return {
          strategy: 'openai-vectorize',
          provider: 'openai+cloudflare-vectorize',
          hits
        };
      }
    }

    return {
      strategy: 'd1-keyword-fallback',
      provider: 'd1-like-search',
      hits: await this.retrieveByKeyword(input)
    };
  }

  private async retrieveByVector(input: {
    query: string;
    scope_type: string;
    scope_id: string;
    top_k: number;
    document_ids?: string[];
  }): Promise<RetrievalHit[]> {
    if (!this.vectorIndex || !this.openAiApiKey) return [];

    const [embedding] = await createEmbeddings(
      this.openAiApiKey,
      [input.query],
      resolveEmbeddingModel(),
      resolveEmbeddingDimensions()
    );
    const matches = await queryVectors(
      this.vectorIndex,
      embedding,
      input.top_k,
      buildNamespace(input.scope_type, input.scope_id)
    );

    return matches
      .map((match) => {
        const metadata = match.metadata ?? {};
        return {
          document_id: String(metadata.document_id ?? ''),
          document_title: String(metadata.document_title ?? 'Untitled document'),
          chunk_id: String(metadata.chunk_id ?? match.id),
          chunk_index: Number(metadata.chunk_index ?? 0),
          text_content: String(metadata.text_content ?? ''),
          score: Number(match.score ?? 0),
          source_uri: metadata.source_uri ? String(metadata.source_uri) : null,
          vector_id: match.id,
          token_count: estimateTokenCount(String(metadata.text_content ?? '')),
          char_count: String(metadata.text_content ?? '').length
        } satisfies RetrievalHit;
      })
      .filter(
        (hit) =>
          hit.document_id &&
          hit.text_content &&
          (!input.document_ids?.length || input.document_ids.includes(hit.document_id))
      )
      .sort((a, b) => b.score - a.score || a.chunk_index - b.chunk_index)
      .slice(0, input.top_k);
  }

  private async retrieveByKeyword(input: {
    query: string;
    scope_type: string;
    scope_id: string;
    top_k: number;
    document_ids?: string[];
  }): Promise<RetrievalHit[]> {
    const result = await this.db
      .prepare(`SELECT dc.*, d.title AS document_title, d.source_uri AS source_uri
        FROM document_chunks dc
        INNER JOIN documents d ON d.id = dc.document_id
        WHERE d.scope_type = ? AND d.scope_id = ?
        ORDER BY dc.chunk_index ASC`)
      .bind(input.scope_type, input.scope_id)
      .all<RagChunkRecord & { document_title: string; source_uri: string | null }>();

    const rows = (result.results ?? []).filter(
      (row) => !input.document_ids?.length || input.document_ids.includes(row.document_id)
    );

    const docs = rows.map((row) => ({
      ...row,
      document_title: row.document_title,
      source_uri: row.source_uri
    }));

    return rankRows(docs, input.query, input.top_k);
  }
}

let sharedMemoryRagRepository: MemoryRagRepository | undefined;

function getMemoryRagRepository(): MemoryRagRepository {
  sharedMemoryRagRepository ??= new MemoryRagRepository();
  return sharedMemoryRagRepository;
}

function rankChunks(
  chunks: RagChunkRecord[],
  documents: RagDocumentRecord[],
  query: string,
  topK: number
): RetrievalHit[] {
  const docMap = new Map(documents.map((document) => [document.id, document]));
  return chunks
    .filter((chunk) => docMap.has(chunk.document_id))
    .map((chunk) => toHit(chunk, docMap.get(chunk.document_id)!, scoreText(query, chunk.text_content)))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.chunk_index - b.chunk_index)
    .slice(0, topK);
}

function rankRows(
  rows: Array<RagChunkRecord & { document_title: string; source_uri: string | null }>,
  query: string,
  topK: number
): RetrievalHit[] {
  return rows
    .map((row) => ({
      document_id: row.document_id,
      document_title: row.document_title,
      chunk_id: row.id,
      chunk_index: row.chunk_index,
      text_content: row.text_content,
      score: scoreText(query, row.text_content),
      source_uri: row.source_uri,
      vector_id: row.vector_id,
      token_count: row.token_count,
      char_count: row.char_count
    }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.chunk_index - b.chunk_index)
    .slice(0, topK);
}

function toHit(chunk: RagChunkRecord, document: RagDocumentRecord, score: number): RetrievalHit {
  return {
    document_id: document.id,
    document_title: document.title,
    chunk_id: chunk.id,
    chunk_index: chunk.chunk_index,
    text_content: chunk.text_content,
    score,
    source_uri: document.source_uri,
    vector_id: chunk.vector_id,
    token_count: chunk.token_count,
    char_count: chunk.char_count
  };
}

function scoreText(query: string, text: string): number {
  const tokens = new Set((query.toLowerCase().match(/[a-z0-9]{2,}/g) ?? []).filter((token) => token.length > 1));
  if (tokens.size === 0) return 0;
  const haystack = text.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) score += token.length;
  }
  return score;
}
