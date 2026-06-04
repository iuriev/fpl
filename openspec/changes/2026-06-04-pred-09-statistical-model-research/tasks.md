# Tasks: PRED-09 statistical model research

Planning and offline validation only. Production proxy/UI work starts in a follow-up change
after spike sign-off.

## 1. Research & data inventory

- [x] 1.1 Document vaastav seasons to ingest (2019–20 through latest complete) and column mapping to FPL `element` ids — `research/pred-09/DATA_INVENTORY.md`
- [x] 1.2 Download football-data.co.uk E0 CSVs for matching seasons; document odds columns used for market sanity — `scripts/download-data.sh`, odds cols in DATA_INVENTORY
- [x] 1.3 Audit live FPL API fields: `ep_next`, `expected_goals`, `expected_assists`, status, fixtures per GW — `research/pred-09/FPL_API_AUDIT.md`
- [x] 1.4 Audit defcon availability in `element-summary` history and live `explain` for 2025/26 — FPL_API_AUDIT + DATA_INVENTORY
- [x] 1.5 Write player name/team join strategy (vaastav → current bootstrap ids) — `research/pred-09/PLAYER_JOIN.md`

## 2. Offline spike (`research/pred-09/`)

- [x] 2.1 Scaffold `research/pred-09/` with ingest scripts (vaastav + football-data) + `DATABASE_PLAN.md`
- [x] 2.2 Implement team independent Poisson v0 → fixture λ_home, λ_away (`models/team_poisson.py`, `scripts/fit_team_model.py`)
- [x] 2.3 Derive team `csProb` and player `xGoals` / `xAssists` shares with minutes factor — `models/player_layer.py`
- [x] 2.4 Implement `defconPts` expectation (threshold 10 DEF / 12 MID-FWD, 2 pts cap per match) — `models/defcon.py`
- [x] 2.5 Assemble FPL raw points → `model_xPts`; implement hybrid blend with `ep_next` by confidence — `models/fpl_points.py`, `models/hybrid.py`
- [x] 2.6 Aggregate single/double/blank GW rules per design — `aggregate_gw_predictions` (DGW CS combine)

## 3. Validation (hold-out GW 30–38)

- [x] 3.1 **A — Calibration:** reliability bins for CS; document Brier scores — `team_model_report.json`
- [x] 3.2 **B — FPL utility:** MAE and Spearman rank — model `xPts` vs actual vs `ep_next` — `holdout_report.json`, `SPIKE_RESULTS.md`
- [x] 3.3 **C — Market sanity:** compare model team CS to football-data implied probabilities — `market_sanity_report.json`
- [x] 3.4 Publish `research/pred-09/README.md` with pass/fail and recommended blend weights — `SPIKE_RESULTS.md`

## 4. Sign-off & follow-up proposals

- [ ] 4.1 Review spike README with stakeholder; adjust design if hold-out fails any criterion
- [x] 4.2 Propose OpenSpec change `pred-09-prediction-api` (proxy batch + Postgres + endpoint) — `openspec/changes/2026-06-04-pred-09-prediction-api/`
- [ ] 4.3 Update backlog entries PRED-02 / PRED-05 / PRED-07 / PRED-10 with dependency notes

## 5. Backlog & docs (this change)

- [x] 5.1 OpenSpec change `2026-06-04-pred-09-statistical-model-research` created
- [x] 5.2 `docs/backlog.md` PRED-09 section updated to v2 scope
