"""
Google Sheets API 연동 및 7개 시트 스키마 자동 초기화·캐시 계층
"""
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
from typing import Any, Dict, List, Tuple
import uuid
import streamlit as st
from google.oauth2 import service_account
from googleapiclient.discovery import build

from backend.security import sanitize_row

KST = timezone(timedelta(hours=9))
MAX_CELL_CHARS = 45000

SHEET_SCHEMAS: Dict[str, List[str]] = {
    "학생정보": [
        "student_uuid", "student_number", "grade", "class_num", "number",
        "name", "gender", "phone", "guardian_phone", "note",
        "total_counseling_count", "last_counseling_date", "created_at", "updated_at",
    ],
    "상담신청": [
        "request_uuid", "student_uuid", "student_number", "grade", "class_num",
        "number", "name", "category", "preferred_date", "preferred_time",
        "reason", "additional_note", "lookup_pin_hash", "status", "created_at", "updated_at",
    ],
    "상담기록": [
        "record_uuid", "student_uuid", "request_uuid", "counseling_date", "counseling_time",
        "counseling_type", "category", "topic", "presenting_issue", "progress_content",
        "counseling_result", "followup_plan", "next_counseling_date", "admin_memo",
        "is_deleted", "created_at", "updated_at",
    ],
    "상담분야": [
        "category_uuid", "name", "description", "display_order",
        "is_active", "created_at", "updated_at",
    ],
    "시스템설정": [
        "setting_key", "setting_value", "updated_at",
    ],
    "UI설정": [
        "ui_uuid", "env_type", "page_key", "schema_version", "ui_json", "updated_at",
    ],
    "변경이력": [
        "log_uuid", "actor", "action_type", "target_sheet", "target_id", "summary", "created_at",
    ],
}

DEFAULT_CATEGORIES: List[Tuple[str, str, int]] = [
    ("진로·진학", "선택과목, 진로 탐색, 고입·대입 진학 설계 상담", 1),
    ("학업·학습", "공부 방법, 시험 불안, 학습 계획 및 집중력 향상 상담", 2),
    ("교우관계", "친구 관계 갈등, 학교 적응 및 의사소통 고민 상담", 3),
    ("정서·심리", "스트레스, 우울·불안, 자존감 및 마음 건강 상담", 4),
    ("가족·가정", "부모님 및 가족과의 대화, 가정 내 고민 상담", 5),
    ("기타 생활", "학교생활 전반 및 기타 개인 고민 상담", 6),
]

DEFAULT_SETTINGS: Dict[str, str] = {
    "notice_banner": "본관 2층 위(Wee)클래스 상담실은 평일 08:30 ~ 16:30 상시 열려 있습니다. 긴급한 도움이 필요하면 언제든 방문해 주세요.",
    "operating_hours": "• 운영 시간: 월~금요일 08:30 ~ 16:30 (점심시간 및 방과 후 상담 가능)\n• 상담 장소: 본관 2층 위(Wee)클래스 상담실\n• 상담 방식: 1:1 개인 대면 상담 (필요 시 보호자 연계 상담 지원)",
    "precautions": "• 수업 시간 중 상담이 필요한 경우 담임선생님 및 교과선생님의 사전 허락이 필요합니다.\n• 신청서 작성 시 학번, 이름, 조회 비밀번호를 정확히 입력해 주세요.\n• 허위 신청이나 장난성 신청은 제한될 수 있습니다.",
    "completion_guide": "1. 온라인 상담 신청 접수 후 상담 선생님이 일정을 확인합니다.\n2. '상담 확정' 상태로 변경되면 안내된 일시에 상담실로 방문합니다.\n3. 일정 변경이나 취소가 필요할 경우 '내 신청 내역 조회'에서 상태가 '접수'일 때 직접 취소할 수 있습니다.",
}


def now_kst_str() -> str:
    return datetime.now(KST).strftime("%Y-%m-%d %H:%M:%S")


