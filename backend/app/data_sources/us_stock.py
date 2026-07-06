"""US stock OHLCV data via FinanceDataReader (stooq-backed, no API key needed).

Note: yfinance/Yahoo Finance is intentionally avoided here — Yahoo aggressively
rate-limits requests coming from shared/cloud IP ranges, which makes it
unreliable for a server-side app that fetches data on every run.
"""

import FinanceDataReader as fdr
import pandas as pd


def fetch_us_stock(symbol: str, start: str, end: str) -> pd.DataFrame:
    """symbol: US ticker, e.g. 'AAPL', 'SPY', 'QQQ'."""
    df = fdr.DataReader(symbol, start, end)
    df = df.rename(columns=str.lower)
    df.index.name = "date"
    return df[["open", "high", "low", "close", "volume"]]
