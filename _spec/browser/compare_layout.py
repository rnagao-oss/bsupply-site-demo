"""Capture live reference/local DOM metrics and compare explicitly mapped elements."""
import argparse
import asyncio
from collections import Counter, defaultdict
from datetime import datetime, timezone
import json
import os
from pathlib import Path

ROOT = Path('/tmp/bsupply-site-demo')
OUT = ROOT / '_spec/browser'
TMP = ROOT / '_verify/tmp'
TMP.mkdir(parents=True, exist_ok=True)
os.environ['TMPDIR'] = str(TMP)
os.environ['PYTHONDONTWRITEBYTECODE'] = '1'
from playwright.async_api import async_playwright

WIDTHS = [375, 768, 1024, 1440]
HEIGHT = 900
MEASUREMENT_VERSION = '3-normal-lineheight-probe'
MAPPING_FILES = ['lower-mapping.json', 'career-case-mapping.json', 'top-mapping.json']

MEASURE = r'''(selectors) => {
 const px = value => /^-?(?:\d+\.?\d*|\.\d+)px$/.test(value) ? parseFloat(value) : null;
 const visible = e => {if(!e)return false;const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};
 const normalLineHeight = source => {
  const probe=document.createElement('span');
  probe.style.cssText='all:initial!important;position:absolute!important;left:-100000px!important;top:0!important;display:inline-block!important;visibility:hidden!important;white-space:pre!important;padding:0!important;margin:0!important;border:0!important;line-height:normal!important;';
  for(const property of ['font-family','font-size','font-weight','font-style','font-stretch','letter-spacing'])probe.style.setProperty(property,source.getPropertyValue(property),'important');
  probe.textContent='M\nM';document.body.appendChild(probe);
  try{const first=document.createRange(),second=document.createRange();first.setStart(probe.firstChild,0);first.setEnd(probe.firstChild,1);second.setStart(probe.firstChild,2);second.setEnd(probe.firstChild,3);const pitch=second.getBoundingClientRect().top-first.getBoundingClientRect().top;return Number.isFinite(pitch)&&pitch>0?pitch:null;}finally{probe.remove();}
 };
 const measure = selector => {
  let e;try{e=document.querySelector(selector)}catch(error){return {status:'invalid-selector',error:String(error)}}
  if(!e)return {status:'missing'};
  const r=e.getBoundingClientRect(),s=getComputedStyle(e),rects=[];
  const walker=document.createTreeWalker(e,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.textContent.trim()&&!n.parentElement.closest('script,style,svg desc,svg title,noscript')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});
  let n;while(n=walker.nextNode()){
   if(!visible(n.parentElement))continue;
   const range=document.createRange();range.selectNodeContents(n);
   for(const q of range.getClientRects())if(q.width>0&&q.height>0)rects.push({x:q.x,y:q.y,width:q.width,height:q.height});
  }
  rects.sort((a,b)=>a.y-b.y||a.x-b.x);
  const lines=[];
  for(const q of rects){let line=lines.find(l=>Math.abs(l.y-q.y)<=2||Math.min(l.bottom,q.y+q.height)-Math.max(l.y,q.y)>Math.min(l.height,q.height)*.5);if(!line)lines.push({y:q.y,bottom:q.y+q.height,height:q.height});else{line.y=Math.min(line.y,q.y);line.bottom=Math.max(line.bottom,q.y+q.height);line.height=line.bottom-line.y;}}
  lines.sort((a,b)=>a.y-b.y);
  const pitches=lines.slice(1).map((l,i)=>l.y-lines[i].y).filter(v=>v>2).sort((a,b)=>a-b);
  const observedLinePitch=pitches.length?pitches[Math.floor(pitches.length/2)]:null;
  const childRects=[...e.children].filter(visible).map(c=>c.getBoundingClientRect());
  const top=childRects.length?Math.min(...childRects.map(q=>q.y)):null;
  const firstRow=childRects.filter(q=>Math.abs(q.y-top)<=2).sort((a,b)=>a.x-b.x);
  const rowYs=[...new Set(childRects.map(q=>Math.round(q.y*10)/10))].sort((a,b)=>a-b);
  const columnGaps=firstRow.slice(1).map((q,i)=>q.x-firstRow[i].right);
  let observedColumnGap=columnGaps.length?columnGaps.reduce((a,b)=>a+b,0)/columnGaps.length:null;
  let observedRowGap=null;
  if(rowYs.length>1){let previous=childRects.filter(q=>Math.abs(q.y-rowYs[0])<2);observedRowGap=rowYs[1]-Math.max(...previous.map(q=>q.bottom));}
  let svgInk=null;
  if(e instanceof SVGGraphicsElement){try{const b=e.getBBox(),m=e.getScreenCTM();if(m){const points=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(m));svgInk={x:Math.min(...points.map(p=>p.x)),y:Math.min(...points.map(p=>p.y)),width:Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x)),height:Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y)),method:'getBBox transformed by getScreenCTM'};}}catch(error){}}
  const values={x:r.x,y:r.y+scrollY,width:r.width,height:r.height,fontSize:px(s.fontSize),lineHeight:px(s.lineHeight),inkHeight:svgInk?svgInk.height:lines.length?px(s.fontSize)*lines.length:null,columns:firstRow.length||null};
  const methods={lineHeight:values.lineHeight===null?'unavailable: normal with fewer than two observed lines':'computed pixels',inkHeight:svgInk?'SVG getBBox/screenCTM':'fontSize × distinct Range line positions',columns:'visible direct children in first observed row'};
  if(values.lineHeight===null&&s.lineHeight==='normal'&&observedLinePitch!==null){values.lineHeight=observedLinePitch;methods.lineHeight='observed Range line pitch (computed normal)';}
  if(values.lineHeight===null&&s.lineHeight==='normal'){values.lineHeight=normalLineHeight(s);methods.lineHeight=values.lineHeight===null?'unavailable: offscreen probe failed':'observed two-line offscreen M probe with computed font properties (normal)';}
  for(const key of ['paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginRight','marginBottom','marginLeft','columnGap','rowGap','gap'])values[key]=px(s[key]);
  const gapLayout=/^(inline-)?(flex|grid)$/.test(s.display);
  if(!gapLayout&&s.columnGap==='normal'){methods.columnGap='not applicable: normal columnGap outside flex/grid layout';}
  if(!gapLayout&&s.rowGap==='normal'){methods.rowGap='not applicable: normal rowGap outside flex/grid layout';}
  if(gapLayout&&values.columnGap===null&&observedColumnGap!==null){values.columnGap=observedColumnGap;methods.columnGap='observed adjacent child rectangles';}
  if(gapLayout&&values.rowGap===null&&observedRowGap!==null){values.rowGap=observedRowGap;methods.rowGap='observed adjacent child rows';}
  if(values.gap===null&&values.rowGap!==null&&values.rowGap===values.columnGap){values.gap=values.rowGap;methods.gap='equal observed row and column gaps';}
  if(values.gap===null){methods.gap='unavailable as a single scalar: rowGap='+values.rowGap+', columnGap='+values.columnGap+'; see separately observed axes';}
  return {status:visible(e)?'visible':'hidden',tag:e.tagName,text:e.textContent.trim().slice(0,240),values,methods,fontFamily:s.fontFamily,fontWeight:s.fontWeight,lineHeightCSS:s.lineHeight,columnGapCSS:s.columnGap,rowGapCSS:s.rowGap,display:s.display,visibility:s.visibility,lineCount:lines.length,lineYs:lines.map(l=>l.y+scrollY),observedLinePitch,svgInk};
 };
 return {url:location.href,viewportWidth:innerWidth,viewportHeight:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,elements:Object.fromEntries(selectors.map(selector=>[selector,measure(selector)]))};
}'''


