# Agent instructions for the public Field Guide site

This repository serves the public. Write in everyday, natural language that a first-time visitor can understand. Keep legal nuance, uncertainty, and source attribution intact. Do not turn public pages into internal project status reports.

## Permanent punctuation rule

Do not use the Unicode em dash character in public-facing writing, navigation, metadata, headlines, component text, generated copy, or contributor-facing documentation, whether existing or newly written. The repository's full-source CI check enforces this policy.

Use a period, comma, colon, semicolon, or parentheses where it reads naturally. Recast the sentence rather than applying a blind global substitution.

The required CI editorial checker is `tools/public_state/check_editorial_punctuation.py`. Never disable or bypass it to publish prose containing the prohibited mark.

Preserved source evidence and exact attributed quotations must remain faithful to the original. Do not modify original records just to satisfy a house style. Keep technical legal and research source materials intact.


## Continuous CI verification

After every push or pull request update, check the resulting GitHub Actions runs without waiting for another user prompt. If runs are queued or in progress, recheck within the same task until they finish, as practical. Review every required check, not only the main build. For failures, inspect job steps and logs, fix issues within the authorized scope, push a correction, and verify the new run. Do not disable or weaken checks to obtain a passing result. Before ending, report the actual per-workflow outcome, link the PR, and explicitly identify any checks not completed or independently verified. Never imply that CI passed merely because the commit or PR was created. Do not promise monitoring after the current interaction ends.

## Accessibility and release discipline

Design and write for accessibility, including keyboard access, responsive reflow, high-contrast readable text, reduced motion, plain language, and screen-reader-friendly semantics. Do not claim full WCAG conformance based only on a successful build.

Use branch, pull request, required CI checks, merge, and verified GitHub Pages publication. Do not describe changes as live until publishing succeeds.
