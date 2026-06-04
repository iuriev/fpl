# PRED-09 PostgreSQL plan (source of truth, not file cache)

Research spike reads CSV from `research/pred-09/data/` locally. **Production** ingests the same
normalized rows into Postgres via Drizzle (`proxy/src/db/schema.ts`). FPL API JSON caches
(`fpl_*_cache`) stay for live snapshots; **model training and predictions use relational tables**.

## Principles

| Principle | Detail |
| --- | --- |
| Normalized facts | Match and player-GW rows are columns, not JSON blobs |
| Versioned fits | Team strength rows keyed by `model_run_id` + `season` |
| Idempotent ingest | Upsert on natural keys (`season`, `match_date`, `home_slug`, …) |
| Predictions immutable per run | New GW batch → new `model_run_id`; API serves latest completed run |

## Tables (planned)

### `pred_model_run`

One row per training or scoring pipeline execution.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `kind` | text | `train` \| `score` |
| `season` | text | e.g. `2024-25` |
| `target_event` | integer | FPL GW scored (nullable for train-only) |
| `params` | jsonb | hyperparameters, hold-out window |
| `metrics` | jsonb | Brier, MAE, Spearman from validation |
| `created_at` | timestamp | |

### `pred_epl_match`

football-data.co.uk E0 matches (all ingested seasons).

| Column | Type | Notes |
| --- | --- | --- |
| `season` | text | `2024-25` |
| `match_date` | date | |
| `home_slug` | text | normalized team key |
| `away_slug` | text | |
| `fthg`, `ftag` | smallint | full-time goals |
| `ftr` | char(1) | H/D/A |
| `referee` | text | nullable |
| `home_shots`, `away_shots` | smallint | nullable |
| `odds_home`, `odds_draw`, `odds_away` | real | e.g. B365H/D/A |
| `odds_over25`, `odds_under25` | real | nullable |
| PK | (`season`, `match_date`, `home_slug`) | |

### `pred_team_alias`

Maps football-data names → FPL `team_id` / slug.

| Column | Type |
| --- | --- |
| `slug` | text PK |
| `fpl_team_id` | integer |
| `fd_name` | text |
| `vaastav_name` | text |

### `pred_player_gw_fact`

vaastav `merged_gw` normalized (training labels).

| Column | Type | Notes |
| --- | --- | --- |
| `season` | text | |
| `round` | integer | GW |
| `element` | integer | FPL element id |
| `team_id` | integer | FPL team id |
| `position` | text | GK/DEF/MID/FWD |
| `minutes`, `starts` | integer | |
| `goals`, `assists` | smallint | |
| `total_points` | smallint | label |
| `xp` | real | vaastav xP |
| `expected_goals`, `expected_assists` | real | per-fixture/GW row |
| `defensive_contribution` | smallint | nullable pre-2025/26 |
| `fixture` | integer | nullable |
| PK | (`season`, `round`, `element`, `fixture`) | DGW: multiple rows |

### `pred_team_strength`

Fitted Poisson/Dixon–Coles parameters per run.

| Column | Type | Notes |
| --- | --- | --- |
| `model_run_id` | uuid FK | |
| `season` | text | season fit applies to |
| `team_slug` | text | |
| `attack` | real | log-rate component |
| `defence` | real | log-rate component |
| `home_adv` | real | global per run (single row optional) |
| PK | (`model_run_id`, `season`, `team_slug`) | |

### `pred_fixture_team`

Team-level fixture outputs (CS%, λ_for, λ_against) — bridges to player layer.

| Column | Type | Notes |
| --- | --- | --- |
| `model_run_id` | uuid FK | |
| `season` | text | |
| `event` | integer | FPL GW |
| `fixture_id` | integer | FPL fixture id when linked |
| `team_id` | integer | |
| `opponent_team_id` | integer | |
| `is_home` | boolean | |
| `lambda_for` | real | expected goals scored |
| `lambda_against` | real | expected goals conceded |
| `cs_prob` | real | P(clean sheet) |
| PK | (`model_run_id`, `fixture_id`, `team_id`) | or surrogate id |

### `pred_player_gw`

Consumer contract (PRED-02 / profile / PRED-05).

| Column | Type | Notes |
| --- | --- | --- |
| `model_run_id` | uuid FK | |
| `event` | integer | GW |
| `player_id` | integer | FPL element |
| `x_pts` | real | headline hybrid |
| `x_goals`, `x_assists` | real | |
| `cs_prob` | real | null MID/FWD |
| `defcon_pts` | real | |
| `confidence` | text | low/medium/high |
| `ep_next_anchor` | real | audit |
| `model_x_pts` | real | pre-blend |
| PK | (`model_run_id`, `event`, `player_id`) | |

## Ingest jobs (proxy, future change)

```
1. ingest_epl_matches     → pred_epl_match, pred_team_alias
2. ingest_player_gw_facts → pred_player_gw_fact (vaastav + live history backfill)
3. train_team_model       → pred_model_run + pred_team_strength
4. score_gameweek         → pred_fixture_team + pred_player_gw
```

Spike Python scripts mirror these steps; `ingest/db_targets.py` lists column mapping for Drizzle migration.

## vs `fpl_*_cache`

| Store | Purpose |
| --- | --- |
| `fpl_bootstrap_cache` etc. | Raw API JSON, frozen per GW |
| `pred_*` | Model-ready facts and published predictions |

Do not duplicate vaastav CSV inside JSONB; load once into `pred_player_gw_fact`.
