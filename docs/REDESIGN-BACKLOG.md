# Hades redesign backlog — 24 September 2026

Owner: Sora (product); implementation owner unassigned / Claude candidate. Current phase: local comparison and design review. This records requests, not completed UI fixes.

| ID | Priority / status | Requested change | Acceptance evidence needed |
|---|---|---|---|
| R01 | P1 / verified | Share the latest local version without Vercel | Current 680-resource baseline at http://127.0.0.1:4317; local server uses seed, no Vercel request required to render |
| R02 | P1 / implemented locally | Codex first, Claude second in Coding & Development | Official product identities verified; first section and first two rows in overview and expanded Coding follow this order; no substitution with opencodex/OpenClaude |
| R03 | P1 / implemented locally | Finish one subgroup before moving to the next | Every expanded subject uses visible named subcategory sections; Coding courses never interleave with coding agents or builders |
| R04 | P1 / implemented locally | Keep grouping uniform and deduplicated | Stable section order, unique category totals, one display per resource in a category's All view; explicit subcategory searches still find relevant cross-listings |
| R05 | P1 / implemented locally; owner review | Claude builds its own impressive minimalist version | Separate local candidate, working real data and interactions, deliberate typography/identity, desktop/mobile comparison; no overwrite of baseline |
| R06 | P1 / review complete, fixes open | Full design and implementation audit | See DESIGN-REVIEW-2026-09-24.md; unresolved findings included in candidate acceptance |
| R07 | P1 / recorded | Local → GitHub → Vercel workflow | No deployment during design iteration. Local approval precedes an explicit GitHub push; Vercel follows after approval |
| R08 | P2 / implemented locally | Improve preview usefulness and consistency | Brief description, useful-for statement where known, category trail, clear Visit site; no invented endorsement, pricing or suitability |
| R09 | P1 contrast; P2 other / implemented locally, measured | Accessible mobile, navigation and theme behavior | Fix measured light sidebar count contrast (3.25:1 / active3.53:1); keyboard return focus, Back behavior, 200% zoom, long content, small-screen controls, dark/light contrast, reduced motion checked |
| R10 | P2 / in progress | Product clarity and discovery | Reuse KICKOFF item; editorial owner/correction route and final domain remain unresolved; preview remains noindex |

## Grouping contract

For category All, group each matching resource into one section. Prefer its primary subcategory if it belongs to the selected category; otherwise choose the first applicable extra placement by the category's display order. Count unique resource IDs, not placements. Keep cross-listings available when a specific subcategory is selected. Hide empty sections after filtering. Global search also groups results clearly; do not revert to an unexplained mixed wall.

Coding section order: Editors & coding assistants → App & website builders → Components & libraries → APIs & developer tools → Agent skills → Hosting & infrastructure → Learning resources. Learning resources remain discoverable here, but as a clearly separated final section, and remain at home in Learning & Knowledge.

Within sections, sort by explicit editorial rank then name. Codex and Claude take precedence in the Coding assistant section. Ranking must be category-aware so a Coding preference does not reorder unrelated subject lists. Existing Sheet `Sort order` is global; any extension must preserve existing sheets and parser compatibility and be documented before updating the shared Sheet.

## Identity prerequisite

Current records include Claude (`h-5502a6be3b`, https://claude.ai/) under Productivity, but no official Codex or standalone Claude Code record. `opencodex` and `OpenClaude` are third-party entries, not substitutes. Verify official Codex and Claude Code sources; use **Codex** and **Claude Code** as the coding product labels (the latter interprets the owner's “Claude” in this context), preserving the general Claude assistant record. Record any new entries and changed counts explicitly; do not silently merge distinct products.

## Update — 24 September 2026 (Claude candidate, local)

R02–R05, R08, R09 implemented in `hades-claude-version` and checked locally (npm test 38/38, HTTP smoke, browser checks at 1440/768/390/320, light/dark, 200% zoom, keyboard, reduced motion). Handoff additions also implemented locally: taxonomy icons, mobile “Find something unexpected”, anonymous likes, Online now and a Vercel visitor-history adapter (production unconnected; docs/ENGAGEMENT.md). Data changes and required Sheet edits: docs/CANDIDATE-DATA-CHANGES.md. Open: R10 product clarity (social URL, correction route), Sheet reconciliation, Blob write budget, production credentials.

**27 September 2026:** at the owner's request, likes, Online now and the Vercel visitor-history adapter were removed (not hidden), and Blob was replaced by a bundled public fallback plus an in-memory Sheet refresh (docs/OPERATIONS.md). The Blob write budget item is closed because that code path no longer exists. Still open: R10 correction route, Sheet reconciliation (`../handoff/claude-enhancements/sheet-update-2026-09-27/`), and production credentials.
