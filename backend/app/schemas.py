from datetime import datetime

from pydantic import BaseModel, ConfigDict


class WatchlistItemCreate(BaseModel):
    market: str
    symbol: str
    display_name: str | None = None
    strategy_id: int | None = None


class WatchlistItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    market: str
    symbol: str
    display_name: str | None
    strategy_id: int | None
    created_at: datetime


class StrategyCreate(BaseModel):
    name: str
    rules: dict


class StrategyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    rules: dict
    created_at: datetime


class BacktestRequest(BaseModel):
    strategy_id: int
    market: str
    symbol: str
    start_date: str
    end_date: str | None = None
    initial_capital: float = 10_000_000.0


class BacktestRunOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    strategy_id: int
    market: str
    symbol: str
    start_date: str
    end_date: str
    initial_capital: float
    metrics: dict
    equity_curve: list
    trades: list
    created_at: datetime


class OhlcvBar(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float


class TodaySignal(BaseModel):
    watchlist_item_id: int
    market: str
    symbol: str
    display_name: str | None
    strategy_id: int | None
    strategy_name: str | None
    signal: str  # "buy" | "sell" | "hold"
    last_close: float | None
    last_date: str | None
    error: str | None = None
