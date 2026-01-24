"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, Flag } from "lucide-react"
import type { Race } from "@/lib/race-data"
import type { OpenF1RaceControl, OpenF1Weather } from "@/types/openf1"
import { Button } from "@/components/ui/button"
import { getActiveFlags } from "@/lib/ai-context"
import { WeatherWidget } from "./WeatherWidget"

interface EssentialLap {
  lap_number: number
  driver_number: number
  date_start: string | null
}

interface RaceHeaderProps {
  race: Race
  currentLap: number
  totalLaps: number
  raceControl?: OpenF1RaceControl[]
  weather?: OpenF1Weather[]
  laps?: EssentialLap[]
}

export function RaceHeader({ race, currentLap, totalLaps, raceControl, weather, laps }: RaceHeaderProps) {
  // Detect active flags at current lap
  const activeFlags = useMemo(
    () => getActiveFlags(raceControl || [], currentLap),
    [raceControl, currentLap]
  )

  // Determine current flag status
  const isRedFlag = activeFlags.some((f) => f.includes("RED"))
  const isSafetyCar = activeFlags.some((f) => f.includes("SAFETY CAR") && !f.includes("VIRTUAL"))
  const isVSC = activeFlags.some((f) => f.includes("VIRTUAL") || f.includes("VSC"))

  return (
    <header className="h-16 flex items-center justify-between px-4 border-b border-border/50 glass-panel">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </Link>

        <div className="h-8 w-px bg-border" />

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded">
            R{race.round.toString().padStart(2, "0")}
          </span>
          <div>
            <h1 className="font-bold text-foreground">{race.meetingName}</h1>
            <p className="text-xs text-muted-foreground">
              {race.location} • {race.dateDisplay}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Weather Widget */}
        {weather && weather.length > 0 && laps && (
          <WeatherWidget weather={weather} currentLap={currentLap} laps={laps} />
        )}

        {/* Lap Counter */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
          <Flag className="w-4 h-4 text-primary" />
          <span className="font-mono text-lg font-bold text-foreground">
            LAP {currentLap.toString().padStart(2, "0")}
          </span>
          <span className="text-muted-foreground">/</span>
          <span className="font-mono text-muted-foreground">{totalLaps}</span>
        </div>

        {/* Dynamic status indicator */}
        <div className="flex items-center gap-2">
          {isRedFlag ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
              </span>
              <span className="text-xs font-medium text-destructive">RED FLAG</span>
            </>
          ) : isSafetyCar ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500" />
              </span>
              <span className="text-xs font-medium text-yellow-500">SAFETY CAR</span>
            </>
          ) : isVSC ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500" />
              </span>
              <span className="text-xs font-medium text-yellow-500">VSC</span>
            </>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs font-medium text-green-500">LIVE DATA</span>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
