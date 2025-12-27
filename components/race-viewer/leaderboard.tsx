"use client"

import { motion } from "framer-motion"
import type { Driver } from "@/lib/f1-teams"

interface Standing {
  position: number
  driver: Driver
  interval: string | null
  gapToLeader: string | null
}

interface LeaderboardProps {
  standings: Standing[]
}

export function Leaderboard({ standings }: LeaderboardProps) {
  return (
    <div className="h-full flex flex-col glass-panel">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50">
        <h2 className="text-sm font-bold text-primary tracking-wider">LIVE STANDINGS</h2>
      </div>

      {/* Standings List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {standings.map((standing, index) => (
            <motion.div
              key={standing.driver.number}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              {/* Position */}
              <span
                className={`w-6 text-center font-mono font-bold text-sm ${
                  standing.position <= 3 ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {standing.position}
              </span>

              {/* Team color bar */}
              <div className="w-1 h-8 rounded-full" style={{ backgroundColor: standing.driver.teamColor }} />

              {/* Driver info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-foreground">{standing.driver.code}</span>
                  <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                    {standing.driver.firstName.charAt(0)}. {standing.driver.lastName}
                  </span>
                </div>
              </div>

              {/* Interval */}
              <div className="text-right">
                {standing.position === 1 ? (
                  <span className="text-xs font-mono font-bold text-primary">LEADER</span>
                ) : (
                  <span className="text-xs font-mono text-muted-foreground">
                    {standing.interval || "---"}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer stats */}
      <div className="px-4 py-3 border-t border-border/50">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground">Gap P1-P2</span>
            <p className="font-mono font-bold text-foreground">
              {standings[1]?.interval || "---"}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Gap P1-P3</span>
            <p className="font-mono font-bold text-foreground">
              {standings[2]?.gapToLeader || "---"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
