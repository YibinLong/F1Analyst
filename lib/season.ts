/**
 * Central season year configuration.
 * Default to 2024 because OpenF1 currently has complete telemetry (incl. locations) for 2024,
 * while future seasons may not have location data yet.
 */
const envYear =
  process.env.NEXT_PUBLIC_OPENF1_SEASON_YEAR ||
  process.env.NEXT_PUBLIC_SEASON_YEAR ||
  process.env.OPENF1_SEASON_YEAR

const parsed = envYear ? parseInt(envYear, 10) : 2025

// Default to 2025 season; still allow env override for flexibility.
export const SEASON_YEAR = Number.isFinite(parsed) ? parsed : 2025
