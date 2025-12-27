#!/usr/bin/env node
/**
 * Convert F1 circuits GeoJSON to SVG files
 * Run with: node scripts/convert-geojson-to-svg.js
 */

const fs = require('fs');
const path = require('path');

// Mapping from GeoJSON IDs to our circuit keys
const circuitMapping = {
  'au-1953': 'albert_park',
  'bh-2002': 'bahrain',
  'cn-2004': 'shanghai',
  'es-1991': 'barcelona',
  'mc-1929': 'monaco',
  'ca-1978': 'montreal',
  'at-1969': 'red_bull_ring',
  'gb-1948': 'silverstone',
  'hu-1986': 'hungaroring',
  'be-1925': 'spa',
  'it-1922': 'monza',
  'sg-2008': 'singapore',
  'jp-1962': 'suzuka',
  'us-2012': 'cota',
  'mx-1962': 'mexico',
  'br-1940': 'interlagos',
  'ae-2009': 'yas_marina',
  'it-1953': 'imola',
  'nl-1948': 'zandvoort',
  'sa-2021': 'jeddah',
  'us-2022': 'miami',
  'qa-2004': 'lusail',
  'az-2016': 'baku',
  'us-2023': 'las_vegas',
};

// SVG dimensions
const SVG_WIDTH = 200;
const SVG_HEIGHT = 120;
const PADDING = 10;

function convertGeoJSONToSVG(coordinates) {
  if (!coordinates || coordinates.length === 0) return null;

  // Find bounding box
  let minLon = Infinity, maxLon = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;

  for (const [lon, lat] of coordinates) {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  const lonRange = maxLon - minLon || 1;
  const latRange = maxLat - minLat || 1;

  // Calculate scale to fit in viewBox with padding
  const availableWidth = SVG_WIDTH - 2 * PADDING;
  const availableHeight = SVG_HEIGHT - 2 * PADDING;

  const scaleX = availableWidth / lonRange;
  const scaleY = availableHeight / latRange;
  const scale = Math.min(scaleX, scaleY);

  // Center the track
  const scaledWidth = lonRange * scale;
  const scaledHeight = latRange * scale;
  const offsetX = PADDING + (availableWidth - scaledWidth) / 2;
  const offsetY = PADDING + (availableHeight - scaledHeight) / 2;

  // Convert coordinates to SVG path
  const points = coordinates.map(([lon, lat]) => {
    const x = (lon - minLon) * scale + offsetX;
    // Flip Y axis (SVG Y increases downward, but lat increases upward)
    const y = (maxLat - lat) * scale + offsetY;
    return [x.toFixed(2), y.toFixed(2)];
  });

  // Create path string
  const pathD = points.map((point, i) => {
    return (i === 0 ? 'M' : 'L') + point.join(',');
  }).join(' ') + ' Z';

  return pathD;
}

function createSVG(pathD, trackName) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" xmlns="http://www.w3.org/2000/svg" fill="none" preserveAspectRatio="xMidYMid meet">
  <!-- ${trackName} Circuit -->
  <!-- Track glow effect -->
  <path d="${pathD}" stroke="rgba(0, 212, 255, 0.3)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <!-- Main track line -->
  <path d="${pathD}" stroke="#00d4ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;
}

async function main() {
  const geojsonPath = '/tmp/f1-circuits.geojson';
  const outputDir = path.join(__dirname, '..', 'public', 'tracks');

  // Read GeoJSON
  const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf-8'));

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let created = 0;
  let skipped = 0;

  for (const feature of geojson.features) {
    const geoId = feature.properties.id;
    const circuitKey = circuitMapping[geoId];

    if (!circuitKey) {
      console.log(`Skipping: ${geoId} (${feature.properties.Name}) - not in 2025 calendar`);
      skipped++;
      continue;
    }

    const coordinates = feature.geometry.coordinates;
    const pathD = convertGeoJSONToSVG(coordinates);

    if (!pathD) {
      console.log(`Error: No coordinates for ${circuitKey}`);
      continue;
    }

    const svg = createSVG(pathD, feature.properties.Name);
    const outputPath = path.join(outputDir, `${circuitKey}.svg`);

    fs.writeFileSync(outputPath, svg);
    console.log(`Created: ${circuitKey}.svg (${feature.properties.Name})`);
    created++;
  }

  console.log(`\nDone! Created ${created} SVG files, skipped ${skipped} circuits.`);

  // List any missing circuits
  const createdCircuits = new Set();
  for (const file of fs.readdirSync(outputDir)) {
    if (file.endsWith('.svg')) {
      createdCircuits.add(file.replace('.svg', ''));
    }
  }

  const expectedCircuits = Object.values(circuitMapping);
  const missing = expectedCircuits.filter(c => !createdCircuits.has(c));

  if (missing.length > 0) {
    console.log(`\nMissing circuits: ${missing.join(', ')}`);
  }
}

main().catch(console.error);
