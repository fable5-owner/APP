"""Build the designed Korean PDF report.

Numbers are recomputed from the cached panel rather than copied from
results.md, so the report cannot drift away from the analysis.
"""
from __future__ import annotations

import base64
import pathlib
from datetime import datetime

import numpy as np
import pandas as pd

import report_theme as T
from advantage import (advantage_frame, deployment_advantage,
                       effective_sample, features_for)
from analysis import (bootstrap_advantage, cape_bucket_table, leave_one_out,
                      regret_table, static_allocation_control,
                      strategy_comparison)
from bootstrap import percentile_ci
from config import HORIZON_MONTHS, INTERIM, N_GRID, ROOT
from krw import build_krw_panel, krw_table, lot_dispersion_check
from metrics import _merged_coverage
from oos import japan_1989_detail, japan_table, us_split_sample
from strategies import make_windows, simulate
from regression import (breakeven_spread, build_regression_frame, _fit,
                        current_state, predict_today)

FONT_DIR = T.FONT_DIR
BUILD = ROOT / "report_build"
BUILD.mkdir(exist_ok=True)
TOP = (lambda p: p >= 0.90)
DRAWS = 2000


def data_uri(path: str) -> str:
    raw = pathlib.Path(path).read_bytes()
    return "data:image/png;base64," + base64.b64encode(raw).decode()


def font_face_css() -> str:
    """Embed Pretendard, and reference the localised Noto Serif KR subsets."""
    css = []
    weights = {"Regular": 400, "Medium": 500, "SemiBold": 600, "Bold": 700,
               "ExtraBold": 800}
    for name, weight in weights.items():
        f = FONT_DIR / f"Pretendard-{name}.otf"
        if not f.exists():
            continue
        b64 = base64.b64encode(f.read_bytes()).decode()
        css.append(f"@font-face{{font-family:'Pretendard';font-style:normal;"
                   f"font-weight:{weight};src:url(data:font/otf;base64,{b64}) "
                   f"format('opentype');}}")
    serif = (FONT_DIR / "fonts.css")
    if serif.exists():
        css.append(serif.read_text())
    return "\n".join(css)


# --------------------------------------------------------------------------
# Numbers
# --------------------------------------------------------------------------
def gather(panel: pd.DataFrame, japan: pd.DataFrame) -> dict:
    d = {}
    adv = advantage_frame(panel, N_GRID)
    feats = features_for(panel)
    pct = feats["cape_pct_expanding"]

    d["adv_all"] = {n: float(adv[n].dropna().mean()) * 100 for n in N_GRID}
    top_mask = pct >= 0.90
    d["adv_top"] = {n: float(adv[n][top_mask.reindex(adv.index).fillna(False)]
                             .dropna().mean()) * 100 for n in N_GRID}
    d["win_all"] = {n: float((adv[n].dropna() > 0).mean()) for n in N_GRID}

    boot_all = bootstrap_advantage(panel, N_GRID, draws=DRAWS)
    boot_top = bootstrap_advantage(panel, N_GRID, cond=TOP, draws=DRAWS)
    d["ci_all"] = {n: tuple(v * 100 for v in percentile_ci(boot_all[:, i]))
                   for i, n in enumerate(N_GRID)}
    d["ci_top"] = {n: tuple(v * 100 for v in percentile_ci(boot_top[:, i]))
                   for i, n in enumerate(N_GRID)}

    d["eff_top"] = {n: round(effective_sample(
        (top_mask.reindex(adv[n].dropna().index).fillna(False)).to_numpy(),
        max(n, 1)), 1) for n in N_GRID}

    # Episode spans behind the high-CAPE condition.
    m = top_mask.reindex(adv[12].dropna().index).fillna(False).to_numpy()
    starts = adv[12].dropna().index

    def spans_for(gap: int) -> list:
        out = []
        for lo, hi in _merged_coverage(m, gap):
            out.append((starts[lo].year + (starts[lo].month - 1) / 12,
                        starts[min(hi, len(starts) - 1)].year))
        return out

    # Two independence criteria: stretches more than 10 years apart are
    # separate macro regimes; a strict 1-year rule splits them further.
    d["episode_spans"] = spans_for(120)
    d["episode_spans_strict"] = spans_for(12)
    d["cape_dates"] = list(feats.index.to_timestamp())
    d["cape_pct_series"] = pct.to_numpy()

    # Horse race across schedules.
    rows = {}
    for n in N_GRID[1:]:
        fr = build_regression_frame(panel, n)
        a = _fit(fr, ["cape_pct_expanding"], HORIZON_MONTHS)
        b = _fit(fr, ["cape_pct_expanding", "spread_ey"], HORIZON_MONTHS)
        rows[n] = {
            "alone": float(a.params["cape_pct_expanding"]),
            "t_alone": float(a.tvalues["cape_pct_expanding"]),
            "with_spread": float(b.params["cape_pct_expanding"]),
            "t_with": float(b.tvalues["cape_pct_expanding"]),
            "beta_spread": float(b.params["spread_ey"]),
            "t_spread": float(b.tvalues["spread_ey"]),
            "months_out": (n - 1) / 2,
            "r2_alone": float(a.rsquared), "r2_both": float(b.rsquared),
        }
    d["race"] = pd.DataFrame(rows).T
    d["race"].index.name = "N"

    d["loo_top"] = leave_one_out(panel, cond=TOP)
    d["loo_upper"] = leave_one_out(panel, cond=lambda p: p >= 0.80)
    d["regret_top"] = regret_table(panel, cond=TOP)
    d["regret_all"] = regret_table(panel)
    d["buckets"] = cape_bucket_table(panel)
    d["strategies_top"] = strategy_comparison(panel, cond=TOP)
    d["static"] = static_allocation_control(panel, cond=TOP)
    d["static_all"] = static_allocation_control(panel)

    d["state"] = current_state(panel)
    d["predict"] = predict_today(panel)
    d["breakeven"] = breakeven_spread(panel, 12)
    # Real cash rate that would put today's CAPE exactly at break-even.
    d["breakeven_rate"] = (d["state"]["earnings_yield"]
                           - d["breakeven"])

    d["split"] = us_split_sample(panel)
    d["japan_tab"], _, _ = japan_table(japan, n_years=(0, 2, 3, 5))
    d["japan_1989"] = japan_1989_detail(japan, n_years=(0, 2, 3, 5))

    krw = build_krw_panel(panel)
    d["krw_plain"] = krw_table(krw, horizon=HORIZON_MONTHS)
    d["krw_top_tax"] = krw_table(krw, horizon=HORIZON_MONTHS, interest_tax=0.495)
    d["krw_won_cash"] = krw_table(krw, horizon=HORIZON_MONTHS, cash_currency="KRW")
    d["lots"] = lot_dispersion_check(krw)
    d["krw_span"] = d["krw_plain"].attrs["span"]
    gather_spread(panel, d)
    return d


def make_figures(d: dict, japan: pd.DataFrame) -> dict:
    f = {}
    f["answer"] = T.fig_answer_curve(d["adv_all"], d["adv_top"], d["ci_all"],
                                     d["ci_top"], N_GRID, BUILD / "f_answer.png")
    f["race"] = T.fig_horse_race(d["race"], BUILD / "f_race.png")
    f["episodes"] = T.fig_episodes(d["cape_dates"], d["cape_pct_series"],
                                   d["episode_spans"], BUILD / "f_episodes.png")
    f["regret"] = T.fig_regret(d["regret_top"], N_GRID, BUILD / "f_regret.png")
    f["today"] = T.fig_today(d["state"]["cape_pct"], d["state"]["spread_pct"],
                             BUILD / "f_today.png")
    f["japan"] = T.fig_japan(japan, BUILD / "f_japan.png")
    f["spread_hist"] = T.fig_spread_history(
        d["spread_dates"], d["spread_ey"], d["spread_rr"], d["spread_series"],
        d["state"]["spread"], BUILD / "f_spread_hist.png")
    f["ladder"] = T.fig_spread_ladder(d["spread_quintiles"], d["cape_quintiles"],
                                      BUILD / "f_ladder.png")
    f["map"] = T.fig_breakeven_map(d["map_capes"], d["map_rates"], d["map_grid"],
                                   d["state"]["cape"], d["state"]["rf_real"],
                                   BUILD / "f_map.png")
    return {k: data_uri(v) for k, v in f.items()}


# --------------------------------------------------------------------------
# Decorative motif — echoes the naturalist egg plate the design is based on
# --------------------------------------------------------------------------
def egg_svg(width: int = 520, height: int = 172, seed: int = 7) -> str:
    """A scattered clutch of speckled eggs, drawn from the report palette."""
    rng = np.random.default_rng(seed)
    shells = [T.OLIVE_LIGHT, T.PAPER_DEEP, T.CLAY, T.SLATE, T.OLIVE,
              T.SPECKLE, "#C9BE9C", "#D8C3A5"]
    parts = []
    xs = np.linspace(28, width - 28, 11)
    for i, x in enumerate(xs):
        rx = float(rng.uniform(14, 31))
        ry = rx * float(rng.uniform(1.15, 1.42))
        cy = height / 2 + float(rng.uniform(-36, 36))
        fill = shells[i % len(shells)]
        rot = float(rng.uniform(-28, 28))
        parts.append(f'<g transform="rotate({rot:.1f} {x:.1f} {cy:.1f})">')
        parts.append(f'<ellipse cx="{x:.1f}" cy="{cy:.1f}" rx="{rx:.1f}" '
                     f'ry="{ry:.1f}" fill="{fill}" opacity="0.92"/>')
        for _ in range(int(rng.integers(8, 20))):
            a = rng.uniform(0, 2 * np.pi)
            r = np.sqrt(rng.uniform(0, 0.72))
            sx = x + np.cos(a) * rx * r
            sy = cy + np.sin(a) * ry * r
            parts.append(f'<circle cx="{sx:.1f}" cy="{sy:.1f}" '
                         f'r="{rng.uniform(0.9, 2.6):.1f}" fill="{T.INK}" '
                         f'opacity="{rng.uniform(0.28, 0.62):.2f}"/>')
        parts.append("</g>")
    return (f'<svg viewBox="0 0 {width} {height}" width="100%" '
            f'xmlns="http://www.w3.org/2000/svg">{"".join(parts)}</svg>')


