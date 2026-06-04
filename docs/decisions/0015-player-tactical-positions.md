# ADR 0015: Player tactical positions for predicted lineups

## Status

Accepted (v2 — see `docs/predicted-lineups-positions.md`). **Ingest superseded by
[ADR 0016](0016-transfermarkt-tactical-positions.md)** (Transfermarkt offline scrape replaces
heuristic seed).

## Context

FPL exposes only four positions (`element_type`). Predicted lineups need granular roles
(`lb`, `cb`, `rb`, `dm`, `cm`, `am`, `lm`, `rm`, `lw`, `rw`, `st`), row quotas (e.g. 4 DEF = 2 CB + LB +
RB), and **secondary** positions when primary role players are unavailable.

## Decision

1. `proxy/src/data/player-tactical-roles.json` — `{ role, lane, secondary? }` per FPL `code`.
2. Selection and pitch assignment follow **`docs/predicted-lineups-positions.md`**.
3. Seed + `player-tactical-role-overrides.json`; refresh via `npm run lineups:seed-positions -w proxy`.

## Consequences

- Logic will change often; update the positions doc when quotas or fill rules change.
- External position feeds can replace seed heuristics without API shape changes.

## Supersedes

Initial v1 used `fb` / `w` roles and lane-only central minimums.
