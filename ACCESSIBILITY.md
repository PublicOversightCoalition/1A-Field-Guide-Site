# Accessibility status and testing scope

**1A Field Guide | Public Oversight Coalition**  
**Status reviewed:** November 5, 2026  
**Target:** WCAG 2.2 Level AA, as a development objective, not a conformance claim.

We want the Field Guide to be usable by people with a wide range of disabilities, devices, and assistive technologies. Accessibility is an ongoing engineering and editorial responsibility.

## What has been checked

As of the last completed baseline (PR #66):

- **213 of 213 functional browser journeys passed**, across Chromium, Firefox, and WebKit (71 in each engine).
- The automated Chromium axe-core WCAG screening reported **zero flagged checks** in its configured scope.
- Playwright tests cover mobile navigation, search, member sign-in forms, keyboard activation, accessible focus indication, the moving research reel and reduced-motion behavior, text spacing, text enlargement, and narrow-viewport reflow.
- All three browser engines run functional checks on pull requests to `main`. The Chromium job additionally runs axe-core screening over selected rendered pages.
- These results describe **the tested pages, engines, interactions, and versions**. A passing score is not proof that untested content or interactions are accessible.

A later automated review is extending this coverage to browser-exposed landmarks, accessible names, and control roles. See the pull-request checks for its outcome before treating that additional coverage as complete.

## What automated testing cannot determine

No automated test suite can certify that the site conforms to every WCAG 2.2 AA success criterion. In particular, the following **remain to be verified by people**:

- Actual spoken announcements and navigation with **NVDA, JAWS, VoiceOver, and/or TalkBack**, where appropriate.
- Experience on physical phones, tablets, and desktops, including platform accessibility settings.
- Whether focus order, link descriptions, landmark structure, and announcements make sense to real users.
- Usability of the content, forms, and interactions for users of magnification, alternative input methods, and cognitive accessibility tools.

Browser-exposed roles, names, focus movement, and ARIA attributes **can** be checked programmatically, but they are not a substitute for a person testing real assistive technology.

## Reporting a barrier

Use the [Accessibility barrier report](https://github.com/PublicOversightCoalition/1A-Field-Guide-Site/issues/new?template=accessibility-report.yml) template to describe a problem. Providing your device, browser, assistive technology (if applicable), the affected page, and steps to reproduce helps the team evaluate it. You do not need to disclose any disability or diagnosis.

GitHub issues are public. **Do not post passwords, private records, identifying information about third parties, or sensitive screenshots.** If GitHub itself is inaccessible, the availability of a separate reporting channel remains an outstanding project task.

Issues are reviewed and prioritized; reports do not automatically change published legal guidance.

## Scope and limitations

This document is a **testing-progress record**, not a certification, compliance guarantee, or assertion of full accessibility. A lack of automated findings is not proof that barriers are absent. Testing and remediation will continue alongside the Field Guide's substantive development.

See the accessibility workflow in `.github/workflows/accessibility.yml` and test scripts under `tools/accessibility/` for the implemented checks.
