import asyncio,json,ast
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path('/tmp/bsupply-site-demo')
mod=ast.parse((ROOT/'_spec/browser/measure_reference.py').read_text()); SCRIPT=next(ast.literal_eval(n.value) for n in mod.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='SCRIPT' for t in n.targets))
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,args=['--disable-crash-reporter'])
  result=[]
  for width in [375,768,1024,1440]:
   page=await browser.new_page(viewport={'width':width,'height':900},reduced_motion='reduce')
   for path in sorted(ROOT.glob('*.html')):
    await page.goto('http://127.0.0.1:8765/'+path.name,wait_until='load')
    await page.evaluate('document.fonts.ready');await page.wait_for_timeout(150)
    d=await page.evaluate(SCRIPT);d['page']=path.name
    result.append(d)
   await page.close();print(width,'done',flush=True)
  (ROOT/'_spec/browser/before.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
  await browser.close()
asyncio.run(main())