def load_default_ui_json() -> Dict[str, Any]:
    default_path = Path(__file__).resolve().parent.parent / "config" / "default_ui.json"
    if default_path.exists():
        return json.loads(default_path.read_text(encoding="utf-8"))
    return {"version": 1, "globalStyles": {"backgroundColor": "#F5F5F7"}, "pages": {"home": {"components": []}}}


def get_sheets_service():
    if "gcp_service_account" not in st.secrets or "SPREADSHEET_ID" not in st.secrets:
        raise RuntimeError("Streamlit Secrets에 gcp_service_account 또는 SPREADSHEET_ID가 설정되지 않았습니다.")

    sa_info = dict(st.secrets["gcp_service_account"])
    if "private_key" in sa_info and isinstance(sa_info["private_key"], str):
        sa_info["private_key"] = sa_info["private_key"].replace("\\n", "\n")

    creds = service_account.Credentials.from_service_account_info(
        sa_info,
        scopes=["https://www.googleapis.com/auth/spreadsheets"],
    )
    service = build("sheets", "v4", credentials=creds, cache_discovery=False)
    spreadsheet_id = str(st.secrets["SPREADSHEET_ID"]).strip()
    return service, spreadsheet_id


def clear_sheets_cache() -> None:
    st.session_state.pop("_sheets_cache_data", None)
    st.session_state.pop("_sheets_cache_ts", None)


def ensure_sheets_initialized() -> Tuple[bool, str]:
    if st.session_state.get("_sheets_initialized_ok"):
        return True, ""

    try:
        service, spreadsheet_id = get_sheets_service()
        meta = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
        existing_titles = {s["properties"]["title"] for s in meta.get("sheets", [])}

        add_requests = []
        for title in SHEET_SCHEMAS:
            if title not in existing_titles:
                add_requests.append({"addSheet": {"properties": {"title": title}}})

        if add_requests:
            service.spreadsheets().batchUpdate(
                spreadsheetId=spreadsheet_id,
                body={"requests": add_requests},
            ).execute()

        now = now_kst_str()
        for title, headers in SHEET_SCHEMAS.items():
            res = service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id,
                range=f"'{title}'!A1:Z5",
            ).execute()
            rows = res.get("values", [])
            if not rows:
                init_rows = [headers]
                if title == "상담분야":
                    for name, desc, order in DEFAULT_CATEGORIES:
                        init_rows.append([str(uuid.uuid4()), name, desc, order, "TRUE", now, now])
                elif title == "시스템설정":
                    for k, v in DEFAULT_SETTINGS.items():
                        init_rows.append([k, v, now])
                elif title == "UI설정":
                    default_ui_str = json.dumps(load_default_ui_json(), ensure_ascii=False)
                    init_rows.append([str(uuid.uuid4()), "published", "home", 1, default_ui_str, now])
                    init_rows.append([str(uuid.uuid4()), "draft", "home", 1, default_ui_str, now])

                safe_rows = [init_rows[0]] + [sanitize_row(r) for r in init_rows[1:]]
                service.spreadsheets().values().update(
                    spreadsheetId=spreadsheet_id,
                    range=f"'{title}'!A1",
                    valueInputOption="RAW",
                    body={"values": safe_rows},
                ).execute()

        st.session_state["_sheets_initialized_ok"] = True
        return True, ""
    except Exception as e:
        return False, f"Google Sheets 연결 오류: {str(e)}"


