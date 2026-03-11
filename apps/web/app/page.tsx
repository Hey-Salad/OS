"use client"

import { useEffect, useState } from "react"
import { Scene } from "@/components/scene"
import { OfficePanel } from "@/components/office-panel"
import { OfficeScene } from "@/components/office-scene"
import { HRSidebar, EmployeeCard } from "@/components/hr-sidebar"
import { ClientErrorBoundary } from "@/components/client-error-boundary"
import { loadBackendData } from "@/lib/api"
import { fallbackOffices, type Office } from "@/lib/offices"
import { type Employee, type OfficeName } from "@/lib/types"

type ViewMode = "globe" | "office"

function SceneFallback({ offices, employees }: { offices: Office[]; employees: Employee[] }) {
  return (
    <div className="h-full w-full overflow-auto bg-black text-white p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">HeySalad OS</h1>
          <p className="text-sm text-white/60">3D view failed to load on this client. Showing a safe fallback.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {offices.map((office) => {
            const officeEmployees = employees.filter((employee) => employee.office === office.name)
            return (
              <div key={office.name} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-medium">{office.name}</h2>
                    <p className="text-xs text-white/50">{office.country}</p>
                  </div>
                  <div className="text-sm text-white/70">{officeEmployees.length || office.team} people</div>
                </div>

                {officeEmployees.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm text-white/80">
                    {officeEmployees.slice(0, 8).map((employee) => (
                      <li key={employee.id} className="flex items-center justify-between gap-3 rounded-lg bg-black/20 px-3 py-2">
                        <span>{employee.firstName} {employee.lastName}</span>
                        <span className="text-xs text-white/50">{employee.role}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-white/50">No live team members loaded for this office yet.</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [offices, setOffices] = useState<Office[]>(fallbackOffices)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("globe")
  const [showHR, setShowHR] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  useEffect(() => {
    loadBackendData().then((data) => {
      setOffices(data.offices)
      setEmployees(data.employees)
    })
  }, [])

  // Click on globe marker OR sidebar button -> enter office immediately
  const handleEnterOffice = (office: Office) => {
    setSelectedOffice(office)
    setViewMode("office")
  }

  const handleBackToGlobe = () => {
    setViewMode("globe")
  }

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black flex">
      {/* Left Panel - Fixed width */}
      <div className="w-80 flex-shrink-0 pointer-events-auto">
        <OfficePanel 
          offices={offices}
          hoveredOffice={selectedOffice} 
          onSelectOffice={setSelectedOffice}
          onEnterOffice={() => selectedOffice && handleEnterOffice(selectedOffice)}
          viewMode={viewMode}
          showHR={showHR}
          onToggleHR={() => setShowHR(!showHR)}
        />
      </div>

      {/* Center Content Area */}
      <div className="flex-1 relative">
        <ClientErrorBoundary fallback={<SceneFallback offices={offices} employees={employees} />}>
          {viewMode === "globe" ? (
            <>
              <div className="absolute inset-0">
                <Scene 
                  offices={offices}
                  onHoverOffice={setSelectedOffice} 
                  onEnterOffice={handleEnterOffice}
                  hoveredOffice={selectedOffice} 
                />
              </div>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                  <p className="text-xs text-white/50">
                    Hover to highlight • Click marker to enter office
                  </p>
                </div>
              </div>
            </>
          ) : (
            selectedOffice && (
              <OfficeScene office={selectedOffice} onBack={handleBackToGlobe} employees={employees} />
            )
          )}
        </ClientErrorBoundary>
      </div>

      {/* HR Sidebar - Right side */}
      {showHR && (
        <div className="flex-shrink-0 pointer-events-auto">
          <HRSidebar 
            selectedOffice={viewMode === "office" && selectedOffice ? selectedOffice.name as OfficeName : null}
            employeesOverride={employees}
            onSelectEmployee={setSelectedEmployee}
          />
        </div>
      )}

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <EmployeeCard 
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </main>
  )
}
