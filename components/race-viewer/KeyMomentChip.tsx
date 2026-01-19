"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import type { KeyMoment } from "@/lib/race-moments"
import type { Driver } from "@/lib/f1-teams"

interface KeyMomentChipProps {
  moment: KeyMoment
  drivers: Map<number, Driver>
  totalLaps: number
  onClick: (lap: number) => void
}

/**
 * A small chip displayed above the timeline representing a key moment
 * Clicking it jumps to that lap in the race
 */
export function KeyMomentChip({ moment, drivers, totalLaps, onClick }: KeyMomentChipProps) {
  const { overtaker, overtaken, newPosition, lap } = moment.data
  const overtakerDriver = drivers.get(overtaker)
  const overtakenDriver = drivers.get(overtaken)

  // Calculate position as percentage of timeline
  const leftPercent = useMemo(() => {
    if (totalLaps <= 1) return 0
    return ((lap - 1) / (totalLaps - 1)) * 100
  }, [lap, totalLaps])

  // Get display codes
  const overtakerCode = overtakerDriver?.code || `#${overtaker}`
  const overtakenCode = overtakenDriver?.code || `#${overtaken}`
  const overtakerColor = overtakerDriver?.teamColor || "#22D3EE"

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute -translate-x-1/2 cursor-pointer group z-40"
      style={{ left: `${leftPercent}%`, bottom: "100%" }}
      onClick={() => onClick(lap)}
    >
      {/* Chip */}
      <div
        className="glass-panel px-2 py-1 rounded-md text-xs whitespace-nowrap
                   border border-primary/30 hover:border-primary/60
                   transition-all duration-200 hover:scale-105 mb-1
                   shadow-[0_0_8px_rgba(34,211,238,0.2)] hover:shadow-[0_0_12px_rgba(34,211,238,0.4)]"
      >
        <div className="flex items-center gap-1">
          <span className="font-mono font-bold" style={{ color: overtakerColor }}>
            {overtakerCode}
          </span>
          <ArrowRight className="w-3 h-3 text-primary" />
          <span className="font-mono text-muted-foreground">{overtakenCode}</span>
        </div>
      </div>

      {/* Connector line to timeline */}
      <div className="absolute left-1/2 -translate-x-1/2 w-px h-2 bg-primary/40" />

      {/* Hover tooltip with more details */}
      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1
                   opacity-0 group-hover:opacity-100 transition-opacity
                   pointer-events-none z-50"
      >
        <div className="glass-panel px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-xl border border-primary/20">
          <div className="flex flex-col gap-1">
            <div className="font-semibold text-primary">Overtake for P{newPosition}</div>
            <div className="text-muted-foreground">
              <span style={{ color: overtakerColor }}>{overtakerCode}</span>
              {" passes "}
              <span style={{ color: overtakenDriver?.teamColor || "#888" }}>{overtakenCode}</span>
            </div>
            <div className="text-muted-foreground/70 text-[10px]">
              Lap {lap} | Click to jump
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

interface KeyMomentsRowProps {
  moments: KeyMoment[]
  drivers: Driver[]
  totalLaps: number
  onLapChange: (lap: number) => void
}

/**
 * Container for all key moment chips, positioned above the timeline
 */
export function KeyMomentsRow({ moments, drivers, totalLaps, onLapChange }: KeyMomentsRowProps) {
  // Create driver lookup map
  const driverMap = useMemo(() => {
    const map = new Map<number, Driver>()
    for (const driver of drivers) {
      map.set(driver.number, driver)
    }
    return map
  }, [drivers])

  if (moments.length === 0) {
    return null
  }

  return (
    <div className="relative h-8 w-full">
      {moments.map((moment, idx) => (
        <KeyMomentChip
          key={`moment-${moment.type}-${moment.lap}-${idx}`}
          moment={moment}
          drivers={driverMap}
          totalLaps={totalLaps}
          onClick={onLapChange}
        />
      ))}
    </div>
  )
}
