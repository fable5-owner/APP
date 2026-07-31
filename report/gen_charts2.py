# -*- coding: utf-8 -*-
"""차트 생성 2/2 — 실적·AI/집중도·기술·심리·역사·리스크·시나리오 파트."""
import numpy as np
import matplotlib.pyplot as plt
from style_kit import *

OUT = "charts"
NOTE_APPROX = "주: 공개 통계의 주요 지점을 이어 그린 개략 추이. 자료: 부록 '데이터 출처' 참조 (2026.7.31 기준)"
NOTE_SRC = "자료: 부록 '데이터 출처' 참조 (2026.7.31 기준)"
NOTE_SCEN = "주: 본 보고서의 가정에 따른 예시 시나리오이며 예측이 아님"


# 15. EPS 증가율 ---------------------------------------------------------------
def eps_growth():
    yrs = ["2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026E"]
    vals = [1, -14, 48, 5, 2, 10, 13, 24]
    fig, ax = new_fig(6.5, 2.9)
    colors = [POS if v >= 0 else NEG for v in vals]
    bars = ax.bar(yrs, vals, color=colors, width=0.6)
    bars[-1].set_color(S2)
    for b, v in zip(bars, vals):
        ax.text(b.get_x() + b.get_width() / 2, v + (1.2 if v >= 0 else -3.6),
                f"{v:+d}%", ha="center", fontsize=7.8, color=INK2)
    ax.axhline(0, color=BASE, lw=0.8)
    ax.annotate("침체 직후 반등기 외에는\n전례가 드문 증가율", (7, 24), xytext=(4.6, 38),
                fontsize=8, color=INK2,
                arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.set_ylim(-22, 56); ax.grid(axis="x", visible=False)
    finish(fig, ax, f"{OUT}/eps_growth.png",
           title="S&P 500 주당순이익(EPS) 증가율 — 2026년 +24% 전망", note=NOTE_APPROX)


# 16. 2분기 어닝시즌 ------------------------------------------------------------
def q2_earnings():
    labels = ["매그니피센트 7\n(시즌 전 전망)", "나머지 493개\n(시즌 전 전망)",
              "S&P 500 블렌디드\n(집계 진행 중)"]
    vals = [31.1, 22.8, 37.9]
    colors = [S1, S1, S2]
    fig, ax = new_fig(6.5, 2.6)
    bars = ax.barh(labels, vals, color=colors, height=0.52)
    for b, v in zip(bars, vals):
        ax.text(v + 0.7, b.get_y() + b.get_height() / 2, f"+{v}%", va="center",
                fontsize=9, color=INK, fontweight="bold")
    ax.invert_yaxis()
    ax.set_xlim(0, 46); ax.grid(axis="y", visible=False)
    ax.set_xticks([0, 10, 20, 30, 40])
    ax.set_xticklabels(["0%", "10%", "20%", "30%", "40%"])
    finish(fig, ax, f"{OUT}/q2_earnings.png",
           title="2026년 2분기 순이익 증가율(전년 대비) — 어닝비트 86%", note=NOTE_SRC)


# 17. 하이퍼스케일러 CAPEX ------------------------------------------------------
def capex():
    yrs = ["2023", "2024", "2025", "2026E"]
    vals = [155, 230, 412, 725]
    fig, ax = new_fig(6.5, 2.8)
    bars = ax.bar(yrs, vals, color=[S1, S1, S1, S2], width=0.55)
    for b, v in zip(bars, vals):
        ax.text(b.get_x() + b.get_width() / 2, v + 14, f"${v}B", ha="center",
                fontsize=9, color=INK, fontweight="bold")
    ax.annotate("1년 만에 +76%", (3, 725), xytext=(1.9, 640), fontsize=8.5, color=S2,
                arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.set_ylim(0, 830); ax.grid(axis="x", visible=False)
    finish(fig, ax, f"{OUT}/capex.png",
           title="주요 하이퍼스케일러 5개사 합산 설비투자(CAPEX, 십억 달러)",
           note="주: 2023~24년은 개략치. " + NOTE_SRC)


# 18. 상위 10종목 비중 ----------------------------------------------------------
def top10_weight():
    pts = [(1980, 24), (1985, 20), (1990, 19.5), (1995, 17.5), (2000, 25.5),
           (2005, 20), (2010, 18.7), (2015, 17.8), (2020, 28.9), (2022, 27),
           (2023, 32), (2024, 36.5), (2025, 39), (2026.55, 40)]
    x = np.array([p[0] for p in pts]); y = np.array([p[1] for p in pts])
    xs = np.linspace(x.min(), x.max(), 300); ys = np.interp(xs, x, y)
    fig, ax = new_fig(6.5, 2.9)
    ax.plot(xs, ys, color=S1, lw=1.8)
    ax.scatter([2026.55], [40], s=26, color=S2, zorder=5)
    ax.annotate("약 40% — 사상 최고", (2026.55, 40), xytext=(2013.5, 40.5), fontsize=8.5,
                color=INK2, arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.annotate("닷컴 고점 25.5%", (2000, 25.5), xytext=(1993.5, 31), fontsize=7.5,
                color=INK2, arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.set_ylim(10, 45)
    ax.set_yticks([10, 20, 30, 40])
    ax.set_yticklabels(["10%", "20%", "30%", "40%"])
    finish(fig, ax, f"{OUT}/top10_weight.png",
           title="S&P 500 상위 10종목 시가총액 비중 (1980–2026)", note=NOTE_APPROX)


# 19. 매그니피센트 7 — 시총 vs 이익 비중 ----------------------------------------
def mag7_share():
    cats = ["지수 내 시가총액 비중", "지수 내 순이익 비중"]
    vals = [34, 24]
    fig, ax = new_fig(6.5, 2.2)
    bars = ax.barh(cats, vals, color=[S1, S3], height=0.45)
    for b, v in zip(bars, vals):
        ax.text(v + 0.6, b.get_y() + b.get_height() / 2, f"약 {v}%", va="center",
                fontsize=9.5, color=INK, fontweight="bold")
    ax.invert_yaxis()
    ax.set_xlim(0, 42); ax.grid(axis="y", visible=False)
    ax.set_xticks([0, 10, 20, 30, 40])
    ax.set_xticklabels(["0%", "10%", "20%", "30%", "40%"])
    finish(fig, ax, f"{OUT}/mag7_share.png",
           title="매그니피센트 7 — 시가총액 비중이 이익 비중을 약 10%p 상회 (개략)",
           note="주: 개략치. " + NOTE_SRC)


# 20. VIX ---------------------------------------------------------------------
def vix():
    pts = [(2024.0, 13.5), (2024.3, 14), (2024.58, 38.6), (2024.75, 16.5),
           (2024.95, 17.3), (2025.1, 16), (2025.27, 52.3), (2025.45, 18),
           (2025.7, 15.5), (2025.95, 16.5), (2026.2, 17.5), (2026.4, 16.0),
           (2026.54, 16.6), (2026.57, 20.7)]
    x = np.array([p[0] for p in pts]); y = np.array([p[1] for p in pts])
    xs = np.linspace(x.min(), x.max(), 400); ys = np.interp(xs, x, y)
    fig, ax = new_fig(6.5, 2.9)
    ax.plot(xs, ys, color=S1, lw=1.6)
    ax.axhline(19.5, color=MUTED, lw=0.9, ls="--")
    ax.text(2024.02, 20.3, "장기 평균 ≈ 19.5", fontsize=7.5, color=MUTED)
    ax.scatter([2026.57], [20.7], s=24, color=S2, zorder=5)
    for xx, yy, t, tx, ty in [(2024.58, 38.6, "'24.8 엔캐리 청산", 2024.62, 40),
                              (2025.27, 52.3, "'25.4 관세 쇼크", 2025.32, 50),
                              (2026.57, 20.7, "20.7 (7/29)", 2026.05, 31)]:
        ax.annotate(t, (xx, yy), xytext=(tx, ty), fontsize=7.5, color=INK2,
                    arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.set_ylim(0, 58)
    finish(fig, ax, f"{OUT}/vix.png",
           title="VIX 변동성 지수 (2024–2026) — 7월 말 재차 상승", note=NOTE_APPROX)


# 21. AAII 설문 ----------------------------------------------------------------
def aaii():
    cats = ["강세(Bull)", "중립(Neutral)", "약세(Bear)"]
    vals = [29.6, 28.1, 42.3]
    colors = [S1, NEUT, NEG]
    fig, ax = new_fig(6.5, 2.5)
    bars = ax.bar(cats, vals, color=colors, width=0.5)
    for b, v in zip(bars, vals):
        ax.text(b.get_x() + b.get_width() / 2, v + 1.1, f"{v}%", ha="center",
                fontsize=9.5, color=INK, fontweight="bold")
    ax.annotate("직전 주 44.9% → 29.6%\n2022년 9월 이후 최저", (0, 29.6),
                xytext=(0.62, 40), fontsize=8, color=INK2,
                arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.set_ylim(0, 52); ax.grid(axis="x", visible=False)
    ax.set_yticks([0, 10, 20, 30, 40, 50])
    ax.set_yticklabels(["0%", "10%", "20%", "30%", "40%", "50%"])
    finish(fig, ax, f"{OUT}/aaii.png",
           title="AAII 개인투자자 심리 설문 (2026.7.23 주간)", note=NOTE_SRC)


# 22. 역대 강세장 비교 ----------------------------------------------------------
def bull_markets():
    data = [("1949–56", 267, 86), ("1974–80", 126, 74), ("1982–87", 229, 60),
            ("1987–2000", 582, 148), ("2002–07", 101, 60), ("2009–20", 401, 132),
            ("2020–22", 114, 21), ("2022–현재", 113, 45)]
    labels = [d[0] for d in data]; gains = [d[1] for d in data]
    months = [d[2] for d in data]
    colors = [S1] * 7 + [S2]
    fig, ax = new_fig(6.5, 3.3)
    bars = ax.barh(labels, gains, color=colors, height=0.55)
    for b, g, m in zip(bars, gains, months):
        ax.text(g + 8, b.get_y() + b.get_height() / 2, f"+{g}%  ({m}개월)",
                va="center", fontsize=8, color=INK2)
    ax.invert_yaxis()
    ax.set_xlim(0, 700); ax.grid(axis="y", visible=False)
    finish(fig, ax, f"{OUT}/bull_markets.png",
           title="S&P 500 역대 주요 강세장 — 상승률과 지속 기간", note=NOTE_APPROX)


# 23. 1990년대 후반 유추 --------------------------------------------------------
def analog_90s():
    # 1994.12=100 (S&P 459) / 2022.9=100 (S&P 3,586 월말) — 월별 개략
    m90 = [(0, 100), (6, 118), (12, 134), (18, 146), (24, 161), (30, 187),
           (36, 208), (42, 246), (44, 259), (45, 222), (46, 214), (48, 240),
           (54, 273), (60, 299), (63, 333)]
    mnow = [(0, 100), (3, 107), (6, 115), (9, 120), (12, 133), (15, 147),
            (18, 152), (21, 161), (24, 164), (27, 157), (30, 173), (33, 187),
            (36, 190), (39, 194), (42, 208), (45, 207)]
    fig, ax = new_fig(6.5, 3.1)
    x1 = [p[0] for p in m90]; y1 = [p[1] for p in m90]
    x2 = [p[0] for p in mnow]; y2 = [p[1] for p in mnow]
    xs1 = np.linspace(0, 63, 300); ys1 = np.interp(xs1, x1, y1)
    xs2 = np.linspace(0, 45, 220); ys2 = np.interp(xs2, x2, y2)
    ax.plot(xs1, ys1, color=NEUT, lw=1.7, label="1994.12=100 (닷컴 강세장)")
    ax.plot(xs2, ys2, color=S1, lw=2.1, label="2022.9=100 (현재 강세장)")
    ax.axvline(45, color=MUTED, lw=0.8, ls=":")
    ax.text(45.6, 118, "◀ 현재 시점(45개월차)", fontsize=7.5, color=INK2)
    ax.annotate("'98.8 LTCM 조정 -19%", (45, 222), xytext=(33, 285), fontsize=7.5,
                color=INK2, arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.annotate("2000.3 고점(+233%) 후 붕괴", (63, 333), xytext=(48.5, 322),
                fontsize=7.5, color=INK2)
    ax.set_xlabel("강세장 시작 후 경과 개월", fontsize=8)
    ax.set_ylim(80, 360)
    finish(fig, ax, f"{OUT}/analog_90s.png",
           title="현재 강세장 vs 1990년대 후반 — 시작점=100 지수화", note=NOTE_APPROX,
           legend=True, ncol=2)


# 24. 리스크 매트릭스 -----------------------------------------------------------
def risk_matrix():
    risks = [("인플레 재점화·연준 인상", 4.0, 4.0), ("중동 확전·유가 급등", 3.5, 4.0),
             ("AI 투자 실망·수익화 지연", 3.0, 4.5), ("밸류에이션 되돌림", 3.0, 4.0),
             ("집중도·수급 쏠림", 3.5, 3.4), ("신용 이벤트", 2.0, 4.0),
             ("재정적자·국채 수급", 3.0, 3.4), ("달러 급변동", 2.0, 2.5)]
    fig, ax = new_fig(6.5, 3.6)
    ax.axvspan(3.25, 5, ymin=0.62, color=CRITICAL, alpha=0.07)
    for name, x, y in risks:
        sev = x * y
        c = CRITICAL if sev >= 14 else (SERIOUS if sev >= 10 else WARNING)
        ax.scatter([x], [y], s=170, color=c, alpha=0.85, edgecolor="white",
                   linewidth=1.2, zorder=5)
        ax.annotate(name, (x, y), xytext=(0, 11), textcoords="offset points",
                    ha="center", fontsize=7.6, color=INK)
    ax.set_xlim(1.2, 4.9); ax.set_ylim(1.8, 5.2)
    ax.set_xticks([2, 3, 4]); ax.set_xticklabels(["낮음", "중간", "높음"])
    ax.set_yticks([2, 3, 4, 5]); ax.set_yticklabels(["제한적", "중간", "큼", "매우 큼"])
    ax.set_xlabel("향후 12개월 발생 가능성 (정성 평가)", fontsize=8.5)
    ax.set_ylabel("시장 영향", fontsize=8.5)
    finish(fig, ax, f"{OUT}/risk_matrix.png",
           title="주요 리스크 매트릭스 — 본 보고서의 정성적 평가",
           note="주: 계량 모형이 아닌 정성적 판단이며, 색은 심각도(발생 가능성×영향)를 나타냄")


# 25. 시나리오 팬차트 -----------------------------------------------------------
def scenarios():
    x0, y0 = 0, 7416
    xs = np.linspace(0, 5, 60)
    bull = y0 + (8250 - y0) * (xs / 5)
    base = y0 + (7716 - y0) * (xs / 5)
    bear = y0 + (6400 - y0) * (xs / 5)
    fig, ax = new_fig(6.5, 3.1)
    ax.fill_between(xs, bear, bull, color=S1, alpha=0.08)
    ax.plot(xs, bull, color=S3, lw=1.8)
    ax.plot(xs, base, color=S1, lw=2.2)
    ax.plot(xs, bear, color=NEG, lw=1.8)
    ax.scatter([0], [y0], s=26, color=INK, zorder=6)
    ax.text(0.06, 7480, "현재 7,416", fontsize=8, color=INK)
    ax.text(5.06, 8250, "강세 8,250 (+11%)", fontsize=8.2, color=S3, va="center", fontweight="bold")
    ax.text(5.06, 7716, "기본 7,716 (+4%)", fontsize=8.2, color=S1, va="center", fontweight="bold")
    ax.text(5.06, 6400, "약세 6,400 (-14%)", fontsize=8.2, color=NEG, va="center", fontweight="bold")
    ax.set_xlim(0, 7.6); ax.set_ylim(6100, 8600)
    ax.set_xticks([0, 1, 2, 3, 4, 5])
    ax.set_xticklabels(["7월 말", "8월", "9월", "10월", "11월", "12월"])
    finish(fig, ax, f"{OUT}/scenarios.png",
           title="2026년 연말 시나리오 — 월가 전망 범위(7,000~8,250)를 반영한 예시",
           note=NOTE_SCEN)


# 26. 전략가 목표치 -------------------------------------------------------------
def strategist_targets():
    data = [("야데니 리서치", 8250), ("오펜하이머", 8100), ("씨티", 8100),
            ("22V 리서치", 8060), ("도이치뱅크", 8000), ("골드만삭스", 8000),
            ("모건스탠리", 8000), ("평균(조사기관 전체)", 7716), ("스티펄", 7000)]
    names = [d[0] for d in data]; vals = [d[1] for d in data]
    colors = [S1] * 7 + [S2] + [NEG]
    fig, ax = new_fig(6.5, 3.4)
    bars = ax.barh(names, vals, color=colors, height=0.55)
    for b, v in zip(bars, vals):
        ax.text(v + 25, b.get_y() + b.get_height() / 2, f"{v:,}", va="center",
                fontsize=8, color=INK2)
    ax.axvline(7416, color=INK, lw=1.0, ls="--")
    ax.text(7416, -0.85, "현재 7,416", fontsize=8, color=INK, ha="center")
    ax.invert_yaxis()
    ax.set_xlim(6600, 8600); ax.grid(axis="y", visible=False)
    finish(fig, ax, f"{OUT}/strategist_targets.png",
           title="월가 주요 기관의 2026년 연말 S&P 500 목표치", note=NOTE_SRC)


# 27. CAPE와 향후 10년 수익률 ----------------------------------------------------
def cape_future():
    rng = np.random.default_rng(42)
    cape = np.array([8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
                     24, 25, 26, 27, 28, 30, 32, 34, 36, 38, 40, 44])
    ret = 13.5 - 0.28 * cape + rng.normal(0, 1.6, len(cape))
    fig, ax = new_fig(6.5, 3.0)
    ax.scatter(cape, ret, s=34, color=S1, alpha=0.75, edgecolor="white", lw=0.8)
    coef = np.polyfit(cape, ret, 1)
    xs = np.linspace(6, 46, 50)
    ax.plot(xs, np.polyval(coef, xs), color=INK2, lw=1.3, ls="--")
    ax.axvline(40.3, color=S2, lw=1.2)
    ax.text(40.9, 12.2, "현재 CAPE 40.3", fontsize=8, color=S2)
    ax.axhline(0, color=BASE, lw=0.8)
    ax.set_xlabel("매수 시점의 CAPE (배)", fontsize=8.5)
    ax.set_ylabel("이후 10년 연평균 수익률", fontsize=8.5)
    yt = [-4, 0, 4, 8, 12]
    ax.set_yticks(yt); ax.set_yticklabels([f"{v}%" for v in yt])
    finish(fig, ax, f"{OUT}/cape_future.png",
           title="시작 밸류에이션이 높을수록 이후 10년 수익률은 낮았다 (개념도)",
           note="주: 역사적 관계를 나타낸 모식도(실측 산점도 아님). 학술 연구(Shiller 등)의 정형화된 사실을 도식화")


# 28. 업종별 YTD ---------------------------------------------------------------
def sector_ytd():
    cats = ["에너지", "정보기술", "운송", "자본재", "S&P 500 전체"]
    vals = [32.1, 30.7, 26.3, 25.2, 8.7]
    colors = [S1, S1, S1, S1, S2]
    fig, ax = new_fig(6.5, 2.8)
    bars = ax.barh(cats, vals, color=colors, height=0.52)
    for b, v in zip(bars, vals):
        ax.text(v + 0.5, b.get_y() + b.get_height() / 2, f"+{v}%", va="center",
                fontsize=8.5, color=INK2)
    ax.invert_yaxis()
    ax.set_xlim(0, 38); ax.grid(axis="y", visible=False)
    ax.set_xticks([0, 10, 20, 30])
    ax.set_xticklabels(["0%", "10%", "20%", "30%"])
    finish(fig, ax, f"{OUT}/sector_ytd.png",
           title="2026년 연초 이후 상승률 상위 업종 (7월 말 기준, 개략)",
           note="주: 업종 분류·수치는 집계 기관에 따라 다소 상이. " + NOTE_SRC)


# 29. 연중 최대 낙폭 vs 연간 수익률 ----------------------------------------------
def drawdowns():
    yrs = ["2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022",
           "2023", "2024", "2025", "'26YTD"]
    dd = [-12, -11, -3, -20, -7, -34, -5, -25, -10, -8, -19, -3]
    ret = [-0.7, 9.5, 19.4, -6.2, 28.9, 16.3, 26.9, -19.4, 24.2, 23.3, 16.0, 8.7]
    x = np.arange(len(yrs))
    fig, ax = new_fig(6.5, 3.0)
    ax.bar(x, dd, color=NEG, width=0.55, alpha=0.75, label="연중 최대 낙폭")
    ax.scatter(x, ret, color=S1, s=34, zorder=5, label="연간 수익률")
    for xi, d in zip(x, dd):
        ax.text(xi, d - 2.6, f"{d}", ha="center", fontsize=7, color=NEG)
    ax.axhline(0, color=BASE, lw=0.8)
    ax.set_xticks(x); ax.set_xticklabels(yrs)
    ax.set_ylim(-44, 38); ax.grid(axis="x", visible=False)
    finish(fig, ax, f"{OUT}/drawdowns.png",
           title="해마다 조정은 있었다 — 연중 최대 낙폭(%)과 그 해 수익률(%)",
           note=NOTE_APPROX, legend=True, ncol=2)


# 30. 예시 자산배분 -------------------------------------------------------------
def allocation():
    fig, axes = plt.subplots(1, 3, figsize=(6.5, 2.6))
    profiles = [("보수형", [30, 50, 10, 10]), ("중립형", [55, 30, 10, 5]),
                ("공격형", [75, 15, 8, 2])]
    labels = ["주식", "채권", "대체·금", "현금"]
    colors = [S1, S2, S3, NEUT]
    for ax, (name, vals) in zip(axes, profiles):
        w, _ = ax.pie(vals, colors=colors, startangle=90, counterclock=False,
                      wedgeprops=dict(width=0.42, edgecolor="white", linewidth=1.5))
        ax.text(0, 0, name, ha="center", va="center", fontsize=10, fontweight="bold",
                color=INK)
        for i, (v, lbl) in enumerate(zip(vals, labels)):
            ang = np.deg2rad(90 - 360 * (sum(vals[:i]) + v / 2) / 100)
            r = 0.79
            ax.text(r * np.cos(ang), r * np.sin(ang), f"{v}", ha="center",
                    va="center", fontsize=7.5, color="white", fontweight="bold")
    fig.legend(handles=[plt.Rectangle((0, 0), 1, 1, color=c) for c in colors],
               labels=labels, loc="lower center", ncol=4, frameon=False, fontsize=8)
    fig.suptitle("투자 성향별 자산배분 예시 (%, 특정인 대상 권유 아님)", x=0.02,
                 ha="left", fontsize=10.5, fontweight="bold", color=INK)
    fig.tight_layout(rect=(0, 0.08, 1, 0.9))
    fig.savefig(f"{OUT}/allocation.png", bbox_inches="tight")
    plt.close(fig)
    print("saved", f"{OUT}/allocation.png")


if __name__ == "__main__":
    import os
    os.makedirs(OUT, exist_ok=True)
    eps_growth(); q2_earnings(); capex(); top10_weight(); mag7_share()
    vix(); aaii(); bull_markets(); analog_90s(); risk_matrix()
    scenarios(); strategist_targets(); cape_future(); sector_ytd()
    drawdowns(); allocation()
    print("part 2 done")
