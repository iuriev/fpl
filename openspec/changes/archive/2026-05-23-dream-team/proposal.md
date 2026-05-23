## Why

After each gameweek FPL publishes a Dream Team — the 11 highest-scoring players of that week,
arranged in a valid formation. It is a popular reference point for managers to see who they
should have picked and to compare their own squad performance against the theoretical best XI.
The public FPL API exposes this data and it requires no auth.

## What Changes

- Add a Dream Team screen reachable from the main navigation.
- The screen shows the Dream Team for a selected gameweek: 11 players arranged on a pitch in
  their playing formation, each showing name, club, position, and gameweek points.
- Gameweek navigation (prev / next, bounded to finished gameweeks) lets the user browse past
  Dream Teams.
- Add a new proxy endpoint `GET /api/dream-team/:gw` backed by `GET /dream-team/{gw}/` from
  the FPL API, merged with player metadata from `bootstrap-static`.

## Capabilities

### New Capabilities
- `dream-team`: Screen showing the FPL Dream Team for a selected finished gameweek.

### Modified Capabilities
- None.

## Impact

- **Backend:** new proxy endpoint `/api/dream-team/:gw`.
- **Frontend:** new route and screen; reuses the pitch layout component from squad-view.
- **New FPL API call:** `GET /dream-team/{gw}/` — not used in v1.0.
