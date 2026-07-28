"""Sample-size accounting, risk-adjusted metrics and regret."""
from __future__ import annotations

import numpy as np
import pandas as pd


# --------------------------------------------------------------------------
# Effective sample size under overlapping windows
# --------------------------------------------------------------------------
def contiguous_runs(mask: np.ndarray) -> list:
    """Start/stop index pairs for each contiguous True run."""
    runs, start = [], None
    for i, v in enumerate(mask):
        if v and start is None:
            start = i
        elif not v and start is not None:
            runs.append((start, i))
            start = None
    if start is not None:
        runs.append((start, len(mask)))
    return runs


def _merged_coverage(mask: np.ndarray, horizon: int) -> list:
    """Merge the [start, start+H-1] spans of the selected windows.

    Two start months three months apart produce windows that share 117 of their
    120 months.  Counting them as two spans would double-count almost all of
    the underlying data, so overlapping spans are merged first.
    """
    idx = np.flatnonzero(np.asarray(mask, dtype=bool))
    if idx.size == 0:
        return []
    merged = []
    lo, hi = idx[0], idx[0] + horizon - 1
    for i in idx[1:]:
        if i <= hi + 1:
            hi = max(hi, i + horizon - 1)
        else:
            merged.append((lo, hi))
            lo, hi = i, i + horizon - 1
    merged.append((lo, hi))
    return merged


def effective_n(mask: np.ndarray, horizon: int) -> float:
    """Independent-window equivalent of a set of overlapping start months.

    Overlapping H-month windows share most of their data, so the count of
    observations wildly overstates the information content.  The number of
    DISTINCT calendar months the selected windows touch, divided by H, is the
    number of non-overlapping windows that would span the same data.
    """
    merged = _merged_coverage(mask, horizon)
    if not merged:
        return 0.0
    return sum(hi - lo + 1 for lo, hi in merged) / horizon


def n_episodes(mask: np.ndarray, horizon: int | None = None) -> int:
    """Distinct episodes.  With a horizon given, runs whose windows overlap are
    treated as one episode rather than as separate observations."""
    if horizon is None:
        return len(contiguous_runs(np.asarray(mask, dtype=bool)))
    return len(_merged_coverage(mask, horizon))


# --------------------------------------------------------------------------
# Risk-adjusted comparison
# --------------------------------------------------------------------------
def crra_certainty_equivalent(wealth: np.ndarray, gamma: float) -> float:
    """Certainty-equivalent terminal wealth under CRRA utility."""
    w = np.asarray(wealth, dtype=float)
    w = w[np.isfinite(w) & (w > 0)]
    if len(w) == 0:
        return np.nan
    if abs(gamma - 1.0) < 1e-9:
        return float(np.exp(np.mean(np.log(w))))
    u = (w ** (1 - gamma) - 1) / (1 - gamma)
    return float((np.mean(u) * (1 - gamma) + 1) ** (1 / (1 - gamma)))


def annualise(wealth_ratio: np.ndarray, horizon: int) -> np.ndarray:
    return np.asarray(wealth_ratio, dtype=float) ** (12.0 / horizon) - 1.0


# --------------------------------------------------------------------------
# Regret
# --------------------------------------------------------------------------
def regret_matrix(wealth: pd.DataFrame) -> pd.DataFrame:
    """Per-window shortfall against the best schedule for that window.

    `wealth` is indexed by start month with one column per candidate N.
    """
    best = wealth.max(axis=1)
    return wealth.apply(lambda col: best - col)


def regret_summary(wealth: pd.DataFrame, horizon: int) -> pd.DataFrame:
    """Max / mean / 95th-percentile regret per schedule, in annualised terms."""
    reg = regret_matrix(wealth)
    # Express regret as a shortfall in annualised real return, which is
    # comparable across windows of different absolute wealth levels.
    best = wealth.max(axis=1)
    rel = reg.div(best, axis=0)
    ann = pd.DataFrame(
        {c: annualise((1 - rel[c]).to_numpy(), horizon) * -1 for c in rel.columns},
        index=rel.index)
    out = pd.DataFrame({
        "max regret (%p ann.)": ann.max() * 100,
        "mean regret (%p ann.)": ann.mean() * 100,
        "p95 regret (%p ann.)": ann.quantile(0.95) * 100,
        "times best": (reg == 0).sum(),
    })
    out.index.name = "N"
    return out
