"use client"

import { motion } from "framer-motion"
import type { Driver } from "@/lib/f1-teams"
import { PositionDataUnavailable } from "./data-unavailable"

interface Standing {
  position: number
  driver: Driver
  interval: string | null
  gapToLeader: string | null
}

interface LeaderboardProps {
  standings: Standing[]
  selectedDriverNumber?: number | null
  onDriverSelect?: (driverNumber: number | null) => void
}

export function Leaderboard({ standings, selectedDriverNumber, onDriverSelect }: LeaderboardProps) {
  // Handle empty standings gracefully
  const hasData = standings && standings.length > 0

  return (
    <div className="h-full flex flex-col glass-panel">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50">
        <h2 className="text-sm font-bold text-primary tracking-wider">LIVE STANDINGS</h2>
      </div>

      {/* Standings List */}
      <div className="flex-1 overflow-y-auto">
        {!hasData ? (
          <div className="p-4">
            <PositionDataUnavailable />
          </div>
        ) : (
        <div className="p-2 space-y-1">
          {standings.map((standing, index) => {
            const isSelected = selectedDriverNumber === standing.driver.number
            return (
              <motion.div
                key={standing.driver.number}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => onDriverSelect?.(isSelected ? null : standing.driver.number)}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary/20 ring-1 ring-primary/50"
                    : "hover:bg-muted/50"
                }`}
                style={isSelected ? {
                  boxShadow: `0 0 12px ${standing.driver.teamColor}40`,
                  borderLeft: `3px solid ${standing.driver.teamColor}`
                } : undefined}
              >
                {/* Position */}
                <span
                  className={`w-6 text-center font-mono font-bold text-sm ${
                    isSelected ? "text-primary" : standing.position <= 3 ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {standing.position}
                </span>

                {/* Team color bar */}
                <div
                  className={`w-1 h-8 rounded-full transition-all ${isSelected ? "w-1.5" : ""}`}
                  style={{ backgroundColor: standing.driver.teamColor }}
                />

                {/* Driver info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold text-sm ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {standing.driver.code}
                    </span>
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
                    <span className={`text-xs font-mono ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                      {standing.interval || "---"}
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
        )}
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
