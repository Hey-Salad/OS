export type RouteMethod = 'GET' | 'POST';

export interface RouteManifestEntry {
  method: RouteMethod;
  path: string;
  description: string;
  phase: 'foundation' | 'phase_2';
}

export interface AppBindings {
  DB?: D1Database;
  DOCUMENTS_BUCKET?: R2Bucket;
  VECTOR_INDEX?: VectorizeIndex;
  AI_GATEWAY_BASE_URL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_CHAT_MODEL?: string;
  OPENAI_EMBEDDING_MODEL?: string;
  OPENAI_EMBEDDING_DIMENSIONS?: string;
  ANYWAY_BASE_URL?: string;
  ANYWAY_API_KEY?: string;
  ANYWAY_DATASET?: string;
  ANYWAY_ENVIRONMENT?: string;
}

export interface AppVariables {
  trace: TraceContext;
  traceEvents: TraceEvent[];
  usageMetrics: UsageMetric[];
}

export interface EntityBase {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface OfficeRecord extends EntityBase {
  name: string;
  city: string | null;
  country: string;
  country_code: string | null;
  flag: string | null;
  lat: number | null;
  lng: number | null;
  office_type: string;
  provider: string | null;
  region_code: string | null;
  active: number;
}

export interface EmployeeRecord extends EntityBase {
  name: string;
  title: string | null;
  team_id: string | null;
  office_id: string | null;
  status: string;
  model_provider: string | null;
  model_name: string | null;
  budget_daily_usd: number;
  budget_monthly_usd: number;
  persona_json: string | null;
  capabilities_json: string | null;
  active: number;
}

export interface ProjectRecord extends EntityBase {
  name: string;
  description: string | null;
  status: string;
  owner_employee_id: string | null;
  budget_total_usd: number;
  budget_monthly_usd: number;
}

export interface TaskRecord extends EntityBase {
  project_id: string | null;
  assigned_employee_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  blocked_reason: string | null;
  due_at: string | null;
}

export interface RagDocumentRecord extends EntityBase {
  scope_type: string;
  scope_id: string;
  title: string;
  source_type: string;
  source_uri: string | null;
  r2_key: string;
  mime_type: string | null;
  content_text: string;
  metadata_json: string | null;
}

export interface RagChunkRecord extends EntityBase {
  document_id: string;
  chunk_index: number;
  text_content: string;
  vector_id: string | null;
  token_count: number | null;
  char_count: number;
  start_offset: number;
  end_offset: number;
  metadata_json: string | null;
}

export interface RetrievalHit {
  document_id: string;
  document_title: string;
  chunk_id: string;
  chunk_index: number;
  text_content: string;
  score: number;
  source_uri: string | null;
  vector_id: string | null;
  token_count: number | null;
  char_count: number;
}

export interface RagIngestRequest {
  document_id?: string;
  scope_type: string;
  scope_id: string;
  title?: string;
  source_type?: string;
  source_uri?: string;
  filename?: string;
  mime_type?: string;
  metadata?: Record<string, unknown>;
  content_text?: string;
  content_markdown?: string;
  content_html?: string;
  chunking?: {
    max_chars?: number;
    overlap_chars?: number;
  };
}

export interface RagQueryRequest {
  query: string;
  scope_type: string;
  scope_id: string;
  top_k?: number;
  document_ids?: string[];
  retrieval?: {
    strategy?: 'auto' | 'vector' | 'keyword';
  };
  model?: {
    name?: string;
  };
}

export interface RagIngestResponse {
  ok: true;
  phase: 'phase_2';
  document: RagDocumentRecord;
  chunk_count: number;
  chunks: Array<{
    id: string;
    chunk_index: number;
    char_count: number;
    token_count: number | null;
    preview: string;
  }>;
  storage: {
    d1: boolean;
    r2: boolean;
    vectorize: boolean;
    vector_sync: {
      indexed: boolean;
      provider: string;
      reason: string;
    };
  };
}

export interface RagQueryResponse {
  ok: true;
  phase: 'phase_2';
  answer: string;
  retrieval: {
    strategy: string;
    provider: string;
    top_k: number;
    result_count: number;
    context_preview: string;
  };
  citations: Array<{
    document_id: string;
    document_title: string;
    chunk_id: string;
    chunk_index: number;
    score: number;
    source_uri: string | null;
  }>;
  hits: RetrievalHit[];
  model: {
    provider: string;
    name: string | null;
    routed: boolean;
    reason: string;
  };
}

export interface RagParsedContent {
  text: string;
  title: string | null;
  mimeType: string;
  sourceType: string;
  parser: 'text' | 'markdown' | 'html';
}

export interface TraceContext {
  traceId: string;
  workflowName: string;
  startedAt: string;
  attributes: Record<string, string | number | boolean | null | undefined>;
}

export interface TraceEvent {
  name: string;
  startedAt: string;
  endedAt?: string;
  attributes?: Record<string, string | number | boolean | null | undefined>;
  status?: 'ok' | 'error';
  error?: string;
}

export interface UsageMetric {
  id: string;
  kind: 'rag' | 'workflow' | 'model';
  workflow_name: string;
  provider: string | null;
  model: string | null;
  input_tokens: number;
  output_tokens: number;
  estimated_cost_usd: number;
  metadata: Record<string, unknown>;
  recorded_at: string;
}

export interface TraceEnvelope {
  trace: TraceContext;
  spans: TraceEvent[];
  usage: UsageMetric[];
  finishedAt: string;
  durationMs: number;
}

export interface EntityRepository {
  listOffices(): Promise<OfficeRecord[]>;
  createOffice(input: Partial<OfficeRecord>): Promise<OfficeRecord>;
  listEmployees(): Promise<EmployeeRecord[]>;
  createEmployee(input: Partial<EmployeeRecord>): Promise<EmployeeRecord>;
  listProjects(): Promise<ProjectRecord[]>;
  createProject(input: Partial<ProjectRecord>): Promise<ProjectRecord>;
  listTasks(): Promise<TaskRecord[]>;
  createTask(input: Partial<TaskRecord>): Promise<TaskRecord>;
}

export interface RagRepository {
  createDocument(input: Partial<RagDocumentRecord>): Promise<RagDocumentRecord>;
  replaceDocumentChunks(documentId: string, chunks: RagChunkRecord[]): Promise<RagChunkRecord[]>;
  listDocumentChunks(documentId: string): Promise<RagChunkRecord[]>;
  retrieve(input: {
    query: string;
    scope_type: string;
    scope_id: string;
    top_k: number;
    document_ids?: string[];
    strategy?: string;
  }): Promise<{ strategy: string; provider: string; hits: RetrievalHit[] }>;
}
