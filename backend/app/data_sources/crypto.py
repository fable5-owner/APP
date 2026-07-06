"""Cryptocurrency OHLCV data via ccxt (public REST endpoints, no API key needed)."""

import ccxt
import pandas as pd


def fetch_crypto(symbol: str, start: str, end: str, exchange_id: str = "binance", timeframe: str = "1d") -> pd.DataFrame:
    """symbol: exchange trading pair, e.g. 'BTC/USDT', 'ETH/USDT'."""
    exchange_class = getattr(ccxt, exchange_id)
    exchange = exchange_class()

    since = exchange.parse8601(f"{start}T00:00:00Z")
    end_ms = exchange.parse8601(f"{end}T23:59:59Z")

    all_candles = []
    while since < end_ms:
        candles = exchange.fetch_ohlcv(symbol, timeframe=timeframe, since=since, limit=1000)
        if not candles:
            break
        all_candles.extend(candles)
        next_since = candles[-1][0] + 1
        if next_since <= since:
            break
        since = next_since
        if len(candles) < 1000:
            break

    df = pd.DataFrame(all_candles, columns=["timestamp", "open", "high", "low", "close", "volume"])
    if df.empty:
        return df
    df["date"] = pd.to_datetime(df["timestamp"], unit="ms")
    df = df.set_index("date").drop(columns=["timestamp"])
    df = df[(df.index >= pd.to_datetime(start)) & (df.index <= pd.to_datetime(end))]
    return df[["open", "high", "low", "close", "volume"]]
