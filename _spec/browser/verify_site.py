import asyncio,json,ast,sys
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path('/tmp/bsupply-site-demo')
mod=ast.parse((ROOT/'_spec/browser/measure_reference.py').read_text());SCRIPT=next(ast.literal_eval(n.value) for n in mod.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='SCRIPT' for t in n.targets))
KEY=['index','company','consulting','case-01','recruit','job-craftsman','contact']
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,args=['--disable-crash-reporter'])
  result=[];errors=[];interactions=[]
  paths=[ROOT/x for x in sys.argv[1:]] if sys.argv[1:] else sorted(ROOT.glob('*.html'))
  ctx=await browser.new_context(reduced_motion='reduce')
  page=await ctx.new_page();page.on('pageerror',lambda e:errors.append({'url':page.url,'message':str(e)}))
  for width in [375,768,1024,1440]:
   await page.set_viewport_size({'width':width,'height':900})
   for path in paths:
    await page.goto('http://127.0.0.1:8765/'+path.name,wait_until='domcontentloaded');await page.evaluate('document.fonts.ready');await page.wait_for_timeout(100)
    d=await page.evaluate(SCRIPT);d['page']=path.name;result.append(d)
    if path.stem in KEY:
     await page.screenshot(path=str(ROOT/f'_verify/{path.stem}-{width}.png'),full_page=True)
    if path.stem=='index':
     await page.screenshot(path=str(ROOT/f'_verify/index-hero-{width}.png'))
     if width<=800:
      await page.locator('#menuBtn').click();await page.wait_for_timeout(50)
      md=await page.evaluate(SCRIPT);md['page']='menu';result.append(md)
      await page.screenshot(path=str(ROOT/f'_verify/menu-{width}.png'))
      interactions.append({'width':width,'menuOpen':await page.locator('#menuBtn').get_attribute('aria-expanded'),'links':await page.locator('.bs-navigation>a,.bs-nav-item>a').count()})
      await page.keyboard.press('Escape');interactions[-1]['escapeClosed']=await page.locator('#menuBtn').get_attribute('aria-expanded')=='false'
   print(width,len(paths),'done',flush=True)
  (ROOT/f'_spec/browser/after{"-selected" if sys.argv[1:] else ""}.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
  (ROOT/'_spec/browser/errors.json').write_text(json.dumps(errors,ensure_ascii=False,indent=2))
  (ROOT/'_spec/browser/interactions.json').write_text(json.dumps(interactions,ensure_ascii=False,indent=2))
  await browser.close()
asyncio.run(main())
