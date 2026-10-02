import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {publicCatalogue} from '../lib/catalogue.mjs';
import {CatalogueStore, bundledCatalogue} from '../lib/store.mjs';
import {requestRefresh} from '../lib/request-refresh.mjs';
import {createRuntime} from '../lib/runtime.mjs';
import {siteEnvironment} from '../lib/environment.mjs';
import {viewModel} from '../public/shared.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const seed = JSON.parse(await fs.readFile(new URL('../data/catalogue.json', import.meta.url), 'utf8'));
const fallbackFile = JSON.parse(await fs.readFile(new URL('../data/fallback-catalogue.json', import.meta.url), 'utf8'));
const quiet = {errors: [], error(message) { this.errors.push(message); }};
const logger = () => ({errors: [], error(message) { this.errors.push(message); }});
const edited = (description, id = seed.resources.find(r => r.status === 'Published').id) => {
  const copy = structuredClone(seed); copy.resources.find(r => r.id === id).description = description; return copy;
};
const descriptionOf = (store, id) => store.getPublic().resources.find(r => r.id === id)?.description;
const firstId = seed.resources.find(r => r.status === 'Published').id;

// Minimal request/response pair for the real handler, without opening a network port.
async function request(handler, url, {method = 'GET', host = '127.0.0.1:4318'} = {}) {
  const res = {status: 0, headers: {}, body: '',
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    writeHead(status, headers = {}) { this.status = status; for (const [k, v] of Object.entries(headers)) this.setHeader(k, v); },
    end(body = '') { this.body = String(body); }};
  await handler({url, method, headers: {host}}, res);
  return res;
}

test('the bundled fallback is the validated public catalogue of the current seed, and nothing more', () => {
  const {generated_at, ...data} = fallbackFile;
  assert.match(generated_at, /^\d{4}-\d{2}-\d{2}$/);
  assert.deepEqual(data, publicCatalogue(seed), 'run `npm run build:fallback` after editing data/catalogue.json');
  assert.equal(data.resources.length, 771);
  const allowed = ['id', 'name', 'url', 'description', 'primary_placement', 'best_for', 'logo_url', 'cost', 'audience', 'level', 'tags', 'sort_order', 'suggested_by'];
  for (const r of data.resources) for (const key of Object.keys(r)) assert.ok(allowed.includes(key), `unexpected public field ${key}`);
  const text = JSON.stringify(fallbackFile);
  for (const secret of ['editorial_notes', 'source_entries', 'alternate_urls', 'review_status', 'last_verified', '"status"']) assert.ok(!text.includes(secret), secret);
  const hidden = new Set(seed.resources.filter(r => r.status !== 'Published').map(r => r.id));
  assert.equal(hidden.size, 39, '32 Archived and 7 Draft');
  assert.ok(!data.resources.some(r => hidden.has(r.id)) && !data.placements.some(p => hidden.has(p.resource_id)));
  // Archived Turkish-market entries stay in editorial data only.
  assert.ok(seed.resources.some(r => r.name === 'Akakçe' && r.status === 'Archived'));
  assert.ok(!data.resources.some(r => new URL(r.url).hostname.endsWith('.tr')));
  // The release file is re-validated through the public allowlist at start-up.
  const tampered = structuredClone(fallbackFile); tampered.resources[0].url = 'javascript:alert(1)';
  assert.throws(() => bundledCatalogue(tampered), /Invalid website URL/);
  assert.deepEqual(viewModel(bundledCatalogue(fallbackFile), {category: 'coding'}).lines[0].sections[0].rows.slice(0, 2).map(r => r.name), ['Codex', 'Claude Code']);
});

test('start-up serves the bundled catalogue at once while the Sheet is still being read', async () => {
  let release;
  const store = new CatalogueStore({bundled: fallbackFile, readSource: () => new Promise(resolve => { release = resolve; }), log: quiet});
  const prepare = requestRefresh(store);
  const pending = [];
  prepare(p => pending.push(p));
  assert.equal(pending.length, 1, 'the first request starts a Sheet check');
  assert.equal(store.getPublic().resources.length, 771, 'without waiting for it');
  assert.equal(store.getPublic().meta.source, 'bundled');
  assert.equal(store.getPublic().meta.bundled_at, fallbackFile.generated_at);
  release(edited('From the Sheet')); assert.equal(await pending[0], true);
  assert.equal(descriptionOf(store, firstId), 'From the Sheet');
  const meta = store.getPublic().meta;
  assert.equal(meta.source, 'sheet'); assert.ok(Date.parse(meta.checked_at)); assert.ok(!('bundled_at' in meta));
});

