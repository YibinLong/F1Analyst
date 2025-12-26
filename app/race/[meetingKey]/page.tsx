import { Suspense } from "react"
import { notFound } from "next/navigation"
import { races2025 } from "@/lib/race-data"
import { RaceViewer } from "@/components/race-viewer/race-viewer"
import { RaceViewerSkeleton } from "@/components/race-viewer/race-viewer-skeleton"

interface RacePageProps {
  params: Promise<{ meetingKey: string }>
}

export async function generateMetadata({ params }: RacePageProps) {
  const { meetingKey } = await params
  const race = races2025.find((r) => r.meetingKey === meetingKey)

  if (!race) {
    return { title: "Race Not Found | Pitstop AI" }
  }

  return {
    title: `${race.meetingName} | Pitstop AI`,
    description: `Analyze the ${race.meetingName} with AI-powered race replay and insights`,
  }
}

export default async function RacePage({ params }: RacePageProps) {
  const { meetingKey } = await params
  const race = races2025.find((r) => r.meetingKey === meetingKey)

  if (!race) {
    notFound()
  }

  return (
    <main className="relative h-screen overflow-hidden">
      {/* HUD Grid Background */}
      <div className="fixed inset-0 hud-grid opacity-20 pointer-events-none" />

      <Suspense fallback={<RaceViewerSkeleton />}>
        <RaceViewer race={race} />
      </Suspense>
    </main>
  )
}
