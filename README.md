# MyInvest

개인용 투자 대시보드: 한국주식 · 미국주식 · 암호화폐 시세를 자동으로 가져오고, 직접 만든 매매 전략을 백테스트하고, 매일 실행해서 보유 종목의 매수/매도 신호를 한눈에 확인하는 앱입니다.

## 구성

- `backend/` — FastAPI 서버. 시세 수집, 전략 평가, 백테스트 엔진, SQLite 저장.
- `frontend/` — React + Vite + Tailwind 대시보드 UI.

## 주요 기능

- **관심 종목 관리**: 한국주식(KRX), 미국주식, 암호화폐 종목을 워치리스트에 추가
- **전략 빌더**: 코드 없이 지표(SMA, EMA, RSI, MACD, 볼린저밴드) 조합으로 매수/매도 조건을 직접 정의
- **백테스트**: 정의한 전략을 과거 데이터에 적용해 수익률, CAGR, MDD, 샤프비율, 승률, 매매 내역을 확인
- **오늘의 신호**: 워치리스트의 각 종목에 대해 최신 데이터로 오늘의 매수/매도/보유 신호를 계산

## 실행 방법

### 백엔드

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

첫 실행 시 `backend/app.db` (SQLite)가 자동 생성됩니다.

### 프론트엔드

```bash
cd frontend
npm install
npm run dev
```

`http://localhost:5173` 접속. Vite 개발 서버가 `/api` 요청을 백엔드(`http://127.0.0.1:8000`)로 프록시합니다 (`frontend/vite.config.ts`).

## 데이터 소스 (API 키 불필요)

| 시장 | 소스 |
| --- | --- |
| 한국주식 | [FinanceDataReader](https://github.com/FinanceData/FinanceDataReader) (KRX/Naver 금융 기반) |
| 미국주식 | FinanceDataReader (stooq 기반) |
| 암호화폐 | [ccxt](https://github.com/ccxt/ccxt) (기본 Binance, `backend/app/data_sources/crypto.py`에서 거래소 변경 가능) |

모두 별도 API 키 없이 동작하는 공개 데이터를 사용합니다. 다만 회사 프록시 등 TLS를 가로채는 네트워크 환경에서는 `ccxt`가 SSL 인증서 검증에 실패할 수 있습니다 (일반 가정/개인 네트워크에서는 문제 없습니다).

## 전략 정의 방식

전략은 JSON 규칙으로 저장됩니다. 각 규칙은 좌변-연산자-우변으로 구성되고, `buy_rules`/`sell_rules` 안의 여러 규칙은 AND로 결합됩니다.

```json
{
  "buy_rules": [
    { "left": { "indicator": "SMA", "params": { "period": 5 } }, "operator": "cross_above", "right": { "indicator": "SMA", "params": { "period": 20 } } }
  ],
  "sell_rules": [
    { "left": { "indicator": "RSI", "params": { "period": 14 } }, "operator": ">", "right": { "value": 70 } }
  ]
}
```

지원 지표: `CLOSE`, `SMA`, `EMA`, `RSI`, `MACD`, `MACD_SIGNAL`, `BB_UPPER`, `BB_MID`, `BB_LOWER`
지원 연산자: `>`, `<`, `>=`, `<=`, `==`, `cross_above`, `cross_below`

프론트엔드의 "전략" 탭에서 폼으로 직접 만들 수 있습니다.

## 백테스트 엔진

`backend/app/backtest_engine.py`는 매수 신호가 뜨면 다음 거래일 종가에 전액 매수하고, 매도 신호가 뜨면 전량 청산하는 단순 롱온리 시뮬레이터입니다. (숏, 분할매매, 수수료/슬리피지는 아직 반영되지 않음)

## API 요약

- `GET/POST /api/watchlist`, `DELETE /api/watchlist/{id}`
- `GET/POST /api/strategies`, `GET/DELETE /api/strategies/{id}`
- `GET /api/data/{market}/{symbol}?start=&end=`
- `POST /api/backtest`, `GET /api/backtest`, `GET /api/backtest/{id}`
- `GET /api/signals/today`

`market` 값: `kr_stock`, `us_stock`, `crypto`
