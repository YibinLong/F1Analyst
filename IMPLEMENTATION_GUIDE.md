# F1Analyst Implementation Guide

This guide addresses the issues listed in TODO.md. Each section is self-contained with file locations, problem analysis, and implementation approach.

---

## Table of Contents

1. [Issue #1: Reduce OpenF1 API Data Requests](#issue-1-reduce-openf1-api-data-requests)
2. [Issue #2: Add Slower Playback Speeds](#issue-2-add-slower-playback-speeds)
3. [Issue #3: Fix Car Orientation](#issue-3-fix-car-orientation)
4. [Issue #4: Fix Cars Going Off-Track](#issue-4-fix-cars-going-off-track)
5. [Issue #5: Fix formatGapToLeader TypeError](#issue-5-fix-formatgaptoleader-typeerror)

---

## Issue #1: Reduce OpenF1 API Data Requests

### Background

Per `OPENF1_LOCATION_FIX.md`, the OpenF1 location endpoint returns ~3.7 Hz data. For a 2-hour race with 20 drivers, this results in ~520,000 records. The chunked fetching (5-minute windows) already solved the HTTP 422 errors.

### Current State

- **File**: `lib/openf1.ts` - `getLocations()` function
- Location data is fetched in 5-minute chunks (works, ~24 API requests for full race)
- All 520,000 records are stored and processed

### Optimization Approach

**Option A: Server-Side Sampling (Recommended)**

Sample the location data after fetching to reduce memory and processing load.

**Files to modify:**
- `lib/openf1.ts` - Add sampling logic after fetching each chunk
- `app/api/race/[meetingKey]/route.ts` - Add optional query param for sample rate

**Approach:**
1. After fetching each chunk of location data, sample every Nth point
2. For visualization, ~1 Hz is sufficient (sample every 3-4 points from 3.7 Hz data)
3. Keep the chunked fetching - only reduce the stored data volume

**Sampling Strategy:**
- Keep first and last points of each chunk (important for interpolation boundaries)
- Sample middle points at configurable rate (default: every 4th point = ~1 Hz)
- Result: ~130,000 records instead of 520,000 (75% reduction)

**Option B: Request Less Data (Alternative)**

Use driver-specific requests and time-based filtering more aggressively.

**Note:** This is optional. The current implementation works. Only implement if memory/performance issues arise.

---

## Issue #2: Add Slower Playback Speeds

### Problem

Current playback speeds are too fast. User wants options like "1 minute per lap", "2 minutes per lap", "3 minutes per lap" in addition to existing speeds.

### Current State

**File**: `components/race-viewer/race-viewer.tsx`

The current playback system:
- Uses `playbackSpeed` state (values like 0.5, 1, 2, 4, etc.)
- Higher values = faster playback
- `lapDurationMs = 1000 / playbackSpeed` (base: 1 second per lap at speed 1)

**File**: `components/race-viewer/timeline.tsx`

Renders playback controls including speed selector.

### Files to Modify

1. `components/race-viewer/race-viewer.tsx`
   - Update playback speed calculation
   - Add new slow speed options

2. `components/race-viewer/timeline.tsx`
   - Update speed selector UI to include new options
   - May need to restructure the speed options array

### Implementation Approach

**Step 1: Redefine Speed System**

The current system uses a multiplier where higher = faster. For slow speeds (minutes per lap), invert the logic or use actual duration values.

**New Speed Options:**
```
Current speeds to KEEP:
- "0.5x" (2 seconds per lap)
- "1x"   (1 second per lap)
- "2x"   (0.5 seconds per lap)
- "4x"   (0.25 seconds per lap)

New SLOW speeds to ADD:
- "1 min/lap" (60 seconds per lap, playbackSpeed = 1/60)
- "2 min/lap" (120 seconds per lap, playbackSpeed = 1/120)
- "3 min/lap" (180 seconds per lap, playbackSpeed = 1/180)
```

**Step 2: Update the Animation Loop**

In `race-viewer.tsx`, find the `useEffect` that handles animation. The formula:
```
lapDurationMs = 1000 / playbackSpeed
```

For "1 min per lap": `playbackSpeed = 1/60 = 0.0167` → `lapDurationMs = 60000ms`

**Step 3: Update Timeline UI**

In `timeline.tsx`, update the speed selector to show user-friendly labels:
- Fast speeds: "0.5x", "1x", "2x", "4x"
- Slow speeds: "1 min", "2 min", "3 min"

Consider grouping or separating fast/slow options visually.

### Key Considerations

- At slow speeds (minutes per lap), ensure smooth animation doesn't stutter
- The `requestAnimationFrame` loop should still work (just with smaller progress increments)
- Consider adding a "Real-time" option that plays at actual race duration

---

## Issue #3: Fix Car Orientation

### Problem

Cars are not pointing in the direction of travel. They appear to point in random directions while moving but "fix themselves" when paused. This indicates a timing/update order issue.

### Current State

**File**: `components/race-viewer/track-visualization.tsx`

The `AnimatedF1Car` component handles car rotation:

```typescript
// Current rotation calculation
const dx = currentPos.x - previousPos.x
const dz = currentPos.z - previousPos.z
const targetRotation = Math.atan2(dx, dz)
```

**Problems identified:**

1. **Position Lerping vs Rotation Calculation Mismatch**:
   - Position uses lerp interpolation (`position.lerp(targetPosition, 0.12)`)
   - Rotation is calculated from raw position deltas (before lerping)
   - This causes rotation to "lead" the visual position

2. **Smooth Factor Too Aggressive**:
   - `currentRotation += rotationDiff * 0.1` may cause oscillation
   - Or may be too slow to catch up with rapid direction changes

3. **F1Car Model Orientation**:
   - The F1Car model's "front" may not align with the assumed axis
   - Need to verify which axis the car model's nose points along

### Files to Modify

1. `components/race-viewer/track-visualization.tsx`
   - Fix `AnimatedF1Car` component rotation logic

2. `components/race-viewer/F1Car.tsx`
   - Verify model orientation (which axis is "forward")

### Implementation Approach

**Step 1: Verify F1Car Model Orientation**

In `F1Car.tsx`, check the model's default orientation:
- Load the model and check which axis the nose points along (+X, +Z, -X, -Z)
- Document this in a comment for future reference

**Step 2: Fix Rotation Calculation in AnimatedF1Car**

The core issue is that rotation is calculated from **target positions** but the car visually moves via **lerped positions**. Fix by:

**Option A: Calculate rotation from lerped positions**
- Store the previous lerped position (not target position)
- Calculate direction from `currentLerpedPos - previousLerpedPos`
- This aligns rotation with actual visual movement

**Option B: Calculate rotation from future positions (look-ahead)**
- Use the target position and the next target position
- Calculate rotation from where the car is going, not where it was

**Recommended Approach (Option A):**

```
1. Store previousLerpedPosition in a ref
2. After position.lerp() call, calculate:
   dx = position.current.x - previousLerpedPosition.x
   dz = position.current.z - previousLerpedPosition.z
3. Calculate targetRotation from dx, dz
4. Apply smooth rotation interpolation
5. Update previousLerpedPosition = position.current.clone()
```

**Step 3: Tune Rotation Smoothing**

The current `rotationDiff * 0.1` may be too slow or cause oscillation.

- Increase to `0.15-0.25` for faster response
- Or use a different easing approach (e.g., `lerp` with delta time)
- Ensure minimum movement threshold prevents jitter when stationary

**Step 4: Handle Edge Cases**

- When `distance < threshold`, don't update rotation (car is stationary)
- Threshold should be small enough to not cause visible "lag" in rotation
- Handle wrap-around at ±π correctly (already implemented, verify it works)

### Debugging Tips

- Add a visible "forward arrow" mesh to F1Car for debugging orientation
- Log rotation values to verify they change smoothly
- Test with pause/play to see if the issue is interpolation vs calculation

---

## Issue #4: Fix Cars Going Off-Track

### Problem

At some tracks (e.g., Australia), cars in the starting grid appear to go off the track. This indicates a mismatch between track width and car size/spacing.

### Current State

**Files involved:**

1. `components/race-viewer/Track3D.tsx`
   - Track rendering with `trackWidth` constant (currently 16)
   - `offsetPath()` creates track boundaries at ±trackWidth/2

2. `lib/track-utils.ts`
   - `calculateStartingGridPositions()` creates the starting grid
   - Uses `rowSpacing` and `lateralOffset` for car positioning

3. `lib/track-calibration.ts`
   - Per-track calibration settings (scale, rotation, offsets)
   - `trackScale` affects overall scene size

4. `components/race-viewer/F1Car.tsx`
   - Car model with `scale` prop
   - Default scale applied in the component

### Root Cause Analysis

The disconnect happens because:
1. **Track width is hardcoded** (`trackWidth = 16` in Track3D.tsx)
2. **Car size is fixed** but tracks have different visual scales
3. **Grid positioning** uses absolute values, not relative to track width
4. **Track calibration** affects track size but not grid/car calculations

### Files to Modify

1. `components/race-viewer/Track3D.tsx`
   - Make track width configurable or calculate from track data

2. `lib/track-utils.ts`
   - Make grid positioning relative to track width
   - Add track-specific adjustments

3. `lib/track-calibration.ts`
   - Add per-track `trackWidth` and `carScale` values

4. `components/race-viewer/track-visualization.tsx`
   - Pass track-specific parameters to child components

### Implementation Approach

**Step 1: Add Track Width to Calibration**

In `track-calibration.ts`, add to each track's calibration:

```typescript
render: {
  trackScale: 1.3,
  trackWidth: 14,    // Add this (varies per track)
  carScale: 1.0,     // Add this (if needed)
  carHeight: 0.15,
  trackDepth: 0.3,
}
```

**Step 2: Make Track3D Use Calibration Width**

In `Track3D.tsx`:
- Accept `trackWidth` as a prop
- Use prop value instead of hardcoded constant
- The parent component reads from calibration and passes down

**Step 3: Make Grid Positioning Relative**

In `lib/track-utils.ts`, update `calculateStartingGridPositions()`:

Current (problematic):
```typescript
const rowSpacing = 8  // Fixed value
const lateralOffset = 4  // Fixed value
```

Should be:
```typescript
const rowSpacing = trackWidth * 0.5  // Relative to track
const lateralOffset = trackWidth * 0.2  // Relative to track
```

**Step 4: Scale Cars Per-Track (if needed)**

If tracks have very different visual scales, add per-track car scaling:
- Pass `carScale` from calibration to `F1Car` component
- Or adjust the base car model size

**Step 5: Test All Tracks**

After changes, test each track's starting grid:
- Australia (the problem track)
- Monaco (narrow)
- Spa (wide)
- Others

Adjust default values and per-track overrides as needed.

### Alternative Approach: Calculate Track Width from SVG

Instead of hardcoding, calculate track width from the SVG path:
1. After loading SVG, find the width of the path stroke
2. Use this to determine appropriate track width
3. More robust but more complex to implement

---

## Issue #5: Fix formatGapToLeader TypeError

### Problem

```
TypeError: value.toFixed is not a function
at formatGapToLeader (components/race-viewer/race-viewer.tsx:53:20)
```

The `formatGapToLeader` function expects `value` to be a number, but sometimes receives a non-number value (likely a string like "+1 LAP").

### Current State

**File**: `components/race-viewer/race-viewer.tsx` (lines 49-54)

```typescript
function formatGapToLeader(value: number | null, position: number): string | null {
  if (position === 1) return null
  if (value === null) return null
  if (value < 0) return null
  return `+${value.toFixed(3)}`  // CRASHES HERE
}
```

**File**: `lib/openf1-schemas.ts`

Per `OPENF1_LOCATION_FIX.md`, the schema was already updated:
```typescript
// intervals.gap_to_leader: z.union([z.number(), z.string()]).nullable()
```

So the API can return strings like "+1 LAP", "+2 LAPS" for lapped cars.

### Root Cause

The schema correctly handles string values, but `formatGapToLeader` doesn't check for strings before calling `.toFixed()`.

### Files to Modify

1. `components/race-viewer/race-viewer.tsx`
   - Update `formatGapToLeader` to handle string values

### Implementation Approach

**Step 1: Update formatGapToLeader**

Handle both number and string cases:

```typescript
function formatGapToLeader(value: number | string | null, position: number): string | null {
  if (position === 1) return null
  if (value === null) return null

  // If it's already a string (like "+1 LAP"), return as-is
  if (typeof value === 'string') {
    return value
  }

  // If it's a number, format it
  if (typeof value === 'number') {
    if (value < 0) return null
    return `+${value.toFixed(3)}`
  }

  return null
}
```

**Step 2: Update Type Definition**

If there's a TypeScript interface for interval data, ensure it reflects:
```typescript
gapToLeader: number | string | null
```

**Step 3: Handle Display Formatting**

Consider how "+1 LAP" should display vs "+1.234":
- Numeric gaps: "+1.234" (right-aligned, monospace)
- Lap gaps: "+1 LAP" (may need different styling)

Optional: Standardize the display format for both cases.

---

## Summary: Priority and Dependencies

| Issue | Priority | Complexity | Dependencies |
|-------|----------|------------|--------------|
| #5 (TypeError fix) | HIGH | Low | None - Quick fix |
| #3 (Car orientation) | HIGH | Medium | None |
| #2 (Slow playback) | MEDIUM | Low | None |
| #4 (Off-track cars) | MEDIUM | High | May require refactor |
| #1 (Reduce API data) | LOW | Low | Optional optimization |

### Recommended Implementation Order

1. **Issue #5** - Quick fix, prevents crashes
2. **Issue #3** - High impact, user-visible bug
3. **Issue #2** - User-requested feature, straightforward
4. **Issue #4** - Requires careful planning, test on multiple tracks
5. **Issue #1** - Only if performance issues arise

---

## File Reference Quick Guide

| File | Issues | Purpose |
|------|--------|---------|
| `components/race-viewer/race-viewer.tsx` | #2, #5 | Playback control, gap formatting |
| `components/race-viewer/timeline.tsx` | #2 | Playback speed UI |
| `components/race-viewer/track-visualization.tsx` | #3 | Car positioning and rotation |
| `components/race-viewer/Track3D.tsx` | #4 | Track rendering, width |
| `components/race-viewer/F1Car.tsx` | #3, #4 | Car model, scale, orientation |
| `lib/track-utils.ts` | #4 | Grid positioning calculations |
| `lib/track-calibration.ts` | #4 | Per-track settings |
| `lib/openf1.ts` | #1 | API data fetching |
| `lib/openf1-schemas.ts` | #5 | Data validation schemas |

---

## Testing Checklist

After implementing each fix:

### Issue #5 (TypeError)
- [ ] Load a race with lapped cars
- [ ] Verify no console errors
- [ ] Verify gap display shows "+X.XXX" for times and "+N LAP(S)" for laps

### Issue #3 (Car Orientation)
- [ ] Play race and verify cars point in direction of travel
- [ ] Pause and verify cars still point correctly
- [ ] Test at different playback speeds
- [ ] Test on multiple tracks (different track shapes)

### Issue #2 (Slow Playback)
- [ ] All existing speeds still work
- [ ] New slow speeds (1/2/3 min per lap) work
- [ ] Animation is smooth at slow speeds (no stuttering)
- [ ] Speed selector UI is clear and usable

### Issue #4 (Off-Track Cars)
- [ ] Australia starting grid - cars on track
- [ ] Monaco starting grid - cars on track (narrow)
- [ ] Other tracks - spot check
- [ ] During race - cars stay on track boundaries

### Issue #1 (API Optimization)
- [ ] Race still loads successfully
- [ ] Car positions are accurate (sampling didn't lose critical data)
- [ ] Memory usage reduced (check browser dev tools)
- [ ] Load time improved or unchanged
