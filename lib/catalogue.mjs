export const STATUSES = ['Draft', 'Published', 'Archived'];
export const COSTS = ['Unknown', 'Free', 'Freemium', 'Paid'];
export const AUDIENCES = ['General', 'Kids & families', 'Educators', 'Professionals'];
export const LEVELS = ['Not specified', 'Beginner', 'Intermediate', 'Advanced'];
const clean = value => String(value ?? '').trim();
export function httpUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}

export function validateCatalogue(data) {
  const errors = [];
  if (!data || !Array.isArray(data.categories) || !Array.isArray(data.resources) || !Array.isArray(data.placements)) throw new Error('Missing catalogue tables');
  const categoryIds = new Set(), resourceIds = new Set(), pairs = new Set(), parents = new Map(), names = new Map();
  for (const c of data.categories) {
    if (!/^[\w-]+$/.test(c.id) || categoryIds.has(c.id)) errors.push(`Invalid or duplicate subcategory ID: ${c.id}`);
    if (!/^[\w-]+$/.test(c.category_id) || !clean(c.category) || !clean(c.subcategory)) errors.push(`Missing category label or ID: ${c.id}`);
    const pair = `${c.category}\0${c.subcategory}`;
    if (pairs.has(pair)) errors.push(`Duplicate category/subcategory: ${c.category} / ${c.subcategory}`);
    const definition = `${c.category}\0${c.category_order}`;
    if (parents.has(c.category_id) && parents.get(c.category_id) !== definition) errors.push(`Inconsistent parent category: ${c.category_id}`);
    if (names.has(c.category) && names.get(c.category) !== c.category_id) errors.push(`Category label uses multiple IDs: ${c.category}`);
    if (![c.category_order, c.sort_order].every(Number.isFinite)) errors.push(`Invalid category order: ${c.id}`);
    names.set(c.category,c.category_id);parents.set(c.category_id,definition);pairs.add(pair);categoryIds.add(c.id);
  }
  if (!categoryIds.size) errors.push('Categories is empty');
  const urls = new Set();
  for (const r of data.resources) {
    const label = r.name || r.id || '(unnamed row)';
    if (!/^[\w-]+$/.test(r.id) || resourceIds.has(r.id)) errors.push(`Invalid or duplicate resource ID: ${label}`);
    resourceIds.add(r.id);
    if (!STATUSES.includes(r.status)) errors.push(`Invalid status: ${label}`);
    // Incomplete drafts are safe to save; published rows must be complete.
    if (r.status !== 'Published') continue;
    if (!clean(r.name) || !clean(r.description)) errors.push(`Missing name or description: ${label}`);
    if (!httpUrl(r.url)) errors.push(`Invalid website URL: ${label}`);
    if (r.logo_url && (!httpUrl(r.logo_url) || !r.logo_url.startsWith('https://'))) errors.push(`Logo must be an HTTPS URL: ${label}`);
    if (!categoryIds.has(r.primary_placement)) errors.push(`Unknown category/subcategory: ${label}`);
    if (!COSTS.includes(r.cost) || !AUDIENCES.includes(r.audience) || !LEVELS.includes(r.level)) errors.push(`Invalid filter value: ${label}`);
    if (!Number.isFinite(r.sort_order)) errors.push(`Invalid sort order: ${label}`);
    // Optional public credit ("Suggested by"), copied in by the editor only after the submitter opted in.
    // A short display name: no control characters, no email addresses, at most 60 characters.
    if (r.suggested_by && (typeof r.suggested_by !== 'string' || r.suggested_by.length > 60 || /[\u0000-\u001f\u007f<>]/.test(r.suggested_by) || /\S+@\S+\.\S+/.test(r.suggested_by)))
      errors.push(`Suggested by must be a short display name (no email address): ${label}`);
    if (httpUrl(r.url)) {
      const u = new URL(r.url); u.hash=''; u.hostname=u.hostname.replace(/^www\./,'');u.pathname=u.pathname.replace(/\/$/,'');
      const key=u.href.replace(/\/$/,'');
      if (urls.has(key)) errors.push(`Duplicate published URL: ${label}`);
      urls.add(key);
    }
  }
  for (const p of data.placements) {
    if (!resourceIds.has(p.resource_id) || !categoryIds.has(p.placement_id)) errors.push(`Unknown additional placement: ${p.resource_id} / ${p.placement_id}`);
    // Optional, placement-specific rank (0 or absent = unranked). Lets a subject order its cross-listings without
    // changing the resource's rank in its home subject.
    if (p.sort_order !== undefined && !Number.isFinite(p.sort_order)) errors.push(`Invalid placement sort order: ${p.resource_id} / ${p.placement_id}`);
  }
  if (errors.length) throw new Error(errors.slice(0,20).join('; '));
  return data;
}

