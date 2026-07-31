# -*- coding: utf-8 -*-
"""차트 생성 1/2 — 시장 현황·밸류에이션·거시 파트.

주의: 장기 시계열은 공개 통계의 주요 지점(anchor)을 이어 그린 '개략' 곡선이며,
각 차트 하단 주석과 본문 캡션에 그 성격을 명시한다. 2026년 7월 수치는
본 보고서 부록의 출처(웹 검색, 2026-07-31 기준)에서 인용.
"""
import numpy as np
import matplotlib.pyplot as plt
from style_kit import *

OUT = "charts"

NOTE_APPROX = "주: 공개 통계의 주요 지점을 이어 그린 개략 추이. 자료: 부록 '데이터 출처' 참조 (2026.7.31 기준)"
NOTE_SRC = "자료: 부록 '데이터 출처' 참조 (2026.7.31 기준)"


# 1. 2026년 YTD 경로 ---------------------------------------------------------
def spx_2026_ytd():
    anchors = [  # (월.일 눈금 위치, 지수) — 주요 지점 기반
        (1.0, 6820), (1.5, 6760), (2.0, 6905), (2.5, 6860), (3.0, 6950),
        (3.5, 7010), (4.0, 6960), (4.5, 7090), (5.0, 7180), (5.5, 7320),
        (6.05, 7610), (6.4, 7480), (6.8, 7555), (7.05, 7621), (7.55, 7590),
        (7.85, 7408), (7.95, 7416),
    ]
    x = np.array([a[0] for a in anchors]); y = np.array([a[1] for a in anchors])
    xs = np.linspace(x.min(), x.max(), 300)
    ys = np.interp(xs, x, y)
    fig, ax = new_fig(6.5, 3.0)
    ax.plot(xs, ys, color=S1)
    ax.fill_between(xs, ys, 6600, color=S1, alpha=0.06)
    ax.scatter([7.05, 7.95], [7621, 7416], s=28, color=[S2, S1], zorder=5)
    ax.annotate("사상최고치 7,621 (7월 초)", (7.05, 7621), xytext=(5.6, 7660),
                fontsize=8, color=INK2,
                arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.7))
    ax.annotate("7,416 (7/30)\n고점 대비 -2.7%", (7.95, 7416), xytext=(7.0, 7250),
                fontsize=8, color=INK2,
                arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.7))
    ax.set_xticks([1, 2, 3, 4, 5, 6, 7, 8])
    ax.set_xticklabels(["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월"])
    ax.set_ylim(6600, 7750)
    finish(fig, ax, f"{OUT}/spx_2026_ytd.png",
           title="S&P 500 — 2026년 연초 이후 경로 (연초 대비 +8.7%)", note=NOTE_APPROX)


# 2. 장기 추이 (로그) ---------------------------------------------------------
def spx_longterm():
    data = [(1990, 330), (1991, 417), (1992, 436), (1993, 466), (1994, 459),
            (1995, 616), (1996, 741), (1997, 970), (1998, 1229), (1999, 1469),
            (2000, 1320), (2001, 1148), (2002, 880), (2003, 1112), (2004, 1212),
            (2005, 1248), (2006, 1418), (2007, 1468), (2008, 903), (2009, 1115),
            (2010, 1258), (2011, 1258), (2012, 1426), (2013, 1848), (2014, 2059),
            (2015, 2044), (2016, 2239), (2017, 2674), (2018, 2507), (2019, 3231),
            (2020, 3756), (2021, 4766), (2022, 3840), (2023, 4770), (2024, 5882),
            (2025, 6820), (2026.58, 7416)]
    x = [d[0] for d in data]; y = [d[1] for d in data]
    fig, ax = new_fig(6.5, 3.0)
    ax.plot(x, y, color=S1)
    ax.set_yscale("log")
    ax.set_yticks([500, 1000, 2000, 4000, 8000])
    ax.set_yticklabels(["500", "1,000", "2,000", "4,000", "8,000"])
    for yr, v, txt, dy in [(2000, 1320, "닷컴 버블", 1.55), (2008, 903, "금융위기", 0.62),
                           (2020, 3756, "팬데믹", 0.6), (2026.58, 7416, "현재", 1.35)]:
        ax.annotate(txt, (yr, v), xytext=(yr - 1.5, v * dy), fontsize=7.5, color=INK2)
    ax.scatter([2026.58], [7416], s=25, color=S2, zorder=5)
    finish(fig, ax, f"{OUT}/spx_longterm.png",
           title="S&P 500 장기 추이 (1990–2026, 연말 종가·로그축)", note=NOTE_APPROX)


