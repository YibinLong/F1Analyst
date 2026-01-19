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
  onClick?: () => void
  scale?: number  // Car scale multiplier (default: 1.0, applied on top of base 3x scale)
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
  onClick,
  scale = 1.0,
}: F1CarProps) {
  const groupRef = useRef<THREE.Group>(null)
  const pulseRef = useRef<THREE.Mesh>(null)

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

  // Animate selection pulse effect
  useFrame((state) => {
    if (isSelected && pulseRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 4) * 0.5 + 0.5
      pulseRef.current.scale.setScalar(1 + pulse * 0.3)
      if (pulseRef.current.material instanceof THREE.MeshBasicMaterial) {
        pulseRef.current.material.opacity = 0.3 + pulse * 0.3
      }
    }
  })

  // Scale factor: base 3x for track size, multiplied by optional scale prop
  // This allows per-track car sizing to ensure cars fit within track bounds
  const s = 3 * scale

  return (
    <group ref={groupRef} position={position} onClick={onClick}>
      {/* Invisible click target - larger hitbox for easier clicking */}
      <mesh visible={false}>
        <boxGeometry args={[0.6 * s, 0.3 * s, 0.3 * s]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Selection ring effect */}
      {isSelected && (
        <mesh ref={pulseRef} position={[0, 0.01 * s, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.25 * s, 0.35 * s, 32]} />
          <meshBasicMaterial
            color={teamColor}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Main body - elongated box */}
      <mesh material={materials.body} position={[0, 0.03 * s, 0]}>
        <boxGeometry args={[0.35 * s, 0.06 * s, 0.14 * s]} />
      </mesh>

      {/* Nose cone - tapered front */}
      <mesh material={materials.body} position={[0.22 * s, 0.03 * s, 0]}>
        <boxGeometry args={[0.1 * s, 0.04 * s, 0.08 * s]} />
      </mesh>

      {/* Cockpit area - dark canopy */}
      <mesh material={materials.cockpit} position={[0.02 * s, 0.07 * s, 0]}>
        <boxGeometry args={[0.12 * s, 0.04 * s, 0.08 * s]} />
      </mesh>

      {/* Rear wing - horizontal plane */}
      <mesh material={materials.body} position={[-0.2 * s, 0.08 * s, 0]}>
        <boxGeometry args={[0.03 * s, 0.01 * s, 0.18 * s]} />
      </mesh>

      {/* Rear wing end plates */}
      <mesh material={materials.body} position={[-0.2 * s, 0.07 * s, 0.085 * s]}>
        <boxGeometry args={[0.04 * s, 0.04 * s, 0.01 * s]} />
      </mesh>
      <mesh material={materials.body} position={[-0.2 * s, 0.07 * s, -0.085 * s]}>
        <boxGeometry args={[0.04 * s, 0.04 * s, 0.01 * s]} />
      </mesh>

      {/* Front wing */}
      <mesh material={materials.body} position={[0.28 * s, 0.015 * s, 0]}>
        <boxGeometry args={[0.02 * s, 0.01 * s, 0.2 * s]} />
      </mesh>

      {/* Wheels - 4 cylinders */}
      {/* Front left */}
      <mesh material={materials.wheels} position={[0.12 * s, 0.02 * s, 0.09 * s]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025 * s, 0.025 * s, 0.02 * s, 8]} />
      </mesh>
      {/* Front right */}
      <mesh material={materials.wheels} position={[0.12 * s, 0.02 * s, -0.09 * s]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025 * s, 0.025 * s, 0.02 * s, 8]} />
      </mesh>
      {/* Rear left */}
      <mesh material={materials.wheels} position={[-0.12 * s, 0.025 * s, 0.085 * s]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03 * s, 0.03 * s, 0.025 * s, 8]} />
      </mesh>
      {/* Rear right */}
      <mesh material={materials.wheels} position={[-0.12 * s, 0.025 * s, -0.085 * s]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03 * s, 0.03 * s, 0.025 * s, 8]} />
      </mesh>

      {/* Halo - safety device */}
      <mesh material={materials.cockpit} position={[0.05 * s, 0.09 * s, 0]}>
        <torusGeometry args={[0.04 * s, 0.008 * s, 4, 16, Math.PI]} />
      </mesh>

      {/* Motion trail effect */}
      {showTrail && (
        <MotionTrail teamColor={teamColor} scale={scale} />
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
 * Multiple colored streaks that extend behind for speed effect
 */
function MotionTrail({ teamColor, scale = 1.0 }: { teamColor: string; scale?: number }) {
  const trailColor = new THREE.Color(teamColor)
  // Scale factor: base 3x for track size, multiplied by optional scale prop
  const s = 3 * scale

  // Create Akira-style speed lines using thin elongated shapes
  return (
    <group>
      {/* Main team color trail - center */}
      <mesh position={[-0.5 * s, 0.025 * s, 0]}>
        <boxGeometry args={[0.6 * s, 0.012 * s, 0.02 * s]} />
        <meshBasicMaterial
          color={trailColor}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Extended trail - fading */}
      <mesh position={[-0.9 * s, 0.025 * s, 0]}>
        <boxGeometry args={[0.5 * s, 0.008 * s, 0.015 * s]} />
        <meshBasicMaterial
          color={trailColor}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Far trail */}
      <mesh position={[-1.2 * s, 0.025 * s, 0]}>
        <boxGeometry args={[0.3 * s, 0.005 * s, 0.01 * s]} />
        <meshBasicMaterial
          color={trailColor}
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Upper accent line (slightly offset) */}
      <mesh position={[-0.45 * s, 0.035 * s, 0.03 * s]}>
        <boxGeometry args={[0.5 * s, 0.008 * s, 0.012 * s]} />
        <meshBasicMaterial
          color={0xffffff}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Lower accent line */}
      <mesh position={[-0.45 * s, 0.035 * s, -0.03 * s]}>
        <boxGeometry args={[0.5 * s, 0.008 * s, 0.012 * s]} />
        <meshBasicMaterial
          color={0xffffff}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Glow effect behind car */}
      <mesh position={[-0.35 * s, 0.02 * s, 0]}>
        <boxGeometry args={[0.2 * s, 0.04 * s, 0.12 * s]} />
        <meshBasicMaterial
          color={trailColor}
          transparent
          opacity={0.2}
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
 *
 * Rotation can be provided via targetRotation prop (calculated from track trajectory)
 * which provides stable orientation during animation.
 */
