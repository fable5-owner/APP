"""Step 4 — the horse race.

Conventional wisdom says a high CAPE makes spreading a purchase worthwhile.
The competing claim is that the cost of spreading is simply proportional to the
equity-minus-cash spread the uninvested money gives up, and that CAPE only
matters because it is one of the two terms in that spread.

Both regressors go in together.  If beta1 on the CAPE percentile collapses once
the spread is controlled for, the competing claim wins.
"""
from __future__ import annotations

import numpy as np
import pandas as pd
import statsmodels.api as sm

from config import HORIZON_MONTHS
from windows import build_windows, wealth_grid


def expanding_expected_return(panel: pd.DataFrame, horizon: int) -> pd.Series:
    """Fitted E[equity] from an expanding-window regression of the realised
    next-H-month real return on log earnings yield.

    Only windows that have already FINISHED by month t are used to fit, so the
    prediction at t uses nothing from the future.
    """
    df = panel.loc[panel["has_french_rf"]].dropna(subset=["eq_tr_real", "cape"])
    realised = (
        (1 + df["eq_tr_real"]).rolling(horizon).apply(np.prod, raw=True)
        .shift(-horizon + 1) ** (12 / horizon) - 1
    )
    log_ey = np.log(1.0 / df["cape"])

    out = pd.Series(np.nan, index=df.index)
    log_ey_v = log_ey.to_numpy()
    realised_v = realised.to_numpy()
    for i in range(len(df)):
        # Outcomes known at month i: windows that started at or before i-horizon.
        last = i - horizon
        if last < 60:
            continue
        x = log_ey_v[: last + 1]
        y = realised_v[: last + 1]
        ok = np.isfinite(x) & np.isfinite(y)
        if ok.sum() < 60:
            continue
        beta = np.polyfit(x[ok], y[ok], 1)
        out.iloc[i] = np.polyval(beta, log_ey_v[i])
    return out


def build_regression_frame(panel: pd.DataFrame, n: int,
                           horizon: int = HORIZON_MONTHS) -> pd.DataFrame:
    ws = build_windows(panel, horizon)
    wealth = wealth_grid(ws, [0, n])
    adv = (wealth[n] / wealth[0] - 1.0) * 100  # percentage points

    feats = ws.features.copy()
    fitted = expanding_expected_return(panel, horizon).reindex(feats.index)

    frame = pd.DataFrame({
        "dca_advantage": adv,
        "cape_pct_expanding": feats["cape_pct_expanding"] * 100,
        "spread_ey": (feats["earnings_yield"] - feats["rf_ann_real"]) * 100,
        "spread_fitted": (fitted - feats["rf_ann_real"]) * 100,
        "vol_trailing": feats["vol_trailing"] * 100,
        "rf_ann_real": feats["rf_ann_real"] * 100,
        "earnings_yield": feats["earnings_yield"] * 100,
    })
    return frame.dropna()


def _fit(frame: pd.DataFrame, regressors: list, horizon: int):
    x = sm.add_constant(frame[regressors])
    model = sm.OLS(frame["dca_advantage"], x)
    # Overlapping H-month windows induce an MA(H-1) error structure; the
    # Newey-West lag must be at least the overlap length.
    return model.fit(cov_type="HAC", cov_kwds={"maxlags": horizon, "use_correction": True})


def variance_inflation(frame: pd.DataFrame, regressors: list) -> pd.Series:
    """VIF for each regressor — CAPE and the spread are related by construction."""
    out = {}
    for r in regressors:
        others = [c for c in regressors if c != r]
        if not others:
            out[r] = 1.0
            continue
        x = sm.add_constant(frame[others])
        r2 = sm.OLS(frame[r], x).fit().rsquared
        out[r] = np.inf if r2 >= 1 - 1e-12 else 1.0 / (1.0 - r2)
    return pd.Series(out, name="VIF")


def horse_race(panel: pd.DataFrame, n: int = 12,
               horizon: int = HORIZON_MONTHS,
               spread_col: str = "spread_ey") -> dict:
    frame = build_regression_frame(panel, n, horizon)

    specs = {
        "(1) CAPE only": ["cape_pct_expanding"],
        "(2) spread only": [spread_col],
        "(3) both": ["cape_pct_expanding", spread_col],
        "(4) both + vol": ["cape_pct_expanding", spread_col, "vol_trailing"],
    }
    rows = []
    fits = {}
    for label, regs in specs.items():
        fit = _fit(frame, regs, horizon)
        fits[label] = fit
        row = {"spec": label, "n obs": int(fit.nobs),
               "effective N": round(len(frame) / horizon, 1),
               "R2": fit.rsquared}
        for r in ["cape_pct_expanding", spread_col, "vol_trailing"]:
            if r in regs:
                row[f"beta {r}"] = fit.params[r]
                row[f"t {r}"] = fit.tvalues[r]
            else:
                row[f"beta {r}"] = np.nan
                row[f"t {r}"] = np.nan
        rows.append(row)

    table = pd.DataFrame(rows).set_index("spec")
    corr = frame[["cape_pct_expanding", spread_col, "vol_trailing"]].corr()
    vif = variance_inflation(frame, ["cape_pct_expanding", spread_col, "vol_trailing"])
    return {"table": table, "corr": corr, "vif": vif, "frame": frame, "fits": fits,
            "n": n, "spread_col": spread_col}


