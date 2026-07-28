"""Turn the monthly panel into overlapping deployment windows."""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

from strategies import make_windows, simulate

FEATURE_COLS = ["cape", "cape_pct_expanding", "cape_pct_fullsample",
                "earnings_yield", "rf_ann_real", "spread", "vol_trailing"]


@dataclass
class WindowSet:
    starts: pd.PeriodIndex
    eq: np.ndarray                 # (W, H) gross REAL equity total return
    rf: np.ndarray                 # (W, H) gross REAL risk-free return
    cape_pct_path: np.ndarray      # (W, H) expanding CAPE percentile along path
    features: pd.DataFrame         # start-month conditioning variables
    horizon: int

    def __len__(self) -> int:
        return len(self.starts)


def build_windows(panel: pd.DataFrame, horizon: int,
                  start: str | None = None, end: str | None = None,
                  require_cape_pct: bool = True) -> WindowSet:
    df = panel.loc[panel["has_french_rf"]].copy()
    if start:
        df = df.loc[start:]
    if end:
        df = df.loc[:end]
    df = df.dropna(subset=["eq_tr_real", "rf_real"])

    eq = make_windows((1 + df["eq_tr_real"]).to_numpy(), horizon)
    rf = make_windows((1 + df["rf_real"]).to_numpy(), horizon)
    cape_path = make_windows(df["cape_pct_expanding"].to_numpy(), horizon)
    n_win = len(eq)
    starts = df.index[:n_win]

    feats = df[FEATURE_COLS].iloc[:n_win].copy()
    feats.index = starts

    ws = WindowSet(starts=starts, eq=eq, rf=rf, cape_pct_path=cape_path,
                   features=feats, horizon=horizon)
    if require_cape_pct:
        keep = feats["cape_pct_expanding"].notna().to_numpy()
        ws = subset(ws, keep)
    return ws


def subset(ws: WindowSet, mask: np.ndarray) -> WindowSet:
    mask = np.asarray(mask, dtype=bool)
    return WindowSet(starts=ws.starts[mask], eq=ws.eq[mask], rf=ws.rf[mask],
                     cape_pct_path=ws.cape_pct_path[mask],
                     features=ws.features.loc[ws.starts[mask]],
                     horizon=ws.horizon)


def wealth_grid(ws: WindowSet, n_grid: list) -> pd.DataFrame:
    """Terminal real wealth per 1.0 invested, one column per schedule N."""
    data = {n: simulate(ws.eq, ws.rf, n) for n in n_grid}
    return pd.DataFrame(data, index=ws.starts)


def wealth_accelerated(ws: WindowSet, n_grid: list, triggers: list) -> pd.DataFrame:
    return pd.DataFrame({n: simulate(ws.eq, ws.rf, n, triggers=triggers)
                         for n in n_grid}, index=ws.starts)


def wealth_valuation_wait(ws: WindowSet, thresholds: list,
                          max_wait: int) -> pd.DataFrame:
    """S3: hold cash until the expanding-window CAPE percentile drops below X."""
    out = {}
    for x in thresholds:
        signal = ws.cape_pct_path < x
        out[x] = simulate(ws.eq, ws.rf, 0, deploy_signal=signal, max_wait=max_wait)
    return pd.DataFrame(out, index=ws.starts)


def wealth_value_averaging(ws: WindowSet, n_grid: list) -> pd.DataFrame:
    return pd.DataFrame({n: simulate(ws.eq, ws.rf, n, value_averaging=True)
                         for n in n_grid if n > 0}, index=ws.starts)
