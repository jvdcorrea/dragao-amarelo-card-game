import asyncio
from helpers import *
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await launch(p)
        page = await b.new_page(viewport={'width': 1280, 'height': 900}, reduced_motion='reduce'); errs = []; page.on('pageerror', lambda e: errs.append(str(e)))
        await newcamp(page, 'draconic')
        await setcamp(page, "c => { c.cleared = {1:true,2:true,3:true,4:true,5:true}; c.floor = 6; c.flags.basiliscoTesouro = true; c.debt = { amount: 300, status: 'paga', due: 1, paidDay: 1 }; c.flags.socialTut = true; c.flags.firstAdv = true; }")
        await page.click('[data-floor="6"]')
        await page.evaluate("() => { const k = 'dragao-amarelo-campanha-v1'; const c = JSON.parse(localStorage.getItem(k)); c.run.map.nodes.forEach(n => { if (n.row === 0) n.type = 'banca'; }); c.run.sucata = 9; localStorage.setItem(k, JSON.stringify(c)); }")
        await page.reload(wait_until='domcontentloaded'); await page.click('[data-act=title-continue]'); await page.click('.no.livre')
        await page.click('[data-act=g-banca-buy][data-item=carta1]'); c = await camp(page)
        print('compra: sucata', c['run']['sucata'], '| bônus', c['run']['bonus'], '|', await page.inner_text('.aviso'))
        await page.evaluate("Engine.ENC.kryoret.hp = 1")
        await page.click('[data-act=g-banca-neg]'); print('negociação abriu mesa?', bool(await page.query_selector('.mesa.social')))
        r = await finish(page); print('resultado:', r, '|', await page.inner_text('.cena h2')); await page.click('[data-act=g-banca-back]')
        print('de volta à banca:', await page.inner_text('.cena h2'), '|', await page.inner_text('.cena .destaque'))
        print('preço com desconto:', await page.inner_text('[data-item=carta2]'))
        await page.click('[data-act=g-banca-buy][data-item=carta2]'); c = await camp(page); print('compra com desconto: sucata', c['run']['sucata'], '| bônus', c['run']['bonus'])
        print('erros', errs); await b.close()
asyncio.run(main())
