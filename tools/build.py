"""Monta o index.html (página única) a partir de src/. Uso: python3 tools/build.py"""
from pathlib import Path
raiz = Path(__file__).resolve().parent.parent
src = raiz / 'src'
t = (src / 'template.html').read_text(encoding='utf-8')
for marca, arq in (('/*CSS*/', 'style.css'), ('/*ENGINE*/', 'engine.js'), ('/*RUN*/', 'run.js'), ('/*UI*/', 'ui.js')):
    t = t.replace(marca, (src / arq).read_text(encoding='utf-8'))
(raiz / 'index.html').write_text(t, encoding='utf-8')
print(f'index.html gerado ({len(t)} bytes)')
