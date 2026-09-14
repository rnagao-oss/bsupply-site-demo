from pathlib import Path
from lxml import html,etree
from collections import Counter
import hashlib,json,re,subprocess
ROOT=Path(__file__).resolve().parents[2]
BASE_REVISION='ff1569aa0407b6b68e8b4da91a883ae94ff04c3a'
def original(name):
 p=ROOT/'_verify/original'/name
 return p.read_bytes() if p.exists() else subprocess.check_output(['git','show',f'{BASE_REVISION}:{name}'],cwd=ROOT)
pages=sorted(ROOT.glob('*.html'));out=[];links=[]
docs={p.name:html.fromstring(p.read_text())for p in pages}
for p in pages:
 s=p.read_text();old=original(p.name).decode();parser=html.HTMLParser();d=html.fromstring(s,parser=parser)
 inline=lambda s:re.findall(r'<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?</script>',s)
 normalize=lambda ss:[x.replace('"inLanguage": ["ja", "en"]','"inLanguage": "ja"') for x in ss]
 protected={}
 for k,pat in [('inline_scripts',None),('hidden',r'<input\b(?=[^>]*type=["\']hidden["\'])[^>]*>'),('forms',r'<form\b[\s\S]*?</form>')]:
  a=normalize(inline(old)) if pat is None else re.findall(pat,old)
  b=inline(s) if pat is None else re.findall(pat,s)
  protected[k]=a==b
 errors=[str(e) for e in parser.error_log if 'HTML_UNKNOWN_TAG' not in e.type_name]
 out.append({'page':p.name,**protected,'main':len(d.xpath('//main')),'h1':len(d.xpath('//h1')),'robots':d.xpath('//meta[@name="robots"]/@content'),'html_errors':errors,'video_count':len(d.xpath('//video')),'duplicate_ids':[k for k,v in Counter(d.xpath('//@id')).items()if v>1]})
 for a in d.xpath('//a[@href]'):
  u=a.get('href')
  if u.startswith(('http','mailto:','tel:','javascript:')):continue
  target,_,anchor=u.partition('#');target=target.split('?')[0]
  file=(ROOT/target)if target else p
  if target in ['./','/']:file=ROOT/'index.html'
  if not file.exists():links.append({'page':p.name,'url':u,'status':'missing_file'})
  elif anchor:
   ids=docs.get(file.name,html.fromstring(file.read_text())).xpath('//@id')
   if anchor not in ids:links.append({'page':p.name,'url':u,'status':'missing_anchor'})
old=original('app.js').decode();new=(ROOT/'app.js').read_text()
def block(s,start,end):return s[s.index(start):s.index(end,s.index(start))]
sphere=block(old,'  /* ── ドットスフィア','  /* ── カーソルオーブ')
contact=block(old,'  /* ── お問い合わせ: AJAX','\n  onScroll();')
summary={'pages':out,'link_errors':links,'sphere_block_unchanged':sphere in new,'contact_block_unchanged':contact in new,'sphere_sha256':hashlib.sha256(sphere.encode()).hexdigest(),'hero_text':''.join(docs['index.html'].xpath('//h1')[0].itertext()),'robots_txt_unchanged':(ROOT/'robots.txt').read_bytes()==original('robots.txt'),'english_directory_absent':not (ROOT/'en').exists()}
(ROOT/'_spec/browser/static-checks.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
bad=[r for r in out if not all(r[k]for k in ['inline_scripts','hidden','forms'])or r['main']!=1 or r['h1']!=1 or r['html_errors']or r['video_count']or r['duplicate_ids']or r['robots']!=['noindex,nofollow']]
print(json.dumps({'pages':len(out),'failed_pages':bad,'links':links,'sphere_unchanged':summary['sphere_block_unchanged'],'contact_unchanged':summary['contact_block_unchanged'],'hero_characters':len(summary['hero_text'])},ensure_ascii=False,indent=2))
assert not bad and not links and summary['sphere_block_unchanged'] and summary['contact_block_unchanged'] and summary['hero_text']=='想いを紡ぎ、新たな価値を創る'
