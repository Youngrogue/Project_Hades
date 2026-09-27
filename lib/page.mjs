import {escapeHtml as e, viewModel, viewHeadHtml, resultsHtml, railHtml, subjectStripHtml, stateKey, icon, setIconHints} from '../public/shared.mjs';
import {iconSprite} from './icons.mjs';
import {brandLockup, brandWordmark} from './brand.mjs';
import {SUGGEST_URL, SOCIALS} from './site-config.mjs';
import iconAudit from '../data/icon-hints.json' with {type: 'json'};

setIconHints(iconAudit.hints);

const HEADING = 'Tools and Applications for the 21st century internet user.';
const TAGLINE = 'Where the treasures of the world are buried.';
// Curator credit with the owner-supplied profiles (lib/site-config.mjs). Icon + handle form one link; the accessible name keeps the
// visible handle and adds the platform. Used everywhere the credit appears.
// "Suggest a tool": a plain link to the Tally form, usable without JavaScript.
const suggestHtml = cls => `<a class="${cls}" href="${e(SUGGEST_URL)}" target="_blank" rel="noopener noreferrer">Suggest a tool${icon('external', 'icon icon-trailing')}<span class="sr-only"> (opens a form in a new tab)</span></a>`;
const creditHtml = cls => `<p class="${cls} credit-line"><span class="credit-by">Curated by <strong>Sora</strong></span><span class="socials">${SOCIALS.map(s =>
  `<a class="social" href="${s.url}" target="_blank" rel="noopener noreferrer" aria-label="Sora on ${s.platform}: ${s.handle} (opens in a new tab)">${icon(s.icon, 'icon social-icon')}<span>${s.handle}</span></a>`).join('')}</span></p>`;