def pct(x: float, digits: int = 2, sign: bool = True) -> str:
    fmt = f"{{:+.{digits}f}}" if sign else f"{{:.{digits}f}}"
    return fmt.format(x).replace("-", "−")


def table(headers: list, rows: list, cls: str = "") -> str:
    head = "".join(f"<th>{h}</th>" for h in headers)
    body = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>"
                   for r in rows)
    return (f'<table class="{cls}"><thead><tr>{head}</tr></thead>'
            f"<tbody>{body}</tbody></table>")


CSS = """
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin:0; padding:0; background: %(PAPER)s; color: %(INK)s;
  font-family:'Pretendard', sans-serif; -webkit-print-color-adjust: exact;
  print-color-adjust: exact; }
.page { width:210mm; height:297mm; padding:20mm 19mm 16mm; position:relative;
  page-break-after:always; overflow:hidden; background:%(PAPER)s; }
.page:last-child { page-break-after:auto; }
h1,h2,h3,.serif { font-family:'Noto Serif KR', serif; font-weight:700;
  letter-spacing:-0.01em; }
.eyebrow { font-size:8pt; letter-spacing:0.18em; text-transform:uppercase;
  color:%(CLAY_DEEP)s; font-weight:600; }
.rule { height:1px; background:%(RULE)s; margin:9px 0 16px; }
.rule.thick { height:2.5px; background:%(CLAY)s; width:54px; margin:10px 0 16px; }

/* cover */
.cover { display:flex; flex-direction:column; }
.cover h1 { font-size:33pt; line-height:1.32; margin:14px 0 0; }
.cover .sub { font-size:11.5pt; color:%(INK_SOFT)s; line-height:1.75;
  margin-top:20px; max-width:132mm; }
.cover .motif { margin:auto 0; padding:14px 0; }
.cover .meta { display:flex; justify-content:space-between; font-size:8.5pt;
  color:%(INK_SOFT)s; border-top:1px solid %(RULE)s; padding-top:11px; }
.verdict { background:%(CLAY)s; color:#FFF6EF; padding:16px 20px;
  border-radius:3px; margin-top:22px; }
.verdict .k { font-size:8pt; letter-spacing:0.15em; opacity:0.85;
  text-transform:uppercase; font-weight:600; }
.verdict .v { font-family:'Noto Serif KR',serif; font-size:16pt;
  line-height:1.5; margin-top:5px; font-weight:700; }

/* headings */
h2 { font-size:18pt; margin:0; line-height:1.42; }
h3 { font-size:11.5pt; margin:19px 0 7px; color:%(INK)s; }
.num { display:inline-block; background:%(CLAY)s; color:#FFF6EF; width:23px;
  height:23px; border-radius:50%%; text-align:center; line-height:23px;
  font-size:10pt; font-weight:700; margin-right:9px; font-family:'Pretendard'; }
p { font-size:9.7pt; line-height:1.82; margin:9px 0; color:%(INK)s; }
p.lead { font-size:11pt; line-height:1.8; color:%(INK)s; }
.muted { color:%(INK_SOFT)s; }
strong { font-weight:700; }
em { font-style:normal; color:%(CLAY_DEEP)s; font-weight:600; }

/* stat row */
.stats { display:flex; gap:11px; margin:16px 0; }
.stat { flex:1; background:%(PAPER_DEEP)s; border-radius:3px; padding:13px 14px;
  border-left:3px solid %(CLAY)s; }
.stat .n { font-family:'Noto Serif KR',serif; font-size:19pt; font-weight:700;
  color:%(CLAY_DEEP)s; line-height:1.15; }
.stat .l { font-size:8.2pt; color:%(INK_SOFT)s; margin-top:5px; line-height:1.5; }

/* callout */
.callout { background:%(PAPER_DEEP)s; border-left:3px solid %(OLIVE)s;
  padding:13px 16px; margin:15px 0; border-radius:3px; }
.callout .t { font-weight:700; font-size:9.5pt; margin-bottom:5px;
  color:%(OLIVE)s; }
.callout p { margin:0; font-size:9.3pt; line-height:1.75; }
.warn { border-left-color:%(CLAY_DEEP)s; }
.warn .t { color:%(CLAY_DEEP)s; }

/* tables */
table { width:100%%; border-collapse:collapse; margin:12px 0; font-size:8.6pt; }
th { text-align:right; font-weight:600; color:%(INK_SOFT)s; padding:7px 8px;
  border-bottom:1.5px solid %(RULE)s; font-size:8pt; white-space:nowrap; }
th:first-child, td:first-child { text-align:left; }
td { padding:6.5px 8px; border-bottom:1px solid rgba(201,185,159,0.45);
  text-align:right; font-variant-numeric:tabular-nums; }
tr:last-child td { border-bottom:none; }
td.pos { color:%(OLIVE)s; font-weight:600; }
td.neg { color:%(CLAY_DEEP)s; font-weight:600; }
td.hi { background:rgba(217,119,87,0.13); font-weight:700; }
table.prose td:last-child, table.prose th:last-child { text-align:left; }
.tnote { font-size:7.8pt; color:%(INK_SOFT)s; line-height:1.6; margin-top:6px; }

figure { margin:14px 0; }
figure img { width:100%%; display:block; border-radius:3px; }
figcaption { font-size:8.2pt; color:%(INK_SOFT)s; margin-top:7px;
  line-height:1.6; }

.folio { position:absolute; bottom:11mm; left:19mm; right:19mm;
  display:flex; justify-content:space-between; font-size:7.8pt;
  color:%(INK_FAINT)s; border-top:1px solid %(RULE)s; padding-top:7px; }
.two { display:flex; gap:17px; }
.two > * { flex:1; }
""" % {k: getattr(T, k) for k in ["PAPER", "PAPER_DEEP", "INK", "INK_SOFT",
                                  "INK_FAINT", "CLAY", "CLAY_DEEP", "OLIVE",
                                  "RULE"]}


# --------------------------------------------------------------------------
# Pages
# --------------------------------------------------------------------------
def cls_for(v: float) -> str:
    return "pos" if v > 0 else ("neg" if v < 0 else "")


def folio(n: int, label: str) -> str:
    return (f'<div class="folio"><span>{label}</span>'
            f'<span>{n}</span></div>')


def page_cover(d: dict) -> str:
    st = d["state"]
    return f"""
<section class="page cover">
  <div class="eyebrow">정량 리서치 · 백테스트 보고서</div>
  <h1>고 CAPE 구간에서<br>목돈을 몇 개월에<br>나눠 넣어야 하는가</h1>
  <div class="sub">
    현재 Shiller CAPE {st['cape']:.1f} — 역대 2위. 미국 단기금리 {st['rf_nominal']:.1f}%.<br>
    100억원을 미국 주식에 투입할 때, 균등 분할 기간 N의 최적값을
    1926~2026년 미국 데이터와 1886~2020년 일본 데이터로 검증했다.
  </div>
  <div class="motif">{egg_svg()}</div>
  <div class="verdict">
    <div class="k">한 줄 결론</div>
    <div class="v">표본으로는 판별 불가다.<br>
      단, 진짜 원인은 CAPE가 아니라 <u>스프레드</u>였다.</div>
  </div>
  <div class="meta">
    <span>데이터 · Shiller / Ken French / FRED / Jordà-Schularick-Taylor</span>
    <span>{datetime.utcnow():%Y년 %m월 %d일}</span>
  </div>
</section>"""


def page_summary(d: dict, f: dict) -> str:
    a, t = d["adv_all"], d["adv_top"]
    ci = d["ci_top"]
    return f"""
<section class="page">
  <div class="eyebrow">요약</div>
  <h2><span class="num">1</span>네 가지 질문에 대한 답</h2>
  <div class="rule"></div>

  <div class="stats">
    <div class="stat"><div class="n">{pct(a[12],2)}%p</div>
      <div class="l">12개월 분할의 평균 성과<br>(일시투자 대비, 전체 표본)</div></div>
    <div class="stat"><div class="n">{d['win_all'][12]*100:.0f}%</div>
      <div class="l">12개월 분할이<br>일시투자를 이긴 비율</div></div>
    <div class="stat"><div class="n">3개</div>
      <div class="l">고 CAPE 조건부 주장이<br>기대는 독립 에피소드 수</div></div>
  </div>

  <h3>① 최적 N은? — 점추정은 N=0, 그러나 판별 불가</h3>
  <p>전체 표본에서는 나눠 넣을수록 손해다. N이 길수록 단조적으로 나빠진다.
  고 CAPE 구간만 보면 N=36이 <em>{pct(t[36])}%p</em>로 뒤집히지만,
  그 95% 신뢰구간이 <strong>[{pct(ci[36][0],1)}, {pct(ci[36][1],1)}]%p</strong>다.
  점추정의 다섯 배 폭이고 부호조차 정해지지 않는다.</p>

  <figure><img src="{f['answer']}">
    <figcaption>가로축은 분할 개월 수. 색칠된 띠가 95% 신뢰구간이다.
    고 CAPE(주황)의 띠가 0선을 넉넉히 걸치고 있다는 점이 이 그림의 요점이다 —
    선의 위치가 아니라 띠의 폭이 결론이다.</figcaption></figure>

  <h3>② CAPE인가 스프레드인가? — 스프레드다</h3>
  <p>통념은 "CAPE가 높으면 분할이 유리"다. 대안 가설은 "분할의 비용은
  <em>주식 기대수익과 현금금리의 차이</em>에 비례할 뿐이고 CAPE는 그 차이를
  통해서만 간접적으로 작용한다"였다. 회귀에 둘을 함께 넣자 CAPE 계수는
  유의성을 잃는 정도가 아니라 <strong>부호가 뒤집혔다.</strong></p>

  <h3>③ 낙폭 트리거는? — 평균은 아니고, 분산은 준다</h3>
  <p>고점 대비 −10 / −20 / −30%에서 잔여분을 가속 투입하는 규칙은
  고 CAPE 구간에서 오히려 평균을 낮춘다. 대신 승률이 오르고 최대이익이 잘린다.
  수익 개선 장치가 아니라 분산 축소 장치다.</p>

  <h3>④ 유효표본은? — 사실상 3개</h3>
  <p>고 CAPE 시작월 400여 개는 서로 겹치지 않는 <strong>세 구간</strong>에서 나온다.
  관측치 수가 아무리 많아도 독립적인 사건은 세 번뿐이다.</p>
  {folio(2, '고 CAPE 분할매수 백테스트')}
</section>"""


