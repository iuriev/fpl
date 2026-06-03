# Proposal: Backend Watchlist (MGR-02)

## Problem

Both the manager watchlist (`/watchlist`) and player watchlist (`/player-watchlist`)
currently store their data in `localStorage`. This means:

- Following a manager on one device doesn't carry over to another.
- Clearing browser storage or switching browsers wipes the list.
- The free-tier limit (2 entries) is enforced only client-side and can be bypassed.
- Preparing for MGR-03 (premium tier: 10 entries) requires server-side enforcement.

AUTH-01 shipped in `2026-06-02-auth-01-user-accounts`, providing a Postgres database,
Drizzle ORM, a `requireUser` middleware, and `me-routes.ts`. The infrastructure needed
to persist user-owned data is already in place.

## Solution

Introduce **MGR-02**: migrate both watchlists from `localStorage` to two new Postgres
tables, served by new `/api/me/watchlist` and `/api/me/player-watchlist` endpoints.

- `ApiWatchlistRepository` and `ApiPlayerWatchlistRepository` implement the existing
  `WatchlistRepository` / `PlayerWatchlistRepository` interfaces, so every consuming
  component (`WatchlistScreen`, `PlayerWatchlistScreen`, `TeamInfoPanel`,
  `useFollowTeam`, `useFollowPlayer`) is unchanged.
- `App.tsx` injects the API implementations into the existing context providers. The
  `LocalStorage*` classes remain as a fallback for demo / unauthenticated paths, but both
  watchlist routes are already behind `AuthAndTeamProtectedRoute`, so in practice the API
  implementations are always used at runtime.
- Server-side limit enforcement replaces the localStorage check: the proxy returns `409
  Conflict` when the limit is reached; the repository translates this to `'limit'`.

## User value

- "I follow a manager on my phone — I want to see them on my laptop too." — supported.
- "I shortlist players on my computer — I want them on mobile." — supported.
- Existing UI, follow / unfollow interactions, and capacity badge are unchanged.

## Scope

### In

- Two new Drizzle tables: `watchlist_entry` (manager teamIds) and
  `player_watchlist_entry` (player IDs), both FK-linked to `user.id`.
- Drizzle migration generated and applied at proxy boot.
- New routes mounted in `me-routes.ts`:
  - `GET  /api/me/watchlist` → array of teamIds for the authenticated user.
  - `POST /api/me/watchlist` → add a teamId (enforces limit, returns 409 on full).
  - `DELETE /api/me/watchlist/:teamId` → remove entry.
  - `GET  /api/me/player-watchlist` → array of playerIds.
  - `POST /api/me/player-watchlist` → add playerId (enforces limit, 409 on full).
  - `DELETE /api/me/player-watchlist/:playerId` → remove entry.
- `ApiWatchlistRepository` in `web/src/lib/watchlist-repository.ts`.
- `ApiPlayerWatchlistRepository` in `web/src/lib/player-watchlist-repository.ts`.
- `App.tsx`: inject API repositories into context providers.
- `docs/db-schema.md` updated with the two new tables.
- Tests for all new proxy endpoints and both repository classes.

### Out of scope

- **MGR-03** (premium tier limits): `getLimit()` returns the free-tier cap (2) in this
  change; the premium tier (10) is a follow-up once MON-01 ships.
- UI changes of any kind — no new screens, no layout changes, no copy changes.
- Migration of existing localStorage data — entries already followed are not carried over
  (users re-follow after signing in; this is acceptable for the current user count).
- `LocalStorageWatchlistRepository` / `LocalStoragePlayerWatchlistRepository` removal —
  they remain as the demo-mode fallback.

## Non-functional requirements

- All six endpoints require authentication (`requireUser`); 401 if no valid session.
- Limit enforced server-side: `POST` returns `409` if `count >= FREE_LIMIT` (2).
- No N+1: `list()` fetches all IDs in a single `SELECT`.
- No new Fly machine size or Supabase tier changes needed.

## Dependencies

- AUTH-01 (`2026-06-02-auth-01-user-accounts`) — complete ✅
