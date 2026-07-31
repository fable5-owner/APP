# -*- coding: utf-8 -*-
"""공용 스타일 킷: 한글 폰트, 색상 팔레트, matplotlib 기본 설정.

색상은 dataviz 검증 팔레트(라이트 모드) 기준:
  categorical  #2a78d6(blue) / #eb6834(orange) / #1baf7a(aqua)  — 인접쌍 CVD ΔE 9.2 PASS
  diverging    blue(#2a78d6) ↔ red(#e34948), 중립 #f0efec
  status       good #0ca30c / warning #fab219 / serious #ec835a / critical #d03b3b
"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager

# ---------------------------------------------------------------- 폰트
FONT_DIR = "/usr/share/fonts/truetype/nanum"
FONT_REG = f"{FONT_DIR}/NanumGothic.ttf"
FONT_BOLD = f"{FONT_DIR}/NanumGothicBold.ttf"
FONT_SQUARE = f"{FONT_DIR}/NanumSquareB.ttf"
FONT_SQUARE_R = f"{FONT_DIR}/NanumSquareR.ttf"
FONT_MYEONGJO = f"{FONT_DIR}/NanumMyeongjo.ttf"
FONT_MYEONGJO_B = f"{FONT_DIR}/NanumMyeongjoBold.ttf"

for p in (FONT_REG, FONT_BOLD, FONT_SQUARE, FONT_SQUARE_R):
    font_manager.fontManager.addfont(p)

# ---------------------------------------------------------------- 색상
S1 = "#2a78d6"   # categorical 1 (blue)
S2 = "#eb6834"   # categorical 2 (orange)
S3 = "#1baf7a"   # categorical 3 (aqua) — 3:1 미달이므로 직접 라벨 병행
POS = "#2a78d6"  # diverging: 상승/긍정
NEG = "#e34948"  # diverging: 하락/부정
NEUT = "#c3c2b7"
GOOD = "#0ca30c"
WARNING = "#fab219"
SERIOUS = "#ec835a"
CRITICAL = "#d03b3b"

INK = "#0b0b0b"        # primary ink
INK2 = "#52514e"       # secondary ink
MUTED = "#898781"      # axis/labels
GRID = "#e1e0d9"       # hairline grid
BASE = "#c3c2b7"       # baseline/axis
SURFACE = "#ffffff"

NAVY = "#0f2a4a"       # 보고서 브랜드 색 (제목·표지)
GOLD = "#c9a227"       # 보고서 포인트 색

SEQ = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"]

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