def now():
    return datetime.now(timezone.utc).isoformat()


def read_mappings():
    mappings = []
    for filename in MAPPING_FILES:
        path = ROOT / '_spec/partials' / filename
        if path.exists():
            data = json.loads(path.read_text())
            mappings.extend(data if isinstance(data, list) else [data])
    return mappings


def reference_selectors(mapping):
    selectors = {p['reference_selector'] for p in mapping['pairs']}
    for prefix, replacement in mapping.get('mobile_reference_overrides', {}).items():
        selectors.update(s.replace(prefix, replacement, 1) for s in list(selectors) if s.startswith(prefix))
    for pair in mapping['pairs']:
        selectors.update(pair.get('reference_selector_by_width', {}).values())
    return selectors


async def prepare(page, url, reference):
    response = await page.goto(url, wait_until='domcontentloaded', timeout=60000)
    await page.wait_for_timeout(2200 if reference else 250)
    try:
        await page.evaluate('() => Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,15000))])')
    except Exception:
        pass
    # Trigger existing lazy-loading and intersection behavior, then measure document coordinates.
    height = await page.evaluate('document.documentElement.scrollHeight')
    for y in range(0, height, 750):
        await page.evaluate('(y)=>scrollTo(0,y)', y)
        await page.wait_for_timeout(60 if reference else 8)
    await page.evaluate('scrollTo(0,0)')
    await page.wait_for_timeout(1600 if reference else 200)
    return response.status if response else None


