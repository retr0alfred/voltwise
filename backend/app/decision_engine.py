

"""Decision Engine v3 (Optimized & Stable for Production / Hackathon)"""

from __future__ import annotations

import math
from datetime import datetime
from typing import Optional


# ---------------------------------------------------------------------------
# Regime table (slightly softened influence)
# ---------------------------------------------------------------------------
_HOUR_REGIME = {
    0:  (0.7, "night"), 1:  (0.7, "night"), 2:  (0.8, "night"),
    3:  (1.2, "stable_overnight"), 4:  (1.2, "stable_overnight"),
    5:  (0.9, "morning_ramp"), 6:  (0.5, "morning_ramp"),
    7:  (0.5, "morning_ramp"), 8:  (1.0, "morning_peak"),
    9:  (1.0, "morning_peak"), 10: (0.95, "morning_peak"),
    11: (1.15, "midday"), 12: (1.2, "midday"),
    13: (1.1, "midday"), 14: (0.9, "afternoon"),
    15: (0.85, "afternoon"), 16: (0.8, "afternoon"),
    17: (0.85, "evening_ramp"), 18: (1.0, "evening_ramp"),
    19: (1.05, "evening_peak"), 20: (1.1, "evening_peak"),
    21: (1.1, "evening_peak"), 22: (0.85, "late_night"),
    23: (0.9, "late_night"),
}

# Tunable constants
NOISE_FLOOR_PCT = 0.005
WEAK_SIGNAL_THRESHOLD = 0.25   # relaxed
BUY_SELL_THRESHOLD = 0.5
STRONG_THRESHOLD = 1.2         # slightly reduced
MIN_REGIME_WEIGHT = 0.4
DEFAULT_VOLATILITY = 0.058
VOL_WINDOW = 12                # increased for stability


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _local_volatility(price_history: list[float]) -> float:
    if len(price_history) < 3:
        return DEFAULT_VOLATILITY

    window = price_history[-VOL_WINDOW:]
    returns = [
        (window[i] - window[i - 1]) / window[i - 1]
        for i in range(1, len(window))
        if window[i - 1] != 0
    ]

    if not returns:
        return DEFAULT_VOLATILITY

    mean_r = sum(returns) / len(returns)
    variance = sum((r - mean_r) ** 2 for r in returns) / len(returns)
    vol = math.sqrt(variance)

    return max(vol, 0.01)   # improved clamp


def _regime(hour: int):
    return _HOUR_REGIME.get(hour, (1.0, "unknown"))


def _score_to_decision(score: float) -> str:
    if score > 0.65:
        return "STRONG BUY"
    if score > 0.25:
        return "BUY"
    if score < -0.65:
        return "STRONG SELL"
    if score < -0.25:
        return "SELL"
    return "HOLD"


# ---------------------------------------------------------------------------
# Main Decision Function
# ---------------------------------------------------------------------------

def make_decision(
    current_mcp: float,
    pred_t1: float,
    pred_t4: float,
    pred_t8: float,
    timestamp: Optional[datetime] = None,
    price_history: Optional[list[float]] = None,
) -> dict:

    if current_mcp <= 0:
        return _hold("Invalid MCP", 0.0, "unknown", {})

    ts = timestamp or datetime.now()
    hour = ts.hour

    # ── Regime
    regime_weight, regime_label = _regime(hour)

    if regime_weight < MIN_REGIME_WEIGHT:
        return _hold(
            f"Low reliability period ({regime_label})",
            0.0,
            regime_label,
            {"regime_weight": regime_weight},
        )

    # ── Volatility
    history = list(price_history) if price_history else []
    local_vol = _local_volatility(history)

    # ── Predictions
    pred_pct_t1 = (pred_t1 - current_mcp) / current_mcp
    pred_pct_t4 = (pred_t4 - current_mcp) / current_mcp

    # ── Noise filter
    if abs(pred_pct_t1) < NOISE_FLOOR_PCT:
        return _hold(
            "Prediction below noise floor",
            0.0,
            regime_label,
            {"pred_pct_t1": pred_pct_t1},
        )

    # ── Signal strength
    signal_strength = abs(pred_pct_t1) / local_vol

    if signal_strength < WEAK_SIGNAL_THRESHOLD:
        return _hold(
            "Weak signal vs volatility",
            signal_strength / 10,
            regime_label,
            {"signal_strength": signal_strength},
        )

    # ── Improved direction logic (FIXED)
    combined_signal = (pred_pct_t1 + pred_pct_t4) / 2
    direction = 1 if combined_signal > 0 else -1

    t4_direction = 1 if pred_pct_t4 > 0 else -1
    agreement = direction == t4_direction

    # ── Score calculation (simplified & stable)
    base_score = direction * min(signal_strength / STRONG_THRESHOLD, 1.0)

    if not agreement:
        base_score *= 0.7   # softer penalty

    # Regime scaling (bounded)
    regime_factor = min(max(regime_weight, 0.8), 1.2)

    score = max(-1.0, min(1.0, base_score * regime_factor))

    # ── Decision
    decision = _score_to_decision(score)

    # ── Confidence
    confidence = round(abs(score) * min(regime_weight, 1.0), 4)

    # ── Position sizing
    abs_score = abs(score)
    if abs_score >= 0.75:
        size = "full"
    elif abs_score >= 0.5:
        size = "medium"
    elif abs_score >= 0.25:
        size = "small"
    else:
        size = "none"

    # ── Reason
    reason = (
        f"{'Upward' if direction==1 else 'Downward'} move of {abs(pred_pct_t1):.2%}. "
        f"Strength={signal_strength:.2f}×vol, Regime={regime_label}."
    )

    # ── Debug signals
    signals = {
        "pred_pct_t1": round(pred_pct_t1, 4),
        "pred_pct_t4": round(pred_pct_t4, 4),
        "volatility": round(local_vol, 4),
        "signal_strength": round(signal_strength, 4),
        "agreement": agreement,
        "regime_weight": regime_weight,
        "score": round(score, 4),
    }

    return {
        "decision": decision,
        "score": round(score, 4),
        "confidence": confidence,
        "regime": regime_label,
        "reason": reason,
        "suggested_size": size,
        "signals": signals,
    }


