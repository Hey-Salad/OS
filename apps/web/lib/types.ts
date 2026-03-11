// ─── Department Definitions ────────────────────────────────────────────────────

export const DEPARTMENTS = [
  "Leadership",
  "Financial Management",
  "Sales & Revenue",
  "Marketing & Brand",
  "Product & Innovation",
  "Operations & Execution",
  "People & Culture",
  "Technology & Data",
  "Consumer Experience",
  "Legal & Compliance",
  "Communication",
  "Risk Management",
  "Partnerships & Ecosystem",
  "Adaptability & Learning",
  "Sustainability & Social",
] as const

export type Department = typeof DEPARTMENTS[number]

// ─── Department Colors ─────────────────────────────────────────────────────────

export const DEPARTMENT_COLORS: Record<Department, string> = {
  "Leadership": "#8b5cf6",
  "Financial Management": "#22c55e",
  "Sales & Revenue": "#f97316",
  "Marketing & Brand": "#ec4899",
  "Product & Innovation": "#3b82f6",
  "Operations & Execution": "#64748b",
  "People & Culture": "#f43f5e",
  "Technology & Data": "#06b6d4",
  "Consumer Experience": "#eab308",
  "Legal & Compliance": "#6366f1",
  "Communication": "#14b8a6",
  "Risk Management": "#ef4444",
  "Partnerships & Ecosystem": "#84cc16",
  "Adaptability & Learning": "#a855f7",
  "Sustainability & Social": "#10b981",
}

// ─── Office Definitions ────────────────────────────────────────────────────────

export const OFFICES = [
  "San Francisco",
  "New York",
  "London",
  "Tallinn",
  "Zambia",
] as const

export type OfficeName = typeof OFFICES[number]

// ─── Employee Status ───────────────────────────────────────────────────────────

export type EmployeeStatus = "active" | "on-leave" | "remote" | "traveling"

// ─── Employee Seniority ────────────────────────────────────────────────────────

export type Seniority = "Junior" | "Mid" | "Senior" | "Lead" | "Manager" | "Director" | "VP" | "C-Level"

// ─── Employee Interface ────────────────────────────────────────────────────────

export interface Employee {
  id: string                    // Format: HS-XXXX (HeySalad employee number)
  firstName: string
  lastName: string
  email: string
  department: Department
  role: string
  seniority: Seniority
  office: OfficeName
  status: EmployeeStatus
  startDate: string             // ISO date string
  reportsTo: string | null      // Employee ID of manager
  avatar?: string               // Optional avatar URL
  skills: string[]
  bio?: string
}

// ─── Office with Employees ─────────────────────────────────────────────────────

export interface Office {
  name: OfficeName
  country: string
  lat: number
  lng: number
  description: string
  team: number
  color: string
  timezone: string
  address: string
}

// ─── Department Summary ────────────────────────────────────────────────────────

export interface DepartmentSummary {
  name: Department
  headcount: number
  color: string
  lead?: Employee
}

// ─── Office Summary ────────────────────────────────────────────────────────────

export interface OfficeSummary {
  name: OfficeName
  country: string
  headcount: number
  departments: DepartmentSummary[]
}