# 3. 2022년 10월 저점 이후 강세장 경로 -----------------------------------------
def bull_path():
    pts = [("'22.10", 3577), ("'22.12", 3840), ("'23.3", 4109), ("'23.6", 4450),
           ("'23.9", 4288), ("'23.12", 4770), ("'24.3", 5254), ("'24.6", 5460),
           ("'24.9", 5762), ("'24.12", 5882), ("'25.3", 5612), ("'25.6", 6205),
           ("'25.9", 6688), ("'25.12", 6820), ("'26.3", 6950), ("'26.6", 7460),
           ("'26.7", 7416)]
    x = np.arange(len(pts)); y = [p[1] for p in pts]
    fig, ax = new_fig(6.5, 3.0)
    ax.plot(x, y, color=S1, marker="o", markersize=3.5)
    ax.annotate("저점 3,577\n(2022.10.12)", (0, 3577), xytext=(0.2, 4300),
                fontsize=7.5, color=INK2,
                arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.7))
    ax.annotate("+107%\n(45개월)", (16, 7416), xytext=(13.8, 6650), fontsize=8,
                color=S1, fontweight="bold")
    ax.annotate("'25.4 관세 쇼크", (12, 5612), xytext=(9.0, 5150), fontsize=7.5,
                color=INK2, arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.7))
    ax.set_xticks(x[::2]); ax.set_xticklabels([pts[i][0] for i in range(0, len(pts), 2)])
    finish(fig, ax, f"{OUT}/bull_path.png",
           title="현재 강세장 경로 — 2022년 10월 저점 이후 (분기말 기준)", note=NOTE_APPROX)


# 4. 연간 수익률 --------------------------------------------------------------
def annual_returns():
    yrs = ["2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022",
           "2023", "2024", "2025", "'26YTD"]
    rets = [-0.7, 9.5, 19.4, -6.2, 28.9, 16.3, 26.9, -19.4, 24.2, 23.3, 16.0, 8.7]
    fig, ax = new_fig(6.5, 2.9)
    colors = [POS if r >= 0 else NEG for r in rets]
    bars = ax.bar(yrs, rets, color=colors, width=0.62)
    for b, r in zip(bars, rets):
        ax.text(b.get_x() + b.get_width() / 2, r + (1.2 if r >= 0 else -2.6),
                f"{r:+.1f}", ha="center", fontsize=7.3, color=INK2)
    ax.axhline(0, color=BASE, lw=0.8)
    ax.set_ylim(-28, 36); ax.grid(axis="x", visible=False)
    finish(fig, ax, f"{OUT}/annual_returns.png",
           title="S&P 500 연간 가격 수익률 (%, 배당 제외)", note=NOTE_SRC)


