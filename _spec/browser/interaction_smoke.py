import asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(headless=True,args=['--disable-crash-reporter']);page=await b.new_page();out=[]
  for w in [375,768,1024,1440]:
   await page.set_viewport_size({'width':w,'height':900});await page.goto('http://127.0.0.1:8765/',wait_until='domcontentloaded');await page.evaluate('document.fonts.ready')
   r={'width':w,'worksBefore':await page.locator('.c-worksCard:visible').count()}
   await page.locator('[data-show-works]:visible').first.click();r['worksAfter']=await page.locator('.c-worksCard:visible').count();r['scrollWidth']=await page.evaluate('document.documentElement.scrollWidth')
   if w<=800:
    await page.locator('#menuBtn').click();r['menuOpen']=await page.locator('#menuBtn').get_attribute('aria-expanded')=='true';await page.keyboard.press('Escape');r['escapeClosed']=await page.locator('#menuBtn').get_attribute('aria-expanded')=='false'
   else:
    await page.locator('.bs-nav-item').first.hover();r['submenu']=await page.locator('.bs-submenu').first.bounding_box();await page.screenshot(path=f'_verify/desktop-menu-{w}.png')
   assert r['worksBefore']==12 and r['worksAfter']==16 and r['scrollWidth']<=w
   out.append(r)
  Path('_spec/browser/interaction-smoke.json').write_text(json.dumps(out,indent=2));print(out);await b.close()
asyncio.run(main())
