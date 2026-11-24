import json
import sys
from pathlib import Path
from typing import Dict, List
import pytest
import streamlit as st

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.sheets import DEFAULT_CATEGORIES, DEFAULT_SETTINGS, load_default_ui_json


@pytest.fixture(autouse=True)
def reset_streamlit_state(monkeypatch):
    st.session_state.clear()
    fake_secrets = {
        "ADMIN_PASSWORD": "TestAdminPassword!2026",
        "SESSION_SECRET": "test-hmac-secret-key-for-unit-testing-purposes-only",
        "SPREADSHEET_ID": "test_spreadsheet_id_12345",
    }
    monkeypatch.setattr(st, "secrets", fake_secrets)
    yield
    st.session_state.clear()


@pytest.fixture
def sample_db() -> Dict[str, List[Dict[str, str]]]:
    default_ui = load_default_ui_json()
    ui_str = json.dumps(default_ui, ensure_ascii=False)
    return {
        "학생정보": [
            {
                "student_uuid": "stu-uuid-001",
                "student_number": "10101",
                "grade": "1",
                "class_num": "1",
                "number": "1",
                "name": "김민준",
                "gender": "남",
                "phone": "010-1111-2222",
                "guardian_phone": "010-3333-4444",
                "note": "특이사항 없음",
                "total_counseling_count": "1",
                "last_counseling_date": "2026-11-10",
                "created_at": "2026-03-02 09:00:00",
                "updated_at": "2026-11-10 14:00:00",
            }
        ],
        "상담신청": [
            {
                "request_uuid": "req-uuid-001",
                "student_uuid": "stu-uuid-001",
                "student_number": "10101",
                "grade": "1",
                "class_num": "1",
                "number": "1",
                "name": "김민준",
                "category": "진로·진학",
                "preferred_date": "2026-11-25",
                "preferred_time": "점심시간 (12:40~13:20)",
                "reason": "이공계 진로 선택과목 상담을 받고 싶습니다.",
                "additional_note": "",
                "lookup_pin_hash": "",
                "status": "접수",
                "created_at": "2026-11-20 10:15:00",
                "updated_at": "2026-11-20 10:15:00",
            }
        ],
        "상담기록": [
            {
                "record_uuid": "rec-uuid-001",
                "student_uuid": "stu-uuid-001",
                "request_uuid": "",
                "counseling_date": "2026-11-10",
                "counseling_time": "13:00",
                "counseling_type": "대면 상담",
                "category": "학업·학습",
                "topic": "중간고사 이후 학습 계획 수립",
                "presenting_issue": "수학 과목 시간 배분 어려움",
                "progress_content": "주간 학습 플래너 작성법 안내 및 오답 노트 전략 협의",
                "counseling_result": "자기주도 학습 목표 설정 완료",
                "followup_plan": "2주 후 플래너 점검",
                "next_counseling_date": "2026-11-24",
                "admin_memo": "학부모 상담 희망 여부 추후 확인",
                "is_deleted": "FALSE",
                "created_at": "2026-11-10 14:00:00",
                "updated_at": "2026-11-10 14:00:00",
            }
        ],
        "상담분야": [
            {
                "category_uuid": f"cat-uuid-{i}",
                "name": name,
                "description": desc,
                "display_order": str(order),
                "is_active": "TRUE",
                "created_at": "2026-03-02 09:00:00",
                "updated_at": "2026-03-02 09:00:00",
            }
            for i, (name, desc, order) in enumerate(DEFAULT_CATEGORIES, start=1)
        ],
        "시스템설정": [
            {
                "setting_key": k,
                "setting_value": v,
                "updated_at": "2026-03-02 09:00:00",
            }
            for k, v in DEFAULT_SETTINGS.items()
        ],
        "UI설정": [
            {
                "ui_uuid": "ui-pub-1",
                "env_type": "published",
                "page_key": "home",
                "schema_version": "1",
                "ui_json": ui_str,
                "updated_at": "2026-03-02 09:00:00",
            },
            {
                "ui_uuid": "ui-drf-1",
                "env_type": "draft",
                "page_key": "home",
                "schema_version": "1",
                "ui_json": ui_str,
                "updated_at": "2026-03-02 09:00:00",
            },
        ],
        "변경이력": [],
    }
