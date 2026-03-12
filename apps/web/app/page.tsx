"use client";

import { useEffect, useMemo, useState } from 'react';
import { Scene } from '@/components/scene';
import { OfficePanel } from '@/components/office-panel';
import { OfficeScene } from '@/components/office-scene';
import { HRSidebar, EmployeeCard } from '@/components/hr-sidebar';
import { loadBackendData } from '@/lib/api';
import { fallbackOffices, type Office } from '@/lib/offices';
import { type Employee, type WorkforceFilterOptions, type WorkforceFilters } from '@/lib/types';

type ViewMode = 'globe' | 'office';

const emptyOptions: WorkforceFilterOptions = {
  countries: [],
  cities: [],
  offices: [],
  departments: [],
  seniorities: [],
  statuses: []
};

export default function Home() {
  const [offices, setOffices] = useState<Office[]>(fallbackOffices);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('globe');
  const [showHR, setShowHR] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [filters, setFilters] = useState<WorkforceFilters>({ limit: 5000 });
  const [filterOptions, setFilterOptions] = useState<WorkforceFilterOptions>(emptyOptions);

  useEffect(() => {
    loadBackendData(filters).then((data) => {
      setOffices(data.offices);
      setEmployees(data.employees);
      setFilterOptions(data.filterOptions);
      if (selectedOffice && !data.offices.some((office) => office.name === selectedOffice.name)) {
        setSelectedOffice(null);
        setViewMode('globe');
      }
    });
  }, [filters]);

  const officesByName = useMemo(() => new Map(offices.map((office) => [office.name, office])), [offices]);

  const handleEnterOffice = (office: Office) => {
    setSelectedOffice(office);
    setViewMode('office');
    setFilters((prev) => ({ ...prev, office: office.name }));
  };

  const handleBackToGlobe = () => {
    setViewMode('globe');
    setFilters((prev) => ({ ...prev, office: undefined }));
  };

  const handleFiltersChange = (nextFilters: WorkforceFilters) => {
    setFilters({ ...nextFilters, limit: 5000 });
    if (nextFilters.office && officesByName.has(nextFilters.office)) {
      setSelectedOffice(officesByName.get(nextFilters.office) ?? null);
    }
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black flex">
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

      <div className="flex-1 relative">
        {viewMode === 'globe' ? (
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
                <p className="text-xs text-white/50">Hover to highlight • Click marker to enter office</p>
              </div>
            </div>
          </>
        ) : (
          selectedOffice && <OfficeScene office={selectedOffice} onBack={handleBackToGlobe} employees={employees} />
        )}
      </div>

      {showHR && (
        <div className="flex-shrink-0 pointer-events-auto">
          <HRSidebar
            employees={employees}
            filterOptions={filterOptions}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onSelectEmployee={setSelectedEmployee}
          />
        </div>
      )}

      {selectedEmployee && <EmployeeCard employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />}
    </main>
  );
}
