#!/usr/bin/env python3
"""Fit team Poisson on train seasons; evaluate CS calibration on hold-out matches."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "ingest"))
sys.path.insert(0, str(ROOT))

from ingest.load_football_data import load_matches
from models.team_poisson import evaluate_cs_calibration, fit_team_poisson, predict_match_rows

OUT_DIR = ROOT / "output"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--train-codes", nargs="*", default=["2223", "2324"])
    parser.add_argument("--holdout-code", default="2425")
    parser.add_argument("--holdout-from", default="2025-02-01")
    args = parser.parse_args()

    train = load_matches(args.train_codes)
    holdout = load_matches([args.holdout_code])
    holdout = holdout[holdout["match_date"] >= args.holdout_from]

    fit = fit_team_poisson(train)
    pred = predict_match_rows(fit, holdout)
    metrics = evaluate_cs_calibration(pred, holdout)

    OUT_DIR.mkdir(exist_ok=True)
    strength = fit.to_strength_rows(f"{args.train_codes[-1]}+{args.holdout_code}")
    strength.to_csv(OUT_DIR / "team_strength.csv", index=False)
    pred.to_csv(OUT_DIR / "fixture_team_holdout.csv", index=False)

    report = {
        "train_matches": len(train),
        "holdout_matches": len(holdout),
        "metrics": metrics,
        "mu": fit.mu,
        "home_adv": fit.home_adv,
    }
    (OUT_DIR / "team_model_report.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
