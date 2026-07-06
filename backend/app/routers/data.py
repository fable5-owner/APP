from datetime import date, timedelta

from fastapi import APIRouter, HTTPException

from ..data_sources import fetch_ohlcv

router = APIRouter(prefix="/api/data", tags=["data"])


@router.get("/{market}/{symbol}")
def get_ohlcv(market: str, symbol: str, start: str | None = None, end: str | None = None):
    if start is None:
        start = (date.today() - timedelta(days=365)).isoformat()
    try:
        df = fetch_ohlcv(market, symbol, start, end)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # data-source libraries raise assorted exception types
        raise HTTPException(status_code=502, detail=f"Failed to fetch data: {exc}") from exc

    bars = [
        {
            "date": str(idx.date()) if hasattr(idx, "date") else str(idx),
            "open": float(row["open"]),
            "high": float(row["high"]),
            "low": float(row["low"]),
            "close": float(row["close"]),
            "volume": float(row["volume"]),
        }
        for idx, row in df.iterrows()
    ]
    return bars
