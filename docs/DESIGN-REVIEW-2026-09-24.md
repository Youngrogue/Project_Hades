# Hades design review — 24 September 2026

Method: dual-agent (A: `/root/design_assessment` · B: `/root/technical_assessment`). A assessed design independently before B's detector findings entered the synthesis. Reviewed the local 680-resource baseline; no design or catalogue changes made during this audit.

## Verdict

The site is coherent and functional but looks interchangeable with another directory. The dark surface, blue accent, Georgia heading and system-font rows do not express much of Hades or Sora's curation. The bigger problem is structural: the category view exposes 142 Coding resources as one mixed reading sequence. Minimalism is not the problem; weak hierarchy, small type and unexpressed editorial decisions are.

The reference [Design Engineer Tools](https://designengineer.tools/) keeps subjects such as Inspiration, AI Code and Components visibly separate. Hades should preserve that clarity at its larger scale. Borrow the compact browse/preview/visit pattern, not the exact branding or a promotional landing-page layout.

## Design health — qualitative, not a compliance certificate

| Nielsen heuristic | Score /4 | Main evidence |
|---|---:|---|
| System status | 3 | Selected category, pressed chips and live count are visible |
| Real-world match | 2 | Coding products, courses and infrastructure interleave |
| User control | 2 | Reset and dialogs work; category Back history is replaced |
| Consistency | 3 | Coherent rows; external-arrow cue opens preview instead |
| Error prevention | 3 | Limited inputs, normalized filters, visible destinations |
| Recognition over recall | 2 | Logos help, but section boundaries disappear |
| Flexibility and efficiency | 3 | Search, keyboard shortcut and modifier-click; slow manual scanning |
| Aesthetic and minimalist design | 2 | Clean but tiny type, weak identity and uniform result hierarchy |
| Error recovery | 3 | Helpful empty state; source failure behavior not exercised here |
| Help and documentation | 2 | About is clear; no configured correction route and sparse use-case copy |
| **Total** | **25/40** | **Functional foundation; substantial hierarchy and editorial work remains** |

## Priorities for the alternative version

### P1 — Group before sorting

Observed Coding sequence: Cursor, Bolt, CS50 at Harvard, Replit, Lovable, Rork, The Odin Project. `public/app.mjs:35` emits one list; `public/shared.mjs:20` sorts by global rank then name. The subcategory chips are available, but basic organization should not require an extra filtering step.

Render semantic sections with visible names, counts, deliberate spacing and stable order. For Coding: assistants/editors, builders, components, APIs/developer tools, agent skills, hosting, then learning resources. Keep courses in their own final section and their primary Learning home. Deduplicate category All by ID; preserve extra placements in explicit subcategory views. Apply the principle across subjects and search results.

Place official Codex first and Claude Code second in Coding's first section and overview. Official Codex is currently absent; general Claude exists only under Productivity. Verify and add the actual coding product records. Do not substitute `opencodex` or `OpenClaude` or conflate the general Claude assistant with Claude Code. Category-aware ranking must not disturb unrelated subjects.

### P1 — Repair light-theme count contrast

`public/styles.css:6` applies `.75` opacity to 9px sidebar counts. Computed contrast was **3.25:1** normally and **3.53:1** when active, below the normal-text 4.5:1 requirement (WCAG 1.4.3). Remove the opacity reduction or use an explicit count token that passes all relevant states. Base foreground/muted tokens passed sampled checks; the composited opacity is the defect.

### P2 — Give the directory a deliberate identity and readable hierarchy

Current navigation, resource names and descriptions commonly use 11px type on desktop; eyebrows and counts run 8–10px. Increase reading sizes and distinguish subject headings, subheadings, tool names and descriptions. Keep density through layout, not miniature text. Let one justified visual idea carry the Hades identity through typography, index markers or details. Avoid compensating with heavy animation, bento cards or decorative gradients.

Curation is mostly asserted rather than visible: **667/680 Published entries have no `best_for` copy**. Prioritize verified, concise use cases for featured tools rather than fabricating notes for all entries. A label such as “Sora's starting points” is only appropriate if the owner actually selects those resources; do not imply new endorsements.

### P2 — Make navigation and preview cues predictable

`public/app.mjs:8` calls `history.replaceState` for all changes; category transitions therefore do not create Back history. Push deliberate category navigation and replace typing updates. Preserve focus, scroll and filter state on Back/Forward.

The row's external arrow suggests immediate departure, while normal click opens a preview. Make the preview affordance recognizable; reserve the external cue for Visit site. Preserve modifier-click direct navigation and no-JavaScript direct links.

### P2 — Improve mobile control comfort and orientation

Sampled mobile controls: subcategory chips 31.5px high, category controls 38.5px, close 32×32px, theme 35×35px, clear-filter 15px high. Aim for comfortable 44px targets through layout. These are usability findings, **not automatically WCAG AA violations**; target-size rules and spacing exceptions differ.

On the sampled 390px Coding view, the horizontal category strip showed Everything/Learning/part of Design while selected Coding was offscreen. Reveal the active category and maintain recognizable section context in long lists. Preserve the working bottom sheet and its 46.5px Visit control.

### Profile before optimizing

Every search input rebuilds filtered markup. This is a profiling candidate, not a demonstrated performance failure: no jank or Core Web Vitals measurements were recorded. Keep the lean implementation; index/caching changes should follow measurement, not speculative complexity.

## Technical audit

| Dimension | Score /4 | Evidence / limit |
|---|---:|---|
| Accessibility | 2 | Good labels/focus/dialog path; confirmed light-count contrast defect |
| Performance | 3 | Lean source and lazy icons; repeated search rendering not profiled |
| Responsive behavior | 3 | No sampled overflow; good mobile sheet, small controls |
| Theming | 3 | Tokens and theme switch work; opacity introduces contrast failure |
| Implementation integrity | 2 | Functional foundations but expanded rendering contradicts category model |
| **Total** | **13/20** | **Bounded audit, not certification** |

Impeccable detector: **0 findings**, exit 0, explicit `lib/page.mjs` and `public/app.mjs` scan. Raw result `[]`. This regex scan does not establish rendered quality, accessibility or compliance. CSS and shared generated rows were reviewed manually. No detector false positives were returned. Browser overlay injection was unavailable because browser evaluation is read-only; no overlay was injected or claimed.

Independent browser evidence: desktop **1334×661**, mobile **390×844**; homepage, Coding and a Cursor preview. No page-wide horizontal overflow at those sizes. Enter opened the preview, the labeled Close control received visible focus, Escape dismissed it and focus returned to the opener. Sampled console showed no warnings or errors. Both audit tabs were closed; the local site remains running for the owner.

Sampled base contrast: dark foreground16.25:1, dark muted7.40:1 (surface6.89:1); light foreground14.08:1, light muted5.46:1 (white5.80:1). This was not an exhaustive contrast-state audit.

## Keep these strengths

- Simple browse → preview → visit workflow and clear destination.
- Search, ten subjects and subcategories without unnecessary price/audience filters.
- Stable resource IDs, cross-listing and validation/public-field boundaries.
- Semantic landmarks, skip link, labeled input, selected states and status count.
- Native dialogs, sampled keyboard/focus restoration, reduced-motion path.
- Fixed-size lazy icons with fallback, direct-link HTML and mobile bottom sheet.

## Cognitive load, emotional journey and personas

The overview offers 11 category choices and Coding offers eight chips. Many choices are expected in an index; an arbitrary four-option cap would be inappropriate. What makes this difficult is the absence of sections in 142 results. Arrival is calm, expansion becomes repetitive, and previews often repeat rather than deepen the information.

A first-time explorer cannot immediately tell why a course sits between products. A returning developer loses category history on Back. A low-vision reader faces small central text. A mobile visitor can lose sight of the current category. Address these journeys before adding visual effects.

## Unverified areas

Screen readers, 200% zoom/text scaling, all interactive contrast states, full tab/trap cycles, reduced-motion browser emulation, throttled networks/Core Web Vitals, all long-content cases and source-outage recovery were not tested in this design audit. Prior automated application tests are useful but do not certify these behaviors. Candidate acceptance includes these checks.

## Resources and next action

`CLAUDE-REDESIGN-PROMPT.md` contains exact source and skill paths. `docs/REDESIGN-BACKLOG.md` records requested changes as open. Read Impeccable first; use frontend design for authorship, Taste for contextual anti-template judgment, mobile UI for usability, and the product-clarity skill for factual consistency. Do not stack incompatible stylistic rules from every installed skill.

Recommended implementation sequence in the candidate: `/impeccable shape` for grouping and orientation; `typeset`/`layout` for hierarchy; `clarify` for verified preview copy; `harden`/`adapt` for navigation and mobile; bounded `audit` then `polish`. Preserve the original version for comparison.

Product clarity and discovery remains **in progress** in KICKOFF.md. Sora is the curator; ongoing editorial responsibility, correction route and final domain are unresolved. Do not invent social URLs or publish while resolving them.

Questions skipped: the owner explicitly asked to track these changes and prepare Claude's build brief for now, and already set the priorities and local-review workflow. No further design decision blocks that handoff. First critique for this target; no score trend yet.
