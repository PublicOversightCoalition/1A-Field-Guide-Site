#!/usr/bin/env python3
"""Preserve old GitHub Pages project-path URLs after organization-root cutover.

Generate a redirect page for every published HTML path and mirror non-HTML assets.
This must run only on the generated site directory, never on authoritative docs.
"""
from __future__ import annotations

from html import escape
import json
from pathlib import Path
import shutil
import sys

LEGACY_PREFIX = "1A-Field-Guide-Site"


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: generate_legacy_redirects.py SITE_DIRECTORY")
    root = Path(sys.argv[1]).resolve()
    if not root.is_dir() or not (root / "index.html").is_file():
        raise SystemExit(f"Expected a built site containing index.html: {root}")
    legacy = root / LEGACY_PREFIX
    if legacy.exists():
        raise SystemExit(f"Legacy output already exists: {legacy}")
    files = [p for p in root.rglob("*") if p.is_file()]
    html_count = asset_count = 0
    for src in files:
        relative = src.relative_to(root)
        dest = legacy / relative
        dest.parent.mkdir(parents=True, exist_ok=True)
        if src.suffix.lower() != ".html":
            shutil.copy2(src, dest)
            asset_count += 1
            continue
        if relative.name == "index.html":
            parent = relative.parent.as_posix()
            target = "/" if parent == "." else f"/{parent}/"
        else:
            target = "/" + relative.as_posix()
        target_js = json.dumps(target).replace("</", "<\\/")
        target_html = escape(target, quote=True)
        dest.write_text(
            "<!doctype html>\n<html lang=\"en\">\n<head>\n"
            "<meta charset=\"utf-8\">\n"
            "<meta name=\"robots\" content=\"noindex\">\n"
            "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n"
            f"<meta http-equiv=\"refresh\" content=\"0;url={target_html}\">\n"
            "<title>Page moved | The Public Oversight Coalition</title>\n"
            "</head>\n<body>\n"
            "<script>\n"
            f"const destination = new URL({target_js}, location.origin);\n"
            "destination.search = location.search;\n"
            "destination.hash = location.hash;\n"
            "location.replace(destination.href);\n"
            "</script>\n"
            f"<p>This page has moved. <a href=\"{target_html}\">Continue to the new address</a>.</p>\n"
            "</body>\n</html>\n",
            encoding="utf-8",
        )
        html_count += 1
    print(f"Generated {html_count} legacy HTML redirects and mirrored {asset_count} assets")


if __name__ == "__main__":
    main()