test('failed or invalid refreshes keep the last valid catalogue; a restart falls back to the bundled one', async () => {
  let source = edited('Sheet version one'), fail = false;
  const log = logger();
  const readSource = async () => { if (fail) throw new Error('Request failed with status 403'); return source; };
  const store = new CatalogueStore({bundled: fallbackFile, readSource, log});
  assert.equal(await store.refresh(), true);
  const version = store.getPublic().meta.version;
  // Network or permission failure.
  fail = true;
  assert.equal(await store.refresh(), false);
  assert.equal(descriptionOf(store, firstId), 'Sheet version one');
  assert.equal(store.getPublic().meta.version, version);
  // Invalid published row: the whole update is rejected, not partially applied.
  fail = false; source = edited('Sheet version two'); source.resources.find(r => r.status === 'Published' && r.id !== firstId).url = 'javascript:alert(1)';
  assert.equal(await store.refresh(), false);
  assert.equal(descriptionOf(store, firstId), 'Sheet version one');
  // Missing header.
  const noHeaders = {...source, categories: []};
  source = noHeaders; assert.equal(await store.refresh(), false);
  assert.equal(descriptionOf(store, firstId), 'Sheet version one');
  assert.equal(log.errors.length, 3, 'each failure leaves a private diagnostic in the server log');
  assert.match(log.errors[0], /still serving the sheet catalogue. Request failed with status 403/);
  // Restart: memory is gone, the release's bundled catalogue is served until the Sheet can be read again.
  fail = true;
  const restarted = new CatalogueStore({bundled: fallbackFile, readSource, log});
  assert.equal(await restarted.refresh(), false);
  assert.equal(restarted.getPublic().meta.source, 'bundled');
  assert.deepEqual(restarted.getPublic().resources, bundledCatalogue(fallbackFile).resources);
});

test('an intentional empty publication stays empty and is not treated as an outage', async () => {
  let source = structuredClone(seed), fail = false;
  source.resources.forEach(r => { r.status = 'Archived'; });
  const store = new CatalogueStore({bundled: fallbackFile, readSource: async () => { if (fail) throw new Error('offline'); return source; }, log: quiet});
  assert.equal(await store.refresh(), true);
  assert.equal(store.getPublic().resources.length, 0);
  assert.equal(store.getPublic().placements.length, 0);
  fail = true; assert.equal(await store.refresh(), false);
  assert.equal(store.getPublic().resources.length, 0, 'a later failure keeps the valid empty collection, not the bundled one');
  const handler = (await import('../lib/http-handler.mjs')).createHandler({root, store, site: siteEnvironment({})});
  const page = await request(handler, '/');
  assert.equal(page.status, 200, 'the page renders an empty collection rather than an outage message');
  assert.ok(page.body.includes('0 websites') && !page.body.includes('temporarily unavailable'));
  assert.equal(JSON.parse((await request(handler, '/api/catalogue')).body).resources.length, 0);
});

test('refreshes coalesce, follow the six-hour default interval and retry a failing Sheet about once a minute', async () => {
  let clock = Date.UTC(2026, 8, 28), reads = 0, fail = false;
  const HOUR = 3600e3;
  const store = new CatalogueStore({bundled: fallbackFile, readSource: async () => { reads++; if (fail) throw new Error('quota'); return seed; }, now: () => clock, log: quiet});
  const prepare = requestRefresh(store, {now: () => clock});
  const pending = [];
  const tick = async () => { prepare(p => pending.push(p)); await Promise.all(pending.splice(0)); };
  await tick();
  assert.equal(reads, 1, 'a new instance reads the Sheet on its first request');
  await Promise.all([store.refresh(), store.refresh(), store.refresh()]);
  assert.equal(reads, 2, 'concurrent refreshes share one Sheet read');
  for (const step of [5 * 60e3, HOUR, 4 * HOUR]) { clock += step; await tick(); }
  assert.equal(reads, 2, 'no re-read within six hours of a successful one');
  clock = store.verifiedAt + 6 * HOUR; await tick(); assert.equal(reads, 3, 'checked again after six hours, on the next request');
  fail = true; clock += 6 * HOUR; await tick(); assert.equal(reads, 4);
  clock += 30e3; await tick(); assert.equal(reads, 4, 'no retry storm while failing');
  clock += 31e3; await tick(); assert.equal(reads, 5, 'a failed read is retried after about a minute, not six hours');
  fail = false; clock += 61e3; await tick(); assert.equal(reads, 6);
  clock += 2 * HOUR; await tick(); assert.equal(reads, 6, 'back on the six-hour interval after recovery');
  assert.equal(store.getPublic().resources.length, 771);
});

