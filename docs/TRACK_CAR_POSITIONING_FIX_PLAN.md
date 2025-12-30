# Track & Car Positioning Fix Plan

> **FOR AGENTS:** This document is self-contained. You do NOT need prior context. Follow the steps exactly.

---

## Project Context

This is **Pitstop AI**, an F1 race replay application built with:
- **Next.js 16** + **React** + **TypeScript**
- **Three.js** / **React Three Fiber** for 3D visualization
- **OpenF1 API** for real race data

The app displays a 3D track with F1 cars moving along it. Users select a race from the 2025 calendar and watch a replay.

---

## Current Problem

**When you load a race (e.g., Bahrain GP), the cars are NOT on the track correctly.**

Evidence from testing:
1. Console error: `Failed to load track SVG for sakhir: 404`
2. A generic oval fallback track is shown instead of the real Bahrain circuit
3. The track view shows "SAKHIR" but the SVG file is named `bahrain.svg`

---

## Root Causes (3 Issues to Fix)

### Issue 1: Circuit Name Mapping is Incomplete

**Location:** `lib/openf1.ts` → function `mapCircuitToKey()`

**Problem:** The OpenF1 API returns `circuit_short_name: "Sakhir"` for Bahrain GP. But our mapping function does NOT include "Sakhir", so it falls back to generating `"sakhir"` as the key. The SVG file is actually named `bahrain.svg`.

**Result:** Code tries to load `/tracks/sakhir.svg` → 404 error → fallback oval shown.

### Issue 2: CarFallback Uses Different Coordinates Than Track3D

**Location:**
- `components/race-viewer/track-visualization.tsx` → `CarFallback` component (line ~250)
- `lib/track-paths.ts` → hand-drawn SVG paths

**Problem:** When real location data is unavailable:
- `Track3D` renders from real SVG files in `/public/tracks/*.svg`
- `CarFallback` positions cars using `lib/track-paths.ts` (hand-drawn approximations)
- These have DIFFERENT coordinate systems, so cars appear off the track

### Issue 3: Track Scale is Too Small

**Location:** `lib/track-calibration.ts` → `defaultCalibration.render.trackScale`

**Problem:** Track scale of `0.1` makes the track appear small relative to F1 car models (~0.35 units long).

---

## Implementation Steps

### Step 1: Fix Circuit Name Mapping

**File to edit:** `/Users/yibin/Documents/WORKZONE/VSCODE/POST_GAUNTLET/F1Analyst/lib/openf1.ts`

**Find this section** (around line 429-493):
```typescript
const circuitMapping: Record<string, string> = {
  // Standard names
  Bahrain: "bahrain",
  ...
}
```

**Add these mappings** inside the `circuitMapping` object:
```typescript
// OpenF1 API returns these city/location names
"Sakhir": "bahrain",
"Montréal": "montreal",
"Yas Island": "yas_marina",
```

**Why:** The OpenF1 API uses location names (Sakhir, Montréal) while our SVG files use circuit names (bahrain, montreal).

---

### Step 2: Make CarFallback Use SVG Track Points

**Goal:** When location data is unavailable, cars should still appear on the REAL track shape (from SVG), not hand-drawn paths.

#### Step 2a: Create SVG Path Extraction Utility

**Create new file:** `/Users/yibin/Documents/WORKZONE/VSCODE/POST_GAUNTLET/F1Analyst/lib/track-svg-utils.ts`

