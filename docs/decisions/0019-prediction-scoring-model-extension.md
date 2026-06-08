# ADR 0019 — Prediction scoring model extension (PRED-11)

**Status:** Accepted
**Date:** 2026-06-08

## Context

The `modelXPts` formula in `fpl-points.ts` was missing several FPL scoring components,
causing systematic underestimation for attackers and midfielders. Analysis against 2024-25
season data (N ≈ 11 000 player-game rows) identified six gaps:

1. **Bonus points** completely absent. Top attackers earn 0.78–1.45 expected bonus pts/game.
2. **MID clean sheet** never calculated — `csProb` was set to `null` for MID despite
   `POS_CS_PTS[MID] = 1` already being defined.
3. **GK saves** not modelled (1 pt per 3 saves).
4. **Yellow card deduction** absent (−1 pt per booking, ~8–15% of appearances).
5. **`minsProb` conflation** — `avg_minutes / 90` was used both as expected-minutes scaler
   and as P(≥ 60 min), causing appearance bonus over/underestimation for rotational players
   and substitutes.
6. **Source columns not ingested** — `bonus`, `yellow_cards`, `saves`, `clean_sheets` exist
   in Vaastav CSV files but were never stored in `pred_player_gw_fact`.

## Decision

Extend the prediction pipeline with data-driven models for all missing components:

### Data layer
Add `bonus`, `yellow_cards`, `saves`, `clean_sheets` columns to `pred_player_gw_fact`.
These are available in Vaastav `merged_gw.csv` for all historical seasons.

### Bonus points
Two-component model blended 50/50:
- **Context-based**: Poisson(xGoals + xAssists) × empirical bonus rates by G+A bucket
  (calibrated from 2024-25: g+a=0 → 0.04 pts, 1 → 0.86, 2 → 2.22, 3+ → 2.69).
- **Player rolling average**: last 10 appearances, Bayesian blend with position prior
  (FWD 0.39, MID 0.16, DEF 0.12, GK 0.16 pts/game).
GK uses rolling average only (no context formula) to avoid double-counting CS/saves.

### GK saves
Rolling average of `saves/game` over last 8 appearances, divided by 3. Position prior = 3.0
saves/game (league average).

### Yellow card deduction
Rolling rate over last 10 appearances × minsProb × −1. Position priors: DEF 0.12, MID 0.10,
FWD 0.08, GK 0.02.

### `prob60Plus` split
Introduce `prob60Plus` = fraction of last 5 appearances with ≥ 60 minutes played. Used
**only** in the appearance bonus formula. `minsProb` (avg_minutes / 90) continues as the
scaling factor for all other components.

### MID clean sheet
Pass `csProb` to MID players using the same logic as DEF — the formula already handles it
correctly via `POS_CS_PTS[MID] = 1`.

## Consequences

- `modelXPts` signature gains four parameters: `prob60Plus`, `bonusPts`, `savesPts`,
  `yellowDeduction`. All callers are in `player-layer.ts` only.
- Expected xPts increases for high-performing attackers and midfielders; decreases slightly
  for all outfield players due to yellow card deduction.
- The EP blend (Step 5) is unchanged; improved `modelXPts` reduces the correction needed for
  high-confidence players.
- DB migration `0009_pred_11_scoring_columns.sql` adds four nullable smallint columns;
  existing rows default to `0` on re-ingest.
