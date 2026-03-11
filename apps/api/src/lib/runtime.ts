import { createId, nowIso } from './ids';

export type RuntimeAgentStatus = 'active' | 'idle' | 'approvals' | 'degraded' | 'offline';
export type RuntimeSessionState = 'running' | 'queued' | 'completed' | 'attention';
export type ApprovalRisk = 'low' | 'medium' | 'high';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface RuntimeMission {
  id: string;
  name: string;
  objective: string | null;
  status: string;
  operator_name: string | null;
  progress: number;
  metadata_json: string | null;
  created_at: string;
  updated_at: string;
}

export interface RuntimeAgent {
  id: string;
  name: string;
  role: string | null;
  owner: string | null;
  status: RuntimeAgentStatus;
  mission_id: string | null;
  current_session_id: string | null;
  skills_json: string | null;
  throughput: number;
  backlog: number;
  last_heartbeat_at: string | null;
  source: string;
  metadata_json: string | null;
  created_at: string;
  updated_at: string;
}

export interface RuntimeSession {
  id: string;
  agent_id: string | null;
  title: string | null;
  state: RuntimeSessionState;
  channel: string | null;
  peer_label: string | null;
  started_at: string | null;
  updated_at: string;
  metadata_json: string | null;
}

export interface RuntimeApproval {
  id: string;
  mission_id: string | null;
  agent_id: string | null;
  title: string;
  summary: string | null;
  risk: ApprovalRisk;
  status: ApprovalStatus;
  requested_at: string | null;
  decided_at: string | null;
  decision_source: string | null;
  decision_note: string | null;
  external_ref: string | null;
  metadata_json: string | null;
  created_at: string;
  updated_at: string;
}

export interface RuntimeActivityEvent {
  id: string;
  mission_id: string | null;
  agent_id: string | null;
  session_id: string | null;
  approval_id: string | null;
  event_type: string;
  title: string;
  detail: string | null;
  happened_at: string;
  source: string;
  metadata_json: string | null;
}

export interface ApprovalDecisionQueueItem {
  id: string;
  approval_id: string;
  decision: 'approved' | 'rejected';
  note: string | null;
  requested_by: string | null;
  dispatch_status: 'pending' | 'sent' | 'failed';
  dispatch_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpenClawSyncPayload {
  source?: string;
  synced_at?: string;
  missions?: Array<Partial<RuntimeMission>>;
  agents?: Array<Record<string, unknown>>;
  sessions?: Array<Record<string, unknown>>;
  approvals?: Array<Record<string, unknown>>;
  activity?: Array<Record<string, unknown>>;
}

export interface RuntimeDashboard {
  synced_at: string | null;
  counts: {
    missions: number;
    agents: number;
    sessions: number;
    approvals_pending: number;
    activity_events: number;
  };
  status: {
    active_agents: number;
    degraded_agents: number;
    approval_backlog: number;
    running_sessions: number;
  };
}

export interface RuntimeRepository {
  getDashboard(): Promise<RuntimeDashboard>;
  listMissions(): Promise<RuntimeMission[]>;
  getMission(id: string): Promise<RuntimeMission | null>;
  listAgents(): Promise<RuntimeAgent[]>;
  getAgent(id: string): Promise<RuntimeAgent | null>;
  listSessions(): Promise<RuntimeSession[]>;
  listApprovals(status?: string): Promise<RuntimeApproval[]>;
  listActivity(limit?: number): Promise<RuntimeActivityEvent[]>;
  syncOpenClaw(payload: OpenClawSyncPayload): Promise<{ ok: true; counts: Record<string, number>; synced_at: string }>;
  queueApprovalDecision(input: {
    approvalId: string;
    decision: 'approved' | 'rejected';
    note?: string;
    requestedBy?: string;
  }): Promise<ApprovalDecisionQueueItem>;
  listPendingApprovalDecisions(): Promise<ApprovalDecisionQueueItem[]>;
  markApprovalDecisionDispatched(id: string, status: 'sent' | 'failed', error?: string | null): Promise<void>;
}

export function createRuntimeRepository(db?: D1Database): RuntimeRepository {
  if (db) return new D1RuntimeRepository(db);
  return getMemoryRuntimeRepository();
}

class MemoryRuntimeRepository implements RuntimeRepository {
  private missions: RuntimeMission[] = [];
  private agents: RuntimeAgent[] = [];
  private sessions: RuntimeSession[] = [];
  private approvals: RuntimeApproval[] = [];
  private activity: RuntimeActivityEvent[] = [];
  private decisionQueue: ApprovalDecisionQueueItem[] = [];
  private syncedAt: string | null = null;

