# -*- coding: utf-8 -*-
"""2권 스타일 킷 — 미국 에디토리얼 + 웜 크림/테라코타 감성.

차트 데이터 계열은 CVD 검증을 통과한 팔레트(파랑/주황/청록)를 유지하고,
테라코타(#CC785C)·크림(#FAF7EF)은 장식·타이포그래피 전용으로만 쓴다
(크림 표면 기준 재검증: 인접쌍 CVD ΔE 9.2 PASS, 저대비 색은 직접 라벨 병행).
"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager

FONT_DIR = "/usr/share/fonts/truetype/nanum"
for f in ("NanumGothic.ttf", "NanumGothicBold.ttf", "NanumSquareB.ttf",
          "NanumSquareR.ttf", "NanumMyeongjo.ttf", "NanumMyeongjoBold.ttf"):
    font_manager.fontManager.addfont(f"{FONT_DIR}/{f}")

# ---- 데이터 계열 (검증 통과 팔레트 그대로) ----
S1 = "#2a78d6"   # blue
S2 = "#eb6834"   # orange
S3 = "#1baf7a"   # aqua — 3:1 미달, 항상 직접 라벨 병행
POS = "#2a78d6"
NEG = "#e34948"
NEUT = "#b9b2a3"
GOOD = "#0ca30c"
WARNING = "#fab219"
SERIOUS = "#ec835a"
CRITICAL = "#d03b3b"

# ---- 지면·잉크 (웜 크림 테마) ----
CREAM = "#faf7ef"        # 페이지/차트 표면
CREAM2 = "#f2ecdd"       # 짙은 크림 (박스)
TERRA = "#cc785c"        # 테라코타 — 장식 전용
TERRA_D = "#a05a41"      # 짙은 테라코타
INK = "#191919"          # 본문 잉크 (웜 블랙)
INK2 = "#57534a"         # 보조 잉크
MUTED = "#8f8a7c"        # 축·라벨
GRID = "#e4ddcc"         # 헤어라인 그리드
BASE = "#c8c1af"         # 축선
SURFACE = CREAM

plt.rcParams.update({
    "font.family": "NanumGothic",
    "axes.unicode_minus": False,
    "figure.facecolor": SURFACE,
    "axes.facecolor": SURFACE,
    "savefig.facecolor": SURFACE,
    "axes.edgecolor": BASE,
    "axes.linewidth": 0.8,
    "axes.grid": True,
    "grid.color": GRID,
    "grid.linewidth": 0.6,
    "axes.axisbelow": True,
    "xtick.color": MUTED,
    "ytick.color": MUTED,
    "xtick.labelsize": 8,
    "ytick.labelsize": 8,
    "text.color": INK,
    "axes.labelcolor": INK2,
    "axes.titlesize": 10.5,
    "axes.titleweight": "bold",
    "axes.titlecolor": INK,
    "legend.frameon": False,
    "legend.fontsize": 8,
    "lines.linewidth": 2.0,
    "figure.dpi": 200,
    "savefig.dpi": 200,
})


def new_fig(w=6.5, h=2.9):
    fig, ax = plt.subplots(figsize=(w, h))
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    ax.spines["left"].set_color(BASE)
    ax.spines["bottom"].set_color(BASE)
    return fig, ax


def finish(fig, ax, path, title=None, note=None, legend=False, ncol=3):
    if title:
        ax.set_title(title, loc="left", pad=10, fontsize=10.5,
                     fontweight="bold", color=INK)
    if legend:
        ax.legend(loc="upper left", bbox_to_anchor=(0, 1.02), ncol=ncol,
                  handlelength=1.4, columnspacing=1.2, borderaxespad=0)
    if note:
        fig.text(0.005, 0.005, note, fontsize=6.5, color=MUTED, ha="left", va="bottom")
    fig.tight_layout(rect=(0, 0.03 if note else 0, 1, 1))
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)
    print("saved", path)
