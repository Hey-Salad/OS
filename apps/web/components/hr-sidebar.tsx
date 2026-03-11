"use client"

import { useState, useMemo } from "react"
import { Employee, Department, OfficeName, DEPARTMENTS, DEPARTMENT_COLORS } from "@/lib/types"
import { 
  employees, 
  getEmployeesByOffice, 
  getEmployeesByOfficeAndDepartment,
  searchEmployees,
  getDepartmentStats,
  getStatusStats
} from "@/lib/employees"

interface HRSidebarProps {
  selectedOffice: OfficeName | null
  employeesOverride?: Employee[]
  onSelectEmployee?: (employee: Employee) => void
}

export function HRSidebar({ selectedOffice, employeesOverride, onSelectEmployee }: HRSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [expandedDepartments, setExpandedDepartments] = useState<Set<Department>>(new Set())

  const employeeSource = employeesOverride && employeesOverride.length > 0 ? employeesOverride : employees

  // Filter employees based on office and search
  const filteredEmployees = useMemo(() => {
    let result = selectedOffice ? employeeSource.filter((e) => e.office === selectedOffice) : employeeSource
    
    if (selectedDepartment) {
      result = result.filter(e => e.department === selectedDepartment)
    }
    
    if (searchQuery.trim()) {
      const searchResults = searchEmployees(searchQuery)
      result = result.filter(e => searchResults.includes(e))
    }
    
    return result
  }, [employeeSource, selectedOffice, selectedDepartment, searchQuery])

  // Status stats
  const statusStats = useMemo(() => {
    const filtered = selectedOffice ? employeeSource.filter((e) => e.office === selectedOffice) : employeeSource
    return {
      active: filtered.filter((e) => e.status === 'active').length,
      remote: filtered.filter((e) => e.status === 'remote').length,
      'on-leave': filtered.filter((e) => e.status === 'on-leave').length,
      traveling: filtered.filter((e) => e.status === 'traveling').length,
    }
  }, [employeeSource, selectedOffice])

  // Group employees by department
  const employeesByDept = useMemo(() => {
    const grouped: Record<Department, Employee[]> = {} as Record<Department, Employee[]>
    for (const dept of DEPARTMENTS) {
      grouped[dept] = filteredEmployees.filter(e => e.department === dept)
    }
    return grouped
  }, [filteredEmployees])

  const toggleDepartment = (dept: Department) => {
    const newExpanded = new Set(expandedDepartments)
    if (newExpanded.has(dept)) {
      newExpanded.delete(dept)
    } else {
      newExpanded.add(dept)
    }
    setExpandedDepartments(newExpanded)
  }

  const totalEmployees = selectedOffice
    ? employeeSource.filter((e) => e.office === selectedOffice).length
    : employeeSource.length

  return (
    <div className="w-80 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#ed4c4c]/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#ed4c4c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-white font-semibold">HR Directory</h2>
            <p className="text-white/50 text-xs">
              {selectedOffice ? `${selectedOffice} Office` : "All Offices"}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <p className="text-white font-bold text-lg">{totalEmployees}</p>
            <p className="text-white/40 text-[10px]">Total</p>
          </div>
          <div className="bg-green-500/10 rounded-lg p-2 text-center">
            <p className="text-green-400 font-bold text-lg">{statusStats.active}</p>
            <p className="text-white/40 text-[10px]">Active</p>
          </div>
          <div className="bg-blue-500/10 rounded-lg p-2 text-center">
            <p className="text-blue-400 font-bold text-lg">{statusStats.remote}</p>
            <p className="text-white/40 text-[10px]">Remote</p>
          </div>
          <div className="bg-orange-500/10 rounded-lg p-2 text-center">
            <p className="text-orange-400 font-bold text-lg">{statusStats["on-leave"] + statusStats.traveling}</p>
            <p className="text-white/40 text-[10px]">Away</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, ID, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#ed4c4c]/50"
          />
        </div>
      </div>

      {/* Department List */}
      <div className="flex-1 overflow-y-auto">
        {DEPARTMENTS.map(dept => {
          const deptEmployees = employeesByDept[dept]
          const isExpanded = expandedDepartments.has(dept)
          const deptColor = DEPARTMENT_COLORS[dept]
          
          if (deptEmployees.length === 0) return null

          return (
            <div key={dept} className="border-b border-white/5">
              {/* Department Header */}
              <button
                onClick={() => toggleDepartment(dept)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: deptColor }}
                  />
                  <span className="text-white/80 text-sm font-medium">{dept}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/40 text-xs">{deptEmployees.length}</span>
                  <svg 
                    className={`w-4 h-4 text-white/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Employees List */}
              {isExpanded && (
                <div className="pb-2">
                  {deptEmployees.map(employee => (
                    <button
                      key={employee.id}
                      onClick={() => onSelectEmployee?.(employee)}
                      className="w-full px-4 py-2 flex items-center gap-3 hover:bg-white/5 transition-colors"
                    >
                      {/* Avatar */}
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                        style={{ backgroundColor: deptColor + '40' }}
                      >
                        {employee.firstName[0]}{employee.lastName[0]}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-white/90 text-sm font-medium truncate">
                          {employee.firstName} {employee.lastName}
                        </p>
                        <p className="text-white/40 text-xs truncate">{employee.role}</p>
                      </div>

                      {/* Status indicator */}
                      <div className={`w-2 h-2 rounded-full ${
                        employee.status === 'active' ? 'bg-green-400' :
                        employee.status === 'remote' ? 'bg-blue-400' :
                        employee.status === 'traveling' ? 'bg-yellow-400' :
                        'bg-gray-400'
                      }`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        <p className="text-white/40 text-xs text-center">
          Showing {filteredEmployees.length} of {totalEmployees} employees
        </p>
      </div>
    </div>
  )
}

// ─── Employee Detail Card ──────────────────────────────────────────────────────

interface EmployeeCardProps {
  employee: Employee
  onClose: () => void
}

export function EmployeeCard({ employee, onClose }: EmployeeCardProps) {
  const deptColor = DEPARTMENT_COLORS[employee.department]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div 
          className="p-6 relative"
          style={{ backgroundColor: deptColor + '20' }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: deptColor }}
            >
              {employee.firstName[0]}{employee.lastName[0]}
            </div>
            <div>
              <h3 className="text-white text-xl font-bold">
                {employee.firstName} {employee.lastName}
              </h3>
              <p className="text-white/70">{employee.role}</p>
              <p className="text-white/50 text-sm">{employee.department}</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/40 text-xs uppercase mb-1">Employee ID</p>
              <p className="text-white font-mono">{employee.id}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs uppercase mb-1">Office</p>
              <p className="text-white">{employee.office}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs uppercase mb-1">Seniority</p>
              <p className="text-white">{employee.seniority}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs uppercase mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  employee.status === 'active' ? 'bg-green-400' :
                  employee.status === 'remote' ? 'bg-blue-400' :
                  employee.status === 'traveling' ? 'bg-yellow-400' :
                  'bg-gray-400'
                }`} />
                <p className="text-white capitalize">{employee.status}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-white/40 text-xs uppercase mb-1">Email</p>
            <p className="text-white">{employee.email}</p>
          </div>

          <div>
            <p className="text-white/40 text-xs uppercase mb-1">Start Date</p>
            <p className="text-white">{new Date(employee.startDate).toLocaleDateString('en-US', { 
              year: 'numeric', month: 'long', day: 'numeric' 
            })}</p>
          </div>

          <div>
            <p className="text-white/40 text-xs uppercase mb-2">Skills</p>
            <div className="flex flex-wrap gap-2">
              {employee.skills.map(skill => (
                <span 
                  key={skill}
                  className="px-2 py-1 rounded-full text-xs"
                  style={{ backgroundColor: deptColor + '30', color: deptColor }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-white/10 flex gap-3">
          <button className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-sm transition-colors">
            View Org Chart
          </button>
          <button 
            className="flex-1 text-white py-2 rounded-lg text-sm transition-colors"
            style={{ backgroundColor: deptColor }}
          >
            Send Message
          </button>
        </div>
      </div>
    </div>
  )
}
