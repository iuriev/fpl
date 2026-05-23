# Design: Gameweek History

## Context

The FPL API provides a full per-gameweek history for any team via
`GET /entry/{teamId}/history/` → `current[]`. This change surfaces it as a dedicated screen
(or full-page view) accessible from the team-info panel and directly via URL.

Scope: new proxy endpoint, new screen/route. Visual design deferred to a Claude Design pass.

## Goals / Non-Goals

**Goals:**
- Table of all played gameweeks, most recent first.
- Columns: GW, OR (overall rank), ↑/↓/— (rank direction), OP (cumulative overall points),
  GWR (gameweek rank), GWP (gameweek points), PB (points on bench), TM (transfers made),
  TC (transfer cost in points), £m (team value in millions).
- New proxy endpoint `GET /api/entry/:teamId/history`.
- Separate route: `/history?teamId=X`.

**Non-Goals:**
- Charts or trend visualisations (backlog).
- Past-seasons history (backlog — FPL `history.past[]` is a separate array; deferred).
- Chip history (backlog).

## UX Specification

### Screen layout
Full-page screen with a back navigation to the Squad screen. Heading: "Gameweek History" +
team name. Below the heading: "This Season" section label above the table.

### Table columns and data mapping

| Column | Label | FPL field | Notes |
|---|---|---|---|
| Gameweek | GW | `event` | "GW1" … "GW38" |
| Overall rank | OR | `overall_rank` | Formatted with thousand separator |
| Rank direction | ↑/↓/— | derived | Compare `overall_rank` to previous row's `overall_rank` |
| Overall points | OP | `total_points` | Cumulative |
| GW rank | GWR | `rank` | Formatted with thousand separator |
| GW points | GWP | `points` | Points scored that week |
| Points on bench | PB | `points_on_bench` | |
| Transfers made | TM | `event_transfers` | |
| Transfer cost | TC | `event_transfers_cost` | In points (0, 4, 8 …) |
| Team value | £m | `value` | Divide by 10 → e.g. 1039 → 103.9 |

The rank direction indicator (↑/↓/—) is derived on the frontend from adjacent rows: if
`overall_rank` decreased (improved) compared to the previous gameweek → ↑; increased → ↓;
unchanged → —. Colour: green for ↑, red for ↓, neutral for —.

### Empty / loading / error states
- **Loading:** skeleton rows matching the expected row count (38 max).
- **Error:** inline error message with a retry button.
- **No history yet** (team created this season but no GW played): empty state message.

## Decisions

**D1 — Proxy endpoint shape.** `GET /api/entry/:teamId/history` returns:
```
{ teamId, gameweeks: [ { gw, overallRank, overallPoints, gwRank, gwPoints, pointsOnBench,
  transfers, transferCost, teamValue } ] }
```
Camel-cased to match the rest of the proxy contract. `teamValue` already divided by 10.

**D2 — Rank direction computed on frontend.** The direction arrow requires comparing adjacent
rows, which is presentation logic. Keeping it in the frontend avoids baking display concerns
into the API.

**D3 — Most recent first.** The FPL history array is chronological; the proxy reverses it so
the most recent gameweek appears at the top of the table.

## Risks / Trade-offs

- For a team in their first gameweek, only one row is shown — no direction indicator is
  possible for the first row (rendered as —).
