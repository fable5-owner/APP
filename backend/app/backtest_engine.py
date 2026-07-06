"""Simple long-only, single-position backtest simulator.

Given a DataFrame with ``close``, ``buy_signal`` and ``sell_signal`` columns
(as produced by ``strategy_engine.evaluate_strategy``), simulates entering a
full-capital long position on a buy signal and exiting on a sell signal.
Signals are acted on at the *next* bar's close to avoid look-ahead bias.
"""

import math

import numpy as np
import pandas as pd


def run_backtest(df: pd.DataFrame, initial_capital: float = 10_000_000.0) -> dict:
    df = df.reset_index(drop=False)
    date_col = df.columns[0]

    cash = initial_capital
    shares = 0.0
    in_position = False
    entry_price = None

    equity_curve = []
    trades = []
    pending_action = None  # 'buy' | 'sell' queued from previous bar's signal

    for i in range(len(df)):
        row = df.iloc[i]
        price = float(row["close"])

        if pending_action == "buy" and not in_position:
            shares = cash / price
            cash = 0.0
            in_position = True
            entry_price = price
            entry_date = row[date_col]
        elif pending_action == "sell" and in_position:
            cash = shares * price
            pnl_pct = (price - entry_price) / entry_price * 100
            trades.append(
                {
                    "entry_date": str(entry_date),
                    "exit_date": str(row[date_col]),
                    "entry_price": entry_price,
                    "exit_price": price,
                    "return_pct": pnl_pct,
                }
            )
            shares = 0.0
            in_position = False
            entry_price = None

        pending_action = None
        if bool(row.get("buy_signal", False)) and not in_position:
            pending_action = "buy"
        elif bool(row.get("sell_signal", False)) and in_position:
            pending_action = "sell"

        equity = cash + shares * price
        equity_curve.append({"date": str(row[date_col]), "equity": equity})

    # Close out any open position at the last available price for reporting.
    if in_position:
        last_price = float(df.iloc[-1]["close"])
        cash = shares * last_price
        pnl_pct = (last_price - entry_price) / entry_price * 100
        trades.append(
            {
                "entry_date": str(entry_date),
                "exit_date": str(df.iloc[-1][date_col]),
                "entry_price": entry_price,
                "exit_price": last_price,
                "return_pct": pnl_pct,
                "open_at_end": True,
            }
        )

    final_equity = equity_curve[-1]["equity"] if equity_curve else initial_capital
    metrics = _compute_metrics(equity_curve, trades, initial_capital, final_equity)

    return {
        "equity_curve": equity_curve,
        "trades": trades,
        "metrics": metrics,
    }


def _compute_metrics(equity_curve: list, trades: list, initial_capital: float, final_equity: float) -> dict:
    total_return_pct = (final_equity / initial_capital - 1) * 100 if initial_capital else 0.0

    n_days = len(equity_curve)
    years = n_days / 252 if n_days else 0
    if years > 0 and final_equity > 0 and initial_capital > 0:
        cagr_pct = ((final_equity / initial_capital) ** (1 / years) - 1) * 100
    else:
        cagr_pct = 0.0

    equities = np.array([p["equity"] for p in equity_curve], dtype=float)
    if len(equities) > 1:
        running_max = np.maximum.accumulate(equities)
        drawdowns = (equities - running_max) / running_max
        max_drawdown_pct = float(drawdowns.min()) * 100
    else:
        max_drawdown_pct = 0.0

    if len(equities) > 1:
        daily_returns = np.diff(equities) / equities[:-1]
        std = daily_returns.std()
        sharpe = float((daily_returns.mean() / std) * math.sqrt(252)) if std > 0 else 0.0
    else:
        sharpe = 0.0

    wins = [t for t in trades if t["return_pct"] > 0]
    win_rate_pct = (len(wins) / len(trades) * 100) if trades else 0.0

    return {
        "total_return_pct": round(total_return_pct, 2),
        "cagr_pct": round(cagr_pct, 2),
        "max_drawdown_pct": round(max_drawdown_pct, 2),
        "sharpe_ratio": round(sharpe, 2),
        "win_rate_pct": round(win_rate_pct, 2),
        "num_trades": len(trades),
        "final_equity": round(final_equity, 2),
    }
