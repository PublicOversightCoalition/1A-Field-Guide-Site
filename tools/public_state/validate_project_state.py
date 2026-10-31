from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STATE_PATH = ROOT / "docs" / "data" / "project-state.json"


def fail(message: str) -> None:
    raise SystemExit(f"project-state validation failed: {message}")


def require_mapping(obj: dict, key: str) -> dict:
    value = obj.get(key)
    if not isinstance(value, dict):
        fail(f"{key!r} must be an object")
    return value


def require_nonnegative_int(obj: dict, key: str, context: str) -> int:
    value = obj.get(key)
    if not isinstance(value, int) or isinstance(value, bool) or value < 0:
        fail(f"{context}.{key} must be a non-negative integer")
    return value


def require_text(obj: dict, key: str, context: str) -> str:
    value = obj.get(key)
    if not isinstance(value, str) or not value.strip():
        fail(f"{context}.{key} must be a non-empty string")
    return value.strip()


def main() -> None:
    if not STATE_PATH.exists():
        fail(f"missing {STATE_PATH.relative_to(ROOT)}")

    try:
        state = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON: {exc}")

    if state.get("schema_version") != 1:
        fail("schema_version must be 1")

    require_text(state, "updated", "root")

    jurisdictions = require_mapping(state, "jurisdictions")
    for key in ("active", "development", "not_yet_qualified"):
        require_nonnegative_int(jurisdictions, key, "jurisdictions")
    require_text(jurisdictions, "active_name", "jurisdictions")
    require_text(jurisdictions, "development_name", "jurisdictions")

    california = require_mapping(state, "california")
    for key in (
        "counties_inventoried",
        "supported_qualification_rows",
        "researched_unresolved_rows",
        "gap_rows_at_activation",
    ):
        require_nonnegative_int(california, key, "california")

    research = state.get("research")
    if not isinstance(research, list) or not research:
        fail("research must be a non-empty array")

    seen_ids: set[str] = set()
    lead_count = 0
    for index, item in enumerate(research):
        context = f"research[{index}]"
        if not isinstance(item, dict):
            fail(f"{context} must be an object")
        item_id = require_text(item, "id", context)
        if item_id in seen_ids:
            fail(f"duplicate research id: {item_id}")
        seen_ids.add(item_id)
        for key in ("title", "status", "region", "href", "summary", "wire"):
            require_text(item, key, context)
        if not isinstance(item.get("lead"), bool):
            fail(f"{context}.lead must be boolean")
        lead_count += int(item["lead"])

    if lead_count != 1:
        fail(f"exactly one research item must have lead=true; found {lead_count}")

    public_records = require_mapping(state, "public_records")
    require_text(public_records, "href", "public_records")
    require_text(public_records, "wire", "public_records")

    next_items = state.get("next")
    if not isinstance(next_items, list):
        fail("next must be an array")
    for index, item in enumerate(next_items):
        context = f"next[{index}]"
        if not isinstance(item, dict):
            fail(f"{context} must be an object")
        require_text(item, "label", context)
        require_text(item, "text", context)
        if "href" in item and item["href"] is not None and not isinstance(item["href"], str):
            fail(f"{context}.href must be a string or null")

    print(
        "project-state valid: "
        f"{len(research)} research files, "
        f"{california['counties_inventoried']} California counties, "
        f"updated {state['updated']}"
    )


if __name__ == "__main__":
    main()
