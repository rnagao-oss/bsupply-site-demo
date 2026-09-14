import asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(headless=True,args=['--disable-crash-reporter']);page=await b.new_page(reduced_motion='reduce');out=[]
  for w in [375,768,1024,1440]:
   await page.set_viewport_size({'width':w,'height':900});await page.goto('https://sun-asterisk.com/',wait_until='domcontentloaded');await page.wait_for_timeout(2500)
   out.append(await page.evaluate('''() => ({width:innerWidth,ink:[...document.querySelectorAll('.svg-mv-copy')].filter(e=>e.getBoundingClientRect().width).map(e=>{const m=e.getScreenCTM();const paths=[...e.querySelectorAll('path')].map(p=>{const b=p.getBBox();return {cls:p.getAttribute('class'),x:b.x,y:b.y,width:b.width,height:b.height,screenX:m.a*b.x+m.e,screenY:m.d*b.y+m.f,screenWidth:m.a*b.width,screenHeight:m.d*b.height}});return paths})})'''))
  Path('_spec/browser/reference-ink.json').write_text(json.dumps(out,indent=2));await b.close()
asyncio.run(main())
