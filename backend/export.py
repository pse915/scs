"""
관리자 전용 데이터 내보내기 및 백업 모듈
- 지원 형식: CSV (UTF-8-SIG), Excel (.xlsx), JSON
- 내보내기 대상:
  1. 전체 상담 신청 내역 (all_requests)
  2. 전체 상담 기록 (all_records)
  3. 특정 학생의 상담 기록 (student_records)
  4. 특정 기간의 상담 기록 (period_records)
  5. 상담 분야별 통계 (category_stats)
  6. UI 디자인 설정 백업 (ui_config_backup - 개인정보 미포함)
"""
import base64
import csv
import io
import json
from collections import defaultdict
from datetime import datetime
from typing import Any, Dict, List, Tuple

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

from backend.sheets import (
    append_audit_log,
    get_public_config_and_ui,
    now_kst_str,
)


def _build_student_lookup(db: Dict[str, List[Dict[str, str]]]) -> Dict[str, Dict[str, str]]:
    return {
        s.get("student_uuid", ""): s
        for s in db.get("학생정보", [])
        if s.get("student_uuid")
    }


def _enrich_record_row(
    rec: Dict[str, str], student_map: Dict[str, Dict[str, str]]
) -> Dict[str, Any]:
    stu = student_map.get(rec.get("student_uuid", ""), {})
    return {
        "기록ID": rec.get("record_uuid", ""),
        "학번": stu.get("student_number", ""),
        "이름": stu.get("name", ""),
        "학년": stu.get("grade", ""),
        "반": stu.get("class_num", ""),
        "번호": stu.get("number", ""),
        "상담날짜": rec.get("counseling_date", ""),
        "상담시간": rec.get("counseling_time", ""),
        "상담유형": rec.get("counseling_type", ""),
        "상담분야": rec.get("category", ""),
        "상담주제": rec.get("topic", ""),
        "주요호소내용": rec.get("presenting_issue", ""),
        "상담진행내용": rec.get("progress_content", ""),
        "상담결과": rec.get("counseling_result", ""),
        "추후지도계획": rec.get("followup_plan", ""),
        "다음상담예정일": rec.get("next_counseling_date", ""),
        "관리자내부메모": rec.get("admin_memo", ""),
        "작성일시": rec.get("created_at", ""),
        "최종수정일시": rec.get("updated_at", ""),
    }


def _serialize_rows_to_csv(rows: List[Dict[str, Any]], headers: List[str]) -> bytes:
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=headers, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        writer.writerow({h: row.get(h, "") for h in headers})
    return buf.getvalue().encode("utf-8-sig")


def _serialize_rows_to_xlsx(
    rows: List[Dict[str, Any]], headers: List[str], sheet_title: str
) -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.title = sheet_title[:31]

    header_fill = PatternFill(start_color="1D1D1F", end_color="1D1D1F", fill_type="solid")
    header_font = Font(name="Malgun Gothic", size=10, bold=True, color="FFFFFF")
    body_font = Font(name="Malgun Gothic", size=10, color="1D1D1F")
    thin_side = Side(style="thin", color="D2D2D7")
    cell_border = Border(left=thin_side, right=thin_side, top=thin_side, bottom=thin_side)

    ws.append(headers)
    ws.row_dimensions[1].height = 26
    for col_idx in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=col_idx)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = cell_border

    for r_idx, row_dict in enumerate(rows, start=2):
        row_values = [row_dict.get(h, "") for h in headers]
        ws.append(row_values)
        for c_idx in range(1, len(headers) + 1):
            cell = ws.cell(row=r_idx, column=c_idx)
            cell.font = body_font
            cell.alignment = Alignment(vertical="top", wrap_text=True)
            cell.border = cell_border

    for c_idx, h in enumerate(headers, start=1):
        col_letter = get_column_letter(c_idx)
        max_len = len(str(h)) * 2
        for row_dict in rows[:200]:
            val_str = str(row_dict.get(h, ""))
            first_line = val_str.split("\n")[0] if val_str else ""
            max_len = max(max_len, min(55, len(first_line) + 4))
        ws.column_dimensions[col_letter].width = max(12, min(56, max_len))

    ws.freeze_panes = "A2"
    out = io.BytesIO()
    wb.save(out)
    return out.getvalue()


def _serialize_rows_to_json(
    rows: List[Dict[str, Any]], meta: Dict[str, Any]
) -> bytes:
    payload = {
        "exported_at": now_kst_str(),
        "meta": meta,
        "count": len(rows),
        "items": rows,
    }
    return json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")


