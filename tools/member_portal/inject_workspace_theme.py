from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "docs"
STYLESHEET = "/1A-Field-Guide-Site/stylesheets/member-workspace.css"
TARGETS = [DOCS / "member-pilot.html", DOCS / "member-community.html"]


def patch(path: Path) -> None:
    text = path.read_text(encoding="utf-8")

    # Preserve the existing inline-style hash while allowing the same-origin
    # workspace stylesheet. Do not touch script-src or backend placeholders.
    text, count = re.subn(
        r"style-src (?!'self' )('sha256-[^']+')",
        r"style-src 'self' \1",
        text,
        count=1,
    )
    if count != 1 and "style-src 'self'" not in text:
        raise SystemExit(f"Could not safely update CSP style-src in {path}")

    link = f'<link rel="stylesheet" href="{STYLESHEET}">'
    if link not in text:
        marker = "</style>"
        if marker not in text:
            raise SystemExit(f"Inline style marker not found in {path}")
        text = text.replace(marker, marker + "\n" + link, 1)

    path.write_text(text, encoding="utf-8")
    print(f"Applied workspace theme to {path.relative_to(ROOT)}")


for target in TARGETS:
    patch(target)
