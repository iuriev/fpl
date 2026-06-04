#!/usr/bin/env python3
"""Hold-out GW 30–38: player layer + hybrid xPts vs vaastav xP vs actual points."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd
from scipy.stats import spearmanr

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "ingest"))
sys.path.insert(0, str(ROOT))

from ingest.load_football_data import load_matches
from ingest.load_merged_gw import load_season
from ingest.team_map import load_team_id_to_slug
from models.player_layer import aggregate_gw_predictions, score_season_gws
from models.team_poisson import fit_team_poisson

OUT = ROOT / "output"
HOLDOUT_MIN = 30
HOLDOUT_MAX = 38
TRAIN_MAX_GW = 29


def actual_gw_points(season_df: pd.DataFrame) -> pd.DataFrame:
    df = season_df.copy()
    df["round"] = df["GW"] if "GW" in df.columns else df["round"]
    return (
        df.groupby(["element", "round"], as_index=False)["total_points"]
        .sum()
        .rename(columns={"total_points": "actual_pts"})
    )


def mae(y_true: pd.Series, y_pred: pd.Series) -> float:
    return float((y_true - y_pred).abs().mean())


def main() -> None:
    train_matches = load_matches(["2223", "2324"])
    fit = fit_team_poisson(train_matches)
    team_to_slug = load_team_id_to_slug("2023-24")

    season_df = load_season("2024-25")
    fixture_preds = score_season_gws(
        season_df,
        fit,
        team_to_slug,
        train_max_gw=TRAIN_MAX_GW,
        score_min_gw=HOLDOUT_MIN,
        score_max_gw=HOLDOUT_MAX,
    )
    gw_preds = aggregate_gw_predictions(fixture_preds)
    actual = actual_gw_points(season_df)

    eval_df = gw_preds.merge(actual, on=["element", "round"], how="inner")
    eval_df = eval_df[eval_df["actual_pts"].notna()]

    metrics = {
        "holdout_gws": f"{HOLDOUT_MIN}-{HOLDOUT_MAX}",
        "player_gw_rows": len(eval_df),
        "mae_model_x_pts": mae(eval_df["actual_pts"], eval_df["model_x_pts"]),
        "mae_hybrid_x_pts": mae(eval_df["actual_pts"], eval_df["x_pts"]),
        "mae_ep_next_xp": mae(eval_df["actual_pts"], eval_df["ep_next_anchor"]),
        "spearman_model": float(spearmanr(eval_df["actual_pts"], eval_df["model_x_pts"]).statistic),
        "spearman_hybrid": float(spearmanr(eval_df["actual_pts"], eval_df["x_pts"]).statistic),
        "spearman_xp": float(spearmanr(eval_df["actual_pts"], eval_df["ep_next_anchor"]).statistic),
    }

    by_gw = []
    for rnd, g in eval_df.groupby("round"):
        by_gw.append(
            {
                "round": int(rnd),
                "n": len(g),
                "mae_hybrid": mae(g["actual_pts"], g["x_pts"]),
                "mae_xp": mae(g["actual_pts"], g["ep_next_anchor"]),
                "spearman_hybrid": float(spearmanr(g["actual_pts"], g["x_pts"]).statistic),
            }
        )
    metrics["by_gw"] = by_gw

    OUT.mkdir(exist_ok=True)
    gw_preds.to_csv(OUT / "player_gw_holdout_preds.csv", index=False)
    fixture_preds.to_csv(OUT / "player_fixture_holdout_preds.csv", index=False)
    (OUT / "holdout_report.json").write_text(json.dumps(metrics, indent=2))
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
