import {setIconHints, viewModel, viewHeadHtml, resultsHtml, railHtml, subjectStripHtml, previewHtml, normalizeState, stateFromSearch, searchFromState, historyMode, stateKey, selectResources, indexOf} from './shared.mjs';

let data = JSON.parse(document.querySelector('#catalogue-data').textContent);
try { setIconHints(JSON.parse(document.querySelector('#icon-hints')?.textContent || '{}')); } catch { /* favicons only */ }
const $ = selector => document.querySelector(selector);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const desktop = matchMedia('(min-width: 1024px)');
const search = $('#search'), view = $('#view'), preview = $('#preview'), about = $('#about');
let state = normalizeState(data, stateFromSearch(location.search));
let opener = null, announceTimer = 0, renderTimer = 0, spy = null, navKey = '';

/* Rendering */
function render({entering = false} = {}) {
  const vm = viewModel(data, state);
  const key = stateKey(vm.state);
  if (view.dataset.state !== key) {
    view.innerHTML = `${viewHeadHtml(data, vm)}<div id="results">${resultsHtml(data, vm)}</div>`;
    view.dataset.state = key;
  }
  if (navKey !== `${state.category}/${state.subcategory}`) {
    navKey = `${state.category}/${state.subcategory}`;
    $('.rail-lines').outerHTML = railHtml(data, state);
    $('.subject-strip').innerHTML = subjectStripHtml(data, state);
  }
  if (search.value !== state.q) search.value = state.q;
  $('#search-clear').hidden = !state.q;
  for (const name of ['category', 'subcategory']) {
    let input = $(`#search-form input[name=${name}]`);
    if (state[name] && !input) { input = Object.assign(document.createElement('input'), {type: 'hidden', name}); $('#search-form').append(input); }
    if (input) { if (state[name]) input.value = state[name]; else input.remove(); }
  }
  if (entering && !reduceMotion.matches) view.querySelectorAll('.track').forEach(track => {
    track.querySelectorAll('.station-head').forEach((head, i) => head.style.setProperty('--i', Math.min(i, 8)));
    track.classList.add('is-entering');
    track.addEventListener('animationend', event => { if (event.target === track) track.classList.remove('is-entering'); }, {once: true});
  });
  enhance();
  updateSurprise();
  return vm;
}

// Favicons: a missing icon falls back to the letter tile in the resource's home-line colour.
// Google's service answers unknown sites with a generic 16px globe, so tiny results are shown small and crisp.
function enhance(root = document) {
  root.querySelectorAll('.tile img:not([data-checked])').forEach(img => {
    img.dataset.checked = '';
    const settle = () => { if (!img.naturalWidth) img.remove(); else { if (img.naturalWidth < 32) img.classList.add('is-small'); img.classList.add('is-loaded'); } };
    if (img.complete) settle(); else { img.addEventListener('load', settle, {once: true}); img.addEventListener('error', () => img.remove(), {once: true}); }
  });
  revealActiveChips();
  watchPosition();
}

function revealActiveChips() {
  for (const current of document.querySelectorAll('.subject-strip [aria-current], .chips [aria-current]')) {
    const strip = current.parentElement;
    const left = current.offsetLeft - (strip.clientWidth - current.offsetWidth) / 2;
    strip.scrollTo({left: Math.max(0, left), behavior: 'instant'});
  }
}

// "You are here": highlight the subject (overview) or stop (subject view) that is currently under the search bar.
function watchPosition() {
  spy?.disconnect();
  const targets = view.querySelectorAll('[data-spy]');
  if (!targets.length || !('IntersectionObserver' in window)) return;
  const visible = new Map();
  spy = new IntersectionObserver(entries => {
    for (const entry of entries) visible.set(entry.target, entry.isIntersecting);
    const first = [...targets].find(t => visible.get(t));
    document.querySelectorAll('.rail .is-here').forEach(el => el.classList.remove('is-here'));
    if (first) document.querySelector(`.rail [data-spy-target="${CSS.escape(first.dataset.spy)}"]`)?.classList.add('is-here');
  }, {rootMargin: '-90px 0px -55% 0px'});
  targets.forEach(t => spy.observe(t));
}

