# Proposal: Predicted lineups background warmup (PRED-08)

## Problem

`GET /api/predicted-lineups` cold-starts ~400+ sequential FPL `element-summary` calls
(rate-limited in-process). A proxy restart or first premium visit triggers a multi-minute FPL
burst and risks throttling. Summaries are cached in memory only (6 h), not in Postgres.

## Solution

1. **Persist** `element-summary` in `fpl_element_summary_cache` (season + element_id).
2. **Single FPL request queue** with priorities: interactive (~10/s) vs background (default 5 s).
3. **Background warmup job** after server start: fixtures → hot players (top minutes per club)
   → rebuild lineups cache → cold tail → maintenance refresh before TTL.
4. **Warmup status** on `/health` for ops visibility.

## Scope

### In

- Migration + `docs/db-schema.md`
- `fpl-request-queue`, `fpl-element-summary-cache`, `lineups-warmup`, `lineups-player-sets`
- Wire `predicted-lineup-service` to DB-backed summaries + queue
- Startup hook + `LINEUPS_WARMUP_*` env vars
- Proxy tests for queue priority and player tiering

### Out

- Replacing `element-summary` with vaastav for formation (pred-09 follow-up)
- Precomputed `fpl_predicted_lineups_cache` table (v2; v1 uses existing 10 min memory cache)

## Depends on

- Archived PRED-08 predicted lineups feature
- FPL persistent DB cache (`fpl_bootstrap_cache`)

## Backlog

Reduces FPL ban risk; makes premium lineups usable immediately after warm tier completes.

## Effort

**M** — one migration, queue module, warmup job, service integration.
