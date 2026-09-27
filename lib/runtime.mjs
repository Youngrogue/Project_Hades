import fs from 'node:fs/promises';
import path from 'node:path';
import {CatalogueStore} from './store.mjs';
import {createSheetReader} from './sheets.mjs';
import {createHandler} from './http-handler.mjs';
import {requestRefresh} from './request-refresh.mjs';
import {siteEnvironment} from './environment.mjs';

// Shared start-up for the local server and the Vercel function. Never fails because Google is unreachable or not
// configured: the bundled catalogue is always served, and the reason goes to the private server log.
export async function createRuntime({root, env = process.env, runtime = 'server', log = console}) {
  const site = siteEnvironment(env, {runtime});
  const bundled = JSON.parse(await fs.readFile(path.join(root, 'data/fallback-catalogue.json'), 'utf8'));
  let readSource = null;
  if (site.sheetId) {
    try { readSource = createSheetReader(site.sheetId, env); } catch (error) { log.error(`Google Sheet reader not started: ${error.message}`); }
  } else if (!site.prelaunch) log.error('GOOGLE_SHEET_ID is not set: serving the bundled catalogue only.');
  const store = new CatalogueStore({bundled, readSource, log});
  return {site, store, handler: createHandler({root, store, site}), prepare: requestRefresh(store, {interval: site.refreshMs})};
}
