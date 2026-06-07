# Proposal: PRED-09 prediction API (Postgres + batch scoring)

## Problem

The PRED-09 spike validated team Poisson, player-layer xPts, and hold-out metrics in Python
with local CSVs. Predictions must be served from **PostgreSQL** (not file cache or JSON blobs)
so the proxy can expose a stable API for PRED-02, PRED-05, PRED-07, and player profile UI.

## Solution

1. **Drizzle tables** `pred_*` (migration `0005_pred_09_tables`) — already drafted in schema.
2. **Ingest jobs** — load football-data matches and vaastav player-GW facts; optional live FPL backfill.
3. **Batch scorer** — train team Poisson, score target GW → `pred_player_gw` under a new `pred_model_run`.
4. **HTTP API** — `GET /api/predictions?event={gw}` returns latest completed run for that event.

Spike logic ports from `research/pred-09/models/` (TypeScript reimplementation or subprocess
runner — design defers to implementation tasks).

## Scope

### In

- Migration apply + `docs/db-schema.md` update
- Ingest: `pred_epl_match`, `pred_player_gw_fact`, `pred_team_alias`
- Batch: create `pred_model_run`, write `pred_team_strength`, `pred_fixture_team`, `pred_player_gw`
- Read API with types shared to web
- Cron/CLI entry: `npm run pred:score -w proxy` (name TBD)

### Out

- UI column changes (separate PRED-02 enhancement)
- Dixon–Coles ρ, bonus ML, paid odds feeds
- Real-time re-score on every bootstrap refresh (batch per GW deadline is enough for v1)

## Depends on

- OpenSpec `2026-06-04-pred-09-statistical-model-research` spike sign-off
- `research/pred-09/SPIKE_RESULTS.md` metrics

## Backlog

Enables **PRED-02+**, **PRED-05**, **PRED-07**, **PRED-10** phase 2.

## Effort

**L** — schema done; ingest + scorer + API remain.
