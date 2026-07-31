# -*- coding: utf-8 -*-
"""2권 차트 1/2 — 행동재무학 개념·편향·수학."""
import numpy as np
import matplotlib.pyplot as plt
from style_kit2 import *

OUT = "charts"
NOTE_CONCEPT = "주: 개념을 도식화한 모식도"
NOTE_STUDY = "자료: 본문에 인용된 연구·통계 (부록 참고문헌 참조)"
NOTE_MATH = "주: 수학적 계산 — 가정은 본문 참조"


# 1. 행동 격차 ----------------------------------------------------------------
def behavior_gap():
    labels = ["시장(지수)의\n수익률", "펀드의 수익률\n(비용 차감)", "투자자의 실제\n체감 수익률"]
    vals = [10.0, 9.0, 7.0]
    fig, ax = new_fig(6.5, 2.8)
    bars = ax.bar(labels, vals, color=[S1, S1, S2], width=0.5)
    for b, v in zip(bars, vals):
        ax.text(b.get_x() + b.get_width() / 2, v + 0.25, f"연 {v:.0f}%", ha="center",
                fontsize=9.5, color=INK, fontweight="bold")
    ax.annotate("행동 격차\n(사고팔며 잃는 몫)", (2, 7), xytext=(1.25, 4.2), fontsize=8.5,
                color=TERRA_D, fontweight="bold",
                arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.7))
    ax.set_ylim(0, 12.5); ax.grid(axis="x", visible=False)
    finish(fig, ax, f"{OUT}/behavior_gap.png",
           title="행동 격차(Behavior Gap) — 수익률은 세 번 샌다 (개념 예시)",
           note=NOTE_CONCEPT + ". 수치는 장기 연구들의 전형적 크기를 예시화한 것")


# 2. 전망이론 가치함수 ----------------------------------------------------------
def value_function():
    x = np.linspace(-100, 100, 400)
    a, lam = 0.88, 2.25
    v = np.where(x >= 0, np.abs(x) ** a, -lam * np.abs(x) ** a)
    fig, ax = new_fig(6.5, 3.3)
    ax.plot(x, v, color=S1, lw=2.2)
    ax.axhline(0, color=BASE, lw=0.8); ax.axvline(0, color=BASE, lw=0.8)
    ax.annotate("이득 영역: 곡선이 빠르게 평평해진다\n(같은 +100도 두 번째부터는 덜 기쁘다)",
                (55, 34), xytext=(12, 55), fontsize=8, color=INK2,
                arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.7))
    ax.annotate("손실 영역: 더 가파르다\n(손실의 고통 ≈ 이득 기쁨의 2.25배)",
                (-52, -75), xytext=(-98, -30), fontsize=8, color=NEG,
                arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.7))
    ax.set_xlabel("손익 (기준점 대비)", fontsize=8.5)
    ax.set_ylabel("심리적 가치", fontsize=8.5)
    ax.set_xticks([-100, -50, 0, 50, 100]); ax.set_yticks([])
    finish(fig, ax, f"{OUT}/value_function.png",
           title="전망이론의 가치함수 — 카너먼·트버스키 (1979)",
           note="주: 표준 모수(지수 0.88, 손실계수 2.25)로 그린 곡선. Tversky & Kahneman (1992)")


# 3. 손실회피 비대칭 ------------------------------------------------------------
def loss_aversion():
    fig, ax = new_fig(6.5, 2.6)
    bars = ax.bar(["+100만 원의 기쁨", "-100만 원의 고통"], [1.0, 2.25],
                  color=[S1, NEG], width=0.42)
    for b, v, t in zip(bars, [1.0, 2.25], ["1.0", "약 2.25배"]):
        ax.text(b.get_x() + b.get_width() / 2, v + 0.07, t, ha="center",
                fontsize=10.5, color=INK, fontweight="bold")
    ax.set_ylim(0, 2.8); ax.grid(axis="x", visible=False); ax.set_yticks([])
    finish(fig, ax, f"{OUT}/loss_aversion.png",
           title="같은 금액, 다른 무게 — 손실회피 계수", note=NOTE_STUDY)


# 4. 확률가중함수 ---------------------------------------------------------------
def prob_weighting():
    p = np.linspace(0.001, 0.999, 300)
    g = 0.61
    w = p ** g / ((p ** g + (1 - p) ** g) ** (1 / g))
    fig, ax = new_fig(6.5, 3.0)
    ax.plot(p, w, color=S1, lw=2.2, label="사람이 느끼는 확률")
    ax.plot([0, 1], [0, 1], color=NEUT, lw=1.2, ls="--", label="실제 확률")
    ax.annotate("작은 확률은 과대평가\n(복권·잭팟의 심리)", (0.06, 0.13), xytext=(0.13, 0.42),
                fontsize=8, color=INK2, arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.7))
    ax.annotate("큰 확률은 과소평가\n(‘확실한 것’에 웃돈)", (0.88, 0.76), xytext=(0.52, 0.62),
                fontsize=8, color=INK2, arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.7))
    ax.set_xlabel("실제 확률", fontsize=8.5); ax.set_ylabel("결정에 쓰는 가중치", fontsize=8.5)
    finish(fig, ax, f"{OUT}/prob_weighting.png",
           title="확률을 있는 그대로 느끼지 못한다 — 확률가중함수",
           note="주: Tversky & Kahneman (1992)의 추정 모수(0.61)로 그린 곡선", legend=True, ncol=2)


