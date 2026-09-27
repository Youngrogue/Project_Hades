// Shared by the server (initial HTML) and the browser (client navigation). No DOM access here.
import {categoryIcon, subcategoryIcon, hasSubcategoryIcon, hasCategoryIcon} from './taxonomy-icons.mjs';
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const e = escapeHtml;

// Each subject is a "line" with a one-letter bullet. Known subjects get a fixed letter and a colour token in
// styles.css ([data-line=…]); a subject added later in the Sheet falls back to its initial and a neutral line.
export const FEATURED_LIMIT = 8;

const collator = new Intl.Collator('en', {sensitivity: 'base', numeric: true});
const fold = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('en');
const hostOf = url => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } };

export function categoryGroups(data) {
  return [...new Map([...data.categories].sort((a, b) => a.category_order - b.category_order)
    .map(c => [c.category_id, {id: c.category_id, name: c.category, order: c.category_order}])).values()];
}

// Derived lookups, computed once per catalogue object (the client replaces the object on reload only).
const indexes = new WeakMap();
export function indexOf(data) {
  let ix = indexes.get(data);
  if (ix) return ix;
  const cats = new Map(data.categories.map(c => [c.id, c]));
  const groups = categoryGroups(data);
  const subsByCat = new Map(groups.map(g => [g.id, data.categories.filter(c => c.category_id === g.id)
    .sort((a, b) => a.sort_order - b.sort_order || collator.compare(a.subcategory, b.subcategory))]));
  const extras = new Map(), extraRank = new Map();
  for (const p of data.placements) {
    if (!extras.has(p.resource_id)) extras.set(p.resource_id, []);
    extras.get(p.resource_id).push(p.placement_id);
    extraRank.set(`${p.resource_id}\0${p.placement_id}`, Number(p.sort_order) || 0);
  }
  const placements = new Map(), haystack = new Map(), subjectCount = new Map(), stationCount = new Map();
  for (const r of data.resources) {
    const ids = [...new Set([r.primary_placement, ...(extras.get(r.id) || [])])].filter(id => cats.has(id));
    placements.set(r.id, ids);
    haystack.set(r.id, fold([r.name, r.description, r.best_for, r.tags, hostOf(r.url), ...ids.map(id => `${cats.get(id).category} ${cats.get(id).subcategory}`)].join(' ')));
    for (const cat of new Set(ids.map(id => cats.get(id).category_id))) subjectCount.set(cat, (subjectCount.get(cat) || 0) + 1);
    for (const id of ids) stationCount.set(id, (stationCount.get(id) || 0) + 1);
  }
  ix = {cats, groups, subsByCat, extraRank, placements, haystack, subjectCount, stationCount, byId: new Map(data.resources.map(r => [r.id, r]))};
  indexes.set(data, ix);
  return ix;
}

// Rank is placement-aware: the resource's Sort order applies to its primary placement; an additional placement
// uses its own optional Sort order (0 = unranked). A Coding preference therefore never reorders another subject.
export function rankIn(data, r, placementId) {
  if (placementId === r.primary_placement) return Number(r.sort_order) || 0;
  return indexOf(data).extraRank.get(`${r.id}\0${placementId}`) || 0;
}
const byRankThenName = (data, placementId) => (a, b) =>
  (rankIn(data, a, placementId) || Infinity) - (rankIn(data, b, placementId) || Infinity) || collator.compare(a.name, b.name);

export function searchTerms(q) { return fold(q).trim().split(/\s+/).filter(Boolean); }
export function matchScore(data, r, terms) {
  if (!terms.length) return 1;
  const hay = indexOf(data).haystack.get(r.id);
  if (!terms.every(t => hay.includes(t))) return 0;
  const name = fold(r.name), phrase = terms.join(' ');
  if (name === phrase) return 100;
  if (name.startsWith(phrase)) return 80;
  if (terms.every(t => name.includes(t))) return 60;
  if (terms.some(t => name.includes(t))) return 40;
  if (terms.some(t => hostOf(r.url).includes(t))) return 30;
  return 10;
}

// Backward-compatible flat selection (used by tests, "Surprise me" and counts): one record per ID.
export function selectResources(data, {category = '', subcategory = '', q = ''} = {}) {
  const ix = indexOf(data), terms = searchTerms(q);
  return data.resources.filter(r => {
    const ids = ix.placements.get(r.id);
    if (category && !ids.some(id => ix.cats.get(id).category_id === category)) return false;
    if (subcategory && !ids.includes(subcategory)) return false;
    return matchScore(data, r, terms) > 0;
  }).sort((a, b) => (a.sort_order || 9999) - (b.sort_order || 9999) || collator.compare(a.name, b.name));
}

