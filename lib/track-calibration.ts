/**
 * Track Calibration System
 *
 * This file contains per-circuit transformation data to align OpenF1 GPS
 * coordinates with SVG track artwork for accurate car positioning.
 */

export interface TrackCalibration {
  // SVG viewBox dimensions (all tracks use 200x120)
  viewBox: { width: number; height: number }

  // Transformation from OpenF1 GPS coords to SVG/3D space
  transform: {
    rotation: number     // Radians - rotation to apply
    scaleX: number       // X-axis scale factor
    scaleY: number       // Y-axis scale factor
    offsetX: number      // X translation after scaling
    offsetY: number      // Y translation after scaling
    flipX: boolean       // Mirror horizontally
    flipY: boolean       // Mirror vertically
  }

  // 3D rendering settings
  render: {
    trackScale: number   // Overall scene scale multiplier
    trackDepth: number   // Extrusion depth for 3D track
    carHeight: number    // Height of cars above track surface
  }
}

// Default calibration for circuits without specific calibration
const defaultCalibration: TrackCalibration = {
  viewBox: { width: 200, height: 120 },
  transform: {
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    offsetX: 0,
    offsetY: 0,
    flipX: false,
    flipY: false,
  },
  render: {
    trackScale: 0.1,
    trackDepth: 0.3,
    carHeight: 0.15,
  },
}

/**
 * Per-circuit calibration data
 *
 * These values align OpenF1 GPS coordinates with the SVG track layouts.
 * The SVG files are generated from GeoJSON data with coordinates normalized
 * to a 200x120 viewBox with 10px padding.
 *
 * To calibrate a circuit:
 * 1. Load the race with location data
 * 2. Observe where cars are positioned vs. the track outline
 * 3. Adjust rotation, scale, and offset values
 * 4. The transform is applied in order: rotate -> scale -> flip -> offset
 */
export const trackCalibrations: Record<string, TrackCalibration> = {
  // Australia - Albert Park
  albert_park: {
    ...defaultCalibration,
    transform: {
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
      flipX: false,
      flipY: false,
    },
  },

  // Bahrain - Sakhir
  bahrain: {
    ...defaultCalibration,
    transform: {
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
      flipX: false,
      flipY: false,
    },
  },

  // China - Shanghai
  shanghai: {
    ...defaultCalibration,
    transform: {
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
      flipX: false,
      flipY: false,
    },
  },

  // Japan - Suzuka
  suzuka: {
    ...defaultCalibration,
    transform: {
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
      flipX: false,
      flipY: false,
    },
  },

  // Saudi Arabia - Jeddah
  jeddah: {
    ...defaultCalibration,
    transform: {
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
      flipX: false,
      flipY: false,
    },
  },

  // USA - Miami
  miami: {
    ...defaultCalibration,
    transform: {
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
      flipX: false,
      flipY: false,
    },
  },

  // Italy - Imola
  imola: {
    ...defaultCalibration,
    transform: {
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
      flipX: false,
      flipY: false,
    },
  },

  // Monaco
  monaco: {
    ...defaultCalibration,
    transform: {
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
      flipX: false,
      flipY: false,
    },
  },

  // Spain - Barcelona
  barcelona: {
    ...defaultCalibration,
    transform: {
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
      flipX: false,
      flipY: false,
    },
  },

  // Canada - Montreal
  montreal: {
    ...defaultCalibration,
    transform: {
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
      flipX: false,
      flipY: false,
    },
  },

  // Austria - Red Bull Ring
  red_bull_ring: {
    ...defaultCalibration,
    transform: {
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
      flipX: false,
      flipY: false,
    },
  },

  // Great Britain - Silverstone
  silverstone: {
    ...defaultCalibration,
    transform: {
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
      flipX: false,
      flipY: false,
    },
  },

  // Hungary - Hungaroring
  hungaroring: {
    ...defaultCalibration,
    transform: {
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
      flipX: false,
      flipY: false,
    },
  },

  // Belgium - Spa
  spa: {
    ...defaultCalibration,
    transform: {
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
      flipX: false,
      flipY: false,
    },
  },

  // Netherlands - Zandvoort
  zandvoort: {
    ...defaultCalibration,
    transform: {
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
      flipX: false,
      flipY: false,
    },
  },

  // Italy - Monza
  monza: {
    ...defaultCalibration,
    transform: {
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
      flipX: false,
      flipY: false,
    },
  },

  // Azerbaijan - Baku
  baku: {
    ...defaultCalibration,
    transform: {
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
      flipX: false,
      flipY: false,
    },
  },

  // Singapore
  singapore: {
    ...defaultCalibration,
    transform: {
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
      flipX: false,
      flipY: false,
    },
  },

  // USA - Austin (COTA)
  cota: {
    ...defaultCalibration,
    transform: {
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
      flipX: false,
      flipY: false,
    },
  },

  // Mexico
  mexico: {
    ...defaultCalibration,
    transform: {
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
      flipX: false,
      flipY: false,
    },
  },

  // Brazil - Interlagos
  interlagos: {
    ...defaultCalibration,
    transform: {
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
      flipX: false,
      flipY: false,
    },
  },

  // USA - Las Vegas
  las_vegas: {
    ...defaultCalibration,
    transform: {
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
      flipX: false,
      flipY: false,
    },
  },

  // Qatar - Lusail
  lusail: {
    ...defaultCalibration,
    transform: {
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
      flipX: false,
      flipY: false,
    },
  },

  // Abu Dhabi - Yas Marina
  yas_marina: {
    ...defaultCalibration,
    transform: {
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
      flipX: false,
      flipY: false,
    },
  },

  // Default fallback
  default: defaultCalibration,
}

