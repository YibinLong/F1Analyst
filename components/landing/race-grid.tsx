"use client"

import { motion } from "framer-motion"
import { RaceCard } from "./race-card"
import { races2025 } from "@/lib/race-data"

export function RaceGrid() {
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
            <span className="text-primary">2025</span> Season Calendar
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Select a Grand Prix to dive into the race analysis with our AI-powered replay system
          </p>
        </motion.div>

        {/* Race Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {races2025.map((race, index) => (
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
      </div>
    </section>
  )
}