# 5. 낙폭-회복의 수학 ------------------------------------------------------------
def drawdown_math():
    dd = [-10, -20, -30, -50, -70, -90]
    need = [11, 25, 43, 100, 233, 900]
    labels = [f"{d}%" for d in dd]
    fig, ax = new_fig(6.5, 3.0)
    bars = ax.bar(labels, need, color=[S1, S1, S1, S2, NEG, NEG], width=0.55)
    for b, v in zip(bars, need):
        ax.text(b.get_x() + b.get_width() / 2, v + 22, f"+{v}%", ha="center",
                fontsize=8.5, color=INK, fontweight="bold")
    ax.set_xlabel("입은 손실", fontsize=8.5)
    ax.set_ylabel("원금 회복에 필요한 수익률", fontsize=8.5)
    ax.set_ylim(0, 1020); ax.grid(axis="x", visible=False)
    finish(fig, ax, f"{OUT}/drawdown_math.png",
           title="손실의 비대칭 수학 — 잃기는 쉽고 되찾기는 어렵다", note=NOTE_MATH)


# 6. 처분효과 -------------------------------------------------------------------
def disposition():
    fig, ax = new_fig(6.5, 2.7)
    bars = ax.bar(["이익 난 종목을\n파는 비율 (PGR)", "손실 난 종목을\n파는 비율 (PLR)"],
                  [14.8, 9.8], color=[S2, S1], width=0.42)
    for b, v in zip(bars, [14.8, 9.8]):
        ax.text(b.get_x() + b.get_width() / 2, v + 0.5, f"{v}%", ha="center",
                fontsize=10.5, color=INK, fontweight="bold")
    ax.annotate("이익은 1.5배 더 빨리 실현하고\n손실은 붙들고 버틴다", (0.5, 13.2),
                xytext=(0.62, 15.6), fontsize=8.5, color=TERRA_D, fontweight="bold")
    ax.set_ylim(0, 19); ax.grid(axis="x", visible=False)
    finish(fig, ax, f"{OUT}/disposition.png",
           title="처분효과 — 오데언(1998)의 1만 계좌 실증",
           note="자료: Odean (1998), 미국 증권사 개인계좌 실증 연구")


# 7. 거래가 많을수록 가난해진다 ---------------------------------------------------
def trading_cost():
    labels = ["시장 수익률", "개인투자자 평균", "가장 자주 거래한\n상위 20%"]
    vals = [17.9, 16.4, 11.4]
    fig, ax = new_fig(6.5, 2.8)
    bars = ax.bar(labels, vals, color=[NEUT, S1, NEG], width=0.5)
    for b, v in zip(bars, vals):
        ax.text(b.get_x() + b.get_width() / 2, v + 0.4, f"연 {v}%", ha="center",
                fontsize=9.5, color=INK, fontweight="bold")
    ax.set_ylim(0, 21.5); ax.grid(axis="x", visible=False)
    finish(fig, ax, f"{OUT}/trading_cost.png",
           title="“거래는 당신의 부에 해롭다” — 바버·오데언 (2000)",
           note="자료: Barber & Odean (2000), 미국 6.6만 가구 1991~96년 실증")


# 8. 최고의 며칠을 놓치면 --------------------------------------------------------
def best_days():
    labels = ["계속 보유", "최고 10일\n놓침", "최고 20일\n놓침", "최고 30일\n놓침", "최고 40일\n놓침"]
    vals = [10.0, 7.4, 5.6, 4.0, 2.6]
    fig, ax = new_fig(6.5, 2.9)
    bars = ax.bar(labels, vals, color=[S1, S2, S2, NEG, NEG], width=0.55)
    for b, v in zip(bars, vals):
        ax.text(b.get_x() + b.get_width() / 2, v + 0.25, f"연 {v}%", ha="center",
                fontsize=9, color=INK, fontweight="bold")
    ax.annotate("‘최고의 날’의 다수는\n급락장 한복판에 숨어 있다", (2.5, 8.6), fontsize=8.5,
                color=INK2, ha="center")
    ax.set_ylim(0, 12); ax.grid(axis="x", visible=False)
    finish(fig, ax, f"{OUT}/best_days.png",
           title="시장을 들락거리는 비용 — 30년 투자에서 최고의 날들을 놓친 대가 (개략)",
           note="주: 장기(수십 년) 미국 주식 연구들의 전형적 결과를 개략화. 세부 수치는 기간에 따라 다름")


