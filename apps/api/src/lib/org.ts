export interface OrgSummary {
  counts: {
    countries: number;
    cities: number;
    offices: number;
    departments: number;
    agents: number;
    active_agents: number;
    idle_agents: number;
    pending_approvals: number;
    runtime_tasks: number;
  };
}

export interface OrgWorkforceFilters {
  country?: string;
  city?: string;
  office?: string;
  department?: string;
  seniority?: string;
  status?: string;
  limit?: number;
}

export interface OrgWorkforceRecord {
  id: string;
  name: string;
  role: string | null;
  status: string;
  seniority_band: string | null;
  department_name: string | null;
  office_name: string | null;
  city_name: string | null;
  country_name: string | null;
  reports_to_agent_id: string | null;
  reports_to_name: string | null;
  skills_json: string | null;
  metadata_json: string | null;
  workload_score: number;
  backlog: number;
  active_flag: number;
}

export interface OrgOfficeRecord {
  id: string;
  name: string;
  city: string | null;
  country: string;
  country_code: string | null;
  flag: string | null;
  lat: number | null;
  lng: number | null;
  office_type: string;
  region_code: string | null;
  capacity: number | null;
  active_agents: number;
  total_agents: number;
}

export interface OrgFilterOptions {
  countries: string[];
  cities: string[];
  offices: string[];
  departments: string[];
  seniorities: string[];
  statuses: string[];
}

export interface RuntimeOpsSnapshot {
  queues: Array<{ id: string; name: string; queue_type: string; status: string; mission_id: string | null; pending_tasks: number }>;
  workflows: Array<{ id: string; name: string; status: string; progress: number; mission_id: string | null; queue_id: string | null }>;
  tasks: Array<{ id: string; title: string; state: string; priority: number; queue_id: string | null; assigned_agent_id: string | null }>;
}

export interface OrgRepository {
  getSummary(): Promise<OrgSummary>;
  listOffices(filters?: Pick<OrgWorkforceFilters, 'country' | 'city'>): Promise<OrgOfficeRecord[]>;
  listWorkforce(filters?: OrgWorkforceFilters): Promise<OrgWorkforceRecord[]>;
  listFilterOptions(): Promise<OrgFilterOptions>;
  getRuntimeOpsSnapshot(limit?: number): Promise<RuntimeOpsSnapshot>;
}

export function createOrgRepository(db?: D1Database): OrgRepository {
  if (db) return new D1OrgRepository(db);
  return new MemoryOrgRepository();
}

class MemoryOrgRepository implements OrgRepository {
  async getSummary(): Promise<OrgSummary> {
    return {
      counts: {
        countries: 0,
        cities: 0,
        offices: 0,
        departments: 0,
        agents: 0,
        active_agents: 0,
        idle_agents: 0,
        pending_approvals: 0,
        runtime_tasks: 0
      }
    };
  }

  async listOffices(): Promise<OrgOfficeRecord[]> {
    return [];
  }

  async listWorkforce(): Promise<OrgWorkforceRecord[]> {
    return [];
  }

  async listFilterOptions(): Promise<OrgFilterOptions> {
    return {
      countries: [],
      cities: [],
      offices: [],
      departments: [],
      seniorities: [],
      statuses: ['active', 'idle', 'degraded', 'offline', 'approvals']
    };
  }

  async getRuntimeOpsSnapshot(): Promise<RuntimeOpsSnapshot> {
    return { queues: [], workflows: [], tasks: [] };
  }
}

class D1OrgRepository implements OrgRepository {
  constructor(private readonly db: D1Database) {}

