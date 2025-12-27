// OpenF1 API Client
// API Documentation: https://openf1.org

import type {
  OpenF1Meeting,
  OpenF1Session,
  OpenF1Driver,
  OpenF1Location,
  OpenF1Position,
  OpenF1Interval,
  OpenF1Lap,
  OpenF1PitStop,
  OpenF1RaceControl,
} from "@/types/openf1"
import {
  OpenF1MeetingSchema,
  OpenF1SessionSchema,
  OpenF1DriverSchema,
  OpenF1LocationSchema,
  OpenF1PositionSchema,
  OpenF1IntervalSchema,
  OpenF1LapSchema,
  OpenF1PitStopSchema,
  OpenF1RaceControlSchema,
  validateArray,
} from "@/lib/openf1-schemas"
import type { z } from "zod"

const BASE_URL = process.env.OPENF1_API_URL || "https://api.openf1.org/v1"
const REQUEST_TIMEOUT = 10000 // 10 seconds
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000 // 1 second

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Generic fetch function with timeout, error handling, and retry logic
 */
async function fetchOpenF1<T>(
  endpoint: string,
  params: Record<string, string | number> = {},
  retryCount = 0
): Promise<T[] | null> {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, String(value))
  })

  const url = `${BASE_URL}${endpoint}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // Handle rate limiting with exponential backoff
      if (response.status === 429 && retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount)
        if (process.env.NODE_ENV === "development") {
          console.warn(`[OpenF1] Rate limited, retrying in ${delay}ms...`)
        }
        await sleep(delay)
        return fetchOpenF1<T>(endpoint, params, retryCount + 1)
      }

      // Handle 422 Unprocessable Entity - data not available (e.g., future races)
      // Return null instead of throwing to indicate missing data gracefully
      if (response.status === 422) {
        if (process.env.NODE_ENV === "development") {
          console.warn(`[OpenF1] Data not available for ${endpoint} (HTTP 422)`)
        }
        return null
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data as T[]
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(`[OpenF1] Error fetching ${url}:`, error)
    }

    // Retry on network errors
    if (retryCount < MAX_RETRIES && error instanceof Error && error.name !== "AbortError") {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount)
      await sleep(delay)
      return fetchOpenF1<T>(endpoint, params, retryCount + 1)
    }

    return null
  }
}

/**
 * Get all meetings (race weekends) for a year
 * @param year - The year to fetch meetings for (e.g., 2025)
 */
export async function getMeetings(year: number): Promise<OpenF1Meeting[] | null> {
  const data = await fetchOpenF1<OpenF1Meeting>("/meetings", { year })
  if (!data) return null
  return validateArray(data, OpenF1MeetingSchema, "/meetings") as OpenF1Meeting[]
}

/**
 * Get session by meeting key and session name
 * @param meetingKey - The meeting key
 * @param sessionName - The session name (e.g., "Race", "Qualifying", "Practice 1")
 */
export async function getSession(
  meetingKey: number,
  sessionName: string
): Promise<OpenF1Session | null> {
  const data = await fetchOpenF1<OpenF1Session>("/sessions", {
    meeting_key: meetingKey,
    session_name: sessionName,
  })
  if (!data) return null
  const validated = validateArray(data, OpenF1SessionSchema, "/sessions") as OpenF1Session[]
  return validated[0] || null
}

/**
 * Get all sessions for a meeting
 * @param meetingKey - The meeting key
 */
export async function getSessions(meetingKey: number): Promise<OpenF1Session[] | null> {
  const data = await fetchOpenF1<OpenF1Session>("/sessions", { meeting_key: meetingKey })
  if (!data) return null
  return validateArray(data, OpenF1SessionSchema, "/sessions") as OpenF1Session[]
}

/**
 * Get drivers for a session
 * @param sessionKey - The session key
 */
export async function getDrivers(sessionKey: number): Promise<OpenF1Driver[] | null> {
  const data = await fetchOpenF1<OpenF1Driver>("/drivers", { session_key: sessionKey })
  if (!data) return null
  return validateArray(data, OpenF1DriverSchema, "/drivers") as OpenF1Driver[]
}

/**
 * Get car locations for a session
 * @param sessionKey - The session key
 * @param driverNumber - Optional driver number to filter by
 */
export async function getLocations(
  sessionKey: number,
  driverNumber?: number
): Promise<OpenF1Location[] | null> {
  const params: Record<string, string | number> = { session_key: sessionKey }
  if (driverNumber !== undefined) {
    params.driver_number = driverNumber
  }
  const data = await fetchOpenF1<OpenF1Location>("/location", params)
  if (!data) return null
  return validateArray(data, OpenF1LocationSchema, "/location") as OpenF1Location[]
}

/**
 * Get positions for a session
 * @param sessionKey - The session key
 */
export async function getPositions(sessionKey: number): Promise<OpenF1Position[] | null> {
  const data = await fetchOpenF1<OpenF1Position>("/position", { session_key: sessionKey })
  if (!data) return null
  return validateArray(data, OpenF1PositionSchema, "/position") as OpenF1Position[]
}

/**
 * Get intervals (gaps) for a session
 * @param sessionKey - The session key
 */
export async function getIntervals(sessionKey: number): Promise<OpenF1Interval[] | null> {
  const data = await fetchOpenF1<OpenF1Interval>("/intervals", { session_key: sessionKey })
  if (!data) return null
  return validateArray(data, OpenF1IntervalSchema, "/intervals") as OpenF1Interval[]
}

/**
 * Get lap data for a session
 * @param sessionKey - The session key
 * @param driverNumber - Optional driver number to filter by
 */
export async function getLaps(
  sessionKey: number,
  driverNumber?: number
): Promise<OpenF1Lap[] | null> {
  const params: Record<string, string | number> = { session_key: sessionKey }
  if (driverNumber !== undefined) {
    params.driver_number = driverNumber
  }
  const data = await fetchOpenF1<OpenF1Lap>("/laps", params)
  if (!data) return null
  return validateArray(data, OpenF1LapSchema, "/laps") as OpenF1Lap[]
}

/**
 * Get pit stop data for a session
 * @param sessionKey - The session key
 */
export async function getPitStops(sessionKey: number): Promise<OpenF1PitStop[] | null> {
  const data = await fetchOpenF1<OpenF1PitStop>("/pit", { session_key: sessionKey })
  if (!data) return null
  return validateArray(data, OpenF1PitStopSchema, "/pit") as OpenF1PitStop[]
}

/**
 * Get race control messages for a session
 * @param sessionKey - The session key
 */
export async function getRaceControl(sessionKey: number): Promise<OpenF1RaceControl[] | null> {
  const data = await fetchOpenF1<OpenF1RaceControl>("/race_control", { session_key: sessionKey })
  if (!data) return null
  return validateArray(data, OpenF1RaceControlSchema, "/race_control") as OpenF1RaceControl[]
}

// Utility functions for data processing

/**
 * Get the maximum lap number from lap data
 */
export function getMaxLapNumber(laps: OpenF1Lap[]): number {
  return Math.max(...laps.map((lap) => lap.lap_number), 0)
}

/**
 * Group positions by lap number
 */
export function groupPositionsByLap(
  positions: OpenF1Position[],
  laps: OpenF1Lap[]
): Record<number, Record<number, number>> {
  const result: Record<number, Record<number, number>> = {}

  // Create a map of timestamps to lap numbers
  const lapTimestamps = laps.reduce(
    (acc, lap) => {
      const timestamp = new Date(lap.date_start).getTime()
      acc[lap.driver_number] = acc[lap.driver_number] || []
      acc[lap.driver_number].push({ lap: lap.lap_number, timestamp })
      return acc
    },
    {} as Record<number, Array<{ lap: number; timestamp: number }>>
  )

  // Sort positions by date
  const sortedPositions = [...positions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Track last known position for each driver at each lap
  const lastPositionByLap: Record<number, Record<number, number>> = {}

  for (const pos of sortedPositions) {
    const posTime = new Date(pos.date).getTime()

    // Find the lap number for this position based on timestamp
    // Use lap 1 as default, then find the actual lap from lap data
    let lapNumber = 1
    const driverLaps = lapTimestamps[pos.driver_number] || []
    for (const lapData of driverLaps) {
      if (posTime >= lapData.timestamp) {
        lapNumber = lapData.lap
      }
    }

    if (!result[lapNumber]) {
      result[lapNumber] = {}
    }
    result[lapNumber][pos.driver_number] = pos.position

    // Also track for interpolation
    lastPositionByLap[lapNumber] = lastPositionByLap[lapNumber] || {}
    lastPositionByLap[lapNumber][pos.driver_number] = pos.position
  }

  // Fill in missing positions using last known
  const maxLap = Math.max(...Object.keys(result).map(Number), 1)
  const allDriverNumbers = [...new Set(positions.map((p) => p.driver_number))]

  for (let lap = 1; lap <= maxLap; lap++) {
    if (!result[lap]) {
      result[lap] = {}
    }

    for (const driverNum of allDriverNumbers) {
      if (!result[lap][driverNum]) {
        // Find last known position
        for (let prevLap = lap - 1; prevLap >= 1; prevLap--) {
          if (result[prevLap]?.[driverNum]) {
            result[lap][driverNum] = result[prevLap][driverNum]
            break
          }
        }
      }
    }
  }

  return result
}

/**
 * Group intervals by lap number
 */
export function groupIntervalsByLap(
  intervals: OpenF1Interval[],
  laps: OpenF1Lap[]
): Record<number, Record<number, { interval: number | null; gapToLeader: number | null }>> {
  const result: Record<
    number,
    Record<number, { interval: number | null; gapToLeader: number | null }>
  > = {}

  // Create a map of timestamps to lap numbers
  const lapTimestamps = laps.reduce(
    (acc, lap) => {
      const timestamp = new Date(lap.date_start).getTime()
      acc[lap.driver_number] = acc[lap.driver_number] || []
      acc[lap.driver_number].push({ lap: lap.lap_number, timestamp })
      return acc
    },
    {} as Record<number, Array<{ lap: number; timestamp: number }>>
  )

  // Sort intervals by date
  const sortedIntervals = [...intervals].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  for (const int of sortedIntervals) {
    const intTime = new Date(int.date).getTime()

    // Find the lap number for this interval
    let lapNumber = 1
    const driverLaps = lapTimestamps[int.driver_number] || []
    for (const lapData of driverLaps) {
      if (intTime >= lapData.timestamp) {
        lapNumber = lapData.lap
      }
    }

    if (!result[lapNumber]) {
      result[lapNumber] = {}
    }
    result[lapNumber][int.driver_number] = {
      interval: int.interval,
      gapToLeader: int.gap_to_leader,
    }
  }

  // Fill in missing intervals
  const maxLap = Math.max(...Object.keys(result).map(Number), 1)
  const allDriverNumbers = [...new Set(intervals.map((i) => i.driver_number))]

  for (let lap = 1; lap <= maxLap; lap++) {
    if (!result[lap]) {
      result[lap] = {}
    }

    for (const driverNum of allDriverNumbers) {
      if (!result[lap][driverNum]) {
        // Find last known interval
        for (let prevLap = lap - 1; prevLap >= 1; prevLap--) {
          if (result[prevLap]?.[driverNum]) {
            result[lap][driverNum] = result[prevLap][driverNum]
            break
          }
        }
      }
    }
  }

  return result
}

/**
 * Map OpenF1 team name to internal team key
 */
export function mapTeamNameToKey(teamName: string): string {
  const teamMapping: Record<string, string> = {
    "Red Bull Racing": "red_bull",
    "Ferrari": "ferrari",
    "Mercedes": "mercedes",
    "McLaren": "mclaren",
    "Aston Martin": "aston_martin",
    "Alpine": "alpine",
    "Williams": "williams",
    "Haas F1 Team": "haas",
    "RB": "rb",
    "Kick Sauber": "sauber",
    // Alternative names
    "Scuderia Ferrari": "ferrari",
    "Mercedes-AMG Petronas F1 Team": "mercedes",
    "Oracle Red Bull Racing": "red_bull",
    "Visa Cash App RB": "rb",
    "MoneyGram Haas F1 Team": "haas",
    "Stake F1 Team Kick Sauber": "sauber",
    "BWT Alpine F1 Team": "alpine",
  }

  return teamMapping[teamName] || teamName.toLowerCase().replace(/\s+/g, "_")
}

/**
 * Map circuit_short_name to circuitKey for track visualization
 * Handles various naming conventions from OpenF1 API
 */
export function mapCircuitToKey(circuitShortName: string): string {
  // Normalize the input to handle variations
  const normalized = circuitShortName.trim()

  const circuitMapping: Record<string, string> = {
    // Standard names (circuit_short_name from OpenF1)
    Sakhir: "bahrain",
    Bahrain: "bahrain",
    Jeddah: "jeddah",
    Melbourne: "albert_park",
    Suzuka: "suzuka",
    Shanghai: "shanghai",
    Miami: "miami",
    "Imola": "imola",
    Monaco: "monaco",
    Montreal: "montreal",
    Montréal: "montreal",
    Barcelona: "barcelona",
    Spielberg: "red_bull_ring",
    Silverstone: "silverstone",
    Budapest: "hungaroring",
    "Spa-Francorchamps": "spa",
    Zandvoort: "zandvoort",
    Monza: "monza",
    Baku: "baku",
    Singapore: "singapore",
    "Marina Bay": "singapore",
    Austin: "cota",
    "Mexico City": "mexico",
    "São Paulo": "interlagos",
    "Las Vegas": "las_vegas",
    Lusail: "lusail",
    "Yas Island": "yas_marina",
    "Yas Marina": "yas_marina",
    // Extended circuit name variations (OpenF1 API may return these)
    "Yas Marina Circuit": "yas_marina",
    "Bahrain International Circuit": "bahrain",
    "Jeddah Corniche Circuit": "jeddah",
    "Albert Park Circuit": "albert_park",
    "Albert Park": "albert_park",
    "Suzuka Circuit": "suzuka",
    "Suzuka International Racing Course": "suzuka",
    "Shanghai International Circuit": "shanghai",
    "Miami International Autodrome": "miami",
    "Autodromo Enzo e Dino Ferrari": "imola",
    "Imola Circuit": "imola",
    "Circuit de Monaco": "monaco",
    "Monaco Circuit": "monaco",
    "Circuit Gilles Villeneuve": "montreal",
    "Montreal Circuit": "montreal",
    "Circuit de Barcelona-Catalunya": "barcelona",
    "Barcelona-Catalunya": "barcelona",
    "Red Bull Ring": "red_bull_ring",
    "Silverstone Circuit": "silverstone",
    "Hungaroring": "hungaroring",
    "Circuit de Spa-Francorchamps": "spa",
    "Spa": "spa",
    "Circuit Zandvoort": "zandvoort",
    "Autodromo Nazionale Monza": "monza",
    "Monza Circuit": "monza",
    "Baku City Circuit": "baku",
    "Marina Bay Street Circuit": "singapore",
    "Marina Bay": "singapore",
    "Circuit of the Americas": "cota",
    "COTA": "cota",
    "Autodromo Hermanos Rodriguez": "mexico",
    "Mexico City Circuit": "mexico",
    "Autodromo Jose Carlos Pace": "interlagos",
    "Interlagos": "interlagos",
    "Las Vegas Strip Circuit": "las_vegas",
    "Lusail International Circuit": "lusail",
    "Qatar": "lusail",
  }

  // Try direct match first
  if (circuitMapping[normalized]) {
    return circuitMapping[normalized]
  }

  // Try case-insensitive match
  const lowerNormalized = normalized.toLowerCase()
  for (const [key, value] of Object.entries(circuitMapping)) {
    if (key.toLowerCase() === lowerNormalized) {
      return value
    }
  }

  // Fallback: convert to snake_case, removing common suffixes
  let fallback = normalized
    .replace(/\s*(Circuit|International|Racing Course|Street Circuit|Autodrome|Autodromo)\s*/gi, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")

  return fallback || normalized.toLowerCase().replace(/\s+/g, "_")
}
