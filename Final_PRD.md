# Pitstop AI — Final PRD

**Version:** 1.0
**Status:** Ready for Implementation
**Last Updated:** 2025-12-26

---

## 1. Project Summary

**Pitstop AI** is an interactive F1 race replay and analysis tool featuring 3D animated track visualization, real-time car positions, a live leaderboard, and an AI-powered race analyst chatbot with Martin Brundle persona.

**MVP Scope:**
- Landing page with 2025 F1 calendar (24 races)
- Race viewer with 3D track visualization and playback controls
- Live leaderboard with position/interval data
- AI chat panel with contextual race analysis
- OpenF1 API integration for real race data

**Current State:** UI is 85% complete (built by v0). Primary remaining work is **data integration** (replacing mock data with OpenF1 API) and **AI chat configuration**.

---

## 2. Core Goals

| # | Goal | Success Criteria |
|---|------|------------------|
| 1 | Users can browse the 2025 F1 season calendar | All 24 races displayed with circuit info from OpenF1 API |
| 2 | Users can watch race replays with 3D visualization | Cars animate on track based on real position data |
| 3 | Users can scrub through race timeline | Leaderboard and car positions update at any point in race |
| 4 | Users can ask AI questions about the race | AI responds with context-aware analysis in Martin Brundle style |
| 5 | App loads fast and feels premium | LCP < 2.5s, 60fps animations, AI response < 1s |

---

## 3. Non-Goals (Out of Scope for MVP)

- Practice and Qualifying sessions (race only)
- Live/real-time race streaming (historical replay only)
- Driver championship standings page
- User accounts or saved preferences
- Mobile-optimized responsive layout
- Pre-2025 seasons
- Offline mode
- Internationalization (English only)
- Accessibility audit (WCAG)
- Head-to-head driver comparison tool
- Tire strategy visualization charts
- Team radio audio playback

---

## 4. Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 16 (App Router) | Already configured, AI-friendly, SSR support |
| Language | TypeScript (strict) | Already configured, type safety |
| Styling | Tailwind CSS 4 | Already configured, rapid UI iteration |
| 3D Rendering | React Three Fiber + Drei | Already implemented, declarative Three.js |
| Animation | Framer Motion | Already implemented throughout |
| AI SDK | Vercel AI SDK + Anthropic | Already configured, streaming support |
| LLM | Claude Sonnet 4 | Already configured in chat route |
| External Data | OpenF1 API | Free, no auth, comprehensive F1 data |
| Icons | Lucide React | Already in use |
| Components | shadcn/ui (Radix) | Already installed |

---

## 5. Current Implementation Status

### 5.1 What Exists (Built by v0)

**Landing Page:**
- [x] Hero section with animated title and CTA
- [x] Race grid with 24 race cards
- [x] Track outline SVGs for all 24 circuits
- [x] Hover effects and click navigation
- [x] Jarvis/HUD visual theme

**Race Viewer Page:**
- [x] Page routing (`/race/[meetingKey]`)
- [x] Race header with metadata
- [x] 3D track visualization (React Three Fiber)
- [x] Car models positioned on track
- [x] Leaderboard panel with standings
- [x] Timeline scrubber with lap indicator
- [x] Play/pause and speed controls (0.5x, 1x, 2x, 4x)
- [x] Chat panel UI with message display

**API Routes:**
- [x] `/api/races` - Returns race list (mock data)
- [x] `/api/race/[meetingKey]` - Returns race details (mock data)
- [x] `/api/chat` - AI chat endpoint (needs API key)

**Styling:**
- [x] Complete Jarvis/Iron Man HUD aesthetic
- [x] Cyan/teal accent colors
- [x] Glass morphism panels
- [x] Custom scrollbars
- [x] All animations working

### 5.2 What Uses Mock Data (Needs OpenF1 Integration)

| Component | Current State | Required Data |
|-----------|--------------|---------------|
| Race Calendar | Hardcoded 24 races | `/meetings?year=2025` |
| Driver List | Static 20-driver array | `/drivers?session_key=X` |
| Race Positions | `generateMockPositions()` | `/position?session_key=X` |
| Intervals | `generateMockIntervals()` | `/intervals?session_key=X` |
| Car Locations | SVG path distribution | `/location?session_key=X` |
| Lap Count | Fixed at 57 | `/laps?session_key=X` |
| Pit Stops | Not implemented | `/pit?session_key=X` |
| Race Events | Not implemented | `/race_control?session_key=X` |

