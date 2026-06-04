# Design: FPL Persistent DB Cache (CACHE-01)

## Context

The proxy currently caches all FPL API responses in memory with fixed TTLs. The in-memory
cache is fast but ephemeral — every process restart discards it. For a single Fly.io machine
this means each cold start hammers the FPL API for data that is, in most cases, permanently
immutable. The guiding principle of this change: **store everything possible in Postgres; go
to the FPL API only when truly necessary.**

This document covers the DB schema, season lifecycle, TTL strategy, and the request/response
flow for each affected endpoint. It does not cover UI or API contract changes — none are made.

---

## DB Schema

Seven new tables are added to `proxy/src/db/schema.ts`.

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

Stores `entry/{teamId}/event/{gw}/picks/` responses. Frozen once `data_checked=true`.

| Column | Type | Notes |
|--------|------|-------|
| `season` | text | PK component |
| `team_id` | integer | PK component |
| `gw` | integer | PK component |
| `data` | jsonb | Full picks response |
| `frozen` | boolean | `true` once the event's `data_checked=true` |
| `fetched_at` | timestamp | |

Primary key: `(season, team_id, gw)`.

### `fpl_dream_team_cache`

Stores `dream-team/{gw}/` responses. Frozen once the GW is finished.

| Column | Type | Notes |
|--------|------|-------|
| `season` | text | PK component |
| `gw` | integer | PK component |
| `data` | jsonb | Full dream-team response |
| `frozen` | boolean | `true` once `event.finished=true`; never updated after |
| `fetched_at` | timestamp | |

Primary key: `(season, gw)`.

### `fpl_history_cache`

Stores `entry/{teamId}/history/` responses. Refreshed only when a new GW has been finished
since the last fetch; all past GW entries in the history are immutable.

| Column | Type | Notes |
|--------|------|-------|
| `season` | text | PK component |
| `team_id` | integer | PK component |
| `data` | jsonb | Full history response |
| `last_finished_gw` | integer | Latest finished GW id at time of fetch; refresh trigger |
| `fetched_at` | timestamp | |

Primary key: `(season, team_id)`.

Refresh condition: re-fetch only when `bootstrap.latestFinishedGw > last_finished_gw`.
Once `fpl_meta.is_complete=true`, the row is frozen and never re-fetched.

### `fpl_transfers_cache`

Stores `entry/{teamId}/transfers/` responses. Transfers are immutable once made; same refresh
logic as history.

| Column | Type | Notes |
|--------|------|-------|
| `season` | text | PK component |
| `team_id` | integer | PK component |
| `data` | jsonb | Full transfers response |
| `last_finished_gw` | integer | Latest finished GW id at time of fetch |
| `fetched_at` | timestamp | |

Primary key: `(season, team_id)`.

---

## Season Identity

The season string is derived deterministically from bootstrap-static at runtime:

```
season = GW1.deadline_time year + "-" + (year + 1)[last 2 digits]
e.g. deadline "2025-08-16T11:00:00Z" → "2025-26"
```

On every bootstrap fetch, the derived season is compared against the stored `fpl_meta`
season. If they differ, a new season has started:

1. `fpl_bootstrap_cache` rows for the old season are marked `archived=true`.
2. All other cache tables implicitly ignore old season data via the season PK component.
3. A new `fpl_meta` row is inserted for the new season.
4. All subsequent DB reads/writes use the new season key.

Old season data is preserved for audit purposes and never deleted by application code.

---

## TTL Tiers

Season state is derived from the bootstrap `events` array. No separate flag is stored for
"pre-season" — it falls out naturally from the absence of an `is_current` event.

| State | Condition | Bootstrap TTL | Current-GW live/squad TTL |
|-------|-----------|--------------|---------------------------|
| Pre-season / between GWs | `!events.some(e => e.is_current)` | **12 hours** | — |
| Active season | `events.some(e => e.is_current)` | **12 hours** | **3 hours** |
| Season complete | `fpl_meta.is_complete = true` | **168 hours (1 week)** | — |

Form data (`elements[].form`) lives inside bootstrap-static. A 12-hour TTL means form can lag
by up to 12 hours — acceptable per product decision.

---

## Request Flow per Endpoint

### Bootstrap

Used by: `gameweeks-service`, `squad-service`, `top-players-service`, `leaderboard-service`,
`team-of-the-week-service`, `history-service`, `transfers-service`, `price-shared` (shared
helper for `price-changes-service` and `price-predictions-service`), `player-pool-service`.

All of these currently have their own inline `getBootstrapWithCache()` functions sharing the
same in-memory key. Post-migration they all call the single `getOrFetchBootstrap()` DB helper.

```
1. Read latest fpl_bootstrap_cache row where season = current AND archived = false
2. Derive TTL from season state (see tier table above)
3. If row exists AND fetched_at > now - TTL → return data from DB
4. Fetch bootstrap-static from FPL API
5. Derive season from response
6. If season changed → archive old bootstrap rows, insert new fpl_meta row
7. Upsert fpl_bootstrap_cache (new row with current season)
8. If GW38 finished+data_checked → set fpl_meta.is_complete = true
9. Return data
```

### GW Live Data (`event/{gw}/live/`)

Used by: `squad-service`, `top-players-service`, `leaderboard-service`.

