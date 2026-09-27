# Approved index implementation

24 September 2026. User approved the category/publishing proposal and creation of a Google Sheet.

| Work | Status | Owner | Evidence / next action |
|---|---|---|---|
| Consolidate and categorize collection | complete | Codex | 713 source entries reconciled into 706 resources; provenance retained |
| Google Sheets editor | complete | Codex | Four native Sheet tabs with dropdowns, tables and validation; roundtrip readback verified |
| One-page index | implemented | Codex | Compact category lists, search, filters, previews, mobile and keyboard support verified |
| Runtime publishing | implemented; connection pending | Codex | Private Sheets reader; local file / Vercel private Blob persistence; request-driven stale refresh |
| Verification | passed locally | Codex | 12 tests, HTTP checks, Sheet readback, desktop/mobile checks; deployed integration check remains |
| Product clarity and discovery | in progress | Codex | Hades used as working name; useful-internet positioning in page; public brand/correction contact and production discovery verification unresolved; target URL tools.soralives.xyz confirmed |

## Design and architecture

The page's job is to help anyone find a useful website and understand it before visiting. Use a small Hades wordmark, a short promise, compact search and an index immediately beneath. A narrow subject rail and category columns make the collection feel like a personal reference shelf. Selecting a category reveals subcategories and cross-listed resources. Avoid oversized introduction panels.

Palette: ink #101214, surface #171A1D, border #30353A, text #ECEFF1, muted #9AA4AC, active blue #9DC9F5. Typography: system sans for resource names and body, Georgia for the restrained title, system monospace for category counts. Icons carry most of the colour. No animation except short focus/preview transitions; respect reduced motion.

A small Node server will render the initial directory HTML and serve the interactive client. This replaces the historical build-time Astro/Tailwind plan: it directly supports runtime sheet updates and readable initial HTML without a frontend build pipeline. Use Google's maintained authentication library for the private sheet reader. Vercel Functions serve the page and API. A private Vercel Blob stores the last valid snapshot; conditional writes prevent concurrent refreshes overwriting newer data. Requests check the shared snapshot at most once per minute per instance, and refresh from Sheets when it is five minutes old. The standalone server retains file persistence for local/other hosting. Google credentials remain required before live sync.

The Google Sheet is the editorial source once connected; the imported local JSON is a development seed. No public sheet sharing is required. Public responses exclude drafts and editorial fields. No personal endorsement or fully verified claim is made for imported historical resources.

## Verification — 24 September 2026

- `npm test`: 12 passing tests cover reconciliation, private fields, filters/cross-listings, safe output, Sheet edits/new rows/categories, archive removal, persistence/restarts/outages, Blob conditional writes and request-driven refresh.
- `node scripts/http-smoke.mjs`: HTML, public API, four assets, private-path 404s, unsupported methods and health passed locally.
- Native Google Sheet readback matches all 667 published resource records, 54 subcategories and public placements. Native browser review covered all four tabs.
- 32 Turkish-market/language entries archived in the Sheet and local migration seed at owner request. Full source history retained. Seven unresolved entries remain Draft.
- Browser: search, category/subcategory, Free and kids filters, cross-listed Pexels, empty results, preview links, Escape/focus return, mobile bottom sheet; 390px and 320px layouts checked. No app console errors. New headline checked at desktop and 390px phone sizes; no horizontal overflow.
- An end-to-end edit through Google reader credentials and deployed Blob has not yet been tested. Imported source links have not all received a fresh availability/pricing audit.

- Vercel Preview build passed all 12 tests. Authenticated requests verified HTTP 200 for HTML/API, exact heading, preview noindex, 667 public resources and absence of archived records/editorial fields. Preview URL: https://hades-tools-o1tjzlu3w-tobiarogunmati-9307s-projects.vercel.app
- Local Git commit exists. GitHub private-repository creation/upload awaits explicit approval after automatic review rejected the external upload. Google reader credentials/access also await confirmation.

## Owner refinement — 24 September 2026

Removed the cost and audience controls and preview badges. Search, category navigation and subcategory chips remain; obsolete cost/audience URL parameters no longer affect results. Optional editorial columns stay in the sheet to avoid deleting source information. Added the approved tagline “Where the treasures of the world are buried.” to the introduction, About and metadata, and “Curated by Sora · @Soralives” to the footer/About. The handle is plain text until a platform/profile URL is provided.

Mistral AI was absent and is now Published in the sheet and local catalogue: Productivity & Business / General AI assistants & automation, with a Coding & Development / APIs & developer tools placement. Description checked against https://mistral.ai/. Master v34 preserves v33 and adds source entry 686. Current totals: 714 source entries, 707 unique resources, 668 Published, 32 Archived, 7 Draft.

Validation for this refinement: 12 tests passed locally and on Vercel; local HTTP checks passed. Browser checks confirmed one Mistral result, its Coding cross-listing, working subcategory selection and correct visit link. Removed URL filters are discarded. Mobile width 390px has no horizontal overflow. Sheet rows Resources!A708:S708 and Additional placements!A105:D105 were read back and verified.

Latest preview: https://hades-tools-mioo5h2ko-tobiarogunmati-9307s-projects.vercel.app


## Design, coding and Mac intake — 24 September 2026

Added 12 resources from the owner’s latest list; Collect UI was already present and remains one record. Mobbin MCP is a separate integration from the existing Mobbin directory. Master v35 preserves v34 and appends sources 687–698. Current totals: 726 source entries, 719 unique resources, 680 Published, 32 Archived, 7 Draft.

Entries use existing subject categories and subcategories. Mac apps carry searchable Mac/macOS tags rather than splitting them into a separate subject category. Mobbin MCP, MiniMax Code, Grok Bot, Toolcraft and Dia have additional relevant placements. Thinking Orbs now links to https://libraries.dev/orbs; MiniMax Code links to https://agent.minimax.io/download. Submitted links are retained as aliases. Descriptions were checked against the official pages; no pricing audit was performed.

Validation: 12 tests passed locally and in the Vercel build; complete Google Sheet readback matched all 680 published resources and 54 subcategories. Local HTTP checks passed. The hosted public catalogue matched the local catalogue, all 12 additions were searchable, all four Mac apps matched a Mac search, and Collect UI appeared once. Preview: https://hades-tools-jb0rx0txp-tobiarogunmati-9307s-projects.vercel.app (Vercel login may be required).

## Lean library — 27 September 2026

The architecture above is superseded where it mentions Blob. Changes:

- **Storage:** there is no Blob snapshot or file persistence. Start-up serves the bundled public catalogue (`data/fallback-catalogue.json`), and the latest valid Sheet read is held in memory (docs/OPERATIONS.md).
- **Removed features:** likes, Online now, public visitor figures and their storage/APIs.
- **Verified locally:** `npm test` and the HTTP smoke check; desktop 1440 and phones 390/320 in both themes, including search, previews, keyboard focus return, Tally links and popup-only attribution. No background requests after load.
- **Not yet verified:** the live Sheet reader and the Vercel deployment.
