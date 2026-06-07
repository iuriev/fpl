# Design: CS% & xG Market Screen

## API

### `GET /api/market?event=N`

Reads `pred_fixture_team` for the latest `pred_model_run` of kind `score` for the given event.
Joins `teams` from FPL bootstrap to resolve team names and short names.
For DGW (team has two fixtures in the same event), values are aggregated:
- `csProb` — probability of keeping at least one clean sheet: `1 - (1 - cs1) * (1 - cs2)`
- `xG` — sum of `lambdaFor` across fixtures
- `xGA` — sum of `lambdaAgainst` across fixtures

Response shape:

```ts
interface TeamMarketDto {
  teamId: number;
  teamName: string;
  teamShortName: string;
  fixtures: Array<{
    opponentTeamId: number;
    opponentShortName: string;
    isHome: boolean;
  }>;
  csProb: number;        // 0–1
  xG: number;           // expected goals scored
  xGA: number;          // expected goals conceded
}

interface MarketResponse {
  event: number;
  modelRunId: string | null;
  ready: boolean;
  teams: TeamMarketDto[];
}
```

Returns `ready: false` (empty `teams`) when no model run exists for the event.

## Proxy layer

- New file `proxy/src/market-service.ts` — query logic
- New file `proxy/src/market-routes.ts` — Hono route, same validation pattern as `prediction-routes.ts`
- Register in `proxy/src/index.ts`

## Web types

Add `TeamMarketDto` and `MarketResponse` to `web/src/types/index.ts`.

## Screen: `MarketScreen`

Route: `/market`

Layout (mobile-first, single column):
```
[ Gameweek picker ]
[ CS%  tab | xG tab ]          ← tab switcher (reuse existing tab pattern)
[ sorted rows ]
[ Premium upsell blur if free ]
```

Rows:
```
[ Team badge ] [ Team short ] [ Fixture chip(s) ]    [ value ]  [ bar ]
```

Fixture chip: `MCI (H)` or `ARS (A)` — same colour token as FDR chips. DGW teams show two chips.

Sorting: default desc by value. Tapping column header toggles asc/desc.

### Paywall

Free users: first 5 rows visible, rows 6–20 blurred. On blur tap → `requestUpsell('market')`.

### State / data fetching

```ts
// web/src/hooks/useMarket.ts
function useMarket(event: number): { data: MarketResponse | null; loading: boolean; error: string | null }
```

Uses `fetch('/api/market?event=N')` with SWR-style stale-while-revalidate via the existing
`useApi` pattern in the project.

### Files

```
web/src/screens/MarketScreen/
  MarketScreen.tsx
  MarketScreen.module.css
  MarketScreen.test.tsx
web/src/hooks/useMarket.ts
proxy/src/market-service.ts
proxy/src/market-routes.ts
proxy/src/market-routes.test.ts
```

## Nav

Add a **Market** entry to `BottomNav`. Use a chart-bar icon (matches "market data" concept).
Position: between Predicted Points and Price Changes.
