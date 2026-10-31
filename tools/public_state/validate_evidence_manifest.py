from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MANIFESTS = [
    ROOT / "docs" / "evidence" / "california" / "cccl-pits" / "manifest.json",
]
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
EVIDENCE_ID_RE = re.compile(r"^[A-Z0-9-]+$")


def fail(message: str) -> None:
    raise SystemExit(f"evidence-manifest validation failed: {message}")


def require_text(obj: dict, key: str, context: str) -> str:
    value = obj.get(key)
    if not isinstance(value, str) or not value.strip():
        fail(f"{context}.{key} must be a non-empty string")
    return value.strip()


def validate_manifest(path: Path) -> tuple[str, int]:
    if not path.exists():
        fail(f"missing {path.relative_to(ROOT)}")

    try:
        manifest = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")

    if manifest.get("schema_version") != 1:
        fail(f"{path.name}: schema_version must be 1")

    collection_id = require_text(manifest, "collection_id", path.name)
    require_text(manifest, "title", path.name)
    require_text(manifest, "received", path.name)

    records = manifest.get("records")
    if not isinstance(records, list) or not records:
        fail(f"{path.name}: records must be a non-empty array")

    if manifest.get("record_count") != len(records):
        fail(
            f"{path.name}: record_count={manifest.get('record_count')} "
            f"but records contains {len(records)} entries"
        )

    seen: set[str] = set()
    base = path.parent
    for index, record in enumerate(records):
        context = f"{path.name}.records[{index}]"
        if not isinstance(record, dict):
            fail(f"{context} must be an object")

        evidence_id = require_text(record, "id", context)
        if not EVIDENCE_ID_RE.fullmatch(evidence_id):
            fail(f"{context}.id has invalid format: {evidence_id}")
        if evidence_id in seen:
            fail(f"duplicate evidence id: {evidence_id}")
        seen.add(evidence_id)

        require_text(record, "source_filename", context)
        require_text(record, "kind", context)
        publication = require_text(record, "source_publication", context)
        if publication not in {"source-retained", "source-published"}:
            fail(f"{context}.source_publication has unsupported value: {publication}")

        size = record.get("bytes")
        if not isinstance(size, int) or isinstance(size, bool) or size <= 0:
            fail(f"{context}.bytes must be a positive integer")

        digest = require_text(record, "sha256", context)
        if not SHA256_RE.fullmatch(digest):
            fail(f"{context}.sha256 must be 64 lowercase hexadecimal characters")

        derivative = record.get("public_derivative")
        if derivative is not None:
            if not isinstance(derivative, str) or not derivative.strip():
                fail(f"{context}.public_derivative must be a non-empty string or null")
            derivative_path = (base / derivative).resolve()
            if not derivative_path.is_relative_to(ROOT):
                fail(f"{context}.public_derivative escapes repository root")
            if not derivative_path.exists():
                fail(
                    f"{context}.public_derivative does not exist: "
                    f"{derivative_path.relative_to(ROOT)}"
                )

    return collection_id, len(records)


def main() -> None:
    total = 0
    collections = []
    for path in MANIFESTS:
        collection_id, count = validate_manifest(path)
        collections.append(collection_id)
        total += count

    print(f"evidence manifests valid: {len(collections)} collections, {total} source records")


if __name__ == "__main__":
    main()
