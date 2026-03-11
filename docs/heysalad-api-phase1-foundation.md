# HeySalad OS API Phase 1 Foundation

This note captures the implementation assumptions behind the first Cloudflare Worker foundation pass.

## What was intentionally built now

- A single Worker app in `apps/api`
- D1-first schema migration matching the architecture spec
- Create/list endpoints for offices, employees, projects, and tasks
- Explicit route manifest for the next public API surface
- Trace middleware + span helper + optional Anyway forwarding

## What was intentionally deferred

- Actual RAG ingestion/query execution
- AI Gateway model calls
- Budget enforcement
- Task event persistence and workflow run writes from live execution
- Bootstrap import endpoints

## Assumptions

1. Phase 1 should be deployable before all Cloudflare resources exist, so routes that need future infrastructure are reserved but non-operational.
2. Anyway integration should be non-fatal: telemetry failures must not break the control plane.
3. CRUD tests should not require a live D1 instance, so in-memory fallback is only for local/test execution paths.
4. Existing frontend behavior should remain untouched; this work only extends the API app.

## Next build steps

1. Wire real `wrangler` resource IDs and secrets.
2. Apply the D1 migration locally/remotely.
3. Add bootstrap import endpoints for office/employee/project seeds.
4. Implement R2 upload + text extraction + chunk persistence for `POST /api/rag/ingest`.
5. Implement Vectorize retrieval + AI Gateway completion + D1 usage summary writes for `POST /api/rag/query`.
6. Add workflow run persistence and task event writes for execution/status routes.
