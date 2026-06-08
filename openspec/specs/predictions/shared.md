# Predictions — Shared Foundations

Shared building blocks referenced by all prediction model specs in this folder.
Any change to constants, formulas, or data sources here must be reflected in every
model spec that depends on it.

---

## Data sources

| Source | What it provides | Format |
|--------|-----------------|--------|
| vaastav Fantasy-Premier-League repo | Historical player GW facts per season (goals, assists, xG, xA, minutes, starts, `defensive_contribution`, `bonus`, `yellow_cards`, `saves`, `clean_sheets`) | CSV (`merged_gw.csv`) |
| football-data.co.uk E0 CSVs | Historical EPL match results: scores, shots, betting odds | CSV (`E0_XXXX.csv`) |
| FPL element-summary API | Current-season per-player fixture history (same fields as vaastav but live) | JSON (cached in `fpl_element_summary_cache`) |
| FPL bootstrap-static API | Element metadata: position, team, `ep_next`, `code` | JSON (cached in `fpl_bootstrap_cache`) |
| Transfermarkt squad ingest (offline) | Tactical role (`gk`, `lb`, `cb`, `rb`, `dm`, `cm`, `am`, `lm`, `rm`, `lw`, `rw`, `st`) and pitch lane per player | `player-tactical-roles.json` (in-repo) |

**No paid API is used at runtime or during model scoring.**

---

## Training seasons

The model is trained on `2022-23` and `2023-24` EPL data only.
`TRAIN_SEASONS = ['2022-23', '2023-24']`

When scoring a target gameweek `N`, training data is capped at GW `N−1` of the current season.

---

## Prior-season carry-in

Players with fewer than 5 GW facts in the current season receive additional history rows
from `TRAIN_SEASONS`, matched by FPL player `code` (stable across seasons).

When `targetEvent ≤ 5` (early season), **all** players receive prior-season carry-in.
Otherwise only players with `< 5` current-season GW rows receive it.

---

## Team Poisson model

Used by: `team-xg-prediction.md`, `team-cleansheet-prediction.md`, `xa-prediction.md`, `fpl-points-prediction.md`.

### Parameters

| Symbol | Meaning |
|--------|---------|
| `μ` (mu) | League-average log goals. Initialised to `log(mean goals per team per match)`. |
| `h` (homeAdv) | Home-advantage offset in log space. Initialised to `0.2`. |
| `aₜ` (attack[t]) | Team `t` attack strength in log space. Initialised to `0`. |
| `dₜ` (defence[t]) | Team `t` defensive weakness in log space. Initialised to `0`. |

Attack and defence vectors are **zero-centred** after every gradient step.

### Fitting algorithm

Gradient ascent on Poisson log-likelihood, 120 iterations, learning rate `lr = 0.02 / N`
where `N` is the number of training matches.

For each match (home team `H`, away team `A`, full-time goals `g_H` and `g_A`):

```
log λ_H = μ + h + a_H + d_A
log λ_A = μ + a_A + d_H

λ_H = clamp(log λ_H)   // exp(max(-5, min(5, x)))
λ_A = clamp(log λ_A)

∂μ    += (g_H − λ_H) + (g_A − λ_A)
∂h    += (g_H − λ_H)
∂a_H  += (g_H − λ_H)
∂d_A  += (g_H − λ_H)
∂a_A  += (g_A − λ_A)
∂d_H  += (g_A − λ_A)
```

After each iteration, re-centre attack and defence:
```
a_H -= mean(a)   for all teams
d_H -= mean(d)   for all teams
```

The fit produces a `TeamPoissonFit` record:
```ts
{ mu, homeAdv, attack: Map<teamSlug, number>, defence: Map<teamSlug, number>, teams: string[] }
```

Team slugs are resolved through `FplIdentityMapper` (`proxy/src/fpl-identity/`):
- FPL `team_id` → slug via the season team registry (vaastav snapshot or live bootstrap)
- Vaastav team names in merged_gw → slug via `resolveTeamSlug`
- Football-data team names → slug via `slugFromFd`, validated against the season registry at ingest

`pred_team_alias` is populated from the 2023-24 vaastav registry via `ingestTeamAlias` (canonical
`team_id` → slug). At score time, `softTeamSlugLookup(identity)` replaces ad-hoc
`slugFromVaastav` / map lookups in `player-layer`. Legacy helpers `buildFplTeamIdToSlug` /
`mergeTeamIdToSlug` in `team-names.ts` remain for identity audits only — not used in scoring.

Player `fplCode` attachment at score time uses `FplIdentityMapper.attachFplCodes` (strict:
throws `FplIdentityError` when any `seasonElementId` lacks a mapping).

---

## Minutes probability (minsProb)

`minsProb` = `avg_minutes / 90` — represents the player's expected playing time as a
fraction of 90 minutes. Used as a scaling factor for xGoals, xAssists, defconPts,
bonusPts, savesPts, and yellow card rate.

```
recent5 = last 5 GW rows in player history (sorted by round, fixture)
avgMins = mean(recent5.minutes)
minsProb = clamp(avgMins / 90, 0.05, 1)
```

If the player has no history: `minsProb = 0.5`.

**`minsProb` is not the same as `prob60Plus`** — see below.

---

## Probability of playing 60+ minutes (prob60Plus)

`prob60Plus` is the fraction of recent appearances in which the player played at least
60 minutes. Used **only** in the appearance bonus formula in `fpl-points-prediction.md`.

```
recent5 = last 5 GW rows in player history
prob60Plus = count(recent5.minutes ≥ 60) / recent5.length
```

If the player has no history: `prob60Plus = 0.5`.

**Why separate from `minsProb`?**
A player who averages 70 min has `minsProb ≈ 0.78`, but almost always earns the 2-pt
appearance bonus (prob60Plus ≈ 1.0). A substitute who averages 45 min has `minsProb = 0.5`
but never earns the 60-min bonus (prob60Plus ≈ 0.0). Using `minsProb` as a proxy for
`prob60Plus` overestimates appearance pts for subs and underestimates them for rotational
starters.

---

## Confidence

Confidence classifies how much model history we have for a player. It controls the
blend weight in `fpl-points-prediction.md`.

```
recent5 = last 5 GW rows
sampleGws   = count of recent5 rows where minutes > 0
avgMinutes  = mean(recent5.minutes)
startRate   = count(recent5.starts > 0) / max(recent5.length, 1)
```

| Condition | Confidence |
|-----------|-----------|
| `sampleGws < 3` OR `avgMinutes < 45` | `low` |
| `sampleGws ≥ 5` AND `startRate ≥ 0.75` AND `avgMinutes ≥ 70` | `high` |
| Otherwise | `medium` |

---

## FPL positions

| `element_type` | Position |
|---------------|---------|
| 1 | GK |
| 2 | DEF |
| 3 | MID |
| 4 | FWD |

---

## Team xG share (shareXg)

Used by `fpl-points-prediction.md` to allocate team-level xG to individual players.

For each GW row, `shareXg` is the player's rolling 5-match share of their team's xG:

```
recent5 = last 5 (player xG, team xG) pairs before this row
shareXg = sum(player xG in recent5) / sum(team xG in recent5)
shareXg = min(shareXg, 1)
```

If no history exists, position defaults apply:

| Position | Default shareXg | Default shareXa |
|----------|----------------|----------------|
| FWD | 0.12 | 0.06 |
| MID | 0.08 | 0.10 |
| DEF / GK | 0.04 | 0.05 |