  async getDashboard(): Promise<RuntimeDashboard> {
    return buildDashboard(this.missions, this.agents, this.sessions, this.approvals, this.activity, this.syncedAt);
  }
  async listMissions() { return [...this.missions].sort(sortByUpdatedAt); }
  async getMission(id: string) { return this.missions.find((m) => m.id === id) ?? null; }
  async listAgents() { return [...this.agents].sort(sortByUpdatedAt); }
  async getAgent(id: string) { return this.agents.find((a) => a.id === id) ?? null; }
  async listSessions() { return [...this.sessions].sort((a,b)=> (b.updated_at||'').localeCompare(a.updated_at||'')); }
  async listApprovals(status?: string) {
    return [...this.approvals]
      .filter((item) => !status || item.status === status)
      .sort((a,b)=> (b.requested_at||'').localeCompare(a.requested_at||''));
  }
  async listActivity(limit = 100) { return [...this.activity].sort((a,b)=> b.happened_at.localeCompare(a.happened_at)).slice(0, limit); }

  async syncOpenClaw(payload: OpenClawSyncPayload) {
    const syncedAt = payload.synced_at ?? nowIso();
    const missions = (payload.missions ?? []).map(normalizeMission);
    if (missions.length) this.missions = mergeById(this.missions, missions);
    const agents = (payload.agents ?? []).map((item) => normalizeAgent(item, syncedAt));
    const sessions = (payload.sessions ?? []).map((item) => normalizeSession(item, syncedAt));
    const approvals = (payload.approvals ?? []).map((item) => normalizeApproval(item, syncedAt));
    const activity = (payload.activity ?? []).map((item) => normalizeActivity(item));
    this.agents = mergeById(this.agents, agents);
    this.sessions = mergeById(this.sessions, sessions);
    this.approvals = mergeById(this.approvals, approvals);
    this.activity = mergeById(this.activity, activity).sort((a,b)=> b.happened_at.localeCompare(a.happened_at));
    this.syncedAt = syncedAt;
    return { ok: true as const, counts: { missions: missions.length, agents: agents.length, sessions: sessions.length, approvals: approvals.length, activity: activity.length }, synced_at: syncedAt };
  }

  async queueApprovalDecision(input: { approvalId: string; decision: 'approved' | 'rejected'; note?: string; requestedBy?: string; }) {
    const now = nowIso();
    const item: ApprovalDecisionQueueItem = {
      id: createId('decision'), approval_id: input.approvalId, decision: input.decision, note: input.note ?? null,
      requested_by: input.requestedBy ?? 'operator', dispatch_status: 'pending', dispatch_error: null, created_at: now, updated_at: now
    };
    this.decisionQueue.unshift(item);
    this.approvals = this.approvals.map((approval) => approval.id === input.approvalId ? {
      ...approval, status: input.decision, decided_at: now, decision_source: 'operator', decision_note: input.note ?? null, updated_at: now
    } : approval);
    this.activity.unshift({ id: createId('event'), mission_id: this.approvals.find((a)=>a.id===input.approvalId)?.mission_id ?? null, agent_id: this.approvals.find((a)=>a.id===input.approvalId)?.agent_id ?? null, session_id: null, approval_id: input.approvalId, event_type: 'approval_decision', title: `Approval ${input.decision}`, detail: input.note ?? null, happened_at: now, source: 'operator', metadata_json: null });
    return item;
  }

