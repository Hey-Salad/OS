-- HeySalad OS Cloudflare foundation schema
-- Derived from docs/architecture/heysalad-cloudflare-anyway-architecture-v1.md

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS offices (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  country TEXT NOT NULL,
  country_code TEXT,
  flag TEXT,
  lat REAL,
  lng REAL,
  office_type TEXT NOT NULL,
  provider TEXT,
  region_code TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  purpose TEXT,
  office_id TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (office_id) REFERENCES offices(id)
);

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  team_id TEXT,
  office_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  model_provider TEXT,
  model_name TEXT,
  budget_daily_usd REAL DEFAULT 0,
  budget_monthly_usd REAL DEFAULT 0,
  persona_json TEXT,
  capabilities_json TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (team_id) REFERENCES teams(id),
  FOREIGN KEY (office_id) REFERENCES offices(id)
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  owner_employee_id TEXT,
  budget_total_usd REAL DEFAULT 0,
  budget_monthly_usd REAL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (owner_employee_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  assigned_employee_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  blocked_reason TEXT,
  due_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (assigned_employee_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS task_events (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  employee_id TEXT,
  event_type TEXT NOT NULL,
  payload_json TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  scope_type TEXT NOT NULL,
  scope_id TEXT NOT NULL,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  mime_type TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS document_chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  text_content TEXT NOT NULL,
  vector_id TEXT,
  token_count INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY (document_id) REFERENCES documents(id)
);

CREATE TABLE IF NOT EXISTS workflow_runs (
  id TEXT PRIMARY KEY,
  employee_id TEXT,
  task_id TEXT,
  project_id TEXT,
  workflow_name TEXT NOT NULL,
  status TEXT NOT NULL,
  trace_id TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  summary_json TEXT,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS usage_summaries (
  id TEXT PRIMARY KEY,
  employee_id TEXT,
  project_id TEXT,
  office_id TEXT,
  provider TEXT,
  model TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  estimated_cost_usd REAL DEFAULT 0,
  actual_cost_usd REAL DEFAULT 0,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (office_id) REFERENCES offices(id)
);

CREATE INDEX IF NOT EXISTS idx_teams_office_id ON teams(office_id);
CREATE INDEX IF NOT EXISTS idx_employees_team_id ON employees(team_id);
CREATE INDEX IF NOT EXISTS idx_employees_office_id ON employees(office_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner_employee_id ON projects(owner_employee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_employee_id ON tasks(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_events_task_id ON task_events(task_id);
CREATE INDEX IF NOT EXISTS idx_documents_scope ON documents(scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_trace_id ON workflow_runs(trace_id);
CREATE INDEX IF NOT EXISTS idx_usage_summaries_period ON usage_summaries(period_start, period_end);
