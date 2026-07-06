from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..data_sources import MARKETS
from ..db import get_db

router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])


@router.get("", response_model=list[schemas.WatchlistItemOut])
def list_watchlist(db: Session = Depends(get_db)):
    return db.query(models.WatchlistItem).order_by(models.WatchlistItem.created_at.desc()).all()


@router.post("", response_model=schemas.WatchlistItemOut)
def add_watchlist_item(payload: schemas.WatchlistItemCreate, db: Session = Depends(get_db)):
    if payload.market not in MARKETS:
        raise HTTPException(status_code=400, detail=f"Invalid market. Must be one of {sorted(MARKETS)}")
    if payload.strategy_id is not None and db.get(models.Strategy, payload.strategy_id) is None:
        raise HTTPException(status_code=400, detail="strategy_id does not exist")

    item = models.WatchlistItem(
        market=payload.market,
        symbol=payload.symbol,
        display_name=payload.display_name,
        strategy_id=payload.strategy_id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete_watchlist_item(item_id: int, db: Session = Depends(get_db)):
    item = db.get(models.WatchlistItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    db.delete(item)
    db.commit()
