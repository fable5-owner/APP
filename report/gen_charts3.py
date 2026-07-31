# -*- coding: utf-8 -*-
"""차트 생성 3/3 — 보강 섹션용 추가 차트."""
import numpy as np
import matplotlib.pyplot as plt
from style_kit import *

OUT = "charts"
NOTE_SRC = "자료: 부록 '데이터 출처' 참조 (2026.7.31 기준)"


# 31. 과거 정점 이후의 약세장 낙폭 ----------------------------------------------
def peak_drawdowns():
    labels = ["1929\n대공황", "1973\n니프티50·오일", "2000\n닷컴", "2007\n금융위기",
              "2020\n팬데믹", "2022\n인플레 긴축"]
    vals = [-86, -48, -49, -57, -34, -25]
    months = [33, 21, 31, 17, 1.2, 9]
    fig, ax = new_fig(6.5, 3.0)
    bars = ax.bar(labels, vals, color=NEG, width=0.58, alpha=0.85)
    for b, v, m in zip(bars, vals, months):
        ax.text(b.get_x() + b.get_width() / 2, v - 3.5, f"{v}%", ha="center",
                fontsize=8.5, color=NEG, fontweight="bold")
        ax.text(b.get_x() + b.get_width() / 2, 3, f"{m}개월" if m >= 2 else "1개월",
                ha="center", fontsize=7.2, color=INK2)
    ax.axhline(0, color=BASE, lw=0.8)
    ax.set_ylim(-100, 12); ax.grid(axis="x", visible=False)
    ax.set_yticks([-100, -75, -50, -25, 0])
    ax.set_yticklabels(["-100%", "-75%", "-50%", "-25%", "0"])
    finish(fig, ax, f"{OUT}/peak_drawdowns.png",
           title="정점 이후의 대가 — 주요 고점에서 저점까지의 낙폭과 소요 기간",
           note="주: 낙폭은 고점 대비 저점, 기간은 고점에서 저점까지. " + NOTE_SRC)


# 32. 엔비디아 시가총액 이정표 ---------------------------------------------------
def nvda_milestones():
    labels = ["2023.5\n$1조", "2024.2\n$2조", "2024.6\n$3조", "2025.7\n$4조",
              "2025.10\n$5조"]
    vals = [1, 2, 3, 4, 5]
    x = np.arange(len(vals))
    fig, ax = new_fig(6.5, 2.8)
    bars = ax.bar(x, vals, color=[S1, S1, S1, S1, S2], width=0.52)
    for b, v in zip(bars, vals):
        ax.text(b.get_x() + b.get_width() / 2, v + 0.12, f"${v}조", ha="center",
                fontsize=9, color=INK, fontweight="bold")
    ax.set_xticks(x); ax.set_xticklabels(labels, fontsize=7.8)
    ax.annotate("1조 → 5조 달러:\n29개월", (4, 5), xytext=(2.4, 4.4), fontsize=8.5,
                color=INK2, arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.set_ylim(0, 5.9); ax.grid(axis="x", visible=False)
    finish(fig, ax, f"{OUT}/nvda_milestones.png",
           title="엔비디아 시가총액 이정표 — 세계 최초 5조 달러 기업 (2025.10)",
           note=NOTE_SRC)


if __name__ == "__main__":
    peak_drawdowns()
    nvda_milestones()
    print("part 3 done")
