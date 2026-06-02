# Spec: League Standings endpoint

## Overview

A new proxy endpoint that exposes the standings of a classic FPL league.
Used by the "From My Leagues" section in the Manager Watchlist add flow.
Partially fulfils ANA-12 (League participants browser) scoped to the watchlist context.

---

## Proxy endpoint

```
GET /api/leagues/:leagueId/standings?page=1
```

- `leagueId`: numeric FPL classic league ID (from `LeagueEntry.id` in the existing
  `LeaguesResponse`)
- `page`: optional, defaults to 1

### FPL source

`GET https://fantasy.premierleague.com/api/leagues-classic/{leagueId}/standings/?page_standings={page}`

### Response

```typescript
interface LeagueStandingsResponse {
  leagueId: number;
  leagueName: string;
  page: number;
  hasNext: boolean;
  standings: StandingEntry[];
}

interface StandingEntry {
  entry: number;           // FPL team ID — used as the watchlist key
  entryName: string;       // team name
  playerName: string;      // manager full name
  rank: number;            // current rank in this league
  lastRank: number | null; // rank last GW (null if first GW)
  total: number;           // overall points
  eventTotal: number;      // GW points
}
```

### Error handling

- Unknown league ID or private league with no access → 404 from FPL → proxy returns 404
- Invalid `page` (non-numeric, < 1) → 400

### Caching

10 minutes. League standings change only when a GW is live or just finalised.

---

## Validation

- `leagueId`: must be a positive integer; reject with 400 otherwise
- `page`: must be a positive integer if provided; default to 1

---

## Notes

- Only classic leagues are supported. H2H league standings use a different FPL endpoint
  (`/leagues-h2h/{id}/standings/`) and are excluded from this spec.
- The FPL API returns up to 50 entries per page. The proxy passes `hasNext` through so
  the frontend can offer a "Load more" button.
- This endpoint does not require authentication — FPL classic league standings are public.
