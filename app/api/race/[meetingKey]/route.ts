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
  getMeetings,
  getMaxLapNumber,
  groupPositionsByLap,
  groupIntervalsByLap,
  mapTeamNameToKey,
  mapCircuitToKey,
} from "@/lib/openf1"
import { teamColors, type Driver } from "@/lib/f1-teams"
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

  if (isNaN(meetingKeyNum)) {
    return NextResponse.json({ error: "Invalid meeting key" }, { status: 400 })
  }

  // Get the Race session for this meeting
  const session = await getSession(meetingKeyNum, "Race")

  if (!session) {
    return NextResponse.json(
      { error: "Race session not found for this meeting" },
      { status: 404 }
    )
  }

  // Fetch all data in parallel
  const [drivers, positions, intervals, laps, locations, raceControl, pitStops, meetings] =
    await Promise.all([
      getDrivers(session.session_key),
      getPositions(session.session_key),
      getIntervals(session.session_key),
      getLaps(session.session_key),
      getLocations(session.session_key),
      getRaceControl(session.session_key),
      getPitStops(session.session_key),
      getMeetings(2025),
    ])

  // Find meeting info for race metadata
  const meeting = meetings?.find((m) => m.meeting_key === meetingKeyNum)

  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
  }

  // Calculate total laps
  const totalLaps = laps ? getMaxLapNumber(laps) : 0

  // Map drivers to frontend format
  const mappedDrivers: Driver[] = (drivers || []).map((d) => {
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

  return NextResponse.json({
    race,
    drivers: mappedDrivers,
    totalLaps,
    sessionKey: session.session_key,
    // Raw data for the race viewer
    positions: positions || [],
    intervals: intervals || [],
    laps: laps || [],
    locations: locations || [],
    raceControl: raceControl || [],
    pitStops: pitStops || [],
    // Grouped data for efficient lookup during playback
    positionsByLap,
    intervalsByLap,
  })
}
