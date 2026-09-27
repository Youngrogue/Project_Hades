// Builds every Hades identity asset: Version 01 "Original Italic", selected by Sora on 25 Sep 2026.
// Run: node scripts/build-brand.mjs   (dev dependencies: opentype.js, sharp, @fontsource/gelasio)
//
// Geometry is identical to handoff/claude-enhancements/logo-v2/build-variants.mjs (01-original-italic):
//   Gelasio Italic 600 (OFL-1.1) for the icon h and every letter of the wordmark, outlined to paths;
//   glyphs placed at their advance widths with pair kerning; terminal period = circle, radius 0.065 x type size,
//   gap 0.045 x type size, sitting on the baseline. Icon: 64 grid, h. at size 46 centred optically by bounding box,
//   rx 15.25 tile #181C1F with a 1.5 #30373C border. Lockup: tile 64 + wordmark at size 50 starting at x 80.
// The script checks its icon against the supplied hades-icon.svg and stops if the outlines ever drift.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import opentype from 'opentype.js';
import sharp from 'sharp';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = p => path.join(root, p);
const bytes = await fs.readFile(out('node_modules/@fontsource/gelasio/files/gelasio-latin-600-italic.woff'));
const font = opentype.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));

export const BRAND = {tile: '#181C1F', border: '#30373C', h: '#A6D2F5', dark: {ink: '#EEF0EC', accent: '#A6D2F5'}, light: {ink: '#131619', accent: '#28658D'}};
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"><title>Hades</title>${body}</svg>`;

// Same routine as the supplied build: glyphs drawn directly (the font's contextual substitutions are not needed for
// this Latin text), retaining pair kerning.
function letters(text, size) {
  const p = new opentype.Path();
  const glyphs = [...text].map(c => font.charToGlyph(c));
  let pen = 0;
  glyphs.forEach((g, i) => {
    p.extend(g.getPath(pen, 0, size));
    pen += (g.advanceWidth + (glyphs[i + 1] ? font.getKerningValue(g, glyphs[i + 1]) : 0)) * size / font.unitsPerEm;
  });
  const box = p.getBoundingBox();
  const radius = size * .065;
  const dotX = box.x2 + size * .045 + radius;
  return {d: p.toPathData(3), box, radius, dotX, width: dotX + radius - box.x1};
}
const painted = (g, ink, accent, cls = {}) =>
  `<path${cls.word ? ` class="${cls.word}"` : ''} d="${g.d}"${ink ? ` fill="${ink}"` : ''}/><circle${cls.dot ? ` class="${cls.dot}"` : ''} cx="${g.dotX}" cy="${-g.radius}" r="${g.radius}"${accent ? ` fill="${accent}"` : ''}/>`;

const h = letters('h', 46);
const hx = (64 - h.width) / 2 - h.box.x1, hy = (64 - (h.box.y2 - h.box.y1)) / 2 - h.box.y1;
const mark = `<rect x=".75" y=".75" width="62.5" height="62.5" rx="15.25" fill="${BRAND.tile}" stroke="${BRAND.border}" stroke-width="1.5"/><g transform="translate(${hx} ${hy})">${painted(h, BRAND.h, BRAND.h)}</g>`;
const word = letters('hades', 50);
const wordX = 80 - word.box.x1, wordY = (64 - (word.box.y2 - word.box.y1)) / 2 - word.box.y1;
const lockupW = Math.ceil(80 + word.width + 2);
const wordW = Math.ceil(word.width + 4), wordH = Math.ceil(word.box.y2 - word.box.y1 + 4);
const wordBody = (ink, accent, cls) => `<g transform="translate(${2 - word.box.x1} ${2 - word.box.y1})">${painted(word, ink, accent, cls)}</g>`;

// Guard: the icon must match the supplied selected artwork exactly.
const suppliedPath = path.join(root, '../handoff/claude-enhancements/logo-v2/01-original-italic/hades-icon.svg');
try {
  const supplied = await fs.readFile(suppliedPath, 'utf8');
  if (supplied.trim() !== svg(64, 64, mark).trim()) throw new Error('Generated icon differs from logo-v2/01-original-italic/hades-icon.svg');
  console.log('Icon matches the supplied Version 01 artwork byte for byte.');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  console.log('Supplied handoff artwork not found; built from the documented geometry.');
}

