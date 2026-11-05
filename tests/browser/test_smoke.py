import asyncio
from helpers import *
from test_grupo2 import run_floor
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await launch(p)
        page = await b.new_page(viewport={'width': 1280, 'height': 900}, reduced_motion='reduce'); errs = []; page.on('pageerror', lambda e: errs.append(str(e)))
        await newcamp(page, 'holy')
        await page.click('[data-floor="1"]'); log = []; await run_floor(page, log)
        if await page.query_selector('[data-act=g-hire-first]'): await page.click('[data-act=g-hire-first]'); await page.click('[data-act=g-ok-pend]')
        c = await camp(page); print('andar 1:', [x for x in log if not x.startswith('luta')][:8], '| concluído', c['cleared'], '| ouro', c['gold'])
        print('grupos na guilda:', [await x.inner_text() for x in await page.query_selector_all('.grupo-andares h3')])
        await page.click('[data-act=g-cidade]'); await page.click('[data-npc=mestre-holy]'); print('mestre:', await page.inner_text('.cena h2'))
        await page.click('.linha-logs [data-act=g-cidade]'); await page.click('.linha-logs [data-act=home]')
        await setcamp(page, "c => { c.fac.taverna = 'ativa'; c.flags.firstAdv = true; c.flags.facilities = true; c.fac.quadro = 'ativo'; }")
        print('tutorial:', await page.inner_text('.cena h2')); await page.click('[data-act=g-social-tut]'); r = await finish(page); print('   ', r)
        await page.click('[data-act=home]')
        await setcamp(page, "c => { c.defense = { human: 'bando', tier: 1, tierName: 'Média', leader: 'L', text: 'T.', hp: 3, deck: { h_bandido: 10 }, gold: 30, multa: 25 }; c.pending.push({ kind: 'defesa' }); }")
        await page.click('[data-act=g-defend]'); r = await finish(page); print('defesa:', r)
        print('erros', errs); await b.close()
asyncio.run(main())
