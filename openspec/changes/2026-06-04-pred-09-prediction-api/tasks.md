# Tasks: PRED-09 prediction API

## 1. Database

- [x] 1.1 Add `pred_*` tables to `proxy/src/db/schema.ts`
- [x] 1.2 Generate migration `0005_pred_09_tables.sql`
- [x] 1.3 Update `docs/db-schema.md` (tables + ER diagram)
- [x] 1.4 Apply migration in dev/staging

## 2. Ingest

- [x] 2.1 `pred-team-alias` seed from vaastav `master_team_list` + FPL bootstrap — `pred-cli ingest`
- [x] 2.2 `ingest-pred-epl-matches` — upsert football-data E0 into `pred_epl_match`
- [x] 2.3 `ingest-pred-player-gw-fact` — upsert vaastav merged_gw (+ live history for current season)

## 3. Scoring engine (port spike)

- [x] 3.1 TypeScript module `proxy/src/prediction/` — team Poisson fit + predict
- [x] 3.2 Player layer + defcon + FPL points assembly + hybrid blend
- [x] 3.3 `score-gameweek` CLI writing `pred_model_run`, strengths, fixture_team, player_gw — `pred-cli score --event=N`
- [x] 3.4 Unit tests on known fixture (λ, cs_prob, DGW aggregate) — `team-poisson.test.ts`

## 4. API

- [x] 4.1 `GET /api/predictions?event=` — latest score run
- [x] 4.2 Types in `web/src/types` aligned with DTO
- [x] 4.3 Schedule batch before deadline (document cron; optional node-cron later)

## 5. Verification

- [x] 5.1 Reconcile DB row counts vs spike CSV exports — `npm run pred:verify -w proxy` (expect ~106k facts, ~2280 EPL matches for 4 seasons)
- [ ] 5.2 MAE/Spearman on GW 30–38 within tolerance of `SPIKE_RESULTS.md` — re-run Python `score_holdout_gw.py` after TS blend tuning
