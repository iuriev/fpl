# Design: PRED-09 player gameweek prediction model

## Goals

Produce stable **numeric** forecasts per FPL player for the **next gameweek** so list sort order
matches user intuition. Headline `xPts` is one number; **xGoals**, **xAssists**, **csProb**, and
**defconPts** are always exposed alongside it when predictions are shown.

## Non-goals

- Per-fixture consumer API (internal fixture layer is allowed for aggregation).
- Card risk probabilities.
- Paid or scraped xG providers (Understat, FBref, api-football).
- Replacing `ep_next` entirely on day one.

## Competitor landscape (reference)

| Product | What users see | Method (public) | Relevance |
| --- | --- | --- | --- |
| Fantasy Football Fix | xFPL single number + stats tables | Opta xG, xA, xCS + minutes + bonus | UX target: headline + breakdown |
| FPL Review | EV, P(goal), P(assist), CS% | ML + market odds | Probability quality bar |
| FPL Form | PP, P(playing), predicted goals | Heuristics + availability | Minutes matter for rank |
| FPL Copilot | xPts, CS, manual minutes override | Many features per player | Messaging: estimates not exact |
| FPL Prophet | xPts + validation page | XGBoost on history | Transparency pattern |
| OpenFPL | xPts by position | FPL API + Understat (OSS) | Accuracy benchmark; we skip Understat |

We must match **sortable xPts**, plausible **CS%** for defenders, and **expanded stats**;
differentiator: **defconPts** in 2025/26 rules with free data.

## Data stack (free only)

### Primary — player × GW outcomes

