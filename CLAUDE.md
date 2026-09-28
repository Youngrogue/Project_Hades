# Hades — current project instructions

Updated 24 September 2026. These instructions supersede the historical Astro, nine-tool, multi-page and workflow-guide plans.

## Current task and workflow

The owner now prefers this existing Claude candidate. Preserve its visual identity and continue the unfinished build. Read `../handoff/claude-enhancements/START-HERE.md`, `CLAUDE-BUILD-REVIEW.md` and `SETUP-AND-RELEASE.md` in that handoff directory. These supersede earlier requests to start another design. Taxonomy icons and mobile-accessible Find something unexpected are done; keep the current category selector and grouped columns. **Likes, Online now, public visitor figures and Blob were removed on 27 Sep 2026 at the owner's request; do not reintroduce them** (see `../handoff/claude-enhancements/LATEST-CONSOLIDATED-PROMPT.md`). The handoff is a specification, not already-integrated functionality. Older design audits remain background references.

**Work locally. No Vercel deployment, cloud publishing, credentials setup or DNS changes.** The owner's sequence is local build → local review and iteration → GitHub → Vercel after approval. No GitHub remote currently exists; do not create or push one just because deployment docs describe future hosting. Historical Vercel previews already exist; do not update or delete them as a side effect.

## Product truth

A useful-internet index: browse subject/subcategory sections, search, inspect a short resource preview, visit the original site. One page. Google Sheets is the live content editor (read-only reader, request-driven refresh at most every six hours per instance via `REFRESH_SECONDS=21600`, no redeploy). The release bundles a public-only fallback (`data/fallback-catalogue.json`) served at start-up and whenever the Sheet can't be read; the latest valid Sheet read is held in memory only. The live reader is not yet connected. Local work needs no credentials.

- Heading: **Tools and Applications for the 21st century internet user.**
- Tagline: **Where the treasures of the world are buried.**
- Credit (updated 24 Sep 2026): **Curated by Sora**, then links **X · Soralives** (https://x.com/Soralives) and **Instagram · rogueskye** (https://www.instagram.com/rogueskye/). No visible @ symbols. Do not invent other profiles.
- Dark theme by default for first visits; an explicit light/dark choice is remembered.
- Hades is the working brand. No claim that every imported entry is personally tested or endorsed.
- Search, subject categories and subcategories only. Do not reintroduce cost or audience filters.
- Keep the 32 Turkish-market/language entries Archived and 7 unresolved entries Draft.
- Preserve the implemented sequential subcategory sections. Coding assistants first; official Codex then Claude Code at the top. Keep Claude’s placement-specific Sort order and stable IDs; do not copy Codex category_ranks without explicit reconciliation.

## Current implementation and authoritative data

Node.js 24 with native JavaScript, CSS and a local HTTP server; there is no current Astro build.

- `data/catalogue.json`: complete editorial catalogue; 762 records, 723 Published, 32 Archived, 7 Draft, 56 subcategories. Run `npm run build:fallback` after editing it.
- `data/fallback-catalogue.json`: generated public-only bundled catalogue (tests fail if stale).
- `data/migration-provenance.json`: 726 source entries and reconciliation history.
- `public/shared.mjs`: selection, sorting and row rendering.
- `public/app.mjs`: client navigation, filtering and dialogs.
- `public/styles.css`, `lib/page.mjs`: current visual implementation and server-rendered HTML.
- `server.mjs`, `lib/http-handler.mjs`: local server and routes.
- `lib/catalogue.mjs`: validation, Sheet parser and public field allowlist.
- `lib/store.mjs`, `lib/request-refresh.mjs`, `lib/sheets.mjs`: in-memory catalogue with bundled fallback, request-driven refresh, read-only Sheet reader.
- `lib/runtime.mjs`, `lib/environment.mjs`: shared start-up for `server.mjs` and `api/index.js`; every environment setting.
- `api/`, `vercel.json`: existing host adapter; not needed for local design review.
- `tests/`: content, escaping, publication, archive, cache and adapter checks.

Run `npm ci` if dependencies are absent, then `npm run dev`; this candidate defaults to port 4318. Run `npm test` and `node scripts/http-smoke.mjs http://127.0.0.1:4318`. Current: 43/43 tests and the smoke script pass (27 Sep 2026). See `docs/OPERATIONS.md` for catalogue fallback/refresh behaviour.

Never use `data/tool-directory.json` (the old nine-tool dataset) for the new site. `docs/design-brief.md`, `design/DESIGN.md`, the Stitch screenshots and `docs/history/` are historical references, not mandatory visual targets. The owner prefers this candidate’s current visual direction; preserve its CSS design language while implementing the targeted additions.

Read the parent `AGENTS.md`; keep **Product clarity and discovery** tracked in the existing `KICKOFF.md` with status, owner, evidence and next action.

## Brand and About addition — 24 September 2026

Read `../handoff/claude-enhancements/BRAND-AND-ABOUT.md` and its saved screenshot before brand work. The owner chose the pale-blue italic h tile and lowercase hades. wordmark. Claude owns refinement, icon/favicon production and integration into the existing UI, plus About Hades / Why Hades copy. Preserve other approved requirements and any completed work. This is a local implementation request, not deployment permission.

## Latest continuation — 25 September 2026

Read `../handoff/claude-enhancements/R6-REVIEW-2026-09-25.md`, `ENVIRONMENT-SETUP.md` and `TOOL-NOMINATIONS.md` before the next implementation pass. R6 tests now pass 43/43; preserve completed UI work. Resolve the new review findings and implement the updated Tally-link/manual-review/public-credit workflow locally. No deployment or shared Sheet writes are authorised by these documents.

## Superseding suggestion scope — 25 September 2026

Sora chose simplicity: a normal Suggest a tool link to a Tally form, review inside Tally, then manual approved entries in the catalogue Sheet. Read the rewritten TOOL-NOMINATIONS.md. Do not implement the earlier custom nomination database, API, SQL migration, review CLI or Turnstile proposal. Tally URL supplied (https://tally.so/r/9qVrz1) and linked from the site via `lib/site-config.mjs`; see `docs/SUGGESTIONS.md`. Identity: Version 01 Original Italic (`docs/BRAND.md`).

## Lean library — 27 September 2026

Implemented locally per `../handoff/claude-enhancements/LATEST-CONSOLIDATED-PROMPT.md`:
- likes, Online now, visitor figures, Neon/SQLite and Blob removed;
- bundled fallback plus live Sheet refresh;
- "Suggested by" shown only in the popup;
- research is an occasional manual agent task, documented in `docs/SUGGESTIONS.md` and not built into the site.

The combined Sheet update (not applied) is in `../handoff/claude-enhancements/sheet-update-2026-09-27/`. Setup: `SETUP-AND-RELEASE.md` and `ENVIRONMENT-SETUP.md` in the handoff.

## Discovery, popup and additions — 28 September 2026

- **Discovery:** "Find something unexpected" is one control above the search bar, with a Discovery category dropdown. It is independent of browsing filters (`discoveryPool` and `pickDiscovery` in `public/shared.mjs`).
- **Popup:** always fits the visible viewport, and its content scrolls internally.
- **Refresh:** `REFRESH_SECONDS` defaults to 21600: per instance, request-driven, and not a schedule.
- **Catalogue:** Lumosity and Mastra added; Design Engineer Tools, Early.tools and Duolingo updated by ID. The Sheet patch is in `../handoff/claude-enhancements/sheet-update-2026-09-27/`.