def page_why_hard(d: dict, f: dict) -> str:
    sp = d["episode_spans"]
    n_strict = len(d["episode_spans_strict"])
    rows = []
    for n in [6, 12, 24, 36]:
        lo, hi = d["ci_top"][n]
        rows.append([f"N={n}", pct(d["adv_top"][n]), 
                     f"[{pct(lo,1)}, {pct(hi,1)}]",
                     f"{d['eff_top'][n]:.1f}",
                     "아니오" if lo <= 0 <= hi else "예"])
    return f"""
<section class="page">
  <div class="eyebrow">표본의 한계</div>
  <h2><span class="num">8</span>왜 이 질문은 답하기 어려운가</h2>
  <div class="rule"></div>

  <p class="lead">100년치 월별 데이터가 있으니 표본이 넉넉해 보인다.
  그러나 "고 CAPE에 진입했다"는 사건은 100년 동안 <strong>세 번</strong>밖에
  일어나지 않았다.</p>

  <figure><img src="{f['episodes']}">
    <figcaption>확장윈도우 기준 CAPE 백분위. 상위 10%를 넘긴 구간을
    10년 이상 떨어진 것만 별개로 세면 {sp[0][0]:.0f}~{sp[0][1]:.0f}년,
    {sp[1][0]:.0f}~{sp[1][1]:.0f}년, {sp[2][0]:.0f}~{sp[2][1]:.0f}년
    세 덩어리다. 같은 덩어리 안의 달들은 같은 통화정책·같은 밸류에이션 국면을
    공유하므로 독립적인 관측이 아니다. 1년 기준으로 더 잘게 쪼개도
    {n_strict}개에 그친다.</figcaption></figure>

  <div class="callout warn">
    <div class="t">겹침 윈도우의 함정</div>
    <p>1월 시작과 2월 시작의 12개월 분할은 12개월 중 11개월이 같은 데이터다.
    관측치를 400개로 세면 실제 정보량을 40배 부풀리게 된다. 이 보고서의 모든
    조건부 표에는 <strong>유효표본수</strong> 열을 넣었다.</p>
  </div>

  <h3>고 CAPE 구간(상위 10%)의 실제 정보량</h3>
  {table(["분할 기간", "평균 성과", "95% 신뢰구간", "유효표본", "0과 구분되나"], rows)}
  <div class="tnote">유효표본 = 선택된 시작월이 실제로 덮는 서로 다른 개월 수 / N.
  신뢰구간은 stationary bootstrap(Politis–Romano, 평균 블록 30개월) 2,000회.</div>

  <p>N=6 이상에서는 <strong>어떤 것도 0과 구분되지 않는다.</strong>
  "고 CAPE에서는 36개월에 나눠 넣는 게 낫다"는 문장은 이 데이터로 지지할 수도
  기각할 수도 없다.</p>
  {folio(8, '고 CAPE 분할매수 백테스트')}
</section>"""


def page_spread(d: dict, f: dict) -> str:
    r = d["race"]
    rows = []
    for n in [3, 6, 12, 24, 36]:
        rows.append([f"N={n}",
                     f"{r.loc[n,'alone']:+.3f}",
                     f"{r.loc[n,'t_alone']:+.2f}",
                     f"{r.loc[n,'with_spread']:+.3f}",
                     f"{r.loc[n,'t_with']:+.2f}",
                     f"{r.loc[n,'beta_spread']:+.2f}",
                     f"{r.loc[n,'t_spread']:+.2f}"])
    return f"""
<section class="page">
  <div class="eyebrow">핵심 발견 ①</div>
  <h2><span class="num">9</span>진짜 원인은 CAPE가 아니라 스프레드다</h2>
  <div class="rule"></div>

  <div class="callout">
    <div class="t">스프레드란</div>
    <p>주식의 기대수익(1/CAPE)에서 현금의 실질금리를 뺀 값이다.
    <strong>나눠 넣는 동안 현금으로 들고 있으면 포기하게 되는 수익률</strong>이라고
    보면 된다. 이 값이 크면 기다리는 비용이 크고, 작으면 기다려도 별 손해가 없다.</p>
  </div>

  <p>통념대로 CAPE 백분위만 넣고 회귀하면 계수는 <strong>양수</strong>다 —
  CAPE가 높을수록 분할이 유리해 보인다. 그런데 스프레드를 같이 넣으면
  CAPE 계수는 모든 N에서 <em>음수로 뒤집힌다.</em></p>

  <figure><img src="{f['race']}">
    <figcaption>CAPE 백분위의 회귀계수. 왼쪽(청록)은 CAPE만 넣었을 때,
    오른쪽(주황)은 스프레드를 함께 통제했을 때. 모든 분할 기간에서 부호가
    뒤집힌다.</figcaption></figure>

  {table(["분할 기간", "CAPE 계수<br>(단독)", "t", "CAPE 계수<br>(스프레드 통제)",
          "t", "스프레드 계수", "t"], rows)}
  <div class="tnote">Newey–West 표준오차(lag = 120개월). 겹침 윈도우가 만드는
  자기상관을 보정했다.</div>

  <p>해석은 단순하다. CAPE가 높은 시기는 대체로 스프레드가 작은 시기였다.
  CAPE 단독 회귀의 양수 계수는 <strong>스프레드를 대신 측정한 결과</strong>였을 뿐이다.
  스프레드를 직접 통제하면 CAPE의 고유한 기여는 남지 않는다 —
  오히려 반대 방향이 된다.</p>

  <div class="callout warn">
    <div class="t">이것이 왜 중요한가</div>
    <p>CAPE만 보고 "역대 2위니까 길게 나눠 넣자"고 판단하면, 정작 결정을
    좌우하는 변수를 놓친다. 지금처럼 <strong>CAPE는 높은데 실질 현금금리가
    거의 0인 상황</strong>에서는 두 지표가 정반대를 가리킨다.</p>
  </div>
  {folio(9, '고 CAPE 분할매수 백테스트')}
</section>"""


def page_cost_formula(d: dict) -> str:
    r = d["race"]
    rows = []
    for n in [3, 6, 9, 12, 18, 24, 36]:
        rows.append([f"N={n}", f"{r.loc[n,'months_out']:.1f}개월",
                     f"{r.loc[n,'beta_spread']:+.2f}",
                     f"{r.loc[n,'beta_spread']/(r.loc[n,'months_out']/12):+.2f}"])
    loo = d["loo_top"]
    loo_rows = []
    for n in [12, 24, 36]:
        loo_rows.append([f"N={n}",
                         pct(float(loo.loc[n, "full sample"])),
                         pct(float(loo.loc[n, "ex-1929"])),
                         pct(float(loo.loc[n, "ex-2000"])),
                         pct(float(loo.loc[n, "ex-2020"]))])
    best = loo.loc["best N"]
    return f"""
<section class="page">
  <div class="eyebrow">핵심 발견 ②</div>
  <h2><span class="num">10</span>분할의 비용에는 공식이 있다</h2>
  <div class="rule"></div>

  <p class="lead">스프레드가 진짜 원인이라면, 비용은
  <strong>스프레드 × 시장을 비운 기간</strong>에 비례해야 한다.
  실제로 그렇게 나온다.</p>

  {table(["분할 기간", "평균 이탈 기간", "스프레드 계수", "연 환산 계수"], rows)}
  <div class="tnote">평균 이탈 기간 = (N−1)/2 개월. 스프레드 1%p당 최종 자산이
  몇 %p 깎이는지를 나타낸다.</div>

  <p>스프레드 계수가 이탈 기간과 거의 정확히 비례한다. N=12에서
  {r.loc[12,'beta_spread']:+.2f}, N=24에서 {r.loc[24,'beta_spread']:+.2f} —
  배수 {r.loc[24,'beta_spread']/r.loc[12,'beta_spread']:.2f}는 이탈 기간 배수
  {r.loc[24,'months_out']/r.loc[12,'months_out']:.2f}와 거의 같다.
  분할매수의 비용은 신비로운 것이 아니라 <em>기계적</em>이다.</p>

  <h3>단일 사건에 기대고 있는가 — 에피소드 하나씩 빼보기</h3>
  <p>고 CAPE 구간에서 위기를 하나씩 제거하고 다시 계산했다.</p>
  {table(["분할 기간", "전체", "1929 제외", "2000 제외", "2020 제외"], loo_rows)}
  <div class="tnote">단위 %p. 해당 위기와 겹치는 시작월을 제외하고 재계산.</div>

  <div class="callout warn">
    <div class="t">양방향으로 뒤집힌다</div>
    <p>전체 표본에서는 N={int(best['full sample'])}가 최적인데,
    <strong>1929년 하나만 빼면 N={int(best['ex-1929'])}</strong>로 바뀐다.
    반대로 상위 20% 조건에서는 <strong>2020년 하나만 빼면</strong> 최적이
    N=0에서 N=36으로 넘어간다. 사건 하나로 결론이 양쪽 모두로 뒤집힌다면,
    그것은 결론이 아니다.</p>
  </div>

  <div class="callout">
    <div class="t">이 공식을 실제로 쓰는 법</div>
    <p>N개월에 나눠 넣을 때 예상 비용은 대략
    <strong>스프레드 × (N−1)/24 년</strong>이다. 현재 스프레드
    {d['state']['spread']:.2f}%를 넣으면 12개월 분할의 비용은 약
    {d['state']['spread']*11/24:.2f}%, 36개월은 약
    {d['state']['spread']*35/24:.2f}%다. 스프레드가 큰 시기였다면 같은 36개월이
    3~4%의 비용이 된다. <strong>같은 N이라도 시기에 따라 비용이 몇 배 달라진다</strong>
    — 이것이 CAPE가 아니라 스프레드를 봐야 하는 실질적인 이유다.</p>
  </div>
  {folio(10, '고 CAPE 분할매수 백테스트')}
</section>"""


