## Why

Managers want to benchmark their players against the best performers in FPL — both within a
single gameweek ("who scored big this week?") and across the full season ("who are the best
picks overall?"). A Top Players screen with two tabs covers both use cases without additional
FPL API calls beyond what is already cached.

## What Changes

- Add a Top Players screen reachable from the main navigation.
- Two tabs:
  - **This GW** — top 20 players ranked by points in the selected gameweek, sourced from
    `/event/{gw}/live/` (already fetched for squad view) merged with player metadata from
    `bootstrap-static`.
  - **Season** — top 20 players ranked by total points for the season, sourced from the
    `elements[]` array in `bootstrap-static` (field `total_points`).
- Each row: player name, position, club kit, and points (GW or season total).
- The selected gameweek for the "This GW" tab follows the gameweek currently viewed on the
  Squad screen (via URL param) and can be navigated with prev/next controls.
- New proxy endpoints:
  - `GET /api/top-players/gameweek/:gw` — top players for a specific gameweek.
  - `GET /api/top-players/season` — top players for the full season.

## Capabilities

### New Capabilities
- `top-players`: Screen showing top FPL players by GW points or season total, in two tabs.

### Modified Capabilities
- None.

## Impact

- **Backend:** two new proxy endpoints; data already cached from existing FPL calls.
- **Frontend:** new route and screen with tab navigation.
- **No new FPL API calls** — data sourced from `bootstrap-static` and `/event/{gw}/live/`,
  both already used and cached.
