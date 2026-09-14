import asyncio, json, os
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path('/tmp/bsupply-site-demo'); OUT=ROOT/'_spec/browser'; WIDTHS=[375,768,1024,1440]
URLS={'index':'https://sun-asterisk.com/','company':'https://sun-asterisk.com/about/','consulting':'https://sun-asterisk.com/service/','service-detail':'https://sun-asterisk.com/service/development/cloud/','case-01':'https://sun-asterisk.com/works/kendrix/','recruit':'https://sun-asterisk.com/recruitment/','job-craftsman':'https://sun-asterisk.com/recruitment/new-graduate/','contact':'https://sun-asterisk.com/contact/'}
SCRIPT=r'''() => {
const rect=e=>{let r=e.getBoundingClientRect();return {x:r.x,y:r.y+scrollY,width:r.width,height:r.height}};
const nodes=[...document.querySelectorAll('body *')].filter(e=>{let r=e.getBoundingClientRect();return r.width&&r.height&&!['SCRIPT','STYLE','PATH','G','USE','DEFS','SYMBOL','NOSCRIPT'].includes(e.tagName.toUpperCase())});
const measure=e=>{let s=getComputedStyle(e);let text=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();let lines=[];if(text){const range=document.createRange(); for(const n of e.childNodes){if(n.nodeType!==3||!n.textContent.trim())continue;range.selectNodeContents(n);for(const r of range.getClientRects())if(!lines.some(y=>Math.abs(y-r.y)<2))lines.push(r.y);}}let bbox=null; if(e instanceof SVGElement){try{let b=e.getBBox(),m=e.getScreenCTM();bbox={x:b.x,y:b.y,width:b.width,height:b.height,inkHeight:b.height*Math.hypot(m.c,m.d)}}catch{}}return {tag:e.tagName,cls:typeof e.className==='string'?e.className:e.className.baseVal,id:e.id,text:text.slice(0,350),fullText:/^(H[1-6]|P)$/.test(e.tagName)?e.textContent.trim().slice(0,1000):undefined,...rect(e),font:s.fontFamily,fontSize:parseFloat(s.fontSize),fontWeight:s.fontWeight,lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,lines:lines.length,inkHeight:lines.length*parseFloat(s.fontSize),display:s.display,position:s.position,margin:[s.marginTop,s.marginRight,s.marginBottom,s.marginLeft],padding:[s.paddingTop,s.paddingRight,s.paddingBottom,s.paddingLeft],gap:s.gap,grid:s.gridTemplateColumns,flex:s.flexDirection,bbox,src:e.currentSrc||e.src||null,background:s.backgroundImage==='none'?undefined:s.backgroundImage};};
return {url:location.href,width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,nodes:nodes.map(measure),links:[...document.querySelectorAll('a')].map(e=>({text:e.textContent.trim().slice(0,100),href:e.href}))};
}'''
async def measure(browser,name,url,sem):
 async with sem:
  ctx=await browser.new_context(viewport={'width':1440,'height':900},reduced_motion='reduce')
  page=await ctx.new_page()
  for width in WIDTHS:
   await page.set_viewport_size({'width':width,'height':900})
   await page.goto(url,wait_until='domcontentloaded',timeout=60000)
   await page.wait_for_timeout(2200)
   await page.evaluate('document.fonts.ready')
   for y in range(0,await page.evaluate('document.documentElement.scrollHeight'),700):
    await page.evaluate('(y)=>scrollTo(0,y)',y);await page.wait_for_timeout(60)
   await page.evaluate('scrollTo(0,0)');await page.wait_for_timeout(1600)
   data=await page.evaluate(SCRIPT)
   (OUT/f'reference-{name}-{width}.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
   if width==1440:(OUT/f'{name}.html').write_text(await page.content())
   await page.screenshot(path=str(ROOT/f'_verify/reference-{name}-{width}.png'),full_page=True)
   if name=='index':
    btn=page.locator('.l-fixed__btn')
    if await btn.is_visible():
     await btn.click();await page.wait_for_timeout(800)
     (OUT/f'reference-menu-{width}.json').write_text(json.dumps(await page.evaluate(SCRIPT),ensure_ascii=False,indent=2))
     await page.screenshot(path=str(ROOT/f'_verify/reference-menu-{width}.png'))
    else:
     await page.locator('.l-nav__item').first.hover();await page.wait_for_timeout(700)
     (OUT/f'reference-menu-{width}.json').write_text(json.dumps(await page.evaluate(SCRIPT),ensure_ascii=False,indent=2))
   print(name,width,data['url'],data['scrollWidth'],flush=True)
  await ctx.close()
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(headless=True,args=['--disable-crash-reporter']);sem=asyncio.Semaphore(3)
  results=await asyncio.gather(*(measure(b,n,u,sem) for n,u in URLS.items()),return_exceptions=True)
  for n,r in zip(URLS,results):
   if isinstance(r,Exception):print('ERROR',n,repr(r),flush=True)
  page=await b.new_page()
  checks=[]
  for path in ['company','career']:
   response=await page.goto('https://sun-asterisk.com/'+path+'/',wait_until='domcontentloaded');checks.append({'requested':path,'url':page.url,'status':response.status})
  (OUT/'url-checks.json').write_text(json.dumps(checks,indent=2))
  await b.close()
asyncio.run(main())
