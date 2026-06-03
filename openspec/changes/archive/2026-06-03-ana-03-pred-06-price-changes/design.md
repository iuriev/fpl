# Design: Price Changes & Predictions (ANA-03 + PRED-06)

## Screen map

Route: `/price-changes`  
Nav: `TeamInfoPanel` link (after Top Players).

```
┌──────────────────────────────────────────────────────────────┐
│  ‹ Squad          Price changes                              │
├──────────────────────────────────────────────────────────────┤
│  [ Actual ]  [ Tonight ]          ← primary mode             │
├──────────────────────────────────────────────────────────────┤
│  [ All FPL ]  [ My squad 🔒? ]    ← scope (premium gate)     │
├──────────────────────────────────────────────────────────────┤
│  Actual only: [ This GW ] [ Season ]                         │
│  [ Risers ▲ ] [ Fallers ▼ ]       ← direction                │
├──────────────────────────────────────────────────────────────┤
│  [ All ] [ GK ] [ DEF ] [ MID ] [ FWD ]  ← position (scroll) │
├──────────────────────────────────────────────────────────────┤
│  #  Jersey  Name / club / pos                                │
│     £6.2m  +£0.1   ↑ 42k in   [Likely]  ← Tonight badge      │
│  … (max 50, progressive scroll)                              │
├──────────────────────────────────────────────────────────────┤
│  My squad (free): blurred list + overlay → PremiumSheet      │
└──────────────────────────────────────────────────────────────┘
         row tap → PlayerProfileSheet (BottomSheet)
```

## Data: FPL bootstrap fields

| Field | Use |
|-------|-----|
| `cost_change_event` | Actual — this GW delta (tenths of £0.1m) |
| `cost_change_start` | Actual — season net delta |
| `now_cost` | Display price |
| `transfers_in_event` / `transfers_out_event` | Row context + prediction input |
| `selected_by_percent` | Ownership + prediction threshold |
| `price_change_percent` | Optional “Price Δ%” column on Tonight tab |

Filter: `change !== 0` before sort; take top 50.

## Proxy endpoints

### `GET /api/price-changes`

Query: `period=gw|season`, `direction=rise|fall`, `position=all|GK|DEF|MID|FWD`

Response:

```ts
{
  period: 'gw' | 'season';
  direction: 'rise' | 'fall';
  players: PriceChangePlayer[]; // max 50
}
```

`PriceChangePlayer`: `id`, `webName`, `position`, `teamCode`, `teamShortName`, `nowCost`,
`changeAmount`, `transfersInEvent`, `transfersOutEvent`, `selectedByPercent`.

Sort: rise → desc `changeAmount`; fall → asc (most negative first).

Cache: reuse `bootstrap-static` (TTL 7200s).

### `GET /api/price-predictions`

Query: `direction=rise|fall`, `position=...`

Response:

```ts
{
  direction: 'rise' | 'fall';
  players: PricePredictionPlayer[]; // max 50, likelihood !== 'unlikely'
}
```

`PricePredictionPlayer`: same base fields + `likelihood: 'likely' | 'very_likely'`,
`netTransfersEvent`, `threshold`, `transferInPercent` (derived).

### Squad-scoped (premium)

`GET /api/price-changes/squad` and `GET /api/price-predictions/squad` — same query params.

- Requires authenticated user with `fplTeamId`.
- Requires `subscriptionTier === 'premium'`; else **403** `{ error: 'premium_required' }`.
- Loads picks for **current GW** from existing squad/picks path; filters global lists to
  `pick.element` ids (15 players).

Free tier: web never calls squad endpoints; shows blur + upsell from cached global response
filtered client-side to squad IDs for teaser (optional) OR static placeholder rows — **prefer
server 403 only** and client blurs a locally filtered preview without revealing prediction
likelihood values (blur entire “My squad” panel).

### `GET /api/players/:playerId/profile`

Query: `gw` (optional, defaults to latest **finished** GW).

Response:

```ts
{
  player: { id, webName, position, teamCode, teamShortName, nowCost, selectedByPercent, status, news };
  gw: number | null;
  gwStats: StatEntry[] | null;  // from element-summary history round === gw
  gwPoints: number | null;
  nextFixtures: FixtureInfo[];
}
```