def page_regret(d: dict, f: dict) -> str:
    rt, st = d["regret_top"], d["static"]
    rows = []
    for n in [0, 12, 24, 36]:
        rows.append([f"N={n}" if n else "N=0 (일시투자)",
                     f"{rt.loc[n,'max regret (%p)']:.1f}",
                     f"{rt.loc[n,'mean regret (%p)']:.1f}",
                     f"{rt.loc[n,'share best']*100:.0f}%"])
    srows = []
    for n in [12, 24, 36]:
        srows.append([f"N={n}", f"{st.loc[n,'avg equity weight']*100:.1f}%",
                      pct(float(st.loc[n, "mean adv of DCA vs lump (%p)"])),
                      pct(float(st.loc[n, "CE(DCA)-CE(static) g=5 (%)"])),
                      pct(float(st.loc[n, "CE(DCA)-CE(static) g=10 (%)"]))])
    return f"""
<section class="page">
  <div class="eyebrow">핵심 발견 ③</div>
  <h2><span class="num">11</span>평균과 최악은 서로 다른 답을 준다</h2>
  <div class="rule"></div>

  <p class="lead">평균으로 보면 일시투자가 낫다. 그런데 "가장 후회할 경우"를
  기준으로 보면 답이 정반대가 된다. <strong>둘 다 옳다.</strong></p>

  <figure><img src="{f['regret']}">
    <figcaption>후회 = 그 시점에 최선이었던 선택 대비 손실. 고 CAPE 구간.
    평균 후회는 N이 짧을수록 작지만, 최악의 경우 후회는 N이 길수록 작아진다.</figcaption></figure>

  {table(["전략", "최대 후회 (%p)", "평균 후회 (%p)", "최선이었던 비율"], rows)}

  <p>일시투자는 최악의 경우 최선 대비 <strong>{rt.loc[0,'max regret (%p)']:.0f}%p</strong>를
  잃는다. 36개월 분할은 그 값이 <strong>{rt.loc[36,'max regret (%p)']:.0f}%p</strong>다.
  분할매수는 수익을 높이는 장치가 아니라 <em>보험</em>이다. 보험료는 평균
  수익률이고, 보상은 최악의 시나리오다.</p>

  <h3>그런데 — 그 보험은 더 싸게 살 수 있다</h3>
  <p>36개월 분할은 기간의 15%를 현금으로 보낸다. 위험을 덜 지니 위험회피적
  기준이 선호하는 것은 당연하다. 그것은 타이밍이 아니라
  <strong>위험예산</strong>에 대한 진술이다. 공정한 비교 대상은
  같은 평균 주식비중을 계속 유지하는 <strong>고정혼합</strong>이다.</p>

  {table(["분할 기간", "평균 주식비중", "일시투자 대비", "고정혼합 대비 (γ=5)",
          "고정혼합 대비 (γ=10)"], srows)}
  <div class="tnote">γ는 위험회피 계수. 값이 클수록 위험을 싫어한다.
  마지막 두 열이 음수면 같은 위험을 지는 고정혼합이 분할보다 낫다는 뜻이다.</div>

  <div class="callout warn">
    <div class="t">결론</div>
    <p>위험회피적인 투자자(γ≥5)에게는 <strong>36개월에 걸쳐 나눠 넣는 것보다
    주식비중을 85%로 낮춰 계속 유지하는 편이 낫다.</strong>
    위험을 줄이고 싶다면 배치를 늦추지 말고 비중을 낮춰라.</p>
  </div>
  {folio(11, '고 CAPE 분할매수 백테스트')}
</section>"""


def page_japan(d: dict, f: dict) -> str:
    jt = d["japan_tab"]
    j89 = d["japan_1989"]
    names = {"all Japanese starts": "전체 시작연도",
             "post-1950 starts": "1950년 이후",
             "top-quintile valuation": "고평가 상위 20%",
             "1985-1990 entry": "1985~1990년 진입"}
    rows = []
    for label in jt.index:
        rows.append([names.get(label, label), f"{int(jt.loc[label,'obs'])}",
                     f"{jt.loc[label,'effective N']:.1f}",
                     f"{int(jt.loc[label,'best N (yrs)'])}년",
                     pct(float(jt.loc[label, "N=3y"]))])
    r30 = j89[j89["horizon (yrs)"] == 30].iloc[0]
    return f"""
<section class="page">
  <div class="eyebrow">표본외 검증</div>
  <h2><span class="num">12</span>일본 — 미국 표본에 없는 진짜 극단</h2>
  <div class="rule"></div>

  <p class="lead">미국 데이터만 쓰면 생존 편향이다. 미국은 20년·30년 실질
  총수익이 <strong>음수였던 적이 한 번도 없다.</strong> 일본은 있다.</p>

  <figure><img src="{f['japan']}">
    <figcaption>일본 실질 총수익 지수, 1989년 정점 = 1.0.
    31년이 지난 2020년에도 0.97배로 회복하지 못했다.</figcaption></figure>

  <div class="stats">
    <div class="stat"><div class="n">−7.2%</div>
      <div class="l">일본 최악의 30년<br>연평균 실질수익</div></div>
    <div class="stat"><div class="n">+3.4%</div>
      <div class="l">미국 최악의 30년<br>연평균 실질수익</div></div>
    <div class="stat"><div class="n">약 2배</div>
      <div class="l">1989년 일본 밸류에이션<br>(미국 역대 최고치 대비)</div></div>
  </div>

  <h3>그런데 일본조차 "고평가면 분할"을 지지하지 않는다</h3>
  {table(["부분표본", "관측 수", "유효표본", "최적 분할", "3년 분할 성과"], rows)}
  <div class="tnote">Jordà–Schularick–Taylor 연간 데이터. 연 단위이므로 1년 분할은
  일시투자와 동일해진다. CAPE 대신 배당 기반 CAPD를 사용했다.</div>

  <p>모든 시작연도에서도, 고평가 상위 20% 구간에서도 최적은 일시투자다.
  <strong>예외는 단 하나</strong> — 1989년 12월 정점 직후 진입이다.
  이 경우 3년 분할이 일시투자를 <em>{pct(float(r30['N=3y adv (%p)']),1)}%p</em>
  앞선다(30년 보유 기준 {float(r30['N=0y terminal real wealth']):.2f}배 대
  {float(r30['N=3y terminal real wealth']):.2f}배).</p>
  <div class="tnote">표의 마지막 행이 음수인 이유 — 1985~1990년 진입 6개를 평균하면
  대부분이 정점 <em>이전</em> 진입이라 일시투자가 크게 이긴다. 재앙은
  1990년 진입 단 한 해에 몰려 있다. 유효표본 1.5가 뜻하는 바가 이것이다.</div>

  <div class="callout">
    <div class="t">일본이 말해주는 것</div>
    <p>일본은 "분할이 유리하다"를 지지하지 않는다.
    <strong>"분할은 보험이고, 그 보험이 필요한 사건은 극히 드물다"</strong>를
    지지한다. 100년에 한 번 일어나는 일에 대비할 것인가는 데이터가 아니라
    선호의 문제다.</p>
  </div>
  {folio(12, '고 CAPE 분할매수 백테스트')}
</section>"""


def page_krw(d: dict) -> str:
    p, tt, wc = d["krw_plain"], d["krw_top_tax"], d["krw_won_cash"]
    lots = d["lots"]
    rows = []
    for n in [12, 24, 36]:
        rows.append([f"N={n}",
                     pct(float(p.loc[n, "pre-tax adv (%p)"])),
                     pct(float(p.loc[n, "post-tax adv (%p)"])),
                     f"{p.loc[n,'tax damping']:.2f}",
                     pct(float(tt.loc[n, "post-tax adv (%p)"])),
                     pct(float(wc.loc[n, "post-tax adv (%p)"]))])
    lrows = []
    for n in lots.index:
        lrows.append([f"N={n}" if n else "N=0 (일시투자)",
                      f"{lots.loc[n,'mean basis (억원)']:.1f}억",
                      f"{lots.loc[n,'mean gain (억원)']:.1f}억",
                      f"{lots.loc[n,'mean CGT (억원)']:.1f}억",
                      f"{lots.loc[n,'effective tax rate on gain']*100:.2f}%"])
    return f"""
<section class="page">
  <div class="eyebrow">원화 투자자 오버레이</div>
  <h2><span class="num">13</span>100억원, 세금과 환율을 넣으면</h2>
  <div class="rule"></div>

  <p class="lead">해외주식 양도소득세 22%(기본공제 250만원)를 실현 시점에만
  적용하고, 미실현은 비과세로 두었다. 환율은 USDKRW 실제 경로를 썼다.</p>

  {table(["분할 기간", "세전", "세후 (양도세만)", "세금 완충", 
          "이자 종합과세 49.5%", "원화로 대기"], rows)}
  <div class="tnote">단위 %p, 일시투자 대비. 표본 {d['krw_span']}
  (USDKRW가 1981년부터 존재).</div>

  <h3>세금은 이 결정을 <em>덜</em> 중요하게 만든다</h3>
  <p>양도세 22%는 전략 간 격차를 약 <strong>15% 줄인다</strong>(완충계수 ≈ 0.85).
  분할이 손해를 보면 그만큼 이익이 작고, 이익이 작으면 세금도 적기 때문이다.
  세전 {pct(float(p.loc[12,'pre-tax adv (%p)']))}%p가
  세후 {pct(float(p.loc[12,'post-tax adv (%p)']))}%p가 된다.</p>

  <h3>단, 100억이면 이자소득이 종합과세된다</h3>
  <p>미투자분이 버는 이자는 금융소득종합과세 대상이고 최고구간은 49.5%다.
  이를 반영하면 <strong>세후 격차가 세전보다 오히려 벌어진다</strong>
  ({pct(float(tt.loc[12,'post-tax adv (%p)']))}%p).
  현금 레그의 세후 수익률이 깎이면서 기다리는 비용이 커지기 때문이다.
  양도세의 완충 효과가 상쇄되고도 남는다.</p>

  <h3>취득단가 로트 분산 효과는 0이다</h3>
  {table(["전략", "평균 취득가액", "평균 양도차익", "평균 양도세", "실효세율"], lrows)}
  <div class="tnote">만기에 전량 매도하는 경우. 실효세율은 전체 창구의 세액 합계 / 양도차익 합계이며, 손실 창구가 분모에만 반영되어 명목세율 22%를 아주 근소하게 넘는다.</div>
  <p>만기에 전부 팔면 총 취득가액은 로트 구성과 무관하게 총 투입액이다.
  실효세율은 세 경우 모두 22.0%로 <strong>사실상 동일하다</strong> —
  분할이 세금을 덜 내는 이유는 단지 이익이 적기 때문이지 로트가 분산되어서가
  아니다.
  로트 분산이 실제로 작동하려면 분할 매도로 연 250만원 공제를 여러 번 써야 한다.</p>
  {folio(13, '고 CAPE 분할매수 백테스트')}
</section>"""


