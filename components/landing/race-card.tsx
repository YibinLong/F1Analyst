"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { MapPin, Calendar } from "lucide-react"
import type { Race } from "@/lib/race-data"
import { TrackOutline } from "./track-outline"

interface RaceCardProps {
  race: Race
}

export function RaceCard({ race }: RaceCardProps) {
  const isPastRace = new Date(race.dateEnd) < new Date()

  return (
    <Link href={`/race/${race.meetingKey}`}>
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        className="group relative h-full overflow-hidden rounded-xl glass-panel cursor-pointer"
      >
        {/* Glow effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        </div>

        {/* Border glow */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-[-1px] rounded-xl bg-gradient-to-br from-primary/50 via-transparent to-accent/50 blur-sm" />
        </div>

        <div className="relative p-5">
          {/* Round badge */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded">
              R{race.round.toString().padStart(2, "0")}
            </span>
            {isPastRace && (
              <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded">COMPLETED</span>
            )}
          </div>

          {/* Track visualization */}
          <div className="relative h-32 mb-4 flex items-center justify-center">
            <TrackOutline
              trackId={race.circuitKey}
              className="w-full h-full opacity-60 group-hover:opacity-100 transition-opacity"
            />
            {/* Glowing dot on track */}
            <motion.div
              className="absolute w-2 h-2 rounded-full bg-primary glow-cyan"
              animate={{
                x: [0, 20, -10, 15, 0],
                y: [0, -15, 10, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          </div>

          {/* Race Info */}
          <div className="space-y-2">
            <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {race.country}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1">{race.meetingName}</p>

            <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {race.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {race.dateDisplay}
              </span>
            </div>
          </div>

          {/* Hover arrow */}
          <motion.div
            className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity"
            initial={{ x: -10 }}
            whileHover={{ x: 0 }}
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </Link>
  )
}
