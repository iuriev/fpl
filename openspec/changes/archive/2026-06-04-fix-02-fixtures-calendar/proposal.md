# Proposal: Full-season Fixtures Calendar (FIX-02)

## Problem

The current app shows fixture difficulty for only the next 3 gameweeks, buried inside the
transfer planner. There is no dedicated place to plan around the full season schedule —
no way to spot double/blank gameweeks at a glance, compare team schedules, or identify
rotation risk from congested fixture runs.

## Solution

A new `/fixtures` screen: a scrollable season-wide FDR heatmap grid with 20 teams (A–Z) as
rows and GW1–GW38 as columns. The grid loads centred on the current gameweek and can scroll
freely in both directions.

Five view modes via tabs:

| Tab | Difficulty source |
|-----|------------------|
| Official | FPL's own FDR values (`team_h/a_difficulty` from `/fixtures/`) |
| Overall | Opponent overall strength (bootstrap `strength_overall_*`) normalised to 1–5 |
| Defensive | Opponent attack strength (relevant for GK/DEF) |
| Attacking | Opponent defence strength (relevant for MID/FWD) |
| Rest Days | Days between consecutive fixtures — colour-codes rotation risk |

Each cell handles three states uniformly: normal fixture, DGW (two stacked chips), BGW (neutral
grey dash). The Rest Days tab uses a separate colour scale (red = ≤3d, amber = 4–6d, green = ≥7d,
grey = time not yet announced). No blank spots in the grid — every cell renders.

Proxy fetches `GET /fixtures/` (full season, one call) and caches the processed response for
12 hours. No auth required; the screen is accessible to any team-ID user.

## User value

- Chip planning: instantly see which GWs have DGWs/BGWs for Bench Boost / Free Hit timing.
- Transfer planning: compare upcoming schedule difficulty across 38 GWs, not just 3.
- Rotation risk: Rest Days tab flags congested runs where premium players may be rotated.

## Scope

### In

- Proxy: extend `FPLBootstrapStatic.teams` with `strength_*` fields; add `getFixturesAll()`
  to fpl-client; new `fixtures-calendar-service.ts`; `GET /api/fixtures/calendar` (cache 12h).
- Web: `FixturesCalendarScreen`, `FixtureCell`, `CalendarGrid` with sticky team column and
  sticky GW header; 5-tab mode switcher; route `/fixtures`; `TeamInfoPanel` nav link; tests.

### Out of scope

- Custom team rating editor (user-defined 1–5 per team).
- Filtering or highlighting a specific team's row.
- Player-level minute-load comparison within the Recovery view.
- Push / alert when a DGW is announced mid-season.

## Backlog ID

**FIX-02** — Full-season Fixtures Calendar (FDR heatmap, DGW/BGW, Recovery views)
