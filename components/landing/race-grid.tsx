"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { RaceCard } from "./race-card"
import type { Race } from "@/lib/race-data"
import { Loader2 } from "lucide-react"
import { SEASON_YEAR } from "@/lib/season"

export function RaceGrid() {
  const [races, setRaces] = useState<Race[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRaces() {
      try {
        const response = await fetch("/api/races")
        if (!response.ok) {
          throw new Error("Failed to fetch races")
        }
        const data = await response.json()

        // Handle error response from API
        if (data.error) {
          throw new Error(data.error)
        }

        setRaces(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchRaces()
  }, [])

  return (
    <section id="race-calendar" className="relative px-4 py-20">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-primary">{SEASON_YEAR}</span> Season Calendar
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Select a Grand Prix to dive into the race analysis with our AI-powered replay system
          </p>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Loading race calendar...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="glass-panel p-8 rounded-xl text-center max-w-md">
              <p className="text-destructive mb-4">{error}</p>
              <button
                onClick={() => {
                  setError(null)
                  setIsLoading(true)
                  fetch("/api/races")
                    .then((res) => res.json())
                    .then((data) => {
                      if (data.error) throw new Error(data.error)
                      setRaces(data)
                    })
                    .catch((err) => setError(err.message))
                    .finally(() => setIsLoading(false))
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Race Cards Grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {races.map((race, index) => (
              <motion.div
                key={race.meetingKey}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.4,
                  delay: Math.min(index * 0.05, 0.3),
                  ease: "easeOut",
                }}
              >
                <RaceCard race={race} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