async def capture(browser, sem, url, selectors, width, label, reference):
    async with sem:
        ctx = await browser.new_context(viewport={'width': width, 'height': HEIGHT}, reduced_motion='reduce')
        try:
            page = await ctx.new_page()
            status = await prepare(page, url, reference)
            data = await page.evaluate(MEASURE, sorted(selectors))
            data.update(captured_at=now(), requested_url=url, http_status=status, viewport_height=HEIGHT, measurement_version=MEASUREMENT_VERSION)
            print(f"captured {'reference' if reference else 'local'} {label} {width}: {len(data['elements'])} selectors", flush=True)
            return data
        except Exception as error:
            print(f'ERROR {label} {width}: {error!r}', flush=True)
            return {'captured_at': now(), 'requested_url': url, 'error': repr(error), 'elements': {}}
        finally:
            await ctx.close()


async def reference_cache(browser, mappings, sem, refresh):
    path = OUT / 'reference-pairs.json'
    cache = json.loads(path.read_text()) if path.exists() and not refresh else {'method': 'Live Chromium DOM; getBoundingClientRect and computed styles; descendant text-node Range line positions; SVG getBBox/screenCTM.', 'viewport_height': HEIGHT, 'captures': {}}
    if cache.get('measurement_version') != MEASUREMENT_VERSION:
        cache['captures'] = {}
    cache['measurement_version'] = MEASUREMENT_VERSION
    cache['method'] = 'Live Chromium DOM; rectangle/computed styles; descendant text Range line positions; normal lineHeight by actual multiline pitch or offscreen two-line M probe with computed font properties; SVG getBBox/screenCTM.'
    groups = {}
    for mapping in mappings:
        family = mapping['reference_family']
        group = groups.setdefault(family, {'url': mapping['reference_url'], 'selectors': set()})
        if group['url'] != mapping['reference_url']:
            raise ValueError(f'Conflicting reference URLs for {family}')
        group['selectors'].update(reference_selectors(mapping))
    tasks = []
    keys = []
    for family, group in groups.items():
        for width in WIDTHS:
            key = f'{family}:{width}'
            previous = cache['captures'].get(key, {})
            if previous.get('requested_url') == group['url'] and group['selectors'].issubset(previous.get('elements', {})) and not previous.get('error'):
                continue
            keys.append(key)
            tasks.append(capture(browser, sem, group['url'], group['selectors'], width, family, True))
    for key, data in zip(keys, await asyncio.gather(*tasks)):
        cache['captures'][key] = data
    cache['updated_at'] = now()
    path.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + '\n')
    return cache


def resolve_reference(mapping, pair, width, captured):
    selector = pair.get('reference_selector_by_width', {}).get(str(width), pair['reference_selector'])
    original = captured.get('elements', {}).get(selector, {'status': 'missing'})
    if original.get('status') != 'visible':
        for prefix, replacement in mapping.get('mobile_reference_overrides', {}).items():
            if selector.startswith(prefix):
                candidate = selector.replace(prefix, replacement, 1)
                if captured.get('elements', {}).get(candidate, {}).get('status') == 'visible':
                    return candidate
    return selector


def comparison_rows(mappings, references, locals_):
    rows = []
    for mapping in mappings:
        for width in WIDTHS:
            reference = references['captures'].get(f"{mapping['reference_family']}:{width}", {})
            local = locals_.get(f"{mapping['page']}:{width}", {})
            for pair in mapping['pairs']:
                if pair.get('widths') and width not in pair['widths']:
                    continue
                ref_selector = resolve_reference(mapping, pair, width, reference)
                ref = reference.get('elements', {}).get(ref_selector, {'status': 'missing'})
                own = local.get('elements', {}).get(pair['local_selector'], {'status': 'missing'})
                for metric in pair['metrics']:
                    rv = ref.get('values', {}).get(metric)
                    lv = own.get('values', {}).get(metric)
                    available = isinstance(rv, (int, float)) and isinstance(lv, (int, float)) and ref.get('status') == 'visible' and own.get('status') == 'visible'
                    delta = lv - rv if available else None
                    threshold = 0 if metric == 'columns' else 4
                    declared_na = pair.get('not_applicable_reason')
                    not_applicable = bool(declared_na) or ref.get('methods', {}).get(metric, '').startswith('not applicable:') and ref.get('status') == 'visible' and own.get('status') == 'visible' and ref.get('display') == own.get('display')
                    status = 'not_applicable' if not_applicable else 'pass' if available and abs(delta) <= threshold else 'fail' if available else 'unavailable'
                    rows.append({'viewport_width': width, 'viewport_height': HEIGHT, 'page': mapping['page'], 'reference_family': mapping['reference_family'], 'reference_url': reference.get('url', mapping['reference_url']), 'reference_selector': ref_selector, 'local_selector': pair['local_selector'], 'metric': metric, 'reference': rv, 'local': lv, 'delta_px': delta, 'status': status, 'reference_status': ref.get('status'), 'local_status': own.get('status'), 'reference_method': ref.get('methods', {}).get(metric, 'getBoundingClientRect' if metric in ['x', 'y', 'width', 'height'] else 'computed pixels'), 'local_method': own.get('methods', {}).get(metric, 'getBoundingClientRect' if metric in ['x', 'y', 'width', 'height'] else 'computed pixels'), 'reference_captured_at': reference.get('captured_at'), 'local_captured_at': local.get('captured_at'), 'status_reason': declared_na or ('reference/local element is missing or hidden' if ref.get('status') != 'visible' or own.get('status') != 'visible' else ref.get('methods', {}).get(metric, 'no numeric measurement') if not available else None)})
    return rows