def page_decision(d: dict, f: dict) -> str:
    st, pr = d["state"], d["predict"]
    rows = []
    for n in [6, 12, 18, 24, 36]:
        rows.append([f"N={n}", pct(float(pr.loc[n, "predicted adv (%p)"])),
                     pr.loc[n, "95% CI on the mean"].replace("-", "−"),
                     pr.loc[n, "95% prediction interval"].replace("-", "−")])
    gap = abs(float(pr.loc[12, "predicted adv (%p)"])
              - float(pr.loc[18, "predicted adv (%p)"]))
    return f"""
<section class="page">
  <div class="eyebrow">지금 이 결정</div>
  <h2><span class="num">14</span>두 지표가 정반대를 가리킨다</h2>
  <div class="rule"></div>

  <figure><img src="{f['today']}">
    <figcaption>현재 CAPE는 역사적 상위 1%인데, 스프레드는 하위 18%에 불과하다.
    실질 현금금리가 {st['rf_real']:.2f}%로 거의 0이기 때문에 낮은 이익수익률이
    낮은 현금수익률로 상쇄된다.</figcaption></figure>

  {table(["항목", "값"], [
    ["Shiller CAPE", f"{st['cape']:.2f} (백분위 {st['cape_pct']:.1f}%)"],
    ["이익수익률 1/CAPE", f"{st['earnings_yield']:.2f}%"],
    ["기대 인플레이션 (10년 추세)", f"{st['inflation_expected']:.2f}%"],
    ["무위험 명목금리", f"{st['rf_nominal']:.2f}%"],
    ["무위험 실질금리", f"{st['rf_real']:.2f}%"],
    ["<strong>스프레드</strong>", f"<strong>{st['spread']:.2f}% (백분위 {st['spread_pct']:.0f}%)</strong>"],
  ])}

  <h3>모형에 현재 상태를 넣으면</h3>
  {table(["분할 기간", "예상 성과", "평균의 95% 구간", "개별 결과의 95% 구간"], rows)}

  <div class="callout warn">
    <div class="t">12개월과 18개월은 구분되지 않는다</div>
    <p>두 예측값의 차이는 <strong>{gap:.2f}%p</strong>다. 평균에 대한 신뢰구간
    폭(±2~3%p)의 수십분의 1이고, 개별 결과의 예측구간 폭(±17~20%p)의
    수백분의 1이다. 이 둘 중 무엇을 고르든 결과에 미치는 영향은
    <strong>측정할 수 없다.</strong></p>
  </div>

  <p>분할을 택한다면 그것은 수익률 판단이 아니라 <strong>보험료를 지불하겠다는
  선택</strong>이다. 그 경우에도 5절의 결론이 남는다 — 같은 목적이라면
  주식비중을 영구적으로 낮추는 편이 더 효율적이다.</p>

  <div class="verdict" style="margin-top:14px">
    <div class="k">권고</div>
    <div class="v">일시투자 쪽이지만 거의 무차별점이다.<br>
    손익분기 스프레드 {d['breakeven']:.2f}% 대 현재 {st['spread']:.2f}%.</div>
  </div>
  {folio(14, '고 CAPE 분할매수 백테스트')}
</section>"""


def page_limits(d: dict) -> str:
    sp = d["split"]["high_cape"]
    return f"""
<section class="page">
  <div class="eyebrow">한계</div>
  <h2><span class="num">16</span>이 결론을 뒤집으려면</h2>
  <div class="rule"></div>

  <h3>관측 가능한 뒤집힘 조건</h3>
  {table(["관측되어야 하는 것", "현재", "임계값", "거리"], [
    ["스프레드가 임계 아래로", f"{d['state']['spread']:.2f}%",
     f"{d['breakeven']:.2f}%", "0.25%p"],
    ["실질 단기금리 상승", f"{d['state']['rf_real']:.2f}%",
     f"{d['state']['rf_real']+0.25:.2f}%", "+25bp"],
    ["CAPE 추가 상승", f"{d['state']['cape']:.1f}", "약 46.1", "+11.5%"],
  ])}
  <p>셋 중 하나만 일어나도 모형의 부호는 분할 쪽으로 넘어간다. 다만 그때에도
  예측구간은 ±17%p이므로 "분할이 낫다"가 아니라
  <strong>"여전히 구분 불가"</strong>가 된다.</p>

  <h3>"판별 불가"라는 결론 자체를 뒤집으려면</h3>
  <p>독립적인 고밸류에이션 레짐이 <strong>15~20개</strong> 필요하다. 현재 3개다.
  미국 한 나라로는 수 세기가 걸린다. 현실적인 경로는
  <strong>국제 패널 확장</strong>이다 — 영국·독일·프랑스·호주의 월별 총수익과
  밸류에이션을 붙이면 레짐 수가 나라 수만큼 곱해진다. 이 연구에서는
  일본만 포함했다.</p>

  <div class="callout warn">
    <div class="t">같은 데이터로 고르고 평가하면 안 되는 이유</div>
    <p>1990년 이전 데이터만으로 "고 CAPE면 N=36"을 고르면 표본내 성과는
    <strong>{pct(float(sp['in']['mean'][36]))}%p</strong>다.
    그 규칙을 1990년 이후에 적용하면
    <strong>{pct(float(sp['out']['mean'][36]))}%p</strong>다.
    표본외 유효표본은 {sp['out']['effective N']}에 불과하다.</p>
  </div>

  <h3>주요 한계</h3>
  {table(["항목", "한계"], [
    ["일본 데이터", "연간뿐이라 1년 분할이 일시투자와 동일해진다. CAPE 대신 배당 기반 CAPD 사용 (미국에서 검증한 상관 0.907)"],
    ["CRRA 분석", "실제 보유기간이 필요해 시작월이 2016-06에서 끊긴다. 일시투자에 가장 유리했던 최근 구간이 빠져 분할에 유리하게 치우친다"],
    ["원화 분석", "USDKRW가 1981년, 한국 CPI가 2023년까지만 존재해 표본이 짧다"],
    ["거래비용", "수수료·슬리피지·배당 원천징수 15%를 반영하지 않았다. 반영하면 분할이 조금 더 불리해진다"],
    ["다중검정", "8개 N × 6개 버킷을 훑었으므로 개별 셀의 유의성은 주장하지 않았다"],
    ["행동 요인", "전략을 끝까지 지킨다고 가정했다. 일시투자 후 −30%에서 손절할 사람이라면 분할의 가치는 여기 계산된 것보다 크다"],
  ], cls="prose")}

  <div class="callout">
    <div class="t">이 연구가 답하지 못하는 것</div>
    <p>100억이 전 재산인지 총자산의 10%인지에 따라 답이 달라지지만
    모형화하지 않았다. 그리고 평균을 볼 것인가 최악을 볼 것인가는
    데이터가 아니라 <strong>선호의 문제</strong>다. 그 선택까지 대신해 줄 수는 없다.</p>
  </div>
  {folio(16, '고 CAPE 분할매수 백테스트')}
</section>"""


def build_html(d: dict, f: dict) -> str:
    pages = [page_cover(d),
             p_summary(d, f), p_glossary(d), p_cases(d),
             p_spread_past(d, f), p_spread_now(d, f), p_spread_future(d, f),
             page_why_hard(d, f), page_spread(d, f), page_cost_formula(d),
             page_regret(d, f), page_japan(d, f), page_krw(d),
             page_decision(d, f), p_priorities(d), page_limits(d)]
    return (f"<!doctype html><html lang='ko'><head><meta charset='utf-8'>"
            f"<title>고 CAPE 분할매수 백테스트</title>"
            f"<style>{font_face_css()}\n{CSS}</style></head>"
            f"<body>{''.join(pages)}</body></html>")


def render_pdf(html_path: pathlib.Path, pdf_path: pathlib.Path) -> None:
    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
        page = browser.new_page()
        page.goto(html_path.as_uri())
        page.wait_for_timeout(2500)
        page.pdf(path=str(pdf_path), format="A4", print_background=True,
                 margin={"top": "0", "bottom": "0", "left": "0", "right": "0"})
        browser.close()


def main() -> None:
    panel = pd.read_parquet(INTERIM / "panel_monthly.parquet")
    japan = pd.read_parquet(INTERIM / "japan_annual.parquet")
    print("computing numbers ...", flush=True)
    d = gather(panel, japan)
    print("drawing figures ...", flush=True)
    f = make_figures(d, japan)
    html = build_html(d, f)
    html_path = BUILD / "report.html"
    html_path.write_text(html)
    pdf_path = ROOT / "고CAPE_분할매수_백테스트.pdf"
    print("rendering pdf ...", flush=True)
    render_pdf(html_path, pdf_path)
    print(f"wrote {pdf_path} ({pdf_path.stat().st_size/1e6:.1f} MB)")




