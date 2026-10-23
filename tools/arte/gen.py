"""Gera src/art.js a partir do repositório game-icons (CC BY 3.0).
Uso: git clone --depth 1 https://github.com/game-icons/icons.git /tmp/game-icons
     python3 tools/arte/gen.py /tmp/game-icons
O mapeamento carta -> ícone fica em tools/arte/map.py."""
import re, json, sys, subprocess
from pathlib import Path
aqui = Path(__file__).resolve().parent; raiz = aqui.parent.parent
sys.path.insert(0, str(aqui))
from map import CARD, ENC, NODE, UI
icons_dir = Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/game-icons')
ALL = [str(p.relative_to(icons_dir)) for p in icons_dir.rglob('*.svg') if not str(p.relative_to(icons_dir)).startswith('badges/')]
PREF = ['lorc', 'delapouite', 'skoll', 'carl-olsen', 'sbed']
def find(name):
    c = [p for p in ALL if p.endswith('/' + name + '.svg')]
    c.sort(key=lambda p: (PREF.index(p.split('/')[0]) if p.split('/')[0] in PREF else 99, p))
    return c[0] if c else None
ids = json.loads(subprocess.check_output(['node', '-e', f"console.log(JSON.stringify(Object.keys(require('{raiz / 'src' / 'engine.js'}').DEF)))"]).decode())
falta = [i for i in ids if i not in CARD]
if falta: print('cartas sem ícone no map.py:', falta)
icons, src = {}, {}
for n in sorted(set(CARD.values()) | set(ENC.values()) | set(NODE.values()) | set(UI.values())):
    p = find(n)
    if not p: print('ícone não encontrado:', n); continue
    svg = (icons_dir / p).read_text(encoding='utf-8')
    ds = [d for d in re.findall(r'<path[^>]*\sd="([^"]+)"', svg) if d != 'M0 0h512v512H0z']
    icons[n] = re.sub(r'(\d+\.\d)\d+', r'\1', ' '.join(ds)); src[n] = p.split('/')[0]
LIC = {}
for line in (icons_dir / 'license.txt').read_text(encoding='utf-8').splitlines():
    m = re.match(r'- ([^,\n]+?)(?:, (\S+))?(?: - (CC0))?\s*$', line)
    if m: LIC[re.sub(r'[^a-z0-9]+', '-', m.group(1).lower()).strip('-')] = (m.group(1).strip(), m.group(2), m.group(3))
authors = []
for f in sorted(set(src.values())):
    info = LIC.get({'heavenly-dog': 'heavenlydog', 'lucasms': 'lucas'}.get(f, f))
    authors.append({'folder': f, 'name': info[0] if info else f, 'url': info[1] if info else None, 'cc0': bool(info and info[2]), 'count': sum(1 for v in src.values() if v == f)})
out = 'const ART = ' + json.dumps({'icons': icons, 'card': CARD, 'enc': ENC, 'node': NODE, 'ui': UI, 'authors': authors}, ensure_ascii=False, separators=(',', ':')) + ';\nif (typeof module !== "undefined") module.exports = ART;\n'
(raiz / 'src' / 'art.js').write_text(out, encoding='utf-8')
print(f'src/art.js: {len(icons)} ícones, {len(out)} bytes')
