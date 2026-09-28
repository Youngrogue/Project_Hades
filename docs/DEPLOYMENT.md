# Deployment: Vercel + Cloudflare

Superseded 27 September 2026. The current, step-by-step instructions are in `../handoff/claude-enhancements/SETUP-AND-RELEASE.md` (local → GitHub → Vercel Preview → reviewed production → Cloudflare DNS) and `ENVIRONMENT-SETUP.md` (the settings still used). Nothing has been deployed from this app.

What changed from the earlier notes on this page:
- **No Blob store is needed.** The site serves a bundled public catalogue at start-up and holds the latest valid Sheet read in memory (docs/OPERATIONS.md). The existing `hades-catalogue` Blob store and the `BLOB_READ_WRITE_TOKEN` / `ALLOW_SEED_PREVIEW` variables on the `hades-tools` Vercel project are unused; removing them is Sora's decision.
- **Production no longer refuses to start without the Sheet.** It serves the bundled catalogue and logs a private diagnostic. `HADES_PRELAUNCH=true` remains the explicit noindex bootstrap.
- **No Neon database or analytics token is needed.**

Unchanged:
- The Google reader is a service account with no project roles, shared on the Sheet as Viewer, with `spreadsheets.readonly` scope. Its JSON goes in the Sensitive `GOOGLE_SERVICE_ACCOUNT_JSON`.
- Cloudflare DNS: a CNAME `tools` → the exact target Vercel shows, DNS only (grey cloud).
- Keep the custom domain detached until a production build has been reviewed.

## Launch verification

- `/healthz` → `available: true`, and `source: "sheet"` with `sheetOk: true` once the Sheet is connected.
- Home, assets and `/api/catalogue` respond. There are no Draft or Archived resources or editorial columns in the HTML or API.
- A small Sheet edit appears without a code deployment. New instances show it at once; warm instances within six hours (`REFRESH_SECONDS=21600`). To test quickly, use a Preview with `REFRESH_SECONDS=60`, or redeploy. Restore the edit afterwards.
- A malformed Published row leaves the last valid catalogue in place (`sheetOk: false`). Correct it afterwards.
- Check desktop and mobile, search, previews, keyboard focus, direct links, and robots, canonical and sitemap at the custom domain.
- Confirm a correction/contact route before marking Product clarity and discovery verified.
