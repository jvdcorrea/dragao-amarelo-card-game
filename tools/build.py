"""Monta o index.html (página única) a partir de src/. Uso: python3 tools/build.py"""
from pathlib import Path
raiz = Path(__file__).resolve().parent.parent
src = raiz / 'src'
t = (src / 'template.html').read_text(encoding='utf-8')
import base64, json
imgs = {f.stem: 'data:image/webp;base64,' + base64.b64encode(f.read_bytes()).decode() for f in sorted((src / 'img').glob('*.webp'))}
t = t.replace('/*IMG*/', 'const IMG = ' + json.dumps(imgs) + ';')
# Idiomas (P101): i18n.js e os dicionários de src/lang/ vêm antes de tudo, porque as cartas já nascem traduzidas.
t = t.replace('/*LANG*/', '\n'.join(f.read_text(encoding='utf-8') for f in sorted((src / 'lang').glob('*.js'))))
# O Howler (vendor/, MIT) vai embutido para o som funcionar offline; os áudios ficam em assets/audio/, fora da página.
for marca, arq in (('/*I18N*/', 'i18n.js'), ('/*CSS*/', 'style.css'), ('/*HOWLER*/', 'vendor/howler.core.min.js'), ('/*ART*/', 'art.js'), ('/*ENGINE*/', 'engine.js'), ('/*RUN*/', 'run.js'),
                   ('/*FEEL*/', 'feel.js'), ('/*AUDIO*/', 'audio.js'), ('/*FX*/', 'fx.js'), ('/*UI*/', 'ui.js')):
    t = t.replace(marca, (src / arq).read_text(encoding='utf-8'))
(raiz / 'index.html').write_text(t, encoding='utf-8')
print(f'index.html gerado ({len(t)} bytes)')
