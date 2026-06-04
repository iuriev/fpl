"""
Independent Poisson attack/defence model for team goals.

Fits log-rates: log λ_home = μ + attack_home + defence_away
                 log λ_away = μ + attack_away + defence_home

v0 spike; Dixon–Coles ρ adjustment is a follow-up.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from scipy.optimize import minimize
from scipy.stats import poisson


@dataclass
class TeamPoissonFit:
    teams: list[str]
    mu: float
    home_adv: float
    attack: dict[str, float]
    defence: dict[str, float]

    def _attack(self, team: str) -> float:
        return self.attack.get(team, 0.0)

    def _defence(self, team: str) -> float:
        return self.defence.get(team, 0.0)

    def lambda_home(self, home: str, away: str) -> float:
        return float(
            np.exp(
                self.mu
                + self.home_adv
                + self._attack(home)
                + self._defence(away)
            )
        )

    def lambda_away(self, home: str, away: str) -> float:
        return float(
            np.exp(self.mu + self._attack(away) + self._defence(home))
        )

    def cs_prob_home(self, home: str, away: str) -> float:
        return float(poisson.pmf(0, self.lambda_away(home, away)))

    def cs_prob_away(self, home: str, away: str) -> float:
        return float(poisson.pmf(0, self.lambda_home(home, away)))

    def to_strength_rows(self, season: str) -> pd.DataFrame:
        rows = []
        for t in self.teams:
            rows.append(
                {
                    "season": season,
                    "team_slug": t,
                    "attack": self.attack[t],
                    "defence": self.defence[t],
                    "home_adv": self.home_adv,
                    "mu": self.mu,
                }
            )
        return pd.DataFrame(rows)


def _neg_log_likelihood(
    params: np.ndarray,
    teams: list[str],
    home_idx: np.ndarray,
    away_idx: np.ndarray,
    home_goals: np.ndarray,
    away_goals: np.ndarray,
) -> float:
    n = len(teams)
    mu = params[0]
    home_adv = params[1]
    att = params[2 : 2 + n]
    deff = params[2 + n : 2 + 2 * n]
    att = att - att.mean()
    deff = deff - deff.mean()

    log_lam_h = mu + home_adv + att[home_idx] + deff[away_idx]
    log_lam_a = mu + att[away_idx] + deff[home_idx]
    lam_h = np.exp(np.clip(log_lam_h, -5, 5))
    lam_a = np.exp(np.clip(log_lam_a, -5, 5))

    ll = poisson.logpmf(home_goals, lam_h) + poisson.logpmf(away_goals, lam_a)
    return float(-ll.sum())


def fit_team_poisson(matches: pd.DataFrame) -> TeamPoissonFit:
    teams = sorted(set(matches["home_slug"]) | set(matches["away_slug"]))
    team_to_i = {t: i for i, t in enumerate(teams)}
    home_idx = matches["home_slug"].map(team_to_i).to_numpy()
    away_idx = matches["away_slug"].map(team_to_i).to_numpy()
    home_goals = matches["fthg"].to_numpy(dtype=float)
    away_goals = matches["ftag"].to_numpy(dtype=float)

    n = len(teams)
    x0 = np.zeros(2 + 2 * n)
    x0[1] = 0.2

    res = minimize(
        _neg_log_likelihood,
        x0,
        args=(teams, home_idx, away_idx, home_goals, away_goals),
        method="L-BFGS-B",
    )

    mu = float(res.x[0])
    home_adv = float(res.x[1])
    att = res.x[2 : 2 + n]
    deff = res.x[2 + n : 2 + 2 * n]
    att = att - att.mean()
    deff = deff - deff.mean()

    return TeamPoissonFit(
        teams=teams,
        mu=mu,
        home_adv=home_adv,
        attack={teams[i]: float(att[i]) for i in range(n)},
        defence={teams[i]: float(deff[i]) for i in range(n)},
    )


def predict_match_rows(
    fit: TeamPoissonFit,
    matches: pd.DataFrame,
    model_run_id: str = "spike-local",
) -> pd.DataFrame:
    rows = []
    for _, m in matches.iterrows():
        h, a = m["home_slug"], m["away_slug"]
        lam_h = fit.lambda_home(h, a)
        lam_a = fit.lambda_away(h, a)
        rows.append(
            {
                "model_run_id": model_run_id,
                "season": m["season"],
                "match_date": m["match_date"],
                "team_slug": h,
                "opponent_slug": a,
                "is_home": True,
                "lambda_for": lam_h,
                "lambda_against": lam_a,
                "cs_prob": fit.cs_prob_home(h, a),
            }
        )
        rows.append(
            {
                "model_run_id": model_run_id,
                "season": m["season"],
                "match_date": m["match_date"],
                "team_slug": a,
                "opponent_slug": h,
                "is_home": False,
                "lambda_for": lam_a,
                "lambda_against": lam_h,
                "cs_prob": fit.cs_prob_away(h, a),
            }
        )
    return pd.DataFrame(rows)


def evaluate_cs_calibration(pred: pd.DataFrame, matches: pd.DataFrame) -> dict[str, float]:
    """Brier score for home-team CS (home matches only in pred)."""
    home_pred = pred[pred["is_home"]].copy()
    merged = home_pred.merge(
        matches,
        left_on=["season", "match_date", "team_slug"],
        right_on=["season", "match_date", "home_slug"],
        how="inner",
    )
    actual = (merged["ftag"] == 0).astype(float)
    brier = float(((merged["cs_prob"] - actual) ** 2).mean())
    return {
        "n_matches": len(merged),
        "brier_cs_home": brier,
        "actual_cs_rate": float(actual.mean()),
        "mean_pred_cs": float(merged["cs_prob"].mean()),
    }
