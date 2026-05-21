# ADR 0005: Expand MVP scope — player statuses and gameweek summary

- Status: Accepted
- Date: 2026-05-21
- Deciders: ivan.iuriev, Claude
- Supersedes: [ADR 0002](0002-mvp-scope.md)

## Context

After reviewing the official FPL app, the user identified two elements worth having in the MVP
that ADR 0002 had omitted or deferred:

1. **Player availability statuses** — the official app flags players who are injured,
   suspended, or doubtful (e.g. a warning icon on the player). This is genuinely useful at a
   glance and the data is in the public API (`status`, `chance_of_playing_this_round`, `news`).
2. **A per-gameweek team summary** — the official app shows a stats strip: the team's total
   points, the gameweek average and highest scores, the team's gameweek rank, and the number of
   transfers made. ADR 0002 had explicitly deferred a gameweek summary; the user now wants it in
   the MVP. All values are available from the public API.

## Decision

Expand the MVP (the `mvp-squad-viewer` change) to add two capabilities:

- `player-status`: show an availability indicator on flagged players, with details on demand.
- `gameweek-summary`: show the five-stat per-gameweek summary (total, average, highest, rank,
  transfers).

The squad presentation stays **pitch-only** for the MVP.

## Consequences

- The MVP grows modestly. No new data sources — both additions come from FPL endpoints already
  used by the squad view (`bootstrap-static`, `entry/{id}/event/{gw}/picks`).
- The proxy's `/api/squad` response gains player status fields and a `summary` object.

## Explicitly deferred (tracked in `docs/backlog.md`)

- **List View** toggle (Pitch/List) — planned for the next version.
- **Team of the Week** — separate feature, deferred but recorded so it is not forgotten.
- Live in-match scoring, mini-leagues, fixtures, predictions, AI assistant (from ADR 0002).

## Alternatives considered

- **Keep the MVP minimal (per ADR 0002).** Rejected: the user judged statuses and the gameweek
  summary high-value and low-cost given the data is already fetched.
