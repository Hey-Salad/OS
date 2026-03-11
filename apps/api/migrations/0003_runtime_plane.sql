PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS missions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  objective TEXT,
  status TEXT NOT NULL DEFAULT 'healthy',
  operator_name TEXT,
  progress INTEGER NOT NULL DEFAULT 0,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS runtime_agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  owner TEXT,
  status TEXT NOT NULL DEFAULT 'idle',
  mission_id TEXT,
  current_session_id TEXT,
  skills_json TEXT,
  throughput REAL DEFAULT 0,
  backlog INTEGER DEFAULT 0,
  last_heartbeat_at TEXT,
  source TEXT NOT NULL DEFAULT 'openclaw',
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (mission_id) REFERENCES missions(id)
);

CREATE TABLE IF NOT EXISTS runtime_sessions (
  id TEXT PRIMARY KEY,
  agent_id TEXT,
  title TEXT,
  state TEXT NOT NULL DEFAULT 'queued',
  channel TEXT,
  peer_label TEXT,
  started_at TEXT,
  updated_at TEXT NOT NULL,
  metadata_json TEXT,
  FOREIGN KEY (agent_id) REFERENCES runtime_agents(id)
);

CREATE TABLE IF NOT EXISTS runtime_approvals (
  id TEXT PRIMARY KEY,
  mission_id TEXT,
  agent_id TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  risk TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TEXT,
  decided_at TEXT,
  decision_source TEXT,
  decision_note TEXT,
  external_ref TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (mission_id) REFERENCES missions(id),
  FOREIGN KEY (agent_id) REFERENCES runtime_agents(id)
);

CREATE TABLE IF NOT EXISTS activity_events (
  id TEXT PRIMARY KEY,
  mission_id TEXT,
  agent_id TEXT,
  session_id TEXT,
  approval_id TEXT,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  happened_at TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'openclaw',
  metadata_json TEXT,
  FOREIGN KEY (mission_id) REFERENCES missions(id),
  FOREIGN KEY (agent_id) REFERENCES runtime_agents(id),
  FOREIGN KEY (session_id) REFERENCES runtime_sessions(id),
  FOREIGN KEY (approval_id) REFERENCES runtime_approvals(id)
);

CREATE TABLE IF NOT EXISTS approval_decision_queue (
  id TEXT PRIMARY KEY,
  approval_id TEXT NOT NULL,
  decision TEXT NOT NULL,
  note TEXT,
  requested_by TEXT,
  dispatch_status TEXT NOT NULL DEFAULT 'pending',
  dispatch_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (approval_id) REFERENCES runtime_approvals(id)
);

CREATE TABLE IF NOT EXISTS runtime_sync_log (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  agent_count INTEGER NOT NULL DEFAULT 0,
  session_count INTEGER NOT NULL DEFAULT 0,
  approval_count INTEGER NOT NULL DEFAULT 0,
  activity_count INTEGER NOT NULL DEFAULT 0,
  happened_at TEXT NOT NULL,
  metadata_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_missions_updated_at ON missions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_runtime_agents_mission_id ON runtime_agents(mission_id);
CREATE INDEX IF NOT EXISTS idx_runtime_agents_status ON runtime_agents(status);
CREATE INDEX IF NOT EXISTS idx_runtime_sessions_agent_id ON runtime_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_runtime_sessions_updated_at ON runtime_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_runtime_approvals_status ON runtime_approvals(status);
CREATE INDEX IF NOT EXISTS idx_runtime_approvals_requested_at ON runtime_approvals(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_happened_at ON activity_events(happened_at DESC);
CREATE INDEX IF NOT EXISTS idx_decision_queue_dispatch_status ON approval_decision_queue(dispatch_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runtime_sync_log_happened_at ON runtime_sync_log(happened_at DESC);
