import { employees as generatedEmployees } from './employees';
import { type Employee, type Office, type EmployeeStatus, type WorkforceFilters, type WorkforceFilterOptions } from './types';
import { fallbackOffices } from './offices';

interface ApiOrgOfficeRecord {
  id: string;
  name: string;
  city: string | null;
  country: string;
  country_code: string | null;
  flag: string | null;
  lat: number | null;
  lng: number | null;
  office_type: string;
  total_agents: number;
  active_agents: number;
}

interface ApiWorkforceRecord {
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
}

interface ApiOrgSummary {
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

export interface BackendDataPayload {
  offices: Office[];
  employees: Employee[];
  filterOptions: WorkforceFilterOptions;
  summary: ApiOrgSummary['counts'] | null;
}

export async function loadBackendData(filters: WorkforceFilters = {}): Promise<BackendDataPayload> {
  try {
    const officeParams = new URLSearchParams();
    if (filters.country) officeParams.set('country', filters.country);
    if (filters.city) officeParams.set('city', filters.city);

    const workforceParams = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...filters, limit: filters.limit ?? 5000 })) {
      if (typeof value === 'string' && value.trim()) workforceParams.set(key, value);
      if (typeof value === 'number') workforceParams.set(key, String(value));
    }

    const [officesRes, workforceRes, filtersRes, summaryRes] = await Promise.all([
      fetch(buildApiUrl(`/api/org/offices${officeParams.toString() ? `?${officeParams.toString()}` : ''}`), { cache: 'no-store' }),
      fetch(buildApiUrl(`/api/org/workforce?${workforceParams.toString()}`), { cache: 'no-store' }),
      fetch(buildApiUrl('/api/org/filters'), { cache: 'no-store' }),
      fetch(buildApiUrl('/api/org/summary'), { cache: 'no-store' })
    ]);

    const officeRecords = officesRes.ok ? ((await officesRes.json()) as ApiOrgOfficeRecord[]) : [];
    const workforceRecords = workforceRes.ok ? ((await workforceRes.json()) as ApiWorkforceRecord[]) : [];
    const filterOptions = filtersRes.ok
      ? ((await filtersRes.json()) as WorkforceFilterOptions)
      : { countries: [], cities: [], offices: [], departments: [], seniorities: [], statuses: [] };
    const summary = summaryRes.ok ? ((await summaryRes.json()) as ApiOrgSummary).counts : null;

    const backendEmployees = mapWorkforce(workforceRecords);
    const employees = backendEmployees.length > 0 ? backendEmployees : generatedEmployees;
    const offices = mapOffices(officeRecords, employees);

    return {
      offices: offices.length > 0 ? offices : fallbackOffices.map((office) => ({ ...office, team: employees.filter((employee) => officeMatchesEmployee(office.name, employee)).length || office.team })),
      employees,
      filterOptions,
      summary
    };
  } catch {
    return {
      offices: fallbackOffices.map((office) => ({ ...office, team: generatedEmployees.filter((employee) => officeMatchesEmployee(office.name, employee)).length || office.team })),
      employees: generatedEmployees,
      filterOptions: { countries: [], cities: [], offices: [], departments: [], seniorities: [], statuses: [] },
      summary: null
    };
  }
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const configuredBase = readConfiguredApiBase();

  if (configuredBase) {
    return `${configuredBase}${normalizedPath}`;
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    if (hostname === 'cloud-os.heysalad.app') {
      return `${protocol}//api-cloud-os.heysalad.app${normalizedPath}`;
    }
  }

  return normalizedPath;
}

function readConfiguredApiBase(): string | null {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  return value ? value.replace(/\/$/, '') : null;
}

function mapOffices(records: ApiOrgOfficeRecord[], employees: Employee[]): Office[] {
  return records
    .filter((record) => typeof record.lat === 'number' && typeof record.lng === 'number')
    .map((record, index) => ({
      id: record.id,
      name: record.name,
      country: record.country,
      city: record.city ?? undefined,
      flag: record.flag ?? flagFromIso2(record.country_code),
      lat: record.lat ?? 0,
      lng: record.lng ?? 0,
      description: record.city ? `${record.city} · ${record.office_type}` : record.office_type,
      team: employees.filter((employee) => officeMatchesEmployee(record.name, employee)).length || record.total_agents || 0,
      color: fallbackColor(index)
    }));
}

function mapWorkforce(records: ApiWorkforceRecord[]): Employee[] {
  return records.map((record) => {
    const metadata = parseJson(record.metadata_json);
    const nameParts = splitName(record.name);
    const city = record.city_name ?? firstString(metadata, ['city']) ?? 'Unknown';
    const country = record.country_name ?? firstString(metadata, ['country']) ?? 'Unknown';

    return {
      id: record.id,
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      email: firstString(metadata, ['email']) ?? `${slugify(nameParts.firstName)}.${slugify(nameParts.lastName)}@heysalad.app`,
      department: record.department_name ?? 'Operations & Execution',
      role: record.role ?? 'AI Agent',
      seniority: record.seniority_band ?? 'Mid',
      office: record.office_name ?? 'Unassigned Office',
      city,
      country,
      status: normalizeStatus(record.status),
      startDate: firstString(metadata, ['startDate', 'start_date']) ?? new Date().toISOString().slice(0, 10),
      reportsTo: record.reports_to_name ?? record.reports_to_agent_id,
      skills: parseSkills(record.skills_json),
      bio: firstString(metadata, ['bio']) ?? `Autonomous agent in ${country}`,
      metadata: metadata ?? undefined
    };
  });
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const [firstName = 'Agent', ...rest] = fullName.trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') || 'Worker' };
}

function normalizeStatus(status: string | null | undefined): EmployeeStatus {
  const value = (status ?? '').toLowerCase();
  if (value === 'active' || value === 'idle' || value === 'offline' || value === 'degraded' || value === 'approvals') return value;
  if (value === 'remote') return 'remote';
  if (value === 'on-leave') return 'on-leave';
  if (value === 'traveling') return 'traveling';
  return 'active';
}

function parseSkills(value?: string | null): string[] {
  if (!value) return ['Automation', 'Operations'];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : ['Automation', 'Operations'];
  } catch {
    return ['Automation', 'Operations'];
  }
}

function parseJson(value?: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function firstString(source: Record<string, unknown> | null, keys: string[]): string | null {
  if (!source) return null;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '.');
}

function fallbackColor(index: number): string {
  return ['#ed4c4c', '#fe6c60', '#faa09a', '#ffd0cd', '#8b5cf6', '#06b6d4', '#22c55e'][index % 7];
}

function officeMatchesEmployee(officeName: string, employee: Employee): boolean {
  if (employee.office === officeName) return true;
  if (officeName === 'Zambia') return employee.country === 'Zambia' || employee.office === 'Lusaka';
  if (officeName === 'Lusaka') return employee.country === 'Zambia' || employee.office === 'Zambia';
  return false;
}

function flagFromIso2(countryCode?: string | null): string {
  if (!countryCode || countryCode.length !== 2) return '🏢';
  const codePoints = countryCode.toUpperCase().split('').map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
