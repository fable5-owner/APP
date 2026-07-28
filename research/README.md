# 밸류에이션 조건부 분할매수 스케줄 백테스트

"고 CAPE 구간에서 목돈을 몇 개월에 걸쳐 분할 투입해야 하는가"에 답하기 위한
정량 리서치. 결과는 [`results.md`](results.md), 한계는
[`LIMITATIONS.md`](LIMITATIONS.md)에 있다.

## 실행

```bash
uv venv --python 3.11 .venv
uv pip install --python .venv/bin/python \
    pandas numpy statsmodels arch matplotlib pyarrow xlrd openpyxl requests scipy tabulate

# 데이터 받고 패널 만들기 (data/raw에 캐시됨, 재실행 시 재다운로드 안 함)
PYTHONPATH=src .venv/bin/python src/build_series.py

# 전체 분석 + results.md + figures/ 생성
PYTHONPATH=src .venv/bin/python src/run_all.py

# 데이터 재빌드까지 한 번에
PYTHONPATH=src .venv/bin/python src/run_all.py --rebuild-data
```

### 디자인된 PDF 보고서

```bash
uv pip install --python .venv/bin/python playwright pypdfium2
PYTHONPATH=src .venv/bin/python src/fetch_fonts.py   # 한글 폰트 (약 14MB, .fonts/)
PYTHONPATH=src .venv/bin/python src/report_pdf.py    # -> 고CAPE_분할매수_백테스트.pdf
```

`report_pdf.py`는 results.md를 옮겨 적는 것이 아니라 패널에서 숫자를 **다시
계산**한다. 분석이 바뀌면 보고서도 따라 바뀐다. HTML을 Chromium으로 렌더링하므로
`/opt/pw-browsers`의 사전 설치 브라우저를 쓴다(`playwright install` 불필요).

`run_all.py`는 검증 게이트를 먼저 돌리고, **실패하면 그 자리에서 중단한다.**

## 구조

```
src/
  config.py        경로, N 그리드, 트리거 수준, 부트스트랩 설정
  data_io.py       다운로드 + 파서 (Shiller/French/FRED/JST)
  build_series.py  월별 실질 총수익 패널, 확장윈도우 CAPE 백분위
  strategies.py    S0~S4 시뮬레이터 (윈도우 축으로 벡터화)
  advantage.py     분할 advantage — 배치기간만으로 계산 (아래 참고)
  windows.py       겹침 윈도우 구성
  metrics.py       유효표본수, CRRA 확실성등가, 후회
  bootstrap.py     stationary bootstrap (Politis-Romano)
  analysis.py      조건부 표, LOO, 크래시 모양, 후회, 고정혼합 대조군,
                   주식비중 사다리, 최종부 분포
  regression.py    경마 회귀 + 현재 상태 예측
  oos.py           미국 분할표본, 일본
  krw.py           원화 오버레이 + 세금
  figures.py       그림
  gates.py         검증 게이트 4종
  run_all.py       원커맨드 실행
data/raw/          원본 캐시
data/interim/      parquet
figures/           그림
```

## 핵심 설계 결정 두 가지

**1. advantage는 배치기간만으로 결정된다.** 마지막 회차가 투입되면 모든 전략이
동일한 100% 주식 포트폴리오를 들고 있으므로, 최종부의 **비율**은 그 시점에
고정된다 (H=120과 H=240에서 동일한 시작월의 advantage 차이는 3e-15). 따라서
advantage 분석은 보유기간 H가 아니라 배치기간 N개월만 쓴다. 이 덕분에
유효표본이 `기간/H`가 아니라 `기간/N`이 되고, 시작월을 2016-06에서 끊지 않고
2023~2026까지 쓸 수 있다 — 질문의 대상인 최근 고밸류에이션 구간이 표본에
들어온다. CRRA만 실제 보유기간이 필요하므로 H=120을 쓴다.

**2. 미투자분은 언제나 French RF로 굴린다.** 현금 0% 가정은 코드 경로 자체가
없다.

**3. 주식비중 사다리(3.8)와 최종부 분포(3.9)는 유효표본이 훨씬 작다.** 이 둘은
보유기간 전체의 수익률에 의존하므로 유효표본이 `기간/H`이고, 고 CAPE 조건에서는
3.5까지 떨어진다. 방향(비중을 낮추면 평균이 줄고 하위 5%가 오른다)만 주장하고
최적 비중 같은 점추정은 주장하지 않는다. `LIMITATIONS.md` 1.3 참고.

## 방법론 체크리스트

- [x] 확장윈도우 CAPE 백분위만 사용 (전체표본 버전은 편향 크기 측정용으로만)
- [x] 모든 조건부 표에 유효표본수 컬럼
- [x] stationary bootstrap (평균 블록 30개월), iid 부트스트랩 미사용
- [x] 에피소드 leave-one-out (1929/2000/2008/2020)
- [x] 크래시 모양별 분류 (사후 조건부임을 명시)
- [x] 후회 행렬 + minimax
- [x] CRRA γ ∈ {1,3,5,10}
- [x] 표본외: 미국 1926~1990 → 1990~2026, 일본은 순수 표본외
- [x] 원화 오버레이 + 양도소득세 22% (실현 시점만)
- [x] 실질 기준, 총수익 (가격지수 미사용)
- [x] 시작연도 4개(1926/1950/1970/1990) 결과 모두 보고
- [x] Newey-West (lag = H)
