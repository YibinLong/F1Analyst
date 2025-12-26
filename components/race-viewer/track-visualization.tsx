"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera, Environment } from "@react-three/drei"
import { Suspense, useMemo } from "react"
import type { Driver } from "@/lib/f1-teams"
import { trackPaths } from "@/lib/track-paths"

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
            count={points.length}
            array={new Float32Array(points.flat())}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#00d4ff" linewidth={2} />
      </line>

      {/* Track glow effect */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={points.length}
            array={new Float32Array(points.flat())}
            itemSize={3}
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

function Car({
  position,
  color,
  index,
  trackId,
}: {
  position: number
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
    <group position={[carPosition[0], 0.15, carPosition[2]]}>
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

function Scene({ trackId, standings }: { trackId: string; standings: Standing[] }) {
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

      {standings.slice(0, 20).map((standing, index) => (
        <Car
          key={standing.driver.number}
          position={standing.position}
          color={standing.driver.teamColor}
          index={index}
          trackId={trackId}
        />
      ))}

      <Environment preset="night" />
    </>
  )
}

export function TrackVisualization({ trackId, standings, currentLap }: TrackVisualizationProps) {
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
          <span className="text-xs text-muted-foreground">SIMULATION</span>
          <p className="font-mono text-sm text-accent">60 FPS</p>
        </div>
      </div>

      <Canvas>
        <Suspense fallback={null}>
          <Scene trackId={trackId} standings={standings} />
        </Suspense>
      </Canvas>
    </div>
  )
}
