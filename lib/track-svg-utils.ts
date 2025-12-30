/**
 * Track SVG Utilities
 *
 * Client-side utilities for parsing track SVG files and extracting
 * path points for car positioning. This ensures cars are placed ON
 * the actual track line instead of an approximation.
 */
import { getTrackCalibration } from "./track-calibration"

export interface StartLineMeta {
  startPoint: Track3DPoint
  direction: { x: number; z: number }
  rotation: number
  startOffset: number
}

export interface TrackPoint {
  x: number
  y: number
}

export interface Track3DPoint {
  x: number
  y: number
  z: number
}

export const TRACK_WIDTH = 2.4

function dedupeTrack3DPoints(points: Track3DPoint[]): Track3DPoint[] {
  const result: Track3DPoint[] = []

  for (const p of points) {
    const last = result[result.length - 1]
    if (!last || Math.abs(p.x - last.x) > 1e-4 || Math.abs(p.z - last.z) > 1e-4) {
      result.push(p)
    }
  }

  return result
}

/**
 * Parse SVG path "d" attribute and extract points
 * Handles M, L, and Z commands (the most common in our track SVGs)
 */
export function parseSVGPathData(pathData: string): TrackPoint[] {
  const points: TrackPoint[] = []

  // Match all L (line) and M (move) commands with coordinates
  // Our track SVGs primarily use M and L commands
  const regex = /([ML])\s*([\d.-]+)\s*,\s*([\d.-]+)/gi
  let match

  while ((match = regex.exec(pathData)) !== null) {
    const x = parseFloat(match[2])
    const y = parseFloat(match[3])
    if (!isNaN(x) && !isNaN(y)) {
      points.push({ x, y })
    }
  }

  return points
}

/**
 * Calculate the center and bounds of track points
 */
export function calculateTrackCenter(points: TrackPoint[]): {
  centerX: number
  centerY: number
  minX: number
  maxX: number
  minY: number
  maxY: number
} {
  if (points.length === 0) {
    return { centerX: 100, centerY: 60, minX: 0, maxX: 200, minY: 0, maxY: 120 }
  }

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }

  return {
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    minX,
    maxX,
    minY,
    maxY,
  }
}

/**
 * Convert SVG points to 3D track space
 * Uses the same transformation as Track3D component
 */
export function svgPointsToTrack3D(
  points: TrackPoint[],
  trackId: string
): Track3DPoint[] {
  if (points.length === 0) return []

  const calibration = getTrackCalibration(trackId)
  const scale = calibration.render.trackScale
  const carHeight = calibration.render.carHeight * 3
  const { centerX, centerY } = calculateTrackCenter(points)

  return points.map(p => ({
    x: (p.x - centerX) * scale,
    y: carHeight,
    z: (p.y - centerY) * scale,
  }))
}

/**
 * Calculate total path length from 3D points
 */
export function calculatePathLength(points: Track3DPoint[], closed: boolean = true): number {
  if (points.length < 2) return 0

  let length = 0
  const segmentCount = closed ? points.length : points.length - 1

  for (let i = 0; i < segmentCount; i++) {
    const nextIndex = (i + 1) % points.length
    const dx = points[nextIndex].x - points[i].x
    const dz = points[nextIndex].z - points[i].z
    length += Math.sqrt(dx * dx + dz * dz)
  }

  return length
}

/**
 * Get point at specific distance along the path
 */
export function getPointAtDistance(
  points: Track3DPoint[],
  distance: number,
  closed: boolean = true
): { position: Track3DPoint; rotation: number } {
  if (points.length === 0) {
    return { position: { x: 0, y: 0.45, z: 0 }, rotation: 0 }
  }

  if (points.length === 1) {
    return { position: points[0], rotation: 0 }
  }

  const totalLength = calculatePathLength(points, closed)
  if (totalLength === 0) {
    return { position: points[0], rotation: 0 }
  }

  const target = closed
    ? ((distance % totalLength) + totalLength) % totalLength
    : Math.max(0, Math.min(distance, totalLength))

  let traveled = 0
  const segmentCount = closed ? points.length : points.length - 1

  for (let i = 0; i < segmentCount; i++) {
    const nextIndex = (i + 1) % points.length
    const dx = points[nextIndex].x - points[i].x
    const dz = points[nextIndex].z - points[i].z
    const segmentLength = Math.sqrt(dx * dx + dz * dz)

    if (traveled + segmentLength >= target) {
      // Interpolate within this segment
      const remaining = target - traveled
      const t = segmentLength > 0 ? remaining / segmentLength : 0

      const position: Track3DPoint = {
        x: points[i].x + dx * t,
        y: points[i].y,
        z: points[i].z + dz * t,
      }

      // Calculate rotation to face direction of travel
      // F1Car model has nose pointing along +X, so we subtract PI/2
      const rotation = Math.atan2(dx, dz) - Math.PI / 2

      return { position, rotation }
    }

    traveled += segmentLength
  }

  // Return last point if distance exceeds path length
  const lastIdx = closed ? 0 : points.length - 1
  const prevIdx = closed ? segmentCount - 1 : points.length - 2
  const dx = points[lastIdx].x - points[prevIdx].x
  const dz = points[lastIdx].z - points[prevIdx].z

  return {
    position: points[lastIdx],
    rotation: Math.atan2(dx, dz) - Math.PI / 2
  }
}

