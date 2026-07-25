"""Stationary bootstrap (Politis & Romano 1994).

Monthly equity returns are autocorrelated and, more importantly, valuation
states are extremely persistent: CAPE stays in its top decile for years at a
time.  An iid bootstrap destroys that persistence and produces confidence
intervals that are far too narrow.  Blocks of geometrically distributed length
preserve it.
"""
from __future__ import annotations

import numpy as np


def stationary_bootstrap_indices(n_obs: int, mean_block: float,
                                 rng: np.random.Generator) -> np.ndarray:
    """One resampled index path of length n_obs, wrapping at the end.

    Block lengths are geometric with mean `mean_block`, so the resampled series
    is stationary — unlike a fixed-block bootstrap, which is not.
    """
    p = 1.0 / mean_block
    new_block = rng.random(n_obs) < p
    new_block[0] = True

    block_id = np.cumsum(new_block) - 1
    positions = np.arange(n_obs)
    block_start_pos = positions[new_block]
    offset = positions - block_start_pos[block_id]

    block_origin = rng.integers(0, n_obs, size=block_start_pos.shape[0])
    return (block_origin[block_id] + offset) % n_obs


def bootstrap_distribution(n_obs: int, mean_block: float, draws: int,
                           statistic, rng: np.random.Generator,
                           progress_every: int = 0) -> np.ndarray:
    """Apply `statistic(idx)` to `draws` resampled index paths."""
    out = []
    for d in range(draws):
        idx = stationary_bootstrap_indices(n_obs, mean_block, rng)
        out.append(statistic(idx))
        if progress_every and (d + 1) % progress_every == 0:
            print(f"    bootstrap {d + 1}/{draws}", flush=True)
    return np.asarray(out, dtype=float)


def percentile_ci(samples: np.ndarray, alpha: float = 0.05) -> tuple:
    finite = samples[np.isfinite(samples)]
    if finite.size == 0:
        return (np.nan, np.nan)
    lo, hi = np.percentile(finite, [100 * alpha / 2, 100 * (1 - alpha / 2)], axis=0)
    return float(lo), float(hi)


def ci_string(point: float, lo: float, hi: float, scale: float = 100.0,
              unit: str = "%p") -> str:
    return f"{point*scale:+.2f} [{lo*scale:+.2f}, {hi*scale:+.2f}]{unit}"


def straddles_zero(lo: float, hi: float) -> bool:
    return not np.isfinite(lo) or not np.isfinite(hi) or (lo <= 0.0 <= hi)
