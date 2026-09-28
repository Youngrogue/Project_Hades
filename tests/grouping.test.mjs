import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {publicCatalogue} from '../lib/catalogue.mjs';
import {pageHtml} from '../lib/page.mjs';
import {viewModel, featuredFor, categoryGroups, selectResources, sectionFor, historyMode, stateFromSearch, searchFromState, normalizeState} from '../public/shared.mjs';

const seed = JSON.parse(await fs.readFile(new URL('../data/catalogue.json', import.meta.url), 'utf8'));
const data = publicCatalogue(seed);
const ids = rows => rows.map(r => r.id);
const names = rows => rows.map(r => r.name);
const allRows = vm => vm.lines.flatMap(l => l.sections.flatMap(s => s.rows));
const CODEX = 'h-f97516a261', CLAUDE_CODE = 'h-bd01975189', CLAUDE = 'h-5502a6be3b';

test('Coding & Development runs its sections in the requested order, courses last', () => {
  const vm = viewModel(data, {category: 'coding'});
  assert.deepEqual(vm.lines[0].sections.map(s => s.sub.subcategory), [
    'Editors & coding assistants', 'App & website builders', 'Components & libraries', 'APIs & developer tools',
    'Agent skills', 'Hosting & infrastructure', 'Learning resources']);
  const learning = vm.lines[0].sections.at(-1).rows;
  assert.ok(names(learning).includes('CS50 at Harvard') && names(learning).includes('Hugging Face Learn'));
  // Coursera is edited as a Learning resource only; it stays out of Coding rather than being moved to fit a test.
  assert.ok(!names(allRows(vm)).includes('Coursera'));
  assert.ok(names(viewModel(data, {category: 'learning', subcategory: 'learning-3'}).lines[0].sections[0].rows).includes('Coursera'));
  // No course is interleaved with products: every row before the final section is homed outside Learning & Knowledge.
  const products = vm.lines[0].sections.slice(0, -1).flatMap(s => s.rows);
  assert.ok(products.every(r => !r.primary_placement.startsWith('learning-')));
});

test('official Codex then Claude Code lead Coding, in the expanded view, the overview and the server HTML', () => {
  const first = viewModel(data, {category: 'coding'}).lines[0].sections[0];
  assert.equal(first.sub.id, 'coding-2');
  assert.deepEqual(ids(first.rows.slice(0, 2)), [CODEX, CLAUDE_CODE]);
  assert.deepEqual(ids(featuredFor(data, 'coding').slice(0, 2)), [CODEX, CLAUDE_CODE]);
  const html = pageHtml(data, {state: {category: 'coding'}});
  assert.ok(html.indexOf('data-preview="h-f97516a261"') < html.indexOf('data-preview="h-bd01975189"'));
  assert.ok(html.indexOf('data-preview="h-bd01975189"') < html.indexOf('data-preview="h-d8864b187c"'));
  const overview = pageHtml(data);
  const codingBlock = overview.slice(overview.indexOf('id="line-coding"'));
  assert.ok(codingBlock.indexOf(CODEX) < codingBlock.indexOf(CLAUDE_CODE) && codingBlock.indexOf(CLAUDE_CODE) < codingBlock.indexOf('h-d8864b187c'));
  // The records are the official products, not the third-party look-alikes or the general assistant.
  const byId = new Map(data.resources.map(r => [r.id, r]));
  assert.equal(byId.get(CODEX).url, 'https://openai.com/codex/');
  assert.equal(byId.get(CLAUDE_CODE).url, 'https://claude.com/product/claude-code');
  assert.equal(byId.get(CLAUDE).url, 'https://claude.ai/');
  assert.equal(byId.get(CLAUDE).primary_placement, 'productivity-5');
  assert.ok(!['opencodex', 'OpenClaude'].includes(first.rows[0].name) && !['opencodex', 'OpenClaude'].includes(first.rows[1].name));
});

test('the Coding preference does not reorder other subjects', () => {
  assert.deepEqual(names(featuredFor(data, 'productivity').slice(5, 8)), ['Claude', 'ChatGPT', 'Gemini']);
  assert.deepEqual(names(viewModel(data, {category: 'learning', subcategory: 'learning-3'}).lines[0].sections[0].rows.slice(0, 3)),
    ['Khan Academy', 'MIT OpenCourseWare', 'OpenStax']);
  // CS50's rank belongs to its Learning home; in Coding's cross-listed Learning resources the list is alphabetical.
  const codingCourses = viewModel(data, {category: 'coding', subcategory: 'coding-7'}).lines[0].sections[0].rows;
  assert.deepEqual(names(codingCourses), [...names(codingCourses)].sort((a, b) => a.localeCompare(b, 'en', {sensitivity: 'base', numeric: true})));
});

