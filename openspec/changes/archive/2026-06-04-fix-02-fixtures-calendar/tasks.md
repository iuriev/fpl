# Tasks: Full-season Fixtures Calendar (FIX-02)

## 1. Proxy — fpl-client & types

- [x] 1.1 Extend `FPLBootstrapStatic.teams` with six `strength_*` fields
- [x] 1.2 Add `getFixturesAll()` to `fpl-client.ts` (`GET /fixtures/` with no event param)
- [x] 1.3 Add `CALENDAR` TTL constant to `cache.ts` (12 hours)

## 2. Proxy — calendar service

- [x] 2.1 Implement `fixtures-calendar-service.ts`:
  - Fetch `getFixturesAll()` + bootstrap-static
  - Build `byTeam` map: DGW (2 fixtures), BGW (0 fixtures), normal (1 fixture) per GW
  - Compute `restDaysBefore` per fixture (sorted by kickoffTime; null if time unknown or first of season)
  - Rank 20 teams by each strength metric, bucket ranks into 1–5 for `overallDifficulty`, `defensiveDifficulty`, `attackingDifficulty`
  - Cache result under key `'fixtures:calendar'` with 12h TTL
- [x] 2.2 Unit tests `fixtures-calendar-service.test.ts`:
  - DGW / BGW detection
  - Rest days computed correctly; null for unknown kickoffTime; null for first fixture
  - Strength normalisation buckets 1–5 for all 20 teams

## 3. Proxy — endpoint

- [x] 3.1 Add `GET /api/fixtures/calendar` route to `index.ts`
- [x] 3.2 Integration test: route returns 200 with expected shape; cache key used

## 4. Proxy — docs

- [x] 4.1 Update `docs/fpl-api.md`: add `strength_*` fields to `teams[]`, add `GET /fixtures/`, add `GET /api/fixtures/calendar` proxy mapping

## 5. Web — types & data hook

- [x] 5.1 Add `CalendarResponse`, `CalendarTeam`, `CalendarGameweek`, `TeamGwRow`, `CalendarFixture` types to `web/src/api/types.ts`
- [x] 5.2 Add `fetchFixturesCalendar()` to API client
- [x] 5.3 Implement `useFixturesCalendar()` React Query hook (`staleTime: 12h`)

## 6. Web — design tokens

- [x] 6.1 Add `--fpl-rest-tight-*`, `--fpl-rest-moderate-*`, `--fpl-rest-easy-*`, `--fpl-rest-tbc-*` CSS variables to `design-tokens.css`

## 7. Web — FixtureCell component

- [x] 7.1 Implement `FixtureCell` component with FDR mode (normal / DGW / BGW variants)
- [x] 7.2 Add Rest Days mode to `FixtureCell` (colour by `restDaysBefore` range; "TBC" for null)
- [x] 7.3 Unit tests: renders correct FDR colour class per difficulty; DGW renders two chips; BGW renders dash; Rest Days renders colour tier and "TBC"

## 8. Web — CalendarGrid

- [x] 8.1 Implement `CalendarGrid` component:
  - CSS Grid layout: sticky team column (left) + sticky GW header row (top)
  - `grid-template-columns: auto repeat(38, 2.75rem)`
  - DGW rows: taller cell class when any team has 2+ fixtures for that GW
- [x] 8.2 Scroll current GW into view on mount (`scrollIntoView({ inline: 'center' })` in `requestAnimationFrame`)

## 9. Web — FixturesCalendarScreen

- [x] 9.1 Implement `FixturesCalendarScreen` with `ScreenHeader` + `CalendarTabBar` (5 tabs) + `CalendarGrid`
- [x] 9.2 Tab state (`useState`): switches difficulty source passed to `FixtureCell`
- [x] 9.3 Loading and error states
- [x] 9.4 Add `fixturesCalendarNavLink` and other copy keys to `copy.ts`

## 10. Web — routing & navigation

- [x] 10.1 Add route `/fixtures` in `App.tsx` (wrapped in `AuthAndTeamProtectedRoute`)
- [x] 10.2 Add nav link to `TeamInfoPanel` links array (after Price Changes)

## 11. Web — tests

- [x] 11.1 `FixturesCalendarScreen.test.tsx`:
  - Grid renders team names A–Z and GW header numbers
  - Tab switch changes mode prop passed to cells
  - Rest Days tab shows "TBC" for null-kickoff fixture
  - DGW cell renders two opponent chips
  - BGW cell renders dash

## 12. Finish

- [x] 12.1 Run `npm -w proxy test --silent` and `npm -w web test --silent` — all tests pass
- [x] 12.2 Mark FIX-02 done in `docs/backlog.md`
