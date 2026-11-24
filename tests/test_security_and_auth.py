from backend.auth import get_auth_status, login_admin, logout_admin, require_admin
from backend.security import build_client_payload, sanitize_cell, sanitize_row


def test_formula_injection_sanitization():
    assert sanitize_cell("=cmd|'/C calc'!A0").startswith("'=cmd")
    assert sanitize_cell("+1+2+3").startswith("'+1+2+3")
    assert sanitize_cell("-100").startswith("'-100")
    assert sanitize_cell("@SUM(A1:A10)").startswith("'@SUM")
    assert sanitize_cell("정상적인 상담 사유입니다.") == "정상적인 상담 사유입니다."

    sanitized_row = sanitize_row(["10101", '=HYPERLINK("http://evil.com")', "김민준"])
    assert sanitized_row[0] == "10101"
    assert sanitized_row[1].startswith("'=")
    assert sanitized_row[2] == "김민준"


def test_unauthenticated_payload_isolation():
    unauth_state = {"is_authenticated": False}
    payload = build_client_payload(
        auth_state=unauth_state,
        sheets_status={"connected": True, "error": None},
        public_config={"categories": [], "notice_banner": "공지"},
        ui_schema={"published": {"version": 1}, "draft": {"version": 2, "secret_edit": True}},
        admin_data={"students": [{"name": "홍길동"}], "records": [{"topic": "비밀상담"}]},
        action_response=None,
    )

    assert payload["admin_data"] is None
    assert payload["ui_schema"]["published"] == {"version": 1}
    assert payload["ui_schema"]["draft"] is None


def test_admin_login_logout_and_token_validation():
    ok, msg, info = login_admin("wrong-password")
    assert ok is False
    assert info == {}

    ok, msg, info = login_admin("TestAdminPassword!2026")
    assert ok is True
    token = info.get("session_token")
    assert token and len(token) > 20

    valid, err = require_admin(token)
    assert valid is True
    assert err == ""

    valid_fake, err_fake = require_admin("forged-token-value")
    assert valid_fake is False
    assert "인증" in err_fake or "만료" in err_fake

    logout_admin()
    assert get_auth_status()["is_authenticated"] is False
    valid_after_logout, _ = require_admin(token)
    assert valid_after_logout is False


def test_admin_login_bruteforce_lockout():
    for _ in range(5):
        ok, _, _ = login_admin("invalid-pass")
        assert ok is False

    ok_locked, msg_locked, _ = login_admin("TestAdminPassword!2026")
    assert ok_locked is False
    assert "잠금" in msg_locked or "초" in msg_locked
