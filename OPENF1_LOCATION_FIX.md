# OpenF1 API Location Data Fix

## Problem Summary

The `/location` endpoint from the OpenF1 API was returning HTTP 422 or "too much data" errors, causing "Location Data Unavailable" to display in the race viewer.

## Root Cause

The OpenF1 `/location` endpoint returns GPS coordinates (x, y, z) for every car at **~3.7 Hz frequency**. For a typical 2-hour F1 race with 20 drivers, this results in:

```
3.7 samples/sec × 7200 seconds × 20 drivers ≈ 533,000 records
```

The API has internal limits and returns an error when requesting too much data at once:
```json
{"detail":"Failed to retrieve information. You're likely asking for too much data at once."}
```

## Solution Implemented

### 1. Chunked Fetching

Location data is now fetched in **5-minute chunks** instead of all at once.

**File:** `lib/openf1.ts` - `getLocations()` function

```typescript
// Fetch in 5-minute windows
const CHUNK_SIZE_MS = 5 * 60 * 1000 // 5 minutes

// For a 2-hour race: 24 chunks
// Fetches 4 chunks in parallel to balance speed vs rate limits
```

### 2. Date Range Parameters

The `getLocations()` function now requires `dateStart` and `dateEnd` parameters:

```typescript
getLocations(sessionKey, {
  dateStart: session.date_start,  // e.g., "2025-03-16T04:00:00+00:00"
  dateEnd: session.date_end,      // e.g., "2025-03-16T06:00:00+00:00"
})
```

### 3. API Route Update

**File:** `app/api/race/[meetingKey]/route.ts`

The route now passes the session's date range to `getLocations()`.

## OpenF1 API Reference

### Location Endpoint

```
GET https://api.openf1.org/v1/location
```

**Parameters:**
- `session_key` - Session identifier (required)
- `driver_number` - Filter by driver (optional)
- `date>=` - Start time filter (ISO 8601)
- `date<=` - End time filter (ISO 8601)

**Example working request:**
```bash
curl "https://api.openf1.org/v1/location?session_key=9693&date%3E=2025-03-16T04:00:00&date%3C=2025-03-16T04:05:00"
```

**Response format:**
```json
[
  {
    "date": "2025-03-16T04:30:00.247000+00:00",
    "session_key": 9693,
    "meeting_key": 1254,
    "driver_number": 1,
    "x": 3322,
    "y": 834,
    "z": 89
  }
]
```

### Data Limits

| Time Window | Records (approx) | Status |
|-------------|------------------|--------|
| 5 minutes   | ~22,000          | Works  |
| 10 minutes  | ~45,000          | Fails  |
| Full race   | ~500,000         | Fails  |

## Validation Schema Fixes (Related)

While investigating, we also fixed validation schemas that were rejecting valid API responses:

| Field | Schema | Issue | Fix |
|-------|--------|-------|-----|
| `drivers.country_code` | `z.string()` | API returns `null` | `z.string().nullable()` |
| `laps.date_start` | `z.string()` | API returns `null` | `z.string().nullable()` |
| `intervals.gap_to_leader` | `z.number()` | API returns strings like "+1 LAP" | `z.union([z.number(), z.string()]).nullable()` |

**File:** `lib/openf1-schemas.ts`

## Performance Notes

- First load takes 20-30 seconds (24 API requests for 2-hour race)
- Consider implementing caching for production
- Location data is ~500k records per race - may need sampling for visualization

## Files Modified

1. `lib/openf1.ts` - Added chunked fetching logic
2. `lib/openf1-schemas.ts` - Fixed validation schemas
3. `types/openf1.ts` - Updated TypeScript interfaces
4. `app/api/race/[meetingKey]/route.ts` - Pass date range to getLocations
