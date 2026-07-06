from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..data_sources import fetch_ohlcv
from ..db import get_db
from ..strategy_engine import evaluate_strategy

router = APIRouter(prefix="/api/signals", tags=["signals"])

# Enough history for slow indicators (e.g. SMA 200 / MACD) to warm up.
LOOKBACK_DAYS = 400


@router.get("/today", response_model=list[schemas.TodaySignal])
def today_signals(db: Session = Depends(get_db)):
    items = db.query(models.WatchlistItem).filter(models.WatchlistItem.strategy_id.isnot(None)).all()
    start = (date.today() - timedelta(days=LOOKBACK_DAYS)).isoformat()
    end = date.today().isoformat()

    results = []
    for item in items:
        strategy = item.strategy
        try:
            df = fetch_ohlcv(item.market, item.symbol, start, end)
            evaluated = evaluate_strategy(df, strategy.rules)
            last = evaluated.iloc[-1]
            if bool(last["buy_signal"]):
                signal = "buy"
            elif bool(last["sell_signal"]):
                signal = "sell"
            else:
                signal = "hold"
            last_date = evaluated.index[-1]
            results.append(
                schemas.TodaySignal(
                    watchlist_item_id=item.id,
                    market=item.market,
                    symbol=item.symbol,
                    display_name=item.display_name,
                    strategy_id=strategy.id,
                    strategy_name=strategy.name,
                    signal=signal,
                    last_close=float(last["close"]),
                    last_date=str(last_date.date()) if hasattr(last_date, "date") else str(last_date),
                )
            )
        except Exception as exc:
            results.append(
                schemas.TodaySignal(
                    watchlist_item_id=item.id,
                    market=item.market,
                    symbol=item.symbol,
                    display_name=item.display_name,
                    strategy_id=strategy.id if strategy else None,
                    strategy_name=strategy.name if strategy else None,
                    signal="hold",
                    last_close=None,
                    last_date=None,
                    error=str(exc),
                )
            )
    return results
