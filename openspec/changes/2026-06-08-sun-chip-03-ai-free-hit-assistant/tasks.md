# Tasks: CHIP-03 AI Free Hit assistant

## Proxy

- [ ] P1. Add `selling_price` and `purchase_price` to `FPLPicksResponse.picks` in `proxy/src/fpl-client.ts`; update `getSquadPicks()` to pass them through to the squad summary so budget calculation can use sell prices.

- [ ] P2. Create `proxy/src/free-hit-optimizer.ts` — greedy optimiser:
  - Input: total budget, player pool with xPts + position + teamId + nowCost, current squad IDs
  - Output: `{ swaps, totalXPts, targetGw }`
  - Constraints: 2 GK / 5 DEF / 5 MID / 3 FWD, max 3 per club, budget reserve per remaining slot
  - Formation picker: enumerate valid formations for starters, pick highest Σ xPts
  - Done condition: unit tests cover budget constraint, club limit, formation selection, and no-change case

- [ ] P3. Add route `GET /api/squads/:teamId/free-hit-suggest` in `proxy/src/squad-routes.ts` (or equivalent):
  - Read `gw` query param; fall back to `current + 1` when season ended
  - Fetch squad picks (with selling prices) + prediction data for target GW
  - Call optimiser, return `{ swaps, totalXPts, targetGw }`
  - Return `404` if no prediction data; `400` for invalid params
  - Done condition: `curl` against local proxy returns valid JSON

## Web

- [ ] W1. Extend `TransferActionBar` props with `onAiFreeHit`, `isAiLoading`, `freehitAvailable`, `isPremium`; add a second CSS row with "AI Free Hit" and "AI Wildcard" buttons:
  - AI Free Hit: locked (upsell) when non-premium; disabled when `!freehitAvailable`; spinner when `isAiLoading`
  - AI Wildcard: always disabled, lock icon, no handler
  - Done condition: visual snapshot / manual check shows correct states in all four scenarios

- [ ] W2. Wire `handleAiFreeHit` in `TransferScreen`:
  - `setAiLoading(true)` → `fetch /api/squads/:teamId/free-hit-suggest?gw={nextGw}` → on success `updateDraft` with response swaps + set chip to `'freehit'` → `setAiLoading(false)`
  - On error: toast `copy.aiFreehitError`
  - Pass `freehitAvailable = chipStatuses.freehit.status === 'available'` to action bar
  - Done condition: tapping button on local dev fills the pitch and switches chip toggle

- [ ] W3. Add copy strings to `web/src/lib/copy.ts`:
  `aiFreehitButton`, `aiWildcardButton`, `aiFreehitPlayed`, `aiFreehitError`, `aiFreehitNoGain`

## Tests

- [ ] T1. Unit tests for `free-hit-optimizer.ts`:
  - Budget constraint (does not exceed totalBudget)
  - Club limit (≤ 3 per club)
  - All 15 slots filled
  - No swaps when current squad is already optimal
  - Valid formation in starters

- [ ] T2. Update `TransferActionBar.test.tsx` (or snapshot) to cover the new AI row states
