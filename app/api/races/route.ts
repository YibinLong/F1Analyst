import { NextResponse } from "next/server"
import { races2025 } from "@/lib/race-data"

export async function GET() {
  // In production, this would fetch from OpenF1 API
  // const response = await fetch('https://api.openf1.org/v1/meetings?year=2025')
  // const meetings = await response.json()

  return NextResponse.json(races2025)
}
