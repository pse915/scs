"""
학생 상담 신청 및 상담 기록 통합 관리 시스템 - 메인 엔트리포인트 (app.py)
"""
from collections import OrderedDict
from pathlib import Path
from typing import Any, Dict, Optional
import streamlit as st
import streamlit.components.v1 as components

from backend.auth import get_auth_status, login_admin, logout_admin, require_admin
from backend.security import build_client_payload, check_rate_limit
from backend.sheets import (
    ensure_sheets_initialized,
    fetch_all_sheets_cached,
    get_public_config_and_ui,
    clear_sheets_cache,
)
from backend.counseling import (
    create_counseling_request,
    lookup_student_requests,
    cancel_student_own_request,
    update_request_status_by_admin,
    create_counseling_record,
    update_counseling_record,
    delete_counseling_record,
    save_categories_by_admin,
    save_system_settings_by_admin,
    build_admin_dashboard_data,
)
from backend.students import upsert_student_by_admin
from backend.ui_config import (
    save_ui_draft,
    publish_ui_config,
    reset_ui_to_default,
)
from backend.export import generate_export_package

st.set_page_config(
    page_title="학생 상담 관리 시스템",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="collapsed",
)

st.markdown(
    """
    <style>
        #MainMenu, header, footer, [data-testid="stToolbar"], [data-testid="stDecoration"] {
            display: none !important;
        }
        .stApp {
            background-color: #F5F5F7;
        }
        .block-container {
            padding: 0 !important;
            max-width: 100% !important;
            margin: 0 !important;
        }
        iframe {
            border: none !important;
            display: block !important;
            width: 100% !important;
        }
    </style>
    """,
    unsafe_allow_html=True,
)

FRONTEND_DIST_DIR = Path(__file__).parent / "frontend" / "dist"


def _get_react_component():
    if (FRONTEND_DIST_DIR / "index.html").exists():
        return components.declare_component(
            "student_counseling_portal",
            path=str(FRONTEND_DIST_DIR),
        )
    return None


def _get_idempotency_store() -> OrderedDict:
    if "_processed_requests" not in st.session_state:
        st.session_state["_processed_requests"] = OrderedDict()
    return st.session_state["_processed_requests"]


def _save_idempotent_response(request_id: str, response: Dict[str, Any]) -> Dict[str, Any]:
    store = _get_idempotency_store()
    store[request_id] = response
    while len(store) > 500:
        store.popitem(last=False)
    return response


