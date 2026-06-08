# Proposal: Prediction scoring model improvements (PRED-11)

## Problem

The current `modelXPts` formula misses several FPL scoring components, causing systematic
underestimation for attackers and midfielders. The most significant gaps identified from
2024-25 season data:

1. **Bonus points not modelled** — BPS-based bonuses (1–3 pts) are completely absent from the
   formula. Top attackers like Salah average 1.45 bonus pts/game; Bruno Fernandes 0.78. For a
   player with 1 goal involvement per game, the miss is ~0.86 pts — larger than the entire CS
   contribution for most players.

2. **MID clean sheet points never computed** — `csProb` is set to `null` for MID players in
   `player-layer.ts` (only GK/DEF receive it), so the 1-pt MID CS bonus is permanently zero
   even though `POS_CS_PTS[MID] = 1` is already defined.

3. **GK saves not modelled** — GK earns 1 pt per 3 saves. A GK facing 5 shots on target earns
   ~1–2 extra pts; this is entirely ignored.

4. **Yellow cards not deducted** — `-1 pt` per yellow is absent. Roughly 8–15% of outfield
   appearances result in a booking; the expected deduction (~0.05–0.15 pts/game) is small but
   directionally wrong.

5. **`minsProb` conflates two separate quantities** — `minutesProb()` returns `avg_minutes / 90`
   (a fraction of 90 mins), but it is used both as a minutes scaler (correct) *and* as the
   probability of playing ≥ 60 min for the appearance bonus (incorrect). A player who averages
   70 min always earns 2 appearance pts but the model credits ~1.78. A sub who plays ~45 min
   is credited 1.50 when the true value is ~1.00.

6. **Data not ingested** — `bonus`, `yellow_cards`, `saves`, and `clean_sheets` columns exist
   in Vaastav CSV source files but are absent from `pred_player_gw_fact`, so player-level
   history cannot be used for any of these components.

## Solution

Add the missing scoring components to the prediction pipeline with data-driven models
calibrated against 2024-25 season history:

- **Bonus**: two-component model — context-based expected bonus from Poisson(xGoals+xAssists)
  blended with a player-level rolling average of `bonus/game`.
- **GK saves**: expected `saves / 3` pts using player-level rolling saves rate.
- **Yellow cards**: expected `-1 × yellow_card_rate × minsProb` deduction.
- **MID clean sheet**: pass `csProb` to MID players (same logic as DEF).
- **`p60` split**: separate `prob60Plus` (fraction of recent appearances ≥ 60 min) from
  `minsProb` (expected minute fraction used for scaling xG/xA).

All components require ingesting the missing columns from source CSVs into the DB.

## User value

- Predicted xPts better reflect reality for top attacking players (Salah, Bruno, Palmer).
- GK valuation improves — saves contribution is the third-largest GK scoring source.
- Model outputs closer to FPL's own `ep_next`, reducing the EP-blend correction needed for
  high-confidence players.
- Foundation for future improvements (BPS regression model, penalty prediction).

## Scope

### In

- DB migration: add `bonus`, `yellow_cards`, `saves`, `clean_sheets` to `pred_player_gw_fact`.
- Ingest update: parse and store new columns from Vaastav CSV.
- `PlayerGwFactRow` and `PlayerHistory` interfaces updated.
- `bonus.ts` — `rollingBonusPts`, `expectedBonusPts`.
- `yellow-card.ts` — `rollingYellowCardRate`, `expectedYellowCardDeduction`.
- `player-layer.ts` — `prob60Plus` split from `minsProb`; MID csProb fix; saves pts for GK.
- `fpl-points.ts` — `modelXPts` extended with bonus, saves, yellow card deduction.
- Updated spec files: `fpl-points-prediction.md`, `shared.md`.
- `docs/db-schema.md` updated for new columns.
- Unit tests for all new helpers.

### Out

- BPS regression model (predicting raw BPS score — future change).
- Penalty miss/save prediction.
- Red card modelling (< 0.5% of appearances; negligible expected value).
- Any changes to the hybrid EP blend weights.

## Calibration data (2024-25 season, N=~11 000 player-game rows with minutes > 0)

| G+A in match | Bonus hit rate | Avg bonus pts |
|---|---|---|
| 0 | 3% | 0.04 |
| 1 | 44% | 0.86 |
| 2 | 90% | 2.22 |
| 3+ | 98% | 2.69 |

| GK situation | Bonus hit rate | Avg bonus pts |
|---|---|---|
| No CS | 1% | 0.02 |
| CS | 43% | 0.81 |
| 3–5 saves | 16% | 0.29 |
| 6–8 saves | 27% | 0.58 |

Position-level avg bonus/game: FWD 0.39, MID 0.16, DEF 0.12, GK 0.16.
