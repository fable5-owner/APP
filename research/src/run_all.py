"""One-command reproduction of the whole study.

    python src/run_all.py

Writes results.md, regenerates every figure, and caches intermediate frames to
data/interim so a re-run is fast.
"""
from __future__ import annotations

import io
import sys
from datetime import datetime

import numpy as np
import pandas as pd

import build_series
import figures
from advantage import advantage_frame
from analysis import (advantage_table, allocation_ladder, cape_bucket_table,
                      crash_shape_table, crra_table, leave_one_out,
                      lookahead_bias, regret_table, start_year_table,
                      static_allocation_control, strategy_comparison,
                      terminal_distribution)
from config import (BOOTSTRAP_BLOCK, BOOTSTRAP_DRAWS, CURRENT_CAPE, HORIZON_MONTHS,
                    INTERIM, N_GRID, ROOT)
from gates import run_all_gates
from krw import (INTEREST_TAX_RATES, build_krw_panel, krw_table,
                 lot_dispersion_check)
from oos import (japan_1989_detail, japan_table, us_split_sample,
                 validate_capd_proxy)
from regression import (breakeven_spread, current_state, horse_race,
                        horse_race_report, predict_today)
from windows import build_windows, wealth_grid

HIGH = "expanding CAPE percentile >= 90"
TOP = (lambda p: p >= 0.90)
UPPER = (lambda p: p >= 0.80)


def md(df: pd.DataFrame, floatfmt: str = ".2f") -> str:
    return df.to_markdown(floatfmt=floatfmt)


def section(buf, title: str, level: int = 2) -> None:
    buf.write(f"\n\n{'#' * level} {title}\n\n")


