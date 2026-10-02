# Project kickoff and launch status

## Latest implementation — 2 October 2026

**Product clarity and discovery: implemented locally; owner Sora, implementation Codex.** The shuffle control is now a filled button with explicit random-pick help, and a six-question FAQ explains browsing, search, previews, random discovery and suggestions. The history handler respects FAQ and return anchors. Desktop/mobile, keyboard and FAQ Back/Forward checks completed. Validation: 43/43 tests, local HTTP smoke check and git diff --check pass. Next action: owner reviews http://127.0.0.1:4319, then release through the existing GitHub workflow; no commit, push or deployment was made here.

**Catalogue:** live Sheet and local fallback reconciled at 771 published resources, 56 subcategories and 114 public cross-listings. Includes the requested career/freelance, inspiration, marketing, productivity and SpotiDownloader additions; duplicate entries retained once, HireBrain excluded, and the three missing tools restored with owner approval. Native Sheet values/validation read back; public catalogues match exactly. Details and sources: [update report](docs/DISCOVERY-FAQ-CATALOGUE-2026-10-02.md).

## Latest owner scope — overrides earlier engagement requirements

Sora approved complete removal of likes, Online now, public visitor counts, social-sharing extras and Blob. **Status: implemented locally on 27 September 2026** (owner Claude). The removals were complete: controls, copy, APIs, polling, identity, storage, configuration and dependencies. The site now serves a bundled public catalogue at start-up and keeps the latest valid Sheet read in memory (docs/OPERATIONS.md). Research stays an occasional manual agent task (docs/SUGGESTIONS.md), and attribution appears only in the tool popup. Remaining: owner setup and live checks. Scope: [the consolidated continuation](../handoff/claude-enhancements/LATEST-CONSOLIDATED-PROMPT.md).

**Product clarity and discovery:** in progress; owner Sora, implementation Claude. Evidence (27 September 2026):

- the About panel now holds only the approved story plus curation notes, with the engagement explanations removed;
- the manual Tally → research → Sheet process is documented;
- the production fallback stays indexable and unlabelled, and only explicit prelaunch or Preview is noindex.

Next action: choose a correction/contact route (`CORRECTION_URL`), confirm tools.soralives.xyz versus hades.soralives.xyz, and verify canonical, robots, sitemap and og:image on the live host.

## Current direction — reviewed 24 September 2026

