// Track coordinate utilities for mapping OpenF1 location data to track visualization

import type { OpenF1Location } from "@/types/openf1"
import { getTrackCalibration, transformGPSToTrackSpace } from "./track-calibration"

/**
 * Track coordinate bounds for each circuit
 * These define the min/max x,y values from OpenF1 location data
 */
export interface TrackBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/**
 * Calculate bounds from location data
 */
export function calculateTrackBounds(locations: OpenF1Location[]): TrackBounds {
  if (locations.length === 0) {
    return { minX: 0, maxX: 1, minY: 0, maxY: 1 }
  }

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const loc of locations) {
    if (loc.x < minX) minX = loc.x
    if (loc.x > maxX) maxX = loc.x
    if (loc.y < minY) minY = loc.y
    if (loc.y > maxY) maxY = loc.y
  }

  return { minX, maxX, minY, maxY }
}

/**
 * Normalize coordinates to 0-1 range based on track bounds
 */
export function normalizeCoordinates(
  x: number,
  y: number,
  bounds: TrackBounds
): { x: number; y: number } {
  const rangeX = bounds.maxX - bounds.minX || 1
  const rangeY = bounds.maxY - bounds.minY || 1

  return {
    x: (x - bounds.minX) / rangeX,
    y: (y - bounds.minY) / rangeY,
  }
}

/**
 * Get car position from raw coordinates with bounds
 * Uses scale values matching the Track3D rendered track
 */
export function getCarPosition(
  x: number,
  y: number,
  bounds: TrackBounds,
  trackId: string
): { x: number; y: number; z: number } {
  const calibration = getTrackCalibration(trackId)
  const mapped = transformGPSToTrackSpace(x, y, bounds, calibration)
  const carHeight = calibration.render.carHeight * 3
  return {
    x: mapped.x,
    y: carHeight,
    z: mapped.z,
  }
}

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Easing function: ease-in-out cubic
 * Smooth acceleration and deceleration
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * Easing function: smooth step
 * Ken Perlin's improved smooth step function
 */
export function smoothStep(t: number): number {
  return t * t * (3 - 2 * t)
}

/**
 * Easing function: smoother step (Ken Perlin)
 * Even smoother than smoothStep with zero second derivative at endpoints
 */