### 5.3 What Needs Configuration

| Item | Status | Action Required |
|------|--------|-----------------|
| `ANTHROPIC_API_KEY` | Missing | Add to `.env.local` |
| OpenF1 API client | Not created | Create `/lib/openf1.ts` |
| Error boundaries | Not implemented | Add fallback UI |
| Data caching | Not implemented | Cache API responses |

---

## 6. Feature Breakdown — Epics & Stories

### Epic 1: OpenF1 API Integration

**Goal:** Replace all mock data with real F1 data from OpenF1 API

#### Story 1.1: Create OpenF1 API Client

**User Story:** As a developer, I need a reusable API client so that all components can fetch F1 data consistently.

**Acceptance Criteria:**
- [ ] Create `/lib/openf1.ts` with typed fetch functions
- [ ] Define TypeScript types in `/types/openf1.ts` for all API responses
- [ ] Handle API errors gracefully (return null or empty array)
- [ ] Add request timeout (10 seconds)
- [ ] Log errors to console in development

**Data Model Notes:**
- File: `/lib/openf1.ts`
- File: `/types/openf1.ts`

**Edge Cases:**
- API returns empty array → Show "No data available" message
- API timeout → Show error state with retry button
- API rate limited → Implement exponential backoff

#### Story 1.2: Fetch 2025 Race Calendar

**User Story:** As a user, I want to see all 2025 F1 races so that I can choose which race to explore.

