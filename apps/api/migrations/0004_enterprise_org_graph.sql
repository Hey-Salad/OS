PRAGMA foreign_keys = ON;

-- Geographic graph
CREATE TABLE IF NOT EXISTS org_countries (
  id TEXT PRIMARY KEY,
  iso2 TEXT NOT NULL UNIQUE,
  iso3 TEXT,
  name TEXT NOT NULL,
  continent TEXT NOT NULL,
  subregion TEXT,
  currency_code TEXT,
  timezone_primary TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS org_regions (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  region_type TEXT NOT NULL DEFAULT 'continent',
  parent_region_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (parent_region_id) REFERENCES org_regions(id)
);

CREATE TABLE IF NOT EXISTS org_provinces (
  id TEXT PRIMARY KEY,
  country_id TEXT NOT NULL,
  code TEXT,
  name TEXT NOT NULL,
  province_type TEXT NOT NULL DEFAULT 'province',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (country_id) REFERENCES org_countries(id)
);

CREATE TABLE IF NOT EXISTS org_cities (
  id TEXT PRIMARY KEY,
  country_id TEXT NOT NULL,
  province_id TEXT,
  name TEXT NOT NULL,
  lat REAL,
  lng REAL,
  timezone TEXT,
  population INTEGER,
  is_capital INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (country_id) REFERENCES org_countries(id),
  FOREIGN KEY (province_id) REFERENCES org_provinces(id)
);

CREATE TABLE IF NOT EXISTS org_legal_entities (
  id TEXT PRIMARY KEY,
  country_id TEXT NOT NULL,
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'limited_company',
  registration_number TEXT,
  tax_id TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (country_id) REFERENCES org_countries(id)
);

-- Organization structure
CREATE TABLE IF NOT EXISTS org_departments (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  parent_department_id TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (parent_department_id) REFERENCES org_departments(id)
);

CREATE TABLE IF NOT EXISTS org_teams (
  id TEXT PRIMARY KEY,
  department_id TEXT NOT NULL,
  office_id TEXT,
  name TEXT NOT NULL,
  purpose TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (department_id) REFERENCES org_departments(id),
  FOREIGN KEY (office_id) REFERENCES offices(id)
);

CREATE TABLE IF NOT EXISTS org_reporting_lines (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  manager_agent_id TEXT,
  relationship_type TEXT NOT NULL DEFAULT 'direct',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (agent_id) REFERENCES runtime_agents(id),
  FOREIGN KEY (manager_agent_id) REFERENCES runtime_agents(id)
);

CREATE TABLE IF NOT EXISTS org_capability_clusters (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS org_capabilities (
  id TEXT PRIMARY KEY,
  cluster_id TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (cluster_id) REFERENCES org_capability_clusters(id)
);

CREATE TABLE IF NOT EXISTS org_agent_capabilities (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  capability_id TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (agent_id) REFERENCES runtime_agents(id),
  FOREIGN KEY (capability_id) REFERENCES org_capabilities(id)
);

CREATE TABLE IF NOT EXISTS org_staffing_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  horizon TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  effective_from TEXT,
  effective_to TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS org_staffing_plan_lines (
  id TEXT PRIMARY KEY,
  staffing_plan_id TEXT NOT NULL,
  office_id TEXT,
  country_id TEXT,
  department_id TEXT,
  seniority_band TEXT,
  planned_headcount INTEGER NOT NULL DEFAULT 0,
  active_headcount INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (staffing_plan_id) REFERENCES org_staffing_plans(id),
  FOREIGN KEY (office_id) REFERENCES offices(id),
  FOREIGN KEY (country_id) REFERENCES org_countries(id),
  FOREIGN KEY (department_id) REFERENCES org_departments(id)
);

CREATE TABLE IF NOT EXISTS org_regional_business_units (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region_id TEXT,
  lead_agent_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (region_id) REFERENCES org_regions(id),
  FOREIGN KEY (lead_agent_id) REFERENCES runtime_agents(id)
);

-- Budget and governance
CREATE TABLE IF NOT EXISTS org_budgets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  scope_type TEXT NOT NULL,
  scope_id TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  amount_total REAL NOT NULL DEFAULT 0,
  amount_committed REAL NOT NULL DEFAULT 0,
  amount_spent REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS org_budget_allocations (
  id TEXT PRIMARY KEY,
  budget_id TEXT NOT NULL,
  department_id TEXT,
  office_id TEXT,
  mission_id TEXT,
  amount_allocated REAL NOT NULL DEFAULT 0,
  amount_spent REAL NOT NULL DEFAULT 0,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (budget_id) REFERENCES org_budgets(id),
  FOREIGN KEY (department_id) REFERENCES org_departments(id),
  FOREIGN KEY (office_id) REFERENCES offices(id),
  FOREIGN KEY (mission_id) REFERENCES missions(id)
);

CREATE TABLE IF NOT EXISTS approval_policies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  scope_type TEXT NOT NULL,
  scope_id TEXT,
  risk_level TEXT NOT NULL DEFAULT 'medium',
  required_approver_seniority TEXT,
  metadata_json TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Runtime orchestration
CREATE TABLE IF NOT EXISTS runtime_queues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  queue_type TEXT NOT NULL DEFAULT 'department',
  mission_id TEXT,
  department_id TEXT,
  office_id TEXT,
  priority INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'active',
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (mission_id) REFERENCES missions(id),
  FOREIGN KEY (department_id) REFERENCES org_departments(id),
  FOREIGN KEY (office_id) REFERENCES offices(id)
);

CREATE TABLE IF NOT EXISTS runtime_tasks (
  id TEXT PRIMARY KEY,
  queue_id TEXT,
  mission_id TEXT,
  assigned_agent_id TEXT,
  title TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'queued',
  priority INTEGER NOT NULL DEFAULT 50,
  escalation_level INTEGER NOT NULL DEFAULT 0,
  payload_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (queue_id) REFERENCES runtime_queues(id),
  FOREIGN KEY (mission_id) REFERENCES missions(id),
  FOREIGN KEY (assigned_agent_id) REFERENCES runtime_agents(id)
);

CREATE TABLE IF NOT EXISTS runtime_workflows (
  id TEXT PRIMARY KEY,
  mission_id TEXT,
  queue_id TEXT,
  owner_agent_id TEXT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  progress INTEGER NOT NULL DEFAULT 0,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (mission_id) REFERENCES missions(id),
  FOREIGN KEY (queue_id) REFERENCES runtime_queues(id),
  FOREIGN KEY (owner_agent_id) REFERENCES runtime_agents(id)
);

CREATE TABLE IF NOT EXISTS runtime_workflow_steps (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  step_key TEXT NOT NULL,
  assigned_agent_id TEXT,
  state TEXT NOT NULL DEFAULT 'pending',
  started_at TEXT,
  finished_at TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (workflow_id) REFERENCES runtime_workflows(id),
  FOREIGN KEY (assigned_agent_id) REFERENCES runtime_agents(id)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  event_type TEXT NOT NULL,
  scope_type TEXT NOT NULL,
  scope_id TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  payload_json TEXT,
  created_at TEXT NOT NULL
);

-- Additive upgrades to existing tables
ALTER TABLE offices ADD COLUMN country_id TEXT REFERENCES org_countries(id);
ALTER TABLE offices ADD COLUMN city_id TEXT REFERENCES org_cities(id);
ALTER TABLE offices ADD COLUMN province_id TEXT REFERENCES org_provinces(id);
ALTER TABLE offices ADD COLUMN region_id TEXT REFERENCES org_regions(id);
ALTER TABLE offices ADD COLUMN legal_entity_id TEXT REFERENCES org_legal_entities(id);
ALTER TABLE offices ADD COLUMN capacity INTEGER DEFAULT 0;
ALTER TABLE offices ADD COLUMN metadata_json TEXT;

ALTER TABLE employees ADD COLUMN runtime_agent_id TEXT REFERENCES runtime_agents(id);
ALTER TABLE employees ADD COLUMN department_id TEXT REFERENCES org_departments(id);
ALTER TABLE employees ADD COLUMN seniority_band TEXT;
ALTER TABLE employees ADD COLUMN reports_to_employee_id TEXT REFERENCES employees(id);
ALTER TABLE employees ADD COLUMN country_id TEXT REFERENCES org_countries(id);
ALTER TABLE employees ADD COLUMN city_id TEXT REFERENCES org_cities(id);

ALTER TABLE runtime_agents ADD COLUMN employee_id TEXT REFERENCES employees(id);
ALTER TABLE runtime_agents ADD COLUMN office_id TEXT REFERENCES offices(id);
ALTER TABLE runtime_agents ADD COLUMN country_id TEXT REFERENCES org_countries(id);
ALTER TABLE runtime_agents ADD COLUMN city_id TEXT REFERENCES org_cities(id);
ALTER TABLE runtime_agents ADD COLUMN department_id TEXT REFERENCES org_departments(id);
ALTER TABLE runtime_agents ADD COLUMN team_id TEXT REFERENCES org_teams(id);
ALTER TABLE runtime_agents ADD COLUMN seniority_band TEXT;
ALTER TABLE runtime_agents ADD COLUMN reports_to_agent_id TEXT REFERENCES runtime_agents(id);
ALTER TABLE runtime_agents ADD COLUMN capability_cluster_id TEXT REFERENCES org_capability_clusters(id);
ALTER TABLE runtime_agents ADD COLUMN legal_entity_id TEXT REFERENCES org_legal_entities(id);
ALTER TABLE runtime_agents ADD COLUMN active_flag INTEGER NOT NULL DEFAULT 1;
ALTER TABLE runtime_agents ADD COLUMN budget_daily_limit_usd REAL DEFAULT 0;
ALTER TABLE runtime_agents ADD COLUMN budget_monthly_limit_usd REAL DEFAULT 0;

ALTER TABLE missions ADD COLUMN business_unit_id TEXT REFERENCES org_regional_business_units(id);
ALTER TABLE missions ADD COLUMN region_id TEXT REFERENCES org_regions(id);
ALTER TABLE missions ADD COLUMN department_id TEXT REFERENCES org_departments(id);
ALTER TABLE missions ADD COLUMN budget_id TEXT REFERENCES org_budgets(id);
ALTER TABLE missions ADD COLUMN queue_id TEXT REFERENCES runtime_queues(id);

ALTER TABLE runtime_sessions ADD COLUMN queue_id TEXT REFERENCES runtime_queues(id);
ALTER TABLE runtime_sessions ADD COLUMN workload_score REAL DEFAULT 0;

ALTER TABLE runtime_approvals ADD COLUMN policy_id TEXT REFERENCES approval_policies(id);
ALTER TABLE runtime_approvals ADD COLUMN required_seniority TEXT;
ALTER TABLE runtime_approvals ADD COLUMN escalated_to_agent_id TEXT REFERENCES runtime_agents(id);

CREATE INDEX IF NOT EXISTS idx_countries_iso2 ON org_countries(iso2);
CREATE INDEX IF NOT EXISTS idx_regions_parent ON org_regions(parent_region_id);
CREATE INDEX IF NOT EXISTS idx_provinces_country ON org_provinces(country_id);
CREATE INDEX IF NOT EXISTS idx_cities_country ON org_cities(country_id);
CREATE INDEX IF NOT EXISTS idx_cities_province ON org_cities(province_id);
CREATE INDEX IF NOT EXISTS idx_org_teams_department ON org_teams(department_id);
CREATE INDEX IF NOT EXISTS idx_org_teams_office ON org_teams(office_id);
CREATE INDEX IF NOT EXISTS idx_reporting_agent ON org_reporting_lines(agent_id);
CREATE INDEX IF NOT EXISTS idx_reporting_manager ON org_reporting_lines(manager_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_capabilities_agent ON org_agent_capabilities(agent_id);
CREATE INDEX IF NOT EXISTS idx_staffing_plan_lines_scope ON org_staffing_plan_lines(staffing_plan_id, office_id, department_id);
CREATE INDEX IF NOT EXISTS idx_budgets_scope ON org_budgets(scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_budget_allocations_budget ON org_budget_allocations(budget_id);
CREATE INDEX IF NOT EXISTS idx_runtime_queues_scope ON runtime_queues(mission_id, department_id, office_id);
CREATE INDEX IF NOT EXISTS idx_runtime_tasks_queue ON runtime_tasks(queue_id, state, priority);
CREATE INDEX IF NOT EXISTS idx_runtime_workflows_status ON runtime_workflows(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_runtime_workflow_steps_workflow ON runtime_workflow_steps(workflow_id, state);
CREATE INDEX IF NOT EXISTS idx_audit_events_scope ON audit_events(scope_type, scope_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runtime_agents_org_scope ON runtime_agents(country_id, city_id, office_id, department_id, seniority_band, status);
