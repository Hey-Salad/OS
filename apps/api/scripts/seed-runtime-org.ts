import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as employeeModule from '../../web/lib/employees.ts';

const employees = ((employeeModule as unknown as { employees?: unknown; default?: { employees?: unknown } }).employees ??
  (employeeModule as unknown as { default?: { employees?: unknown } }).default?.employees) as Array<{
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  role: string;
  seniority: string;
  office: string;
  status: string;
  startDate: string;
  reportsTo: string | null;
  skills: string[];
  avatar?: string;
  bio?: string;
}>;

if (!Array.isArray(employees)) {
  throw new Error('Failed to load employees from apps/web/lib/employees.ts');
}

const now = new Date().toISOString();
const missionId = 'mission-heysalad-os';

const offices = [
  {
    id: 'office-san-francisco',
    name: 'San Francisco',
    city: 'San Francisco',
    country: 'United States',
    country_code: 'US',
    flag: '🇺🇸',
    lat: 37.7749,
    lng: -122.4194,
    office_type: 'hq',
    provider: null,
    region_code: 'us-west',
  },
  {
    id: 'office-new-york',
    name: 'New York',
    city: 'New York',
    country: 'United States',
    country_code: 'US',
    flag: '🇺🇸',
    lat: 40.7128,
    lng: -74.006,
    office_type: 'hub',
    provider: null,
    region_code: 'us-east',
  },
  {
    id: 'office-london',
    name: 'London',
    city: 'London',
    country: 'United Kingdom',
    country_code: 'GB',
    flag: '🇬🇧',
    lat: 51.5074,
    lng: -0.1278,
    office_type: 'hub',
    provider: null,
    region_code: 'eu-west',
  },
  {
    id: 'office-tallinn',
    name: 'Tallinn',
    city: 'Tallinn',
    country: 'Estonia',
    country_code: 'EE',
    flag: '🇪🇪',
    lat: 59.437,
    lng: 24.7536,
    office_type: 'engineering',
    provider: null,
    region_code: 'eu-north',
  },
  {
    id: 'office-zambia',
    name: 'Zambia',
    city: 'Lusaka',
    country: 'Zambia',
    country_code: 'ZM',
    flag: '🇿🇲',
    lat: -15.3875,
    lng: 28.3228,
    office_type: 'regional_hub',
    provider: null,
    region_code: 'af-south',
  },
] as const;

const officeIdByName = Object.fromEntries(offices.map((office) => [office.name, office.id]));
const runtimeStatus = (status: string) => {
  if (status === 'active') return 'active';
  if (status === 'remote') return 'idle';
  if (status === 'traveling') return 'degraded';
  return 'offline';
};
const sql = (value: unknown): string => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
};

const statements: string[] = [
  'PRAGMA foreign_keys = OFF;',
  'BEGIN TRANSACTION;',
  'DELETE FROM activity_events;',
  'DELETE FROM approval_decision_queue;',
  'DELETE FROM runtime_approvals;',
  'DELETE FROM runtime_sessions;',
  'DELETE FROM runtime_agents;',
  'DELETE FROM runtime_sync_log;',
  'DELETE FROM missions;',
  'DELETE FROM offices;',
  `INSERT INTO missions (id, name, objective, status, operator_name, progress, metadata_json, created_at, updated_at) VALUES (${sql(missionId)}, ${sql('HeySalad OS Workforce')}, ${sql('Operate a 300-agent company distributed across five offices and fifteen departments.')}, ${sql('healthy')}, ${sql('HeySalad OS')}, 82, ${sql(JSON.stringify({ workforceType: 'employee-agents', headcount: employees.length }))}, ${sql(now)}, ${sql(now)});`,
];

for (const office of offices) {
  statements.push(
    `INSERT INTO offices (id, name, city, country, country_code, flag, lat, lng, office_type, provider, region_code, active, created_at, updated_at) VALUES (${sql(office.id)}, ${sql(office.name)}, ${sql(office.city)}, ${sql(office.country)}, ${sql(office.country_code)}, ${sql(office.flag)}, ${sql(office.lat)}, ${sql(office.lng)}, ${sql(office.office_type)}, ${sql(office.provider)}, ${sql(office.region_code)}, 1, ${sql(now)}, ${sql(now)});`
  );
}

for (const employee of employees) {
  const metadata = {
    office: employee.office,
    officeId: officeIdByName[employee.office],
    department: employee.department,
    seniority: employee.seniority,
    email: employee.email,
    startDate: employee.startDate,
    reportsTo: employee.reportsTo,
    employeeId: employee.id,
    avatar: employee.avatar ?? null,
    bio: employee.bio ?? null,
    status: employee.status,
    kind: 'employee-agent',
  };
  const throughput = employee.status === 'active' ? 72 : employee.status === 'remote' ? 61 : employee.status === 'traveling' ? 54 : 38;
  const backlog = employee.status === 'active' ? 2 : employee.status === 'remote' ? 4 : 6;
  statements.push(
    `INSERT INTO runtime_agents (id, name, role, owner, status, mission_id, current_session_id, skills_json, throughput, backlog, last_heartbeat_at, source, metadata_json, created_at, updated_at) VALUES (${sql(`agent-${employee.id.toLowerCase()}`)}, ${sql(`${employee.firstName} ${employee.lastName}`)}, ${sql(employee.role)}, ${sql('Peter')}, ${sql(runtimeStatus(employee.status))}, ${sql(missionId)}, NULL, ${sql(JSON.stringify(employee.skills))}, ${sql(throughput)}, ${sql(backlog)}, ${sql(now)}, ${sql('seed-runtime-org')}, ${sql(JSON.stringify(metadata))}, ${sql(now)}, ${sql(now)});`
  );
}

statements.push(
  `INSERT INTO runtime_sync_log (id, source, agent_count, session_count, approval_count, activity_count, happened_at, metadata_json) VALUES (${sql('sync-seed-runtime-org')}, ${sql('seed-runtime-org')}, ${sql(employees.length)}, 0, 0, 0, ${sql(now)}, ${sql(JSON.stringify({ offices: offices.length, headcount: employees.length }))});`,
  'COMMIT;',
  'PRAGMA foreign_keys = ON;'
);

const outputPath = resolve(process.cwd(), 'apps/api/scripts/generated-runtime-org.sql');
writeFileSync(outputPath, `${statements.join('\n')}\n`, 'utf8');
console.log(`Wrote ${outputPath} with ${employees.length} runtime agents across ${offices.length} offices.`);
