// Builds the public-only fallback catalogue bundled with each release: `npm run build:fallback`.
// Input: data/catalogue.json (the full editorial seed, including drafts, archived rows, notes and provenance).
// Output: data/fallback-catalogue.json, containing only what the public page already shows (the publicCatalogue
// allowlist of Published rows). The server serves it at startup and whenever the Google Sheet cannot be read.
// tests/store.test.mjs fails if this file falls out of step with the seed, so re-run after any seed edit.
import fs from 'node:fs/promises';
import {publicCatalogue} from '../lib/catalogue.mjs';

const seed = JSON.parse(await fs.readFile(new URL('../data/catalogue.json', import.meta.url), 'utf8'));
const data = publicCatalogue(seed);
const file = {generated_at: new Date().toISOString().slice(0, 10), ...data};
await fs.writeFile(new URL('../data/fallback-catalogue.json', import.meta.url), JSON.stringify(file, null, 1) + '\n');
console.log(`Fallback catalogue: ${data.resources.length} published resources, ${data.categories.length} subcategories, ${data.placements.length} additional placements.`);
