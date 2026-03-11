"use client"

import type { Office } from "@/lib/offices"
import { MapPin, Users, ChevronLeft, ChevronRight, ArrowRight, Globe2, Users2 } from "lucide-react"

interface OfficePanelProps {
  offices: Office[]
  hoveredOffice: Office | null
  onSelectOffice: (office: Office | null) => void
  onEnterOffice: () => void
  viewMode: "globe" | "office"
  showHR: boolean
  onToggleHR: () => void
}

export function OfficePanel({ offices, hoveredOffice, onSelectOffice, onEnterOffice, viewMode, showHR, onToggleHR }: OfficePanelProps) {
  const currentIndex = hoveredOffice ? offices.findIndex((office) => office.name === hoveredOffice.name) : -1

  const goToPrevious = () => {
    const newIndex = currentIndex <= 0 ? offices.length - 1 : currentIndex - 1
    onSelectOffice(offices[newIndex])
  }

  const goToNext = () => {
    const newIndex = currentIndex >= offices.length - 1 ? 0 : currentIndex + 1
    onSelectOffice(offices[newIndex])
  }

  return (
    <div className="h-full p-6 flex flex-col gap-6 overflow-hidden bg-black/40 border-r border-white/5">
      <div className="flex-shrink-0">
        <img src="/heysalad-logo-white.svg" alt="HeySalad" className="h-10 w-auto" />
      </div>

      <div className="grid grid-cols-2 gap-3 flex-shrink-0">
        <button
          onClick={onToggleHR}
          className={`rounded-xl border px-3 py-3 text-left transition-colors ${showHR ? "border-[#ed4c4c]/40 bg-[#ed4c4c]/15 text-white" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"}`}
          aria-label="Toggle HR directory"
        >
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <Users2 className="h-4 w-4" />
            <span>HR</span>
          </div>
        </button>
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-white/85">
            <Globe2 className="h-4 w-4 text-[#ed4c4c]" />
            <span>{viewMode === "globe" ? "Globe" : "Office"}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col justify-start">
        {hoveredOffice ? (
          <div className="p-4 rounded-2xl bg-[#ed4c4c]/10 border border-[#ed4c4c]/30 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl leading-none">{hoveredOffice.flag}</span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white truncate">{hoveredOffice.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-white/50">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{hoveredOffice.country}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={goToPrevious} className="p-1 rounded hover:bg-white/10 transition-colors" aria-label="Previous office">
                  <ChevronLeft className="h-4 w-4 text-white/60" />
                </button>
                <button onClick={goToNext} className="p-1 rounded hover:bg-white/10 transition-colors" aria-label="Next office">
                  <ChevronRight className="h-4 w-4 text-white/60" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-white/75">
              <Users className="h-3.5 w-3.5 text-[#ed4c4c]" />
              <span>{hoveredOffice.team}</span>
            </div>

            {viewMode === "globe" && (
              <button onClick={onEnterOffice} className="w-full py-2.5 px-3 bg-[#ed4c4c] hover:bg-[#d43c3c] text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors">
                <span>Open</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-center min-h-40">
            <span className="text-white/35 text-sm">●</span>
          </div>
        )}
      </div>
    </div>
  )
}

