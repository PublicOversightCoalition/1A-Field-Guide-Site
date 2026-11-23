# Public Oversight Coalition rebrand and GitHub Pages migration

## Scope and release boundary

This branch prepares the public-facing editorial identity while preserving the current hosted site. Do not change `site_url` or rename the repository until the Pages migration is coordinated. Preserve the California activation record, original-project attribution, immutable evidence, source citations, and public correction history.

## Current architecture (audited 2026-11-23)

- GitHub organization: `PublicOversightCoalition`.
- Public source: `PublicOversightCoalition/1A-Field-Guide-Site` (`main`).
- Private research: `PublicOversightCoalition/1A-Field-Guide` (do not publish its contents).
- Deployment: `.github/workflows/pages.yml` builds MkDocs and pushes `site-preview` to `gh-pages`.
- Current `site_url`: `https://publicoversightcoalition.github.io/1A-Field-Guide-Site/`.
- Supabase member frontend deploys backend configuration from GitHub Actions variables; do not commit configuration or credentials.

## Intended target

- User-facing publication: **The Public Oversight Coalition**.
- Field guide resource: **The Public Oversight Field Guide**.
- Proposed public Pages repo: `PublicOversightCoalition/publicoversightcoalition.github.io`.
- Proposed public site: `https://publicoversightcoalition.github.io/`.
- Proposed private research repo: `PublicOversightCoalition/Oversight-Investigations`.

## Cutover checklist (not yet executed)

1. Check whether `publicoversightcoalition.github.io` repo name is unoccupied and verify GitHub Pages branch/source settings.
2. Inventory hardcoded `/1A-Field-Guide-Site/` and full old-site URLs in HTML, JavaScript, CSS, YAML, scripts, content, issue templates, and external sites.
3. Verify Supabase Auth redirect URLs, site URL, magic-link flow, member session handling, and any allowlists before host change. Avoid exposing private keys or unpublished records.
4. Change `mkdocs.yml` `site_url` to the new root URL in the same release as repository rename. Review relative URL generation and canonical tags.
5. Update `pages.yml` workflow title, artifact/worktree naming and any hardcoded deploy paths, preserving branch naming and safety checks.
6. Build and validate on a PR; check accessibility, broken links, registry, investigations, evidence, member login and editor workflow.
7. Coordinate repo rename and Pages source; confirm root URL works, then migrate external links. GitHub repository redirects do not guarantee redirects for old GitHub Pages project paths. Consider keeping an independently deployed legacy redirect stub if technically possible.
8. Only after verification, rename private repo and update cross-repo links, remotes, automation integrations, instructions and internal governance references.

## Editorial guidelines

- Treat published accounts, allegations, legal analysis, confirmed findings, and unanswered questions as different categories.
- Publish supporting documents only when privacy, confidential source protection, and lawful release requirements permit.
- Preserve primary-source links, verification dates, correction history, and disclosure of AI assistance.
- Never publish private intake information or unpublished investigation evidence merely to demonstrate transparency.
