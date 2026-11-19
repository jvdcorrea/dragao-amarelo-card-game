"""P104: neutras novas na interface. A Esfinge pergunta o enigma antes de entrar, e a Pá de Escavação compra do fundo do deck."""
import asyncio
from helpers import *
from playwright.async_api import async_playwright
async def joga(page, id):
    # A mão foi trocada por fora, então a carta pode estar desenhada como bloqueada; o clique reavalia
    i = await page.evaluate(f"__st.sides.P.hand.findIndex(i => i.id === '{id}')")
    await page.click(f'.mao .carta[data-hand="{i}"]')
    await page.wait_for_timeout(20)
    if await page.query_selector('[data-act=confirm-play]'): await sc(page, '[data-act=confirm-play]')
async def main():
    async with async_playwright() as p:
        b = await launch(p)
        page = await b.new_page(viewport={'width': 1280, 'height': 900}, reduced_motion='reduce'); errs = []; page.on('pageerror', lambda e: errs.append(str(e)))
        await newcamp(page)
        # A interface guarda a partida num escopo fechado; o teste pega a referência ao criar a partida
        await page.evaluate("() => { const o = Engine.newGame; Engine.newGame = (...a) => (window.__st = o(...a)); }")
        await page.click('[data-act=avulsa]'); await page.click('[data-disc=draconic]'); await page.click('[data-enc=revoada]'); await page.click('[data-act=start]')
        if await page.query_selector('[data-act=keep]'): await page.click('[data-act=keep]')
        # Mão com as duas cartas, mana sobrando e vida baixa para ver a cura
        await page.evaluate("() => { const P = __st.sides.P; P.hand.slice(0, 2).forEach((i, k) => { i.id = ['esfinge', 'pa_escavacao'][k]; }); P.mana = 10; P.maxMana = 10; P.leader.hp = 20; }")
        await joga(page, 'esfinge')
        opcoes = [await o.inner_text() for o in await page.query_selector_all('[data-choice]:not([data-choice=__cancel])')]
        print('1. enigma:', opcoes)
        assert len(opcoes) == 3
        await page.click('[data-choice=vida]')
        hp = await page.evaluate("__st.sides.P.leader.hp"); campo = await page.evaluate("__st.sides.P.board.map(e => e.id)")
        print('2. cura:', hp, '| campo:', campo)
        assert hp == 26 and 'esfinge' in campo
        await joga(page, 'pa_escavacao')
        fundo = await page.evaluate("__st.sides.P.deck[__st.sides.P.deck.length - 1].id"); mao = await page.evaluate("__st.sides.P.hand.length")
        await page.click('[data-act=weapon]')
        await page.wait_for_timeout(20)
        await sc(page, '.alvo-lider.alvo')
        depois = await page.evaluate("__st.sides.P.hand.map(i => i.id)")
        print('3. pá: fundo era', fundo, '| mão', mao, '->', len(depois))
        assert len(depois) == mao + 1 and depois[-1] == fundo
        print('erros', errs); await b.close()
asyncio.run(main())
