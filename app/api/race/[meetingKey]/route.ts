import { NextResponse } from "next/server"
import { races2025 } from "@/lib/race-data"
import { drivers2025 } from "@/lib/f1-teams"

interface RouteParams {
  params: Promise<{ meetingKey: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  const { meetingKey } = await params
  const race = races2025.find((r) => r.meetingKey === meetingKey)

  if (!race) {
    return NextResponse.json({ error: "Race not found" }, { status: 404 })
  }

  // In production, this would fetch from OpenF1 API
  // const [drivers, positions, intervals, laps] = await Promise.all([
  //   fetch(`https://api.openf1.org/v1/drivers?session_key=${sessionKey}`),
  //   fetch(`https://api.openf1.org/v1/position?session_key=${sessionKey}`),
  //   fetch(`https://api.openf1.org/v1/intervals?session_key=${sessionKey}`),
  //   fetch(`https://api.openf1.org/v1/laps?session_key=${sessionKey}`)
  // ])

  return NextResponse.json({
    race,
    drivers: drivers2025,
    totalLaps: 57,
    // Mock data structure for the race
    sessionKey: `${meetingKey}_race`,
  })
}