# 9. 복리의 두 경로 --------------------------------------------------------------
def compound_paths():
    yrs = np.arange(0, 31)
    stay = 100 * 1.10 ** yrs
    gap = 100 * 1.07 ** yrs
    fig, ax = new_fig(6.5, 3.0)
    ax.plot(yrs, stay, color=S1, lw=2.2, label="규율 유지 (연 10%)")
    ax.plot(yrs, gap, color=S2, lw=2.0, label="행동 격차 (연 7%)")
    ax.text(30.4, stay[-1], f"{stay[-1]:,.0f}", fontsize=9, color=S1, va="center", fontweight="bold")
    ax.text(30.4, gap[-1], f"{gap[-1]:,.0f}", fontsize=9, color=S2, va="center", fontweight="bold")
    ax.annotate("30년 뒤 2.3배 차이 —\n연 3%p의 복리 비용", (22, 420), fontsize=8.5, color=INK2)
    ax.set_xlim(0, 36); ax.set_xlabel("경과 연수", fontsize=8.5)
    ax.set_ylabel("100 투자 시 자산", fontsize=8.5)
    finish(fig, ax, f"{OUT}/compound_paths.png",
           title="연 3%p의 행동 비용이 30년 뒤 만드는 것", note=NOTE_MATH, legend=True, ncol=2)


# 10. 심리계좌 -------------------------------------------------------------------
def mental_account():
    fig, ax = new_fig(6.5, 2.9)
    ax.axis("off")
    boxes = [("월급·생활비\n“소중한 돈”", 0.06, S1, "안전 추구"),
             ("보너스·환급금\n“공돈”", 0.31, S2, "쉽게 위험 감수"),
             ("물려받은 돈\n“무거운 돈”", 0.56, S1, "과도한 보수화"),
             ("투자 수익금\n“하우스 머니”", 0.81, NEG, "베팅 대담해짐")]
    for label, x, c, sub in boxes:
        ax.add_patch(plt.Rectangle((x, 0.38), 0.17, 0.42, facecolor=CREAM2,
                                   edgecolor=c, lw=2))
        ax.text(x + 0.085, 0.60, label, ha="center", va="center", fontsize=8.6, color=INK)
        ax.text(x + 0.085, 0.24, sub, ha="center", va="center", fontsize=8, color=c,
                fontweight="bold")
    ax.text(0.5, 0.03, "같은 1만 원인데 — 이름표에 따라 위험 감수 성향이 달라진다",
            ha="center", fontsize=9, color=INK2)
    ax.set_xlim(0, 1); ax.set_ylim(0, 0.95)
    finish(fig, ax, f"{OUT}/mental_account.png",
           title="심리계좌(Mental Accounting) — 돈에 붙는 보이지 않는 이름표", note=NOTE_CONCEPT)


# 11. 앵커링 실험 ----------------------------------------------------------------
def anchoring():
    fig, ax = new_fig(6.5, 2.7)
    bars = ax.bar(["룰렛이 ‘10’에 멈춘 그룹", "룰렛이 ‘65’에 멈춘 그룹"], [25, 45],
                  color=[S1, S2], width=0.42)
    for b, v in zip(bars, [25, 45]):
        ax.text(b.get_x() + b.get_width() / 2, v + 1.3, f"평균 답 {v}%", ha="center",
                fontsize=10, color=INK, fontweight="bold")
    ax.set_ylabel("‘UN에서 아프리카 국가 비율’ 추정", fontsize=8.5)
    ax.set_ylim(0, 56); ax.grid(axis="x", visible=False)
    finish(fig, ax, f"{OUT}/anchoring.png",
           title="무관한 숫자가 판단을 끌고 간다 — 앵커링 룰렛 실험",
           note="자료: Tversky & Kahneman (1974). 매수 단가·전고점이 앵커가 되는 원리와 동일")


# 12. 감정 사이클 ----------------------------------------------------------------
def emotion_cycle():
    x = np.linspace(0, 2 * np.pi, 300)
    y = np.sin(x)
    fig, ax = new_fig(6.5, 3.1)
    ax.plot(x, y, color=S1, lw=2.2)
    ax.axhline(0, color=BASE, lw=0.8)
    pts = [(0.25, "낙관", 1), (1.05, "확신", 1), (np.pi / 2, "환희\n(최대 위험)", 1),
           (2.1, "불안", 1), (2.75, "부정", 1), (3.6, "공포", -1),
           (4.35, "절망", -1), (3 * np.pi / 2, "항복\n(최대 기회)", -1), (5.5, "희망", -1), (6.0, "안도", -1)]
    for px, t, side in pts:
        py = np.sin(px)
        ax.scatter([px], [py], s=22, color=TERRA, zorder=5)
        ax.annotate(t, (px, py), xytext=(0, 14 if side > 0 else -26),
                    textcoords="offset points", ha="center", fontsize=8, color=INK)
    ax.set_ylim(-1.7, 1.7); ax.set_xticks([]); ax.set_yticks([])
    finish(fig, ax, f"{OUT}/emotion_cycle.png",
           title="투자자 감정 사이클 — 위험은 환희의 얼굴로, 기회는 공포의 얼굴로 온다",
           note=NOTE_CONCEPT)


