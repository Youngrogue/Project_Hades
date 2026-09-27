import {createHash} from 'node:crypto';
import {publicCatalogue} from './catalogue.mjs';

// The catalogue a server instance serves, held in memory only.
//
// Startup: the validated, public-only catalogue bundled with the release (data/fallback-catalogue.json) is served
// immediately. The Google Sheet is then checked in the background (lib/request-refresh.mjs).
// Valid Sheet response: it replaces the in-memory catalogue, including an intentionally empty publication.
// Failed or invalid response (network, authentication, missing headers, validation): the most recent valid catalogue
// stays in use, and a private diagnostic goes to the server log and `status` (never to a public response).
// Restart: memory is empty again, so the bundled catalogue is served until the next successful Sheet read.
// Nothing is written to disk or to any storage service.
export const contentVersion = data => createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 16);

// The bundled file holds only published rows, without their status column. Validate it again through the same public
// allowlist, so a malformed or over-broad release file fails the tests and startup rather than being served.
export function bundledCatalogue(bundled) {
  return publicCatalogue({...bundled, resources: bundled.resources.map(r => ({...r, status: 'Published'}))});
}

export class CatalogueStore {
  constructor({bundled, readSource = null, now = Date.now, log = console}) {
    this.readSource = readSource; this.now = now; this.log = log;
    const data = bundledCatalogue(bundled);
    this.current = {source: 'bundled', data, version: contentVersion(data), checkedAt: null, bundledAt: bundled.generated_at || null};
    this.verifiedAt = 0; this.pending = null;
    this.status = {source: 'bundled', lastSuccess: null, lastAttempt: null, error: readSource ? null : 'Google Sheet not configured'};
  }
  // Coalesces concurrent refreshes within an instance into one Sheet read.
  refresh() {
    if (!this.readSource) return Promise.resolve(false);
    this.pending ||= this.performRefresh().finally(() => { this.pending = null; });
    return this.pending;
  }
  async performRefresh() {
    const at = new Date(this.now()).toISOString();
    this.status.lastAttempt = at;
    try {
      const data = publicCatalogue(await this.readSource());
      this.current = {source: 'sheet', data, version: contentVersion(data), checkedAt: at};
      this.verifiedAt = this.now();
      this.status = {...this.status, source: 'sheet', lastSuccess: at, error: null};
      return true;
    } catch (error) {
      this.status.error = String(error?.message || error).slice(0, 1200);
      this.log.error(`Catalogue refresh failed; still serving the ${this.current.source} catalogue. ${this.status.error}`);
      return false;
    }
  }
  getPublic() {
    const {data, source, version, checkedAt, bundledAt} = this.current;
    return {...data, meta: {source, version, ...(source === 'sheet' ? {checked_at: checkedAt} : {bundled_at: bundledAt})}};
  }
}
