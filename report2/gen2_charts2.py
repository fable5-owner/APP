# -*- coding: utf-8 -*-
"""2권 차트 2/2 — 역사적 사례·시스템 설계."""
import numpy as np
import matplotlib.pyplot as plt
from style_kit2 import *

OUT = "charts"
NOTE_APPROX = "주: 공개 통계의 주요 지점을 이어 그린 개략 추이"
NOTE_CONCEPT = "주: 개념을 도식화한 모식도"
NOTE_STUDY = "자료: 본문에 인용된 연구·통계 (부록 참고문헌 참조)"


# 16. 1929 대공황 ---------------------------------------------------------------
def crash_1929():
    pts = [(1927.0, 200), (1928.0, 300), (1929.7, 381), (1929.85, 230), (1930.3, 294),
           (1930.9, 180), (1931.5, 140), (1932.0, 75), (1932.5, 41), (1933.0, 100)]
    x = np.array([p[0] for p in pts]); y = np.array([p[1] for p in pts])
    xs = np.linspace(x.min(), x.max(), 300); ys = np.interp(xs, x, y)
    fig, ax = new_fig(6.5, 2.9)
    ax.plot(xs, ys, color=S1, lw=1.9)
    ax.annotate("1929.9 고점 381", (1929.7, 381), xytext=(1927.2, 350), fontsize=8,
                color=INK2, arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.annotate("‘반등’에 다시 산 사람들\n(1930년 봄 +48% 랠리)", (1930.3, 294),
                xytext=(1930.7, 330), fontsize=8, color=TERRA_D,
                arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.annotate("1932.7 저점 41\n고점 대비 -89%", (1932.5, 41), xytext=(1931.0, 90),
                fontsize=8, color=NEG, arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.set_ylim(0, 420)
    finish(fig, ax, f"{OUT}/crash_1929.png",
           title="1929~32 다우존스 — 진짜 파산은 폭락이 아니라 ‘반등 매수’에서 났다",
           note=NOTE_APPROX)


# 17. 1987 블랙먼데이 ------------------------------------------------------------
def black_monday():
    days = ["10/13(화)", "10/14(수)", "10/15(목)", "10/16(금)", "10/19(월)", "10/20(화)", "10/21(수)"]
    close = [2508, 2413, 2355, 2247, 1739, 1841, 2028]
    fig, ax = new_fig(6.5, 2.9)
    ax.plot(range(len(days)), close, color=S1, lw=2.0, marker="o", markersize=4)
    ax.scatter([4], [1739], s=40, color=NEG, zorder=5)
    ax.annotate("블랙먼데이\n하루 -22.6%", (4, 1739), xytext=(4.35, 1900), fontsize=8.5,
                color=NEG, fontweight="bold",
                arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.annotate("이틀 뒤 +16% 반등 —\n패닉에 판 사람이 최악의 가격을 받았다", (6, 2028),
                xytext=(2.9, 2350), fontsize=8, color=INK2,
                arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.set_xticks(range(len(days))); ax.set_xticklabels(days, fontsize=7.5)
    ax.set_ylim(1600, 2650)
    finish(fig, ax, f"{OUT}/black_monday.png",
           title="1987년 10월 — 다우존스 종가 흐름", note=NOTE_APPROX)


# 18. 닷컴 나스닥 ---------------------------------------------------------------
def dotcom_nasdaq():
    pts = [(1995, 750), (1996, 1290), (1997, 1570), (1998, 2190), (1999, 4069),
           (2000.2, 5048), (2000.5, 3960), (2000.7, 4200), (2001.0, 2470),
           (2001.7, 1950), (2002.0, 1950), (2002.75, 1114), (2003.0, 1335)]
    x = np.array([p[0] for p in pts]); y = np.array([p[1] for p in pts])
    xs = np.linspace(x.min(), x.max(), 300); ys = np.interp(xs, x, y)
    fig, ax = new_fig(6.5, 2.9)
    ax.plot(xs, ys, color=S1, lw=1.9)
    ax.annotate("2000.3 고점 5,048", (2000.2, 5048), xytext=(1996.4, 4600), fontsize=8,
                color=INK2, arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.annotate("2002.10 저점 1,114 (-78%)\n5,048 회복까지 15년", (2002.75, 1114),
                xytext=(2000.6, 300), fontsize=8, color=NEG,
                arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.set_ylim(0, 5600)
    finish(fig, ax, f"{OUT}/dotcom_nasdaq.png",
           title="1995~2003 나스닥 — ‘새 시대’ 서사의 왕복 여행", note=NOTE_APPROX)


# 19. 게임스톱 ------------------------------------------------------------------
def gme2021():
    pts = [(0, 17), (6, 20), (10, 31), (13, 40), (15, 77), (16, 148), (17, 348),
           (18, 194), (19, 483), (19.5, 325), (20, 194), (23, 90), (26, 50), (30, 40)]
    x = np.array([p[0] for p in pts]); y = np.array([p[1] for p in pts])
    xs = np.linspace(x.min(), x.max(), 300); ys = np.interp(xs, x, y)
    fig, ax = new_fig(6.5, 2.9)
    ax.plot(xs, ys, color=S1, lw=1.9)
    ax.annotate("장중 $483 (1/28)", (19, 483), xytext=(3.5, 430), fontsize=8.5, color=INK2,
                arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.annotate("2주 만에 -90%", (26, 50), xytext=(24.4, 210), fontsize=8.5, color=NEG,
                arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.set_xlabel("2021년 1월 초 이후 거래일", fontsize=8.5)
    ax.set_ylim(0, 540)
    finish(fig, ax, f"{OUT}/gme2021.png",
           title="2021 게임스톱 — 소셜미디어 시대 군중 광기의 교과서", note=NOTE_APPROX)


# 20. 2020 코로나 급락 -----------------------------------------------------------
def covid2020():
    pts = [(0, 3386), (5, 3220), (10, 2954), (14, 3130), (18, 2741), (23, 2237),
           (28, 2626), (35, 2790), (50, 2950), (70, 3100), (100, 3271), (120, 3389)]
    x = np.array([p[0] for p in pts]); y = np.array([p[1] for p in pts])
    xs = np.linspace(x.min(), x.max(), 300); ys = np.interp(xs, x, y)
    fig, ax = new_fig(6.5, 2.9)
    ax.plot(xs, ys, color=S1, lw=1.9)
    ax.scatter([23], [2237], s=36, color=NEG, zorder=5)
    ax.annotate("-34% (23거래일)\n역사상 최속의 약세장", (23, 2237), xytext=(32, 2350),
                fontsize=8.5, color=NEG, arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.annotate("5개월 만에 전고점 회복 —\n‘바닥 확인 후 매수’는 늦었다", (100, 3271),
                xytext=(55, 2700), fontsize=8, color=INK2,
                arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.set_xlabel("2020년 2월 고점 이후 거래일", fontsize=8.5)
    ax.set_ylim(2100, 3550)
    finish(fig, ax, f"{OUT}/covid2020.png",
           title="2020 코로나 급락과 회복 — 공포의 속도, 회복의 속도", note=NOTE_APPROX)


# 21. 2008~09 금융위기 -----------------------------------------------------------
def gfc_2009():
    pts = [(2007.75, 1565), (2008.0, 1380), (2008.4, 1400), (2008.7, 1255),
           (2008.75, 1165), (2008.85, 900), (2008.95, 880), (2009.1, 800),
           (2009.19, 666), (2009.4, 920), (2009.7, 1050), (2010.0, 1115)]
    x = np.array([p[0] for p in pts]); y = np.array([p[1] for p in pts])
    xs = np.linspace(x.min(), x.max(), 300); ys = np.interp(xs, x, y)
    fig, ax = new_fig(6.5, 2.9)
    ax.plot(xs, ys, color=S1, lw=1.9)
    ax.scatter([2009.19], [666], s=36, color=NEG, zorder=5)
    ax.annotate("2009.3.9 — 666 (-57%)\n‘악마의 저점’: 뉴스가 가장 어두웠던 날",
                (2009.19, 666), xytext=(2008.0, 760), fontsize=8.5, color=NEG,
                arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.annotate("저점 후 10개월 +67%", (2010.0, 1115), xytext=(2009.35, 1260), fontsize=8,
                color=INK2, arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.set_ylim(500, 1700)
    finish(fig, ax, f"{OUT}/gfc_2009.png",
           title="2008~09 S&P 500 — 최고의 매수 시점은 최악의 기분이 들던 날", note=NOTE_APPROX)


# 22. 전망 산업의 성적표 ----------------------------------------------------------
def forecast_error():
    cases = ["2008년\n(금융위기)", "2020년\n(팬데믹)", "2023년\n(AI 랠리)"]
    fcst = [11, 4, -1]
    real = [-38, 16, 24]
    x = np.arange(len(cases)); w = 0.34
    fig, ax = new_fig(6.5, 2.9)
    b1 = ax.bar(x - w / 2, fcst, width=w, color=NEUT, label="연초 전략가 평균 전망")
    b2 = ax.bar(x + w / 2, real, width=w, color=S1, label="실제 수익률")
    for b, v in list(zip(b1, fcst)) + list(zip(b2, real)):
        ax.text(b.get_x() + b.get_width() / 2, v + (1.6 if v >= 0 else -4.2),
                f"{v:+d}%", ha="center", fontsize=8.5, color=INK)
    ax.axhline(0, color=BASE, lw=0.8)
    ax.set_xticks(x); ax.set_xticklabels(cases)
    ax.set_ylim(-48, 34); ax.grid(axis="x", visible=False)
    finish(fig, ax, f"{OUT}/forecast_error.png",
           title="전망 산업의 성적표 — 전환점일수록 전망은 반대를 가리켰다 (개략)",
           note="주: 널리 보도된 연초 컨센서스와 실제 S&P 500 가격 수익률의 개략 비교", legend=True, ncol=2)


# 23. 체크리스트 효과 ------------------------------------------------------------
def checklist_effect():
    fig, ax = new_fig(6.5, 2.6)
    bars = ax.bar(["체크리스트 도입 전", "도입 후 (18개월)"], [11, 0], color=[NEG, GOOD],
                  width=0.42)
    ax.text(bars[0].get_x() + 0.21, 11.3, "감염률 11%", ha="center", fontsize=10,
            color=INK, fontweight="bold")
    ax.text(bars[1].get_x() + 0.21, 0.4, "0%에 근접", ha="center", fontsize=10,
            color=GOOD, fontweight="bold")
    ax.set_ylim(0, 14); ax.grid(axis="x", visible=False)
    ax.set_ylabel("중심정맥관 감염률", fontsize=8.5)
    finish(fig, ax, f"{OUT}/checklist_effect.png",
           title="전문가에게도 체크리스트가 필요하다 — 미시간 ICU 실험",
           note="자료: Pronovost 외 (2006), 미시간주 100여 개 ICU. 아툴 가완디 『체크리스트 선언』에서 재조명")


# 24. 자동화 vs 임의 매매 ---------------------------------------------------------
def dca_vs_timing():
    rng = np.random.default_rng(7)
    months = np.arange(0, 121)
    price = 100 * np.cumprod(1 + rng.normal(0.007, 0.04, len(months)))
    fig, ax = new_fig(6.5, 2.9)
    ax.plot(months, price, color=NEUT, lw=1.5, label="자산 가격 (모의 경로)")
    buys_auto = months[::3]
    ax.scatter(buys_auto, np.interp(buys_auto, months, price), s=16, color=S1,
               zorder=5, label="자동 적립 매수 (기계적)")
    peaks = [28, 55, 88, 104]
    ax.scatter(peaks, np.interp(peaks, months, price) * 1.01, s=42, marker="v",
               color=NEG, zorder=6, label="감정 매수 (급등 뒤 몰림)")
    ax.set_xlabel("개월", fontsize=8.5); ax.set_yticks([])
    finish(fig, ax, f"{OUT}/dca_vs_timing.png",
           title="언제 사는가를 없애는 것 — 자동화가 감정을 대체한다", note=NOTE_CONCEPT,
           legend=True, ncol=3)


# 25. 리밸런싱 밴드 --------------------------------------------------------------
def rebalance_band():
    t = np.linspace(0, 10, 200)
    weight = 60 + 7 * np.sin(t * 1.1) + t * 0.9
    fig, ax = new_fig(6.5, 2.8)
    ax.plot(t, weight, color=S1, lw=2.0)
    ax.axhline(60, color=INK2, lw=1.0, ls="--")
    ax.axhspan(55, 65, color=S1, alpha=0.07)
    ax.axhline(65, color=TERRA, lw=1.0); ax.axhline(55, color=TERRA, lw=1.0)
    ax.text(0.15, 66, "상단 밴드 65% — 팔아서 복원", fontsize=8, color=TERRA_D)
    ax.text(0.15, 53.4, "하단 밴드 55% — 사서 복원", fontsize=8, color=TERRA_D)
    ax.text(0.15, 60.6, "목표 60%", fontsize=8, color=INK2)
    cross = t[np.argmax(weight > 65)]
    ax.scatter([cross], [65], s=40, color=TERRA, zorder=5)
    ax.annotate("여기서 ‘판단 없이’ 매도", (cross, 65), xytext=(cross - 3.6, 70.5),
                fontsize=8.2, color=INK, arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.set_ylim(48, 74); ax.set_xticks([]); ax.set_ylabel("주식 비중", fontsize=8.5)
    finish(fig, ax, f"{OUT}/rebalance_band.png",
           title="리밸런싱 밴드 — ‘고점 감지’ 없이 고점에서 팔게 만드는 장치", note=NOTE_CONCEPT)


# 26. 투자 일지 루프 -------------------------------------------------------------
def journal_loop():
    fig, ax = new_fig(6.5, 2.7)
    ax.axis("off")
    steps = [("① 기록\n매매 전에 이유·감정·\n예상 시나리오를 적는다", 0.05),
             ("② 검토\n분기마다 예상과 실제를\n대조한다", 0.38),
             ("③ 수정\n반복되는 오류를 규칙으로\n바꿔 시스템에 넣는다", 0.71)]
    for label, x in steps:
        ax.add_patch(plt.Rectangle((x, 0.25), 0.24, 0.55, facecolor=CREAM2,
                                   edgecolor=TERRA, lw=1.8))
        ax.text(x + 0.12, 0.525, label, ha="center", va="center", fontsize=8.6, color=INK)
    for x in (0.30, 0.63):
        ax.annotate("", xy=(x + 0.07, 0.525), xytext=(x, 0.525),
                    arrowprops=dict(arrowstyle="->", color=INK2, lw=1.6))
    ax.annotate("", xy=(0.17, 0.20), xytext=(0.83, 0.20),
                arrowprops=dict(arrowstyle="->", color=MUTED, lw=1.3,
                                connectionstyle="arc3,rad=0.25"))
    ax.text(0.5, 0.02, "기억은 편집되지만 기록은 편집되지 않는다 — 일지는 사후확신 편향의 백신",
            ha="center", fontsize=8.6, color=INK2)
    ax.set_xlim(0, 1); ax.set_ylim(0, 0.95)
    finish(fig, ax, f"{OUT}/journal_loop.png",
           title="투자 일지의 피드백 루프", note=NOTE_CONCEPT)


# 27. 서학개미 -------------------------------------------------------------------
def korea_overseas():
    yrs = ["2019", "2020", "2021", "2022", "2023", "2024", "2025"]
    vals = [84, 373, 677, 442, 680, 1000, 1150]
    fig, ax = new_fig(6.5, 2.9)
    bars = ax.bar(yrs, vals, color=[S1] * 6 + [S2], width=0.55)
    for b, v in zip(bars, vals):
        ax.text(b.get_x() + b.get_width() / 2, v + 25, f"{v:,}", ha="center",
                fontsize=8.3, color=INK2)
    ax.annotate("2022년: 시장 -19% 해에\n보관액 -35% — 고점 유입·저점 이탈의 흔적",
                (3, 442), xytext=(3.4, 800), fontsize=8, color=TERRA_D,
                arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.6))
    ax.set_ylim(0, 1330); ax.grid(axis="x", visible=False)
    ax.set_ylabel("미국주식 보관금액 (억 달러, 개략)", fontsize=8.5)
    finish(fig, ax, f"{OUT}/korea_overseas.png",
           title="‘서학개미’의 6년 — 한국 개인의 미국주식 보관금액 (개략)",
           note="주: 한국예탁결제원 공표 통계의 주요 지점 개략화 (연말 기준, 2025년은 연중)")


# 28. 21일 프로그램 로드맵 --------------------------------------------------------
def program_21():
    fig, ax = new_fig(6.5, 2.9)
    ax.axis("off")
    weeks = [("1주차 — 진단", "일지 개시 · 계좌 전수조사\n과거 매매 복기 · 편향 자가진단", S1),
             ("2주차 — 설계", "투자정책서(IPS) 작성\n목표 배분·밴드·금지 목록 확정", S2),
             ("3주차 — 자동화", "적립·리밸런싱 자동화 설정\n앱 알림 끄기 · 점검 캘린더 고정", TERRA)]
    for i, (title, body, c) in enumerate(weeks):
        x = 0.03 + i * 0.33
        ax.add_patch(plt.Rectangle((x, 0.22), 0.29, 0.6, facecolor=CREAM2,
                                   edgecolor=c, lw=2))
        ax.text(x + 0.145, 0.72, title, ha="center", fontsize=9.2, color=c, fontweight="bold")
        ax.text(x + 0.145, 0.45, body, ha="center", va="center", fontsize=8, color=INK)
        if i < 2:
            ax.annotate("", xy=(x + 0.325, 0.52), xytext=(x + 0.295, 0.52),
                        arrowprops=dict(arrowstyle="->", color=INK2, lw=1.6))
    ax.text(0.5, 0.05, "습관은 결심이 아니라 환경 설계로 만들어진다 — 상세 과제는 PART XI",
            ha="center", fontsize=8.6, color=INK2)
    ax.set_xlim(0, 1); ax.set_ylim(0, 0.95)
    finish(fig, ax, f"{OUT}/program_21.png",
           title="21일 행동 개조 프로그램 — 3주 로드맵", note=NOTE_CONCEPT)


# 29. 자기진단 레이더 -------------------------------------------------------------
def self_radar():
    cats = ["과신", "손실회피", "군중 추종", "조급함", "정보 과식", "무계획"]
    vals = [4.0, 3.5, 2.5, 4.5, 4.0, 3.0]
    angles = np.linspace(0, 2 * np.pi, len(cats), endpoint=False).tolist()
    vals_c = vals + vals[:1]; angles_c = angles + angles[:1]
    fig = plt.figure(figsize=(6.5, 3.3))
    ax = fig.add_subplot(111, polar=True)
    ax.set_facecolor(SURFACE)
    ax.plot(angles_c, vals_c, color=S2, lw=2.0)
    ax.fill(angles_c, vals_c, color=S2, alpha=0.15)
    ax.set_xticks(angles); ax.set_xticklabels(cats, fontsize=8.5, color=INK)
    ax.set_yticks([1, 2, 3, 4, 5]); ax.set_yticklabels(["1", "2", "3", "4", "5"],
                                                       fontsize=7, color=MUTED)
    ax.set_ylim(0, 5)
    ax.grid(color=GRID); ax.spines["polar"].set_color(BASE)
    fig.suptitle("편향 자가진단 프로필 예시 (5점 척도) — 문항은 부록 C", x=0.02, ha="left",
                 fontsize=10.5, fontweight="bold", color=INK)
    fig.text(0.005, 0.005, "주: 예시 응답의 시각화. 진단 문항과 채점법은 부록 C 참조",
             fontsize=6.5, color=MUTED)
    fig.tight_layout(rect=(0, 0.03, 1, 0.94))
    fig.savefig(f"{OUT}/self_radar.png", bbox_inches="tight")
    plt.close(fig)
    print("saved", f"{OUT}/self_radar.png")


# 30. 후회 최소화 2x2 ------------------------------------------------------------
def regret_matrix():
    fig, ax = new_fig(6.5, 3.0)
    ax.axis("off")
    cells = [("시장 상승 ×\n계획대로 투자", "만족", 0.07, 0.52, GOOD),
             ("시장 하락 ×\n계획대로 투자", "아프지만 —\n계획의 일부", 0.53, 0.52, S1),
             ("시장 상승 ×\n겁먹고 이탈", "가장 큰 후회\n(기회비용 + 자책)", 0.07, 0.08, NEG),
             ("시장 하락 ×\n겁먹고 이탈", "안도 — 그러나\n재진입 시점 문제 발생", 0.53, 0.08, WARNING)]
    for title, body, x, y, c in cells:
        ax.add_patch(plt.Rectangle((x, y), 0.4, 0.38, facecolor=CREAM2, edgecolor=c, lw=2))
        ax.text(x + 0.2, y + 0.29, title, ha="center", fontsize=8.4, color=INK, fontweight="bold")
        ax.text(x + 0.2, y + 0.12, body, ha="center", fontsize=8.2, color=c)
    ax.text(0.5, 0.985, "결과가 아니라 ‘과정’에 후회를 걸어라 — 계획 준수는 어느 칸에서도 변명이 된다",
            ha="center", va="top", fontsize=8.6, color=INK2)
    ax.set_xlim(0, 1); ax.set_ylim(0, 1)
    finish(fig, ax, f"{OUT}/regret_matrix.png",
           title="후회 최소화 프레임 — 네 가지 미래", note=NOTE_CONCEPT)


if __name__ == "__main__":
    import os
    os.makedirs(OUT, exist_ok=True)
    crash_1929(); black_monday(); dotcom_nasdaq(); gme2021(); covid2020()
    gfc_2009(); forecast_error(); checklist_effect(); dca_vs_timing()
    rebalance_band(); journal_loop(); korea_overseas(); program_21()
    self_radar(); regret_matrix()
    print("book2 part2 done")
