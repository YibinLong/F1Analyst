"use client"

import { useState, useCallback } from "react"
import type { Race } from "@/lib/race-data"
import { drivers2025 } from "@/lib/f1-teams"
import { RaceHeader } from "./race-header"
import { TrackVisualization } from "./track-visualization"
import { Leaderboard } from "./leaderboard"
import { Timeline } from "./timeline"
import { ChatPanel } from "../chat/chat-panel"

interface RaceViewerProps {
  race: Race
}

// Mock race data for demonstration
const generateMockPositions = (lap: number) => {
  const baseOrder = [1, 4, 16, 11, 55, 44, 63, 81, 14, 18, 10, 31, 23, 2, 20, 27, 22, 3, 77, 24]
  // Simulate some position changes based on lap
  const shuffled = [...baseOrder]
  const swapIndex = Math.floor((lap * 7) % 15)
  if (swapIndex < shuffled.length - 1) {
    ;[shuffled[swapIndex], shuffled[swapIndex + 1]] = [shuffled[swapIndex + 1], shuffled[swapIndex]]
  }
  return shuffled
}

const generateMockIntervals = (positions: number[]) => {
  return positions.map((driverNum, index) => {
    if (index === 0) return { driverNumber: driverNum, interval: null, gapToLeader: null }
    const gap = (Math.random() * 2 + 0.5 * index).toFixed(3)
    const toLeader = (Number.parseFloat(gap) + index * 0.8).toFixed(3)
    return { driverNumber: driverNum, interval: gap, gapToLeader: toLeader }
  })
}

export function RaceViewer({ race }: RaceViewerProps) {
  const totalLaps = 57
  const [currentLap, setCurrentLap] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isChatOpen, setIsChatOpen] = useState(true)

  const positions = generateMockPositions(currentLap)
  const intervals = generateMockIntervals(positions)

  const standings = positions.map((driverNum, index) => {
    const driver = drivers2025.find((d) => d.number === driverNum)
    const intervalData = intervals.find((i) => i.driverNumber === driverNum)
    return {
      position: index + 1,
      driver: driver!,
      interval: intervalData?.interval,
      gapToLeader: intervalData?.gapToLeader,
    }
  })

  const handleLapChange = useCallback(
    (lap: number) => {
      setCurrentLap(Math.max(1, Math.min(totalLaps, lap)))
    },
    [totalLaps],
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
          <TrackVisualization trackId={race.circuitKey} standings={standings} currentLap={currentLap} />
        </div>

        {/* Chat Panel */}
        {isChatOpen && (
          <div className="w-96 flex-shrink-0 border-l border-border/50">
            <ChatPanel race={race} currentLap={currentLap} standings={standings} onClose={() => setIsChatOpen(false)} />
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
      />
    </div>
  )
}
