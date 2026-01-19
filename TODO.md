TODO (Tuesday, Dec 30, 2025)

1. ✅ DONE - Reduced API data requests:
   - Removed raw `positions` and `intervals` from API response (frontend uses pre-grouped data)
   - Reduced lap data payload to essential fields only (lap_number, driver_number, date_start)
   - Increased location sampling rate from 4 to 8 (~87.5% reduction vs raw data)
   - See commit for details

2. ✅ DONE - Added slower playback speeds (1m, 2m, 3m per lap) alongside existing speeds (0.5x, 1x, 2x, 4x)
   - Speed options in timeline.tsx: 3m, 2m, 1m, 0.5x, 1x, 2x, 4x
   - Animation system uses playbackSpeed to calculate lapDurationMs = 1000 / playbackSpeed
   - Example: 1/60 speed = 60000ms per lap = 1 minute per lap

3. ✅ DONE - Fixed car orientation during animation:
   - Root cause: Rotation was calculated from small frame-to-frame position deltas during lerp interpolation, creating noisy/jittery direction vectors
   - Solution: Pre-calculate rotation from track trajectory (before->after location points) instead of from interpolated position deltas
   - Added `getInterpolatedPositionWithRotation()` function to track-utils.ts that returns both position AND rotation
   - Updated `AnimatedCar` component to use pre-calculated target rotation
   - Updated `AnimatedF1Car` component to accept optional `targetRotation` prop
   - Cars now smoothly interpolate to the correct rotation based on actual movement path, not frame deltas

4. ✅ DONE - Fixed cars going off track at start grid (especially Australia):
   - Root cause: Car size and grid spacing were hardcoded, causing overflow on narrow track sections
   - Solution: Added dynamic car scaling system that ensures cars fit proportionally within track width
   - New `getCarScale()` function in track-calibration.ts calculates appropriate car scale based on track width
   - Car scale is now proportional: `targetTwoCarWidth = trackWidth * 0.7` → 2 cars side by side with comfortable margins
   - F1Car component now accepts optional `scale` prop (applies on top of base 3x scale)
   - Grid positioning now uses scaled spacing: `gridSpacing * carScale`, `laneOffset * carScale`
   - Per-track calibration can override car scale via `render.carScale` if needed
   - All 3 car rendering paths (AnimatedCar, static fallback, CarFallback) now use consistent scaling

5. ✅ DONE - Fixed by Agent 2 (type mismatch for intervalsByLap)