test('every subject lists each resource once, in one visible section, with deduplicated totals', () => {
  for (const g of categoryGroups(data)) {
    const vm = viewModel(data, {category: g.id});
    const rows = ids(allRows(vm));
    assert.equal(new Set(rows).size, rows.length, `${g.id} repeats a resource`);
    assert.deepEqual(new Set(rows), new Set(ids(selectResources(data, {category: g.id}))), `${g.id} misses a resource`);
    assert.ok(vm.lines[0].sections.every(s => s.rows.length), `${g.id} shows an empty section`);
  }
  const everything = viewModel(data, {q: 'a'});
  assert.equal(new Set(ids(allRows(everything))).size, allRows(everything).length);
});

test('section assignment prefers the primary placement, then the earliest additional placement by section order', () => {
  const byName = name => data.resources.find(r => r.name === name);
  assert.equal(sectionFor(data, byName('MiniMax Code'), 'coding'), 'coding-2');   // primary coding-2, also coding-1
  assert.equal(sectionFor(data, byName('W3Schools'), 'coding'), 'coding-7');      // homed in Learning
  assert.equal(sectionFor(data, byName('Grok Bot'), 'coding'), 'coding-2');       // homed in Productivity
  // An explicit section view still exposes the cross-listing that All shows elsewhere.
  assert.ok(names(viewModel(data, {category: 'coding', subcategory: 'coding-1'}).lines[0].sections[0].rows).includes('MiniMax Code'));
  assert.ok(!names(viewModel(data, {category: 'coding'}).lines[0].sections[1].rows).includes('MiniMax Code'));
  // Two extra placements in one subject: the earlier section (by the subject's order) wins, not placement row order.
  const d = structuredClone(data);
  const pexels = d.resources.find(r => r.name === 'Pexels');
  d.placements.push({resource_id: pexels.id, placement_id: 'coding-5'}, {resource_id: pexels.id, placement_id: 'coding-3'});
  assert.equal(sectionFor(d, d.resources.find(r => r.id === pexels.id), 'coding'), 'coding-3');
});

test('an additional placement can carry its own rank without moving the resource elsewhere', () => {
  const d = structuredClone(data);
  const w3 = d.resources.find(r => r.name === 'W3Schools');
  d.placements.find(p => p.resource_id === w3.id && p.placement_id === 'coding-7').sort_order = 1;
  assert.equal(viewModel(d, {category: 'coding'}).lines[0].sections.at(-1).rows[0].name, 'W3Schools');
  assert.deepEqual(names(viewModel(d, {category: 'learning', subcategory: 'learning-4'}).lines[0].sections[0].rows),
    names(viewModel(data, {category: 'learning', subcategory: 'learning-4'}).lines[0].sections[0].rows));
});

test('search keeps group context: name matches first, capability matches grouped, zero results explicit', () => {
  const figma = viewModel(data, {q: 'figma'});
  assert.equal(figma.lines[0].group.id, 'design');
  assert.equal(allRows(figma)[0].name, 'Figma');
  const pdf = viewModel(data, {q: 'pdf'});
  assert.ok(pdf.lines.length > 1 && pdf.lines.every(l => l.sections.length));
  assert.equal(pdf.total, selectResources(data, {q: 'pdf'}).length);
  assert.equal(viewModel(data, {q: 'no-resource-exists-xyz'}).total, 0);
  assert.equal(viewModel(data, {category: 'audio', q: 'W3Schools'}).total, 0);
  // Hostnames are searchable on purpose: "childrens" finds childrenslibrary.org.
  assert.equal(allRows(viewModel(data, {q: 'international childrens'}))[0].name, "International Children's Digital Library");
  assert.equal(viewModel(data, {q: 'qqzv unlikely phrase'}).total, 0);
  assert.equal(allRows(viewModel(data, {q: "international children's digital library"}))[0].name, "International Children's Digital Library");
  assert.equal(viewModel(data, {q: 'CAFÉ'}).total, viewModel(data, {q: 'cafe'}).total);
  assert.equal(viewModel(data, {q: 'Pexels'}).total, 1);
  assert.equal(viewModel(data, {q: 'mac'}).lines.some(l => l.group.id === 'utilities'), true);
});

