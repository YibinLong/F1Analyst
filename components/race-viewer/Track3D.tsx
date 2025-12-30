"use client"

import { useEffect, useState, useMemo } from "react"
import * as THREE from "three"
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js"
import { getTrackCalibration } from "@/lib/track-calibration"
import { getStartLineMeta, TRACK_WIDTH, type StartLineMeta } from "@/lib/track-svg-utils"

interface Track3DProps {
  trackId: string
  startMeta?: StartLineMeta
}

// Track width in 3D units (this makes the road wide enough for cars)
// Width allows approximately 3 cars abreast at any point
function dedupePoints(points: THREE.Vector3[]): THREE.Vector3[] {
  const result: THREE.Vector3[] = []

  for (const p of points) {
    const last = result[result.length - 1]
    if (!last || last.distanceToSquared(p) > 1e-6) {
      result.push(p.clone())
    }
  }

  return result
}

/**
 * Calculate offset points to create track edges
 * Creates parallel lines at specified distance from centerline
 * Uses miter limiting to prevent artifacts at sharp corners
 */
function offsetPath(
  points: THREE.Vector3[],
  offset: number,
  side: "left" | "right"
): THREE.Vector3[] {
  if (points.length < 2) return points

  const offsetPoints: THREE.Vector3[] = []
  const sign = side === "left" ? -1 : 1
  const maxMiterLength = offset * 2 // Limit miter to prevent spikes at sharp corners
  const len = points.length

  for (let i = 0; i < len; i++) {
    const prev = points[(i - 1 + len) % len]
    const curr = points[i]
    const next = points[(i + 1) % len]

    let dx1 = curr.x - prev.x
    let dz1 = curr.z - prev.z
    let dx2 = next.x - curr.x
    let dz2 = next.z - curr.z

    const len1 = Math.sqrt(dx1 * dx1 + dz1 * dz1)
    const len2 = Math.sqrt(dx2 * dx2 + dz2 * dz2)

    if (len1 > 0 && len2 > 0) {
      dx1 /= len1; dz1 /= len1
      dx2 /= len2; dz2 /= len2

      // Calculate perpendicular normals
      const nx1 = -dz1 * sign
      const nz1 = dx1 * sign
      const nx2 = -dz2 * sign
      const nz2 = dx2 * sign

      // Average the normals for smooth corners
      let nx = (nx1 + nx2) / 2
      let nz = (nz1 + nz2) / 2
      let normalLen = Math.sqrt(nx * nx + nz * nz)

      // Handle the case where normals are opposite (180 degree turn)
      if (normalLen < 0.001) {
        nx = nx1
        nz = nz1
        normalLen = 1
      }

      // Calculate miter length based on angle between segments
      const dot = dx1 * dx2 + dz1 * dz2
      const angle = Math.acos(Math.max(-1, Math.min(1, dot)))
      let miterScale = 1 / normalLen

      // Apply miter limit to prevent spikes at sharp corners
      if (angle > Math.PI * 0.75) {
        // Very sharp corner - use bevel instead of miter
        miterScale = 1
      } else if (miterScale * offset > maxMiterLength) {
        miterScale = maxMiterLength / offset
      }

      nx *= miterScale
      nz *= miterScale

      offsetPoints.push(
        new THREE.Vector3(
          curr.x + nx * offset,
          curr.y,
          curr.z + nz * offset
        )
      )
    } else {
      offsetPoints.push(curr.clone())
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
  const len = centerPoints.length

  // Create vertices from both edges
  for (let i = 0; i < len; i++) {
    // Left vertex
    vertices.push(leftEdge[i].x, leftEdge[i].y, leftEdge[i].z)
    // Right vertex
    vertices.push(rightEdge[i].x, rightEdge[i].y, rightEdge[i].z)
  }

  // Create triangle indices
  for (let i = 0; i < len; i++) {
    const next = (i + 1) % len
    const bl = i * 2 // Bottom left
    const br = i * 2 + 1 // Bottom right
    const tl = next * 2 // Top left
    const tr = next * 2 + 1 // Top right

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
export function Track3D({ trackId, startMeta }: Track3DProps) {
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
            const points = subPath.getSpacedPoints(400)
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
        const centerPoints: THREE.Vector3[] = dedupePoints(
          allPoints.map(
            (p) =>
              new THREE.Vector3(
                (p.x - centerX) * scale,
                0.01, // Slightly above ground
                (p.y - centerY) * scale
              )
          )
        )
        const centerMetaPoints = centerPoints.map((p) => ({ x: p.x, y: p.y, z: p.z }))
        const startInfo = startMeta ?? getStartLineMeta(centerMetaPoints)

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
          new THREE.BufferGeometry().setFromPoints([...leftEdgePoints, leftEdgePoints[0]])
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
          new THREE.BufferGeometry().setFromPoints([...rightEdgePoints, rightEdgePoints[0]])
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
          new THREE.BufferGeometry().setFromPoints([...centerPoints, centerPoints[0]])
        const centerLineMaterial = new THREE.LineBasicMaterial({
          color: 0x00d4ff,
          transparent: true,
          opacity: 0.15,
          linewidth: 1,
        })
        const centerLine = new THREE.Line(centerLineGeometry, centerLineMaterial)
        centerLine.position.y = 0.02
        group.add(centerLine)

        // Add start/finish marker with checkered pattern
        if (centerPoints.length > 1) {
          const angle = Math.atan2(startInfo.direction.x, startInfo.direction.z) + Math.PI / 2
          const cos = Math.cos(angle)
          const sin = Math.sin(angle)

          // Create a proper checkered start/finish line
          const checkerSize = 0.24 // Larger checkers (scaled 3x)
          const checkerRows = 3
          const checkerCols = Math.ceil(TRACK_WIDTH / checkerSize)

          for (let row = 0; row < checkerRows; row++) {
            for (let col = 0; col < checkerCols; col++) {
              const isBlack = (row + col) % 2 === 1

              const checkerGeom = new THREE.BoxGeometry(
                checkerSize * 0.98,
                0.02,
                checkerSize * 0.98
              )
              const checkerMat = new THREE.MeshStandardMaterial({
                color: isBlack ? 0x000000 : 0xffffff,
                emissive: isBlack ? 0x000000 : 0xffffff,
                emissiveIntensity: isBlack ? 0 : 0.3,
              })
              const checker = new THREE.Mesh(checkerGeom, checkerMat)

              // Position relative to start line center
              const localX = (col - (checkerCols - 1) / 2) * checkerSize
              const localZ = (row - (checkerRows - 1) / 2) * checkerSize

              // Apply rotation to position
              const rotX = localX * cos - localZ * sin
              const rotZ = localX * sin + localZ * cos

              checker.position.set(
                startInfo.startPoint.x + rotX,
                0.03 + row * 0.001, // Stagger Y slightly to avoid Z-fighting
                startInfo.startPoint.z + rotZ
              )
              checker.rotation.y = angle

              group.add(checker)
            }
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
  }, [trackId, calibration, startMeta])

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

  // Create center points for an oval track (sized to match 3x scale)
  const centerPoints = useMemo(() => {
    const trackPoints: THREE.Vector3[] = []
    const segments = 64
    const radiusX = 90 * scale
    const radiusZ = 55 * scale

    for (let i = 0; i < segments; i++) {
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
  const { roadGeometry, leftEdgeLine, rightEdgeLine, leftGlowLine, rightGlowLine } = useMemo(() => {
    const road = createRoadSurface(centerPoints, TRACK_WIDTH)
    const left = offsetPath(centerPoints, TRACK_WIDTH / 2, "left")
    const right = offsetPath(centerPoints, TRACK_WIDTH / 2, "right")

    const leftEdgeGeometry = new THREE.BufferGeometry().setFromPoints(left)
    const rightEdgeGeometry = new THREE.BufferGeometry().setFromPoints(right)

    // Create THREE.Line objects to avoid SVG line element conflict
    const leftEdge = new THREE.Line(
      leftEdgeGeometry,
      new THREE.LineBasicMaterial({ color: 0xffffff })
    )
    const rightEdge = new THREE.Line(
      rightEdgeGeometry,
      new THREE.LineBasicMaterial({ color: 0xffffff })
    )
    const leftGlow = new THREE.Line(
      leftEdgeGeometry.clone(),
      new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.3 })
    )
    leftGlow.position.y = -0.005
    const rightGlow = new THREE.Line(
      rightEdgeGeometry.clone(),
      new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.3 })
    )
    rightGlow.position.y = -0.005

    return {
      roadGeometry: road,
      leftEdgeLine: leftEdge,
      rightEdgeLine: rightEdge,
      leftGlowLine: leftGlow,
      rightGlowLine: rightGlow,
    }
  }, [centerPoints])

  const startInfo = useMemo(
    () => getStartLineMeta(centerPoints.map((p) => ({ x: p.x, y: p.y, z: p.z }))),
    [centerPoints]
  )

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
      <primitive object={leftEdgeLine} />

      {/* Right edge line */}
      <primitive object={rightEdgeLine} />

      {/* Left edge glow */}
      <primitive object={leftGlowLine} />

      {/* Right edge glow */}
      <primitive object={rightGlowLine} />

      {/* Start/Finish marker */}
      <mesh
        position={[
          startInfo.startPoint.x,
          0.05,
          startInfo.startPoint.z,
        ]}
        rotation={[0, Math.atan2(startInfo.direction.x, startInfo.direction.z) + Math.PI / 2, 0]}
      >
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