def main() -> None:
    out = io.StringIO()
    panel = pd.read_parquet(INTERIM / "panel_monthly.parquet")
    japan = pd.read_parquet(INTERIM / "japan_annual.parquet")
    usa_annual = pd.read_parquet(INTERIM / "usa_annual_jst.parquet")

    out.write("# 고 CAPE 구간 분할매수 스케줄 백테스트 — 결과\n\n")
    out.write(f"_생성: {datetime.utcnow():%Y-%m-%d} · "
              f"부트스트랩 {BOOTSTRAP_DRAWS}회, 평균 블록 {BOOTSTRAP_BLOCK}개월_\n\n")
    out.write("모든 수치는 **실질**(CPI 디플레이트) 기준, 주식 레그는 **총수익**"
              "(배당 재투자), 현금 레그는 **French RF**(1개월 T-bill)다.\n"
              "`DCA advantage` = (N개월 분할 최종부 / 일시투자 최종부 − 1), "
              "단위 %p. 양수면 분할이 유리.\n")

    # -------------------------------------------------------------- summary
    section(out, "요약")
    out.write(
        "**1. 최적 N은? — 표본으로 판별 불가. 점추정은 N=0(일시투자)이다.**\n"
        "무조건부로는 N이 길수록 단조적으로 나빠진다(N=12: −2.05%p, "
        "95% CI [−3.95, −0.11]). 고밸류에이션 조건부에서는 N=36의 점추정이 "
        "+2.2%p로 뒤집히지만 **95% 신뢰구간이 약 ±11%p로 점추정의 5배**이고, "
        "1929년 한 에피소드를 빼면 부호가 바뀐다. 판별 불가다.\n\n"
        "**2. CAPE인가 스프레드인가? — 스프레드다. 이것이 이 프로젝트의 결론이다.**\n"
        "CAPE 백분위 단독 회귀에서는 계수가 양(+0.038, t=1.78)이다. 그러나 "
        "(주식 기대수익 − 무위험금리) 스프레드를 함께 넣으면 CAPE 계수는 "
        "유의성을 잃는 정도가 아니라 **부호가 뒤집혀 −0.071 (t=−2.50)**이 되고, "
        "스프레드는 t=−4.11로 견고하다. R²는 0.019 → 0.109다. 결정적으로, "
        "스프레드 계수는 **평균 시장 이탈기간에 거의 정확히 비례**한다 — "
        "'분할의 비용 = 스프레드 × 이탈기간'이라는 기계적 설명 그대로다. "
        "**대안 가설이 지지된다.**\n\n"
        "**3. 낙폭 트리거는 개선을 주는가? — 평균은 아니고, 분산은 준다.**\n"
        "S2는 전체 표본에서 같은 N보다 낫지만(배치를 앞당기므로), "
        "고밸류에이션 구간에서는 오히려 나쁘다(−1.8%p vs +2.2%p). "
        "승률은 0.34→0.40으로 오르고 최대이익은 171%p→36%p로 잘린다. "
        "평균 개선 장치가 아니라 분산 축소 장치다.\n\n"
        "**4. 유효표본수와 신뢰구간은? — 조건부 주장의 유효표본은 사실상 "
        "에피소드 3개다.**\n"
        "확장윈도우 CAPE 상위 10% 구간의 시작월 417개는 **서로 겹치지 않는 "
        "3개 에피소드**(1928~47, 1961~78, 1993~2026)에서 나온다. "
        "N=36 기준 유효표본 16.7이다. N=3(−0.47%p)만 CI가 0을 제외하고, "
        "**N>=6은 전부 제외하지 못한다.**\n\n"
        "---\n\n"
        "**실질적으로 결정을 좌우하는 것** (판별 불가일 때 무엇을 봐야 하는가):\n\n"
        "| 요인 | 크기 | 방향 |\n|---|---|---|\n"
        "| 스프레드 × 이탈기간 | N=12에서 약 −1.2%p per 1%p 스프레드 | 분할에 불리 |\n"
        "| 현재 스프레드 위치 | 2.24% = 역사적 18분위 (CAPE는 99분위) | 거의 무차별 |\n"
        "| 양도소득세 22% | 전략 간 격차를 약 15% 축소 | 결정을 덜 중요하게 |\n"
        "| 이자소득 종합과세 49.5% | 세후 격차가 세전보다 확대 | 분할에 불리 |\n"
        "| 환노출 (원화 대기 vs 달러 대기) | N=12에서 −2.81%p vs −2.28%p | 원화 대기가 불리 |\n"
        "| 위험예산 (고정혼합 대조군) | γ≥5에서 고정혼합이 분할을 이김 | 분할 대신 비중 축소 |\n")

    # ---------------------------------------------------------------- gates
    section(out, "0. 검증 게이트")
    buf = io.StringIO()
    old, sys.stdout = sys.stdout, buf
    results, all_pass = run_all_gates(panel)
    sys.stdout = old
    out.write("```\n" + buf.getvalue() + "```\n")
    if not all_pass:
        out.write("\n**게이트 실패 — 이후 분석은 무효다.**\n")
        (ROOT / "results.md").write_text(out.getvalue())
        raise SystemExit("gate failure")

    # -------------------------------------------------- horizon invariance
    section(out, "1. 구조적 사실: 분할 효과는 배치 기간 안에서 전부 결정된다")
    ws120 = build_windows(panel, 120)
    ws240 = build_windows(panel, 240)
    common = ws120.starts.intersection(ws240.starts)
    a120 = (wealth_grid(ws120, N_GRID).div(wealth_grid(ws120, N_GRID)[0], axis=0) - 1).loc[common]
    a240 = (wealth_grid(ws240, N_GRID).div(wealth_grid(ws240, N_GRID)[0], axis=0) - 1).loc[common]
    max_gap = float((a120 - a240).abs().to_numpy().max())
    out.write(
        "마지막 회차가 투입되면 모든 전략이 동일한 100% 주식 포트폴리오를 들고 있다. "
        "따라서 두 전략의 최종부 **비율**은 배치 완료 시점에 고정되고, 이후 보유기간과 "
        "무관하다.\n\n"
        f"- 동일 시작월에서 H=120개월과 H=240개월의 advantage 최대 차이: "
        f"**{max_gap:.2e}** (부동소수점 오차)\n"
        "- 따라서 (a) 답은 보유기간에 의존하지 않고, (b) advantage의 유효표본은 "
        "`관측기간/H`가 아니라 **`관측기간/N`**이며, (c) 시작월을 H개월 앞에서 "
        "끊을 이유가 없다.\n\n"
        "**(c)가 결정적이다.** 10년 보유를 전제로 표본을 자르면 시작월이 2016-06에서 "
        "끝나고, 질문의 대상인 2017~2025 고밸류에이션 구간이 통째로 빠진다. "
        "아래 모든 advantage 분석은 잘린 표본이 아니라 전체 표본을 쓴다.\n")

    # ------------------------------------------------------ unconditional
    section(out, "2. 무조건부 결과")
    t_all = advantage_table(panel, label="all starts")
    out.write(md(t_all) + "\n\n")
    out.write("일시투자가 이긴다. N이 길수록 단조적으로 나빠지고, "
              "N=3~12는 신뢰구간이 0을 제외한다. N>=18은 제외하지 못한다.\n")

    section(out, "2.1 시작연도 민감도", 3)
    out.write(md(start_year_table(panel)) + "\n\n")
    out.write("1926/1950/1970/1990 어느 시작점에서도 최적 N은 0이다. "
              "체리피킹으로 뒤집히지 않는다.\n")

    # --------------------------------------------------------- conditional
    section(out, "3. 밸류에이션 조건부 결과")
    out.write(md(cape_bucket_table(panel)) + "\n\n")
    out.write("상위 10% 구간에서만 N=36이 평균적으로 앞선다(+2.2%p). "
              "그런데 바로 아래 80~90% 구간은 N=36이 −7.7%p로 최악이다. "
              "단조적이지 않다는 것은 신호가 아니라 잡음이라는 뜻이다.\n")

    section(out, "3.1 상위 10% 구간 상세 (부트스트랩 CI 포함)", 3)
    t_top = advantage_table(panel, cond=TOP, label=HIGH)
    out.write(md(t_top) + "\n\n")
    out.write("**N=3을 빼면 어떤 N도 신뢰구간이 0을 제외하지 못한다.** "
              "그리고 CI를 제외하는 그 N=3은 분할이 *불리하다*는 쪽이다. "
              "N=36의 점추정 +2.2%p에 대한 95% 구간은 약 [−11.4, +12.1]로 "
              "점추정의 5배 폭이며, 부호조차 결정되지 않는다.\n")

    section(out, "3.2 확장윈도우 vs 전체표본 백분위 (look-ahead 편향의 크기)", 3)
    out.write(md(lookahead_bias(panel)) + "\n\n")
    out.write("표의 값은 `전체표본 백분위 결과 − 확장윈도우 백분위 결과`다. "
              "40~60% 구간에서 최대 +6.3%p, 80~90% 구간에서 +7.8%p가 창출된다. "
              "버킷 소속 자체도 바뀐다 — 상위 10% 구간의 시작월 수가 "
              "417개월에서 173개월로 줄어든다. 문헌에서 흔한 이 편향은 "
              "실제 효과 크기(수 %p)와 같은 자릿수다.\n")

    section(out, "3.3 에피소드 leave-one-out", 3)
    out.write("**전체 시작월**\n\n" + md(leave_one_out(panel)) + "\n\n")
    out.write("**고밸류에이션(>=80분위) 시작월만**\n\n"
              + md(leave_one_out(panel, cond=UPPER)) + "\n\n")
    out.write("고밸류에이션 부분표본에서 최적 N은 전체·ex-1929·ex-2000·ex-2008에서 "
              "모두 0이지만 ex-2020에서 36으로 바뀐다. "
              "단일 에피소드로 뒤집히는 결론은 결론이 아니다.\n")

    section(out, "3.4 후회 행렬과 minimax", 3)
    r_all, r_top = regret_table(panel), regret_table(panel, cond=TOP)
    out.write("**전체 시작월**\n\n" + md(r_all) + "\n\n")
    out.write(f"minimax N = **{r_all.attrs['minimax N']}**, "
              f"mean-regret 최소 N = **{r_all.attrs['minimean N']}**\n\n")
    out.write("**상위 10% 밸류에이션**\n\n" + md(r_top) + "\n\n")
    out.write(f"minimax N = **{r_top.attrs['minimax N']}**, "
              f"mean-regret 최소 N = **{r_top.attrs['minimean N']}**\n\n")
    out.write("여기서 평균과 최악값이 갈린다. 평균은 일시투자, "
              "최대후회 기준은 N=36이다(최대후회 171%p → 29%p). "
              "이 둘은 서로 다른 질문에 대한 답이며 어느 쪽도 틀리지 않았다.\n")

    section(out, "3.5 크래시 모양별 (사후 조건부, 실행 불가)", 3)
    ct, eps = crash_shape_table(panel)
    out.write(md(ct) + "\n\n")
    out.write("**탐지된 실질 총수익 기준 20% 이상 낙폭 에피소드**\n\n")
    out.write(md(eps.assign(depth=lambda d: d["depth"] * 100)) + "\n\n")
    out.write("가설이 정확히 확인된다. 느린 하락(>30개월)에서는 N=36이 +35%p, "
              "빠른 V자에서는 −9.5%p다. 이 둘이 상쇄되어 평균이 0 근처로 "
              "뭉개진다. **다만 이 표는 미래를 알아야 쓸 수 있다.**\n")

    section(out, "3.6 CRRA 확실성등가", 3)
    for cond, lab in [(None, "전체 시작월"), (TOP, HIGH)]:
        t = crra_table(panel, cond=cond)
        out.write(f"**{lab}** (H={HORIZON_MONTHS}개월, n={t.attrs['n_windows']}, "
                  f"{t.attrs['span']})\n\n" + md(t, ".3f") + "\n\n")
    out.write("주의: CRRA는 실제 보유기간이 필요하므로 H=120개월을 쓴다. "
              "그 결과 시작월이 2016-06에서 끊기고, **일시투자에 가장 유리했던 "
              "2017~2025 구간이 빠진다.** 아래 통제를 반드시 함께 보라.\n")

    section(out, "3.7 결정적 통제: 이건 타이밍 문제인가, 위험예산 문제인가", 3)
    for cond, lab in [(None, "전체 시작월"), (TOP, HIGH)]:
        t = static_allocation_control(panel, cond=cond)
        out.write(f"**{lab}** (n={t.attrs['n_windows']}, {t.attrs['span']})\n\n"
                  + md(t, ".3f") + "\n\n")
    out.write("N개월 분할은 기간의 일부를 저위험으로 보낸다. 위험회피적 기준이 "
              "이를 선호하는 것은 당연하며, 그것은 타이밍에 대한 진술이 아니라 "
              "**위험예산에 대한 진술**이다. 올바른 대조군은 같은 평균 주식비중을 "
              "가진 고정혼합이다.\n\n"
              "고밸류에이션 구간에서 N=36의 평균 우위(+2.2%p)는 같은 평균비중(85%) "
              "고정혼합 대비로는 사라지고, γ=5·γ=10에서는 **고정혼합이 이긴다**. "
              "위험을 줄이고 싶다면 배치를 늦추는 것보다 주식비중을 영구적으로 "
              "낮추는 편이 낫다.\n")

    section(out, "3.8 주식비중 사다리 — 실제로 큰 레버", 3)
    for cond, lab in [(None, "전체 시작월"), (TOP, HIGH)]:
        t = allocation_ladder(panel, cond=cond)
        out.write(f"**{lab}** (n={t.attrs['n_windows']}, 유효표본 "
                  f"{t.attrs['eff_n']}, {t.attrs['span']})\n\n"
                  + md(t, ".3f") + "\n\n")
    out.write("1.0 대비 배수, 10년 실질, 매월 재조정. 평균은 주식비중에 단조 "
              "증가하지만 **확실성등가는 그렇지 않다** — γ=5에서 최대는 70%이고, "
              "γ=10에서 100% 주식의 확실성등가는 1을 밑돈다. 분할 개월 수와 달리 "
              "이 표의 방향은 부호가 뒤집히지 않는다.\n")

    section(out, "3.9 최종부의 분포 — 평균이 아니라 꼬리", 3)
    for cond, lab in [(None, "전체 시작월"), (TOP, HIGH)]:
        t = terminal_distribution(panel, cond=cond)
        out.write(f"**{lab}** (n={t.attrs['n_windows']}, 유효표본 "
                  f"{t.attrs['eff_n']})\n\n" + md(t, ".3f") + "\n\n")
    out.write("조건부 표들이 보고하는 것은 스케줄 간 평균 *차이*다. 이 표는 각 "
              "스케줄이 실제로 마주하는 결과의 폭이다. 고 CAPE 진입의 10년 실질 "
              "손실 확률은 일시불 29.7%, N=36에서도 23.3%로 남는다 — 분할은 "
              "위험을 제거하지 않는다.\n")

    # ---------------------------------------------------------- strategies
    section(out, "4. 전략 S0~S4 비교")
    for cond, lab in [(None, "전체 시작월"), (TOP, HIGH)]:
        out.write(f"**{lab}**\n\n" + md(strategy_comparison(panel, cond=cond)) + "\n\n")
    out.write(
        "**S2(낙폭 가속)** — 전체 표본에서는 같은 N의 단순 균등분할보다 낫다"
        "(N=36: −4.9%p vs −5.5%p). 배치를 앞당기기 때문이며, 이 논리를 끝까지 "
        "밀면 N=0이다. 그러나 고밸류에이션 구간에서는 **오히려 나쁘다** "
        "(N=36: −1.8%p vs +2.2%p). 트리거가 1930~31년처럼 −10%/−20%/−30%를 "
        "차례로 뚫고 계속 내려가는 국면에서 잔여 현금을 너무 일찍 소진하기 "
        "때문이다. 대신 승률은 0.34 → 0.40으로 오르고 최대이익은 171%p → 36%p로 "
        "잘린다. S2는 평균을 개선하는 장치가 아니라 **분산을 줄이는 장치**다.\n\n"
        "**S3(밸류에이션 대기)** — 반례로서 의도대로 실패한다. 모든 임계값에서, "
        "고밸류에이션 부분표본에서도 음수다(−2.7 ~ −8.2%p). 중앙값은 −15%p로 "
        "더 나쁘다.\n\n"
        "**S4(밸류평균법)** — S1과 구분되지 않으며 약간 더 나쁘다.\n")

    # ------------------------------------------------------------ horserace
    section(out, "5. 회귀 경마 — CAPE인가 스프레드인가")
    for n in (12, 24):
        res = horse_race(panel, n=n)
        out.write(f"**N={n}** (Newey-West lag={HORIZON_MONTHS}, "
                  f"n={int(res['table'].iloc[0]['n obs'])})\n\n")
        out.write(md(res["table"], ".4f") + "\n\n")
    out.write("**요약 (E[equity] 정의 2가지 × N 2가지)**\n\n")
    out.write(md(horse_race_report(panel), ".3f") + "\n\n")
    res12 = horse_race(panel, n=12)
    out.write("**공선성 진단**\n\n" + md(res12["corr"], ".3f") + "\n\n")
    out.write(md(res12["vif"].to_frame(), ".2f") + "\n\n")
    out.write(
        "결과는 명확하다. CAPE 백분위 단독으로는 계수가 **양**이지만 t는 "
        "1.8~2.1로 약하다. 스프레드를 함께 넣으면 CAPE 계수는 유의성을 잃는 정도가 "
        "아니라 **부호가 뒤집혀 음(t≈−2.5)이 되고**, 스프레드는 t≈−4.1로 견고하게 "
        "살아남는다. R²는 0.019 → 0.109로 5배 이상 커진다.\n\n"
        "게다가 스프레드 계수는 **평균 시장 이탈기간에 거의 정확히 비례한다** — "
        "N=12에서 −1.19, N=24에서 −2.08로 배수가 1.75, 이탈기간 배수 2.09와 "
        "가깝다. 이는 '분할의 비용 = 스프레드 × 이탈기간'이라는 기계적 설명과 "
        "일치한다. **가설 2가 지지된다: CAPE는 스프레드를 통해서만 작용한다.**\n")

    # ------------------------------------------------------- out of sample
    section(out, "6. 표본외 검증")
    section(out, "6.1 미국 분할표본 (1926~1990 선택 → 1990~2026 평가)", 3)
    split = us_split_sample(panel)
    rows = []
    for label, v in split["unconditional"].items():
        rows.append({"subset": label, "obs": v["obs"], "span": v["span"],
                     "effective N": v["effective N"], "best N": v["best N"],
                     **{f"N={k}": val for k, val in v["mean"].items()}})
    out.write("**무조건부**\n\n" + md(pd.DataFrame(rows).set_index("subset")) + "\n\n")
    rows = []
    for label, v in split["high_cape"].items():
        if v is None:
            continue
        rows.append({"subset": f"high-CAPE {label}-sample", "obs": v["obs"],
                     "span": v["span"], "effective N": v["effective N"],
                     "best N": v["best N"],
                     **{f"N={k}": val for k, val in v["mean"].items()}})
    out.write("**고밸류에이션(>=80분위) 상태에서 규칙 선택 후 적용**\n\n"
              + md(pd.DataFrame(rows).set_index("subset")) + "\n\n")
    out.write("1990년 이전 데이터로 '고 CAPE면 N=36'을 고르면 표본내 +13.6%p다. "
              "그 규칙을 1990년 이후에 적용하면 **−5.6%p**다. "
              "같은 데이터로 N을 고르고 평가하는 것이 왜 금지인지 보여주는 수치다.\n")

    section(out, "6.2 일본 — 순수 표본외", 3)
    proxy = validate_capd_proxy(usa_annual, panel)
    out.write(f"JST에는 이익 데이터가 없어 CAPE 대신 **CAPD**"
              f"(실질가격 / 10년평균 실질배당)를 쓴다. 두 지표가 모두 존재하는 "
              f"미국에서 검증: 레벨상관 {proxy['level corr']:.3f}, "
              f"순위상관 {proxy['rank corr']:.3f}, 로그상관 {proxy['log corr']:.3f} "
              f"({proxy['span']}, n={proxy['n years']}).\n\n")
    jt, _, _ = japan_table(japan, n_years=(0, 2, 3, 5))
    out.write(md(jt) + "\n\n")
    out.write("**일본은 '고밸류에이션이면 분할' 가설을 지지하지 않는다.** "
              "고평가 상위 5분위에서도 최적은 일시투자다.\n\n")
    out.write("**단 하나의 예외 — 1990년 진입 (1989-12 정점 직후)**\n\n")
    out.write(md(japan_1989_detail(japan, n_years=(0, 2, 3, 5)), ".3f") + "\n\n")
    out.write("이 한 사례에서는 3년 분할이 일시투자를 크게 앞선다. "
              "미국 표본에는 이런 케이스가 없다 — 이것이 생존편향의 크기다.\n")

    # ------------------------------------------------------------------ KRW
    section(out, "7. 원화 투자자 오버레이 (100억원)")
    krw = build_krw_panel(panel)
    t = krw_table(krw, horizon=HORIZON_MONTHS)
    out.write(f"USD 현금 레그, 이자소득세 미적용 "
              f"(n={t.attrs['n_windows']}, {t.attrs['span']})\n\n")
    out.write(md(t, ".3f") + "\n\n")
    out.write("양도소득세 22%는 전략 간 격차를 **약 15% 줄인다**(damping ≈ 0.85). "
              "세금은 이 결정을 덜 중요하게 만든다.\n\n")
    for lab, rate in INTEREST_TAX_RATES.items():
        t2 = krw_table(krw, horizon=HORIZON_MONTHS, interest_tax=rate)
        out.write(f"**이자소득세 {lab} 적용**\n\n"
                  + md(t2[["pre-tax adv (%p)", "post-tax adv (%p)",
                           "mean interest tax (억원)",
                           "P(beat lump, post-tax)"]], ".3f") + "\n\n")
    out.write("100억원 규모면 미투자분 이자는 금융소득종합과세 대상이다. "
              "최고구간(49.5%)을 적용하면 세후 격차가 세전보다 **더 벌어진다** — "
              "현금 레그의 세후 수익률이 깎이면서 분할의 비용이 커지기 때문이다.\n\n")
    t3 = krw_table(krw, horizon=HORIZON_MONTHS, cash_currency="KRW")
    out.write("**원화로 대기하다 매수 시점에 환전하는 경우**\n\n"
              + md(t3[["pre-tax adv (%p)", "post-tax adv (%p)",
                       "P(beat lump, post-tax)"]], ".3f") + "\n\n")
    out.write("원화 대기가 달러 대기보다 불리하다 (N=12: −2.81%p vs −2.28%p).\n\n")
    out.write("**취득단가 로트 분산 효과**\n\n"
              + md(lot_dispersion_check(krw), ".3f") + "\n\n")
    out.write("만기에 전량 매도하면 총 취득가액은 로트 구성과 무관하게 총 투입액이므로 "
              "**로트 분산 자체는 세금을 바꾸지 않는다** — 실효세율은 세 경우 모두 "
              "정확히 22%다. 분할이 세금을 덜 내는 이유는 단지 이익이 적기 때문이다. "
              "로트 분산이 실제로 작동하려면 분할 매도로 연 250만원 공제를 여러 번 "
              "써야 한다.\n")

    # ------------------------------------------------------ current decision
    section(out, "8. 지금 이 결정에 적용하면")
    st = current_state(panel)
    out.write(
        f"| 항목 | 값 | 역사적 위치 |\n|---|---|---|\n"
        f"| CAPE ({st['as_of']}) | {st['cape']:.2f} | 확장윈도우 백분위 "
        f"**{st['cape_pct']:.1f}%** |\n"
        f"| 이익수익률 1/CAPE | {st['earnings_yield']:.2f}% | |\n"
        f"| 기대인플레 (10년 추세) | {st['inflation_expected']:.2f}% | |\n"
        f"| 무위험 명목 | {st['rf_nominal']:.2f}% | |\n"
        f"| 무위험 실질 | {st['rf_real']:.2f}% | |\n"
        f"| **스프레드 (1/CAPE − 실질무위험)** | **{st['spread']:.2f}%** | "
        f"백분위 **{st['spread_pct']:.0f}%** |\n\n")
    out.write(
        "**이 표가 프로젝트 전체의 요약이다.** CAPE는 99분위인데 스프레드는 "
        f"{st['spread_pct']:.0f}분위다. 실질 현금금리가 {st['rf_real']:.2f}%로 "
        "거의 0이기 때문에, 낮은 이익수익률이 낮은 현금수익률로 상쇄된다. "
        "두 지표가 정반대를 가리키고 있고, 5절의 경마는 **스프레드 쪽이 옳다**고 "
        "말한다.\n\n")

    pred = predict_today(panel)
    out.write("회귀모형(CAPE 백분위 + 스프레드)에 현재 상태를 넣은 예측:\n\n")
    out.write(md(pred, ".2f") + "\n\n")
    be = breakeven_spread(panel, 12)
    out.write(
        f"- 모든 N의 예측값이 −0.2 ~ −1.3%p 구간에 몰려 있다. "
        f"**N=12(−{abs(float(pred.loc[12,'predicted adv (%p)'])):.2f}%p)와 "
        f"N=18(−{abs(float(pred.loc[18,'predicted adv (%p)'])):.2f}%p)의 차이는 "
        f"{abs(float(pred.loc[12,'predicted adv (%p)']) - float(pred.loc[18,'predicted adv (%p)'])):.2f}%p로, "
        f"평균에 대한 신뢰구간 폭(±2~3%p)의 수십분의 1이고 예측구간 폭(±17~20%p)의 "
        f"수백분의 1이다. 이 둘은 구분되지 않는다.**\n"
        f"- 현재 CAPE 백분위에서 N=12의 손익분기 스프레드는 **{be:.2f}%**다. "
        f"현재 스프레드는 {st['spread']:.2f}%로 그보다 아주 약간 높을 뿐이다. "
        f"즉 지금은 일시투자 쪽이지만 **거의 무차별점**에 있다.\n"
        f"- 스프레드가 {be:.2f}% 아래로 내려가면(주가가 더 오르거나 현금금리가 "
        f"오르면) 모형은 분할 쪽으로 넘어간다. 이것이 이 결론을 뒤집는 "
        f"관측가능한 조건이다.\n")

    # -------------------------------------------------------------- figures
    section(out, "9. 그림")
    for path in figures.make_all(panel, japan):
        name = path.split("/")[-1]
        out.write(f"![{name}](figures/{name})\n\n")

    (ROOT / "results.md").write_text(out.getvalue())
    print(f"wrote {ROOT / 'results.md'}")


if __name__ == "__main__":
    if "--rebuild-data" in sys.argv:
        build_series.main()
    main()
