"""Ataque total (P98): o botão aparece na batalha, ataca com todas as unidades prontas e se desliga quando ninguém mais pode atacar."""
import asyncio
from helpers import *
from playwright.async_api import async_playwright
TOTAL = '[data-act=total]:not([disabled])'
async def joga_unidades(page):
    # Joga o que der sem alvo, para ter unidades no campo.
    for _ in range(6):
        c = await page.query_selector('.mao .carta.jogavel')
        if not c or not await tenta(c): return
        await page.wait_for_timeout(20)
        if await page.query_selector('[data-act=confirm-play]'): await sc(page, '[data-act=confirm-play]')
        if await page.query_selector('[data-choice]:not([data-choice=__cancel])'): await page.click('[data-choice]:not([data-choice=__cancel])')
        if await page.query_selector('[data-act=cancel]'): await sc(page, '[data-act=cancel]')
async def main():
    async with async_playwright() as p:
        b = await launch(p)
        page = await b.new_page(viewport={'width': 1280, 'height': 900}, reduced_motion='reduce'); errs = []; page.on('pageerror', lambda e: errs.append(str(e)))
        await newcamp(page)
        await page.click('[data-act=avulsa]'); await page.click('[data-disc=draconic]'); await page.click('[data-enc=bocas]'); await page.click('[data-act=start]')
        if await page.query_selector('[data-act=keep]'): await page.click('[data-act=keep]')
        print('1. botão na batalha:', await page.inner_text('[data-act=total]'))
        usado = False
        for turno in range(10):
            if await page.query_selector('.resultado'): break
            await joga_unidades(page)
            if await page.query_selector(TOTAL):
                prontas = len(await page.query_selector_all('.fileira.aliado .peca.pode'))
                await page.click(TOTAL)
                for _ in range(100):
                    if not await page.query_selector('.faixa:has-text("Ataque total.")'): break
                    await page.wait_for_timeout(50)
                depois = len(await page.query_selector_all('.fileira.aliado .peca.pode'))
                print(f'2. turno {turno + 1}: prontas {prontas} -> {depois} | botão desligado:', not await page.query_selector(TOTAL) or bool(await page.query_selector('.resultado')))
                usado = True; break
            if await page.query_selector('[data-act=end]:not([disabled])'): await sc(page, '[data-act=end]')
            for _ in range(100):
                if await page.query_selector('.resultado') or await page.query_selector('[data-act=end]:not([disabled])'): break
                await page.wait_for_timeout(40)
        print('3. ataque total usado:', usado)
        print('erros', errs); await b.close()
asyncio.run(main())
