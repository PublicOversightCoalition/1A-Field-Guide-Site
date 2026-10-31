---
title: Contra Costa County Library — PITS evidence
---

# Contra Costa County Library — PITS evidence

**Collection:** `cccl-pits-2026-10-19`  
**Jurisdiction:** California · Contra Costa County  
**Investigation:** [Contra Costa County Library — PITS](../../../california/investigations/contra-costa-library-pits.md)  
**Production completed:** 2026-10-19  
**Source records:** 16

<div class="registry-bottom-line" markdown>

**Collection role:** This is the first-production evidence set used to understand how PITS records incidents, classifications, suspensions, restricted data, report editing, staff guidance, and branch-level incident metadata. It is not, by itself, proof that any individual incident classification or enforcement action was correct.

</div>

## Integrity and publication method

The original agency-produced files are retained exactly as received and identified below by SHA-256. The public site currently serves **search-friendly derivatives** for the text-bearing PDFs and the incident spreadsheet.

PDF derivatives were produced by text extraction for search and accessibility. Screenshots, layout, and image-only material can be incomplete in those derivatives. The incident spreadsheet derivative is a CSV with the original columns preserved and Excel serial dates normalized to ISO dates.

The original-source files remain the integrity reference. A derivative should never be cited as though it were the original PDF or XLSX.

## Incident dataset snapshot

The first-production spreadsheet contains **1,749 incident rows** spanning **2015-04-17 through 2026-09-22**:

| Branch | Rows |
| --- | ---: |
| Walnut Creek Library | 930 |
| Concord Library | 819 |

The export contains **1,700 `Submitted`** rows and **49 `Created`** rows. Its structured fields include incident date/time, location, infraction categories and infractions, status, follow-up, victim/witness flags, and several support-call fields.

The first-production export does **not** contain the narrative descriptions needed to independently test many incident classifications against what the patron and staff actually did or said. That missing narrative is one reason the follow-up request seeks description-inclusive records.

[Download the public CSV derivative](extracts/pits-incidents-concord-walnut-creek.csv)

## What the system guidance adds

The supporting records make the spreadsheet more interpretable:

- PITS is described as a searchable incident database used across the Library system.
- Training says reports are routed to managers/leadership and can help identify patterns across branches.
- Manager guidance tells staff to use objective observations rather than speculation and says a PITS report should be created when staff ask a patron to leave, even for a day.
- Earlier training states that PITS and associated documents are public records subject to the California Public Records Act.
- The user guides show that incidents can be created, reviewed/edited, browsed, reported, and connected to restricted-data and person-detail functions.
- The production includes both older and current infraction-category material, plus separate instructions for adding perceived-race descriptors.

Those facts support investigation questions about completeness, lifecycle history, classification changes, suspension links, restricted records, and whether a flat export represents the full operational record.

## Source records

### Dataset

| Evidence ID | Source | Public access | Integrity |
| --- | --- | --- | --- |
| `CCCL-PITS-001` | `PITS_ListIncidentsWCLandCON.xlsx` | [CSV derivative](extracts/pits-incidents-concord-walnut-creek.csv) | SHA-256 `22cd40a5731ffd589f812e779d20edb9d87cbd7cdb972a5743693b1cc5b2e3a0` |

### System reference and training

| Evidence ID | Source | Why it matters | Public access |
| --- | --- | --- | --- |
| `CCCL-PITS-002` | PITS Glossary | Defines PITS terminology and fields. | [Text derivative](extracts/pits-glossary.txt) |
| `CCCL-PITS-003` | PITS Best Practices for Managers 2025 | Objective-reporting guidance, report triggers, suspension authority. | [Text derivative](extracts/pits-best-practices-managers-2025.txt) |
| `CCCL-PITS-004` | PITS Training prior to March 2026 | Earlier system goals, routing, reporting expectations, public-record statement. | [Text derivative](extracts/pits-training-prior-to-march-2026.txt) |
| `CCCL-PITS-005` | PITS Training updated March 2026 | Updated PITS/suspension training and later policy structure. | [Text derivative](extracts/pits-training-updated-march-2026.txt) |

### System mechanics

| Evidence ID | Source | Why it matters | Public access |
| --- | --- | --- | --- |
| `CCCL-PITS-006` | User Guide — Browse Incidents | Shows browse/filter functionality. | [Text derivative](extracts/pits-user-guide-browse-incidents.txt) |
| `CCCL-PITS-007` | User Guide — Create Incident Report | Shows how staff create incident records and enter information. | [Text derivative](extracts/pits-user-guide-create-incident-report.txt) |
| `CCCL-PITS-008` | User Guide — Review/Edit Incident Report | Establishes post-creation review/edit functionality. | [Text derivative](extracts/pits-user-guide-review-edit-incident-report.txt) |
| `CCCL-PITS-009` | User Guide — Perpetrator Details | Documents person-detail fields and handling. | [Text derivative](extracts/pits-user-guide-perpetrator-details.txt) |
| `CCCL-PITS-010` | User Guide — PITS Dashboard | Documents dashboard access/functions. | [Text derivative](extracts/pits-user-guide-dashboard.txt) |
| `CCCL-PITS-011` | User Guide — Reports | Documents reporting functions and available report paths. | [Text derivative](extracts/pits-user-guide-reports.txt) |
| `CCCL-PITS-012` | User Guide — Restricted Data | Documents restricted-data features and access handling. | [Text derivative](extracts/pits-user-guide-restricted-data.txt) |
| `CCCL-PITS-013` | User Guide — Recent Changes and Additions July 2025 | Provides a dated change record for PITS functionality. | [Text derivative](extracts/pits-user-guide-recent-changes-july-2025.txt) |

### Classification and taxonomy

| Evidence ID | Source | Why it matters | Public access |
| --- | --- | --- | --- |
| `CCCL-PITS-014` | Instructions for Race in PITS 2025 | Adds perceived-race descriptors and states intended data uses. | [Text derivative](extracts/instructions-race-pits-2025.txt) |
| `CCCL-PITS-015` | Current PITS Infractions Categories | Current taxonomy used to classify conduct. | Source retained; image-only PDF |
| `CCCL-PITS-016` | PITS Infraction Categories prior to March 2026 | Earlier taxonomy used to compare classification changes. | Source retained; image-heavy PDF |

[Machine-readable collection manifest](manifest.json)

## Source integrity hashes

The manifest records the exact byte size and SHA-256 for all 16 original files, including sources that do not yet have a public derivative. This lets later publications, redactions, or direct-download copies be checked against the preserved production.

## What this collection does not establish

This production does not yet establish:

- that the incident list includes every restricted or deleted incident;
- that every classification was factually supported;
- what narrative facts underlie individual category labels;
- how all suspensions map to specific incidents;
- whether records were later edited, reclassified, restricted, or deleted;
- or whether a PITS account agrees with police, 911, EMS, body-camera, or other outside records.

Those questions remain in the [active investigation](../../../california/investigations/contra-costa-library-pits.md) and the October 27 follow-up request.

## Privacy posture

The project does not treat agency disclosure as an instruction to republish every detail automatically. Public derivatives are reviewed for obvious high-risk personal information, while source-file integrity is preserved separately. Publication of an agency-produced record does not adopt or validate the agency's own redaction decisions.
