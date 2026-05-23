## Why

The Squad screen currently shows no persistent team identity or aggregate stats — the manager's
name, overall rank, and total points are visible only fleetingly in the entry flow and then
disappear. A dedicated team-info panel gives the manager a constant reference point for who they
are looking at and how that team is performing overall, without navigating away from the squad.

## What Changes

- Add a team-info panel showing: team name, manager name, country flag, overall points, overall
  rank, total FPL players (season baseline), and current-gameweek points.
- On desktop the panel appears as a left sidebar alongside the squad. On mobile it appears as a
  compact header section above the pitch/list.
- The panel includes a "Gameweek History" link/button that navigates to the Gameweek History
  screen (see `gameweek-history` change).
- Data sourced from the existing `/api/entry/:teamId` proxy endpoint plus `total_players` from
  bootstrap-static; the proxy entry response is extended to include `overall_points`,
  `overall_rank`, `event_points`, `total_players`, and `player_region_iso_code_short`.

## Capabilities

### New Capabilities
- `team-info-panel`: Persistent panel showing team identity and aggregate performance stats
  alongside the squad.

### Modified Capabilities
- `squad-view`: Layout updated to accommodate the panel (sidebar on desktop, header on mobile).

## Impact

- **Backend:** extends the `/api/entry/:teamId` response with additional fields already
  available from the FPL `/entry/{teamId}/` endpoint — additive, no breaking change.
- **Frontend:** new panel component; Squad screen layout changes (two-column on desktop).
- **No new FPL API calls** — all data is in endpoints already used.
