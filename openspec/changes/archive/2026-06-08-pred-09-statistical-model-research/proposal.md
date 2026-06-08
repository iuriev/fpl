# Proposal: EPL statistical model research (PRED-09)

## Problem

The app exposes FPL `ep_next` on the Predicted Points screen (PRED-02) but cannot show
calibrated **xGoals**, **xAssists**, **clean sheet probability**, or **defensive contribution
points** for the next gameweek. Downstream features (PRED-05 market screen, PRED-07 goals &
assists, PRED-10 profile copy) are blocked without a researched, validated per-player GW model.

Managers compare us to tools such as Fantasy Football Fix (xFPL), FPL Review (Massive Data),
and FPL Form (predicted points + availability). Inaccurate magnitudes break sort order and
erode trust.

## Solution

Research, design, and offline validation of a **free-data** statistical pipeline that outputs
**per player × gameweek** predictions, then promote to proxy batch serving in a follow-up change.

### Outputs (display contract)

| Field | Role |
| --- | --- |
| `xPts` | Single headline number for lists, captain, sort |
| `xGoals` | Expected goals in the GW (sum across fixtures) |
| `xAssists` | Expected assists in the GW |
| `csProb` | Clean sheet probability for DEF/GK; `null` for MID/FWD |
| `defconPts` | Expected FPL defensive-contribution points (0–4 per GW) |
| `confidence` | `low` \| `medium` \| `high` — always shown, including `low` |

UI shows **xPts** prominently plus **expanded stats** for the other fields. A shared disclaimer
states estimates are approximate.

### Horizon

- One **gameweek** per player.
- **Double GW:** sum metrics across both fixtures; `csProb` combined as `1 − ∏(1 − p_i)`.
- **Blank GW:** all outputs `0`; no fixture-level computation.

### Modelling stance

- **Hybrid xPts:** anchor on FPL `ep_next` with a learnable correction; stronger anchor when
  `confidence` is `low`.
- **No card probabilities** in scope (yellow/red removed).
- **Defcon in v1:** included in `defconPts` and in the xPts assembly from the first spike.
- **Free data only:** vaastav/FPL historical CSVs, football-data.co.uk match CSVs, live FPL API
  (no paid APIs, no scraping Understat/FBref).

### Validation (all three required before production API)

1. **Calibration** — reliability bins; Brier score where binary (e.g. CS occurred).
2. **FPL utility** — MAE / rank correlation of `xPts` vs actual GW points vs `ep_next` on hold-out.
3. **Market sanity** — where football-data closing odds exist, compare team CS / goal lines to
   model-implied probabilities (no paid odds feed).

Hold-out: e.g. GW 30–38 of the most recent complete season; no tuning on hold-out.

## Scope

### In (this change)

- OpenSpec design, spec delta, and task breakdown.
- Research brief in `design.md` (data sources, methods, competitors, feature priority).
- Offline spike plan (Python or TS scripts under `research/` — created in apply phase).
- Backlog alignment for PRED-05, PRED-07, PRED-10 phase 2.

### Out of scope (follow-up changes)

- Proxy endpoint and Postgres persistence.
- Web UI columns beyond PRED-02 / profile (until model API exists).
- Paid data, bookmaker feeds, LLM inference.
- Yellow/red card probabilities.

## Backlog ID

**PRED-09** — EPL statistical model research

## Effort

**L** — research + offline spike + validation report before any production serving.

## Enables

- PRED-02 enriched columns and sorting by model `xPts`
- PRED-05 clean sheet / xG market screen
- PRED-07 predicted goals & assists
- PRED-10 phase 2 profile explanations