def dispatch_action(message: Dict[str, Any]) -> Dict[str, Any]:
    request_id = str(message.get("request_id", "")).strip()
    action = str(message.get("action", "")).strip()
    session_token = message.get("session_token")
    payload = message.get("payload") or {}

    if not request_id or not action:
        return {
            "request_id": request_id,
            "status": "error",
            "data": None,
            "error": "잘못된 요청 형식입니다.",
        }

    store = _get_idempotency_store()
    if request_id in store:
        return store[request_id]

    try:
        if action == "ADMIN_LOGIN":
            if not check_rate_limit("admin_login", max_calls=10, window_seconds=60):
                return _save_idempotent_response(
                    request_id,
                    {"request_id": request_id, "status": "error", "data": None, "error": "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."},
                )
            ok, msg, auth_info = login_admin(str(payload.get("password", "")))
            return _save_idempotent_response(
                request_id,
                {
                    "request_id": request_id,
                    "status": "success" if ok else "error",
                    "data": {"message": msg, "session_token": auth_info.get("session_token")} if ok else None,
                    "error": None if ok else msg,
                },
            )

        if action == "ADMIN_LOGOUT":
            logout_admin()
            return _save_idempotent_response(
                request_id,
                {"request_id": request_id, "status": "success", "data": {"message": "로그아웃되었습니다."}, "error": None},
            )

        if action == "REFRESH_DATA":
            clear_sheets_cache()
            st.session_state["_sheets_initialized_ok"] = False
            return _save_idempotent_response(
                request_id,
                {"request_id": request_id, "status": "success", "data": {"message": "최신 데이터로 동기화되었습니다."}, "error": None},
            )

        if action == "SUBMIT_COUNSELING_REQUEST":
            if not check_rate_limit("student_apply", max_calls=5, window_seconds=120):
                return _save_idempotent_response(
                    request_id,
                    {"request_id": request_id, "status": "error", "data": None, "error": "단시간에 너무 많은 신청을 시도했습니다. 2분 후 다시 시도해 주세요."},
                )
            db = fetch_all_sheets_cached()
            ok, msg, data = create_counseling_request(db, payload)
            return _save_idempotent_response(
                request_id,
                {"request_id": request_id, "status": "success" if ok else "error", "data": data if ok else None, "error": None if ok else msg},
            )

        if action == "LOOKUP_STUDENT_REQUESTS":
            if not check_rate_limit("student_lookup", max_calls=20, window_seconds=60):
                return _save_idempotent_response(
                    request_id,
                    {"request_id": request_id, "status": "error", "data": None, "error": "조회 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요."},
                )
            db = fetch_all_sheets_cached()
            ok, msg, items = lookup_student_requests(db, payload)
            return _save_idempotent_response(
                request_id,
                {"request_id": request_id, "status": "success" if ok else "error", "data": {"items": items, "message": msg} if ok else None, "error": None if ok else msg},
            )

        if action == "CANCEL_OWN_REQUEST":
            db = fetch_all_sheets_cached()
            ok, msg = cancel_student_own_request(db, payload)
            return _save_idempotent_response(
                request_id,
                {"request_id": request_id, "status": "success" if ok else "error", "data": {"message": msg} if ok else None, "error": None if ok else msg},
            )

        is_admin, auth_err = require_admin(session_token)
        if not is_admin:
            return _save_idempotent_response(
                request_id,
                {"request_id": request_id, "status": "error", "data": None, "error": auth_err},
            )

        db = fetch_all_sheets_cached()

        if action == "UPDATE_REQUEST_STATUS":
            ok, msg = update_request_status_by_admin(db, payload)
            return _save_idempotent_response(
                request_id,
                {"request_id": request_id, "status": "success" if ok else "error", "data": {"message": msg} if ok else None, "error": None if ok else msg},
            )

        if action == "UPSERT_STUDENT":
            ok, msg, data = upsert_student_by_admin(db, payload)
            return _save_idempotent_response(
                request_id,
                {"request_id": request_id, "status": "success" if ok else "error", "data": {**(data or {}), "message": msg} if ok else None, "error": None if ok else msg},
            )

        if action == "CREATE_COUNSELING_RECORD":
            ok, msg, data = create_counseling_record(db, payload)
            return _save_idempotent_response(
                request_id,
                {"request_id": request_id, "status": "success" if ok else "error", "data": {**(data or {}), "message": msg} if ok else None, "error": None if ok else msg},
            )

        if action == "UPDATE_COUNSELING_RECORD":
            ok, msg = update_counseling_record(db, payload)
            return _save_idempotent_response(
                request_id,
                {"request_id": request_id, "status": "success" if ok else "error", "data": {"message": msg} if ok else None, "error": None if ok else msg},
            )

        if action == "DELETE_COUNSELING_RECORD":
            ok, msg = delete_counseling_record(db, payload)
            return _save_idempotent_response(
                request_id,
                {"request_id": request_id, "status": "success" if ok else "error", "data": {"message": msg} if ok else None, "error": None if ok else msg},
            )

        if action == "SAVE_CATEGORIES":
            ok, msg = save_categories_by_admin(db, payload)
            return _save_idempotent_response(
                request_id,
                {"request_id": request_id, "status": "success" if ok else "error", "data": {"message": msg} if ok else None, "error": None if ok else msg},
            )

        if action == "SAVE_SYSTEM_SETTINGS":
            ok, msg = save_system_settings_by_admin(db, payload)
            return _save_idempotent_response(
                request_id,
                {"request_id": request_id, "status": "success" if ok else "error", "data": {"message": msg} if ok else None, "error": None if ok else msg},
            )

        if action == "SAVE_UI_DRAFT":
            ok, msg, data = save_ui_draft(payload)
            return _save_idempotent_response(
                request_id,
                {"request_id": request_id, "status": "success" if ok else "error", "data": {**data, "message": msg} if ok else None, "error": None if ok else msg},
            )

        if action == "PUBLISH_UI_CONFIG":
            ok, msg, data = publish_ui_config(payload)
            return _save_idempotent_response(
                request_id,
                {"request_id": request_id, "status": "success" if ok else "error", "data": {**data, "message": msg} if ok else None, "error": None if ok else msg},
            )

        if action == "RESET_UI_DEFAULT":
            ok, msg, data = reset_ui_to_default()
            return _save_idempotent_response(
                request_id,
                {"request_id": request_id, "status": "success" if ok else "error", "data": {**data, "message": msg} if ok else None, "error": None if ok else msg},
            )

        if action == "EXPORT_DATA":
            ok, msg, data = generate_export_package(db, payload)
            return _save_idempotent_response(
                request_id,
                {"request_id": request_id, "status": "success" if ok else "error", "data": {**data, "message": msg} if ok else None, "error": None if ok else msg},
            )

        return _save_idempotent_response(
            request_id,
            {"request_id": request_id, "status": "error", "data": None, "error": f"지원하지 않는 액션입니다: {action}"},
        )

    except Exception as e:
        return _save_idempotent_response(
            request_id,
            {"request_id": request_id, "status": "error", "data": None, "error": f"처리 중 오류가 발생했습니다: {str(e)}"},
        )


