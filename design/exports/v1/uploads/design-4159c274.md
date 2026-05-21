## Context

Greenfield MVP. Architecture is a React + Vite SPA talking to a thin Node proxy that fronts
the public FPL API (ADR 0001); scope is the squad viewer only (ADR 0002). No authentication —
the user is identified by a public team ID. Mobile-first, also usable on desktop.

This document defines the **UX** (screens, content, states, navigation) and the **technical
approach** (proxy data contract, caching, how key values are derived). It does not define the
visual design system (colors, typography, spacing) — that comes later via the Claude Design
step. It contains no application code; implementation follows in tasks.

## Goals / Non-Goals

**Goals:**
- A clear, approvable description of every screen and its states.
- A proxy data contract that keeps the frontend simple.
- Decisions on how "current gameweek", navigation bounds, and player points are derived.

**Non-Goals:**
- Visual design system / pixel layout (deferred to Claude Design).
- Live in-match scoring, gameweek totals, leagues, fixtures, predictions.
- Final framework/library choices beyond direction (settled at scaffolding).

## UX Specification

The app has two screens: **Entry** and **Squad**. On load, if a team ID is remembered the app
goes straight to Squad; otherwise it shows Entry.

### Screen 1 — Entry

Purpose: capture and validate a public FPL team ID.

Content:
- App title and a one-line explainer ("See your FPL squad and points — just enter your team ID").
- A numeric input for the team ID.
- A primary "View squad" button.
- Helper text on where to find the ID: it is the number in the FPL URL,
  `fantasy.premierleague.com/entry/{ID}/event/{GW}`.

States:
- **Idle**: empty input; primary button disabled until something is typed.
- **Invalid format**: non-numeric / non-positive input → inline message, no network request.
- **Submitting**: button shows a loading state; input disabled.
- **Not found**: valid-looking ID that FPL does not recognize → inline error "We couldn't find
  a team with that ID", stay on Entry.
- **Unreachable**: proxy/upstream error → error message with a "Try again" action.
- **Success**: remember the ID and navigate to Squad (default gameweek = current).

### Screen 2 — Squad

Purpose: show the team's squad and per-player points for a gameweek, with gameweek navigation.

Layout (mobile-first; centered with a max width on desktop):
1. **Header bar**
   - Team name (from FPL) and a small "Change" affordance to return to Entry / enter a new ID.
   - Gameweek control: "‹  Gameweek N  ›" with previous/next buttons.
2. **Gameweek summary strip** — stats for the selected gameweek: the team's total points
   (emphasized in the centre), the gameweek average and highest scores, the team's gameweek
   rank, and transfers made. Updates as the gameweek changes.
3. **Pitch** — a football-pitch view like the official FPL app: the starting XI is placed on the
   pitch in rows by position (GK at the back, then DEF, then MID, then FWD toward the front).
   Each player is a token/card positioned on the pitch.
4. **Bench** — a strip below the pitch with the 4 bench players in the order FPL returns.

Per-player entry content:
- Player short name (e.g. "Saka").
- Position badge: GK / DEF / MID / FWD.
- Club short name (e.g. "ARS").
- Gameweek points (number). This is the player's own gameweek score (captain doubling is not
  applied to the per-player figure — see Decisions).
- Captain "C" / vice-captain "V" badge where applicable.
- Availability indicator when the player is flagged (doubtful / injured / suspended /
  unavailable); none when fully available.

Selecting a flagged player reveals their availability details (the FPL news text and chance of
playing when provided).

States:
- **Loading**: skeleton placeholders for header + player rows.
- **Loaded**: squad rendered as above.
- **Summary value unavailable**: a missing summary value (e.g. rank for an in-progress
  gameweek) shows a placeholder dash, not an error.
- **Empty (no picks for this gameweek)**: friendly message "No squad available for Gameweek N"
  (e.g. a gameweek before the team existed). Navigation remains usable.
- **Error**: "Couldn't load this gameweek" with a "Try again" action.
- **Navigation bounds**: at the earliest gameweek the "previous" button is disabled; at the
  current (latest available) gameweek the "next" button is disabled.