  async listPendingApprovalDecisions() { return this.decisionQueue.filter((item) => item.dispatch_status === 'pending'); }
  async markApprovalDecisionDispatched(id: string, status: 'sent' | 'failed', error?: string | null) {
    this.decisionQueue = this.decisionQueue.map((item)=> item.id===id ? { ...item, dispatch_status: status, dispatch_error: error ?? null, updated_at: nowIso() } : item);
  }
}

class D1RuntimeRepository implements RuntimeRepository {
  constructor(private readonly db: D1Database) {}

  async getDashboard(): Promise<RuntimeDashboard> {
    const [missions, agents, sessions, approvalsPending, activity, syncRow, activeAgents, degradedAgents, runningSessions] = await Promise.all([
      scalar(this.db, 'SELECT COUNT(*) AS value FROM missions'),
      scalar(this.db, 'SELECT COUNT(*) AS value FROM runtime_agents'),
      scalar(this.db, 'SELECT COUNT(*) AS value FROM runtime_sessions'),
      scalar(this.db, "SELECT COUNT(*) AS value FROM runtime_approvals WHERE status = 'pending'"),
      scalar(this.db, 'SELECT COUNT(*) AS value FROM activity_events'),
      first<{ happened_at: string }>(this.db, 'SELECT happened_at FROM runtime_sync_log ORDER BY happened_at DESC LIMIT 1'),
      scalar(this.db, "SELECT COUNT(*) AS value FROM runtime_agents WHERE status = 'active'"),
      scalar(this.db, "SELECT COUNT(*) AS value FROM runtime_agents WHERE status IN ('degraded','offline')"),
      scalar(this.db, "SELECT COUNT(*) AS value FROM runtime_sessions WHERE state IN ('running','attention')")
    ]);
    return {
      synced_at: syncRow?.happened_at ?? null,
      counts: { missions, agents, sessions, approvals_pending: approvalsPending, activity_events: activity },
      status: { active_agents: activeAgents, degraded_agents: degradedAgents, approval_backlog: approvalsPending, running_sessions: runningSessions }
    };
  }

  listMissions() { return listRows<RuntimeMission>(this.db, 'SELECT * FROM missions ORDER BY updated_at DESC'); }
  getMission(id: string) { return first<RuntimeMission>(this.db, 'SELECT * FROM missions WHERE id = ?', [id]); }
  listAgents() { return listRows<RuntimeAgent>(this.db, 'SELECT * FROM runtime_agents ORDER BY updated_at DESC'); }
  getAgent(id: string) { return first<RuntimeAgent>(this.db, 'SELECT * FROM runtime_agents WHERE id = ?', [id]); }
  listSessions() { return listRows<RuntimeSession>(this.db, 'SELECT * FROM runtime_sessions ORDER BY updated_at DESC'); }
  listApprovals(status?: string) {
    return status
      ? listRows<RuntimeApproval>(this.db, 'SELECT * FROM runtime_approvals WHERE status = ? ORDER BY requested_at DESC', [status])
      : listRows<RuntimeApproval>(this.db, 'SELECT * FROM runtime_approvals ORDER BY requested_at DESC');
  }
  listActivity(limit = 100) { return listRows<RuntimeActivityEvent>(this.db, 'SELECT * FROM activity_events ORDER BY happened_at DESC LIMIT ?', [limit]); }

