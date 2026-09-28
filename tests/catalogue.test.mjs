import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {validateCatalogue,publicCatalogue,catalogueFromSheet} from '../lib/catalogue.mjs';
import {selectResources,categoryGroups,viewModel} from '../public/shared.mjs';
import {pageHtml} from '../lib/page.mjs';
const seed=JSON.parse(await fs.readFile(new URL('../data/catalogue.json',import.meta.url),'utf8'));
const clone=()=>structuredClone(seed);
const published=publicCatalogue(seed);

test('all source entries are reconciled and publication excludes drafts',async()=>{
 const p=JSON.parse(await fs.readFile(new URL('../data/migration-provenance.json',import.meta.url),'utf8'));
 // 728 earlier sources + 44 Bolaji references + Details + 5 owner additions (2026-09-28); one discontinued source is excluded.
 assert.equal(p.source_count,778);assert.equal(p.entries.length,778);
 assert.equal(p.resource_count,762);assert.equal(new Set(p.entries.filter(e=>e.action!=='excluded').map(e=>e.resource_id)).size,762);
 assert.deepEqual(p.entries.filter(e=>e.source_number).map(e=>e.source_number),Array.from({length:745},(_,i)=>i+1));
 assert.equal(seed.resources.length,762);
 assert.equal(seed.resources.filter(r=>r.status==='Archived').length,32);assert.equal(seed.resources.filter(r=>r.status==='Draft').length,7);
 assert.equal(published.resources.length,723);
 assert.ok(!published.resources.some(r=>r.name==='Lucida'));
 assert.ok(!JSON.stringify(published).includes('editorial_notes'));
 assert.ok(!JSON.stringify(published).includes('source_entries'));
});
test('search and cross-listing return one record per resource',()=>{
 for(const cat of ['design','video'])assert.equal(selectResources(published,{category:cat,q:'Pexels'}).length,1);
 assert.equal(selectResources(published,{q:'Pexels'}).length,1);
 assert.equal(selectResources(published,{category:'coding',subcategory:'coding-7',q:'W3Schools'}).length,1);
 assert.equal(selectResources(published,{category:'learning',q:'W3Schools'}).length,1);
 assert.equal(selectResources(published,{category:'audio',q:'W3Schools'}).length,0);
});
test('category and subcategory narrow search while obsolete cost and audience values are ignored',()=>{
 assert.equal(selectResources(published,{category:'learning',subcategory:'learning-3',q:'Khan Academy'}).length,1);
 assert.equal(selectResources(published,{category:'learning',subcategory:'learning-1',q:'Khan Academy'}).length,0);
 assert.equal(selectResources(published,{q:'Mistral',cost:'Paid',audience:'Kids & families'}).length,1);
 assert.equal(selectResources(published,{q:'no-resource-exists-xyz'}).length,0);
});
test('invalid published data is rejected, including unsafe links and category mismatches',()=>{
 for(const patch of [{url:'javascript:alert(1)'},{url:'https://user:pass@example.com'},{logo_url:'http://example.com/image.png'},{primary_placement:'not-a-category'},{description:''},{cost:'free-trial'},{sort_order:NaN}]){
  const d=clone();Object.assign(d.resources[0],patch);assert.throws(()=>validateCatalogue(d));
 }
 const duplicate=clone();duplicate.resources.push({...duplicate.resources[0]});assert.throws(()=>validateCatalogue(duplicate),/duplicate/i);
});
test('invalid category definitions and dangling cross-listings fail explicitly',()=>{
 const d=clone();d.categories[1].category='Renamed inconsistently';assert.throws(()=>validateCatalogue(d),/Inconsistent/);
 const b=clone();b.placements.push({resource_id:'unknown',placement_id:'design-1'});assert.throws(()=>validateCatalogue(b),/Unknown additional/);
});
test('HTML escapes untrusted sheet text and includes direct links without JavaScript',()=>{
 const d=structuredClone(published);d.resources[0].name='<img src=x onerror=alert(1)>';
 d.resources[0].description='</script><script>alert(1)</script>';
 // Render the subject page where the modified resource actually appears (it need not be featured on the overview).
 const subject=d.categories.find(c=>c.id===d.resources[0].primary_placement).category_id;
 for(const html of [pageHtml(d),pageHtml(d,{state:{category:subject}})]){
  assert.ok(!html.includes('<img src=x'));assert.ok(!html.includes('</script><script>alert'));
 }
 const html=pageHtml(d,{state:{category:subject}});
 assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
 assert.ok(html.includes('&lt;/script&gt;&lt;script&gt;alert(1)&lt;/script&gt;'));
 // Without JavaScript every published resource is reachable as a direct link on its subject pages.
 const linked=new Set(categoryGroups(d).flatMap(g=>[...pageHtml(d,{state:{category:g.id}}).matchAll(/data-preview="([^"]+)"/g)].map(m=>m[1])));
 assert.equal(linked.size,723);
 assert.ok(pageHtml(d,{state:{category:'coding'}}).includes('href="https://openai.com/codex/" target="_blank" rel="noopener noreferrer"'));
 assert.ok(!html.includes('id="cost"'));assert.ok(!html.includes('id="audience"'));
 assert.ok(html.includes('noindex,nofollow'));
});

test('additional placements accept an optional per-placement Sort order without breaking older sheets',()=>{
 const ranges=sort=>[{values:[['ID','Status','Name','Description','URL','Category','Subcategory'],['a','Published','A','Useful','https://a.example/','S','One'],['b','Published','B','Useful','https://b.example/','S','One']]},
  {values:[['Category','Subcategory','Category ID','Subcategory ID','Category order','Subcategory order'],['S','One','s','s-1',1,1],['S','Two','s','s-2',1,2]]},
  {values:sort?[['Resource ID','Category','Subcategory','Sort order'],['a','S','Two','1'],['b','S','Two','']]:[['Resource ID','Category','Subcategory'],['a','S','Two']]}];
 assert.deepEqual(publicCatalogue(catalogueFromSheet(ranges(false))).placements,[{resource_id:'a',placement_id:'s-2'}]);
 assert.deepEqual(publicCatalogue(catalogueFromSheet(ranges(true))).placements,[{resource_id:'a',placement_id:'s-2',sort_order:1},{resource_id:'b',placement_id:'s-2'}]);
 const bad=clone();bad.placements[0].sort_order=NaN;assert.throws(()=>validateCatalogue(bad),/placement sort order/);
});

test('sheet parser supports appended entries, updated descriptions, reordered columns and new categories',()=>{
 const headers=['ID','Status','Name','Description','URL','Category','Subcategory','Cost'];
 const values=[headers,['new-item','Published','New item','Useful new resource','https://example.com/','New subject','New activity','Free']];
 const ranges=[{values},{values:[['Category','Subcategory','Category ID','Subcategory ID','Category order','Subcategory order'],['New subject','New activity','new','new-1',11,1]]},{values:[['Resource ID','Category','Subcategory']]}];
 let parsed=catalogueFromSheet(ranges);assert.equal(publicCatalogue(parsed).resources.length,1);
 values.push(['draft','Draft','Unfinished','','','','','']);parsed=catalogueFromSheet(ranges);assert.equal(publicCatalogue(parsed).resources.length,1);
 values[1][3]='Changed description';assert.equal(catalogueFromSheet(ranges).resources[0].description,'Changed description');
 values[1][7]='invalid';assert.throws(()=>catalogueFromSheet(ranges),/filter/);
});

test('optional "Suggested by" credit: backwards compatible, validated, escaped and shown only when present',async()=>{
 const {previewHtml}=await import('../public/shared.mjs');
 const sheet=(headers,row)=>[{values:[headers,row]},{values:[['Category','Subcategory','Category ID','Subcategory ID','Category order','Subcategory order'],['S','One','s','s-1',1,1]]},{values:[['Resource ID','Category','Subcategory']]}];
 const base=['ID','Status','Name','Description','URL','Category','Subcategory'];
 const row=['a','Published','A tool','Useful','https://a.example/','S','One'];
 const without=publicCatalogue(catalogueFromSheet(sheet(base,row)));
 assert.ok(!('suggested_by' in without.resources[0]),'sheets without the column are unchanged');
 assert.ok(!previewHtml(without,without.resources[0]).includes('Suggested by'),'no credit line without a name');
 const blank=publicCatalogue(catalogueFromSheet(sheet([...base,'Suggested by'],[...row,''])));
 assert.ok(!('suggested_by' in blank.resources[0]),'an empty cell publishes nothing');
 const named=publicCatalogue(catalogueFromSheet(sheet([...base,'Suggested by','Editorial notes'],[...row,'  Ada L. ','private'])));
 assert.equal(named.resources[0].suggested_by,'Ada L.');
 assert.ok(!JSON.stringify(named).includes('private'),'other private columns stay private');
 assert.match(previewHtml(named,named.resources[0]),/<p class="preview-credit">Suggested by Ada L\.<\/p>/);
 for(const bad of ['ada@example.com','<b>Ada</b>','x'.repeat(61)])
  assert.throws(()=>catalogueFromSheet(sheet([...base,'Suggested by'],[...row,bad])),/Suggested by/,bad);
 const d=structuredClone(published);d.resources[0].suggested_by='O\'Brien & "Co"';
 assert.ok(previewHtml(d,d.resources[0]).includes('Suggested by O&#39;Brien &amp; &quot;Co&quot;'),'rendered as escaped plain text');
 assert.ok(published.resources.every(r=>!('suggested_by' in r)),'the seed invents no credits');
});

test('"Suggested by" appears only in the tool popup, after the description and before Visit website',async()=>{
 const {previewHtml,rowHtml,resultsHtml}=await import('../public/shared.mjs');
 const d=structuredClone(published);const r=d.resources.find(x=>x.best_for);r.suggested_by='Ada L.';
 const popup=previewHtml(d,r);
 const at=popup.indexOf('<p class="preview-credit">Suggested by Ada L.</p>');
 assert.ok(at>popup.indexOf('class="preview-desc"')&&at>popup.indexOf('class="preview-useful"'),'after the description and best use');
 assert.ok(at<popup.indexOf('class="visit"'),'before the Visit website action');
 const home=r.primary_placement,category=d.categories.find(c=>c.id===home).category_id;
 for(const html of [rowHtml(d,r),rowHtml(d,r,{compact:true}),resultsHtml(d,viewModel(d,{category})),resultsHtml(d,viewModel(d,{})),resultsHtml(d,viewModel(d,{q:r.name}))])
  assert.ok(!html.includes('Ada L.')&&!html.includes('Suggested by'),'never in rows, cards or category lists');
 delete r.suggested_by;
 const plain=previewHtml(d,r);
 assert.ok(!plain.includes('preview-credit')&&!plain.includes('Suggested by'),'no placeholder or empty element without a credit');
});
