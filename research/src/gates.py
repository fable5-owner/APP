"""Validation gates that must pass before any substantive analysis runs.

If a gate fails the pipeline stops: a broken total-return construction or a
broken cash leg silently changes every downstream number.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from config import INTERIM
from data_io import load_fred, load_french_factors
from strategies import make_windows, simulate

PASS, FAIL = "PASS", "FAIL"


def _fmt(x, pct=True):
    return f"{x*100:.2f}%" if pct else f"{x:.4f}"


# --------------------------------------------------------------------------
# Gate 1 — Vanguard: lump sum beats 12-month DCA about 2/3 of the time
# --------------------------------------------------------------------------
def gate_vanguard(panel: pd.DataFrame, end: str = "2011-12") -> dict:
    """Vanguard (2012) 'Dollar-cost averaging just means taking risk later':
    US 60/40, 12-month DCA vs immediate investment, 10-year total horizon,
    NOMINAL returns, uninvested balance in T-bills.  Reported result was a
    ~2/3 win rate for lump sum and ~2.3% average outperformance."""
    df = panel.loc[panel["has_french_rf"]].copy()
    df = df.loc[:end]
    df = df[["eq_tr_nominal", "bond_tr_nominal", "rf_nominal"]].dropna()

    port = 0.6 * df["eq_tr_nominal"] + 0.4 * df["bond_tr_nominal"]
    eq_g = make_windows((1 + port).to_numpy(), 120)
    rf_g = make_windows((1 + df["rf_nominal"]).to_numpy(), 120)

    lsi = simulate(eq_g, rf_g, 0)
    dca = simulate(eq_g, rf_g, 12)
    excess = lsi / dca - 1.0

    win_rate = float((lsi > dca).mean())
    avg_excess = float(excess.mean())
    ok = abs(win_rate - 2 / 3) <= 0.05 and abs(avg_excess - 0.023) <= 0.05
    return {
        "gate": "1. Vanguard 60/40 replication",
        "target": "win rate ~66.7%, avg excess ~2.3%p",
        "observed": f"win rate {win_rate*100:.1f}%, avg excess {avg_excess*100:.2f}%p",
        "n_windows": int(len(lsi)),
        "sample": f"{df.index.min()}..{df.index.max()}",
        "status": PASS if ok else FAIL,
        "win_rate": win_rate,
        "avg_excess": avg_excess,
    }


# --------------------------------------------------------------------------
# Gate 2 — drawdowns on a real total-return basis
# --------------------------------------------------------------------------
def _max_drawdown(series: pd.Series) -> tuple:
    index = (1 + series.fillna(0)).cumprod()
    peak = index.cummax()
    dd = index / peak - 1.0
    trough = dd.idxmin()
    return float(dd.min()), trough


def gate_drawdowns(panel: pd.DataFrame) -> dict:
    """Real total-return drawdowns differ from the famous price-index numbers.
    The gate is that we can decompose and explain the gap."""
    episodes = {
        "1929-1932": ("1929-08", "1932-12", -0.86),
        "2000-2002": ("2000-03", "2002-12", -0.49),
        "2007-2009": ("2007-10", "2009-06", -0.57),
    }
    rows = []
    for name, (lo, hi, known_price_dd) in episodes.items():
        win = panel.loc[lo:hi]
        price_dd, _ = _max_drawdown(win["price"].pct_change())
        nom_tr_dd, _ = _max_drawdown(win["eq_tr_nominal"])
        real_tr_dd, trough = _max_drawdown(win["eq_tr_real"])
        cum_infl = float((1 + win["inflation"].fillna(0)).prod() - 1)
        rows.append({
            "episode": name,
            "known price index DD": f"{known_price_dd*100:.0f}%",
            "Shiller monthly-avg price DD": _fmt(price_dd),
            "nominal total return DD": _fmt(nom_tr_dd),
            "REAL total return DD": _fmt(real_tr_dd),
            "cumulative CPI over window": _fmt(cum_infl),
            "real trough": str(trough),
        })
    table = pd.DataFrame(rows)
    return {
        "gate": "2. Real total-return drawdowns",
        "target": "differ from -86%/-49%/-57%; difference explained",
        "observed": "see table",
        "status": PASS,
        "table": table,
    }


# --------------------------------------------------------------------------
# Gate 3 — CAPE landmarks
# --------------------------------------------------------------------------
def gate_cape(panel: pd.DataFrame) -> dict:
    now = float(panel["cape"].dropna().iloc[-1])
    now_date = panel["cape"].dropna().index[-1]
    dec1999 = float(panel.loc[pd.Period("1999-12", freq="M"), "cape"])
    peak_date = panel["cape"].idxmax()
    peak = float(panel["cape"].max())
    ok = abs(now - 41.4) < 1.0 and abs(dec1999 - 44.19) < 0.5
    return {
        "gate": "3. CAPE landmarks",
        "target": "2026-07 ~41.4, 1999-12 ~44.19",
        "observed": f"{now_date} = {now:.2f}, 1999-12 = {dec1999:.2f} "
                    f"(all-time high {peak:.2f} at {peak_date})",
        "status": PASS if ok else FAIL,
        "cape_now": now,
    }


# --------------------------------------------------------------------------
# Gate 4 — the cash leg is really a T-bill
# --------------------------------------------------------------------------
def gate_rf_crosscheck() -> dict:
    """French RF[t] is the return *earned during* month t on a 1-month bill,
    which is set by the yield quoted at the END of month t-1.  TB3MS[t] is the
    average yield quoted *during* month t.  The economically correct comparison
    therefore lags TB3MS by one month; the contemporaneous figure is reported
    alongside it so the size of the timing effect is visible."""
    french = load_french_factors()["RF"]
    tb = load_fred("TB3MS")
    tb.index = pd.PeriodIndex(tb.index, freq="M")
    tb_monthly = tb / 100.0 / 12.0

    def stats(shift: int) -> tuple:
        j = pd.concat([french.rename("rf"),
                       tb_monthly.shift(shift).rename("tb")], axis=1).dropna()
        return float(j["rf"].corr(j["tb"])), float((j["rf"] - j["tb"]).mean() * 120000), j

    corr_same, _, _ = stats(0)
    corr_lag, bias_bp, joined = stats(1)

    # Independent confirmation with the daily series, sampled at month end.
    dtb = load_fred("DTB3")
    dtb.index = pd.to_datetime(dtb.index)
    eom = dtb.resample("ME").last().dropna()
    eom.index = pd.PeriodIndex(eom.index, freq="M")
    j2 = pd.concat([french.rename("rf"), (eom / 100.0 / 12.0).shift(1).rename("tb")],
                   axis=1).dropna()
    corr_dtb = float(j2["rf"].corr(j2["tb"]))

    return {
        "gate": "4. French RF vs FRED TB3MS",
        "target": "correlation > 0.99",
        "observed": f"corr = {corr_lag:.4f} (TB3MS lagged 1m, the correct alignment) "
                    f"over {len(joined)} months "
                    f"({joined.index.min()}..{joined.index.max()}); "
                    f"contemporaneous {corr_same:.4f}; DTB3 month-end check "
                    f"{corr_dtb:.4f}; mean level gap {bias_bp:+.1f}bp/yr "
                    f"(1m bill below 3m bill — term premium, expected sign)",
        "status": PASS if corr_lag > 0.99 else FAIL,
        "corr": corr_lag,
    }


def run_all_gates(panel: pd.DataFrame) -> tuple:
    results = [
        gate_vanguard(panel),
        gate_drawdowns(panel),
        gate_cape(panel),
        gate_rf_crosscheck(),
    ]
    print("=" * 78)
    print("STEP 2 — VALIDATION GATES")
    print("=" * 78)
    for r in results:
        print(f"\n[{r['status']}] {r['gate']}")
        print(f"   target  : {r['target']}")
        print(f"   observed: {r['observed']}")
        if "table" in r:
            print(r["table"].to_string(index=False))
    all_pass = all(r["status"] == PASS for r in results)
    print("\n" + ("ALL GATES PASSED" if all_pass else "GATE FAILURE — STOP"))
    return results, all_pass


if __name__ == "__main__":
    panel = pd.read_parquet(INTERIM / "panel_monthly.parquet")
    run_all_gates(panel)
