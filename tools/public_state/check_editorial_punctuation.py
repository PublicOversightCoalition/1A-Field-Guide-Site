#!/usr/bin/env python3
"""Reject new em dash characters in public-facing project content.

We compare added lines rather than rewriting historical sources. Preserved
verbatim evidence is not edited. When working in normal site copy, use a period,
comma, colon, parentheses, or separate sentence instead.
"""
from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys

EM_DASH = "\u2014"
PUBLIC_EXTENSIONS = (".md", ".html", ".js", ".json", ".yaml", ".yml")
EXCLUDED_PREFIXES = (
    "docs/evidence/california/cccl-pits/extracts/",
)
EXCLUDED_PATHS = set()


def is_public_copy(path: str) -> bool:
    return (
        path.startswith("docs/")
        and path.endswith(PUBLIC_EXTENSIONS)
        and not path.startswith(EXCLUDED_PREFIXES)
        and path not in EXCLUDED_PATHS
    )


def added_lines(diff: str):
    path = None
    new_line = 0
    for line in diff.splitlines():
        if line.startswith("+++ b/"):
            path = line[6:]
        elif line.startswith("@@"):
            match = re.search(r"\+(\d+)", line)
            if match:
                new_line = int(match.group(1))
        elif line.startswith("+") and not line.startswith("+++"):
            if path and is_public_copy(path) and EM_DASH in line[1:]:
                yield path, new_line, line[1:].strip()
            new_line += 1
        elif not line.startswith("-") and not line.startswith("\\"):
            new_line += 1


def git(*args: str) -> str:
    return subprocess.check_output(["git", *args], text=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        sample = (
            "diff --git a/docs/index.md b/docs/index.md\n"
            "+++ b/docs/index.md\n"
            "@@ -1,0 +1,2 @@\n"
            "+This is an example with an em dash: " + EM_DASH + "\n"
            "+This is a normal line.\n"
        )
        found = list(added_lines(sample))
        assert len(found) == 1 and found[0][1] == 1, found
        assert not list(added_lines(sample.replace("docs/index.md", "docs/evidence/california/cccl-pits/extracts/agency.txt")))
        print("Editorial punctuation rule self-test passed.")
        return 0

    base = os.getenv("BASE_SHA", "").strip()
    head = os.getenv("HEAD_SHA", "").strip() or "HEAD"
    if not base:
        base = git("rev-parse", "HEAD^1").strip()
    diff = git("diff", "--unified=0", "--no-ext-diff", "--diff-filter=ACMR", base, head, "--", "docs/")
    findings = list(added_lines(diff))
    if findings:
        print("New em dashes are not allowed in public Field Guide copy.")
        for path, lineno, content in findings:
            print(f"{path}:{lineno}: {content[:160]}")
        print("Rewrite with natural sentence punctuation. Do not modify preserved originals.")
        return 1
    print("Editorial punctuation check passed: no newly introduced em dashes.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