  async getSummary(): Promise<OrgSummary> {
    const [
      countries,
      cities,
      offices,
      departments,
      agents,
      activeAgents,
      idleAgents,
      pendingApprovals,
      runtimeTasks
    ] = await Promise.all([
      scalar(this.db, 'SELECT COUNT(*) AS value FROM org_countries WHERE active = 1'),
      scalar(this.db, 'SELECT COUNT(*) AS value FROM org_cities'),
      scalar(this.db, 'SELECT COUNT(*) AS value FROM offices WHERE active = 1'),
      scalar(this.db, 'SELECT COUNT(*) AS value FROM org_departments WHERE active = 1'),
      scalar(this.db, 'SELECT COUNT(*) AS value FROM runtime_agents'),
      scalar(this.db, "SELECT COUNT(*) AS value FROM runtime_agents WHERE status = 'active'"),
      scalar(this.db, "SELECT COUNT(*) AS value FROM runtime_agents WHERE status = 'idle'"),
      scalar(this.db, "SELECT COUNT(*) AS value FROM runtime_approvals WHERE status = 'pending'"),
      scalar(this.db, 'SELECT COUNT(*) AS value FROM runtime_tasks')
    ]);

    return {
      counts: {
        countries,
        cities,
        offices,
        departments,
        agents,
        active_agents: activeAgents,
        idle_agents: idleAgents,
        pending_approvals: pendingApprovals,
        runtime_tasks: runtimeTasks
      }
    };
  }

  async listOffices(filters?: Pick<OrgWorkforceFilters, 'country' | 'city'>): Promise<OrgOfficeRecord[]> {
    const binds: unknown[] = [];
    const where: string[] = ['o.active = 1'];

    if (filters?.country) {
      where.push('LOWER(o.country) = LOWER(?)');
      binds.push(filters.country);
    }

    if (filters?.city) {
      where.push('LOWER(o.city) = LOWER(?)');
      binds.push(filters.city);
    }

    const sql = `
      SELECT
        o.id,
        o.name,
        o.city,
        o.country,
        o.country_code,
        o.flag,
        o.lat,
        o.lng,
        o.office_type,
        o.region_code,
        o.capacity,
        SUM(CASE WHEN ra.status = 'active' THEN 1 ELSE 0 END) AS active_agents,
        COUNT(ra.id) AS total_agents
      FROM offices o
      LEFT JOIN runtime_agents ra ON ra.office_id = o.id
      WHERE ${where.join(' AND ')}
      GROUP BY o.id
      ORDER BY total_agents DESC, o.name ASC
    `;

    return listRows<OrgOfficeRecord>(this.db, sql, binds);
  }

  async listWorkforce(filters?: OrgWorkforceFilters): Promise<OrgWorkforceRecord[]> {
    const binds: unknown[] = [];
    const where: string[] = ['ra.active_flag = 1'];

    if (filters?.country) {
      where.push('LOWER(c.name) = LOWER(?)');
      binds.push(filters.country);
    }

    if (filters?.city) {
      where.push('LOWER(ci.name) = LOWER(?)');
      binds.push(filters.city);
    }

    if (filters?.office) {
      where.push('LOWER(o.name) = LOWER(?)');
      binds.push(filters.office);
    }

    if (filters?.department) {
      where.push('LOWER(d.name) = LOWER(?)');
      binds.push(filters.department);
    }

    if (filters?.seniority) {
      where.push('LOWER(ra.seniority_band) = LOWER(?)');
      binds.push(filters.seniority);
    }

    if (filters?.status) {
      where.push('LOWER(ra.status) = LOWER(?)');
      binds.push(filters.status);
    }

    const limit = Math.min(10000, Math.max(50, Number(filters?.limit ?? 1500)));
    binds.push(limit);

    const sql = `
      SELECT
        ra.id,
        ra.name,
        ra.role,
        ra.status,
        ra.seniority_band,
        d.name AS department_name,
        o.name AS office_name,
        ci.name AS city_name,
        c.name AS country_name,
        ra.reports_to_agent_id,
        mgr.name AS reports_to_name,
        ra.skills_json,
        ra.metadata_json,
        COALESCE(rs.workload_score, 0) AS workload_score,
        COALESCE(ra.backlog, 0) AS backlog,
        ra.active_flag
      FROM runtime_agents ra
      LEFT JOIN runtime_agents mgr ON mgr.id = ra.reports_to_agent_id
      LEFT JOIN org_departments d ON d.id = ra.department_id
      LEFT JOIN offices o ON o.id = ra.office_id
      LEFT JOIN org_cities ci ON ci.id = ra.city_id
      LEFT JOIN org_countries c ON c.id = ra.country_id
      LEFT JOIN runtime_sessions rs ON rs.id = ra.current_session_id
      WHERE ${where.join(' AND ')}
      ORDER BY
        CASE ra.status WHEN 'active' THEN 0 WHEN 'approvals' THEN 1 WHEN 'idle' THEN 2 WHEN 'degraded' THEN 3 ELSE 4 END,
        ra.updated_at DESC
      LIMIT ?
    `;

    return listRows<OrgWorkforceRecord>(this.db, sql, binds);
  }

