# Design: Top Players

## Context

Two common questions: "who scored the most points this week?" and "who are the best players
this season?" Both are answerable from data the proxy already fetches and caches. This change
adds a Top Players screen with two tabs covering each question.

Scope: two new proxy endpoints, new screen with tab navigation. Visual design deferred.

## Goals / Non-Goals

**Goals:**
- Top Players screen with two tabs: **This GW** and **Season**.
- Each tab shows top 20 players (rank 1–20).
- **This GW tab:** ranked by `stats.total_points` from `/event/{gw}/live/`, for the gameweek
  selected by the user (prev/next navigation, bounded to finished gameweeks, defaults to current).
- **Season tab:** ranked by `total_points` from `bootstrap-static` `elements[]`.
- Each row: rank, kit icon, player name, position badge, club, points.
- New proxy endpoints:
  - `GET /api/top-players/gameweek/:gw`
  - `GET /api/top-players/season`

**Non-Goals:**
- Filtering by position or club (backlog).
- More than top 20 / pagination (backlog).
- Points breakdown per player (deferred — would need `/element-summary/{id}/`).

## UX Specification

### Screen layout
Full-page screen with back navigation. Heading: "Top Players". Segmented tab control:
**This GW** | **Season**. Below: the ranked list for the active tab.

### This GW tab
Gameweek selector (prev / next) in the subheader showing "GW N". Bounded to gameweeks 1 …
current (only finished GWs have reliable points). Defaults to the current gameweek.

### Season tab
Static list for the current season. No gameweek selector.

### Player row content

| Field | Source |
|---|---|
| Rank | derived (position in sorted list, 1-based) |
| Kit icon | `shirt_{teamCode}-66.png` from FPL CDN |
| Short name | `web_name` |
| Position badge | `element_type` → GK/DEF/MID/FWD |
| Club short name | `team.short_name` |
| Points | `stats.total_points` (GW tab) or `total_points` (Season tab) |

### Loading / error states
- **Loading:** skeleton rows.
- **Error:** inline error with retry.

## Decisions

**D1 — Top 20 only.** Sufficient to scan for household names and to avoid very long lists on
mobile. Can be extended later.

**D2 — No new FPL API calls.** Both data sources (`/event/{gw}/live/` and `bootstrap-static`)
are already fetched and cached by the proxy. The new endpoints are projections of existing
cached data.

**D3 — Proxy sorts and slices.** Sorting and slicing to top 20 happens in the proxy to keep
payloads small. Frontend receives a ready-ranked array.

**D4 — GW tab defaults to current GW.** The URL carries `?gw=N` so the selected gameweek is
shareable. If no `gw` param is present, the proxy's current-gameweek logic is used.

## Risks / Trade-offs

- Live data during an ongoing gameweek may change; the 60-second cache TTL (inherited from the
  squad endpoint) applies to the GW tab as well.
- Players with identical points are ordered by FPL's internal element ID (stable, arbitrary) —
  no secondary sort criterion in this version.
