# PRED-09 spike results (2026-06-04)

## Team Poisson — CS calibration

Train: football-data 22/23 + 23/24. Hold-out: 24/25 matches from 2025-02-01.

| Metric | Value |
| --- | --- |
| Brier CS (home) | 0.206 |
| Actual CS rate | 26.5% |
| Mean predicted CS | 29.4% |

## Player GW hold-out (2024/25 GW 30–38)

Train rolling shares through GW 29. Team Poisson from 22/23+23/24. Labels: vaastav `total_points` (summed per DGW).

| Metric | model only | hybrid xPts | vaastav xP (ep_next proxy) |
| --- | --- | --- | --- |
| MAE vs actual | 1.59 | **1.11** | **1.01** |
| Spearman rank | 0.55 | **0.68** | 0.62 |

**Readout**

- **Ranking:** hybrid beats raw model and slightly beats xP on Spearman (0.68 vs 0.62).
- **Magnitude:** xP still lowest MAE; hybrid does not beat FPL xP on error yet — tune blend weights and bonus model.
- **Next:** Dixon–Coles ρ, bonus prior, tune `CONFIDENCE_WEIGHT_EP`, defcon from 25/26 labels.

## Market sanity (criterion C)

Hold-out 24/25 (151 matches with B365 odds). No direct CS odds in football-data.

| Metric | Model | Market (O/U 2.5) |
| --- | --- | --- |
| Brier Over 2.5 | **0.249** | 0.255 |
| Brier CS (home) | 0.206 | n/a |
| MAE total goals (μ_home+μ_away vs implied) | 0.25 | — |
| Corr model vs market total | 0.63 | — |

Report: `output/market_sanity_report.json`

## DB

Normalized exports: `output/db_export/`. Tables: `DATABASE_PLAN.md` → Drizzle in `pred-09-prediction-api` change.

## Pass/fail (spike v0)

| Criterion | Status | Notes |
| --- | --- | --- |
| A Calibration | **Pass** | CS Brier ~0.21; not badly miscalibrated |
| B FPL utility | **Partial** | Spearman hybrid > xP; MAE hybrid > xP — tune blend |
| C Market sanity | **Pass** | Model O/U 2.5 Brier ≤ market; totals correlate 0.63 |

Recommended blend weights next: grid-search `CONFIDENCE_WEIGHT_EP` on GW 25–29 before hold-out.
