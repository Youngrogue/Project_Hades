# Hades identity

**Version 01 — Original Italic**, selected by Sora on 25 September 2026 (`../handoff/claude-enhancements/logo-v2/01-original-italic`). It supersedes the earlier italic-h plus sans-serif wordmark. Version 02 (bold italic) is not used.

- Icon: a pale-blue italic **h.** (the period is part of the mark) in a dark rounded tile.
- Wordmark: lowercase italic **hades.** with a blue terminal period.
- All brand lettering: Gelasio Italic 600, outlined to paths (no font request). Site and body typography remain Overpass.

## Source and rebuild

`node scripts/build-brand.mjs` regenerates everything. It uses the same geometry as the supplied `logo-v2/build-variants.mjs`:
- glyphs are placed at their advance widths with pair kerning;
- the period is a circle of radius 0.065 × type size, placed a gap of 0.045 × type size after the letters;
- icon: h. at size 46 on a 64 grid, tile rx 15.25 (#181C1F), 1.5px border (#30373C);
- lockup: tile + wordmark at size 50, starting at x 80 (235×64).

The script refuses to build if its icon differs from the supplied `hades-icon.svg`. `tests/brand.test.mjs` checks that all public SVGs are byte-identical to the Version 01 files. Licence: `public/brand/Gelasio-OFL.txt` (SIL OFL 1.1) and `public/brand/LICENSE.txt`.

| Token | Value |
|---|---|
| Tile / border | #181C1F / #30373C |
| Icon h. | #A6D2F5 in both themes |
| Wordmark letters | theme ink: #EEF0EC on dark, #131619 on light (`currentColor`) |
| Wordmark period | #A6D2F5 on dark, #28658D on light (`--brand-accent`) |

## Files

| File | Use |
|---|---|
| `lib/brand.mjs` | Generated inline header lockup, standalone wordmark and metrics (themed by CSS) |
| `public/brand/hades-mark.svg`, `public/favicon.svg` | h. icon |
| `public/brand/hades-logo-{dark,light}.svg` | Combined logo for dark / light backgrounds |
| `public/brand/hades-wordmark-{dark,light}.svg` | Standalone wordmark |
| `public/favicon.ico` | Genuine ICO: 16, 32 and 48 PNG entries, from the same vector |
| `public/icons/favicon-{16,32,48}.png` | The ICO's images |
| `public/apple-touch-icon.png`, `public/icons/icon-{192,512}.png` | Opaque full squares with the same h. proportion. This differs deliberately from the supplied transparent-corner PNGs, because iOS fills transparent corners with black and rounds icons itself. |

`og:image` uses `icon-512.png` and is emitted only when `PUBLIC_ORIGIN` is set. There is no separate social card. Icon and asset links carry a content-derived `?v=` release, and the files revalidate (see `docs/OPERATIONS.md`), so returning visitors receive the new favicon and logo.

## Usage

- **Header:** combined icon + wordmark as one link named "Hades home"; the artwork is `aria-hidden`. 133×36 on desktop, 118×32 on phones. The full lockup fits at 320px.
- **Footer:** the standalone wordmark (decorative, with the name in visually hidden text).
- **About:** "About" in Overpass, then the wordmark sized to its ascenders and sitting on the same baseline. The heading's accessible name is "About Hades".
- Subject and section icons remain the navigation system; the brand mark is never used as a category icon.
