# Model improvement proposals — GW1-5

Evaluated: 2026-06-04  
Gameweeks: 1, 2, 3, 4, 5  
Model version: **lineup-v4**

## Executive summary

- **XI precision:** 64.4% (708/1100 starter slots)
- **Formation vs FPL:** 26/100 (26%)
- **Main weakness:** Early-season cold start (GW1 precision 51.8%, formation 0/20) plus MID rotation misses (213) and FWD false positives (73 vs 21 missed)
- **Recommended next step:** Add GW1-specific scoring/pool gates, then tighten FWD effective score and MID rotation cluster; re-run `npm run lineup:eval -- 1-5`

## Metrics snapshot

| Metric | Value |
| --- | --- |
| Recall | 65.4% |
| Missed starters | 375 |
| False positives | 392 |
| Lane mismatch (XI correct) | 136 / 620 (21.9%) |
| Per-player XI accuracy | 48.0% |

## P0 — High impact (implement first)

### P0.1 — GW1 cold-start: preseason minutes inflate start scores

**Problem:** GW1 precision is 51.8% with **0/20** formation matches — worst gameweek in the range. Pool logic already includes all zero-minute players (`predicted-lineup-pool.ts`), and `computePredictedStartScore` backfills from `el.minutes` when `history` is empty, which treats preseason minutes like recent league starts.

**Evidence:**

- GW1: precision 51.8%, recall 53.5%, formation 0/20 (vs GW2–5 ~63–70% precision)
- Repeat false positives skew to new/loan players with preseason volume: LIV **Isak** (5× FP), MCI **Semenyo** / **Guéhi** (5×), TOT **Kolo Muani** / **Gallagher** (5×), WHU **Taty** / **Disasi** (5×)
- Repeat missed actual starters: LIV **Ekitiké** (5× missed) while Isak is 5× FP — classic new-signing inversion

**Proposed change:**

- File: `proxy/src/predicted-lineup-start-score.ts`, `proxy/src/predicted-lineup-service.ts`
- Change: When `isFirstPredictedGameweek(targetGw)` and `summary.history.length === 0`, cap `startsScore`/`minutesScore` from `el.minutes` at a low ceiling (e.g. 0.35) unless `chance_of_playing_*` or status strongly indicates starter; optionally require price/ownership tier or manual override for “presumed XI” in GW1 only
- File: `proxy/src/predicted-lineup-formation-pick.ts` — for GW1, default to most common preseason shape from prior season or 4-4-2 / 4-3-3 prior rather than score-driven pick with noisy inputs

**Expected impact:** +5–8 pp precision on GW1; fewer systematic FP on big-club bench options; formation label >0/20 on GW1

**Risk:** Under-predicting genuine GW1 starters with no history (promoted players); mitigate with chance/status and GK unchanged logic

---

### P0.2 — FWD gate too weak: 73 false positives vs 21 missed

**Problem:** FWD line has the worst precision asymmetry: almost **3.5×** more false positives than missed starters. `effectivePredictedStartScore` only applies `raw * 0.5` when FWD did not start last match — insufficient for rotation-heavy forwards and preseason noise.

**Evidence:**

- `byFplLine`: FWD — correct 74, missed 21, **false positive 73**
- Repeat FP: WOL **Mané** / **Armstrong** (5×), AVL **Bailey** / **Sancho** (4×), MUN **Zirkzee** (4×), BOU **Kroupi.Jr** (3×)

**Proposed change:**

- File: `proxy/src/predicted-lineup-start-score.ts` — `effectivePredictedStartScore`
- Change: Raise FWD penalty when `!startedLastMatch(summary)` from `0.5` → `0.35` (or add hard cap: FWD cannot rank above 3rd-highest FWD on team unless `startedLastMatch` or `chance < 100` with high recency); for GW1, require `startedLastMatch` equivalent from preseason row if available, else apply stricter cap

**Expected impact:** −30–40 FWD false positives over GW1–5; precision +2–3 pp overall

**Risk:** Missing single-GW rotation starts (rare for FWD); monitor repeat-missed FWD list (only 21 misses — low risk)

---

### P0.3 — MID rotation cluster: highest missed volume

**Problem:** MID drives most errors: **213 missed** and **157 false positive** — largest absolute error bucket. Bench-streak multiplier (0.5) may be too weak for dense squads (MCI, WHU, WOL).

**Evidence:**

- `byFplLine`: MID — missed **213**, FP 157 (vs DEF missed 128)
- Weak clubs: WOL 40% avg XI, MCI 51%, WHU 51% with high MID churn
- Repeat missed: WHU **L.Paquetá** (5×), TOT **Kudus** (5×), BHA **Mitoma** (5×), EVE **Gana** / **Grealish** (5× / 4×)

**Proposed change:**

- File: `proxy/src/predicted-lineup-start-score.ts` — extend bench-streak to last **3** league rows with graduated penalty (0.5 → 0.35 → 0.2)
- File: `proxy/src/predicted-lineup-service.ts` or formation pick — when picking MID slots, prefer players within **0.08** start-score of each other only if `startedLastMatch`; else take clear top-N by score (reduce “spread picks” across rotation group)
- Optional: team volatility factor — if team avg XI precision < 55% in rolling eval, widen MID gate (document in ADR if added)

**Expected impact:** −40–60 MID errors combined; recall +3–4 pp on MID-heavy clubs

**Risk:** Over-shrinking to last-match XI when manager rotates after injury; tune window length

---

## P1 — Formation and lanes

