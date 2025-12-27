"use client"

import { useEffect, useState, useMemo } from "react"
import * as THREE from "three"
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js"
import { getTrackCalibration } from "@/lib/track-calibration"

interface Track3DProps {
  trackId: string
}

/**
 * Track3D Component
 *
 * Loads circuit SVG files and renders them as 3D track meshes.
 * Uses THREE.js SVGLoader to parse SVG paths and ExtrudeGeometry
 * to create 3D track surfaces with Jarvis/HUD styling.
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

        // Collect all shapes from SVG paths
        const allShapes: THREE.Shape[] = []

        paths.forEach((path) => {
          const shapes = SVGLoader.createShapes(path)
          allShapes.push(...shapes)
        })

        if (allShapes.length === 0) {
          console.warn(`No shapes found in SVG for ${trackId}`)
          setLoadError(true)
          return
        }

        // Calculate bounds for centering
        let minX = Infinity, maxX = -Infinity
        let minY = Infinity, maxY = -Infinity

        allShapes.forEach((shape) => {
          const points = shape.getPoints()
          points.forEach((p) => {
            minX = Math.min(minX, p.x)
            maxX = Math.max(maxX, p.x)
            minY = Math.min(minY, p.y)
            maxY = Math.max(maxY, p.y)
          })
        })

        const centerX = (minX + maxX) / 2
        const centerY = (minY + maxY) / 2
        const scale = calibration.render.trackScale

        // Create track surface from shapes
        allShapes.forEach((shape) => {
          // Offset shape to center at origin
          const centeredShape = new THREE.Shape()
          const points = shape.getPoints()

          if (points.length > 0) {
            centeredShape.moveTo(
              (points[0].x - centerX) * scale,
              (points[0].y - centerY) * scale
            )

            for (let i = 1; i < points.length; i++) {
              centeredShape.lineTo(
                (points[i].x - centerX) * scale,
                (points[i].y - centerY) * scale
              )
            }

            centeredShape.closePath()
          }

          // Create extruded track surface
          const extrudeSettings = {
            depth: calibration.render.trackDepth,
            bevelEnabled: false,
          }

          const geometry = new THREE.ExtrudeGeometry(centeredShape, extrudeSettings)

          // Track surface material - dark with subtle sheen
          const surfaceMaterial = new THREE.MeshStandardMaterial({
            color: 0x0a1020,
            roughness: 0.7,
            metalness: 0.2,
            side: THREE.DoubleSide,
          })

          const surfaceMesh = new THREE.Mesh(geometry, surfaceMaterial)
          surfaceMesh.rotation.x = -Math.PI / 2 // Lay flat
          surfaceMesh.position.y = -calibration.render.trackDepth
          group.add(surfaceMesh)
        })

        // Create racing line overlay (stroke geometry)
        paths.forEach((path) => {
          const subPaths = path.subPaths

          subPaths.forEach((subPath) => {
            const points = subPath.getPoints()
            if (points.length < 2) return

            // Create centered points
            const centeredPoints = points.map(
              (p) =>
                new THREE.Vector3(
                  (p.x - centerX) * scale,
                  0.02, // Slightly above track surface
                  (p.y - centerY) * scale
                )
            )

            // Racing line geometry
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(centeredPoints)

            // Main racing line - bright cyan
            const lineMaterial = new THREE.LineBasicMaterial({
              color: 0x00d4ff,
              linewidth: 2,
            })
            const racingLine = new THREE.Line(lineGeometry, lineMaterial)
            group.add(racingLine)

            // Glow effect - wider, semi-transparent
            const glowMaterial = new THREE.LineBasicMaterial({
              color: 0x00d4ff,
              transparent: true,
              opacity: 0.3,
              linewidth: 6,
            })
            const glowLine = new THREE.Line(lineGeometry.clone(), glowMaterial)
            glowLine.position.y = 0.01
            group.add(glowLine)
          })
        })

        // Add start/finish marker at first path point
        // Most F1 track SVGs start at or near the start/finish line
        const startFinishGeometry = new THREE.BoxGeometry(0.6, 0.03, 0.12)
        const startFinishMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xffffff,
          emissiveIntensity: 0.7,
        })
        const startFinishMesh = new THREE.Mesh(startFinishGeometry, startFinishMaterial)

        // Get the first point of the first path as start/finish position
        let startX = 0
        let startZ = 0
        if (paths.length > 0 && paths[0].subPaths.length > 0) {
          const firstSubPath = paths[0].subPaths[0]
          const firstPoints = firstSubPath.getPoints()
          if (firstPoints.length > 0) {
            startX = (firstPoints[0].x - centerX) * scale
            startZ = (firstPoints[0].y - centerY) * scale
          }
        }
        startFinishMesh.position.set(startX, 0.05, startZ)

        // Calculate rotation to align with track direction at start
        if (paths.length > 0 && paths[0].subPaths.length > 0) {
          const firstSubPath = paths[0].subPaths[0]
          const firstPoints = firstSubPath.getPoints()
          if (firstPoints.length > 1) {
            const dx = firstPoints[1].x - firstPoints[0].x
            const dy = firstPoints[1].y - firstPoints[0].y
            const angle = Math.atan2(dy, dx)
            startFinishMesh.rotation.y = -angle
          }
        }

        group.add(startFinishMesh)

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
 * Fallback track component using simple line geometry
 * Used when SVG loading fails
 */
function FallbackTrack({ trackId }: { trackId: string }) {
  const calibration = useMemo(() => getTrackCalibration(trackId), [trackId])
  const scale = calibration.render.trackScale

  // Create a simple oval track as fallback
  const points = useMemo(() => {
    const trackPoints: THREE.Vector3[] = []
    const segments = 64
    const radiusX = 80 * scale
    const radiusZ = 40 * scale

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      trackPoints.push(
        new THREE.Vector3(
          Math.cos(angle) * radiusX,
          0,
          Math.sin(angle) * radiusZ
        )
      )
    }

    return trackPoints
  }, [scale])

  // Create line objects for the fallback track
  const { mainLine, glowLine } = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points)

    const mainMaterial = new THREE.LineBasicMaterial({ color: 0x00d4ff })
    const glowMaterial = new THREE.LineBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.3
    })

    return {
      mainLine: new THREE.Line(geometry, mainMaterial),
      glowLine: new THREE.Line(geometry.clone(), glowMaterial),
    }
  }, [points])

  return (
    <group>
      {/* Track surface plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[30, 20]} />
        <meshStandardMaterial color="#0a1020" transparent opacity={0.9} />
      </mesh>

      {/* Track lines */}
      <primitive object={mainLine} />
      <primitive object={glowLine} />

      {/* Start/Finish marker */}
      <mesh position={[0, 0.05, 4]}>
        <boxGeometry args={[0.3, 0.02, 0.05]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}
