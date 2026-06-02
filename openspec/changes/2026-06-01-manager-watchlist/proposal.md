# Proposal: Manager Watchlist (MGR-01)

## Problem

FPL is a social game. Users care deeply about tracking rivals in their mini-leagues,
monitoring top managers, and keeping an eye on friends' picks. Currently there is no way
to do this inside the app — users must manually open each team by entering a team ID,
one at a time, with no memory between visits.

## Solution

A **Manager Watchlist**: a persisted list of up to 5 FPL managers the user chooses to
follow. A single screen shows all watched managers in a table with their current GW stats
— points, overall rank, captain pick, transfers made, rank change, and latest transfers
in — updated on every page visit.

Clicking any row opens that manager's squad in the existing squad viewer.

## User value

- "Are my rivals beating me this week?" — answered at a glance
- "What captain did the top manager in my league play?" — one tap
- "Who transferred in Salah this GW?" — visible without switching tabs

## Scope

### In

- `WatchlistScreen` at `/watchlist` with full stats table
- Full column set: Manager Name | Team | GW Pts | GW Rank | Overall Rank | Rank Δ | Transfers | Captain | Latest transfers in | ✕
- Three ways to add a manager:
  1. Manual team ID input (always available)
  2. "Follow" button in TeamInfoPanel (visible on any squad view)
  3. From My Leagues — browse league standings and follow directly
- Max 5 entries (localStorage phase)
- `WatchlistRepository` abstraction layer: localStorage now, backend after AUTH-01
- Add link to `/watchlist` in TeamInfoPanel navigation
- New proxy endpoints: `/api/entry/:teamId/transfers` and `/api/leagues/:leagueId/standings`
- Extend `EntryResponse` with `eventRank` (GW league rank)

### Out of scope (planned follow-ups)

- **MGR-02**: Migrate watchlist to backend (depends on AUTH-01)
- **MGR-03**: Freemium limits — 2 entries free, 10 with subscription (depends on MGR-02 + MON-01)
- Rank Δ notifications or push alerts
- Watchlist sorting / filtering

## Dependencies

- AUTH-01 is NOT a dependency for this change — localStorage covers the MVP.
- ANA-12 (League participants browser) is partially covered here: the "From My Leagues"
  add flow implements league standings browsing scoped to the watchlist context.

## Migration path (AUTH-01 → MGR-02)

The `WatchlistRepository` interface is the migration seam. Phase 1 injects
`LocalStorageWatchlistRepository`. Phase 2 (MGR-02) injects `ApiWatchlistRepository`
without touching UI components. The `add()` method returns a status (`ok | duplicate | limit`)
so the UI can show upsell prompts when MGR-03 gates are active.
