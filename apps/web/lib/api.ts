import type { Employee, Department, OfficeName, Seniority, EmployeeStatus } from './types'
import { fallbackOffices, type Office } from './offices'

interface ApiOfficeRecord {
  id: string
  name: string
  city: string | null
  country: string | null
  country_code: string | null
  flag: string | null
  lat: number | null
  lng: number | null
}

interface ApiEmployeeRecord {
  id: string
  name: string
  title: string | null
  office_id: string | null
  status: string | null
}

interface RuntimeAgentRecord {
  id: string
  name: string
  role: string | null
  owner: string | null
  status: string | null
  mission_id: string | null
  skills_json: string | null
  metadata_json: string | null
}

export async function loadBackendData(): Promise<{ offices: Office[]; employees: Employee[] }> {
  try {
    const [officesRes, employeesRes, agentsRes] = await Promise.all([
      fetch(buildApiUrl('/api/offices'), { cache: 'no-store' }),
      fetch(buildApiUrl('/api/employees'), { cache: 'no-store' }),
      fetch(buildApiUrl('/api/agents'), { cache: 'no-store' }),
    ])

    const officeRecords = officesRes.ok ? ((await officesRes.json()) as ApiOfficeRecord[]) : []
    const employeeRecords = employeesRes.ok ? ((await employeesRes.json()) as ApiEmployeeRecord[]) : []
    const agentRecords = agentsRes.ok ? ((await agentsRes.json()) as RuntimeAgentRecord[]) : []

    const offices = mapOffices(officeRecords)
    const officeById = new Map(officeRecords.map((office) => [office.id, office]))
    const dbEmployees = mapEmployees(employeeRecords, officeById)
    const runtimeEmployees = mapRuntimeAgents(agentRecords)
    const mergedEmployees = mergeEmployees(dbEmployees, runtimeEmployees)

    return {
      offices: offices.length > 0 ? decorateOffices(offices, mergedEmployees) : decorateOffices(fallbackOffices, mergedEmployees),
      employees: mergedEmployees,
    }
  } catch {
    return {
      offices: fallbackOffices,
      employees: [],
    }
  }
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const configuredBase = readConfiguredApiBase()

  if (configuredBase) {
    return `${configuredBase}${normalizedPath}`
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location
    if (hostname === 'cloud-os.heysalad.app') {
      return `${protocol}//api-cloud-os.heysalad.app${normalizedPath}`
    }
  }

  return normalizedPath
}

function readConfiguredApiBase(): string | null {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
  return value ? value.replace(/\/$/, '') : null
}

function mapOffices(records: ApiOfficeRecord[]): Office[] {
  return records
    .filter((record) => typeof record.lat === 'number' && typeof record.lng === 'number')
    .map((record, index) => ({
      name: record.name,
      country: record.country ?? 'Unknown',
      flag: record.flag ?? fallbackFlag(record.country_code),
      lat: record.lat ?? 0,
      lng: record.lng ?? 0,
      description: record.city ? `${record.city} office` : 'Cloud office',
      team: 0,
      color: fallbackColor(index),
    }))
}

function mapEmployees(records: ApiEmployeeRecord[], officeById: Map<string, ApiOfficeRecord>): Employee[] {
  return records
    .map((record) => {
      const office = record.office_id ? officeById.get(record.office_id) : null
      const [firstName = 'AI', ...rest] = (record.name || 'AI Employee').split(' ')
      const lastName = rest.join(' ') || 'Employee'
      return {
        id: record.id,
        firstName,
        lastName,
        email: `${slugify(firstName)}.${slugify(lastName)}@heysalad.app`,
        department: 'Technology & Data',
        role: record.title ?? 'AI Employee',
        seniority: 'Mid',
        office: normalizeOfficeName(office?.name),
        status: normalizeStatus(record.status),
        startDate: new Date().toISOString().slice(0, 10),
        reportsTo: null,
        skills: ['Automation', 'Operations'],
      } satisfies Employee
    })
    .filter(Boolean)
}

