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

## Player xG/90 rate (blendedXgPer90)

Used by `fpl-points-prediction.md` to compute player-level xGoals.

Rolling window of last 12 GW rows:

```
recentN = last 12 GW rows in player history
xgPer90 = sum(recentN.expectedGoals) / sum(recentN.minutes) × 90
```

Blended with a positional/role prior:

```
weight   = min(totalMins / 540, 1)   // full weight after 6 × 90 min
blended  = weight × xgPer90 + (1 − weight) × prior
```

**xG priors by tactical role (xG/90):**

| Role | Prior |
|------|-------|
| `st` | 0.30 |
| `rw` / `lw` | 0.15 |
| `am` | 0.12 |
| `cm` | 0.08 |
| `dm` / `rb` / `lb` | 0.04 |
| `cb` | 0.02 |
| `gk` | 0.01 |

**Fallback by FPL position when tactical role is unknown:**

| Position | Prior xG/90 |
|----------|------------|
| FWD | 0.28 |
| MID | 0.10 |
| DEF | 0.03 |
| GK | 0.01 |

If the player has no history, the prior is used directly.

### Set-piece role boost for xG

Players tagged as direct free-kick or corner takers receive a boost applied to the
**prior only**:

```
SETPIECE_XG_BOOST = {
  freekick_direct: 1.5,
  corner:          1.05,
  corner_r:        1.05,
  corner_l:        1.05,
  freekick_cross:  1.05,
}

effectivePriorXg = rolePrior × max(SETPIECE_XG_BOOST[role] for role in setpieceRoles, default 1)
```

The boost fades naturally as observed history accumulates (same blend weight as above).

---

## Set-piece roles

`player-tactical-roles.json` carries an optional `setpiece` array per player entry:

```json
{ "role": "rw", "lane": "R", "secondary": [], "setpiece": ["corner_r", "freekick_cross"] }
```

Values are a subset of `SetpieceRole`:

| Tag | Meaning |
|-----|---------|
| `corner` | Takes corners (foot unspecified) |
| `corner_r` | Takes corners with right foot |
| `corner_l` | Takes corners with left foot |
| `freekick_direct` | Takes direct free kicks (shooting) |
| `freekick_cross` | Takes indirect/crossing free kicks |

Scraped from Transfermarkt player profile pages during TM ingest phase 2. Only players
in attacking roles (`lw`, `rw`, `am`, `rb`, `lb`, `st`) are scraped.
If no set-piece tags are found on the profile page, no `setpiece` field is written.

---

## Team xA share (shareXa) — xA only

`shareXa` (rolling 5-match share of team xA) was previously used for `xGoals` but is now
**only used internally during data enrichment**. It is **not** part of the `xGoals` formula
as of the player xG/90 rate redesign. The xA calculation uses `blendedXaPer90` instead.
