// Order-independent comparison of two public catalogues (e.g. the bundled fallback and a Sheet read), used by
// scripts/check-sheet.mjs. Every table is compared by its key, so row order never counts as a difference:
//   resources   by id, all public fields
//   categories  by subcategory id, labels and orders
//   placements  by (resource_id, placement_id), with sort_order normalised (absent and 0 both mean unranked)
// Each table reports `missing` (only in `expected`), `extra` (only in `actual`) and `changed` (same key, different fields).
const byKey = (rows, key, normalise = r => r) => new Map(rows.map(r => [key(r), JSON.stringify(sorted(normalise(r)))]));
const sorted = obj => Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));

function diff(expected, actual) {
  return {
    missing: [...expected.keys()].filter(k => !actual.has(k)),
    extra: [...actual.keys()].filter(k => !expected.has(k)),
    changed: [...expected.keys()].filter(k => actual.has(k) && actual.get(k) !== expected.get(k)),
  };
}

export const placementKey = p => `${p.resource_id} → ${p.placement_id}`;
const placement = p => ({resource_id: p.resource_id, placement_id: p.placement_id, sort_order: p.sort_order > 0 ? p.sort_order : 0});

export function compareCatalogues(expected, actual) {
  return {
    resources: diff(byKey(expected.resources, r => r.id), byKey(actual.resources, r => r.id)),
    categories: diff(byKey(expected.categories, c => c.id), byKey(actual.categories, c => c.id)),
    placements: diff(byKey(expected.placements, placementKey, placement), byKey(actual.placements, placementKey, placement)),
  };
}

export const identical = result => Object.values(result).every(t => !t.missing.length && !t.extra.length && !t.changed.length);
