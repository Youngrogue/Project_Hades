# Product

<!-- impeccable:product-schema 1 -->

Source: the owner's alternative-design brief (CLAUDE-REDESIGN-PROMPT.md, 24 September 2026), CLAUDE.md, KICKOFF.md and the 24 September design review. The owner asked not to be re-interviewed on decisions the brief already makes, so every fact below is taken from those documents; nothing here was inferred beyond them.

## Platform

web

## Users

Curious internet users of every kind (students, designers, developers, musicians, job seekers, people handling everyday tasks) who want a trustworthy shortcut to a useful website. They arrive with either a subject in mind ("something for music production") or a name they half-remember, scan quickly, read one or two lines, and leave for the original site. Returning visitors come back to a subject they used before and expect the same order.

## Product Purpose

Hades is a curated discovery index of useful websites across learning, design, coding, music, video, productivity, internet utilities, careers, everyday life and exploration. Its single job: browse → understand briefly → visit the original website. Success is a visitor reaching a relevant external site within seconds, without filters, accounts or detours. One page, fast to scan.

## Positioning

A personal collector's index by Sora (@Soralives), not a scraped directory or a SaaS marketplace: every entry is placed by hand into a subject and a named section, cross-listed where it genuinely serves two subjects, and ordered with editorial rank. Inclusion is a discovery aid, not a claim that every service was personally tested.

## Operating Context

- Desktop visitors scan whole subjects; mobile visitors search or jump to one subject and read a single column.
- Content is edited in a private native Google Sheet (Resources, Categories, Additional placements, How to edit). The runtime reader is built but not connected; local work runs on the validated seed `data/catalogue.json`.
- Content edits must eventually go live without a code rebuild (last-good cache, request-driven refresh).
- Workflow: local build → local owner review → GitHub (explicit approval) → Vercel at tools.soralives.xyz. No deployment during design iteration.

## Capabilities and Constraints

- 719 unique resources in the seed (680 Published, 32 Archived Turkish-market entries, 7 Draft), ten subjects, 54 subcategories, one record per ID with additional placements for cross-listing.
- Controls: search, subject navigation, subcategory controls. No cost or audience filters.
- Each resource: name, URL, description, optional useful-for (`best_for`, present on only 13 records), optional logo, tags, editorial rank.
- Grouping contract: a subject's All view shows visible sequential subcategory sections with counts; each ID appears once (primary placement first, else earliest extra placement by section order); empty sections hidden.
- Coding & Development order: Editors & coding assistants (Codex first, Claude Code second) → App & website builders → Components & libraries → APIs & developer tools → Agent skills → Hosting & infrastructure → Learning resources.
- Direct external links must work without JavaScript. Drafts, archived entries and editorial fields never reach public output.
- Open: correction route, editorial owner, final social profile URL for @Soralives.

## Brand Commitments

- Working name: **Hades**.
- Heading, verbatim: "Tools and Applications for the 21st century internet user."
- Tagline, verbatim: "Where the treasures of the world are buried."
- Credit, verbatim: "Curated by Sora · @Soralives" (text only; no invented link).
- The treasure metaphor may inform tone but must not become a game, fantasy illustration or large decorative hero.
- Rejected: the old purple/Inter/zero-radius system, multi-page profiles, model/company pages, workflow guides, the nine-tool dataset.

## Evidence on Hand

- `data/catalogue.json` (seed) and `data/migration-provenance.json` (726 source entries → 719 resources).
- 13 records carry verified useful-for copy; the other 667 have none, and none may be invented.
- No logos are stored; icons come from site favicons with an authored fallback.
- No testimonials, usage numbers or endorsements exist. None may be fabricated.

## Product Principles

1. Organization is visible by default: sections, not filters, carry the structure.
2. The destination is the product; every path ends at the original website in one or two actions.
3. Curation is shown, not claimed: order, placement and short truthful copy do the work.
4. Every edit flows from the Sheet; the interface never hard-codes content.
5. Fast and legible on any device before anything decorative.

## Accessibility & Inclusion

WCAG 2.2 AA contrast for all text states (the audit's light-theme count defect at 3.25:1 must be fixed), full keyboard operation with visible focus and focus return from previews, reduced-motion support, 200% zoom without loss, and comfortable ~44px touch targets on mobile.
