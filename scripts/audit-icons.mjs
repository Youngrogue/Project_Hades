// Classifies each published resource's favicon once, offline, so the page can choose an intentional treatment:
//   missing: Google has no icon (it answers 404 with a generic globe) or the image is blank -> letter tile
//   light:   a white glyph on a transparent background, invisible on a white plate -> dark plate
// Only exceptions are written to data/icon-hints.json; anything unlisted (including rows added later in the
// Sheet) keeps the normal favicon treatment. Requires ffmpeg for PNG decoding. Run: node scripts/audit-icons.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {publicCatalogue} from '../lib/catalogue.mjs';

const run = promisify(execFile);
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const data = publicCatalogue(JSON.parse(await fs.readFile(path.join(root, 'data/catalogue.json'), 'utf8')));
const hosts = [...new Set(data.resources.filter(r => !r.logo_url).map(r => new URL(r.url).hostname.replace(/^www\./, '')))];
const tmp = await fs.mkdtemp(path.join((await import('node:os')).tmpdir(), 'hades-icons-'));

async function classify(host) {
  // Same request the page makes (the s2 endpoint redirects here); the status tells us whether it is a placeholder.
  const response = await fetch(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`);
  if (response.status === 404) return 'missing';
  if (!response.ok) return null;
  const file = path.join(tmp, `${host}.png`);
  await fs.writeFile(file, Buffer.from(await response.arrayBuffer()));
  const {stdout} = await run('ffmpeg', ['-v', 'error', '-i', file, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], {encoding: 'buffer', maxBuffer: 1 << 22});
  let opaque = 0, light = 0;
  const total = stdout.length / 4;
  for (let i = 0; i < stdout.length; i += 4) {
    if (stdout[i + 3] < 40) continue;
    opaque++;
    const lum = (0.2126 * stdout[i] + 0.7152 * stdout[i + 1] + 0.0722 * stdout[i + 2]) / 255;
    if (lum > 0.86) light++;
  }
  if (opaque / total < 0.03) return 'missing';
  if (opaque / total < 0.92 && light / opaque > 0.8) return 'light';
  return null;
}

const hints = {};
let done = 0;
const queue = [...hosts];
await Promise.all(Array.from({length: 6}, async () => {
  while (queue.length) {
    const host = queue.shift();
    try { const kind = await classify(host); if (kind) hints[host] = kind; } catch (error) { console.warn(`${host}: ${error.message}`); }
    if (++done % 100 === 0) console.log(`${done}/${hosts.length}`);
  }
}));
await fs.rm(tmp, {recursive: true, force: true});
const sorted = Object.fromEntries(Object.entries(hints).sort(([a], [b]) => a.localeCompare(b)));
await fs.writeFile(path.join(root, 'data/icon-hints.json'), JSON.stringify({checked: new Date().toISOString().slice(0, 10), hosts: hosts.length, hints: sorted}, null, 2) + '\n');
const count = kind => Object.values(sorted).filter(v => v === kind).length;
console.log(`Checked ${hosts.length} hosts: ${count('missing')} missing, ${count('light')} light.`);
