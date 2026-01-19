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

  // DEBUG: Log API request
  console.log(`[OpenF1 DEBUG] 🌐 Fetching: ${url}`)
  console.log(`[OpenF1 DEBUG] 📋 Params:`, JSON.stringify(params))

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

    // DEBUG: Log response status
    console.log(`[OpenF1 DEBUG] 📨 Response status: ${response.status} ${response.statusText} for ${endpoint}`)

    if (!response.ok) {
      // Handle rate limiting with exponential backoff
      if (response.status === 429 && retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount)
        console.warn(`[OpenF1 DEBUG] ⚠️ Rate limited (429), retrying in ${delay}ms...`)
        await sleep(delay)
        return fetchOpenF1<T>(endpoint, params, retryCount + 1)
      }

      // Handle 422 Unprocessable Entity - data not available (e.g., future races)
      // Return null instead of throwing to indicate missing data gracefully
      if (response.status === 422) {
        console.warn(`[OpenF1 DEBUG] ⚠️ Data not available for ${endpoint} (HTTP 422) - possibly future race or no data`)
        return null
      }

      console.error(`[OpenF1 DEBUG] ❌ HTTP Error: ${response.status}: ${response.statusText}`)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    // DEBUG: Log response data summary
    const dataArray = Array.isArray(data) ? data : []
    console.log(`[OpenF1 DEBUG] ✅ ${endpoint} returned ${dataArray.length} items`)
    if (dataArray.length === 0) {
      console.warn(`[OpenF1 DEBUG] ⚠️ EMPTY ARRAY returned for ${endpoint} with params:`, params)
    } else if (dataArray.length > 0) {
      console.log(`[OpenF1 DEBUG] 📊 First item sample:`, JSON.stringify(dataArray[0]).slice(0, 200))
    }

    return data as T[]
  } catch (error) {
    console.error(`[OpenF1 DEBUG] ❌ Error fetching ${url}:`, error)

    // Retry on network errors
    if (retryCount < MAX_RETRIES && error instanceof Error && error.name !== "AbortError") {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount)
      console.log(`[OpenF1 DEBUG] 🔄 Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`)
      await sleep(delay)
      return fetchOpenF1<T>(endpoint, params, retryCount + 1)
    }

    console.error(`[OpenF1 DEBUG] ❌ FAILED after ${retryCount} retries for ${endpoint}`)
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
  console.log(`[OpenF1 DEBUG] 🔍 getSession() called: meeting_key=${meetingKey}, session_name="${sessionName}"`)

  const data = await fetchOpenF1<OpenF1Session>("/sessions", {
    meeting_key: meetingKey,
    session_name: sessionName,
  })

  if (!data) {
    console.warn(`[OpenF1 DEBUG] ⚠️ getSession() returned null for meeting_key=${meetingKey}, session_name="${sessionName}"`)
    return null
  }

  const validated = validateArray(data, OpenF1SessionSchema, "/sessions") as OpenF1Session[]

  if (validated.length === 0) {
    console.warn(`[OpenF1 DEBUG] ⚠️ No sessions found for meeting_key=${meetingKey}, session_name="${sessionName}"`)
    console.warn(`[OpenF1 DEBUG] 💡 Raw data had ${data.length} items but none validated`)
    if (data.length > 0) {
      console.log(`[OpenF1 DEBUG] 📊 First raw session:`, JSON.stringify(data[0]))
    }
    return null
  }

  console.log(`[OpenF1 DEBUG] ✅ getSession() found session:`, {
    session_key: validated[0].session_key,
    session_name: validated[0].session_name,
    date_start: validated[0].date_start,
    date_end: validated[0].date_end,
  })

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
 * Sample location data to reduce volume while preserving important points
 * OpenF1 returns ~3.7 Hz data, visualization only needs ~0.5 Hz for smooth animation
 * The interpolation in track-utils.ts smooths between sample points
 * @param locations - Raw location data
 * @param sampleRate - Sample every Nth point (default: 8 for ~0.5 Hz from 3.7 Hz)
 */
function sampleLocationData(
  locations: OpenF1Location[],
  sampleRate: number = 8
): OpenF1Location[] {
  if (locations.length <= 2 || sampleRate <= 1) {
    return locations
  }

  // Group by driver to maintain per-driver sampling
  const byDriver = new Map<number, OpenF1Location[]>()
  for (const loc of locations) {
    if (!byDriver.has(loc.driver_number)) {
      byDriver.set(loc.driver_number, [])
    }
    byDriver.get(loc.driver_number)!.push(loc)
  }

  const sampled: OpenF1Location[] = []

  for (const [, driverLocs] of byDriver) {
    if (driverLocs.length <= 2) {
      // Keep all points if very few
      sampled.push(...driverLocs)
      continue
    }

    // Always keep first point
    sampled.push(driverLocs[0])

    // Sample middle points
    for (let i = sampleRate; i < driverLocs.length - 1; i += sampleRate) {
      sampled.push(driverLocs[i])
    }

    // Always keep last point
    sampled.push(driverLocs[driverLocs.length - 1])
  }

  return sampled
}

/**
 * Get car locations for a session in a single time window
 * @internal Use getLocations instead which handles chunking
 */
