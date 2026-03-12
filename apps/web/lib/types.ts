export const DEPARTMENTS = [
  'Leadership',
  'Financial Management',
  'Sales & Revenue',
  'Marketing & Brand',
  'Product & Innovation',
  'Operations & Execution',
  'People & Culture',
  'Technology & Data',
  'Consumer Experience',
  'Legal & Compliance',
  'Communication',
  'Risk Management',
  'Partnerships & Ecosystem',
  'Adaptability & Learning',
  'Sustainability & Social'
] as const;

export type Department = string;

export const DEPARTMENT_COLORS: Record<string, string> = {
  Leadership: '#8b5cf6',
  'Financial Management': '#22c55e',
  'Sales & Revenue': '#f97316',
  'Marketing & Brand': '#ec4899',
  'Product & Innovation': '#3b82f6',
  'Operations & Execution': '#64748b',
  'People & Culture': '#f43f5e',
  'Technology & Data': '#06b6d4',
  'Consumer Experience': '#eab308',
  'Legal & Compliance': '#6366f1',
  Communication: '#14b8a6',
  'Risk Management': '#ef4444',
  'Partnerships & Ecosystem': '#84cc16',
  'Adaptability & Learning': '#a855f7',
  'Sustainability & Social': '#10b981'
};

export type OfficeName = string;

export type EmployeeStatus = 'active' | 'on-leave' | 'remote' | 'traveling' | 'idle' | 'degraded' | 'offline' | 'approvals';

export type Seniority = string;

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: Department;
  role: string;
  seniority: Seniority;
  office: OfficeName;
  city: string;
  country: string;
  status: EmployeeStatus;
  startDate: string;
  reportsTo: string | null;
  avatar?: string;
  skills: string[];
  bio?: string;
  metadata?: Record<string, unknown>;
}

export interface Office {
  id?: string;
  name: OfficeName;
  country: string;
  city?: string;
  flag: string;
  lat: number;
  lng: number;
  description: string;
  team: number;
  color: string;
  timezone?: string;
  address?: string;
}

export interface DepartmentSummary {
  name: Department;
  headcount: number;
  color: string;
  lead?: Employee;
}

export interface OfficeSummary {
  name: OfficeName;
  country: string;
  headcount: number;
  departments: DepartmentSummary[];
}

export interface WorkforceFilters {
  country?: string;
  city?: string;
  office?: string;
  department?: string;
  seniority?: string;
  status?: string;
  limit?: number;
}

export interface WorkforceFilterOptions {
  countries: string[];
  cities: string[];
  offices: string[];
  departments: string[];
  seniorities: string[];
  statuses: string[];
}