interface AnimatedF1CarProps {
  targetPosition: { x: number; y: number; z: number }
  targetRotation?: number // Pre-calculated rotation from track trajectory (optional)
  teamColor: string
  driverNumber: number
  isSelected?: boolean
  onClick?: () => void
  scale?: number  // Car scale multiplier (default: 1.0)
}

// Reusable vectors to avoid garbage collection
const tempVec = new THREE.Vector3()

export function AnimatedF1Car({
  targetPosition,
  targetRotation: targetRotationProp,
  teamColor,
  driverNumber,
  isSelected = false,
  onClick,
  scale = 1.0,
}: AnimatedF1CarProps) {
  const groupRef = useRef<THREE.Group>(null)
  const currentRotation = useRef(0)
  const lastTargetRotation = useRef(targetRotationProp ?? 0)

  // Update last target rotation when prop changes
  useEffect(() => {
    if (targetRotationProp !== undefined) {
      lastTargetRotation.current = targetRotationProp
    }
  }, [targetRotationProp])

  useFrame(() => {
    if (!groupRef.current) return

    // Smooth position interpolation
    const lerpFactor = 0.12
    groupRef.current.position.lerp(
      tempVec.set(targetPosition.x, targetPosition.y, targetPosition.z),
      lerpFactor
    )

    // Use pre-calculated target rotation if available
    const targetRot = lastTargetRotation.current

    // Smooth rotation interpolation with wrap-around handling
    let rotationDiff = targetRot - currentRotation.current

    // Handle rotation wrap-around (-PI to PI)
    if (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2
    if (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2

    // Smooth rotation interpolation
    currentRotation.current += rotationDiff * 0.1
    groupRef.current.rotation.y = currentRotation.current
  })

  return (
    <group ref={groupRef} position={[targetPosition.x, targetPosition.y, targetPosition.z]}>
      <F1Car
        position={[0, 0, 0]}
        teamColor={teamColor}
        driverNumber={driverNumber}
        isSelected={isSelected}
        showTrail={true}
        onClick={onClick}
        scale={scale}
      />
    </group>
  )
}
