"use client"

import { useEffect, useState, useMemo } from "react"
import * as THREE from "three"
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js"
import { getTrackCalibration } from "@/lib/track-calibration"

interface Track3DProps {
  trackId: string
}

// Track width in 3D units (this makes the road wide enough for cars)
const TRACK_WIDTH = 0.8
const TRACK_EDGE_WIDTH = 0.04

/**
 * Calculate offset points to create track edges
 * Creates parallel lines at specified distance from centerline
 */
function offsetPath(
  points: THREE.Vector3[],
  offset: number,
  side: "left" | "right"
): THREE.Vector3[] {
  if (points.length < 2) return points

  const offsetPoints: THREE.Vector3[] = []
  const sign = side === "left" ? -1 : 1

  for (let i = 0; i < points.length; i++) {
    // Calculate direction at this point
    let dx = 0
    let dz = 0

    if (i === 0) {
      // First point: use direction to next point
      dx = points[1].x - points[0].x
      dz = points[1].z - points[0].z
    } else if (i === points.length - 1) {
      // Last point: use direction from previous point
      dx = points[i].x - points[i - 1].x
      dz = points[i].z - points[i - 1].z
    } else {
      // Middle points: average of incoming and outgoing directions
      const dx1 = points[i].x - points[i - 1].x
      const dz1 = points[i].z - points[i - 1].z
      const dx2 = points[i + 1].x - points[i].x
      const dz2 = points[i + 1].z - points[i].z
      dx = (dx1 + dx2) / 2
      dz = (dz1 + dz2) / 2
    }

    // Normalize and compute perpendicular
    const len = Math.sqrt(dx * dx + dz * dz)
    if (len > 0) {
      const nx = -dz / len // Perpendicular normal
      const nz = dx / len

      offsetPoints.push(
        new THREE.Vector3(
          points[i].x + nx * offset * sign,
          points[i].y,
          points[i].z + nz * offset * sign
        )
      )
    } else {
      offsetPoints.push(points[i].clone())
    }
  }

  return offsetPoints
}

/**
 * Create a road surface mesh from centerline points
 */
function createRoadSurface(
  centerPoints: THREE.Vector3[],
  width: number
): THREE.BufferGeometry {
  const leftEdge = offsetPath(centerPoints, width / 2, "left")
  const rightEdge = offsetPath(centerPoints, width / 2, "right")

  const vertices: number[] = []
  const indices: number[] = []

  // Create vertices from both edges
  for (let i = 0; i < centerPoints.length; i++) {
    // Left vertex
    vertices.push(leftEdge[i].x, leftEdge[i].y, leftEdge[i].z)
    // Right vertex
    vertices.push(rightEdge[i].x, rightEdge[i].y, rightEdge[i].z)
  }

  // Create triangle indices
  for (let i = 0; i < centerPoints.length - 1; i++) {
    const bl = i * 2 // Bottom left
    const br = i * 2 + 1 // Bottom right
    const tl = (i + 1) * 2 // Top left
    const tr = (i + 1) * 2 + 1 // Top right

    // Two triangles per quad
    indices.push(bl, br, tl)
    indices.push(br, tr, tl)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  )
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  return geometry
}

/**
 * Track3D Component
 *
 * Loads circuit SVG files and renders them as 3D track meshes.
 * Creates a proper road surface with left/right edges and asphalt.
 */
