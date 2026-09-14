import asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path('/tmp/bsupply-site-demo')
JS=r'''(reference) => {
const r=e=>{if(!e)return null;const q=e.getBoundingClientRect();return {x:q.x,y:q.y,width:q.width,height:q.height,right:q.right,bottom:q.bottom}};
const header=document.querySelector(reference?'.l-fixed':'.bs-header');
const logo=document.querySelector(reference?'.l-fixed__head__title svg':'.bs-brand img');
const button=document.querySelector(reference?'.l-fixed__btn':'.bs-menu-button');
const nav=document.querySelector(reference?'.l-nav':'.bs-navigation');
const items=[...document.querySelectorAll(reference?'.l-nav>.l-nav__item:not(.u-showMedium)':'.bs-nav-item')].map(r).filter(a=>a&&a.width);
const gaps=items.slice(1).map((q,i)=>innerWidth>800?q.x-items[i].right:q.y-items[i].bottom);
const title=document.querySelector('.hero-title');
let ink=null;
if(reference){const svg=[...document.querySelectorAll('.svg-mv-copy')].find(e=>e.getBoundingClientRect().width);if(svg){const path=svg.querySelector('path:not([class])'),b=path.getBBox(),m=path.getScreenCTM();ink={fontSize:null,lineCount:innerWidth<=600?2:1,height:b.height*m.d,y:m.d*b.y+m.f};}}
else if(title){const spans=[...title.querySelectorAll('span')];const ys=[...new Set(spans.map(e=>Math.round(e.getBoundingClientRect().y)))];ink={fontSize:parseFloat(getComputedStyle(title).fontSize),lineCount:ys.length,height:parseFloat(getComputedStyle(title).fontSize)*ys.length,y:title.getBoundingClientRect().y};}
return {width:innerWidth,header:r(header),backgroundHeight:parseFloat(getComputedStyle(header,'::before').height),logo:r(logo),button:r(button),nav:r(nav),items,gaps,ink,scrollWidth:document.documentElement.scrollWidth};
}'''
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(headless=True,args=['--disable-crash-reporter']);out=[]
  for w in [375,768,1024,1440]:
   row={'width':w}
   for reference,url in [(True,'https://sun-asterisk.com/'),(False,'http://127.0.0.1:8765/')]:
    page=await b.new_page(viewport={'width':w,'height':900},reduced_motion='reduce');await page.goto(url,wait_until='domcontentloaded');await page.evaluate('document.fonts.ready');await page.wait_for_timeout(8200 if reference else 100)
    d=await page.evaluate(JS,reference)
    if w<=800:
     await page.locator('.l-fixed__btn' if reference else '.bs-menu-button').click();await page.wait_for_timeout(700 if reference else 50);d['open']=await page.evaluate(JS,reference)
    row['reference' if reference else 'local']=d;await page.close()
   out.append(row);print(w,flush=True)
  (ROOT/'_spec/browser/common-measurements.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));await b.close()
asyncio.run(main())
