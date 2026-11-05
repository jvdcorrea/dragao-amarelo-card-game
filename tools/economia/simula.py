import random, statistics as S
def cycle(A, T, P, j=0.10, E=3, p=(0.85,0.8,0.75,0.7,0.5), G=50, Gb=50, M=50, notice=3, runs=20000, win_neg=0.85):
    """Um grupo de 5 andares. Um andar por dia. Credor depois do 'notice'-ésimo andar.
    p: chance de vencer cada andar; G: ouro de lutas por descida bem-sucedida (metade se falhar);
    Gb: ouro extra do chefe; M: ouro de missões por dia; T: tesouro do chefe."""
    ok = 0; budgets = []; days = []; juros = []
    for _ in range(runs):
        gold = 0; day = 0; floor = 0; due = None; amt = A; paid = False; jp = 0
        while floor < 5:
            day += 1; gold += M
            if random.random() < p[floor]:
                gold += G + (Gb + T if floor == 4 else 0); floor += 1
                if floor == notice: due = day + (P if random.random() < win_neg else P - 1)
            else: gold += G // 2
            if due is not None and not paid and day > due:
                inc = round(amt * j); amt += inc; jp += inc; due = day + (E if random.random() < win_neg else E - 1)
            if due is not None and not paid and gold >= amt and floor == 5:
                gold -= amt; paid = True
        if jp == 0: ok += 1
        budgets.append(gold); days.append(day); juros.append(jp)
    return ok / runs, S.mean(budgets), S.mean(days), S.mean(juros)
def show(nome, **kw):
    r = cycle(**kw); print(f"{nome:42} no prazo {r[0]:.0%} | sobra média {r[1]:5.0f} | dias {r[2]:.1f} | juros médio {r[3]:4.0f}")
print('Grupo 1 (Gd 50/descida, missões 50/dia)')
show('antes: tesouro 300, juros 10%', A=300, T=300, P=4, j=0.10)
show('P93: tesouro 360, juros 15%', A=300, T=360, P=4, j=0.15)
show('P93, jogador fraco (chances -15 pontos)', A=300, T=360, P=4, j=0.15, p=(0.7,0.65,0.6,0.55,0.35))
print('Grupo 2 (Gd 80/descida, missões 70/dia)')
show('antes: tesouro 800, juros 10%', A=700, T=800, P=4, j=0.10, G=80, M=70)
show('P93: tesouro 840, juros 15%', A=700, T=840, P=4, j=0.15, G=80, M=70)
show('P93, jogador fraco (chances -15 pontos)', A=700, T=840, P=4, j=0.15, G=80, M=70, p=(0.7,0.65,0.6,0.55,0.35))