def generate_export_package(
    db: Dict[str, List[Dict[str, str]]], payload: Dict[str, Any]
) -> Tuple[bool, str, Dict[str, Any]]:
    export_type = str(payload.get("export_type", "")).strip()
    file_format = str(payload.get("file_format", "xlsx")).strip().lower()

    if file_format not in ("csv", "xlsx", "json"):
        return False, "지원하지 않는 파일 형식입니다. (CSV, XLSX, JSON만 가능)", {}

    timestamp_tag = datetime.now().strftime("%Y%m%d_%H%M%S")
    student_map = _build_student_lookup(db)

    rows: List[Dict[str, Any]] = []
    headers: List[str] = []
    sheet_title = "상담데이터"
    file_prefix = "counseling_export"
    meta_info: Dict[str, Any] = {"export_type": export_type}

    if export_type == "all_requests":
        headers = [
            "신청ID", "학번", "학년", "반", "번호", "이름",
            "상담희망분야", "희망날짜", "희망시간", "진행상태",
            "상담신청사유", "추가전달사항", "접수일시", "최종수정일시",
        ]
        reqs = sorted(
            db.get("상담신청", []),
            key=lambda x: x.get("created_at", ""),
            reverse=True,
        )
        for r in reqs:
            rows.append(
                {
                    "신청ID": r.get("request_uuid", ""),
                    "학번": r.get("student_number", ""),
                    "학년": r.get("grade", ""),
                    "반": r.get("class_num", ""),
                    "번호": r.get("number", ""),
                    "이름": r.get("name", ""),
                    "상담희망분야": r.get("category", ""),
                    "희망날짜": r.get("preferred_date", ""),
                    "희망시간": r.get("preferred_time", ""),
                    "진행상태": r.get("status", ""),
                    "상담신청사유": r.get("reason", ""),
                    "추가전달사항": r.get("additional_note", ""),
                    "접수일시": r.get("created_at", ""),
                    "최종수정일시": r.get("updated_at", ""),
                }
            )
        sheet_title = "전체상담신청내역"
        file_prefix = f"전체_상담신청내역_{timestamp_tag}"

    elif export_type == "all_records":
        active_recs = [
            r
            for r in db.get("상담기록", [])
            if str(r.get("is_deleted", "FALSE")).upper() != "TRUE"
        ]
        active_recs.sort(key=lambda x: x.get("counseling_date", ""), reverse=True)
        rows = [_enrich_record_row(r, student_map) for r in active_recs]
        headers = list(rows[0].keys()) if rows else [
            "기록ID", "학번", "이름", "학년", "반", "번호", "상담날짜", "상담시간",
            "상담유형", "상담분야", "상담주제", "주요호소내용", "상담진행내용",
            "상담결과", "추후지도계획", "다음상담예정일", "관리자내부메모", "작성일시", "최종수정일시",
        ]
        sheet_title = "전체상담기록"
        file_prefix = f"전체_상담기록_{timestamp_tag}"

    elif export_type == "student_records":
        target_student_uuid = str(payload.get("student_uuid", "")).strip()
        if not target_student_uuid or target_student_uuid not in student_map:
            return False, "내보낼 대상 학생을 선택해 주세요.", {}

        stu_info = student_map[target_student_uuid]
        active_recs = [
            r
            for r in db.get("상담기록", [])
            if r.get("student_uuid") == target_student_uuid
            and str(r.get("is_deleted", "FALSE")).upper() != "TRUE"
        ]
        active_recs.sort(key=lambda x: x.get("counseling_date", ""), reverse=False)
        rows = [_enrich_record_row(r, student_map) for r in active_recs]
        headers = list(rows[0].keys()) if rows else [
            "기록ID", "학번", "이름", "학년", "반", "번호", "상담날짜", "상담시간",
            "상담유형", "상담분야", "상담주제", "주요호소내용", "상담진행내용",
            "상담결과", "추후지도계획", "다음상담예정일", "관리자내부메모", "작성일시", "최종수정일시",
        ]
        s_num = stu_info.get("student_number", "")
        s_name = stu_info.get("name", "")
        sheet_title = f"{s_num}_{s_name}_상담기록"
        file_prefix = f"학생상담기록_{s_num}_{s_name}_{timestamp_tag}"
        meta_info["student"] = {"student_number": s_num, "name": s_name}

    elif export_type == "period_records":
        start_date = str(payload.get("start_date", "")).strip()
        end_date = str(payload.get("end_date", "")).strip()
        if not start_date or not end_date:
            return False, "조회 시작일과 종료일을 모두 선택해 주세요.", {}
        if start_date > end_date:
            return False, "시작일은 종료일보다 이전이거나 같아야 합니다.", {}

        active_recs = [
            r
            for r in db.get("상담기록", [])
            if str(r.get("is_deleted", "FALSE")).upper() != "TRUE"
            and start_date <= (r.get("counseling_date", "") or "") <= end_date
        ]
        active_recs.sort(key=lambda x: x.get("counseling_date", ""), reverse=False)
        rows = [_enrich_record_row(r, student_map) for r in active_recs]
        headers = list(rows[0].keys()) if rows else [
            "기록ID", "학번", "이름", "학년", "반", "번호", "상담날짜", "상담시간",
            "상담유형", "상담분야", "상담주제", "주요호소내용", "상담진행내용",
            "상담결과", "추후지도계획", "다음상담예정일", "관리자내부메모", "작성일시", "최종수정일시",
        ]
        sheet_title = "기간별상담기록"
        file_prefix = f"기간별_상담기록_{start_date}_{end_date}_{timestamp_tag}"
        meta_info["period"] = {"start_date": start_date, "end_date": end_date}

    elif export_type == "category_stats":
        req_counts: Dict[str, int] = defaultdict(int)
        completed_counts: Dict[str, int] = defaultdict(int)
        record_counts: Dict[str, int] = defaultdict(int)

        all_reqs = db.get("상담신청", [])
        for r in all_reqs:
            cat = r.get("category") or "기타"
            req_counts[cat] += 1
            if r.get("status") == "상담 완료":
                completed_counts[cat] += 1

        for rec in db.get("상담기록", []):
            if str(rec.get("is_deleted", "FALSE")).upper() != "TRUE":
                cat = rec.get("category") or "기타"
                record_counts[cat] += 1

        all_cats = sorted(
            set(list(req_counts.keys()) + list(record_counts.keys())),
            key=lambda c: req_counts[c],
            reverse=True,
        )
        total_reqs = max(1, sum(req_counts.values()))

        headers = ["상담분야", "신청건수", "신청비율(%)", "신청완료건수", "실제상담기록수"]
        for cat in all_cats:
            cnt = req_counts[cat]
            pct = round((cnt / total_reqs) * 100, 1) if sum(req_counts.values()) > 0 else 0.0
            rows.append(
                {
                    "상담분야": cat,
                    "신청건수": cnt,
                    "신청비율(%)": pct,
                    "신청완료건수": completed_counts[cat],
                    "실제상담기록수": record_counts[cat],
                }
            )
        sheet_title = "상담분야별통계"
        file_prefix = f"상담분야별_통계_{timestamp_tag}"

    elif export_type == "ui_config_backup":
        _, ui_schema = get_public_config_and_ui(db)
        backup_payload = {
            "backup_type": "UI_CONFIGURATION_ONLY_NO_PII",
            "exported_at": now_kst_str(),
            "published": ui_schema.get("published"),
            "draft": ui_schema.get("draft"),
        }
        raw_bytes = json.dumps(backup_payload, ensure_ascii=False, indent=2).encode("utf-8")
        b64 = base64.b64encode(raw_bytes).decode("ascii")
        append_audit_log("ADMIN", "EXPORT_UI_BACKUP", "UI설정", "home", "UI 디자인 설정 JSON 백업 다운로드")
        return (
            True,
            "UI 디자인 설정 백업 파일(개인정보 미포함)이 준비되었습니다.",
            {
                "filename": f"ui_config_backup_{timestamp_tag}.json",
                "mime_type": "application/json",
                "base64_data": b64,
                "row_count": 1,
            },
        )

    else:
        return False, f"지원하지 않는 내보내기 유형입니다: {export_type}", {}

    if file_format == "csv":
        raw_bytes = _serialize_rows_to_csv(rows, headers)
        mime_type = "text/csv;charset=utf-8"
        ext = "csv"
    elif file_format == "xlsx":
        raw_bytes = _serialize_rows_to_xlsx(rows, headers, sheet_title)
        mime_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ext = "xlsx"
    else:
        raw_bytes = _serialize_rows_to_json(rows, meta_info)
        mime_type = "application/json;charset=utf-8"
        ext = "json"

    b64_data = base64.b64encode(raw_bytes).decode("ascii")
    filename = f"{file_prefix}.{ext}"

    append_audit_log(
        "ADMIN",
        "EXPORT_DATA",
        "EXPORT",
        export_type,
        f"{export_type} ({ext.upper()}, {len(rows)}건) 내보내기 실행",
    )

    return (
        True,
        f"'{filename}' 파일({len(rows)}건) 생성이 완료되었습니다.",
        {
            "filename": filename,
            "mime_type": mime_type,
            "base64_data": b64_data,
            "row_count": len(rows),
        },
    )
