"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera, Environment } from "@react-three/drei"
import { Suspense, useMemo, useRef, useEffect } from "react"
import * as THREE from "three"
import type { Driver } from "@/lib/f1-teams"
import type { OpenF1Location, OpenF1Lap } from "@/types/openf1"
import { trackPaths } from "@/lib/track-paths"
import {
  calculateTrackBounds,
  groupLocationsByDriver,
  getAnimationTimestamp,
  getRaceTimeRange,
  getInterpolatedPosition,
  type TrackBounds,
} from "@/lib/track-utils"

interface Standing {
  position: number
  driver: Driver
  interval: string | null
  gapToLeader: string | null
}

interface TrackVisualizationProps {
  trackId: string
  standings: Standing[]
  currentLap: number
  lapProgress?: number // 0-1 progress within current lap for smooth animation
  locations?: OpenF1Location[]
  laps?: OpenF1Lap[]
  totalLaps?: number
}

// Convert SVG path to 3D points
function pathToPoints(pathStr: string, scale = 0.1) {
  const points: [number, number, number][] = []
  const commands = pathStr.match(/[MLQTCSAZ][^MLQTCSAZ]*/gi) || []

  let currentX = 0
  let currentY = 0

  commands.forEach((cmd) => {
    const type = cmd[0].toUpperCase()
    const coords = cmd
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .map(Number)

    switch (type) {
      case "M":
      case "L":
        for (let i = 0; i < coords.length; i += 2) {
          currentX = coords[i]
          currentY = coords[i + 1]
          points.push([(currentX - 100) * scale, 0, (currentY - 60) * scale])
        }
        break
      case "Q":
        // Quadratic curve - sample points
        for (let t = 0; t <= 1; t += 0.1) {
          const x = (1 - t) * (1 - t) * currentX + 2 * (1 - t) * t * coords[0] + t * t * coords[2]
          const y = (1 - t) * (1 - t) * currentY + 2 * (1 - t) * t * coords[1] + t * t * coords[3]
          points.push([(x - 100) * scale, 0, (y - 60) * scale])
        }
        currentX = coords[2]
        currentY = coords[3]
        break
    }
  })

  return points
}