def fetch_all_sheets_cached(ttl_seconds: int = 15) -> Dict[str, List[Dict[str, Any]]]:
    import time

    cached = st.session_state.get("_sheets_cache_data")
    cached_ts = float(st.session_state.get("_sheets_cache_ts", 0))
    if cached is not None and (time.time() - cached_ts) < ttl_seconds:
        return cached

    service, spreadsheet_id = get_sheets_service()
    ranges = [f"'{title}'!A1:Z" for title in SHEET_SCHEMAS]
    batch_res = service.spreadsheets().values().batchGet(
        spreadsheetId=spreadsheet_id,
        ranges=ranges,
    ).execute()

    db: Dict[str, List[Dict[str, Any]]] = {}
    value_ranges = batch_res.get("valueRanges", [])
    for idx, (title, headers) in enumerate(SHEET_SCHEMAS.items()):
        vr = value_ranges[idx] if idx < len(value_ranges) else {}
        rows = vr.get("values", [])
        records: List[Dict[str, Any]] = []
        for row_idx, r in enumerate(rows[1:], start=2):
            item: Dict[str, Any] = {"_row_index": row_idx}
            for col_idx, h in enumerate(headers):
                item[h] = r[col_idx] if col_idx < len(r) else ""
            records.append(item)
        db[title] = records

    st.session_state["_sheets_cache_data"] = db
    st.session_state["_sheets_cache_ts"] = time.time()
    return db


def append_sheet_row(sheet_name: str, row_values: List[Any]) -> None:
    service, spreadsheet_id = get_sheets_service()
    safe_row = sanitize_row(row_values)
    service.spreadsheets().values().append(
        spreadsheetId=spreadsheet_id,
        range=f"'{sheet_name}'!A1",
        valueInputOption="RAW",
        insertDataOption="INSERT_ROWS",
        body={"values": [safe_row]},
    ).execute()


def update_sheet_row(sheet_name: str, row_index: int, row_values: List[Any]) -> None:
    service, spreadsheet_id = get_sheets_service()
    safe_row = sanitize_row(row_values)
    service.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id,
        range=f"'{sheet_name}'!A{row_index}",
        valueInputOption="RAW",
        body={"values": [safe_row]},
    ).execute()


def append_audit_log(actor: str, action_type: str, target_sheet: str, target_id: str, summary: str) -> None:
    try:
        append_sheet_row(
            "변경이력",
            [str(uuid.uuid4()), actor, action_type, target_sheet, target_id, summary, now_kst_str()],
        )
    except Exception:
        pass


def get_public_config_and_ui(db: Dict[str, List[Dict[str, Any]]]) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    active_cats = [
        {
            "category_uuid": c.get("category_uuid", ""),
            "name": c.get("name", ""),
            "description": c.get("description", ""),
            "display_order": int(c.get("display_order") or 99),
        }
        for c in db.get("상담분야", [])
        if str(c.get("is_active", "TRUE")).upper() == "TRUE"
    ]
    active_cats.sort(key=lambda x: x["display_order"])

    settings_map = dict(DEFAULT_SETTINGS)
    for s in db.get("시스템설정", []):
        k = s.get("setting_key")
        if k:
            settings_map[k] = s.get("setting_value", "")

    public_config = {
        "categories": active_cats,
        "notice_banner": settings_map.get("notice_banner", ""),
        "operating_hours": settings_map.get("operating_hours", ""),
        "precautions": settings_map.get("precautions", ""),
        "completion_guide": settings_map.get("completion_guide", ""),
    }

    # UI설정 청크 조립
    pub_chunks: List[str] = []
    drf_chunks: List[str] = []
    for u in db.get("UI설정", []):
        if u.get("page_key") != "home":
            continue
        if u.get("env_type") == "published":
            pub_chunks.append(u.get("ui_json", ""))
        elif u.get("env_type") == "draft":
            drf_chunks.append(u.get("ui_json", ""))

    default_ui = load_default_ui_json()
    try:
        published_ui = json.loads("".join(pub_chunks)) if pub_chunks else default_ui
    except Exception:
        published_ui = default_ui

    try:
        draft_ui = json.loads("".join(drf_chunks)) if drf_chunks else published_ui
    except Exception:
        draft_ui = published_ui

    return public_config, {"published": published_ui, "draft": draft_ui}
