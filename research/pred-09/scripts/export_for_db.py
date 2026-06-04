#!/usr/bin/env python3
"""
Export normalized CSVs aligned with DATABASE_PLAN tables (for manual COPY / future ingest).

Spike output only — production ingest will upsert via Drizzle jobs in proxy.
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "ingest"))
sys.path.insert(0, str(ROOT))

from ingest.db_targets import PRED_EPL_MATCH_COLUMNS
from ingest.load_football_data import load_matches
from ingest.load_merged_gw import load_merged

OUT = ROOT / "output" / "db_export"
OUT.mkdir(parents=True, exist_ok=True)


def export_epl_matches() -> None:
    df = load_matches()
    cols = [c for c in PRED_EPL_MATCH_COLUMNS if c in df.columns]
    df[cols].to_csv(OUT / "pred_epl_match.csv", index=False)
    print(f"pred_epl_match: {len(df):,} rows → {OUT / 'pred_epl_match.csv'}")


def export_player_gw_fact() -> None:
    import pandas as pd

    df = load_merged()
    rename = {
        "goals_scored": "goals",
        "xP": "xp",
        "element": "element",
    }
    df = df.rename(columns=rename)
    if "expected_goals" in df.columns:
        df["expected_goals"] = pd.to_numeric(df["expected_goals"], errors="coerce")
    if "expected_assists" in df.columns:
        df["expected_assists"] = pd.to_numeric(df["expected_assists"], errors="coerce")
    keep = [
        "season",
        "round",
        "element",
        "team",
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
    cols = [c for c in keep if c in df.columns]
    df[cols].to_csv(OUT / "pred_player_gw_fact.csv", index=False)
    print(f"pred_player_gw_fact: {len(df):,} rows → {OUT / 'pred_player_gw_fact.csv'}")


def export_player_gw_preds() -> None:
    path = ROOT / "output" / "player_gw_holdout_preds.csv"
    if not path.exists():
        print("skip pred_player_gw — run score_holdout_gw.py first")
        return
    import pandas as pd

    df = pd.read_csv(path)
    rename = {
        "element": "player_id",
        "round": "event",
        "x_pts": "x_pts",
        "model_x_pts": "model_x_pts",
    }
    df = df.rename(columns=rename)
    cols = [
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
    df[[c for c in cols if c in df.columns]].to_csv(
        OUT / "pred_player_gw_sample.csv", index=False
    )
    print(f"pred_player_gw_sample: {len(df):,} rows")


def main() -> None:
    export_epl_matches()
    export_player_gw_fact()
    export_player_gw_preds()


if __name__ == "__main__":
    main()