export function Track3D({ trackId }: Track3DProps) {
  const [trackGroup, setTrackGroup] = useState<THREE.Group | null>(null)
  const [loadError, setLoadError] = useState(false)

  const calibration = useMemo(() => getTrackCalibration(trackId), [trackId])

  useEffect(() => {
    const loader = new SVGLoader()
    const svgUrl = `/tracks/${trackId}.svg`

    loader.load(
      svgUrl,
      (data) => {
        const group = new THREE.Group()
        const paths = data.paths

        // Get all points from the track path
        let allPoints: THREE.Vector2[] = []

        paths.forEach((path) => {
          path.subPaths.forEach((subPath) => {
            const points = subPath.getPoints()
            allPoints = allPoints.concat(points)
          })
        })

        if (allPoints.length < 2) {
          console.warn(`Not enough points found in SVG for ${trackId}`)
          setLoadError(true)
          return
        }

        // Calculate bounds for centering
        let minX = Infinity,
          maxX = -Infinity
        let minY = Infinity,
          maxY = -Infinity

        allPoints.forEach((p) => {
          minX = Math.min(minX, p.x)
          maxX = Math.max(maxX, p.x)
          minY = Math.min(minY, p.y)
          maxY = Math.max(maxY, p.y)
        })

        const centerX = (minX + maxX) / 2
        const centerY = (minY + maxY) / 2
        const scale = calibration.render.trackScale

        // Convert to centered 3D points
        const centerPoints: THREE.Vector3[] = allPoints.map(
          (p) =>
            new THREE.Vector3(
              (p.x - centerX) * scale,
              0.01, // Slightly above ground
              (p.y - centerY) * scale
            )
        )

        // Create road surface (dark asphalt)
        const roadGeometry = createRoadSurface(centerPoints, TRACK_WIDTH)
        const roadMaterial = new THREE.MeshStandardMaterial({
          color: 0x1a1a1a, // Dark asphalt
          roughness: 0.9,
          metalness: 0.1,
          side: THREE.DoubleSide,
        })
        const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial)
        roadMesh.position.y = 0
        group.add(roadMesh)

        // Create left edge (white line)
        const leftEdgePoints = offsetPath(centerPoints, TRACK_WIDTH / 2, "left")
        const leftLineGeometry =
          new THREE.BufferGeometry().setFromPoints(leftEdgePoints)
        const edgeMaterial = new THREE.LineBasicMaterial({
          color: 0xffffff,
          linewidth: 2,
        })
        const leftLine = new THREE.Line(leftLineGeometry, edgeMaterial)
        leftLine.position.y = 0.02
        group.add(leftLine)

        // Create right edge (white line)
        const rightEdgePoints = offsetPath(
          centerPoints,
          TRACK_WIDTH / 2,
          "right"
        )
        const rightLineGeometry =
          new THREE.BufferGeometry().setFromPoints(rightEdgePoints)
        const rightLine = new THREE.Line(rightLineGeometry, edgeMaterial.clone())
        rightLine.position.y = 0.02
        group.add(rightLine)

        // Add edge glow effects
        const glowMaterial = new THREE.LineBasicMaterial({
          color: 0x00d4ff,
          transparent: true,
          opacity: 0.3,
          linewidth: 4,
        })
        const leftGlow = new THREE.Line(leftLineGeometry.clone(), glowMaterial)
        leftGlow.position.y = 0.015
        group.add(leftGlow)

        const rightGlow = new THREE.Line(
          rightLineGeometry.clone(),
          glowMaterial.clone()
        )
        rightGlow.position.y = 0.015
        group.add(rightGlow)

        // Add subtle center racing line
        const centerLineGeometry =
          new THREE.BufferGeometry().setFromPoints(centerPoints)
        const centerLineMaterial = new THREE.LineBasicMaterial({
          color: 0x00d4ff,
          transparent: true,
          opacity: 0.15,
          linewidth: 1,
        })
        const centerLine = new THREE.Line(centerLineGeometry, centerLineMaterial)
        centerLine.position.y = 0.02
        group.add(centerLine)

        // Add start/finish marker
        const startFinishGeometry = new THREE.BoxGeometry(
          TRACK_WIDTH * 1.2,
          0.03,
          0.15
        )
        const startFinishMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xffffff,
          emissiveIntensity: 0.7,
        })
        const startFinishMesh = new THREE.Mesh(
          startFinishGeometry,
          startFinishMaterial
        )

        // Position at first point
        if (centerPoints.length > 0) {
          startFinishMesh.position.set(
            centerPoints[0].x,
            0.05,
            centerPoints[0].z
          )

          // Calculate rotation to align with track direction at start
          if (centerPoints.length > 1) {
            const dx = centerPoints[1].x - centerPoints[0].x
            const dz = centerPoints[1].z - centerPoints[0].z
            const angle = Math.atan2(dx, dz)
            startFinishMesh.rotation.y = angle
          }
        }

        group.add(startFinishMesh)

        // Add checkered pattern to start/finish area
        const checkerSize = 0.08
        const checkerRows = 2
        const checkerCols = Math.floor((TRACK_WIDTH * 1.2) / checkerSize)
        for (let row = 0; row < checkerRows; row++) {
          for (let col = 0; col < checkerCols; col++) {
            if ((row + col) % 2 === 0) continue // Skip for checkered pattern

            const checkerGeom = new THREE.BoxGeometry(
              checkerSize * 0.9,
              0.01,
              checkerSize * 0.9
            )
            const checkerMat = new THREE.MeshStandardMaterial({
              color: 0x000000,
            })
            const checker = new THREE.Mesh(checkerGeom, checkerMat)

            // Position relative to start/finish
            const localX =
              (col - checkerCols / 2) * checkerSize + checkerSize / 2
            const localZ = (row - checkerRows / 2) * checkerSize + checkerSize / 2

            // Apply rotation to position
            if (centerPoints.length > 1) {
              const dx = centerPoints[1].x - centerPoints[0].x
              const dz = centerPoints[1].z - centerPoints[0].z
              const angle = Math.atan2(dx, dz)
              const cos = Math.cos(angle)
              const sin = Math.sin(angle)
              const rotX = localX * cos - localZ * sin
              const rotZ = localX * sin + localZ * cos
              checker.position.set(
                centerPoints[0].x + rotX,
                0.06,
                centerPoints[0].z + rotZ
              )
              checker.rotation.y = angle
            }

            group.add(checker)
          }
        }

        setTrackGroup(group)
        setLoadError(false)
      },
      undefined,
      (error) => {
        console.error(`Failed to load track SVG for ${trackId}:`, error)
        setLoadError(true)
      }
    )

    return () => {
      // Cleanup geometries and materials
      if (trackGroup) {
        trackGroup.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose()
            if (child.material instanceof THREE.Material) {
              child.material.dispose()
            }
          }
          if (child instanceof THREE.Line) {
            child.geometry?.dispose()
            if (child.material instanceof THREE.Material) {
              child.material.dispose()
            }
          }
        })
      }
    }
  }, [trackId, calibration])

  // Render fallback if SVG loading failed
  if (loadError) {
    return <FallbackTrack trackId={trackId} />
  }

  // Render loading state or the loaded track
  if (!trackGroup) {
    return null // Will show loading skeleton from parent
  }

  return <primitive object={trackGroup} />
}

