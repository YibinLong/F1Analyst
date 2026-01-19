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

4. right now, for some tracks, like in Australia, the cars lined up at the start are such that they go OFF THE TRACK. that points to two possible solutions -> either make the cars small enough so they fit on the track, or the track bigger so the cars fit. either way, youll have to make the cars and track square away and connect to each other so they connect together better. right now i feel there's a disconnect which causes this lack of robustness in the 3D track viewer. this might require a significant refactor! that's okay.

5. ✅ DONE - Fixed by Agent 2 (type mismatch for intervalsByLap)
