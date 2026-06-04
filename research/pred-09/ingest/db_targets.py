"""
Column mapping: spike DataFrames → planned Postgres tables (see DATABASE_PLAN.md).

Used by future proxy ingest jobs; spike may emit SQL via scripts/export_for_db.py.
"""

PRED_EPL_MATCH_COLUMNS = [
    "season",
    "match_date",
    "home_slug",
    "away_slug",
    "fthg",
    "ftag",
    "ftr",
    "referee",
    "home_shots",
    "away_shots",
    "odds_home",
    "odds_draw",
    "odds_away",
    "odds_over25",
    "odds_under25",
]

PRED_PLAYER_GW_FACT_COLUMNS = [
    "season",
    "round",
    "element",
    "team_id",
    "position",
    "minutes",
    "starts",
    "goals",
    "assists",
    "total_points",
    "xp",
    "expected_goals",
    "expected_assists",
    "defensive_contribution",
    "fixture",
]

PRED_FIXTURE_TEAM_COLUMNS = [
    "model_run_id",
    "season",
    "event",
    "fixture_id",
    "team_id",
    "opponent_team_id",
    "is_home",
    "lambda_for",
    "lambda_against",
    "cs_prob",
]

PRED_PLAYER_GW_COLUMNS = [
    "model_run_id",
    "event",
    "player_id",
    "x_pts",
    "x_goals",
    "x_assists",
    "cs_prob",
    "defcon_pts",
    "confidence",
    "ep_next_anchor",
    "model_x_pts",
]
