# Tasks: FPL Persistent DB Cache (CACHE-01)

## Step 1 — DB schema: new cache tables

Outcome: seven new tables exist in Drizzle schema and a migration runs cleanly.

- [x] Add `fplMeta`, `fplBootstrapCache`, `fplGwLiveCache`, `fplSquadCache`,
      `fplDreamTeamCache`, `fplHistoryCache`, `fplTransfersCache` to
      `proxy/src/db/schema.ts` exactly as specified in `design.md`.
- [x] Run `npm run db:generate -w proxy` to generate the Drizzle migration file.
- [x] Run `npm run db:migrate -w proxy` to apply the migration locally and against Supabase.
- [x] Update `docs/db-schema.md`: add per-table column tables and extend the Mermaid ER diagram.

---

## Step 2 — Season helpers

Outcome: a pure utility module that derives season string and season state from bootstrap
data, fully unit-tested.

- [x] Create `proxy/src/fpl-cache/season.ts`:
  - `deriveSeason(events: BootstrapEvent[]): string` — extracts year from GW1 deadline.
  - `getSeasonState(events: BootstrapEvent[], isComplete: boolean): SeasonState` — returns
    `"pre-season" | "active" | "complete"`.
  - `getBootstrapTtlSeconds(state: SeasonState): number` — 43200 / 43200 / 604800.
  - `getLiveTtlSeconds(state: SeasonState): number` — 10800 when active.
  - `latestFinishedGw(events: BootstrapEvent[]): number | null` — highest finished GW id.
- [x] Unit tests in `proxy/src/fpl-cache/season.test.ts` covering all three states, the
      season rollover edge case, and `latestFinishedGw` boundary cases.

---

## Step 3 — DB cache helpers

Outcome: a thin module with one `getOrFetch*` function per cached resource, tested with
mocked DB and FPL client.

- [x] Create `proxy/src/fpl-cache/db-cache.ts` with:
  - `getOrFetchBootstrap(db, fplClient): Promise<BootstrapStatic>` — bootstrap flow from
    `design.md` including season rollover detection and `is_complete` update.
  - `getOrFetchGwLive(db, fplClient, season, gw, bootstrapEvents): Promise<GwLive>`
  - `getOrFetchSquad(db, fplClient, season, teamId, gw, bootstrapEvents): Promise<SquadPicks>`
  - `getOrFetchDreamTeam(db, fplClient, season, gw, bootstrapEvents): Promise<DreamTeam>`
  - `getOrFetchHistory(db, fplClient, season, teamId, bootstrapEvents, isComplete): Promise<HistoryResponse>`
  - `getOrFetchTransfers(db, fplClient, season, teamId, bootstrapEvents, isComplete): Promise<TransfersResponse>`
- [x] Unit tests in `proxy/src/fpl-cache/db-cache.test.ts` covering per helper:
  - Returns frozen DB row without calling `fplClient`.
  - Returns fresh non-frozen row within TTL/staleness window without calling `fplClient`.
  - Calls `fplClient` and persists when row is missing or stale.
  - Sets `frozen=true` / advances `last_finished_gw` correctly.
  - Bootstrap: detects season rollover and archives old row.
  - History/transfers: does not re-fetch when `last_finished_gw` is current.

---

## Step 4 — Wire DB cache into all affected services

Outcome: every service that previously called `fplClient` directly or used an inline
`getBootstrapWithCache()` now goes through the DB-backed helpers.

**Bootstrap consumers** (delete their inline `getBootstrapWithCache()` and switch to `getOrFetchBootstrap()`):
- [x] `proxy/src/gameweeks-service.ts`
- [x] `proxy/src/leaderboard-service.ts`
- [x] `proxy/src/team-of-the-week-service.ts`
- [x] `proxy/src/price-shared.ts` (exported helper used by `price-changes-service` and `price-predictions-service`)
- [x] `proxy/src/history-service.ts`
- [x] `proxy/src/transfers-service.ts`
- [x] `proxy/src/player-pool-service.ts`

**Live data consumers** (switch to `getOrFetchGwLive()`):
- [x] `proxy/src/squad-service.ts`
- [x] `proxy/src/top-players-service.ts`
- [x] `proxy/src/leaderboard-service.ts` (delete its inline `getLiveWithCache()`)

**Squad picks** (switch to `getOrFetchSquad()`):
- [x] `proxy/src/squad-service.ts`

**Dream team** (switch to `getOrFetchDreamTeam()`):
- [x] `proxy/src/team-of-the-week-service.ts`

**History** (switch to `getOrFetchHistory()`):
- [x] `proxy/src/history-service.ts`

**Transfers** (switch to `getOrFetchTransfers()`):
- [x] `proxy/src/transfers-service.ts`

**Cleanup** (remove all FPL-specific TTL constants now unused):
- [x] Remove from `proxy/src/cache.ts`: `BOOTSTRAP`, `SQUAD_FINISHED`, `SQUAD_CURRENT`,
      `HISTORY_FINISHED`, `HISTORY_CURRENT`, `LEADERBOARD_GW_FINISHED`,
      `LEADERBOARD_GW_LIVE`, `LEADERBOARD_SEASON`.
- [x] Confirm `FIXTURES` and `PLAYER_POOL` constants are still referenced and left in place.
- [x] Run `npm -w proxy test` — all existing service tests must pass.

---

## Step 5 — Startup prefetch

Outcome: on service start, missing frozen GW live and dream-team rows are backfilled in the
background, rate-limited to 1 req/s and max 10 requests total.

- [x] Create `proxy/src/fpl-cache/prefetch.ts`:
  - `prefetchMissingGwData(db, fplClient, season, bootstrapEvents): Promise<void>`.
  - Collects finished+data_checked GW IDs; queries DB for existing frozen live and dream-team
    rows; for each missing GW fetches both endpoints with 1 req/s pacing; stops after 10 total.
- [x] Call `prefetchMissingGwData(...)` fire-and-forget from `proxy/src/index.ts` after server
      starts (no `await`; errors logged but not thrown).
- [x] Unit test: verify rate-limiting halts after max 10 fetches regardless of missing GW count.

---

## Step 6 — ADR and documentation

Outcome: architectural decision recorded; architecture docs updated.

- [x] Add `docs/decisions/0018-fpl-persistent-db-cache.md`:
  - Decision: persist FPL API responses in Postgres; use frozen/staleness flags per data type.
  - Context: risk of FPL API rate-limiting; in-memory cache lost on restart.
  - Consequences: reduced FPL API volume; DB dependency for FPL data; season rollover via
    `fpl_meta` + `archived` flag.
  - Reference D1–D5 from `design.md`.
- [x] Update `docs/architecture.md` caching section to reference the DB-backed layer.

---

## Step 7 — End-to-end smoke test

Outcome: manually verified that the DB cache works end-to-end in the local dev environment.

- [ ] Start proxy locally with a real `DATABASE_URL` pointing to Supabase.
- [ ] Hit `/api/gameweeks` — confirm bootstrap row appears in `fpl_bootstrap_cache`.
- [ ] Hit `/api/squad/:teamId/:gw` for a finished GW — confirm frozen rows in
      `fpl_gw_live_cache` and `fpl_squad_cache`.
- [ ] Hit `/api/entry/:teamId/history` — confirm row in `fpl_history_cache` with correct
      `last_finished_gw`; hit again and confirm no FPL API request in logs.
- [ ] Hit `/api/team-of-the-week/:gw` for a finished GW — confirm frozen row in
      `fpl_dream_team_cache`.
- [ ] Restart the proxy — confirm finished-GW endpoints are served entirely from DB (no FPL
      API calls in logs for those GWs).
