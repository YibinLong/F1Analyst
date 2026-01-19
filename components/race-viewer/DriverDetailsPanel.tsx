"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import type { Driver } from "@/lib/f1-teams"

interface DriverDetailsPanelProps {
  driver: Driver | null
  position: number | null
  interval: string | null
  gapToLeader: string | null
  onClose: () => void
}

/**
 * DriverDetailsPanel Component
 *
 * Displays detailed information about the selected driver in a floating panel.
 * Shows name, team, current position, gap, and other relevant race data.
 */
export function DriverDetailsPanel({
  driver,
  position,
  interval,
  gapToLeader,
  onClose,
}: DriverDetailsPanelProps) {
  if (!driver) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="absolute bottom-24 left-4 z-30 w-72"
      >
        <div className="glass-panel rounded-xl overflow-hidden border border-border/50 shadow-lg">
          {/* Header with team color accent */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{
              background: `linear-gradient(135deg, ${driver.teamColor}22 0%, transparent 100%)`,
              borderBottom: `2px solid ${driver.teamColor}`
            }}
          >
            <div className="flex items-center gap-3">
              {/* Position badge */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-lg"
                style={{
                  backgroundColor: driver.teamColor,
                  color: getContrastColor(driver.teamColor)
                }}
              >
                P{position}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg text-foreground">
                    {driver.code}
                  </span>
                  <span className="text-xs text-muted-foreground">#{driver.number}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {driver.firstName} {driver.lastName}
                </p>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Close driver details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Driver stats */}
          <div className="p-4 space-y-3">
            {/* Team */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Team</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: driver.teamColor }}
                />
                <span className="text-sm font-medium text-foreground">{driver.team}</span>
              </div>
            </div>

            {/* Interval to car ahead */}
            {position && position > 1 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Interval</span>
                <span className="font-mono text-sm text-foreground">
                  {interval || "---"}
                </span>
              </div>
            )}

            {/* Gap to leader */}
            {position && position > 1 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Gap to Leader</span>
                <span className="font-mono text-sm text-foreground">
                  {gapToLeader || "---"}
                </span>
              </div>
            )}

            {/* Leader indicator */}
            {position === 1 && (
              <div className="flex items-center justify-center py-2">
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${driver.teamColor}33`,
                    color: driver.teamColor
                  }}
                >
                  Race Leader
                </span>
              </div>
            )}
          </div>

          {/* Bottom accent */}
          <div
            className="h-1"
            style={{ backgroundColor: driver.teamColor }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Calculate contrasting text color (black or white) based on background
 */
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '')

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // Return black for light colors, white for dark
  return luminance > 0.5 ? '#000000' : '#ffffff'
}
