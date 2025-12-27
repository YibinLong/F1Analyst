/**
 * Track SVG Utilities
 *
 * Client-side utilities for parsing track SVG files and extracting
 * path points for car positioning. This ensures cars are placed ON
 * the actual track line instead of an approximation.
 */

export interface TrackPoint {
  x: number
  y: number
}

export interface Track3DPoint {
  x: number
  y: number
  z: number
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
  scale: number = 0.1
): Track3DPoint[] {
  if (points.length === 0) return []

  const { centerX, centerY } = calculateTrackCenter(points)

  return points.map(p => ({
    x: (p.x - centerX) * scale,
    y: 0.15, // Car height above track
    z: (p.y - centerY) * scale,
  }))
}

/**
 * Calculate total path length from 3D points
 */
export function calculatePathLength(points: Track3DPoint[]): number {
  if (points.length < 2) return 0

  let length = 0
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x
    const dz = points[i].z - points[i - 1].z
    length += Math.sqrt(dx * dx + dz * dz)
  }

  return length
}

/**
 * Get point at specific distance along the path
 */
export function getPointAtDistance(
  points: Track3DPoint[],
  distance: number
): { point: Track3DPoint; rotation: number } {
  if (points.length === 0) {
    return { point: { x: 0, y: 0.15, z: 0 }, rotation: 0 }
  }

  if (points.length === 1) {
    return { point: points[0], rotation: 0 }
  }

  let traveled = 0

  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x
    const dz = points[i].z - points[i - 1].z
    const segmentLength = Math.sqrt(dx * dx + dz * dz)

    if (traveled + segmentLength >= distance) {
      // Interpolate within this segment
      const remaining = distance - traveled
      const t = segmentLength > 0 ? remaining / segmentLength : 0

      const point: Track3DPoint = {
        x: points[i - 1].x + dx * t,
        y: 0.15,
        z: points[i - 1].z + dz * t,
      }

      // Calculate rotation to face direction of travel
      const rotation = Math.atan2(dx, dz)

      return { point, rotation }
    }

    traveled += segmentLength
  }

  // Return last point if distance exceeds path length
  const lastIdx = points.length - 1
  const prevIdx = points.length - 2
  const dx = points[lastIdx].x - points[prevIdx].x
  const dz = points[lastIdx].z - points[prevIdx].z

  return {
    point: points[lastIdx],
    rotation: Math.atan2(dx, dz)
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
    const { point, rotation } = getPointAtDistance(points, distance)
    result.push({ position: point, rotation })
  }

  return result
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
      const track3DPoints = svgPointsToTrack3D(svgPoints, 0.1)

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
  // This matches the typical track extent after SVG processing
  const points: Track3DPoint[] = []

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2
    points.push({
      x: Math.cos(angle) * 4,  // ~±4 typical track X extent
      y: 0.15,
      z: Math.sin(angle) * 5,  // ~±5 typical track Z extent
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