function announce(vm) {
  clearTimeout(announceTimer);
  if (!vm.state.q) { $('#live').textContent = ''; return; }
  // Only the count, and only once typing pauses, so screen readers are not flooded on every keystroke.
  announceTimer = setTimeout(() => { $('#live').textContent = vm.total ? `${vm.total} result${vm.total === 1 ? '' : 's'}` : 'No results'; }, 700);
}

/* Navigation and history.
   Every history entry has a key. Reading position and the focused item are tracked as the visitor browses and
   saved for the entry being left on every transition (push, Back or Forward), then restored after rendering. */
history.scrollRestoration = 'manual';
const POSITIONS = 'hades-positions';
let positions = {};
try { positions = JSON.parse(sessionStorage.getItem(POSITIONS) || '{}'); } catch { /* per-tab memory only */ }
const newKey = () => Math.random().toString(36).slice(2, 10);
let currentKey = history.state?.key || newKey(), lastY = scrollY, lastFocus = '', restoring = false;

function focusId(el) {
  if (!el || el === document.body || !el.closest) return '';
  const row = el.closest('[data-preview]'); if (row) return `preview:${row.dataset.preview}`;
  const nav = el.closest('[data-nav]'); if (nav) return `nav:${nav.dataset.category}/${nav.dataset.subcategory}:${nav.closest('.rail') ? 'rail' : 'view'}`;
  return el.id ? `id:${el.id}` : '';
}
function findFocus(id) {
  const [kind, ...rest] = id.split(':'), value = rest.join(':');
  if (kind === 'preview') return view.querySelector(`[data-preview="${CSS.escape(value)}"]`);
  if (kind === 'nav') {
    const [pair, where] = [value.slice(0, value.lastIndexOf(':')), value.slice(value.lastIndexOf(':') + 1)];
    const [category, subcategory] = pair.split('/');
    return document.querySelector(`${where === 'rail' ? '.rail' : '#view'} [data-nav][data-category="${CSS.escape(category)}"][data-subcategory="${CSS.escape(subcategory)}"]`);
  }
  return kind === 'id' ? document.getElementById(value) : null;
}
function remember() {
  positions[currentKey] = {y: lastY, focus: lastFocus};
  const keys = Object.keys(positions);
  if (keys.length > 60) delete positions[keys[0]];
  try { sessionStorage.setItem(POSITIONS, JSON.stringify(positions)); } catch { /* ignore */ }
}
addEventListener('scroll', () => { if (!restoring) lastY = scrollY; }, {passive: true});
document.addEventListener('focusin', event => { if (!restoring && !event.target.closest('dialog')) lastFocus = focusId(event.target); });
addEventListener('pagehide', remember);

function go(next, {focus = false, entering = false, mode} = {}) {
  const target = normalizeState(data, next);
  const how = mode || historyMode(state, target);
  if (how === 'none') return;
  state = target;
  const url = searchFromState(state);
  if (how === 'push') { remember(); currentKey = newKey(); history.pushState({key: currentKey}, '', url); }
  else history.replaceState({key: currentKey}, '', url);
  const vm = render({entering});
  announce(vm);
  if (focus) {
    const main = $('#content'), top = main.getBoundingClientRect().top + scrollY;
    if (scrollY > top) scrollTo({top, behavior: 'instant'});
    $('#view-title')?.focus({preventScroll: true});
  }
  lastY = scrollY; lastFocus = focusId(document.activeElement);
}

