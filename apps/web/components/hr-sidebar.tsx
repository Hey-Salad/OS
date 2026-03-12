"use client";

import { useMemo, useState } from 'react';
import { Employee, Department, DEPARTMENT_COLORS, WorkforceFilterOptions, WorkforceFilters } from '@/lib/types';

interface HRSidebarProps {
  employees: Employee[];
  filterOptions: WorkforceFilterOptions;
  filters: WorkforceFilters;
  onFiltersChange: (filters: WorkforceFilters) => void;
  onSelectEmployee?: (employee: Employee) => void;
}

export function HRSidebar({ employees, filterOptions, filters, onFiltersChange, onSelectEmployee }: HRSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());

  const filteredEmployees = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter((employee) => {
      const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
      return (
        fullName.includes(query) ||
        employee.id.toLowerCase().includes(query) ||
        employee.role.toLowerCase().includes(query) ||
        employee.department.toLowerCase().includes(query)
      );
    });
  }, [employees, searchQuery]);

  const statusStats = useMemo(() => {
    const initial = { active: 0, idle: 0, approvals: 0, degraded: 0, offline: 0 };
    for (const employee of employees) {
      const status = employee.status;
      if (status in initial) {
        initial[status as keyof typeof initial] += 1;
      }
    }
    return initial;
  }, [employees]);

  const employeesByDept = useMemo(() => {
    const grouped = new Map<string, Employee[]>();
    for (const employee of filteredEmployees) {
      if (!grouped.has(employee.department)) grouped.set(employee.department, []);
      grouped.get(employee.department)?.push(employee);
    }
    return grouped;
  }, [filteredEmployees]);

  const departments = useMemo(() => Array.from(employeesByDept.keys()).sort((a, b) => a.localeCompare(b)), [employeesByDept]);

  const toggleDepartment = (dept: string) => {
    const next = new Set(expandedDepartments);
    if (next.has(dept)) next.delete(dept);
    else next.add(dept);
    setExpandedDepartments(next);
  };

  return (
    <div className="w-96 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-white/10 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#ed4c4c]/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#ed4c4c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-white font-semibold">Global Workforce</h2>
            <p className="text-white/50 text-xs">Directory, routing, and runtime status</p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          <StatCard label="Total" value={employees.length} tone="white" />
          <StatCard label="Active" value={statusStats.active} tone="green" />
          <StatCard label="Idle" value={statusStats.idle} tone="blue" />
          <StatCard label="Approvals" value={statusStats.approvals} tone="yellow" />
          <StatCard label="Risk" value={statusStats.degraded + statusStats.offline} tone="red" />
        </div>

        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, role, department, ID"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#ed4c4c]/50"
          />
        </div>

        <FilterRow
          label="Country"
          value={filters.country ?? ''}
          options={filterOptions.countries}
          onChange={(value) => onFiltersChange({ ...filters, country: value || undefined, city: undefined, office: undefined })}
        />
        <FilterRow
          label="City"
          value={filters.city ?? ''}
          options={filterOptions.cities}
          onChange={(value) => onFiltersChange({ ...filters, city: value || undefined, office: undefined })}
        />
        <FilterRow
          label="Office"
          value={filters.office ?? ''}
          options={filterOptions.offices}
          onChange={(value) => onFiltersChange({ ...filters, office: value || undefined })}
        />
        <FilterRow
          label="Department"
          value={filters.department ?? ''}
          options={filterOptions.departments}
          onChange={(value) => onFiltersChange({ ...filters, department: value || undefined })}
        />
        <div className="grid grid-cols-2 gap-2">
          <FilterRow
            label="Seniority"
            value={filters.seniority ?? ''}
            options={filterOptions.seniorities}
            onChange={(value) => onFiltersChange({ ...filters, seniority: value || undefined })}
          />
          <FilterRow
            label="Status"
            value={filters.status ?? ''}
            options={filterOptions.statuses}
            onChange={(value) => onFiltersChange({ ...filters, status: value || undefined })}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {departments.map((department) => {
          const deptEmployees = employeesByDept.get(department) ?? [];
          const isExpanded = expandedDepartments.has(department);
          const deptColor = DEPARTMENT_COLORS[department] ?? '#ed4c4c';

          return (
            <div key={department} className="border-b border-white/5">
              <button
                onClick={() => toggleDepartment(department)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: deptColor }} />
                  <span className="text-white/80 text-sm font-medium truncate">{department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/40 text-xs">{deptEmployees.length}</span>
                  <svg className={`w-4 h-4 text-white/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {isExpanded && (
                <div className="pb-2">
                  {deptEmployees.map((employee) => (
                    <button
                      key={employee.id}
                      onClick={() => onSelectEmployee?.(employee)}
                      className="w-full px-4 py-2 flex items-center gap-3 hover:bg-white/5 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ backgroundColor: `${deptColor}40` }}>
                        {employee.firstName[0]}
                        {employee.lastName[0]}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-white/90 text-sm font-medium truncate">{employee.firstName} {employee.lastName}</p>
                        <p className="text-white/40 text-xs truncate">{employee.role} · {employee.office}</p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${statusClass(employee.status)}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/10 bg-black/20">
        <p className="text-white/40 text-xs text-center">Showing {filteredEmployees.length} matched agents</p>
      </div>
    </div>
  );
}

function statusClass(status: Employee['status']): string {
  if (status === 'active') return 'bg-green-400';
  if (status === 'idle' || status === 'remote') return 'bg-blue-400';
  if (status === 'approvals') return 'bg-yellow-400';
  if (status === 'degraded' || status === 'traveling') return 'bg-orange-400';
  return 'bg-gray-400';
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: 'white' | 'green' | 'blue' | 'yellow' | 'red' }) {
  const classes: Record<typeof tone, string> = {
    white: 'bg-white/5 text-white',
    green: 'bg-green-500/10 text-green-400',
    blue: 'bg-blue-500/10 text-blue-400',
    yellow: 'bg-yellow-500/10 text-yellow-300',
    red: 'bg-red-500/10 text-red-400'
  };

  return (
    <div className={`${classes[tone]} rounded-lg p-2 text-center`}>
      <p className="font-bold text-lg leading-none">{value}</p>
      <p className="text-white/40 text-[10px] mt-1">{label}</p>
    </div>
  );
}

function FilterRow({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-[72px_1fr] items-center gap-2">
      <span className="text-white/50 text-xs uppercase tracking-wide">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#ed4c4c]/50"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

interface EmployeeCardProps {
  employee: Employee;
  onClose: () => void;
}

export function EmployeeCard({ employee, onClose }: EmployeeCardProps) {
  const deptColor = DEPARTMENT_COLORS[employee.department] ?? '#ed4c4c';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-6 relative" style={{ backgroundColor: `${deptColor}20` }}>
          <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: deptColor }}>
              {employee.firstName[0]}{employee.lastName[0]}
            </div>
            <div>
              <h3 className="text-white text-xl font-bold">{employee.firstName} {employee.lastName}</h3>
              <p className="text-white/70">{employee.role}</p>
              <p className="text-white/50 text-sm">{employee.department}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Detail label="Employee ID" value={employee.id} mono />
            <Detail label="Office" value={employee.office} />
            <Detail label="City" value={employee.city} />
            <Detail label="Country" value={employee.country} />
            <Detail label="Seniority" value={employee.seniority} />
            <Detail label="Status" value={employee.status} />
          </div>

          <Detail label="Email" value={employee.email} />
          <Detail label="Reports To" value={employee.reportsTo ?? 'Unassigned'} />

          <div>
            <p className="text-white/40 text-xs uppercase mb-2">Skills</p>
            <div className="flex flex-wrap gap-2">
              {employee.skills.map((skill) => (
                <span key={skill} className="px-2 py-1 rounded-full text-xs" style={{ backgroundColor: `${deptColor}30`, color: deptColor }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-white/40 text-xs uppercase mb-1">{label}</p>
      <p className={`text-white ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
