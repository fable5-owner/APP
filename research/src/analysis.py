"""Step 3 — conditional analysis, bootstrap intervals, robustness.

Sign convention used everywhere: **DCA advantage** is the terminal-wealth ratio
of an N-month deployment against an immediate lump sum, minus one, in
percentage points.  Positive means spreading the purchase paid off.

Sample-size accounting follows `advantage.py`: the advantage for schedule N is
determined by N months of returns, so the independent-block count is span/N.
The count of overlapping start months is never used as a sample size.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from advantage import (advantage_frame, deployment_advantage, effective_sample,
                       features_for, regimes, valuation_wait_advantage)
from bootstrap import bootstrap_distribution, percentile_ci, straddles_zero
from config import (BOOTSTRAP_BLOCK, BOOTSTRAP_DRAWS, BOOTSTRAP_SEED, EPISODES,
                    GAMMAS, HORIZON_MONTHS, N_GRID, S2_TRIGGERS, START_YEARS)
from metrics import crra_certainty_equivalent
from strategies import make_windows, simulate
from windows import build_windows, subset, wealth_grid

CAPE_EDGES = (0.0, 0.2, 0.4, 0.6, 0.8, 0.9, 1.01)


# --------------------------------------------------------------------------
# Bootstrap
# --------------------------------------------------------------------------
def bootstrap_advantage(panel: pd.DataFrame, n_grid: list = N_GRID,
                        cond=None, draws: int = BOOTSTRAP_DRAWS,
                        block: int = BOOTSTRAP_BLOCK,
                        seed: int = BOOTSTRAP_SEED) -> np.ndarray:
    """Stationary-bootstrap distribution of the mean advantage for each N.

    Blocks must be long relative to the deployment length, otherwise the
    resampling breaks up the very stretch of returns the statistic depends on.
    """
    df = (panel.loc[panel["has_french_rf"]]
          .dropna(subset=["eq_tr_real", "rf_real"]))
    eq_s = (1 + df["eq_tr_real"]).to_numpy()
    rf_s = (1 + df["rf_real"]).to_numpy()
    cape_s = df["cape_pct_expanding"].to_numpy()
    n_obs = len(df)

    def statistic(idx: np.ndarray) -> np.ndarray:
        eq_r, rf_r, cape_r = eq_s[idx], rf_s[idx], cape_s[idx]
        out = []
        for n in n_grid:
            h = max(n, 1)
            eq = make_windows(eq_r, h)
            rf = make_windows(rf_r, h)
            cp = cape_r[: len(eq)]
            keep = np.isfinite(cp) if cond is None else (np.isfinite(cp) & cond(cp))
            if keep.sum() < 5:
                out.append(np.nan)
                continue
            base = simulate(eq[keep], rf[keep], 0)
            w = simulate(eq[keep], rf[keep], n)
            out.append(float(np.mean(w / base - 1.0)))
        return np.asarray(out)

    rng = np.random.default_rng(seed)
    return bootstrap_distribution(n_obs, block, draws, statistic, rng)


# --------------------------------------------------------------------------
# Headline tables
# --------------------------------------------------------------------------
def advantage_table(panel: pd.DataFrame, n_grid: list = N_GRID,
                    cond=None, label: str = "all starts",
                    draws: int = BOOTSTRAP_DRAWS,
                    block: int = BOOTSTRAP_BLOCK) -> pd.DataFrame:
    """Mean advantage per schedule with bootstrap CI and effective sample."""
    adv = advantage_frame(panel, n_grid)
    feats = features_for(panel)
    boot = bootstrap_advantage(panel, n_grid, cond=cond, draws=draws, block=block)

    rows = []
    for i, n in enumerate(n_grid):
        col = adv[n].dropna()
        pct = feats["cape_pct_expanding"].reindex(col.index)
        mask = np.isfinite(pct.to_numpy())
        if cond is not None:
            mask &= cond(pct.to_numpy())
        sel = col[mask]
        lo, hi = percentile_ci(boot[:, i])
        eff = effective_sample(mask, max(n, 1))
        rows.append({
            "N": n,
            "mean adv (%p)": float(sel.mean()) * 100,
            "95% CI (%p)": f"[{lo*100:+.2f}, {hi*100:+.2f}]",
            "median (%p)": float(sel.median()) * 100,
            "P(beat lump)": float((sel > 0).mean()),
            "start months": int(mask.sum()),
            "effective N": round(eff, 1),
            "regimes": regimes(mask),
            "CI excludes 0": "no" if straddles_zero(lo, hi) else "yes",
            "flag": "LOW-INFO" if eff < 10 else "",
        })
    out = pd.DataFrame(rows).set_index("N")
    out.attrs["label"] = label
    return out


def cape_bucket_table(panel: pd.DataFrame, n_grid: list = N_GRID,
                      col: str = "cape_pct_expanding",
                      edges: tuple = CAPE_EDGES) -> pd.DataFrame:
    adv = advantage_frame(panel, n_grid)
    feats = features_for(panel)
    rows = []
    for lo, hi in zip(edges[:-1], edges[1:]):
        pct = feats[col]
        base_mask = (pct >= lo) & (pct < hi)
        if base_mask.sum() == 0:
            continue
        row = {"CAPE pct bucket": f"{lo:.0%}-{min(hi, 1.0):.0%}",
               "start months": int(base_mask.sum()),
               "regimes": regimes(base_mask.to_numpy())}
        means = {}
        for n in n_grid:
            sel = adv[n].reindex(base_mask.index)[base_mask].dropna()
            means[n] = float(sel.mean()) * 100
            row[f"N={n}"] = means[n]
        m12 = base_mask.reindex(adv[12].dropna().index).fillna(False).to_numpy()
        eff12 = effective_sample(m12, 12)
        row["eff N (N=12)"] = round(eff12, 1)
        row["best N"] = max(means, key=means.get)
        row["flag"] = "LOW-INFO" if eff12 < 10 else ""
        rows.append(row)
    order = ["start months", "regimes", "eff N (N=12)", "best N"] + \
            [f"N={n}" for n in n_grid] + ["flag"]
    return pd.DataFrame(rows).set_index("CAPE pct bucket")[order]


def lookahead_bias(panel: pd.DataFrame, n_grid: list = N_GRID) -> pd.DataFrame:
    """Size of the bias from using a full-sample CAPE percentile."""
    exp_t = cape_bucket_table(panel, n_grid, col="cape_pct_expanding")
    full_t = cape_bucket_table(panel, n_grid, col="cape_pct_fullsample")
    cols = [f"N={n}" for n in n_grid]
    common = exp_t.index.intersection(full_t.index)
    diff = (full_t.loc[common, cols] - exp_t.loc[common, cols]).round(2)
    diff.insert(0, "start months (expanding)", exp_t.loc[common, "start months"])
    diff.insert(1, "start months (full-sample)", full_t.loc[common, "start months"])
    diff["best N expanding"] = exp_t.loc[common, "best N"]
    diff["best N full-sample"] = full_t.loc[common, "best N"]
    return diff


# --------------------------------------------------------------------------
# Leave-one-episode-out
# --------------------------------------------------------------------------
def leave_one_out(panel: pd.DataFrame, n_grid: list = N_GRID,
                  cond=None) -> pd.DataFrame:
    """Drop each crisis in turn and re-rank the schedules.

    A start month is dropped when its deployment window overlaps the episode,
    because that is exactly when the crisis drives the result.
    """
    adv = advantage_frame(panel, n_grid)
    feats = features_for(panel)
    pct = feats["cape_pct_expanding"]

    def base_mask_for(n):
        col = adv[n].dropna()
        m = pd.Series(True, index=col.index)
        p = pct.reindex(col.index)
        m &= np.isfinite(p)
        if cond is not None:
            m &= cond(p.to_numpy())
        return col, m

    rows = {"full sample": {}}
    for name in EPISODES:
        rows[f"ex-{name}"] = {}

    for n in n_grid:
        col, m = base_mask_for(n)
        rows["full sample"][n] = float(col[m].mean()) * 100
        for name, (lo, hi) in EPISODES.items():
            lo_p, hi_p = pd.Period(lo, freq="M"), pd.Period(hi, freq="M")
            ends = col.index + max(n, 1) - 1
            touches = (col.index <= hi_p) & (ends >= lo_p)
            keep = m & ~np.asarray(touches)
            rows[f"ex-{name}"][n] = (float(col[keep].mean()) * 100
                                     if keep.sum() >= 5 else np.nan)

    table = pd.DataFrame(rows)
    table.index.name = "N"
    table.loc["best N"] = table.idxmax()
    return table


# --------------------------------------------------------------------------
# Crash shapes
# --------------------------------------------------------------------------
def detect_drawdown_episodes(panel: pd.DataFrame,
                             threshold: float = -0.20) -> pd.DataFrame:
    r = (panel.loc[panel["has_french_rf"], "eq_tr_real"]).dropna()
    index = (1 + r).cumprod()
    peak = index.cummax()
    dd = index / peak - 1.0

    episodes, in_ep, ep = [], False, None
    for i, (date, value) in enumerate(dd.items()):
        if not in_ep and value <= threshold:
            in_ep = True
            peak_pos = int(np.flatnonzero(
                index.iloc[:i + 1].to_numpy() >= peak.iloc[i] - 1e-12)[-1])
            ep = {"peak_pos": peak_pos, "peak": index.index[peak_pos]}
        elif in_ep and value >= -1e-12:
            seg = dd.iloc[ep["peak_pos"]:i + 1]
            trough_date = seg.idxmin()
            trough_pos = dd.index.get_loc(trough_date)
            episodes.append({
                "peak": ep["peak"], "trough": trough_date, "recovered": date,
                "depth": float(seg.min()),
                "months_to_trough": trough_pos - ep["peak_pos"],
                "months_to_recover": i - trough_pos})
            in_ep = False
    if in_ep:
        seg = dd.iloc[ep["peak_pos"]:]
        trough_date = seg.idxmin()
        trough_pos = dd.index.get_loc(trough_date)
        episodes.append({
            "peak": ep["peak"], "trough": trough_date, "recovered": None,
            "depth": float(seg.min()),
            "months_to_trough": trough_pos - ep["peak_pos"],
            "months_to_recover": np.nan})
    return pd.DataFrame(episodes)


def crash_shape_table(panel: pd.DataFrame, n_grid: list = N_GRID,
                      lookahead_months: int = 36) -> tuple:
    """Best schedule conditional on the shape of the crash that follows.

    This conditions on information the investor cannot possibly have at the
    decision point.  It is diagnostic — it explains WHY the unconditional
    answer looks the way it does — and is not a usable rule.
    """
    eps = detect_drawdown_episodes(panel).copy()
    eps["shape"] = np.where(
        eps["months_to_trough"] <= 12, "fast V (<=12m to trough)",
        np.where(eps["months_to_trough"] <= 30, "medium (13-30m)",
                 "slow grind (>30m)"))

    adv = advantage_frame(panel, n_grid)
    labels = pd.Series("no >=20% drawdown ahead", index=adv.index, dtype=object)
    for _, ep in eps.iterrows():
        # Start months from which the trough lies within the next
        # `lookahead_months`; that is the window a schedule could react to.
        lo = ep["trough"] - lookahead_months
        sel = (adv.index >= lo) & (adv.index <= ep["trough"])
        labels[sel] = ep["shape"]

    rows = []
    for shape in ["fast V (<=12m to trough)", "medium (13-30m)",
                  "slow grind (>30m)", "no >=20% drawdown ahead"]:
        mask = (labels == shape)
        if mask.sum() == 0:
            continue
        row = {"crash shape": shape, "start months": int(mask.sum()),
               "episodes": int(eps["shape"].eq(shape).sum())}
        means = {}
        for n in n_grid:
            sel = adv[n][mask].dropna()
            means[n] = float(sel.mean()) * 100
            row[f"N={n}"] = means[n]
        row["best N"] = max(means, key=means.get)
        rows.append(row)
    table = pd.DataFrame(rows).set_index("crash shape")
    order = ["start months", "episodes", "best N"] + [f"N={n}" for n in n_grid]
    return table[order], eps


# --------------------------------------------------------------------------
# Regret
# --------------------------------------------------------------------------
def regret_table(panel: pd.DataFrame, n_grid: list = N_GRID,
                 cond=None) -> pd.DataFrame:
    """Per-start-month shortfall against the best schedule for that month.

    Because every schedule ends up holding the same portfolio, regret in
    relative terms depends only on the advantage, so it is computed directly
    from the advantage frame.
    """
    adv = advantage_frame(panel, n_grid).dropna()
    if cond is not None:
        pct = features_for(panel)["cape_pct_expanding"].reindex(adv.index)
        adv = adv[np.isfinite(pct) & cond(pct.to_numpy())]
    best = adv.max(axis=1)
    regret = adv.rsub(best, axis=0) * 100
    out = pd.DataFrame({
        "max regret (%p)": regret.max(),
        "mean regret (%p)": regret.mean(),
        "p95 regret (%p)": regret.quantile(0.95),
        "times best": (regret < 1e-12).sum(),
        "share best": (regret < 1e-12).mean(),
    })
    out.index.name = "N"
    out.attrs["minimax N"] = out["max regret (%p)"].idxmin()
    out.attrs["minimean N"] = out["mean regret (%p)"].idxmin()
    return out


# --------------------------------------------------------------------------
# CRRA (needs a real holding horizon, so this one does use H)
# --------------------------------------------------------------------------
def crra_table(panel: pd.DataFrame, n_grid: list = N_GRID,
               gammas: list = GAMMAS, horizon: int = HORIZON_MONTHS,
               cond=None) -> pd.DataFrame:
    ws = build_windows(panel, horizon)
    if cond is not None:
        mask = cond(ws.features["cape_pct_expanding"].to_numpy())
        ws = subset(ws, np.asarray(mask))
    w = wealth_grid(ws, n_grid)
    rows = []
    for g in gammas:
        ce = {n: crra_certainty_equivalent(w[n].to_numpy(), g) for n in n_grid}
        base = ce[0]
        row = {"gamma": g, "best N": max(ce, key=ce.get)}
        for n in n_grid:
            row[f"N={n}"] = (ce[n] / base - 1) * 100
        rows.append(row)
    out = pd.DataFrame(rows).set_index("gamma")
    out.attrs["n_windows"] = len(ws)
    out.attrs["span"] = f"{ws.starts.min()}..{ws.starts.max()}"
    return out


# --------------------------------------------------------------------------
# Start-year sensitivity
# --------------------------------------------------------------------------
def start_year_table(panel: pd.DataFrame, n_grid: list = N_GRID,
                     years: list = START_YEARS) -> pd.DataFrame:
    adv = advantage_frame(panel, n_grid)
    rows = []
    for y in years:
        sel = adv[adv.index >= pd.Period(f"{y}-01", freq="M")]
        if len(sel) < 24:
            continue
        means = {n: float(sel[n].dropna().mean()) * 100 for n in n_grid}
        row = {"start year": y, "start months": len(sel),
               "eff N (N=12)": round(effective_sample(
                   np.ones(len(sel[12].dropna()), dtype=bool), 12), 1),
               "best N": max(means, key=means.get)}
        row.update({f"N={n}": means[n] for n in n_grid})
        rows.append(row)
    return pd.DataFrame(rows).set_index("start year")


# --------------------------------------------------------------------------
# Strategy comparison S0-S4
# --------------------------------------------------------------------------
def strategy_comparison(panel: pd.DataFrame, cond=None,
                        horizon: int = HORIZON_MONTHS) -> pd.DataFrame:
    feats = features_for(panel)
    pct = feats["cape_pct_expanding"]

    def summarise(series: pd.Series, name: str, detail: str) -> dict:
        s = series.dropna()
        p = pct.reindex(s.index)
        m = np.isfinite(p)
        if cond is not None:
            m &= cond(p.to_numpy())
        s = s[m]
        return {"strategy": name, "detail": detail,
                "mean adv (%p)": float(s.mean()) * 100,
                "median (%p)": float(s.median()) * 100,
                "P(beat lump)": float((s > 0).mean()),
                "worst (%p)": float(s.min()) * 100,
                "best (%p)": float(s.max()) * 100,
                "start months": int(len(s))}

    rows = [{"strategy": "S0 lump sum", "detail": "N=0", "mean adv (%p)": 0.0,
             "median (%p)": 0.0, "P(beat lump)": np.nan, "worst (%p)": 0.0,
             "best (%p)": 0.0, "start months": np.nan}]

    for n in (6, 12, 24, 36):
        rows.append(summarise(deployment_advantage(panel, n),
                              "S1 equal DCA", f"N={n}"))
    for n in (12, 24, 36):
        rows.append(summarise(deployment_advantage(panel, n, triggers=S2_TRIGGERS),
                              "S2 DCA + drawdown accel", f"N={n}"))
    for n in (12, 24):
        rows.append(summarise(deployment_advantage(panel, n, value_averaging=True),
                              "S4 value averaging", f"N={n}"))

    # S3 is capped at 36 months so it shares a sample basis with N=36 rather
    # than being evaluated on a shorter, differently-truncated sample.
    for x in (0.3, 0.5, 0.8):
        rows.append(summarise(valuation_wait_advantage(panel, x, 36),
                              "S3 wait for valuation",
                              f"CAPE pct < {x:.0%}, give up at 36m"))
    return pd.DataFrame(rows).set_index(["strategy", "detail"])


# --------------------------------------------------------------------------
# Is this a timing decision or a risk-budget decision?
# --------------------------------------------------------------------------
def static_allocation_control(panel: pd.DataFrame, n_grid: list = N_GRID,
                              gammas: list = GAMMAS,
                              horizon: int = HORIZON_MONTHS,
                              cond=None) -> pd.DataFrame:
    """Compare N-month deployment against a CONSTANT mix holding the same
    average equity weight.

    An N-month deployment is under-invested for part of the horizon, so any
    risk-averse criterion will prefer it to a permanently full equity position.
    That is a statement about the risk budget, not about timing.  The honest
    control is a static blend with the same average equity exposure: if the
    static blend does at least as well, the schedule is buying nothing that a
    lower allocation would not.
    """
    ws = build_windows(panel, horizon)
    if cond is not None:
        ws = subset(ws, np.asarray(cond(ws.features["cape_pct_expanding"].to_numpy())))

    rows = []
    for n in n_grid:
        # Average equity weight of the schedule across the horizon.
        weights = np.ones(horizon)
        for t in range(min(n, horizon)):
            weights[t] = (t + 0.5) / n if n > 0 else 1.0
        w_bar = float(weights.mean())

        dca = simulate(ws.eq, ws.rf, n)
        static_gross = w_bar * ws.eq + (1 - w_bar) * ws.rf
        static = simulate(static_gross, ws.rf, 0)

        row = {"N": n, "avg equity weight": round(w_bar, 4),
               "mean adv of DCA vs lump (%p)": float(np.mean(dca / simulate(ws.eq, ws.rf, 0) - 1)) * 100,
               "mean adv of static vs lump (%p)": float(np.mean(static / simulate(ws.eq, ws.rf, 0) - 1)) * 100}
        for g in gammas:
            ce_d = crra_certainty_equivalent(dca, g)
            ce_s = crra_certainty_equivalent(static, g)
            row[f"CE(DCA)-CE(static) g={g} (%)"] = (ce_d / ce_s - 1) * 100
        rows.append(row)
    out = pd.DataFrame(rows).set_index("N")
    out.attrs["n_windows"] = len(ws)
    out.attrs["span"] = f"{ws.starts.min()}..{ws.starts.max()}"
    return out


# --------------------------------------------------------------------------
# How much to put in — the lever the schedule question is usually a proxy for
# --------------------------------------------------------------------------
def allocation_ladder(panel: pd.DataFrame,
                      weights: tuple = (1.0, 0.85, 0.70, 0.50),
                      gammas: list = GAMMAS,
                      horizon: int = HORIZON_MONTHS,
                      cond=None) -> pd.DataFrame:
    """Terminal real wealth for constant equity weights, rebalanced monthly.

    The schedule question asks *when* the money goes in; this asks *how much*
    goes in at all.  Both move the average equity exposure, but the schedule
    moves it only for N months and the sample cannot sign the effect, while
    this moves it for the whole horizon and the sign is not in doubt.  Reported
    together so the reader can see which decision is actually large.
    """
    ws = build_windows(panel, horizon)
    if cond is not None:
        ws = subset(ws, np.asarray(
            cond(ws.features["cape_pct_expanding"].to_numpy())))

    rows = []
    for w in weights:
        wealth = simulate(w * ws.eq + (1 - w) * ws.rf, ws.rf, 0)
        row = {"equity weight": w,
               "mean": float(np.mean(wealth)),
               "p05": float(np.percentile(wealth, 5)),
               "p50": float(np.percentile(wealth, 50)),
               "p95": float(np.percentile(wealth, 95)),
               "min": float(np.min(wealth)),
               "loss rate": float(np.mean(wealth < 1.0))}
        for g in gammas:
            row[f"CE g={g}"] = crra_certainty_equivalent(wealth, g)
        rows.append(row)

    out = pd.DataFrame(rows).set_index("equity weight")
    out.attrs["n_windows"] = len(ws)
    out.attrs["span"] = f"{ws.starts.min()}..{ws.starts.max()}"
    out.attrs["eff_n"] = round(
        effective_sample(np.ones(len(ws), dtype=bool), horizon), 1)
    return out


def terminal_distribution(panel: pd.DataFrame, n_grid: list = N_GRID,
                          horizon: int = HORIZON_MONTHS,
                          cond=None) -> pd.DataFrame:
    """Percentiles of terminal real wealth per unit invested, by schedule.

    The advantage tables report a *mean* difference between schedules.  This
    reports the spread of outcomes each schedule actually faces, which is the
    quantity a reader means by "how bad can it get".
    """
    ws = build_windows(panel, horizon)
    if cond is not None:
        ws = subset(ws, np.asarray(
            cond(ws.features["cape_pct_expanding"].to_numpy())))

    grid = wealth_grid(ws, n_grid)
    rows = {}
    for n in n_grid:
        v = grid[n].to_numpy()
        rows[n] = {"p05": float(np.percentile(v, 5)),
                   "p25": float(np.percentile(v, 25)),
                   "p50": float(np.percentile(v, 50)),
                   "p75": float(np.percentile(v, 75)),
                   "p95": float(np.percentile(v, 95)),
                   "min": float(np.min(v)),
                   "mean": float(np.mean(v)),
                   "loss rate": float(np.mean(v < 1.0))}
    out = pd.DataFrame(rows).T
    out.index.name = "N"
    out.attrs["n_windows"] = len(ws)
    out.attrs["span"] = f"{ws.starts.min()}..{ws.starts.max()}"
    out.attrs["eff_n"] = round(
        effective_sample(np.ones(len(ws), dtype=bool), horizon), 1)
    return out
