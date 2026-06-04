"""Blend model xPts with FPL ep_next proxy (vaastav xP)."""

from __future__ import annotations

CONFIDENCE_WEIGHT_EP = {"high": 0.25, "medium": 0.45, "low": 0.65}


def blend_xpts(model_xpts: float, ep_next: float, confidence: str) -> float:
    w = CONFIDENCE_WEIGHT_EP.get(confidence, 0.5)
    return (1 - w) * model_xpts + w * ep_next


def infer_confidence(
    sample_gws: int,
    avg_minutes: float,
    start_rate: float,
) -> str:
    if sample_gws < 3 or avg_minutes < 45:
        return "low"
    if sample_gws >= 5 and start_rate >= 0.75 and avg_minutes >= 70:
        return "high"
    return "medium"
