# Spec: Watchlist

## Overview

A persisted list of FPL manager team IDs the user chooses to follow. The watchlist
is displayed as a table on `WatchlistScreen` and managed through three separate entry
points. In Phase 1 (this change), the watchlist lives in `localStorage`. The
`WatchlistRepository` interface is the planned migration seam to a backend API.

---

## Persistence

- Storage: `localStorage` key `fpl-watchlist-v1`
- Value: JSON-serialised `number[]` (array of team IDs)
- Scope: per browser (not per FPL account) in Phase 1
- Max entries: **5** in Phase 1

---

## WatchlistScreen

**Route**: `/watchlist?teamId=XXXXXX`

`teamId` is optional. If present, enables the "From My Leagues" add section.
If absent, "From My Leagues" shows a prompt to open a squad first.

### States

| State | What is shown |
|---|---|
| Empty watchlist | Illustration + "No managers followed yet" + add input |
| Loading (per row) | Skeleton cells in the table row while queries resolve |
| Row loaded | Full column data (see columns below) |
| Row error (e.g. 404) | Error cell with team ID + ✕ to remove |
| Watchlist full | "Following 5/5" badge; Add button disabled; Follow buttons show "Full" |

### Table columns

| Column | Source | Notes |
|---|---|---|
| Manager | `entry.managerName` + `entry.teamName` (sub-line) | Sticky left on mobile |
| GW Pts | `entry.eventPoints` | Current GW |
| GW Rank | `entry.eventRank` (new field) | Rank in overall standings for this GW |
| Overall Rank | `entry.overallRank` | |
| Rank Δ | `history.gameweeks[-1].overallRank − history.gameweeks[-2].overallRank` | Positive = improved; show ↑/↓/— with colour |
| Transfers | `squad.summary.transfers` | Count for this GW |
| Captain | `squad.starters.find(isCaptain).name` | |
| Latest Xfers | transfers for `event === currentGw`, `elementInName` list | "—" if no transfers this GW |
| ✕ | Remove button | Removes teamId from repository |

Clicking any row (except ✕) navigates to `/?teamId={row.teamId}`.

### Add Manager — manual input

- Text input accepts a numeric team ID
- On submit: call `api.getEntry(id)` to validate
  - If valid: show manager name + confirm button → `repo.add(id)`
  - If 404: show "Team not found"
  - If network error: show retry option
- On `add()` returning `'duplicate'`: show "Already following"
- On `add()` returning `'limit'`: show "Watchlist full (5/5)"

### Add Manager — From My Leagues

Requires `userTeamId` prop. Uses `useLeagues(userTeamId)` to list leagues.
Each league can be expanded to show standings via `useLeagueStandings(leagueId, page)`.

- Shows classic leagues only (not H2H, as H2H standings are separate endpoint)
- First page of standings on expand (up to 50 entries)
- "Load more" if `hasNext === true`
- Each standing row has a [Follow] button → `repo.add(entry)`
  - Button label changes to "Following" if already in watchlist
  - Disabled if watchlist is full

### Follow button (TeamInfoPanel)

- Shown on every squad view (including the user's own team)
- Reads watchlist state via `useWatchlistRepository()`
- Shows "Follow ☆" or "Following ★"
- On click: `repo.add(teamId)`
  - `'ok'` → button becomes "Following ★"
  - `'duplicate'` → already "Following ★" (no-op visually)
  - `'limit'` → toast "Watchlist full (5/5)"

---

## Rank Δ computation

```
delta = prevOverallRank - currentOverallRank

delta > 0 → improved (fewer = better rank)
delta < 0 → worsened
delta = 0 → unchanged
```

Display:
- `delta > 0`: green ↑ with formatted number (e.g. "↑ 3,200")
- `delta < 0`: red ↓ with formatted number (e.g. "↓ 1,800")
- `delta === 0`: neutral "—"
- No history data yet (first GW of season): "—"

---

## Navigation link

`TeamInfoPanel` gains a "Watchlist" link:
```
/watchlist?teamId=${teamId}
```

Positioned in the `navLinks` section alongside History, Stats, Dream Team, etc.