/**
 * Get calibration for a circuit, falling back to default if not found
 */
export function getTrackCalibration(trackId: string): TrackCalibration {
  return trackCalibrations[trackId] || trackCalibrations.default
}

/**
 * Transform OpenF1 GPS coordinates to SVG/3D track space
 *
 * @param gpsX - OpenF1 x coordinate
 * @param gpsY - OpenF1 y coordinate
 * @param bounds - Track bounds from calculateTrackBounds()
 * @param calibration - Circuit-specific calibration
 * @returns Transformed coordinates for 3D scene
 */
export function transformGPSToTrackSpace(
  gpsX: number,
  gpsY: number,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  calibration: TrackCalibration
): { x: number; z: number } {
  const { transform, viewBox, render } = calibration

  // Normalize to 0-1 range based on GPS bounds
  const rangeX = bounds.maxX - bounds.minX || 1
  const rangeY = bounds.maxY - bounds.minY || 1
  let normX = (gpsX - bounds.minX) / rangeX
  let normY = (gpsY - bounds.minY) / rangeY

  // Apply rotation around center (0.5, 0.5)
  if (transform.rotation !== 0) {
    const cos = Math.cos(transform.rotation)
    const sin = Math.sin(transform.rotation)
    const cx = normX - 0.5
    const cy = normY - 0.5
    normX = cx * cos - cy * sin + 0.5
    normY = cx * sin + cy * cos + 0.5
  }

  // Apply scale
  normX *= transform.scaleX
  normY *= transform.scaleY

  // Apply flip
  if (transform.flipX) normX = 1 - normX
  if (transform.flipY) normY = 1 - normY

  // Map to SVG viewBox space, then to 3D scene space
  // SVG uses 200x120 with 10px padding = 180x100 effective area
  const svgX = normX * 180 + 10
  const svgY = normY * 100 + 10

  // Apply offset
  const offsetSvgX = svgX + transform.offsetX
  const offsetSvgY = svgY + transform.offsetY

  // Convert SVG coordinates to 3D scene coordinates
  // Center at origin: x goes from -10 to +10, z goes from -6 to +6
  const sceneScale = render.trackScale
  const x = (offsetSvgX - viewBox.width / 2) * sceneScale
  const z = (offsetSvgY - viewBox.height / 2) * sceneScale

  return { x, z }
}