function Track({ trackId }: { trackId: string }) {
  const path = trackPaths[trackId] || trackPaths.default
  const points = useMemo(() => pathToPoints(path, 0.15), [path])

  return (
    <group>
      {/* Track surface glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[30, 20]} />
        <meshStandardMaterial color="#0a1020" transparent opacity={0.9} />
      </mesh>

      {/* Track line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(points.flat()), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#00d4ff" linewidth={2} />
      </line>

      {/* Track glow effect */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(points.flat()), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#00d4ff" transparent opacity={0.3} linewidth={8} />
      </line>

      {/* Start/Finish marker */}
      <mesh position={[0, 0.05, 4.5]}>
        <boxGeometry args={[0.3, 0.02, 0.05]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

// Reusable Vector3 for interpolation (avoid GC pressure)
const tempVec = new THREE.Vector3()

function Car({
  position,
  color,
  x,
  y,
  z,
}: {
  position: number
  color: string
  x: number
  y: number
  z: number
}) {
  return (
    <group position={[x, y, z]}>
      {/* Car body */}
      <mesh>
        <boxGeometry args={[0.3, 0.1, 0.15]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>

      {/* Motion trail */}
      <mesh position={[-0.3, 0, 0]}>
        <boxGeometry args={[0.4, 0.02, 0.08]} />
        <meshStandardMaterial color={color} transparent opacity={0.4} />
      </mesh>
      <mesh position={[-0.6, 0, 0]}>
        <boxGeometry args={[0.3, 0.02, 0.06]} />
        <meshStandardMaterial color={color} transparent opacity={0.2} />
      </mesh>
    </group>
  )
}

/**
 * AnimatedCar - Uses useFrame for smooth 60fps position interpolation
 * Directly mutates position via refs instead of React state for performance
 */
function AnimatedCar({
  driverNumber,
  color,
  driverLocations,
  trackBounds,
  raceTimeRange,
  currentLap,
  lapProgress,
  totalLaps,
}: {
  driverNumber: number
  color: string
  driverLocations: OpenF1Location[]
  trackBounds: TrackBounds
  raceTimeRange: { start: number; end: number }
  currentLap: number
  lapProgress: number
  totalLaps: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  const targetPosition = useRef({ x: 0, y: 0.15, z: 0 })

  // Calculate target position based on current lap and progress
  useEffect(() => {
    const timestamp = getAnimationTimestamp(currentLap, lapProgress, raceTimeRange, totalLaps)
    const pos = getInterpolatedPosition(driverLocations, timestamp, trackBounds)
    if (pos) {
      targetPosition.current = pos
    }
  }, [currentLap, lapProgress, driverLocations, trackBounds, raceTimeRange, totalLaps])

  // Smooth interpolation every frame using useFrame
  useFrame(() => {
    if (!groupRef.current) return

    // Smoothly lerp to target position (higher factor = faster response)
    const lerpFactor = 0.15

    groupRef.current.position.lerp(
      tempVec.set(
        targetPosition.current.x,
        targetPosition.current.y,
        targetPosition.current.z
      ),
      lerpFactor
    )
  })

  return (
    <group ref={groupRef} position={[targetPosition.current.x, targetPosition.current.y, targetPosition.current.z]}>
      {/* Car body */}
      <mesh>
        <boxGeometry args={[0.3, 0.1, 0.15]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>

      {/* Motion trail */}
      <mesh position={[-0.3, 0, 0]}>
        <boxGeometry args={[0.4, 0.02, 0.08]} />
        <meshStandardMaterial color={color} transparent opacity={0.4} />
      </mesh>
      <mesh position={[-0.6, 0, 0]}>
        <boxGeometry args={[0.3, 0.02, 0.06]} />
        <meshStandardMaterial color={color} transparent opacity={0.2} />
      </mesh>
    </group>
  )
}

function CarFallback({
  color,
  index,
  trackId,
}: {
  color: string
  index: number
  trackId: string
}) {
  const path = trackPaths[trackId] || trackPaths.default
  const points = useMemo(() => pathToPoints(path, 0.15), [path])

  // Distribute cars along track based on position
  const pointIndex = Math.floor((index / 20) * points.length * 0.8) % points.length
  const carPosition = points[pointIndex] || [0, 0, 0]

  return (
    <Car
      position={index + 1}
      color={color}
      x={carPosition[0]}
      y={0.15}
      z={carPosition[2]}
    />
  )
}

interface SceneProps {
  trackId: string
  standings: Standing[]
  carPositions: Map<number, { x: number; y: number; z: number }>
  useRealPositions: boolean
  // Props for animated cars
  locationsByDriver?: Map<number, OpenF1Location[]>
  trackBounds?: TrackBounds | null
  raceTimeRange?: { start: number; end: number }
  currentLap?: number
  lapProgress?: number
  totalLaps?: number
}

function Scene({
  trackId,
  standings,
  carPositions,
  useRealPositions,
  locationsByDriver,
  trackBounds,
  raceTimeRange,
  currentLap = 1,
  lapProgress = 0,
  totalLaps = 57,
}: SceneProps) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 12, 15]} fov={50} />
      <OrbitControls
        enablePan={false}
        minDistance={10}
        maxDistance={30}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.5}
        autoRotate
        autoRotateSpeed={0.3}
      />

      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#00d4ff" />
      <pointLight position={[-10, 10, -10]} intensity={0.3} color="#00ffc8" />

      <Track trackId={trackId} />

      {standings.slice(0, 20).map((standing, index) => {
        const driverLocations = locationsByDriver?.get(standing.driver.number)

        // Use AnimatedCar for smooth 60fps animation when we have location data
        if (useRealPositions && driverLocations && driverLocations.length > 0 && trackBounds && raceTimeRange) {
          return (
            <AnimatedCar
              key={standing.driver.number}
              driverNumber={standing.driver.number}
              color={standing.driver.teamColor}
              driverLocations={driverLocations}
              trackBounds={trackBounds}
              raceTimeRange={raceTimeRange}
              currentLap={currentLap}
              lapProgress={lapProgress}
              totalLaps={totalLaps}
            />
          )
        }

        // Fallback to static position if we have pre-computed positions
        const realPos = carPositions.get(standing.driver.number)
        if (useRealPositions && realPos) {
          return (
            <Car
              key={standing.driver.number}
              position={standing.position}
              color={standing.driver.teamColor}
              x={realPos.x}
              y={realPos.y}
              z={realPos.z}
            />
          )
        }

        // Fallback to distribution along track
        return (
          <CarFallback
            key={standing.driver.number}
            color={standing.driver.teamColor}
            index={index}
            trackId={trackId}
          />
        )
      })}

      <Environment preset="night" />
    </>
  )
}

export function TrackVisualization({
  trackId,
  standings,
  currentLap,
  lapProgress = 0,
  locations = [],
  laps = [],
  totalLaps = 57,
}: TrackVisualizationProps) {
  // Calculate track bounds and group locations (memoized for performance)
  const { trackBounds, locationsByDriver, raceTimeRange } = useMemo(() => {
    if (locations.length === 0) {
      return {
        trackBounds: null,
        locationsByDriver: new Map<number, OpenF1Location[]>(),
        raceTimeRange: { start: Date.now(), end: Date.now() },
      }
    }

    return {
      trackBounds: calculateTrackBounds(locations),
      locationsByDriver: groupLocationsByDriver(locations),
      raceTimeRange: getRaceTimeRange(locations),
    }
  }, [locations])

  // Development mode: log memory usage for large dataset analysis (Story 3.3)
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && locations.length > 0) {
      const locationCount = locations.length
      const estimatedBytes = locationCount * 40 // ~40 bytes per location point
      console.log(
        `[TrackVisualization] Location data: ${locationCount.toLocaleString()} points, ` +
        `~${(estimatedBytes / 1024).toFixed(1)} KB, ` +
        `${locationsByDriver.size} drivers`
      )
    }
  }, [locations, locationsByDriver.size])

  // Calculate static car positions for fallback (when AnimatedCar isn't used)
  const carPositions = useMemo(() => {
    const positions = new Map<number, { x: number; y: number; z: number }>()

    if (!trackBounds || locationsByDriver.size === 0) {
      return positions
    }

    // Calculate timestamp for current lap with progress
    const timestamp = getAnimationTimestamp(currentLap, lapProgress, raceTimeRange, totalLaps)

    for (const [driverNum, driverLocations] of locationsByDriver) {
      const pos = getInterpolatedPosition(driverLocations, timestamp, trackBounds)
      if (pos) {
        positions.set(driverNum, pos)
      }
    }

    return positions
  }, [currentLap, lapProgress, trackBounds, locationsByDriver, raceTimeRange, totalLaps])

  const useRealPositions = locations.length > 0 && locationsByDriver.size > 0

  return (
    <div className="w-full h-full relative">
      {/* Scanline overlay */}
      <div className="absolute inset-0 scanlines pointer-events-none z-10" />

      {/* Corner HUD elements */}
      <div className="absolute top-4 left-4 z-20">
        <div className="glass-panel px-3 py-2 rounded-lg">
          <span className="text-xs text-muted-foreground">TRACK VIEW</span>
          <p className="font-mono text-sm text-primary">{trackId.toUpperCase().replace("_", " ")}</p>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-20">
        <div className="glass-panel px-3 py-2 rounded-lg">
          <span className="text-xs text-muted-foreground">
            {useRealPositions ? "LIVE DATA" : "SIMULATION"}
          </span>
          <p className="font-mono text-sm text-accent">60 FPS</p>
        </div>
      </div>

      <Canvas>
        <Suspense fallback={null}>
          <Scene
            trackId={trackId}
            standings={standings}
            carPositions={carPositions}
            useRealPositions={useRealPositions}
            locationsByDriver={locationsByDriver}
            trackBounds={trackBounds}
            raceTimeRange={raceTimeRange}
            currentLap={currentLap}
            lapProgress={lapProgress}
            totalLaps={totalLaps}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