  async listFilterOptions(): Promise<OrgFilterOptions> {
    const [countries, cities, offices, departments, seniorities, statuses] = await Promise.all([
      listScalarStrings(this.db, 'SELECT DISTINCT name FROM org_countries WHERE active = 1 ORDER BY name ASC'),
      listScalarStrings(this.db, 'SELECT DISTINCT name FROM org_cities ORDER BY name ASC'),
      listScalarStrings(this.db, 'SELECT DISTINCT name FROM offices WHERE active = 1 ORDER BY name ASC'),
      listScalarStrings(this.db, 'SELECT DISTINCT name FROM org_departments WHERE active = 1 ORDER BY name ASC'),
      listScalarStrings(this.db, 'SELECT DISTINCT seniority_band FROM runtime_agents WHERE seniority_band IS NOT NULL ORDER BY seniority_band ASC'),
      listScalarStrings(this.db, 'SELECT DISTINCT status FROM runtime_agents ORDER BY status ASC')
    ]);

    return { countries, cities, offices, departments, seniorities, statuses };
  }

  async getRuntimeOpsSnapshot(limit = 100): Promise<RuntimeOpsSnapshot> {
    const safeLimit = Math.min(1000, Math.max(10, limit));

    const [queues, workflows, tasks] = await Promise.all([
      listRows<RuntimeOpsSnapshot['queues'][number]>(
        this.db,
        `SELECT q.id, q.name, q.queue_type, q.status, q.mission_id,
           SUM(CASE WHEN t.state IN ('queued','running','blocked') THEN 1 ELSE 0 END) AS pending_tasks
         FROM runtime_queues q
         LEFT JOIN runtime_tasks t ON t.queue_id = q.id
         GROUP BY q.id
         ORDER BY pending_tasks DESC, q.name ASC
         LIMIT ?`,
        [safeLimit]
      ),
      listRows<RuntimeOpsSnapshot['workflows'][number]>(
        this.db,
        'SELECT id, name, status, progress, mission_id, queue_id FROM runtime_workflows ORDER BY updated_at DESC LIMIT ?',
        [safeLimit]
      ),
      listRows<RuntimeOpsSnapshot['tasks'][number]>(
        this.db,
        `SELECT id, title, state, priority, queue_id, assigned_agent_id
         FROM runtime_tasks
         ORDER BY
           CASE state WHEN 'running' THEN 0 WHEN 'queued' THEN 1 WHEN 'blocked' THEN 2 ELSE 3 END,
           priority DESC,
           updated_at DESC
         LIMIT ?`,
        [safeLimit]
      )
    ]);

    return { queues, workflows, tasks };
  }
}

async function listRows<T>(db: D1Database, sql: string, binds: unknown[] = []): Promise<T[]> {
  const result = await db.prepare(sql).bind(...binds).all<T>();
  return result.results ?? [];
}

async function listScalarStrings(db: D1Database, sql: string): Promise<string[]> {
  const rows = await listRows<Record<string, unknown>>(db, sql);
  return rows
    .map((row) => Object.values(row)[0])
    .filter((value): value is string => typeof value === 'string' && value.length > 0);
}

async function scalar(db: D1Database, sql: string): Promise<number> {
  const row = await db.prepare(sql).first<{ value: number }>();
  return Number(row?.value ?? 0);
}
