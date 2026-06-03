# Tasks: FPL Persistent DB Cache (CACHE-01)

## Step 1 — DB schema: new cache tables

Outcome: four new tables exist in Drizzle schema and a migration runs cleanly.

- [ ] Add `fplMeta`, `fplBootstrapCache`, `fplGwLiveCache`, `fplSquadCache` tables to
      `proxy/src/db/schema.ts` exactly as specified in `design.md`.
- [ ] Run `npm run db:generate -w proxy` to generate the Drizzle migration file.
- [ ] Run `npm run db:migrate -w proxy` to apply the migration locally and against Supabase.
- [ ] Update `docs/db-schema.md`: add per-table column tables and extend the Mermaid ER diagram.

---

## Step 2 — Season helpers

Outcome: a pure utility module that derives season string and detects season state from
bootstrap data, fully unit-tested.

- [ ] Create `proxy/src/fpl-cache/season.ts`:
  - `deriveSeason(events: BootstrapEvent[]): string` — extracts year from GW1 deadline.
  - `getSeasonState(events: BootstrapEvent[], isComplete: boolean): SeasonState` — returns
    `"pre-season" | "active" | "complete"`.
  - `getBootstrapTtlSeconds(state: SeasonState): number` — 43200 / 43200 / 604800.
  - `getLiveTtlSeconds(state: SeasonState): number` — 10800 (active) or irrelevant otherwise.
- [ ] Unit tests in `proxy/src/fpl-cache/season.test.ts` covering all three states and
      the season rollover edge case (GW1 deadline in a new year).

---

## Step 3 — DB cache helpers

Outcome: a thin DB-backed cache layer with `getBootstrap`, `getGwLive`, `getSquad`
read/write helpers, tested with a mock DB client.

- [ ] Create `proxy/src/fpl-cache/db-cache.ts` with:
  - `getOrFetchBootstrap(db, fplClient, currentSeason): Promise<BootstrapStatic>` —
    implements the bootstrap flow from `design.md` step-by-step, including season rollover
    detection and `is_complete` update.
  - `getOrFetchGwLive(db, fplClient, season, gw, bootstrapEvents): Promise<GwLive>` —
    frozen-first lookup, then fetch + upsert.
  - `getOrFetchSquad(db, fplClient, season, teamId, gw, bootstrapEvents): Promise<SquadPicks>` —
    same frozen-first pattern.
- [ ] Unit tests in `proxy/src/fpl-cache/db-cache.test.ts` covering:
  - Returns frozen DB row without calling `fplClient`.
  - Returns fresh non-frozen DB row within TTL without calling `fplClient`.
  - Calls `fplClient` and persists when row is missing or stale.
  - Sets `frozen=true` when bootstrap event has `data_checked=true`.
  - Detects season rollover and archives old bootstrap row.

---

## Step 4 — Wire DB cache into existing services

Outcome: `gameweeks-service`, `squad-service`, and the live-data path use the DB cache layer
instead of in-memory `cache.get`/`cache.set`.

- [ ] Update `proxy/src/gameweeks-service.ts` to call `getOrFetchBootstrap` instead of the
      current in-memory path.
- [ ] Update `proxy/src/squad-service.ts` to call `getOrFetchGwLive` and `getOrFetchSquad`.
- [ ] Remove now-unused FPL-specific TTL constants from `cache.ts`
      (`BOOTSTRAP`, `SQUAD_FINISHED`, `SQUAD_CURRENT`, `HISTORY_FINISHED`, `HISTORY_CURRENT`).
      Keep `FIXTURES` and `PLAYER_POOL` if still in use.
- [ ] Confirm existing service unit tests still pass (`npm -w proxy test`).

---

## Step 5 — Startup prefetch

Outcome: on service start, missing frozen GW live rows are backfilled in the background,
rate-limited to 1 req/s and max 10 requests.

- [ ] Create `proxy/src/fpl-cache/prefetch.ts`:
  - `prefetchMissingGwLive(db, fplClient, season, bootstrapEvents): Promise<void>`.
  - Collects finished+data_checked GW IDs, queries DB for existing frozen rows, fetches
    missing ones with `setInterval`-based 1 req/s pacing, stops after 10 requests.
- [ ] Call `prefetchMissingGwLive(...)` from `proxy/src/index.ts` after the Hono server
      starts — fire-and-forget (no `await`, errors logged but not thrown).
- [ ] Unit test: verify rate-limiting logic halts after max 10 fetches regardless of how many
      GWs are missing.

---

## Step 6 — ADR

Outcome: architectural decision recorded.

- [ ] Add `docs/decisions/0019-fpl-persistent-db-cache.md`:
  - Decision: persist FPL API responses in Postgres; use frozen flag for immutable GW data.
  - Context: risk of FPL API rate-limiting; in-memory cache lost on restart.
  - Consequences: reduced FPL API call volume; DB dependency for FPL data; season rollover
    handled via `fpl_meta` + `archived` flag.
  - Trade-offs from D1–D4 in `design.md`.
- [ ] Update `docs/architecture.md` caching section to reference the new DB-backed layer.

---

## Step 7 — End-to-end smoke test

Outcome: manually verified that the DB cache works end-to-end in the local dev environment.

- [ ] Start the proxy locally with a real `DATABASE_URL` pointing to Supabase.
- [ ] Hit `/api/gameweeks` — confirm bootstrap row appears in `fpl_bootstrap_cache`.
- [ ] Hit `/api/squad/:teamId/:gw` for a finished GW — confirm rows appear in
      `fpl_gw_live_cache` (frozen=true) and `fpl_squad_cache` (frozen=true).
- [ ] Hit the same squad endpoint again — confirm no FPL API request is made (check logs).
- [ ] Restart the proxy — confirm the second start serves the finished GW from DB without
      any FPL API calls for that GW.
