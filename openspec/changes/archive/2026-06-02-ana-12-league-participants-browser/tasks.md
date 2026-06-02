# Tasks: League Participants Browser (ANA-12)

## W1 — Copy additions

- [x] Add to `web/src/lib/copy.ts`:
  - `leagueStandingsBack: 'Leagues'`
  - `leagueStandingsLoadError: 'Could not load league standings.'`
  - `leagueStandingsRetry: 'Retry'`
  - `leagueStandingsEmpty: 'No participants found.'`
  - `leagueStandingsLoadMore: 'Load more'`
  - `leagueStandingsLoading: 'Loading…'`

## W2 — Make LeagueRow tappable in LeaguesStatsScreen

- [x] Accept `onClick?: () => void` prop in `LeagueRow`
- [x] When `onClick` is provided, render row as a `<button>` (or add `role="button" tabIndex={0} onKeyDown`) with cursor pointer; add trailing `›` chevron (`color: var(--fpl-muted)`, `font-size: var(--fpl-fs-body-s)`)
- [x] In `LeagueSection`, pass `onClick` per row when a handler is provided
- [x] In `LeaguesStatsScreen`, pass `onClick` that calls `navigate('/leagues/${league.id}/standings?gw=${gwParam ?? ''}')` for each row
- [x] Add `.rowClickable` CSS class to `LeaguesStatsScreen.module.css`:
  - `cursor: pointer`
  - `&:hover { background: rgba(255,255,255,0.05); }`
  - Transition `120ms`

## W3 — StandingRow component

- [x] `web/src/screens/LeagueStandingsScreen/StandingRow.tsx`
- [x] Props: `standing: StandingEntry; onClick: () => void`
- [x] Layout: rank | name block (playerName + entryName) | GW total | season total | rank direction
- [x] Use same direction tokens as `LeaguesStatsScreen` (`↑`/`↓`/`—` with matching color classes)
- [x] `StandingRow.module.css` — all spacing/font via design tokens
- [x] `StandingRow.test.tsx`: renders rank, names, totals, direction; calls `onClick` on press

## W4 — LeagueStandingsScreen

- [x] `web/src/screens/LeagueStandingsScreen/LeagueStandingsScreen.tsx`
- [x] Reads `leagueId` from `useParams()`, `gw` and back URL from `useSearchParams()`
- [x] Local state: `allStandings: StandingEntry[]`, `page: number` (starts at 1), `loadingMore: boolean`
- [x] First page via `useLeagueStandings(leagueId, 1)`; derive `leagueName` and `hasNext` from response
- [x] "Load more" increments page and appends new standings to `allStandings`
- [x] `ScreenHeader`: back label = `leagueName` (or `copy.leagueStandingsBack` while loading); title = `leagueName`
- [x] Back navigates using the `back` query param (defaults to `/stats`)
- [x] Each `StandingRow` `onClick` → `navigate(\`/?teamId=${standing.entry}${gw ? \`&gw=${gw}\` : ''}\`)`
- [x] Skeleton: 8 rows matching `StandingRow` layout shape
- [x] Error state: `copy.leagueStandingsLoadError` + `Button` retry
- [x] Empty state: `copy.leagueStandingsEmpty`
- [x] `LeagueStandingsScreen.module.css`
- [x] `LeagueStandingsScreen.test.tsx`: loading → renders skeleton; success → renders rows; load more → appends; error → shows message + retry; row click → navigates

## W5 — Route and navigation

- [x] `web/src/App.tsx`: add `<Route path="/leagues/:leagueId/standings" element={<LeagueStandingsScreen />} />`
- [x] Lazy-import `LeagueStandingsScreen` with `React.lazy` if other screens follow that pattern; otherwise a static import is fine
- [x] In `LeaguesStatsScreen`, pass `gwParam` from `useSearchParams()` to each row's navigate call so the selected GW is preserved when opening a participant's squad
