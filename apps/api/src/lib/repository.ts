import { createId, nowIso } from './ids';
import type { EmployeeRecord, EntityRepository, OfficeRecord, ProjectRecord, TaskRecord } from '../types';

export function createRepository(db?: D1Database): EntityRepository {
  if (db) {
    return new D1EntityRepository(db);
  }
  return getMemoryRepository();
}

class MemoryEntityRepository implements EntityRepository {
  private offices: OfficeRecord[] = [];
  private employees: EmployeeRecord[] = [];
  private projects: ProjectRecord[] = [];
  private tasks: TaskRecord[] = [];

  async listOffices(): Promise<OfficeRecord[]> {
    return [...this.offices];
  }

  async createOffice(input: Partial<OfficeRecord>): Promise<OfficeRecord> {
    const record: OfficeRecord = {
      id: input.id ?? createId('office'),
      name: input.name ?? 'Untitled office',
      city: input.city ?? null,
      country: input.country ?? 'Unknown',
      country_code: input.country_code ?? null,
      flag: input.flag ?? null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      office_type: input.office_type ?? 'cloud_region',
      provider: input.provider ?? null,
      region_code: input.region_code ?? null,
      active: input.active ?? 1,
      created_at: input.created_at ?? nowIso(),
      updated_at: input.updated_at ?? nowIso()
    };
    this.offices.unshift(record);
    return record;
  }

  async listEmployees(): Promise<EmployeeRecord[]> {
    return [...this.employees];
  }

  async createEmployee(input: Partial<EmployeeRecord>): Promise<EmployeeRecord> {
    const record: EmployeeRecord = {
      id: input.id ?? createId('employee'),
      name: input.name ?? 'Unnamed employee',
      title: input.title ?? null,
      team_id: input.team_id ?? null,
      office_id: input.office_id ?? null,
      status: input.status ?? 'active',
      model_provider: input.model_provider ?? 'openai',
      model_name: input.model_name ?? 'gpt-5-mini',
      budget_daily_usd: input.budget_daily_usd ?? 0,
      budget_monthly_usd: input.budget_monthly_usd ?? 0,
      persona_json: input.persona_json ?? null,
      capabilities_json: input.capabilities_json ?? null,
      active: input.active ?? 1,
      created_at: input.created_at ?? nowIso(),
      updated_at: input.updated_at ?? nowIso()
    };
    this.employees.unshift(record);
    return record;
  }

  async listProjects(): Promise<ProjectRecord[]> {
    return [...this.projects];
  }

  async createProject(input: Partial<ProjectRecord>): Promise<ProjectRecord> {
    const record: ProjectRecord = {
      id: input.id ?? createId('project'),
      name: input.name ?? 'Untitled project',
      description: input.description ?? null,
      status: input.status ?? 'active',
      owner_employee_id: input.owner_employee_id ?? null,
      budget_total_usd: input.budget_total_usd ?? 0,
      budget_monthly_usd: input.budget_monthly_usd ?? 0,
      created_at: input.created_at ?? nowIso(),
      updated_at: input.updated_at ?? nowIso()
    };
    this.projects.unshift(record);
    return record;
  }

  async listTasks(): Promise<TaskRecord[]> {
    return [...this.tasks];
  }

  async createTask(input: Partial<TaskRecord>): Promise<TaskRecord> {
    const record: TaskRecord = {
      id: input.id ?? createId('task'),
      project_id: input.project_id ?? null,
      assigned_employee_id: input.assigned_employee_id ?? null,
      title: input.title ?? 'Untitled task',
      description: input.description ?? null,
      status: input.status ?? 'backlog',
      priority: input.priority ?? 'medium',
      blocked_reason: input.blocked_reason ?? null,
      due_at: input.due_at ?? null,
      created_at: input.created_at ?? nowIso(),
      updated_at: input.updated_at ?? nowIso()
    };
    this.tasks.unshift(record);
    return record;
  }
}

class D1EntityRepository implements EntityRepository {
  constructor(private readonly db: D1Database) {}

  async listOffices(): Promise<OfficeRecord[]> {
    return listRows<OfficeRecord>(this.db, 'SELECT * FROM offices ORDER BY created_at DESC');
  }

