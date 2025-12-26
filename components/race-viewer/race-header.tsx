"use client"

import Link from "next/link"
import { ArrowLeft, Flag } from "lucide-react"
import type { Race } from "@/lib/race-data"
import { Button } from "@/components/ui/button"

interface RaceHeaderProps {
  race: Race
  currentLap: number
  totalLaps: number
}

export function RaceHeader({ race, currentLap, totalLaps }: RaceHeaderProps) {
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
        {/* Lap Counter */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
          <Flag className="w-4 h-4 text-primary" />
          <span className="font-mono text-lg font-bold text-foreground">
            LAP {currentLap.toString().padStart(2, "0")}
          </span>
          <span className="text-muted-foreground">/</span>
          <span className="font-mono text-muted-foreground">{totalLaps}</span>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-xs font-medium text-green-500">LIVE DATA</span>
        </div>
      </div>
    </header>
  )
}
