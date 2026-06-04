# Design: Full-season Fixtures Calendar (FIX-02)

## Screen map

Route: `/fixtures`
Nav: `TeamInfoPanel` link (after Price Changes).

```
┌──────────────────────────────────────────────────────────────┐
│  ‹ Squad          Fixtures Calendar                          │
├──────────────────────────────────────────────────────────────┤
│  [Official] [Overall] [Defensive] [Attacking] [Rest Days]    │
├──────┬───────────────────────────────────────────────────────┤
│      │  ←  sticky  │       horizontal scroll →              │
│      │  GW1  GW2  GW3  … [GW current] …  GW38              │ ← sticky header row
│      │  ────────────────────────────────────────────        │
│ ARS  │  ▓▓   ▓▓   ░░  …  ▓▓  ▓▓  …  ▓▓                   │ ← DGW: two chips stacked
│ AVL  │  ▒▒   ──   ▒▒  …  ▒▒  ──   …  ░░                   │ ← BGW: grey dash cell
│ BOU  │  ▓▓   ▓▓▓  ▓▓  …  ──  ▒▒   …  ▓▓                   │
│ BRE  │  ▓▓   ▓▓   ▓▓  …  ▓▓  ▓▓▓  …  ▓▓                   │
│  …   │  …    …    …   …  …   …    …  …                     │
└──────┴───────────────────────────────────────────────────────┘
         ↑ current GW column centred on mount
```

Teams: sorted A–Z, fixed order. Current GW column: highlighted header, scrolled into view.

## Proxy endpoint

### `GET /api/fixtures/calendar`

Cache: **12 hours** (`cacheLayer.ttl.CALENDAR = 12 * 60 * 60 * 1000`).

Single upstream fetch: `GET /fixtures/` (full season, no `?event=` param).

Response type:

```ts
interface CalendarResponse {
  teams: CalendarTeam[];
  gameweeks: CalendarGameweek[];
  byTeam: Record<number, TeamGwRow[]>;
}

interface CalendarTeam {
  id: number;
  code: number;
  name: string;
  shortName: string;
  strengthOverallHome: number;
  strengthOverallAway: number;
  strengthAttackHome: number;
  strengthAttackAway: number;
  strengthDefenceHome: number;
  strengthDefenceAway: number;
}

interface CalendarGameweek {
  id: number;
  name: string;
  finished: boolean;
  isCurrent: boolean;
  deadline: string;
}

interface TeamGwRow {
  gw: number;
  fixtures: CalendarFixture[];  // length 0 = BGW, 1 = normal, 2+ = DGW
}

interface CalendarFixture {
  opponentShortName: string;
  opponentId: number;
  home: boolean;
  officialDifficulty: 1 | 2 | 3 | 4 | 5;
  overallDifficulty: 1 | 2 | 3 | 4 | 5;
  defensiveDifficulty: 1 | 2 | 3 | 4 | 5;
  attackingDifficulty: 1 | 2 | 3 | 4 | 5;
  kickoffTime: string | null;
  restDaysBefore: number | null;
}
```

### Difficulty normalisation

`officialDifficulty`: taken directly from `team_h_difficulty` / `team_a_difficulty`.

For `overallDifficulty`, `defensiveDifficulty`, `attackingDifficulty`: rank all 20 teams by
the relevant strength metric, then bucket by rank position:

```
rank 1–4  (weakest) → difficulty 1
rank 5–8            → difficulty 2
rank 9–12           → difficulty 3
rank 13–16          → difficulty 4
rank 17–20 (strongest) → difficulty 5
```

| Tab | Metric used | Home/Away |
|-----|-------------|-----------|
| Overall | `strength_overall_home/away` of **opponent** | use home when opponent plays at home |
| Defensive | `strength_attack_home/away` of **opponent** (high attack = hard to defend) | same |
| Attacking | `strength_defence_home/away` of **opponent** (high defence = hard to attack) | same |

Build `strengthRank` maps once at service startup (or per request if teams list doesn't
change). Cache the computed result for 12h alongside the raw fixtures.

### Rest days calculation

For each team, collect all their fixtures sorted by `kickoffTime` (nulls last). For each
fixture `f[i]`:

```
restDaysBefore = null                           if kickoffTime is null
               = null                           if no previous fixture in season
               = floor((f[i] - f[i-1]) / 86400000)  otherwise
```

Note: DGW fixtures in the same GW can have different `restDaysBefore` values (they each
compare against the previous distinct kickoff date).

### fpl-client additions

```ts
// Full season — no ?event= param
export async function getFixturesAll(): Promise<FPLFixture[]> {
  return fetchFPL('/fixtures/');
}
```

Extend `FPLBootstrapStatic.teams`:

```ts
teams: Array<{
  id: number;
  name: string;
  short_name: string;
  code: number;
  strength_overall_home: number;
  strength_overall_away: number;
  strength_attack_home: number;
  strength_attack_away: number;
  strength_defence_home: number;
  strength_defence_away: number;
}>;
```

## Web: screen structure

```
FixturesCalendarScreen
├── ScreenHeader title="Fixtures Calendar"
├── CalendarTabBar (Official | Overall | Defensive | Attacking | Rest Days)
└── CalendarGrid
    ├── GWHeaderRow (sticky top, horizontal scroll)
    │   └── GWHeaderCell × 38 (highlights isCurrent)
    ├── TeamColumn (sticky left)
    │   └── TeamNameCell × 20 (A–Z short names)
    └── CellGrid (scrollable body)
        └── FixtureCell[team][gw]
```

