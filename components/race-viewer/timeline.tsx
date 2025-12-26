"use client"

import { Play, Pause, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import type { OpenF1PitStop, OpenF1RaceControl } from "@/types/openf1"

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
  // Optional race event data for future enhancements (Epic 5)
  pitStops?: OpenF1PitStop[]
  raceControl?: OpenF1RaceControl[]
}

const speedOptions = [0.5, 1, 2, 4]

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
}: TimelineProps) {
  const progress = (currentLap / totalLaps) * 100

  return (
    <div className="h-24 border-t border-border/50 glass-panel px-4 py-3">
      <div className="max-w-6xl mx-auto h-full flex flex-col gap-3">
        {/* Timeline scrubber */}
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-muted-foreground w-12">LAP 1</span>
          <div className="flex-1 relative">
            <Slider
              value={[currentLap]}
              min={1}
              max={totalLaps}
              step={1}
              onValueChange={([value]) => onLapChange(value)}
              className="cursor-pointer"
            />
            {/* Progress glow */}
            <div
              className="absolute top-1/2 left-0 h-1 bg-primary/30 rounded-full -translate-y-1/2 pointer-events-none"
              style={{ width: `${progress}%` }}
            />
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
            {speedOptions.map((speed) => (
              <Button
                key={speed}
                variant={playbackSpeed === speed ? "default" : "ghost"}
                size="sm"
                onClick={() => onSpeedChange(speed)}
                className={`h-7 px-2 font-mono text-xs ${
                  playbackSpeed === speed
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {speed}x
              </Button>
            ))}
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
