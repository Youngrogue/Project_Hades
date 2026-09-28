import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRuntime} from './lib/runtime.mjs';

// Local server. Without GOOGLE_SHEET_ID it serves the bundled catalogue (data/fallback-catalogue.json); with it, the
// Sheet is read on start and then when requests arrive and the last good read is older than REFRESH_SECONDS
// (six hours by default), exactly as on Vercel.
const root = path.dirname(fileURLToPath(import.meta.url));
const {site, store, handler, prepare} = await createRuntime({root});
const background = pending => void pending.then(ok => { if (ok) console.log(`Google Sheet read: ${store.getPublic().resources.length} published resources.`); });
prepare(background);
const server = http.createServer((req, res) => { prepare(background); return handler(req, res); });
const host = process.env.HOST || '127.0.0.1', port = Number(process.env.PORT) || 4318;
server.listen(port, host, () => console.log(`Hades: http://${host}:${port} (${site.sheetId ? 'Google Sheet with bundled fallback' : 'bundled catalogue'}${site.prelaunch ? ', prelaunch' : ''})`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
