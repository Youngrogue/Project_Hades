# Copy this brief into Claude Code

You are building an independent alternative design for Project Hades. The current version works but the owner finds it too plain and generic. Deliver a complete, distinctive minimalist useful-internet directory, not just a moodboard or suggestions. Keep work local for comparison. Do not deploy to Vercel, push to GitHub, modify DNS, connect credentials, change the shared Google Sheet, or overwrite the current version.

## 1. Read the project, then build in a separate folder

Project root: `/Users/APPLE/Downloads/Bob the Builder/Project Hades`
Current app: `/Users/APPLE/Downloads/Bob the Builder/Project Hades/hades-tool-directory`
Create your candidate at `/Users/APPLE/Downloads/Bob the Builder/Project Hades/hades-claude-version` and use port **4318**. Preserve the original app on **4317**. Copy only necessary source, data, public assets, tests and configuration. Exclude `.git`, `.vercel`, `.env*`, credentials, `.cache` and `node_modules`. Do not copy secrets. Install dependencies locally if needed. Do not run any deploy command.

Read these current resources first, resolving paths from the current app:
1. `CLAUDE.md`, `README.md`, `KICKOFF.md` and the parent `/Users/APPLE/Downloads/Bob the Builder/AGENTS.md`.
2. `docs/REDESIGN-BACKLOG.md` and `docs/DESIGN-REVIEW-2026-09-24.md`.
3. `data/catalogue.json`, `lib/catalogue.mjs`, `data/migration-provenance.json`.
4. `lib/page.mjs`, `public/styles.css`, `public/app.mjs`, `public/shared.mjs` and `server.mjs` to understand current behavior.
5. `docs/IMPLEMENTATION.md` for functionality and validation; `docs/DEPLOYMENT.md` only for future integration boundaries, not actions to execute.

The old `docs/design-brief.md`, `data/tool-directory.json`, `design/DESIGN.md`, `design/style-guide.html`, Stitch screens and `Hades V2/` are historical. They may inspire you but must not restore the old nine-tool dataset, compulsory purple/Inter/zero-radius styling, multi-page profiles, model/company pages or workflow guides. `Tool Directory Project/useful-websites-master-v35.md` is provenance, not the renderer's source.

## 2. Use the installed design skills deliberately

Read these actual local SKILL.md files; do not merely name-drop them:

- `/Users/APPLE/Downloads/Bob the Builder/.agents/skills/impeccable/SKILL.md` — lead workflow. Use its context/setup and relevant critique, shape/new-work, typography/layout, adapt, audit and polish playbooks. Capture product truth from this brief before visual decisions. The owner wants a real redesign, so current appearance is an anti-reference, not visual authority.
- `/Users/APPLE/.agents/skills/frontend-design/SKILL.md` — distinctive composition, typography and a product-specific visual idea.
- `/Users/APPLE/Downloads/Bob the Builder/.agents/skills/design-taste-frontend/SKILL.md` — contextual anti-template review. Apply its editorial/minimalism judgment; do not blindly apply landing-page theatrics to a dense directory.
- `/Users/APPLE/Downloads/Bob the Builder/.agents/skills/mobile-app-ui-design/SKILL.md` — selective mobile hierarchy, spacing and interaction guidance. No requirement to add celebration effects, native-app navigation or decorative cards.
- `/Users/APPLE/Downloads/Bob the Builder/.agents/skills/product-clarity-discovery/SKILL.md` — maintain the existing kickoff item with evidence and unresolved facts.
- `/Users/APPLE/.codex/plugins/cache/claude-cowork/design/1.2.0/skills/design-critique/SKILL.md` — structured review of hierarchy, usability, consistency and accessibility.

Optional targeted references: `/Users/APPLE/Downloads/Bob the Builder/.agents/skills/apple-design/SKILL.md` for restraint, and `/Users/APPLE/Downloads/Bob the Builder/.agents/skills/web-design-guidelines/SKILL.md` for interface checks. They are supporting lenses, not a mandate to mix multiple visual systems. Report missing files honestly. You may read them directly even if your skill picker does not list them.

User requirements override skill defaults. Avoid unnecessary interviews about decisions already made here. Ask only for a genuinely blocking missing choice. Show a concise design thesis and then implement your own coherent local version; the owner will compare it against the baseline.

## 3. Product and non-negotiable content

Hades is a curated discovery index for useful websites across learning, design, coding, music, video, productivity, careers and everyday life. The main job is browse → understand briefly → visit the original website. Keep it one page and fast to scan.

Preserve exactly:
- Heading: “Tools and Applications for the 21st century internet user.”
- Tagline: “Where the treasures of the world are buried.”
- Credit: “Curated by Sora · @Soralives”. The social platform URL is not supplied; leave it as text rather than inventing a link.

Use **Hades** as the working name. An authored digital atlas or collector's index is a promising direction, not a required theme. Do not turn the treasure metaphor into a game, fantasy illustration or huge decorative hero. The reference https://designengineer.tools/ is about compact categorized discovery, recognizable logos, short previews and direct links; retain that clarity while developing an original visual identity.

