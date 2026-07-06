from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .db import Base, engine
from .routers import backtest, data, signals, strategies, watchlist

Base.metadata.create_all(bind=engine)

app = FastAPI(title="My Invest App", description="Personal investing dashboard: data, strategies, backtests, daily signals")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data.router)
app.include_router(strategies.router)
app.include_router(watchlist.router)
app.include_router(backtest.router)
app.include_router(signals.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