def main() -> None:
    react_component = _get_react_component()

    if react_component is None:
        st.error("React 프론트엔드 빌드 파일(frontend/dist/index.html)을 찾을 수 없습니다.")
        st.info("터미널에서 `cd frontend && npm install && npm run build` 명령을 실행해 주세요.")
        return

    sheets_ok, sheets_err = ensure_sheets_initialized()

    public_config: Dict[str, Any] = {
        "categories": [],
        "notice_banner": "",
        "operating_hours": "",
        "precautions": "",
        "completion_guide": "",
        "public_stats": {"completed_count": 0, "active_categories": 0},
    }
    ui_schema: Dict[str, Any] = {"published": None, "draft": None}
    db: Dict[str, Any] = {}

    if sheets_ok:
        try:
            db = fetch_all_sheets_cached()
            public_config, ui_schema = get_public_config_and_ui(db)
            completed_cnt = sum(
                1 for r in db.get("상담신청", []) if r.get("status") == "상담 완료"
            )
            public_config["public_stats"] = {
                "completed_count": completed_cnt,
                "active_categories": len(public_config.get("categories", [])),
            }
        except Exception as e:
            sheets_ok = False
            sheets_err = f"데이터 조회 중 오류가 발생했습니다: {str(e)}"
    else:
        from backend.sheets import load_default_ui_json, DEFAULT_SETTINGS, DEFAULT_CATEGORIES
        import uuid

        fallback_ui = load_default_ui_json()
        ui_schema = {"published": fallback_ui, "draft": fallback_ui}
        public_config = {
            "categories": [
                {"category_uuid": str(uuid.uuid4()), "name": n, "description": d, "display_order": o}
                for n, d, o in DEFAULT_CATEGORIES
            ],
            **DEFAULT_SETTINGS,
            "public_stats": {"completed_count": 0, "active_categories": len(DEFAULT_CATEGORIES)},
        }

    action_response: Optional[Dict[str, Any]] = st.session_state.pop("_last_action_response", None)

    auth_state = get_auth_status()
    admin_data: Optional[Dict[str, Any]] = None

    if auth_state.get("is_authenticated"):
        if sheets_ok and db:
            admin_data = build_admin_dashboard_data(db)
        else:
            admin_data = {"sheets_initialized": False}

    client_payload = build_client_payload(
        auth_state=auth_state,
        sheets_status={"connected": sheets_ok, "error": sheets_err},
        public_config=public_config,
        ui_schema=ui_schema,
        admin_data=admin_data,
        action_response=action_response,
    )

    component_event = react_component(
        payload=client_payload,
        key="main_counseling_app",
        default=None,
    )

    if isinstance(component_event, dict) and component_event.get("request_id"):
        req_id = str(component_event["request_id"])
        if req_id != st.session_state.get("_last_handled_request_id"):
            st.session_state["_last_handled_request_id"] = req_id
            resp = dispatch_action(component_event)
            st.session_state["_last_action_response"] = resp
            st.rerun()


if __name__ == "__main__":
    main()