// Which section a resource belongs to inside one subject's All view: its primary placement when that is in the
// subject, otherwise its earliest additional placement by the subject's section order.
export function sectionFor(data, r, category) {
  const ix = indexOf(data), ids = ix.placements.get(r.id);
  const primary = ix.cats.get(r.primary_placement);
  if (primary?.category_id === category) return primary.id;
  return ix.subsByCat.get(category)?.find(s => ids.includes(s.id))?.id || '';
}

export function normalizeState(data, raw = {}) {
  const ix = indexOf(data);
  const state = {category: String(raw.category || ''), subcategory: String(raw.subcategory || ''), q: String(raw.q || '').slice(0, 120)};
  if (state.category && !ix.groups.some(g => g.id === state.category)) state.category = '';
  const sub = ix.cats.get(state.subcategory);
  if (!sub || sub.category_id !== state.category) state.subcategory = '';
  return state;
}
export const stateFromSearch = search => { const p = new URLSearchParams(search); return {category: p.get('category') || '', subcategory: p.get('subcategory') || '', q: p.get('q') || ''}; };
export function searchFromState(state) {
  const p = new URLSearchParams();
  for (const key of ['category', 'subcategory', 'q']) if (state[key]) p.set(key, state[key]);
  const s = p.toString();
  return s ? `?${s}` : '/';
}
// Deliberate navigation creates history; refining a search you already started replaces it.
export function historyMode(prev, next) {
  if (prev.category !== next.category || prev.subcategory !== next.subcategory) return 'push';
  if (prev.q === next.q) return 'none';
  return prev.q && next.q ? 'replace' : 'push';
}
export const stateKey = state => searchFromState(state);

/* Grouped view model. Every row appears once. */
export function viewModel(data, raw) {
  const ix = indexOf(data), state = normalizeState(data, raw), terms = searchTerms(state.q);
  const group = ix.groups.find(g => g.id === state.category);
  const kind = state.q ? 'search' : state.subcategory ? 'station' : state.category ? 'subject' : 'overview';
  if (kind === 'overview') return {kind, state, groups: ix.groups.map(g => ({group: g, count: ix.subjectCount.get(g.id) || 0})).filter(g => g.count), total: data.resources.length};
  const scored = data.resources.map(r => [r, matchScore(data, r, terms)]).filter(([, s]) => s > 0);
  const score = new Map(scored.map(([r, s]) => [r.id, s]));
  const sortRows = (rows, placementId) => rows.sort((a, b) => (terms.length ? score.get(b.id) - score.get(a.id) : 0) || byRankThenName(data, placementId)(a, b));
  const lines = [];
  const addLine = (g, assign) => {
    const buckets = new Map();
    for (const [r] of scored) { const id = assign(r); if (id) (buckets.get(id) || buckets.set(id, []).get(id)).push(r); }
    const sections = (ix.subsByCat.get(g.id) || []).filter(s => buckets.has(s.id)).map(s => ({sub: s, rows: sortRows(buckets.get(s.id), s.id)}));
    const count = sections.reduce((n, s) => n + s.rows.length, 0);
    if (count) lines.push({group: g, sections, count, best: Math.max(...sections.flatMap(s => s.rows.map(r => score.get(r.id))))});
  };
  if (state.subcategory) addLine(group, r => ix.placements.get(r.id).includes(state.subcategory) ? state.subcategory : '');
  else if (group) addLine(group, r => sectionFor(data, r, group.id));
  else {
    for (const g of ix.groups) addLine(g, r => ix.cats.get(r.primary_placement)?.category_id === g.id ? r.primary_placement : '');
    lines.sort((a, b) => b.best - a.best || a.group.order - b.group.order);
  }
  return {kind, state, group, sub: ix.cats.get(state.subcategory), lines, total: lines.reduce((n, l) => n + l.count, 0)};
}

// Opening rows for a subject in the overview: ranked rows in section order, topped up with the next rows.
export function featuredFor(data, categoryId, limit = FEATURED_LIMIT) {
  const line = viewModel(data, {category: categoryId}).lines[0];
  if (!line) return [];
  const ordered = line.sections.flatMap(s => s.rows.map(r => ({r, ranked: rankIn(data, r, s.sub.id) > 0})));
  return [...ordered.filter(x => x.ranked), ...ordered.filter(x => !x.ranked)].slice(0, limit).map(x => x.r);
}

