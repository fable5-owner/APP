# TSMC ADR vs 본주 프리미엄 계산기 (원화 기준)

ADR(TSM) 1주 = 본주(2330.TW) 5주. 두 가격을 매일 원화로 환산해 프리미엄 %와 금액 차이를 계산합니다.

- ADR 원화가 = TSM(USD) × USD/KRW
- 본주 5주 원화가 = 2330.TW(TWD) × 5 × TWD/KRW
- 프리미엄 = (ADR − 본주×5) / (본주×5)

## 실행
    pip install -r requirements.txt
    python tsmc_premium.py              # 최신 1일 + data/history.csv 누적
    python tsmc_premium.py --days 30    # 최근 30거래일 표

## 자동화
- GitHub Actions (`.github/workflows/tsmc-premium.yml`): 평일 UTC 22:30(한국 07:30)에 실행, 결과를 history.csv에 커밋.
- 로컬 cron 예: `30 7 * * 2-6 cd /경로/tsmc-premium && python3 tsmc_premium.py`

## 참고
- 같은 날짜의 종가끼리 비교합니다(대만장은 미국장보다 먼저 마감하므로 시차 존재).
- 환율은 Yahoo 일별 종가 기준이라 실제 환전 환율(스프레드 포함)과 다를 수 있습니다.

## 카카오톡 알림 (나에게 보내기)
1. 위 `kakao_setup.py` 도움말대로 카카오 앱 생성 후 `python kakao_setup.py <REST_API_KEY>` 로 리프레시 토큰 발급
2. 로컬: `KAKAO_REST_API_KEY=... KAKAO_REFRESH_TOKEN=... python tsmc_premium.py --notify`
3. GitHub Actions: 저장소 Settings → Secrets 에 `KAKAO_REST_API_KEY`, `KAKAO_REFRESH_TOKEN`(, `KAKAO_CLIENT_SECRET`) 등록
- 리프레시 토큰은 60일 유효하며 만료 1달 전부터 새 값이 발급될 수 있습니다(로그에 안내 출력 → 시크릿 교체).
