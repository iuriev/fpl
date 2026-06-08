---
name: prediction-spec-consistency
description: >-
  Use when changing any formula, constant, algorithm, or TypeScript contract in
  proxy/src/prediction/ — or when adding/modifying a prediction API endpoint.
  Ensures openspec/specs/predictions/ stays in sync with code. Also use when
  reviewing a PR that touches prediction code to verify spec was updated.
---

# Prediction spec consistency

`openspec/specs/predictions/` is the single source of truth for how every prediction
model works. Code and spec must change together in the same commit.

## Code → spec mapping

| Changed code file | Spec file(s) to update |
|---|---|
| `team-poisson.ts` | `shared.md` (fit algorithm, parameters, clamp) |
| `player-layer.ts` — `shareXg`, `defaultShare` | `shared.md` (Team xG share section) |
| `player-layer.ts` — `predictXAssists`, `blendedXaPer90`, `fixtureAttackMultiplier`, `teamFinishingMultiplier` | `xa-prediction.md` |
| `player-layer.ts` — `minutesProb` | `shared.md` (minsProb section) |
| `player-layer.ts` — `predictFixture`, `xGoals` calc | `fpl-points-prediction.md` (Step 1) |
| `player-layer.ts` — `inferConfidence` (via `hybrid.ts`) | `shared.md` (Confidence section) |
| `fpl-points.ts` — `modelXPts` | `fpl-points-prediction.md` (Step 4) |
| `hybrid.ts` — `blendXPts`, `EP_WEIGHT`, `inferConfidence` | `fpl-points-prediction.md` (Step 5) + `shared.md` |
| `defcon.ts` | `fpl-points-prediction.md` (Step 3) |
| `score.ts` — `TRAIN_SEASONS`, `PRIOR_SEASON_FALLBACK_GW_THRESHOLD` | `shared.md` (Training seasons + Prior-season carry-in) |
| `predicted-lineup-service.ts`, `lineup-selection.ts`, `lineup-slot-requirements.ts` | `lineup-prediction.md` |
| `index.ts` — prediction endpoints | `api.md` |
| `types.ts` — prediction interfaces | `api.md` (TypeScript contracts section) |

## Checklist

Run this before marking any prediction task done:

```
Prediction spec sync:
- [ ] Identify which code files changed (use git diff --stat)
- [ ] Find matching spec file(s) in the table above
- [ ] Update formulas/constants/tables in spec to match code
- [ ] Verify cross-model references are consistent (see below)
- [ ] No formula appears in two spec files with different definitions
```

## Cross-model consistency rules

These invariants must always hold — check them when touching any of the involved files:

| Invariant | What to verify |
|---|---|
| `xAssists` in `fpl-points-prediction.md` comes from `xa-prediction.md` | Step 2 of fpl-points must say "taken directly from `xa-prediction.md`", not re-derive the formula |
| `csProb` in `fpl-points-prediction.md` comes from `team-cleansheet-prediction.md` | Step 4 cs calc must reference the cleansheet spec, not restate `exp(-λ)` |
| `λ_for` / `λ_against` are always from `team-xg-prediction.md` | No other spec may define a separate lambda formula |
| `minsProb` formula exists only in `shared.md` | If `player-layer.ts:minutesProb` changes, only `shared.md` changes |
| `EP_WEIGHT` table exists only in `fpl-points-prediction.md` Step 5 | Do not copy it into `shared.md` or `api.md` |

## Common rationalizations — ignore them

| Thought | Why it's wrong |
|---|---|
| "It's a minor constant tweak, the spec is still basically right" | Constants are the spec. A changed threshold is a changed model. |
| "I'll update the spec in a follow-up PR" | The spec is the contract that other agents read. Stale spec = broken contract. |
| "The formula is obvious from the code" | Agents read the spec, not the code, when planning changes. |
| "The spec already implies this behaviour" | Implications cause drift. State it explicitly. |

## What "update the spec" means

- **Changed formula** → rewrite the exact expression in the spec
- **Changed constant** → update the number in the spec table/inline
- **New field on a type** → add it to the TypeScript contract in `api.md`
- **New model input** → add it to the Inputs or Dependencies section of the relevant spec file
- **Removed field** → remove from spec; note in `api.md` if it affects the public contract
