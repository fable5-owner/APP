"""The deployment advantage, computed on the only data that determines it.

Once the last instalment is invested, every schedule holds exactly the same
100%-equity portfolio, so the ratio of terminal wealth between two schedules
stops changing.  This is verified to machine precision in `run_all.py`.

Two things follow, and both matter:

* The answer to "how many months" does not depend on the holding horizon.
* The advantage for schedule N is a function of N months of returns, not of H.
  Overlapping windows therefore share N months, not H, so the effective sample
  size is span/N — far larger than span/H — and start months can run right up
  to the end of the data instead of stopping H months short.  Anchoring on a
  10-year horizon would have thrown away every start month after 2016-06,
  which is precisely the high-valuation regime the question is about.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from config import N_GRID
from metrics import _merged_coverage
from strategies import make_windows, simulate
from windows import FEATURE_COLS


def _clean(panel: pd.DataFrame) -> pd.DataFrame:
    return (panel.loc[panel["has_french_rf"]]
            .dropna(subset=["eq_tr_real", "rf_real"]))


def deployment_advantage(panel: pd.DataFrame, n: int,
                         triggers: list | None = None,
                         value_averaging: bool = False) -> pd.Series:
    """DCA advantage of schedule N over an immediate lump sum, by start month."""
    df = _clean(panel)
    horizon = max(n, 1)
    eq = make_windows((1 + df["eq_tr_real"]).to_numpy(), horizon)
    rf = make_windows((1 + df["rf_real"]).to_numpy(), horizon)
    starts = df.index[: len(eq)]
    base = simulate(eq, rf, 0)
    if n == 0:
        return pd.Series(0.0, index=starts)
    w = simulate(eq, rf, n, triggers=triggers, value_averaging=value_averaging)
    return pd.Series(w / base - 1.0, index=starts)


def advantage_frame(panel: pd.DataFrame, n_grid: list = N_GRID,
                    **kwargs) -> pd.DataFrame:
    """One column per schedule, aligned on start month.

    Columns have different natural lengths (schedule N needs N months of data),
    so the frame is ragged at the right-hand edge; callers that need a balanced
    panel should dropna().
    """
    cols = {n: deployment_advantage(panel, n, **kwargs) for n in n_grid}
    return pd.DataFrame(cols)


def features_for(panel: pd.DataFrame) -> pd.DataFrame:
    df = _clean(panel)
    return df[FEATURE_COLS]


def effective_sample(mask: np.ndarray, block: int) -> float:
    """Independent-block equivalent for a statistic that depends on `block`
    consecutive months (the deployment length, not the holding horizon)."""
    merged = _merged_coverage(mask, max(block, 1))
    if not merged:
        return 0.0
    return sum(hi - lo + 1 for lo, hi in merged) / max(block, 1)


def regimes(mask: np.ndarray, gap_months: int = 60) -> int:
    """Distinct valuation regimes: runs separated by less than `gap_months` of
    non-membership are one regime, because they are the same macro episode."""
    idx = np.flatnonzero(np.asarray(mask, dtype=bool))
    if idx.size == 0:
        return 0
    return 1 + int((np.diff(idx) > gap_months).sum())


def valuation_wait_advantage(panel: pd.DataFrame, threshold: float,
                             max_wait: int) -> pd.Series:
    """S3: sit in cash until the expanding CAPE percentile drops below
    `threshold`, giving up and deploying after `max_wait` months.

    Computed on `max_wait` months of data so that it shares a sample basis
    with an N=max_wait schedule, rather than being silently evaluated on a
    shorter, differently-truncated sample.
    """
    df = _clean(panel)
    eq = make_windows((1 + df["eq_tr_real"]).to_numpy(), max_wait)
    rf = make_windows((1 + df["rf_real"]).to_numpy(), max_wait)
    cape_path = make_windows(df["cape_pct_expanding"].to_numpy(), max_wait)
    starts = df.index[: len(eq)]
    base = simulate(eq, rf, 0)
    w = simulate(eq, rf, 0, deploy_signal=cape_path < threshold, max_wait=max_wait)
    return pd.Series(w / base - 1.0, index=starts)