/* Markup */
export const icon = (id, cls = 'icon') => `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#i-${id}"></use></svg>`;
// Subject badge: the subject's pictogram in its line colour. The 18px interchange size keeps the letter,
// which stays legible where an outline icon would not. Unknown (Sheet-added) subjects use the grid icon.
export const subjectIcon = id => categoryIcon(hasCategoryIcon(id) ? id : 'all');
export const bullet = (group, cls = '') => `<span class="bullet${cls ? ' ' + cls : ''}" data-line="${e(group.id)}" aria-hidden="true">${subjectIcon(group.id)}</span>`;
export const allBullet = (cls = '') => `<span class="bullet bullet--all${cls ? ' ' + cls : ''}" aria-hidden="true">${categoryIcon('all')}</span>`;
// Section pictogram by stable subcategory ID; a section added later in the Sheet falls back to its subject's icon.
export const sectionIcon = sub => hasSubcategoryIcon(sub.id) ? subcategoryIcon(sub.id) : subjectIcon(sub.category_id);
export const hrefFor = state => e(searchFromState(state));
const navAttrs = (category, subcategory = '') => `href="${hrefFor({category, subcategory})}" data-nav data-category="${e(category)}" data-subcategory="${e(subcategory)}"`;

// Favicon exceptions from scripts/audit-icons.mjs (host -> 'missing' | 'light'); unlisted hosts use the favicon.
let iconHints = {};
export const setIconHints = hints => { iconHints = hints || {}; };

export function faviconUrl(r) {
  return r.logo_url || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostOf(r.url))}&sz=64`;
}
export function tileHtml(data, r, cls = 'tile') {
  const home = indexOf(data).cats.get(r.primary_placement);
  const letter = (r.name.match(/[a-z0-9]/i)?.[0] || '?').toUpperCase();
  const hint = r.logo_url ? '' : iconHints[hostOf(r.url)];
  const img = hint === 'missing' ? '' : `<img src="${e(faviconUrl(r))}" alt="" width="32" height="32" loading="lazy" decoding="async" referrerpolicy="no-referrer">`;
  return `<span class="${cls}${hint === 'light' ? ' tile--dark-plate' : ''}" data-line="${e(home?.category_id || '')}" aria-hidden="true"><span class="tile-letter">${e(letter)}</span>${img}</span>`;
}
// A resource row: favicon tile, name and description. Other subjects it is listed in appear in its popup
// ("Listed in" / "Also in", with full subject and section names), not as letter badges on the row.
export function rowHtml(data, r, {compact = false} = {}) {
  return `<li class="row${compact ? ' row--compact' : ''}"><a class="row-link" href="${e(r.url)}" target="_blank" rel="noopener noreferrer" data-preview="${e(r.id)}" aria-haspopup="dialog">${tileHtml(data, r)}<span class="row-body"><span class="row-name">${e(r.name)}</span>${compact ? '' : `<span class="row-desc">${e(r.description)}</span>`}</span></a></li>`;
}

function stripHtml(data, group, {vertical = false} = {}) {
  const ix = indexOf(data);
  const stops = (ix.subsByCat.get(group.id) || []).filter(s => ix.stationCount.get(s.id));
  return `<ol class="strip${vertical ? ' strip--vertical' : ''}" aria-label="${e(group.name)} sections">${stops.map(s => `<li class="strip-stop"><a ${navAttrs(group.id, s.id)}><span class="stop" aria-hidden="true"></span><span class="strip-name">${sectionIcon(s)}<span>${e(s.subcategory)}</span></span><span class="count">${ix.stationCount.get(s.id)}</span></a></li>`).join('')}</ol>`;
}

export function overviewHtml(data) {
  const vm = viewModel(data, {});
  return `<div class="network">${vm.groups.map(({group, count}) => {
    const rows = featuredFor(data, group.id);
    return `<section class="line-block" data-line="${e(group.id)}" id="line-${e(group.id)}" aria-labelledby="line-title-${e(group.id)}" data-spy="${e(group.id)}">
<header class="line-head">${bullet(group, 'bullet--lg')}<h3 class="line-title" id="line-title-${e(group.id)}"><a ${navAttrs(group.id)}>${e(group.name)}</a></h3><span class="line-count">${count} websites</span></header>
${stripHtml(data, group)}
<ul class="rows rows--compact">${rows.map(r => rowHtml(data, r, {compact: true})).join('')}</ul>
<a class="line-more" ${navAttrs(group.id)}>All ${count} in ${e(group.name)}${icon('next')}</a>
</section>`;
  }).join('')}</div>`;
}

function trackHtml(data, line, {showHead, showStops = true}) {
  const {group, sections, count} = line;
  const h = showHead ? 'h4' : 'h3';
  return `<div class="track" data-line="${e(group.id)}">${showHead ? `<header class="track-head">${bullet(group)}<h3 class="track-title"><a ${navAttrs(group.id)}>${e(group.name)}</a></h3><span class="count">${count}</span></header>` : ''}
