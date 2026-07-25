"""Figures for results.md."""
from __future__ import annotations

import matplotlib
matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from advantage import advantage_frame, features_for
from analysis import (CAPE_EDGES, cape_bucket_table, crash_shape_table,
                      regret_table)
from config import FIGURES, N_GRID

plt.rcParams.update({
    "figure.dpi": 130, "savefig.dpi": 130, "font.size": 9,
    "axes.grid": True, "grid.alpha": 0.25, "axes.spines.top": False,
    "axes.spines.right": False, "figure.autolayout": True,
})
BLUE, RED, GREY = "#2f6f9f", "#b5482f", "#7a7a7a"


def fig_regret_curves(panel: pd.DataFrame) -> str:
    all_r = regret_table(panel)
    top_r = regret_table(panel, cond=lambda p: p >= 0.90)

    fig, axes = plt.subplots(1, 2, figsize=(10, 4))
    for ax, tab, title in [(axes[0], all_r, "All start months"),
                           (axes[1], top_r, "Expanding CAPE percentile >= 90")]:
        ax.plot(tab.index, tab["max regret (%p)"], "o-", color=RED,
                label="max regret")
        ax.plot(tab.index, tab["p95 regret (%p)"], "s--", color=BLUE,
                label="95th pct regret")
        ax.plot(tab.index, tab["mean regret (%p)"], "^-", color=GREY,
                label="mean regret")
        ax.set_title(title)
        ax.set_xlabel("deployment months N")
        ax.set_ylabel("regret vs best schedule (%p of terminal wealth)")
        ax.set_xticks(N_GRID)
        ax.legend(frameon=False, fontsize=8)
    fig.suptitle("Regret curves: the mean and the worst case disagree", y=1.02)
    path = FIGURES / "regret_curves.png"
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)
    return str(path)


def fig_outcome_distribution(panel: pd.DataFrame) -> str:
    adv = advantage_frame(panel, N_GRID) * 100
    feats = features_for(panel)
    high = feats["cape_pct_expanding"].reindex(adv.index) >= 0.90

    fig, axes = plt.subplots(1, 2, figsize=(10, 4), sharey=True)
    for ax, mask, title in [(axes[0], pd.Series(True, index=adv.index), "All starts"),
                            (axes[1], high, "CAPE percentile >= 90")]:
        data = [adv[n][mask].dropna().to_numpy() for n in N_GRID]
        bp = ax.boxplot(data, tick_labels=[str(n) for n in N_GRID],
                        showfliers=False, patch_artist=True, whis=(5, 95))
        for patch in bp["boxes"]:
            patch.set_facecolor(BLUE)
            patch.set_alpha(0.35)
        for med in bp["medians"]:
            med.set_color(RED)
        means = [np.mean(d) if len(d) else np.nan for d in data]
        ax.plot(range(1, len(N_GRID) + 1), means, "D", color=RED, ms=4,
                label="mean")
        ax.axhline(0, color="black", lw=0.8)
        ax.set_title(title)
        ax.set_xlabel("deployment months N")
        ax.legend(frameon=False, fontsize=8)
    axes[0].set_ylabel("DCA advantage vs lump sum (%p)")
    fig.suptitle("Distribution of outcomes by schedule (box = IQR, whiskers = 5-95%)",
                 y=1.02)
    path = FIGURES / "outcome_distribution.png"
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)
    return str(path)


def fig_cape_heatmap(panel: pd.DataFrame) -> str:
    exp_t = cape_bucket_table(panel, N_GRID, col="cape_pct_expanding")
    full_t = cape_bucket_table(panel, N_GRID, col="cape_pct_fullsample")
    cols = [f"N={n}" for n in N_GRID]

    fig, axes = plt.subplots(1, 2, figsize=(11, 3.8))
    vmax = max(np.abs(exp_t[cols].to_numpy()).max(),
               np.abs(full_t[cols].to_numpy()).max())
    for ax, tab, title in [
            (axes[0], exp_t, "Expanding-window percentile (valid)"),
            (axes[1], full_t, "Full-sample percentile (look-ahead)")]:
        m = tab[cols].to_numpy(dtype=float)
        im = ax.imshow(m, cmap="RdBu", vmin=-vmax, vmax=vmax, aspect="auto")
        ax.set_xticks(range(len(cols)), [str(n) for n in N_GRID])
        ax.set_yticks(range(len(tab)), tab.index)
        ax.set_xlabel("deployment months N")
        ax.set_title(title, fontsize=9)
        ax.grid(False)
        for i in range(m.shape[0]):
            for j in range(m.shape[1]):
                ax.text(j, i, f"{m[i, j]:.1f}", ha="center", va="center",
                        fontsize=7,
                        color="white" if abs(m[i, j]) > vmax * 0.6 else "black")
        fig.colorbar(im, ax=ax, shrink=0.85, label="mean adv (%p)")
    fig.suptitle("DCA advantage by valuation bucket — and what look-ahead does to it",
                 y=1.04)
    path = FIGURES / "cape_heatmap.png"
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)
    return str(path)


