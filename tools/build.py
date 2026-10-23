"""Monta o index.html (página única) a partir de src/. Uso: python3 tools/build.py"""
from pathlib import Path
raiz = Path(__file__).resolve().parent.parent
src = raiz / 'src'
t = (src / 'template.html').read_text(encoding='utf-8')
import base64, json
imgs = {f.stem: 'data:image/webp;base64,' + base64.b64encode(f.read_bytes()).decode() for f in sorted((src / 'img').glob('*.webp'))}
t = t.replace('/*IMG*/', 'const IMG = ' + json.dumps(imgs) + ';')
for marca, arq in (('/*CSS*/', 'style.css'), ('/*ART*/', 'art.js'), ('/*ENGINE*/', 'engine.js'), ('/*RUN*/', 'run.js'), ('/*UI*/', 'ui.js')):
    t = t.replace(marca, (src / arq).read_text(encoding='utf-8'))
(raiz / 'index.html').write_text(t, encoding='utf-8')
print(f'index.html gerado ({len(t)} bytes)')
