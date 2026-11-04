#!/usr/bin/env python3
"""Enforce the no-em-dash editorial policy against the entire public source tree.

This checks existing text, not just additions in a pull request. Exact agency
source extracts stay unchanged and are deliberately excluded. Rephrase site
copy rather than altering authoritative quotations.
"""
from __future__ import annotations

import argparse
from pathlib import Path
import subprocess
import sys

EM_DASH = chr(0x2014)
EXTENSIONS = {".md", ".html", ".js", ".json", ".yaml", ".yml", ".txt", ".css"}
ROOT_FILES = {"AGENTS.md", "CONTRIBUTING.md", "README.md", "mkdocs.yml"}
SOURCE_EXTRACT_PREFIXES = ("docs/evidence/california/cccl-pits/extracts/",)


def is_editorial_source(path: str) -> bool:
    if path in ROOT_FILES:
        return True
    return (
        path.startswith("docs/")
        and Path(path).suffix.lower() in EXTENSIONS
        and not any(path.startswith(prefix) for prefix in SOURCE_EXTRACT_PREFIXES)
    )


def check_text(path: str, content: str) -> list[tuple[str, int, str]]:
    if not is_editorial_source(path):
        return []
    return [
        (path, index, line.strip()[:180])
        for index, line in enumerate(content.splitlines(), 1)
        if EM_DASH in line
    ]


def git_tracked_paths() -> list[str]:
    data = subprocess.check_output(["git", "ls-files", "-z"])
    return [p.decode("utf-8") for p in data.split(b"\0") if p]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        assert len(check_text("docs/index.md", "existing " + EM_DASH + " text")) == 1
        assert len(check_text("mkdocs.yml", "title: Hello " + EM_DASH)) == 1
        assert not check_text(
            "docs/evidence/california/cccl-pits/extracts/source.txt",
            "verbatim " + EM_DASH + " source",
        )
        assert not check_text("tools/example.py", EM_DASH)
        print("Full-source editorial punctuation self-test passed.")
        return 0

    failures = []
    files = 0
    for name in git_tracked_paths():
        if not is_editorial_source(name):
            continue
        files += 1
        path = Path(name)
        try:
            content = path.read_text(encoding="utf-8")
        except (UnicodeError, OSError) as exc:
            print(f"Could not scan editorial file {name}: {exc}", file=sys.stderr)
            return 1
        failures.extend(check_text(name, content))

    if failures:
        print(f"Editorial punctuation check failed: {len(failures)} existing em dash marks.")
        for name, line, excerpt in failures[:100]:
            print(f"{name}:{line}: {excerpt}")
        if len(failures) > 100:
            print(f"... and {len(failures) - 100} more.")
        print("Rewrite project-authored prose. Keep original agency extracts unmodified.")
        return 1

    print(f"Editorial punctuation check passed: {files} public source files, zero em dashes.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
