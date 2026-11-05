import asyncio, json
from helpers import *
from playwright.async_api import async_playwright
async def run_floor(page, log, prefer=None):
    for _ in range(300):
        if await page.query_selector('.mesa'):
            if await page.query_selector(END): r = await finish(page); log.append('luta:' + r); continue
            await play(page); continue
        if await page.query_selector('.mapa'):
            if await page.query_selector('[data-act=run-resume]'): await page.click('[data-act=run-resume]'); continue
            if prefer and await page.query_selector(f'.no.livre[aria-label*="{prefer}"]'): await page.click(f'.no.livre[aria-label*="{prefer}"]'); continue
            await sc(page, '.no.livre'); continue
        if await page.query_selector('.painel-camp') or await page.query_selector('[data-act=g-hire-first],[data-act=g-credor],[data-act=g-defend],[data-act=g-defend-social],[data-act=g-social-tut]'): return
        if await page.query_selector('.cena'):
            h = await page.inner_text('.cena h2'); log.append(h)
            if h == 'Banca Azer':
                log.append('sucata:' + (await page.inner_text('.cena .destaque'))[:40])
                if await page.query_selector('[data-act=banca-buy]:not([disabled])'): await page.click('[data-act=banca-buy]:not([disabled])'); log.append('comprou')
                await page.click('[data-act=scene-ok]'); continue
            for sel in ['[data-evc]', '[data-pick]', '[data-act=scene-ok]', '[data-act=home]', '[data-act=g-ok-pend]']:
                if await page.query_selector(sel): await sc(page, sel); break
            continue
        await page.wait_for_timeout(50)
async def main():
    async with async_playwright() as p:
        b = await launch(p)
        page = await b.new_page(viewport={'width': 1280, 'height': 900}, reduced_motion='reduce'); errs = []; page.on('pageerror', lambda e: errs.append(str(e)))
        await newcamp(page, 'draconic')
        await setcamp(page, "c => { c.cleared = {1:true,2:true,3:true,4:true,5:true}; c.floor = 6; c.flags.basiliscoTesouro = true; c.debt = { amount: 300, status: 'paga', due: 1, paidDay: 1 }; c.flags.socialTut = true; c.flags.firstAdv = true; c.gold = 50; }")
        print('1. guilda:', (await page.inner_text('.painel-camp')).replace('\n', ' | ')[:260])
        await page.evaluate("for (const k of ['oficina','bocas','fundicao','patrulha_azer','colosso_ferro','matriarca_azer','ignar']) { Engine.ENC[k].hp = 2; Engine.ENC[k].deck = { g_fagulha: 20 }; Engine.ENC[k].extraMana = 0; Engine.ENC[k].onStart = null; }")
        await page.click('[data-floor="6"]'); log = []; await run_floor(page, log, 'Banca')
        print('2. andar 6:', [x for x in log if not x.startswith('luta')][:14], '| lutas:', [x for x in log if x.startswith('luta')])
        c = await camp(page); print('   concluídos:', sorted(c['cleared'], key=int), '| ouro', c['gold'])
        # andar 7: cofre de Ergos no primeiro evento
        await setcamp(page, "c => { c.acts = {}; c.quests = [{ id: 'engrenagem', title: 'A engrenagem da Chrome', desc: 'x' }]; }")
        await page.evaluate("for (const k of ['oficina','bocas','fundicao','patrulha_azer','colosso_ferro','matriarca_azer','ignar']) { Engine.ENC[k].hp = 2; Engine.ENC[k].deck = { g_fagulha: 20 }; Engine.ENC[k].extraMana = 0; Engine.ENC[k].onStart = null; }")
        await page.click('[data-floor="7"]'); log = []; await run_floor(page, log, 'Evento')
        print('3. andar 7:', [x for x in log if not x.startswith('luta')][:12]); c = await camp(page); print('   engrenagem:', c['flags'].get('engrenagem'))
        # andar 8 -> credor da segunda parcela
        await setcamp(page, "c => { c.acts = {}; }")
        await page.evaluate("for (const k of ['oficina','bocas','fundicao','patrulha_azer','colosso_ferro','matriarca_azer','ignar']) { Engine.ENC[k].hp = 2; Engine.ENC[k].deck = { g_fagulha: 20 }; Engine.ENC[k].extraMana = 0; Engine.ENC[k].onStart = null; }")
        await page.click('[data-floor="8"]'); log = []; await run_floor(page, log)
        c = await camp(page); print('4. andar 8: pendências', c['pending'], '| dívida', c.get('debt'))
        await page.reload(wait_until='domcontentloaded'); await page.click('[data-act=title-continue]')
        print('   cena:', await page.inner_text('.cena h2')); await page.click('[data-act=g-credor]'); r = await finish(page); print('   negociação:', r, '|', (await page.inner_text('.cena p'))[:120])
        await page.click('[data-act=home]')
        # Chrome: entregar a engrenagem
        await setcamp(page, "c => { c.acts = {}; c.cityTrip = null; }")
        await page.click('[data-act=g-cidade]'); await page.click('[data-npc=mestre-tech]')
        print('5. Chrome tem a fala?', bool(await page.query_selector('[data-opt=h]'))); await page.click('[data-opt=h]')
        print('   ', [x.replace('\n', ' ')[:100] for x in (await page.eval_on_selector_all('.dialogo-log > *', 'els => els.map(e => e.innerText)'))[-2:]])
        await page.click('.linha-logs [data-act=g-cidade]'); await page.click('.linha-logs [data-act=home]')
        # andar 10 -> tesouro de Ignar
        await setcamp(page, "c => { c.cleared = Object.fromEntries([1,2,3,4,5,6,7,8,9].map(f => [f, true])); c.floor = 10; c.acts = {}; c.debt.status = 'paga'; c.pending = []; }")
        await page.evaluate("for (const k of ['oficina','bocas','fundicao','patrulha_azer','colosso_ferro','matriarca_azer','ignar']) { Engine.ENC[k].hp = 2; Engine.ENC[k].deck = { g_fagulha: 20 }; Engine.ENC[k].extraMana = 0; Engine.ENC[k].onStart = null; } Engine.ENC.ignar.phaseAt = 1")
        g0 = (await camp(page))['gold']; await page.click('[data-floor="10"]'); log = []; await run_floor(page, log)
        c = await camp(page); print('6. andar 10:', [x for x in log if 'concluído' in x], '| ouro', g0, '->', c['gold'], '| tesouro', c['flags'].get('ignarTesouro'))
        print('   guilda:', (await page.inner_text('.acoes-setup'))[:140])
        print('erros', errs); await b.close()
if __name__ == "__main__": asyncio.run(main())
