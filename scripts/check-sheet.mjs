// Read-only check of the live catalogue Sheet: `npm run check:sheet` (needs GOOGLE_SHEET_ID and
// GOOGLE_SERVICE_ACCOUNT_JSON in .env). Reads, validates and compares it with the bundled fallback without writing
// anything. Use it before connecting the site to the Sheet, and before each release, to see whether the Sheet is missing
// newer local changes (connecting an older Sheet would replace the newer catalogue on the live site).
import fs from 'node:fs/promises';
import {createSheetReader} from '../lib/sheets.mjs';
import {publicCatalogue} from '../lib/catalogue.mjs';
import {bundledCatalogue} from '../lib/store.mjs';
import {compareCatalogues, identical} from '../lib/compare-catalogues.mjs';

if (!process.env.GOOGLE_SHEET_ID) throw new Error('Set GOOGLE_SHEET_ID and GOOGLE_SERVICE_ACCOUNT_JSON in .env first.');
const sheet = publicCatalogue(await createSheetReader(process.env.GOOGLE_SHEET_ID)());
const bundled = bundledCatalogue(JSON.parse(await fs.readFile(new URL('../data/fallback-catalogue.json', import.meta.url), 'utf8')));
const result = compareCatalogues(bundled, sheet);
const list = (label, items) => console.log(`  ${label}: ${items.length}${items.length ? `\n    ${items.join('\n    ')}` : ''}`);
console.log(`Sheet is valid: ${sheet.resources.length} published resources, ${sheet.categories.length} subcategories, ${sheet.placements.length} additional placements.`);
console.log(`Bundled fallback: ${bundled.resources.length} published resources, ${bundled.categories.length} subcategories, ${bundled.placements.length} additional placements.`);
for (const [table, label] of [['resources', 'Published resources (by ID)'], ['categories', 'Subcategories (by ID)'], ['placements', 'Additional placements (resource → subcategory, incl. Sort order)']]) {
  console.log(label);
  list('only in the bundled catalogue (missing from the Sheet)', result[table].missing);
  list('only in the Sheet', result[table].extra);
  list('different', result[table].changed);
}
console.log(identical(result) ? 'The Sheet matches the bundled catalogue.' : 'Differences found: reconcile before connecting or releasing.');
process.exitCode = identical(result) ? 0 : 1;
