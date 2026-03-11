import { Hono } from 'hono';
import { attachTraceAttributes, withSpan } from '../lib/trace';
import { createRuntimeRepository } from '../lib/runtime';
import type { AppBindings, AppVariables } from '../types';

export function createRuntimeRoutes() {
  const app = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();

  app.get('/api/runtime', async (c) => {
    const repo = createRuntimeRepository(c.env?.DB);
    const dashboard = await withSpan(c, 'get_runtime_dashboard', () => repo.getDashboard());
    return c.json(dashboard);
  });

  app.get('/api/missions', async (c) => {
    const repo = createRuntimeRepository(c.env?.DB);
    return c.json(await withSpan(c, 'list_missions', () => repo.listMissions()));
  });

  app.get('/api/missions/:id', async (c) => {
    const repo = createRuntimeRepository(c.env?.DB);
    const mission = await withSpan(c, 'get_mission', () => repo.getMission(c.req.param('id')));
    return mission ? c.json(mission) : c.json({ ok: false, message: 'Mission not found' }, 404);
  });

  app.get('/api/agents', async (c) => {
    const repo = createRuntimeRepository(c.env?.DB);
    return c.json(await withSpan(c, 'list_runtime_agents', () => repo.listAgents()));
  });

  app.get('/api/agents/:id', async (c) => {
    const repo = createRuntimeRepository(c.env?.DB);
    const agent = await withSpan(c, 'get_runtime_agent', () => repo.getAgent(c.req.param('id')));
    return agent ? c.json(agent) : c.json({ ok: false, message: 'Agent not found' }, 404);
  });

  app.get('/api/sessions', async (c) => {
    const repo = createRuntimeRepository(c.env?.DB);
    return c.json(await withSpan(c, 'list_runtime_sessions', () => repo.listSessions()));
  });

  app.get('/api/approvals', async (c) => {
    const repo = createRuntimeRepository(c.env?.DB);
    const status = c.req.query('status') || undefined;
    return c.json(await withSpan(c, 'list_runtime_approvals', () => repo.listApprovals(status)));
  });

  app.post('/api/approvals/:id/decision', async (c) => {
    const payload = await c.req.json().catch(() => ({})) as { decision?: 'approved' | 'rejected'; note?: string; requestedBy?: string };
    if (payload.decision !== 'approved' && payload.decision !== 'rejected') {
      return c.json({ ok: false, message: 'decision must be approved or rejected' }, 400);
    }
    const repo = createRuntimeRepository(c.env?.DB);
    const item = await withSpan(c, 'queue_approval_decision', () => repo.queueApprovalDecision({ approvalId: c.req.param('id'), decision: payload.decision!, note: payload.note, requestedBy: payload.requestedBy }));
    attachTraceAttributes(c, { 'approval.id': c.req.param('id'), 'approval.decision': payload.decision });
    return c.json({ ok: true, queued: item }, 202);
  });

  app.get('/api/activity', async (c) => {
    const repo = createRuntimeRepository(c.env?.DB);
    const limit = Math.min(500, Math.max(1, Number(c.req.query('limit') ?? 100)));
    return c.json(await withSpan(c, 'list_activity_events', () => repo.listActivity(limit)));
  });

  app.post('/api/openclaw/sync', async (c) => {
    const payload = await c.req.json().catch(() => ({}));
    const repo = createRuntimeRepository(c.env?.DB);
    const result = await withSpan(c, 'sync_openclaw_snapshot', () => repo.syncOpenClaw(payload));
    attachTraceAttributes(c, { 'sync.agent_count': result.counts.agents, 'sync.approval_count': result.counts.approvals, 'sync.session_count': result.counts.sessions });
    return c.json(result, 202);
  });

  app.get('/api/openclaw/pending-decisions', async (c) => {
    const repo = createRuntimeRepository(c.env?.DB);
    return c.json(await withSpan(c, 'list_pending_approval_decisions', () => repo.listPendingApprovalDecisions()));
  });

  app.post('/api/openclaw/pending-decisions/:id/dispatched', async (c) => {
    const payload = await c.req.json().catch(() => ({})) as { status?: 'sent' | 'failed'; error?: string | null };
    if (payload.status !== 'sent' && payload.status !== 'failed') {
      return c.json({ ok: false, message: 'status must be sent or failed' }, 400);
    }
    const repo = createRuntimeRepository(c.env?.DB);
    await withSpan(c, 'mark_approval_decision_dispatched', () => repo.markApprovalDecisionDispatched(c.req.param('id'), payload.status!, payload.error ?? null));
    return c.json({ ok: true });
  });

  return app;
}