// Explicit allowlist: editorial fields and draft contents never enter a public response.
export function publicCatalogue(data) {
  validateCatalogue(data);
  const resources = data.resources.filter(r=>r.status==='Published').map(r=>({
    id:r.id,name:r.name,url:r.url,description:r.description,primary_placement:r.primary_placement,
    best_for:r.best_for||'',logo_url:r.logo_url||'',cost:r.cost,audience:r.audience,
    level:r.level,tags:r.tags||'',sort_order:r.sort_order,
    ...(clean(r.suggested_by)?{suggested_by:clean(r.suggested_by)}:{})
  }));
  const ids=new Set(resources.map(r=>r.id));
  return {
    schema_version:1,
    categories:data.categories.map(c=>({id:c.id,category_id:c.category_id,category:c.category,subcategory:c.subcategory,category_order:c.category_order,sort_order:c.sort_order})),
    resources,
    placements:data.placements.filter(p=>ids.has(p.resource_id)).map(p=>({resource_id:p.resource_id,placement_id:p.placement_id,...(p.sort_order>0?{sort_order:p.sort_order}:{})}))
  };
}

function rowsAsObjects(rows, required, name) {
  if (!rows?.length) throw new Error(`${name} has no header row`);
  const headers=rows[0].map(clean);
  if (new Set(headers).size !== headers.length) throw new Error(`${name} contains duplicate column headers`);
  for(const field of required) if(!headers.includes(field)) throw new Error(`${name} is missing the ${field} column`);
  return rows.slice(1).filter(row=>row.some(v=>clean(v))).map(row=>Object.fromEntries(headers.map((h,i)=>[h,clean(row[i])])));
}

export function catalogueFromSheet(valueRanges) {
  if (valueRanges.length!==3) throw new Error('Expected Resources, Categories and Additional placements');
  const resourceRows=rowsAsObjects(valueRanges[0].values,['Name','URL','Description','Category','Subcategory','Status','ID'],'Resources');
  const categories=rowsAsObjects(valueRanges[1].values,['Category','Subcategory','Category ID','Subcategory ID','Category order','Subcategory order'],'Categories').map(r=>({
    id:r['Subcategory ID'],category_id:r['Category ID'],category:r.Category,subcategory:r.Subcategory,
    category_order:r['Category order']===''?NaN:Number(r['Category order']),sort_order:r['Subcategory order']===''?NaN:Number(r['Subcategory order'])
  }));
  const placement=(category,sub)=>categories.find(c=>c.category===category && c.subcategory===sub)?.id || '';
  const resources=resourceRows.map(r=>({
    id:r.ID,name:r.Name,url:r.URL,description:r.Description,primary_placement:placement(r.Category,r.Subcategory),
    status:r.Status||'Draft',cost:r.Cost||'Unknown',audience:r.Audience||'General',level:r.Level||'Not specified',
    best_for:r['Best for']||'',logo_url:r['Logo URL']||'',tags:r.Tags||'',sort_order:Number(r['Sort order']||0),
    // Optional column T "Suggested by"; sheets without it parse exactly as before.
    ...(r['Suggested by']?{suggested_by:r['Suggested by']}:{})
  }));
  // 'Sort order' is an optional column on Additional placements; sheets without it parse exactly as before.
  const placements=rowsAsObjects(valueRanges[2].values,['Resource ID','Category','Subcategory'],'Additional placements').map(r=>({resource_id:r['Resource ID'],placement_id:placement(r.Category,r.Subcategory),...(r['Sort order']?{sort_order:Number(r['Sort order'])}:{})}));
  return validateCatalogue({schema_version:1,categories,resources,placements});
}