The owner prefers **this Claude candidate’s existing UI**. Continue it; do not scaffold another app or replace it with Codex’s styling. Preserve Overpass, the category rail/mobile strip, sequential subcategory sections and responsive columns. Add the supplied taxonomy icons and mobile-accessible “Find something unexpected”. (Likes, Online now and visitor counts were later removed at the owner's request, 27 Sep 2026.)

Authoritative continuation package: [START-HERE](../handoff/claude-enhancements/START-HERE.md), [unfinished-build review](../handoff/claude-enhancements/CLAUDE-BUILD-REVIEW.md), and [setup/release guide](../handoff/claude-enhancements/SETUP-AND-RELEASE.md). The review created documentation only, not integrated features. Work locally → review → GitHub → tested Vercel deployments → approved production domain. Do not deploy or configure accounts merely because the guide describes how.

| Item | Status | Owner | Evidence | Next action |
|---|---|---|---|---|
| Claude visual direction | accepted direction; unfinished | Claude | Existing local app on port 4318; owner prefers its category UI | Preserve visual identity while completing additions |
| Catalogue and grouping | implemented locally | Claude; editorial owner Sora | 762 records: 723 Published, 32 Archived, 7 Draft; 10 subjects, 56 subcategories. Codex and Claude Code are first in Coding. The Bolaji and Details additions are applied, and Notion Mail is excluded. Owner additions of 28 Sep: Lumosity and Mastra are new; Design Engineer Tools, Early.tools and Duolingo were rechecked and updated by ID. | Apply `../handoff/claude-enhancements/sheet-update-2026-09-27/` to the Sheet by ID before connecting it |
| Turkish resource exclusion | implemented locally | Claude | 32 Archived excluded from published responses | Preserve archive status |
| Icons and discovery | implemented locally | Claude | Handoff taxonomy icons in badges, rail, strips, chips, section headings and preview (tested). “Find something unexpected” is now one control above the search bar on all widths, with a “Discovery category” dropdown (Everything plus the ten subjects). It is independent of search and browsing filters, counts each resource once, never repeats the last pick when there is an alternative, and disables itself for an empty category. Browser-verified at 1440, 390 and 320px, both themes, and by keyboard (28 Sep 2026). | Owner visual review |
| Brand identity and icons | implemented locally | Claude | Version 01 Original Italic (Gelasio Italic 600 h. icon + hades. wordmark), SVGs byte-identical to logo-v2/01-original-italic; favicon.svg/.ico 16/32/48, touch 180, app 192/512; header/footer/About verified at 1440/390/320, both themes | Owner review of the local build |
| Likes, Online now and public visitor figures | removed (27 Sep 2026) | Claude | Code, APIs, SQLite/Neon, the analytics-reading adapter, configuration and dependencies deleted. Tests assert the endpoints return 404/405, there is no markup, and no polling (none seen in the browser for 6 s after load). | Optional clean-up of unused cloud resources is Sora's decision (ENVIRONMENT-SETUP) |
| Tests and navigation | resolved locally | Claude | Popup bottom-edge fix (28 Sep): the popup is capped to the visible viewport and placed from its rendered height, and is re-placed on resize or size change. Content scrolls inside it under a fixed close button. Verified at 1440×900, 1280×600/420/330, 1024×360, 390 and 320, and after resizing while open. npm test 43/43; http-smoke passes on 4318 (723 resources); asset revalidation kept. 27 Sep review fixes: an open popup re-positions on resize (it becomes the bottom sheet at phone width); `check:sheet` compares additional placements and their Sort order; subject-letter badges removed from rows (the popup keeps full Listed in / Also in labels) | Verify Vercel static cache headers on the first Preview |
| Runtime Sheet publishing | implemented locally; live Sheet unconnected | Claude | Bundled public fallback at start-up; in-memory last valid Sheet read; six-hour request-driven refresh per instance (`REFRESH_SECONDS=21600`, overridable), coalesced; failures keep the last valid data; restarts use the bundled data; no disk or storage writes; the empty publication is honoured; `HADES_PRELAUNCH` kept. Tested with a simulated Sheet only. | Sora: read-only service account, `npm run check:sheet`, then the live edit and failure checks (SETUP-AND-RELEASE §6) |
| Suggest a tool (Tally) | website implemented; owner items pending | Sora (form, review); Claude (site links, credit display) | Links to https://tally.so/r/9qVrz1 in the toolbar and footer. "Suggested by" appears only in the tool popup, before Visit website, and is omitted when empty (browser-verified). Form inspected read-only. | Sora: optional form edits, the Resources!T1 header, one owner test submission |
| Version control and hosting | guide updated; setup deferred | Sora | Read-only check on 27 Sep: no app Git history, no Hades GitHub repo (account Youngrogue); Vercel project `hades-tools` is linked to the old Codex folder, has Blob and two unused variables, and no domain | Follow SETUP-AND-RELEASE: Git → GitHub → Vercel Preview → reviewed production → Cloudflare DNS |
| Product clarity and discovery | in progress | Sora (editorial); Claude (implementation) | 28 Sep: the testing disclaimer was removed from About at the owner's request (the footer note is kept; local only, not yet deployed). Production at hades.soralives.xyz was checked read-only: the same catalogue as local, from the Sheet, with discovery above the search. Approved headline, tagline and three About paragraphs; wordmark heading; X/Instagram credit without @; engagement copy removed; no preview badge on the production fallback | Correction/contact route; confirm the domain; live canonical, robots, sitemap and og:image checks |

The current app uses Node.js 24 and native JavaScript, not Astro. Run npm run dev and open http://127.0.0.1:4318/. See the review for outstanding checks. Historical prompts below are preserved as background only and must not restart the build.

## Historical build prompts

## How to start
1. Open a terminal in this folder (`hades-tool-directory/`).
2. Initialise git so Claude Code can track changes: `git init && git add -A && git commit -m "Initial handoff kit"`.
3. Run `claude` (install: https://claude.com/claude-code). It auto-loads `CLAUDE.md`.
4. Paste **Prompt 1** below. Do one prompt per session; verify the result runs before moving on.

Work in small, verifiable steps. After each, run the dev server and check the page against the matching file in `reference/` before continuing.

---

## Prompt 1 — Scaffold + design system + style guide page
```
Read CLAUDE.md, design/DESIGN.md, and design/style-guide.html.

Scaffold an Astro project in this folder with the Tailwind integration. Then:
1. Port the design tokens from design/style-guide.html into tailwind.config (colours,
   fonts Inter + Geist, 0px radius as default) — do NOT use the Tailwind CDN.
2. Add a base layout that loads Inter + Geist + Material Symbols and applies the
   high-density base styles (hairline borders, no shadows).
3. Publish the style guide as a real page at /design, rebuilt with the Tailwind tokens
   (not the standalone HTML file).

Keep it minimal — no pages beyond /design yet. Show me how to run the dev server, then stop.
```

## Prompt 2 — Shared components
```
Build reusable components matching the design system: Header, Sidebar (categories from
the data), ToolRow, CategoryColumn, Tag/Chip, Button (primary/secondary/ghost).
Use design/style-guide.html and reference/ screens as the visual spec. No pages yet —
just the components plus a scratch page rendering one of each so I can review them.
```

## Prompt 3 — Home page
```
Build the Home page (/) reading data/tool-directory.json. Group tools by their
categories[].category into columns, matching reference/directory-home/screen.png.
Use the components from the last step. Category counts come from the data.
Verify it runs and matches the reference.
```

## Prompt 4 — Category / list view
```
Build the category list view at /category/[slug] (slugged category name), matching
reference/ai-tools-list/screen.png. Add client-side filtering by tag/subcategory as an
Astro island. Handle categories with many tools (the "View all" pattern in the mockup).
```

## Prompt 5 — Tool profile
```
Build the dynamic tool profile at /tools/[slug] from data/tool-directory.json, matching
reference/tool-profile/screen.png. Render specs (pricing model, company, category,
official link), feature notes, and — per CLAUDE.md — never show version numbers or
prices; use lastVerified. If the tool has modelsUsed, link to model detail. Make
formerNames searchable so "Bard" resolves to Gemini.
```

## Prompt 6 — Guides + backlinks (the core mechanic)
```
Read the interconnection model in docs/design-brief.md §4. Propose a guides[] schema to
add to the data (slug, title, intro, body with inline tool references, toolsUsed[] of
tool slugs) and show me 1 example guide before generating more. Then build:
- guide pages that render inline tool names as chips linking to /tools/[slug]
- a "Used in these guides" backlink section on each tool page, derived from guides[].
Do not invent guide content beyond the one example until I approve the schema.
```

---

## Guardrails to remind Claude Code of if it drifts
- Reference screens are visual targets, not source to extend.
- No CDN Tailwind in the build; tokens live in tailwind.config.
- Generate pages from data — never hand-maintain per-tool HTML.
- Official links point only to a tool's own site. No downloads, affiliates, ads, or graph viz.

## Brand / About follow-up — 24 September 2026

**Product clarity and discovery remains in progress.** Editorial owner: Sora; implementation: Claude. New evidence: owner-selected h tile/wordmark screenshot saved in the handoff, proposed Why Hades narrative and asset specifications in [BRAND-AND-ABOUT.md](../handoff/claude-enhancements/BRAND-AND-ABOUT.md). Next action: Claude refines/integrates the identity and About copy, verifies favicon sizes and accessible dialog behavior, and resolves the existing social/contact and production metadata gaps. The narrative is a brand interpretation, not a mythology claim. Brand assets and new copy are specified, not implemented by this review.

## R6 review and nominations — 25 September 2026

Codex independently verified 43/43 tests, local HTTP smoke, approved About/social UI, remembered theme and narrow layouts. See [R6 review](../handoff/claude-enhancements/R6-REVIEW-2026-09-25.md) for open analytics independence, failure backoff, full module cache-versioning and existing snapshot budget findings. Claude remains implementation owner.

Tool nominations: **planned**, owner Claude; editorial owner Sora. [Specification](../handoff/claude-enhancements/TOOL-NOMINATIONS.md) now covers a Tally link, manual review/research/classification and consented public attribution. The custom Neon submission queue is superseded. Next action: obtain the Tally responder URL, add/test the link and optional catalogue credit display; no submission backend is needed.

**Product clarity and discovery remains in progress.** Evidence: approved About copy and verified social links, truthful local sample labels; planned consent/attribution copy. Next action: explain nomination review and public credit in the implemented form, verify actual retention, preserve correction/contact work and complete production canonical/metadata checks at launch.

**Product clarity and discovery update:** still in progress; owner Sora, implementation Claude. The requested suggestion flow is now Tally → manual review → catalogue Sheet. Evidence: explicit owner preference to minimise complexity. Next action: use the real Tally responder URL, explain review/credit in the form, and preserve accepted attribution without publishing unreviewed submissions.

### Tally setup checklist — owner Sora

- [ ] Create and publish “Suggest a tool for Hades” in Tally using the questions in `../handoff/claude-enhancements/TOOL-NOMINATIONS.md`.
- [ ] Use `public/icons/icon-512.png` for the form identity if supported; editable logo variants are in `public/brand/`.
- [ ] Share the public responder URL with Claude, then test the linked form and one test response.

Status: open, form does not yet exist. Next action: Sora creates the form; Claude connects the supplied URL.