Cache: 10 min per `playerId+gw`. Rate-limit via existing fpl-client.

## Prediction heuristic (PRED-06)

Deterministic, documented approximation (not official FPL). Tune constants in one module
`price-prediction.ts` with unit tests.

```
net = transfers_in_event - transfers_out_event
threshold_rise = baseRise + ownershipFactor * selected_by_percent
threshold_fall = baseFall + ownershipFactor * selected_by_percent
```

Default starting constants (adjust in tests against known community examples):

- `baseRise = 40000`, `baseFall = 40000`, `ownershipFactor = 600` (transfers count scale).

Likelihood:

| Condition (rise) | Badge |
|------------------|-------|
| `net >= 1.5 * threshold` | Very likely |
| `net >= threshold` | Likely |
| else | Unlikely (exclude from list) |

Fall: use `net <= -threshold` symmetrically.

`transferInPercent`: `transfers_in_event / (transfers_in_event + transfers_out_event) * 100`
when denominator > 0.

**Disclaimer** in screen footer copy: predictions are estimates, not guaranteed.

## Premium gate

### Backend

Add `subscription_tier` column on `users`: `text`, default `'free'`, check `free|premium`.
Expose on session / `GET /api/me` as `subscriptionTier`.

Dev override: `PREMIUM_OVERRIDE_EMAIL` env (optional) for testing.

### Frontend

`useSubscriptionTier()` → `'free' | 'premium'`.

“My squad” tab:

- `premium`: fetch squad endpoints, render lists.
- `free`: show same layout with `PremiumLockedOverlay` (blur + lock icon); tap opens
  `PremiumSheet` with price-changes-specific copy.

Do **not** expose squad prediction rows in API responses for free users.

## Player profile sheet

Extract shared **`PlayerProfileSheet`** (`BottomSheet`) from `PlayerCard` info popup markup.

Props: `playerId`, `open`, `onClose`, `onFollow`, `isFollowing`.

On open: `usePlayerProfile(playerId, lastFinishedGw)` + `usePlayerPool` for fixtures fallback.

Sections (top to bottom):

1. Header: name, price, ownership, position / club, close, follow ☆/★
2. If `gwStats`: “GW{n} performance” stat chips (reuse `formatStatLabel`)
3. Else: omit section (no error)
4. Upcoming fixtures (5 rows, same as PlayerCard popup)

Opened from price row tap; row button `stopPropagation` not needed (whole row is button).

## UI components

| Component | Notes |
|-----------|-------|
| `PriceChangeRow` | Jersey, meta, price pill, change badge (green/red), transfer arrow counts |
| `PricePredictionRow` | + likelihood badge (`--fpl-*` semantic tokens) |
| `FilterChipBar` | Reusable horizontal scroll chips (position + maybe period) |
| `PremiumLockedOverlay` | `backdrop-filter` + lock; tokens only |

Reuse: `ScreenHeader`, `Jersey`, `PositionBadge`, `BottomSheet`, `PremiumSheet`,
`useFollowPlayer`, progressive list pattern from `TopPlayersScreen`.

## Empty states

| Case | Copy intent |
|------|-------------|
| Actual GW, no movers | No price changes this gameweek yet; updates overnight UK |
| Actual Season, no movers | No season price movement recorded |
| Tonight, no predictions | No players currently projected to rise/fall |
| My squad empty filter | None of your players match this filter |

## Copy keys (add to `copy.ts`)

`priceChangesNavLink`, `priceChangesTitle`, `priceChangesActualTab`, `priceChangesTonightTab`,
`priceChangesAllFpl`, `priceChangesMySquad`, `priceChangesThisGw`, `priceChangesSeason`,
`priceChangesRisers`, `priceChangesFallers`, `priceChangesLikelyRise`, `priceChangesLikelyFall`,
`priceChangesPremiumTitle`, `priceChangesPremiumDescription`, `priceChangesDisclaimer`,
`priceChangesEmptyGw`, `priceChangesProfileGw`, position filter labels.

## Testing

- Proxy: sort/filter cap 50; prediction thresholds; squad filter; premium 403.
- Web: tab switching; free blur on My squad; profile sheet follow; position filter narrows list.

## Docs

Update `docs/fpl-api.md` `elements[]` with price + transfer event fields and
`element-summary` for profile endpoint.
