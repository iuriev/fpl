# Predicted lineup backtest

Backtest of the proxy **predicted lineups** algorithm against FPL actual starters.

**Current holdout:** GW10–14 (2025/26), **lineup v3** (recency score + FWD/MID gates + smart formation pick).

## Run

From repo root (requires proxy DB with element-summary cache):

```bash
npx tsx --env-file=proxy/.env research/lineup-eval-gw37/run-eval.ts
```

## Outputs (`output/`)

| File | Purpose |
| --- | --- |
| `summary-gw10-14.json` | **Main aggregate** — metrics, per-GW, per-team |
| `comparison-gw10-14.csv` | **Main review file** — column `gameweek` |
| `manual-review-gw10-14.csv` | Same + empty column for your marks |
| `summary-gw10.json` … `summary-gw14.json` | Per-gameweek detail |

## Model v3

**Start score** (`predicted-lineup-start-score.ts`): recency window, last-match boost, bench streak, GK priority.

**Effective score:** FWD ×0.5 / MID ×0.82 if did not start last match.

**Formation** (`predicted-lineup-formation-pick.ts`): switch shape only if lineup score beats recent mode by ≥0.4; else pick best among top-3 scores closest to recent mode.

## Prediction cutoff

For target GW *N*, history uses only rows with `round < N`; formation inference ignores fixtures from GW *N* onward.
