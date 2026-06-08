# Design: CHIP-03 AI Free Hit assistant

## UI changes

### TransferActionBar — new AI row

```
┌─────────────────────────────────────────────┐
│  [Transfers]    [Reset]    [Save Plan]       │  ← existing row (unchanged)
├─────────────────────────────────────────────┤
│  [✦ AI Free Hit]        [✦ AI Wildcard 🔒]  │  ← new row
└─────────────────────────────────────────────┘
```

Button states for **AI Free Hit**:

| Condition | State |
|---|---|
| Non-premium | Visible, locked (premium lock icon), triggers upsell on tap |
| Premium + `freehit.status !== 'available'` | Visible, disabled, tooltip "Free Hit already played" |
| Premium + `freehit.status === 'available'` | Active |
| Loading (awaiting backend response) | Spinner, disabled |

Button states for **AI Wildcard**:
- Always: visible, disabled, lock icon — placeholder only.

### Pitch after suggestion

No new visual components. The existing transfer highlight language applies:
- Replaced players show the "out" badge (same as a manual swap)
- New players show the "in" highlight
- If no swaps needed (squad is already optimal): toast "Your squad is already near-optimal for GW N"

## Backend design

### Endpoint

```
GET /api/squads/:teamId/free-hit-suggest?gw=<number>
```

Response:
```ts
{
  swaps: Array<{ outId: number; inId: number }>;
  totalXPts: number;          // sum of predicted xPts for the 11 starters
  targetGw: number;
}
```

Error cases:
- `404` — no prediction data available for target GW
- `400` — missing or invalid `gw` param

### Budget calculation

```
totalBudget = Σ selling_price(pick) + entry_history.bank
```

`selling_price` is already returned by the FPL picks endpoint per player.
We need to add it to `FPLPicksResponse.picks` in `fpl-client.ts`.

### Greedy optimiser (`free-hit-optimizer.ts`)

**Input:**
- `budget: number` — total in units of £0.1m (FPL internal)
- `players: Array<{ id, position, teamId, nowCost, xPts }>` — full player pool with xPts
- `currentSquad: number[]` — current player IDs (to compute diff for swaps output)

**Algorithm:**

```
1. Sort players by xPts descending
2. Slots to fill: 2 GK, 5 DEF, 5 MID, 3 FWD
3. Reserve budget = min_cost(GK) × remaining_GK + min_cost(DEF) × remaining_DEF + ...
   (prevents overspending early and being unable to fill later slots)
4. For each player in sorted order:
   - Skip if: position slot full, club count ≥ 3, cost > (budget - reserve)
   - Add to squad, deduct cost, update reserve
5. Determine starters (11 highest-xPts respecting valid formation rules)
   Valid formations: 1 GK + any of {3,4,5} DEF + {2,3,4,5} MID + {1,2,3} FWD = 11
6. Bench = remaining 4 players
7. Diff against currentSquad → return as swaps [{outId, inId}]
```

**Formation selection for starters:**
Fix 1 GK (highest xPts GK in squad). Then enumerate valid outfield formations
(3-5-2, 3-4-3, 4-5-1, 4-4-2, 4-3-3, 5-4-1, 5-3-2, 5-2-3) and pick the one
with highest Σ xPts.

**Team constraint:** max 3 players per club (standard FPL rule).

**Bench strategy:** not optimised — cheapest valid fillers after starters are set.
Future improvement: optimise bench for auto-sub probability.

### Season dev hack

`GET /api/gameweeks` already returns `current` and `next`. When the season has ended and
`next` is null, the optimiser falls back to `current + 1` (i.e., GW38 when GW37 is current).
This is the same pattern used elsewhere in the proxy.

## Frontend wiring

```
TransferScreen
  └── handleAiFreeHit()
        ├── setAiLoading(true)
        ├── fetch GET /api/squads/:teamId/free-hit-suggest?gw={nextGw}
        ├── on success:
        │     setPlanChip('freehit')
        │     updateDraft(d => ({ ...d, chip: 'freehit', swaps: response.swaps }))
        └── on error: toast "Could not load suggestion — try again"
```

`handleAiFreeHit` is passed as `onAiFreeHit` prop to `TransferActionBar`.

No new routes. No new screens. No new data fetching hooks (one-shot fetch via plain `fetch`).

## Copy

```ts
aiFreehitButton:  'AI Free Hit'
aiWildcardButton: 'AI Wildcard'
aiFreehitPlayed:  'Free Hit already played this season'
aiFreehitError:   'Could not load suggestion — try again'
aiFreehitNoGain:  'Your squad is already near-optimal for GW {gw}'
```
