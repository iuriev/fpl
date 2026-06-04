# Tasks: Predicted Points Screen (PRED-02)

## 1. Web — components

- [x] 1.1 `PredictedPointsRow` — jersey, name, team badge, price, xPts value; row is a `<button>` opening `PlayerProfileSheet`
- [x] 1.2 `PredictedPointsTab` — position tab content: receives sorted `PoolPlayer[]`, renders free (3+blur) or premium (progressive 20/batch) branch
- [x] 1.3 `PredictedPointsScreen` — screen container: GK/DEF/MID/FWD tabs, `usePlayerPool`, `useSubscriptionTier`, `useRequestPremiumUpsell` on mount; GW label in header

## 2. Web — premium progressive render

- [x] 2.1 Implement `IntersectionObserver` sentinel pattern in `PredictedPointsTab` for premium: renders 20 rows initially, appends next 20 when sentinel enters viewport; no new network call (operates on in-memory sorted array)

## 3. Web — free tier blur + upsell

- [x] 3.1 Free branch in `PredictedPointsTab`: slice top 10, render rows 1–3 normally, rows 4–10 blurred; `PremiumLockedOverlay` with `predictedPoints`-specific copy
- [x] 3.2 Wire `requestUpsell('predictions')` on `PredictedPointsScreen` mount (free users only, MON-02 cooldown handles dedup)

## 4. Web — routing & navigation

- [x] 4.1 Add route `/predicted-points` in `App.tsx` (or router config)
- [x] 4.2 Add `TeamInfoPanel` nav link after Leaderboard entry

## 5. Web — copy

- [x] 5.1 Add copy keys to `copy.ts`: `predictedPointsNavLink`, `predictedPointsTitle`, `predictedPointsGwLabel`, `predictedPointsXptsLabel`, `predictedPointsPremiumTitle`, `predictedPointsPremiumDescription`, `predictedPointsEmptyPosition`

## 6. Web — tests

- [x] 6.1 `PredictedPointsScreen.test.tsx`: free tier — rows 1–3 visible, rows 4–10 blurred, overlay present, `requestUpsell` called
- [x] 6.2 `PredictedPointsScreen.test.tsx`: premium tier — no overlay, all players rendered without blur
- [x] 6.3 `PredictedPointsScreen.test.tsx`: tab switch re-sorts list for new position
- [x] 6.4 `PredictedPointsScreen.test.tsx`: row tap → `PlayerProfileSheet` opens
- [x] 6.5 `PredictedPointsScreen.test.tsx`: loading skeleton + empty state per position

## 7. Finish

- [x] 7.1 Lint + test workspaces (`web`) — all new tests pass; no regressions
- [x] 7.2 Update `docs/fpl-api.md` — add note on `ep_next` usage under `elements[]`
- [x] 7.3 Mark PRED-02 done in `docs/backlog.md`
