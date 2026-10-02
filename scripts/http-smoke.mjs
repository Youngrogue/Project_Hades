// HTTP checks against a running Claude candidate: node scripts/http-smoke.mjs [base-url]
// Read-only (GET/HEAD plus rejected write methods), so it is safe against a local server or a Vercel Preview.
import assert from 'node:assert/strict';
const base = (process.argv[2] || 'http://127.0.0.1:4318').replace(/\/$/, '');

const home = await fetch(base); assert.equal(home.status, 200);
assert.ok(home.headers.get('content-security-policy').includes("frame-ancestors 'none'"));
const html = await home.text();
for (const text of ['Tools and Applications for the 21st century internet user.', 'Where the treasures of the world are buried.', 'Khan Academy', 'type="application/json"', 'data-surprise', 'Find something unexpected', 'taxonomy-icon'])
  assert.ok(html.includes(text), `home page contains ${text}`);
const coding = await (await fetch(base + '/?category=coding')).text();
assert.ok(coding.indexOf('h-f97516a261') < coding.indexOf('h-bd01975189'), 'Codex before Claude Code');

const api = await fetch(base + '/api/catalogue'); assert.equal(api.status, 200);
const payload = await api.text(), data = JSON.parse(payload);
assert.equal(data.resources.length, 771);
for (const privateField of ['editorial_notes', 'source_entries', 'alternate_urls', 'Needs review']) assert.ok(!payload.includes(privateField));
for (const asset of ['/app.mjs', '/styles.css', '/shared.mjs', '/theme.js', '/taxonomy-icons.mjs', '/favicon.svg', '/fonts/overpass-latin-wght.woff2', '/fonts/overpass-mono-latin-wght.woff2'])
  assert.equal((await fetch(base + asset)).status, 200, asset);
for (const [asset, type] of [['/favicon.ico', 'image/x-icon'], ['/favicon.svg', 'image/svg+xml'], ['/apple-touch-icon.png', 'image/png'], ['/icons/icon-192.png', 'image/png'], ['/icons/icon-512.png', 'image/png'], ['/brand/hades-logo-light.svg', 'image/svg+xml']]) {
  const response = await fetch(base + asset);
  assert.equal(response.status, 200, asset);
  // Vercel's static hosting labels .ico as image/vnd.microsoft.icon; the local server uses image/x-icon. Both are valid.
  const accepted = type === 'image/x-icon' ? [type, 'image/vnd.microsoft.icon'] : [type];
  assert.ok(accepted.some(t => response.headers.get('content-type').startsWith(t)), `${asset} is ${type}`);
}
assert.ok(html.includes('aria-label="Hades home"') && html.includes('About Hades'), 'brand lockup and About Hades');
assert.ok(html.includes('href="https://tally.so/r/9qVrz1"'), 'Suggest a tool link');
// Mutable assets revalidate (ETag + no-cache) so a returning browser never mixes releases; fonts stay immutable.
for (const asset of ['/app.mjs', '/shared.mjs', '/taxonomy-icons.mjs', '/styles.css', '/favicon.ico']) {
  const first = await fetch(base + asset);
  // Local server: no-cache. Vercel static files (vercel.json): public, max-age=0, must-revalidate. Both force revalidation.
  assert.ok(['no-cache', 'public, max-age=0, must-revalidate'].includes(first.headers.get('cache-control')), `${asset} revalidates`);
  assert.equal((await fetch(base + asset, {headers: {'If-None-Match': first.headers.get('etag')}})).status, 304, asset);
}
assert.match((await fetch(base + '/fonts/overpass-latin-wght.woff2')).headers.get('cache-control'), /immutable/);
for (const privatePath of ['/.env', '/data/catalogue.json', '/data/fallback-catalogue.json', '/data/migration-provenance.json', '/server.mjs', '/lib/store.mjs', '/package.json'])
  assert.equal((await fetch(base + privatePath)).status, 404, privatePath);
// Writes are refused: 405 from the app locally; Vercel's router answers 404 before the function. Both mean no write.
const refused = status => [404, 405].includes(status);
assert.ok(refused((await fetch(base + '/api/catalogue', {method: 'POST', body: '{}'})).status), 'POST refused');
const health = await (await fetch(base + '/healthz')).json();
assert.equal(health.available, true);
assert.ok(['sheet', 'bundled'].includes(health.source));

// Removed features: no likes, presence or visitor-count endpoints, script or markup.
for (const removed of ['/api/engagement', '/api/presence', '/api/audience?window=24h', '/api/resources/h-f97516a261/like', '/engagement.mjs'])
  assert.equal((await fetch(base + removed)).status, 404, removed);
assert.ok(refused((await fetch(base + '/api/resources/h-f97516a261/like', {method: 'PUT', body: '{}'})).status), 'PUT refused');
for (const text of ['data-like', 'Online now', 'visitor-counts', 'data-engagement']) assert.ok(!html.includes(text), `no ${text}`);
console.log(`HTTP checks passed on ${base}: pages, ${data.resources.length} public resources (${health.source} catalogue), assets, private paths, methods, health, removed endpoints.`);
