# Design: Backend Watchlist (MGR-02)

## Database schema additions

Two new tables added to `proxy/src/db/schema.ts`:

```ts
export const watchlistEntry = pgTable(
  'watchlist_entry',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    teamId: integer('team_id').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('watchlist_entry_user_team_idx').on(t.userId, t.teamId)],
);

export const playerWatchlistEntry = pgTable(
  'player_watchlist_entry',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    playerId: integer('player_id').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('player_watchlist_entry_user_player_idx').on(t.userId, t.playerId)],
);
```

`id` is a `nanoid`-generated short string (same pattern used for user IDs). The unique
index prevents duplicate entries without a separate query.

## Proxy endpoints

All six routes are added to `me-routes.ts` and inherit its `requireUser` middleware.

### Manager watchlist

```
GET    /api/me/watchlist
→ 200  { teamIds: number[] }

POST   /api/me/watchlist
Body:  { teamId: number }
→ 200  { teamId: number }      (added)
→ 409  { error: 'limit' }     (free-tier cap reached)
→ 409  { error: 'duplicate' } (already following)
→ 400  { error: '...' }       (invalid teamId)

DELETE /api/me/watchlist/:teamId
→ 204  (no body)
→ 400  (invalid teamId param)
```

### Player watchlist

```
GET    /api/me/player-watchlist
→ 200  { playerIds: number[] }

POST   /api/me/player-watchlist
Body:  { playerId: number }
→ 200  { playerId: number }
→ 409  { error: 'limit' }
→ 409  { error: 'duplicate' }
→ 400  { error: '...' }

DELETE /api/me/player-watchlist/:playerId
→ 204
→ 400
```

Limit constant `FREE_LIMIT = 2` lives in `me-routes.ts` until MGR-03 replaces it with a
subscription-tier lookup.

## Frontend repositories

### `ApiWatchlistRepository`

Added to `web/src/lib/watchlist-repository.ts` alongside the existing localStorage class:

```ts
export class ApiWatchlistRepository implements WatchlistRepository {
  async list(): Promise<number[]> { /* GET /api/me/watchlist */ }
  async add(teamId: number): Promise<AddResult> { /* POST; maps 409 → 'limit'|'duplicate' */ }
  async remove(teamId: number): Promise<void> { /* DELETE */ }
  async has(teamId: number): Promise<boolean> { /* derived from list() */ }
  getLimit(): number { return 2; }
}
```

### `ApiPlayerWatchlistRepository`

Added to `web/src/lib/player-watchlist-repository.ts`:

```ts
export class ApiPlayerWatchlistRepository implements PlayerWatchlistRepository {
  async list(): Promise<number[]> { /* GET /api/me/player-watchlist */ }
  async add(playerId: number): Promise<PlayerWatchlistAddResult> { /* POST */ }
  async remove(playerId: number): Promise<void> { /* DELETE */ }
  async has(playerId: number): Promise<boolean> { /* derived from list() */ }
  getLimit(): number { return 2; }
}
```

No caching layer in the repository — calls hit the proxy directly. If latency becomes
noticeable, a simple in-memory cache can be added in a follow-up without touching
consumers.

## Wiring in App.tsx

```ts
// replace constant repo instances
const watchlistRepo: WatchlistRepository = new ApiWatchlistRepository();
const playerWatchlistRepo: PlayerWatchlistRepository = new ApiPlayerWatchlistRepository();
```

The providers and context already exist; only the concrete class injected changes.

## Migration strategy

`drizzle-kit generate` creates the SQL migration. Applied at proxy boot (existing
`runMigrations()` call in `index.ts`). No data migration — existing localStorage entries
are silently abandoned (acceptable; localStorage was dev-phase only).

## Error handling

- Network errors in repository methods propagate as thrown exceptions; the existing
  error boundaries in `WatchlistScreen` and `PlayerWatchlistScreen` already handle this.
- 401 on any watchlist call means the session expired; `AuthProvider` will redirect to
  sign-in on the next navigation (existing behaviour).
- 409 `{ error: 'limit' }` → `'limit'` result; triggers the existing upsell sheet.
- 409 `{ error: 'duplicate' }` → `'duplicate'` result (no-op in the UI).
