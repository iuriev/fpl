# Design: League Participants Browser (ANA-12)

## Leagues Stats Screen — LeagueRow changes

Each league row gains:
- A `›` trailing chevron (right-pointing, `--fpl-muted` color, `1rem` icon)
- `cursor: pointer` and a subtle press state (`background: rgba(255,255,255,0.05)`)
- `role="button"` / `tabIndex={0}` for accessibility; `onKeyDown` Enter/Space triggers tap

Clicking calls `navigate('/leagues/:leagueId/standings?back=/stats&gw=<gw>')` so the
standings screen knows where to go back and which GW is active in the caller.

## League Standings Screen

**Route:** `/leagues/:leagueId/standings`

**Query params (read-only):** `back` (defaults to `/stats`), `gw` (forwarded to squad link)

### Header

`ScreenHeader` with:
- Back label: league name (from first page response) — falls back to "Leagues" if still loading
- Title: league name (centered, same pattern as other screens)

### Body layout

```
┌─────────────────────────────────────┐
│  ‹ Overall               My Stats   │  ← ScreenHeader
├────┬─────────────────────┬────┬─────┤
│ #  │ Manager / Team      │ GW │ Tot │
├────┼─────────────────────┼────┼─────┤
│  1 │ Salah Fan           │ 82 │3245 ↑│
│  2 │ Kane Not Out        │ 71 │3201 —│
│  3 │ My Team Name  ← me │ 68 │3188 ↓│
│ …  │                     │    │     │
└────┴─────────────────────┴────┴─────┘
           [ Load more ]
```

### Standing row

Columns (flex, no table element):
- **Rank** (3ch, tabular-nums, `--fpl-text-soft`)
- **Name block** (flex-1):
  - Top line: `playerName` (`--fpl-text`, medium weight, truncated)
  - Bottom line: `entryName` (`--fpl-muted`, small, truncated)
- **GW** (4ch, tabular-nums, right-aligned)
- **Total** (5ch, tabular-nums, right-aligned)
- **Direction** (1rem, `↑/↓/—`, same color tokens as `LeagueRow`)

Row tap navigates to `/?teamId=<entry>&gw=<gw>`.
Highlighted own row: `entryName` matching the caller's team name is shown in accent color.
We do not know which row is the user's own team from the API; no highlighting is needed.

### Load more

A `Button variant="secondary"` centered below the list. Visible only when `hasNext`.
Each press increments page by 1 and appends results (accumulated in local state array).
While loading next page, button shows a `…` spinner text and is disabled.

### States

| State | Render |
|---|---|
| Loading first page | Skeleton: 8 shimmering rows (rank + name + two number cells) |
| Error | Centered message + "Retry" button |
| Empty (no standings) | Centered "No participants found" text |

## Copy additions (`copy.ts`)

| Key | Value |
|---|---|
| `leagueStandingsBack` | `'Leagues'` |
| `leagueStandingsLoadError` | `'Could not load league standings.'` |
| `leagueStandingsRetry` | `'Retry'` |
| `leagueStandingsEmpty` | `'No participants found.'` |
| `leagueStandingsLoadMore` | `'Load more'` |
| `leagueStandingsLoading` | `'Loading…'` |

## Token usage

All spacing via `--fpl-space-*`, font sizes via `--fpl-fs-*`, colors via `--fpl-*` tokens.
Border between rows: `1px solid rgba(255,255,255,0.04)` (same as `LeaguesStatsScreen`).
Row hover: `background: rgba(255,255,255,0.03)`.