Improve typography, scale, contrast, spatial rhythm, icon consistency, section transitions, search affordance, hover/focus feedback and preview composition. A generic dark background plus serif heading is insufficient. Avoid a SaaS landing page, giant bento cards, gradients/glass everywhere, ornamental statistics, excessive animation and dead whitespace. Minimal means precise and intentional, not underdesigned. Use real resources throughout.

## 4. Fix the information architecture

The current expanded category shows one mixed list. Its subcategory chips do not solve the default browsing experience. Build **visible sequential sections with headings and counts**, so one family finishes before the next begins. Chips may filter or navigate sections, but do not make visitors filter to obtain basic organization.

Coding & Development should start with:
1. Editors & coding assistants — **Codex first, Claude Code second**, then other assistants/editors.
2. App & website builders — Bolt, Lovable, Replit, etc.
3. Components & libraries.
4. APIs & developer tools.
5. Agent skills.
6. Hosting & infrastructure.
7. Learning resources — Harvard CS50, Coursera and other lessons in a separate final section, never interspersed with products.

The owner's “Claude” is interpreted as Claude Code in this coding context. Verify official Codex/Claude Code destinations before adding them. Current general Claude is `h-5502a6be3b` at https://claude.ai/; preserve it. `opencodex` and `OpenClaude` are unrelated third-party records, not the requested official products. Maintain stable IDs and provenance; explain any new records/count changes. Ensure the Coding overview also starts with Codex and Claude, not just the expanded view.

Apply the same grouping principle to all ten subjects. Do not silo platform tags such as Mac away from their actual functions. Keep cross-listings, one resource record per ID, deduplicated totals and deduplicated global search. For All within a category, prefer the matching primary subcategory, otherwise the earliest matching extra placement by section order. Display each ID once; explicit subcategory views can still expose valid additional placements. Hide empty sections. Search should preserve understandable group context.

Keep **search, collection/category navigation and subcategory controls**. No cost or audience filters. Support deep links, refresh and useful browser Back/Forward behavior. Test name search, capability search, zero results, long names and real cross-listed resources.

## 5. Preserve the content pipeline

The seed has **719 unique resources: 680 Published, 32 Archived, 7 Draft**, with ten subjects and 54 subcategories. The 12 latest additions are already included: Recent Design, Mobbin MCP, MiniMax Code, Grok Bot, Canvas UI, Toolcraft, Thinking Orbs, Originkit, Dia, Maccess, Glaze and Mimestream. Collect UI was already there; Mistral is also present.

Never restore Turkish-market/language archived entries, expose drafts/editorial notes, or duplicate resources just to cross-list them. Do not substitute a small mock dataset. Do not invent best-for text or endorsements where evidence is absent.

Keep the current data schema and public allowlist compatible wherever practical. The native Google Sheet is the long-term editor, but the private reader is not connected yet. Your local build must run on the seed without Google or Vercel credentials. Preserve reader/cache contracts for eventual integration; ordinary content edits must not eventually require a rebuild. If per-category ranking needs an extra field, make it backward-compatible and document the migration rather than editing the shared sheet during this comparison.

Current Sheet (reference only): https://docs.google.com/spreadsheets/d/1HsH-l2vAqHQU0X3Ca6b4tcGVqJXV83AwxTpVDJ7UUkA/edit

## 6. Complete the interactions and verification

Resource logo/icon → compact preview with title, concise description, useful-for text when known, visible category/subcategory and obvious **Visit site**. Accessible keyboard activation, Escape dismissal and focus return. Direct external links must remain safe and available without JavaScript where supported. On narrow screens use a comfortable sheet/dialog with a reachable close control. Icons need an intentional fallback.

Fix the audit’s confirmed light-sidebar count contrast defect (opacity produces 3.25:1 / active 3.53:1). Check desktop (1440), tablet (768), mobile (390 and 320), light/dark if retained, 200% zoom, keyboard flow, focus visibility, reduced motion, long content and empty results. Verify contrast numerically; target comfortable 44px touch areas without claiming 44px is universally the WCAG AA minimum. Avoid announcing full result text on every keypress. Check no overflow or hidden controls and do not introduce a heavy frontend dependency merely for decorative motion.

Run relevant existing tests and extend only for meaningful changed behavior: section assignment/deduplication, Codex/Claude ranking and history. Run local HTTP checks against your candidate port. Inspect real browser screenshots; do not claim a visual pass from code alone. Separate measured results from untested assumptions.

## 7. Deliver

- A working independent version at **http://127.0.0.1:4318**, with exact start/stop instructions.
- A brief design rationale: what makes it distinctive for Hades and how it fixes the audit.
- Desktop and mobile screenshots or a viewable local preview.
- A compact comparison against the existing version, including tradeoffs.
- Test results and remaining issues, updated local backlog and Product clarity and discovery status.
- No deployment. Stop at local review. The owner decides what moves to GitHub and, later, Vercel.
