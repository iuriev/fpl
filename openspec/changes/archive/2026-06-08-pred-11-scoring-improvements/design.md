# Design: Prediction scoring model improvements (PRED-11)

## Architecture overview

```
Vaastav CSV (bonus, yellow_cards, saves, clean_sheets)
    → ingest.ts (parse new columns)
    → pred_player_gw_fact (new DB columns via migration)
    → PlayerGwFactRow / PlayerHistory (updated interfaces)
    → bonus.ts       → expectedBonusPts
    → yellow-card.ts → expectedYellowDeduction
    → player-layer.ts (prob60Plus split, MID csProb, GK saves)
    → fpl-points.ts  → modelXPts (extended formula)
    → pred_player_gw (unchanged schema, updated values)
```

---

## 1. DB migration

Add four `smallint` columns to `pred_player_gw_fact`. All nullable to handle rows loaded
before migration:

```sql
ALTER TABLE pred_player_gw_fact
  ADD COLUMN bonus             SMALLINT,
  ADD COLUMN yellow_cards      SMALLINT,
  ADD COLUMN saves             SMALLINT,
  ADD COLUMN clean_sheets      SMALLINT;
```

Drizzle schema update in `proxy/src/db/schema.ts` — four new `smallint` fields on
`predPlayerGwFact`, all `.default(0)` for new rows, nullable for back-compat.

---

## 2. Ingest update

`ingest.ts` already has a row-parsing function. Extend it to read:

```typescript
bonus:        Number(r.bonus)        || 0,
yellowCards:  Number(r.yellow_cards) || 0,
saves:        Number(r.saves)        || 0,
cleanSheets:  Number(r.clean_sheets) || 0,
```

Add to the `INSERT ... ON CONFLICT DO UPDATE` upsert block:

```typescript
bonus:        sql`excluded.bonus`,
yellowCards:  sql`excluded.yellow_cards`,
saves:        sql`excluded.saves`,
cleanSheets:  sql`excluded.clean_sheets`,
```

---

## 3. Interface updates

### `PlayerGwFactRow` (prediction/types.ts)

```typescript
bonus?: number;
yellowCards?: number;
saves?: number;
cleanSheets?: number;
```

### `PlayerHistory` (player-layer.ts)

```typescript
bonus: number;
yellowCards: number;
saves: number;
cleanSheets: number;
```

Add these when pushing to `historyByEl` from the fact row.

---

## 4. `prob60Plus` split from `minsProb`

Currently `minutesProb()` returns `avg_minutes / 90` and is used as both a minutes scaler
and a p(≥60 min) proxy. These are semantically different:

- **`minsProb`** — `avg_minutes / 90` — used to scale xGoals, xAssists, defconPts,
  bonusPts, yellow card rate. Represents expected playing time as a fraction of 90 mins.
- **`prob60Plus`** — `count(appearances ≥ 60) / total appearances` over the last 5 games —
  used only for the appearance bonus formula.

```typescript
function prob60Plus(history: PlayerHistory[]): number {
  if (history.length === 0) return 0.5;
  const recent = history.slice(-5);
  const over60 = recent.filter(h => h.minutes >= 60).length;
  return over60 / recent.length;
}
```

The `appearance` formula in `modelXPts` becomes:

```
appearance = (1 − prob60Plus) × 1 + prob60Plus × 2
```

`minsProb` stays as-is for all other components.

---

## 5. `bonus.ts` — expected bonus points

### Position-level prior (calibrated from 2024-25 data)

```typescript
const BONUS_PRIOR: Record<PlayerPosition, number> = {
  FWD: 0.39,
  MID: 0.16,
  DEF: 0.12,
  GK: 0.16,
};
```

### Player-level rolling average

```typescript
const BONUS_WINDOW = 10;
const BONUS_FULL_WEIGHT_GAMES = 8;

function rollingBonusPts(history: PlayerHistory[]): { rate: number; games: number } {
  const recent = history
    .slice(-BONUS_WINDOW)
    .filter(h => h.minutes > 0);
  if (recent.length === 0) return { rate: 0, games: 0 };
  const avg = recent.reduce((s, h) => s + h.bonus, 0) / recent.length;
  return { rate: avg, games: recent.length };
}

function blendedBonusRate(
  position: PlayerPosition,
  history: PlayerHistory[],
): number {
  const { rate, games } = rollingBonusPts(history);
  if (games === 0) return BONUS_PRIOR[position];
  const weight = Math.min(games / BONUS_FULL_WEIGHT_GAMES, 1);
  return weight * rate + (1 - weight) * BONUS_PRIOR[position];
}
```

### Context-based bonus from xG+xA (non-GK)

Calibrated Poisson-weighted lookup using 2024-25 empirical rates:

```typescript
const BONUS_RATE_BY_GI = [0.042, 0.860, 2.224, 2.690]; // index = g+a bucket (0,1,2,3+)

function contextBonusPts(xGoals: number, xAssists: number): number {
  const lambda = xGoals + xAssists;
  // Poisson PMF for k=0,1,2,3+
  const p0 = Math.exp(-lambda);
  const p1 = lambda * Math.exp(-lambda);
  const p2 = (lambda ** 2 / 2) * Math.exp(-lambda);
  const p3plus = 1 - p0 - p1 - p2;
  return (
    p0 * BONUS_RATE_BY_GI[0] +
    p1 * BONUS_RATE_BY_GI[1] +
    p2 * BONUS_RATE_BY_GI[2] +
    p3plus * BONUS_RATE_BY_GI[3]
  );
}
```

