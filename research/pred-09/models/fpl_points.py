"""Expected FPL points from rate components (spike v0 — no bonus model)."""

from __future__ import annotations

POS_GOAL_PTS = {"GK": 6, "DEF": 6, "MID": 5, "FWD": 4}
POS_CS_PTS = {"GK": 4, "DEF": 4, "MID": 1, "FWD": 0}
ASSIST_PTS = 3
APPEARANCE_UNDER_60 = 1
APPEARANCE_60_PLUS = 2
GC_PER_TWO = -1


def expected_minutes_points(mins_prob: float) -> float:
    p60 = min(max(mins_prob, 0.0), 1.0)
    return (1 - p60) * APPEARANCE_UNDER_60 + p60 * APPEARANCE_60_PLUS


def expected_goals_points(position: str, x_goals: float) -> float:
    return x_goals * POS_GOAL_PTS.get(position, 4)


def expected_assists_points(x_assists: float) -> float:
    return x_assists * ASSIST_PTS


def expected_cs_points(position: str, cs_prob: float, mins_prob: float) -> float:
    pts = POS_CS_PTS.get(position, 0)
    if pts == 0:
        return 0.0
    return cs_prob * mins_prob * pts


def expected_gc_points(position: str, lambda_against: float, mins_prob: float) -> float:
    if position not in ("GK", "DEF"):
        return 0.0
    expected_conceded = lambda_against * mins_prob
    return (expected_conceded // 2) * GC_PER_TWO


def model_xpts(
    position: str,
    x_goals: float,
    x_assists: float,
    cs_prob: float | None,
    lambda_against: float,
    mins_prob: float,
    defcon_pts: float,
) -> float:
    cs = cs_prob if cs_prob is not None else 0.0
    return (
        expected_minutes_points(mins_prob)
        + expected_goals_points(position, x_goals)
        + expected_assists_points(x_assists)
        + expected_cs_points(position, cs, mins_prob)
        + expected_gc_points(position, lambda_against, mins_prob)
        + defcon_pts
    )
