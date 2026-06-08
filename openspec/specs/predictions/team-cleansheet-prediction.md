# Team Clean Sheet Prediction

Probability that a team concedes zero goals in a given fixture.
Derived from the Poisson distribution applied to the opponent's expected goals
(`λ_against`) from `team-xg-prediction.md`.

---

## Output

| Symbol | Type | Meaning |
|--------|------|---------|
| `csProbTeam` | `number ∈ [0, 1]` | Probability the team keeps a clean sheet in this fixture |
| `csProb` (player-level) | `number ∈ [0, 1] \| null` | Player's personal clean sheet probability (GK/DEF only) |

---

## Formulas

### Per-fixture team CS probability

```
P(Poisson(λ) = 0) = exp(−λ)

csProbHome(H, A) = exp(−λ_away(H, A))   // home team keeps CS if away scores 0
csProbAway(H, A) = exp(−λ_home(H, A))   // away team keeps CS if home scores 0
```

### Player-level CS probability (single fixture)

```
csProb = csProbTeam × minsProb
```

`minsProb` is defined in `shared.md`. `csProb` is only set for GK and DEF; it is `null` for MID and FWD.

### Double gameweek (DGW) — combined CS probability

When a player has two fixtures in the same gameweek, combine per-fixture probabilities:

```
csProb_DGW = 1 − (1 − csProb₁)(1 − csProb₂)
```

This is the probability of keeping a clean sheet in **at least one** of the two fixtures,
weighted by minutes in each.

---

## FPL points awarded for clean sheets

| Position | Points |
|----------|--------|
| GK | 4 |
| DEF | 4 |
| MID | 1 |
| FWD | 0 |

The expected CS contribution to `modelXPts` is:
```
csContribution = csProb × p60 × POS_CS_PTS[position]
```

where `p60` = `minsProb` (probability of playing 60+ minutes).
This calculation lives in `fpl-points-prediction.md`; the formula is cited here for
completeness.

---

## Market-level CS probability

The `TeamMarketDto.csProb` field in the API exposes `csProbTeam` (the raw team fixture
value, not multiplied by `minsProb`) for the team's next scheduled fixture.
See `api.md`.

---

## Constraints

- `csProb` is `null` for MID and FWD — never `0` unless explicitly computed as such.
- If `λ_against` is unavailable (team slug missing from fit), `csProbTeam` is `null`
  and `csProb` is `null`.
