"""
상담 신청 접수·조회·취소 및 관리자 상담 기록·설정·대시보드 집계 모듈
"""
from collections import Counter
from typing import Any, Dict, List, Tuple
import uuid

from backend.security import hash_pin, verify_pin
from backend.sheets import (
    SHEET_SCHEMAS,
    append_audit_log,
    append_sheet_row,
    clear_sheets_cache,
    now_kst_str,
    update_sheet_row,
)
from backend.students import (
    find_or_create_student,
    make_student_number,
    recalculate_student_counseling_stats,
)


def create_counseling_request(
    db: Dict[str, List[Dict[str, Any]]], payload: Dict[str, Any]
) -> Tuple[bool, str, Dict[str, Any]]:
    grade = str(payload.get("grade", "")).strip()
    class_num = str(payload.get("class_num", "")).strip()
    number = str(payload.get("number", "")).strip()
    name = str(payload.get("name", "")).strip()
    category = str(payload.get("category", "")).strip()
    preferred_date = str(payload.get("preferred_date", "")).strip()
    preferred_time = str(payload.get("preferred_time", "")).strip()
    reason = str(payload.get("reason", "")).strip()
    additional_note = str(payload.get("additional_note", "")).strip()
    lookup_pin = str(payload.get("lookup_pin", "")).strip()

    if not (grade and class_num and number and name):
        return False, "학년, 반, 번호, 이름을 모두 입력해 주세요.", {}
    if not category:
        return False, "상담 희망 분야를 선택해 주세요.", {}
    if not preferred_date or not preferred_time:
        return False, "상담 희망 날짜와 시간대를 선택해 주세요.", {}
    if len(reason) < 5:
        return False, "상담 신청 사유를 5자 이상 간단히 작성해 주세요.", {}

    stu = find_or_create_student(db, grade, class_num, number, name)
    s_num = make_student_number(grade, class_num, number)
    req_uuid = str(uuid.uuid4())
    now = now_kst_str()
    pin_hashed = hash_pin(lookup_pin) if lookup_pin else ""

    row = [
        req_uuid,
        stu["student_uuid"],
        s_num,
        grade,
        class_num,
        number,
        name,
        category,
        preferred_date,
        preferred_time,
        reason,
        additional_note,
        pin_hashed,
        "접수",
        now,
        now,
    ]
    append_sheet_row("상담신청", row)
    clear_sheets_cache()
    append_audit_log("STUDENT", "CREATE_REQUEST", "상담신청", req_uuid, f"온라인 상담 신청 접수 ({s_num})")

    return (
        True,
        "상담 신청이 정상적으로 접수되었습니다.",
        {"request_uuid": req_uuid, "student_number": s_num},
    )


def lookup_student_requests(
    db: Dict[str, List[Dict[str, Any]]], payload: Dict[str, Any]
) -> Tuple[bool, str, List[Dict[str, Any]]]:
    s_num = str(payload.get("student_number", "")).strip()
    name = str(payload.get("name", "")).strip()
    pin = str(payload.get("lookup_pin", "")).strip()

    if not s_num or not name:
        return False, "학번과 이름을 모두 입력해 주세요.", []

    matched: List[Dict[str, Any]] = []
    pin_mismatch = False

    for req in db.get("상담신청", []):
        if req.get("student_number") == s_num and req.get("name") == name:
            stored_hash = req.get("lookup_pin_hash", "")
            if stored_hash and not verify_pin(pin, stored_hash):
                pin_mismatch = True
                continue
            safe_item = {
                k: v for k, v in req.items() if k not in ("lookup_pin_hash", "_row_index")
            }
            matched.append(safe_item)

    if not matched and pin_mismatch:
        return False, "조회 비밀번호가 일치하지 않습니다.", []

    matched.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return True, f"총 {len(matched)}건의 신청 내역을 찾았습니다.", matched


