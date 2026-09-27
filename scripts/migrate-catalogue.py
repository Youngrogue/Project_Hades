"""Reconcile the source catalogue; retain original records and editorial provenance."""
from pathlib import Path
import re, json, hashlib
from urllib.parse import urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / 'Tool Directory Project/useful-websites-master-v35.md'
text = SOURCE.read_text()
spec = [
 ('learning','Learning & Knowledge',['School subjects','General knowledge','Courses & tutorials','Coding & technology learning','Books, libraries & research','Study tools']),
 ('design','Design & Visuals',['Inspiration','UI & UX','Graphic design','Images & photography','Icons, fonts & assets','3D & illustration']),
 ('coding','Coding & Development',['App & website builders','Editors & coding assistants','Components & libraries','APIs & developer tools','Hosting & infrastructure','Agent skills','Learning resources']),
 ('audio','Music & Audio',['Listening & discovery','DJing & libraries','Music production','Audio editing & conversion','Voice & transcription','Music learning']),
 ('video','Film, TV & Video',['Watching & discovery','Film & TV guides','Video creation & editing','Recording & streaming','Footage & assets']),
 ('productivity','Productivity & Business',['Notes & documents','Writing & communication','Planning & collaboration','Marketing & business','General AI assistants & automation']),
 ('utilities','Internet & Digital Utilities',['Files & PDFs','General conversion & downloads','Privacy & security','Web tools & archives','Tool discovery']),
 ('careers','Work & Careers',['Jobs & remote work','Freelancing','Expert projects','Career preparation']),
 ('life','Everyday Life',['Food & cooking','Home & DIY','Shopping & wishlists','Travel','Personal finance','Public services & environment']),
 ('explore','Explore & Play',['Games & puzzles','Interactive maps & experiences','Space & nature exploration','Art, culture & curiosities'])
]
categories=[]
for ci,(key,name,subs) in enumerate(spec):
 for si,sub in enumerate(subs):
  categories.append(dict(id=f'{key}-{si+1}',category_id=key,category=name,subcategory=sub,category_order=ci+1,sort_order=si+1))

pattern=r'(?m)^(?:(\d+)\.|-)\s+\*\*\[(.*?)\]\((https?://.*?)\)\*\*'
matches=list(re.finditer(pattern,text,re.S))
raw=[]
for i,m in enumerate(matches):
 tail=text[m.end():matches[i+1].start() if i+1<len(matches) else len(text)]
 tail=re.split(r'\n\s*\n',tail,1)[0]
 desc=re.sub(r'^\s*(?:---|—)\s*','',tail)
 desc=re.sub(r'\*Category:.*','',desc,flags=re.S)
 desc=re.sub(r'\*\*Review needed\.\*\*','',desc)
 desc=re.sub(r'\s+',' ',desc).strip()
 section=list(re.finditer(r'^## (.+)$',text[:m.start()],re.M))[-1][1]
 raw.append(dict(source_number=int(m[1]) if m[1] else None,name=re.sub(r'\s+',' ',m[2]).replace('\\|','|'),url=m[3],description=desc,source_section=section))
assert len([r for r in raw if r['source_number']])==698

mapping={}
def assign(key, ids):
 for item in ids.split(','):
  a,*b=item.strip().split('-')
  for n in range(int(a),int(b[0]) + 1 if b else int(a)+1): mapping[n]=key