### `expectedBonusPts` (exported)

For non-GK players, blend context-based and rolling estimates 50/50.
For GK, rolling average only (context formula N/A — GK bonus driven by CS/saves, already
captured elsewhere; avoid double-count).

```typescript
export function expectedBonusPts(
  position: PlayerPosition,
  history: PlayerHistory[],
  xGoals: number,
  xAssists: number,
  minsProb: number,
): number {
  if (position === 'GK') {
    return blendedBonusRate('GK', history) * minsProb;
  }
  const ctx  = contextBonusPts(xGoals, xAssists);
  const roll = blendedBonusRate(position, history);
  return (0.5 * ctx + 0.5 * roll) * minsProb;
}
```

> **GK note:** GK bonus from CS and saves is already captured via the CS component and the
> saves pts component below. The GK rolling average baseline (~0.16) captures residual bonus
> from other BPS sources (e.g. high-save games without CS).

---

## 6. `yellow-card.ts` — expected yellow card deduction

```typescript
const YELLOW_PRIOR: Record<PlayerPosition, number> = {
  FWD: 0.08,
  MID: 0.10,
  DEF: 0.12,
  GK: 0.02,
};
const YC_WINDOW = 10;
const YC_FULL_WEIGHT_GAMES = 8;

export function expectedYellowDeduction(
  position: PlayerPosition,
  history: PlayerHistory[],
  minsProb: number,
): number {
  const recent = history.slice(-YC_WINDOW).filter(h => h.minutes > 0);
  const prior = YELLOW_PRIOR[position];
  if (recent.length === 0) return prior * minsProb * -1;
  const rate = recent.reduce((s, h) => s + h.yellowCards, 0) / recent.length;
  const weight = Math.min(recent.length / YC_FULL_WEIGHT_GAMES, 1);
  const blended = weight * rate + (1 - weight) * prior;
  return blended * minsProb * -1;
}
```

---

## 7. GK saves points

GK earns 1 pt per 3 saves. Model as `expectedSaves / 3` where `expectedSaves` is the
rolling average saves per game played:

```typescript
const SAVES_WINDOW = 8;
const SAVES_PRIOR_PER90 = 3.0; // league-average GK faces ~3 shots on target / game

export function expectedSavesPts(
  history: PlayerHistory[],
  minsProb: number,
): number {
  const recent = history.slice(-SAVES_WINDOW).filter(h => h.minutes > 0);
  if (recent.length === 0) return (SAVES_PRIOR_PER90 / 3) * minsProb;
  const avg = recent.reduce((s, h) => s + h.saves, 0) / recent.length;
  return (avg / 3) * minsProb;
}
```

Add call in `predictFixture` for GK only, pass result into `modelXPts`.

---

## 8. MID clean sheet fix

In `player-layer.ts:predictFixture`, change the csProb guard from GK/DEF-only to include MID:

```typescript
// Before:
if ((position === 'GK' || position === 'DEF') && csTeam !== null) {

// After:
if ((position === 'GK' || position === 'DEF' || position === 'MID') && csTeam !== null) {
```

`fpl-points.ts` already has `POS_CS_PTS[MID] = 1` and the formula handles it correctly once
`csProb` is non-null.

---

## 9. `fpl-points.ts` — updated `modelXPts` signature and formula

```typescript
export function modelXPts(
  position: PlayerPosition,
  xGoals: number,
  xAssists: number,
  csProb: number | null,
  lambdaAgainst: number,
  minsProb: number,
  prob60Plus: number,       // new — separate from minsProb
  defconPts: number,
  bonusPts: number,         // new
  savesPts: number,         // new (0 for non-GK)
  yellowDeduction: number,  // new (≤ 0)
): number {
  const appearance = (1 - prob60Plus) * 1 + prob60Plus * 2;
  const goals   = xGoals * (POS_GOAL_PTS[position] ?? 4);
  const assists = xAssists * 3;
  const cs =
    csProb !== null && POS_CS_PTS[position] > 0
      ? csProb * minsProb * POS_CS_PTS[position]
      : 0;
  const gc =
    position === 'GK' || position === 'DEF'
      ? Math.floor((lambdaAgainst * minsProb) / 2) * -1
      : 0;
  return appearance + goals + assists + cs + gc + defconPts
       + bonusPts + savesPts + yellowDeduction;
}
```

---

## 10. Spec file updates

### `fpl-points-prediction.md`

- Step 4 formula: add `prob60Plus` to appearance, add `bonusPts`, `savesPts`,
  `yellowDeduction` to `modelXPts`.
- New Step 3b — Bonus pts (before defcon, renumber defcon to Step 3c).
- New Step 3c — GK saves pts.
- New Step 3d — Yellow card deduction.
- Update MID CS note: csProb is now set for MID.

### `shared.md`

- `minsProb` section: clarify it is `avg_minutes / 90`, distinct from `prob60Plus`.
- Add `prob60Plus` definition: fraction of last 5 appearances with ≥ 60 minutes played.

---

## 11. `docs/db-schema.md` update

Add the four new columns to the `pred_player_gw_fact` table section and the Mermaid ER diagram.

---

## Testing strategy

- Unit tests for `rollingBonusPts`, `expectedBonusPts`, `contextBonusPts`.
- Unit tests for `expectedYellowDeduction`.
- Unit tests for `expectedSavesPts`.
- Unit tests for `prob60Plus` (verify a 70-min-average player gets value close to 1.0,
  a 45-min-average sub gets value close to 0.0).
- Updated `modelXPts` snapshot test with new signature.
- `npm run test -w proxy` green.