### P1.1 — Formation label 26% vs FPL (early season)

**Problem:** Only **26/100** formation matches (vs 37/100 on GW10–14 holdout in `LEARNING_NOTES.md`). GW1 contributes 0/20; even GW5 only 9/20. Derived formation from picked XI does not match manager’s actual shape when XI is ~65% right.

**Evidence:**

- Formation OK: GW1 0/20, GW2 5/20, GW3 7/20, GW4 5/20, GW5 9/20
- XI precision ~64% but formation ~26% — shape/line counts diverge from FPL

**Proposed change:**

- File: `proxy/src/predicted-lineup-formation-pick.ts`
- Change: Score candidate formations against **both** picked XI counts and last-match formation counts (when available); for GW2+, weight last finished match shape at 0.4 in formation score
- Alternative (larger): joint search — pick formation + XI in one pass maximizing sum of starter scores subject to FPL shape

**Expected impact:** Formation matches +10–15 on GW2–5; display alignment for users

**Risk:** May lag sudden tactical shifts; GW1 still needs P0.1

---

### P1.2 — Lane mismatches on correct XI (136 cases)

**Problem:** **21.9%** lane mismatch among correctly picked starters (136/620). Early season has thinner `lastMatchLaneById` history.

**Evidence:**

- `roleAccuracy`: 620 compared, 136 lane mismatches on correct XI
- Repeat missed includes full-backs / wingbacks: NEW **Livramento** (5×), CRY **Richards** (5×), LEE **Gudmundsson** (5×) — may be slot vs line confusion

**Proposed change:**

- File: `proxy/src/last-match-lanes.ts`, `proxy/scripts/player-tactical-role-overrides.json`
- Change: Seed overrides for known WB/LB players (Livramento, Richards, Gudmundsson) to DEF line slots; strengthen wide-DEF vs MID disambiguation in `player-tactical-role.ts` when last match lane is DEF but FPL element_type is MID
- After GW1, prefer **two** last matches for lane tie-break

**Expected impact:** −20–30 lane mismatches; better pitch layout without changing XI precision

**Risk:** Wrong override if player role changes mid-season — keep overrides minimal and documented

---

## P2 — Later / experimental

### P2.1 — Club-specific volatility index

**Problem:** Same model treats BRE (84% avg XI) and WOL (40%) identically.

**Evidence:**

- `byTeam`: WOL precision 40%, BRE 84%; MCI/WHU/NEW/TOT all <58% avg XI

**Proposed change:**

- File: `proxy/src/predicted-lineup-service.ts` (or new `team-lineup-volatility.ts`)
- Change: Rolling per-team precision or squad depth heuristic adjusts MID/FWD gates (stricter pick at top score gap for high-volatility teams)

**Expected impact:** +2–4 pp on WOL/MCI/WHU; possible −1 pp on stable clubs

**Risk:** Overfitting to early GWs; refresh weights monthly

---

### P2.2 — Repeat-error player denylist / boost list (data-driven overrides)

**Problem:** 15 players missed 5×; 10 players FP 5× — persistent signals missing from generic score.

**Proposed change:**

- Extend `player-tactical-role-overrides.json` or small `lineup-start-overrides.json` with element-level `startScoreBias` from eval CSV review
- Only for players with ≥4 repeat errors in last eval window

**Expected impact:** Fixes long-tail without global weight change

**Risk:** Manual maintenance; prefer automated signals first (P0–P1)

---

## Clubs to watch

| Team | Avg XI % | Notes |
| --- | --- | --- |
| WOL | 40% | Highest miss+FP; 0/5 formation; Mané/Armstrong FP |
| MCI | 51% | Semenyo/Guéhi FP; deep bench |
| WHU | 51% | Taty/Disasi FP; Paquetá missed |
| NEW | 56% | Livramento missed; Hall FP |
| TOT | 56% | Romero/Kudus missed; Kolo Muani/Gallagher FP |
| BRE | 84% | Best early-season stability — use as calibration anchor |

## Players to watch (repeat errors)

**Missed ≥2×:** Cullen, Mitoma, Richards, Gana, Andersen, Gudmundsson, Stach, Ekitiké, De Ligt, Livramento, Talbi, Romero, Kudus, L.Paquetá, Agbadou, Sessegnon, Schär, Murillo, Hudson-Odoi, Scott, Grealish, Amad  

**False positive ≥2×:** Robinson, Isak, Semenyo, Guéhi, Kolo Muani, Gallagher, Taty, Disasi, Mané, Armstrong, Trossard, Zirkzee, Hall, Bailey, Sancho, Ward-Prowse, J.Cuenca, Frimpong, Angulo, Souza  

## Regression vs prior run

_No prior `summary-gw1-5.json` in repo. Baseline is this run (lineup-v4). Compare future runs to these numbers: precision 64.4%, formation 26/100, lane mismatches 136._

## Out of scope (this iteration)

- UI/help tour changes
- Points prediction / hybrid model (`research/pred-09`)
- Changing eval sample (still 20 teams × 5 GWs = 100 team-matches)

## Verification plan

After implementing P0.x:

```bash
npm run lineup:eval -- 1-5
```

Compare `summary-gw1-5.json`:

- `starterMetrics.precision` (target ≥68%)
- `byGameweek[0]` (GW1 precision target ≥58%)
- `byFplLine` FWD false positives (target <50)
- `formationMatches` (target ≥35/100)

Spot-check `comparison-gw1-5.csv` for LIV, MCI, WOL, TOT rows.