# Broad runs are followed by individually reviewed exceptions.
for key,ids in {
 'learning-3':'1-20,540-575','learning-1':'21-35,580-609,620',
 'learning-4':'36-46,150-151,153-175,181,576-579,619,656-659,663',
 'learning-5':'47-64,249-251,255,296,307,309-312,320',
 'learning-2':'66-71,149,204,262-264,293-294,306,308,322,585-590,610-616',
 'design-4':'72-76,129-130,133,135-137,324-327,397-443,481,493',
 'design-2':'77,80-82,121-123,336,345,347,349-351,456,459,484,520,527,633-637,670',
 'design-5':'124-127,140-142,464,499-518,525',
 'design-1':'269-286,532-538,622,654,665,678-679',
 'coding-4':'78-79,113-114,143-148,156,176-180,323,460,466,528,671',
 'coding-3':'346,348,465,522-524,526,539',
 'coding-2':'331,462,478,672','coding-1':'332-334,467,477,485,669,685',
 'coding-5':'623-632','coding-6':'638-647,667',
 'utilities-3':'83,85-87,90-91','utilities-1':'84,88,108-109','utilities-4':'89,92-95,128,248,666',
 'utilities-2':'97,131-132,651','utilities-5':'98,110-112,461,472',
 'productivity-1':'65,96,120,335,476,488','productivity-2':'338,487,489,495',
 'productivity-4':'343,458,486','productivity-5':'337,340,344,470,475,490-492,496-498,686',
 'video-1':'99,182-203,650','video-2':'244-245,621,661-662','video-5':'138-139,246-247,305,529',
 'video-3':'115,328-330,339,341,457,468,471,479-480,482-483,668,680',
 'audio-1':'100-105,205-216,219-224,241-243,318-319,342,521,649',
 'audio-3':'118,494,613,676-677','audio-5':'119,463,474','audio-4':'652-653','audio-2':'673-675','audio-6':'612',
 'careers-1':'444-446,455,684','careers-2':'447-454','careers-3':'681-683',
 'life-4':'106,259-260','life-3':'107,392-396,664','life-2':'352-365','life-5':'369-373',
 'life-6':'366,374-391','life-1':'655',
 'explore-1':'231-233,237,617-618','explore-2':'230,234-240,261,287-292,295,297-299,531',
 'explore-3':'256-258,301-304','explore-4':'225-229,252-254,265-268,300,313-317,530',
}.items(): assign(key,ids)
for key,ids in {
 'learning-4':'3,41-46,153-155,157-161,162-175,181,545,548-550,553-554,566-572',
 'coding-2':'36','coding-4':'37-40','learning-5':'217-218,519',
 'design-3':'116-117,134','design-6':'362,469','learning-6':'21,27-28,473,660',
 'explore-3':'152',
 'utilities-4':'367-368,321','explore-1':'582-584','learning-3':'648',
}.items(): assign(key,ids)

# Owner intake: use existing subject categories; Mac remains a searchable tag.
assign('design-1','687')
assign('design-1','688')
assign('coding-2','689')
assign('productivity-5','690')
assign('coding-3','691')
assign('coding-3','692')
assign('coding-3','693')
assign('coding-3','694')
assign('utilities-4','695')
assign('utilities-4','696')
assign('coding-1','697')
assign('productivity-2','698')
assert set(mapping)==set(range(1,699)),sorted(set(range(1,699))-set(mapping))

def normalize(url):
 p=urlsplit(url)
 host=p.netloc.lower().removeprefix('www.')
 return urlunsplit(('https',host,p.path.rstrip('/'),p.query,''))

# Evidenced same-resource aliases; retain every original URL in the provenance.
merge_numbers={468:328,519:53,521:241,529:246,530:252,531:261,240:238}
url_for_number={r['source_number']:r['url'] for r in raw if r['source_number']}
resources=[]; by_url={}; provenance=[]
for r in raw:
 n=r['source_number']; url=r['url']; key=normalize(url_for_number.get(merge_numbers.get(n),url))
 if key in by_url:
  saved=by_url[key]
  saved['source_entries'].append(str(n) if n else r['name'])
  if url!=saved['url'] and url not in saved['alternate_urls']: saved['alternate_urls'].append(url)
  provenance.append(dict(**r,resource_id=saved['id'],action='merged'))
  continue
 if n: placement=mapping[n]
 else:
  placement='coding-6'
  if any(x in r['name'] for x in ['Marketing','Social Media','Small Business','Legal','Finance']): placement='productivity-4'
  if r['name'] in ['TradingAgents']: placement='life-5'
  if r['name'] in ['LibreChat','OpenBot']: placement='productivity-5'
  if r['name']=='GenOffice': placement='productivity-1'
  if r['name'] in ['HyperFrames','MoneyPrinterTurbo']: placement='video-3'
  if r['name']=='VoxCPM': placement='audio-5'
  if r['name'] in ['opencodex','OpenHands']: placement='coding-2'
 rid='h-'+hashlib.sha256(key.encode()).hexdigest()[:10]
 desc=r['description'].replace('**','').replace('\\','')
 flagged=n in [476,651,658,668,669,670,671]
 desc=re.sub(r' Description needs .*$', '', desc)
 desc=re.sub(r'User-submitted resource; description awaiting verification\.', '', desc)
 resource=dict(id=rid,name=r['name'],url=url,description=desc,primary_placement=placement,
  best_for='',logo_url='',cost='Unknown',audience='General',level='Not specified',tags='',
  status='Draft' if flagged else 'Published',sort_order=0,last_verified='',
  review_status='Needs review' if flagged else 'Imported',editorial_notes='Imported description; current availability and access not rechecked.',
  source_entries=[str(n) if n else r['name']],alternate_urls=[])
 if 'Kids & Family' in r['source_section'] and n not in [610,612,613,614,618,621]:
  resource['audience']='Kids & families'
  resource['editorial_notes']+=' Audience based on source collection; review suitability for the intended child.'
 resources.append(resource);by_url[key]=resource
 provenance.append(dict(**r,resource_id=rid,action='retained'))

