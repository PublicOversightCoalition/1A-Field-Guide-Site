# Agent instructions for the public Field Guide site

This repository serves the public. Write in everyday, natural language that a first-time visitor can understand. Keep legal nuance, uncertainty, and source attribution intact. Do not turn public pages into internal project status reports.

## Permanent punctuation rule

Do not use the Unicode em dash character in any new public-facing writing, navigation, metadata, headline, component text, generated copy, or contributor-facing documentation.

Use a period, comma, colon, semicolon, or parentheses where it reads naturally. Recast the sentence rather than applying a blind global substitution.

The required CI editorial checker is `tools/public_state/check_editorial_punctuation.py`. Never disable or bypass it to publish prose containing the prohibited mark.

Preserved source evidence and exact attributed quotations must remain faithful to the original. Do not modify original records just to satisfy a house style. Keep technical legal and research source materials intact.

## Accessibility and release discipline

Design and write for accessibility, including keyboard access, responsive reflow, high-contrast readable text, reduced motion, plain language, and screen-reader-friendly semantics. Do not claim full WCAG conformance based only on a successful build.

Use branch, pull request, required CI checks, merge, and verified GitHub Pages publication. Do not describe changes as live until publishing succeeds.