def summarize(rows, locals_):
    failures = defaultdict(list)
    unavailable = defaultdict(list)
    not_applicable = defaultdict(list)
    for row in rows:
        key = row['page']
        short = {k: row[k] for k in ['viewport_width', 'local_selector', 'metric', 'reference', 'local', 'delta_px']}
        if row['status'] == 'fail': failures[key].append(short)
        elif row['status'] == 'not_applicable': not_applicable[key].append({**short, 'reason': row.get('status_reason') or row['reference_method']})
        elif row['status'] == 'unavailable': unavailable[key].append({**short, 'reference_status': row['reference_status'], 'local_status': row['local_status']})
    summary = {'captured_at': now(), 'row_status_counts': dict(Counter(r['status'] for r in rows)), 'failures_by_page': dict(failures), 'unavailable_by_page': dict(unavailable), 'not_applicable_by_page': dict(not_applicable), 'overflow': [{'page_width': key, 'scrollWidth': value.get('scrollWidth'), 'viewportWidth': value.get('viewportWidth')} for key, value in locals_.items() if value.get('scrollWidth', 0) > value.get('viewportWidth', 0)]}
    (OUT / 'comparison-summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
    print('ROWS ' + json.dumps(summary['row_status_counts']) + f"; overflow {len(summary['overflow'])}", flush=True)
    for page, failed in failures.items():
        metrics = Counter(r['metric'] for r in failed)
        max_delta = max(abs(r['delta_px']) for r in failed)
        print(f'FAIL {page}: {len(failed)} rows, max {max_delta:.2f}px, metrics {dict(metrics)}', flush=True)
    for page, missing in unavailable.items():
        print(f'UNAVAILABLE {page}: {len(missing)} rows', flush=True)


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--reference-only', action='store_true')
    parser.add_argument('--refresh-reference', action='store_true')
    parser.add_argument('--pages', nargs='*')
    parser.add_argument('--base-url', default='http://127.0.0.1:8765')
    args = parser.parse_args()
    mappings = read_mappings()
    if args.pages:
        mappings = [m for m in mappings if m['page'] in args.pages]
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True, args=['--disable-crash-reporter', '--disable-breakpad', f'--disk-cache-dir={TMP / "chromium-cache"}', f'--crash-dumps-dir={TMP / "crash-dumps"}'])
        sem = asyncio.Semaphore(3)
        references = await reference_cache(browser, mappings, sem, args.refresh_reference)
        if not args.reference_only:
            keys, tasks = [], []
            for mapping in mappings:
                for width in WIDTHS:
                    keys.append(f"{mapping['page']}:{width}")
                    tasks.append(capture(browser, sem, args.base_url.rstrip('/') + '/' + mapping['page'], {pair['local_selector'] for pair in mapping['pairs']}, width, mapping['page'], False))
            locals_ = dict(zip(keys, await asyncio.gather(*tasks)))
            (OUT / 'local-pairs.json').write_text(json.dumps({'captured_at': now(), 'measurement_version': MEASUREMENT_VERSION, 'captures': locals_}, ensure_ascii=False, indent=2) + '\n')
            rows = comparison_rows(mappings, references, locals_)
            (OUT / 'comparison-rows.json').write_text('[\n' + ',\n'.join(json.dumps(row, ensure_ascii=False, separators=(',', ':')) for row in rows) + '\n]\n')
            summarize(rows, locals_)
        await browser.close()


if __name__ == '__main__':
    asyncio.run(main())
