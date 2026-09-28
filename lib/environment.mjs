import {httpUrl} from './catalogue.mjs';

// Every environment setting the site still reads, in one place. Used by server.mjs (local) and api/index.js (Vercel).
// None of these are secrets except the Google reader key, which only lib/sheets.mjs reads.
//   GOOGLE_SHEET_ID        the private catalogue Sheet; unset = serve the bundled catalogue only
//   PUBLIC_ORIGIN          the approved address, e.g. https://tools.soralives.xyz (canonical, robots, sitemap)
//   HADES_PRELAUNCH=true   explicit bootstrap: bundled catalogue, no Sheet reads, never indexed, no analytics
//   HADES_WEB_ANALYTICS=true  optional: load Vercel Web Analytics (owner dashboard only) on the canonical host
//   REFRESH_SECONDS        Sheet check interval per server instance, default 21600 (six hours), minimum 60
//   CORRECTION_URL, SITE_NAME  optional
export function siteEnvironment(env = process.env, {runtime = 'server'} = {}) {
  const prelaunch = env.HADES_PRELAUNCH === 'true';
  const origin = env.PUBLIC_ORIGIN && httpUrl(env.PUBLIC_ORIGIN) ? new URL(env.PUBLIC_ORIGIN).origin : '';
  const canonicalHost = origin ? new URL(origin).host : '';
  // On Vercel only the Production environment may be indexed or measured; Preview deployments never are.
  const productionHost = host => !prelaunch && !!canonicalHost && host === canonicalHost && (runtime !== 'vercel' || env.VERCEL_ENV === 'production');
  return {
    prelaunch, origin, canonicalHost,
    sheetId: prelaunch ? '' : String(env.GOOGLE_SHEET_ID || '').trim(),
    refreshMs: Math.max(60, Number(env.REFRESH_SECONDS) || 21600) * 1000,
    siteName: env.SITE_NAME || 'Hades',
    correctionUrl: httpUrl(env.CORRECTION_URL) ? env.CORRECTION_URL : '',
    // Indexing depends only on these explicit settings and the request host, never on whether the Sheet or the
    // bundled catalogue is being served.
    indexable: productionHost,
    collectAnalytics: host => env.HADES_WEB_ANALYTICS === 'true' && runtime === 'vercel' && productionHost(host),
  };
}
