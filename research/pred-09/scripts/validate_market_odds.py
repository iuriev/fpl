#!/usr/bin/env python3
"""Criterion C — model vs football-data closing odds (O/U 2.5, 1X2)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "ingest"))
sys.path.insert(0, str(ROOT))

from ingest.load_football_data import load_matches
from models.market_sanity import evaluate_match_odds
from models.team_poisson import fit_team_poisson, predict_match_rows

OUT = ROOT / "output"


def main() -> None:
    train = load_matches(["2223", "2324"])
    holdout = load_matches(["2425"])
    holdout = holdout[holdout["match_date"] >= "2025-02-01"]

    fit = fit_team_poisson(train)
    pred = predict_match_rows(fit, holdout)
    metrics = evaluate_match_odds(holdout, pred[pred["is_home"]])

    report = {
        "note": "football-data has no direct CS odds; CS Brier uses model cs_prob vs actual",
        "holdout": "2425 from 2025-02-01",
        "metrics": metrics,
    }

    OUT.mkdir(exist_ok=True)
    (OUT / "market_sanity_report.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
