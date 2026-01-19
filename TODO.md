TODO (Tuesday, Dec 30, 2025)

1. ✅ DONE - Reduced API data requests:
   - Removed raw `positions` and `intervals` from API response (frontend uses pre-grouped data)
   - Reduced lap data payload to essential fields only (lap_number, driver_number, date_start)
   - Increased location sampling rate from 4 to 8 (~87.5% reduction vs raw data)
   - See commit for details

2. make it so the laps go thru slower (make it like: it takes 1 min per lap, 2 min, 3 min per lap, stuff like that (WHILE ALSO KEEPING THE EXISTING SPEEDS - find a way to mesh them together))

3. make it so the cars actually point in the right direction as youre going thru the laps (right now they're pointed all over the place, NOT parallel to the track!) - right now, as cars are going around the track, you know how you expect cars to be pointed in the direction the track is going? theyre not pointed that direction right now! you might need to do something to connect the way the car points with the way the track moves. (right now, it looks like as if it goes around the track in weird pointed ways, but when i PAUSE, it fixes itself.)

4. right now, for some tracks, like in Australia, the cars lined up at the start are such that they go OFF THE TRACK. that points to two possible solutions -> either make the cars small enough so they fit on the track, or the track bigger so the cars fit. either way, youll have to make the cars and track square away and connect to each other so they connect together better. right now i feel there's a disconnect which causes this lack of robustness in the 3D track viewer. this might require a significant refactor! that's okay.

5. ✅ DONE - Fixed by Agent 2 (type mismatch for intervalsByLap)
