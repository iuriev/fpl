# Tasks: Price Changes & Predictions (ANA-03 + PRED-06)

## 1. Premium seam

- [x] 1.1 Add `subscription_tier` to `users` schema + migration (default `free`)
- [x] 1.2 Expose `subscriptionTier` on `GET /api/me` / session payload
- [x] 1.3 Web: `useSubscriptionTier()` + extend auth user type
- [x] 1.4 Optional dev override env for premium testing

## 2. Proxy — bootstrap & actual changes

- [x] 2.1 Extend `FPLBootstrapStatic.elements` with price/transfer fields
- [x] 2.2 Implement `price-changes-service.ts` (gw/season, rise/fall, position, top 50)
- [x] 2.3 `GET /api/price-changes` route + tests
- [x] 2.4 Squad variant with auth + premium guard + picks filter + tests
- [x] 2.5 Update `docs/fpl-api.md`

## 3. Proxy — predictions

- [x] 3.1 Implement `price-prediction.ts` heuristic + unit tests
- [x] 3.2 `price-predictions-service.ts` + `GET /api/price-predictions` + squad route + tests

## 4. Proxy — player profile

- [x] 4.1 `fpl-client.getElementSummary(id)`
- [x] 4.2 `player-profile-service.ts` — last finished GW stats + pool fixtures
- [x] 4.3 `GET /api/players/:playerId/profile` + tests

## 5. Web — screen & API

- [x] 5.1 Types + `api/client` + React Query hooks
- [x] 5.2 `PriceChangeRow`, `PricePredictionRow`, `FilterChipBar`, `PremiumLockedOverlay`
- [x] 5.3 `PriceChangesScreen` — Actual/Tonight, scope, period, direction, position filters
- [x] 5.4 Premium blur on My squad + `PremiumSheet` copy
- [x] 5.5 Route `/price-changes` + `TeamInfoPanel` nav link
- [x] 5.6 Screen tests (tabs, filter, premium gate, empty states)

## 6. Web — player profile sheet

- [x] 6.1 `PlayerProfileSheet` component (extract from PlayerCard popup patterns)
- [x] 6.2 Wire row tap → sheet + `usePlayerProfile` + follow button
- [x] 6.3 Tests: profile with/without GW stats, follow toggle

## 7. Finish

- [x] 7.1 Lint + test workspaces (`proxy`, `web`) — scoped tests pass; pre-existing TransferScreen/MyTeam failures unchanged
- [x] 7.2 Mark ANA-03 and PRED-06 done in `docs/backlog.md` when shipped