by_num={r['source_number']:next(x for x in resources if x['id']==r['resource_id']) for r in provenance if r['source_number']}
for nums in [[20,4,3,2,569,659,50,12,660,648],[484,136,72,665,654,124,499,73,269,325],[331,332,334,477,685,672,346,627,623,667],[673,674,675,676,677,119,649,100,118,494],[99,244,661,662,680,115,328,471,185,650],[344,475,470,335,96,490,492,488,495,120],[84,108,109,666,85,86,98,131,95,128],[681,682,683,684,448,445,452,450],[655,664,352,356,393,107,106,367],[268,300,302,303,267,231,295,313,238,152]]:
 for order,n in enumerate(nums,1): by_num[n]['sort_order']=order
for n,access,source in [
 (2,'Free','https://openstax.org/about'),(4,'Free','https://ocw.mit.edu/'),
 (20,'Free','https://support.khanacademy.org/hc/en-us/articles/202260114-Does-it-cost-money-to-use-Khan-Academy'),
 (50,'Free','https://www.gutenberg.org/'),(136,'Free','https://www.pexels.com/'),
 (569,'Free','https://www.theodinproject.com/'),(659,'Freemium','https://www.w3schools.com/')]:
 by_num[n]['cost']=access
 by_num[n]['editorial_notes']+=f' Access offering checked 2026-09-24: {source}. This is not a full product audit.'
by_num[686]['best_for']='AI assistance, coding and building AI-powered applications.'
by_num[686]['editorial_notes']='Added at owner request 2026-09-24. Description checked against https://mistral.ai/; pricing not audited.'