await fs.mkdir(out('public/brand'), {recursive: true});
await fs.mkdir(out('public/icons'), {recursive: true});
for (const stale of ['hades-lockup-light.svg', 'hades-lockup-dark.svg', 'hades-lockup-mono.svg', 'hades-mark-small.svg']) await fs.rm(out(`public/brand/${stale}`), {force: true});
await fs.writeFile(out('public/brand/hades-mark.svg'), svg(64, 64, mark));
await fs.writeFile(out('public/favicon.svg'), svg(64, 64, mark));
for (const theme of ['dark', 'light']) {
  const c = BRAND[theme];
  await fs.writeFile(out(`public/brand/hades-logo-${theme}.svg`), svg(lockupW, 64, mark + `<g transform="translate(${wordX} ${wordY})">${painted(word, c.ink, c.accent)}</g>`));
  await fs.writeFile(out(`public/brand/hades-wordmark-${theme}.svg`), svg(wordW, wordH, wordBody(c.ink, c.accent)));
}

// Inline site components, themed by CSS: the wordmark letters use currentColor, its period var(--brand-accent);
// the icon keeps its fixed pale-blue h. on the dark tile in both themes.
const deco = 'aria-hidden="true" focusable="false"';
const headerLockup = `<svg class="brand-lockup" viewBox="0 0 ${lockupW} 64" width="${lockupW}" height="64" ${deco}>${mark}<g transform="translate(${wordX} ${wordY})">${painted(word, '', '', {word: 'brand-word', dot: 'brand-dot'})}</g></svg>`;
const wordmark = `<svg class="brand-wordmark" viewBox="0 0 ${wordW} ${wordH}" width="${wordW}" height="${wordH}" ${deco}>${wordBody('', '', {word: 'brand-word', dot: 'brand-dot'})}</svg>`;
// Baseline of the standalone wordmark as a fraction of its height, for aligning it with text.
const baselineRatio = (2 - word.box.y1) / wordH;
await fs.writeFile(out('lib/brand.mjs'),
  '// Generated by scripts/build-brand.mjs: Version 01 "Original Italic", Gelasio Italic 600 outlines (OFL-1.1).\n' +
  '// Do not hand-edit; change the script and rebuild. Artwork is decorative: accessible names come from the markup.\n' +
  `export const brandLockup = ${JSON.stringify(headerLockup)};\nexport const brandWordmark = ${JSON.stringify(wordmark)};\n` +
  `export const brandMetrics = ${JSON.stringify({lockupWidth: lockupW, lockupHeight: 64, wordWidth: wordW, wordHeight: wordH, baselineRatio: Math.round(baselineRatio * 1000) / 1000})};\n`);

// Rasters from the same vector. Favicons keep the rounded tile on transparency (browser tabs); touch/app icons are
// opaque full squares with the same h. proportion, because iOS fills transparent corners with black and rounds itself.
const raster = (markup, size) => sharp(Buffer.from(markup), {density: 288}).resize(size, size).png().toBuffer();
const icon = svg(64, 64, mark);
const full = svg(64, 64, `<rect width="64" height="64" fill="${BRAND.tile}"/><g transform="translate(${hx} ${hy})">${painted(h, BRAND.h, BRAND.h)}</g>`);
const favicons = {};
for (const s of [16, 32, 48]) { favicons[s] = await raster(icon, s); await fs.writeFile(out(`public/icons/favicon-${s}.png`), favicons[s]); }
const flat = async s => sharp(await raster(full, s)).flatten({background: BRAND.tile}).png().toBuffer();
await fs.writeFile(out('public/apple-touch-icon.png'), await flat(180));
await fs.writeFile(out('public/icons/icon-192.png'), await flat(192));
await fs.writeFile(out('public/icons/icon-512.png'), await flat(512));

// favicon.ico: a genuine ICO container (ICONDIR + one ICONDIRENTRY per size) holding PNG-compressed 16, 32, 48.
const sizes = [16, 32, 48];
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((s, i) => {
  const o = 6 + i * 16, data = favicons[s];
  header[o] = s; header[o + 1] = s; header.writeUInt16LE(1, o + 4); header.writeUInt16LE(32, o + 6);
  header.writeUInt32LE(data.length, o + 8); header.writeUInt32LE(offset, o + 12); offset += data.length;
});
await fs.writeFile(out('public/favicon.ico'), Buffer.concat([header, ...sizes.map(s => favicons[s])]));
await fs.copyFile(out('node_modules/@fontsource/gelasio/LICENSE'), out('public/brand/Gelasio-OFL.txt'));
await fs.writeFile(out('public/brand/LICENSE.txt'),
  'Hades identity (Version 01, Original Italic). All lettering outlined from Gelasio Italic 600\n' +
  '(Copyright The Gelasio Project Authors), SIL Open Font License 1.1: see Gelasio-OFL.txt.\n' +
  'Source: @fontsource/gelasio@5.3.0. Built by scripts/build-brand.mjs.\n');
console.log(`Brand built: lockup ${lockupW}x64, wordmark ${wordW}x${wordH}, favicon.ico ${sizes.join('/')}, touch 180, app 192/512.`);