// Renders the requested view (?category=…&subcategory=…&q=…) on the server, so deep links, refreshes and
// visitors without JavaScript get the same organised page. The client takes over navigation after load.
// indexable / collectAnalytics: decided per request host by lib/environment.mjs. Analytics is Vercel Web Analytics for
// the owner's private dashboard only; no figures are shown on the page.
export function pageHtml(data, {siteName = 'Hades', origin = '', correctionUrl = '', indexable = false, state = {}, collectAnalytics = false, release = 'dev'} = {}) {
  const vm = viewModel(data, state);
  const serialized = JSON.stringify(data).replace(/</g, '\\u003c');
  const title = `${siteName} · ${HEADING}`;
  const hidden = (name, value) => value ? `<input type="hidden" name="${name}" value="${e(value)}">` : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="dark light">
<title>${e(title)}</title><meta name="description" content="${e(TAGLINE)} A collection of ${data.resources.length} useful websites curated by Sora, organised by subject and section.">
${origin && indexable ? `<link rel="canonical" href="${e(origin)}/">` : '<meta name="robots" content="noindex,nofollow">'}
<meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(TAGLINE)} Curated by Sora.">
${origin ? `<meta property="og:image" content="${e(origin)}/icons/icon-512.png">` : ''}<meta name="theme-color" content="#0F1113">
<link rel="icon" href="/favicon.ico?v=${e(release)}" sizes="16x16 32x32 48x48"><link rel="icon" href="/favicon.svg?v=${e(release)}" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png?v=${e(release)}"><link rel="preload" href="/fonts/overpass-latin-wght.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/styles.css?v=${e(release)}"><script src="/theme.js?v=${e(release)}"></script><script type="module" src="/app.mjs?v=${e(release)}"></script>${collectAnalytics ? '<script defer src="/_vercel/insights/script.js"></script>' : ''}</head>
<body><!--
THESIS: Hades is an underground network. Each subject is a line, each section a stop; a subject view is one line ridden stop by stop, refusing the category default of a mixed card wall with filter chips.
OWN-WORLD: near-white map ground (#FBFBFA) or night signage (#0F1113), ink #131619, ten flat line colours used only for bullets, stops and tracks; Overpass signage sans with Overpass Mono counts; circles for identity, pills for chips, 10px elsewhere.
STORY: visitors see the whole network, board a subject, scan it section by section, preview a site, then visit it.
FIRST VIEWPORT: italic-h tile lockup ("hades."); two-line heavy headline; tagline and credit; sticky search above the first subject drawn as a horizontal strip map with stops and opening rows; rail of lines on the left from 1024px.
FORM: transit strip map, 4th of 7 grounded candidates; seed e91fe181.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->
<a href="#content" class="skip-link">Skip to the collection</a>
${iconSprite()}
<header class="topbar">
<a href="/" class="brand" aria-label="${e(siteName)} home" data-nav data-category="" data-subcategory="">${brandLockup}</a>
<div class="topbar-actions"><button class="text-button" id="about-button" type="button" aria-haspopup="dialog">About Hades</button><button class="icon-button" id="theme-button" type="button" aria-label="Switch theme">${icon('moon', 'icon theme-icon theme-icon--moon')}${icon('sun', 'icon theme-icon theme-icon--sun')}</button></div>
</header>
<section class="masthead" aria-labelledby="page-title">
<h1 id="page-title">${e(HEADING)}</h1>
<p class="tagline">${e(TAGLINE)}</p>
${creditHtml('credit')}
</section>
<nav class="subject-strip" aria-label="Subjects">${subjectStripHtml(data, vm.state)}</nav>
<div class="layout">
<nav class="rail" aria-label="Subjects and sections">${railHtml(data, vm.state)}<div class="surprise surprise--rail"><button class="text-button" type="button" data-surprise>${icon('shuffle')}Find something unexpected</button><span class="surprise-note" hidden>No matches to explore</span></div></nav>
<main id="content" tabindex="-1">
<form class="search" role="search" action="/" method="get" id="search-form">
<div class="search-field"><label class="search-label" for="search">${icon('search')}<span class="sr-only">Search the collection</span></label><input id="search" name="q" type="search" value="${e(vm.state.q)}" placeholder="Search ${data.resources.length} websites" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search">
<button class="icon-button search-clear" type="button" id="search-clear" aria-label="Clear search"${vm.state.q ? '' : ' hidden'}>${icon('close')}</button><kbd class="search-key" aria-hidden="true">/</kbd></div>
${hidden('category', vm.state.category)}${hidden('subcategory', vm.state.subcategory)}
<noscript><button class="button" type="submit">Search</button></noscript>
</form>
<div class="toolbar">
<div class="toolbar-actions"><div class="surprise surprise--toolbar"><button class="text-button" type="button" data-surprise>${icon('shuffle')}Find something unexpected</button><span class="surprise-note" hidden>No matches to explore</span></div>${suggestHtml('text-button suggest-link')}</div>
</div>
<p class="sr-only" id="live" role="status" aria-live="polite"></p>
<div id="view" data-state="${e(stateKey(vm.state))}">${viewHeadHtml(data, vm)}<div id="results">${resultsHtml(data, vm)}</div></div>
</main>
</div>
<footer class="footer">
<div class="footer-credit">${brandWordmark}<span class="sr-only">${e(siteName)}. </span>${creditHtml('footer-curator')}</div>
<p class="footer-note">Inclusion is a discovery aid, not a claim that every service has been personally tested. Access and features can change.</p>
<p class="footer-links"><button class="text-button" id="footer-about" type="button" aria-haspopup="dialog">About Hades</button>${correctionUrl ? `<a class="text-link" href="${e(correctionUrl)}" target="_blank" rel="noopener noreferrer">Suggest a correction</a>` : ''}${suggestHtml('text-link suggest-footer')}<a class="text-link" href="#page-title">Back to top</a></p>
</footer>
<dialog id="preview" class="preview" aria-labelledby="preview-title"><span class="sheet-grip" aria-hidden="true"></span><button class="icon-button dialog-close" id="close-preview" type="button" aria-label="Close preview">${icon('close')}</button><div id="preview-content"></div></dialog>
<dialog id="about" class="about" aria-labelledby="about-title"><button class="icon-button dialog-close" id="close-about" type="button" aria-label="Close About Hades">${icon('close')}</button>
<h2 id="about-title" class="about-title"><span>About</span> <span class="sr-only">Hades</span>${brandWordmark.replace('class="brand-wordmark"', 'class="brand-wordmark about-wordmark"')}</h2>
<div class="about-story">
<p>Hades brings useful websites together for learning, creative work, everyday tasks and exploring the web.</p>
<p>The name reflects the value that goes undiscovered: hidden talents, unused potential, and ideas left behind as regrets. Hades exists to bring some of those buried treasures into reach, connecting useful tools, knowledge and possibilities with the people who need them most.</p>
<p>Browse a subject or search for what you need. Select a resource for a short description, then follow its link to the original website.</p>
</div>
<div class="about-notes">
<h3>Curation</h3>
${creditHtml('about-credit')}
<p>Inclusion is a discovery aid, not a claim that every service has been personally tested. Access, availability and features can change.</p>
<p>Each subject is split into sections in a fixed order. A website listed in more than one subject appears once per view; select it to see every subject and section it belongs to.</p>
${correctionUrl ? `<a class="visit" href="${e(correctionUrl)}" target="_blank" rel="noopener noreferrer"><span>Suggest a correction</span>${icon('external')}</a>` : ''}
</div>
</dialog>
<script id="catalogue-data" type="application/json">${serialized}</script>
<script id="icon-hints" type="application/json">${JSON.stringify(iconAudit.hints).replace(/</g, '\\u003c')}</script>
</body></html>`;
}
