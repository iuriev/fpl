"""Expected defensive contribution FPL points (2 pts per match, capped)."""

from __future__ import annotations

import pandas as pd

DEFCON_THRESHOLD = {"DEF": 10, "MID": 12, "FWD": 12, "GK": 999}
DEFCON_PRIOR_HIT_RATE = {"DEF": 0.38, "MID": 0.28, "FWD": 0.06, "GK": 0.0}
DEFCON_PTS = 2.0


def defcon_hit(defensive_contribution: float, position: str) -> bool:
    if position == "GK":
        return False
    threshold = DEFCON_THRESHOLD.get(position, 12)
    return defensive_contribution >= threshold


def rolling_defcon_hit_rate(history: pd.DataFrame, position: str, window: int = 8) -> float:
    if position == "GK":
        return 0.0
    if "defensive_contribution" not in history.columns:
        return DEFCON_PRIOR_HIT_RATE.get(position, 0.1)
    played = history[history["minutes"] >= 60].tail(window)
    if len(played) == 0:
        return DEFCON_PRIOR_HIT_RATE.get(position, 0.1)
    hits = played.apply(
        lambda r: defcon_hit(float(r["defensive_contribution"]), position),
        axis=1,
    )
    rate = float(hits.mean())
    prior = DEFCON_PRIOR_HIT_RATE.get(position, 0.1)
    n = len(played)
    return (rate * n + prior * 3) / (n + 3)


def expected_defcon_pts(hit_rate: float, mins_prob: float, position: str) -> float:
    if position == "GK":
        return 0.0
    return DEFCON_PTS * hit_rate * mins_prob
