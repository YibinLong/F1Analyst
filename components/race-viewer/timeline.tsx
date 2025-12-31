"use client"

import { useMemo } from "react"
import { Play, Pause, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import type { OpenF1PitStop, OpenF1RaceControl } from "@/types/openf1"
import type { Driver } from "@/lib/f1-teams"

interface TimelineProps {
  currentLap: number
  totalLaps: number
  isPlaying: boolean
  playbackSpeed: number
  onLapChange: (lap: number) => void
  onPlayPause: () => void
  onSpeedChange: (speed: number) => void
  onToggleChat: () => void
  isChatOpen: boolean
  // Race event data for Epic 5 enhancements
  pitStops?: OpenF1PitStop[]
  raceControl?: OpenF1RaceControl[]
  drivers?: Driver[]
}

// Represents a flag period (SC, VSC, or Red Flag)
interface FlagPeriod {
  type: "SC" | "VSC" | "RED"
  startLap: number
  endLap: number
}

// Speed options with labels
// For slow speeds (minutes per lap), playbackSpeed = 1 / (seconds per lap)
// e.g., 1 min/lap = 1/60 ≈ 0.0167
const speedOptions = [
  { value: 1/180, label: "3m" },   // 3 minutes per lap
  { value: 1/120, label: "2m" },   // 2 minutes per lap
  { value: 1/60, label: "1m" },    // 1 minute per lap
  { value: 0.5, label: "0.5x" },   // 2 seconds per lap
  { value: 1, label: "1x" },       // 1 second per lap
  { value: 2, label: "2x" },       // 0.5 seconds per lap
  { value: 4, label: "4x" },       // 0.25 seconds per lap
]

/**
 * Detects flag periods (SC, VSC, Red Flag) from race control events
 */
function getFlagPeriods(raceControl: OpenF1RaceControl[], totalLaps: number): FlagPeriod[] {
  const periods: FlagPeriod[] = []
  let currentPeriod: FlagPeriod | null = null

  // Sort by date
  const sorted = [...raceControl].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  for (const event of sorted) {
    const msg = event.message?.toUpperCase() || ""
    const lap = event.lap_number

    if (lap === null) continue

    // SC start
    if (msg.includes("SAFETY CAR DEPLOYED") || msg.includes("SC DEPLOYED")) {
      if (currentPeriod) currentPeriod.endLap = lap - 1
      currentPeriod = { type: "SC", startLap: lap, endLap: lap }
      periods.push(currentPeriod)
    }
    // VSC start
    else if (msg.includes("VSC DEPLOYED") || msg.includes("VIRTUAL SAFETY CAR DEPLOYED")) {
      if (currentPeriod) currentPeriod.endLap = lap - 1
      currentPeriod = { type: "VSC", startLap: lap, endLap: lap }
      periods.push(currentPeriod)
    }
    // Red flag
    else if (event.flag === "RED") {
      if (currentPeriod) currentPeriod.endLap = lap - 1
      currentPeriod = { type: "RED", startLap: lap, endLap: lap }
      periods.push(currentPeriod)
    }
    // End conditions
    else if (
      msg.includes("SAFETY CAR IN") ||
      msg.includes("SC IN THIS LAP") ||
      msg.includes("VSC ENDING") ||
      event.flag === "GREEN"
    ) {
      if (currentPeriod) {
        currentPeriod.endLap = lap
        currentPeriod = null
      }
    }
  }

  // If period still active, end at total laps
  if (currentPeriod) {
    currentPeriod.endLap = totalLaps
  }

  return periods
}

export function Timeline({
  currentLap,
  totalLaps,
  isPlaying,
  playbackSpeed,
  onLapChange,
  onPlayPause,
  onSpeedChange,
  onToggleChat,
  isChatOpen,
  pitStops,
  raceControl,
  drivers,
}: TimelineProps) {
  const progress = (currentLap / totalLaps) * 100

  // Create driver lookup map for efficient access
  const driverMap = useMemo(() => {
    const map = new Map<number, Driver>()
    for (const driver of drivers || []) {
      map.set(driver.number, driver)
    }
    return map
  }, [drivers])

  // Calculate flag periods from race control data
  const flagPeriods = useMemo(
    () => getFlagPeriods(raceControl || [], totalLaps),
    [raceControl, totalLaps]
  )

  // Position calculation: lap number to percentage
  const lapToPercent = (lap: number) => {
    if (totalLaps <= 1) return 0
    return ((lap - 1) / (totalLaps - 1)) * 100
  }

  return (
    <div className="h-24 border-t border-border/50 glass-panel px-4 py-3">
      <div className="max-w-6xl mx-auto h-full flex flex-col gap-3">
        {/* Timeline scrubber */}
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-muted-foreground w-12">LAP 1</span>
          <div className="flex-1 relative">
            {/* Flag period overlays - behind slider */}
            {flagPeriods.map((period, idx) => {
              const leftPercent = lapToPercent(period.startLap)
              const rightPercent = lapToPercent(period.endLap)
              const width = Math.max(rightPercent - leftPercent, 1) // Minimum 1% width for visibility

              return (
                <div
                  key={`flag-${period.type}-${idx}`}
                  className={`absolute top-1/2 -translate-y-1/2 h-3 rounded-sm pointer-events-none ${
                    period.type === "RED" ? "bg-destructive/40" : "bg-yellow-500/40"
                  }`}
                  style={{
                    left: `${leftPercent}%`,
                    width: `${width}%`,
                  }}
                  title={`${period.type === "RED" ? "Red Flag" : period.type === "VSC" ? "Virtual Safety Car" : "Safety Car"} (Lap ${period.startLap}-${period.endLap})`}
                />
              )
            })}

            <Slider
              value={[currentLap]}
              min={1}
              max={totalLaps}
              step={1}
              onValueChange={([value]) => onLapChange(value)}
              className="cursor-pointer relative z-10"
            />

            {/* Progress glow */}
            <div
              className="absolute top-1/2 left-0 h-1 bg-primary/30 rounded-full -translate-y-1/2 pointer-events-none"
              style={{ width: `${progress}%` }}
            />

            {/* Pit stop markers - above slider */}
            <div className="absolute inset-0 pointer-events-none z-20">
              {pitStops?.map((stop, idx) => {
                const driver = driverMap.get(stop.driver_number)
                const leftPercent = lapToPercent(stop.lap_number)

                return (
                  <div
                    key={`pit-${stop.driver_number}-${stop.lap_number}-${idx}`}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full pointer-events-auto cursor-pointer group z-30"
                    style={{
                      left: `${leftPercent}%`,
                      backgroundColor: driver?.teamColor || "#888",
                    }}
                  >
                    {/* Hover tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      <div className="glass-panel px-2 py-1 rounded text-xs whitespace-nowrap shadow-lg">
                        <span
                          className="font-mono font-bold"
                          style={{ color: driver?.teamColor || "#888" }}
                        >
                          {driver?.code || `#${stop.driver_number}`}
                        </span>
                        <span className="text-muted-foreground ml-1">L{stop.lap_number}</span>
                        {stop.pit_duration && (
                          <span className="text-muted-foreground ml-1">
                            ({stop.pit_duration.toFixed(1)}s)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <span className="text-xs font-mono text-muted-foreground w-16 text-right">LAP {totalLaps}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          {/* Playback controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onLapChange(currentLap - 1)}
              disabled={currentLap <= 1}
              className="h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <Button
              onClick={onPlayPause}
              size="icon"
              className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onLapChange(currentLap + 1)}
              disabled={currentLap >= totalLaps}
              className="h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Speed controls */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-2">Speed</span>
            {speedOptions.map((option) => {
              // Use a small epsilon for floating point comparison
              const isSelected = Math.abs(playbackSpeed - option.value) < 0.0001
              return (
                <Button
                  key={option.label}
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onSpeedChange(option.value)}
                  className={`h-7 px-2 font-mono text-xs ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option.label}
                </Button>
              )
            })}
          </div>

          {/* Current lap display */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <span className="text-xs text-muted-foreground">Current Lap</span>
              <p className="font-mono text-2xl font-bold text-primary">{currentLap.toString().padStart(2, "0")}</p>
            </div>

            {/* Toggle chat button */}
            <Button variant={isChatOpen ? "default" : "outline"} size="sm" onClick={onToggleChat} className="gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">AI Analyst</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
