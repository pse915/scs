import base64
import io
import json
from openpyxl import load_workbook

from backend.validation import validate_ui_schema
from backend.ui_config import _split_json_chunks
from backend.export import generate_export_package
from backend.sheets import load_default_ui_json


def test_ui_schema_validation_and_chunking():
    valid_schema = load_default_ui_json()
    ok, msg = validate_ui_schema(valid_schema)
    assert ok is True

    bad_schema = {
        "version": 1,
        "pages": {
            "home": {
                "components": [
                    {"id": "x1", "type": "script_inject", "props": {}}
                ]
            }
        },
    }
    ok_bad, msg_bad = validate_ui_schema(bad_schema)
    assert ok_bad is False
    assert "허용되지 않은" in msg_bad

    long_text = "A" * 100000
    chunks = _split_json_chunks(long_text, chunk_size=45000)
    assert len(chunks) == 3
    assert "".join(chunks) == long_text


def test_export_xlsx_csv_json_and_ui_backup(sample_db, monkeypatch):
    from backend import export as export_mod

    monkeypatch.setattr(export_mod, "append_audit_log", lambda *args, **kwargs: None)

    ok_xlsx, _, res_xlsx = generate_export_package(
        sample_db, {"export_type": "all_records", "file_format": "xlsx"}
    )
    assert ok_xlsx is True
    assert res_xlsx["filename"].endswith(".xlsx")
    assert res_xlsx["row_count"] == 1

    raw_xlsx = base64.b64decode(res_xlsx["base64_data"])
    wb = load_workbook(io.BytesIO(raw_xlsx))
    ws = wb.active
    assert ws.cell(row=1, column=2).value == "학번"
    assert ws.cell(row=2, column=2).value == "10101"
    assert ws.cell(row=2, column=3).value == "김민준"

    ok_csv, _, res_csv = generate_export_package(
        sample_db, {"export_type": "all_requests", "file_format": "csv"}
    )
    assert ok_csv is True
    raw_csv = base64.b64decode(res_csv["base64_data"])
    assert raw_csv.startswith(b"\xef\xbb\xbf")
    decoded_csv = raw_csv.decode("utf-8-sig")
    assert "김민준" in decoded_csv
    assert "진로·진학" in decoded_csv

    ok_stat, _, res_stat = generate_export_package(
        sample_db, {"export_type": "category_stats", "file_format": "json"}
    )
    assert ok_stat is True
    stat_json = json.loads(base64.b64decode(res_stat["base64_data"]).decode("utf-8"))
    assert stat_json["count"] >= 1
    assert any(item["상담분야"] == "진로·진학" for item in stat_json["items"])

    ok_ui, _, res_ui = generate_export_package(
        sample_db, {"export_type": "ui_config_backup", "file_format": "json"}
    )
    assert ok_ui is True
    ui_backup_text = base64.b64decode(res_ui["base64_data"]).decode("utf-8")
    assert "김민준" not in ui_backup_text
    assert "10101" not in ui_backup_text
    assert "UI_CONFIGURATION_ONLY_NO_PII" in ui_backup_text
