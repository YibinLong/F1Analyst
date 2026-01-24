// OpenF1 API Zod Schemas for Runtime Validation
// These schemas validate API responses match expected types

import { z } from "zod"

/**
 * Meeting - Represents an F1 race weekend/event
 * Endpoint: /meetings
 */
export const OpenF1MeetingSchema = z.object({
  meeting_key: z.number().int().positive(),
  meeting_name: z.string().min(1),
  meeting_official_name: z.string(),
  location: z.string(),
  country_key: z.number().int(),
  country_code: z.string(),
  country_name: z.string(),
  circuit_key: z.number().int(),
  circuit_short_name: z.string(),
  date_start: z.string(),
  gmt_offset: z.string(),
  year: z.number().int().min(2020).max(2100),
})

/**
 * Session - Represents a session within a meeting
 * Endpoint: /sessions
 */
export const OpenF1SessionSchema = z.object({
  session_key: z.number().int().positive(),
  session_name: z.string(),
  session_type: z.string(),
  meeting_key: z.number().int().positive(),
  location: z.string(),
  country_key: z.number().int(),
  country_code: z.string(),
  country_name: z.string(),
  circuit_key: z.number().int(),
  circuit_short_name: z.string(),
  date_start: z.string(),
  date_end: z.string(),
  gmt_offset: z.string(),
  year: z.number().int().min(2020).max(2100),
})

/**
 * Driver - Driver information for a session
 * Endpoint: /drivers
 */
export const OpenF1DriverSchema = z.object({
  driver_number: z.number().int().min(1).max(99),
  broadcast_name: z.string(),
  full_name: z.string(),
  name_acronym: z.string(),
  team_name: z.string(),
  team_colour: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  headshot_url: z.string().nullable(),
  country_code: z.string().nullable(),
  session_key: z.number().int().positive(),
  meeting_key: z.number().int().positive(),
})

/**
 * Location - Car position on track (GPS coordinates)
 * Endpoint: /location
 */
export const OpenF1LocationSchema = z.object({
  driver_number: z.number().int().positive(),
  date: z.string(),
  x: z.number(),
  y: z.number(),
  z: z.number(),
  session_key: z.number().int().positive(),
  meeting_key: z.number().int().positive(),
})

/**
 * Position - Race position/standings
 * Endpoint: /position
 */
export const OpenF1PositionSchema = z.object({
  driver_number: z.number().int().positive(),
  position: z.number().int().min(1).max(30),
  date: z.string(),
  session_key: z.number().int().positive(),
  meeting_key: z.number().int().positive(),
})

/**
 * Interval - Gap to car ahead and leader
 * Endpoint: /intervals
 */
export const OpenF1IntervalSchema = z.object({
  driver_number: z.number().int().positive(),
  interval: z.union([z.number(), z.string()]).nullable(),
  gap_to_leader: z.union([z.number(), z.string()]).nullable(),
  date: z.string(),
  session_key: z.number().int().positive(),
  meeting_key: z.number().int().positive(),
})

/**
 * Lap - Lap timing data
 * Endpoint: /laps
 */
export const OpenF1LapSchema = z.object({
  driver_number: z.number().int().positive(),
  lap_number: z.number().int().min(0),
  lap_duration: z.number().nullable(),
  duration_sector_1: z.number().nullable(),
  duration_sector_2: z.number().nullable(),
  duration_sector_3: z.number().nullable(),
  i1_speed: z.number().nullable(),
  i2_speed: z.number().nullable(),
  st_speed: z.number().nullable(),
  is_pit_out_lap: z.boolean(),
  date_start: z.string().nullable(),
  session_key: z.number().int().positive(),
  meeting_key: z.number().int().positive(),
})

/**
 * PitStop - Pit stop data
 * Endpoint: /pit
 */
export const OpenF1PitStopSchema = z.object({
  driver_number: z.number().int().positive(),
  lap_number: z.number().int().min(0),
  pit_duration: z.number().nullable(),
  date: z.string(),
  session_key: z.number().int().positive(),
  meeting_key: z.number().int().positive(),
})

/**
 * RaceControl - Race control messages
 * Endpoint: /race_control
 */
export const OpenF1RaceControlSchema = z.object({
  category: z.string(),
  flag: z.string().nullable(),
  scope: z.string().nullable(),
  sector: z.number().nullable(),
  message: z.string(),
  driver_number: z.number().nullable(),
  lap_number: z.number().nullable(),
  date: z.string(),
  session_key: z.number().int().positive(),
  meeting_key: z.number().int().positive(),
})

