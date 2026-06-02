# Proposal: Player Watchlist (PLA-01)

## Problem

FPL managers constantly track specific players — monitoring differential picks, watching
injured players recover, keeping an eye on in-form attackers not in their squad. Currently
there is no way to follow individual players inside the app without manually navigating to the
Top Players screen and scrolling.

## Solution

A **Player Watchlist**: a persisted list of players the user chooses to follow. A dedicated
screen shows all watched players in the same row format as the Top Players screen — jersey,
name, position badge, club, stat chips, ownership, and GW points — so the comparison is
instant and familiar.

A **Follow** button appears inside every player popup across the app (PlayerCard info popup,
PlayerPickerSheet, PlayerRankRow in Top Players, ReviewPlayerList). Tapping Follow adds the
player; tapping again removes them. The watched row shows the last available GW stat data.

Free tier is limited to 2 players. The limit message and "upgrade" copy are in place for the
future monetisation gate (MON-01) without implementing payments here.

## User value

- "Is Salah recovered? What was his last score?" — answered at a glance
- "That differential I've been watching — still under 5% ownership?" — one tap
- "How is the player I transferred out doing?" — no more hunting Top Players

## Scope

### In

- `PlayerWatchlistScreen` at `/player-watchlist`
- Watched rows identical in visual design to `PlayerRankRow` on Top Players screen
- Free text search by player name or surname on the watchlist screen
- **Follow** button added to:
  - `PlayerCard` info popup (SquadScreen, TransferScreen)
  - `PlayerPickerSheet` player row (TransferScreen)
  - `PlayerRankRow` (TopPlayersScreen) — trailing icon button
  - `ReviewPlayerList` player rows (GameweekReviewScreen)
- Free tier limit: **2 players**
- `PlayerWatchlistRepository` abstraction (localStorage Phase 1, backend Phase 2)
- Link to `/player-watchlist` in app navigation (TeamInfoPanel)
- Capacity badge: "X/2 following" in watchlist header

### Out of scope (planned follow-ups)

- **PLA-02**: Migrate watchlist to backend (depends on AUTH-01)
- **PLA-03**: Paid tier — raise limit to 15 (depends on PLA-02 + MON-01)
- Price change alerts or push notifications
- Sorting / filtering watched list beyond text search

## Dependencies

- AUTH-01 is NOT a dependency — localStorage covers Phase 1.
- No new proxy endpoints required: `TopPlayersPlayer` data comes from existing
  `/api/top-players/gw/:gw` and `/api/top-players/season`.

## Migration path (AUTH-01 → PLA-02)

`PlayerWatchlistRepository` is the seam. Phase 1 injects
`LocalStoragePlayerWatchlistRepository`. Phase 2 (PLA-02) injects
`ApiPlayerWatchlistRepository` without touching UI components.
`add()` returns `'ok' | 'duplicate' | 'limit'` for future upsell prompts.