  async syncOpenClaw(payload: OpenClawSyncPayload) {
    const syncedAt = payload.synced_at ?? nowIso();
    const source = payload.source ?? 'openclaw';
    const missions = (payload.missions ?? []).map(normalizeMission);
    const agents = (payload.agents ?? []).map((item) => normalizeAgent(item, syncedAt));
    const sessions = (payload.sessions ?? []).map((item) => normalizeSession(item, syncedAt));
    const approvals = (payload.approvals ?? []).map((item) => normalizeApproval(item, syncedAt));
    const activity = (payload.activity ?? []).map((item) => normalizeActivity(item));

    for (const mission of missions) {
      await this.db.prepare(`INSERT OR REPLACE INTO missions (id, name, objective, status, operator_name, progress, metadata_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`) 
        .bind(mission.id, mission.name, mission.objective, mission.status, mission.operator_name, mission.progress, mission.metadata_json, mission.created_at, mission.updated_at).run();
    }
    for (const agent of agents) {
      await this.db.prepare(`INSERT OR REPLACE INTO runtime_agents (id, name, role, owner, status, mission_id, current_session_id, skills_json, throughput, backlog, last_heartbeat_at, source, metadata_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(agent.id, agent.name, agent.role, agent.owner, agent.status, agent.mission_id, agent.current_session_id, agent.skills_json, agent.throughput, agent.backlog, agent.last_heartbeat_at, agent.source, agent.metadata_json, agent.created_at, agent.updated_at).run();
    }
    for (const session of sessions) {
      await this.db.prepare(`INSERT OR REPLACE INTO runtime_sessions (id, agent_id, title, state, channel, peer_label, started_at, updated_at, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(session.id, session.agent_id, session.title, session.state, session.channel, session.peer_label, session.started_at, session.updated_at, session.metadata_json).run();
    }
    for (const approval of approvals) {
      await this.db.prepare(`INSERT OR REPLACE INTO runtime_approvals (id, mission_id, agent_id, title, summary, risk, status, requested_at, decided_at, decision_source, decision_note, external_ref, metadata_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(approval.id, approval.mission_id, approval.agent_id, approval.title, approval.summary, approval.risk, approval.status, approval.requested_at, approval.decided_at, approval.decision_source, approval.decision_note, approval.external_ref, approval.metadata_json, approval.created_at, approval.updated_at).run();
    }
    for (const event of activity) {
      await this.db.prepare(`INSERT OR REPLACE INTO activity_events (id, mission_id, agent_id, session_id, approval_id, event_type, title, detail, happened_at, source, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(event.id, event.mission_id, event.agent_id, event.session_id, event.approval_id, event.event_type, event.title, event.detail, event.happened_at, event.source, event.metadata_json).run();
    }

    await this.db.prepare(`INSERT INTO runtime_sync_log (id, source, agent_count, session_count, approval_count, activity_count, happened_at, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(createId('sync'), source, agents.length, sessions.length, approvals.length, activity.length, syncedAt, JSON.stringify({ missions: missions.length })).run();

    return { ok: true as const, counts: { missions: missions.length, agents: agents.length, sessions: sessions.length, approvals: approvals.length, activity: activity.length }, synced_at: syncedAt };
  }

  async queueApprovalDecision(input: { approvalId: string; decision: 'approved' | 'rejected'; note?: string; requestedBy?: string; }) {
    const now = nowIso();
    const item: ApprovalDecisionQueueItem = {
      id: createId('decision'), approval_id: input.approvalId, decision: input.decision, note: input.note ?? null,
      requested_by: input.requestedBy ?? 'operator', dispatch_status: 'pending', dispatch_error: null, created_at: now, updated_at: now
    };
    await this.db.prepare(`INSERT INTO approval_decision_queue (id, approval_id, decision, note, requested_by, dispatch_status, dispatch_error, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(item.id, item.approval_id, item.decision, item.note, item.requested_by, item.dispatch_status, item.dispatch_error, item.created_at, item.updated_at).run();
    await this.db.prepare(`UPDATE runtime_approvals SET status = ?, decided_at = ?, decision_source = ?, decision_note = ?, updated_at = ? WHERE id = ?`)
      .bind(input.decision, now, 'operator', input.note ?? null, now, input.approvalId).run();
    await this.db.prepare(`INSERT INTO activity_events (id, mission_id, agent_id, session_id, approval_id, event_type, title, detail, happened_at, source, metadata_json)
      SELECT ?, mission_id, agent_id, NULL, id, 'approval_decision', ?, ?, ?, 'operator', NULL FROM runtime_approvals WHERE id = ?`)
      .bind(createId('event'), `Approval ${input.decision}`, input.note ?? null, now, input.approvalId).run();
    return item;
  }

  listPendingApprovalDecisions() {
    return listRows<ApprovalDecisionQueueItem>(this.db, `SELECT * FROM approval_decision_queue WHERE dispatch_status = 'pending' ORDER BY created_at DESC`);
  }

  async markApprovalDecisionDispatched(id: string, status: 'sent' | 'failed', error?: string | null) {
    await this.db.prepare('UPDATE approval_decision_queue SET dispatch_status = ?, dispatch_error = ?, updated_at = ? WHERE id = ?')
      .bind(status, error ?? null, nowIso(), id).run();
  }
}

let sharedMemoryRuntimeRepository: MemoryRuntimeRepository | undefined;
function getMemoryRuntimeRepository() { sharedMemoryRuntimeRepository ??= new MemoryRuntimeRepository(); return sharedMemoryRuntimeRepository; }

function normalizeMission(input: Partial<RuntimeMission>): RuntimeMission {
  const now = nowIso();
  return {
    id: input.id ?? createId('mission'),
    name: input.name ?? 'OpenClaw Ops',
    objective: input.objective ?? null,
    status: input.status ?? 'healthy',
    operator_name: input.operator_name ?? null,
    progress: clampNumber(input.progress, 0, 100, 0),
    metadata_json: input.metadata_json ?? null,
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now
  };
}

function normalizeAgent(input: Record<string, unknown>, syncedAt: string): RuntimeAgent {
  const now = syncedAt;
  const id = firstString(input, ['id','agentId','agent_id']) ?? createId('agent');
  return {
    id,
    name: firstString(input, ['name','displayName','display_name']) ?? id,
    role: firstString(input, ['role','title']) ?? null,
    owner: firstString(input, ['owner','operator']) ?? null,
    status: normalizeAgentStatus(firstString(input, ['status','state'])),
    mission_id: firstString(input, ['missionId','mission_id','currentMissionId']) ?? null,
    current_session_id: firstString(input, ['currentSessionId','current_session_id']) ?? null,
    skills_json: JSON.stringify(asStringArray(input.skills)),
    throughput: asNumber(input.throughput, 0),
    backlog: Math.round(asNumber(input.backlog, 0)),
    last_heartbeat_at: firstString(input, ['lastHeartbeatAt','last_heartbeat_at']) ?? null,
    source: firstString(input, ['source']) ?? 'openclaw',
    metadata_json: JSON.stringify(input),
    created_at: firstString(input, ['created_at','createdAt']) ?? now,
    updated_at: firstString(input, ['updated_at','updatedAt']) ?? now
  };
}

function normalizeSession(input: Record<string, unknown>, syncedAt: string): RuntimeSession {
  return {
    id: firstString(input, ['id','sessionKey','session_key']) ?? createId('session'),
    agent_id: firstString(input, ['agentId','agent_id']) ?? null,
    title: firstString(input, ['title']) ?? firstString(input, ['peerLabel','peer_label']) ?? null,
    state: normalizeSessionState(firstString(input, ['state','status'])),
    channel: firstString(input, ['channel']) ?? null,
    peer_label: firstString(input, ['peerLabel','peer_label']) ?? null,
    started_at: firstString(input, ['startedAt','started_at']) ?? null,
    updated_at: firstString(input, ['updatedAt','updated_at']) ?? syncedAt,
    metadata_json: JSON.stringify(input)
  };
}

function normalizeApproval(input: Record<string, unknown>, syncedAt: string): RuntimeApproval {
  const now = syncedAt;
  return {
    id: firstString(input, ['id','approvalId','approval_id']) ?? createId('approval'),
    mission_id: firstString(input, ['missionId','mission_id']) ?? null,
    agent_id: firstString(input, ['agentId','agent_id']) ?? null,
    title: firstString(input, ['title']) ?? 'Approval required',
    summary: firstString(input, ['summary','description']) ?? null,
    risk: normalizeRisk(firstString(input, ['risk','severity'])),
    status: normalizeApprovalStatus(firstString(input, ['status'])),
    requested_at: firstString(input, ['requestedAt','requested_at','createdAt']) ?? now,
    decided_at: firstString(input, ['decidedAt','decided_at']) ?? null,
    decision_source: firstString(input, ['decisionSource','decision_source']) ?? null,
    decision_note: firstString(input, ['decisionNote','decision_note']) ?? null,
    external_ref: firstString(input, ['externalRef','external_ref']) ?? null,
    metadata_json: JSON.stringify(input),
    created_at: firstString(input, ['created_at','createdAt']) ?? now,
    updated_at: firstString(input, ['updated_at','updatedAt']) ?? now
  };
}

function normalizeActivity(input: Record<string, unknown>): RuntimeActivityEvent {
  const now = nowIso();
  return {
    id: firstString(input, ['id','eventId','event_id']) ?? createId('event'),
    mission_id: firstString(input, ['missionId','mission_id']) ?? null,
    agent_id: firstString(input, ['agentId','agent_id']) ?? null,
    session_id: firstString(input, ['sessionId','session_id']) ?? null,
    approval_id: firstString(input, ['approvalId','approval_id']) ?? null,
    event_type: firstString(input, ['event_type','type']) ?? 'event',
    title: firstString(input, ['title']) ?? 'OpenClaw event',
    detail: firstString(input, ['detail','text','summary']) ?? null,
    happened_at: firstString(input, ['happenedAt','happened_at','ts','timestamp']) ?? now,
    source: firstString(input, ['source']) ?? 'openclaw',
    metadata_json: JSON.stringify(input)
  };
}

function normalizeAgentStatus(value?: string | null): RuntimeAgentStatus {
  if (value === 'active' || value === 'idle' || value === 'approvals' || value === 'degraded' || value === 'offline') return value;
  return 'idle';
}
function normalizeSessionState(value?: string | null): RuntimeSessionState {
  if (value === 'running' || value === 'queued' || value === 'completed' || value === 'attention') return value;
  return 'queued';
}
function normalizeRisk(value?: string | null): ApprovalRisk {
  if (value === 'low' || value === 'medium' || value === 'high') return value;
  return 'medium';
}
function normalizeApprovalStatus(value?: string | null): ApprovalStatus {
  if (value === 'pending' || value === 'approved' || value === 'rejected') return value;
  return 'pending';
}

function firstString(input: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = input[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return null;
}
function asNumber(value: unknown, fallback: number) { return typeof value === 'number' && Number.isFinite(value) ? value : fallback; }
function asStringArray(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
function clampNumber(value: number | undefined, min: number, max: number, fallback: number) { return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback; }
function mergeById<T extends { id: string }>(current: T[], incoming: T[]) { return [...incoming, ...current.filter((item) => !incoming.some((next) => next.id === item.id))]; }
function sortByUpdatedAt<T extends { updated_at: string }>(a: T, b: T) { return b.updated_at.localeCompare(a.updated_at); }
function buildDashboard(missions: RuntimeMission[], agents: RuntimeAgent[], sessions: RuntimeSession[], approvals: RuntimeApproval[], activity: RuntimeActivityEvent[], syncedAt: string | null): RuntimeDashboard {
  return {
    synced_at: syncedAt,
    counts: { missions: missions.length, agents: agents.length, sessions: sessions.length, approvals_pending: approvals.filter((a)=>a.status==='pending').length, activity_events: activity.length },
    status: { active_agents: agents.filter((a)=>a.status==='active').length, degraded_agents: agents.filter((a)=>a.status==='degraded' || a.status==='offline').length, approval_backlog: approvals.filter((a)=>a.status==='pending').length, running_sessions: sessions.filter((s)=>s.state==='running' || s.state==='attention').length }
  };
}
async function listRows<T>(db: D1Database, sql: string, binds: unknown[] = []): Promise<T[]> { const result = await db.prepare(sql).bind(...binds).all<T>(); return result.results ?? []; }
async function first<T>(db: D1Database, sql: string, binds: unknown[] = []): Promise<T | null> { const result = await db.prepare(sql).bind(...binds).first<T>(); return result ?? null; }
async function scalar(db: D1Database, sql: string): Promise<number> { const row = await db.prepare(sql).first<{ value: number }>(); return Number(row?.value ?? 0); }
