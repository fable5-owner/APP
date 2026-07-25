"""Construct the monthly analysis panel and cache it to parquet.

Conventions fixed here and relied on everywhere downstream:

* Equity leg is a **total return** series (dividends reinvested).  Price
  indices are never used for return calculation.
* Cash leg is the Fama-French one-month T-bill return ``RF``.
* Everything is converted to **real** terms with the Shiller CPI.
* CAPE percentiles are computed on an **expanding** window.  The full-sample
  version is also stored, but only so the look-ahead bias can be measured.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from config import INTERIM
from data_io import (describe, load_fred, load_french_factors, load_jst,
                     load_shiller)

MIN_HISTORY_MONTHS = 240   # 20y of history before a CAPE percentile is trusted
INFLATION_LOOKBACK = 120   # trailing window for the expected-inflation proxy


def _expanding_percentile(x: pd.Series, min_periods: int) -> pd.Series:
    """Percentile of x[t] within x[:t] — uses only information available at t."""
    vals = x.to_numpy(dtype=float)
    out = np.full(len(vals), np.nan)
    for t in range(len(vals)):
        if np.isnan(vals[t]):
            continue
        hist = vals[: t + 1]
        hist = hist[~np.isnan(hist)]
        if len(hist) < min_periods:
            continue
        out[t] = (hist <= vals[t]).mean()
    return pd.Series(out, index=x.index)


def build_panel() -> pd.DataFrame:
    shiller = load_shiller()
    french = load_french_factors()

    panel = pd.DataFrame(index=shiller.index)
    panel["cpi"] = shiller["cpi"]
    panel["cape"] = shiller["cape"]
    panel["price"] = shiller["price"]
    panel["real_earnings"] = shiller["real_earnings"]
    panel["gs10"] = shiller["gs10"] / 100.0
    panel["bond_tr_nominal"] = shiller["bond_tr_nominal"] - 1.0

    # --- equity total return, nominal ------------------------------------
    # Primary source is Fama-French (Mkt-RF + RF), which is the series the
    # cash leg is consistent with.  Shiller's real total return price is kept
    # as an independent cross-check and as the pre-1926 extension.
    fr = french.reindex(panel.index)
    panel["eq_tr_nominal"] = fr["Mkt-RF"] + fr["RF"]
    panel["rf_nominal"] = fr["RF"]

    shiller_real_tr = shiller["real_tr_price"].pct_change()
    panel["eq_tr_real_shiller"] = shiller_real_tr

    # --- inflation and real conversion -----------------------------------
    panel["inflation"] = panel["cpi"].pct_change()
    panel["eq_tr_real"] = (1 + panel["eq_tr_nominal"]) / (1 + panel["inflation"]) - 1
    panel["rf_real"] = (1 + panel["rf_nominal"]) / (1 + panel["inflation"]) - 1
    panel["bond_tr_real"] = (1 + panel["bond_tr_nominal"]) / (1 + panel["inflation"]) - 1

    # Pre-1926 extension: Shiller real total return, with NO usable bill rate.
    panel["has_french_rf"] = panel["rf_nominal"].notna()
    panel["eq_tr_real_ext"] = panel["eq_tr_real"].fillna(panel["eq_tr_real_shiller"])

    # --- valuation and the competing regressor ---------------------------
    panel["cape_pct_expanding"] = _expanding_percentile(panel["cape"], MIN_HISTORY_MONTHS)
    # Full-sample percentile: look-ahead contaminated, kept only to size the bias.
    panel["cape_pct_fullsample"] = panel["cape"].rank(pct=True)

    panel["earnings_yield"] = 1.0 / panel["cape"]

    infl_ann = (1 + panel["inflation"]).rolling(INFLATION_LOOKBACK).apply(
        lambda w: np.prod(w) ** (12 / INFLATION_LOOKBACK) - 1, raw=True)
    panel["inflation_expected"] = infl_ann
    rf_ann_nominal = (1 + panel["rf_nominal"]) ** 12 - 1
    panel["rf_ann_nominal"] = rf_ann_nominal
    panel["rf_ann_real"] = (1 + rf_ann_nominal) / (1 + infl_ann) - 1

    # The central competing regressor: equity risk premium over cash.
    panel["spread"] = panel["earnings_yield"] - panel["rf_ann_real"]

    # Trailing realised volatility of real equity returns (annualised).
    panel["vol_trailing"] = panel["eq_tr_real"].rolling(36).std() * np.sqrt(12)

    return panel


def build_japan_annual() -> pd.DataFrame:
    """Annual Japanese real equity/bill series from JST, plus a CAPD valuation
    ratio (cyclically adjusted price / dividend) used in place of CAPE, which
    JST does not carry."""
    jst = load_jst()
    jp = jst[jst["country"] == "Japan"].set_index("year").sort_index()

    out = pd.DataFrame(index=jp.index)
    out["eq_tr_nominal"] = jp["eq_tr"]
    out["bill_rate"] = jp["bill_rate"]
    out["cpi"] = jp["cpi"]
    out["eq_capgain"] = jp["eq_capgain"]
    out["eq_dp"] = jp["eq_dp"]

    out["inflation"] = out["cpi"].pct_change()
    out["eq_tr_real"] = (1 + out["eq_tr_nominal"]) / (1 + out["inflation"]) - 1
    out["rf_real"] = (1 + out["bill_rate"]) / (1 + out["inflation"]) - 1

    # Real price index from capital gains, then real dividends via D = P * (D/P).
    price = (1 + out["eq_capgain"].fillna(0)).cumprod()
    out["real_price"] = price / out["cpi"] * out["cpi"].iloc[0]
    out["real_dividend"] = out["real_price"] * out["eq_dp"]
    smoothed_div = out["real_dividend"].rolling(10).mean()
    out["capd"] = out["real_price"] / smoothed_div
    return out


def build_usa_annual_jst() -> pd.DataFrame:
    """Same construction for the USA, so the Japanese CAPD proxy can be
    validated against Shiller's CAPE on a market where both exist."""
    jst = load_jst()
    us = jst[jst["country"] == "USA"].set_index("year").sort_index()
    out = pd.DataFrame(index=us.index)
    out["inflation"] = us["cpi"].pct_change()
    out["eq_tr_real"] = (1 + us["eq_tr"]) / (1 + out["inflation"]) - 1
    out["rf_real"] = (1 + us["bill_rate"]) / (1 + out["inflation"]) - 1
    price = (1 + us["eq_capgain"].fillna(0)).cumprod()
    out["real_price"] = price / us["cpi"] * us["cpi"].iloc[0]
    out["real_dividend"] = out["real_price"] * us["eq_dp"]
    out["capd"] = out["real_price"] / out["real_dividend"].rolling(10).mean()
    return out


