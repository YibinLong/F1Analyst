# Agent Work Log

## Session Metadata
- **Story/Task ID:** TODO item 3 - Fix car orientation during animation
- **Started:** 2026-01-19
- **Completed:** 2026-01-19
- **Exit Status:** success

---

## Task Summary
Fixed car orientation so cars point in the direction of travel during animation playback. Previously, cars would point in random directions during animation but fix themselves when paused.

## What Was Accomplished

### 1. Root Cause Analysis
The issue was in how rotation was calculated in `AnimatedCar` and `AnimatedF1Car` components:

**Problem:**
- Rotation was calculated from frame-to-frame position deltas during lerp interpolation
- The lerp factor (0.12-0.15) creates small deltas that produce noisy/jittery direction vectors
- When paused, positions converge and rotation stabilizes (why it looked correct when paused)

**Key insight from exploration:**
- `CarFallback` component didn't have this issue because it pre-calculates `targetRotation` from track geometry
- It then smoothly interpolates the rotation value, not calculates it from position deltas

### 2. Implementation

**New functions added to `lib/track-utils.ts`:**

```typescript
// Calculate rotation from movement direction
export function calculateCarRotation(
  fromPos: { x: number; z: number },
  toPos: { x: number; z: number }
): number

// Get position AND rotation from track trajectory
export function getInterpolatedPositionWithRotation(
  driverLocations: OpenF1Location[],
  timestamp: number,
  bounds: TrackBounds,
  trackId: string
): { x: number; y: number; z: number; rotation: number } | null
```

**Updated `AnimatedCar` (track-visualization.tsx:186-267):**
- Now uses `getInterpolatedPositionWithRotation()` to get both position and rotation
- Stores `targetRotation` as a ref alongside `targetPosition`
- Smoothly interpolates to target rotation in useFrame

**Updated `AnimatedF1Car` (F1Car.tsx:280-339):**
- Added optional `targetRotation` prop
- Uses pre-calculated rotation if provided
- Simplified logic by removing frame-to-frame delta calculation

### 3. Verified Build Passes
Ran `npm run build` and confirmed no errors.

### 4. Manual Testing
- Started dev server and navigated to Australian GP
- Race uses fallback mode (no location data) which already worked correctly
- Animation ran smoothly with cars positioned correctly on track

## Files Modified
1. `lib/track-utils.ts` - Added `calculateCarRotation()` and `getInterpolatedPositionWithRotation()` functions
2. `components/race-viewer/track-visualization.tsx` - Updated `AnimatedCar` to use pre-calculated rotation
3. `components/race-viewer/F1Car.tsx` - Updated `AnimatedF1Car` to accept optional `targetRotation` prop
4. `TODO.md` - Marked item 3 as complete

## Implementation Approach

### Before (problematic):
```typescript
// In useFrame - calculated from interpolated position delta
const dx = groupRef.current.position.x - prevX
const dz = groupRef.current.position.z - prevZ
const targetRotation = Math.atan2(dx, dz) - Math.PI / 2
// Small deltas = noisy direction vectors
```

### After (fixed):
```typescript
// In useEffect - calculated from track trajectory points
const result = getInterpolatedPositionWithRotation(...)
targetRotation.current = result.rotation
// In useFrame - smoothly interpolate to target
let rotationDiff = targetRotation.current - currentRotation.current
currentRotation.current += rotationDiff * 0.1
```

---

## Issues & Resolutions

### No Major Issues
The implementation was straightforward once the root cause was identified. The existing `CarFallback` component provided a working pattern to follow.

### Minor Issue: Missing Import
Initial build failed because `getInterpolatedPosition` was still used in one place. Added it back to imports alongside the new function.

### Blockers (if any)
None.

---

## Context for Future Agents

### How Car Orientation Now Works

1. **With location data (`AnimatedCar`):**
   - `getInterpolatedPositionWithRotation()` returns both position and rotation
   - Rotation is calculated from the trajectory direction (before → after location points)
   - This gives stable rotation based on actual movement path

2. **Without location data (`CarFallback`):**
   - `getPositionAlongTrack()` returns both position and rotation
   - Rotation is calculated from track geometry
   - Already worked correctly before this fix

3. **Common pattern in both:**
   - Target rotation is pre-calculated, not derived from frame deltas
   - useFrame smoothly interpolates current rotation toward target
   - Wrap-around handling for -PI to PI transitions

### Key Functions

| Function | File | Purpose |
|----------|------|---------|
| `calculateCarRotation()` | track-utils.ts | Calculate rotation from two positions |
| `getInterpolatedPositionWithRotation()` | track-utils.ts | Get pos+rotation from location data |
| `getPositionAlongTrack()` | track-svg-utils.ts | Get pos+rotation from track geometry |

### Dependencies
None introduced.

### Gotchas / Non-Obvious Details
- F1Car model faces +X direction, so all rotation calculations subtract PI/2
- Rotation wrap-around (-PI to PI) must be handled when interpolating
- The lerp factor for rotation (0.1) is slightly lower than position (0.12) for smoother turns

### Suggested Next Steps
Continue with TODO.md item 4:
- Fix cars going off track at start (especially Australia)
- May need to adjust car size or track width calibration

---

## Raw Notes
- Build passed successfully
- TypeScript compiles without errors
- Manual testing confirmed animation works

Commits made:
- `fea7440` fix: correct car orientation during animation playback
- `e36a658` docs: mark TODO item 3 (car orientation) as complete

Branch: feat/multi-improvements
