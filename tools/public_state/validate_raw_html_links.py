from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "docs"
RAW_HREF_RE = re.compile(r'href=["\']([^"\']+)["\']', re.IGNORECASE)
BAD_SUFFIXES = (".md", ".markdown")


def fail(message: str) -> None:
    raise SystemExit(f"raw-html link validation failed: {message}")


def main() -> None:
    problems: list[str] = []

    for path in DOCS.rglob("*.md"):
        text = path.read_text(encoding="utf-8")
        for match in RAW_HREF_RE.finditer(text):
            href = match.group(1).split("#", 1)[0].split("?", 1)[0]
            if href.lower().endswith(BAD_SUFFIXES):
                line = text.count("\n", 0, match.start()) + 1
                problems.append(f"{path.relative_to(ROOT)}:{line}: {match.group(1)}")

    if problems:
        fail("raw HTML links must use deployed URLs, not Markdown source paths:\n  " + "\n  ".join(problems))

    print("raw HTML link validation passed")


if __name__ == "__main__":
    main()
