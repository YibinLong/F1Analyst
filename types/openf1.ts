// OpenF1 API TypeScript Interfaces
// API Documentation: https://openf1.org

/**
 * Meeting - Represents an F1 race weekend/event
 * Endpoint: /meetings
 */
export interface OpenF1Meeting {
  meeting_key: number
  meeting_name: string
  meeting_official_name: string
  location: string
  country_key: number
  country_code: string
  country_name: string
  circuit_key: number
  circuit_short_name: string
  date_start: string
  gmt_offset: string
  year: number
}

/**
 * Session - Represents a session within a meeting (Practice, Qualifying, Race, etc.)
 * Endpoint: /sessions
 */
export interface OpenF1Session {
  session_key: number
  session_name: string
  session_type: string
  meeting_key: number
  location: string
  country_key: number
  country_code: string
  country_name: string
  circuit_key: number
  circuit_short_name: string
  date_start: string
  date_end: string
  gmt_offset: string
  year: number
}

/**
 * Driver - Driver information for a session
 * Endpoint: /drivers
 */
export interface OpenF1Driver {
  driver_number: number
  broadcast_name: string
  full_name: string
  name_acronym: string
  team_name: string
  team_colour: string
  first_name: string
  last_name: string
  headshot_url: string | null
  country_code: string | null
  session_key: number
  meeting_key: number
}

/**
 * Location - Car position on track (GPS coordinates)
 * Endpoint: /location
 * Note: Data frequency is approximately 3.7 Hz
 */
export interface OpenF1Location {
  driver_number: number
  date: string
  x: number
  y: number
  z: number
  session_key: number
  meeting_key: number
}

/**
 * Position - Race position/standings
 * Endpoint: /position
 */
export interface OpenF1Position {
  driver_number: number
  position: number
  date: string
  session_key: number
  meeting_key: number
}

/**
 * Interval - Gap to car ahead and leader
 * Endpoint: /intervals
 */
export interface OpenF1Interval {
  driver_number: number
  interval: number | string | null
  gap_to_leader: number | string | null
  date: string
  session_key: number
  meeting_key: number
}

/**
 * Lap - Lap timing data
 * Endpoint: /laps
 */
export interface OpenF1Lap {
  driver_number: number
  lap_number: number
  lap_duration: number | null
  duration_sector_1: number | null
  duration_sector_2: number | null
  duration_sector_3: number | null
  i1_speed: number | null
  i2_speed: number | null
  st_speed: number | null
  is_pit_out_lap: boolean
  date_start: string | null
  session_key: number
  meeting_key: number
}

/**
 * PitStop - Pit stop data
 * Endpoint: /pit
 */
export interface OpenF1PitStop {
  driver_number: number
  lap_number: number
  pit_duration: number | null
  date: string
  session_key: number
  meeting_key: number
}

/**
 * RaceControl - Race control messages (flags, safety car, etc.)
 * Endpoint: /race_control
 */
export interface OpenF1RaceControl {
  category: string
  flag: string | null
  scope: string | null
  sector: number | null
  message: string
  driver_number: number | null
  lap_number: number | null
  date: string
  session_key: number
  meeting_key: number
}

/**
 * Weather - Track weather conditions
 * Endpoint: /weather
 * Note: Data updated every minute
 */
export interface OpenF1Weather {
  air_temperature: number
  date: string
  humidity: number
  meeting_key: number
  pressure: number
  rainfall: number
  session_key: number
  track_temperature: number
  wind_direction: number
  wind_speed: number
}

/**
 * TeamRadio - Team radio communications
 * Endpoint: /team_radio
 * Note: Contains URLs to audio recordings of driver-team communications
 */
export interface OpenF1TeamRadio {
  meeting_key: number
  session_key: number
  driver_number: number
  date: string
  recording_url: string
}

// Frontend-friendly mapped types

/**
 * Mapped race type for frontend consumption
 */
export interface MappedRace {
  meetingKey: string
  meetingName: string
  country: string
  location: string
  circuitKey: string
  round: number
  dateStart: string
  dateEnd: string
  dateDisplay: string
}

/**
 * Mapped driver type for frontend consumption
 */
export interface MappedDriver {
  number: number
  code: string
  firstName: string
  lastName: string
  team: string
  teamColor: string
  headshotUrl: string | null
}

/**
 * Position data grouped by lap for efficient lookup
 */
export interface PositionsByLap {
  [lap: number]: {
    [driverNumber: number]: number
  }
}

/**
 * Interval data grouped by lap for efficient lookup
 */
export interface IntervalsByLap {
  [lap: number]: {
    [driverNumber: number]: {
      interval: number | string | null
      gapToLeader: number | string | null
    }
  }
}

/**
 * Location data grouped by timestamp for animation
 */
export interface LocationsByTime {
  [timestamp: string]: {
    [driverNumber: number]: {
      x: number
      y: number
      z: number
    }
  }
}

/**
 * Complete race data package for the race viewer
 */
export interface RaceData {
  sessionKey: number
  meetingKey: number
  totalLaps: number
  drivers: MappedDriver[]
  positions: OpenF1Position[]
  intervals: OpenF1Interval[]
  locations: OpenF1Location[]
  laps: OpenF1Lap[]
  raceControl: OpenF1RaceControl[]
}
