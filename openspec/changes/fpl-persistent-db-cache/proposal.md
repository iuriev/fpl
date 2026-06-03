# Proposal: FPL Persistent DB Cache (CACHE-01)

## Problem

The proxy uses an in-memory cache that evaporates on every process restart. On Fly.io (and
any single-process host) this means each cold start re-fetches all FPL data from scratch.
More importantly, finished-gameweek data is immutable — once `data_checked=true` the FPL
API will never return different values for that gameweek — yet we re-fetch it indefinitely.
This creates unnecessary load on the unofficial FPL API and risks rate-limiting or IP bans.

## Solution

Persist FPL API responses in the existing Supabase Postgres database. Four new tables store
bootstrap metadata, per-gameweek live data, and per-team squad picks. A `frozen` flag marks
rows whose source data is permanently immutable; frozen rows are never re-fetched. TTLs are
reduced during the pre-season and between-gameweek quiet periods to cap API usage further.

Season identity is derived from the GW1 deadline year in `bootstrap-static`. On season
rollover, old cache rows are archived (not deleted) and a fresh partition begins.

## User value

- No visible change to the user — same data, same latency (DB reads are faster than FPL API).
- Eliminates spurious FPL API calls for historical data that will never change.
- Provides a safety margin against rate-limiting during high-traffic periods.

## Scope

### In

- Four new DB tables: `fpl_meta`, `fpl_bootstrap_cache`, `fpl_gw_live_cache`, `fpl_squad_cache`.
- DB-backed cache layer in the proxy, replacing in-memory FPL caching for bootstrap, live,
  and squad endpoints.
- Season-aware partitioning with `archived` flag for rollover.
- Adaptive TTL tiers based on season state (pre-season, active, complete).
- Background prefetch of missing frozen GW live data on service start (rate-limited).
- Updated `docs/db-schema.md` and a new ADR documenting the caching decision.

### Out of scope

- In-memory cache (`cache.ts`) for non-FPL endpoints — kept as-is.
- Entry (manager summary) caching — no change; in-memory TTL is sufficient.
- Fixtures and player-pool caching — not changed in this iteration.
- UI changes of any kind.
- Backfilling squad picks for past team IDs proactively (fetched lazily per user request).

## Non-goals

- Real-time live scoring (sub-minute updates); the TTL floor is 3 hours during active GWs.
- Cross-season data analytics or history queries.
- Cache invalidation via FPL webhooks (FPL has no such API).

## Dependencies

- Supabase Postgres already provisioned (AUTH-01).
- Drizzle ORM already in use in `proxy/src/db/`.
