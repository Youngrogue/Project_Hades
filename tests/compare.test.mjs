import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {bundledCatalogue} from '../lib/store.mjs';
import {compareCatalogues, identical, placementKey} from '../lib/compare-catalogues.mjs';

const bundled = bundledCatalogue(JSON.parse(await fs.readFile(new URL('../data/fallback-catalogue.json', import.meta.url), 'utf8')));
const copy = () => structuredClone(bundled);

test('identical catalogues match regardless of row order, and absent or zero placement ranks are equal', () => {
  const sheet = copy();
  sheet.resources.reverse(); sheet.categories.reverse(); sheet.placements.reverse();
  sheet.resources[0] = Object.fromEntries(Object.entries(sheet.resources[0]).reverse());
  const unranked = sheet.placements.find(p => !p.sort_order); unranked.sort_order = 0;
  assert.ok(identical(compareCatalogues(bundled, sheet)));
});

test('placements: missing, extra and changed ranks are each reported by (resource, subcategory)', () => {
  const sheet = copy();
  const [first, second] = sheet.placements;
  first.sort_order = 777;
  sheet.placements.splice(1, 1);
  const added = {resource_id: bundled.resources[0].id, placement_id: 'explore-1'};
  assert.ok(!bundled.placements.some(p => placementKey(p) === placementKey(added)));
  sheet.placements.push(added);
  const {placements, resources, categories} = compareCatalogues(bundled, sheet);
  assert.deepEqual(placements, {missing: [placementKey(second)], extra: [placementKey(added)], changed: [placementKey(first)]});
  assert.deepEqual([resources, categories].map(t => t.missing.length + t.extra.length + t.changed.length), [0, 0], 'other tables unaffected');
  assert.ok(!identical(compareCatalogues(bundled, sheet)));
});

test('resources and categories: missing, extra and changed are reported by ID', () => {
  const sheet = copy();
  const [gone, edited] = sheet.resources;
  sheet.resources.shift();
  edited.description = 'Edited in the Sheet';
  sheet.resources.push({...edited, id: 'h-new0000001', url: 'https://new.example/'});
  sheet.categories[0].sort_order = 99;
  const result = compareCatalogues(bundled, sheet);
  assert.deepEqual(result.resources, {missing: [gone.id], extra: ['h-new0000001'], changed: [edited.id]});
  assert.deepEqual(result.categories, {missing: [], extra: [], changed: [sheet.categories[0].id]});
});
