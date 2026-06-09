# Tasks: CHIP-03 Free Hit optimizer polish

## Proxy

- [x] P1. Bench strategy: premium GK, two premium outfield subs, cheap third enabler
- [x] P2. `investRemainingBudget` and `spendRemainingBudgetOnSquad` to minimise unspent bank
- [x] P3. `finalizeSquadLayout` — re-pick best formation on full 15
- [x] P4. API response includes `orderedSquad`, per-player `xPts`, budget fields
- [x] P5. Player pool `expectedPoints` uses model xPts when predictions ready
- [x] P6. Unit tests: XI/bench xPts invariants, bench order, budget spend

## Web

- [x] W1. `buildFreeHitOrderSubs` applies API slot order to draft
- [x] W2. `augmentPoolWithSuggested` syncs xPts from API
- [x] W3. **Predicted total** overlay on `TransferPitch` (top-right)
- [x] W4. Copy string `transferPitchPredictedTotal`
- [x] W5. Tests: `transfer-draft.test.ts`, `TransferPitch.test.tsx`

## Docs

- [x] D1. Sync `openspec/specs/free-hit-assistant/spec.md`
- [x] D2. Update `docs/backlog.md` CHIP-03 shipped note
- [x] D3. Document proxy endpoint in `docs/fpl-api.md`
