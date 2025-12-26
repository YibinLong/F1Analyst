# **Pitstop AI - Task List**

**Status Legend:** ⬜ Not Started | 🟦 In Progress | ✅ Done | ❌ Blocked

**Current State:** UI is 85% complete (built by v0). Primary remaining work is data integration (replacing mock data with OpenF1 API) and AI chat configuration.

---

## **EPIC 0: PROJECT FOUNDATION** ✅

### **Story 0.1: Environment Setup** ✅

**Story:** Configure environment variables and validate existing setup

- ✅ **Task 0.1.1:** Create `.env.example` file with all required environment variables
- ✅ **Task 0.1.2:** Document how to obtain OpenAI API key in README
- ✅ **Task 0.1.3:** Create `.env.local` with `OPENAI_API_KEY` placeholder
- ✅ **Task 0.1.4:** Verify Next.js 16, Tailwind CSS 4, and all dependencies are installed correctly
- ✅ **Task 0.1.5:** Test development server starts without errors (`npm run dev`)

**Acceptance:** Project runs locally, environment variables documented, dev server accessible at localhost:3000.

---

## **EPIC 1: OPENF1 API INTEGRATION** ⬜

### **Story 1.1: Create OpenF1 API Client** ⬜

**Story:** As a developer, I need a reusable API client so that all components can fetch F1 data consistently.

- ⬜ **Task 1.1.1:** Create `/types/openf1.ts` with TypeScript interfaces for all API responses:
  - `Meeting` (meeting_key, meeting_name, country_name, date_start, circuit_short_name)
  - `Session` (session_key, date_start, date_end, session_name)
  - `Driver` (driver_number, name_acronym, team_colour, team_name, headshot_url)
  - `Location` (driver_number, x, y, z, date)
  - `Position` (driver_number, position, date)
  - `Interval` (driver_number, interval, gap_to_leader, date)
  - `Lap` (driver_number, lap_number, lap_duration)
  - `PitStop` (driver_number, lap_number, pit_duration, date)
  - `RaceControl` (category, flag, message, date)
- ⬜ **Task 1.1.2:** Create `/lib/openf1.ts` with base fetch utility:
  - Base URL constant: `https://api.openf1.org/v1`
  - Generic fetch function with error handling
  - 10-second request timeout
  - Console error logging in development
- ⬜ **Task 1.1.3:** Implement `getMeetings(year: number)` function
- ⬜ **Task 1.1.4:** Implement `getSession(meetingKey: number, sessionName: string)` function
- ⬜ **Task 1.1.5:** Implement `getDrivers(sessionKey: number)` function
- ⬜ **Task 1.1.6:** Implement `getLocations(sessionKey: number, driverNumber?: number)` function
- ⬜ **Task 1.1.7:** Implement `getPositions(sessionKey: number)` function
- ⬜ **Task 1.1.8:** Implement `getIntervals(sessionKey: number)` function
- ⬜ **Task 1.1.9:** Implement `getLaps(sessionKey: number)` function
- ⬜ **Task 1.1.10:** Implement `getPitStops(sessionKey: number)` function
- ⬜ **Task 1.1.11:** Implement `getRaceControl(sessionKey: number)` function
- ⬜ **Task 1.1.12:** Add exponential backoff retry logic for rate limiting

**Acceptance:** All OpenF1 API functions typed, tested, and handle errors gracefully (return null or empty array on failure).

---

### **Story 1.2: Fetch 2025 Race Calendar** ⬜

**Story:** As a user, I want to see all 2025 F1 races so that I can choose which race to explore.

