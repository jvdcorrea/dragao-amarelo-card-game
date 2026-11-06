"""Utilitários dos testes de navegador: abrir a página, criar campanha, mexer no save e jogar partidas com um bot simples."""
import json, os
from pathlib import Path
K = 'dragao-amarelo-campanha-v1'
END = '[data-act=soc-continue],[data-act=pas-continue],[data-act=run-continue],[data-act=def-continue]'
# A página montada (python3 tools/build.py) na raiz do repositório.
URL = (Path(__file__).resolve().parents[2] / 'index.html').as_uri()
# Por padrão usa o Chromium do Playwright (playwright install chromium). Para outro binário, defina CHROME_PATH.
CHROME = os.environ.get('CHROME_PATH')
# Sem saída de áudio: em sessões longas, o áudio do Chrome headless às vezes trava a aba e derruba o teste.
# O jogo continua carregando e tocando os sons (o código de áudio roda); só não chega ao dispositivo.
async def launch(p):
    return await p.chromium.launch(args=['--disable-audio-output'], **({'executable_path': CHROME} if CHROME else {}))
async def sc(page, sel):
    try: await page.locator(sel).first.click(timeout=3000); return True
    except Exception: return False
async def camp(page): return json.loads(await page.evaluate(f"localStorage.getItem('{K}')"))
async def setcamp(page, fn):
    await page.evaluate(f"() => {{ const c = JSON.parse(localStorage.getItem('{K}')); ({fn})(c); localStorage.setItem('{K}', JSON.stringify(c)); }}")
    await page.reload(wait_until='domcontentloaded'); await page.click('[data-act=title-continue]')
async def newcamp(page, disc='draconic'):
    await page.goto(URL, wait_until='domcontentloaded')
    await page.click('[data-act=title-guild]'); await page.fill('#intro-nome', 'Ana'); await page.click('[data-act=intro-next]'); await page.click('[data-act=intro-skip]'); await page.click(f'[data-newdisc={disc}]'); await page.click('[data-act=intro-finish]')
_falhas = [0]
async def tenta(h):
    # A página redesenha tudo a cada ação (e quando um aviso some); um elemento pego antes pode sumir antes do clique.
    # Uma falha solta é essa corrida; várias seguidas são um problema de verdade e derrubam o teste.
    try: await h.click(timeout=3000); _falhas[0] = 0; return True
    except Exception:
        _falhas[0] += 1
        if _falhas[0] >= 5: raise
        return False
async def play(page):
    for _ in range(500):
        if await page.query_selector(END): return
        if await page.query_selector('[data-act=keep]'): await page.click('[data-act=keep]'); continue
        if await page.query_selector('.veu .janela[aria-labelledby=pv-t]'): await page.click('[data-act=prever-ok]'); continue
        if await page.query_selector('[data-choice]:not([data-choice=__cancel])'): await page.click('[data-choice]:not([data-choice=__cancel])'); continue
        c = await page.query_selector('.mao .carta.jogavel')
        if c:
            if not await tenta(c): continue
            await page.wait_for_timeout(10)
            if await page.query_selector('[data-act=confirm-play]'): await sc(page, '[data-act=confirm-play]')
            if await page.query_selector('[data-choice]:not([data-choice=__cancel])'): await page.click('[data-choice]:not([data-choice=__cancel])')
            if await page.query_selector('.peca.alvo, .alvo-lider.alvo'): await sc(page, '.alvo-lider.alvo, .peca.alvo')
            if await page.query_selector('[data-act=cancel]'): await sc(page, '[data-act=cancel]')
            continue
        a = await page.query_selector('.fileira.aliado .peca.pode')
        if a:
            if not await tenta(a): continue
            if await page.query_selector('.fileira.inimigo .peca.alvo.estrutura'): await sc(page, '.fileira.inimigo .peca.alvo.estrutura')
            elif await page.query_selector('.alvo-lider.alvo'): await sc(page, '.alvo-lider.alvo')
            elif await page.query_selector('.fileira.inimigo .peca.alvo'): await sc(page, '.fileira.inimigo .peca.alvo')
            elif await page.query_selector('[data-act=cancel]'): await sc(page, '[data-act=cancel]')
            continue
        if await page.query_selector('[data-act=end]:not([disabled])'): await sc(page, '[data-act=end]')
        for _ in range(100):
            if await page.query_selector(END) or await page.query_selector('[data-act=end]:not([disabled])'): break
            await page.wait_for_timeout(40)
async def finish(page):
    await play(page); r = await page.inner_text('.resultado h2')
    for a in ('soc-continue', 'run-continue', 'pas-continue', 'def-continue'):
        if await page.query_selector(f'.resultado [data-act={a}]'): await page.click(f'.resultado [data-act={a}]'); break
    return r