```
1. Look up fpl_gw_live_cache for (season, gw)
2. If row exists AND frozen = true → return from DB (0 FPL API calls, ever)
3. If row exists AND fetched_at fresh (within TTL) → return from DB
4. Fetch event/{gw}/live/ from FPL API
5. Set frozen = true if corresponding bootstrap event has data_checked = true
6. Upsert fpl_gw_live_cache
7. Return data
```

### Squad Picks (`entry/{teamId}/event/{gw}/picks/`)

Used by: `squad-service`.

```
1. Look up fpl_squad_cache for (season, team_id, gw)
2. If row exists AND frozen = true → return from DB (0 FPL API calls, ever)
3. If row exists AND fetched_at fresh → return from DB
4. Fetch entry/{teamId}/event/{gw}/picks/ from FPL API
5. Set frozen = true if bootstrap event has finished=true AND data_checked=true
6. Upsert fpl_squad_cache
7. Return data
```

### Dream Team (`dream-team/{gw}/`)

Used by: `team-of-the-week-service`.

```
1. Look up fpl_dream_team_cache for (season, gw)
2. If row exists AND frozen = true → return from DB (0 FPL API calls, ever)
3. If row exists AND fetched_at fresh → return from DB
4. Fetch dream-team/{gw}/ from FPL API
5. Set frozen = true if bootstrap event has finished = true
6. Upsert fpl_dream_team_cache
7. Return data
```

### History (`entry/{teamId}/history/`)

Used by: `history-service`.

```
1. Look up fpl_history_cache for (season, team_id)
2. If season is complete (fpl_meta.is_complete) AND row exists → return from DB (frozen)
3. Derive latestFinishedGw from bootstrap
4. If row exists AND row.last_finished_gw >= latestFinishedGw → return from DB
5. Fetch entry/{teamId}/history/ from FPL API
6. Upsert fpl_history_cache with current latestFinishedGw
7. Return data
```

### Transfers (`entry/{teamId}/transfers/`)

Used by: `transfers-service`. Same refresh logic as history.

```
1. Look up fpl_transfers_cache for (season, team_id)
2. If season is complete AND row exists → return from DB (frozen)
3. Derive latestFinishedGw from bootstrap
4. If row exists AND row.last_finished_gw >= latestFinishedGw → return from DB
5. Fetch entry/{teamId}/transfers/ from FPL API
6. Upsert fpl_transfers_cache with current latestFinishedGw
7. Return data
```

---

## Startup Prefetch

On service start, a background (non-blocking) task runs:

1. Load bootstrap from DB (or fetch if stale).
2. Collect all GW IDs where `finished=true AND data_checked=true`.
3. Query `fpl_gw_live_cache` and `fpl_dream_team_cache` to find which GWs are missing.
4. For each missing GW: fetch live + dream-team from FPL API and persist with `frozen=true`.
5. **Rate limit:** 1 request/second, **max 10 requests per startup**.

The 10-request cap means a brand-new deployment catches up incrementally across restarts.
Per-team data (squad picks, history, transfers) is always fetched lazily on first user request.

---

## Existing In-Memory Cache

`cache.ts` is kept. All inline `getBootstrapWithCache()` duplicates across services are
deleted and replaced by the single shared `getOrFetchBootstrap()` DB helper.

All FPL-specific TTL constants are removed from `cache.ts`:
`BOOTSTRAP`, `SQUAD_FINISHED`, `SQUAD_CURRENT`, `HISTORY_FINISHED`, `HISTORY_CURRENT`,
`LEADERBOARD_GW_FINISHED`, `LEADERBOARD_GW_LIVE`, `LEADERBOARD_SEASON`.

Non-FPL constants (`FIXTURES`, `PLAYER_POOL`) and the `get`/`set` functions remain; they are
still used for fixtures and player-pool computed results.

---

## Out of Scope

- `element-summary/{playerId}/` (player profile fixture history) — low traffic, in-memory
  600s TTL is sufficient; can be added in a future iteration.
- `leagues/{leagueId}/standings/` — changes every GW, low volume, in-memory TTL is fine.
- `entry/{teamId}/` (manager summary) — changes every GW, in-memory TTL is fine.

---

## Decisions

**D1 — Season key from GW1 deadline, not from an FPL-provided field.**
FPL bootstrap-static has no explicit season field. GW1 deadline year is stable, deterministic,
and observable without any FPL API change.

**D2 — Archive, never delete.**
Old season rows consume minimal space. Keeping them enables forensic debugging and potential
future cross-season features without a migration.

**D3 — Per-team data fetched lazily only.**
Squad picks, history, and transfers require a team ID. Proactive prefetch would require joining
watchlists and could generate a large burst of requests on a fresh deployment.

**D4 — 3-hour floor on current-GW TTL.**
FPL live data updates at fixture completion (~90 min). 3 hours means we may serve stale bonus
points for up to one cycle post-match — acceptable for a non-live-scoring app.

**D5 — History and transfers refresh on finished-GW change, not on wall-clock TTL.**
These datasets grow by exactly one entry per finished GW. Tying the refresh trigger to
`latestFinishedGw` means we never re-fetch unnecessarily mid-GW, yet always get fresh data
as soon as a new GW is confirmed finished.
