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
import { TrackVisualizationErrorBoundary } from "@/components/error-boundary"
import { LocationDataUnavailable } from "./data-unavailable"
import { Track3D } from "./Track3D"
import { F1Car } from "./F1Car"

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
  const points = useMemo(() => pathToPoints(path, 0.1), [path])

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
 * Now uses the new F1Car component with rotation tracking
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
  const previousPosition = useRef({ x: 0, y: 0.15, z: 0 })
  const currentRotation = useRef(0)

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

    // Store previous position for rotation calculation
    const prevX = groupRef.current.position.x
    const prevZ = groupRef.current.position.z

    // Smoothly lerp to target position (higher factor = faster response)
    const lerpFactor = 0.12

    groupRef.current.position.lerp(
      tempVec.set(
        targetPosition.current.x,
        targetPosition.current.y,
        targetPosition.current.z
      ),
      lerpFactor
    )

    // Calculate rotation based on movement direction
    const dx = groupRef.current.position.x - prevX
    const dz = groupRef.current.position.z - prevZ
    const distance = Math.sqrt(dx * dx + dz * dz)

    if (distance > 0.0005) {
      // Calculate target rotation from movement direction
      const targetRotation = Math.atan2(dx, dz)

      // Smooth rotation with wrap-around handling
      let rotationDiff = targetRotation - currentRotation.current
      if (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2
      if (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2

      currentRotation.current += rotationDiff * 0.08
      groupRef.current.rotation.y = currentRotation.current
    }
  })

  return (
    <group ref={groupRef} position={[targetPosition.current.x, targetPosition.current.y, targetPosition.current.z]}>
      <F1Car
        position={[0, 0, 0]}
        teamColor={color}
        driverNumber={driverNumber}
        showTrail={true}
      />
    </group>
  )
}

function CarFallback({
  color,
  index,
  trackId,
  driverNumber,
}: {
  color: string
  index: number
  trackId: string
  driverNumber: number
}) {
  // Distribute cars around an ellipse that matches Track3D's rendered extent
  // Track3D renders SVGs centered at origin, scaled by 0.1, resulting in ~±4 x ±5 extent
  const { position, rotation } = useMemo(() => {
    // Distribute cars evenly around an ellipse
    const numCars = 20
    const angle = ((index / numCars) * Math.PI * 2) + (Math.PI / 4) // Start at 45 degrees

    // Ellipse matching typical track extent
    const radiusX = 3.5  // Matches ~±4 track extent
    const radiusZ = 4    // Matches ~±5 track extent

    const x = Math.cos(angle) * radiusX
    const z = Math.sin(angle) * radiusZ

    // Rotation to face direction of travel (tangent to ellipse)
    const nextAngle = angle + 0.1
    const nextX = Math.cos(nextAngle) * radiusX
    const nextZ = Math.sin(nextAngle) * radiusZ
    const carRotation = Math.atan2(nextX - x, nextZ - z)

    return {
      position: [x, 0.15, z] as [number, number, number],
      rotation: carRotation
    }
  }, [index])

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <F1Car
        position={[0, 0, 0]}
        teamColor={color}
        driverNumber={driverNumber}
        showTrail={false}
      />
    </group>
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

      <Track3D trackId={trackId} />

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
            <group key={standing.driver.number} position={[realPos.x, realPos.y, realPos.z]}>
              <F1Car
                position={[0, 0, 0]}
                teamColor={standing.driver.teamColor}
                driverNumber={standing.driver.number}
                showTrail={true}
              />
            </group>
          )
        }

        // Fallback to distribution along track
        return (
          <CarFallback
            key={standing.driver.number}
            color={standing.driver.teamColor}
            index={index}
            trackId={trackId}
            driverNumber={standing.driver.number}
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

      {/* Location data unavailable overlay */}
      {!useRealPositions && locations.length === 0 && (
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <LocationDataUnavailable />
        </div>
      )}

      <TrackVisualizationErrorBoundary>
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
      </TrackVisualizationErrorBoundary>
    </div>
  )
}