# Descriptions checked against official pages on 2026-09-24; access pricing not audited.
by_num[687].update(best_for='Finding references for visual design projects.',tags='design inspiration; websites; branding',editorial_notes='Added at owner request 2026-09-24. Description checked against https://recent.design/; pricing not audited.',alternate_urls=[])
by_num[688].update(best_for='Bringing interface inspiration into AI-assisted development.',tags='MCP; UI; UX; design inspiration',editorial_notes='Added at owner request 2026-09-24. Description checked against https://mobbin.com/mcp; pricing not audited.',alternate_urls=[])
by_num[689].update(best_for='Building and improving software with an AI coding agent.',tags='AI code; coding assistant; MiniMax Agent',editorial_notes='Added at owner request 2026-09-24. Description checked against https://agent.minimax.io/download; pricing not audited. Submitted link https://code.minimax.io/ now points to this product location.',alternate_urls=['https://code.minimax.io/'])
by_num[690].update(best_for='Delegating multi-step work and software support tasks.',tags='AI code; automation; agents',editorial_notes='Added at owner request 2026-09-24. Description checked against https://x.ai/bot; pricing not audited.',alternate_urls=[])
by_num[691].update(best_for='Adding interactive graphics and visual effects to websites.',tags='components; canvas; WebGL; WebGPU',editorial_notes='Added at owner request 2026-09-24. Description checked against https://canvasui.dev/; pricing not audited.',alternate_urls=[])
by_num[692].update(best_for='Creating reusable design apps and branded asset generators.',tags='components; design tools; AI; starter kit',editorial_notes='Added at owner request 2026-09-24. Description checked against https://toolcraft.sh/; pricing not audited.',alternate_urls=[])
by_num[693].update(best_for='Adding expressive activity indicators to AI products.',tags='components; animation; orbs; React; SwiftUI',editorial_notes='Added at owner request 2026-09-24. Description checked against https://libraries.dev/orbs; pricing not audited. Submitted link https://orbs.jakubantalik.com/ now points to this product location.',alternate_urls=['https://orbs.jakubantalik.com/'])
by_num[694].update(best_for='Adding ready-made animated UI elements to web projects.',tags='components; animation; UI',editorial_notes='Added at owner request 2026-09-24. Description checked against https://www.originkit.dev/; pricing not audited.',alternate_urls=[])
by_num[695].update(best_for='Researching and working across browser tabs with AI assistance.',tags='Mac; macOS; browser; AI',editorial_notes='Added at owner request 2026-09-24. Description checked against https://www.diabrowser.com/; pricing not audited.',alternate_urls=[])
by_num[696].update(best_for='Accessing and controlling your Mac from your phone.',tags='Mac; macOS; iPhone; remote control',editorial_notes='Added at owner request 2026-09-24. Description checked against https://maccess.io/; pricing not audited.',alternate_urls=[])
by_num[697].update(best_for='Creating custom Mac utilities and desktop workflows.',tags='Mac; macOS; desktop apps; AI app builder',editorial_notes='Added at owner request 2026-09-24. Description checked against https://www.glaze.app/; pricing not audited.',alternate_urls=[])
by_num[698].update(best_for='Managing Gmail accounts in a dedicated Mac email client.',tags='Mac; macOS; Gmail; email',editorial_notes='Added at owner request 2026-09-24. Description checked against https://mimestream.com/; pricing not audited.',alternate_urls=[])
extra=[]
def cross(nums,placement):
 for n in nums:
  r=by_num[n]
  row=dict(resource_id=r['id'],placement_id=placement)
  if placement!=r['primary_placement'] and row not in extra: extra.append(row)
cross([3,41,42,43,44,45,46,150,151,153,154,155,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,181,545,548,549,550,553,554,566,567,568,569,570,571,576,577,578,579,656,657,658,659,663],'coding-7')
cross([136,137,138,139,404,416,426,434],'video-5')
cross([119,474],'video-3')
cross([612,613],'learning-3')
cross([612,613],'audio-6')
cross([38,40,76,129,130,131,132,133,652,653],'utilities-2')
cross([352,356,591,592,596,614,615],'learning-3')
cross([638,639,640,641,642,643,644,645,646,647,667],'design-2')
cross([194,249,250,251,252,253,254,255,296,311,312,313,314,315,316,317],'learning-5')
cross([467],'careers-4')
cross([61,62,63],'learning-2')
cross([686],'coding-4')
cross([688],'coding-4')
cross([689],'coding-1')
cross([690],'coding-2')
cross([692],'design-3')
cross([695],'productivity-5')


# User requested Turkish-market / Turkish-language resources disabled (2026-09-24).
# Explicit source IDs preserve global services with Turkish founders or locale support.
archived_turkish = {190,191,310,*range(369,387),389,391,395,396,*range(540,545),584,585}
for n in archived_turkish:
 r=by_num[n]
 r['status']='Archived'
 r['editorial_notes']+=' Archived 2026-09-24 at owner request: Turkish-market or Turkish-language resource outside current collection scope.'

payload=dict(schema_version=1,categories=categories,resources=resources,placements=extra)
ROOT.joinpath('data').mkdir(exist_ok=True)
ROOT.joinpath('data/catalogue.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
ROOT.joinpath('data/migration-provenance.json').write_text(json.dumps(dict(source=SOURCE.name,source_count=len(raw),resource_count=len(resources),entries=provenance),ensure_ascii=False,indent=2)+'\n')
print(json.dumps(dict(source_entries=len(raw),numbered_entries=698,unnumbered_entries=len(raw)-698,resources=len(resources),merged=len(raw)-len(resources),published=sum(r['status']=='Published' for r in resources),cross_listings=len(extra),categories={k:sum(r['primary_placement'].startswith(k+'-') for r in resources) for k,_,_ in spec}),indent=2))