/**
 * Distribute cars evenly along track path
 */
export function distributeCarPositions(
  points: Track3DPoint[],
  numCars: number,
  startOffset: number = 0 // 0-1 offset around track for starting position
): Array<{ position: Track3DPoint; rotation: number }> {
  if (points.length === 0 || numCars === 0) return []

  const totalLength = calculatePathLength(points)
  const spacing = totalLength / numCars

  const result: Array<{ position: Track3DPoint; rotation: number }> = []

  for (let i = 0; i < numCars; i++) {
    // Distribute cars with offset, wrap around
    const distance = ((i * spacing) + (startOffset * totalLength)) % totalLength
    const { position, rotation } = getPointAtDistance(points, distance)
    result.push({ position, rotation })
  }

  return result
}

/**
 * Calculate starting grid positions for F1-style grid
 * Cars are positioned in a 2-wide staggered formation behind the start line
 */
export function calculateStartingGridPositions(
  points: Track3DPoint[],
  numCars: number,
  gridSpacing: number = TRACK_WIDTH * 1.6, // Distance between grid rows
  laneOffset: number = TRACK_WIDTH * 0.35, // Left/right offset from center
  startMeta?: StartLineMeta
): Array<{ position: Track3DPoint; rotation: number }> {
  if (points.length < 2 || numCars === 0) return []

  const meta = startMeta ?? getStartLineMeta(points)
  const result: Array<{ position: Track3DPoint; rotation: number }> = []

  const dirX = meta.direction.x
  const dirZ = meta.direction.z

  // Perpendicular for lane offset
  const perpX = -dirZ
  const perpZ = dirX

  const rotation = meta.rotation
  const startPoint = meta.startPoint

  for (let i = 0; i < numCars; i++) {
    // Calculate grid row (0, 1, 2, ...) and side (0 = left/pole, 1 = right)
    const row = Math.floor(i / 2)
    const side = i % 2

    // Offset behind start line (negative direction)
    const backOffset = (row + 1) * gridSpacing

    // Stagger effect: odd rows are offset slightly more
    const staggerOffset = side === 1 ? gridSpacing * 0.35 : 0

    // Lane offset (left for pole, right for other)
    const sideOffset = side === 0 ? laneOffset : -laneOffset

    const position: Track3DPoint = {
      x: startPoint.x - dirX * (backOffset + staggerOffset) + perpX * sideOffset,
      y: 0.45, // 3x scaled
      z: startPoint.z - dirZ * (backOffset + staggerOffset) + perpZ * sideOffset,
    }

    result.push({ position, rotation })
  }

  return result
}

/**
 * Interpolate a position along the track given a progress value (0-1)
 */
export function getPositionAlongTrack(
  points: Track3DPoint[],
  progress: number, // 0-1 around the track
  startOffset: number = 0
): { position: Track3DPoint; rotation: number } {
  if (points.length === 0) {
    return { position: { x: 0, y: 0.45, z: 0 }, rotation: 0 }
  }

  const totalLength = calculatePathLength(points)
  const adjustedProgress = (progress + startOffset) % 1
  const targetDistance = adjustedProgress * totalLength

  return getPointAtDistance(points, targetDistance)
}

/**
 * Fetch and parse track SVG from public folder
 * Returns cached promise to avoid multiple fetches
 */
const trackCache = new Map<string, Promise<Track3DPoint[]>>()

