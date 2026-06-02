# Design: Player Watchlist (PLA-01)

## Architecture overview

```
┌──────────────────────────────────────────────────────────────┐
│  PlayerWatchlistScreen  /player-watchlist                    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  ← Player Watchlist                        2/2 ●       │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  🔍  Search players...                                  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──┬──────┬──────────────────────┬──────────────────┬───┐  │
│  │1 │ 👕   │Salah  LIV            │ Played 90 +2 ...  │88 │  │
│  │  │      │FWD  4.2% ownership  │                   │   │  │
│  ├──┼──────┼──────────────────────┼──────────────────┼───┤  │
│  │2 │ 👕   │Palmer  CHE           │ 1 goal +8 ...     │14 │  │
│  │  │      │MID  18.1% ownership │                   │   │  │
│  └──┴──────┴──────────────────────┴──────────────────┴───┘  │
│                                                              │
│  [+ Add player by name]                                      │
└──────────────────────────────────────────────────────────────┘
```

Each row is visually identical to `PlayerRankRow` on the Top Players screen: rank number,
jersey, player name + position badge + club + stat chips + ownership, and GW points on the
right. A trailing ✕ (unfollow) button sits to the right of the points column.

---

## PlayerWatchlistRepository abstraction

```typescript
// lib/player-watchlist-repository.ts

export type PlayerWatchlistAddResult = 'ok' | 'duplicate' | 'limit';

export interface PlayerWatchlistRepository {
  list(): Promise<number[]>;            // player IDs in add order
  add(playerId: number): Promise<PlayerWatchlistAddResult>;
  remove(playerId: number): Promise<void>;
  has(playerId: number): Promise<boolean>;
  getLimit(): number;                   // 2 in Phase 1
}
```

### Phase 1 — LocalStoragePlayerWatchlistRepository

```typescript
const KEY = 'fpl-player-watchlist-v1';
const LIMIT = 2;

// Reads/writes JSON number[] to localStorage[KEY]
// add() returns 'limit' when list.length >= LIMIT
```

### Phase 2 — ApiPlayerWatchlistRepository (PLA-02, out of scope)

```typescript
// list()   → GET    /api/user/player-watchlist
// add()    → POST   /api/user/player-watchlist  { playerId }
// remove() → DELETE /api/user/player-watchlist/:playerId
// getLimit() → derived from subscription tier
```

### Injection

```tsx
// App.tsx (Phase 1)
const repo = new LocalStoragePlayerWatchlistRepository();
<PlayerWatchlistRepositoryContext.Provider value={repo}>
  ...
</PlayerWatchlistRepositoryContext.Provider>

// Hook used by all components
function usePlayerWatchlistRepository(): PlayerWatchlistRepository
```

---

## Data sources for watched rows

The watchlist screen only needs the player ID list from the repository.
Player data comes from existing queries — no new proxy endpoints required.

```
useTopPlayersGw(currentGw)   →  TopPlayersPlayer[]  (points, stats, ownership for current GW)
useTopPlayersSeason()        →  TopPlayersPlayer[]  (season stats)
```

On the watchlist screen, filter the already-fetched lists by watched IDs.
If the player is not found in GW data (no GW started), fall back to season data
with points shown as `—`.

React Query caching means the data is usually already warm from earlier navigation.

---

## Follow button placement

The Follow button appears as a small icon button (star / bookmark) in four places:

### 1. PlayerCard info popup

Added inside the `infoHeader` row in `PlayerCard.tsx`, next to the close button.

```
┌────────────────────────────────────────────┐
│ Salah                          [★] [✕]     │
│ £13.2m · 4.2% · FWD / LIV                 │
│ [+8 goal] [+2 played] ...                  │
└────────────────────────────────────────────┘
```

Button label: "Follow" (aria-label). Filled star = already following; outline = not following.
On click: `repo.add(player.id)`. If `'limit'` → toast "Watchlist full (2/2)".

### 2. PlayerPickerRow (TransferScreen)

A small Follow icon button added to the trailing area of each `PlayerPickerRow`, to the
right of the price. Tapping follows/unfollows without closing the picker sheet.

### 3. PlayerRankRow (TopPlayersScreen)

A Follow icon button appended to the right side of each row, after the points number.
Follows the same filled/outline star pattern.

### 4. ReviewPlayerList rows (GameweekReviewScreen)

Follow icon button in the trailing position of each player row in the review list.

---

## PlayerWatchlistScreen — states and layout

### Header

```
← Player Watchlist                [2/2 ●]
```

Back button goes to previous screen (or `/` if no history).
Capacity badge: `X/LIMIT following`. Badge turns amber at limit.

### Search bar

A text input below the header. Filters the watched list by `webName` (case-insensitive,
matches any substring). Visible at all times, even with an empty watchlist.
Searching does NOT query the API — it filters the already-loaded player list.

### Add by name (secondary, future-friendly)

A small "＋ Add player by name" link / button at the bottom of the list.
Tapping opens a bottom sheet with a search input that queries the full bootstrap player list.
Results render as a scrollable list in `PlayerRankRow` format with a Follow button on each.
This mirrors the "From My Leagues" section in the Manager Watchlist.

### Watched list

Each row is a `WatchedPlayerRow` component which wraps `PlayerRankRow` with:
- Same visual as Top Players rows (rank, jersey, name, stats, ownership, points)
- Trailing ✕ button to unfollow (calls `repo.remove(playerId)`)
- Points column shows most recent GW points or `—` when unavailable

### Empty state

When the watchlist is empty:

```
No players followed yet.
Tap ★ on any player to start tracking them.
[Browse Top Players →]
```

### Limit state (2/2)

No special blocking UI — the limit is communicated via:
1. Capacity badge in the header ("2/2 ●" in amber)
2. Toast shown when `repo.add()` returns `'limit'`
3. Follow buttons become visually "disabled looking" when at limit and not already following

---

## Search (add by name) bottom sheet

```
┌────────────────────────────────────┐
│  Add player                    [✕] │
│  ┌──────────────────────────────┐  │
│  │  🔍  Search players...       │  │
│  └──────────────────────────────┘  │
│  1  👕  Salah    FWD  LIV  [★ Follow] │
│  2  👕  Palmer   MID  CHE  [★ Follow] │
│  ...                                  │
└────────────────────────────────────┘
```

Data: filter bootstrap players by name substring.
Bootstrap already loaded for other screens — no extra API call.
Renders up to 50 results using progressive loading (same pattern as TopPlayersScreen).

---

## Navigation

`TeamInfoPanel.tsx` gains a new nav link: "Player Watchlist" → `/player-watchlist`.
Route added to `App.tsx`:
```tsx
<Route path="/player-watchlist" element={<PlayerWatchlistScreen />} />
```

---

## Limit enforcement and future upsell

```
repo.add(playerId) returns:
  'ok'        → add row, update capacity badge
  'duplicate' → no-op (Follow button already shows filled state)
  'limit'     → toast "Watchlist full (2/2)" in Phase 1
                toast "Upgrade to follow more players" in Phase 3 (PLA-03)
```

`repo.getLimit()` drives the capacity badge denominator. Changes automatically when
`ApiPlayerWatchlistRepository` is injected in Phase 2.
