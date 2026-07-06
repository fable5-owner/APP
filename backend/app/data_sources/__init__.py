"""Unified OHLCV data-fetch layer across markets.

Every market-specific fetcher returns a DataFrame indexed by date with
lower-case columns: open, high, low, close, volume.
"""

from datetime import date

import pandas as pd

from .crypto import fetch_crypto
from .kr_stock import fetch_kr_stock
from .us_stock import fetch_us_stock

MARKETS = {"kr_stock", "us_stock", "crypto"}


def fetch_ohlcv(market: str, symbol: str, start: str, end: str | None = None) -> pd.DataFrame:
    if market not in MARKETS:
        raise ValueError(f"Unknown market '{market}'. Must be one of {sorted(MARKETS)}")
    if end is None:
        end = date.today().isoformat()

    if market == "kr_stock":
        df = fetch_kr_stock(symbol, start, end)
    elif market == "us_stock":
        df = fetch_us_stock(symbol, start, end)
    else:
        df = fetch_crypto(symbol, start, end)

    if df.empty:
        raise ValueError(f"No data returned for {market}/{symbol} between {start} and {end}")
    return df