${sections.map(({sub, rows}) => `<section class="station" id="stop-${e(sub.id)}" data-spy="${e(sub.id)}" ${showStops ? `aria-labelledby="stop-title-${e(sub.id)}"` : 'aria-labelledby="view-title"'}>
${showStops ? `<${h} class="station-head" id="stop-title-${e(sub.id)}"><span class="stop" aria-hidden="true"></span>${sectionIcon(sub)}<span class="station-name">${e(sub.subcategory)}</span><span class="count">${rows.length}<span class="sr-only"> websites</span></span></${h}>` : ''}
<ul class="rows">${rows.map(r => rowHtml(data, r)).join('')}</ul></section>`).join('')}
<span class="terminus" aria-hidden="true"></span></div>`;
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
export function viewHeadHtml(data, vm) {
  const ix = indexOf(data);
  if (vm.kind === 'overview') return `<div class="view-head"><h2 class="view-title" id="view-title" tabindex="-1">All subjects</h2><p class="view-meta">${plural(vm.total, 'website')} in ${plural(vm.groups.length, 'subject')}</p></div>`;
  if (vm.kind === 'search') {
    const scope = vm.sub ? `${vm.group.name}: ${vm.sub.subcategory}` : vm.group?.name;
    const meta = vm.total ? `${plural(vm.total, 'website')}${scope ? ` in ${e(scope)}` : ` in ${plural(vm.lines.length, 'subject')}`}` : 'No websites match';
    return `<div class="view-head"><h2 class="view-title" id="view-title" tabindex="-1">Results for “${e(vm.state.q)}”</h2><p class="view-meta">${meta}${vm.group && vm.total ? ` <a class="text-link" href="${hrefFor({q: vm.state.q})}" data-nav data-category="" data-subcategory="" data-keep-q>Search every subject</a>` : ''}</p></div>`;
  }
  const g = vm.group, subs = (ix.subsByCat.get(g.id) || []).filter(s => ix.stationCount.get(s.id));
  const chips = `<nav class="chips" aria-label="${e(g.name)} sections"><a class="chip" ${navAttrs(g.id)}${vm.kind === 'subject' ? ' aria-current="page"' : ''}>All sections</a>${subs.map(s => `<a class="chip" ${navAttrs(g.id, s.id)}${vm.state.subcategory === s.id ? ' aria-current="page"' : ''}>${sectionIcon(s)}${e(s.subcategory)}<span class="count">${ix.stationCount.get(s.id)}</span></a>`).join('')}</nav>`;
  if (vm.kind === 'station') return `<div class="view-head" data-line="${e(g.id)}"><p class="view-crumb"><a ${navAttrs(g.id)}>${bullet(g, 'bullet--sm')}${e(g.name)}</a></p><div class="view-title-row"><span class="view-section-icon">${sectionIcon(vm.sub)}</span><h2 class="view-title" id="view-title" tabindex="-1">${e(vm.sub.subcategory)}</h2></div><p class="view-meta">${plural(vm.total, 'website')}</p>${chips}</div>`;
  return `<div class="view-head" data-line="${e(g.id)}"><div class="view-title-row">${bullet(g, 'bullet--lg')}<h2 class="view-title" id="view-title" tabindex="-1">${e(g.name)}</h2></div><p class="view-meta">${plural(vm.total, 'website')} in ${plural(vm.lines[0]?.sections.length || 0, 'section')}</p>${chips}</div>`;
}

export function emptyHtml(vm) {
  return `<div class="empty"><p class="empty-title">Nothing matches “${e(vm.state.q)}”${vm.group ? ` in ${e(vm.sub ? vm.sub.subcategory : vm.group.name)}` : ''}.</p><p>Try a shorter word, a different spelling, or what the site does (for example “pdf”, “fonts”, “music”).</p><p class="empty-actions">${vm.group ? `<a class="button" href="${hrefFor({q: vm.state.q})}" data-nav data-category="" data-subcategory="" data-keep-q>Search every subject</a>` : ''}<a class="button button--quiet" href="/" data-clear>Clear search</a></p></div>`;
}

export function resultsHtml(data, vm) {
  if (vm.kind === 'overview') return overviewHtml(data);
  if (!vm.total) return emptyHtml(vm);
  const many = vm.lines.length > 1 || vm.kind === 'search' && !vm.group;
  return vm.lines.map(line => trackHtml(data, line, {showHead: many, showStops: vm.kind !== 'station'})).join('');
}

export function railHtml(data, state) {
  const ix = indexOf(data);
  const item = (g, label, count, current) => `<a class="rail-item" ${navAttrs(g?.id || '')}${current ? ' aria-current="page"' : ''}>${g ? bullet(g) : allBullet()}<span class="rail-name">${e(label)}</span><span class="count">${count}</span></a>`;
  const lines = ix.groups.filter(g => ix.subjectCount.get(g.id)).map(g => {
    const active = state.category === g.id;
    const stops = active ? `<ol class="rail-stops"><li><a class="rail-stop rail-stop--all" ${navAttrs(g.id)}${!state.subcategory ? ' aria-current="page"' : ''}>All sections</a></li>${(ix.subsByCat.get(g.id) || []).filter(s => ix.stationCount.get(s.id)).map(s => `<li><a class="rail-stop" data-spy-target="${e(s.id)}" ${navAttrs(g.id, s.id)}${state.subcategory === s.id ? ' aria-current="page"' : ''}><span class="stop" aria-hidden="true"></span>${sectionIcon(s)}<span class="rail-name">${e(s.subcategory)}</span><span class="count">${ix.stationCount.get(s.id)}</span></a></li>`).join('')}</ol>` : '';
    return `<li class="rail-line${active ? ' is-active' : ''}" data-line="${e(g.id)}" data-spy-target="${e(g.id)}">${item(g, g.name, ix.subjectCount.get(g.id), active && !state.subcategory)}${stops}</li>`;
  }).join('');
  return `<ul class="rail-lines"><li class="rail-line rail-line--all">${item(null, 'Everything', data.resources.length, !state.category)}</li>${lines}</ul>`;
}

// Horizontal subject strip for narrow screens (the rail's compact form).
export function subjectStripHtml(data, state) {
  const ix = indexOf(data);
  return `<a class="subject-chip" ${navAttrs('')}${!state.category ? ' aria-current="page"' : ''}>${allBullet()}Everything</a>${ix.groups.filter(g => ix.subjectCount.get(g.id)).map(g => `<a class="subject-chip" ${navAttrs(g.id)}${state.category === g.id ? ' aria-current="page"' : ''}>${bullet(g)}${e(g.name)}</a>`).join('')}`;
}

export function previewHtml(data, r) {
  const ix = indexOf(data);
  const ids = ix.placements.get(r.id), primary = ix.cats.get(r.primary_placement);
  const groupOf = c => ix.groups.find(g => g.id === c.category_id);
  const stopLink = c => `<a class="trail-link" ${navAttrs(c.category_id, c.id)} data-line="${e(c.category_id)}">${bullet(groupOf(c), 'bullet--sm')}<span class="trail-text"><span class="trail-subject">${e(c.category)}</span><span class="trail-stop"><span class="sr-only">, </span>${sectionIcon(c)}${e(c.subcategory)}</span></span></a>`;
  const others = ids.filter(id => id !== r.primary_placement).map(id => ix.cats.get(id));
  const host = hostOf(r.url);
  return `<div class="preview-id">${tileHtml(data, r, 'tile tile--lg')}<div><h2 class="preview-title" id="preview-title">${e(r.name)}</h2><p class="preview-host">${e(host)}</p></div></div>
<p class="preview-desc">${e(r.description)}</p>
${r.best_for ? `<div class="preview-useful"><h3>Useful for</h3><p>${e(r.best_for)}</p></div>` : ''}
${r.suggested_by ? `<p class="preview-credit">Suggested by ${e(r.suggested_by)}</p>` : ''}
<dl class="trail"><div><dt>Listed in</dt><dd>${primary ? stopLink(primary) : ''}</dd></div>${others.length ? `<div><dt>Also in</dt><dd>${others.map(stopLink).join('')}</dd></div>` : ''}</dl>
<div class="preview-actions"><a class="visit" href="${e(r.url)}" target="_blank" rel="noopener noreferrer"><span>Visit ${e(host)}</span>${icon('external')}<span class="sr-only"> (opens in a new tab)</span></a></div>`;
}
