import { NextResponse } from "next/server"
import {
  getSession,
  getDrivers,
  getPositions,
  getIntervals,
  getLaps,
  getLocations,
  getRaceControl,
  getPitStops,
  getWeather,
  getTeamRadio,
  getMeetings,
  getMaxLapNumber,
  groupPositionsByLap,
  groupIntervalsByLap,
  mapTeamNameToKey,
  mapCircuitToKey,
} from "@/lib/openf1"
import { teamColors, drivers2025, type Driver } from "@/lib/f1-teams"
import { SEASON_YEAR } from "@/lib/season"
import type { Race } from "@/lib/race-data"

interface RouteParams {
  params: Promise<{ meetingKey: string }>
}

/**
 * Format a date range for display
 */
function formatDateDisplay(dateStart: string, dateEnd: string): string {
  const start = new Date(dateStart)
  const end = new Date(dateEnd)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const startMonth = monthNames[start.getMonth()]
  const endMonth = monthNames[end.getMonth()]
  const startDay = start.getDate()
  const endDay = end.getDate()
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}`
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`
}

export async function GET(request: Request, { params }: RouteParams) {
  const { meetingKey } = await params
  const meetingKeyNum = parseInt(meetingKey, 10)

  console.log(`\n${'='.repeat(60)}`)
  console.log(`[API Route DEBUG] 🏎️ GET /api/race/${meetingKey}`)
  console.log(`${'='.repeat(60)}`)

  if (isNaN(meetingKeyNum)) {
    console.error(`[API Route DEBUG] ❌ Invalid meeting key: ${meetingKey}`)
    return NextResponse.json({ error: "Invalid meeting key" }, { status: 400 })
  }

  console.log(`[API Route DEBUG] 🔍 Looking for Race session for meeting_key: ${meetingKeyNum}`)

  // Get the Race session for this meeting
  const session = await getSession(meetingKeyNum, "Race")

  if (!session) {
    console.error(`[API Route DEBUG] ❌ No Race session found for meeting_key: ${meetingKeyNum}`)
    return NextResponse.json(
      { error: "Race session not found for this meeting" },
      { status: 404 }
    )
  }

  console.log(`[API Route DEBUG] ✅ Found session:`, {
    session_key: session.session_key,
    session_name: session.session_name,
    date_start: session.date_start,
    date_end: session.date_end,
  })

  // Fetch all data in parallel
  console.log(`[API Route DEBUG] 📡 Fetching all race data for session_key: ${session.session_key}`)
  console.log(`[API Route DEBUG] 📅 Session time range: ${session.date_start} to ${session.date_end}`)

  const [drivers, positions, intervals, laps, locations, raceControl, pitStops, weather, teamRadio, meetings] =
    await Promise.all([
      getDrivers(session.session_key),
      getPositions(session.session_key),
      getIntervals(session.session_key),
      getLaps(session.session_key),
      // Pass date range to avoid "too much data" error from OpenF1
      getLocations(session.session_key, {
        dateStart: session.date_start,
        dateEnd: session.date_end,
      }),
      getRaceControl(session.session_key),
      getPitStops(session.session_key),
      getWeather(session.session_key),
      getTeamRadio(session.session_key),
      getMeetings(SEASON_YEAR),
    ])

  // DEBUG: Log data summary for each endpoint
  console.log(`[API Route DEBUG] 📊 Data fetch results summary:`)
  console.log(`  - drivers:     ${drivers?.length ?? 'null'} records`)
  console.log(`  - positions:   ${positions?.length ?? 'null'} records`)
  console.log(`  - intervals:   ${intervals?.length ?? 'null'} records`)
  console.log(`  - laps:        ${laps?.length ?? 'null'} records`)
  console.log(`  - locations:   ${locations?.length ?? 'null'} records  ← 🔍 THIS IS THE KEY ONE`)
  console.log(`  - raceControl: ${raceControl?.length ?? 'null'} records`)
  console.log(`  - pitStops:    ${pitStops?.length ?? 'null'} records`)
  console.log(`  - weather:     ${weather?.length ?? 'null'} records`)
  console.log(`  - teamRadio:   ${teamRadio?.length ?? 'null'} records`)
  console.log(`  - meetings:    ${meetings?.length ?? 'null'} records`)

  if (!locations || locations.length === 0) {
    console.warn(`[API Route DEBUG] ⚠️ NO LOCATION DATA AVAILABLE for session_key: ${session.session_key}`)
    console.warn(`[API Route DEBUG] ⚠️ This is why "Location Data Unavailable" is showing!`)
    console.warn(`[API Route DEBUG] 💡 Possible reasons:`)
    console.warn(`  1. Race hasn't happened yet (check date_start: ${session.date_start})`)
    console.warn(`  2. OpenF1 API doesn't have location data for this session`)
    console.warn(`  3. OpenF1 API is having issues`)
    console.warn(`  4. The session_key ${session.session_key} might be wrong`)
  } else {
    console.log(`[API Route DEBUG] ✅ Location data available: ${locations.length} records`)
    console.log(`[API Route DEBUG] 📍 Sample location:`, JSON.stringify(locations[0]))
    // Log unique drivers in location data
    const uniqueDrivers = [...new Set(locations.map(l => l.driver_number))]
    console.log(`[API Route DEBUG] 👤 Drivers in location data: ${uniqueDrivers.join(', ')}`)
  }

  // Find meeting info for race metadata
  const meeting = meetings?.find((m) => m.meeting_key === meetingKeyNum)

  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
  }

  // Calculate total laps
  const totalLaps = laps ? getMaxLapNumber(laps) : 0

  // Map drivers to frontend format, fallback to drivers2025 if API returns no data
  let mappedDrivers: Driver[] = []

  if (drivers && drivers.length > 0) {
    // Use drivers from OpenF1 API
    mappedDrivers = drivers.map((d) => {
      const teamKey = mapTeamNameToKey(d.team_name)
      return {
        number: d.driver_number,
        code: d.name_acronym,
        firstName: d.first_name,
        lastName: d.last_name,
        team: teamKey,
        teamColor: d.team_colour ? `#${d.team_colour}` : teamColors[teamKey] || "#FFFFFF",
        headshotUrl: d.headshot_url || undefined,
      }
    })
  } else {
    // Fallback to hardcoded 2025 drivers when API doesn't have driver data
    mappedDrivers = drivers2025
  }

  // Calculate end date (usually 2 days after start)
  const startDate = new Date(meeting.date_start)
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 2)
  const dateEnd = endDate.toISOString().split("T")[0]

  // Build race object
  const race: Race = {
    meetingKey: String(meeting.meeting_key),
    meetingName: meeting.meeting_name,
    country: meeting.country_name,
    location: meeting.location,
    circuitKey: mapCircuitToKey(meeting.circuit_short_name),
    round: 0, // Will be set by sorting
    dateStart: meeting.date_start.split("T")[0],
    dateEnd: dateEnd,
    dateDisplay: formatDateDisplay(meeting.date_start, dateEnd),
  }

  // Group positions and intervals by lap for efficient lookup
  const positionsByLap = laps && positions ? groupPositionsByLap(positions, laps) : {}
  const intervalsByLap = laps && intervals ? groupIntervalsByLap(intervals, laps) : {}

  // Only send essential lap data fields to reduce payload size
  // The frontend only needs lap_number, driver_number, and date_start for timeline mapping
  const essentialLaps = (laps || []).map(lap => ({
    lap_number: lap.lap_number,
    driver_number: lap.driver_number,
    date_start: lap.date_start,
  }))

  return NextResponse.json({
    race,
    drivers: mappedDrivers,
    totalLaps,
    sessionKey: session.session_key,
    // Essential data for the race viewer (removed raw positions/intervals - use grouped data instead)
    laps: essentialLaps,
    locations: locations || [],
    raceControl: raceControl || [],
    pitStops: pitStops || [],
    weather: weather || [],
    teamRadio: teamRadio || [],
    // Grouped data for efficient lookup during playback
    positionsByLap,
    intervalsByLap,
  })
}
