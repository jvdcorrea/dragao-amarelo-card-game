import asyncio
from helpers import *
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await launch(p)
        page = await b.new_page(viewport={'width': 1280, 'height': 900}, reduced_motion='reduce'); errs = []; page.on('pageerror', lambda e: errs.append(str(e)))
        await newcamp(page, 'necro')
        await setcamp(page, "c => { c.flags.firstAdv = true; c.flags.facilities = true; c.flags.socialTut = true; c.fac.quadro = 'ativo'; c.fac.taverna = 'ativa'; c.gold = 900; c.cleared = {1:true,2:true,3:true,4:true,5:true}; c.floor = 6; c.debt = { amount: 300, status: 'paga', due: 1, paidDay: 1 }; c.notes = [1,2,3,4,5,6,7]; c.advs.push({ id: 'k1', name: 'Katya', g: 'f', cls: 'guerreiro', lvl: 1, xp: 0, status: 'livre', mission: null, days: 0 }); c.history.push({ k: 'aventureiro', name: 'Katya', from: 'mestre-temporal' }); delete c.flags.mestreNivel3; }")
        await page.screenshot(path='p92_home.png', full_page=True)
        print('1. seções:', [await x.inner_text() for x in await page.query_selector_all('.painel-camp h2')], '| dia:', (await page.inner_text('.dia-grande')).replace('\n', ' '), '| notas:', await page.inner_text('[data-act=camp-notes]'))
        c = await camp(page); print('   Katya nível:', [a['lvl'] for a in c['advs'] if a['name'] == 'Katya'])
        await page.click('[data-act=g-instalacoes]'); print('2. instalações:', [ (await x.inner_text()).split('\n')[0] for x in await page.query_selector_all('.lista-fac li')])
        print('   ferraria:', (await page.inner_text('.lista-fac li:nth-child(5)')).replace('\n', ' ')[:160])
        await page.click('[data-act=g-build-up][data-fac=rh]'); await page.click('[data-act=home]')
        await page.click('[data-act=g-end-day]'); await page.click('[data-choice=sim]'); print('   fim do dia:', [l for l in (await page.inner_text('.cena')).split('\n') if 'Recursos' in l][:1])
        await page.click('[data-act=home]')
        while await page.query_selector('.cena [data-act=g-defend],.cena [data-act=g-defend-social]'):
            await setcamp(page, "c => { c.defense = null; c.pending = c.pending.filter(p => p.kind !== 'defesa'); }")
        await setcamp(page, "c => { c.flags.engrenagemEntregue = true; c.acts = {}; }")
        print('3. cena:', await page.inner_text('.cena h2')); await page.click('[data-act=g-ok-pend]')
        await page.click('[data-act=g-instalacoes]'); await page.click('[data-act=g-build-up][data-fac=ferraria]'); await page.click('[data-act=home]')
        await page.click('[data-act=g-end-day]'); await page.click('[data-choice=sim]'); await page.click('[data-act=home]')
        for _ in range(3):
            if await page.query_selector('.cena [data-act=g-defend],.cena [data-act=g-defend-social]'): await setcamp(page, "c => { c.defense = null; c.pending = c.pending.filter(p => p.kind !== 'defesa'); }")
        print('   cena:', await page.inner_text('.cena h2'), '|', (await page.inner_text('.cena .fala p'))[:80]); await page.click('[data-act=g-ok-pend]')
        c = await camp(page); print('   fac:', c['fac'])
        # treino
        await setcamp(page, "c => { c.cleared[10] = true; c.defense = null; c.pending = [{ kind: 'kryoret-treino' }]; }")
        print('4. cena:', await page.inner_text('.cena h2')); await page.click('[data-act=g-treino-build]'); await page.click('[data-act=home]')
        await page.click('[data-act=g-instalacoes]'); await page.select_option('#instr', label='Katya, nível 3'); await page.wait_for_timeout(100)
        print('   treino:', (await page.inner_text('.lista-fac li:last-child')).replace('\n', ' ')[:200])
        c = await camp(page); print('   status Katya:', [a['status'] for a in c['advs'] if a['name'] == 'Katya'])
        await page.click('[data-act=home]'); await page.click('[data-act=g-quadro]'); print('   quadro (despacho sem a Katya):', 'Katya' not in await page.inner_text('select') if await page.query_selector('select') else 'sem missões')
        await page.click('[data-act=home]')
        # cartas novas nos Mestres
        await setcamp(page, "c => { c.acts = {}; c.cityTrip = null; }")
        await page.click('[data-act=g-cidade]'); print('5. selos de cartas novas:', len(await page.query_selector_all('.badge-cartas')))
        await page.click('[data-npc=mestre-necro]'); print('   aviso:', (await page.inner_text('.novas-cartas'))[:90])
        await page.click('.linha-logs [data-act=g-cidade]'); print('   selos depois da visita:', len(await page.query_selector_all('.badge-cartas')))
        await page.click('.linha-logs [data-act=home]')
        # negociação avulsa
        await page.click('[data-act=avulsa-social]'); await page.click('[data-sdisc=holy]'); await page.click('[data-senc=bebado]'); await page.click('[data-act=start-social-avulsa]')
        r = await finish(page); print('6. negociação avulsa:', r, '->', await page.inner_text('h1'))
        # glossário do Superaquecer
        await page.click('[data-act=home]'); await page.click('[data-act=avulsa]'); await page.click('[data-disc=draconic]'); await page.click('[data-enc=bocas]'); await page.click('[data-act=start]')
        if await page.query_selector('[data-act=keep]'): await page.click('[data-act=keep]')
        for _ in range(6):
            if await page.query_selector('.fileira.inimigo .peca'): break
            await page.click('[data-act=end]'); await page.wait_for_timeout(1500)
        pc = await page.query_selector('.fileira.inimigo .peca')
        if pc: await pc.click(); await page.wait_for_timeout(100); print('7. painel:', [x for x in (await page.inner_text('section.info')).split('\n') if 'Superaquecer' in x or 'Blindagem' in x][:3])
        print('erros', errs); await b.close()
asyncio.run(main())
