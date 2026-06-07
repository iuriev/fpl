# Tasks: PRED-05 CS% & xG market screen

## 1. Proxy — market endpoint

- [x] 1.1 Add `TeamMarketDto` and `MarketResponse` types to `proxy/src/prediction/types.ts`
- [x] 1.2 Create `proxy/src/market-service.ts` — query `pred_fixture_team` for latest score run,
       aggregate DGW fixtures (csProb: complement rule; xG/xGA: sum), join FPL bootstrap for team names
- [x] 1.3 Create `proxy/src/market-routes.ts` — `GET /api/market?event=N`, same validation pattern as `prediction-routes.ts`
- [x] 1.4 Register `marketRoutes` in `proxy/src/index.ts`
- [x] 1.5 Unit tests in `proxy/src/market-routes.test.ts` — valid event returns shaped response; missing run returns `ready: false`; invalid event returns 400

## 2. Web — types & hook

- [x] 2.1 Add `TeamMarketDto` and `MarketResponse` to `web/src/types/index.ts`
- [x] 2.2 Add `useMarket` query to `web/src/api/queries.ts` (follows existing hook pattern) — fetch `/api/market?event=N`, return `{ data, loading, error }`

## 3. Web — MarketScreen

- [x] 3.1 Create `web/src/screens/MarketScreen/MarketScreen.tsx` with tab switcher (CS% / xG),
       sorted rows (desc by value by default), gameweek picker reuse
- [x] 3.2 Create `web/src/screens/MarketScreen/MarketScreen.module.css` — team row layout,
       fixture chips, value bar (CSS width proportional to max value in list), paywall blur
- [x] 3.3 Paywall: free users see first 5 rows; rows 6–20 blurred with lock overlay;
       tap on blurred area calls `requestUpsell('market')` from `PremiumUpsellProvider`
- [x] 3.4 `ready: false` empty state — "Predictions not yet available for GW N" message
- [ ] 3.5 Unit tests in `web/src/screens/MarketScreen/MarketScreen.test.tsx` —
       renders CS% rows sorted desc; renders xG rows on tab switch; blurs rows 6+ for free user;
       calls requestUpsell on blur tap; shows empty state when ready=false

## 4. Web — routing & nav

- [ ] 4.1 Add `/market` route to `web/src/App.tsx` pointing at `MarketScreen`
- [ ] 4.2 Add Market nav item to `BottomNav` (chart-bar icon, between Predicted Points and Price Changes)

## 5. Backlog

- [ ] 5.1 Mark PRED-05 as ✅ Done in `docs/backlog.md`
