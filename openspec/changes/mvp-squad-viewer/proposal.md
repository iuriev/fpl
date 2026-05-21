## Why

Fantasy Premier League managers want a fast, mobile-friendly way to check how their squad
performed in a given gameweek without logging in or navigating the official site's heavier
interface. By using only a public team ID, we can offer a no-login, at-a-glance view of a
manager's squad and per-player points, with the ability to move between gameweeks. This is
the smallest useful slice of the product and lets us validate the architecture (SPA + proxy
over the public FPL API) and the FPL data contract before investing in richer features.

## What Changes

- Introduce a no-auth entry flow where a user provides their public FPL **team ID**.
- Display the manager's squad for a selected gameweek: 15 players split into starting XI and
  bench, with captain and vice-captain marked.
- Show the points each player scored in the selected gameweek.
- Show an availability status indicator on players FPL flags as doubtful, injured, suspended,
  or unavailable, with details (news and chance of playing) available on demand.
- Show a per-gameweek team summary: total points, gameweek average, gameweek highest, gameweek
  rank, and number of transfers made.
- Allow navigation between gameweeks (previous / next), defaulting to the current gameweek.
- Stand up a thin backend proxy that the SPA calls. The public FPL API sends no CORS headers
  and cannot be called from the browser directly; the proxy fetches, caches, and reshapes FPL
  data for the UI.

Deferred (explicitly out of scope here): a List View toggle (next version), Team of the Week,
live in-match scoring, mini-leagues, fixtures, predictions, AI assistant. See
`docs/decisions/0005-mvp-scope-expansion.md` and `docs/backlog.md`.

## Capabilities

### New Capabilities
- `team-entry`: Accept and validate a public FPL team ID as the way to identify whose squad
  to show, and remember it for the session.
- `squad-view`: Show the 15-player squad for a gameweek — starting XI vs bench,
  captain/vice-captain markers, and each player's points for that gameweek.
- `gameweek-navigation`: Select which gameweek is shown, defaulting to the current one, with
  previous/next movement bounded to the valid gameweek range.
- `player-status`: Show an availability indicator on flagged players, with details on demand.
- `gameweek-summary`: Show the team's per-gameweek summary — total, average, highest, rank,
  and transfers.

### Modified Capabilities
- None — greenfield project, no existing specs.

## Impact

- **New backend (proxy/BFF):** introduces the first FPL-facing endpoints the SPA depends on
  (team summary, squad picks per gameweek, per-player gameweek points and availability status,
  per-gameweek team summary, gameweek list) and establishes the proxy <-> FPL API contract.
- **New frontend (SPA):** entry screen, squad screen (pitch view with player statuses and a
  gameweek summary strip), and gameweek navigation.
- **External dependency:** public FPL API (`fantasy.premierleague.com/api`) — no auth, no
  CORS, availability not guaranteed; proxy-side caching mitigates load and shields the UI.
- **Decision records:** aligns with ADR 0001 (Vite SPA + Node proxy), ADR 0003 (Hono), and
  ADR 0005 (expanded MVP scope, superseding ADR 0002). No breaking changes — nothing exists yet.