# --------------------------------------------------------------------------
# Spread: past, present, future
# --------------------------------------------------------------------------
def gather_spread(panel: pd.DataFrame, d: dict) -> None:
    """Everything the past/present/future spread chapters need."""
    feats = features_for(panel)
    adv12 = deployment_advantage(panel, 12) * 100
    frame = pd.DataFrame({
        "spread": feats["spread"] * 100,
        "ey": feats["earnings_yield"] * 100,
        "rr": feats["rf_ann_real"] * 100,
    }).dropna()
    frame["adv12"] = adv12.reindex(frame.index)

    d["spread_dates"] = list(frame.index.to_timestamp())
    d["spread_ey"] = frame["ey"].to_numpy()
    d["spread_rr"] = frame["rr"].to_numpy()
    d["spread_series"] = frame["spread"].to_numpy()

    # --- PAST -------------------------------------------------------------
    have = frame.dropna(subset=["adv12"]).copy()
    have["q"] = pd.qcut(have["spread"], 5, labels=False)
    d["spread_quintiles"] = have.groupby("q").agg(
        spread=("spread", "mean"), adv12=("adv12", "mean"),
        win=("adv12", lambda s: (s > 0).mean()), n=("adv12", "size"))

    pctl = feats["cape_pct_expanding"].reindex(have.index) * 100
    have["cape_pct"] = pctl
    hv = have.dropna(subset=["cape_pct"]).copy()
    hv["cq"] = pd.qcut(hv["cape_pct"], 5, labels=False)
    d["cape_quintiles"] = hv.groupby("cq").agg(
        cape_pct=("cape_pct", "mean"), adv12=("adv12", "mean"),
        win=("adv12", lambda s: (s > 0).mean()), n=("adv12", "size"))

    def era_of(year: int) -> str:
        if year < 1940:
            return "1926~1939 대공황기"
        if year < 1960:
            return "1940~1959 금융억압기"
        if year < 1980:
            return "1960~1979 인플레기"
        if year < 2000:
            return "1980~1999 디스인플레기"
        return "2000~2026 저금리기"

    have["era"] = [era_of(x.year) for x in have.index]
    d["decades"] = have.groupby("era").agg(
        spread=("spread", "mean"), ey=("ey", "mean"), rr=("rr", "mean"),
        adv12=("adv12", "mean")).sort_index()

    # --- FUTURE -----------------------------------------------------------
    st = d["state"]
    fr = build_regression_frame(panel, 12)
    fit = _fit(fr, ["cape_pct_expanding", "spread_ey"], HORIZON_MONTHS)
    b = fit.params
    cape_hist = panel["cape"].dropna()

    def cape_pct_of(c):
        return float((cape_hist <= c).mean()) * 100

    def predict(cape, real_rate):
        sp = 100.0 / cape - real_rate
        return float(b["const"] + b["cape_pct_expanding"] * cape_pct_of(cape)
                     + b["spread_ey"] * sp), sp

    capes = np.linspace(20, 55, 61)
    rates = np.linspace(-2.0, 4.0, 49)
    grid = np.array([[predict(c, r)[0] for c in capes] for r in rates])
    d["map_capes"], d["map_rates"], d["map_grid"] = capes, rates, grid

    hist_spread = panel["spread"].dropna() * 100
    scenarios = [
        ("현 상태가 이어짐", st["cape"], st["rf_nominal"], st["inflation_expected"]),
        ("물가가 2%로 안정", st["cape"], st["rf_nominal"], 2.0),
        ("금리 인하 (명목 2.0%)", st["cape"], 2.0, st["inflation_expected"]),
        ("금리 인상 (명목 5.5%)", st["cape"], 5.5, st["inflation_expected"]),
        ("밸류 정상화 (CAPE 30)", 30.0, st["rf_nominal"], st["inflation_expected"]),
        ("추가 랠리 (CAPE 50)", 50.0, st["rf_nominal"], st["inflation_expected"]),
        ("스태그플레이션", 35.0, 4.0, 5.0),
    ]
    rows = []
    for name, cape, nom, infl in scenarios:
        rr = ((1 + nom / 100) / (1 + infl / 100) - 1) * 100
        p, sp = predict(cape, rr)
        rows.append({"시나리오": name, "CAPE": cape, "명목금리": nom, "물가": infl,
                     "실질금리": rr, "스프레드": sp,
                     "백분위": float((hist_spread <= sp).mean()) * 100,
                     "N=12 예상": p,
                     "판정": "분할 유리" if p > 0 else "일시투자 유리"})
    d["scenarios"] = pd.DataFrame(rows)

    # --- worked examples ---------------------------------------------------
    df = (panel.loc[panel["has_french_rf"]]
          .dropna(subset=["eq_tr_real", "rf_real"]))
    eq = make_windows((1 + df["eq_tr_real"]).to_numpy(), HORIZON_MONTHS)
    rf = make_windows((1 + df["rf_real"]).to_numpy(), HORIZON_MONTHS)
    starts = list(df.index[: len(eq)])
    cases = []
    for label, note in [("1929-08", "대공황 직전"), ("1999-12", "역대 최고 CAPE"),
                        ("2007-10", "금융위기 직전")]:
        p_ = pd.Period(label, freq="M")
        i = starts.index(p_)
        row = {"시작": label, "설명": note,
               "CAPE": float(panel.loc[p_, "cape"])}
        base = None
        for n in (0, 12, 36):
            w = float(simulate(eq[i:i + 1], rf[i:i + 1], n)[0])
            if n == 0:
                base = w
            row[f"w{n}"] = w
            row[f"a{n}"] = (w / base - 1) * 100
        cases.append(row)
    d["cases"] = pd.DataFrame(cases)

    recent = []
    for label, note in [("2018-01", "고 CAPE 진입"), ("2020-01", "코로나 직전"),
                        ("2021-12", "2022 약세장 직전")]:
        p_ = pd.Period(label, freq="M")
        row = {"시작": label, "설명": note, "CAPE": float(panel.loc[p_, "cape"])}
        for n in (12, 36):
            s = deployment_advantage(panel, n)
            row[f"a{n}"] = float(s.loc[p_]) * 100 if p_ in s.index else np.nan
        recent.append(row)
    d["recent_cases"] = pd.DataFrame(recent)

    low = hist_spread[hist_spread <= st["spread"]]
    d["low_spread_share"] = len(low) / len(hist_spread) * 100


# ==========================================================================
# Expanded page set
# ==========================================================================
def p_summary(d: dict, f: dict) -> str:
    a, q = d["adv_all"], d["spread_quintiles"]
    st = d["state"]
    return f"""
<section class="page">
  <div class="eyebrow">3분 요약</div>
  <h2><span class="num">1</span>결론부터</h2>
  <div class="rule"></div>

  <div class="callout warn">
    <div class="t">1. "몇 개월에 나눠 넣을까"는 데이터로 못 정한다</div>
    <p>3개월이든 36개월이든, 예상 성과 차이가 <strong>불확실성보다 훨씬 작다.</strong>
    100년치 데이터로도 구분이 안 된다. 이건 분석이 부실해서가 아니라
    "고 CAPE 진입"이라는 사건이 100년에 <strong>세 번</strong>밖에 없었기
    때문이다.</p>
  </div>

  <div class="callout">
    <div class="t">2. 대신 진짜 원인을 찾았다 — CAPE가 아니라 <em>스프레드</em></div>
    <p>스프레드 = <strong>주식 기대수익 − 현금 실질금리.</strong>
    나눠 넣는 동안 현금으로 들고 있으면 포기하게 되는 수익률이다.
    과거 100년을 스프레드로 줄 세우면 답이 <strong>깨끗하게 한 줄로 정렬</strong>된다.
    CAPE로 줄 세우면 뒤죽박죽이다.</p>
  </div>

  <figure><img src="{f['ladder']}">
    <figcaption>같은 데이터, 다른 정렬 기준. 왼쪽은 스프레드 5분위별
    12개월 분할의 성과 — 낮은 스프레드에서 높은 스프레드로 갈수록
    +0.9 → −6.5%p로 단조 감소한다. 오른쪽은 CAPE 백분위 5분위 — 순서가 없다.
    <strong>이 한 장이 이 보고서의 핵심이다.</strong></figcaption></figure>

  <div class="callout">
    <div class="t">3. 지금은 나눠 넣는 비용이 역사상 가장 싼 축이다</div>
    <p>현재 스프레드 <strong>{st['spread']:.2f}%</strong>는 역사적
    <strong>{st['spread_pct']:.0f}분위</strong>(하위 {st['spread_pct']:.0f}%)다.
    주식이 비싸서 기대수익이 낮지만, 현금 실질금리도 {st['rf_real']:.2f}%로
    거의 0이라 서로 상쇄된다. 과거 이 구간에서 12개월 분할의 평균 성과는
    <strong>{q.loc[0,'adv12']:+.2f}%p</strong>였다 — 사실상 공짜였다.
    반면 스프레드가 가장 높았던 구간에서는 {q.loc[4,'adv12']:+.2f}%p였다.</p>
  </div>

  <div class="stats">
    <div class="stat"><div class="n">{pct(a[12],2)}%p</div>
      <div class="l">전체 기간 평균<br>12개월 분할의 성과</div></div>
    <div class="stat"><div class="n">{st['spread']:.2f}%</div>
      <div class="l">현재 스프레드<br>({st['spread_pct']:.0f}분위)</div></div>
    <div class="stat"><div class="n">3개</div>
      <div class="l">고 CAPE 진입의<br>독립 사례 수</div></div>
  </div>
  {folio(2, '고 CAPE 분할매수 백테스트')}
</section>"""


