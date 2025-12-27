"use client"

import { motion } from "framer-motion"

export function RaceViewerSkeleton() {
  return (
    <div className="h-screen flex flex-col">
      {/* Header Skeleton */}
      <header className="h-16 flex items-center justify-between px-4 border-b border-border/50 glass-panel">
        <div className="flex items-center gap-4">
          {/* Back button placeholder */}
          <div className="w-16 h-8 bg-muted/50 rounded animate-pulse" />
          <div className="h-8 w-px bg-border" />
          {/* Race info placeholder */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-6 bg-primary/20 rounded animate-pulse" />
            <div>
              <div className="w-32 h-4 bg-muted/50 rounded animate-pulse mb-1" />
              <div className="w-24 h-3 bg-muted/30 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-32 h-10 bg-muted/50 rounded-lg animate-pulse" />
          <div className="w-20 h-4 bg-muted/30 rounded animate-pulse" />
        </div>
      </header>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex overflow-hidden">
        {/* Leaderboard Skeleton */}
        <div className="w-72 flex-shrink-0 border-r border-border/50 glass-panel">
          <div className="px-4 py-3 border-b border-border/50">
            <div className="w-28 h-4 bg-primary/20 rounded animate-pulse" />
          </div>
          <div className="p-2 space-y-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
              >
                <div className="w-6 h-5 bg-muted/40 rounded animate-pulse" />
                <div className="w-1 h-8 bg-muted/30 rounded-full animate-pulse" />
                <div className="flex-1">
                  <div className="w-12 h-4 bg-muted/40 rounded animate-pulse" />
                </div>
                <div className="w-16 h-3 bg-muted/30 rounded animate-pulse" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Track Visualization Skeleton */}
        <div className="flex-1 relative bg-background">
          <div className="absolute top-4 left-4 z-20">
            <div className="glass-panel px-3 py-2 rounded-lg">
              <div className="w-16 h-3 bg-muted/30 rounded animate-pulse mb-1" />
              <div className="w-24 h-4 bg-primary/20 rounded animate-pulse" />
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-2 border-primary/30 border-t-primary rounded-full"
            />
          </div>
        </div>

        {/* Chat Panel Skeleton */}
        <div className="w-96 flex-shrink-0 border-l border-border/50 glass-panel">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/20 rounded-md animate-pulse" />
              <div>
                <div className="w-20 h-3 bg-muted/40 rounded animate-pulse mb-1" />
                <div className="w-28 h-2 bg-muted/30 rounded animate-pulse" />
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto bg-primary/20 rounded-lg animate-pulse mb-4" />
              <div className="w-48 h-3 mx-auto bg-muted/40 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Skeleton */}
      <div className="h-24 border-t border-border/50 glass-panel px-4 py-3">
        <div className="max-w-6xl mx-auto h-full flex flex-col gap-3">
          {/* Slider skeleton */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-3 bg-muted/30 rounded animate-pulse" />
            <div className="flex-1 h-1.5 bg-muted/30 rounded-full animate-pulse" />
            <div className="w-16 h-3 bg-muted/30 rounded animate-pulse" />
          </div>
          {/* Controls skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-muted/30 rounded animate-pulse" />
              <div className="w-10 h-10 bg-primary/30 rounded-full animate-pulse" />
              <div className="w-8 h-8 bg-muted/30 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-1">
              <div className="w-12 h-3 bg-muted/30 rounded animate-pulse mr-2" />
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-7 bg-muted/30 rounded animate-pulse" />
              ))}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="w-16 h-3 bg-muted/30 rounded animate-pulse mb-1" />
                <div className="w-10 h-8 bg-primary/30 rounded animate-pulse" />
              </div>
              <div className="w-24 h-8 bg-muted/40 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
