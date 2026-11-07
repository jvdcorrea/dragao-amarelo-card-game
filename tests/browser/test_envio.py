"""Envio de logs (P99): botão, código do jogador, apelido, falha, envio automático e jogo sem URL configurada.
O servidor do Apps Script é simulado pelo Playwright (page.route); nada sai da máquina."""
import asyncio, base64, io, json, zipfile
from helpers import *
from playwright.async_api import async_playwright
FALSO = 'https://logs.teste.invalid/exec'
LS_ID, LS_ENVIO = 'dragao-amarelo-jogador-id', 'dragao-amarelo-ultimo-envio-v1'
recebidos, resposta = [], {'status': 200}
async def servidor(route):
    corpo = json.loads(route.request.post_data); recebidos.append(corpo)
    ok = resposta['status'] == 200
    await route.fulfill(status=resposta['status'], headers={'Access-Control-Allow-Origin': '*'}, content_type='application/json', body=json.dumps({'ok': ok}))
def abre_zip(env):
    z = zipfile.ZipFile(io.BytesIO(base64.b64decode(env['file']['b64'])))
    return json.loads(z.read(z.namelist()[0]))
async def toast(page):
    for _ in range(100):
        el = await page.query_selector('.aviso')
        if el:
            t = await el.inner_text()
            if t and 'Enviando' not in t: return t
        await page.wait_for_timeout(50)
    return None
async def avulsa(page):
    await page.click('[data-act=avulsa]'); await page.click('[data-disc=draconic]'); await page.click('[data-enc=bocas]'); await page.click('[data-act=start]')
    await play(page)
async def main():
    async with async_playwright() as p:
        b = await launch(p); errs = []
        ctx = await b.new_context(viewport={'width': 1280, 'height': 900}, reduced_motion='reduce')
        await ctx.add_init_script(f"window.DA_LOG_URL = '{FALSO}';")
        page = await ctx.new_page(); page.on('pageerror', lambda e: errs.append(str(e)))
        await page.route(FALSO, servidor)
        await newcamp(page)
        # 1. Uma partida e o envio pelo botão do resultado: código do jogador, resumo e o .zip com a partida.
        await avulsa(page)
        await page.click('.resultado .opcoes:not([hidden]) [data-act=envio]'); t = await toast(page)
        env = recebidos[-1] if recebidos else {}; log = abre_zip(env) if env else {}
        cod = await page.evaluate(f"JSON.parse(localStorage.getItem('{LS_ID}'))")
        print('1. envio:', t, '| código', cod, env.get('playerId') == cod and cod.startswith('j-'), '| sem apelido:', env.get('player') == '',
              '| resumo', env.get('resumo', {}).get('partidas'), '| zip', env.get('file', {}).get('type'), len(log.get('games', [])), log.get('playerId') == cod, '| auto', env.get('auto'))
        # 2. Sem partidas novas, nada é enviado.
        n = len(recebidos); await page.click('.resultado .opcoes:not([hidden]) [data-act=envio]')
        print('2. de novo:', await toast(page), '| nada enviado:', len(recebidos) == n)
        # 3. O código continua depois de recarregar; o apelido vai junto quando existe.
        await page.click('.resultado [data-act=setup]'); await page.reload(wait_until='domcontentloaded'); await page.click('[data-act=title-continue]')
        cod2 = await page.evaluate(f"JSON.parse(localStorage.getItem('{LS_ID}'))")
        await page.click('[data-act=avulsa]'); await page.fill('#apelido', 'Testadora')
        info = await page.inner_text('section.logs .intro')
        await page.click('[data-disc=draconic]'); await page.click('[data-enc=bocas]'); await page.click('[data-act=start]'); await play(page)
        await page.click('.resultado .opcoes:not([hidden]) [data-act=envio]'); await toast(page)
        env = recebidos[-1]
        print('3. código igual após recarregar:', cod2 == cod, '| código na tela:', cod in info, '| apelido:', env['player'], '| arquivo:', env['file']['name'].startswith('dragao-amarelo-log-testadora-'), '| só a nova:', env['resumo']['partidas'])
        # 4. Falha do servidor: avisa e não avança a marca, então a partida vai no próximo envio.
        marca = await page.evaluate(f"localStorage.getItem('{LS_ENVIO}')")
        await page.click('.resultado [data-act=setup]'); await page.click('[data-act=start]'); await play(page)
        resposta['status'] = 500; await page.click('.resultado .opcoes:not([hidden]) [data-act=envio]'); t = await toast(page)
        print('4. falha:', t, '| marca igual:', marca == await page.evaluate(f"localStorage.getItem('{LS_ENVIO}')"))
        resposta['status'] = 200
        # 5. Envio automático: liga nas Configurações e manda a partida pendente sozinho.
        # (O envio ao fim de cada partida respeita o intervalo de 10 minutos, então não cabe neste teste.)
        await page.click('.resultado [data-act=setup]'); await page.click('[data-act=home]'); await page.click('[data-act=settings]')
        n = len(recebidos); await page.click('[data-act=envio-auto]')
        for _ in range(100):
            if len(recebidos) > n: break
            await page.wait_for_timeout(50)
        env = recebidos[-1]
        await page.wait_for_timeout(300); cfg = await page.inner_text('.config-item:has(h2:text("Envio de logs")) p')
        print('5. automático ao ligar:', len(recebidos) > n and env['auto'], '| partida pendente:', env['resumo']['partidas'], '| arquivo -auto:', '-auto.' in env['file']['name'], '|', cfg[:60])
        ligado = await page.evaluate("JSON.parse(localStorage.getItem('dragao-amarelo-prefs-v1')).envioAuto")
        print('   preferência salva:', ligado)
        await ctx.close()
        # 6. Sem URL configurada, não há botão de envio nem opção nas Configurações.
        ctx = await b.new_context(viewport={'width': 1280, 'height': 900}); page = await ctx.new_page(); page.on('pageerror', lambda e: errs.append(str(e)))
        await newcamp(page); await page.click('[data-act=avulsa]')
        sem = not await page.query_selector('[data-act=envio]')
        await page.click('[data-act=home]'); await page.click('[data-act=settings]')
        print('6. sem URL: sem botão', sem, '| sem opção:', not await page.query_selector('[data-act=envio-auto]'))
        print('erros', errs); await b.close()
asyncio.run(main())