def cancel_student_own_request(
    db: Dict[str, List[Dict[str, Any]]], payload: Dict[str, Any]
) -> Tuple[bool, str]:
    req_uuid = str(payload.get("request_uuid", "")).strip()
    s_num = str(payload.get("student_number", "")).strip()
    name = str(payload.get("name", "")).strip()
    pin = str(payload.get("lookup_pin", "")).strip()

    for req in db.get("상담신청", []):
        if req.get("request_uuid") == req_uuid:
            if req.get("student_number") != s_num or req.get("name") != name:
                return False, "본인의 상담 신청 건만 취소할 수 있습니다."
            stored_hash = req.get("lookup_pin_hash", "")
            if stored_hash and not verify_pin(pin, stored_hash):
                return False, "조회 비밀번호가 일치하지 않습니다."
            if req.get("status") != "접수":
                return False, "이미 확정되었거나 완료된 상담은 학생이 직접 취소할 수 없습니다."

            req["status"] = "취소"
            req["updated_at"] = now_kst_str()
            row_index = int(req.get("_row_index") or 2)
            update_sheet_row(
                "상담신청",
                row_index,
                [req.get(h, "") for h in SHEET_SCHEMAS["상담신청"]],
            )
            clear_sheets_cache()
            append_audit_log("STUDENT", "CANCEL_REQUEST", "상담신청", req_uuid, f"학생 본인 신청 취소 ({s_num})")
            return True, "상담 신청이 취소되었습니다."

    return False, "해당 상담 신청 내역을 찾을 수 없습니다."


def update_request_status_by_admin(
    db: Dict[str, List[Dict[str, Any]]], payload: Dict[str, Any]
) -> Tuple[bool, str]:
    req_uuid = str(payload.get("request_uuid", "")).strip()
    new_status = str(payload.get("status", "")).strip()
    if new_status not in ("접수", "상담 확정", "상담 완료", "취소"):
        return False, "유효하지 않은 상담 상태입니다."

    for req in db.get("상담신청", []):
        if req.get("request_uuid") == req_uuid:
            req["status"] = new_status
            req["updated_at"] = now_kst_str()
            row_index = int(req.get("_row_index") or 2)
            update_sheet_row(
                "상담신청",
                row_index,
                [req.get(h, "") for h in SHEET_SCHEMAS["상담신청"]],
            )
            clear_sheets_cache()
            append_audit_log("ADMIN", "UPDATE_REQUEST_STATUS", "상담신청", req_uuid, f"신청 상태 변경 -> {new_status}")
            return True, f"상담 신청 상태가 '{new_status}'(으)로 변경되었습니다."

    return False, "대상 상담 신청을 찾을 수 없습니다."


def create_counseling_record(
    db: Dict[str, List[Dict[str, Any]]], payload: Dict[str, Any]
) -> Tuple[bool, str, Dict[str, Any]]:
    student_uuid = str(payload.get("student_uuid", "")).strip()
    counseling_date = str(payload.get("counseling_date", "")).strip()
    topic = str(payload.get("topic", "")).strip()

    if not student_uuid:
        return False, "상담 대상 학생을 선택해 주세요.", {}
    if not counseling_date or not topic:
        return False, "상담 날짜와 상담 주제는 필수 입력 항목입니다.", {}

    rec_uuid = str(uuid.uuid4())
    request_uuid = str(payload.get("request_uuid", "")).strip()
    now = now_kst_str()

    row = [
        rec_uuid,
        student_uuid,
        request_uuid,
        counseling_date,
        str(payload.get("counseling_time", "")).strip(),
        str(payload.get("counseling_type", "대면 상담")).strip(),
        str(payload.get("category", "기타 생활")).strip(),
        topic,
        str(payload.get("presenting_issue", "")).strip(),
        str(payload.get("progress_content", "")).strip(),
        str(payload.get("counseling_result", "")).strip(),
        str(payload.get("followup_plan", "")).strip(),
        str(payload.get("next_counseling_date", "")).strip(),
        str(payload.get("admin_memo", "")).strip(),
        "FALSE",
        now,
        now,
    ]
    append_sheet_row("상담기록", row)
    db.setdefault("상담기록", []).append(dict(zip(SHEET_SCHEMAS["상담기록"], row)))

    # 연계된 상담 신청이 있으면 상태를 '상담 완료'로 자동 반영
    if request_uuid:
        for req in db.get("상담신청", []):
            if req.get("request_uuid") == request_uuid and req.get("status") != "상담 완료":
                req["status"] = "상담 완료"
                req["updated_at"] = now
                r_idx = int(req.get("_row_index") or 2)
                update_sheet_row("상담신청", r_idx, [req.get(h, "") for h in SHEET_SCHEMAS["상담신청"]])
                break

    recalculate_student_counseling_stats(db, student_uuid)
    clear_sheets_cache()
    append_audit_log("ADMIN", "CREATE_RECORD", "상담기록", rec_uuid, f"상담 기록 작성 완료 ({counseling_date})")
    return True, "상담 기록이 저장되었습니다.", {"record_uuid": rec_uuid}