# 5. CAPE 장기 ----------------------------------------------------------------
def cape_history():
    pts = [(1881, 18.5), (1897, 16), (1901, 25.2), (1907, 12), (1917, 6.4),
           (1921, 5.2), (1929, 32.6), (1932, 5.6), (1937, 22), (1942, 8.5),
           (1949, 10.2), (1956, 18.3), (1966, 24.1), (1974, 8.9), (1982, 6.6),
           (1987, 18.3), (1990, 15.6), (1995, 20.2), (2000, 44.2), (2003, 22.9),
           (2007, 27.3), (2009, 13.3), (2013, 23.3), (2016, 25.7), (2018, 33.3),
           (2020, 24.8), (2021, 38.6), (2022.8, 27.1), (2024, 34.5), (2025, 38.0),
           (2026.55, 40.3)]
    x = np.array([p[0] for p in pts]); y = np.array([p[1] for p in pts])
    xs = np.linspace(x.min(), x.max(), 400); ys = np.interp(xs, x, y)
    fig, ax = new_fig(6.5, 3.1)
    ax.plot(xs, ys, color=S1, lw=1.8)
    ax.axhline(17.5, color=MUTED, lw=0.9, ls="--")
    ax.text(1884, 18.6, "장기 평균 ≈ 17", fontsize=7.5, color=MUTED)
    for xx, yy, t, tx, ty in [(1929, 32.6, "1929\n32.6", 1923, 33.5),
                              (2000, 44.2, "2000\n44.2", 1993, 43),
                              (2021, 38.6, "2021\n38.6", 2008, 39.5),
                              (2026.55, 40.3, "현재\n40.3", 2021.2, 44.5)]:
        ax.annotate(t, (xx, yy), xytext=(tx, ty), fontsize=7.5, color=INK2,
                    arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.scatter([2026.55], [40.3], s=26, color=S2, zorder=5)
    ax.set_ylim(0, 50)
    finish(fig, ax, f"{OUT}/cape_history.png",
           title="실러 CAPE (경기조정 주가수익비율, 1881–2026)", note=NOTE_APPROX)


# 6. 버핏 지표 ----------------------------------------------------------------
def buffett():
    pts = [(1990, 58), (1995, 78), (1998, 130), (2000, 143), (2002, 95),
           (2007, 110), (2009, 57), (2012, 95), (2015, 110), (2018, 130),
           (2020.2, 105), (2021, 202), (2022.8, 150), (2024, 190), (2025, 218),
           (2026.55, 235)]
    x = np.array([p[0] for p in pts]); y = np.array([p[1] for p in pts])
    xs = np.linspace(x.min(), x.max(), 300); ys = np.interp(xs, x, y)
    fig, ax = new_fig(6.5, 3.0)
    ax.plot(xs, ys, color=S1, lw=1.8)
    ax.axhline(200, color=CRITICAL, lw=0.9, ls="--")
    ax.text(1990.5, 204, '버핏: "200% 근접 시 불장난(playing with fire)"',
            fontsize=7.5, color=CRITICAL)
    ax.scatter([2026.55], [235], s=26, color=S2, zorder=5)
    ax.annotate("현재 약 234%\n(사상 최고 영역)", (2026.55, 235), xytext=(2013, 236),
                fontsize=8, color=INK2,
                arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.set_ylim(0, 260)
    ax.set_yticks([50, 100, 150, 200, 250])
    ax.set_yticklabels(["50%", "100%", "150%", "200%", "250%"])
    finish(fig, ax, f"{OUT}/buffett.png",
           title="버핏 지표 — 미국 전체 시가총액 ÷ GDP (1990–2026)", note=NOTE_APPROX)


# 7. 선행 P/E -----------------------------------------------------------------
def forward_pe():
    pts = [(1999, 24.5), (2002, 15.5), (2005, 14.8), (2007, 15.2), (2009, 12.5),
           (2011, 11.5), (2014, 15.8), (2016, 16.5), (2018.9, 14.4), (2020.2, 13.5),
           (2020.7, 22.3), (2021, 21.2), (2022.8, 16.8), (2023, 19.5), (2024, 21.5),
           (2025, 22.0), (2026.55, 20.4)]
    x = np.array([p[0] for p in pts]); y = np.array([p[1] for p in pts])
    xs = np.linspace(x.min(), x.max(), 300); ys = np.interp(xs, x, y)
    fig, ax = new_fig(6.5, 2.9)
    ax.plot(xs, ys, color=S1, lw=1.8)
    ax.axhline(19.0, color=MUTED, lw=0.9, ls="--")
    ax.text(1999.3, 19.5, "최근 10년 평균 19.0배", fontsize=7.5, color=MUTED)
    ax.scatter([2026.55], [20.4], s=26, color=S2, zorder=5)
    ax.annotate("현재 20.4배", (2026.55, 20.4), xytext=(2022.3, 24.2), fontsize=8,
                color=INK2, arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.set_ylim(8, 27)
    finish(fig, ax, f"{OUT}/forward_pe.png",
           title="S&P 500 12개월 선행 P/E (배)", note=NOTE_APPROX)


# 8. 주식 위험프리미엄 ---------------------------------------------------------
def erp():
    pts = [(1999, -1.0), (2000, -2.5), (2002, 1.5), (2007, 1.8), (2009, 4.5),
           (2012, 5.8), (2016, 4.3), (2018, 3.0), (2020, 4.8), (2021, 3.2),
           (2022, 1.8), (2023, 1.0), (2024, 0.3), (2025, 0.1), (2026.55, 0.2)]
    x = np.array([p[0] for p in pts]); y = np.array([p[1] for p in pts])
    xs = np.linspace(x.min(), x.max(), 300); ys = np.interp(xs, x, y)
    fig, ax = new_fig(6.5, 2.9)
    ax.plot(xs, ys, color=S1, lw=1.8)
    ax.fill_between(xs, ys, 0, where=ys < 0, color=NEG, alpha=0.15)
    ax.axhline(0, color=BASE, lw=0.9)
    ax.scatter([2026.55], [0.2], s=26, color=S2, zorder=5)
    ax.annotate("현재 +0.2%p\n(닷컴 이후 최저 수준)", (2026.55, 0.2), xytext=(2017.5, 3.1),
                fontsize=8, color=INK2,
                arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.text(1999.2, -2.2, "2000년: 마이너스", fontsize=7.5, color=NEG)
    ax.set_ylim(-3.2, 6.8)
    ax.set_yticks([-2, 0, 2, 4, 6])
    ax.set_yticklabels(["-2%p", "0", "+2%p", "+4%p", "+6%p"])
    finish(fig, ax, f"{OUT}/erp.png",
           title="주식 위험프리미엄 — 선행 이익수익률(1/PER) 빼기 미 10년물 금리",
           note=NOTE_APPROX)


# 9. 역사적 고점의 CAPE 비교 ---------------------------------------------------
def valuation_peaks():
    labels = ["1901", "1929", "1966", "2000\n닷컴", "2007", "2021", "2026.7\n현재"]
    vals = [25.2, 32.6, 24.1, 44.2, 27.3, 38.6, 40.3]
    colors = [S1] * 6 + [S2]
    fig, ax = new_fig(6.5, 2.9)
    bars = ax.bar(labels, vals, color=colors, width=0.58)
    for b, v in zip(bars, vals):
        ax.text(b.get_x() + b.get_width() / 2, v + 0.8, f"{v}", ha="center",
                fontsize=8, color=INK2)
    ax.axhline(17.5, color=MUTED, lw=0.9, ls="--")
    ax.text(-0.38, 18.6, "장기 평균", fontsize=7.5, color=MUTED)
    ax.set_ylim(0, 50); ax.grid(axis="x", visible=False)
    finish(fig, ax, f"{OUT}/valuation_peaks.png",
           title="주요 시장 고점 국면의 CAPE — 현재는 역대 2번째 수준", note=NOTE_SRC)


# 10. 연방기금금리 경로 --------------------------------------------------------
def fed_funds():
    pts = [(2015, 0.125), (2015.95, 0.375), (2016.95, 0.625), (2017.95, 1.375),
           (2018.95, 2.375), (2019.6, 2.375), (2019.95, 1.625), (2020.2, 0.125),
           (2022.2, 0.125), (2022.5, 0.875), (2022.75, 2.375), (2023.0, 4.375),
           (2023.55, 5.375), (2024.7, 5.375), (2024.72, 4.875), (2024.9, 4.625),
           (2024.95, 4.375), (2025.7, 4.375), (2025.72, 4.125), (2025.8, 3.875),
           (2025.95, 3.625), (2026.58, 3.625)]
    fig, ax = new_fig(6.5, 2.9)
    x = [p[0] for p in pts]; y = [p[1] for p in pts]
    ax.step(x, y, where="post", color=S1, lw=1.9, label="연방기금금리(중간값)")
    ax.plot([2026.58, 2026.75, 2026.95], [3.625, 3.875, 4.125], ls="--", lw=1.6,
            color=S2, label="시장 반영 경로(2회 인상)")
    ax.scatter([2026.58], [3.625], s=24, color=S1, zorder=5)
    ax.annotate("3.50~3.75%\n5회 연속 동결", (2026.58, 3.625), xytext=(2023.9, 2.1),
                fontsize=8, color=INK2,
                arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.set_ylim(0, 6.2)
    ax.set_yticks([0, 1, 2, 3, 4, 5, 6])
    ax.set_yticklabels(["0%", "1%", "2%", "3%", "4%", "5%", "6%"])
    finish(fig, ax, f"{OUT}/fed_funds.png",
           title="연방기금금리 — 인하 사이클 종료 후 '재인상' 논쟁 (2015–2026)",
           note=NOTE_APPROX, legend=True, ncol=2)


# 11. CPI ---------------------------------------------------------------------
def cpi():
    pts = [(2019, 1.8), (2020.3, 0.3), (2020.9, 1.4), (2021.3, 2.6), (2021.9, 5.4),
           (2022.45, 9.1), (2022.95, 6.5), (2023.45, 3.0), (2023.95, 3.4),
           (2024.45, 3.0), (2024.7, 2.4), (2024.95, 2.9), (2025.3, 2.3),
           (2025.7, 3.0), (2025.95, 2.8), (2026.2, 2.9), (2026.5, 3.1)]
    x = np.array([p[0] for p in pts]); y = np.array([p[1] for p in pts])
    xs = np.linspace(x.min(), x.max(), 300); ys = np.interp(xs, x, y)
    fig, ax = new_fig(6.5, 2.9)
    ax.plot(xs, ys, color=S1, lw=1.8)
    ax.axhline(2.0, color=GOOD, lw=0.9, ls="--")
    ax.text(2019.1, 2.15, "연준 목표 2%", fontsize=7.5, color=GOOD)
    ax.annotate("9.1% (2022.6)", (2022.45, 9.1), xytext=(2020.3, 8.3), fontsize=7.5,
                color=INK2, arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.annotate("3% 내외에서 고착\n(5년 넘게 목표 상회)", (2026.5, 3.1),
                xytext=(2024.4, 5.6), fontsize=8, color=INK2,
                arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.scatter([2026.5], [3.1], s=24, color=S2, zorder=5)
    ax.set_ylim(0, 10)
    ax.set_yticks([0, 2, 4, 6, 8, 10])
    ax.set_yticklabels(["0%", "2%", "4%", "6%", "8%", "10%"])
    finish(fig, ax, f"{OUT}/cpi.png",
           title="미국 CPI 전년 대비 상승률 (2019–2026)", note=NOTE_APPROX)


# 12. 미 10년물 금리 -----------------------------------------------------------
def treasury10y():
    pts = [(2020, 1.6), (2020.6, 0.52), (2021, 1.0), (2021.95, 1.5), (2022.5, 3.0),
           (2022.8, 4.2), (2023.3, 3.4), (2023.8, 5.0), (2023.95, 3.9), (2024.3, 4.6),
           (2024.7, 3.6), (2024.95, 4.57), (2025.05, 4.8), (2025.3, 4.2), (2025.7, 4.0),
           (2025.95, 4.2), (2026.3, 4.45), (2026.57, 4.69)]
    x = np.array([p[0] for p in pts]); y = np.array([p[1] for p in pts])
    xs = np.linspace(x.min(), x.max(), 300); ys = np.interp(xs, x, y)
    fig, ax = new_fig(6.5, 2.9)
    ax.plot(xs, ys, color=S1, lw=1.8)
    ax.scatter([2026.57], [4.69], s=24, color=S2, zorder=5)
    ax.annotate("4.69%\n2025년 1월 이후 최고", (2026.57, 4.69), xytext=(2024.6, 5.35),
                fontsize=8, color=INK2,
                arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.set_ylim(0, 6)
    ax.set_yticks([0, 1, 2, 3, 4, 5, 6])
    ax.set_yticklabels(["0%", "1%", "2%", "3%", "4%", "5%", "6%"])
    finish(fig, ax, f"{OUT}/treasury10y.png",
           title="미국 10년 국채금리 (2020–2026)", note=NOTE_APPROX)


# 13. 실업률 ------------------------------------------------------------------
def labor():
    pts = [(2019, 4.0), (2019.9, 3.5), (2020.3, 14.8), (2020.9, 6.7), (2021.9, 3.9),
           (2022.9, 3.5), (2023.3, 3.4), (2023.9, 3.7), (2024.5, 4.1), (2024.95, 4.1),
           (2025.5, 4.2), (2025.95, 4.1), (2026.45, 4.2)]
    x = np.array([p[0] for p in pts]); y = np.array([p[1] for p in pts])
    xs = np.linspace(x.min(), x.max(), 300); ys = np.interp(xs, x, y)
    fig, ax = new_fig(6.5, 2.9)
    ax.plot(xs, ys, color=S1, lw=1.8)
    ax.scatter([2026.45], [4.2], s=24, color=S2, zorder=5)
    ax.annotate("4.2% (2026.6)\n완전고용 부근에서 완만한 냉각", (2026.45, 4.2),
                xytext=(2022.9, 8.5), fontsize=8, color=INK2,
                arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.annotate("14.8%\n(팬데믹)", (2020.3, 14.8), xytext=(2020.8, 12.5), fontsize=7.5,
                color=INK2, arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.set_ylim(0, 16)
    ax.set_yticks([0, 4, 8, 12, 16])
    ax.set_yticklabels(["0%", "4%", "8%", "12%", "16%"])
    finish(fig, ax, f"{OUT}/labor.png",
           title="미국 실업률 (2019–2026)", note=NOTE_APPROX)


# 14. 분기 GDP ----------------------------------------------------------------
def gdp():
    labels = ["'24Q1", "'24Q2", "'24Q3", "'24Q4", "'25Q1", "'25Q2", "'25Q3", "'25Q4",
              "'26Q1", "'26Q2"]
    vals = [1.6, 3.0, 3.1, 2.4, -0.5, 3.8, 2.2, 2.0, 2.1, 1.5]
    approx = [False, False, False, False, False, False, True, True, False, False]
    fig, ax = new_fig(6.5, 2.9)
    colors = [POS if v >= 0 else NEG for v in vals]
    bars = ax.bar(labels, vals, color=colors, width=0.6)
    for b, v, ap in zip(bars, vals, approx):
        if ap:
            b.set_alpha(0.45)
        ax.text(b.get_x() + b.get_width() / 2, v + (0.15 if v >= 0 else -0.42),
                f"{v:+.1f}", ha="center", fontsize=7.5, color=INK2)
    ax.axhline(0, color=BASE, lw=0.8)
    ax.text(5.7, 4.35, "옅은 막대: 개략치", fontsize=7, color=MUTED)
    ax.set_ylim(-1.6, 5.0); ax.grid(axis="x", visible=False)
    finish(fig, ax, f"{OUT}/gdp.png",
           title="미국 실질 GDP 성장률 (전기 대비 연율, %) — 2026년 상반기 감속",
           note=NOTE_APPROX)


if __name__ == "__main__":
    import os
    os.makedirs(OUT, exist_ok=True)
    spx_2026_ytd(); spx_longterm(); bull_path(); annual_returns()
    cape_history(); buffett(); forward_pe(); erp(); valuation_peaks()
    fed_funds(); cpi(); treasury10y(); labor(); gdp()
    print("part 1 done")
