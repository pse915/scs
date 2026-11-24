"""
보안 및 데이터 격리 유틸리티
- Google Sheets 수식 인젝션(=, +, -, @, 탭, 개행) 무력화
- 비인증 클라이언트로 전달되는 payload에서 관리자 데이터 및 Draft UI 완전 제거
- 단시간 반복 요청 차단(Rate Limiting) 및 조회 PIN 해시 검증
"""
import hashlib
import hmac
import time
from typing import Any, Dict, List, Optional
import streamlit as st

DANGEROUS_FORMULA_PREFIXES = ("=", "+", "-", "@", "\t", "\r")


def sanitize_cell(value: Any) -> str:
    """스프레드시트 셀 값의 수식 인젝션 위험 문자를 이스케이프합니다."""
    if value is None:
        return ""
    text = str(value)
    if text.startswith(DANGEROUS_FORMULA_PREFIXES):
        return "'" + text
    return text


def sanitize_row(row: List[Any]) -> List[str]:
    """행 전체의 각 셀에 수식 인젝션 방어 처리를 적용합니다."""
    return [sanitize_cell(cell) for cell in row]


def hash_pin(pin: str) -> str:
    """학생 조회용 4~6자리 비밀번호(PIN)를 솔트 기반 SHA-256으로 해싱합니다."""
    clean = str(pin or "").strip()
    if not clean:
        return ""
    secret = str(st.secrets.get("SESSION_SECRET", "default-pin-salt"))
    digest = hmac.new(secret.encode("utf-8"), clean.encode("utf-8"), hashlib.sha256).hexdigest()
    return digest


def verify_pin(pin: str, stored_hash: str) -> bool:
    """입력된 PIN과 저장된 해시값을 상수 시간(constant-time)으로 비교합니다."""
    if not stored_hash:
        return True
    candidate = hash_pin(pin)
    return hmac.compare_digest(candidate, str(stored_hash))


def check_rate_limit(bucket: str, max_calls: int = 10, window_seconds: int = 60) -> bool:
    """세션 기반 요청 빈도 제한(Rate Limiting)을 수행합니다."""
    store = st.session_state.setdefault("_rate_limits", {})
    now = time.time()
    timestamps: List[float] = [t for t in store.get(bucket, []) if now - t < window_seconds]
    if len(timestamps) >= max_calls:
        store[bucket] = timestamps
        return False
    timestamps.append(now)
    store[bucket] = timestamps
    return True


def build_client_payload(
    auth_state: Dict[str, Any],
    sheets_status: Dict[str, Any],
    public_config: Dict[str, Any],
    ui_schema: Dict[str, Any],
    admin_data: Optional[Dict[str, Any]],
    action_response: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    프론트엔드(React)에 전달할 최종 JSON 페이로드를 생성합니다.
    관리자 인증이 완료되지 않은 경우 admin_data와 draft UI 스키마는 무조건 None으로 격리합니다.
    """
    is_admin = bool(auth_state.get("is_authenticated"))

    safe_ui_schema = {
        "published": ui_schema.get("published"),
        "draft": ui_schema.get("draft") if is_admin else None,
    }

    return {
        "auth_state": {
            "is_authenticated": is_admin,
            "session_token": auth_state.get("session_token") if is_admin else None,
        },
        "sheets_status": sheets_status,
        "public_config": public_config,
        "ui_schema": safe_ui_schema,
        "admin_data": admin_data if is_admin else None,
        "action_response": action_response,
    }
