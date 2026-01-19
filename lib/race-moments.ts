/**
 * Race Moments Utility
 * Detects key moments in a race like overtakes from position data changes
 */

import type { OpenF1PitStop } from "@/types/openf1"

/**
 * Represents an overtake moment in the race
 */
export interface OvertakeMoment {
  /** Lap number when the overtake happened */
  lap: number
  /** Driver number who gained the position */
  overtaker: number
  /** Driver number who lost the position */
  overtaken: number
  /** New position of the overtaker */
  newPosition: number
  /** Previous position of the overtaker */
  previousPosition: number
  /** Whether this is a significant overtake (top 10 involved) */
  isSignificant: boolean
}

/**
 * Represents any key moment on the timeline
 */
export interface KeyMoment {
  type: "overtake"
  lap: number
  data: OvertakeMoment
}

/**
 * Detects overtakes from position changes between laps
 *
 * @param positionsByLap - Position data grouped by lap, then by driver number
 * @param pitStops - Pit stop data to filter out pit-related position changes
 * @param options - Configuration options
 * @returns Array of overtake moments sorted by lap
 */
export function detectOvertakes(
  positionsByLap: Record<number, Record<number, number>>,
  pitStops: OpenF1PitStop[] = [],
  options: {
    /** Only include overtakes involving top N drivers */
    topNDrivers?: number
    /** Maximum number of moments to return */
    maxMoments?: number
    /** Minimum position gain to count as an overtake (default: 1) */
    minPositionGain?: number
  } = {}
): OvertakeMoment[] {
  const { topNDrivers = 10, maxMoments = 15, minPositionGain = 1 } = options

  // Create a set of (driverNumber, lap) for pit stops to filter out pit-related changes
  const pitStopLaps = new Set<string>()
  for (const stop of pitStops) {
    // Mark the pit lap and the next lap as "pit-affected"
    pitStopLaps.add(`${stop.driver_number}-${stop.lap_number}`)
    pitStopLaps.add(`${stop.driver_number}-${stop.lap_number + 1}`)
  }

  const overtakes: OvertakeMoment[] = []
  const laps = Object.keys(positionsByLap)
    .map(Number)
    .sort((a, b) => a - b)

  // Compare consecutive laps to detect position changes
  for (let i = 1; i < laps.length; i++) {
    const prevLap = laps[i - 1]
    const currentLap = laps[i]
    const prevPositions = positionsByLap[prevLap] || {}
    const currentPositions = positionsByLap[currentLap] || {}

    // Build reverse lookup: position -> driver for current lap
    const positionToDriver: Record<number, number> = {}
    for (const [driverStr, position] of Object.entries(currentPositions)) {
      positionToDriver[position] = parseInt(driverStr, 10)
    }

    // Check each driver for position gains
    for (const [driverStr, currentPos] of Object.entries(currentPositions)) {
      const driverNumber = parseInt(driverStr, 10)
      const prevPos = prevPositions[driverNumber]

      // Skip if no previous position data
      if (prevPos === undefined) continue

      // Check for position gain
      const positionGain = prevPos - currentPos
      if (positionGain >= minPositionGain) {
        // Skip if this driver pitted (pit-related position change)
        if (pitStopLaps.has(`${driverNumber}-${currentLap}`)) continue

        // Find who was in this position before (the overtaken driver)
        // The driver who was previously in currentPos but is now behind
        let overtakenDriver: number | null = null
        for (const [otherDriverStr, otherCurrentPos] of Object.entries(currentPositions)) {
          const otherDriver = parseInt(otherDriverStr, 10)
          if (otherDriver === driverNumber) continue

          const otherPrevPos = prevPositions[otherDriver]
          if (otherPrevPos === currentPos) {
            // This driver was in the position the overtaker now holds
            overtakenDriver = otherDriver
            break
          }
        }

        // Skip if we couldn't identify who was overtaken
        if (overtakenDriver === null) continue

        // Skip if the overtaken driver pitted (they lost position due to pit, not overtake)
        if (pitStopLaps.has(`${overtakenDriver}-${currentLap}`)) continue

        // Determine if significant (involves top N drivers)
        const isSignificant = currentPos <= topNDrivers || prevPos <= topNDrivers

        overtakes.push({
          lap: currentLap,
          overtaker: driverNumber,
          overtaken: overtakenDriver,
          newPosition: currentPos,
          previousPosition: prevPos,
          isSignificant,
        })
      }
    }
  }

  // Filter to significant overtakes and limit count
  const significantOvertakes = overtakes.filter(o => o.isSignificant)

  // Sort by lap number, then by position (higher positions first for same lap)
  significantOvertakes.sort((a, b) => {
    if (a.lap !== b.lap) return a.lap - b.lap
    return a.newPosition - b.newPosition // Lower position (better) first
  })

  // Limit to max moments, prioritizing earlier laps and better positions
  return significantOvertakes.slice(0, maxMoments)
}

/**
 * Converts overtakes to key moments for display
 */
export function overtakesToKeyMoments(overtakes: OvertakeMoment[]): KeyMoment[] {
  return overtakes.map(overtake => ({
    type: "overtake" as const,
    lap: overtake.lap,
    data: overtake,
  }))
}

/**
 * Get all key moments in a race (currently just overtakes, can be extended)
 */
export function getKeyMoments(
  positionsByLap: Record<number, Record<number, number>>,
  pitStops: OpenF1PitStop[] = [],
  options: {
    maxMoments?: number
    topNDrivers?: number
  } = {}
): KeyMoment[] {
  const overtakes = detectOvertakes(positionsByLap, pitStops, options)
  return overtakesToKeyMoments(overtakes)
}