/**
 * Weather - Track weather conditions
 * Endpoint: /weather
 */
export const OpenF1WeatherSchema = z.object({
  air_temperature: z.number(),
  date: z.string(),
  humidity: z.number(),
  meeting_key: z.number().int().positive(),
  pressure: z.number(),
  rainfall: z.number(),
  session_key: z.number().int().positive(),
  track_temperature: z.number(),
  wind_direction: z.number().min(0).max(359),
  wind_speed: z.number(),
})

/**
 * TeamRadio - Team radio communications
 * Endpoint: /team_radio
 */
export const OpenF1TeamRadioSchema = z.object({
  meeting_key: z.number().int().positive(),
  session_key: z.number().int().positive(),
  driver_number: z.number().int().positive(),
  date: z.string(),
  recording_url: z.string().url(),
})

// Array validators for bulk responses
export const OpenF1MeetingsArraySchema = z.array(OpenF1MeetingSchema)
export const OpenF1SessionsArraySchema = z.array(OpenF1SessionSchema)
export const OpenF1DriversArraySchema = z.array(OpenF1DriverSchema)
export const OpenF1LocationsArraySchema = z.array(OpenF1LocationSchema)
export const OpenF1PositionsArraySchema = z.array(OpenF1PositionSchema)
export const OpenF1IntervalsArraySchema = z.array(OpenF1IntervalSchema)
export const OpenF1LapsArraySchema = z.array(OpenF1LapSchema)
export const OpenF1PitStopsArraySchema = z.array(OpenF1PitStopSchema)
export const OpenF1RaceControlArraySchema = z.array(OpenF1RaceControlSchema)
export const OpenF1WeatherArraySchema = z.array(OpenF1WeatherSchema)
export const OpenF1TeamRadioArraySchema = z.array(OpenF1TeamRadioSchema)

// Type exports inferred from schemas (optional - can use existing types)
export type ValidatedMeeting = z.infer<typeof OpenF1MeetingSchema>
export type ValidatedSession = z.infer<typeof OpenF1SessionSchema>
export type ValidatedDriver = z.infer<typeof OpenF1DriverSchema>
export type ValidatedLocation = z.infer<typeof OpenF1LocationSchema>
export type ValidatedPosition = z.infer<typeof OpenF1PositionSchema>
export type ValidatedInterval = z.infer<typeof OpenF1IntervalSchema>
export type ValidatedLap = z.infer<typeof OpenF1LapSchema>
export type ValidatedPitStop = z.infer<typeof OpenF1PitStopSchema>
export type ValidatedRaceControl = z.infer<typeof OpenF1RaceControlSchema>
export type ValidatedWeather = z.infer<typeof OpenF1WeatherSchema>
export type ValidatedTeamRadio = z.infer<typeof OpenF1TeamRadioSchema>

/**
 * Validate an array of items against a schema, filtering out invalid items
 * Logs warnings for invalid items in development
 */
export function validateArray<T>(
  data: unknown,
  schema: z.ZodType<T>,
  endpoint: string
): T[] {
  if (!Array.isArray(data)) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[OpenF1 Validation] Expected array for ${endpoint}, got ${typeof data}`)
    }
    return []
  }

  const validItems: T[] = []
  let invalidCount = 0

  for (const item of data) {
    const result = schema.safeParse(item)
    if (result.success) {
      validItems.push(result.data)
    } else {
      invalidCount++
      if (process.env.NODE_ENV === "development" && invalidCount <= 3) {
        console.warn(
          `[OpenF1 Validation] Invalid item in ${endpoint}:`,
          result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ")
        )
      }
    }
  }

  if (invalidCount > 0 && process.env.NODE_ENV === "development") {
    console.warn(
      `[OpenF1 Validation] Filtered ${invalidCount} invalid items from ${endpoint} (${validItems.length} valid)`
    )
  }

  return validItems
}

/**
 * Validate a single item against a schema
 * Returns null if validation fails
 */
export function validateItem<T>(
  data: unknown,
  schema: z.ZodType<T>,
  endpoint: string
): T | null {
  const result = schema.safeParse(data)
  if (result.success) {
    return result.data
  }

  if (process.env.NODE_ENV === "development") {
    console.warn(
      `[OpenF1 Validation] Invalid item in ${endpoint}:`,
      result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ")
    )
  }

  return null
}