export function smootherStep(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/**
 * Apply easing to interpolation
 */
export function lerpWithEasing(
  a: number,
  b: number,
  t: number,
  easingFn: (t: number) => number = smoothStep
): number {
  return a + (b - a) * easingFn(t)
}

/**
 * Interpolate between two positions
 */
export function interpolatePosition(
  pos1: { x: number; y: number; z: number },
  pos2: { x: number; y: number; z: number },
  t: number
): { x: number; y: number; z: number } {
  return {
    x: lerp(pos1.x, pos2.x, t),
    y: lerp(pos1.y, pos2.y, t),
    z: lerp(pos1.z, pos2.z, t),
  }
}

/**
 * Group locations by driver number
 */
export function groupLocationsByDriver(
  locations: OpenF1Location[]
): Map<number, OpenF1Location[]> {
  const grouped = new Map<number, OpenF1Location[]>()

  for (const loc of locations) {
    const existing = grouped.get(loc.driver_number) || []
    existing.push(loc)
    grouped.set(loc.driver_number, existing)
  }

  // Sort each driver's locations by timestamp
  for (const [driverNum, locs] of grouped) {
    locs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    grouped.set(driverNum, locs)
  }

  return grouped
}

/**
 * Find the two location points surrounding a given timestamp for interpolation
 */
export function findSurroundingLocations(
  locations: OpenF1Location[],
  timestamp: number
): { before: OpenF1Location | null; after: OpenF1Location | null; t: number } {
  if (locations.length === 0) {
    return { before: null, after: null, t: 0 }
  }

  // Binary search for efficiency
  let low = 0
  let high = locations.length - 1

  while (low < high) {
    const mid = Math.floor((low + high) / 2)
    const midTime = new Date(locations[mid].date).getTime()

    if (midTime < timestamp) {
      low = mid + 1
    } else {
      high = mid
    }
  }

  const afterIndex = low
  const beforeIndex = Math.max(0, low - 1)

  const before = locations[beforeIndex]
  const after = locations[afterIndex]

  if (!before || !after) {
    return { before: before || null, after: after || null, t: 0 }
  }

  const beforeTime = new Date(before.date).getTime()
  const afterTime = new Date(after.date).getTime()

  // Calculate interpolation factor
  const t = afterTime === beforeTime ? 0 : (timestamp - beforeTime) / (afterTime - beforeTime)

  return { before, after, t: Math.max(0, Math.min(1, t)) }
}

/**
 * Get interpolated position for a driver at a given timestamp
 */
export function getInterpolatedPosition(
  driverLocations: OpenF1Location[],
  timestamp: number,
  bounds: TrackBounds,
  trackId: string
): { x: number; y: number; z: number } | null {
  const { before, after, t } = findSurroundingLocations(driverLocations, timestamp)

  if (!before) {
    return null
  }

  if (!after || t === 0) {
    return getCarPosition(before.x, before.y, bounds, trackId)
  }

  const pos1 = getCarPosition(before.x, before.y, bounds, trackId)
  const pos2 = getCarPosition(after.x, after.y, bounds, trackId)

  return interpolatePosition(pos1, pos2, t)
}

/**
 * Calculate car rotation (Y-axis) from movement direction
 * F1Car model faces +X, so we subtract PI/2 to align with movement direction
 */
export function calculateCarRotation(
  fromPos: { x: number; z: number },
  toPos: { x: number; z: number }
): number {
  const dx = toPos.x - fromPos.x
  const dz = toPos.z - fromPos.z
  const distance = Math.sqrt(dx * dx + dz * dz)

  if (distance < 0.0001) {
    // No significant movement, return 0 (pointing along +X after adjustment)
    return 0
  }

  // atan2(dx, dz) gives angle from movement direction
  // F1Car model faces +X, so subtract PI/2 to align
  return Math.atan2(dx, dz) - Math.PI / 2
}

/**
 * Get interpolated position AND rotation for a driver at a given timestamp
 * The rotation is calculated from the trajectory direction (before -> after points)
 * which provides stable orientation during animation
 */
export function getInterpolatedPositionWithRotation(
  driverLocations: OpenF1Location[],
  timestamp: number,
  bounds: TrackBounds,
  trackId: string
): { x: number; y: number; z: number; rotation: number } | null {
  const { before, after, t } = findSurroundingLocations(driverLocations, timestamp)

  if (!before) {
    return null
  }

  const pos1 = getCarPosition(before.x, before.y, bounds, trackId)

  if (!after || before === after) {
    // No second point - try to find a future point for rotation calculation
    const beforeIndex = driverLocations.indexOf(before)
    const futurePoint = driverLocations[beforeIndex + 1]

    if (futurePoint) {
      const pos2 = getCarPosition(futurePoint.x, futurePoint.y, bounds, trackId)
      const rotation = calculateCarRotation(pos1, pos2)
      return { ...pos1, rotation }
    }

    // No future point, try past point
    const pastPoint = driverLocations[beforeIndex - 1]
    if (pastPoint) {
      const pos0 = getCarPosition(pastPoint.x, pastPoint.y, bounds, trackId)
      const rotation = calculateCarRotation(pos0, pos1)
      return { ...pos1, rotation }
    }

    // Fallback: no rotation data available
    return { ...pos1, rotation: 0 }
  }

  const pos2 = getCarPosition(after.x, after.y, bounds, trackId)
  const interpolatedPos = interpolatePosition(pos1, pos2, t)

  // Calculate rotation from the trajectory direction (before -> after)
  // This gives stable rotation based on actual movement path, not frame deltas
  const rotation = calculateCarRotation(pos1, pos2)

  return { ...interpolatedPos, rotation }
}

/**
 * Get all driver positions at a given timestamp
 */
export function getAllDriverPositions(
  locationsByDriver: Map<number, OpenF1Location[]>,
  timestamp: number,
  bounds: TrackBounds,
  trackId: string
): Map<number, { x: number; y: number; z: number }> {
  const positions = new Map<number, { x: number; y: number; z: number }>()

  for (const [driverNum, locations] of locationsByDriver) {
    const pos = getInterpolatedPosition(locations, timestamp, bounds, trackId)
    if (pos) {
      positions.set(driverNum, pos)
    }
  }

  return positions
}

/**
 * Convert lap number and progress to a timestamp within the race
 * This is useful for mapping lap-based timeline to location data timestamps
 */
export function lapToTimestamp(
  lap: number,
  lapProgress: number, // 0-1 progress through current lap
  laps: Array<{ lap_number: number; date_start: string; lap_duration: number | null }>
): number {
  // Find the lap start timestamp
  const lapData = laps.find((l) => l.lap_number === lap)
  if (!lapData) {
    // Fallback to first lap if not found
    const firstLap = laps[0]
    if (!firstLap) return Date.now()
    return new Date(firstLap.date_start).getTime()
  }

  const lapStart = new Date(lapData.date_start).getTime()
  const lapDuration = (lapData.lap_duration || 90) * 1000 // Default 90 seconds if no duration

  return lapStart + lapDuration * lapProgress
}

/**
 * Clamp coordinates to track bounds (prevent outliers)
 */
export function clampToTrackBounds(
  x: number,
  y: number,
  bounds: TrackBounds
): { x: number; y: number } {
  // Allow 10% margin outside bounds for track edges
  const marginX = (bounds.maxX - bounds.minX) * 0.1
  const marginY = (bounds.maxY - bounds.minY) * 0.1

  return {
    x: Math.max(bounds.minX - marginX, Math.min(bounds.maxX + marginX, x)),
    y: Math.max(bounds.minY - marginY, Math.min(bounds.maxY + marginY, y)),
  }
}

/**
 * Get race time range from locations
 */
export function getRaceTimeRange(locations: OpenF1Location[]): { start: number; end: number } {
  if (locations.length === 0) {
    return { start: Date.now(), end: Date.now() }
  }

  let start = Infinity
  let end = -Infinity

  for (const loc of locations) {
    const time = new Date(loc.date).getTime()
    if (time < start) start = time
    if (time > end) end = time
  }

  return { start, end }
}

/**
 * Calculate animation timestamp from lap and progress
 * Uses actual race timing data for accurate positioning
 */
export function getAnimationTimestamp(
  currentLap: number,
  lapProgress: number,
  raceTimeRange: { start: number; end: number },
  totalLaps: number
): number {
  // Calculate overall race progress
  const overallProgress = (currentLap - 1 + lapProgress) / totalLaps
  const raceDuration = raceTimeRange.end - raceTimeRange.start

  return raceTimeRange.start + raceDuration * overallProgress
}