document.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const row = event.target.closest('[data-preview]');
  if (row) { event.preventDefault(); openPreview(row.dataset.preview, row); return; }
  const nav = event.target.closest('[data-nav]');
  if (nav) {
    event.preventDefault();
    if (preview.open) preview.close();
    const next = {category: nav.dataset.category || '', subcategory: nav.dataset.subcategory || '', q: 'keepQ' in nav.dataset ? state.q : ''};
    const changedLine = next.category !== state.category;
    go(next, {focus: true, entering: changedLine && !!next.category && !next.q});
    return;
  }
  if (event.target.closest('[data-clear]')) { event.preventDefault(); clearSearch(); }
});

function clearSearch() {
  go({...state, q: ''});
  search.focus();
}

search.addEventListener('input', () => {
  clearTimeout(renderTimer);
  $('#search-clear').hidden = !search.value;
  renderTimer = setTimeout(() => go({...state, q: search.value}), 90);
});
search.addEventListener('keydown', event => {
  if (event.key === 'Escape' && search.value) { event.preventDefault(); clearSearch(); }
});
$('#search-form').addEventListener('submit', event => {
  event.preventDefault();
  clearTimeout(renderTimer);
  go({...state, q: search.value});
  $('#view-title')?.scrollIntoView({block: 'nearest'});
});
$('#search-clear').addEventListener('click', clearSearch);

window.addEventListener('popstate', event => {
  remember();                      // the entry we are leaving
  currentKey = event.state?.key || newKey();
  if (!event.state?.key) history.replaceState({key: currentKey}, '');
  state = normalizeState(data, stateFromSearch(location.search));
  restoring = true;
  if (preview.open) preview.close();
  const vm = render();
  announce(vm);
  const saved = positions[currentKey] || {y: 0, focus: ''};
  scrollTo({top: saved.y, behavior: 'instant'});
  const target = (saved.focus && findFocus(saved.focus)) || $('#view-title');
  target?.focus({preventScroll: true});
  lastY = saved.y; lastFocus = saved.focus;
  // Let the restored scroll settle before tracking resumes, so it is not recorded as the visitor's own scroll.
  requestAnimationFrame(() => requestAnimationFrame(() => { if (Math.abs(scrollY - saved.y) > 2) scrollTo({top: saved.y, behavior: 'instant'}); restoring = false; lastY = scrollY; }));
});

document.addEventListener('keydown', event => {
  if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || document.querySelector('dialog[open]')) return;
  if (event.target.closest('input, textarea, select, [contenteditable]')) return;
  event.preventDefault();
  search.focus({preventScroll: true});
  search.closest('form').scrollIntoView({block: 'nearest'});
  search.select();
});

/* Preview: anchored beside the row on wide screens, a bottom sheet on phones.
   Position is recomputed whenever the viewport changes while it is open, so resizing a desktop popup down to phone
   width turns it into the bottom sheet instead of leaving it at stale coordinates outside the screen. */