test('URL state round-trips and history pushes deliberate navigation but replaces search refinement', () => {
  for (const state of [{category: 'coding', subcategory: 'coding-7', q: ''}, {category: '', subcategory: '', q: 'pdf tools'}, {category: 'design', subcategory: '', q: 'icons & fonts'}])
    assert.deepEqual(stateFromSearch(searchFromState(state).replace(/^\//, '')), state);
  assert.equal(searchFromState({category: '', subcategory: '', q: ''}), '/');
  const base = {category: '', subcategory: '', q: ''};
  assert.equal(historyMode(base, {...base, category: 'coding'}), 'push');
  assert.equal(historyMode({...base, category: 'coding'}, {...base, category: 'coding', subcategory: 'coding-1'}), 'push');
  assert.equal(historyMode(base, {...base, q: 'p'}), 'push');
  assert.equal(historyMode({...base, q: 'p'}, {...base, q: 'pd'}), 'replace');
  assert.equal(historyMode({...base, q: 'pdf'}, {...base, q: 'pdf'}), 'none');
  assert.deepEqual(normalizeState(data, {category: 'coding', subcategory: 'design-1'}), {category: 'coding', subcategory: '', q: ''});
  assert.deepEqual(normalizeState(data, {category: 'nope', q: 'x'}), {category: '', subcategory: '', q: 'x'});
});

test('deep links render their own view on the server, escaped, without JavaScript', () => {
  const station = pageHtml(data, {state: {category: 'coding', subcategory: 'coding-7'}});
  assert.ok(station.includes('<h2 class="view-title" id="view-title" tabindex="-1">Learning resources</h2>'));
  assert.ok(station.includes('aria-current="page"'));
  const search = pageHtml(data, {state: {q: '"><script>alert(1)</script>'}});
  assert.ok(!search.includes('<script>alert(1)</script>'));
  assert.ok(search.includes('value="&quot;&gt;&lt;script&gt;'));
  assert.ok(pageHtml(data, {state: {q: 'pdf'}}).includes('Results for “pdf”'));
});

test('resource rows carry no subject-letter badges; the popup keeps full cross-listing labels and icons stay', async () => {
  const {rowHtml, resultsHtml, previewHtml, viewModel: vmOf} = await import('../public/shared.mjs');
  const counts = new Map();
  for (const p of data.placements) counts.set(p.resource_id, (counts.get(p.resource_id) || 0) + 1);
  const r = data.resources.find(x => counts.has(x.id));
  const also = data.placements.filter(p => p.resource_id === r.id).map(p => data.categories.find(c => c.id === p.placement_id));
  const home = data.categories.find(c => c.id === r.primary_placement);
  for (const html of [rowHtml(data, r), rowHtml(data, r, {compact: true}), resultsHtml(data, vmOf(data, {})), resultsHtml(data, vmOf(data, {category: home.category_id}))]) {
    assert.ok(!/row-also|bullet--xs/.test(html), 'no letter badges');
    assert.ok(!html.includes('Also in'), 'no cross-listing text in rows');
  }
  assert.match(resultsHtml(data, vmOf(data, {category: home.category_id})), /taxonomy-icon/, 'subject and section icons remain');
  const popup = previewHtml(data, r);
  assert.ok(popup.includes('<dt>Also in</dt>'));
  for (const c of [home, ...also]) assert.ok(popup.includes(`<span class="trail-subject">${c.category.replaceAll('&', '&amp;')}</span>`) && popup.includes(c.subcategory.replaceAll('&', '&amp;')), c.id);
});

test('discovery: Everything draws from every Published resource, independent of search and browsing filters', async () => {
  const {discoveryPool} = await import('../public/shared.mjs');
  const everything = discoveryPool(data, '');
  assert.equal(everything.length, data.resources.length);
  assert.equal(new Set(everything.map(r => r.id)).size, everything.length);
  // The pool takes no browsing state at all; a filtered view is much smaller.
  assert.ok(selectResources(data, {category: 'coding', q: 'codex'}).length < everything.length);
  // The control sits outside the search form, so changing it cannot submit or alter the collection filters.
  const html = pageHtml(data, {state: {category: 'coding', q: 'agent'}});
  const discover = html.slice(html.indexOf('<div class="discover"'), html.indexOf('</div>', html.indexOf('<div class="discover"')));
  assert.ok(html.indexOf('<div class="discover"') < html.indexOf('<form class="search"'), 'above the search bar');
  assert.ok(!html.slice(html.indexOf('<form class="search"'), html.indexOf('</form>')).includes('discover-category'));
  assert.equal((html.match(/data-surprise/g) || []).length, 1, 'one control: no rail or toolbar copies');
  assert.ok(!html.slice(html.indexOf('<nav class="rail"'), html.indexOf('</nav>', html.indexOf('<nav class="rail"'))).includes('unexpected'));
  assert.match(discover, /<label class="sr-only" for="discover-category">Discovery category<\/label>/);
  assert.match(discover, /<option value="">Everything<\/option>/);
  assert.deepEqual([...discover.matchAll(/<option value="([^"]+)">/g)].map(m => m[1]), categoryGroups(data).map(g => g.id));
  assert.ok(discover.includes('Find something unexpected') && discover.includes('#i-shuffle'));
  // Every breakpoint: the only rule that hides the control is the no-JavaScript one, and no media query moves or hides it.
  const css = (await fs.readFile(new URL('../public/styles.css', import.meta.url), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '');
  const hiding = [...css.matchAll(/([^{}]*\.discover[^{}]*)\{[^}]*display:\s*none/g)].map(m => m[1].trim());
  assert.deepEqual(hiding, ['html:not(.js) .discover']);
  assert.ok(!/\.discover(?![-\w])[^{}]*\{[^}]*(?:[;{\s]order\s*:|position\s*:\s*(?:absolute|fixed))/.test(css), 'not reordered or repositioned');
});

test('discovery by category includes cross-listed tools once, and picks avoid repeats and handle tiny pools', async () => {
  const {discoveryPool, pickDiscovery} = await import('../public/shared.mjs');
  const byCat = id => data.categories.find(c => c.id === id).category_id;
  // Design Engineer Tools lives in Design and is cross-listed in Internet & Digital Utilities.
  assert.ok(discoveryPool(data, 'utilities').some(r => r.id === 'h-e27f7d4b1e'));
  assert.ok(discoveryPool(data, 'design').some(r => r.id === 'h-e27f7d4b1e'));
  for (const g of categoryGroups(data)) {
    const pool = discoveryPool(data, g.id);
    assert.equal(new Set(pool.map(r => r.id)).size, pool.length, `${g.id}: each resource once`);
    const expected = data.resources.filter(r => byCat(r.primary_placement) === g.id || data.placements.some(p => p.resource_id === r.id && byCat(p.placement_id) === g.id));
    assert.equal(pool.length, expected.length, g.id);
  }
  // A resource with two placements in the same subject is still one entry.
  const doubled = structuredClone(data), r = doubled.resources.find(x => x.primary_placement === 'coding-2');
  doubled.placements.push({resource_id: r.id, placement_id: 'coding-4'});
  assert.equal(discoveryPool(doubled, 'coding').filter(x => x.id === r.id).length, 1);
  // Never the previous pick when there is an alternative; uniform choice over the rest.
  const pool = discoveryPool(data, 'careers');
  for (let i = 0; i < 50; i++) assert.notEqual(pickDiscovery(pool, pool[0].id).id, pool[0].id);
  assert.equal(pickDiscovery(pool, '', () => 0).id, pool[0].id);
  assert.equal(pickDiscovery(pool, '', () => 0.999999).id, pool.at(-1).id);
  // Single-resource and empty categories.
  assert.equal(pickDiscovery([pool[0]], pool[0].id).id, pool[0].id, 'a single resource can repeat');
  assert.equal(pickDiscovery([], ''), null);
  const empty = structuredClone(data);
  empty.categories.push({id: 'new-1', category_id: 'new', category: 'New subject', subcategory: 'Soon', category_order: 11, sort_order: 1});
  assert.deepEqual(discoveryPool(empty, 'new'), []);
  assert.ok(pageHtml(empty).includes('<option value="new">New subject</option>'));
});

test('owner additions of 28 September: verified, deduplicated and placed in existing categories', () => {
  const expected = {
    'h-e27f7d4b1e': ['Design Engineer Tools', 'https://designengineer.tools/', 'design-1', ['utilities-5']],
    'h-4fd07c04a0': ['Early.tools', 'https://www.early.tools/', 'utilities-5', []],
    'h-b26048c599': ['Lumosity', 'https://www.lumosity.com/en/', 'explore-1', []],
    'h-599401c077': ['Duolingo', 'https://www.duolingo.com/', 'learning-3', []],
    'h-c985249d6a': ['Mastra', 'https://mastra.ai/', 'coding-4', []],
  };
  for (const [id, [name, url, home, extra]] of Object.entries(expected)) {
    const r = data.resources.find(x => x.id === id);
    assert.ok(r, name);
    assert.deepEqual([r.name, r.url, r.primary_placement], [name, url, home]);
    assert.deepEqual(data.placements.filter(p => p.resource_id === id).map(p => p.placement_id), extra);
    assert.ok(r.description && r.best_for && !('suggested_by' in r), name);
    const host = new URL(url).hostname.replace(/^www\./, '');
    assert.equal(data.resources.filter(x => new URL(x.url).hostname.replace(/^www\./, '') === host).length, 1, `${host} once`);
    assert.equal(seed.resources.filter(x => x.name.toLowerCase() === name.toLowerCase()).length, 1, `${name} once`);
  }
});
