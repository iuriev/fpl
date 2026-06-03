# Tasks: Backend Watchlist (MGR-02)

## Step 1 — DB schema + migration

Outcome: two new tables exist in Postgres; proxy boots with the migration applied.

- [x] Add `watchlistEntry` and `playerWatchlistEntry` tables to
      `proxy/src/db/schema.ts` (see `design.md` for column definitions).
- [x] Run `npm run db:generate -w proxy` to produce the Drizzle SQL migration file.
- [x] Verify migration file is correct; commit alongside schema change.
- [x] Update `docs/db-schema.md`: add `watchlist_entry` and `player_watchlist_entry`
      sections (column table + update the ER diagram).

---

## Step 2 — Proxy endpoints

Outcome: all six `/api/me/watchlist` and `/api/me/player-watchlist` endpoints work
correctly and are covered by tests.

- [x] Add `GET /api/me/watchlist`, `POST /api/me/watchlist`,
      `DELETE /api/me/watchlist/:teamId` in `proxy/src/me-routes.ts`.
      - `GET`: `SELECT teamId FROM watchlist_entry WHERE userId = ?` ordered by
        `createdAt ASC`, return `{ teamIds: number[] }`.
      - `POST`: validate `teamId` is a positive integer; count existing entries; return
        409 `{ error: 'limit' }` if `count >= FREE_LIMIT`; insert with `nanoid()` as id;
        return 409 `{ error: 'duplicate' }` on unique-constraint violation.
      - `DELETE`: parse `teamId` param; `DELETE WHERE userId = ? AND teamId = ?`; return
        204 regardless of whether a row existed.
- [x] Add `GET /api/me/player-watchlist`, `POST /api/me/player-watchlist`,
      `DELETE /api/me/player-watchlist/:playerId` — same pattern for `playerWatchlistEntry`.
- [x] `proxy/src/me-routes.test.ts`: add tests for all six new endpoints:
      - happy-path GET (empty, non-empty).
      - POST: 200 ok, 409 limit, 409 duplicate, 400 invalid body.
      - DELETE: 204 on existing entry, 204 on non-existent entry.
      - 401 unauthenticated (all routes).

---

## Step 3 — Frontend API repositories

Outcome: `ApiWatchlistRepository` and `ApiPlayerWatchlistRepository` are implemented,
wired into `App.tsx`, and covered by tests.

- [x] Add `ApiWatchlistRepository` class to `web/src/lib/watchlist-repository.ts`
      implementing `WatchlistRepository`:
      - `list()`: `GET /api/me/watchlist` → returns `teamIds` array.
      - `add(teamId)`: `POST /api/me/watchlist`; maps HTTP 409 `limit` → `'limit'`,
        409 `duplicate` → `'duplicate'`, 2xx → `'ok'`.
      - `remove(teamId)`: `DELETE /api/me/watchlist/:teamId`.
      - `has(teamId)`: calls `list()` and checks inclusion.
      - `getLimit()`: returns `2`.
- [x] Add `ApiPlayerWatchlistRepository` class to
      `web/src/lib/player-watchlist-repository.ts` (same pattern for player IDs).
- [x] `web/src/App.tsx`: replace `new LocalStorageWatchlistRepository()` with
      `new ApiWatchlistRepository()` and similarly for player watchlist.
- [x] `web/src/lib/watchlist-repository.test.ts`: add tests for
      `ApiWatchlistRepository` — mock `fetch`; cover list, add (ok / limit /
      duplicate), remove, has.
- [x] `web/src/lib/player-watchlist-repository.test.ts`: same for
      `ApiPlayerWatchlistRepository`.

---

## Step 4 — Verify & close

- [x] `npm run test -w proxy` — all proxy tests pass (311/311).
- [x] `npm run test -w web` — all web tests pass (pre-existing ResetPasswordScreen + AddPlayerSheet lint failures unrelated to this change).
- [x] `npm run typecheck -w proxy && npm run typecheck -w web` — no type errors.
- [x] `npm run lint -w proxy` — proxy lint clean (web has pre-existing AddPlayerSheet lint error unrelated to this change).
- [x] Archive this OpenSpec change via the `openspec-archive-change` skill.
