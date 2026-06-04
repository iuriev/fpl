"""FPL team id → slug (for linking vaastav rows to football-data Poisson)."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from team_names import slug_from_vaastav

__all__ = ["load_team_id_to_slug", "resolve_team_slug"]

DATA_DIR = Path(__file__).resolve().parents[1] / "data" / "vaastav"


def load_team_id_to_slug(season: str = "2023-24") -> dict[int, str]:
    path = DATA_DIR / "master_team_list.csv"
    mt = pd.read_csv(path)
    sub = mt[mt["season"] == season]
    if sub.empty:
        sub = mt[mt["season"] == mt["season"].max()]
    out: dict[int, str] = {}
    for _, row in sub.iterrows():
        slug = slug_from_vaastav(str(row["team_name"]))
        if slug:
            out[int(row["team"])] = slug
    return out


def resolve_team_slug(
    team_value: str | int | float,
    id_to_slug: dict[int, str],
) -> str | None:
    if pd.isna(team_value):
        return None
    if isinstance(team_value, (int, float)) or (
        isinstance(team_value, str) and team_value.isdigit()
    ):
        return id_to_slug.get(int(team_value))
    return slug_from_vaastav(str(team_value))
