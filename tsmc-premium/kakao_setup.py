#!/usr/bin/env python3
"""최초 1회: 카카오 리프레시 토큰 발급 도우미.

사전 준비 (https://developers.kakao.com):
 1) 애플리케이션 추가 → 앱 키의 'REST API 키' 복사
 2) 카카오 로그인 → 활성화 ON, Redirect URI 에 https://localhost:3000 등록
 3) 동의항목 → '카카오톡 메시지 전송(talk_message)' 설정 (선택 동의)
실행:  python kakao_setup.py <REST_API_KEY> [redirect_uri] [client_secret]
"""
import sys

import requests

key = sys.argv[1]
redirect = sys.argv[2] if len(sys.argv) > 2 else "https://localhost:3000"
secret = sys.argv[3] if len(sys.argv) > 3 else None
print("아래 URL을 브라우저에서 열어 로그인/동의 후, 주소창의 ?code= 뒤 값을 복사하세요:\n")
print(f"https://kauth.kakao.com/oauth/authorize?client_id={key}"
      f"&redirect_uri={redirect}&response_type=code&scope=talk_message\n")
code = input("code: ").strip()
data = {"grant_type": "authorization_code", "client_id": key,
        "redirect_uri": redirect, "code": code}
if secret:
    data["client_secret"] = secret
j = requests.post("https://kauth.kakao.com/oauth/token", data=data, timeout=20).json()
if "refresh_token" not in j:
    sys.exit(f"실패: {j}")
print("\nKAKAO_REST_API_KEY  =", key)
print("KAKAO_REFRESH_TOKEN =", j["refresh_token"], "(유효 60일, 만료 1달 전부터 갱신 시 새 값 발급)")
