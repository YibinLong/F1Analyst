"use client"

import { useState, useEffect } from "react"
import { RaceViewer } from "./race-viewer"
import { RaceViewerSkeleton } from "./race-viewer-skeleton"
import type { Race } from "@/lib/race-data"
import type { Driver } from "@/lib/f1-teams"
import type {
  OpenF1Position,
  OpenF1Interval,
  OpenF1Lap,
  OpenF1Location,
  OpenF1RaceControl,
  OpenF1PitStop,
} from "@/types/openf1"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"

interface RaceViewerWrapperProps {
  meetingKey: string
  initialRaceInfo: {
    meetingKey: string
    meetingName: string
    country: string
    location: string
    circuitKey: string
  }
}

interface RaceData {
  race: Race
  drivers: Driver[]
  totalLaps: number
  sessionKey: number
  positions: OpenF1Position[]
  intervals: OpenF1Interval[]
  laps: OpenF1Lap[]
  locations: OpenF1Location[]
  raceControl: OpenF1RaceControl[]
  pitStops: OpenF1PitStop[]
  positionsByLap: Record<number, Record<number, number>>
  intervalsByLap: Record<number, Record<number, { interval: number | null; gapToLeader: number | null }>>
}

export function RaceViewerWrapper({ meetingKey, initialRaceInfo }: RaceViewerWrapperProps) {
  const [raceData, setRaceData] = useState<RaceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)

  useEffect(() => {
    async function fetchRaceData() {
      setIsLoading(true)
      setError(null)
      setLoadingProgress(5)

      try {
        // Stage 1: Initiating connection
        setLoadingProgress(10)
        const response = await fetch(`/api/race/${meetingKey}`)

        // Stage 2: Response received
        setLoadingProgress(30)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch race data")
        }

        // Stage 3: Downloading data
        setLoadingProgress(50)
        const data = await response.json()

        // Stage 4: Processing data
        setLoadingProgress(80)

        // Small delay to show processing stage
        await new Promise(resolve => setTimeout(resolve, 100))
        setLoadingProgress(95)

        // Stage 5: Complete
        setLoadingProgress(100)
        setRaceData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred while loading race data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchRaceData()
  }, [meetingKey])

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background">
        <div className="glass-panel p-8 rounded-xl text-center max-w-md">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Loading {initialRaceInfo.meetingName}</h2>
          <p className="text-muted-foreground mb-4">
            Fetching race data from OpenF1 API...
          </p>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {loadingProgress < 15
              ? "Connecting to OpenF1 API..."
              : loadingProgress < 35
                ? "Fetching session data..."
                : loadingProgress < 55
                  ? "Downloading location data..."
                  : loadingProgress < 85
                    ? "Processing race data..."
                    : loadingProgress < 100
                      ? "Preparing visualization..."
                      : "Ready!"}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background">
        <div className="glass-panel p-8 rounded-xl text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Race</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => {
              setIsLoading(true)
              setError(null)
              setLoadingProgress(0)
              fetch(`/api/race/${meetingKey}`)
                .then((res) => {
                  if (!res.ok) throw new Error("Failed to fetch")
                  return res.json()
                })
                .then((data) => setRaceData(data))
                .catch((err) => setError(err.message))
                .finally(() => setIsLoading(false))
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!raceData) {
    return <RaceViewerSkeleton />
  }

  return (
    <RaceViewer
      race={raceData.race}
      drivers={raceData.drivers}
      totalLaps={raceData.totalLaps}
      positionsByLap={raceData.positionsByLap}
      intervalsByLap={raceData.intervalsByLap}
      locations={raceData.locations}
      laps={raceData.laps}
      raceControl={raceData.raceControl}
      pitStops={raceData.pitStops}
    />
  )
}
