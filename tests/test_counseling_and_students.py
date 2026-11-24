import pytest
from backend import counseling, students
from backend.sheets import SHEET_SCHEMAS


@pytest.fixture
def mock_sheet_io(monkeypatch):
    writes = {"appended": [], "updated": []}

    def fake_append(sheet_name, row_values):
        writes["appended"].append((sheet_name, row_values))

    def fake_update(sheet_name, row_index, row_values):
        writes["updated"].append((sheet_name, row_index, row_values))

    def fake_clear():
        pass

    monkeypatch.setattr(counseling, "append_sheet_row", fake_append)
    monkeypatch.setattr(counseling, "update_sheet_row", fake_update)
    monkeypatch.setattr(counseling, "clear_sheets_cache", fake_clear)
    monkeypatch.setattr(students, "append_sheet_row", fake_append)
    monkeypatch.setattr(students, "update_sheet_row", fake_update)
    monkeypatch.setattr(students, "clear_sheets_cache", fake_clear)
    return writes


def test_student_apply_lookup_and_cancel_flow(sample_db, mock_sheet_io):
    ok, msg, data = counseling.create_counseling_request(
        sample_db,
        {
            "grade": "1",
            "class_num": "2",
            "number": "5",
            "name": "이서연",
            "category": "교우관계",
            "preferred_date": "2026-11-28",
            "preferred_time": "방과 후 (16:30~17:30)",
            "reason": "새 학기 친구 관계 적응에 대해 상담받고 싶습니다.",
            "additional_note": "조용한 상담실 희망",
            "lookup_pin": "1234",
        },
    )
    assert ok is True
    assert data["student_number"] == "10205"

    appended_sheets = [s for s, _ in mock_sheet_io["appended"]]
    assert "학생정보" in appended_sheets
    assert "상담신청" in appended_sheets

    req_row_values = [r for s, r in mock_sheet_io["appended"] if s == "상담신청"][0]
    req_dict = dict(zip(SHEET_SCHEMAS["상담신청"], req_row_values))
    sample_db["상담신청"].append(req_dict)

    ok_bad, msg_bad, _ = counseling.lookup_student_requests(
        sample_db,
        {"student_number": "10205", "name": "이서연", "lookup_pin": "9999"},
    )
    assert ok_bad is False

    ok_good, _, items = counseling.lookup_student_requests(
        sample_db,
        {"student_number": "10205", "name": "이서연", "lookup_pin": "1234"},
    )
    assert ok_good is True
    assert len(items) == 1
    assert items[0]["category"] == "교우관계"
    assert "lookup_pin_hash" not in items[0]

    ok_cancel, _ = counseling.cancel_student_own_request(
        sample_db,
        {
            "request_uuid": req_dict["request_uuid"],
            "student_number": "10205",
            "name": "이서연",
            "lookup_pin": "1234",
        },
    )
    assert ok_cancel is True


def test_admin_counseling_record_crud_and_soft_delete(sample_db, mock_sheet_io):
    ok_create, _, created_data = counseling.create_counseling_record(
        sample_db,
        {
            "student_uuid": "stu-uuid-001",
            "request_uuid": "req-uuid-001",
            "counseling_date": "2026-11-22",
            "counseling_time": "12:50",
            "counseling_type": "대면 상담",
            "category": "진로·진학",
            "topic": "공학계열 선택과목 안내",
            "presenting_issue": "물리학II와 기하 선택 고민",
            "progress_content": "희망 대학 전공 권장과목 가이드 제공",
            "counseling_result": "수강 신청 방향 확정",
            "followup_plan": "12월 진로 로드맵 재확인",
            "next_counseling_date": "2026-12-10",
            "admin_memo": "신청 건 자동 완료 연계 확인",
        },
    )
    assert ok_create is True
    rec_uuid = created_data["record_uuid"]

    assert any(s == "상담기록" for s, _ in mock_sheet_io["appended"])
    assert any(s == "학생정보" for s, _, _ in mock_sheet_io["updated"])

    rec_row = [r for s, r in mock_sheet_io["appended"] if s == "상담기록"][0]
    sample_db["상담기록"].append(dict(zip(SHEET_SCHEMAS["상담기록"], rec_row)))

    ok_del, _ = counseling.delete_counseling_record(sample_db, {"record_uuid": rec_uuid})
    assert ok_del is True

    rec_updates = [r for s, _, r in mock_sheet_io["updated"] if s == "상담기록"]
    assert len(rec_updates) >= 1
    assert "TRUE" in rec_updates[-1]