**Acceptance Criteria:**
- [ ] Update `/api/races/route.ts` to fetch from OpenF1 `/meetings?year=2025`
- [ ] Filter meetings to only include races (exclude testing)
- [ ] Sort races by date ascending
- [ ] Return: `meeting_key`, `meeting_name`, `country_name`, `date_start`, `circuit_short_name`
- [ ] Cache response (races don't change frequently)

**Edge Cases:**
- OpenF1 returns no 2025 data → Show message "2025 season data coming soon"
- Partial data → Display available races, hide missing ones

#### Story 1.3: Fetch Race Session Data

**User Story:** As a user, I want to see accurate race information so that I know what I'm watching.

**Acceptance Criteria:**
- [ ] Update `/api/race/[meetingKey]/route.ts` to fetch session data
- [ ] Get session_key from `/sessions?meeting_key=X&session_name=Race`
- [ ] Fetch drivers from `/drivers?session_key=X`
- [ ] Fetch total laps from `/laps?session_key=X` (max lap_number)
- [ ] Return combined race metadata object

**Edge Cases:**
- No race session found → Return 404 with message
- Missing driver data → Use fallback driver names

#### Story 1.4: Fetch Position Data for Playback

**User Story:** As a user, I want to see real race positions so that I can watch the race unfold accurately.

**Acceptance Criteria:**
- [ ] Fetch `/position?session_key=X` for all position changes
- [ ] Group positions by lap number
- [ ] Create lookup: `positionsByLap[lap][driverNumber] = position`
- [ ] Update leaderboard to use real position data
- [ ] Interpolate between data points for smooth playback

**Edge Cases:**
- Missing position for a driver at a lap → Use last known position
- Driver DNF → Show "OUT" in leaderboard

#### Story 1.5: Fetch Interval Data

**User Story:** As a user, I want to see gaps between drivers so that I understand the race state.

**Acceptance Criteria:**
- [ ] Fetch `/intervals?session_key=X` for gap data
- [ ] Group intervals by timestamp/lap
- [ ] Display gap_to_leader for each driver
- [ ] Show "LEADER" for P1, "+X.XXX" for others
- [ ] Handle lapped cars (show "LAP" or "+1 LAP")

**Edge Cases:**
- No interval data → Show "---" placeholder
- Negative interval → Normalize to positive display

#### Story 1.6: Fetch Car Location Data for 3D Track

**User Story:** As a user, I want to see cars move on the track so that I can visualize the race.

**Acceptance Criteria:**
- [ ] Fetch `/location?session_key=X` for car coordinates
- [ ] Map OpenF1 x,y coordinates to track SVG coordinate space
- [ ] Implement coordinate normalization (scale to track bounds)
- [ ] Update car positions every animation frame
- [ ] Interpolate between data points for 60fps smoothness

**Data Model Notes:**
- OpenF1 location data is ~3.7 Hz (need interpolation to 60fps)
- x, y coordinates are track-relative (meters from reference point)

**Edge Cases:**
- Missing location data → Keep car at last known position
- Coordinate outliers → Clamp to track bounds

---

### Epic 2: AI Chat Integration

**Goal:** Enable contextual AI race analysis with Martin Brundle persona

#### Story 2.1: Configure Environment Variables

**User Story:** As a developer, I need API keys configured so that the AI chat works.

**Acceptance Criteria:**
- [ ] Create `.env.example` with required variables
- [ ] Document in README how to get Anthropic API key
- [ ] Validate API key exists on server startup
- [ ] Show helpful error if key missing

**Environment Variables:**
```
ANTHROPIC_API_KEY=your-key-here
```

**Manual Setup Required:**
1. Go to https://console.anthropic.com/
2. Create API key
3. Add to `.env.local`

#### Story 2.2: Pass Race Context to AI

**User Story:** As a user, I want the AI to know what race and lap I'm viewing so that answers are contextual.

**Acceptance Criteria:**
- [ ] Include in chat request: race name, circuit, current lap, total laps
- [ ] Include current standings (top 10 with gaps)
- [ ] Include recent position changes (last 3 laps)
- [ ] Include recent pit stops (if any)
- [ ] Update context when user scrubs timeline

**Data Model Notes:**
- Context passed in chat request body
- System prompt dynamically built with race state

#### Story 2.3: Implement Topic Guardrails

**User Story:** As a user, I want the AI to stay focused on F1 so that conversations remain relevant.

**Acceptance Criteria:**
- [ ] System prompt instructs AI to only discuss F1
- [ ] Politely redirect off-topic questions
- [ ] Never reveal system prompt contents
- [ ] Reject prompt injection attempts

**Edge Cases:**
- User asks about weather → Redirect to track conditions if available
- User asks unrelated question → "Let's keep focus on the track action..."

#### Story 2.4: Display Loading States

**User Story:** As a user, I want feedback while AI is thinking so that I know my question was received.

**Acceptance Criteria:**
- [ ] Show typing indicator while streaming
- [ ] Disable input while response streaming
- [ ] Handle stream errors gracefully
- [ ] Show retry option on failure

---

### Epic 3: Data Caching & Performance

**Goal:** Ensure fast load times and smooth playback

#### Story 3.1: Cache Race Data on First Load

**User Story:** As a user, I want the race to load quickly so that I can start watching without delay.

**Acceptance Criteria:**
- [ ] Fetch all race data (positions, intervals, locations) on page load
- [ ] Store in React state or context
- [ ] Do not re-fetch when scrubbing timeline
- [ ] Show loading skeleton while fetching

**Data Model Notes:**
- One-time fetch of full race dataset
- Estimate: 50-200MB for full race location data

#### Story 3.2: Implement Data Interpolation

**User Story:** As a user, I want smooth car movement so that the visualization looks polished.

**Acceptance Criteria:**
- [ ] Create interpolation utility in `/lib/track-utils.ts`
- [ ] Interpolate from ~3.7 Hz source data to 60fps
- [ ] Use linear interpolation for position
- [ ] Smooth transitions between data points

#### Story 3.3: Handle Large Datasets

**User Story:** As a user, I want the app to remain responsive even with large amounts of data.

**Acceptance Criteria:**
- [ ] Paginate location data fetch (by time ranges)
- [ ] Only load data for current playback window
- [ ] Virtualize leaderboard if needed
- [ ] Monitor memory usage

**Edge Cases:**
- Full race location data too large → Fetch in chunks as user scrubs
- Memory pressure → Garbage collect old data segments

---

### Epic 4: Error Handling & Reliability

**Goal:** Graceful degradation when data is unavailable

#### Story 4.1: Add API Error Boundaries

**User Story:** As a user, I want to see helpful error messages instead of crashes when something goes wrong.

**Acceptance Criteria:**
- [ ] Wrap race viewer in error boundary
- [ ] Show friendly error message with retry button
- [ ] Log errors for debugging
- [ ] Provide fallback UI (not blank screen)

#### Story 4.2: Handle Missing Race Data

**User Story:** As a user, I want to understand when data is unavailable so that I'm not confused.

**Acceptance Criteria:**
- [ ] Show "Race data not yet available" for future races
- [ ] Show "Data unavailable" for races with API issues
- [ ] Gracefully handle partial data (show what's available)
- [ ] Never crash on missing data

#### Story 4.3: Validate API Responses

**User Story:** As a developer, I need data validation so that bad API responses don't break the app.

**Acceptance Criteria:**
- [ ] Validate OpenF1 responses with Zod schemas
- [ ] Log validation errors
- [ ] Return safe defaults for invalid data
- [ ] TypeScript types match Zod schemas

---

### Epic 5: Polish & UX Improvements

**Goal:** Finalize the user experience

#### Story 5.1: Add Pit Stop Markers to Timeline

**User Story:** As a user, I want to see when drivers pitted so that I can understand strategy.

**Acceptance Criteria:**
- [ ] Fetch pit stop data from `/pit?session_key=X`
- [ ] Display pit markers on timeline component
- [ ] Show driver code on hover
- [ ] Color-code by team

#### Story 5.2: Add Safety Car/Flag Indicators

**User Story:** As a user, I want to see race neutralizations so that I understand pace changes.

**Acceptance Criteria:**
- [ ] Fetch race control data from `/race_control?session_key=X`
- [ ] Highlight SC/VSC periods on timeline
- [ ] Show red flag periods
- [ ] Display flag icon in race header during events

#### Story 5.3: Improve Loading Experience

**User Story:** As a user, I want visual feedback during loading so that I know the app is working.

**Acceptance Criteria:**
- [ ] Use existing skeleton component during data fetch
- [ ] Show progress indicator for large data loads
- [ ] Animate transitions between loading and loaded states

---

## 7. Data Flow Architecture

```
USER ACTION                 FRONTEND                    API ROUTES                  EXTERNAL
─────────────────────────────────────────────────────────────────────────────────────────────

Click Race Card ──────────► Navigate to
                            /race/[meetingKey]
                                   │
                                   ▼
                            Fetch race data ─────────► /api/race/[meetingKey] ────► OpenF1 API
                                   │                          │                     /sessions
                                   │                          │                     /drivers
                                   │                          │                     /position
                                   │                          │                     /intervals
                                   │                          │                     /location
                                   │                          │                     /laps
                                   ▼                          ▼                     /pit
                            Store in state ◄───────── Return combined data         /race_control
                                   │
                                   ▼
Scrub Timeline ───────────► Update currentLap
                                   │
                                   ▼
                            Lookup positions[lap]
                            Lookup intervals[lap]
                            Update 3D car positions
                            Update leaderboard

Send Chat Message ────────► Build context object ───► /api/chat ─────────────────► Anthropic API
                            (race, lap, standings)         │
                                   │                       │
                                   ▼                       ▼
                            Stream response ◄──────── Stream AI response
                            Display in chat panel
```

---

## 8. Environment Setup

### `.env.example`

```bash
# Required for AI Chat functionality
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx

# Optional: Override OpenF1 API URL (defaults to https://api.openf1.org/v1)
OPENF1_API_URL=https://api.openf1.org/v1

# Optional: Enable debug logging
DEBUG=false
```

### Manual Setup Instructions

1. **Anthropic API Key:**
   - Go to https://console.anthropic.com/
   - Create account or sign in
   - Navigate to API Keys section
   - Generate new key
   - Copy to `.env.local` as `ANTHROPIC_API_KEY`

2. **OpenF1 API:**
   - No setup required (free, no auth)
   - Rate limits: Be mindful of request frequency

---

## 9. .gitignore

Already configured. Key entries:
```
.env.local
.env*.local
node_modules/
.next/
out/
```

---

## 10. Debugging & Logging

### Development Logging

- API errors logged to browser console
- OpenF1 fetch failures include endpoint URL
- AI chat errors show in chat panel as system message

### Debug Mode

Set `DEBUG=true` in `.env.local` to enable:
- Verbose API response logging
- Performance timing logs
- State change logs

### Common Issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| Chat shows error | Missing API key | Add `ANTHROPIC_API_KEY` to `.env.local` |
| No races displayed | OpenF1 API down | Check https://api.openf1.org status |
| Cars not moving | Location data missing | Verify session has location data |
| Leaderboard stuck | Position data missing | Check `/position` endpoint response |

---

## 11. Deployment Plan

### Local Development

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

# Start development server
npm run dev

# Open http://localhost:3000
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Vercel Deployment

1. Push to GitHub repository
2. Import project in Vercel dashboard
3. Add environment variables in Vercel settings:
   - `ANTHROPIC_API_KEY`
4. Deploy

---

## 12. Acceptance Criteria Summary

### MVP Complete When:

- [ ] Landing page shows real 2025 race calendar from OpenF1
- [ ] Race viewer displays real position data
- [ ] Cars move on track based on real location data
- [ ] Leaderboard shows real intervals/gaps
- [ ] AI chat responds with race context
- [ ] Timeline scrubbing updates all components
- [ ] Error states handle API failures gracefully
- [ ] App loads in under 3 seconds
- [ ] 60fps animation maintained during playback

---

## 13. Task Estimation Guide

For TASK_LIST.md generation, use these rough estimates:

| Task Type | Typical Effort |
|-----------|---------------|
| Create new utility file | Small |
| Add API client function | Small |
| Update existing component to use real data | Medium |
| Implement data interpolation | Medium |
| Add error boundary | Small |
| Integrate new API endpoint | Medium |
| Cache implementation | Medium |
| UI polish/animation | Small |

**Priority Order:**
1. Epic 1 (OpenF1 Integration) - Critical path
2. Epic 2 (AI Chat) - Core feature
3. Epic 4 (Error Handling) - Reliability
4. Epic 3 (Performance) - Polish
5. Epic 5 (UX Polish) - Nice to have

---

## Appendix A: OpenF1 API Reference

Base URL: `https://api.openf1.org/v1`

| Endpoint | Purpose | Key Fields |
|----------|---------|------------|
| `/meetings?year=2025` | Get all 2025 races | meeting_key, meeting_name, country_name, date_start |
| `/sessions?meeting_key=X&session_name=Race` | Get race session | session_key, date_start, date_end |
| `/drivers?session_key=X` | Get drivers | driver_number, name_acronym, team_colour, team_name |
| `/location?session_key=X` | Car positions over time | driver_number, x, y, z, date |
| `/position?session_key=X` | Standings changes | driver_number, position, date |
| `/intervals?session_key=X` | Gaps between cars | driver_number, interval, gap_to_leader, date |
| `/laps?session_key=X` | Lap times | driver_number, lap_number, lap_duration |
| `/pit?session_key=X` | Pit stops | driver_number, lap_number, pit_duration |
| `/race_control?session_key=X` | Flags, SC, incidents | category, flag, message, date |

---

## Appendix B: File Structure Reference

```
/app
  /page.tsx                    # Landing page (exists)
  /race/[meetingKey]/page.tsx  # Race viewer (exists)
  /api
    /races/route.ts            # GET 2025 meetings (needs update)
    /race/[meetingKey]/route.ts # GET race data (needs update)
    /chat/route.ts             # POST AI chat (exists, needs config)

/components
  /landing/                    # Landing page components (complete)
  /race-viewer/                # Race viewer components (complete)
  /chat/                       # Chat components (complete)
  /ui/                         # shadcn components (complete)

/lib
  /openf1.ts                   # OpenF1 API client (TO CREATE)
  /track-utils.ts              # Coordinate utils (TO CREATE)
  /ai-context.ts               # AI prompt builder (TO CREATE)
  /utils.ts                    # General utils (exists)

/types
  /openf1.ts                   # OpenF1 type definitions (TO CREATE)
```
