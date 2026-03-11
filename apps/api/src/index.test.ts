import { describe, expect, it } from 'vitest';
import app from './index';

describe('heysalad os api', () => {
  it('returns health and a trace header', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(res.headers.get('x-heysalad-trace-id')).toContain('trace_');
    await expect(res.json()).resolves.toMatchObject({ ok: true, phase: 'foundation' });
  });

  it('returns the route manifest and binding capabilities', async () => {
    const res = await app.request('/api');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { routes: Array<{ path: string }> };
    expect(body.routes.some((entry) => entry.path === '/api/offices')).toBe(true);
    expect(body.routes.some((entry) => entry.path === '/api/rag/query')).toBe(true);
  });

  it('creates and lists foundation entities without D1 during tests', async () => {
    const officeRes = await app.request('/api/offices', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'London Edge', country: 'United Kingdom', office_type: 'edge_location' })
    });
    expect(officeRes.status).toBe(201);

    const employeeRes = await app.request('/api/employees', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Miso', title: 'Cloud Operator', model_provider: 'openai', model_name: 'gpt-5-mini' })
    });
    expect(employeeRes.status).toBe(201);

    const projectRes = await app.request('/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Anyway Foundation', status: 'active' })
    });
    expect(projectRes.status).toBe(201);

    const taskRes = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Ship phase 1 worker foundation', status: 'ready' })
    });
    expect(taskRes.status).toBe(201);

    const offices = await app.request('/api/offices');
    const employees = await app.request('/api/employees');
    const projects = await app.request('/api/projects');
    const tasks = await app.request('/api/tasks');

    expect((await offices.json()) as Array<unknown>).toHaveLength(1);
    expect((await employees.json()) as Array<unknown>).toHaveLength(1);
    expect((await projects.json()) as Array<unknown>).toHaveLength(1);
    expect((await tasks.json()) as Array<unknown>).toHaveLength(1);
  });

  it('ingests a document into the phase 2 rag foundation with chunking and trace usage headers', async () => {
    const res = await app.request('/api/rag/ingest', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        scope_type: 'project',
        scope_id: 'project_alpha',
        title: 'HeySalad OS RAG Notes',
        source_type: 'markdown',
        content_markdown:
          '# HeySalad OS\n\nHeySalad OS uses D1 for operational truth and can later add Vectorize retrieval.\n\nAnyway traces should wrap ingestion and query flows.\n\nThis extra paragraph makes the payload long enough to exercise multi-chunk ingestion in tests without relying on provider bindings.\n\nThe phase two contract should stay deterministic and easy to run locally.',
        chunking: { max_chars: 80, overlap_chars: 10 }
      })
    });

    expect(res.status).toBe(201);
    expect(res.headers.get('x-heysalad-usage-events')).toBe('1');
    const body = (await res.json()) as { chunk_count: number; phase: string; storage: { vector_sync: { indexed: boolean } } };
    expect(body.phase).toBe('phase_2');
    expect(body.chunk_count).toBeGreaterThan(1);
    expect(body.storage.vector_sync.indexed).toBe(false);
  });

  it('queries ingested documents through the retrieval fallback when vector resources are absent', async () => {
    await app.request('/api/rag/ingest', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        scope_type: 'project',
        scope_id: 'project_search',
        title: 'Cloudflare Plan',
        content_text:
          'Cloudflare D1 stores metadata. Cloudflare R2 stores raw documents. Cloudflare Vectorize is planned for semantic retrieval.'
      })
    });

    const res = await app.request('/api/rag/query', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        scope_type: 'project',
        scope_id: 'project_search',
        query: 'Where are raw documents stored?',
        top_k: 3
      })
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('x-heysalad-usage-events')).toBe('1');
    const body = (await res.json()) as {
      answer: string;
      retrieval: { provider: string; result_count: number };
      citations: Array<{ document_title: string }>;
      model: { routed: boolean };
    };
    expect(body.answer.toLowerCase()).toContain('r2');
    expect(body.retrieval.result_count).toBeGreaterThan(0);
    expect(body.retrieval.provider).toContain('search');
    expect(body.citations[0]?.document_title).toBe('Cloudflare Plan');
    expect(body.model.routed).toBe(false);
  });

  it('syncs an OpenClaw runtime snapshot and queues approval decisions', async () => {
    const sync = await app.request('/api/openclaw/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        missions: [{ id: 'mission-os', name: 'HeySalad OS Launch', objective: 'Ship today', status: 'healthy', progress: 72 }],
        agents: [{ id: 'agent-julia', name: 'Julia', role: 'Operator', status: 'active', missionId: 'mission-os', skills: ['github', 'rag'] }],
        sessions: [{ sessionKey: 'session-1', agentId: 'agent-julia', title: 'Backend sprint', state: 'running', channel: 'webchat' }],
        approvals: [{ id: 'approval-1', missionId: 'mission-os', agentId: 'agent-julia', title: 'Deploy backend', summary: 'Ship runtime backend', risk: 'high', status: 'pending' }],
        activity: [{ id: 'event-1', missionId: 'mission-os', agentId: 'agent-julia', type: 'operator', title: 'Sprint started', detail: 'Backend implementation underway' }]
      })
    });

    expect(sync.status).toBe(202);

    const runtime = await app.request('/api/runtime');
    expect(runtime.status).toBe(200);
    await expect(runtime.json()).resolves.toMatchObject({
      counts: { missions: 1, agents: 1, sessions: 1, approvals_pending: 1 },
      status: { active_agents: 1, approval_backlog: 1, running_sessions: 1 }
    });

    const decision = await app.request('/api/approvals/approval-1/decision', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decision: 'approved', note: 'Ship it' })
    });
    expect(decision.status).toBe(202);

    const pending = await app.request('/api/openclaw/pending-decisions');
    const pendingBody = (await pending.json()) as Array<{ approval_id: string; decision: string }>;
    expect(pendingBody[0]?.approval_id).toBe('approval-1');
    expect(pendingBody[0]?.decision).toBe('approved');
  });
});
