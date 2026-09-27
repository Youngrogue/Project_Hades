import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import {publicCatalogue} from '../lib/catalogue.mjs';
import {pageHtml} from '../lib/page.mjs';

const seed = JSON.parse(await fs.readFile(new URL('../data/catalogue.json', import.meta.url), 'utf8'));
const html = pageHtml(publicCatalogue(seed));
const asset = p => fs.readFile(new URL(`../public/${p}`, import.meta.url));
const APPROVED = [
  'Hades brings useful websites together for learning, creative work, everyday tasks and exploring the web.',
  'The name reflects the value that goes undiscovered: hidden talents, unused potential, and ideas left behind as regrets. Hades exists to bring some of those buried treasures into reach, connecting useful tools, knowledge and possibilities with the people who need them most.',
  'Browse a subject or search for what you need. Select a resource for a short description, then follow its link to the original website.',
];

test('About Hades uses the approved three paragraphs verbatim, first, with notes kept secondary', () => {
  const dialog = html.slice(html.indexOf('<dialog id="about"'), html.indexOf('</dialog>', html.indexOf('<dialog id="about"')));
  // Visible "About" + the logo wordmark "hades."; accessible name "About Hades" (the artwork is aria-hidden).
  const heading = dialog.slice(dialog.indexOf('<h2 id="about-title"'), dialog.indexOf('</h2>') + 5);
  assert.match(heading, /<span>About<\/span> <span class="sr-only">Hades<\/span><svg class="brand-wordmark about-wordmark"[^>]*aria-hidden="true"/);
  assert.equal(heading.replace(/<svg[\s\S]*<\/svg>/, '').replace(/<[^>]+>/g, '').trim(), 'About Hades');
  assert.ok(heading.includes('class="brand-dot"'), 'same wordmark component with the blue full stop');
  const story = dialog.slice(dialog.indexOf('<div class="about-story">'), dialog.indexOf('</div>', dialog.indexOf('<div class="about-story">')));
  assert.deepEqual([...story.matchAll(/<p>([^<]*)<\/p>/g)].map(m => m[1]), APPROVED);
  assert.ok(dialog.indexOf('about-story') < dialog.indexOf('about-notes'), 'curation notes follow the story');
  assert.ok(dialog.replace(/<[^>]+>/g, '').includes('Curated by Sora'));
  assert.equal((html.match(/aria-haspopup="dialog">About Hades<\/button>/g) || []).length, 2, 'header and footer entry points');
  assert.ok(html.includes('id="about-button"') && html.includes('id="footer-about"'), 'existing IDs and handlers kept');
  for (const obsolete of ['Likes', 'Online now', 'visitor', 'analytics', 'cookie']) assert.ok(!dialog.includes(obsolete), `no ${obsolete} explanation`);
});