# 13. 군중과 자금 흐름 ------------------------------------------------------------
def herd_flows():
    x = np.linspace(0, 10, 200)
    price = 100 + 30 * np.sin(x * 0.9 - 1.2) + 4 * x
    flows = np.gradient(price)  # 가격 추세를 따라가는 유입 (개념)
    fig, ax = new_fig(6.5, 3.0)
    ax.plot(x, price, color=S1, lw=2.0, label="자산 가격 (개념)")
    ax.bar(x[::10], 60 + flows[::10] * 6, width=0.32, color=S2, alpha=0.75,
           label="개인 자금 유입 (개념)")
    ax.annotate("유입 최대 = 고점 부근", (4.1, 152), xytext=(1.1, 155), fontsize=8.2,
                color=INK2, arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.7))
    ax.annotate("유출 최대 = 저점 부근", (7.6, 92), xytext=(7.0, 63), fontsize=8.2,
                color=INK2, arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.7))
    ax.set_xticks([]); ax.set_yticks([])
    finish(fig, ax, f"{OUT}/herd_flows.png",
           title="군중의 시간표 — 돈은 고점에서 몰려오고 저점에서 떠난다", note=NOTE_CONCEPT,
           legend=True, ncol=2)


# 14. 레버리지 ETF 변동성 잠식 -----------------------------------------------------
def leverage_decay():
    days = 40
    idx = [100.0]; x2 = [100.0]; x3 = [100.0]
    for d in range(days):
        r = 0.05 if d % 2 == 0 else -0.05
        idx.append(idx[-1] * (1 + r))
        x2.append(x2[-1] * (1 + 2 * r))
        x3.append(x3[-1] * (1 + 3 * r))
    t = np.arange(days + 1)
    fig, ax = new_fig(6.5, 3.0)
    ax.plot(t, idx, color=S1, lw=2.0, label=f"기초지수 (종점 {idx[-1]:.0f})")
    ax.plot(t, x2, color=S2, lw=2.0, label=f"2배 레버리지 ({x2[-1]:.0f})")
    ax.plot(t, x3, color=NEG, lw=2.0, label=f"3배 레버리지 ({x3[-1]:.0f})")
    ax.set_xlabel("거래일 (매일 ±5% 반복 가정)", fontsize=8.5)
    ax.set_ylim(30, 115)
    finish(fig, ax, f"{OUT}/leverage_decay.png",
           title="횡보만 해도 녹는다 — 레버리지 ETF의 변동성 잠식", note=NOTE_MATH,
           legend=True, ncol=3)


# 15. 비용의 복리 ----------------------------------------------------------------
def fee_compound():
    yrs = np.arange(0, 31)
    f01 = 100 * 1.069 ** yrs
    f10 = 100 * 1.06 ** yrs
    f20 = 100 * 1.05 ** yrs
    fig, ax = new_fig(6.5, 2.9)
    ax.plot(yrs, f01, color=S1, lw=2.1, label="총보수 0.1% (연 6.9%)")
    ax.plot(yrs, f10, color=S2, lw=2.0, label="총보수 1.0% (연 6.0%)")
    ax.plot(yrs, f20, color=NEG, lw=2.0, label="총보수 2.0% (연 5.0%)")
    for arr, c in [(f01, S1), (f10, S2), (f20, NEG)]:
        ax.text(30.4, arr[-1], f"{arr[-1]:,.0f}", fontsize=8.8, color=c, va="center",
                fontweight="bold")
    ax.set_xlim(0, 35); ax.set_xlabel("경과 연수 (총수익 연 7% 가정)", fontsize=8.5)
    finish(fig, ax, f"{OUT}/fee_compound.png",
           title="수수료도 행동이다 — 비용 1~2%p의 30년 복리 비용", note=NOTE_MATH,
           legend=True, ncol=1)


if __name__ == "__main__":
    import os
    os.makedirs(OUT, exist_ok=True)
    behavior_gap(); value_function(); loss_aversion(); prob_weighting()
    drawdown_math(); disposition(); trading_cost(); best_days(); compound_paths()
    mental_account(); anchoring(); emotion_cycle(); herd_flows()
    leverage_decay(); fee_compound()
    print("book2 part1 done")
