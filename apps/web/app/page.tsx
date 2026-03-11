"use client"

import { useEffect, useState } from "react"
import { Scene } from "@/components/scene"
import { OfficePanel } from "@/components/office-panel"
import { OfficeScene } from "@/components/office-scene"
import { HRSidebar, EmployeeCard } from "@/components/hr-sidebar"
import { loadBackendData } from "@/lib/api"
import { fallbackOffices, type Office } from "@/lib/offices"
import { type Employee, type OfficeName } from "@/lib/types"

type ViewMode = "globe" | "office"

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
