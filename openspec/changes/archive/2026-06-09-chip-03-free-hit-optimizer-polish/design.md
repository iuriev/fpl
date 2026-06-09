# Design: CHIP-03 Free Hit optimizer polish

## Optimiser (`proxy/src/free-hit-optimizer.ts`)

### Bench strategy

After the starting XI spine is chosen and `pickBestFormation` selects 11 starters:

1. **Bench GK** — best affordable GK not in XI (not necessarily cheapest)
2. **Outfield subs 1–2** — highest xPts upgrades within remaining budget
3. **Outfield sub 3** — cheapest playable enabler (`pickThirdBenchEnabler`, uses `playConfidence`)
4. **`investRemainingBudget`** — iteratively upgrades bench slots while budget remains
5. **`spendRemainingBudgetOnSquad`** — final pass to burn leftover budget on any slot
6. **`finalizeSquadLayout`** — re-run `pickBestFormation` on all 15; split starters/bench

### Validation

`findXiBenchXPtsIssues` exported for tests: flags any same-position bench player with
higher xPts than a starter.

### API response

```ts
{
  orderedSquad: number[];       // 15 FPL element ids
  players: Array<{ id, position, nowCost, xPts }>;
  totalXPts: number;            // sum of starter xPts
  targetGw: number;
  totalBudget: number;
  selectedCost: number;
  remainingBudget: number;
}
```

Endpoint: `GET /api/squad/:teamId/free-hit-suggest?gw=N`

## Player pool alignment

`/api/player-pool` sets `expectedPoints` from model xPts when predictions are ready;
falls back to FPL `ep_next`. Ensures transfer cards show the same values the optimiser uses.

## Web

### Draft application

`buildFreeHitOrderSubs` swaps players into API slot order (starters 1–11, bench 12–15)
without guessing formation from positions.

`augmentPoolWithSuggested` updates pool player xPts from API `players` array.

### Pitch UI

`TransferPitch` shows **Predicted total** (starter xPts sum) top-right when Free Hit chip
is active. Uses API `totalXPts` when available.
