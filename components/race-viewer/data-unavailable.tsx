"use client"

import { AlertCircle, MapPin, Flag, BarChart3, RefreshCw } from "lucide-react"

interface DataUnavailableProps {
  title?: string
  message?: string
  variant?: "full" | "inline" | "minimal"
  icon?: "alert" | "location" | "flag" | "chart"
  onRetry?: () => void
}

/**
 * DataUnavailable - Displays a message when data is not available
 * Used for graceful degradation when API returns empty/null data
 */
export function DataUnavailable({
  title = "Data Unavailable",
  message = "This data is currently unavailable. Please try again later.",
  variant = "inline",
  icon = "alert",
  onRetry,
}: DataUnavailableProps) {
  const IconComponent = {
    alert: AlertCircle,
    location: MapPin,
    flag: Flag,
    chart: BarChart3,
  }[icon]

  if (variant === "full") {
    return (
      <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-background/50 rounded-lg border border-border/50">
        <div className="text-center p-6 max-w-sm">
          <IconComponent className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          )}
        </div>
      </div>
    )
  }

  if (variant === "minimal") {
    return (
      <div className="flex items-center gap-2 text-muted-foreground p-2">
        <IconComponent className="w-4 h-4" />
        <span className="text-xs">{title}</span>
      </div>
    )
  }

  // inline variant (default)
  return (
    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border/50">
      <IconComponent className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-xs text-muted-foreground truncate">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex-shrink-0 p-1.5 hover:bg-muted rounded transition-colors"
          title="Retry"
        >
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </div>
  )
}

/**
 * LocationDataUnavailable - Specific variant for missing location/track data
 */
export function LocationDataUnavailable({ onRetry }: { onRetry?: () => void }) {
  return (
    <DataUnavailable
      title="Location Data Unavailable"
      message="Car positions are not available for this session. Showing estimated positions."
      variant="inline"
      icon="location"
      onRetry={onRetry}
    />
  )
}

/**
 * PositionDataUnavailable - Specific variant for missing position/standings data
 */
export function PositionDataUnavailable({ onRetry }: { onRetry?: () => void }) {
  return (
    <DataUnavailable
      title="Position Data Unavailable"
      message="Race standings are not available for this lap."
      variant="inline"
      icon="chart"
      onRetry={onRetry}
    />
  )
}

/**
 * RaceControlDataUnavailable - Specific variant for missing race control data
 */
export function RaceControlDataUnavailable() {
  return (
    <DataUnavailable
      title="No Race Events"
      message="No race control messages available."
      variant="minimal"
      icon="flag"
    />
  )
}

/**
 * NoRaceDataAvailable - Full-screen variant when no race data could be loaded
 */
export function NoRaceDataAvailable({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background">
      <div className="glass-panel p-8 rounded-xl text-center max-w-md">
        <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Race Data Not Available</h2>
        <p className="text-muted-foreground mb-4">
          We couldn&apos;t load the data for this race. This may be due to a temporary API issue or the data may not be available yet.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}
