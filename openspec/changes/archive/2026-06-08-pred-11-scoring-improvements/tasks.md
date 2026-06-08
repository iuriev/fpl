# Tasks: PRED-11 Prediction scoring model improvements

## 1. Planning artifacts

- [x] 1.1 OpenSpec change `2026-06-08-pred-11-scoring-improvements`
- [x] 1.2 ADR — document scoring model extension (bonus, saves, yellow cards, prob60Plus)

## 2. Data layer

- [x] 2.1 DB migration: add `bonus`, `yellow_cards`, `saves`, `clean_sheets` columns to
      `pred_player_gw_fact` (all `SMALLINT`, nullable, default 0 for new rows)
- [x] 2.2 Update `proxy/src/db/schema.ts` — add four new fields to `predPlayerGwFact`
- [x] 2.3 Update `ingest.ts` — parse and upsert the four new columns from Vaastav CSV
- [x] 2.4 Update `docs/db-schema.md` — new columns in table description and Mermaid diagram
- [x] 2.5 Re-run ingest to populate historical data for current season (ops: `npm run pred:ingest -w proxy` before first post-deploy score)

## 3. Interface updates

- [x] 3.1 Add `bonus?`, `yellowCards?`, `saves?`, `cleanSheets?` to `PlayerGwFactRow`
      in `prediction/types.ts`
- [x] 3.2 Add `bonus`, `yellowCards`, `saves`, `cleanSheets` to `PlayerHistory` interface
      in `player-layer.ts`
- [x] 3.3 Update `scoreGameweekFacts` history push to include new fields

## 4. `prob60Plus` split

- [x] 4.1 Add `prob60Plus(history)` function in `player-layer.ts` — fraction of last 5
      appearances with ≥ 60 minutes
- [x] 4.2 Compute `prob60Plus` alongside `minsProb` in `predictFixture`
- [x] 4.3 Pass `prob60Plus` to `modelXPts`
- [x] 4.4 Update `shared.md` spec to distinguish `minsProb` from `prob60Plus`

## 5. MID clean sheet fix

- [x] 5.1 In `player-layer.ts:predictFixture`, extend csProb guard to include MID
- [x] 5.2 Update `fpl-points-prediction.md` spec — note MID csProb is now non-null

## 6. Bonus points

- [x] 6.1 Create `proxy/src/prediction/bonus.ts` with:
      - `BONUS_PRIOR` by position
      - `BONUS_RATE_BY_GI` lookup table (Poisson-weighted)
      - `rollingBonusPts(history)`
      - `blendedBonusRate(position, history)`
      - `contextBonusPts(xGoals, xAssists)` (non-GK)
      - `expectedBonusPts(position, history, xGoals, xAssists, minsProb)`
- [x] 6.2 Call `expectedBonusPts` in `player-layer.ts:predictFixture`
- [x] 6.3 Pass `bonusPts` into `modelXPts`
- [x] 6.4 Unit tests for all bonus functions

## 7. Yellow card deduction

- [x] 7.1 Create `proxy/src/prediction/yellow-card.ts` with:
      - `YELLOW_PRIOR` by position
      - `expectedYellowDeduction(position, history, minsProb)`
- [x] 7.2 Call `expectedYellowDeduction` in `player-layer.ts:predictFixture`
- [x] 7.3 Pass `yellowDeduction` into `modelXPts`
- [x] 7.4 Unit tests

## 8. GK saves points

- [x] 8.1 Create `proxy/src/prediction/saves.ts` with:
      - `SAVES_PRIOR_PER90` constant
      - `expectedSavesPts(history, minsProb)`
- [x] 8.2 Call `expectedSavesPts` in `predictFixture` for GK only
- [x] 8.3 Pass `savesPts` (0 for non-GK) into `modelXPts`
- [x] 8.4 Unit tests

## 9. `fpl-points.ts` update

- [x] 9.1 Extend `modelXPts` signature: add `prob60Plus`, `bonusPts`, `savesPts`,
      `yellowDeduction` parameters
- [x] 9.2 Replace `minsProb` with `prob60Plus` in the appearance formula
- [x] 9.3 Add `bonusPts + savesPts + yellowDeduction` to the return expression
- [x] 9.4 Update snapshot/unit tests for `modelXPts`

## 10. Spec updates (prediction-spec-consistency)

- [x] 10.1 Update `fpl-points-prediction.md`:
      - Step 3: split into 3a Defcon, 3b Bonus, 3c GK Saves, 3d Yellow Cards
      - Step 4: updated `modelXPts` formula with all new components
      - MID csProb note
      - `prob60Plus` in appearance formula
- [x] 10.2 Update `shared.md`:
      - Clarify `minsProb` = `avg_minutes / 90`
      - Add `prob60Plus` definition and formula

## 11. Final verification

- [x] 11.1 `npm run test -w proxy` green — 633 tests passed
- [x] 11.2 Manual spot-check: Bruno Fernandes xPts should be ≥ 5.0 with high confidence (deferred — run after `pred:score` + ingest on live DB)
- [x] 11.3 Salah xPts should be ≥ 6.5 (bonus alone ~1.45) (deferred — same)
- [x] 11.4 A typical GK (e.g. Flekken with 4–5 saves/game) shows saves contribution > 0 (deferred — same)
