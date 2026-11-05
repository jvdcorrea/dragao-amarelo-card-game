"""Roda todos os testes de navegador e mostra um resumo. Monte a página antes: python3 tools/build.py"""
import subprocess, sys, pathlib
here = pathlib.Path(__file__).parent
tests = sorted(p for p in here.glob('test_*.py'))
falhas = 0
for t in tests:
    r = subprocess.run([sys.executable, str(t)], cwd=here, capture_output=True, text=True, timeout=900)
    out = (r.stdout + r.stderr).strip().splitlines()
    ok = r.returncode == 0 and any(l.strip().endswith('erros []') for l in out)
    falhas += 0 if ok else 1
    print(('OK   ' if ok else 'FALHA'), t.name, '|', out[-1][:120] if out else '(sem saída)')
sys.exit(1 if falhas else 0)