const phone = matchMedia('(max-width: 700px)');
let previewAnchor = null, placeFrame = 0;
function placePreview() {
  delete preview.dataset.anchored;
  preview.style.left = preview.style.top = '';
  if (phone.matches || !previewAnchor?.isConnected) return;
  const rect = previewAnchor.getBoundingClientRect(), width = preview.offsetWidth, height = preview.offsetHeight;
  const roomRight = innerWidth - rect.right - 24;
  const left = roomRight >= width ? rect.right + 12 : Math.min(Math.max(16, rect.left), innerWidth - width - 16);
  const top = roomRight >= width ? rect.top - 12 : rect.bottom + 8;
  preview.dataset.anchored = '';
  preview.style.left = `${Math.round(Math.max(16, left))}px`;
  preview.style.top = `${Math.round(Math.max(16, Math.min(top, innerHeight - height - 16)))}px`;
}
function openPreview(id, anchor) {
  const resource = indexOf(data).byId.get(id);
  if (!resource) return;
  opener = anchor || document.activeElement;
  previewAnchor = anchor || null;
  $('#preview-content').innerHTML = previewHtml(data, resource);
  enhance($('#preview-content'));
  delete preview.dataset.anchored;
  preview.style.left = preview.style.top = '';
  if (!preview.open) preview.showModal();
  placePreview();
  $('#close-preview').focus();
}
addEventListener('resize', () => {
  if (!preview.open || placeFrame) return;
  placeFrame = requestAnimationFrame(() => { placeFrame = 0; if (preview.open) placePreview(); });
});
phone.addEventListener('change', () => { if (preview.open) placePreview(); });
preview.addEventListener('close', () => { if (opener?.isConnected) opener.focus({preventScroll: true}); opener = null; previewAnchor = null; });
$('#close-preview').addEventListener('click', () => preview.close());
for (const dialog of [preview, about]) dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const r = dialog.getBoundingClientRect();
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
});
$('#close-about').addEventListener('click', () => about.close());
// About Hades: modal (focus stays inside), Escape closes, and focus returns to whichever button opened it.
let aboutOpener = null;
for (const id of ['#about-button', '#footer-about']) $(id).addEventListener('click', event => {
  aboutOpener = event.currentTarget;
  about.showModal();
  about.scrollTop = 0;
  $('#close-about').focus();
});
about.addEventListener('close', () => { aboutOpener?.focus({preventScroll: true}); aboutOpener = null; });

/* Find something unexpected: a uniformly random Published resource from the current view, never the one just shown */
let lastSurprise = '';
const surprisePool = () => selectResources(data, state);
function updateSurprise() {
  const empty = !surprisePool().length;
  document.querySelectorAll('[data-surprise]').forEach(button => {
    button.disabled = empty;
    button.parentElement.querySelector('.surprise-note').hidden = !empty;
  });
}
document.addEventListener('click', event => {
  const button = event.target.closest('[data-surprise]');
  if (!button || button.disabled) return;
  const pool = surprisePool();
  if (!pool.length) return;
  const choices = pool.length > 1 ? pool.filter(r => r.id !== lastSurprise) : pool;
  lastSurprise = choices[Math.floor(Math.random() * choices.length)].id;
  openPreview(lastSurprise, button);
});

/* Theme: dark by default; an explicit choice is saved and restored before paint by theme.js */
const themeButton = $('#theme-button');
const effectiveTheme = () => document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
function labelTheme() {
  const theme = effectiveTheme();
  themeButton.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', theme === 'dark' ? '#0F1113' : '#FBFBFA');
}
themeButton.addEventListener('click', () => {
  const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('hades-theme', next); } catch { /* not persisted */ }
  labelTheme();
});
labelTheme();

/* Content refresh: offer, never force, a reload when the published collection changes. Only a Sheet-read catalogue
   counts as newer, so a freshly restarted server still serving its bundled fallback never prompts a step backwards. */
let lastRefresh = Date.now();
window.addEventListener('focus', async () => {
  if (Date.now() - lastRefresh < 300000 || document.querySelector('dialog[open]') || document.activeElement === search || $('.update-notice')) return;
  lastRefresh = Date.now();
  try {
    const response = await fetch('/api/catalogue');
    if (!response.ok) return;
    const next = await response.json();
    if (!Array.isArray(next.resources) || !Array.isArray(next.categories) || next.meta?.source !== 'sheet' || next.meta.version === data.meta?.version) return;
    const button = Object.assign(document.createElement('button'), {className: 'update-notice', type: 'button', textContent: 'The collection has been updated. Refresh'});
    button.addEventListener('click', () => location.reload());
    document.body.append(button);
  } catch { /* offline: keep the current collection */ }
});

history.replaceState({key: currentKey}, '');
if (positions[currentKey]) requestAnimationFrame(() => scrollTo({top: positions[currentKey].y, behavior: 'instant'}));
desktop.addEventListener('change', revealActiveChips);
render();
