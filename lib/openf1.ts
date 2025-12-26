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
  return fetchOpenF1<OpenF1Meeting>("/meetings", { year })
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
  const sessions = await fetchOpenF1<OpenF1Session>("/sessions", {
    meeting_key: meetingKey,
    session_name: sessionName,
  })
  return sessions?.[0] || null
}

/**
 * Get all sessions for a meeting
 * @param meetingKey - The meeting key
 */
export async function getSessions(meetingKey: number): Promise<OpenF1Session[] | null> {
  return fetchOpenF1<OpenF1Session>("/sessions", { meeting_key: meetingKey })
}

/**
 * Get drivers for a session
 * @param sessionKey - The session key
 */
export async function getDrivers(sessionKey: number): Promise<OpenF1Driver[] | null> {
  return fetchOpenF1<OpenF1Driver>("/drivers", { session_key: sessionKey })
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
  return fetchOpenF1<OpenF1Location>("/location", params)
}

/**
 * Get positions for a session
 * @param sessionKey - The session key
 */
export async function getPositions(sessionKey: number): Promise<OpenF1Position[] | null> {
  return fetchOpenF1<OpenF1Position>("/position", { session_key: sessionKey })
}

/**
 * Get intervals (gaps) for a session
 * @param sessionKey - The session key
 */
export async function getIntervals(sessionKey: number): Promise<OpenF1Interval[] | null> {
  return fetchOpenF1<OpenF1Interval>("/intervals", { session_key: sessionKey })
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
  return fetchOpenF1<OpenF1Lap>("/laps", params)
}

/**
 * Get pit stop data for a session
 * @param sessionKey - The session key
 */
export async function getPitStops(sessionKey: number): Promise<OpenF1PitStop[] | null> {
  return fetchOpenF1<OpenF1PitStop>("/pit", { session_key: sessionKey })
}

/**
 * Get race control messages for a session
 * @param sessionKey - The session key
 */
export async function getRaceControl(sessionKey: number): Promise<OpenF1RaceControl[] | null> {
  return fetchOpenF1<OpenF1RaceControl>("/race_control", { session_key: sessionKey })
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
 */
export function mapCircuitToKey(circuitShortName: string): string {
  const circuitMapping: Record<string, string> = {
    Bahrain: "bahrain",
    Jeddah: "jeddah",
    Melbourne: "albert_park",
    Suzuka: "suzuka",
    Shanghai: "shanghai",
    Miami: "miami",
    "Imola": "imola",
    Monaco: "monaco",
    Montreal: "montreal",
    Barcelona: "barcelona",
    Spielberg: "red_bull_ring",
    Silverstone: "silverstone",
    Budapest: "hungaroring",
    "Spa-Francorchamps": "spa",
    Zandvoort: "zandvoort",
    Monza: "monza",
    Baku: "baku",
    Singapore: "singapore",
    Austin: "cota",
    "Mexico City": "mexico",
    "São Paulo": "interlagos",
    "Las Vegas": "las_vegas",
    Lusail: "qatar",
    "Yas Marina": "yas_marina",
  }

  return circuitMapping[circuitShortName] || circuitShortName.toLowerCase().replace(/\s+/g, "_")
}