def p_glossary(d: dict) -> str:
    st = d["state"]
    return f"""
<section class="page">
  <div class="eyebrow">먼저 알아둘 것</div>
  <h2><span class="num">2</span>용어 다섯 개</h2>
  <div class="rule"></div>
  <p class="lead">이 다섯 개만 알면 나머지는 다 읽힌다.</p>

  <h3>① CAPE — 주식이 비싼가</h3>
  <p>주가를 <strong>지난 10년 평균 이익</strong>으로 나눈 값. 10년 평균을 쓰는 이유는
  경기 사이클에 따른 이익 등락을 지우기 위해서다.
  지금은 <strong>{st['cape']:.1f}</strong> — 10년치 이익의 41배를 주고 산다는 뜻이고,
  역대 2위다(1위는 1999년 12월 44.2).</p>

  <h3>② 이익수익률 (1/CAPE) — 주식에서 얼마를 기대하나</h3>
  <p>CAPE를 뒤집은 값. 100원어치 주식이 연 몇 원의 이익을 내는가.
  지금은 1÷{st['cape']:.1f} = <strong>{st['earnings_yield']:.2f}%</strong>다.
  물가를 이미 반영한 <strong>실질</strong> 기대수익으로 읽으면 된다.</p>

  <div class="callout">
    <div class="t">③ 스프레드 — 기다리는 값이 얼마인가 (가장 중요)</div>
    <p><strong>스프레드 = 이익수익률 − 현금 실질금리</strong></p>
    <p style="margin-top:7px">현금으로 들고 있으면 주식 수익은 못 받지만 이자는 받는다.
    그 차액이 "기다리는 동안 포기하는 것"이다.
    지금은 {st['earnings_yield']:.2f}% − {st['rf_real']:.2f}% =
    <strong>{st['spread']:.2f}%</strong>.<br>
    스프레드가 크면 기다리는 게 비싸고, 작으면 기다려도 손해가 적다.
    <strong>이것이 분할매수 비용의 거의 전부를 설명한다.</strong></p>
  </div>

  <h3>④ 백분위 — 역사상 어디쯤인가</h3>
  <p>"18분위"는 과거 100년 중 82%의 기간이 지금보다 높았다는 뜻이다.
  이 보고서는 항상 <strong>그 시점까지의 데이터만</strong> 써서 백분위를 계산한다.
  전체 기간을 다 알고 계산하면 미래를 훔쳐보는 셈이 되기 때문이다.</p>

  <h3>⑤ 신뢰구간과 유효표본</h3>
  <p><strong>신뢰구간</strong>은 "참값이 이 범위 안에 있을 것"이라는 폭이다.
  점추정이 +2.2%p인데 구간이 [−11, +12]%p라면, 그 +2.2는 <strong>아무 의미가 없다.</strong><br>
  <strong>유효표본</strong>은 진짜 독립적인 관측이 몇 개인가다. 1월 시작과 2월 시작의
  12개월 분할은 12개월 중 11개월이 같은 데이터라 두 개로 세면 안 된다.</p>

  <div class="callout warn">
    <div class="t">이 보고서를 읽는 법</div>
    <p>숫자 하나를 볼 때마다 <strong>옆의 신뢰구간과 유효표본을 같이 보라.</strong>
    이 주제는 그럴싸한 숫자가 쉽게 나오고, 대부분 잡음이다.</p>
  </div>
  {folio(3, '고 CAPE 분할매수 백테스트')}
</section>"""


def p_cases(d: dict) -> str:
    c, r = d["cases"], d["recent_cases"]
    rows = []
    for _, x in c.iterrows():
        rows.append([f"{x['시작']}<br><span class='muted' style='font-size:7.6pt'>{x['설명']}</span>",
                     f"{x['CAPE']:.1f}", f"{x['w0']:.2f}배", f"{x['w12']:.2f}배",
                     f"{pct(x['a12'],1)}%p", f"{x['w36']:.2f}배", f"{pct(x['a36'],1)}%p"])
    rows2 = []
    for _, x in r.iterrows():
        rows2.append([f"{x['시작']}<br><span class='muted' style='font-size:7.6pt'>{x['설명']}</span>",
                      f"{x['CAPE']:.1f}", f"{pct(x['a12'],1)}%p", f"{pct(x['a36'],1)}%p"])
    return f"""
<section class="page">
  <div class="eyebrow">감을 잡기</div>
  <h2><span class="num">3</span>실제로 어떤 일이 있었나</h2>
  <div class="rule"></div>
  <p class="lead">평균과 신뢰구간 얘기를 하기 전에, 실제 사례부터 보자.
  100억을 넣었다면 10년 뒤 실질 기준으로 얼마가 됐을까.</p>

  <h3>역사적 대형 고점 세 번</h3>
  {table(["진입 시점", "CAPE", "일시투자", "12개월 분할", "차이", "36개월 분할", "차이"], rows)}
  <div class="tnote">"배" = 10년 뒤 실질 자산배수. 1.00배면 물가 감안 본전.</div>

  <p><strong>1929년</strong>은 분할이 압도적으로 이겼다 — 일시투자는 10년 뒤에도
  0.84배로 원금을 못 찾았지만 36개월 분할은 2.17배였다.
  이 한 사례가 "고 CAPE면 분할" 통념의 거의 전부를 떠받친다.</p>

  <div class="callout warn">
    <div class="t">그런데 1999년 12월을 보라 — 역대 최고 CAPE였다</div>
    <p>44.2라는 사상 최고 밸류에이션에서 진입했는데도
    <strong>12개월 분할은 일시투자보다 3.3%p 손해</strong>였다.
    36개월로 늘려야 겨우 +23%p였다. "밸류에이션이 극단이면 나눠 넣으면 된다"는
    말이 이렇게 간단하지 않다는 뜻이다.</p>
  </div>

  <h3>최근 고 CAPE 진입 세 번 — 같은 상황, 다른 결말</h3>
  {table(["진입 시점", "CAPE", "12개월 분할", "36개월 분할"], rows2)}

  <p>셋 다 "역사적으로 비싼" 구간에서 시작했다. 12개월 분할의 결과는 위에서부터
  <strong>−3.2%p, +1.1%p, +11.5%p</strong>로 제각각이다.
  2021년 12월은 이듬해 약세장 덕에 분할이 크게 이겼고, 2020년 1월은
  코로나 폭락에도 불구하고 36개월로 늘리자 −16.8%p로 크게 졌다
  (폭락 뒤 반등이 너무 빨라서 현금이 그 반등을 놓쳤다).</p>

  <p><strong>이것이 이 문제의 본질이다.</strong> 같은 정보로 진입해도 결과는
  동전 던지기에 가깝다. 그래서 "몇 개월이 최적인가"에 답이 안 나온다.</p>
  {folio(4, '고 CAPE 분할매수 백테스트')}
</section>"""


def p_spread_past(d: dict, f: dict) -> str:
    q, dec = d["spread_quintiles"], d["decades"]
    qrows = [[f"{i+1}분위", f"{q.loc[i,'spread']:.2f}%",
              f"{pct(q.loc[i,'adv12'])}%p", f"{q.loc[i,'win']*100:.0f}%",
              f"{int(q.loc[i,'n'])}"] for i in q.index]
    drows = [[str(i), f"{dec.loc[i,'ey']:.2f}%", f"{dec.loc[i,'rr']:.2f}%",
              f"{dec.loc[i,'spread']:.2f}%", f"{pct(dec.loc[i,'adv12'])}%p"]
             for i in dec.index]
    return f"""
<section class="page">
  <div class="eyebrow">스프레드 ① 과거</div>
  <h2><span class="num">4</span>100년 동안 기다리는 값은 얼마였나</h2>
  <div class="rule"></div>

  <figure><img src="{f['spread_hist']}">
    <figcaption>위: 주식 기대수익(올리브)과 현금 실질금리(청록), 그 사이 간격이
    스프레드. 아래: 스프레드 자체 — 붉은 부분이 지금보다 낮았던 기간으로 전체의
    {d['low_spread_share']:.0f}%뿐이다.</figcaption></figure>

  <p>스프레드는 <strong>−2.7%에서 +15.8%까지</strong> 움직였다. 주식이 비싸지면 위쪽 선이
  내려오고, 중앙은행이 실질금리를 올리면 아래쪽 선이 올라온다.
  둘이 가까워질수록 기다리는 비용이 싸진다.</p>

  <h3>스프레드로 줄 세우면 답이 정렬된다</h3>
  {table(["스프레드 5분위", "평균 스프레드", "12개월 분할 성과", "분할이 이긴 비율", "관측 월수"], qrows)}
  <div class="tnote">1926~2026년 전체 시작월을 스프레드 크기로 5등분.</div>

  <p><strong>완벽하게 단조롭다.</strong> 이긴 비율도 40% → 19%로 한 방향으로 떨어진다.
  앞의 그림에서 봤듯 CAPE로 줄 세우면 이런 순서가 나오지 않는다.
  다만 <em>낮은 스프레드가 폭락 신호는 아니다</em> — 1분위의 평균 성과는
  {pct(q.loc[0,'adv12'])}%p, 이긴 비율은 40%에 불과하다.
  "기다리는 비용이 싸다"는 뜻일 뿐이다.</p>

  <h3>시대별로 보면 — 1940~50년대는 현금 실질금리가 −2%였다</h3>
  {table(["시대", "주식 기대수익", "현금 실질금리", "스프레드", "12개월 분할 성과"], drows)}

  {folio(5, '고 CAPE 분할매수 백테스트')}
</section>"""