async function fetchLocationChunk(
  sessionKey: number,
  dateStart: string,
  dateEnd: string,
  driverNumber?: number,
  sampleRate: number = 4
): Promise<OpenF1Location[]> {
  const params: Record<string, string | number> = { session_key: sessionKey }
  if (driverNumber !== undefined) {
    params.driver_number = driverNumber
  }
  params['date>='] = dateStart
  params['date<='] = dateEnd

  const data = await fetchOpenF1<OpenF1Location>("/location", params)
  if (!data) return []

  const validated = validateArray(data, OpenF1LocationSchema, "/location") as OpenF1Location[]

  // Sample the data to reduce volume (~75% reduction with default rate of 4)
  return sampleLocationData(validated, sampleRate)
}

/**
 * Get car locations for a session
 * @param sessionKey - The session key
 * @param options - Optional filters: driverNumber, dateStart, dateEnd, sampleRate
 *
 * IMPORTANT: The location endpoint returns data at ~3.7 Hz, which is MASSIVE.
 * This function fetches in 5-minute chunks to avoid "too much data" errors.
 * Data is sampled at ~0.5 Hz by default (every 8th point) to reduce volume by ~87.5%.
 * The frontend interpolation smooths between sample points for 60fps animation.
 */
export async function getLocations(
  sessionKey: number,
  options?: {
    driverNumber?: number
    dateStart?: string
    dateEnd?: string
    sampleRate?: number // Sample every Nth point (default: 8 for ~0.5 Hz)
  }
): Promise<OpenF1Location[] | null> {
  const { driverNumber, dateStart, dateEnd, sampleRate = 8 } = options || {}
  console.log(`[OpenF1 DEBUG] 📍 getLocations() called with session_key: ${sessionKey}, driverNumber: ${driverNumber ?? 'ALL'}, dateStart: ${dateStart ?? 'none'}, dateEnd: ${dateEnd ?? 'none'}, sampleRate: ${sampleRate}`)

  // Without date range, we can't fetch location data (too much data error)
  if (!dateStart || !dateEnd) {
    console.warn(`[OpenF1 DEBUG] ⚠️ getLocations() requires dateStart and dateEnd to avoid API limits`)
    return null
  }

  const start = new Date(dateStart)
  const end = new Date(dateEnd)
  const CHUNK_SIZE_MS = 5 * 60 * 1000 // 5 minutes in milliseconds

  // If the session is in the future, the API won't have location data yet.
  if (start.getTime() > Date.now()) {
    console.warn(
      `[OpenF1 DEBUG] ⚠️ Session ${sessionKey} starts in the future (${dateStart}); skipping location fetch`
    )
    return null
  }

  // Calculate number of chunks needed
  const totalDuration = end.getTime() - start.getTime()
  const numChunks = Math.ceil(totalDuration / CHUNK_SIZE_MS)
  console.log(`[OpenF1 DEBUG] 📍 Fetching location data in ${numChunks} chunks (5-minute windows)`)

  // Fetch all chunks in parallel (but limit concurrency to avoid rate limits)
  const allLocations: OpenF1Location[] = []
  const CONCURRENCY_LIMIT = 4 // Fetch 4 chunks at a time

  for (let i = 0; i < numChunks; i += CONCURRENCY_LIMIT) {
    const chunkPromises: Promise<OpenF1Location[]>[] = []

    for (let j = i; j < Math.min(i + CONCURRENCY_LIMIT, numChunks); j++) {
      const chunkStart = new Date(start.getTime() + j * CHUNK_SIZE_MS)
      const chunkEnd = new Date(Math.min(chunkStart.getTime() + CHUNK_SIZE_MS, end.getTime()))

      chunkPromises.push(
        fetchLocationChunk(
          sessionKey,
          chunkStart.toISOString(),
          chunkEnd.toISOString(),
          driverNumber,
          sampleRate
        )
      )
    }

    const results = await Promise.all(chunkPromises)
    for (const chunk of results) {
      allLocations.push(...chunk)
    }

    console.log(`[OpenF1 DEBUG] 📍 Fetched chunks ${i + 1}-${Math.min(i + CONCURRENCY_LIMIT, numChunks)}/${numChunks}, total locations: ${allLocations.length}`)
  }

  console.log(`[OpenF1 DEBUG] 📍 getLocations() completed: ${allLocations.length} total location records`)

  if (allLocations.length === 0) {
    console.warn(`[OpenF1 DEBUG] ⚠️ No location data found for session_key: ${sessionKey}`)
    return null
  }

  return allLocations
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

  // Create a map of timestamps to lap numbers (skip laps with null date_start)
  const lapTimestamps = laps.reduce(
    (acc, lap) => {
      if (!lap.date_start) return acc
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
): Record<number, Record<number, { interval: number | string | null; gapToLeader: number | string | null }>> {
  const result: Record<
    number,
    Record<number, { interval: number | string | null; gapToLeader: number | string | null }>
  > = {}

  // Create a map of timestamps to lap numbers (skip laps with null date_start)
  const lapTimestamps = laps.reduce(
    (acc, lap) => {
      if (!lap.date_start) return acc
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
    Catalunya: "barcelona",
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
    "Monte Carlo": "monaco",
    "Monte-Carlo": "monaco",
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