### Navigation behavior

- Default gameweek on entry = the current gameweek; in the off-season = the most recent gameweek
  with data.
- Previous/next move one gameweek within the bound range `1 … current`. Future gameweeks are not
  reachable because their squads do not exist until the deadline passes.
- The selected gameweek is always labelled in the header.

## Decisions

### D1 — The proxy composes UI-ready responses (not a raw pass-through)
The proxy exposes endpoints shaped for the UI rather than mirroring raw FPL endpoints:
- `GET /api/gameweeks` → `{ current, gameweeks: [{ id, name, finished }] }` (drives navigation/default).
- `GET /api/entry/:teamId` → `{ teamId, teamName, managerName }` (validates the ID, header text).
- `GET /api/squad/:teamId/:gw` → composed squad: gameweek meta, a `summary` object, plus
  `starters[]` and `bench[]` where each player is `{ name, position, club, points, isCaptain,
  isViceCaptain, status, chanceOfPlaying, news }`. The `summary` is
  `{ totalPoints, averagePoints, highestPoints, rank, transfers }`.

The proxy assembles `/api/squad` from FPL's `bootstrap-static` (player/team/position metadata,
player availability status, and the gameweek average/highest scores),
`entry/{id}/event/{gw}/picks` (picks + captain flags + the team's `entry_history` for
total/rank/transfers), and `event/{gw}/live` (per-player points).

Rationale: keeps the frontend "dumb" (no FPL data-shape knowledge), fewer client round-trips,
and isolates all FPL quirks in one place.
Alternative considered: thin pass-through proxy with the client composing data — rejected for
MVP because it pushes FPL-specific mapping and multi-request orchestration into the browser.

### D2 — Caching in the proxy
Initial default TTLs below; these are starting values, tunable later without behavior change:
- `bootstrap-static` (players/teams/gameweeks): **1 hour**.
- `entry/:teamId` (team name): **1 hour**.
- Squad/points for a **finished** gameweek (immutable): **24 hours**.
- Squad/points for the **current** gameweek (still settling): **60 seconds**; no live polling
  in this change.
Rationale: cut load on the unofficial FPL API and speed up navigation between past gameweeks.
The current-gameweek TTL is intentionally short so points stay reasonably fresh without polling.

### D3 — Deriving the current gameweek and navigation bounds
"Current gameweek" = the `events` entry flagged current in `bootstrap-static`; if none exists
(off-season), the latest `finished` gameweek. The navigation upper bound equals this value.

### D4 — Per-player points are the raw player score
We display each player's own gameweek points. Captain multiplication affects team totals, which
are out of scope; showing doubled captain points without a total would be confusing. The "C"
badge communicates captaincy.

### D5 — Library/framework specifics deferred
Direction: React Query (or equivalent) for client-side fetching/caching/loading-error states.
Proxy framework: **Hono** (see ADR 0003).

### D6 — Gameweek summary values
Total points is the team's net gameweek score (points minus any transfer-cost hit). Average and
highest come from `bootstrap-static` events (`average_entry_score`, `highest_score`); rank and
transfers come from the picks response's `entry_history` (`rank`, `event_transfers`). Any value
the API has not yet produced is shown as a placeholder.

## Risks / Trade-offs

- The FPL API is unofficial and undocumented → it may change shape or rate-limit. Mitigation:
  isolate all mapping in the proxy and cache aggressively; one place to fix if it changes.
- No CORS / no availability guarantee → the proxy is mandatory and must surface clear errors;
  the UX defines explicit error/retry states.
- Server-side composition couples the proxy to UI needs → acceptable for an MVP with a single
  consumer; revisit if more clients appear.
- Users may expect to browse future gameweeks → out of scope and impossible (no picks yet);
  documented in the `gameweek-navigation` spec and surfaced via disabled "next" at the bound.

## Open Questions

None outstanding for this change.

Resolved:
- Proxy framework = Hono (ADR 0003).
- Squad presentation = football-pitch layout (like the official FPL app).
- Cache TTLs = initial defaults in D2 (tunable later).