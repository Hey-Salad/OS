import { Hono } from 'hono';
import { ingestDocument, queryDocuments } from '../lib/rag';
import { attachTraceAttributes, withSpan } from '../lib/trace';
import type { AppBindings, AppVariables, RagIngestRequest, RagQueryRequest } from '../types';

export function createRagRoutes() {
  const app = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();

  app.post('/api/rag/ingest', async (c) => {
    const payload = (await c.req.json().catch(() => ({}))) as Partial<RagIngestRequest>;
    await withSpan(c, 'validate_ingest_request', async () => payload);
    attachTraceAttributes(c, {
      'workflow.name': 'rag.ingest_document',
      'document.scope_type': typeof payload.scope_type === 'string' ? payload.scope_type : null,
      'document.scope_id': typeof payload.scope_id === 'string' ? payload.scope_id : null
    });

    if (!payload.scope_type || !payload.scope_id) {
      return c.json(
        { ok: false, status: 'invalid_request', message: 'scope_type and scope_id are required for ingestion.' },
        400
      );
    }

    try {
      const response = await ingestDocument(c, payload as RagIngestRequest);
      return c.json(response, 201);
    } catch (error) {
      return c.json(
        {
          ok: false,
          status: 'ingest_failed',
          message: error instanceof Error ? error.message : String(error)
        },
        400
      );
    }
  });

  app.post('/api/rag/query', async (c) => {
    const payload = (await c.req.json().catch(() => ({}))) as Partial<RagQueryRequest>;
    await withSpan(c, 'accept_rag_query', async () => payload);
    attachTraceAttributes(c, {
      'workflow.name': 'rag.query',
      'query.scope_type': typeof payload.scope_type === 'string' ? payload.scope_type : null,
      'query.scope_id': typeof payload.scope_id === 'string' ? payload.scope_id : null
    });

    if (!payload.query || !payload.scope_type || !payload.scope_id) {
      return c.json(
        { ok: false, status: 'invalid_request', message: 'query, scope_type, and scope_id are required.' },
        400
      );
    }

    try {
      const response = await queryDocuments(c, payload as RagQueryRequest);
      return c.json(response);
    } catch (error) {
      return c.json(
        {
          ok: false,
          status: 'query_failed',
          message: error instanceof Error ? error.message : String(error)
        },
        400
      );
    }
  });

  return app;
}
