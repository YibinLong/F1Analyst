"use client"

import { useEffect, useState } from "react"
import { trackPaths } from "@/lib/track-paths"
import { fetchTrackPathD } from "@/lib/track-svg-utils"

interface TrackOutlineProps {
  trackId: string
  className?: string
}

export function TrackOutline({ trackId, className = "" }: TrackOutlineProps) {
  const fallbackPath = trackPaths[trackId] || trackPaths.default
  const [path, setPath] = useState(fallbackPath)

  useEffect(() => {
    let mounted = true
    setPath(fallbackPath)

    fetchTrackPathD(trackId).then((realPath) => {
      if (mounted && realPath) {
        setPath(realPath)
      }
    })

    return () => {
      mounted = false
    }
  }, [trackId, fallbackPath])

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
    </svg>
  )
}
