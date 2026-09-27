// Candidate seed changes for the Coding & Development order request (backlog R02/R03), 24 September 2026.
// Idempotent: safe to run repeatedly. Every change is listed in docs/CANDIDATE-DATA-CHANGES.md together
// with the matching manual Sheet edit. It never touches the shared Google Sheet.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {validateCatalogue} from '../lib/catalogue.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const cataloguePath = path.join(root, 'data/catalogue.json');
const provenancePath = path.join(root, 'data/migration-provenance.json');
const data = JSON.parse(await fs.readFile(cataloguePath, 'utf8'));
const provenance = JSON.parse(await fs.readFile(provenancePath, 'utf8'));
const log = [];

// Same ID scheme as scripts/migrate-catalogue.py: sha256 of the normalised https URL.
const idFor = url => {
  const u = new URL(url);
  const key = `https://${u.host.toLowerCase().replace(/^www\./, '')}${u.pathname.replace(/\/$/, '')}${u.search}`;
  return 'h-' + createHash('sha256').update(key).digest('hex').slice(0, 10);
};

// 1. Coding section order requested by the owner. Subcategory IDs are unchanged; only their order moves.
const codingOrder = {'coding-2': 1, 'coding-1': 2, 'coding-3': 3, 'coding-4': 4, 'coding-6': 5, 'coding-5': 6, 'coding-7': 7};
for (const c of data.categories) {
  if (c.id in codingOrder && c.sort_order !== codingOrder[c.id]) {
    log.push(`Subcategory order ${c.id} (${c.subcategory}): ${c.sort_order} -> ${codingOrder[c.id]}`);
    c.sort_order = codingOrder[c.id];
  }
}

// 2. Official Codex and Claude Code records. Destinations and descriptions were checked on 24 September 2026
// against https://openai.com/codex/ (page title "Codex | AI Coding Partner from OpenAI") and
// https://claude.com/product/claude-code (canonical URL of "Claude Code by Anthropic").
// The general Claude assistant (h-5502a6be3b, https://claude.ai/) is a different product and is left as it is.
const additions = [
  {source_number: 699, name: 'Codex', url: 'https://openai.com/codex/', sort_order: 1,
    description: "OpenAI's coding agent for writing, reviewing and shipping code, with tasks running in parallel locally or in the cloud."},
  {source_number: 700, name: 'Claude Code', url: 'https://claude.com/product/claude-code', sort_order: 2,
    description: "Anthropic's coding agent that plans changes, writes code, runs tests and opens pull requests from the terminal, IDE, Slack or web."},
];
for (const a of additions) {
  const id = idFor(a.url);
  if (!data.resources.some(r => r.id === id)) {
    data.resources.push({
      id, name: a.name, url: a.url, description: a.description, primary_placement: 'coding-2',
      best_for: '', logo_url: '', cost: 'Unknown', audience: 'General', level: 'Not specified', tags: 'AI code; coding agent',
      status: 'Published', sort_order: a.sort_order, last_verified: '2026-09-24', review_status: 'Verified',
      editorial_notes: 'Added 2026-09-24 at owner request: official product listed first/second in Coding & Development. Destination and description checked against the official product page.',
      source_entries: [String(a.source_number)], alternate_urls: [],
    });
    log.push(`Added ${a.name} (${id}) to coding-2 with rank ${a.sort_order}`);
  }
  if (!provenance.entries.some(e => e.source_number === a.source_number)) {
    provenance.entries.push({source_number: a.source_number, name: a.name, url: a.url, description: a.description,
      source_section: 'Owner request: Codex first, Claude Code second in Coding & Development (2026-09-24)', resource_id: id, action: 'retained'});
  }
}

// 3. Cursor previously held rank 1 in Editors & coding assistants; it moves to 3 so Codex and Claude Code lead.
const cursor = data.resources.find(r => r.id === 'h-d8864b187c');
if (cursor?.sort_order === 1) { cursor.sort_order = 3; log.push('Cursor (h-d8864b187c) rank 1 -> 3'); }

// 4. Hugging Face Learn is a course catalogue (source section "AI Learning Resources from Top Companies") that the
// original migration's unnumbered-entry fallback filed under Agent skills. Courses stay out of product sections:
// home it in Learning & Knowledge / Coding & technology learning and list it in Coding / Learning resources.
const hf = data.resources.find(r => r.id === 'h-34dd482cd0');
if (hf?.primary_placement === 'coding-6') { hf.primary_placement = 'learning-4'; log.push('Hugging Face Learn primary coding-6 -> learning-4'); }
if (!data.placements.some(p => p.resource_id === 'h-34dd482cd0' && p.placement_id === 'coding-7')) {
  data.placements.push({resource_id: 'h-34dd482cd0', placement_id: 'coding-7'});
  log.push('Hugging Face Learn extra placement coding-7');
}

provenance.source_count = provenance.entries.length;
provenance.resource_count = new Set(provenance.entries.map(e => e.resource_id)).size;
validateCatalogue(data);
await fs.writeFile(cataloguePath, JSON.stringify(data, null, 2) + '\n');
await fs.writeFile(provenancePath, JSON.stringify(provenance, null, 2) + '\n');
const count = s => data.resources.filter(r => r.status === s).length;
console.log(log.length ? log.join('\n') : 'No changes needed (already applied).');
console.log(`Totals: ${data.resources.length} resources, ${count('Published')} Published, ${count('Archived')} Archived, ${count('Draft')} Draft; provenance ${provenance.source_count} source entries.`);
