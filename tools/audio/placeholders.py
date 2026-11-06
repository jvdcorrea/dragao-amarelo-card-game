"""Gera sons e músicas provisórios (.wav) para o que está listado em src/feel.js. Uso: python3 tools/audio/placeholders.py [--force]

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
    if nome == 'evoluir':      # arpejo subindo com brilho agudo por cima
        notas = (523.25, 659.25, 783.99, 1046.5); d = 0.62
        def f(t, i):
            k = min(3, int(t / 0.07)); tt = t - k * 0.07
            base = math.sin(2 * math.pi * notas[k] * p * t) * 0.45 * math.exp(-tt * 9)
            brilho = math.sin(2 * math.pi * (2200 + 1800 * t / d) * p * t) * 0.12 * (t / d) * math.exp(-max(0, t - 0.4) * 12)
            return (base + brilho + ruido(rng) * 0.04 * math.exp(-t * 6)) * env(t, d, 0.004)
        return onda(d, f)
    d = 0.15                   # som novo sem receita: um bipe
    return onda(d, lambda t, i: math.sin(2 * math.pi * 660 * p * t) * 0.5 * env(t, d))

def salvar(arq, amostras, taxa=TAXA, pico_alvo=0.85):
    pico = max(1e-6, max(abs(a) for a in amostras))
    with wave.open(str(arq), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(taxa)
        w.writeframes(b''.join(struct.pack('<h', int(a / pico * pico_alvo * 32767)) for a in amostras))

# ---------- Música: loops de 8 s que emendam sem estalo (notas que passam do fim voltam ao começo) ----------
TAXA_M, LOOP = 16000, 8.0
N_M = int(TAXA_M * LOOP)
def cheia(f):
    """Frequência com número inteiro de ciclos no loop, para o fim casar com o começo."""
    return round(f * LOOP) / LOOP
def osc(forma, f, t):
    if forma == 'tri': return 2 / math.pi * math.asin(math.sin(2 * math.pi * f * t))
    if forma == 'saw': return sum(math.sin(2 * math.pi * f * h * t) / h for h in (1, 2, 3, 4)) * 0.6
    return math.sin(2 * math.pi * f * t)
def nota(buf, ini, dur, f, amp, dec=4.0, forma='sin', desce=0.0):
    s0, n = int(ini * TAXA_M), int(dur * TAXA_M)
    for i in range(n):
        tt = i / TAXA_M
        a = amp * math.exp(-dec * tt) * min(1.0, tt / 0.004) * min(1.0, (n - i) / (0.01 * TAXA_M))
        buf[(s0 + i) % N_M] += a * osc(forma, f - desce * tt, tt)
def pad(buf, fs, amp, trem=0.0, ciclos=1):
    for i in range(N_M):
        tt = i / TAXA_M
        m = 1 - trem * (0.5 + 0.5 * math.cos(2 * math.pi * ciclos * tt / LOOP))
        buf[i] += amp * m * sum(math.sin(2 * math.pi * cheia(f) * tt) for f in fs)
def ruido_m(buf, ini, dur, amp, rng):
    s0, n = int(ini * TAXA_M), int(dur * TAXA_M)
    for i in range(n): buf[(s0 + i) % N_M] += amp * rng.uniform(-1, 1) * (1 - i / n) ** 2
NT = {'G1': 49.0, 'A1': 55.0, 'D2': 73.42, 'G2': 98.0, 'A2': 110.0, 'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'G3': 196.0, 'G#3': 207.65,
      'A3': 220.0, 'B3': 246.94, 'C4': 261.63, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'G4': 392.0, 'A4': 440.0, 'B4': 493.88,
      'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'A5': 880.0, 'E6': 1318.5}
def musica(estado, var, rng):
    b = [0.0] * N_M
    if estado == 'menu':       # calmo, maior: pad e arpejo lento
        pad(b, (NT['C3'], NT['G3']), 0.1)
        arp = ['C4', 'E4', 'G4', 'B4', 'C5', 'B4', 'G4', 'E4']
        for k in range(16): nota(b, k * 0.5, 1.2, NT[arp[k % 8]], 0.28, 3.0, 'tri')
    elif estado == 'mapa':     # misterioso, menor: drone que respira e gotas
        pad(b, (NT['A2'], NT['E3']), 0.12, trem=0.5, ciclos=2)
        for ini, n in ((1.0, 'A5'), (3.5, 'E6'), (5.0, 'A5'), (7.25, 'E5')): nota(b, ini, 1.0, NT[n], 0.22, 5.0)
        for k in range(4): nota(b, k * 2.0, 0.5, NT['A1'], 0.35, 6.0)
    elif estado == 'combate':  # 150 bpm: bumbo, baixo e chimbal
        baixo = ['A2', 'A2', 'C3', 'G2']
        for k in range(20):
            nota(b, k * 0.4, 0.18, 62, 0.6, 18.0, desce=90)
            nota(b, k * 0.4, 0.38, NT[baixo[k % 4]], 0.22, 5.0, 'saw')
            ruido_m(b, k * 0.4 + 0.2, 0.03, 0.12, rng)
    elif estado == 'chefe':    # pesado: trítono, bumbo grave e golpes dissonantes
        pad(b, (NT['D3'], NT['G#3']), 0.07, trem=0.6, ciclos=4)
        for k in range(16): nota(b, k * 0.5, 0.48, NT['D2'], 0.2, 2.0, 'saw')
        for k in range(0, 16, 2): nota(b, k * 0.5, 0.3, 55, 0.8, 12.0, desce=60)
        for k in range(4):
            for n in ('D4', 'D#4', 'A4'): nota(b, k * 2.0 + 1.0, 0.6, NT[n], 0.12, 6.0, 'tri')
    elif estado == 'social':   # leve: dedilhado em sol maior
        mel = ['G4', 'B4', 'D5', 'B4', 'A4', 'C5', 'E5', None, 'G4', 'D5', 'B4', 'G4', 'A4', None, 'D4', None]
        for k in range(32):
            n = mel[k % 16]
            if n: nota(b, k * 0.25, 0.3, NT[n], 0.24, 9.0, 'tri')
        for k in range(8): nota(b, k * 1.0, 0.9, NT['G2' if k % 2 == 0 else 'D3'], 0.2, 2.5, 'tri')
    else:
        pad(b, (NT['A3'],), 0.2)
    return b

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
    bloco = feel[feel.index('faixas:'):feel.index('sons:')]
    faixas = re.findall(r'(\w+):\s*\{\s*arqs:\s*(\d+)', bloco)
    pasta = raiz / 'assets' / 'audio' / 'music'; pasta.mkdir(parents=True, exist_ok=True)
    feitos = 0
    for nome, n in faixas:
        for v in range(1, int(n) + 1):
            base = pasta / f'{nome}_{v}'
            if base.with_suffix('.ogg').exists(): continue
            if base.with_suffix('.wav').exists() and not force: continue
            salvar(base.with_suffix('.wav'), musica(nome, v, random.Random(f'{nome}{v}')), TAXA_M, 0.7)
            feitos += 1
    print(f'{feitos} música(s) provisória(s) gerada(s) em {pasta.relative_to(raiz)}')

main()
