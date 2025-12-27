"use client"

import { useState, useCallback, useMemo } from "react"
import type { Race } from "@/lib/race-data"
import type { Driver } from "@/lib/f1-teams"
import type {
  OpenF1Location,
  OpenF1Lap,
  OpenF1RaceControl,
  OpenF1PitStop,
} from "@/types/openf1"
import { RaceHeader } from "./race-header"
import { TrackVisualization } from "./track-visualization"
import { Leaderboard } from "./leaderboard"
import { Timeline } from "./timeline"
import { ChatPanel } from "../chat/chat-panel"

interface RaceViewerProps {
  race: Race
  drivers: Driver[]
  totalLaps: number
  positionsByLap: Record<number, Record<number, number>>
  intervalsByLap: Record<number, Record<number, { interval: number | null; gapToLeader: number | null }>>
  locations: OpenF1Location[]
  laps: OpenF1Lap[]
  raceControl: OpenF1RaceControl[]
  pitStops: OpenF1PitStop[]
}

interface Standing {
  position: number
  driver: Driver
  interval: string | null
  gapToLeader: string | null
}

/**
 * Format interval value for display
 */
function formatInterval(value: number | null): string | null {
  if (value === null) return null
  if (value < 0) return null // Negative intervals can occur with data issues
  return `+${value.toFixed(3)}`
}

/**
 * Format gap to leader for display
 */
function formatGapToLeader(value: number | null, position: number): string | null {
  if (position === 1) return null // Leader shows no gap
  if (value === null) return null
  if (value < 0) return null
  return `+${value.toFixed(3)}`
}

export function RaceViewer({
  race,
  drivers,
  totalLaps,
  positionsByLap,
  intervalsByLap,
  locations,
  laps,
  raceControl,
  pitStops,
}: RaceViewerProps) {
  const [currentLap, setCurrentLap] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isChatOpen, setIsChatOpen] = useState(true)

  // Create a driver lookup map for efficient access
  const driverMap = useMemo(() => {
    const map = new Map<number, Driver>()
    for (const driver of drivers) {
      map.set(driver.number, driver)
    }
    return map
  }, [drivers])

  // Get standings for current lap
  const standings = useMemo((): Standing[] => {
    const lapPositions = positionsByLap[currentLap] || positionsByLap[1] || {}
    const lapIntervals = intervalsByLap[currentLap] || intervalsByLap[1] || {}

    // Create array of driver positions
    const driverPositions: Array<{ driverNumber: number; position: number }> = []

    for (const [driverNumStr, position] of Object.entries(lapPositions)) {
      driverPositions.push({
        driverNumber: parseInt(driverNumStr, 10),
        position,
      })
    }

    // Sort by position
    driverPositions.sort((a, b) => a.position - b.position)

    // Map to standings
    return driverPositions.map(({ driverNumber, position }) => {
      const driver = driverMap.get(driverNumber)
      const intervalData = lapIntervals[driverNumber]

      // If driver not found, create a placeholder
      if (!driver) {
        return {
          position,
          driver: {
            number: driverNumber,
            code: `D${driverNumber}`,
            firstName: "Unknown",
            lastName: "Driver",
            team: "unknown",
            teamColor: "#FFFFFF",
          },
          interval: formatInterval(intervalData?.interval ?? null),
          gapToLeader: formatGapToLeader(intervalData?.gapToLeader ?? null, position),
        }
      }

      return {
        position,
        driver,
        interval: formatInterval(intervalData?.interval ?? null),
        gapToLeader: formatGapToLeader(intervalData?.gapToLeader ?? null, position),
      }
    })
  }, [currentLap, positionsByLap, intervalsByLap, driverMap])

  const handleLapChange = useCallback(
    (lap: number) => {
      setCurrentLap(Math.max(1, Math.min(totalLaps, lap)))
    },
    [totalLaps]
  )

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed)
  }, [])

  // Auto-play effect
  useState(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentLap((prev) => {
        if (prev >= totalLaps) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 1000 / playbackSpeed)

    return () => clearInterval(interval)
  })

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <RaceHeader race={race} currentLap={currentLap} totalLaps={totalLaps} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Leaderboard Panel */}
        <div className="w-72 flex-shrink-0 border-r border-border/50">
          <Leaderboard standings={standings} />
        </div>

        {/* Track Visualization */}
        <div className="flex-1 relative">
          <TrackVisualization
            trackId={race.circuitKey}
            standings={standings}
            currentLap={currentLap}
            locations={locations}
            laps={laps}
            totalLaps={totalLaps}
          />
        </div>

        {/* Chat Panel */}
        {isChatOpen && (
          <div className="w-96 flex-shrink-0 border-l border-border/50">
            <ChatPanel
              race={race}
              currentLap={currentLap}
              totalLaps={totalLaps}
              standings={standings}
              pitStops={pitStops}
              raceControl={raceControl}
              positionsByLap={positionsByLap}
              drivers={drivers}
              onClose={() => setIsChatOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Timeline */}
      <Timeline
        currentLap={currentLap}
        totalLaps={totalLaps}
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        onLapChange={handleLapChange}
        onPlayPause={handlePlayPause}
        onSpeedChange={handleSpeedChange}
        onToggleChat={() => setIsChatOpen((prev) => !prev)}
        isChatOpen={isChatOpen}
        pitStops={pitStops}
        raceControl={raceControl}
      />
    </div>
  )
}