# ---------------------------------------------------------------------------
# HOLD helper
# ---------------------------------------------------------------------------

def _hold(reason: str, confidence: float, regime: str, signals: dict):
    return {
        "decision": "HOLD",
        "score": 0.0,
        "confidence": round(confidence, 4),
        "regime": regime,
        "reason": reason,
        "suggested_size": "none",
        "signals": signals,
    }

# """Decision Engine for trading recommendations based on predictions (Improved v2)."""

# def make_decision(current_mcp: float, pred_t1: float, pred_t4: float, pred_t8: float) -> dict:
#     """
#     Generate trading decision based on multi-horizon predictions with improved robustness.
    
#     Args:
#         current_mcp: Current market clearing price
#         pred_t1: Prediction for t+15min
#         pred_t4: Prediction for t+1hr
#         pred_t8: Prediction for t+2hr
    
#     Returns:
#         Dictionary with decision, confidence, and reason
#     """

#     # 🔧 Tunable parameters
#     threshold = 0.03         # 3% decision threshold
#     noise_threshold = 0.015  # 1.5% noise filter
#     confidence_threshold = 0.02  # minimum confidence to act

#     # 📊 Percentage change (short-term)
#     pct_change_t1 = (pred_t1 - current_mcp) / current_mcp

#     # 🛑 Strong noise filter (first barrier)
#     if abs(pct_change_t1) < noise_threshold:
#         return {
#             "decision": "HOLD",
#             "confidence": round(abs(pct_change_t1), 4),
#             "reason": "Movement too small (<1.5%), avoiding noise"
#         }

#     # 📈 Trend consistency check (monotonic behavior)
#     up_trend = pred_t1 > current_mcp and pred_t4 > pred_t1 and pred_t8 > pred_t4
#     down_trend = pred_t1 < current_mcp and pred_t4 < pred_t1 and pred_t8 < pred_t4

#     # 📊 Multi-horizon confidence calculation
#     confidence = (
#         abs(pred_t1 - current_mcp) +
#         abs(pred_t4 - pred_t1) +
#         abs(pred_t8 - pred_t4)
#     ) / (3 * current_mcp)

#     confidence = min(confidence, 1.0)

#     # 🛑 Confidence filter (second barrier)
#     if confidence < confidence_threshold:
#         return {
#             "decision": "HOLD",
#             "confidence": round(confidence, 4),
#             "reason": "Low confidence signal, skipping trade"
#         }

#     # 🎯 Core decision logic (more selective)
#     if up_trend and pred_t1 > current_mcp * (1 + threshold):
#         decision = "STRONG BUY"
#         direction = "increase"

#     elif down_trend and pred_t1 < current_mcp * (1 - threshold):
#         decision = "STRONG SELL"
#         direction = "decrease"

#     elif pred_t1 > current_mcp * (1 + threshold):
#         decision = "BUY"
#         direction = "increase"

#     elif pred_t1 < current_mcp * (1 - threshold):
#         decision = "SELL"
#         direction = "decrease"

#     else:
#         decision = "HOLD"
#         direction = "uncertain"

#     # 🧠 Reason generation
#     pct_change_str = f"{abs(pct_change_t1) * 100:.2f}%"

#     if decision == "STRONG BUY":
#         reason = f"Strong upward trend across all horizons with {pct_change_str} expected increase"

#     elif decision == "STRONG SELL":
#         reason = f"Strong downward trend across all horizons with {pct_change_str} expected decrease"

#     elif decision == "BUY":
#         reason = f"Moderate upward movement predicted ({pct_change_str})"

#     elif decision == "SELL":
#         reason = f"Moderate downward movement predicted ({pct_change_str})"

#     else:
#         if pct_change_t1 > 0:
#             reason = f"Weak upward signal ({pct_change_str}), not strong enough to trade"
#         else:
#             reason = f"Weak downward signal ({pct_change_str}), not strong enough to trade"

#     return {
#         "decision": decision,
#         "confidence": round(confidence, 4),
#         "reason": reason
#     }