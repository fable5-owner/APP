#!/usr/bin/env python3
"""TSMC ADR(TSM) vs 대만 본주(2330.TW) 프리미엄 계산기 (원화 환산 기준)

계산식 (ADR 1주 = 본주 5주)
  ADR 원화가   = TSM(USD) x USD/KRW
  본주 5주 원화가 = 2330.TW(TWD) x 5 x TWD/KRW
  프리미엄 금액 = ADR 원화가 - 본주 5주 원화가      (ADR 1주 기준)
  프리미엄 %   = 프리미엄 금액 / 본주 5주 원화가 x 100

데이터: Yahoo Finance (무료, API 키 불필요)
사용법:
  python tsmc_premium.py              # 최신 일자 계산 + data/history.csv 에 누적 저장
  python tsmc_premium.py --days 30    # 최근 30일 일별 프리미엄 표 출력/저장
  python tsmc_premium.py --no-save    # 저장 없이 출력만
"""
import argparse
import csv
import datetime as dt
import sys
from pathlib import Path

import requests

ADR_RATIO = 5  # ADR 1주 = 본주 5주
HEADERS = {"User-Agent": "Mozilla/5.0"}
HIST = Path(__file__).parent / "data" / "history.csv"
FIELDS = ["date", "adr_usd", "local_twd", "usdkrw", "twdkrw",
          "adr_krw", "local5_krw", "premium_krw", "premium_pct"]


def fetch_closes(symbol: str, range_: str) -> dict:
    """{현지 거래일: 종가} (최신 봉은 장중이면 현재가)"""
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
    r = requests.get(url, params={"range": range_, "interval": "1d"},
                     headers=HEADERS, timeout=20)
    r.raise_for_status()
    res = r.json()["chart"]["result"][0]
    off = res["meta"].get("gmtoffset", 0)
    out = {}
    for ts, c in zip(res["timestamp"], res["indicators"]["quote"][0]["close"]):
        if c is not None:
            d = dt.datetime.fromtimestamp(ts + off, dt.timezone.utc).date()
            out[d] = float(c)
    return out


def at_or_before(series: dict, day):
    """day 이하 가장 가까운 값 (휴장일 전일값 사용)"""
    ds = [d for d in series if d <= day]
    return series[max(ds)] if ds else None


def compute(days: int):
    rng = "3mo" if days <= 40 else "1y" if days <= 200 else "5y"
    adr = fetch_closes("TSM", rng)
    loc = fetch_closes("2330.TW", rng)
    usd = fetch_closes("KRW=X", rng)       # USD/KRW
    twd = fetch_closes("TWDKRW=X", rng)    # TWD/KRW

    rows = []
    # ADR 거래일 기준: 같은 날짜의 본주/환율(없으면 직전값)과 비교
    for d in sorted(adr):
        l, u, t = at_or_before(loc, d), at_or_before(usd, d), at_or_before(twd, d)
        if None in (l, u, t):
            continue
        adr_krw = adr[d] * u
        loc5_krw = l * ADR_RATIO * t
        diff = adr_krw - loc5_krw
        rows.append(dict(date=d.isoformat(), adr_usd=round(adr[d], 2),
                         local_twd=round(l, 1), usdkrw=round(u, 2),
                         twdkrw=round(t, 4), adr_krw=round(adr_krw),
                         local5_krw=round(loc5_krw), premium_krw=round(diff),
                         premium_pct=round(diff / loc5_krw * 100, 2)))
    return rows[-days:]


def save(rows):
    HIST.parent.mkdir(parents=True, exist_ok=True)
    old = {}
    if HIST.exists():
        with HIST.open(newline="", encoding="utf-8") as f:
            old = {r["date"]: r for r in csv.DictReader(f)}
    for r in rows:
        old[r["date"]] = {k: str(v) for k, v in r.items()}
    with HIST.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        w.writeheader()
        for k in sorted(old):
            w.writerow(old[k])


def show(rows):
    print(f"{'날짜':<11}{'ADR($)':>9}{'본주(NT$)':>10}{'USD/KRW':>9}{'TWD/KRW':>9}"
          f"{'ADR(원)':>12}{'본주x5(원)':>13}{'차이(원)':>11}{'프리미엄':>9}")
    for r in rows:
        print(f"{r['date']:<11}{r['adr_usd']:>9,.2f}{r['local_twd']:>10,.1f}"
              f"{r['usdkrw']:>9,.2f}{r['twdkrw']:>9,.3f}{r['adr_krw']:>12,}"
              f"{r['local5_krw']:>13,}{r['premium_krw']:>+11,}{r['premium_pct']:>+8.2f}%")
    r = rows[-1]
    word = "프리미엄(ADR이 비쌈)" if r["premium_krw"] > 0 else "디스카운트(ADR이 쌈)"
    print(f"\n▶ {r['date']} 기준 TSMC ADR 1주 vs 본주 5주: {word}\n"
          f"  ADR {r['adr_krw']:,}원 / 본주x5 {r['local5_krw']:,}원 "
          f"→ {r['premium_krw']:+,}원 ({r['premium_pct']:+.2f}%)")


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--days", type=int, default=1, help="최근 N거래일 (기본 1)")
    ap.add_argument("--no-save", action="store_true", help="CSV 저장 안 함")
    a = ap.parse_args()
    try:
        rows = compute(a.days)
    except Exception as e:  # 네트워크/파싱 오류
        sys.exit(f"데이터 조회 실패: {e}")
    if not rows:
        sys.exit("계산할 데이터가 없습니다.")
    show(rows)
    if not a.no_save:
        save(rows)
        print(f"\n저장: {HIST}")


if __name__ == "__main__":
    main()
