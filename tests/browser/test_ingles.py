"""Idiomas (P101): percorre as telas principais com o navegador em inglês e procura texto que ficou em português."""
import asyncio, re
from helpers import *
from test_grupo2 import run_floor
from playwright.async_api import async_playwright

# palavras que só existem em português (e não aparecem em inglês nem nos nomes próprios do jogo)
PT = re.compile(r"\b(você|não|nã|com|para|uma|turno|cartas?|guilda|andar|voltar|vida|ouro|dano|unidade|unidades|então|está|são|também|já|até|mão|dia|seu|sua|dos|das|pelo|pela)\b", re.I)
NOMES = re.compile(r"Tipográfica|Otávio|Lúcia|Dório|Quitéria|Gun'Liao|«|»|cartas-v[\d.]+/design")
achados = {}

async def varre(page, tela):
    txt = await page.evaluate("""() => {
      const t = [document.body.innerText];
      document.querySelectorAll('[aria-label],[title],[placeholder],[alt]').forEach(e => ['aria-label', 'title', 'placeholder', 'alt'].forEach(a => { const v = e.getAttribute(a); if (v) t.push(v); }));
      t.push(document.title);
      return t.join('\\n');
    }""")
    for linha in txt.split('\n'):
        l = NOMES.sub('', linha)
        if PT.search(l): achados.setdefault(linha.strip()[:140], tela)

async def main():
    async with async_playwright() as p:
        b = await launch(p)
        page = await b.new_page(viewport={'width': 1280, 'height': 900}, reduced_motion='reduce'); errs = []; page.on('pageerror', lambda e: errs.append(str(e)))
        # o padrão é o português; o inglês vem da escolha guardada nas preferências
        await page.add_init_script("localStorage.setItem('dragao-amarelo-prefs-v1', JSON.stringify(Object.assign(JSON.parse(localStorage.getItem('dragao-amarelo-prefs-v1') || '{}'), { lang: 'en' })))")
        await page.goto(URL, wait_until='domcontentloaded')
        print('idioma:', await page.evaluate('I18N.lang'), '| título:', await page.title())
        await varre(page, 'título')
        await page.click('[data-act=title-guild]'); await varre(page, 'intro 1')
        await page.fill('#intro-nome', 'Ana'); await page.click('[data-act=intro-next]'); await varre(page, 'intro 2')
        await page.click('[data-act=intro-skip]'); await varre(page, 'disciplinas')
        await page.click('[data-newdisc=necro]'); await page.click('[data-act=intro-finish]'); await varre(page, 'guilda')
        await page.click('[data-act=settings]'); await varre(page, 'configurações')
        await page.click('[data-act=credits]'); await varre(page, 'créditos'); await page.click('[data-act=settings]'); await page.click('[data-act=settings-back]')
        for act in ['avulsa', 'avulsa-social']:
            if await sc(page, f'[data-act={act}]'): await varre(page, act); await sc(page, '[data-act=home]')
        await page.click('[data-act=g-felix]'); await varre(page, 'Felix'); await page.click('[data-act=home]')
        await page.click('[data-act=g-cidade]'); await varre(page, 'cidade')
        for npc in ['mestre-tech', 'mestre-necro', 'banco', 'lerael']:
            if await sc(page, f'[data-npc={npc}]'): await varre(page, npc); await sc(page, '.linha-logs [data-act=g-cidade]')
        await sc(page, '.linha-logs [data-act=home]')
        await page.click('[data-act=deck-edit]'); await varre(page, 'deck'); await page.click('[data-act=deck-back]')
        await page.click('[data-floor="1"]'); await varre(page, 'mapa')
        await sc(page, '.no.livre'); await page.wait_for_selector('.mesa,.cena', timeout=5000); await varre(page, 'mesa ou cena')
        if await page.query_selector('[data-act=keep]'): await page.click('[data-act=keep]'); await varre(page, 'mesa')
        log = []; await run_floor(page, log); await varre(page, 'fim do andar')
        if await page.query_selector('[data-act=g-hire-first]'): await page.click('[data-act=g-hire-first]'); await page.click('[data-act=g-ok-pend]')
        await setcamp(page, "c => { c.fac.taverna = 'ativa'; c.flags.firstAdv = true; c.flags.facilities = true; c.fac.quadro = 'ativo'; }")
        await varre(page, 'pendência')
        if await sc(page, '[data-act=g-social-tut]'):
            await varre(page, 'social'); await finish(page); await varre(page, 'fim do social'); await sc(page, '[data-act=home]')
        for act in ['g-quadro', 'g-instalacoes', 'g-taverna']:
            if await sc(page, f'[data-act={act}]'): await varre(page, act); await sc(page, '[data-act=home]')
        faltando = await page.evaluate('[...I18N.faltando]')
        print('telas com texto em português:', len(achados))
        for l, t in list(achados.items())[:60]: print(f'  [{t}] {l}')
        print('chaves sem tradução pedidas na página:', faltando[:30])
        if achados or faltando: errs.append(f'{len(achados)} linhas em português, {len(faltando)} chaves sem tradução')
        print('erros', errs); await b.close()
asyncio.run(main())
