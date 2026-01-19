"use client"

import { useMemo } from "react"
import { Thermometer, Droplets, Wind, CloudRain, Sun, Cloud, CloudSun } from "lucide-react"
import type { OpenF1Weather } from "@/types/openf1"

interface WeatherWidgetProps {
  weather: OpenF1Weather[]
  currentLap: number
  laps: Array<{ lap_number: number; driver_number: number; date_start: string | null }>
}

/**
 * Get wind direction as cardinal direction
 */
function getWindDirection(degrees: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  const index = Math.round(degrees / 45) % 8
  return directions[index]
}

/**
 * Get appropriate weather icon based on conditions
 */
function WeatherIcon({ rainfall, humidity }: { rainfall: number; humidity: number }) {
  if (rainfall > 0) {
    return <CloudRain className="w-4 h-4 text-blue-400" />
  }
  if (humidity > 80) {
    return <Cloud className="w-4 h-4 text-gray-400" />
  }
  if (humidity > 50) {
    return <CloudSun className="w-4 h-4 text-yellow-400" />
  }
  return <Sun className="w-4 h-4 text-yellow-500" />
}

export function WeatherWidget({ weather, currentLap, laps }: WeatherWidgetProps) {
  // Find the weather data closest to the current lap timestamp
  const currentWeather = useMemo(() => {
    if (!weather || weather.length === 0) return null

    // Get the timestamp of current lap from lap data
    const currentLapData = laps.find(
      (lap) => lap.lap_number === currentLap && lap.date_start
    )

    if (!currentLapData?.date_start) {
      // If no lap timestamp, return the most recent weather data
      return weather[weather.length - 1]
    }

    const targetTime = new Date(currentLapData.date_start).getTime()

    // Find the closest weather reading
    let closest = weather[0]
    let minDiff = Math.abs(new Date(closest.date).getTime() - targetTime)

    for (const w of weather) {
      const diff = Math.abs(new Date(w.date).getTime() - targetTime)
      if (diff < minDiff) {
        minDiff = diff
        closest = w
      }
    }

    return closest
  }, [weather, currentLap, laps])

  // Don't render if no weather data available
  if (!currentWeather) {
    return null
  }

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-muted/50 text-sm">
      {/* Weather condition icon */}
      <WeatherIcon
        rainfall={currentWeather.rainfall}
        humidity={currentWeather.humidity}
      />

      {/* Air Temperature */}
      <div className="flex items-center gap-1" title="Air Temperature">
        <Thermometer className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="font-mono text-foreground">
          {currentWeather.air_temperature.toFixed(1)}°C
        </span>
      </div>

      {/* Track Temperature */}
      <div className="flex items-center gap-1" title="Track Temperature">
        <span className="text-xs text-muted-foreground">Track</span>
        <span className="font-mono text-orange-400">
          {currentWeather.track_temperature.toFixed(1)}°C
        </span>
      </div>

      {/* Humidity */}
      <div className="flex items-center gap-1" title="Humidity">
        <Droplets className="w-3.5 h-3.5 text-blue-400" />
        <span className="font-mono text-foreground">
          {currentWeather.humidity.toFixed(0)}%
        </span>
      </div>

      {/* Wind */}
      <div className="flex items-center gap-1" title={`Wind Speed & Direction (${currentWeather.wind_direction}°)`}>
        <Wind className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="font-mono text-foreground">
          {currentWeather.wind_speed.toFixed(1)} m/s
        </span>
        <span className="text-xs text-muted-foreground">
          {getWindDirection(currentWeather.wind_direction)}
        </span>
      </div>

      {/* Rainfall indicator */}
      {currentWeather.rainfall > 0 && (
        <div className="flex items-center gap-1 text-blue-400" title="Rainfall">
          <CloudRain className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">WET</span>
        </div>
      )}
    </div>
  )
}
