# PRED-09 offline research

Statistical model research for per-player **gameweek** predictions (`xPts`, `xGoals`, `xAssists`,
`csProb`, `defconPts`). OpenSpec:
`openspec/changes/2026-06-04-pred-09-statistical-model-research/`.

## Status

| Phase | State |
| --- | --- |
| 1. Data inventory | **Done** — see [DATA_INVENTORY.md](./DATA_INVENTORY.md), [FPL_API_AUDIT.md](./FPL_API_AUDIT.md) |
| 2. Offline spike | **In progress** — team Poisson + CS% (`scripts/fit_team_model.py`); DB plan in [DATABASE_PLAN.md](./DATABASE_PLAN.md) |
| 3. Hold-out validation | **Done** — `SPIKE_RESULTS.md`, `holdout_report.json`, `market_sanity_report.json` |
| 4. Production API | **Done** — OpenSpec `2026-06-04-pred-09-prediction-api`; `GET /api/predictions?event=` |

## Quick start

```bash
# Download vaastav seasons + football-data E0 CSVs (free, no API keys)
./research/pred-09/scripts/download-data.sh

# Python spike (venv local to research/pred-09)
cd research/pred-09
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python ingest/load_merged_gw.py
```

## Key findings (2026-06-04)

1. **Live FPL `bootstrap-static` `expected_goals` / `expected_assists` are season-to-date totals**, not next-GW rates. Per-GW xG/xA for modelling come from **`element-summary` history** or **vaastav `merged_gw.csv`**.
2. **`ep_next`** is the only next-GW point estimate on bootstrap; proxy maps it to `expectedPoints` on `/api/player-pool`.
3. **vaastav `merged_gw` 2025/26+** includes `defensive_contribution`, `clearances_blocks_interceptions`, `recoveries`, `tackles` — required for defcon v1 training.
4. **element-summary `history` is per-fixture** (two rows per `round` on double GWs). GW aggregates for the model must **sum or merge** rows by `round`.
5. **football-data.co.uk E0** provides team goals, shots, referee, and closing odds for Dixon–Coles and market sanity (criterion C).

## Documents

| File | Purpose |
| --- | --- |
| [DATA_INVENTORY.md](./DATA_INVENTORY.md) | Sources, columns, season coverage, join keys |
| [FPL_API_AUDIT.md](./FPL_API_AUDIT.md) | Live API + proxy codebase gaps |
| [PLAYER_JOIN.md](./PLAYER_JOIN.md) | vaastav `element` → current FPL `id` |
| [DATABASE_PLAN.md](./DATABASE_PLAN.md) | Postgres tables (`pred_*`), not file/API JSON cache |

## Team model (first spike result)

Train 22/23+23/24 → hold-out 24/25 matches from Feb 2025:

```bash
.venv/bin/python scripts/fit_team_model.py
```

Latest report: `output/team_model_report.json` (Brier CS ~0.21 on 151 home matches).

Export DB-shaped CSVs: `.venv/bin/python scripts/export_for_db.py`

## Player layer + hold-out GW 30–38

```bash
.venv/bin/python scripts/score_holdout_gw.py
```

Summary: [SPIKE_RESULTS.md](./SPIKE_RESULTS.md) — hybrid Spearman **0.68** vs xP **0.62**; MAE still favours xP (tune blend next).

## Proxy pipeline (Postgres)

Requires `DATABASE_URL` in `proxy/.env` and CSVs under `research/pred-09/data/` (or `PRED_DATA_DIR`).

```bash
npm run db:migrate -w proxy
npm run pred:ingest -w proxy    # vaastav + football-data → pred_* facts
npm run pred:ingest -w proxy -- --season=2025-26   # single season (skips alias/matches)
npm run pred:score -w proxy -- --event=34 --season=2024-25
npm run pred:verify -w proxy
```

`GET /api/predictions?event=34` returns the latest `score` run for that gameweek.

### Batch schedule (before each GW deadline)

Run on the host or CI **after** FPL bootstrap reflects the target event (fixtures known), typically **24–48h before deadline**:

1. Refresh current-season vaastav (`download-data.sh` or `pred:ingest` remote fetch when wired).
2. `pred:ingest` (idempotent upserts).
3. `pred:score --event=<next_gw> --season=<current>`.

Example cron (UTC Monday 06:00 during season):

```cron
0 6 * * 1 cd /app && npm run pred:ingest -w proxy && npm run pred:score -w proxy -- --event=$NEXT_GW
```

Set `NEXT_GW` from bootstrap `events` where `is_next` or `is_current` (manual until automated). Fly.io: use `fly machine exec` or a scheduled GitHub Action with secrets — not wired in-repo yet.
