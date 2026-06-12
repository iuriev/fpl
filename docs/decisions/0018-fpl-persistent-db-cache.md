# ADR 0018: FPL persistent DB cache to minimise FPL API calls

- Status: Accepted
- Date: 2026-06-03
- Deciders: ivan.iuriev

## Context

The public FPL API has no documented rate limits but has been known to throttle or
temporarily block clients that make frequent requests. Our earlier architecture used an
in-memory cache (`cache.ts`) with short TTLs (minutes to hours). This cache was lost on
every process restart, causing a burst of FPL API requests each time the proxy rebooted.

Several FPL data types are effectively immutable once a gameweek finishes:

- GW live points — final once `event.data_checked = true`
- Dream team — final once `event.finished = true`
- Squad picks — final once `event.finished AND data_checked = true`

Storing these permanently in our own Postgres database means we never need to re-fetch
them from FPL. Only genuinely changing data (current-GW live, bootstrap) needs periodic
re-fetching, and even that can be done on a long TTL (12 hours) during the off-season or
pre-season.

The system also needs to handle season rollovers gracefully: when a new season starts,
old cached data must be retained for historical reference (never deleted) but excluded from
active lookups.

## Decision

Replace the in-memory-only FPL cache with a **persistent PostgreSQL-backed cache layer**
in `proxy/src/fpl-cache/db-cache.ts`. Seven new tables store FPL API responses:

| Table | Key | Frozen when |
|---|---|---|
| `fpl_meta` | `season` | — (config table) |
| `fpl_bootstrap_cache` | `season` | never — TTL-based |
| `fpl_gw_live_cache` | `(season, gw)` | `event.data_checked = true` |
| `fpl_squad_cache` | `(season, team_id, gw)` | `event.finished AND data_checked = true` |
| `fpl_dream_team_cache` | `(season, gw)` | `event.finished = true` |
| `fpl_history_cache` | `(season, team_id)` | staleness: `last_finished_gw` |
| `fpl_transfers_cache` | `(season, team_id)` | staleness: `last_finished_gw` |

**Key design decisions (D1–D5):**

- **D1 — Frozen rows never re-fetched.** A row with `frozen = true` is returned directly
  from the DB without any TTL check or FPL API call. This is the primary mechanism for
  eliminating FPL API traffic for historical gameweeks.

- **D2 — Season identity from GW1 deadline year.** Season is derived as `"YYYY-YY"` from
  the year part of GW1's `deadline_time`. This is stable and requires no extra API call.

- **D3 — Season rollover via `archived` flag.** When a new season is detected on bootstrap
  fetch, all old `fpl_bootstrap_cache` rows are marked `archived = true`. All other tables
  are partitioned by season PK so old rows are automatically ignored. Old data is never
  deleted — it remains available for historical queries.

- **D4 — History/transfers staleness by `last_finished_gw`.** History and transfers are not
  re-fetched on a wall-clock TTL; they are re-fetched only when a new gameweek finishes
  (`latestFinishedGw(bootstrapEvents) > cached.last_finished_gw`). This means at most one
  FPL API call per team per gameweek for these endpoints.

- **D5 — Adaptive bootstrap TTL.** Bootstrap TTL is determined by season state:
  - Pre-season / between GWs (no `is_current` event): 12 hours
  - Active season: 12 hours
  - Season complete (`fpl_meta.is_complete = true`): 168 hours (1 week)

**TTL for current-GW live data:** 3 hours (only used when `frozen = false`).

**Startup prefetch (`fpl-cache/prefetch.ts`):** On service start, a fire-and-forget
background job queries the DB for missing frozen GW live and dream-team rows, then fetches
them from FPL with 1 req/s rate limiting and a hard cap of 10 total requests per startup.
This means the DB fills up quickly after a first deployment, with no impact on request
latency.

**In-memory cache (`cache.ts`) retained** for non-FPL data (computed results like
`player-pool` and `fixtures` that aggregate multiple sources). FPL-specific TTL constants
previously in `cache.ts` have been removed.

## Consequences

**Positive:**
- Finished-gameweek data is fetched from FPL exactly once, ever. Process restarts have zero
  FPL API cost for historical gameweeks.
- Long TTLs during off-season and pre-season drastically reduce FPL API traffic.
- The DB is the single source of truth for FPL data; multiple proxy instances (if ever
  scaled) share the same cache naturally.
- Season rollovers are handled automatically with no data loss.

**Negative / watch:**
- The proxy now has a hard DB dependency for all FPL data. If the DB is unavailable the
  service degrades.
- `db-cache.ts` is a new abstraction layer; bugs there affect all endpoints uniformly.
- The DB will grow over time (one row per team per gameweek for squad/history/transfers).
  At FPL scale this is manageable (≤38 GWs, tens of thousands of teams queried), but
  a periodic archival job may be needed years from now.

## Alternatives considered

- **Keep in-memory cache with longer TTLs** — rejected; still loses state on restart; still
  must re-fetch everything after a redeployment.
- **Redis** — rejected; adds operational complexity with no benefit over Postgres for this
  access pattern (reads by exact PK).
- **Cache only bootstrap, keep FPL calls for the rest** — rejected; provides little
  protection against rate-limiting on live/squad/history endpoints.
