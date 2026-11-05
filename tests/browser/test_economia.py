import asyncio
from helpers import *
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await launch(p)
        page = await b.new_page(viewport={'width': 1280, 'height': 900}, reduced_motion='reduce'); errs = []; page.on('pageerror', lambda e: errs.append(str(e)))
        await newcamp(page, 'draconic')
        await setcamp(page, "c => { c.cleared = {1: true, 2: true, 3: true}; c.floor = 4; c.gold = 500; c.flags.firstAdv = true; c.flags.socialTut = true; }")
        print('1. cena:', await page.inner_text('.cena h2'), '|', [x for x in (await page.inner_text('.cena .intro-dica')).split('. ') if 'Vitória' in x or 'Derrota' in x or 'tesouro' in x])
        await page.evaluate("Engine.ENC.credor.hp = 1"); await page.click('[data-act=g-credor]'); r = await finish(page)
        c = await camp(page); print('   negociação:', r, '| dívida', c['debt'], '| dia', c['day'])
        print('   ', (await page.inner_text('.cena p'))[:110]); await page.click('[data-act=home]')
        print('2. conselho do Felix antes do tesouro?', await page.query_selector('.cena h2') is not None)
        await setcamp(page, "c => { c.flags.basiliscoTesouro = true; c.cleared[5] = true; c.floor = 6; }")
        print('   depois do tesouro:', await page.inner_text('.cena h2')); await page.click('[data-act=g-ok-pend]')
        await setcamp(page, "c => { c.debt.due = c.day - 1; c.acts = {}; c.defense = null; c.pending = []; }")
        a0 = (await camp(page))['debt']['amount']; await page.click('[data-act=g-end-day]'); await page.click('[data-choice=sim]')
        c = await camp(page); print('3. venceu o prazo:', a0, '->', c['debt']['amount'], '|', [l for l in (await page.inner_text('.cena')).split('\n') if 'prazo' in l][:1])
        print('erros', errs); await b.close()
asyncio.run(main())
