import app as main_app


def test_unauthorized_admin_actions_blocked():
    for action_name in [
        "UPDATE_REQUEST_STATUS",
        "CREATE_COUNSELING_RECORD",
        "DELETE_COUNSELING_RECORD",
        "SAVE_UI_DRAFT",
        "PUBLISH_UI_CONFIG",
        "EXPORT_DATA",
    ]:
        res = main_app.dispatch_action(
            {
                "request_id": f"unauth-{action_name}",
                "action": action_name,
                "session_token": "invalid-or-empty-token",
                "payload": {},
            }
        )
        assert res["status"] == "error"
        assert res["data"] is None


def test_dispatch_idempotency_prevents_duplicate_execution(monkeypatch):
    call_counter = {"count": 0}

    def fake_login(pw):
        call_counter["count"] += 1
        return True, "로그인 성공", {"session_token": "tok-123"}

    monkeypatch.setattr(main_app, "login_admin", fake_login)

    msg = {
        "request_id": "idem-req-001",
        "action": "ADMIN_LOGIN",
        "payload": {"password": "TestAdminPassword!2026"},
    }

    first = main_app.dispatch_action(msg)
    second = main_app.dispatch_action(msg)

    assert first["status"] == "success"
    assert second == first
    assert call_counter["count"] == 1
