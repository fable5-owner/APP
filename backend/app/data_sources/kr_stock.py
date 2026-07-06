"""Korean stock OHLCV data via FinanceDataReader (KRX / Naver Finance backed, no API key needed)."""

import FinanceDataReader as fdr
import pandas as pd


def fetch_kr_stock(symbol: str, start: str, end: str) -> pd.DataFrame:
    """symbol: KRX ticker code, e.g. '005930' (Samsung Electronics) or index code like 'KS11' (KOSPI)."""
    df = fdr.DataReader(symbol, start, end)
    df = df.rename(columns=str.lower)
    df.index.name = "date"
    return df[["open", "high", "low", "close", "volume"]]
