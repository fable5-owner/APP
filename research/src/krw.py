"""Step 5 — the Korean-won investor overlay.

Three things change once the investor is Korean and the sum is 100억원:

* returns are earned in USD but consumed in KRW, so USDKRW rides on top;
* realised equity gains are taxed at 22% with a 2.5m KRW annual exemption,
  and unrealised gains are not taxed at all;
* interest on the parked cash is financial income, which at this size falls
  under 금융소득종합과세 and can be taxed far more heavily than 22%.

The last point is the one that actually moves the answer, and it moves it
against spreading the purchase.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from config import (KRW_PRINCIPAL, KRW_TAX_DEDUCTION, KRW_TAX_RATE, N_GRID)
from data_io import load_fred

# Marginal rate on interest income. 15.4% is the standard withholding rate;
# a 100억원 portfolio throws off enough interest to fall into
# 금융소득종합과세, where the top combined rate reaches ~49.5%.
INTEREST_TAX_RATES = {"withholding 15.4%": 0.154, "top bracket 49.5%": 0.495}


def build_krw_panel(panel: pd.DataFrame) -> pd.DataFrame:
    """Monthly USD returns plus USDKRW, Korean CPI and a KRW cash rate."""
    fx = load_fred("DEXKOUS")
    fx = fx.resample("ME").last()
    fx.index = pd.PeriodIndex(fx.index, freq="M")

    kcpi = load_fred("KORCPIALLMINMEI")
    kcpi.index = pd.PeriodIndex(kcpi.index, freq="M")

    krate = load_fred("INTDSRKRM193N")
    krate.index = pd.PeriodIndex(krate.index, freq="M")

    out = pd.DataFrame({
        "eq_usd": panel["eq_tr_nominal"],
        "rf_usd": panel["rf_nominal"],
        "fx": fx,
        "kcpi": kcpi,
        "krw_rate": krate / 100.0 / 12.0,
    }).dropna(subset=["eq_usd", "rf_usd", "fx", "kcpi", "krw_rate"])

    out["fx_ret"] = out["fx"].pct_change()
    out["k_inflation"] = out["kcpi"].pct_change()
    return out.dropna()


def simulate_krw(krw: pd.DataFrame, n: int, horizon: int,
                 cash_currency: str = "USD",
                 interest_tax: float = 0.0) -> pd.DataFrame:
    """Per start month: pre-tax and post-tax terminal KRW wealth and basis.

    Deployment follows the same schedule as everywhere else.  Cost basis is
    accumulated in KRW at the exchange rate prevailing on each purchase date,
    which is where a spread purchase disperses its acquisition lots.
    """
    eq = (1 + krw["eq_usd"]).to_numpy()
    rf_usd = (1 + krw["rf_usd"]).to_numpy()
    rf_krw = (1 + krw["krw_rate"]).to_numpy()
    fx = krw["fx"].to_numpy()
    idx = krw.index

    n_win = len(krw) - horizon + 1
    if n_win <= 0:
        return pd.DataFrame()

    rows = []
    for w in range(n_win):
        sl = slice(w, w + horizon)
        eq_w, fx_w = eq[sl], fx[sl]
        rf_w = rf_usd[sl] if cash_currency == "USD" else rf_krw[sl]

        principal_krw = KRW_PRINCIPAL
        if cash_currency == "USD":
            cash = principal_krw / fx_w[0]        # converted up front, in USD
        else:
            cash = principal_krw                  # stays in KRW
        equity_usd = 0.0
        basis_krw = 0.0
        interest_tax_paid = 0.0

        installment = 1.0 / n if n > 0 else 1.0
        initial_cash = cash

        for t in range(horizon):
            if n == 0:
                deploy = cash if t == 0 else 0.0
            elif t < n - 1:
                deploy = min(installment * initial_cash, cash)
            elif t == n - 1:
                deploy = cash
            else:
                deploy = 0.0

            if deploy > 0:
                if cash_currency == "USD":
                    basis_krw += deploy * fx_w[t]
                    equity_usd += deploy
                else:
                    basis_krw += deploy
                    equity_usd += deploy / fx_w[t]
                cash -= deploy

            equity_usd *= eq_w[t]
            interest = cash * (rf_w[t] - 1.0)
            interest_tax_paid += max(interest, 0.0) * interest_tax * (
                fx_w[t] if cash_currency == "USD" else 1.0)
            cash = cash + interest

        terminal_krw = equity_usd * fx_w[horizon - 1]
        if cash_currency == "USD":
            terminal_krw += cash * fx_w[horizon - 1]
        else:
            terminal_krw += cash

        gain = terminal_krw - basis_krw
        cgt = max(0.0, gain - KRW_TAX_DEDUCTION) * KRW_TAX_RATE
        rows.append({
            "start": idx[w],
            "pre_tax_krw": terminal_krw,
            "basis_krw": basis_krw,
            "cgt": cgt,
            "interest_tax": interest_tax_paid,
            "post_tax_krw": terminal_krw - cgt - interest_tax_paid,
        })
    return pd.DataFrame(rows).set_index("start")


def krw_table(krw: pd.DataFrame, horizon: int = 120,
              n_grid: list = N_GRID, cash_currency: str = "USD",
              interest_tax: float = 0.0,
              real: bool = True) -> pd.DataFrame:
    """Advantage over lump sum, pre-tax and post-tax, in KRW."""
    results = {n: simulate_krw(krw, n, horizon, cash_currency, interest_tax)
               for n in n_grid}
    base = results[0]
    if base.empty:
        return pd.DataFrame()

    deflator = 1.0
    if real:
        kcpi = krw["kcpi"]
        end_cpi = kcpi.shift(-(horizon - 1)).reindex(base.index)
        deflator = (end_cpi / kcpi.reindex(base.index)).to_numpy()

    rows = []
    for n in n_grid:
        r = results[n]
        pre = (r["pre_tax_krw"] / base["pre_tax_krw"] - 1) * 100
        post = (r["post_tax_krw"] / base["post_tax_krw"] - 1) * 100
        rows.append({
            "N": n,
            "pre-tax adv (%p)": float(pre.mean()),
            "post-tax adv (%p)": float(post.mean()),
            "tax damping": (float(post.mean()) / float(pre.mean())
                            if abs(pre.mean()) > 1e-9 else np.nan),
            "mean CGT (억원)": float(r["cgt"].mean()) / 1e8,
            "mean interest tax (억원)": float(r["interest_tax"].mean()) / 1e8,
            "mean basis (억원)": float(r["basis_krw"].mean()) / 1e8,
            "P(beat lump, post-tax)": float((post > 0).mean()),
        })
    out = pd.DataFrame(rows).set_index("N")
    out.attrs["n_windows"] = len(base)
    out.attrs["span"] = f"{base.index.min()}..{base.index.max()}"
    out.attrs["deflator_note"] = "real" if real else "nominal"
    return out


def lot_dispersion_check(krw: pd.DataFrame, horizon: int = 120) -> pd.DataFrame:
    """Does spreading the purchase actually disperse the tax basis?

    With a single terminal liquidation the total basis is the total amount
    invested regardless of how many lots it arrived in, so the schedule moves
    the basis only through the exchange rate at each purchase.
    """
    rows = []
    for n in [0, 12, 36]:
        r = simulate_krw(krw, n, horizon)
        rows.append({
            "N": n,
            "mean basis (억원)": float(r["basis_krw"].mean()) / 1e8,
            "sd of basis (억원)": float(r["basis_krw"].std()) / 1e8,
            "mean gain (억원)": float((r["pre_tax_krw"] - r["basis_krw"]).mean()) / 1e8,
            "mean CGT (억원)": float(r["cgt"].mean()) / 1e8,
            "effective tax rate on gain":
                float(r["cgt"].sum() / (r["pre_tax_krw"] - r["basis_krw"]).sum()),
        })
    return pd.DataFrame(rows).set_index("N")
