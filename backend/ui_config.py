"""
시각적 UI 페이지 빌더 설정 관리 모듈
- Draft(임시 저장)와 Published(실제 학생용 홈페이지 반영) 완전 분리
- Google Sheets 'UI설정' 시트 영속화 및 변경이력 감사 로그 기록
- 단일 셀 용량(45,000자) 초과 시 자동 청크 분할 저장 지원
"""
import json
import uuid
from typing import Any, Dict, List, Tuple

from backend.sheets import (
    MAX_CELL_CHARS,
    SHEET_SCHEMAS,
    get_sheets_service,
    clear_sheets_cache,
    append_audit_log,
    load_default_ui_json,
    now_kst_str,
)
from backend.security import sanitize_row
from backend.validation import validate_ui_schema


def _split_json_chunks(raw_str: str, chunk_size: int = MAX_CELL_CHARS) -> List[str]:
    """긴 JSON 문자열을 Google Sheets 단일 셀 안전 한도 크기로 분할합니다."""
    if not raw_str:
        return ["{}"]
    return [raw_str[i : i + chunk_size] for i in range(0, len(raw_str), chunk_size)]


def _upsert_ui_env_rows(
    env_type: str, page_key: str, schema_version: int, ui_json_str: str
) -> None:
    service, spreadsheet_id = get_sheets_service()
    headers = SHEET_SCHEMAS["UI설정"]

    res = (
        service.spreadsheets()
        .values()
        .get(spreadsheetId=spreadsheet_id, range="'UI설정'!A1:Z")
        .execute()
    )
    all_rows = res.get("values", [])
    data_rows = all_rows[1:] if len(all_rows) > 1 else []

    preserved_rows: List[List[Any]] = []
    for row in data_rows:
        r_env = row[1] if len(row) > 1 else ""
        r_page = row[2] if len(row) > 2 else ""
        if not (r_env == env_type and r_page == page_key):
            padded = [row[i] if i < len(row) else "" for i in range(len(headers))]
            preserved_rows.append(padded)

    now = now_kst_str()
    chunks = _split_json_chunks(ui_json_str)
    new_env_rows: List[List[Any]] = [
        [str(uuid.uuid4()), env_type, page_key, schema_version, chunk, now]
        for chunk in chunks
    ]

    final_rows = [headers] + preserved_rows + new_env_rows
    safe_final_rows = [final_rows[0]] + [sanitize_row(r) for r in final_rows[1:]]

    service.spreadsheets().values().clear(
        spreadsheetId=spreadsheet_id,
        range="'UI설정'!A1:Z",
    ).execute()

    service.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id,
        range="'UI설정'!A1",
        valueInputOption="RAW",
        body={"values": safe_final_rows},
    ).execute()

    clear_sheets_cache()


def save_ui_draft(payload: Dict[str, Any]) -> Tuple[bool, str, Dict[str, Any]]:
    ui_schema = payload.get("ui_schema")
    ok, msg = validate_ui_schema(ui_schema)
    if not ok:
        return False, msg, {}

    schema_version = int(ui_schema.get("version") or 1)
    serialized = json.dumps(ui_schema, ensure_ascii=False)

    _upsert_ui_env_rows("draft", "home", schema_version, serialized)
    append_audit_log(
        "ADMIN",
        "SAVE_UI_DRAFT",
        "UI설정",
        "draft:home",
        f"홈페이지 디자인 임시 저장 (크기: {len(serialized)}자)",
    )

    return (
        True,
        "편집 중인 디자인이 임시 저장되었습니다. '게시'를 누르면 학생용 홈페이지에 반영됩니다.",
        {"draft": ui_schema},
    )


def publish_ui_config(payload: Dict[str, Any]) -> Tuple[bool, str, Dict[str, Any]]:
    ui_schema = payload.get("ui_schema")
    ok, msg = validate_ui_schema(ui_schema)
    if not ok:
        return False, msg, {}

    schema_version = int(ui_schema.get("version") or 1)
    serialized = json.dumps(ui_schema, ensure_ascii=False)

    _upsert_ui_env_rows("draft", "home", schema_version, serialized)
    _upsert_ui_env_rows("published", "home", schema_version, serialized)

    comp_count = len(ui_schema.get("pages", {}).get("home", {}).get("components", []))
    append_audit_log(
        "ADMIN",
        "PUBLISH_UI",
        "UI설정",
        "published:home",
        f"학생용 홈페이지 디자인 게시 완료 (최상위 블록 {comp_count}개)",
    )

    return (
        True,
        "변경된 디자인이 실제 학생용 홈페이지에 성공적으로 게시되었습니다.",
        {"published": ui_schema, "draft": ui_schema},
    )


def reset_ui_to_default() -> Tuple[bool, str, Dict[str, Any]]:
    default_schema = load_default_ui_json()
    serialized = json.dumps(default_schema, ensure_ascii=False)

    _upsert_ui_env_rows("draft", "home", 1, serialized)
    append_audit_log(
        "ADMIN",
        "RESET_UI_DRAFT",
        "UI설정",
        "draft:home",
        "기본 디자인 템플릿으로 초기화(임시 저장)",
    )

    return (
        True,
        "기본 디자인 템플릿을 편집 캔버스에 불러왔습니다. '게시'를 누르면 학생 화면에 적용됩니다.",
        {"draft": default_schema},
    )