function mapRuntimeAgents(records: RuntimeAgentRecord[]): Employee[] {
  return records.map((record, index) => {
    const [firstName = 'Agent', ...rest] = (record.name || `Agent ${index + 1}`).split(' ')
    const lastName = rest.join(' ') || 'Worker'
    const office = deriveOffice(record, index)
    const department = deriveDepartment(record)
    return {
      id: record.id,
      firstName,
      lastName,
      email: `${slugify(firstName)}.${slugify(lastName)}@heysalad.app`,
      department,
      role: record.role ?? 'AI Agent',
      seniority: deriveSeniority(record.role),
      office,
      status: normalizeRuntimeStatus(record.status),
      startDate: new Date().toISOString().slice(0, 10),
      reportsTo: null,
      skills: parseSkills(record.skills_json),
      bio: record.owner ?? 'OpenClaw runtime agent',
    }
  })
}

function mergeEmployees(primary: Employee[], runtime: Employee[]): Employee[] {
  const merged = new Map<string, Employee>()
  for (const employee of primary) merged.set(employee.id, employee)
  for (const employee of runtime) merged.set(employee.id, employee)
  return Array.from(merged.values())
}

function decorateOffices(offices: Office[], employees: Employee[]): Office[] {
  return offices.map((office) => ({
    ...office,
    team: employees.filter((employee) => employee.office === office.name).length || office.team,
  }))
}

function deriveOffice(record: RuntimeAgentRecord, index: number): OfficeName {
  const metadata = parseJson(record.metadata_json)
  const office = metadata?.office ?? metadata?.officeName ?? metadata?.office_name
  return normalizeOfficeName(typeof office === 'string' ? office : null, index)
}

function deriveDepartment(record: RuntimeAgentRecord): Department {
  const role = (record.role ?? '').toLowerCase()
  if (role.includes('design')) return 'Product & Innovation'
  if (role.includes('finance')) return 'Financial Management'
  if (role.includes('sales')) return 'Sales & Revenue'
  if (role.includes('legal')) return 'Legal & Compliance'
  if (role.includes('ops') || role.includes('operator')) return 'Operations & Execution'
  return 'Technology & Data'
}

function deriveSeniority(role?: string | null): Seniority {
  const value = (role ?? '').toLowerCase()
  if (value.includes('chief') || value.includes('lead')) return 'Lead'
  if (value.includes('manager')) return 'Manager'
  return 'Mid'
}

function normalizeOfficeName(name?: string | null, index = 0): OfficeName {
  const allowed: OfficeName[] = ['San Francisco', 'New York', 'London', 'Tallinn', 'Zambia']
  if (name && allowed.includes(name as OfficeName)) return name as OfficeName
  return allowed[index % allowed.length]
}

function normalizeStatus(status?: string | null): EmployeeStatus {
  if (status === 'remote' || status === 'on-leave' || status === 'traveling' || status === 'active') {
    return status
  }
  return 'active'
}

function normalizeRuntimeStatus(status?: string | null): EmployeeStatus {
  if (status === 'offline') return 'on-leave'
  if (status === 'idle') return 'remote'
  if (status === 'degraded') return 'traveling'
  return 'active'
}

function fallbackFlag(countryCode?: string | null): string {
  const flags: Record<string, string> = {
    US: '🇺🇸',
    GB: '🇬🇧',
    EE: '🇪🇪',
    ZM: '🇿🇲',
  }
  return countryCode ? flags[countryCode.toUpperCase()] ?? '🏢' : '🏢'
}

function fallbackColor(index: number): string {
  return ['#ed4c4c', '#fe6c60', '#faa09a', '#ffd0cd', '#8b5cf6'][index % 5]
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '.')
}

function parseSkills(value?: string | null): string[] {
  if (!value) return ['Automation', 'Operations']
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : ['Automation', 'Operations']
  } catch {
    return ['Automation', 'Operations']
  }
}

function parseJson(value?: string | null): Record<string, unknown> | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null
  } catch {
    return null
  }
}