/**
 * Fallback track component using simple oval geometry
 * Used when SVG loading fails - creates a proper road with edges
 */
function FallbackTrack({ trackId }: { trackId: string }) {
  const calibration = useMemo(() => getTrackCalibration(trackId), [trackId])
  const scale = calibration.render.trackScale

  // Create center points for an oval track
  const centerPoints = useMemo(() => {
    const trackPoints: THREE.Vector3[] = []
    const segments = 64
    const radiusX = 80 * scale
    const radiusZ = 40 * scale

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      trackPoints.push(
        new THREE.Vector3(
          Math.cos(angle) * radiusX,
          0.01,
          Math.sin(angle) * radiusZ
        )
      )
    }

    return trackPoints
  }, [scale])

  // Create road surface and edge geometries
  const { roadGeometry, leftEdge, rightEdge } = useMemo(() => {
    const road = createRoadSurface(centerPoints, TRACK_WIDTH)
    const left = offsetPath(centerPoints, TRACK_WIDTH / 2, "left")
    const right = offsetPath(centerPoints, TRACK_WIDTH / 2, "right")

    return {
      roadGeometry: road,
      leftEdge: new THREE.BufferGeometry().setFromPoints(left),
      rightEdge: new THREE.BufferGeometry().setFromPoints(right),
    }
  }, [centerPoints])

  return (
    <group>
      {/* Road surface */}
      <mesh geometry={roadGeometry}>
        <meshStandardMaterial
          color={0x1a1a1a}
          roughness={0.9}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Left edge line */}
      <line geometry={leftEdge}>
        <lineBasicMaterial color={0xffffff} />
      </line>

      {/* Right edge line */}
      <line geometry={rightEdge}>
        <lineBasicMaterial color={0xffffff} />
      </line>

      {/* Left edge glow */}
      <line geometry={leftEdge.clone()} position={[0, -0.005, 0]}>
        <lineBasicMaterial color={0x00d4ff} transparent opacity={0.3} />
      </line>

      {/* Right edge glow */}
      <line geometry={rightEdge.clone()} position={[0, -0.005, 0]}>
        <lineBasicMaterial color={0x00d4ff} transparent opacity={0.3} />
      </line>

      {/* Start/Finish marker */}
      <mesh position={[centerPoints[0]?.x || 0, 0.05, centerPoints[0]?.z || 4]}>
        <boxGeometry args={[TRACK_WIDTH * 1.2, 0.03, 0.15]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  )
}
