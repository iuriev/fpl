# xA Prediction (Expected Assists)

Expected assists a player will earn in a given fixture.
All inputs consumed here are defined in `shared.md` (`minsProb`, Team Poisson fit, player history).

---

## Output

| Symbol | Type | Meaning |
|--------|------|---------|
| `xAssists` | `number ≥ 0` | Expected assists for one fixture |

For multi-fixture gameweeks, `xAssists` is summed across fixtures before storage.

---

## Formula

```
xAssists = blendedXaPer90 × (minsProb × 90 / 90)
         × fixtureAttackMultiplier(λ_for)
         × teamFinishingMultiplier(teamXgPer90)

         = blendedXaPer90 × minsProb
           × fixtureAttackMultiplier
           × teamFinishingMultiplier
```

All three multiplier components must be computed against **the same `λ_for`** from
`team-xg-prediction.md`. Do not recompute `λ_for` here with different parameters.

---

## blendedXaPer90

Bayesian blend of a player's rolling observed xA/90 with a positional prior.

### Rolling observed rate

Window: last `12` GW rows in player history.

```
totalXa   = sum(expectedAssists over window)
totalMins = sum(minutes over window)
rollingRate = (totalXa / totalMins) × 90   // if totalMins > 0, else 0
```

### Prior by tactical role

Calibrated to 2024-25 EPL medians (xA/90):

| Role | Prior xA/90 | Description |
|------|-------------|-------------|
| `am` | 0.32 | Attacking MID / CAM |
| `rw` | 0.28 | Right Winger |
| `lw` | 0.28 | Left Winger |
| `cm` | 0.16 | Central MID |
| `rb` | 0.16 | Attacking fullback |
| `lb` | 0.16 | Attacking fullback |
| `st` | 0.18 | Striker |
| `dm` | 0.07 | Defensive MID |
| `cb` | 0.05 | Centre-back |
| `gk` | 0.01 | Goalkeeper |

Fallback prior by FPL position (when tactical role is unknown):

| Position | Prior xA/90 |
|----------|-------------|
| MID | 0.22 |
| FWD | 0.18 |
| DEF | 0.08 |
| GK | 0.01 |

Tactical roles come from `player-tactical-roles.json` (Transfermarkt offline ingest).
See `lineup-prediction.md` for the ingest process.

### Set-piece role boost

Players tagged as regular set-piece takers in `player-tactical-roles.json` receive a
multiplicative boost applied to the **prior only** (not the rolling observed rate):

```
SETPIECE_XA_BOOST = {
  corner:          1.5,
  corner_r:        1.5,
  corner_l:        1.5,
  freekick_cross:  1.4,
  freekick_direct: 1.1,
}

effectivePrior = prior × max(SETPIECE_XA_BOOST[role] for role in setpieceRoles, default 1)
```

If the player has multiple set-piece roles, the maximum boost is taken.
The boost applies only to the prior component; once a player has accumulated enough
history (540 min), the blend shifts entirely to observed data and the boost fades out.

Set-piece roles (`corner`, `corner_r`, `corner_l`, `freekick_direct`, `freekick_cross`) are
scraped from Transfermarkt player profile pages during the TM ingest phase 2 and stored as
the optional `setpiece` array in `player-tactical-roles.json`.

### Blend

```
XA_RATE_FULL_WEIGHT_MINS = 540

weight = min(totalMins / 540, 1)
blendedXaPer90 = weight × rollingRate + (1 − weight) × effectivePrior
```

A player needs 540 minutes of history (≈ 6 full matches) to reach full weight on observed data.
Below that, the prior (with set-piece boost if applicable) dominates proportionally.

---

## fixtureAttackMultiplier

Scales xA based on how strong this team's attack is relative to the league average.

```
baseline = exp(μ)   // league-average goals per team per match

fixtureAttackMultiplier = λ_for / baseline
```

`λ_for` is the team's expected goals for this fixture (from `team-xg-prediction.md`).
`μ` comes from the same fitted `TeamPoissonFit`.

Rationale: stronger attacking teams create more chances → more assist opportunities.
The multiplier is linear, not log-scaled, to keep it interpretable.

---

## teamFinishingMultiplier

Scales xA based on the quality of the team's finishers. Higher-quality strikers convert
more chances, generating more actual assists from the same number of key passes.

```
LEAGUE_AVG_STRIKER_XG_PER90 = 0.28

teamFinishingMultiplier = clamp(teamXgPer90 / 0.28, 0.6, 1.5)
```

`teamXgPer90` = average xG/90 of the team's top-2 attacking players (by xG/90) in the
training window (GWs 1 to `targetEvent − 1`). Players with fewer than 90 total minutes
are excluded from this calculation.

If `teamXgPer90` is unavailable (e.g. early season, no qualifying players), the multiplier
defaults to `1.0`.

---

## Constraints

- `xAssists ≥ 0` always.
- `blendedXaPer90` is computed from the rolling window ending **before** the target event —
  the target row itself is never included in the history used for scoring.
- `fixtureAttackMultiplier` and `teamFinishingMultiplier` are computed independently;
  neither recalculates the other's inputs.