  async createOffice(input: Partial<OfficeRecord>): Promise<OfficeRecord> {
    const record: OfficeRecord = {
      id: input.id ?? createId('office'),
      name: input.name ?? 'Untitled office',
      city: input.city ?? null,
      country: input.country ?? 'Unknown',
      country_code: input.country_code ?? null,
      flag: input.flag ?? null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      office_type: input.office_type ?? 'cloud_region',
      provider: input.provider ?? null,
      region_code: input.region_code ?? null,
      active: input.active ?? 1,
      created_at: input.created_at ?? nowIso(),
      updated_at: input.updated_at ?? nowIso()
    };

    await this.db
      .prepare(`INSERT INTO offices (id, name, city, country, country_code, flag, lat, lng, office_type, provider, region_code, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        record.id,
        record.name,
        record.city,
        record.country,
        record.country_code,
        record.flag,
        record.lat,
        record.lng,
        record.office_type,
        record.provider,
        record.region_code,
        record.active,
        record.created_at,
        record.updated_at
      )
      .run();

    return record;
  }

  async listEmployees(): Promise<EmployeeRecord[]> {
    return listRows<EmployeeRecord>(this.db, 'SELECT * FROM employees ORDER BY created_at DESC');
  }

  async createEmployee(input: Partial<EmployeeRecord>): Promise<EmployeeRecord> {
    const record: EmployeeRecord = {
      id: input.id ?? createId('employee'),
      name: input.name ?? 'Unnamed employee',
      title: input.title ?? null,
      team_id: input.team_id ?? null,
      office_id: input.office_id ?? null,
      status: input.status ?? 'active',
      model_provider: input.model_provider ?? 'openai',
      model_name: input.model_name ?? 'gpt-5-mini',
      budget_daily_usd: input.budget_daily_usd ?? 0,
      budget_monthly_usd: input.budget_monthly_usd ?? 0,
      persona_json: input.persona_json ?? null,
      capabilities_json: input.capabilities_json ?? null,
      active: input.active ?? 1,
      created_at: input.created_at ?? nowIso(),
      updated_at: input.updated_at ?? nowIso()
    };

    await this.db
      .prepare(`INSERT INTO employees (id, name, title, team_id, office_id, status, model_provider, model_name, budget_daily_usd, budget_monthly_usd, persona_json, capabilities_json, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        record.id,
        record.name,
        record.title,
        record.team_id,
        record.office_id,
        record.status,
        record.model_provider,
        record.model_name,
        record.budget_daily_usd,
        record.budget_monthly_usd,
        record.persona_json,
        record.capabilities_json,
        record.active,
        record.created_at,
        record.updated_at
      )
      .run();

    return record;
  }

  async listProjects(): Promise<ProjectRecord[]> {
    return listRows<ProjectRecord>(this.db, 'SELECT * FROM projects ORDER BY created_at DESC');
  }

  async createProject(input: Partial<ProjectRecord>): Promise<ProjectRecord> {
    const record: ProjectRecord = {
      id: input.id ?? createId('project'),
      name: input.name ?? 'Untitled project',
      description: input.description ?? null,
      status: input.status ?? 'active',
      owner_employee_id: input.owner_employee_id ?? null,
      budget_total_usd: input.budget_total_usd ?? 0,
      budget_monthly_usd: input.budget_monthly_usd ?? 0,
      created_at: input.created_at ?? nowIso(),
      updated_at: input.updated_at ?? nowIso()
    };

    await this.db
      .prepare(`INSERT INTO projects (id, name, description, status, owner_employee_id, budget_total_usd, budget_monthly_usd, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        record.id,
        record.name,
        record.description,
        record.status,
        record.owner_employee_id,
        record.budget_total_usd,
        record.budget_monthly_usd,
        record.created_at,
        record.updated_at
      )
      .run();

    return record;
  }

  async listTasks(): Promise<TaskRecord[]> {
    return listRows<TaskRecord>(this.db, 'SELECT * FROM tasks ORDER BY created_at DESC');
  }

  async createTask(input: Partial<TaskRecord>): Promise<TaskRecord> {
    const record: TaskRecord = {
      id: input.id ?? createId('task'),
      project_id: input.project_id ?? null,
      assigned_employee_id: input.assigned_employee_id ?? null,
      title: input.title ?? 'Untitled task',
      description: input.description ?? null,
      status: input.status ?? 'backlog',
      priority: input.priority ?? 'medium',
      blocked_reason: input.blocked_reason ?? null,
      due_at: input.due_at ?? null,
      created_at: input.created_at ?? nowIso(),
      updated_at: input.updated_at ?? nowIso()
    };

    await this.db
      .prepare(`INSERT INTO tasks (id, project_id, assigned_employee_id, title, description, status, priority, blocked_reason, due_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        record.id,
        record.project_id,
        record.assigned_employee_id,
        record.title,
        record.description,
        record.status,
        record.priority,
        record.blocked_reason,
        record.due_at,
        record.created_at,
        record.updated_at
      )
      .run();

    return record;
  }
}

let sharedMemoryRepository: MemoryEntityRepository | undefined;

function getMemoryRepository(): MemoryEntityRepository {
  sharedMemoryRepository ??= new MemoryEntityRepository();
  return sharedMemoryRepository;
}

async function listRows<T>(db: D1Database, sql: string): Promise<T[]> {
  const result = await db.prepare(sql).all<T>();
  return result.results ?? [];
}
