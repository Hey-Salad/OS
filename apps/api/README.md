# @heysalad-os/api

Cloudflare Worker control plane for HeySalad OS.

Production split:
- Frontend: `https://cloud-os.heysalad.app`
- Backend API: `https://api-cloud-os.heysalad.app`

## What’s live now

### Foundation

- Cloudflare Worker scaffold using Hono
- D1 migration for the core operational schema
- CRUD foundation for offices, employees, projects, and tasks
- Route manifest covering foundation + later workflow routes
- Trace helper that emits trace envelopes and can forward them to Anyway
- Seed format for initial office imports

### Phase 2 RAG foundations

- `POST /api/rag/ingest` now accepts inline text, markdown, or HTML
- Document parsing + normalization helpers
- Chunking with configurable size / overlap
- D1 persistence for `documents` and `document_chunks`
- Optional raw text persistence to R2 when `DOCUMENTS_BUCKET` is bound
- Retrieval abstraction with:
  - in-memory fallback for tests/local runs without D1
  - D1 keyword retrieval fallback for real runtime
  - Vectorize-ready placeholder branch when `VECTOR_INDEX` is present
- Anyway-oriented trace/usage hooks for ingest/query workflows
- Deterministic retrieval-grounded query response shape while AI Gateway / model routing is still being wired

## Routes

### Live now

- `GET /health`
- `GET /api`
- `GET /api/offices`
- `POST /api/offices`
- `GET /api/employees`
- `POST /api/employees`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/tasks`
- `POST /api/tasks`
- `POST /api/rag/ingest`
- `POST /api/rag/query`

### Reserved for later phases

- `POST /api/employees/:id/run`
- `POST /api/tasks/:id/execute`
- `POST /api/tasks/:id/status`
- `POST /api/workflows/run`

## Ingest request shape

```json
{
  "scope_type": "project",
  "scope_id": "project_alpha",
  "title": "Product notes",
  "source_type": "markdown",
  "source_uri": "https://example.com/notes",
  "content_markdown": "# Product notes\n\nCloudflare-first RAG plan...",
  "chunking": {
    "max_chars": 900,
    "overlap_chars": 120
  },
  "metadata": {
    "owner": "ops"
  }
}
```

Accepted bodies today:

- `content_text`
- `content_markdown`
- `content_html`

## Query request shape

```json
{
  "scope_type": "project",
  "scope_id": "project_alpha",
  "query": "Where do raw documents live?",
  "top_k": 5,
  "retrieval": {
    "strategy": "auto"
  },
  "model": {
    "name": "gpt-4.1-mini"
  }
}
```

## Local development

```bash
npm install
npm run dev
npm run test
npm run typecheck
```

## D1 migrations

Create a D1 database and add the binding name used by `wrangler.jsonc`:

```bash
npx wrangler d1 create heysalad-os
npx wrangler d1 migrations apply DB --local
npx wrangler d1 migrations apply DB --remote
```

## Suggested resource bindings

- `DB` → D1
- `DOCUMENTS_BUCKET` → R2 bucket
- `VECTOR_INDEX` → Vectorize index
- `ANYWAY_BASE_URL`, `ANYWAY_API_KEY`, `ANYWAY_DATASET`, `ANYWAY_ENVIRONMENT` → observability config
- `AI_GATEWAY_BASE_URL` → Cloudflare AI Gateway base URL for future model traffic

## What still needs wiring for full Cloudflare RAG

- Choose and route an embeddings model via AI Gateway (or another supported path)
- Write embeddings + metadata into Vectorize during ingest
- Query Vectorize during retrieval instead of the current D1 keyword fallback
- Swap deterministic answer assembly for actual generation through AI Gateway
- Decide whether large/binary ingestion should accept file uploads / signed R2 flows instead of inline payloads
- Add D1 FTS or richer ranking if keyword fallback needs to be stronger before semantic search is enabled

## Assumptions

- D1 remains the operational source of truth.
- Missing Anyway config must never break the API.
- Missing R2 / Vectorize bindings should degrade gracefully.
- Inline textual ingestion is enough for Phase 2 foundations; PDF/Doc parsing can come later.
- Tests run without D1 by using an in-memory repository so the Worker contract stays fast to iterate on.
