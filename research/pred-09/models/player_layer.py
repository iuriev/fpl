"""
Player-level xGoals / xAssists from team Poisson λ and rolling share of team xG/xA.
"""

from __future__ import annotations

import pandas as pd

from ingest.team_map import resolve_team_slug
from models.defcon import expected_defcon_pts, rolling_defcon_hit_rate
from models.fpl_points import model_xpts
from models.hybrid import blend_xpts, infer_confidence
from models.team_poisson import TeamPoissonFit


def _numeric(df: pd.DataFrame, col: str) -> pd.Series:
    return pd.to_numeric(df[col], errors="coerce").fillna(0.0)


def enrich_merged_gw(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    if "GW" in out.columns and "round" not in out.columns:
        out["round"] = out["GW"]
    out["expected_goals"] = _numeric(out, "expected_goals")
    out["expected_assists"] = _numeric(out, "expected_assists")
    out["minutes"] = _numeric(out, "minutes")
    out["starts"] = _numeric(out, "starts") if "starts" in out.columns else 0
    out["xP"] = _numeric(out, "xP")
    if "defensive_contribution" in out.columns:
        out["defensive_contribution"] = _numeric(out, "defensive_contribution")
    return out


def team_match_xg(grp: pd.DataFrame) -> float:
    return float(grp["expected_goals"].sum())


def add_rolling_shares(df: pd.DataFrame, window: int = 5) -> pd.DataFrame:
    df = df.sort_values(["element", "season", "round", "fixture"])
    rows = []
    for element, g in df.groupby("element"):
        g = g.copy()
        team_xg = []
        shares_g = []
        shares_a = []
        hist = []
        for idx, row in g.iterrows():
            if hist:
                recent = hist[-window:]
                t_xg = sum(h["team_xg"] for h in recent) or 1e-6
                p_xg = sum(h["xg"] for h in recent)
                p_xa = sum(h["xa"] for h in recent)
                shares_g.append(p_xg / t_xg if t_xg > 0 else 0.05)
                t_xa = sum(h["team_xa"] for h in recent) or 1e-6
                shares_a.append(p_xa / t_xa if t_xa > 0 else 0.05)
            else:
                pos = row.get("position", "MID")
                shares_g.append(0.12 if pos == "FWD" else 0.08 if pos == "MID" else 0.04)
                shares_a.append(0.10 if pos == "MID" else 0.06)
            hist.append(
                {
                    "xg": row["expected_goals"],
                    "xa": row["expected_assists"],
                    "team_xg": row["team_match_xg"],
                    "team_xa": row["team_match_xa"],
                    "minutes": row["minutes"],
                    "starts": row.get("starts", 0),
                    "defensive_contribution": row.get("defensive_contribution", 0),
                    "round": row["round"],
                }
            )
        g["share_xg"] = shares_g
        g["share_xa"] = shares_a
        g["history_len"] = [min(i, window) for i in range(len(g))]
        rows.append(g)
    return pd.concat(rows, ignore_index=True)


def prepare_with_team_totals(df: pd.DataFrame) -> pd.DataFrame:
    df = enrich_merged_gw(df)
    team_totals = (
        df.groupby(["season", "round", "team"], as_index=False)
        .agg(
            team_match_xg=("expected_goals", "sum"),
            team_match_xa=("expected_assists", "sum"),
        )
    )
    return df.merge(team_totals, on=["season", "round", "team"], how="left")


def team_lambda_for_row(
    fit: TeamPoissonFit,
    team_slug: str | None,
    opp_slug: str | None,
    was_home: bool,
) -> tuple[float, float, float | None]:
    if not team_slug or not opp_slug:
        return 0.0, 0.0, None
    if was_home:
        lam_for = fit.lambda_home(team_slug, opp_slug)
        lam_against = fit.lambda_away(team_slug, opp_slug)
        cs = fit.cs_prob_home(team_slug, opp_slug)
    else:
        lam_for = fit.lambda_away(team_slug, opp_slug)
        lam_against = fit.lambda_home(team_slug, opp_slug)
        cs = fit.cs_prob_away(team_slug, opp_slug)
    return lam_for, lam_against, cs


def minutes_probability(history: list[dict], default: float = 0.7) -> float:
    if not history:
        return default
    recent = history[-5:]
    avg = sum(h["minutes"] for h in recent) / len(recent)
    return min(max(avg / 90.0, 0.05), 1.0)


XA_RATE_WINDOW = 8
XA_RATE_FULL_WEIGHT_MINS = 360


def default_xa_per_90(position: str) -> float:
    if position == "MID":
        return 0.14
    if position == "FWD":
        return 0.08
    if position == "DEF":
        return 0.05
    return 0.01


def rolling_xa_per_90(history: list[dict]) -> tuple[float, float]:
    recent = history[-XA_RATE_WINDOW:]
    total_xa = sum(h["expected_assists"] for h in recent)
    total_mins = sum(h["minutes"] for h in recent)
    if total_mins <= 0:
        return 0.0, 0.0
    return (total_xa / total_mins) * 90.0, float(total_mins)


def blended_xa_per_90(position: str, history: list[dict]) -> float:
    prior = default_xa_per_90(position)
    rate, minutes = rolling_xa_per_90(history)
    if minutes <= 0:
        return prior
    weight = min(minutes / XA_RATE_FULL_WEIGHT_MINS, 1.0)
    return weight * rate + (1.0 - weight) * prior


def fixture_attack_multiplier(lam_for: float, fit: TeamPoissonFit) -> float:
    import math

    baseline = math.exp(fit.mu)
    if baseline <= 0 or lam_for <= 0:
        return 1.0
    return math.sqrt(lam_for / baseline)


def predict_x_assists(
    position: str,
    lam_for: float,
    fit: TeamPoissonFit,
    history: list[dict],
    mins_prob: float,
) -> float:
    xa_per_90 = blended_xa_per_90(position, history)
    expected_mins = mins_prob * 90.0
    return xa_per_90 * (expected_mins / 90.0) * fixture_attack_multiplier(lam_for, fit)


def predict_fixture_row(
    row: pd.Series,
    fit: TeamPoissonFit,
    team_to_slug: dict[int, str],
    history: list[dict],
) -> dict:
    position = str(row.get("position", "MID"))
    team_slug = resolve_team_slug(row["team"], team_to_slug)
    opp_slug = resolve_team_slug(row["opponent_team"], team_to_slug)
    was_home = bool(row.get("was_home", True))
    lam_for, lam_against, cs_team = team_lambda_for_row(fit, team_slug, opp_slug, was_home)

    share_xg = float(row.get("share_xg", 0.08))
    mins_prob = minutes_probability(history)

    x_goals = lam_for * share_xg * mins_prob
    x_assists = predict_x_assists(position, lam_for, fit, history, mins_prob)

    hist_df = pd.DataFrame(history) if history else pd.DataFrame()
    defcon_hit_rate = rolling_defcon_hit_rate(hist_df, position)
    defcon_pts = expected_defcon_pts(defcon_hit_rate, mins_prob, position)

    cs_prob = None
    if position in ("GK", "DEF") and cs_team is not None:
        cs_prob = cs_team * mins_prob

    m_pts = model_xpts(
        position, x_goals, x_assists, cs_prob, lam_against, mins_prob, defcon_pts
    )

    avg_mins = (
        sum(h["minutes"] for h in history[-5:]) / max(len(history[-5:]), 1)
        if history
        else 0
    )
    start_rate = (
        sum(1 for h in history[-5:] if h.get("starts", 0) > 0) / max(len(history[-5:]), 1)
        if history
        else 0
    )
    confidence = infer_confidence(len(history), avg_mins, start_rate)
    ep = float(row.get("xP", 0))
    x_pts = blend_xpts(m_pts, ep, confidence)

    return {
        "element": int(row["element"]),
        "round": int(row["round"]),
        "fixture": int(row["fixture"]) if pd.notna(row.get("fixture")) else 0,
        "position": position,
        "x_goals": x_goals,
        "x_assists": x_assists,
        "cs_prob": cs_prob,
        "defcon_pts": defcon_pts,
        "model_x_pts": m_pts,
        "x_pts": x_pts,
        "ep_next_anchor": ep,
        "confidence": confidence,
        "mins_prob": mins_prob,
        "lambda_for": lam_for,
    }


def score_season_gws(
    df: pd.DataFrame,
    fit: TeamPoissonFit,
    team_to_slug: dict[int, str],
    train_max_gw: int,
    score_min_gw: int,
    score_max_gw: int,
) -> pd.DataFrame:
    df = prepare_with_team_totals(df)
    df = add_rolling_shares(df)

    preds = []
    history_by_el: dict[int, list[dict]] = {}

    for rnd in sorted(df["round"].unique()):
        rnd = int(rnd)
        gw_df = df[df["round"] == rnd].sort_values("fixture")
        if score_min_gw <= rnd <= score_max_gw and rnd > train_max_gw:
            for _, row in gw_df.iterrows():
                el = int(row["element"])
                hist = history_by_el.get(el, [])
                preds.append(predict_fixture_row(row, fit, team_to_slug, hist))
        for _, row in gw_df.iterrows():
            el = int(row["element"])
            history_by_el.setdefault(el, []).append(
                {
                    "expected_goals": row["expected_goals"],
                    "expected_assists": row["expected_assists"],
                    "minutes": row["minutes"],
                    "starts": row.get("starts", 0),
                    "defensive_contribution": row.get("defensive_contribution", 0),
                    "round": rnd,
                }
            )

    return pd.DataFrame(preds)


def aggregate_gw_predictions(fixture_preds: pd.DataFrame) -> pd.DataFrame:
    def _combine_cs(series: pd.Series) -> float | None:
        valid = series.dropna()
        if valid.empty:
            return None
        p = 1.0
        for v in valid:
            p *= 1.0 - float(v)
        return 1.0 - p

    agg = fixture_preds.groupby(["element", "round"], as_index=False).agg(
        x_goals=("x_goals", "sum"),
        x_assists=("x_assists", "sum"),
        defcon_pts=("defcon_pts", "sum"),
        model_x_pts=("model_x_pts", "sum"),
        x_pts=("x_pts", "sum"),
        ep_next_anchor=("ep_next_anchor", "sum"),
        confidence=("confidence", "first"),
        position=("position", "first"),
        cs_prob=("cs_prob", _combine_cs),
    )
    return agg