**[vaastav/Fantasy-Premier-League](https://github.com/vaastav/Fantasy-Premier-League)**

- `data/{season}/gws/merged_gw.csv` — points, goals, assists, minutes, ICT, opponent, `element`
- Use for training labels, form features, hold-out evaluation.
- Map `element` → current FPL `id` via `web_name` + team + season joins.

### Secondary — team × match strength

**[football-data.co.uk](https://www.football-data.co.uk/data.php)** Premier League (E0) CSVs

- Goals, shots, shots on target, cards, **referee** (v2 signal), closing odds columns.
- Dixon–Coles / Poisson attack & defence rates → team goals for/against → **csProb** per team fixture.
- Kaggle [EPL 2000–2025](https://www.kaggle.com/datasets/marcohuiii/english-premier-league-epl-match-data-2000-2025)
  is optional mirror; **source of truth = football-data.co.uk** (avoid Kaggle-only pipeline).

### Live production features

**FPL API** (already proxied): `bootstrap-static`, `element-summary/{id}`, `fixtures/`, `event`,
player `status`, `chance_of_playing_this_round`, `expected_goals` / `expected_assists` when present,
`ep_next` as anchor.

**Defensive contributions:** parse `defensive_contribution` from live `explain` (see
`proxy/src/leaderboard-service.ts`). Historical defcon: 2025/26+ from FPL history; earlier seasons
use proxy features (CBIT-style rates from merged_gw where available, else position baselines).

### Explicitly excluded

- api-football, football-data.org paid tiers, Understat scrape, FBref scrape.

## Feature priority (v1 → v2)

| Priority | Signal | v1 use |
| --- | --- | --- |
| 1 | Injuries / `status` / `chance_of_playing` | Minutes multiplier, confidence |
| 2 | Rotation / rest days / congestion | Minutes multiplier |
| 3 | Manager / tactical shift | Team attack/defence drift (time-decay) |
| 4 | Player vs opponent (element-summary history) | Small share adjustment |
| 5 | Referee | Team card rate prior only if needed later; not xPts v1 |
| 6 | Weather | Out of v1 |
| 7 | Low sample (new signing, <300 min) | `confidence: low`, stronger `ep_next` anchor |

## Model architecture (phased)

```text
┌─────────────────────────────────────────────────────────────┐
│  Team layer (football-data + current season results)        │
│  Dixon–Coles Poisson → λ_home, λ_away per fixture           │
│  → P(team CS), team xG/xGA                                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  Player layer (vaastav + FPL live)                          │
│  Share of team λ via rolling goals/xG proxy + position      │
│  → xGoals, xAssists per fixture → sum to GW                 │
│  Minutes model: P(play) × E[mins|play] from status/form     │
│  defcon: P(threshold) × 2 pts × fixtures (cap per match)   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  FPL points assembly                                        │
│  Map events to FPL scoring (pos, CS, defcon, bonus estimate)  │
│  → raw model xPts                                           │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  Hybrid head                                                │
│  xPts = w(confidence)·ep_next + (1−w)·model_xPts            │
│  low → w up to ~0.8; high → w ~0.3                          │
└─────────────────────────────────────────────────────────────┘
```

### csProb (DEF/GK)

- Team-level clean sheet probability from scoreline matrix (0–0, 1–0, …) off Dixon–Coles.
- Player `csProb` for GW = combined across fixtures (double GW formula above).
- Display as percent; MID/FWD get `null`.

### defconPts

- DEF: threshold 10 CBIT actions; MID/FWD: 12 including recoveries (2025/26 rules).
- Estimate `P(hit)` from rolling rate per 90 × expected minutes.
- `defconPts = 2 × P(hit)` per match, cap 2 per match, sum across GW fixtures.
- Include in **xPts** assembly (expected points, not just display).

### xGoals / xAssists

- Fixture: `E[goals] = team_λ_attack × player_share × minutes_factor`.
- Same structure for assists with separate share prior.
- Prefer FPL `expected_goals` / `expected_assists` for current season when available; fall back to
  historical rates.

## Output contract

```ts
interface PlayerGameweekPrediction {
  playerId: number;
  event: number;
  xPts: number;
  xGoals: number;
  xAssists: number;
  csProb: number | null;
  defconPts: number;
  confidence: 'low' | 'medium' | 'high';
}
```

Internal spike may also emit per-fixture rows; external API uses GW aggregate only.

## UI contract (when wired)

- **List / Predicted Points:** sort by `xPts`; row or profile shows xGoals, xAssists, csProb or
  em dash, defconPts.
- **Disclaimer:** copy key e.g. `predictionsDisclaimer` — approximate estimates, not betting advice.
- **confidence:** badge/icon always visible; never hides breakdown stats.

## Validation protocol

| Criterion | Metric | Pass direction |
| --- | --- | --- |
| A Calibration | Reliability diagram; Brier for CS | Predicted ≈ observed frequency |
| B FPL utility | MAE(xPts, actual); Spearman rank vs actual | Beat or match `ep_next` on hold-out |
| C Market sanity | Implied CS from football-data odds vs model | Large systematic bias documented |

Document results in spike README before proxy implementation change.

## PostgreSQL (source of truth)

Training data and published predictions live in **relational tables**, not CSV cache or
`fpl_*_cache` JSON blobs. See `research/pred-09/DATABASE_PLAN.md` for:

- `pred_epl_match`, `pred_player_gw_fact` — ingested facts
- `pred_team_strength`, `pred_fixture_team` — team model outputs per `model_run_id`
- `pred_player_gw` — consumer contract for API/UI

Spike scripts export CSV shapes via `scripts/export_for_db.py`; proxy Drizzle migration and
ingest jobs ship in **`pred-09-prediction-api`** after hold-out sign-off.

## Offline spike layout (apply phase)

```
research/pred-09/
  README.md           # results summary
  DATABASE_PLAN.md    # Postgres tables + ingest jobs
  ingest/             # loaders + db_targets column mapping
  models/             # team Poisson (done), player shares, hybrid head
  output/             # spike CSVs (gitignored)
  scripts/            # fit_team_model, export_for_db
```

No production code in `proxy/` until a separate apply change after spike sign-off.

## Follow-up changes (not this proposal)

1. `pred-09-prediction-api` — batch job, cache, `GET /api/predictions?event=`
2. PRED-02 / profile UI — consume `PlayerGameweekPrediction`
3. PRED-05 / PRED-07 screens

## Risks

| Risk | Mitigation |
| --- | --- |
| No player-level xG in old seasons | Team-level λ + player share; FPL xG live for current |
| Defcon history short | Position baselines + 25/26 live calibration |
| `ep_next` double-GW semantics | Spike compares sum of our fixtures vs `ep_next` |
| Name mapping vaastav ↔ FPL | Team + position + fuzzy web_name table |
