import { Hero } from "@/components/landing/hero"
import { RaceGrid } from "@/components/landing/race-grid"

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* HUD Grid Background */}
      <div className="fixed inset-0 hud-grid opacity-30 pointer-events-none" />

      {/* Gradient overlays */}
      <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10">
        <Hero />
        <RaceGrid />
      </div>
    </main>
  )
}
