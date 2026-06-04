# Tasks: Predicted Lineups (PRED-08)

## 1. Proxy — formation inference

- [x] 1.1 `formation-inference.ts` — per-fixture DEF/MID/FWD counts from `element-summary` history (`starts === 1`)
- [x] 1.2 Rolling mode over last 5 finished fixtures per team (current season)
- [x] 1.3 Fallback chain: previous season last valid fixture (`fpl_gw_live_cache` + fixtures) → default `4-3-3`
- [x] 1.4 Unit tests: single fixture, DGW two fixtures, empty history, previous-season mock

## 2. Proxy — predicted XI & flanks

- [x] 2.1 `proxy/src/data/player-lanes.json` — seed lanes (`L`/`C`/`R`) by FPL `code` for current PL squads
- [x] 2.2 `player-lane-registry.ts` — load registry; slot templates per formation line; greedy lane assignment
- [x] 2.3 `predicted-lineup-service.ts` — `startScore` heuristic, pick 11 by formation slots, `xMins` / `benchRisk`, emit `lane` + `pitchOrder`
- [x] 2.4 Merge `bootstrap-static` metadata + `ep_next` / status / chance fields
- [x] 2.5 Attach `nextFixture` from upcoming fixtures for target GW
- [x] 2.6 Unit tests: slot filling, lane assignment (RB right), unknown lane → C, tie-break by `ep_next`

## 3. Proxy — route & cache

- [x] 3.1 `GET /api/predicted-lineups` with `requireUser` + `requirePremiumFplUser` (+ optional `?gw=`)
- [x] 3.2 Response caching (10 min) + bounded parallel `element-summary` fetch with existing cache layer
- [x] 3.3 Route integration tests (403 free, 200 premium)

## 4. Web — screen

- [x] 4.1 Types + `usePredictedLineups(gw)` query hook
- [x] 4.2 `PredictedLineupTable` — Name | xMins | xPts, bench-risk highlight
- [x] 4.3 `PredictedLineupPitch` — four-row `Pitch`; cards per row ordered by `pitchOrder` (L→R)
- [x] 4.4 `PredictedLineupsScreen` — premium gate (`PremiumLockedOverlay`, no fetch when free); team scroller; table/pitch toggle
- [x] 4.5 `requestUpsell('predictions')` on mount for free users
- [x] 4.6 Row tap → `PlayerProfileSheet`

## 5. Web — routing & copy

- [x] 5.1 Route `/predicted-lineups` in `App.tsx`
- [x] 5.2 `TeamInfoPanel` nav link
- [x] 5.3 Copy keys in `copy.ts`

## 6. Web — tests

- [x] 6.1 `PredictedLineupsScreen.test.tsx` — free: overlay, no lineup; premium: full content
- [x] 6.2 Pitch order: right-lane player rightmost in row
- [x] 6.3 Team switch, formation label, table vs pitch, bench-risk class
- [x] 6.4 Loading and error states

## 7. Finish

- [x] 7.1 Lint + test workspaces (`proxy`, `web`)
- [x] 7.2 Update `docs/fpl-api.md` (lineup/formation limits)
- [x] 7.3 Link PRED-08 in `docs/backlog.md` to this change (keep task open until shipped)
