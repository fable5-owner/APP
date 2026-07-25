"""Palette and figures for the PDF report.

The colours are taken from the naturalist egg plate the report is styled
after — warm beige paper, clay orange, olive and slate-teal — mapped onto
Anthropic's cream-and-clay pairing.
"""
from __future__ import annotations

import matplotlib
matplotlib.use("Agg")

import matplotlib.font_manager as fm
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from config import FONT_DIR


def register_korean_font() -> str:
    """Make Pretendard available to matplotlib so axis labels render Hangul."""
    found = None
    for otf in sorted(FONT_DIR.glob("Pretendard-*.otf")):
        fm.fontManager.addfont(str(otf))
        if found is None:
            found = fm.FontProperties(fname=str(otf)).get_name()
    return found or "DejaVu Sans"


KOREAN_FONT = register_korean_font()

PAPER = "#EDE3D4"
PAPER_DEEP = "#E3D6C2"
INK = "#2B2622"
INK_SOFT = "#6B6055"
INK_FAINT = "#9A8E7F"
CLAY = "#D97757"          # Claude orange
CLAY_DEEP = "#B95536"
OLIVE = "#8A8759"
OLIVE_LIGHT = "#AFAB80"
SLATE = "#5F7A78"
SPECKLE = "#7A6248"
RULE = "#C9B99F"

plt.rcParams.update({
    "figure.dpi": 200,
    "savefig.dpi": 200,
    "font.size": 8.5,
    "font.family": "sans-serif",
    "font.sans-serif": [KOREAN_FONT, "DejaVu Sans"],
    "figure.facecolor": PAPER,
    "axes.facecolor": PAPER,
    "savefig.facecolor": PAPER,
    "text.color": INK,
    "axes.labelcolor": INK_SOFT,
    "xtick.color": INK_SOFT,
    "ytick.color": INK_SOFT,
    "axes.edgecolor": RULE,
    "axes.grid": True,
    "grid.color": RULE,
    "grid.alpha": 0.5,
    "grid.linewidth": 0.6,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "figure.autolayout": True,
    "axes.unicode_minus": False,
})


def _finish(fig, path):
    fig.savefig(path, bbox_inches="tight", facecolor=PAPER)
    plt.close(fig)
    return str(path)


def fig_answer_curve(adv_all: pd.Series, adv_top: pd.Series,
                     ci_all: dict, ci_top: dict, n_grid, path) -> str:
    """The single most important picture: what each schedule costs, with the
    uncertainty band that makes the differences meaningless."""
    fig, ax = plt.subplots(figsize=(7.2, 3.4))
    x = np.arange(len(n_grid))

    lo_t = np.array([ci_top[n][0] for n in n_grid])
    hi_t = np.array([ci_top[n][1] for n in n_grid])
    ax.fill_between(x, lo_t, hi_t, color=CLAY, alpha=0.16, lw=0,
                    label="고 CAPE 95% 신뢰구간")
    lo_a = np.array([ci_all[n][0] for n in n_grid])
    hi_a = np.array([ci_all[n][1] for n in n_grid])
    ax.fill_between(x, lo_a, hi_a, color=SLATE, alpha=0.14, lw=0,
                    label="전체 95% 신뢰구간")

    ax.plot(x, [adv_all[n] for n in n_grid], "o-", color=SLATE, lw=2, ms=5,
            label="전체 시작월", zorder=5)
    ax.plot(x, [adv_top[n] for n in n_grid], "D-", color=CLAY_DEEP, lw=2, ms=5,
            label="고 CAPE (상위 10%)", zorder=6)

    ax.axhline(0, color=INK, lw=1.1, zorder=4)
    ax.set_xticks(x)
    ax.set_xticklabels([str(n) for n in n_grid])
    ax.set_xlabel("분할 개월 수 N")
    ax.set_ylabel("일시투자 대비 (%p)")
    handles, labels = ax.get_legend_handles_labels()
    order = [2, 3, 1, 0]  # lines first, then their bands
    ax.legend([handles[i] for i in order], [labels[i] for i in order],
              frameon=False, fontsize=7.2, loc="lower left", ncol=2,
              columnspacing=1.4, handlelength=1.8)
    ax.annotate("0 = 일시투자와 동일", xy=(0.06, 0.6), fontsize=7,
                color=INK_SOFT, ha="left")
    ax.margins(x=0.02)
    return _finish(fig, path)


def fig_horse_race(betas: pd.DataFrame, path) -> str:
    """The sign flip, as a coefficient plot."""
    fig, ax = plt.subplots(figsize=(7.2, 2.9))
    x = np.arange(len(betas))
    w = 0.36
    ax.bar(x - w / 2, betas["alone"], w, color=SLATE, alpha=0.85,
           label="CAPE 혼자 넣었을 때", zorder=3)
    ax.bar(x + w / 2, betas["with_spread"], w, color=CLAY, alpha=0.95,
           label="스프레드와 함께 넣었을 때", zorder=3)
    ax.axhline(0, color=INK, lw=1.1, zorder=4)
    ax.set_xticks(x)
    ax.set_xticklabels([f"N={n}" for n in betas.index])
    ax.set_ylabel("CAPE 계수")
    ax.legend(frameon=False, fontsize=7.5, loc="upper left")
    span = betas[["alone", "with_spread"]].to_numpy()
    ax.set_ylim(span.min() - 0.045, span.max() + 0.055)
    for xi, v in zip(x - w / 2, betas["alone"]):
        ax.annotate(f"{v:+.3f}", (xi, v), ha="center", fontsize=6.6,
                    color=INK_SOFT, xytext=(0, 3), textcoords="offset points")
    for xi, v in zip(x + w / 2, betas["with_spread"]):
        ax.annotate(f"{v:+.3f}", (xi, v), ha="center", va="top", fontsize=6.6,
                    color=CLAY_DEEP, xytext=(0, -4), textcoords="offset points")
    return _finish(fig, path)


