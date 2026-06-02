# Proposal: League Participants Browser (ANA-12)

## Problem

The Leagues Stats screen lists every league a user belongs to with their rank, but the
rows are dead ends. There is no way to explore who else is in the league or to view a
rival manager's squad — users must leave the app and look on the official FPL site.

## Solution

Make each league row on the Leagues Stats screen tappable. Tapping opens a new
**League Standings screen** that lists all participants (name, team name, GW points,
total points, rank movement). Tapping a participant navigates to that manager's squad
using the existing squad viewer at `/?teamId=<id>`.

Pagination follows the FPL API's page-based model; a "Load more" button appends the
next page of results without resetting scroll.

## User value

- "Who's ahead of me in my mini-league?" — answered without leaving the app
- "I want to see what players the top manager in my league picked" — two taps
- "My mate's team — how is it doing this gameweek?" — no ID needed, just find their name

## Scope

### In

- `LeagueRow` in `LeaguesStatsScreen` becomes a tappable button with a `›` chevron
- New `LeagueStandingsScreen` at `/leagues/:leagueId/standings`
  - URL carries `leagueId`; screen derives league name from the first API response
  - Back navigates to the caller screen (Stats); `leagueName` shows in the header
  - Lists `StandingEntry` rows: rank, name/team, GW total, season total, rank direction
  - "Load more" button when `hasNext === true`
  - Loading skeleton, error state with retry, empty state
- Each standing row taps through to `/?teamId=<entry>&gw=<currentGw>` — the existing
  Squad screen, which already accepts any public FPL team ID
- Route added to `App.tsx`

### Out of scope

- H2H league bracket / match detail
- Searching / filtering standings by name
- Live rank recalculation during an active gameweek (LIVE-02)

## Dependencies

- Backend already implemented: `GET /api/leagues/:leagueId/standings?page=<n>`
- Web API client already implemented: `useLeagueStandings(leagueId, page)` hook
- No new proxy work required
