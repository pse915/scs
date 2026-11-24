"""
학생 인적사항 관리 및 누적 상담 통계 동기화 모듈
"""
from typing import Any, Dict, List, Optional, Tuple
import uuid

from backend.sheets import (
    SHEET_SCHEMAS,
    append_audit_log,
    append_sheet_row,
    clear_sheets_cache,
    now_kst_str,
    update_sheet_row,
)


def make_student_number(grade: str, class_num: str, number: str) -> str:
    g = str(grade).strip()
    c = str(class_num).strip().zfill(2)
    n = str(number).strip().zfill(2)
    return f"{g}{c}{n}"


def find_or_create_student(
    db: Dict[str, List[Dict[str, Any]]],
    grade: str,
    class_num: str,
    number: str,
    name: str,
) -> Dict[str, Any]:
    s_num = make_student_number(grade, class_num, number)
    clean_name = str(name).strip()

    for stu in db.get("학생정보", []):
        if stu.get("student_number") == s_num and stu.get("name") == clean_name:
            return stu

    now = now_kst_str()
    new_uuid = str(uuid.uuid4())
    row = [
        new_uuid,
        s_num,
        str(grade).strip(),
        str(class_num).strip(),
        str(number).strip(),
        clean_name,
        "",
        "",
        "",
        "",
        "0",
        "",
        now,
        now,
    ]
    append_sheet_row("학생정보", row)
    new_record = dict(zip(SHEET_SCHEMAS["학생정보"], row))
    db.setdefault("학생정보", []).append(new_record)
    return new_record


def recalculate_student_counseling_stats(
    db: Dict[str, List[Dict[str, Any]]], student_uuid: str
) -> None:
    target_stu: Optional[Dict[str, Any]] = None
    for s in db.get("학생정보", []):
        if s.get("student_uuid") == student_uuid:
            target_stu = s
            break
    if not target_stu:
        return

    active_recs = [
        r
        for r in db.get("상담기록", [])
        if r.get("student_uuid") == student_uuid
        and str(r.get("is_deleted", "FALSE")).upper() != "TRUE"
    ]
    count = len(active_recs)
    dates = sorted([r.get("counseling_date", "") for r in active_recs if r.get("counseling_date")])
    last_date = dates[-1] if dates else ""

    target_stu["total_counseling_count"] = str(count)
    target_stu["last_counseling_date"] = last_date
    target_stu["updated_at"] = now_kst_str()

    row_index = int(target_stu.get("_row_index") or 2)
    row_values = [target_stu.get(h, "") for h in SHEET_SCHEMAS["학생정보"]]
    update_sheet_row("학생정보", row_index, row_values)


def upsert_student_by_admin(
    db: Dict[str, List[Dict[str, Any]]], payload: Dict[str, Any]
) -> Tuple[bool, str, Dict[str, Any]]:
    grade = str(payload.get("grade", "")).strip()
    class_num = str(payload.get("class_num", "")).strip()
    number = str(payload.get("number", "")).strip()
    name = str(payload.get("name", "")).strip()

    if not (grade and class_num and number and name):
        return False, "학년, 반, 번호, 이름은 필수 입력 항목입니다.", {}

    s_num = make_student_number(grade, class_num, number)
    now = now_kst_str()
    target_uuid = str(payload.get("student_uuid", "")).strip()

    existing = None
    if target_uuid:
        for s in db.get("학생정보", []):
            if s.get("student_uuid") == target_uuid:
                existing = s
                break

    if existing:
        existing["student_number"] = s_num
        existing["grade"] = grade
        existing["class_num"] = class_num
        existing["number"] = number
        existing["name"] = name
        existing["gender"] = str(payload.get("gender", "")).strip()
        existing["phone"] = str(payload.get("phone", "")).strip()
        existing["guardian_phone"] = str(payload.get("guardian_phone", "")).strip()
        existing["note"] = str(payload.get("note", "")).strip()
        existing["updated_at"] = now

        row_index = int(existing.get("_row_index") or 2)
        update_sheet_row(
            "학생정보",
            row_index,
            [existing.get(h, "") for h in SHEET_SCHEMAS["학생정보"]],
        )
        clear_sheets_cache()
        append_audit_log("ADMIN", "UPDATE_STUDENT", "학생정보", existing["student_uuid"], f"학생 정보 수정 ({s_num})")
        return True, "학생 정보가 수정되었습니다.", {"student_uuid": existing["student_uuid"]}

    new_uuid = str(uuid.uuid4())
    row = [
        new_uuid,
        s_num,
        grade,
        class_num,
        number,
        name,
        str(payload.get("gender", "")).strip(),
        str(payload.get("phone", "")).strip(),
        str(payload.get("guardian_phone", "")).strip(),
        str(payload.get("note", "")).strip(),
        "0",
        "",
        now,
        now,
    ]
    append_sheet_row("학생정보", row)
    clear_sheets_cache()
    append_audit_log("ADMIN", "CREATE_STUDENT", "학생정보", new_uuid, f"신규 학생 등록 ({s_num})")
    return True, "신규 학생이 등록되었습니다.", {"student_uuid": new_uuid}