export async function fetchTrackPoints(trackId: string): Promise<Track3DPoint[]> {
  const cacheKey = trackId

  if (trackCache.has(cacheKey)) {
    return trackCache.get(cacheKey)!
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch(`/tracks/${trackId}.svg`)
      if (!response.ok) {
        console.warn(`Failed to fetch track SVG for ${trackId}`)
        return []
      }

      const svgText = await response.text()

      // Extract path data from SVG
      // Look for the main track line (second path, stroke="#00d4ff")
      const pathMatch = svgText.match(/stroke="#00d4ff"[^>]*d="([^"]+)"/i)
        || svgText.match(/d="([^"]+)"/i)

      if (!pathMatch) {
        console.warn(`No path found in track SVG for ${trackId}`)
        return []
      }

      const pathData = pathMatch[1]
      const svgPoints = parseSVGPathData(pathData)
      const track3DPoints = dedupeTrack3DPoints(svgPointsToTrack3D(svgPoints, trackId))

      return track3DPoints
    } catch (error) {
      console.error(`Error fetching track SVG for ${trackId}:`, error)
      return []
    }
  })()

  trackCache.set(cacheKey, fetchPromise)
  return fetchPromise
}

/**
 * Synchronously get track points from hardcoded data
 * This is used as fallback and for SSR
 */
export function getDefaultTrackPoints(trackId: string, numPoints: number = 100): Track3DPoint[] {
  // Generate points along an ellipse as fallback
  // This matches the typical track extent after SVG processing with calibration scale
  const points: Track3DPoint[] = []
  const calibration = getTrackCalibration(trackId)
  const scale = calibration.render.trackScale
  const carHeight = calibration.render.carHeight * 3

  const radiusX = 90 * scale
  const radiusZ = 55 * scale

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2
    points.push({
      x: Math.cos(angle) * radiusX,
      y: carHeight,
      z: Math.sin(angle) * radiusZ,
    })
  }

  return points
}

/**
 * Clear track cache (useful for testing/development)
 */
export function clearTrackCache(): void {
  trackCache.clear()
}

/**
 * Calculate start/finish line metadata for a track
 * Uses the longest straight as the start location for stability across circuits.
 */
export function getStartLineMeta(points: Track3DPoint[]): StartLineMeta {
  if (points.length < 2) {
    return {
      startPoint: { x: 0, y: 0.45, z: 0 },
      direction: { x: 1, z: 0 },
      rotation: -Math.PI / 2,
      startOffset: 0,
    }
  }

  const totalLength = calculatePathLength(points)
  const segmentCount = points.length
  let longestIdx = 0
  let longestLength = 0
  const cumulative: number[] = [0]

  for (let i = 0; i < segmentCount; i++) {
    const nextIndex = (i + 1) % points.length
    const dx = points[nextIndex].x - points[i].x
    const dz = points[nextIndex].z - points[i].z
    const segLength = Math.sqrt(dx * dx + dz * dz)

    cumulative.push(cumulative[i] + segLength)

    if (segLength > longestLength) {
      longestLength = segLength
      longestIdx = i
    }
  }

  const nextIdx = (longestIdx + 1) % points.length
  const dx = points[nextIdx].x - points[longestIdx].x
  const dz = points[nextIdx].z - points[longestIdx].z
  const directionLen = Math.sqrt(dx * dx + dz * dz) || 1
  const dirX = dx / directionLen
  const dirZ = dz / directionLen

  // Place start line a bit down the longest straight to avoid corners
  const startDistance = cumulative[longestIdx] + longestLength * 0.35
  const startProgress = totalLength > 0 ? (startDistance % totalLength) / totalLength : 0
  const { position, rotation } = getPointAtDistance(points, startDistance)

  return {
    startPoint: { ...position, y: points[0].y },
    direction: { x: dirX, z: dirZ },
    rotation,
    startOffset: startProgress,
  }
}

/**
 * Fetch the raw SVG path string for rendering outlines (landing page)
 */
const trackPathCache = new Map<string, Promise<string | null>>()

export async function fetchTrackPathD(trackId: string): Promise<string | null> {
  if (trackPathCache.has(trackId)) {
    return trackPathCache.get(trackId)!
  }

  const promise = (async () => {
    try {
      const response = await fetch(`/tracks/${trackId}.svg`)
      if (!response.ok) {
        console.warn(`Failed to fetch track SVG for ${trackId}`)
        return null
      }

      const svgText = await response.text()
      const pathMatch =
        svgText.match(/stroke="#00d4ff"[^>]*d="([^"]+)"/i) ||
        svgText.match(/d="([^"]+)"/i)

      return pathMatch ? pathMatch[1] : null
    } catch (error) {
      console.error(`Error fetching track path for ${trackId}:`, error)
      return null
    }
  })()

  trackPathCache.set(trackId, promise)
  return promise
}
