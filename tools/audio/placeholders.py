"""Gera sons provisórios (.wav) para cada som listado em src/feel.js. Uso: python3 tools/audio/placeholders.py [--force]

Só usa a biblioteca padrão. Não toca em arquivos que já existem (nem .ogg, nem .wav); com --force, refaz só os .wav.
Os sons são sintetizados aqui, então são do projeto, em domínio público. Troque pelos definitivos quando quiser:
basta pôr <nome>_<n>.ogg na mesma pasta, que o jogo prefere o .ogg.
"""
import math, random, re, struct, sys, wave
from pathlib import Path

raiz = Path(__file__).resolve().parent.parent.parent
TAXA = 22050

def onda(dur, f):
    """f(t, i) -> amostra entre -1 e 1."""
    n = int(dur * TAXA)
    return [f(i / TAXA, i) for i in range(n)]

def env(t, dur, ataque=0.005):
    if t < ataque: return t / ataque
    return max(0.0, 1 - (t - ataque) / max(1e-6, dur - ataque)) ** 2

def ruido(rng):
    return rng.uniform(-1, 1)

def receita(nome, var, rng):
    p = 1 + (var - 1) * 0.07   # cada variação um pouco mais aguda
    if nome == 'comprar':      # sopro curto subindo
        d = 0.13; lp = [0.0]
        def f(t, i):
            a = 0.25 + 0.6 * t / d
            lp[0] += a * (ruido(rng) - lp[0])
            return lp[0] * env(t, d, 0.03) * 0.8
        return onda(d, f)
    if nome == 'embaralhar':   # seis estalinhos de papel
        d = 0.36
        return onda(d, lambda t, i: ruido(rng) * max(0, 1 - ((t * 17) % 1) * 6) * 0.5 * (1 - t / d))
    if nome == 'jogar':        # baque de carta na mesa
        d = 0.16
        return onda(d, lambda t, i: (math.sin(2 * math.pi * (140 * p - 300 * t) * t) * 0.8 + ruido(rng) * 0.3 * (t < 0.015)) * env(t, d))
    if nome == 'impacto':
        d = 0.18
        return onda(d, lambda t, i: (math.sin(2 * math.pi * 95 * p * t) * 0.7 + ruido(rng) * 0.5) * env(t, d, 0.002))
    if nome == 'impacto_forte':
        d = 0.32
        return onda(d, lambda t, i: (math.sin(2 * math.pi * (70 * p - 40 * t) * t) * 0.9 + ruido(rng) * 0.6 * math.exp(-t * 14)) * env(t, d, 0.002))
    if nome == 'bloqueio':     # ping metálico
        d = 0.3
        return onda(d, lambda t, i: sum(math.sin(2 * math.pi * fr * p * t) * a for fr, a in ((880, .5), (1320, .3), (2210, .2))) * math.exp(-t * 12) * 0.8)
    if nome == 'cura':         # arpejo subindo
        notas = (523.25, 659.25, 783.99); d = 0.36
        return onda(d, lambda t, i: math.sin(2 * math.pi * notas[min(2, int(t / 0.09))] * p * t) * 0.5 * env((t % 0.09) if t < 0.27 else t - 0.18, 0.09 if t < 0.27 else 0.18, 0.01))
    if nome == 'morte':        # queda descendo
        d = 0.42
        return onda(d, lambda t, i: (math.sin(2 * math.pi * (420 * p - 700 * t) * t) * 0.6 + ruido(rng) * 0.25) * env(t, d, 0.01))
    d = 0.15                   # som novo sem receita: um bipe
    return onda(d, lambda t, i: math.sin(2 * math.pi * 660 * p * t) * 0.5 * env(t, d))

def salvar(arq, amostras):
    pico = max(1e-6, max(abs(a) for a in amostras))
    with wave.open(str(arq), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(TAXA)
        w.writeframes(b''.join(struct.pack('<h', int(a / pico * 0.85 * 32767)) for a in amostras))

def main():
    force = '--force' in sys.argv
    feel = (raiz / 'src' / 'feel.js').read_text(encoding='utf-8')
    bloco = feel[feel.index('sons:'):]
    sons = re.findall(r'(\w+):\s*\{\s*arqs:\s*(\d+)', bloco)
    pasta = raiz / 'assets' / 'audio' / 'sfx'; pasta.mkdir(parents=True, exist_ok=True)
    feitos = 0
    for nome, n in sons:
        for v in range(1, int(n) + 1):
            base = pasta / f'{nome}_{v}'
            if base.with_suffix('.ogg').exists(): continue
            if base.with_suffix('.wav').exists() and not force: continue
            salvar(base.with_suffix('.wav'), receita(nome, v, random.Random(f'{nome}{v}')))
            feitos += 1
    print(f'{feitos} placeholder(s) gerado(s) em {pasta.relative_to(raiz)}')

main()
