# Tasks: Manager Watchlist

## Proxy

### P1 — Extend EntryResponse with eventRank ✓

- [x] `fpl-client.ts` `FPLEntry`: add `summary_event_rank: number`
- [x] `proxy/src/types.ts` `EntryResponse`: add `eventRank: number`
- [x] `entry-service.ts`: map `entry.summary_event_rank → result.eventRank`
- [x] Update entry-service tests

### P2 — Transfers endpoint ✓

- [x] `fpl-client.ts`: add `FPLTransfer` interface; add `getTransfers(teamId)`
- [x] `proxy/src/types.ts`: add `Transfer` and `TransfersResponse` interfaces
- [x] `transfers-service.ts`: implement with player name resolution from bootstrap, cache 1h
- [x] `index.ts`: add route `GET /api/entry/:teamId/transfers`
- [x] `transfers-service.test.ts`: happy path, fallback name, empty, cached, 404

### P3 — League standings endpoint ✓

- [x] `fpl-client.ts`: add `FPLLeagueStandings` interface; add `getLeagueStandings(leagueId, page)`
- [x] `proxy/src/types.ts`: add `StandingEntry` and `LeagueStandingsResponse` interfaces
- [x] `league-standings-service.ts`: implement, cache 10 minutes
- [x] `index.ts`: add route `GET /api/leagues/:leagueId/standings`
- [x] `league-standings-service.test.ts`: happy path, page forwarding, hasNext, cached, 404

---

## Web — types and API layer

### W1 — Sync proxy types to web ✓

- [x] `web/src/types/index.ts`: add `eventRank`, `Transfer`, `TransfersResponse`, `LeagueStandingsResponse`, `StandingEntry`
- [x] `web/src/api/client.ts`: add `getTransfers`, `getLeagueStandings`
- [x] `web/src/api/queries.ts`: add `useTransfers` (1h), `useLeagueStandings` (10m)

---

## Web — watchlist repository

### W2 — WatchlistRepository interface and localStorage implementation ✓

- [x] `web/src/lib/watchlist-repository.ts`: interface, LocalStorageWatchlistRepository, context, hook
- [x] `web/src/lib/watchlist-repository.test.ts`: 12 tests covering all cases

### W3 — Inject repository in App.tsx ✓

- [x] `watchlistRepo` instance created at module level
- [x] App wrapped in `WatchlistRepositoryContext.Provider`

---

## Web — WatchlistScreen

### W4 — ManagerRow component ✓
### W5 — AddManagerInput component ✓
### W6 — FromLeaguesSection component ✓
### W7 — WatchlistScreen ✓
### W8 — Route and navigation ✓

- `web/src/screens/WatchlistScreen/ManagerRow.tsx`
- Props: `teamId: number; currentGw: number; onRemove: () => void`
- Uses `useEntry`, `useSquad`, `useHistory`, `useTransfers`
- Renders all table columns with per-cell skeleton while loading
- Error state: shows team ID + error message + ✕
- Row click → navigate to `/?teamId={teamId}`

### W5 — AddManagerInput component

- `web/src/screens/WatchlistScreen/AddManagerInput.tsx`
- Manual ID input + validate-and-add flow
- Uses `api.getEntry()` to validate before adding (shows manager name preview)
- Calls `repo.add()`, handles `'duplicate'` and `'limit'` responses

### W6 — FromLeaguesSection component

- `web/src/screens/WatchlistScreen/FromLeaguesSection.tsx`
- Props: `userTeamId: number | null`
- If null: renders "Open your squad first to browse your leagues"
- Uses `useLeagues(userTeamId)` to list classic leagues
- Each league is collapsible; on expand: loads `useLeagueStandings(leagueId, 1)`
- Each standing row has Follow / Following button using `useWatchlistRepository()`
- "Load more" if `hasNext`

### W7 — WatchlistScreen

- `web/src/screens/WatchlistScreen/WatchlistScreen.tsx`
- Props: `userTeamId?: number`
- Reads watchlist from `useWatchlistRepository()`
- Shows: capacity badge ("3/5 following"), table, add input, from-leagues section
- Empty state when list is empty
- Uses `useGameweeks()` to resolve `currentGw` for squad/transfers queries

### W8 — Route and navigation

- `web/src/App.tsx`: add `<Route path="/watchlist" element={<WatchlistScreen userTeamId={teamId} />} />`
- Export `WatchlistScreen` from `web/src/screens/index.ts`
- `TeamInfoPanel.tsx`: add nav link `Watchlist → /watchlist?teamId=${teamId}`
- `TeamInfoPanel.tsx`: add Follow / Following toggle button using `useWatchlistRepository()`

---

## Web — tests

### W9 — WatchlistScreen tests ✓

- [x] `WatchlistScreen.test.tsx`: empty state, capacity badge, rows, add input, remove

### W10 — ManagerRow tests ✓

- [x] `ManagerRow.test.tsx`: name, rank delta, transfers, remove, row click navigation

### W11 — FromLeaguesSection tests ✓

- [x] `FromLeaguesSection.test.tsx`: no teamId prompt, leagues list, expand standings, follow, full state
