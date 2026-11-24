"""
입력값 및 UI 레이아웃 스키마 유효성 검증 모듈
"""
from typing import Any, Dict, List, Tuple

ALLOWED_UI_COMPONENT_TYPES = {
    "heading",
    "text",
    "button",
    "image",
    "card",
    "divider",
    "input_field",
    "notice",
    "stat_card",
    "apply_button",
    "counseling_guide",
    "container",
    "columns_2",
    "columns_3",
}


def validate_ui_schema(schema: Any) -> Tuple[bool, str]:
    if not isinstance(schema, dict):
        return False, "UI 설정 데이터 형식이 올바르지 않습니다."

    pages = schema.get("pages")
    if not isinstance(pages, dict) or not isinstance(pages.get("home"), dict):
        return False, "홈페이지 레이아웃 구조(pages.home)가 누락되었습니다."

    components = pages["home"].get("components")
    if not isinstance(components, list):
        return False, "컴포넌트 목록이 배열 형식이 아닙니다."

    def _check_nodes(nodes: List[Any], depth: int = 0) -> Tuple[bool, str]:
        if depth > 6:
            return False, "중첩 레이아웃 깊이는 최대 6단계까지만 허용됩니다."
        for node in nodes:
            if not isinstance(node, dict):
                return False, "컴포넌트 노드 형식이 올바르지 않습니다."
            ctype = str(node.get("type", "")).strip()
            if ctype not in ALLOWED_UI_COMPONENT_TYPES:
                return False, f"허용되지 않은 컴포넌트 유형입니다: {ctype}"
            children = node.get("children")
            if children is not None:
                if not isinstance(children, list):
                    return False, "하위 컴포넌트 목록 형식이 올바르지 않습니다."
                ok, err = _check_nodes(children, depth + 1)
                if not ok:
                    return False, err
        return True, ""

    return _check_nodes(components)
