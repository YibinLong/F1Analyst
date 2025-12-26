"use client"

import { trackPaths } from "@/lib/track-paths"

interface TrackOutlineProps {
  trackId: string
  className?: string
}

export function TrackOutline({ trackId, className = "" }: TrackOutlineProps) {
  const path = trackPaths[trackId] || trackPaths.default

  return (
    <svg viewBox="0 0 200 120" className={className} fill="none" preserveAspectRatio="xMidYMid meet">
      {/* Track glow */}
      <path
        d={path}
        stroke="oklch(0.75 0.18 195 / 0.3)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Main track line */}
      <path
        d={path}
        stroke="oklch(0.75 0.18 195)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Start/Finish indicator */}
      <circle cx="100" cy="90" r="4" fill="oklch(0.70 0.15 170)" />
    </svg>
  )
}