```typescript
/**
 * Utility to extract path points from track SVG files.
 * Used to position cars on the track when real location data is unavailable.
 */

// Cache for parsed track points
const trackPointsCache = new Map<string, { x: number; z: number }[]>()

/**
 * Parse SVG path data string into array of points
 */
export function parseSvgPath(pathData: string): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = []

  // Match all coordinate pairs in the path
  // SVG path format: M64.87,57.40 L65.74,29.34 ...
  const coordRegex = /([ML])\s*([\d.]+)[,\s]+([\d.]+)/gi
  let match

  while ((match = coordRegex.exec(pathData)) !== null) {
    points.push({
      x: parseFloat(match[2]),
      y: parseFloat(match[3]),
    })
  }

  return points
}

/**
 * Load and parse track SVG, returning 3D-ready points
 * Points are centered at origin and scaled for the 3D scene
 */
export async function getTrackPoints(
  trackId: string,
  scale: number = 0.1
): Promise<{ x: number; z: number }[]> {
  // Check cache first
  const cacheKey = `${trackId}-${scale}`
  if (trackPointsCache.has(cacheKey)) {
    return trackPointsCache.get(cacheKey)!
  }

  try {
    // Fetch SVG file
    const response = await fetch(`/tracks/${trackId}.svg`)
    if (!response.ok) {
      throw new Error(`Failed to load track SVG: ${response.status}`)
    }

    const svgText = await response.text()

    // Extract path data from SVG (find the main track path)
    const pathMatch = svgText.match(/d="([^"]+)"/)?.[1]
    if (!pathMatch) {
      throw new Error('No path data found in SVG')
    }

    // Parse the path
    const rawPoints = parseSvgPath(pathMatch)
    if (rawPoints.length === 0) {
      throw new Error('No points parsed from SVG path')
    }

    // Calculate bounds for centering
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity

    for (const p of rawPoints) {
      if (p.x < minX) minX = p.x
      if (p.x > maxX) maxX = p.x
      if (p.y < minY) minY = p.y
      if (p.y > maxY) maxY = p.y
    }

    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2

    // Convert to 3D coordinates (centered and scaled)
    // SVG Y becomes 3D Z (horizontal plane)
    const points3D = rawPoints.map(p => ({
      x: (p.x - centerX) * scale,
      z: (p.y - centerY) * scale,
    }))

    // Cache the result
    trackPointsCache.set(cacheKey, points3D)

    return points3D
  } catch (error) {
    console.error(`Error loading track points for ${trackId}:`, error)
    return []
  }
}

/**
 * Get a point along the track at a given progress (0-1)
 */
export function getPointAtProgress(
  points: { x: number; z: number }[],
  progress: number
): { x: number; z: number } {
  if (points.length === 0) {
    return { x: 0, z: 0 }
  }

  const index = Math.floor(progress * (points.length - 1))
  return points[Math.min(index, points.length - 1)]
}

/**
 * Calculate rotation angle at a point (based on direction to next point)
 */
export function getRotationAtIndex(
  points: { x: number; z: number }[],
  index: number
): number {
  if (points.length < 2) return 0

  const current = points[index]
  const next = points[(index + 1) % points.length]

  return Math.atan2(next.x - current.x, next.z - current.z)
}
```

#### Step 2b: Update CarFallback Component

**File to edit:** `/Users/yibin/Documents/WORKZONE/VSCODE/POST_GAUNTLET/F1Analyst/components/race-viewer/track-visualization.tsx`

**Find the `CarFallback` component** (around line 250-286):

**Replace the entire CarFallback component with:**

```typescript
function CarFallback({
  color,
  index,
  trackId,
  driverNumber,
  trackPoints,
}: {
  color: string
  index: number
  trackId: string
  driverNumber: number
  trackPoints: { x: number; z: number }[]
}) {
  // Distribute cars along track based on position (spread across 80% of track)
  const progress = (index / 20) * 0.8
  const pointIndex = Math.floor(progress * Math.max(1, trackPoints.length - 1))

  // Get position from track points, or fallback to origin
  const carPosition = trackPoints.length > 0
    ? trackPoints[Math.min(pointIndex, trackPoints.length - 1)]
    : { x: 0, z: 0 }

  // Calculate rotation based on track direction
  let rotation = 0
  if (trackPoints.length > 1) {
    const nextIndex = (pointIndex + 1) % trackPoints.length
    const next = trackPoints[nextIndex]
    rotation = Math.atan2(next.x - carPosition.x, next.z - carPosition.z)
  }

  return (
    <group position={[carPosition.x, 0.15, carPosition.z]} rotation={[0, rotation, 0]}>
      <F1Car
        position={[0, 0, 0]}
        teamColor={color}
        driverNumber={driverNumber}
        showTrail={false}
      />
    </group>
  )
}
```

#### Step 2c: Add Track Points State to Scene

**In the same file** (`track-visualization.tsx`), find the `Scene` component props interface (around line 288-300).

**Add `trackPoints` to the SceneProps interface:**

```typescript
interface SceneProps {
  trackId: string
  standings: Standing[]
  carPositions: Map<number, { x: number; y: number; z: number }>
  useRealPositions: boolean
  locationsByDriver?: Map<number, OpenF1Location[]>
  trackBounds?: TrackBounds | null
  raceTimeRange?: { start: number; end: number }
  currentLap?: number
  lapProgress?: number
  totalLaps?: number
  trackPoints: { x: number; z: number }[]  // ADD THIS LINE
}
```

**Update the Scene component function signature to include trackPoints:**

```typescript
function Scene({
  trackId,
  standings,
  carPositions,
  useRealPositions,
  locationsByDriver,
  trackBounds,
  raceTimeRange,
  currentLap = 1,
  lapProgress = 0,
  totalLaps = 57,
  trackPoints,  // ADD THIS LINE
}: SceneProps) {
```