def update_counseling_record(
    db: Dict[str, List[Dict[str, Any]]], payload: Dict[str, Any]
) -> Tuple[bool, str]:
    rec_uuid = str(payload.get("record_uuid", "")).strip()
    for rec in db.get("상담기록", []):
        if rec.get("record_uuid") == rec_uuid:
            for field in (
                "counseling_date",
                "counseling_time",
                "counseling_type",
                "category",
                "topic",
                "presenting_issue",
                "progress_content",
                "counseling_result",
                "followup_plan",
                "next_counseling_date",
                "admin_memo",
            ):
                if field in payload:
                    rec[field] = str(payload[field] or "").strip()
            rec["updated_at"] = now_kst_str()
            row_index = int(rec.get("_row_index") or 2)
            update_sheet_row("상담기록", row_index, [rec.get(h, "") for h in SHEET_SCHEMAS["상담기록"]])
            recalculate_student_counseling_stats(db, rec.get("student_uuid", ""))
            clear_sheets_cache()
            append_audit_log("ADMIN", "UPDATE_RECORD", "상담기록", rec_uuid, "상담 기록 수정")
            return True, "상담 기록이 수정되었습니다."

    return False, "수정할 상담 기록을 찾을 수 없습니다."


def delete_counseling_record(
    db: Dict[str, List[Dict[str, Any]]], payload: Dict[str, Any]
) -> Tuple[bool, str]:
    rec_uuid = str(payload.get("record_uuid", "")).strip()
    for rec in db.get("상담기록", []):
        if rec.get("record_uuid") == rec_uuid:
            rec["is_deleted"] = "TRUE"
            rec["updated_at"] = now_kst_str()
            row_index = int(rec.get("_row_index") or 2)
            update_sheet_row("상담기록", row_index, [rec.get(h, "") for h in SHEET_SCHEMAS["상담기록"]])
            recalculate_student_counseling_stats(db, rec.get("student_uuid", ""))
            clear_sheets_cache()
            append_audit_log("ADMIN", "DELETE_RECORD", "상담기록", rec_uuid, "상담 기록 삭제(소프트 삭제)")
            return True, "상담 기록이 삭제 처리되었습니다."

    return False, "삭제할 상담 기록을 찾을 수 없습니다."