def main() -> None:
    print("=" * 78)
    print("STEP 1 — DATA ACQUISITION AND VALIDATION")
    print("=" * 78)

    shiller = load_shiller()
    french = load_french_factors()
    tb3ms = load_fred("TB3MS")
    dtb3 = load_fred("DTB3")
    dexkous = load_fred("DEXKOUS")
    jst = load_jst()

    reports = [
        describe("Shiller ie_data (monthly)", shiller),
        describe("Ken French factors (monthly)", french),
        describe("FRED TB3MS", tb3ms),
        describe("FRED DTB3", dtb3),
        describe("FRED DEXKOUS", dexkous),
        describe("JST Macrohistory (annual, 18 countries)",
                 jst.set_index(["country", "year"])[["eq_tr", "bill_rate", "cpi"]]),
    ]
    table = pd.DataFrame([r.as_row() for r in reports],
                         columns=["source", "rows", "start", "end", "missing"])
    print(table.to_string(index=False))

    panel = build_panel()
    panel.to_parquet(INTERIM / "panel_monthly.parquet")
    japan = build_japan_annual()
    japan.to_parquet(INTERIM / "japan_annual.parquet")
    usa_annual = build_usa_annual_jst()
    usa_annual.to_parquet(INTERIM / "usa_annual_jst.parquet")

    print(f"\npanel_monthly: {len(panel)} rows, {panel.index.min()} .. {panel.index.max()}")
    core = panel[panel["has_french_rf"]]
    print(f"  with French RF: {len(core)} rows, {core.index.min()} .. {core.index.max()}")
    print(f"  CAPE available: {int(panel['cape'].notna().sum())} rows, "
          f"first {panel['cape'].first_valid_index()}")
    print(f"japan_annual: {len(japan)} rows, {japan.index.min()} .. {japan.index.max()}, "
          f"real TR non-null {int(japan['eq_tr_real'].notna().sum())}")


if __name__ == "__main__":
    main()
