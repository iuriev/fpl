# Predicted lineup backtest

Backtest of the proxy **predicted lineups** algorithm against FPL actual starters.

Use the **`lineup-model-eval`** skill (`.claude/skills/lineup-model-eval/`) when you want an agent to run eval for your gameweeks and write improvement proposals.

## Run

From repo root (requires proxy DB with element-summary cache):

```bash
npm run lineup:eval -- 10-14
npm run lineup:eval -- 10 11 12 13 14
npm run lineup:eval -- --gw=34,35,36,37
```

Gameweek args are required (range `10-14`, list, or `--gw=`).

## Outputs (`output/`)

Files are suffixed by the GW range label (e.g. `10-14` or `10-12-14`):

| File | Purpose |
| --- | --- |
| `summary-gw{RANGE}.json` | **Main aggregate** — metrics, per-GW, per-team |
| `REPORT-gw{RANGE}.md` | Auto factual summary |
| `IMPROVEMENTS-gw{RANGE}.md` | Agent-written model proposals (skill step 3) |
| `comparison-gw{RANGE}.csv` | Per-player verdicts |
| `manual-review-gw{RANGE}.csv` | Same + empty column for your marks |
| `summary-gw{N}.json` | Per-gameweek detail |

## Model v4

Includes all **v3** pieces (recency score, FWD/MID gates, smart formation pick) plus:

- **Derived formation** — label from picked DEF/MID/FWD counts (`derived`).
- **Last-match lanes** — pitch slots favour previous gameweek positions.

## Prediction cutoff

For target GW *N*, history uses only rows with `round < N`; formation inference ignores fixtures from GW *N* onward.
