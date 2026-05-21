# ADR 0002: MVP scope — squad viewer

- Status: Accepted
- Date: 2026-05-21
- Deciders: ivan.iuriev, Claude

## Context

The full feature set is intentionally undecided and will grow iteratively. We want the
fastest path to a working, useful product, and a small surface to validate the
proxy + SPA architecture and the FPL data contract.

## Decision

The MVP delivers exactly one capability, with no authentication:

1. The user enters their public FPL **team ID**.
2. The app shows the squad for a gameweek: 15 players, split into starters / bench, with the
   captain (and vice-captain) marked.
3. Each player shows the points they scored in that gameweek.
4. The user can navigate between gameweeks (previous / next), starting from the current one.

## Consequences

- Data needs: `bootstrap-static/` (players, current gameweek), `entry/{id}/event/{gw}/picks/`
  (squad), and per-player points for the gameweek (`event/{gw}/live/`). This defines the first
  proxy contract.
- Keeps the first build small and shippable; everything else is layered on later.

## Explicitly deferred (not in MVP)

- Gameweek summary (team total, average/highest score, bonus breakdown).
- Live scoring (in-match point recalculation).
- Mini-league standings, fixture analysis, predictions, AI assistant.

## Alternatives considered

- **Include a gameweek summary in the MVP.** Deferred to keep scope minimal; cheap to add as
  the next iteration once the squad view works.