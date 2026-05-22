## Why

Mini-league rankings are a core part of the FPL experience — managers care not just about
their overall rank but about where they stand in their private leagues, country leagues, and
other group competitions. Surfacing this data in one screen gives a quick read on competitive
position across all leagues the manager is enrolled in.

## What Changes

- Add a My Stats screen reachable from the main navigation.
- The screen shows two sections — General (Classic) Leagues and Head-to-Head Leagues — each
  listing league name, current entry rank, and a direction indicator (moved up / moved down /
  unchanged vs previous gameweek).
- Add a new proxy endpoint `GET /api/entry/:teamId/leagues` backed by the `leagues` object
  already included in the FPL `/entry/{teamId}/` response (`classic[]` and `h2h[]`).

## Capabilities

### New Capabilities
- `leagues-stats`: Screen showing the manager's rankings across all enrolled leagues.

### Modified Capabilities
- None.

## Impact

- **Backend:** new proxy endpoint `/api/entry/:teamId/leagues`.
- **Frontend:** new route and screen.
- **No new FPL API calls** — `leagues` data is already part of the `/entry/{teamId}/` response.