test('the header lockup is one named home link with decorative vector artwork and no font request', () => {
  const link = html.slice(html.indexOf('<a href="/" class="brand"'), html.indexOf('</a>', html.indexOf('<a href="/" class="brand"')));
  assert.match(link, /aria-label="Hades home"/);
  assert.match(link, /<svg class="brand-lockup"[^>]*aria-hidden="true" focusable="false"/);
  assert.ok(!link.includes('<text') && !link.includes('<image') && !/tabindex/.test(link), 'outlined paths, no raster, one focus target');
  assert.ok(link.includes('fill="#A6D2F5"') && link.includes('class="brand-dot"'), 'pale-blue h and themed full stop');
  for (const name of ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png']) assert.match(html, new RegExp(`href="/${name.replace('.', '\\.')}\\?v=`), name);
});

test('icon exports are the specified formats and sizes', async () => {
  const ico = await asset('favicon.ico');
  assert.deepEqual([ico.readUInt16LE(0), ico.readUInt16LE(2), ico.readUInt16LE(4)], [0, 1, 3], 'ICONDIR with three images');
  const sizes = [0, 1, 2].map(i => {
    const o = 6 + i * 16, offset = ico.readUInt32LE(o + 12);
    assert.equal(ico.subarray(offset, offset + 8).toString('hex'), '89504e470d0a1a0a', 'PNG-compressed entry');
    return ico.readUInt8(o);
  });
  assert.deepEqual(sizes, [16, 32, 48]);
  for (const [file, size, alpha] of [['apple-touch-icon.png', 180, false], ['icons/icon-192.png', 192, false], ['icons/icon-512.png', 512, false], ['icons/favicon-16.png', 16, true]]) {
    const meta = await sharp(await asset(file)).metadata();
    assert.deepEqual([meta.format, meta.width, meta.height, meta.hasAlpha], ['png', size, size, alpha], file);
  }
  for (const file of ['favicon.svg', 'brand/hades-mark.svg', 'brand/hades-logo-light.svg', 'brand/hades-logo-dark.svg', 'brand/hades-wordmark-light.svg', 'brand/hades-wordmark-dark.svg']) {
    const svg = String(await asset(file));
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"[^>]* viewBox="0 0 /, file);
    assert.ok(!/<image|<text|href="http/.test(svg), `${file} is self-contained vector artwork`);
  }
});

test('curator credit: Sora with X and Instagram links, no visible @, everywhere the credit appears', () => {
  const credits = [...html.matchAll(/<p class="[^"]*credit-line">([\s\S]*?)<\/p>/g)].map(m => m[1]);
  assert.equal(credits.length, 3, 'masthead, footer and About');
  for (const credit of credits) {
    assert.equal(credit.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ''), 'Curated by SoraSoralivesrogueskye');
    assert.match(credit, /<a class="social" href="https:\/\/x\.com\/Soralives" target="_blank" rel="noopener noreferrer" aria-label="Sora on X: Soralives \(opens in a new tab\)"><svg[^>]*><use href="#i-x-logo">/);
    assert.match(credit, /<a class="social" href="https:\/\/www\.instagram\.com\/rogueskye\/" target="_blank" rel="noopener noreferrer" aria-label="Sora on Instagram: rogueskye \(opens in a new tab\)"><svg[^>]*><use href="#i-instagram">/);
  }
  assert.ok(!html.replace(/<[^>]+>/g, '').includes('@Soralives'), 'no visible @ handle');
  assert.ok(html.includes('<symbol id="i-x-logo"') && html.includes('<symbol id="i-instagram"'), 'real SVG logos in the sprite');
});

test('first visits are dark regardless of system theme; only an explicit choice switches to light', async () => {
  const css = String(await asset('styles.css')), theme = String(await asset('theme.js'));
  assert.ok(!css.includes('prefers-color-scheme') && !theme.includes('matchMedia'), 'the system theme is not consulted');
  assert.match(css, /:root:not\(\[data-theme=light\]\) \{\n  color-scheme: dark;/);
  assert.match(theme, /saved === 'light' \|\| saved === 'dark'/);
  assert.ok(html.indexOf('<script src="/theme.js">') < html.indexOf('<body'), 'applied in <head> before first paint');
  assert.ok(html.includes('<meta name="theme-color" content="#0F1113">'));
});

test('Version 01 identity: Gelasio italic h. icon and hades. wordmark, identical to the selected artwork', async () => {
  const supplied = new URL('../../handoff/claude-enhancements/logo-v2/01-original-italic/', import.meta.url);
  for (const [ours, theirs] of [['brand/hades-mark.svg', 'hades-icon.svg'], ['favicon.svg', 'hades-icon.svg'], ['brand/hades-logo-dark.svg', 'hades-logo-dark.svg'], ['brand/hades-logo-light.svg', 'hades-logo-light.svg'], ['brand/hades-wordmark-dark.svg', 'hades-wordmark-dark.svg'], ['brand/hades-wordmark-light.svg', 'hades-wordmark-light.svg']]) {
    let reference;
    try { reference = await fs.readFile(new URL(theirs, supplied), 'utf8'); } catch { continue; } // handoff folder absent outside this workspace
    assert.equal(String(await asset(ours)), reference, `${ours} matches ${theirs}`);
  }
  const {brandLockup, brandWordmark} = await import('../lib/brand.mjs');
  const icon = String(await asset('brand/hades-mark.svg'));
  assert.ok(brandLockup.includes(icon.slice(icon.indexOf('<rect'), icon.indexOf('</svg>'))), 'header uses the same h. icon');
  assert.equal((brandLockup.match(/<circle/g) || []).length, 2, 'blue period on both the icon h. and the wordmark');
  assert.ok(brandWordmark.includes('class="brand-word"') && brandWordmark.includes('class="brand-dot"'));
  assert.ok(String(await asset('brand/Gelasio-OFL.txt')).includes('SIL OPEN FONT LICENSE'), 'font licence shipped');
});

test('Suggest a tool: plain new-tab links to the configured Tally form in the toolbar and footer', async () => {
  const {SUGGEST_URL} = await import('../lib/site-config.mjs');
  assert.equal(SUGGEST_URL, 'https://tally.so/r/9qVrz1');
  const links = [...html.matchAll(/<a class="([^"]*)" href="https:\/\/tally\.so\/r\/9qVrz1" target="_blank" rel="noopener noreferrer">Suggest a tool[\s\S]*?<\/a>/g)];
  assert.deepEqual(links.map(m => m[1]), ['text-button suggest-link', 'text-link suggest-footer']);
  for (const [link] of links) assert.ok(link.includes('<span class="sr-only"> (opens a form in a new tab)</span>'));
  assert.ok(!/tally\.so\/widgets|embed\.js|<iframe/.test(html), 'no embed script, iframe or modal form');
  const page = String(await fs.readFile(new URL('../lib/page.mjs', import.meta.url)));
  assert.ok(!page.includes('tally.so'), 'the URL lives only in lib/site-config.mjs');
});
