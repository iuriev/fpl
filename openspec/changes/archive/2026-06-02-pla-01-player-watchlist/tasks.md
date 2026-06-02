# Tasks: Player Watchlist (PLA-01)

## W1 — Repository abstraction and localStorage implementation

- [x] `web/src/lib/player-watchlist-repository.ts`: `PlayerWatchlistAddResult` type, `PlayerWatchlistRepository` interface, `LocalStoragePlayerWatchlistRepository` (key `fpl-player-watchlist-v1`, limit 2), React context, and `usePlayerWatchlistRepository` hook
- [x] `web/src/lib/player-watchlist-repository.test.ts`: `list`, `add`, `remove`, `has`, `getLimit`; duplicate, limit, and persistence cases

## W2 — Inject repository in App.tsx

- [x] Create `LocalStoragePlayerWatchlistRepository` instance in `App.tsx`
- [x] Wrap app tree in `PlayerWatchlistRepositoryContext.Provider`

## W3 — Follow button in PlayerCard info popup

- [x] Add Follow icon button (filled star = following, outline = not) to the `infoHeader` row in `PlayerCard.tsx`
- [x] Prop `onFollow?: (playerId: number) => void` — only renders button when provided; no repo knowledge in PlayerCard
- [x] Pass handler from SquadScreen (and any other caller of PlayerCard with `playerInfo`)
- [x] On follow: call `repo.add(playerId)`; if `'limit'` show toast "Watchlist full (2/2)"
- [x] Update `PlayerCard.test.tsx` and `PlayerCard.stories.tsx` for new prop

## W4 — Follow button in PlayerPickerRow (TransferScreen)

- [x] Add Follow icon button to trailing area of `PlayerPickerRow.tsx`
- [x] Reads current follow state via `usePlayerWatchlistRepository()`
- [x] Calls `repo.add` / `repo.remove`; handles limit toast
- [x] Update `PlayerPickerSheet.test.tsx`

## W5 — Follow button in PlayerRankRow (TopPlayersScreen)

- [x] Add optional Follow icon button to `PlayerRankRow.tsx` via `onFollow?: (playerId: number) => void` and `isFollowing?: boolean` props
- [x] Update `TopPlayersScreen.tsx` to pass follow state and handler per row
- [x] Update `PlayerRankRow.test.tsx` and `PlayerRankRow.stories.tsx`

## W6 — Follow button in ReviewPlayerList (GameweekReviewScreen)

- [x] Add Follow icon button to each player row in `ReviewPlayerList.tsx`
- [x] Reads follow state and calls repo directly
- [x] Update `ReviewPlayerList` tests

## W7 — WatchedPlayerRow component

- [x] `web/src/screens/PlayerWatchlistScreen/WatchedPlayerRow.tsx`
- [x] Props: `rank: number; playerId: number; onRemove: () => void`
- [x] Finds player in GW / season data via `useTopPlayersGw(currentGw)` and `useTopPlayersSeason()`
- [x] Renders `PlayerRankRow` with same visual as Top Players; trailing ✕ button
- [x] When player not found in either query: skeleton / unknown state with ID + ✕
- [x] `WatchedPlayerRow.test.tsx`

## W8 — AddPlayerSheet component

- [x] `web/src/screens/PlayerWatchlistScreen/AddPlayerSheet.tsx`
- [x] A `BottomSheet` with a text search input
- [x] Filters bootstrap players (from `useBootstrap` or equivalent) by name substring
- [x] Renders results in `PlayerRankRow` format with Follow button per row
- [x] Progressive rendering up to 50 results (same `IntersectionObserver` pattern as TopPlayersScreen)
- [x] `AddPlayerSheet.test.tsx`

## W9 — PlayerWatchlistScreen

- [x] `web/src/screens/PlayerWatchlistScreen/PlayerWatchlistScreen.tsx`
- [x] Reads watched ID list from `usePlayerWatchlistRepository()`
- [x] Capacity badge in header: `X/2 following`; amber at limit
- [x] Search input: filters watched rows by `webName` substring (client-side)
- [x] Renders `WatchedPlayerRow` for each watched ID in add order
- [x] Empty state: "No players followed yet. Tap ★ on any player to start tracking them." + "Browse Top Players →" link
- [x] "＋ Add player by name" button at bottom → opens `AddPlayerSheet`
- [x] Uses `useGameweeks()` to resolve `currentGw` for GW data query
- [x] `PlayerWatchlistScreen.test.tsx`: empty state, capacity badge, search filter, rows, unfollow, add sheet

## W10 — Route and navigation

- [x] `web/src/App.tsx`: add `<Route path="/player-watchlist" element={<PlayerWatchlistScreen />} />`
- [x] `TeamInfoPanel.tsx`: add nav link "Player Watchlist" → `/player-watchlist`

## W11 — Toast infrastructure (if not already present)

- [x] Confirm a toast / snackbar mechanism exists for limit feedback; if not, add a minimal one
- [x] Wire limit toast in all Follow button handlers (W3, W4, W5, W6)

## W12 — Copy additions

- [x] Add all new UI strings to `web/src/lib/copy.ts`:
  - `playerWatchlistTitle`, `playerWatchlistBack`
  - `playerWatchlistEmpty`, `playerWatchlistEmptySubtext`
  - `playerWatchlistAddByName`, `playerWatchlistSearch`
  - `playerWatchlistCapacityBadge` (template: `{count}/{limit} following`)
  - `playerWatchlistFull` (toast: `Watchlist full ({limit}/{limit})`)
  - `playerWatchlistFollow`, `playerWatchlistUnfollow`
  - `playerWatchlistAddSheetTitle`