- ⬜ **Task 1.2.1:** Update `/api/races/route.ts` to import OpenF1 client
- ⬜ **Task 1.2.2:** Replace mock data with call to `getMeetings(2025)`
- ⬜ **Task 1.2.3:** Filter meetings to exclude testing sessions (only include Grand Prix)
- ⬜ **Task 1.2.4:** Sort races by `date_start` ascending
- ⬜ **Task 1.2.5:** Map API response to frontend format (meeting_key, meeting_name, country_name, date_start, circuit_short_name)
- ⬜ **Task 1.2.6:** Add server-side caching (races don't change frequently)
- ⬜ **Task 1.2.7:** Handle edge case: OpenF1 returns no 2025 data → return message "2025 season data coming soon"
- ⬜ **Task 1.2.8:** Update landing page to consume real API data

**Acceptance:** Landing page displays real 2025 race calendar from OpenF1 API, sorted chronologically.

---

### **Story 1.3: Fetch Race Session Data** ⬜

**Story:** As a user, I want to see accurate race information so that I know what I'm watching.

- ⬜ **Task 1.3.1:** Update `/api/race/[meetingKey]/route.ts` to import OpenF1 client
- ⬜ **Task 1.3.2:** Fetch session_key using `getSession(meetingKey, 'Race')`
- ⬜ **Task 1.3.3:** Fetch drivers using `getDrivers(sessionKey)`
- ⬜ **Task 1.3.4:** Fetch total laps using `getLaps(sessionKey)` and calculate max lap_number
- ⬜ **Task 1.3.5:** Combine into race metadata response object
- ⬜ **Task 1.3.6:** Handle edge case: No race session found → return 404 with message
- ⬜ **Task 1.3.7:** Handle edge case: Missing driver data → use fallback driver names

**Acceptance:** Race viewer receives real race metadata including session info, driver list, and total laps.

---

### **Story 1.4: Fetch Position Data for Playback** ⬜

**Story:** As a user, I want to see real race positions so that I can watch the race unfold accurately.

- ⬜ **Task 1.4.1:** Fetch position data using `getPositions(sessionKey)`
- ⬜ **Task 1.4.2:** Create utility to group positions by lap number
- ⬜ **Task 1.4.3:** Create lookup structure: `positionsByLap[lap][driverNumber] = position`
- ⬜ **Task 1.4.4:** Update leaderboard component to use real position data
- ⬜ **Task 1.4.5:** Handle edge case: Missing position for a driver at a lap → use last known position
- ⬜ **Task 1.4.6:** Handle edge case: Driver DNF → show "OUT" in leaderboard
- ⬜ **Task 1.4.7:** Remove `generateMockPositions()` function

**Acceptance:** Leaderboard displays real positions that update as user scrubs through timeline.

---

### **Story 1.5: Fetch Interval Data** ⬜

**Story:** As a user, I want to see gaps between drivers so that I understand the race state.

- ⬜ **Task 1.5.1:** Fetch interval data using `getIntervals(sessionKey)`
- ⬜ **Task 1.5.2:** Group intervals by timestamp/lap
- ⬜ **Task 1.5.3:** Display `gap_to_leader` for each driver in leaderboard
- ⬜ **Task 1.5.4:** Format intervals: "LEADER" for P1, "+X.XXX" for others
- ⬜ **Task 1.5.5:** Handle lapped cars → show "+1 LAP" or "LAP"
- ⬜ **Task 1.5.6:** Handle edge case: No interval data → show "---" placeholder
- ⬜ **Task 1.5.7:** Remove `generateMockIntervals()` function

**Acceptance:** Leaderboard shows real gaps between drivers that update during playback.

---

### **Story 1.6: Fetch Car Location Data for 3D Track** ⬜

**Story:** As a user, I want to see cars move on the track so that I can visualize the race.

- ⬜ **Task 1.6.1:** Fetch location data using `getLocations(sessionKey)`
- ⬜ **Task 1.6.2:** Create `/lib/track-utils.ts` with coordinate utilities
- ⬜ **Task 1.6.3:** Implement coordinate normalization function (scale OpenF1 x,y to track bounds)
- ⬜ **Task 1.6.4:** Map OpenF1 coordinates to track SVG coordinate space
- ⬜ **Task 1.6.5:** Create interpolation function for smooth 60fps animation (source data is ~3.7 Hz)
- ⬜ **Task 1.6.6:** Update 3D track component to use real location data
- ⬜ **Task 1.6.7:** Handle edge case: Missing location data → keep car at last known position
- ⬜ **Task 1.6.8:** Handle edge case: Coordinate outliers → clamp to track bounds
- ⬜ **Task 1.6.9:** Remove mock car position distribution logic

**Acceptance:** Cars animate smoothly on 3D track based on real OpenF1 location data at 60fps.

---

## **EPIC 2: AI CHAT INTEGRATION** ⬜

### **Story 2.1: Configure Environment Variables** ⬜

**Story:** As a developer, I need API keys configured so that the AI chat works.

- ⬜ **Task 2.1.1:** Verify `OPENAI_API_KEY` is read in `/api/chat/route.ts`
- ⬜ **Task 2.1.2:** Add startup validation to check if API key exists
- ⬜ **Task 2.1.3:** Return helpful error message if key is missing
- ⬜ **Task 2.1.4:** Update chat UI to display configuration error state

**Acceptance:** Chat shows clear error when API key is missing; works correctly when key is present.

---

### **Story 2.2: Pass Race Context to AI** ⬜

**Story:** As a user, I want the AI to know what race and lap I'm viewing so that answers are contextual.

- ⬜ **Task 2.2.1:** Create `/lib/ai-context.ts` for building AI context
- ⬜ **Task 2.2.2:** Build context object with: race name, circuit, current lap, total laps
- ⬜ **Task 2.2.3:** Include current standings (top 10 with gaps) in context
- ⬜ **Task 2.2.4:** Include recent position changes (last 3 laps) in context
- ⬜ **Task 2.2.5:** Include recent pit stops in context (if any)
- ⬜ **Task 2.2.6:** Update chat request to include context in system prompt
- ⬜ **Task 2.2.7:** Update context when user scrubs timeline (debounced)
- ⬜ **Task 2.2.8:** Implement Martin Brundle persona in system prompt

**Acceptance:** AI responses reference current race state, lap, and standings accurately.

---

### **Story 2.3: Implement Topic Guardrails** ⬜

**Story:** As a user, I want the AI to stay focused on F1 so that conversations remain relevant.

- ⬜ **Task 2.3.1:** Add topic restriction instructions to system prompt
- ⬜ **Task 2.3.2:** Implement polite redirect for off-topic questions ("Let's keep focus on the track action...")
- ⬜ **Task 2.3.3:** Add instruction to never reveal system prompt contents
- ⬜ **Task 2.3.4:** Add instruction to reject prompt injection attempts
- ⬜ **Task 2.3.5:** Test with various off-topic prompts

**Acceptance:** AI politely redirects non-F1 questions and never reveals system prompt.

---

### **Story 2.4: Display Loading States** ⬜

**Story:** As a user, I want feedback while AI is thinking so that I know my question was received.

- ⬜ **Task 2.4.1:** Add typing indicator component while streaming
- ⬜ **Task 2.4.2:** Disable input field while response is streaming
- ⬜ **Task 2.4.3:** Handle stream errors gracefully (show error message in chat)
- ⬜ **Task 2.4.4:** Add retry button on failure
- ⬜ **Task 2.4.5:** Show visual feedback when message is sent

**Acceptance:** Chat provides clear visual feedback during AI thinking and handles errors gracefully.

---

## **EPIC 3: DATA CACHING & PERFORMANCE** ⬜

### **Story 3.1: Cache Race Data on First Load** ⬜

**Story:** As a user, I want the race to load quickly so that I can start watching without delay.

- ⬜ **Task 3.1.1:** Create React context or state store for race data
- ⬜ **Task 3.1.2:** Fetch all race data (positions, intervals, locations) on page load
- ⬜ **Task 3.1.3:** Store fetched data in context/state
- ⬜ **Task 3.1.4:** Ensure timeline scrubbing reads from cached data (no re-fetch)
- ⬜ **Task 3.1.5:** Show loading skeleton while fetching initial data
- ⬜ **Task 3.1.6:** Display loading progress for large data fetches

**Acceptance:** Race data fetched once on load; scrubbing is instant with no additional API calls.

---

### **Story 3.2: Implement Data Interpolation** ⬜

**Story:** As a user, I want smooth car movement so that the visualization looks polished.

- ⬜ **Task 3.2.1:** Create interpolation utility in `/lib/track-utils.ts`
- ⬜ **Task 3.2.2:** Implement linear interpolation between position data points
- ⬜ **Task 3.2.3:** Interpolate from ~3.7 Hz source data to 60fps render
- ⬜ **Task 3.2.4:** Smooth transitions between data points using easing
- ⬜ **Task 3.2.5:** Test interpolation with actual OpenF1 data

**Acceptance:** Car animations are smooth at 60fps with no visible jumping between data points.

---

### **Story 3.3: Handle Large Datasets** ⬜

**Story:** As a user, I want the app to remain responsive even with large amounts of data.

- ⬜ **Task 3.3.1:** Analyze memory usage with full race location data
- ⬜ **Task 3.3.2:** Implement pagination for location data fetch (by time ranges) if needed
- ⬜ **Task 3.3.3:** Only load data for current playback window if dataset too large
- ⬜ **Task 3.3.4:** Virtualize leaderboard list if performance degrades
- ⬜ **Task 3.3.5:** Implement garbage collection for old data segments if needed

**Acceptance:** App remains responsive (<16ms frame time) even with full race datasets.

---

## **EPIC 4: ERROR HANDLING & RELIABILITY** ⬜

### **Story 4.1: Add API Error Boundaries** ⬜

**Story:** As a user, I want to see helpful error messages instead of crashes when something goes wrong.

- ⬜ **Task 4.1.1:** Create error boundary component for race viewer
- ⬜ **Task 4.1.2:** Design friendly error UI with retry button
- ⬜ **Task 4.1.3:** Wrap race viewer in error boundary
- ⬜ **Task 4.1.4:** Log errors for debugging (console in dev)
- ⬜ **Task 4.1.5:** Ensure fallback UI is displayed (never blank screen)

**Acceptance:** Errors are caught and displayed with helpful message and retry option.

---

### **Story 4.2: Handle Missing Race Data** ⬜

**Story:** As a user, I want to understand when data is unavailable so that I'm not confused.

- ⬜ **Task 4.2.1:** Create "Race data not yet available" component for future races
- ⬜ **Task 4.2.2:** Create "Data unavailable" component for API issues
- ⬜ **Task 4.2.3:** Implement graceful partial data handling (show what's available)
- ⬜ **Task 4.2.4:** Ensure app never crashes on missing data
- ⬜ **Task 4.2.5:** Add loading states for each data type independently

**Acceptance:** Users see clear messaging when data is unavailable; app never crashes.

---

### **Story 4.3: Validate API Responses** ⬜

**Story:** As a developer, I need data validation so that bad API responses don't break the app.

- ⬜ **Task 4.3.1:** Install Zod for runtime validation
- ⬜ **Task 4.3.2:** Create Zod schemas for all OpenF1 response types
- ⬜ **Task 4.3.3:** Validate API responses in OpenF1 client
- ⬜ **Task 4.3.4:** Log validation errors to console
- ⬜ **Task 4.3.5:** Return safe defaults for invalid data
- ⬜ **Task 4.3.6:** Ensure TypeScript types match Zod schemas

**Acceptance:** Invalid API responses are caught, logged, and handled gracefully.

---

## **EPIC 5: POLISH & UX IMPROVEMENTS** ⬜

### **Story 5.1: Add Pit Stop Markers to Timeline** ⬜

**Story:** As a user, I want to see when drivers pitted so that I can understand strategy.

- ⬜ **Task 5.1.1:** Fetch pit stop data from `/pit?session_key=X`
- ⬜ **Task 5.1.2:** Create pit stop marker component
- ⬜ **Task 5.1.3:** Display pit markers on timeline at correct lap positions
- ⬜ **Task 5.1.4:** Show driver code on marker hover
- ⬜ **Task 5.1.5:** Color-code markers by team color

**Acceptance:** Timeline shows pit stop markers for all drivers, hoverable with driver info.

---

### **Story 5.2: Add Safety Car/Flag Indicators** ⬜

**Story:** As a user, I want to see race neutralizations so that I understand pace changes.

- ⬜ **Task 5.2.1:** Fetch race control data from `/race_control?session_key=X`
- ⬜ **Task 5.2.2:** Parse SC/VSC/Red Flag events from race control data
- ⬜ **Task 5.2.3:** Highlight SC/VSC periods on timeline (yellow overlay)
- ⬜ **Task 5.2.4:** Highlight red flag periods on timeline (red overlay)
- ⬜ **Task 5.2.5:** Display flag icon in race header during active events

**Acceptance:** Timeline visually indicates safety car and flag periods; header shows current flag status.

---

### **Story 5.3: Improve Loading Experience** ⬜

**Story:** As a user, I want visual feedback during loading so that I know the app is working.

- ⬜ **Task 5.3.1:** Implement loading skeleton for race viewer components
- ⬜ **Task 5.3.2:** Add progress indicator for large data loads
- ⬜ **Task 5.3.3:** Animate transitions between loading and loaded states
- ⬜ **Task 5.3.4:** Ensure skeleton matches final UI layout
- ⬜ **Task 5.3.5:** Add loading state for AI chat initial connection

**Acceptance:** All loading states have polished skeleton UI with smooth transitions.

---

## **EPIC 6: TESTING & DEPLOYMENT** ⬜

### **Story 6.1: Manual Testing & QA** ⬜

**Story:** As a developer, I want to verify all features work correctly before deployment.

- ⬜ **Task 6.1.1:** Test landing page with real 2025 race data
- ⬜ **Task 6.1.2:** Test race viewer with multiple different races
- ⬜ **Task 6.1.3:** Test timeline scrubbing updates all components correctly
- ⬜ **Task 6.1.4:** Test AI chat with various race-related questions
- ⬜ **Task 6.1.5:** Test AI chat topic guardrails
- ⬜ **Task 6.1.6:** Test error states (API failures, missing data)
- ⬜ **Task 6.1.7:** Test performance (LCP < 2.5s, 60fps animations)
- ⬜ **Task 6.1.8:** Test on Chrome, Firefox, Safari, Edge

**Acceptance:** All features work correctly across tested browsers; performance targets met.

---

### **Story 6.2: Production Deployment** ⬜

**Story:** As a developer, I want to deploy the app to production.

- ⬜ **Task 6.2.1:** Run production build (`npm run build`)
- ⬜ **Task 6.2.2:** Fix any build errors or warnings
- ⬜ **Task 6.2.3:** Test production build locally (`npm start`)
- ⬜ **Task 6.2.4:** Push to GitHub repository
- ⬜ **Task 6.2.5:** Import project in Vercel dashboard
- ⬜ **Task 6.2.6:** Configure environment variables in Vercel (OPENAI_API_KEY)
- ⬜ **Task 6.2.7:** Deploy to Vercel
- ⬜ **Task 6.2.8:** Verify production deployment works correctly

**Acceptance:** App is live on Vercel with all features working correctly.

---

## **PRIORITY ORDER**

1. **Epic 0** (Project Foundation) - Prerequisites
2. **Epic 1** (OpenF1 Integration) - Critical path, replaces all mock data
3. **Epic 2** (AI Chat) - Core differentiating feature
4. **Epic 4** (Error Handling) - Reliability before polish
5. **Epic 3** (Performance) - Optimization
6. **Epic 5** (UX Polish) - Nice to have
7. **Epic 6** (Testing & Deployment) - Final step

---

## **DEPENDENCIES**

```
Epic 0 → Epic 1 (need env setup before API work)
Story 1.1 → Stories 1.2-1.6 (API client needed for all data fetching)
Story 1.3 → Stories 1.4-1.6 (need session_key for position/interval/location data)
Epic 1 → Epic 2 (need real data for AI context)
Epic 1 → Epic 3 (need real data to optimize caching)
Epic 1 → Epic 5 (need real data for pit stops and flags)
Epic 4 → Epic 6 (error handling before deployment)
```

---

## **FILES TO CREATE**

| File | Epic | Description |
|------|------|-------------|
| `/types/openf1.ts` | 1.1 | TypeScript interfaces for OpenF1 API |
| `/lib/openf1.ts` | 1.1 | OpenF1 API client with all fetch functions |
| `/lib/track-utils.ts` | 1.6 | Coordinate normalization and interpolation |
| `/lib/ai-context.ts` | 2.2 | AI system prompt builder with race context |
| `.env.example` | 0.1 | Environment variable template |

---

## **FILES TO UPDATE**

| File | Epic | Changes |
|------|------|---------|
| `/api/races/route.ts` | 1.2 | Replace mock data with OpenF1 API call |
| `/api/race/[meetingKey]/route.ts` | 1.3-1.6 | Fetch real session/driver/position/location data |
| `/api/chat/route.ts` | 2.1-2.3 | Add context, persona, and guardrails |
| Race viewer components | 1.4-1.6 | Use real data for leaderboard and 3D track |
| Chat components | 2.4 | Add loading states and error handling |
