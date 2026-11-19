"""P103: venda automática das cópias além de 2 (com a migração de saves antigos) e o booster de cartas básicas da Lerael."""
import asyncio
from helpers import *
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await launch(p)
        page = await b.new_page(viewport={'width': 1280, 'height': 900}, reduced_motion='reduce'); errs = []; page.on('pageerror', lambda e: errs.append(str(e)))
        await newcamp(page, 'draconic')
        # Save antigo: cópias sobrando e sem a marca da migração
        await setcamp(page, "c => { c.pending = []; c.flags.firstAdv = true; c.flags.socialTut = true; delete c.flags.vendaAuto; c.gold = 0; c.collection.felix = 5; c.collection.tocha = 3; }")
        c = await camp(page)
        print('1. migração:', await page.inner_text('.cena h2'), '| ouro', c['gold'], '| felix', c['collection']['felix'], '| tocha', c['collection']['tocha'])
        assert c['gold'] == 20 and c['collection']['felix'] == 2 and c['collection']['tocha'] == 2
        await page.click('[data-act=g-ok-pend]')
        # Coleção com 2 de cada carta básica: o booster da Lerael só traz repetidas, que viram ouro na hora
        await setcamp(page, "c => { Object.keys(RunLib.RARITY).filter(id => (Engine.DEF[id].disc || 'neutra') === 'neutra' && (Engine.DEF[id].grupo || 1) === 1).forEach(id => { c.collection[id] = 2; }); c.gold = 200; }")
        antes = await camp(page)
        await page.click('[data-act=g-cidade]'); await page.click('[data-npc=copias]')
        print('2. Lerael vende booster?', 'Achados da arqueologia' in await page.inner_text('.cena')); await page.screenshot(path='lerael.png', full_page=True)
        await page.click('[data-act=g-buy][data-dd=neutra]'); c = await camp(page)
        venda = [h for h in c['history'] if h['k'] == 'venda'][-1]; compra = [h for h in c['history'] if h['k'] == 'booster'][-1]
        print('3. booster:', await page.inner_text('.cena h2'), '| marcas de repetida', len(await page.query_selector_all('.marca.repetida')), '| ouro', c['gold'], '| venda', venda['gold'], '| tipo', compra['type'])
        assert c['gold'] == 200 - 60 + venda['gold'] and c['collection'] == antes['collection'] and len(c['advs']) == len(antes['advs']) and compra['type'] == 'lerael'
        assert await page.evaluate(f"{compra['cards']}.every(id => (Engine.DEF[id].disc || 'neutra') === 'neutra')")
        await page.click('[data-npc=copias]'); print('4. volta:', await page.inner_text('.cena h2'))
        print('erros', errs); await b.close()
asyncio.run(main())
