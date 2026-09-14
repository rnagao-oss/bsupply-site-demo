from pathlib import Path
import runpy,tinycss2,json
from collections import Counter
ROOT=Path(__file__).resolve().parents[1]
runpy.run_path(str(ROOT/'_spec/css-build.py'))
rules=tinycss2.parse_stylesheet((ROOT/'styles.css').read_text(),skip_whitespace=True,skip_comments=False)
media={}
for r in rules:
 if r.type=='at-rule' and r.lower_at_keyword=='media':media[tinycss2.serialize(r.prelude).strip()]=r
base=[]; used=[]
for path in sorted((ROOT/'_spec/partials').glob('*.css')):
 for r in tinycss2.parse_stylesheet(path.read_text(),skip_whitespace=True,skip_comments=False):
  if r.type=='at-rule' and r.lower_at_keyword=='media':
   cond=tinycss2.serialize(r.prelude).strip()
   assert cond in media,(path,cond)
   media[cond].content.extend(r.content)
   if cond not in used:used.append(cond)
  else:base.append(r)
# Reuse existing conditional blocks after the shared overrides. Broad max-width
# rules precede narrower ones, so the mobile cascade stays deterministic.
import re
used.sort(key=lambda c: -float(re.search(r'max-width:([\d.]+)',c).group(1)) if re.search(r'max-width:([\d.]+)',c) else -100000)
moved=[media[c] for c in used]
rules=[r for r in rules if all(r is not m for m in moved)]+base+moved
(ROOT/'styles.css').write_text('\n'.join(tinycss2.serialize([r]) for r in rules)+'\n')
actual=Counter(tinycss2.serialize(r.prelude).strip() for r in rules if r.type=='at-rule' and r.lower_at_keyword=='media')
assert actual==Counter(json.loads((ROOT/'_spec/reference-css.json').read_text())['media_conditions'])
print('Integrated',len(list((ROOT/'_spec/partials').glob('*.css'))),'partials;',sum(actual.values()),'media blocks')
