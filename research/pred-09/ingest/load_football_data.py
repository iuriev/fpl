#!/usr/bin/env python3
"""Load football-data.co.uk E0 CSVs → normalized match DataFrame (maps to pred_epl_match)."""

from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd

from team_names import slug_from_fd

DATA_DIR = Path(__file__).resolve().parents[1] / "data" / "football-data"

FD_SEASON_TO_LABEL: dict[str, str] = {
    "1920": "2019-20",
    "2021": "2020-21",
    "2122": "2021-22",
    "2223": "2022-23",
    "2324": "2023-24",
    "2425": "2024-25",
}


def load_fd_file(code: str) -> pd.DataFrame:
    path = DATA_DIR / f"E0_{code}.csv"
    raw = pd.read_csv(path, encoding="latin-1")
    season = FD_SEASON_TO_LABEL[code]
    match_date = pd.to_datetime(raw["Date"], dayfirst=True, errors="coerce")
    home_slug = raw["HomeTeam"].map(slug_from_fd)
    away_slug = raw["AwayTeam"].map(slug_from_fd)
    out = pd.DataFrame(
        {
            "season": season,
            "match_date": match_date,
            "home_slug": home_slug,
            "away_slug": away_slug,
            "fthg": pd.to_numeric(raw["FTHG"], errors="coerce"),
            "ftag": pd.to_numeric(raw["FTAG"], errors="coerce"),
            "ftr": raw["FTR"],
            "referee": raw.get("Referee"),
            "home_shots": pd.to_numeric(raw.get("HS"), errors="coerce"),
            "away_shots": pd.to_numeric(raw.get("AS"), errors="coerce"),
            "odds_home": pd.to_numeric(raw.get("B365H"), errors="coerce"),
            "odds_draw": pd.to_numeric(raw.get("B365D"), errors="coerce"),
            "odds_away": pd.to_numeric(raw.get("B365A"), errors="coerce"),
            "odds_over25": pd.to_numeric(raw.get("B365>2.5"), errors="coerce"),
            "odds_under25": pd.to_numeric(raw.get("B365<2.5"), errors="coerce"),
        }
    )
    return out.dropna(subset=["match_date", "home_slug", "away_slug", "fthg", "ftag"])


def load_matches(codes: list[str] | None = None) -> pd.DataFrame:
    codes = codes or list(FD_SEASON_TO_LABEL.keys())
    return pd.concat([load_fd_file(c) for c in codes], ignore_index=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--codes", nargs="*", default=["2223", "2324", "2425"])
    args = parser.parse_args()
    df = load_matches(args.codes)
    unmapped = df[df["home_slug"].isna() | df["away_slug"].isna()]
    print(f"matches={len(df):,} seasons={df['season'].nunique()}")
    if len(unmapped):
        print(f"WARNING unmapped rows={len(unmapped)}")


if __name__ == "__main__":
    main()
