#!/usr/bin/env python3
"""Load vaastav merged_gw.csv files into a single DataFrame with season label."""

from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd

DATA_DIR = Path(__file__).resolve().parents[1] / "data" / "vaastav"
DEFAULT_SEASONS = [
    "2022-23",
    "2023-24",
    "2024-25",
    "2025-26",
]


def load_season(season: str) -> pd.DataFrame:
    path = DATA_DIR / season / "gws" / "merged_gw.csv"
    df = pd.read_csv(path)
    df["season"] = season
    if "GW" in df.columns and "round" not in df.columns:
        df["round"] = df["GW"]
    return df


def load_merged(seasons: list[str] | None = None) -> pd.DataFrame:
    seasons = seasons or DEFAULT_SEASONS
    frames = [load_season(s) for s in seasons]
    return pd.concat(frames, ignore_index=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seasons", nargs="*", default=DEFAULT_SEASONS)
    parser.add_argument("--holdout-min-gw", type=int, default=30)
    args = parser.parse_args()

    df = load_merged(args.seasons)
    has_defcon = "defensive_contribution" in df.columns
    holdout = df[(df["season"] == "2024-25") & (df["round"] >= args.holdout_min_gw)]
    dgw = (
        holdout.groupby(["element", "round"])
        .size()
        .reset_index(name="fixtures_in_gw")
        .query("fixtures_in_gw > 1")
    )

    print(f"rows={len(df):,} seasons={df['season'].nunique()} defcon_col={has_defcon}")
    print(f"holdout 2024-25 GW>={args.holdout_min_gw}: rows={len(holdout):,}")
    print(f"double-GW player-rounds in holdout: {len(dgw):,}")


if __name__ == "__main__":
    main()