def fig_crash_shape(panel: pd.DataFrame) -> str:
    table, eps = crash_shape_table(panel, N_GRID)
    cols = [f"N={n}" for n in N_GRID]

    fig, axes = plt.subplots(1, 2, figsize=(11, 4))
    ax = axes[0]
    colors = {"fast V (<=12m to trough)": RED, "medium (13-30m)": GREY,
              "slow grind (>30m)": BLUE, "no >=20% drawdown ahead": "#3f8f5f"}
    for shape in table.index:
        ax.plot(N_GRID, table.loc[shape, cols].to_numpy(dtype=float), "o-",
                color=colors.get(shape, "black"), label=shape)
    ax.axhline(0, color="black", lw=0.8)
    ax.set_xticks(N_GRID)
    ax.set_xlabel("deployment months N")
    ax.set_ylabel("mean DCA advantage (%p)")
    ax.set_title("Best schedule depends on the shape of the crash\n"
                 "(conditions on the future — not implementable)", fontsize=9)
    ax.legend(frameon=False, fontsize=7)

    ax2 = axes[1]
    for _, ep in eps.iterrows():
        ax2.scatter(ep["months_to_trough"], ep["depth"] * 100,
                    color=colors.get(ep["shape"], "black"), s=45, zorder=3)
        ax2.annotate(str(ep["peak"]), (ep["months_to_trough"], ep["depth"] * 100),
                     fontsize=6.5, xytext=(4, 4), textcoords="offset points")
    ax2.set_xlabel("months from peak to trough")
    ax2.set_ylabel("real total-return drawdown (%)")
    ax2.set_title("Every >=20% real drawdown since 1926", fontsize=9)
    path = FIGURES / "crash_shape.png"
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)
    return str(path)


def fig_spread_scatter(panel: pd.DataFrame, n: int = 12) -> str:
    """The horse race in one picture."""
    from regression import build_regression_frame
    frame = build_regression_frame(panel, n)

    fig, axes = plt.subplots(1, 2, figsize=(10, 4), sharey=True)
    for ax, col, title in [
            (axes[0], "cape_pct_expanding", "against CAPE percentile"),
            (axes[1], "spread_ey", "against (1/CAPE - real cash rate)")]:
        ax.scatter(frame[col], frame["dca_advantage"], s=5, alpha=0.3, color=BLUE)
        b = np.polyfit(frame[col], frame["dca_advantage"], 1)
        xs = np.linspace(frame[col].min(), frame[col].max(), 50)
        ax.plot(xs, np.polyval(b, xs), color=RED, lw=1.6,
                label=f"slope {b[0]:+.3f}")
        ax.axhline(0, color="black", lw=0.8)
        ax.set_title(title, fontsize=9)
        ax.set_xlabel(col)
        ax.legend(frameon=False, fontsize=8)
    axes[0].set_ylabel(f"N={n} DCA advantage (%p)")
    fig.suptitle("Univariate views: CAPE looks helpful until the spread is held fixed",
                 y=1.02)
    path = FIGURES / "spread_scatter.png"
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)
    return str(path)


def fig_japan(japan: pd.DataFrame) -> str:
    df = japan.dropna(subset=["eq_tr_real"])
    real_index = (1 + df["eq_tr_real"]).cumprod()
    fig, axes = plt.subplots(1, 2, figsize=(10, 3.8))
    ax = axes[0]
    ax.semilogy(real_index.index, real_index / real_index.loc[1970], color=BLUE)
    ax.axvline(1989, color=RED, ls="--", lw=1)
    ax.annotate("1989 peak", (1989, ax.get_ylim()[1] * 0.5), fontsize=7,
                color=RED, rotation=90, va="top")
    ax.set_xlim(1950, df.index.max())
    ax.set_title("Japan real total-return index (1970 = 1)", fontsize=9)
    ax.set_ylabel("log scale")

    ax2 = axes[1]
    ax2.plot(df.index, df["capd"], color=BLUE)
    ax2.axvline(1989, color=RED, ls="--", lw=1)
    ax2.set_xlim(1950, df.index.max())
    ax2.set_title("Japan cyclically adjusted price / dividend", fontsize=9)
    path = FIGURES / "japan.png"
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)
    return str(path)


def make_all(panel: pd.DataFrame, japan: pd.DataFrame) -> list:
    return [
        fig_regret_curves(panel),
        fig_outcome_distribution(panel),
        fig_cape_heatmap(panel),
        fig_crash_shape(panel),
        fig_spread_scatter(panel),
        fig_japan(japan),
    ]
