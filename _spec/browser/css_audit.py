from pathlib import Path
from collections import Counter
import json,tinycss2
from tinycss2.color3 import parse_color
ROOT=Path(__file__).resolve().parents[2]
media=Counter();issues=[];fonts=[]
def check(rules):
 for r in rules:
  if r.type=='error':issues.append({'parse_error':r.message})
  elif r.type=='at-rule':
   if r.lower_at_keyword=='media':
    media[tinycss2.serialize(r.prelude).strip()]+=1
    children=tinycss2.parse_rule_list(r.content,skip_comments=True,skip_whitespace=True)
    if not children:issues.append({'empty_media':tinycss2.serialize(r.prelude)})
    check(children)
   elif r.lower_at_keyword=='font-face':fonts.append(tinycss2.serialize([r]))
  elif r.type=='qualified-rule':
   for d in tinycss2.parse_declaration_list(r.content,skip_comments=True,skip_whitespace=True):
    if d.type!='declaration':continue
    value=tinycss2.serialize(d.value).strip()
    if ('radius' in d.lower_name and value not in ['0','0px']) or ('shadow' in d.lower_name and value!='none') or 'gradient(' in value:issues.append({'selector':tinycss2.serialize(r.prelude),'property':d.lower_name,'value':value})
    for t in d.value:
     if t.type not in ['ident','hash','function']:continue
     c=parse_color(t)
     if c is not None and c!='currentColor' and (c.red!=c.green or c.green!=c.blue):issues.append({'color':tinycss2.serialize([t])})
check(tinycss2.parse_stylesheet((ROOT/'styles.css').read_text(),skip_whitespace=True,skip_comments=True))
expected=json.loads((ROOT/'_spec/reference-css.json').read_text())['media_conditions']
result={'media_count':media.total(),'unique_conditions':len(media),'condition_counts_match':media==expected,'font_faces':len(fonts),'issues':issues}
(ROOT/'_spec/browser/css-audit.json').write_text(json.dumps(result,indent=2));print(result);assert not issues and media==expected and len(fonts)==4
