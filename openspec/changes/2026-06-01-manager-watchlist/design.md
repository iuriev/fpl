# Design: Manager Watchlist

## Architecture overview

```
┌─────────────────────────────────────────────────────────────────┐
│  WatchlistScreen  /watchlist?teamId=XXXXXX                      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Add Manager  ┌──────────────────────┐  ┌──────────┐    │  │
│  │               │  team ID...          │  │  + Add   │    │  │
│  │               └──────────────────────┘  └──────────┘    │  │
│  │               [From My Leagues ↓]                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────┬──────────┬──────┬───────┬──────┬──────┬──────┬───┐  │
│  │ Mgr  │ GW Pts   │GW Rk │ OvRk  │Rk Δ │ Xfer │ Cap  │ ✕ │  │
│  ├──────┼──────────┼──────┼───────┼──────┼──────┼──────┼───┤  │
│  │ row  │ skeleton │ ...  │  ...  │ ...  │  ... │  ... │   │  │
│  │ row  │  78      │ 234  │ 42,1k │  ↑3k │  2   │Salah │ ✕ │  │→ /?teamId=id
│  └──────┴──────────┴──────┴───────┴──────┴──────┴──────┴───┘  │
└─────────────────────────────────────────────────────────────────┘
```

Mobile: table scrolls horizontally. Sticky first column (Manager name + team).

---

## WatchlistRepository abstraction

The repository is the migration seam between localStorage (Phase 1) and the backend API
(Phase 2, MGR-02). All UI components depend only on the interface — never on the
concrete implementation.

```typescript
// lib/watchlist-repository.ts

export type AddResult = 'ok' | 'duplicate' | 'limit';

export interface WatchlistRepository {
  list(): Promise<number[]>;
  add(teamId: number): Promise<AddResult>;
  remove(teamId: number): Promise<void>;
  has(teamId: number): Promise<boolean>;
  getLimit(): number;
}
```

### Phase 1 — LocalStorageWatchlistRepository

```typescript
const KEY = 'fpl-watchlist-v1';
const LIMIT = 5;

// Implements WatchlistRepository
// Reads/writes JSON number[] to localStorage[KEY]
// add() returns 'limit' when list.length >= LIMIT
```

### Phase 2 — ApiWatchlistRepository (MGR-02, not in this change)

```typescript
// Implements WatchlistRepository
// list()   → GET  /api/user/watchlist
// add()    → POST /api/user/watchlist  { teamId }
// remove() → DELETE /api/user/watchlist/:teamId
// getLimit() → derived from subscription tier in auth context
```

### Injection

```tsx
// App.tsx (Phase 1)
const repo = new LocalStorageWatchlistRepository();
<WatchlistRepositoryContext.Provider value={repo}>
  ...
</WatchlistRepositoryContext.Provider>

// Hook used by all components
function useWatchlistRepository(): WatchlistRepository
```

When MGR-02 ships, only the `value={repo}` line in App.tsx changes.

---

## Data sources per column

Each watched manager requires two API calls. React Query caches both.

```
useEntry(teamId)             →  managerName, teamName, overallRank, overallPoints,
                                eventPoints, eventRank (new field, see below)

useSquad(teamId, currentGw)  →  summary.transfers (this GW)
                                starters.find(p => p.isCaptain).name

useHistory(teamId)           →  gameweeks[-1].overallRank vs gameweeks[-2].overallRank
                                → rank delta (positive = improved)

useTransfers(teamId)         →  filter by event === currentGw
                                → element_in player names (new hook + proxy endpoint)
```

Cache TTLs (proxy-side): entry = 1h, squad = 1m, history = 5m, transfers = 1h.
React Query staleTime mirrors proxy TTLs.

Worst case (10 managers, cold start): 40 API calls to proxy. With proxy caching, repeated
loads within the TTL window are free. The rate limiter (10 req/s) in fpl-client.ts covers
the fan-out safely.

---

## New proxy endpoints

### GET /api/entry/:teamId/transfers

FPL source: `GET /entry/{teamId}/transfers/`

Response shape:
```typescript
interface TransfersResponse {
  teamId: number;
  transfers: Transfer[];
}

interface Transfer {
  event: number;       // GW number
  elementIn: number;   // player id transferred in
  elementInName: string;
  elementOut: number;
  elementOutName: string;
  elementInCost: number;
  elementOutCost: number;
  time: string;        // ISO timestamp
}
```

