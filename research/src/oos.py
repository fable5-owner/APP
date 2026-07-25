"""Step 4b — out-of-sample tests.

Two separate tests:

1. Split the US sample.  Choose the schedule on windows that FINISH by 1990,
   evaluate on windows that START after 1990.  The two sets share no data.
2. Japan as a pure out-of-sample market.  Nothing about Japan enters any US
   fitting step, and Japan contains the only genuine extreme: a market that
   entered at an extraordinary valuation and did not recover for decades.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from config import HORIZON_MONTHS, N_GRID
from metrics import crra_certainty_equivalent, effective_n
from strategies import make_windows, simulate
from windows import build_windows, subset, wealth_grid


# --------------------------------------------------------------------------
# US split-sample
# --------------------------------------------------------------------------
def us_split_sample(panel: pd.DataFrame, split: str = "1990-01",
                    horizon: int = HORIZON_MONTHS,
                    n_grid: list = N_GRID) -> dict:
    ws = build_windows(panel, horizon)
    split_p = pd.Period(split, freq="M")
    ends = ws.starts + horizon - 1

    in_mask = np.asarray(ends < split_p)        # fully completed before split
    out_mask = np.asarray(ws.starts >= split_p)  # begins after split

    res = {}
    for label, mask in [("in-sample (windows ending < 1990)", in_mask),
                        ("out-of-sample (windows starting >= 1990)", out_mask)]:
        sub = subset(ws, mask)
        adv = wealth_grid(sub, n_grid)
        adv = adv.div(adv[0], axis=0) - 1.0
        res[label] = {
            "mean": adv.mean() * 100,
            "obs": len(sub),
            "effective N": round(effective_n(mask, horizon), 1),
            "best N": adv.mean().idxmax(),
            "span": f"{sub.starts.min()}..{sub.starts.max()}",
        }

    # Conditional rule: pick the best N inside the high-CAPE state in-sample,
    # then apply that same N to high-CAPE starts out-of-sample.
    high = (ws.features["cape_pct_expanding"] >= 0.80).to_numpy()
    rule = {}
    for label, mask in [("in", in_mask & high), ("out", out_mask & high)]:
        if mask.sum() < 5:
            rule[label] = None
            continue
        sub = subset(ws, mask)
        adv = wealth_grid(sub, n_grid)
        adv = adv.div(adv[0], axis=0) - 1.0
        rule[label] = {
            "mean": adv.mean() * 100,
            "obs": len(sub),
            "effective N": round(effective_n(mask, horizon), 1),
            "best N": adv.mean().idxmax(),
            "span": f"{sub.starts.min()}..{sub.starts.max()}",
        }
    return {"unconditional": res, "high_cape": rule}


# --------------------------------------------------------------------------
# Japan (annual)
# --------------------------------------------------------------------------
def japan_windows(japan: pd.DataFrame, horizon_years: int = 10) -> dict:
    df = japan.dropna(subset=["eq_tr_real", "rf_real"]).copy()
    eq = make_windows((1 + df["eq_tr_real"]).to_numpy(), horizon_years)
    rf = make_windows((1 + df["rf_real"]).to_numpy(), horizon_years)
    starts = df.index[: len(eq)]
    capd = df["capd"].iloc[: len(eq)]
    # Expanding percentile of the valuation proxy, same discipline as CAPE.
    pct = []
    vals = capd.to_numpy()
    for i in range(len(vals)):
        hist = vals[: i + 1]
        hist = hist[np.isfinite(hist)]
        pct.append(np.nan if (not np.isfinite(vals[i]) or len(hist) < 20)
                   else (hist <= vals[i]).mean())
    return {"eq": eq, "rf": rf, "starts": starts,
            "capd": capd, "capd_pct": pd.Series(pct, index=starts)}


def japan_table(japan: pd.DataFrame, n_years: list = (0, 1, 2, 3),
                horizon_years: int = 10) -> pd.DataFrame:
    w = japan_windows(japan, horizon_years)
    wealth = pd.DataFrame(
        {n: simulate(w["eq"], w["rf"], n) for n in n_years}, index=w["starts"])
    adv = wealth.div(wealth[0], axis=0) - 1.0

    rows = []
    pct = w["capd_pct"]
    for label, mask in [
        ("all Japanese starts", pd.Series(True, index=w["starts"])),
        ("post-1950 starts", w["starts"] >= 1950),
        ("top-quintile valuation", pct >= 0.80),
        ("1985-1990 entry", (w["starts"] >= 1985) & (w["starts"] <= 1990)),
    ]:
        m = np.asarray(mask)
        if m.sum() == 0:
            continue
        sub = adv[m]
        row = {"subset": label, "obs": int(m.sum()),
               "effective N": round(effective_n(m, horizon_years), 1),
               "best N (yrs)": sub.mean().idxmax()}
        for n in n_years:
            row[f"N={n}y"] = float(sub[n].mean()) * 100
        rows.append(row)
    return pd.DataFrame(rows).set_index("subset"), adv, w


def japan_1989_detail(japan: pd.DataFrame, n_years: list = (0, 1, 2, 3),
                      horizon_years: list = (10, 20, 30)) -> pd.DataFrame:
    """The single episode the US sample does not contain."""
    rows = []
    for h in horizon_years:
        df = japan.dropna(subset=["eq_tr_real", "rf_real"])
        if 1989 + h - 1 > df.index.max():
            continue
        eq = make_windows((1 + df["eq_tr_real"]).to_numpy(), h)
        rf = make_windows((1 + df["rf_real"]).to_numpy(), h)
        starts = df.index[: len(eq)]
        if 1990 not in starts:
            continue
        pos = list(starts).index(1990)
        row = {"entry": "1990 (after the Dec-1989 peak)", "horizon (yrs)": h}
        base = None
        for n in n_years:
            w = float(simulate(eq[pos:pos + 1], rf[pos:pos + 1], n)[0])
            if n == 0:
                base = w
            row[f"N={n}y terminal real wealth"] = w
            row[f"N={n}y adv (%p)"] = (w / base - 1) * 100
        rows.append(row)
    return pd.DataFrame(rows)


def validate_capd_proxy(usa_annual: pd.DataFrame, panel: pd.DataFrame) -> dict:
    """Does the dividend-based valuation proxy track Shiller's CAPE?

    JST carries no earnings, so Japan needs a substitute for CAPE.  The USA
    appears in both datasets, so the substitute can be checked where the real
    thing exists.
    """
    cape_annual = (panel["cape"].groupby(panel.index.year).mean()
                   .rename("cape"))
    joined = pd.concat([usa_annual["capd"].rename("capd"), cape_annual],
                       axis=1).dropna()
    return {
        "n years": len(joined),
        "span": f"{joined.index.min()}-{joined.index.max()}",
        "level corr": float(joined["capd"].corr(joined["cape"])),
        "rank corr": float(joined["capd"].corr(joined["cape"], method="spearman")),
        "log corr": float(np.log(joined["capd"]).corr(np.log(joined["cape"]))),
    }
