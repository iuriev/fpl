# Design: Dream Team

## Context

FPL publishes a Dream Team for each finished gameweek: the 11 highest-scoring players of that
week, selected in a valid formation. The public API endpoint `GET /dream-team/{gw}/` returns
this data. This change surfaces it as a dedicated screen using the existing pitch layout
component.

Scope: new proxy endpoint, new screen/route. Visual design deferred to a Claude Design pass.

## Goals / Non-Goals

**Goals:**
- Dream Team screen showing the 11-player pitch layout for a selected finished gameweek.
- Gameweek navigation (prev / next), bounded to finished gameweeks only. Defaults to the most
  recently finished gameweek.
- Each player card: short name, position, club, gameweek points.
- New proxy endpoint `GET /api/dream-team/:gw`.
- Route: `/dream-team?gw=N`.

**Non-Goals:**
- Bench players (the Dream Team is 11 only).
- Formation choice (the FPL API returns a pre-formed 11; formation is implicit in positions).
- Captain / vice-captain markers (Dream Team has no captaincy concept).
- Live / in-progress gameweeks (Dream Team is only meaningful for finished GWs).

## UX Specification

### Screen layout
Full-page screen with back navigation. Heading: "Dream Team" + "GW N". Gameweek navigator
(prev / next) in the subheader.

### Pitch layout
Reuses the existing `Pitch` and `PlayerCard` (or equivalent) components from the squad view.
Players are arranged by `position` returned by the FPL API. The FPL dream-team response
includes `position` for each element (1 = GK, 2–5 = DEF, 6–9 = MID, 10–11 = FWD, reflecting
the typical 3–4–3 or 4–3–3 selection). The proxy maps this to standard rows.

### Player card content

| Field | Source |
|---|---|
| Kit icon | `shirt_{teamCode}-66.png` from FPL CDN |
| Short name | `web_name` from bootstrap-static |
| Position | `element_type` → GK/DEF/MID/FWD |
| Club short name | `team.short_name` |
| GW points | `points` from dream-team response |

### Loading / error states
- **Loading:** pitch skeleton (same as squad-view skeleton).
- **Error:** inline error with retry.
- **Future / not-yet-finished gameweek selected:** error message explaining the Dream Team is
  not yet available; nav controls prevent selecting future GWs.

## Decisions

**D1 — Reuse pitch layout.** The `Pitch` component already renders rows of players. The Dream
Team screen passes its 11 players to the same component, just without a bench row. Avoids
duplicating pitch layout logic.

**D2 — Bounded to finished gameweeks.** The FPL dream-team endpoint returns no data for
in-progress or future gameweeks. Navigation is capped at the most recently finished GW.

**D3 — Proxy merges metadata.** `GET /dream-team/{gw}/` returns element IDs and points but no
names or club info. The proxy merges with `bootstrap-static` `elements[]` to produce a
complete player shape, matching the pattern used in `/api/squad`.

**D4 — Cache TTL.** The Dream Team for a finished gameweek is immutable. Cache for 24 hours
(same as finished-gameweek squad data, per the existing caching policy).

## Risks / Trade-offs

- The FPL dream-team endpoint is undocumented; its shape could change. Mitigation: the proxy
  abstracts it, so the frontend is insulated.
- Formation varies by gameweek (the 11 players might be in 3-4-3, 4-3-3, etc.). The proxy
  reports raw position rows; the pitch component already handles variable row sizes.