**Update the CarFallback call** inside Scene (around line 369-378) to pass trackPoints:

```typescript
return (
  <CarFallback
    key={standing.driver.number}
    color={standing.driver.teamColor}
    index={index}
    trackId={trackId}
    driverNumber={standing.driver.number}
    trackPoints={trackPoints}  // ADD THIS LINE
  />
)
```

#### Step 2d: Load Track Points in TrackVisualization

**In the same file**, find the `TrackVisualization` component (around line 385).

**Add imports at the top of the file:**

```typescript
import { getTrackPoints } from "@/lib/track-svg-utils"
```

**Add state for track points inside TrackVisualization:**

```typescript
export function TrackVisualization({
  trackId,
  standings,
  currentLap,
  lapProgress = 0,
  locations = [],
  laps = [],
  totalLaps = 57,
}: TrackVisualizationProps) {
  // ADD THIS: State for track points from SVG
  const [trackPoints, setTrackPoints] = useState<{ x: number; z: number }[]>([])

  // ADD THIS: Load track points on mount or when trackId changes
  useEffect(() => {
    getTrackPoints(trackId).then(points => {
      setTrackPoints(points)
    })
  }, [trackId])

  // ... rest of existing code ...
```

**Also add `useState` to the imports if not already there:**

```typescript
import { Suspense, useMemo, useRef, useEffect, useState } from "react"
```

**Update the Scene call** (around line 479) to pass trackPoints:

```typescript
<Scene
  trackId={trackId}
  standings={standings}
  carPositions={carPositions}
  useRealPositions={useRealPositions}
  locationsByDriver={locationsByDriver}
  trackBounds={trackBounds}
  raceTimeRange={raceTimeRange}
  currentLap={currentLap}
  lapProgress={lapProgress}
  totalLaps={totalLaps}
  trackPoints={trackPoints}  // ADD THIS LINE
/>
```

---

### Step 3: Increase Track Scale (Optional but Recommended)

**File to edit:** `/Users/yibin/Documents/WORKZONE/VSCODE/POST_GAUNTLET/F1Analyst/lib/track-calibration.ts`

**Find `defaultCalibration`** (around line 32-48):

**Change `trackScale` from `0.1` to `0.12`:**

```typescript
const defaultCalibration: TrackCalibration = {
  viewBox: { width: 200, height: 120 },
  transform: {
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    offsetX: 0,
    offsetY: 0,
    flipX: false,
    flipY: false,
  },
  render: {
    trackScale: 0.12,  // CHANGED from 0.1 to 0.12
    trackDepth: 0.3,
    carHeight: 0.15,
  },
}
```

**Also update** `lib/track-svg-utils.ts` to use matching scale (change the default parameter):

```typescript
export async function getTrackPoints(
  trackId: string,
  scale: number = 0.12  // Match the track scale
): Promise<{ x: number; z: number }[]> {
```

---

### Step 4: Delete Unused track-paths.ts (Cleanup)

After confirming the fix works, you can delete the old file:

**Delete:** `/Users/yibin/Documents/WORKZONE/VSCODE/POST_GAUNTLET/F1Analyst/lib/track-paths.ts`

**Remove import** from `track-visualization.tsx`:
```typescript
// DELETE THIS LINE:
import { trackPaths } from "@/lib/track-paths"
```

**Remove import** from `components/landing/track-outline.tsx` and update that component to use the new utility (or keep it for landing page thumbnails).

---

## Testing Checklist

After implementing, test by:

1. **Start dev server:** `npm run dev`
2. **Open browser:** http://localhost:3000
3. **Click on Bahrain GP** (or any race)
4. **Verify in browser console:** NO `404` errors for track SVG
5. **Verify visually:**
   - [ ] Real track shape is shown (not oval)
   - [ ] Cars appear ON the track
   - [ ] Cars are distributed along the track shape
   - [ ] Track is reasonably sized (not tiny)

**Test multiple circuits:**
- Bahrain (Sakhir)
- Australia (Melbourne)
- Monaco
- Silverstone

---

## Files Summary

| Action | File Path |
|--------|-----------|
| EDIT | `lib/openf1.ts` - Add circuit mappings |
| CREATE | `lib/track-svg-utils.ts` - New utility |
| EDIT | `components/race-viewer/track-visualization.tsx` - Update CarFallback |
| EDIT | `lib/track-calibration.ts` - Increase scale |
| DELETE | `lib/track-paths.ts` - Remove after testing |

---

## Success Criteria

The fix is complete when:
1. No 404 errors for track SVGs in console
2. Real circuit shapes are displayed (not fallback oval)
3. Cars appear on the track, following its shape
4. Works for all 24 circuits in the 2025 calendar
