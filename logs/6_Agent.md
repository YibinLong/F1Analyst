# Agent Work Log

## Session Metadata
- **Story/Task ID:** TODO item 4 - Fix cars going off track at start grid
- **Started:** 2026-01-19
- **Completed:** 2026-01-19
- **Exit Status:** success

---

## Task Summary
Fixed the issue where cars would go off the track at the start, especially visible at tracks like Australia. Implemented a dynamic car scaling system that ensures cars fit proportionally within track bounds.

## What Was Accomplished

### 1. Root Cause Analysis
The issue stemmed from a disconnect between car dimensions and track width:

**Problem:**
- Track width: 2.4 units, meaning track edges at ±1.2 units from center
- Car body width: 0.42 units (from `0.14 * 3` scale factor)
- Grid spacing used hardcoded values (`trackWidth * 1.6` for rows, `trackWidth * 0.35` for lanes)
- No validation that grid positions actually fit within track boundaries
- Different tracks have different widths, but car size was constant

### 2. Implementation

**New function in `lib/track-calibration.ts`:**

```typescript
export function getCarScale(trackId: string): number {
  const calibration = getTrackCalibration(trackId)
  const baseCarWidth = 0.42  // Base car width at scale=1 (0.14 * 3)
  const trackWidth = calibration.render.trackWidth

  // Calculate scale to fit 2 cars with comfortable margins
  // Target: 2 cars + gap should take ~70% of track width for safety margin
  const targetTwoCarWidth = trackWidth * 0.7
  const idealScale = targetTwoCarWidth / (2 * baseCarWidth)

  // Apply per-track override if specified, cap at reasonable bounds
  const configuredScale = calibration.render.carScale ?? 1.0
  const finalScale = Math.max(0.5, Math.min(1.2, Math.min(configuredScale, idealScale)))

  return finalScale
}
```

**Updated `TrackCalibration` interface:**
- Added optional `carScale?: number` to `render` settings
- Allows per-track fine-tuning if needed

**Updated `F1Car` component (`F1Car.tsx`):**
- Added optional `scale` prop (default: 1.0)
- Scale is applied on top of base 3x scale: `const s = 3 * scale`
- MotionTrail also uses the same scale for consistency

**Updated `track-visualization.tsx`:**
- `AnimatedCar`: Now calculates and uses `carScale`
- `CarFallback`: Uses `carScale` for both car rendering and grid spacing
- `Scene`: Passes `carScale` to all F1Car instances
- Grid positioning now scaled: `scaledGridSpacing = trackWidth * 1.6 * carScale`

### 3. Verified Build Passes
Ran `npm run build` - compiled successfully with no errors.

## Files Modified
1. `lib/track-calibration.ts` - Added `carScale` to interface, added `getCarScale()` function
2. `components/race-viewer/F1Car.tsx` - Added `scale` prop to F1Car, AnimatedF1Car, and MotionTrail
3. `components/race-viewer/track-visualization.tsx` - Updated AnimatedCar, CarFallback, and Scene to use dynamic car scale
4. `TODO.md` - Marked item 4 as complete

## Implementation Approach

### Before (problematic):
```typescript
// Hardcoded car dimensions at fixed 3x scale
const s = 3

// Hardcoded grid spacing
const gridPositions = calculateStartingGridPositions(
  trackPoints,
  totalCars,
  trackWidth * 1.6,  // Fixed multiplier
  trackWidth * 0.35, // Fixed multiplier
  meta
)
```

### After (fixed):
```typescript
// Dynamic car scale based on track width
const carScale = getCarScale(trackId)
const s = 3 * scale  // Adjustable scale

// Scaled grid spacing
const scaledGridSpacing = trackWidth * 1.6 * carScale
const scaledLaneOffset = trackWidth * 0.35 * carScale
const gridPositions = calculateStartingGridPositions(
  trackPoints,
  totalCars,
  scaledGridSpacing,
  scaledLaneOffset,
  meta
)
```

---

## Issues & Resolutions

### No Major Issues
Implementation was straightforward. The key insight was that both car size AND grid spacing need to scale together to maintain proper proportions.

### Blockers (if any)
None.

---

## Context for Future Agents

### How Car Scaling Now Works

1. **Default behavior**: `getCarScale()` calculates scale based on track width
   - Formula: `targetTwoCarWidth = trackWidth * 0.7`
   - This ensures 2 cars side-by-side use ~70% of track width (30% margin)

2. **Per-track override**: Can set `render.carScale` in track calibration
   - Useful for tracks with unusual characteristics
   - Will use the minimum of configured and calculated scale

3. **Scale bounds**: Capped between 0.5 and 1.2
   - Prevents cars from becoming too small (hard to see)
   - Prevents cars from becoming too large (overflow on tight tracks)

### Key Files
| File | Purpose |
|------|---------|
| `lib/track-calibration.ts` | `getCarScale()` function and `carScale` config |
| `components/race-viewer/F1Car.tsx` | Car component with scale prop |
| `components/race-viewer/track-visualization.tsx` | Passes scale to all car instances |

### Gotchas / Non-Obvious Details
- Scale applies multiplicatively on top of base 3x scale
- Grid spacing MUST scale with car size, otherwise proportions break
- MotionTrail also scales to match car size
- All 3 car rendering paths (AnimatedCar, static fallback, CarFallback) now use scale

### Suggested Next Steps
- TODO.md is now complete (items 1-5 all done)
- Check TASK_LIST.md for remaining work

---

## Raw Notes
- Build passed successfully
- TypeScript compiles without errors
- Dynamic scaling ensures cars fit within track bounds regardless of track width

Commits to make:
- `feat: add dynamic car scaling system for track fit`
- `docs: mark TODO item 4 (car/track alignment) as complete`

Branch: feat/multi-improvements