### Grid layout (CSS)

Use a CSS Grid for the body: `grid-template-columns: [sticky] auto repeat(38, 2.75rem)`.
The sticky team column uses `position: sticky; left: 0; z-index: 1`.
The GW header row uses `position: sticky; top: 0; z-index: 2`.

Cell dimensions:
- Normal cell: `2.75rem` wide × `2.5rem` tall.
- DGW cell: same width, `4.5rem` tall (two chips stacked, `0.25rem` gap).
- All rows in the same GW column use the tallest variant for that GW (DGW height if any
  team has a DGW that GW).

### `FixtureCell` component

Props:
```ts
interface FixtureCellProps {
  fixtures: CalendarFixture[];  // 0, 1, or 2+
  mode: 'official' | 'overall' | 'defensive' | 'attacking' | 'restDays';
  isDgwRow: boolean;  // determines cell height class
}
```

**FDR mode** (`official | overall | defensive | attacking`):

```
BGW (fixtures.length === 0):
┌─────┐
│  —  │  grey bg, centred dash
└─────┘

Normal:
┌─────┐
│ MCI │  shortName
│  H  │  H / A, small
└─────┘  bg = var(--fpl-fdr-{d}-bg), color = var(--fpl-fdr-{d}-ink)

DGW:
┌─────┐
│ MCI │  first fixture
│  H  │
├─────┤  1px separator
│ ARS │  second fixture
│  A  │
└─────┘
```

**Rest Days mode**:

Same chip shape; instead of `H/A` label, show rest days:

```
┌─────┐     ┌─────┐     ┌─────┐
│ MCI │     │ ARS │     │ CHE │
│  3d │     │ TBC │     │ 12d │
└─────┘     └─────┘     └─────┘
  red         grey        green
```

Colour tokens for rest days (add to `design-tokens.css`):

```css
--fpl-rest-tight-bg:    #c0392b;   /* 0–3 days */
--fpl-rest-tight-ink:   #ffffff;
--fpl-rest-moderate-bg: #e67e22;   /* 4–6 days */
--fpl-rest-moderate-ink:#ffffff;
--fpl-rest-easy-bg:     #27ae60;   /* 7+ days */
--fpl-rest-easy-ink:    #ffffff;
--fpl-rest-tbc-bg:      var(--fpl-surface-2);  /* null */
--fpl-rest-tbc-ink:     var(--fpl-text-secondary);
```

### Scroll centring on mount

On `CalendarGrid` mount, use a `ref` on the current-GW header cell and call
`scrollIntoView({ inline: 'center', block: 'nearest' })`. Wrap in `requestAnimationFrame`
to let the grid render first. No JS animation library needed.

### Tab persistence

Store selected tab in `useState` within `FixturesCalendarScreen` (no URL param, no
localStorage — session-only).

## Hook: `useFixturesCalendar`

```ts
function useFixturesCalendar(): {
  data: CalendarResponse | undefined;
  isLoading: boolean;
  error: Error | null;
}
```

React Query: `queryKey: ['fixtures-calendar']`, `staleTime: 12 * 60 * 60 * 1000`.

## Navigation

Add to `TeamInfoPanel` nav link list (after Price Changes):

```ts
{ to: '/fixtures', label: () => copy.fixturesCalendarNavLink }
```

Route in `App.tsx` (uses `AuthAndTeamProtectedRoute`, same as other screens):

```tsx
<Route path="/fixtures" element={
  <AuthAndTeamProtectedRoute>
    <FixturesCalendarScreen />
  </AuthAndTeamProtectedRoute>
} />
```

## Copy keys (add to `copy.ts`)

`fixturesCalendarNavLink`, `fixturesCalendarTitle`,
`fixturesCalendarTabOfficial`, `fixturesCalendarTabOverall`,
`fixturesCalendarTabDefensive`, `fixturesCalendarTabAttacking`,
`fixturesCalendarTabRestDays`, `fixturesCalendarRestDaysTbc`.

## Testing

**Proxy** (`fixtures-calendar-service.test.ts`):
- DGW detection: two fixtures for same team in same GW → `fixtures.length === 2`.
- BGW detection: no fixtures for a team in a GW → `fixtures.length === 0`.
- Rest days: computed correctly given two consecutive kickoff times; null when kickoffTime is
  null; null for the first fixture of the season.
- Strength normalisation: 20 teams ranked into buckets 1–5 correctly.
- Cache key `'fixtures:calendar'` used with 12h TTL.

**Web** (`FixturesCalendarScreen.test.tsx`):
- Renders grid with team names and GW headers from mock data.
- Tab switch changes difficulty source used for cell colours.
- Rest Days tab renders `'TBC'` for null kickoffTime cells.
- DGW cells render two chips in one column cell.
- BGW cells render the dash placeholder.

## Docs

Update `docs/fpl-api.md`:
- Add `strength_*` fields to `teams[]` in bootstrap-static section.
- Add `GET /fixtures/` (no param) to "Endpoints we use".
- Add `GET /api/fixtures/calendar` to proxy mapping.
