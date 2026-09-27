# Hades — useful internet collection

A one-page directory of useful websites, with subjects, sequential sections, search, short previews and direct links. The headline is **Tools and Applications for the 21st century internet user.** and the tagline **Where the treasures of the world are buried.** It is curated by **Sora**, credited with links to X (Soralives) and Instagram (rogueskye).

[Edit the Google Sheet](https://docs.google.com/spreadsheets/d/1HsH-l2vAqHQU0X3Ca6b4tcGVqJXV83AwxTpVDJ7UUkA/edit). The Sheet is older than the local catalogue; see `../handoff/claude-enhancements/sheet-update-2026-09-27/` before connecting it.

The local catalogue holds 760 records: **721 Published, 32 Archived (Turkish-market), 7 Draft**, in ten subjects and 56 sections. Cross-listings reuse the same resource ID, so a view never shows a duplicate.

## Run locally

Use Node.js 24.

```sh
npm ci
npm run dev
```

- Open http://127.0.0.1:4318 (Ctrl+C stops it). No credentials are needed: the site serves the bundled catalogue (`data/fallback-catalogue.json`).
- With `GOOGLE_SHEET_ID` and `GOOGLE_SERVICE_ACCOUNT_JSON` in `.env`, it reads the Sheet (read-only) exactly as production does.
- `npm test` covers publication, grouping, Sheet parsing, archives, escaping, brand, the bundled fallback, Sheet refresh and failure, and the removed features.
- `node scripts/http-smoke.mjs http://127.0.0.1:4318` checks a running server; it is read-only.
- `npm run build:fallback` rebuilds the bundled catalogue after editing `data/catalogue.json`.
- `npm run check:sheet` compares the live Sheet with it; it is read-only.

## Content workflow

Edit the Sheet (see its **How to edit** tab):

- **Add:** a row with a permanent unique ID, a valid category and subcategory, a name, URL and description, and Status Published.
- **Remove:** set the row to Archived; keep the row and its ID.
- **Cross-list:** add a row in Additional placements.

Once connected, the site checks the Sheet about every five minutes as visits arrive. No deployment is needed for content edits. An invalid edit or a Google outage leaves the last valid catalogue visible; a restart falls back to the bundled one. See [operations](docs/OPERATIONS.md).

Suggestions arrive through a Tally form and are reviewed there by hand. See [suggestions](docs/SUGGESTIONS.md).

## Hosting

The target is **tools.soralives.xyz** (confirm before DNS), with Vercel hosting and Cloudflare DNS.

- `api/index.js` serves the page on Vercel; `server.mjs` locally.
- Both use `lib/runtime.mjs`.
- `public/` holds the assets.

Setup and release: `../handoff/claude-enhancements/SETUP-AND-RELEASE.md` and `ENVIRONMENT-SETUP.md`. Also see the [kickoff status](KICKOFF.md) and [brand](docs/BRAND.md).

## Historical handoff (superseded)

Handoff kit for building a curated digital-tools directory with Claude Code.

**Start here:** `KICKOFF.md` (how to launch Claude Code + the first prompts).
**Project rules & decisions:** `CLAUDE.md` (auto-loaded by Claude Code every session).

## Contents
| Path | What it is |
|------|-----------|
| `CLAUDE.md` | Project constitution — what to build, stack, decisions, guardrails |
| `KICKOFF.md` | Step-by-step launch + scoped prompts for each build phase |
| `docs/design-brief.md` | The PRD: content model, site map, interconnection mechanic |
| `data/tool-directory.json` | The data source — 9 tools, 6 models, 8 companies (slugged, normalized) |
| `design/DESIGN.md` | "Precision Directory" design system spec (tokens, components) |
| `design/style-guide.html` | Coded, living style guide — open in a browser to view |
| `reference/` | The 3 Stitch mockups (visual targets, not source) |

## Stack
Astro + Tailwind, static-hosted. No backend in v1. See `CLAUDE.md` for rationale.
