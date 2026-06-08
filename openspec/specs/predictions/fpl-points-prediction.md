# FPL Points Prediction

Expected FPL points a player will score in a gameweek.
This is the top-level prediction output. It aggregates all sub-models into a single `xPts` figure.

Sub-models consumed (all values must come from these specs — never recomputed inline):
- `team-xg-prediction.md` → `λ_for`, `λ_against`
- `team-cleansheet-prediction.md` → `csProb`
- `xa-prediction.md` → `xAssists`
- `shared.md` → `minsProb`, `confidence`, `shareXg`

---

## Outputs

| Field | Type | Meaning |
|-------|------|---------|
| `xGoals` | `number` | Expected goals scored by this player |
| `xAssists` | `number` | Expected assists (from `xa-prediction.md`) |
| `csProb` | `number \| null` | Clean sheet probability (from `team-cleansheet-prediction.md`) |
| `defconPts` | `number` | Expected defensive contribution bonus points |
| `modelXPts` | `number` | Pure model expected points before EP blend |
| `xPts` | `number` | Final headline expected points (hybrid model + EP) |
| `confidence` | `'low' \| 'medium' \| 'high'` | Data quality signal (from `shared.md`) |
| `epNextAnchor` | `number` | FPL's `ep_next` used as the EP blend anchor |

For double gameweeks, `xGoals`, `xAssists`, `defconPts`, `modelXPts`, `xPts`, and
`epNextAnchor` are **summed** across fixtures. `csProb` is combined with the DGW formula
from `team-cleansheet-prediction.md`.

---

## Step 1 — Player xG

```
xGoals = λ_for × shareXg × minsProb
```

`shareXg` is the player's rolling 5-match share of team xG (see `shared.md`).
`λ_for` comes from `team-xg-prediction.md` — never recomputed here.

---

## Step 2 — Player xA

`xAssists` is taken directly from `xa-prediction.md`. It is not recomputed in this model.

---

## Step 3 — Defcon points

Defcon = FPL's "defensive contribution" bonus (tackles + interceptions reaching threshold).

### Hit rate

```
DEFCON_THRESHOLD = { DEF: 10, MID: 12, FWD: 12 }   // defensive_contribution score
PRIOR_HIT_RATE   = { DEF: 0.38, MID: 0.28, FWD: 0.06, GK: 0 }
WINDOW = 8 GW rows where minutes ≥ 60

played = history rows where minutes ≥ 60, last WINDOW rows
hits   = played rows where defensiveContribution ≥ THRESHOLD[position]

// Bayesian blend with prior weight = 3
defconHitRate = (hits + PRIOR_HIT_RATE[position] × 3) / (played.length + 3)
```

If `played.length === 0`, `defconHitRate = PRIOR_HIT_RATE[position]`.
GK always returns `0` for both hit rate and defcon points.

### Expected defcon points

```
DEFCON_PTS = 2

defconPts = DEFCON_PTS × defconHitRate × minsProb
```

---

## Step 4 — modelXPts

FPL scoring rules translated into expected value:

```
POS_GOAL_PTS = { GK: 6, DEF: 6, MID: 5, FWD: 4 }
POS_CS_PTS   = { GK: 4, DEF: 4, MID: 1, FWD: 0 }

appearance = (1 − minsProb) × 1 + minsProb × 2
             // 1 pt for playing any minutes, +1 pt for playing 60+

goals  = xGoals × POS_GOAL_PTS[position]
assists = xAssists × 3

cs = (position ∈ {GK, DEF}) ? csProb × minsProb × POS_CS_PTS[position] : 0
     // csProb already contains one minsProb factor (see team-cleansheet-prediction.md),
     // so the p60 × csProb product effectively gives: csProbTeam × minsProb²
     // This is intentional — both conditions (playing 60+ AND team keeping CS) must hold.

gc = (position ∈ {GK, DEF}) ? floor(λ_against × minsProb / 2) × (−1) : 0
     // −1 pt per 2 goals conceded while on pitch (integer penalty)

modelXPts = appearance + goals + assists + cs + gc + defconPts
```

---

## Step 5 — Hybrid xPts

The final `xPts` blends the pure model output with FPL's official `ep_next` to anchor
sparse-data players to a reasonable baseline.

```
EP_WEIGHT = { high: 0.25, medium: 0.45, low: 0.65 }

xPts = (1 − EP_WEIGHT[confidence]) × modelXPts + EP_WEIGHT[confidence] × epNext
```

`epNext` = `ep_next` from FPL bootstrap-static for the target event.
`confidence` is computed from `shared.md`.

| Confidence | Model weight | EP weight | Interpretation |
|-----------|-------------|----------|----------------|
| `high` | 75% | 25% | Enough history — trust the model |
| `medium` | 55% | 45% | Mixed signal |
| `low` | 35% | 65% | Sparse history — anchor to FPL EP |

---

## Constraints

- `xAssists` and `csProb` are **always** taken from their own prediction specs.
  They are never recalculated inline with different formulas.
- `λ_for` and `λ_against` are always resolved from the **same** `TeamPoissonFit` run —
  not from separate fits for different sub-models.
- `modelXPts` is stored in `pred_player_gw.model_x_pts` independently of `xPts`,
  so the EP blend can be audited or changed without re-running the full scoring pipeline.