def save_categories_by_admin(
    db: Dict[str, List[Dict[str, Any]]], payload: Dict[str, Any]
) -> Tuple[bool, str]:
    items = payload.get("categories")
    if not isinstance(items, list) or len(items) == 0:
        return False, "최소 1개 이상의 상담 분야가 필요합니다."

    from backend.sheets import get_sheets_service
    from backend.security import sanitize_row

    service, spreadsheet_id = get_sheets_service()
    headers = SHEET_SCHEMAS["상담분야"]
    now = now_kst_str()
    rows = [headers]
    for idx, item in enumerate(items, start=1):
        name = str(item.get("name", "")).strip()
        if not name:
            continue
        rows.append(
            [
                str(item.get("category_uuid") or uuid.uuid4()),
                name,
                str(item.get("description", "")).strip(),
                int(item.get("display_order") or idx),
                "TRUE" if item.get("is_active", True) else "FALSE",
                str(item.get("created_at") or now),
                now,
            ]
        )

    safe_rows = [rows[0]] + [sanitize_row(r) for r in rows[1:]]
    service.spreadsheets().values().clear(spreadsheetId=spreadsheet_id, range="'상담분야'!A1:Z").execute()
    service.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id,
        range="'상담분야'!A1",
        valueInputOption="RAW",
        body={"values": safe_rows},
    ).execute()
    clear_sheets_cache()
    append_audit_log("ADMIN", "SAVE_CATEGORIES", "상담분야", "all", f"상담 분야 설정 갱신 ({len(safe_rows)-1}개)")
    return True, "상담 분야 설정이 저장되었습니다."


def save_system_settings_by_admin(
    db: Dict[str, List[Dict[str, Any]]], payload: Dict[str, Any]
) -> Tuple[bool, str]:
    settings_dict = payload.get("settings")
    if not isinstance(settings_dict, dict):
        return False, "설정 데이터 형식이 올바르지 않습니다."

    from backend.sheets import get_sheets_service
    from backend.security import sanitize_row

    service, spreadsheet_id = get_sheets_service()
    headers = SHEET_SCHEMAS["시스템설정"]
    now = now_kst_str()
    rows = [headers]
    for k, v in settings_dict.items():
        rows.append([str(k).strip(), str(v or ""), now])

    safe_rows = [rows[0]] + [sanitize_row(r) for r in rows[1:]]
    service.spreadsheets().values().clear(spreadsheetId=spreadsheet_id, range="'시스템설정'!A1:Z").execute()
    service.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id,
        range="'시스템설정'!A1",
        valueInputOption="RAW",
        body={"values": safe_rows},
    ).execute()
    clear_sheets_cache()
    append_audit_log("ADMIN", "SAVE_SETTINGS", "시스템설정", "all", "운영 안내 및 공지사항 문구 저장")
    return True, "운영 안내 및 공지사항 설정이 저장되었습니다."


def build_admin_dashboard_data(db: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
    requests = [
        {k: v for k, v in r.items() if k not in ("lookup_pin_hash", "_row_index")}
        for r in db.get("상담신청", [])
    ]
    requests.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    records = [
        {k: v for k, v in r.items() if k != "_row_index"}
        for r in db.get("상담기록", [])
        if str(r.get("is_deleted", "FALSE")).upper() != "TRUE"
    ]
    records.sort(key=lambda x: x.get("counseling_date", ""), reverse=True)

    students = [
        {k: v for k, v in s.items() if k != "_row_index"}
        for s in db.get("학생정보", [])
    ]
    students.sort(key=lambda x: x.get("student_number", ""))

    categories = [
        {k: v for k, v in c.items() if k != "_row_index"}
        for c in db.get("상담분야", [])
    ]
    categories.sort(key=lambda x: int(x.get("display_order") or 99))

    settings = {
        s.get("setting_key"): s.get("setting_value", "")
        for s in db.get("시스템설정", [])
        if s.get("setting_key")
    }

    status_counts = Counter(r.get("status", "접수") for r in requests)
    category_counts = Counter(r.get("category", "기타") for r in requests)

    return {
        "sheets_initialized": True,
        "summary": {
            "total_requests": len(requests),
            "pending_requests": status_counts.get("접수", 0),
            "confirmed_requests": status_counts.get("상담 확정", 0),
            "completed_requests": status_counts.get("상담 완료", 0),
            "canceled_requests": status_counts.get("취소", 0),
            "total_records": len(records),
            "total_students": len(students),
        },
        "category_breakdown": [
            {"category": cat, "count": cnt}
            for cat, cnt in category_counts.most_common()
        ],
        "requests": requests,
        "records": records,
        "students": students,
        "categories": categories,
        "settings": settings,
    }
