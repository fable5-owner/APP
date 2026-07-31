# S&P 500은 지금 어디에 서 있는가 — 100페이지 시장 위치 분석 보고서

`output/SP500_시장위치_분석보고서_2026-07.pdf` (A4 · 100쪽 · 그림 32점 · 한국어)

2026년 7월 31일 기준으로 "S&P 500은 현재 사이클의 어느 시점에 위치해 있는가"라는
단일 질문에 답하는 심층 리서치 보고서. 밸류에이션(CAPE 40.3배 · 버핏 지표 234%),
거시(연준 재인상 논쟁 · 유가 쇼크), 기업 이익(2분기 +37.9%), AI 설비투자
슈퍼사이클($725B), 집중도(상위 10종목 40%), 심리·수급, 역사적 사이클 비교를 거쳐
"강세장 후반부 — 시계판의 10시 반, 정점 미확정"이라는 종합 판정을 내린다.

## 구성

| 파일 | 역할 |
|---|---|
| `style_kit.py` | 한글 폰트(나눔) 등록, CVD-안전 차트 팔레트, matplotlib 공통 스타일 |
| `gen_charts.py` / `gen_charts2.py` / `gen_charts3.py` | 차트 32점 생성 → `charts/*.png` |
| `content_intro.py` | 앞부속(안내·핵심요약) + PART I~III |
| `content_mid.py` | PART IV~VIII |
| `content_end.py` | PART IX~XI + 부록·콜로폰 |
| `content_extra*.py` | 심화 섹션·파트별 '한눈에 보기'·부록 확장 (앵커 기반 삽입) |
| `build_pdf.py` | ReportLab 조립 엔진 — 표지/파트 표지/헤더·푸터/2-pass 목차/그림 목록 |

## 재생성

```bash
pip install reportlab matplotlib
apt-get install -y fonts-nanum        # 한글 폰트
cd report
python3 gen_charts.py && python3 gen_charts2.py && python3 gen_charts3.py
python3 build_pdf.py                  # → output/SP500_시장위치_분석보고서_2026-07.pdf
```

## 데이터에 관한 주의

2026년 7월 수치는 작성 시점(2026-07-31)의 공개 보도·데이터 제공기관 자료에서
인용했으며 출처는 보고서 부록 B에 정리돼 있다. 장기 시계열 차트는 공개 통계의
주요 지점을 이어 그린 **개략 추이**이며, 각 차트 하단에 그 성격을 명시했다.
본 보고서는 정보 제공 목적의 일반 자료로 투자 권유가 아니다.