test('REFRESH_SECONDS: six hours by default, overridable, at least a minute', () => {
  assert.equal(siteEnvironment({}).refreshMs, 21600e3);
  assert.equal(siteEnvironment({REFRESH_SECONDS: '21600'}).refreshMs, 21600e3);
  assert.equal(siteEnvironment({REFRESH_SECONDS: '600'}).refreshMs, 600e3);
  assert.equal(siteEnvironment({REFRESH_SECONDS: '5'}).refreshMs, 60e3);
  assert.equal(siteEnvironment({REFRESH_SECONDS: 'soon'}).refreshMs, 21600e3);
});

test('no Google connection: the bundled library is served with a private diagnostic, and nothing is written to disk', async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'hades-root-'));
  try {
    await fs.mkdir(path.join(temp, 'data'));
    await fs.copyFile(path.join(root, 'data/fallback-catalogue.json'), path.join(temp, 'data/fallback-catalogue.json'));
    await fs.symlink(path.join(root, 'public'), path.join(temp, 'public'));
    const listing = async () => (await fs.readdir(temp, {recursive: true})).sort().join('\n');
    const before = await listing();
    const log = logger();
    const missing = await createRuntime({root: temp, env: {PUBLIC_ORIGIN: 'https://tools.soralives.xyz'}, log});
    assert.match(log.errors.join('\n'), /GOOGLE_SHEET_ID is not set/);
    const page = await request(missing.handler, '/', {host: 'tools.soralives.xyz'});
    assert.equal(page.status, 200);
    assert.ok(page.body.includes('Codex') && page.body.includes('Search 771 websites'));
    // A broken key surfaces as a failed refresh with a generic message that never quotes the key.
    const badKey = await createRuntime({root: temp, env: {GOOGLE_SHEET_ID: 'sheet-id', GOOGLE_SERVICE_ACCOUNT_JSON: '{"private_key": "SECRET-KEY-MATERIAL'}, log});
    assert.equal(await badKey.store.refresh(), false);
    assert.equal(badKey.store.status.error, 'GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON');
    assert.ok(!log.errors.join('\n').includes('SECRET-KEY-MATERIAL'));
    const health = await request(badKey.handler, '/healthz');
    assert.equal(health.status, 200);
    assert.deepEqual(Object.keys(JSON.parse(health.body)), ['available', 'source', 'lastSheetSuccess', 'sheetOk']);
    assert.ok(!health.body.includes('JSON') && !(await request(badKey.handler, '/api/catalogue')).body.includes('GOOGLE'), 'diagnostics stay private');
    assert.equal(await listing(), before, 'no catalogue, snapshot or status file was written');
  } finally { await fs.rm(temp, {recursive: true, force: true}); }
});

test('indexing follows explicit settings only, never whether the fallback is being served', async () => {
  const origin = 'https://tools.soralives.xyz', host = 'tools.soralives.xyz';
  const check = async (env, options = {}, reqHost = host) => {
    const app = await createRuntime({root, env, log: quiet, ...options});
    const page = await request(app.handler, '/', {host: reqHost});
    return {noindex: page.headers['x-robots-tag'] === 'noindex, nofollow', canonical: page.body.includes('<link rel="canonical"'), robots: (await request(app.handler, '/robots.txt', {host: reqHost})).body, body: page.body};
  };
  const fallbackProduction = await check({PUBLIC_ORIGIN: origin, VERCEL_ENV: 'production'}, {runtime: 'vercel'});
  assert.equal(fallbackProduction.noindex, false, 'the bundled fallback in production stays indexable');
  assert.ok(fallbackProduction.canonical && fallbackProduction.robots.includes('Allow: /'));
  for (const text of ['Local preview', 'Preview data', 'test data', 'Sample']) assert.ok(!fallbackProduction.body.includes(text), text);
  assert.equal((await check({PUBLIC_ORIGIN: origin, VERCEL_ENV: 'production', HADES_PRELAUNCH: 'true'}, {runtime: 'vercel'})).noindex, true, 'prelaunch');
  assert.equal((await check({PUBLIC_ORIGIN: origin, VERCEL_ENV: 'preview'}, {runtime: 'vercel'})).noindex, true, 'Vercel Preview');
  assert.equal((await check({PUBLIC_ORIGIN: origin, VERCEL_ENV: 'production'}, {runtime: 'vercel'}, 'hades-abc.vercel.app')).noindex, true, 'generated host');
  assert.equal((await check({})).noindex, true, 'no PUBLIC_ORIGIN');
  assert.ok(!(await check({})).robots.includes('Allow'));
});

