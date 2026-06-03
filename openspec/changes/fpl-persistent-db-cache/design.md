# Design: FPL Persistent DB Cache (CACHE-01)

## Context

The proxy currently caches all FPL API responses in memory with fixed TTLs. The in-memory
cache is fast but ephemeral — every process restart discards it. For a single Fly.io machine
this means each cold start hammers the FPL API for data that is, in most cases, permanently
immutable. The goal of this change is to move FPL caching to Postgres so that frozen data is
stored once and never re-fetched, while live data is refreshed only as often as necessary.

This document covers the DB schema, season lifecycle, TTL strategy, and the request/response
flow for each affected endpoint. It does not cover UI or API contract changes — none are made.

---

## DB Schema

Four new tables are added to `proxy/src/db/schema.ts`.

### `fpl_meta`

Tracks the active season and whether it is complete.

| Column | Type | Notes |
|--------|------|-------|
| `season` | text PK | Derived from GW1 deadline year, e.g. `"2025-26"` |
| `is_complete` | boolean | Set `true` when GW38 `finished=true AND data_checked=true` |
| `created_at` | timestamp | |

### `fpl_bootstrap_cache`

Stores the last-fetched `bootstrap-static` response.

| Column | Type | Notes |
|--------|------|-------|
| `id` | serial PK | |
| `season` | text FK → `fpl_meta.season` | |
| `data` | jsonb | Full `bootstrap-static` response |
| `fetched_at` | timestamp | |
| `archived` | boolean | `true` when season has rolled over |

Only the latest non-archived row for the current season is ever read.

### `fpl_gw_live_cache`

Stores `event/{gw}/live/` responses. Frozen once `data_checked=true`.

| Column | Type | Notes |
|--------|------|-------|
| `season` | text | PK component |
| `gw` | integer | PK component |
| `data` | jsonb | Full live response |
| `frozen` | boolean | `true` once the event's `data_checked=true`; never updated after |
| `fetched_at` | timestamp | |

Primary key: `(season, gw)`.

### `fpl_squad_cache`

Stores `entry/{teamId}/event/{gw}/picks/` responses. Frozen on the same condition as live data.

| Column | Type | Notes |
|--------|------|-------|
| `season` | text | PK component |
| `team_id` | integer | PK component |
| `gw` | integer | PK component |
| `data` | jsonb | Full picks response |
| `frozen` | boolean | `true` once the event's `data_checked=true` |
| `fetched_at` | timestamp | |

Primary key: `(season, team_id, gw)`.

---

## Season Identity

The season string is derived deterministically from bootstrap-static at runtime:

```
season = GW1.deadline_time year + "-" + (year + 1)[last 2 digits]
e.g. deadline "2025-08-16T11:00:00Z" → "2025-26"
```

On every bootstrap fetch, the derived season is compared against the stored `fpl_meta`
season. If they differ, a new season has started:

1. All rows in `fpl_bootstrap_cache`, `fpl_gw_live_cache`, and `fpl_squad_cache` with the
   old season stay untouched but are never read again (treated as archived implicitly by the
   season key mismatch; `fpl_bootstrap_cache` rows are also explicitly marked `archived=true`).
2. A new `fpl_meta` row is inserted for the new season.
3. All subsequent DB reads/writes use the new season key.

Old season data is preserved for audit purposes and never deleted by application code.

---

## TTL Tiers

Season state is derived each time from the bootstrap `events` array. No separate flag is
stored for "pre-season" — it falls out naturally from the absence of an `is_current` event.

| State | Condition | Bootstrap TTL | Current-GW live TTL |
|-------|-----------|--------------|---------------------|
| Pre-season / between GWs | `!events.some(e => e.is_current)` | **12 hours** | — |
| Active season | `events.some(e => e.is_current)` | **12 hours** | **3 hours** |
| Season complete | `fpl_meta.is_complete = true` | **168 hours (1 week)** | — |

Form data (`elements[].form`) lives inside bootstrap-static. A 12-hour TTL everywhere means
form can lag by up to 12 hours — this is acceptable per product decision.

---

## Request Flow per Endpoint

