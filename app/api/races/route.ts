import { NextResponse } from "next/server"
import { getMeetings, mapCircuitToKey } from "@/lib/openf1"
import { SEASON_YEAR } from "@/lib/season"
import type { Race } from "@/lib/race-data"

// Cache the races for 1 hour (races don't change frequently)
let cachedRaces: Race[] | null = null
let cacheTime: number = 0
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

/**
 * Format a date range for display (e.g., "Mar 14-16" or "May 30 - Jun 1")
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

/**
 * Calculate the end date of a race weekend (usually 2 days after start)
 */
function calculateEndDate(dateStart: string): string {
  const start = new Date(dateStart)
  const end = new Date(start)
  end.setDate(start.getDate() + 2)
  return end.toISOString().split("T")[0]
}

export async function GET() {
  // Check cache
  const now = Date.now()
  if (cachedRaces && now - cacheTime < CACHE_DURATION) {
    return NextResponse.json(cachedRaces)
  }

  // Fetch from OpenF1 API
  const meetings = await getMeetings(SEASON_YEAR)

  if (!meetings || meetings.length === 0) {
    return NextResponse.json(
      { error: "Unable to fetch race calendar" },
      { status: 500 }
    )
  }

  // Filter to only include Grand Prix events (exclude testing)
  const grandPrixMeetings = meetings.filter(
    (meeting) =>
      meeting.meeting_name.toLowerCase().includes("grand prix") ||
      meeting.meeting_official_name.toLowerCase().includes("grand prix")
  )

  // Sort by date ascending
  grandPrixMeetings.sort(
    (a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
  )

  // Map to frontend Race format
  const races: Race[] = grandPrixMeetings.map((meeting, index) => {
    const dateEnd = calculateEndDate(meeting.date_start)

    return {
      meetingKey: String(meeting.meeting_key),
      meetingName: meeting.meeting_name,
      country: meeting.country_name,
      location: meeting.location,
      circuitKey: mapCircuitToKey(meeting.circuit_short_name),
      round: index + 1,
      dateStart: meeting.date_start.split("T")[0],
      dateEnd: dateEnd,
      dateDisplay: formatDateDisplay(meeting.date_start, dateEnd),
    }
  })

  // Update cache
  cachedRaces = races
  cacheTime = now

  return NextResponse.json(races)
}
