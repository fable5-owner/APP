"""Deployment strategies S0-S4, vectorised across windows.

Timing convention (identical for every strategy, and free of look-ahead):

    for each month t in the window:
        1. observe the index level through the END of month t-1
        2. decide how much cash to move into equity
        3. apply month t's equity return to the equity sleeve and month t's
           risk-free return to the remaining cash sleeve

So a drawdown trigger can only react to information the investor actually
had.  The uninvested balance ALWAYS earns the risk-free rate; there is no
code path in which it earns zero.
"""
from __future__ import annotations

import numpy as np


def make_windows(values: np.ndarray, horizon: int) -> np.ndarray:
    """Sliding (n_windows, horizon) matrix of consecutive observations."""
    n = len(values) - horizon + 1
    if n <= 0:
        return np.empty((0, horizon))
    return np.lib.stride_tricks.sliding_window_view(values, horizon)[:n].copy()


def simulate(eq_gross: np.ndarray,
             rf_gross: np.ndarray,
             n: int,
             triggers: list | None = None,
             deploy_signal: np.ndarray | None = None,
             max_wait: int | None = None,
             value_averaging: bool = False) -> np.ndarray:
    """Terminal wealth per 1.0 of initial principal.

    n                 months over which the principal is deployed (0 = lump sum)
    triggers          [(drawdown, fraction_of_remaining_cash), ...] for S2
    deploy_signal     (W, H) bool; for S3, True where valuation permits entry
    max_wait          for S3, force full deployment after this many months
    value_averaging   for S4, track a linear target value path instead
    """
    n_win, horizon = eq_gross.shape
    cash = np.ones(n_win)
    equity = np.zeros(n_win)

    index = np.ones(n_win)   # equity index level, observed through t-1
    peak = np.ones(n_win)
    n_trig = len(triggers) if triggers else 0
    fired = np.zeros((n_win, n_trig), dtype=bool)

    installment = 1.0 / n if n > 0 else 1.0

    for t in range(horizon):
        # ---- 1. baseline schedule ---------------------------------------
        if deploy_signal is not None:
            forced = (max_wait is not None and t >= max_wait)
            allowed = deploy_signal[:, t] | forced
            deploy = np.where(allowed, cash, 0.0)
        elif value_averaging:
            frac = min((t + 1) / n, 1.0) if n > 0 else 1.0
            target = frac * 1.0
            gap = target - equity
            # No leverage and no shorting: buy at most the cash on hand,
            # sell at most the equity held.
            deploy = np.clip(gap, -equity, cash)
        elif n == 0:
            deploy = cash if t == 0 else np.zeros(n_win)
        elif t < n - 1:
            deploy = np.minimum(installment, cash)
        elif t == n - 1:
            deploy = cash.copy()          # sweep in the accrued interest too
        else:
            deploy = np.zeros(n_win)

        # ---- 2. drawdown acceleration (S2) ------------------------------
        if n_trig:
            drawdown = index / peak - 1.0
            for j, (level, frac_remaining) in enumerate(triggers):
                hit = (drawdown <= level) & ~fired[:, j]
                residual = np.maximum(cash - deploy, 0.0)
                deploy = deploy + np.where(hit, residual * frac_remaining, 0.0)
                fired[:, j] |= drawdown <= level

        deploy = np.clip(deploy, -equity, cash)
        equity = equity + deploy
        cash = cash - deploy

        # ---- 3. one month of returns ------------------------------------
        equity = equity * eq_gross[:, t]
        cash = cash * rf_gross[:, t]
        index = index * eq_gross[:, t]
        peak = np.maximum(peak, index)

    return equity + cash


def strategy_terminal_wealth(eq_gross, rf_gross, spec: dict) -> np.ndarray:
    """Dispatch on a strategy spec dict."""
    kind = spec["kind"]
    if kind == "lump":
        return simulate(eq_gross, rf_gross, 0)
    if kind == "dca":
        return simulate(eq_gross, rf_gross, spec["n"])
    if kind == "dca_accel":
        return simulate(eq_gross, rf_gross, spec["n"], triggers=spec["triggers"])
    if kind == "valuation_wait":
        return simulate(eq_gross, rf_gross, 0,
                        deploy_signal=spec["signal"], max_wait=spec.get("max_wait"))
    if kind == "value_averaging":
        return simulate(eq_gross, rf_gross, spec["n"], value_averaging=True)
    raise ValueError(f"unknown strategy kind {kind!r}")
