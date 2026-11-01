"""카카오톡 '나에게 보내기' 알림 (카카오 REST API)

환경변수:
  KAKAO_REST_API_KEY   (필수) 카카오 개발자 앱의 REST API 키
  KAKAO_REFRESH_TOKEN  (필수) kakao_setup.py 로 발급한 리프레시 토큰
  KAKAO_CLIENT_SECRET  (선택) 앱에서 Client Secret 을 켠 경우
"""
import json
import os
import sys

import requests

TOKEN_URL = "https://kauth.kakao.com/oauth/token"
MEMO_URL = "https://kapi.kakao.com/v2/api/talk/memo/default/send"


def _access_token() -> str:
    data = {
        "grant_type": "refresh_token",
        "client_id": os.environ["KAKAO_REST_API_KEY"],
        "refresh_token": os.environ["KAKAO_REFRESH_TOKEN"],
    }
    if os.environ.get("KAKAO_CLIENT_SECRET"):
        data["client_secret"] = os.environ["KAKAO_CLIENT_SECRET"]
    r = requests.post(TOKEN_URL, data=data, timeout=20)
    j = r.json()
    if "access_token" not in j:
        raise RuntimeError(f"카카오 토큰 갱신 실패: {j}")
    if j.get("refresh_token"):  # 만료 임박 시 새 리프레시 토큰이 발급됨
        print("⚠ 새 KAKAO_REFRESH_TOKEN 이 발급됨 → 시크릿을 아래 값으로 교체하세요:\n"
              f"  {j['refresh_token']}", file=sys.stderr)
    return j["access_token"]


def send(text: str, link: str = "https://finance.yahoo.com/quote/TSM") -> None:
    if not (os.environ.get("KAKAO_REST_API_KEY") and os.environ.get("KAKAO_REFRESH_TOKEN")):
        raise RuntimeError("KAKAO_REST_API_KEY / KAKAO_REFRESH_TOKEN 환경변수가 없습니다.")
    tpl = {"object_type": "text", "text": text[:200],
           "link": {"web_url": link, "mobile_web_url": link}, "button_title": "자세히"}
    r = requests.post(MEMO_URL,
                      headers={"Authorization": f"Bearer {_access_token()}"},
                      data={"template_object": json.dumps(tpl, ensure_ascii=False)},
                      timeout=20)
    j = r.json()
    if j.get("result_code") != 0:
        raise RuntimeError(f"카카오톡 전송 실패: {j}")