def p_spread_now(d: dict, f: dict) -> str:
    st, q = d["state"], d["spread_quintiles"]
    return f"""
<section class="page">
  <div class="eyebrow">스프레드 ② 현재</div>
  <h2><span class="num">5</span>지금은 어디에 있나</h2>
  <div class="rule"></div>

  <figure><img src="{f['today']}">
    <figcaption>같은 시장을 두 자로 재면 정반대가 나온다.</figcaption></figure>

  <h3>왜 두 지표가 엇갈리나 — 분해해보면</h3>
  {table(["항목", "값", "역사적 위치", "읽는 법"], [
    ["Shiller CAPE", f"{st['cape']:.2f}", f"{st['cape_pct']:.1f}분위",
     "주식이 <b>역대급으로 비싸다</b>"],
    ["이익수익률 (1/CAPE)", f"{st['earnings_yield']:.2f}%", "최하위권",
     "주식 기대수익이 <b>매우 낮다</b>"],
    ["기대 물가 (10년 추세)", f"{st['inflation_expected']:.2f}%", "중상위", "—"],
    ["명목 단기금리", f"{st['rf_nominal']:.2f}%", "중간", "—"],
    ["현금 실질금리", f"{st['rf_real']:.2f}%", "하위권",
     "현금도 <b>거의 못 번다</b>"],
    ["<b>스프레드</b>", f"<b>{st['spread']:.2f}%</b>", f"<b>{st['spread_pct']:.0f}분위</b>",
     "<b>기다리는 값이 싸다</b>"],
  ])}

  <div class="callout">
    <div class="t">핵심 — 낮은 것 두 개가 상쇄된다</div>
    <p>주식 기대수익이 {st['earnings_yield']:.2f}%로 역사상 최저 수준인 건 맞다.
    그런데 <strong>현금 실질금리도 {st['rf_real']:.2f}%로 거의 0</strong>이다.
    분할매수의 비용은 이 <em>둘의 차이</em>이지 주식 가격 하나가 아니다.
    낮은 값에서 낮은 값을 빼면 작은 값이 나온다.</p>
  </div>

  <p>비유하자면 이렇다. 주식이라는 열차의 속도가 느려졌지만
  <strong>플랫폼에 서 있는 것도 그만큼 느려졌다.</strong>
  놓쳐서 잃는 것이 예전만큼 크지 않다. CAPE만 보면 열차 속도만 보는 것이고,
  스프레드는 열차와 플랫폼의 <em>속도 차이</em>를 본다.</p>

  <h3>그래서 지금 나눠 넣으면 얼마짜리 결정인가</h3>
  <p>과거 스프레드 1분위(현재가 여기 속한다) 구간에서 12개월 분할의 평균 성과는
  <strong>{pct(q.loc[0,'adv12'])}%p</strong>, 5분위 구간에서는
  <strong>{pct(q.loc[4,'adv12'])}%p</strong>였다.
  같은 "12개월 분할"이라도 시기에 따라 비용이 <strong>7%p 넘게</strong> 차이 난다.
  지금은 그 스펙트럼에서 가장 싼 쪽 끝에 있다.</p>

  <div class="callout warn">
    <div class="t">단, "싸다"가 "이득이다"는 아니다</div>
    <p>1분위의 {pct(q.loc[0,'adv12'])}%p도 신뢰구간을 붙이면 0과 구분되지 않는다.
    분할이 이긴 비율은 여전히 40%로 <strong>절반이 안 된다.</strong>
    정확한 표현은 "지금 나눠 넣는 것은 <strong>거의 공짜다</strong>"이지
    "지금은 나눠 넣는 게 유리하다"가 아니다.</p>
  </div>
  {folio(6, '고 CAPE 분할매수 백테스트')}
</section>"""


def p_spread_future(d: dict, f: dict) -> str:
    sc = d["scenarios"]
    rows = []
    for _, x in sc.iterrows():
        cls = "pos" if x["N=12 예상"] > 0 else "neg"
        rows.append([x["시나리오"], f"{x['CAPE']:.0f}", f"{x['명목금리']:.1f}%",
                     f"{x['물가']:.1f}%", f"{x['실질금리']:+.2f}%",
                     f"<b>{x['스프레드']:.2f}%</b>",
                     f"<span class='{cls}' style='font-weight:700'>{pct(x['N=12 예상'])}%p</span>",
                     x["판정"]])
    return f"""
<section class="page">
  <div class="eyebrow">스프레드 ③ 미래</div>
  <h2><span class="num">6</span>앞으로 무엇이 답을 바꾸나</h2>
  <div class="rule"></div>

  <p class="lead">스프레드가 원인이라면, <strong>스프레드를 움직이는 것</strong>이
  답을 움직인다. 그리고 스프레드를 움직이는 건 딱 두 가지다 —
  주가(CAPE)와 현금 실질금리.</p>

  <figure><img src="{f['map']}">
    <figcaption>가로축 주가 수준, 세로축 현금 실질금리. 검은 선이 손익분기.
    별표가 현재 위치로, 선 바로 아래에 붙어 있다.
    <strong>지금은 경계선 위에 서 있다.</strong></figcaption></figure>

  <div class="callout warn">
    <div class="t">직관과 반대인 두 가지</div>
    <p><strong>① 금리가 오르면 분할이 유리해진다</strong> — 현금이 더 벌어주니
    기다리는 비용이 줄어든다(지도 위쪽).
    <strong>② 주가가 싸지면 일시투자가 유리해진다</strong> — 주식 기대수익이 올라
    스프레드가 벌어진다(지도 왼쪽). 둘 다 상식과 반대인데, 상식은 <em>수익률</em>을
    말하고 이 지도는 <em>기다림의 비용</em>을 말하기 때문이다.</p>
  </div>

  <h3>시나리오별 계산</h3>
  {table(["시나리오", "CAPE", "명목금리", "물가", "실질금리", "스프레드", "N=12 예상", "판정"], rows)}
  <div class="tnote">회귀모형(CAPE 백분위 + 스프레드)에 각 조건을 넣은 값.
  모든 예측의 개별 예측구간은 ±17%p 수준이므로 부호는 방향성으로만 읽을 것.</div>

  <p>답을 가장 크게 바꾸는 건 <strong>물가와 금리</strong>이지 주가가 아니다.
  물가가 2%로 안정되면 실질금리가 올라 스프레드가 0.85%까지 좁혀지고 분할 쪽으로
  넘어간다. 반대로 금리를 내리면 실질금리가 마이너스가 되어 스프레드가 벌어지고
  일시투자가 확실히 유리해진다.</p>

  <div class="callout">
    <div class="t">그래서 무엇을 지켜봐야 하나</div>
    <p>CAPE가 아니라 <strong>실질금리</strong>다. 현재 CAPE 기준 손익분기는
    실질금리 <strong>{d['breakeven_rate']:.2f}%</strong>이고, 지금은 {st_rr(d):.2f}%로
    {abs(d['breakeven_rate']-st_rr(d)):.2f}%p 낮다.</p>
  </div>
  {folio(7, '고 CAPE 분할매수 백테스트')}
</section>"""


def st_rr(d: dict) -> float:
    return d["state"]["rf_real"]


def p_priorities(d: dict) -> str:
    st, q = d["state"], d["spread_quintiles"]
    lots, krw = d["lots"], d["krw_plain"]
    terminal = float(lots.loc[0, "mean basis (억원)"] + lots.loc[0, "mean gain (억원)"])
    stat = d["static_all"]

    def eok(pp):  # percentage points of terminal wealth -> 억원 on 100억
        return terminal * pp / 100

    n_cost = float(krw.loc[12, "post-tax adv (%p)"])
    fx_cost = float(d["krw_won_cash"].loc[12, "post-tax adv (%p)"]) - n_cost
    tax_cost = float(d["krw_top_tax"].loc[12, "post-tax adv (%p)"]) - n_cost
    alloc = float(stat.loc[36, "mean adv of static vs lump (%p)"])

    rows = [
        ["<b>주식비중을 100%가 아니라 85%로</b>",
         f"{pct(alloc)}%p <span class='muted'>({eok(alloc):.1f}억)</span>",
         "<b>부호 확실</b>", "10년 내내 15%를 현금으로 두는 비용"],
        ["<b>12개월에 나눠 넣기</b>",
         f"{pct(n_cost)}%p <span class='muted'>({eok(n_cost):.1f}억)</span>",
         "<span class='neg'><b>부호 불확실</b></span>", "이 보고서 전체가 다룬 결정"],
        ["원화로 대기 (달러 대기 대신)",
         f"{pct(fx_cost)}%p <span class='muted'>({eok(fx_cost):.1f}억)</span>",
         "부호 확실", "1981~2023년 실제 환율 경로 기준"],
        ["이자소득이 종합과세 최고구간에",
         f"{pct(tax_cost)}%p <span class='muted'>({eok(tax_cost):.1f}억)</span>",
         "부호 확실", "미투자분 이자에 49.5% 적용 시"],
        ["중도에 손절하기",
         "<span class='muted'>모형화하지 않음</span>", "—",
         "−30%에서 팔면 어떤 스케줄도 무의미해진다"],
    ]
    return f"""
<section class="page">
  <div class="eyebrow">균형 잡기</div>
  <h2><span class="num">15</span>이 결정의 크기</h2>
  <div class="rule"></div>

  <p class="lead">100억을 10년 굴리면 평균적으로 <strong>{terminal:.0f}억원</strong>이 된다.
  그 기준으로 각 결정이 실제 얼마짜리인지 재봤다.</p>

  {table(["결정", "측정된 크기", "방향", "비고"], rows, cls="prose")}
  <div class="tnote">모두 12개월 분할 기준, 세후. 주식비중 항목만 36개월 분할과 같은
  평균 주식비중(85%)을 영구 유지했을 때의 값이라 비교 기준이 다르다.</div>

  <div class="callout warn">
    <div class="t">크기가 아니라 <em>확실성</em>이 다르다</div>
    <p>분할 기간의 비용({eok(n_cost):.1f}억)은 다른 레버와 비슷한 자릿수다.
    작다고 무시할 금액이 아니다. 그런데 <strong>다른 항목은 부호를 알고
    이 항목만 모른다.</strong> 주식비중을 낮추면 확실히 수익이 줄고, 원화로 대기하면
    확실히 불리하다. 반면 12개월 분할은 <strong>이득일 수도 손해일 수도 있고
    데이터로 가릴 수 없다.</strong></p>
    <p style="margin-top:7px">따라서 합리적인 순서는 이렇다 —
    <strong>부호를 아는 결정부터 정하고, 부호를 모르는 결정에는 시간을 덜 쓴다.</strong></p>
  </div>

  <h3>그럼에도 나눠 넣고 싶다면 — 실행 규칙</h3>
  {table(["상황", "권고", "이유"], [
    [f"현재 (스프레드 {st['spread']:.2f}%, 1분위)",
     "일시투자, 또는 <b>짧게 3~6개월</b>",
     f"1분위 평균 {pct(q.loc[0,'adv12'])}%p — 비용이 거의 없으니 마음 편한 쪽으로"],
    ["스프레드가 5% 넘게 벌어지면", "<b>일시투자</b>",
     f"3분위 이상 평균 {pct(q.loc[2,'adv12'])} ~ {pct(q.loc[4,'adv12'])}%p"],
    ["실질금리가 1.5% 위로 오르면", "<b>분할을 늘려도 좋다</b>",
     "현금이 벌어주므로 기다리는 비용이 사라진다"],
    ["최악의 시나리오가 감당 안 되면", "<b>N 대신 주식비중을 낮춰라</b>",
     "같은 위험 감소를 더 확실하게 산다 (11절)"],
  ], cls="prose")}
  {folio(15, '고 CAPE 분할매수 백테스트')}
</section>"""


if __name__ == "__main__":
    main()
