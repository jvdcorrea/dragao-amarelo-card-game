import asyncio
from helpers import *
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await launch(p)
        page = await b.new_page(viewport={'width': 1280, 'height': 900}, reduced_motion='reduce'); errs = []; page.on('pageerror', lambda e: errs.append(str(e)))
        await newcamp(page, 'draconic')
        await setcamp(page, "c => { c.cleared = {1:true,2:true,3:true,4:true,5:true}; c.floor = 6; c.flags.basiliscoTesouro = true; c.debt = { amount: 300, status: 'paga', due: 1, paidDay: 1 }; c.flags.socialTut = true; c.flags.firstAdv = true; }")
        await page.evaluate("for (const k of ['oficina']) { Engine.ENC[k].hp = 2; Engine.ENC[k].deck = { g_fagulha: 20 }; Engine.ENC[k].extraMana = 0; }")
        await page.click('[data-floor="6"]')
        await page.evaluate("() => { const k = 'dragao-amarelo-campanha-v1'; const c = JSON.parse(localStorage.getItem(k)); c.run.map.nodes.forEach(n => { if (n.row === 0) n.type = 'banca'; }); c.run.sucata = 9; localStorage.setItem(k, JSON.stringify(c)); }")
        await page.reload(wait_until='domcontentloaded'); await page.click('[data-act=title-continue]')
        for _ in range(200):
            if await page.query_selector('.cena h2') and (await page.inner_text('.cena h2')) == 'Banca Azer': break
            if await page.query_selector('.mesa'):
                if await page.query_selector(END): await finish(page); continue
                await play(page); continue
            if await page.query_selector('.mapa'):
                if await page.query_selector('.no.livre[aria-label*="Banca"]'): await page.click('.no.livre[aria-label*="Banca"]'); continue
                await sc(page, '.no.livre'); continue
            for sel in ['[data-evc]', '[data-pick]', '[data-act=scene-ok]']:
                if await page.query_selector(sel): await sc(page, sel); break
        await page.screenshot(path='kryoret.png', full_page=True)
        print('cena:', await page.inner_text('.cena h2'), '| imagem:', bool(await page.query_selector('.npc-arte[aria-label*=Kryoret]')), '| erros', errs)
        await b.close()
asyncio.run(main())