def horse_race_report(panel: pd.DataFrame, n_values=(12, 24),
                      horizon: int = HORIZON_MONTHS) -> pd.DataFrame:
    """Compact summary across schedules and both E[equity] definitions."""
    rows = []
    for n in n_values:
        for spread_col in ("spread_ey", "spread_fitted"):
            res = horse_race(panel, n=n, horizon=horizon, spread_col=spread_col)
            t = res["table"]
            rows.append({
                "N": n,
                "E[equity] proxy": "1/CAPE" if spread_col == "spread_ey" else "expanding fit",
                "t(CAPE) alone": t.loc["(1) CAPE only", "t cape_pct_expanding"],
                "t(spread) alone": t.loc["(2) spread only", f"t {spread_col}"],
                "t(CAPE) with spread": t.loc["(3) both", "t cape_pct_expanding"],
                "t(spread) with CAPE": t.loc["(3) both", f"t {spread_col}"],
                "beta(CAPE) alone": t.loc["(1) CAPE only", "beta cape_pct_expanding"],
                "beta(CAPE) with spread": t.loc["(3) both", "beta cape_pct_expanding"],
                "R2 CAPE only": t.loc["(1) CAPE only", "R2"],
                "R2 spread only": t.loc["(2) spread only", "R2"],
                "R2 both": t.loc["(3) both", "R2"],
                "corr(CAPE,spread)": res["corr"].loc["cape_pct_expanding", spread_col],
                "effective N": t.loc["(1) CAPE only", "effective N"],
            })
    return pd.DataFrame(rows)


def current_state(panel: pd.DataFrame) -> dict:
    """Where the market sits today, on both competing yardsticks."""
    cape_row = panel.dropna(subset=["cape"]).iloc[-1]
    as_of = panel.dropna(subset=["cape"]).index[-1]
    infl = float(panel["inflation_expected"].dropna().iloc[-1])
    ey = float(cape_row["earnings_yield"])
    from config import CURRENT_RF_ANNUAL
    rf_real = (1 + CURRENT_RF_ANNUAL) / (1 + infl) - 1
    spread = ey - rf_real
    hist = panel["spread"].dropna()
    return {
        "as_of": str(as_of),
        "cape": float(cape_row["cape"]),
        "cape_pct": float(panel["cape_pct_expanding"].dropna().iloc[-1]) * 100,
        "earnings_yield": ey * 100,
        "inflation_expected": infl * 100,
        "rf_nominal": CURRENT_RF_ANNUAL * 100,
        "rf_real": rf_real * 100,
        "spread": spread * 100,
        "spread_pct": float((hist <= spread).mean()) * 100,
        "vol": float(panel["vol_trailing"].dropna().iloc[-1]) * 100,
    }


def predict_today(panel: pd.DataFrame, n_values=(3, 6, 9, 12, 18, 24, 36),
                  horizon: int = HORIZON_MONTHS) -> pd.DataFrame:
    """Fitted DCA advantage for the state the market is actually in now."""
    st = current_state(panel)
    rows = []
    for n in n_values:
        frame = build_regression_frame(panel, n, horizon)
        fit = _fit(frame, ["cape_pct_expanding", "spread_ey"], horizon)
        x = np.array([1.0, st["cape_pct"], st["spread"]])
        pred = float(fit.params @ x)
        se_mean = float(np.sqrt(x @ fit.cov_params().values @ x))
        resid_sd = float(np.std(fit.resid, ddof=3))
        se_pred = float(np.sqrt(se_mean ** 2 + resid_sd ** 2))
        rows.append({
            "N": n,
            "predicted adv (%p)": pred,
            "95% CI on the mean": f"[{pred-1.96*se_mean:+.2f}, {pred+1.96*se_mean:+.2f}]",
            "95% prediction interval": f"[{pred-1.96*se_pred:+.1f}, {pred+1.96*se_pred:+.1f}]",
            "residual sd (%p)": resid_sd,
        })
    return pd.DataFrame(rows).set_index("N")


def breakeven_spread(panel: pd.DataFrame, n: int = 12,
                     horizon: int = HORIZON_MONTHS) -> float:
    """Spread at which schedule N stops costing money, at today's CAPE."""
    st = current_state(panel)
    frame = build_regression_frame(panel, n, horizon)
    fit = _fit(frame, ["cape_pct_expanding", "spread_ey"], horizon)
    b = fit.params
    return float(-(b["const"] + b["cape_pct_expanding"] * st["cape_pct"])
                 / b["spread_ey"])
