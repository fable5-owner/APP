"""Technical indicator calculations over OHLCV DataFrames.

Every function takes a DataFrame with at least a ``close`` column
(``high``/``low`` are needed for a couple of indicators) and returns a
``pandas.Series`` aligned to the input index.
"""

import pandas as pd


def sma(df: pd.DataFrame, period: int, column: str = "close") -> pd.Series:
    return df[column].rolling(window=period, min_periods=period).mean()


def ema(df: pd.DataFrame, period: int, column: str = "close") -> pd.Series:
    return df[column].ewm(span=period, adjust=False, min_periods=period).mean()


def rsi(df: pd.DataFrame, period: int = 14, column: str = "close") -> pd.Series:
    delta = df[column].diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    avg_gain = gain.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()

    rs = avg_gain / avg_loss.replace(0, float("nan"))
    result = 100 - (100 / (1 + rs))
    result[(avg_loss == 0) & (avg_gain > 0)] = 100
    result[(avg_loss == 0) & (avg_gain == 0)] = 50
    return result


def macd(
    df: pd.DataFrame,
    fast: int = 12,
    slow: int = 26,
    signal: int = 9,
    column: str = "close",
) -> pd.DataFrame:
    ema_fast = ema(df, fast, column)
    ema_slow = ema(df, slow, column)
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False, min_periods=signal).mean()
    histogram = macd_line - signal_line
    return pd.DataFrame(
        {"macd": macd_line, "signal": signal_line, "histogram": histogram}
    )


def bollinger_bands(
    df: pd.DataFrame, period: int = 20, num_std: float = 2.0, column: str = "close"
) -> pd.DataFrame:
    mid = sma(df, period, column)
    std = df[column].rolling(window=period, min_periods=period).std()
    upper = mid + num_std * std
    lower = mid - num_std * std
    return pd.DataFrame({"upper": upper, "mid": mid, "lower": lower})


# Registry used by the strategy engine to resolve indicator names -> series.
# Each builder takes (df, params) and returns a single pd.Series.
def build_indicator_series(df: pd.DataFrame, name: str, params: dict) -> pd.Series:
    name = name.upper()
    if name == "CLOSE":
        return df["close"]
    if name == "SMA":
        return sma(df, int(params["period"]))
    if name == "EMA":
        return ema(df, int(params["period"]))
    if name == "RSI":
        return rsi(df, int(params.get("period", 14)))
    if name == "MACD":
        return macd(
            df,
            int(params.get("fast", 12)),
            int(params.get("slow", 26)),
            int(params.get("signal", 9)),
        )["macd"]
    if name == "MACD_SIGNAL":
        return macd(
            df,
            int(params.get("fast", 12)),
            int(params.get("slow", 26)),
            int(params.get("signal", 9)),
        )["signal"]
    if name == "BB_UPPER":
        return bollinger_bands(df, int(params.get("period", 20)), float(params.get("num_std", 2.0)))["upper"]
    if name == "BB_LOWER":
        return bollinger_bands(df, int(params.get("period", 20)), float(params.get("num_std", 2.0)))["lower"]
    if name == "BB_MID":
        return bollinger_bands(df, int(params.get("period", 20)), float(params.get("num_std", 2.0)))["mid"]
    raise ValueError(f"Unknown indicator: {name}")
