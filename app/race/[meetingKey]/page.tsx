import { Suspense } from "react"
import { notFound } from "next/navigation"
import { RaceViewerWrapper } from "@/components/race-viewer/race-viewer-wrapper"
import { RaceViewerSkeleton } from "@/components/race-viewer/race-viewer-skeleton"
import { RaceViewerErrorBoundary } from "@/components/error-boundary"
import { getMeetings, mapCircuitToKey } from "@/lib/openf1"
import { SEASON_YEAR } from "@/lib/season"

interface RacePageProps {
  params: Promise<{ meetingKey: string }>
}

export async function generateMetadata({ params }: RacePageProps) {
  const { meetingKey } = await params

  // Fetch meeting info for metadata
  const meetings = await getMeetings(SEASON_YEAR)
  const meeting = meetings?.find((m) => String(m.meeting_key) === meetingKey)

  if (!meeting) {
    return { title: "Race Not Found | Pitstop AI" }
  }

  return {
    title: `${meeting.meeting_name} | Pitstop AI`,
    description: `Analyze the ${meeting.meeting_name} with AI-powered race replay and insights`,
  }
}

export default async function RacePage({ params }: RacePageProps) {
  const { meetingKey } = await params

  // Validate meetingKey is a number
  const meetingKeyNum = parseInt(meetingKey, 10)
  if (isNaN(meetingKeyNum)) {
    notFound()
  }

  // Pre-fetch meeting info to validate it exists
  const meetings = await getMeetings(SEASON_YEAR)
  const meeting = meetings?.find((m) => m.meeting_key === meetingKeyNum)

  if (!meeting) {
    notFound()
  }

  // Create basic race info for initial render
  // Full data will be fetched by RaceViewerWrapper
  const raceInfo = {
    meetingKey: meetingKey,
    meetingName: meeting.meeting_name,
    country: meeting.country_name,
    location: meeting.location,
    circuitKey: mapCircuitToKey(meeting.circuit_short_name),
  }

  return (
    <main className="relative h-screen overflow-hidden">
      {/* HUD Grid Background */}
      <div className="fixed inset-0 hud-grid opacity-20 pointer-events-none" />

      <RaceViewerErrorBoundary>
        <Suspense fallback={<RaceViewerSkeleton />}>
          <RaceViewerWrapper meetingKey={meetingKey} initialRaceInfo={raceInfo} />
        </Suspense>
      </RaceViewerErrorBoundary>
    </main>
  )
}