test('owner analytics: the Vercel script only when enabled, on the canonical production host; no public figures', async () => {
  const env = {PUBLIC_ORIGIN: 'https://tools.soralives.xyz', VERCEL_ENV: 'production', HADES_WEB_ANALYTICS: 'true'};
  const script = '/_vercel/insights/script.js';
  const page = async (e, host = 'tools.soralives.xyz', runtime = 'vercel') => (await request((await createRuntime({root, env: e, runtime, log: quiet})).handler, '/', {host})).body;
  assert.ok((await page(env)).includes(script));
  assert.ok(!(await page({...env, HADES_WEB_ANALYTICS: ''})).includes(script), 'off unless enabled');
  assert.ok(!(await page({...env, VERCEL_ENV: 'preview'})).includes(script), 'never on Preview');
  assert.ok(!(await page({...env, HADES_PRELAUNCH: 'true'})).includes(script), 'never in prelaunch');
  assert.ok(!(await page(env, 'x.vercel.app')).includes(script), 'never on other hosts');
  assert.ok(!(await page(env, 'tools.soralives.xyz', 'server')).includes(script), 'never locally');
});

test('likes, Online now, visitor figures and their APIs, polling and dependencies are gone', async () => {
  const {handler} = await createRuntime({root, env: {}, log: quiet});
  for (const url of ['/api/engagement', '/api/presence', '/api/audience?window=24h', '/api/resources/h-f97516a261/like', '/engagement.mjs'])
    assert.equal((await request(handler, url)).status, 404, url);
  for (const method of ['POST', 'PUT', 'DELETE']) assert.equal((await request(handler, '/api/resources/h-f97516a261/like', {method})).status, 405);
  const page = (await request(handler, '/')).body;
  for (const text of ['data-like', 'Online now', 'visitor-counts', 'visitors-online', 'Likes and visitor counts', 'likes-note', 'data-engagement', 'data-analytics', 'engagement-live', 'engagement.mjs', 'like--large'])
    assert.ok(!page.includes(text), text);
  const client = (await Promise.all(['app.mjs', 'shared.mjs', 'theme.js', 'taxonomy-icons.mjs'].map(f => fs.readFile(path.join(root, 'public', f), 'utf8')))).join('\n');
  assert.ok(!/setInterval|sendBeacon|EventSource|WebSocket|engagement|\/api\/(presence|audience|resources)/.test(client), 'no polling or engagement requests');
  assert.deepEqual([...client.matchAll(/fetch\('([^']+)'/g)].map(m => m[1]), ['/api/catalogue'], 'the only request is the focus-time catalogue check');
  const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
  assert.deepEqual(Object.keys(pkg.dependencies).sort(), ['@vercel/functions', 'google-auth-library']);
  const lock = await fs.readFile(path.join(root, 'package-lock.json'), 'utf8');
  for (const name of ['@neondatabase/serverless', '@vercel/blob', '@electric-sql/pglite']) assert.ok(!lock.includes(`node_modules/${name}"`), name);
  const vercel = JSON.parse(await fs.readFile(path.join(root, 'vercel.json'), 'utf8'));
  assert.deepEqual(vercel.rewrites.map(r => r.source), ['/', '/api/catalogue', '/healthz', '/robots.txt', '/sitemap.xml']);
  assert.equal(vercel.functions['api/index.js'].includeFiles, '{data/fallback-catalogue.json,data/icon-hints.json}', 'the editorial seed is not bundled');
  await assert.rejects(fs.access(path.join(root, 'lib/engagement')));
  await assert.rejects(fs.access(path.join(root, 'lib/blob-persistence.mjs')));
});
