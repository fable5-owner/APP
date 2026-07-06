from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_db
from ..strategy_engine import validate_strategy

router = APIRouter(prefix="/api/strategies", tags=["strategies"])


@router.get("", response_model=list[schemas.StrategyOut])
def list_strategies(db: Session = Depends(get_db)):
    return db.query(models.Strategy).order_by(models.Strategy.created_at.desc()).all()


@router.post("", response_model=schemas.StrategyOut)
def create_strategy(payload: schemas.StrategyCreate, db: Session = Depends(get_db)):
    try:
        validate_strategy(payload.rules)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    strategy = models.Strategy(name=payload.name, rules=payload.rules)
    db.add(strategy)
    db.commit()
    db.refresh(strategy)
    return strategy


@router.get("/{strategy_id}", response_model=schemas.StrategyOut)
def get_strategy(strategy_id: int, db: Session = Depends(get_db)):
    strategy = db.get(models.Strategy, strategy_id)
    if strategy is None:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return strategy


@router.delete("/{strategy_id}", status_code=204)
def delete_strategy(strategy_id: int, db: Session = Depends(get_db)):
    strategy = db.get(models.Strategy, strategy_id)
    if strategy is None:
        raise HTTPException(status_code=404, detail="Strategy not found")
    db.delete(strategy)
    db.commit()
