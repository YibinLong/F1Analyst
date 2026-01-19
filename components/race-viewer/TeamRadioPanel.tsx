"use client"

import { useState, useRef, useMemo, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Radio, Play, Pause, Volume2, VolumeX, X, ChevronDown, ChevronUp } from "lucide-react"
import type { OpenF1TeamRadio } from "@/types/openf1"
import type { Driver } from "@/lib/f1-teams"

interface TeamRadioPanelProps {
  teamRadio: OpenF1TeamRadio[]
  drivers: Driver[]
  currentLap: number
  laps: Array<{ lap_number: number; driver_number: number; date_start: string | null }>
  onClose?: () => void
}

interface RadioClip {
  id: string
  driverNumber: number
  driver: Driver | null
  date: string
  lapNumber: number
  recordingUrl: string
}

/**
 * TeamRadioPanel Component
 *
 * Displays team radio communications with audio playback.
 * Shows clips near the current timeline position.
 */
export function TeamRadioPanel({
  teamRadio,
  drivers,
  currentLap,
  laps,
  onClose,
}: TeamRadioPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [playingClipId, setPlayingClipId] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Create driver lookup map
  const driverMap = useMemo(() => {
    const map = new Map<number, Driver>()
    for (const driver of drivers) {
      map.set(driver.number, driver)
    }
    return map
  }, [drivers])

  // Build lap timestamp lookup for estimating lap numbers
  const lapTimestamps = useMemo(() => {
    const timestamps: Array<{ lap: number; timestamp: number }> = []
    for (const lap of laps) {
      if (lap.date_start) {
        timestamps.push({
          lap: lap.lap_number,
          timestamp: new Date(lap.date_start).getTime(),
        })
      }
    }
    return timestamps.sort((a, b) => a.timestamp - b.timestamp)
  }, [laps])

  // Get lap number for a given timestamp
  const getLapNumber = useCallback(
    (dateStr: string): number => {
      const time = new Date(dateStr).getTime()
      let lapNumber = 1
      for (const { lap, timestamp } of lapTimestamps) {
        if (time >= timestamp) {
          lapNumber = lap
        } else {
          break
        }
      }
      return lapNumber
    },
    [lapTimestamps]
  )

  // Process radio clips and assign lap numbers
  const radioClips: RadioClip[] = useMemo(() => {
    if (!teamRadio || teamRadio.length === 0) return []

    return teamRadio.map((radio) => ({
      id: `${radio.driver_number}-${radio.date}`,
      driverNumber: radio.driver_number,
      driver: driverMap.get(radio.driver_number) || null,
      date: radio.date,
      lapNumber: getLapNumber(radio.date),
      recordingUrl: radio.recording_url,
    }))
  }, [teamRadio, driverMap, getLapNumber])

  // Filter clips to show only those near current lap (within 3 laps)
  const filteredClips = useMemo(() => {
    return radioClips
      .filter((clip) => {
        const lapDiff = Math.abs(clip.lapNumber - currentLap)
        return lapDiff <= 3
      })
      .sort((a, b) => {
        // Sort by lap proximity to current lap, then by time
        const aDiff = Math.abs(a.lapNumber - currentLap)
        const bDiff = Math.abs(b.lapNumber - currentLap)
        if (aDiff !== bDiff) return aDiff - bDiff
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      })
      .slice(0, 10) // Limit to 10 clips
  }, [radioClips, currentLap])

  // Handle audio playback
  const handlePlayClip = useCallback(
    (clip: RadioClip) => {
      setAudioError(null)

      if (playingClipId === clip.id) {
        // Pause current clip
        if (audioRef.current) {
          audioRef.current.pause()
        }
        setPlayingClipId(null)
        return
      }

      // Play new clip
      if (audioRef.current) {
        audioRef.current.pause()
      }

      const audio = new Audio(clip.recordingUrl)
      audio.muted = isMuted
      audioRef.current = audio

      audio.addEventListener("ended", () => {
        setPlayingClipId(null)
      })

      audio.addEventListener("error", () => {
        setAudioError("Unable to play audio")
        setPlayingClipId(null)
      })

      audio.play().catch(() => {
        setAudioError("Audio playback blocked")
        setPlayingClipId(null)
      })

      setPlayingClipId(clip.id)
    },
    [playingClipId, isMuted]
  )

  // Handle mute toggle
  const handleMuteToggle = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev
      if (audioRef.current) {
        audioRef.current.muted = newMuted
      }
      return newMuted
    })
  }, [])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // Format time for display
  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  }

  // Don't render if no team radio data available
  if (!teamRadio || teamRadio.length === 0) {
    return (
      <div className="glass-panel rounded-lg p-4 text-center">
        <Radio className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
        <p className="text-sm text-muted-foreground">
          Radio unavailable for this session
        </p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-lg overflow-hidden border border-border/50"
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-red-500" />
          <span className="font-semibold text-sm">Team Radio</span>
          <span className="text-xs text-muted-foreground">
            ({filteredClips.length} clips)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Mute button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleMuteToggle()
            }}
            className="p-1.5 rounded-md hover:bg-muted/50 transition-colors"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Volume2 className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          {/* Close button (optional) */}
          {onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="p-1.5 rounded-md hover:bg-muted/50 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          {/* Expand/collapse */}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Clip list */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto">
              {audioError && (
                <div className="px-4 py-2 bg-red-500/10 text-red-400 text-xs">
                  {audioError}
                </div>
              )}

              {filteredClips.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No radio clips near Lap {currentLap}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {filteredClips.map((clip) => (
                    <div
                      key={clip.id}
                      className={`px-4 py-2.5 flex items-center gap-3 hover:bg-muted/30 transition-colors ${
                        playingClipId === clip.id ? "bg-muted/50" : ""
                      }`}
                    >
                      {/* Play button */}
                      <button
                        onClick={() => handlePlayClip(clip)}
                        className={`p-2 rounded-full transition-all ${
                          playingClipId === clip.id
                            ? "bg-red-500 text-white"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                        aria-label={
                          playingClipId === clip.id ? "Pause" : "Play"
                        }
                      >
                        {playingClipId === clip.id ? (
                          <Pause className="w-3 h-3" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                      </button>

                      {/* Driver info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {clip.driver && (
                            <>
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{
                                  backgroundColor: clip.driver.teamColor,
                                }}
                              />
                              <span className="font-mono font-semibold text-sm">
                                {clip.driver.code}
                              </span>
                            </>
                          )}
                          {!clip.driver && (
                            <span className="font-mono text-sm text-muted-foreground">
                              #{clip.driverNumber}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Lap {clip.lapNumber}</span>
                          <span>•</span>
                          <span>{formatTime(clip.date)}</span>
                        </div>
                      </div>

                      {/* Playing indicator */}
                      {playingClipId === clip.id && (
                        <div className="flex items-center gap-0.5">
                          <motion.div
                            animate={{ scaleY: [0.3, 1, 0.3] }}
                            transition={{
                              repeat: Infinity,
                              duration: 0.5,
                              delay: 0,
                            }}
                            className="w-0.5 h-3 bg-red-500 rounded-full"
                          />
                          <motion.div
                            animate={{ scaleY: [0.3, 1, 0.3] }}
                            transition={{
                              repeat: Infinity,
                              duration: 0.5,
                              delay: 0.1,
                            }}
                            className="w-0.5 h-3 bg-red-500 rounded-full"
                          />
                          <motion.div
                            animate={{ scaleY: [0.3, 1, 0.3] }}
                            transition={{
                              repeat: Infinity,
                              duration: 0.5,
                              delay: 0.2,
                            }}
                            className="w-0.5 h-3 bg-red-500 rounded-full"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer showing total clips */}
            <div className="px-4 py-2 bg-muted/20 border-t border-border/30">
              <p className="text-xs text-muted-foreground text-center">
                {radioClips.length} total radio clips in session
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
