# Team xG Prediction

Expected goals a team will score in a given fixture.
Produced by the Team Poisson model — see `shared.md` for the fit algorithm and parameters.

---

## Output

| Symbol | Type | Meaning |
|--------|------|---------|
| `λ_home` | `number` | Expected goals for the home team in this fixture |
| `λ_away` | `number` | Expected goals for the away team in this fixture |

These are per-fixture values. For double gameweeks, each fixture is computed separately.

---

## Formulas

```
λ_home(H, A) = clamp(μ + h + a_H + d_A)
λ_away(H, A) = clamp(μ + a_A + d_H)

clamp(x) = exp(max(−5, min(5, x)))
```

Where `μ`, `h`, `a_t`, `d_t` come from the fitted `TeamPoissonFit` (see `shared.md`).

---

## Usage in downstream models

| Consumer | Uses |
|----------|------|
| `team-cleansheet-prediction.md` | `λ_away` → CS probability for home team; `λ_home` → CS probability for away team |
| `xa-prediction.md` | `λ_for` (the team's own lambda) as attack signal in `fixtureAttackMultiplier` |
| `fpl-points-prediction.md` | `λ_for` → player xG; `λ_against` → goals-conceded penalty |
| `api.md` `TeamMarketDto` | `xG` field = `λ_for` for the team's next fixture |

`λ_for` and `λ_against` are always resolved relative to the player's team:
- Player's team is home → `λ_for = λ_home`, `λ_against = λ_away`
- Player's team is away → `λ_for = λ_away`, `λ_against = λ_home`

---

## Constraints

- `λ` is always `> 0` due to the `exp` clamp — never `NaN` or `0`.
- If either team slug is missing from the fit (new promoted club, alias gap), both `λ_for`
  and `λ_against` default to `0`, and downstream models treat this as no fixture.
