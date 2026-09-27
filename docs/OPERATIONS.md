# Catalogue source, fallback, caching and analytics

Updated 27 September 2026. The behaviour below is covered by `tests/store.test.mjs` and checked locally. It has not been verified on Vercel or against the live Sheet, because nothing has been deployed or connected.

## Where the catalogue comes from

The Google Sheet is the live editor. The site keeps no copy anywhere except in memory.

| Situation | What visitors see |
|---|---|
| Start-up (new server or new Vercel instance) | Immediately: the **bundled catalogue** shipped with the release (`data/fallback-catalogue.json`). The Sheet is read in the background. |
| Valid Sheet read | That catalogue, held in memory by that instance. This includes an intentionally empty publication, which is not treated as an outage. |
| Failed or invalid read (network, quota, lost sharing, missing headers, an invalid Published row) | The most recent valid catalogue in that instance: the last good Sheet read, or the bundled one. A private diagnostic goes to the server log (Vercel → Logs); `/healthz` shows only `sheetOk:false`. |
| Restart while the Sheet can't be read | The bundled catalogue from the running release, until the Sheet can be read again. |
| No `GOOGLE_SHEET_ID` or key | The bundled catalogue, with a log message. The site stays fully usable. |

**Refresh timing:**

- Each instance checks the Sheet when its last successful read is older than five minutes (`REFRESH_SECONDS`), started by an incoming request.
- The page never waits for the check: the check runs after the response, through `waitUntil` on Vercel.
- Concurrent checks within an instance share one read.
- A failing Sheet is retried at most about once a minute.
- There is no cron and no shared coordination between instances, so two instances can briefly serve different versions for up to five minutes after an edit.

Nothing is written to disk or to any storage service. The Blob adapter, its write budget and its conflict handling were removed on 27 September 2026 with that code path.

### The bundled catalogue

- It is built from `data/catalogue.json` by `npm run build:fallback`.
- It contains only what the page already shows: Published rows through the public allowlist. It has no drafts, archived rows, editorial notes or provenance.
- It is re-validated at start-up; a test fails if it is out of step with the seed.
- It changes **only with a release**. Everyday Sheet edits need no deployment. After a restart during a Google outage, the site may briefly show the older release catalogue.
- Keep it recent: before a release, run `npm run check:sheet` (read-only). It compares resources by ID, subcategories by ID, and additional placements by resource and subcategory including their Sort order, regardless of row order. Reconcile `data/catalogue.json` with the Sheet, then rebuild the fallback.

### Public metadata

`/api/catalogue` includes `meta.source` (`sheet` or `bundled`) and a content `version`. It also includes one timestamp: `checked_at` (when the Sheet was last read successfully) or `bundled_at` (the date the fallback was built). Neither timestamp is presented as a publication date.

A browser returning to the tab offers "The collection has been updated" only for a newer **Sheet** version. A restarted instance serving the bundled catalogue never prompts a step backwards.

Indexing depends only on:

- `PUBLIC_ORIGIN`;
- `HADES_PRELAUNCH`;
- Vercel's Production environment;
- the request host matching the canonical host.

It never depends on whether the fallback is being served. The fallback in production is indexable and shows no preview label.

## Coherent releases (scripts, styles, brand assets)

- **Revalidation:** scripts, styles, SVG, PNG and ICO files are served with `Cache-Control: no-cache` and a content-hash ETag. Browsers may keep them, but must revalidate on each load (a cheap 304 when unchanged). That covers the whole module graph, including modules imported by relative URL.
- **Release query string:** the HTML appends a content-derived release (`?v=…`) to `styles.css`, `theme.js`, `app.mjs` and the icon links, so favicon caches refresh too.
- **Fonts:** they keep `max-age=31536000, immutable` and never change in place.
- **Vercel:** `public/` is served statically. `vercel.json` sets `public, max-age=0, must-revalidate` for `.mjs/.js/.css/.svg/.png/.ico/.txt` and the immutable policy for `/fonts/`. **Verify these headers on the first Preview.**

## Analytics

The site shows no visitor figures and has no analytics API.

Optional Vercel Web Analytics can feed Sora's private Vercel dashboard. Its script is emitted only when all of these hold:

- `HADES_WEB_ANALYTICS=true`;
- Vercel Production;
- the request host is the canonical host;
- not prelaunch.

No token is needed.

## Removed on 27 September 2026

- Likes and Online now, including their APIs, identity cookie, rate limits and presence heartbeats.
- SQLite and Neon/Postgres storage, and the public 24-hour and 30-day visitor figures with their analytics-reading adapter.
- The Blob snapshot, and the dependencies `@neondatabase/serverless`, `@vercel/blob` and `@electric-sql/pglite`.
- The environment settings listed in `.env.example` as no longer used.
