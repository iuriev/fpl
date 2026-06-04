"""Criterion C: compare model goal rates to football-data closing odds."""

from __future__ import annotations

import numpy as np
import pandas as pd
from scipy.optimize import brentq
from scipy.stats import poisson


def no_vig_1x2(
    odds_home: float, odds_draw: float, odds_away: float
) -> tuple[float, float, float]:
    ih, id_, ia = 1 / odds_home, 1 / odds_draw, 1 / odds_away
    total = ih + id_ + ia
    return ih / total, id_ / total, ia / total


def no_vig_over25(odds_over: float, odds_under: float) -> float:
    o, u = 1 / odds_over, 1 / odds_under
    return o / (o + u)


def implied_total_goals_from_over25(p_over: float) -> float:
    """Solve E[total] for Poisson totals: P(goals >= 3) ≈ p_over."""

    def objective(mu: float) -> float:
        return 1.0 - poisson.cdf(2, mu) - p_over

    try:
        return float(brentq(objective, 0.3, 6.0))
    except ValueError:
        return float("nan")


def model_over25_prob(lambda_home: float, lambda_away: float, max_goals: int = 8) -> float:
    p = 0.0
    for hg in range(max_goals + 1):
        for ag in range(max_goals + 1):
            if hg + ag >= 3:
                p += poisson.pmf(hg, lambda_home) * poisson.pmf(ag, lambda_away)
    return float(p)


def evaluate_match_odds(
    matches: pd.DataFrame,
    pred_home: pd.DataFrame,
) -> dict[str, float]:
    """
    matches: football-data rows with odds columns.
    pred_home: team_slug predictions for home side (is_home=True).
    """
    merged = pred_home.merge(
        matches,
        left_on=["season", "match_date", "team_slug"],
        right_on=["season", "match_date", "home_slug"],
        how="inner",
    )
    merged = merged.dropna(subset=["odds_over25", "odds_under25", "odds_home", "odds_draw", "odds_away"])

    rows = []
    for _, m in merged.iterrows():
        p_over_mkt = no_vig_over25(float(m["odds_over25"]), float(m["odds_under25"]))
        mu_mkt = implied_total_goals_from_over25(p_over_mkt)
        lam_h = float(m["lambda_for"])
        lam_a = float(m["lambda_against"])
        p_over_model = model_over25_prob(lam_h, lam_a)
        actual_over = float(m["fthg"] + m["ftag"] >= 3)
        actual_cs = float(m["ftag"] == 0)
        ph, pd_, pa = no_vig_1x2(
            float(m["odds_home"]), float(m["odds_draw"]), float(m["odds_away"])
        )
        rows.append(
            {
                "p_over_market": p_over_mkt,
                "p_over_model": p_over_model,
                "mu_market_total": mu_mkt,
                "mu_model_total": lam_h + lam_a,
                "actual_over25": actual_over,
                "actual_cs_home": actual_cs,
                "cs_prob_model": float(m["cs_prob"]),
                "p_home_market": ph,
            }
        )

    df = pd.DataFrame(rows)
    if df.empty:
        return {"n": 0}

    brier_over_model = float(((df["p_over_model"] - df["actual_over25"]) ** 2).mean())
    brier_over_mkt = float(((df["p_over_market"] - df["actual_over25"]) ** 2).mean())
    brier_cs_model = float(((df["cs_prob_model"] - df["actual_cs_home"]) ** 2).mean())

    return {
        "n_matches": len(df),
        "brier_over25_model": brier_over_model,
        "brier_over25_market": brier_over_mkt,
        "brier_cs_model": brier_cs_model,
        "mae_total_goals": float(
            (df["mu_model_total"] - df["mu_market_total"]).abs().mean()
        ),
        "corr_model_vs_market_total": float(
            df["mu_model_total"].corr(df["mu_market_total"])
        ),
        "mean_model_total": float(df["mu_model_total"].mean()),
        "mean_market_total": float(df["mu_market_total"].mean()),
    }
