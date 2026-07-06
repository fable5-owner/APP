"""Evaluates user-defined rule-based strategies against OHLCV data.

A strategy is stored as JSON with this shape::

    {
        "buy_rules": [rule, ...],   # ANDed together to form a buy signal
        "sell_rules": [rule, ...],  # ANDed together to form a sell signal
    }

Each ``rule`` compares two operands::

    {
        "left": {"indicator": "SMA", "params": {"period": 20}},
        "operator": "cross_above",
        "right": {"indicator": "SMA", "params": {"period": 60}}
    }

The right-hand (and left-hand) operand may instead be a bare constant::

    {"value": 30}

Supported operators: ``>``, ``<``, ``>=``, ``<=``, ``==``, ``cross_above``, ``cross_below``.
"""

import pandas as pd

from .indicators import build_indicator_series

VALID_OPERATORS = {">", "<", ">=", "<=", "==", "cross_above", "cross_below"}


def _resolve_operand(df: pd.DataFrame, operand: dict):
    if "value" in operand:
        return operand["value"]
    if "indicator" not in operand:
        raise ValueError(f"Operand must have 'indicator' or 'value': {operand}")
    return build_indicator_series(df, operand["indicator"], operand.get("params", {}))


def _evaluate_rule(df: pd.DataFrame, rule: dict) -> pd.Series:
    operator = rule.get("operator")
    if operator not in VALID_OPERATORS:
        raise ValueError(f"Unsupported operator: {operator}")

    left = _resolve_operand(df, rule["left"])
    right = _resolve_operand(df, rule["right"])

    if operator == ">":
        return left > right
    if operator == "<":
        return left < right
    if operator == ">=":
        return left >= right
    if operator == "<=":
        return left <= right
    if operator == "==":
        return left == right
    if operator == "cross_above":
        left_series = left if isinstance(left, pd.Series) else pd.Series(left, index=df.index)
        right_series = right if isinstance(right, pd.Series) else pd.Series(right, index=df.index)
        return (left_series.shift(1) <= right_series.shift(1)) & (left_series > right_series)
    if operator == "cross_below":
        left_series = left if isinstance(left, pd.Series) else pd.Series(left, index=df.index)
        right_series = right if isinstance(right, pd.Series) else pd.Series(right, index=df.index)
        return (left_series.shift(1) >= right_series.shift(1)) & (left_series < right_series)
    raise ValueError(f"Unsupported operator: {operator}")


def validate_strategy(strategy: dict) -> None:
    if not isinstance(strategy, dict):
        raise ValueError("Strategy must be a JSON object")
    for key in ("buy_rules", "sell_rules"):
        rules = strategy.get(key)
        if not isinstance(rules, list) or len(rules) == 0:
            raise ValueError(f"Strategy must have a non-empty '{key}' list")
        for rule in rules:
            if rule.get("operator") not in VALID_OPERATORS:
                raise ValueError(f"Invalid operator in {key}: {rule.get('operator')}")
            if "left" not in rule or "right" not in rule:
                raise ValueError(f"Rule missing 'left'/'right': {rule}")


def evaluate_strategy(df: pd.DataFrame, strategy: dict) -> pd.DataFrame:
    """Returns a copy of df with boolean 'buy_signal' / 'sell_signal' columns added."""
    validate_strategy(strategy)
    result = df.copy()

    buy_mask = pd.Series(True, index=df.index)
    for rule in strategy["buy_rules"]:
        buy_mask &= _evaluate_rule(df, rule).fillna(False)

    sell_mask = pd.Series(True, index=df.index)
    for rule in strategy["sell_rules"]:
        sell_mask &= _evaluate_rule(df, rule).fillna(False)

    result["buy_signal"] = buy_mask
    result["sell_signal"] = sell_mask
    return result
