"""
관리자 인증 및 세션 관리 모듈
- Streamlit Secrets의 ADMIN_PASSWORD 상수 시간 비교 검증
- 연속 5회 로그인 실패 시 일시 잠금(Brute-force 방어)
- 서버 세션 바인딩 토큰 발급 및 검증
"""
import hmac
import secrets
import time
from typing import Any, Dict, Tuple
import streamlit as st

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_SECONDS = 60


def get_auth_status() -> Dict[str, Any]:
    is_auth = bool(st.session_state.get("_admin_authenticated", False))
    token = st.session_state.get("_admin_session_token") if is_auth else None
    return {
        "is_authenticated": is_auth,
        "session_token": token,
    }


def login_admin(password: str) -> Tuple[bool, str, Dict[str, Any]]:
    now = time.time()
    locked_until = float(st.session_state.get("_admin_locked_until", 0))
    if now < locked_until:
        remain = int(locked_until - now) + 1
        return False, f"로그인 시도가 여러 번 실패하여 {remain}초 동안 잠금 상태입니다.", {}

    configured_pw = str(st.secrets.get("ADMIN_PASSWORD", "")).strip()
    if not configured_pw:
        return False, "서버에 ADMIN_PASSWORD가 설정되어 있지 않습니다. Secrets 설정을 확인해 주세요.", {}

    candidate = str(password or "").strip()
    if not candidate or not hmac.compare_digest(candidate, configured_pw):
        fails = int(st.session_state.get("_admin_failed_attempts", 0)) + 1
        st.session_state["_admin_failed_attempts"] = fails
        if fails >= MAX_FAILED_ATTEMPTS:
            st.session_state["_admin_locked_until"] = now + LOCKOUT_SECONDS
            st.session_state["_admin_failed_attempts"] = 0
            return False, f"비밀번호를 {MAX_FAILED_ATTEMPTS}회 잘못 입력하여 {LOCKOUT_SECONDS}초 동안 잠금됩니다.", {}
        return False, f"관리자 비밀번호가 일치하지 않습니다. ({fails}/{MAX_FAILED_ATTEMPTS}회 실패)", {}

    # 인증 성공
    st.session_state["_admin_failed_attempts"] = 0
    st.session_state["_admin_locked_until"] = 0
    token = secrets.token_urlsafe(32)
    st.session_state["_admin_authenticated"] = True
    st.session_state["_admin_session_token"] = token
    return True, "관리자 인증이 완료되었습니다.", {"session_token": token}


def logout_admin() -> None:
    st.session_state["_admin_authenticated"] = False
    st.session_state.pop("_admin_session_token", None)


def require_admin(session_token: Any) -> Tuple[bool, str]:
    is_auth = bool(st.session_state.get("_admin_authenticated", False))
    expected_token = str(st.session_state.get("_admin_session_token", ""))
    provided_token = str(session_token or "")

    if not is_auth or not expected_token or not provided_token:
        return False, "관리자 인증이 필요하거나 세션이 만료되었습니다. 다시 로그인해 주세요."

    if not hmac.compare_digest(provided_token, expected_token):
        return False, "유효하지 않은 관리자 세션 토큰입니다."

    return True, ""
