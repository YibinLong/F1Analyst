"use client"

import { useRef, useMemo, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface F1CarProps {
  position: [number, number, number]
  teamColor: string
  driverNumber: number
  isSelected?: boolean
  showTrail?: boolean
}

/**
 * F1Car Component
 *
 * A stylized low-poly F1 car model created with Three.js primitives.
 * Features:
 * - Team color applied to body
 * - Emissive glow effect
 * - Motion trail effect
 * - Smooth position/rotation interpolation
 */
export function F1Car({
  position,
  teamColor,
  driverNumber,
  isSelected = false,
  showTrail = true,
}: F1CarProps) {
  const groupRef = useRef<THREE.Group>(null)

  // Create materials with team color
  const materials = useMemo(() => {
    const bodyColor = new THREE.Color(teamColor)

    return {
      body: new THREE.MeshStandardMaterial({
        color: bodyColor,
        emissive: bodyColor,
        emissiveIntensity: 0.3,
        metalness: 0.6,
        roughness: 0.3,
      }),
      cockpit: new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.8,
        roughness: 0.2,
      }),
      wheels: new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        metalness: 0.4,
        roughness: 0.8,
      }),
      accent: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.3,
      }),
    }
  }, [teamColor])

  // Cleanup materials on unmount
  useEffect(() => {
    return () => {
      Object.values(materials).forEach((mat) => mat.dispose())
    }
  }, [materials])

  return (
    <group ref={groupRef} position={position}>
      {/* Main body - elongated box */}
      <mesh material={materials.body} position={[0, 0.03, 0]}>
        <boxGeometry args={[0.35, 0.06, 0.14]} />
      </mesh>

      {/* Nose cone - tapered front */}
      <mesh material={materials.body} position={[0.22, 0.03, 0]}>
        <boxGeometry args={[0.1, 0.04, 0.08]} />
      </mesh>

      {/* Cockpit area - dark canopy */}
      <mesh material={materials.cockpit} position={[0.02, 0.07, 0]}>
        <boxGeometry args={[0.12, 0.04, 0.08]} />
      </mesh>

      {/* Rear wing - horizontal plane */}
      <mesh material={materials.body} position={[-0.2, 0.08, 0]}>
        <boxGeometry args={[0.03, 0.01, 0.18]} />
      </mesh>

      {/* Rear wing end plates */}
      <mesh material={materials.body} position={[-0.2, 0.07, 0.085]}>
        <boxGeometry args={[0.04, 0.04, 0.01]} />
      </mesh>
      <mesh material={materials.body} position={[-0.2, 0.07, -0.085]}>
        <boxGeometry args={[0.04, 0.04, 0.01]} />
      </mesh>

      {/* Front wing */}
      <mesh material={materials.body} position={[0.28, 0.015, 0]}>
        <boxGeometry args={[0.02, 0.01, 0.2]} />
      </mesh>

      {/* Wheels - 4 cylinders */}
      {/* Front left */}
      <mesh material={materials.wheels} position={[0.12, 0.02, 0.09]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.02, 8]} />
      </mesh>
      {/* Front right */}
      <mesh material={materials.wheels} position={[0.12, 0.02, -0.09]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.02, 8]} />
      </mesh>
      {/* Rear left */}
      <mesh material={materials.wheels} position={[-0.12, 0.025, 0.085]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.025, 8]} />
      </mesh>
      {/* Rear right */}
      <mesh material={materials.wheels} position={[-0.12, 0.025, -0.085]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.025, 8]} />
      </mesh>

      {/* Halo - safety device */}
      <mesh material={materials.cockpit} position={[0.05, 0.09, 0]}>
        <torusGeometry args={[0.04, 0.008, 4, 16, Math.PI]} />
      </mesh>

      {/* Motion trail effect */}
      {showTrail && (
        <MotionTrail teamColor={teamColor} />
      )}

      {/* Selection highlight */}
      {isSelected && (
        <pointLight color={teamColor} intensity={3} distance={1} />
      )}
    </group>
  )
}

/**
 * Motion Trail Component
 *
 * Creates an Akira-style motion trail effect behind the car
 */
function MotionTrail({ teamColor }: { teamColor: string }) {
  const trailColor = new THREE.Color(teamColor)

  return (
    <group>
      {/* Trail segment 1 - closest */}
      <mesh position={[-0.35, 0.02, 0]}>
        <boxGeometry args={[0.15, 0.02, 0.1]} />
        <meshBasicMaterial
          color={trailColor}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Trail segment 2 */}
      <mesh position={[-0.5, 0.02, 0]}>
        <boxGeometry args={[0.12, 0.015, 0.08]} />
        <meshBasicMaterial
          color={trailColor}
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Trail segment 3 - furthest */}
      <mesh position={[-0.62, 0.02, 0]}>
        <boxGeometry args={[0.08, 0.01, 0.05]} />
        <meshBasicMaterial
          color={trailColor}
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

/**
 * AnimatedF1Car Component
 *
 * Wraps F1Car with smooth position and rotation interpolation.
 * Uses useFrame for 60fps updates.
 */
interface AnimatedF1CarProps {
  targetPosition: { x: number; y: number; z: number }
  teamColor: string
  driverNumber: number
  isSelected?: boolean
}

// Reusable vectors to avoid garbage collection
const tempVec = new THREE.Vector3()
const prevPosVec = new THREE.Vector3()

export function AnimatedF1Car({
  targetPosition,
  teamColor,
  driverNumber,
  isSelected = false,
}: AnimatedF1CarProps) {
  const groupRef = useRef<THREE.Group>(null)
  const previousPosition = useRef({ x: targetPosition.x, y: targetPosition.y, z: targetPosition.z })
  const currentRotation = useRef(0)

  // Update target when it changes
  useEffect(() => {
    previousPosition.current = { ...targetPosition }
  }, []) // Only on mount

  useFrame(() => {
    if (!groupRef.current) return

    // Smooth position interpolation
    const lerpFactor = 0.12
    groupRef.current.position.lerp(
      tempVec.set(targetPosition.x, targetPosition.y, targetPosition.z),
      lerpFactor
    )

    // Calculate rotation based on movement direction
    const pos = groupRef.current.position
    const dx = pos.x - previousPosition.current.x
    const dz = pos.z - previousPosition.current.z
    const distance = Math.sqrt(dx * dx + dz * dz)

    if (distance > 0.001) {
      // Calculate target rotation (atan2 gives angle from movement direction)
      const targetRotation = Math.atan2(dx, dz)

      // Smooth rotation interpolation with wrap-around handling
      let rotationDiff = targetRotation - currentRotation.current

      // Handle rotation wrap-around (-PI to PI)
      if (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2
      if (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2

      currentRotation.current += rotationDiff * 0.1
      groupRef.current.rotation.y = currentRotation.current
    }

    // Update previous position
    previousPosition.current = { x: pos.x, y: pos.y, z: pos.z }
  })

  return (
    <group ref={groupRef} position={[targetPosition.x, targetPosition.y, targetPosition.z]}>
      <F1Car
        position={[0, 0, 0]}
        teamColor={teamColor}
        driverNumber={driverNumber}
        isSelected={isSelected}
        showTrail={true}
      />
    </group>
  )
}
