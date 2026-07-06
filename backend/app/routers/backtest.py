from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..backtest_engine import run_backtest
from ..data_sources import fetch_ohlcv
from ..db import get_db
from ..strategy_engine import evaluate_strategy

router = APIRouter(prefix="/api/backtest", tags=["backtest"])


@router.post("", response_model=schemas.BacktestRunOut)
def create_backtest(payload: schemas.BacktestRequest, db: Session = Depends(get_db)):
    strategy = db.get(models.Strategy, payload.strategy_id)
    if strategy is None:
        raise HTTPException(status_code=404, detail="Strategy not found")

    end_date = payload.end_date or date.today().isoformat()

    try:
        df = fetch_ohlcv(payload.market, payload.symbol, payload.start_date, end_date)
        evaluated = evaluate_strategy(df, strategy.rules)
        result = run_backtest(evaluated, payload.initial_capital)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Backtest failed: {exc}") from exc

    run = models.BacktestRun(
        strategy_id=strategy.id,
        market=payload.market,
        symbol=payload.symbol,
        start_date=payload.start_date,
        end_date=end_date,
        initial_capital=payload.initial_capital,
        metrics=result["metrics"],
        equity_curve=result["equity_curve"],
        trades=result["trades"],
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


@router.get("", response_model=list[schemas.BacktestRunOut])
def list_backtests(db: Session = Depends(get_db)):
    return db.query(models.BacktestRun).order_by(models.BacktestRun.created_at.desc()).all()


@router.get("/{run_id}", response_model=schemas.BacktestRunOut)
def get_backtest(run_id: int, db: Session = Depends(get_db)):
    run = db.get(models.BacktestRun, run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Backtest run not found")
    return run
