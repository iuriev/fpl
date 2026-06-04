---
name: lineup-model-eval
description: >-
  Backtest predicted lineups for user-specified gameweeks, produce metrics and CSVs,
  then write prioritized model-improvement proposals from the results. Use when the
  user gives gameweek number(s), asks to evaluate the lineup model, compare predictions
  vs actual starters, or improve the starting-XI algorithm (оценка лайнапа, геймвики,
  бэктест составов, улучшение модели составов).
---

# Lineup model eval

End-to-end workflow: **run backtest → read metrics → propose proxy model changes**.

## Inputs (resolve first)

| Input | Required | Examples |
| --- | --- | --- |
| Gameweek(s) | **Yes** | `10 11 12`, `10-14`, `--gw=34,35,36,37` |
| Compare to prior run | No | User mentions “after v5” or a saved `summary-gw*.json` |

If gameweeks are missing, ask once: which GW(s) to evaluate (1–38).

**Do not** invent gameweeks. **Do not** commit unless the user asks.

## Step 1 — Run backtest

From repo root (proxy DB + element-summary cache must exist):

```bash
npm run lineup:eval -- 10-14
```

Or explicit list:

```bash
npx tsx --env-file=proxy/.env research/lineup-eval-gw37/run-eval.ts 10 11 12 13 14
```

Wait for completion. On failure (missing cache, DB): report the error and suggest `npm run dev -w proxy` once to warm caches, or check `proxy/.env`.

## Step 2 — Read outputs

Under `research/lineup-eval-gw37/output/` (range label = contiguous `10-14` or `10-12-14`):

| File | Use |
| --- | --- |
| `summary-gw{RANGE}.json` | Machine-readable aggregates |
| `REPORT-gw{RANGE}.md` | Factual headline report (auto) |
| `comparison-gw{RANGE}.csv` | Per-player verdicts |
| `summary-gw{N}.json` | Per-GW detail |

Also read for context (do not duplicate in proposals unless citing a gap):

- `research/lineup-eval-gw37/LEARNING_NOTES.md` — prior iteration lessons
- `docs/predicted-lineups-positions.md` — tactical roles / quotas
- `proxy/src/predicted-lineup-service.ts`, `predicted-lineup-start-score.ts`, `predicted-lineup-formation-pick.ts`, `last-match-lanes.ts`

## Step 3 — Write improvement proposals

Create or overwrite:

`research/lineup-eval-gw37/output/IMPROVEMENTS-gw{RANGE}.md`

Use the structure in `.claude/skills/lineup-model-eval/improvements-template.md`. Rules:

1. **Evidence-first** — every proposal cites numbers from Step 2 (precision, line errors, team, repeat players).
2. **Actionable** — name the file/function to change and the lever (weight, threshold, new signal).
3. **Prioritized** — P0 (likely +1–2% XI or fixes systematic bias), P1 (formation/lanes), P2 (nice-to-have).
4. **No scope creep** — do not propose unrelated app features; stay in predicted-lineup stack.
5. **English only** in the markdown file.

### Pattern → proposal mapping (use when data matches)

| Signal in results | Typical proposal |
| --- | --- |
| MID highest missed + FP | Tighter rotation cluster; bench-streak penalty; cap FWD/MID gates |
| FWD high false positives | Raise `effectivePredictedStartScore` FWD gate or last-match requirement |
| Formation match &lt; 40% but XI ~75% | Score formation with `derived` counts vs FPL; or joint XI+formation search |
| Lane mismatches high with correct XI | Strengthen `lastMatchLaneById`; role overrides in `player-tactical-role-overrides.json` |
| Same player repeat-missed | Club-specific signal (injury/rotation) or lower recency weight for that element type |
| Weak teams (NEW, AVL, WOL) | Team-level volatility factor in start score |
| Strong teams over-predict bench | Reduce false-positive boost for deep squads |

## Step 4 — Respond to the user

Summarize in chat (Russian OK):

- Headline metrics (precision, formation, lane errors)
- Top 3 P0 proposals with expected impact
- Path to `IMPROVEMENTS-gw{RANGE}.md` and CSV for manual review

If the user wants implementation next, point to `openspec-explore` or a small proxy change + re-run `npm run lineup:eval -- <same GWs>`.

## Optional — regression check

If a previous `summary-gw*.json` exists for the **same** gameweeks, diff `starterMetrics` and `formationMatches` and note regressions in the improvements file under **Regression vs prior run**.

## Checklist

```
Lineup eval GW: <list>
- [ ] 1. Backtest run (lineup:eval)
- [ ] 2. REPORT + summary JSON read
- [ ] 3. IMPROVEMENTS-gw{RANGE}.md written (P0/P1/P2)
- [ ] 4. User summary in chat
```