def fig_episodes(dates, pct, episodes, path) -> str:
    """Why the sample is small: the whole high-CAPE record is three stretches."""
    fig, ax = plt.subplots(figsize=(7.2, 2.5))
    years = np.array([d.year + (d.month - 1) / 12 for d in dates])
    ax.plot(years, pct * 100, color=SPECKLE, lw=1.0)
    ax.axhline(90, color=CLAY_DEEP, lw=1.1, ls="--")
    ax.annotate("상위 10% 기준선", xy=(years.max() - 0.5, 84),
                fontsize=7, color=CLAY_DEEP, ha="right", va="top")

    for i, (lo, hi) in enumerate(episodes):
        ax.axvspan(lo, hi, color=CLAY, alpha=0.22, lw=0, zorder=1)
        ax.annotate(f"에피소드 {i+1}", xy=((lo + hi) / 2, 118), ha="center",
                    fontsize=7.5, color=CLAY_DEEP, weight="bold",
                    annotation_clip=False)
    ax.set_ylim(0, 108)
    ax.set_xlim(years.min(), years.max())
    ax.set_ylabel("CAPE 백분위 (%)")
    ax.set_xlabel("연도")
    return _finish(fig, path)


def fig_regret(reg_top: pd.DataFrame, n_grid, path) -> str:
    fig, ax = plt.subplots(figsize=(7.2, 2.9))
    x = np.arange(len(n_grid))
    ax.plot(x, [reg_top.loc[n, "max regret (%p)"] for n in n_grid], "o-",
            color=CLAY_DEEP, lw=2, ms=5, label="최악의 경우 후회")
    ax.plot(x, [reg_top.loc[n, "mean regret (%p)"] for n in n_grid], "s--",
            color=SLATE, lw=1.8, ms=4.5, label="평균 후회")
    ax.set_xticks(x)
    ax.set_xticklabels([str(n) for n in n_grid])
    ax.set_xlabel("분할 개월 수 N")
    ax.set_ylabel("최선 대비 손실 (%p)")
    ax.legend(frameon=False, fontsize=7.5)
    ax.annotate("최악의 경우 후회는\nN이 길수록 작아진다",
                xy=(len(n_grid) - 1, reg_top.loc[n_grid[-1], "max regret (%p)"]),
                xytext=(1.15, reg_top["max regret (%p)"].max() * 0.44),
                fontsize=7.4, color=CLAY_DEEP, ha="left", va="center",
                arrowprops=dict(arrowstyle="->", color=CLAY_DEEP, lw=1,
                                connectionstyle="arc3,rad=-0.18"))
    ax.margins(x=0.04, y=0.16)
    return _finish(fig, path)


def fig_today(cape_pct: float, spread_pct: float, path) -> str:
    """Two yardsticks, opposite readings."""
    fig, ax = plt.subplots(figsize=(7.2, 1.55))
    bars = [("CAPE 백분위", cape_pct, CLAY_DEEP),
            ("스프레드 백분위", spread_pct, OLIVE)]
    for i, (label, val, color) in enumerate(bars):
        ax.barh(i, 100, color=PAPER_DEEP, height=0.5, zorder=2)
        ax.barh(i, val, color=color, height=0.5, zorder=3)
        ax.annotate(f"{val:.0f}%", xy=(val, i), xytext=(6, 0),
                    textcoords="offset points", va="center", fontsize=9,
                    weight="bold", color=color)
    ax.set_yticks(range(len(bars)))
    ax.set_yticklabels([b[0] for b in bars], fontsize=8.5)
    ax.set_xlim(0, 112)
    ax.set_xticks([0, 25, 50, 75, 100])
    ax.invert_yaxis()
    ax.grid(axis="y", visible=False)
    ax.set_xlabel("역사적 백분위")
    return _finish(fig, path)


def fig_japan(japan: pd.DataFrame, path) -> str:
    df = japan.dropna(subset=["eq_tr_real"])
    idx = (1 + df["eq_tr_real"]).cumprod()
    rel = idx / idx.loc[1989]
    rel = rel[(rel.index >= 1980) & (rel.index <= 2020)]

    fig, ax = plt.subplots(figsize=(7.2, 2.5))
    ax.plot(rel.index, rel.to_numpy(), color=SPECKLE, lw=2)
    ax.axhline(1.0, color=INK, lw=1.0, ls="--")
    ax.axvline(1989, color=CLAY_DEEP, lw=1.2)
    after = rel[rel.index >= 1989]
    ax.fill_between(after.index, after.to_numpy(), 1.0,
                    where=(after.to_numpy() < 1.0), color=CLAY, alpha=0.22, lw=0)
    ax.annotate("1989년 정점", xy=(1989, 1.02), xytext=(-64, 12),
                textcoords="offset points", fontsize=7.5, color=CLAY_DEEP,
                weight="bold")
    ax.annotate("31년 내내 회복 못 함", xy=(2003.5, 0.30), fontsize=8.5,
                color=CLAY_DEEP, ha="center", weight="bold")
    ax.annotate("2020년에도 0.97배", xy=(2020, 0.97), xytext=(-96, -30),
                textcoords="offset points", fontsize=7.5, color=INK,
                arrowprops=dict(arrowstyle="->", color=INK_SOFT, lw=1))
    ax.margins(y=0.14)
    ax.set_ylabel("1989년 = 1.0 (실질)")
    ax.set_xlabel("연도")
    return _finish(fig, path)
