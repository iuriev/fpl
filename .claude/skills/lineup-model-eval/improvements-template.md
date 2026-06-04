# Model improvement proposals — GW{RANGE}

Evaluated: {ISO_DATE}  
Gameweeks: {GW_LIST}  
Model version: {from summary JSON}

## Executive summary

- **XI precision:** {precision}% ({correct}/{slots})
- **Formation vs FPL:** {formationMatches}
- **Main weakness:** {one line or one club pattern}
- **Recommended next step:** {single sentence}

## Metrics snapshot

| Metric | Value |
| --- | --- |
| Recall | {recall}% |
| Missed starters | {missed} |
| False positives | {fp} |
| Lane mismatch (XI correct) | {laneMismatches} |

## P0 — High impact (implement first)

### P0.1 — {title}

**Problem:** {what fails, with numbers}

**Evidence:**

- {bullet from byFplLine / byTeam / repeat lists}

**Proposed change:**

- File: `proxy/src/{file}.ts`
- Change: {concrete lever}

**Expected impact:** {e.g. +1–2% XI precision on MID; fewer FP on FWD}

**Risk:** {what could break}

---

## P1 — Formation and lanes

### P1.1 — {title}

...

## P2 — Later / experimental

### P2.1 — {title}

...

## Clubs to watch

| Team | Avg XI % | Notes |
| --- | --- | --- |
| {worst} | | |
| {best} | | |

## Players to watch (repeat errors)

**Missed ≥2×:** {list}  
**False positive ≥2×:** {list}

## Regression vs prior run

_{Omit section if no prior summary for same GWs.}_

| Metric | Prior | Current | Delta |
| --- | --- | --- | --- |
| Precision | | | |

## Out of scope (this iteration)

- {item user might ask for but data does not support}

## Verification plan

After implementing P0.x:

```bash
npm run lineup:eval -- {same GW args}
```

Compare `summary-gw{RANGE}.json` `starterMetrics` and spot-check `comparison-gw{RANGE}.csv` for affected clubs/lines.