Cache: 1 hour (transfers for a completed GW are immutable).

### GET /api/leagues/:leagueId/standings?page=1

FPL source: `GET /leagues-classic/{leagueId}/standings/?page_standings={page}`

Response shape:
```typescript
interface LeagueStandingsResponse {
  leagueId: number;
  leagueName: string;
  hasNext: boolean;
  page: number;
  standings: StandingEntry[];
}

interface StandingEntry {
  entry: number;        // team ID — this is what we add to watchlist
  entryName: string;
  playerName: string;
  rank: number;
  lastRank: number | null;
  total: number;        // overall points
  eventTotal: number;   // GW points
}
```

Cache: 10 minutes. MVP shows first page only (up to 50 entries); `hasNext` allows future pagination.

---

## Extending EntryResponse with eventRank

FPL `GET /entry/{id}/` returns `summary_event_rank` (GW rank in the overall FPL
standings for the current event). This is already fetched in entry-service.ts but not
yet exposed.

Changes required:
- `fpl-client.ts` `FPLEntry`: add `summary_event_rank: number`
- `proxy/src/types.ts` `EntryResponse`: add `eventRank: number`
- `entry-service.ts`: map `entry.summary_event_rank → result.eventRank`
- `web/src/types.ts` `EntryResponse`: add `eventRank: number`

---

## Three "Add" mechanisms

### 1. Manual ID input (always available)

Inline at the top of WatchlistScreen:

```
[ Team ID ___________] [+ Add]
```

Flow: user types ID → hits Add → `useEntry(id)` validates (shows name if ok, error if 404)
→ user confirms → `repo.add(id)`.

### 2. Follow button in TeamInfoPanel

The TeamInfoPanel renders on every squad view. It gets a new "Follow / Following" toggle
button. The button reads from `useWatchlistRepository()` to know current state.

```
[Follow ☆]  →  (click)  →  [Following ★]
```

On click: `repo.add(teamId)`. If result is `'limit'`, show a toast "Watchlist full (5/5)".
No distinction between viewing your own team or another's — the button always appears.

### 3. From My Leagues

A collapsible section below the manual input. Requires `teamId` in the URL
(`?teamId=XXXXXX`). If absent, shows "Open your squad first to browse your leagues."

```
▼ From My Leagues
  > Global League (your rank: 5,234)     →  (expand)
  > Friends League (your rank: 2)        →  (expand)

  Expanded league shows standings:
  ┌─ # ─┬─ Manager ──────────┬─ GW ─┬─ Total ─┬──────────┐
  │  1  │ John Smith         │  82  │  2,145  │ [Follow] │
  │  2  │ Alex Jones         │  75  │  2,098  │ [Follow] │
  └─────┴────────────────────┴──────┴─────────┴──────────┘
  [Load more]  (if hasNext)
```

Follow button in the league standings list goes through the same `repo.add()` path,
showing "Watchlist full" if the limit is reached.

---

## Mobile layout

The table has many columns and will not fit on a 375px screen. Strategy:

- Columns visible without scroll (sticky left): Manager name + team (combined cell)
- Columns accessible by horizontal scroll: GW Pts, GW Rank, Overall Rank, Rank Δ, Transfers, Captain, Latest Xfers, ✕
- The ✕ remove button is also accessible via long-press / swipe-to-delete (future enhancement)

Minimum column widths are set in rem so the table scrolls rather than wraps.

---

## Navigation

`TeamInfoPanel.tsx` gains a new nav link: "Watchlist" → `/watchlist?teamId=${teamId}`.
The teamId is passed so the "From My Leagues" tab can work immediately.

Route added to `App.tsx`:
```tsx
<Route path="/watchlist" element={<WatchlistScreen userTeamId={teamId} />} />
```

`WatchlistScreen` receives `userTeamId?: number` (optional — watchlist itself works
without it; only the "From My Leagues" tab needs it).

---

## Limit enforcement and future upsell hook

```
repo.add(teamId) returns:
  'ok'        → add row, show success
  'duplicate' → show "Already following this manager"
  'limit'     → show "Watchlist full (5/5)" in Phase 1
                 show "Upgrade to follow up to 10 managers" in Phase 3 (MGR-03)
```

The UI checks `repo.getLimit()` to show "X/Y following" in the header. This number
changes when `ApiWatchlistRepository` is injected (Phase 2) and when the subscription
tier changes (Phase 3).
