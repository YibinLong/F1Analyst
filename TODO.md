TODO (Tuesday, Dec 30, 2025)

1. i just fixed the cars not showing up. check out OPENF1_LOCATION_FIX.md to see whats going on.
- i might still be asking for too much data from the api? so maybe ill still ask for less data, all that data may NOT be that necessary.
- like ask for way less data (if you think it's ok and doesn't break existing functionality )

2. make it so the laps go thru slower (make it like: it takes 1 min per lap, 2 min, 3 min per lap, stuff like that (WHILE ALSO KEEPING THE EXISTING SPEEDS - find a way to mesh them together))

3. make it so the cars actually point in the right direction as youre going thru the laps (right now they're pointed all over the place, NOT parallel to the track!) - right now, as cars are going around the track, you know how you expect cars to be pointed in the direction the track is going? theyre not pointed that direction right now! you might need to do something to connect the way the car points with the way the track moves. (right now, it looks like as if it goes around the track in weird pointed ways, but when i PAUSE, it fixes itself.)

4. right now, for some tracks, like in Australia, the cars lined up at the start are such that they go OFF THE TRACK. that points to two possible solutions -> either make the cars small enough so they fit on the track, or the track bigger so the cars fit. either way, youll have to make the cars and track square away and connect to each other so they connect together better. right now i feel there's a disconnect which causes this lack of robustness in the 3D track viewer. this might require a significant refactor! that's okay.

5.. there's still bugs later down the line as i run play, i get these:
## Error Type
Console TypeError

## Error Message
value.toFixed is not a function


    at formatGapToLeader (components/race-viewer/race-viewer.tsx:53:20)
    at RaceViewer.useMemo[standings] (components/race-viewer/race-viewer.tsx:135:22)
    at Array.map (<anonymous>:null:null)
    at RaceViewer.useMemo[standings] (components/race-viewer/race-viewer.tsx:110:28)
    at RaceViewer (components/race-viewer/race-viewer.tsx:92:28)
    at RacePage (app/race/[meetingKey]/page.tsx:61:7)

## Code Frame
  51 |   if (value === null) return null
  52 |   if (value < 0) return null
> 53 |   return `+${value.toFixed(3)}`
     |                    ^
  54 | }
  55 |
  56 | export function RaceViewer({

Next.js version: 16.0.10 (Turbopack)

AND

## Error Type
Console Error

## Error Message
[RaceViewerErrorBoundary] Component stack: "\n    at RaceViewer (http://localhost:3000/_next/static/chunks/VSCODE_POST_GAUNTLET_F1Analyst_97a96967._.js:6281:23)\n    at div (<anonymous>)\n    at MotionDOMComponent (http://localhost:3000/_next/static/chunks/09c65_18504733._.js:5112:232)\n    at PresenceChild (http://localhost:3000/_next/static/chunks/09c65_framer-motion_dist_es_8a0359e9._.js:7710:26)\n    at AnimatePresence (http://localhost:3000/_next/static/chunks/09c65_framer-motion_dist_es_8a0359e9._.js:7871:32)\n    at RaceViewerWrapper (http://localhost:3000/_next/static/chunks/VSCODE_POST_GAUNTLET_F1Analyst_97a96967._.js:7099:30)\n    at Suspense (<anonymous>)\n    at RaceViewerErrorBoundary (http://localhost:3000/_next/static/chunks/VSCODE_POST_GAUNTLET_F1Analyst_97a96967._.js:2068:9)\n    at main (<anonymous>)\n    at RacePage (about://React/Server/file:///Users/yibin/Documents/WORKZONE/VSCODE/POST_GAUNTLET/F1Analyst/.next/dev/server/chunks/ssr/%5Broot-of-the-server%5D__a79ccd14._.js?12:885:197)\n    at SegmentViewNode (http://localhost:3000/_next/static/chunks/09c65_next_dist_71447c55._.js:3299:28)\n    at InnerLayoutRouter (http://localhost:3000/_next/static/chunks/09c65_next_dist_b770c76b._.js:390:34)\n    at RedirectErrorBoundary (http://localhost:3000/_next/static/chunks/09c65_next_dist_client_c1042bd2._.js:9325:9)\n    at RedirectBoundary (http://localhost:3000/_next/static/chunks/09c65_next_dist_client_c1042bd2._.js:9367:29)\n    at HTTPAccessFallbackBoundary (http://localhost:3000/_next/static/chunks/09c65_next_dist_client_c1042bd2._.js:9890:39)\n    at LoadingBoundary (http://localhost:3000/_next/static/chunks/09c65_next_dist_b770c76b._.js:496:32)\n    at ErrorBoundary (http://localhost:3000/_next/static/chunks/09c65_next_dist_client_c1042bd2._.js:1048:26)\n    at InnerScrollAndFocusHandler (http://localhost:3000/_next/static/chunks/09c65_next_dist_b770c76b._.js:290:9)\n    at ScrollAndFocusHandler (http://localhost:3000/_next/static/chunks/09c65_next_dist_b770c76b._.js:373:34)\n    at RenderFromTemplateContext (http://localhost:3000/_next/static/chunks/09c65_next_dist_b770c76b._.js:769:44)\n    at SegmentStateProvider (http://localhost:3000/_next/static/chunks/09c65_next_dist_71447c55._.js:3315:33)\n    at OuterLayoutRouter (http://localhost:3000/_next/static/chunks/09c65_next_dist_b770c76b._.js:532:30)\n    at InnerLayoutRouter (http://localhost:3000/_next/static/chunks/09c65_next_dist_b770c76b._.js:390:34)\n    at RedirectErrorBoundary (http://localhost:3000/_next/static/chunks/09c65_next_dist_client_c1042bd2._.js:9325:9)\n    at RedirectBoundary (http://localhost:3000/_next/static/chunks/09c65_next_dist_client_c1042bd2._.js:9367:29)\n    at HTTPAccessFallbackBoundary (http://localhost:3000/_next/static/chunks/09c65_next_dist_client_c1042bd2._.js:9890:39)\n    at LoadingBoundary (http://localhost:3000/_next/static/chunks/09c65_next_dist_b770c76b._.js:496:32)\n    at ErrorBoundary (http://localhost:3000/_next/static/chunks/09c65_next_dist_client_c1042bd2._.js:1048:26)\n    at InnerScrollAndFocusHandler (http://localhost:3000/_next/static/chunks/09c65_next_dist_b770c76b._.js:290:9)\n    at ScrollAndFocusHandler (http://localhost:3000/_next/static/chunks/09c65_next_dist_b770c76b._.js:373:34)\n    at RenderFromTemplateContext (http://localhost:3000/_next/static/chunks/09c65_next_dist_b770c76b._.js:769:44)\n    at SegmentStateProvider (http://localhost:3000/_next/static/chunks/09c65_next_dist_71447c55._.js:3315:33)\n    at OuterLayoutRouter (http://localhost:3000/_next/static/chunks/09c65_next_dist_b770c76b._.js:532:30)\n    at InnerLayoutRouter (http://localhost:3000/_next/static/chunks/09c65_next_dist_b770c76b._.js:390:34)\n    at RedirectErrorBoundary (http://localhost:3000/_next/static/chunks/09c65_next_dist_client_c1042bd2._.js:9325:9)\n    at RedirectBoundary (http://localhost:3000/_next/static/chunks/09c65_next_dist_client_c1042bd2._.js:9367:29)\n    at HTTPAccessFallbackErrorBoundary (http://localhost:3000/_next/static/chunks/09c65_next_dist_client_c1042bd2._.js:9815:9)\n    at HTTPAccessFallbackBoundary (http://localhost:3000/_next/static/chunks/09c65_next_dist_client_c1042bd2._.js:9890:39)\n    at LoadingBoundary (http://localhost:3000/_next/static/chunks/09c65_next_dist_b770c76b._.js:496:32)\n    at ErrorBoundary (http://localhost:3000/_next/static/chunks/09c65_next_dist_client_c1042bd2._.js:1048:26)\n    at InnerScrollAndFocusHandler (http://localhost:3000/_next/static/chunks/09c65_next_dist_b770c76b._.js:290:9)\n    at ScrollAndFocusHandler (http://localhost:3000/_next/static/chunks/09c65_next_dist_b770c76b._.js:373:34)\n    at RenderFromTemplateContext (http://localhost:3000/_next/static/chunks/09c65_next_dist_b770c76b._.js:769:44)\n    at SegmentStateProvider (http://localhost:3000/_next/static/chunks/09c65_next_dist_71447c55._.js:3315:33)\n    at OuterLayoutRouter (http://localhost:3000/_next/static/chunks/09c65_next_dist_b770c76b._.js:532:30)\n    at body (<anonymous>)\n    at html (<anonymous>)\n    at RootLayout [Server] (<anonymous>)\n    at SegmentViewNode (http://localhost:3000/_next/static/chunks/09c65_next_dist_71447c55._.js:3299:28)\n    at __next_root_layout_boundary__ (http://localhost:3000/_next/static/chunks/09c65_next_dist_71447c55._.js:1666:64)\n    at RedirectErrorBoundary (http://localhost:3000/_next/static/chunks/09c65_next_dist_client_c1042bd2._.js:9325:9)\n    at RedirectBoundary (http://localhost:3000/_next/static/chunks/09c65_next_dist_client_c1042bd2._.js:9367:29)\n    at HTTPAccessFallbackErrorBoundary (http://localhost:3000/_next/static/chunks/09c65_next_dist_client_c1042bd2._.js:9815:9)\n    at HTTPAccessFallbackBoundary (http://localhost:3000/_next/static/chunks/09c65_next_dist_client_c1042bd2._.js:9890:39)\n    at DevRootHTTPAccessFallbackBoundary (http://localhost:3000/_next/static/chunks/09c65_next_dist_client_c1042bd2._.js:9959:46)\n    at AppDevOverlayErrorBoundary (http://localhost:3000/_next/static/chunks/09c65_next_dist_71447c55._.js:3410:9)\n    at HotReload (http://localhost:3000/_next/static/chunks/09c65_next_dist_client_c1042bd2._.js:10953:22)\n    at Router (http://localhost:3000/_next/static/chunks/09c65_next_dist_client_c1042bd2._.js:11131:23)\n    at ErrorBoundaryHandler (http://localhost:3000/_next/static/chunks/09c65_next_dist_client_c1042bd2._.js:982:9)\n    at ErrorBoundary (http://localhost:3000/_next/static/chunks/09c65_next_dist_client_c1042bd2._.js:1048:26)\n    at RootErrorBoundary (http://localhost:3000/_next/static/chunks/09c65_next_dist_client_c1042bd2._.js:9639:30)\n    at AppRouter (http://localhost:3000/_next/static/chunks/09c65_next_dist_client_c1042bd2._.js:11448:22)\n    at ServerRoot (http://localhost:3000/_next/static/chunks/09c65_next_dist_client_c1042bd2._.js:12965:23)\n    at Root (http://localhost:3000/_next/static/chunks/09c65_next_dist_client_c1042bd2._.js:12983:17)"


    at RaceViewerErrorBoundary.componentDidCatch (components/error-boundary.tsx:104:15)
    at RacePage (app/race/[meetingKey]/page.tsx:61:7)

## Code Frame
  102 |     if (process.env.NODE_ENV === "development") {
  103 |       console.error("[RaceViewerErrorBoundary] Caught error:", error)
> 104 |       console.error("[RaceViewerErrorBoundary] Component stack:", errorInfo.componentStack)
      |               ^
  105 |     }
  106 |   }
  107 |

Next.js version: 16.0.10 (Turbopack)
