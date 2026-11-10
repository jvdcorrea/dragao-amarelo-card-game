"""Fase 6 do game feel (P94): modos de animação nas Configurações e partidas nos modos com e sem animação."""
import asyncio, json
from helpers import *
from playwright.async_api import async_playwright
LS_PREFS = 'dragao-amarelo-prefs-v1'
async def modo(page): return await page.evaluate('document.documentElement.dataset.anim')
async def salvo(page): return json.loads(await page.evaluate(f"localStorage.getItem('{LS_PREFS}') || '{{}}'")).get('anim')
async def config(page):
    await page.click('[data-act=settings]')
    return await page.inner_text('.config-item:has(h2:text("Animações")) p')
async def avulsa(page):
    await page.click('.linha-logs [data-act=settings-back]'); await page.click('[data-act=avulsa]')
    await page.click('[data-disc=draconic]'); await page.click('[data-enc=bocas]'); await page.click('[data-act=start]')
    r = await finish(page); await page.click('.resultado [data-act=setup]'); await page.click('[data-act=home]')
    return r
async def main():
    async with async_playwright() as p:
        b = await launch(p); errs = []
        # Sem escolha salva, o modo segue o sistema.
        page = await b.new_page(viewport={'width': 1280, 'height': 900}); page.on('pageerror', lambda e: errs.append(str(e)))
        await newcamp(page)
        print('1. sistema sem preferência:', await modo(page), '|', await config(page))
        for m in ('rapida', 'instantanea'):
            await page.click(f'[data-act=anim-{m}]')
            ok = await modo(page) == m and await salvo(page) == m and await page.get_attribute(f'[data-act=anim-{m}]', 'aria-pressed') == 'true'
            print(f'2. {m}:', ok, '|', await page.inner_text('.config-item:has(h2:text("Animações")) p'))
            print('   partida:', await avulsa(page)); await page.click('[data-act=settings]')
        await page.click('[data-act=anim-auto]'); print('3. seguir o sistema:', await modo(page), await salvo(page), '| botão some:', not await page.query_selector('[data-act=anim-auto]'))
        # Com prefers-reduced-motion, o padrão é sem movimento; a escolha explícita vence o sistema.
        # Mesma página (uma página nova abriria outro contexto, sem o save no localStorage).
        await page.emulate_media(reduced_motion='reduce')
        await page.goto(URL, wait_until='domcontentloaded'); await page.click('[data-act=title-continue]')
        print('4. sistema com menos movimento:', await modo(page), '|', await config(page))
        await page.click('[data-act=anim-normal]'); await page.reload(wait_until='domcontentloaded')
        print('5. normal depois de recarregar:', await modo(page))
        print('erros', errs); await b.close()
asyncio.run(main())
