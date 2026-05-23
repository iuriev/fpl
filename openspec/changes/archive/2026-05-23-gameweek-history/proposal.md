## Why

A manager wants to track how their team has progressed across the season — rank movement,
points scored each week, transfers made, team value, and bench points left on the table. The
FPL API provides a complete per-gameweek history for any team; surfacing it gives meaningful
season-level context that the gameweek-by-gameweek squad view alone cannot.

## What Changes

- Add a Gameweek History screen reachable from the team-info panel (and directly via URL).
- The screen shows a table of all played gameweeks with columns: GW, Overall Rank (OR), rank
  direction indicator (↑ / ↓ / —), Overall Points (OP), GW Rank (GWR), GW Points (GWP),
  Points on Bench (PB), Transfers Made (TM), Transfer Cost (TC), Team Value (£m).
- Add a new proxy endpoint `GET /api/entry/:teamId/history` backed by
  `GET /entry/{teamId}/history/` → `current[]`.

## Capabilities

### New Capabilities
- `gameweek-history`: Screen listing per-gameweek performance stats for the season.

### Modified Capabilities
- None.

## Impact

- **Backend:** new proxy endpoint `/api/entry/:teamId/history`.
- **Frontend:** new route and screen.
- **New FPL API call:** `GET /entry/{teamId}/history/` — not used in v1.0.