### Bootstrap (`/api/gameweeks`, player metadata, etc.)

```
1. Read latest fpl_bootstrap_cache row where season = current AND archived = false
2. Derive TTL from season state (see tier table above)
3. If row exists AND fetched_at > now - TTL → return data from DB
4. Fetch bootstrap-static from FPL API
5. Derive season from response
6. If season changed → archive old rows, insert new fpl_meta row
7. Upsert fpl_bootstrap_cache (new row with current season)
8. If GW38 finished+data_checked → set fpl_meta.is_complete = true
9. Return data
```

### GW Live Data (`/event/{gw}/live/`)

```
1. Look up fpl_gw_live_cache for (season, gw)
2. If row exists AND frozen = true → return data from DB (0 FPL API calls, ever)
3. If row exists AND fetched_at fresh (within current-GW TTL) → return from DB
4. Fetch event/{gw}/live/ from FPL API
5. Determine frozen: check if corresponding event in bootstrap has data_checked = true
6. Upsert fpl_gw_live_cache with frozen flag
7. Return data
```

### Squad Picks (`/entry/{teamId}/event/{gw}/picks/`)

```
1. Look up fpl_squad_cache for (season, team_id, gw)
2. If row exists AND frozen = true → return from DB (0 FPL API calls, ever)
3. If row exists AND fetched_at fresh → return from DB
4. Fetch entry/{teamId}/event/{gw}/picks/ from FPL API
5. Determine frozen: event.finished AND event.data_checked from bootstrap
6. Upsert fpl_squad_cache with frozen flag
7. Return data
```

Current active GW squad/live data is cached in DB with the 3-hour TTL. `frozen` is only set
to `true` after `data_checked=true` on that event — until then the row is refreshed normally.

---

## Startup Prefetch

On service start, a background (non-blocking) task runs:

1. Load bootstrap from DB (or fetch if stale).
2. Collect all GW IDs where `finished=true AND data_checked=true`.
3. Query `fpl_gw_live_cache` for the current season to find which GWs are missing.
4. For each missing GW: fetch live data from FPL API and persist with `frozen=true`.
5. **Rate limit:** 1 request/second, **max 10 requests per startup** to avoid thundering herd.
6. Squad picks (`fpl_squad_cache`) are **not** prefetched — too many team IDs; fetched lazily.

The 10-request cap means a brand-new deployment catches up over multiple starts, not all at once.
This is intentional — a fresh deployment on a 30-GW-deep season should not make 30 requests
in 30 seconds.

---

## Existing In-Memory Cache

`cache.ts` is kept unchanged. Non-FPL-data caching (e.g. any internal computations) continues
to use it. FPL-specific services (`gameweeks-service.ts`, `squad-service.ts`, etc.) are updated
to use the new DB-backed cache helpers instead of calling `cache.get`/`cache.set` directly.

The `ttl` constants in `cache.ts` for FPL endpoints (`BOOTSTRAP`, `SQUAD_FINISHED`, etc.) are
removed or left unused once the DB layer is in place; they are not referenced from non-FPL code.

---

## Decisions

**D1 — Season key from GW1 deadline, not from an FPL-provided field.**
FPL bootstrap-static has no explicit season field. GW1 deadline year is stable, deterministic,
and observable without any FPL API change. If FPL adds an explicit season field in future, the
derivation function can be updated in one place.

**D2 — Archive, never delete.**
Old season rows consume minimal space (one JSONB blob per GW, one per team-GW). Keeping them
enables forensic debugging and potential future cross-season features without a migration.

**D3 — No prefetch of squad picks.**
A squad pick requires a team ID. Proactively fetching all team IDs that have ever appeared in
watchlists would require a join and could generate many requests on a fresh deployment. Lazy
fetch on first user request is simpler and sufficient.

**D4 — 3-hour floor on current-GW live TTL.**
FPL live data updates at fixture completion, typically once every 90 minutes. A 3-hour TTL
means we may serve stale bonus points for up to 3 hours post-match, which is acceptable given
the product's non-real-time nature. The original 5-minute TTL was overly aggressive for a
non-live-scoring app.
