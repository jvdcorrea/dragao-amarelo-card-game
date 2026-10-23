# Dragão Amarelo: Inimigos · Grupo 1

*v0.10 · complementa o design (v0.40) e as cartas (v0.16) · todos os números são provisórios*

---

## Como os inimigos funcionam (P50)

- **Modelo Hearthstone:** cada encontro tem um **líder inimigo** com Vida, deck e mana (mesma curva de 1 a 10). O protagonista sempre começa (P39).
- Cada líder tem uma **Regra**: uma passiva que dá identidade ao encontro.
- Só chefes evoluem (P40).
- Decks inimigos não seguem o limite de cópias do jogador: repetição deixa a identidade do encontro clara.
- Como a ordem de turno é fixa, a dificuldade se ajusta por estas alavancas:

| Nó | Vida do líder | Deck | Mão inicial | Extra |
|---|---|---|---|---|
| Batalha comum | 12 a 18 | 20 | 3 | Regra simples |
| Elite | 25 | 25 | 4 | Regra mais forte |
| Chefe | 40 | 30 | 4 | Evolução e fases |

Referência: o protagonista tem **30 de Vida**.

> [!tip] Lutas curtas
> Com 15 a 25 minutos por andar e 3 ou 4 lutas no caminho, uma luta comum precisa durar uns 4 minutos. Vida baixa e decks pequenos nos inimigos comuns seguram esse ritmo.

---

## Grupo 1: As Grutas Vivas (andares 1 a 5)

*Tema (P51): caverna natural tomada por fungos e bichos. Tom leve: é a porta de entrada da dungeon, e cada andar ensina uma coisa.*

| Andar | O que ensina | Encontros que aparecem |
|---|---|---|
| 1 | Básico: Avanço e Guarda | Revoada na Fenda |
| 2 | Prioridade de alvo (Brotar) | Revoada, Jardim de Esporos |
| 3 | Estruturas atacáveis (Ninho de Morcegos) | Revoada, Jardim, Bicharada Mista |
| 4 | Imóvel e Letal | Todos os comuns; elite Centopeia Imperatriz |
| 5 | Tudo junto | Comuns e elites no caminho; chefe Basilisco das Grutas |

Os andares 1 a 4 fecham com uma Elite (P42), sorteada entre as do grupo a partir do andar 2; no andar 1, a "elite" é uma Revoada com +5 de Vida. Como o mapa é gerado a cada descida (P41), os encontros saem do pool do grupo, com pesos por andar.

**Pools por andar na run (P62)**

| Andar | Batalhas comuns | Elites no caminho | Nó final |
|---|---|---|---|
| 1 | Revoada | nenhuma | Revoada com +5 de Vida |
| 2 | Revoada, Jardim | Imperatriz, Fungo Desperto | Elite sorteada |
| 3 | Revoada, Jardim, Bicharada | Imperatriz, Fungo Desperto | Elite sorteada |
| 4 | Revoada, Jardim, Bicharada, Toca | Imperatriz, Fungo Desperto | Elite sorteada |
| 5 | Revoada, Jardim, Bicharada, Toca | Imperatriz, Fungo Desperto | Basilisco das Grutas |

### Palavras-chave novas (também no glossário de cartas)

| Palavra-chave | Efeito |
|---|---|
| Brotar | No início do turno do dono, a carta se transforma no que está escrito. Matar antes evita a transformação |
| Imóvel | A unidade não pode atacar no próximo turno do dono |

---

## Cartas inimigas do grupo

| Carta | Custo | Tipo | Stats | Texto |
|---|---|---|---|---|
| **Morcego da Gruta** | 1 | Unidade | 1/1 | Avanço |
| **Cogumelo-Broto** | 1 | Unidade | 0/1 | Brotar: vira um Cogumelo Adulto 3/3 |
| **Besouro Cascudo** | 2 | Unidade | 1/4 | Guarda |
| **Aranha Tecelã** | 2 | Unidade | 2/2 | Ao Entrar: deixe uma unidade inimiga Imóvel |
| **Enxame de Grilos** | 2 | Feitiço | | Invoque três Grilos 1/1 |
| **Esporos Sufocantes** | 2 | Feitiço | | Cause 1 de dano a todas as unidades inimigas |
| **Lagarto das Fendas** | 3 | Unidade | 3/2 | Emboscada |
| **Toupeira Escavadora** | 3 | Unidade | 2/3 | Ao Morrer: invoque um Cogumelo-Broto |
| **Ninho de Morcegos** | 3 | Estrutura | Vida 4 | No fim do seu turno, invoque um Morcego da Gruta |
| **Mordida Infecciosa** | 3 | Feitiço | | Cause 3 de dano a uma unidade. Se ela morrer, invoque um Cogumelo-Broto |
| **Centopeia Venenosa** | 4 | Unidade | 3/3 | Letal |
| **Fungoide Ancião** | 4 | Unidade | 3/5 | No fim do seu turno, invoque um Cogumelo-Broto |
| **Fungo Colossal** | 6 | Unidade | 5/8 | Guarda. Ao Entrar: todos os seus Cogumelos-Broto brotam agora |

---

## Encontros comuns

**Revoada na Fenda**
- Líder: Morcego Ancião · Vida 12
- Regra: seus Morcegos da Gruta têm +1/+0.
- Deck (20): Morcego da Gruta ×6, Besouro Cascudo ×4, Enxame de Grilos ×4, Lagarto das Fendas ×4, Ninho de Morcegos ×2.

**Jardim de Esporos**
- Líder: Fungoide Jardineiro · Vida 15
- Regra: seus Cogumelos-Broto brotam como 4/4 em vez de 3/3.
- Deck (20): Cogumelo-Broto ×6, Besouro Cascudo ×4, Toupeira Escavadora ×4, Esporos Sufocantes ×2, Fungoide Ancião ×2, Mordida Infecciosa ×2.

**Toca das Aranhas**
- Líder: Aranha Mãe · Vida 15
- Regra: suas Aranhas Tecelãs custam 1 a menos.
- Deck (20): Aranha Tecelã ×6, Morcego da Gruta ×4, Lagarto das Fendas ×4, Besouro Cascudo ×2, Centopeia Venenosa ×2, Mordida Infecciosa ×2.

**Bicharada Mista**
- Líder: Toupeira Rainha · Vida 18
- Regra: no início do seu turno, se tiver menos unidades que o protagonista, compre 1 carta extra.
- Deck (20): Toupeira Escavadora ×4, Morcego da Gruta ×2, Cogumelo-Broto ×2, Besouro Cascudo ×2, Aranha Tecelã ×2, Enxame de Grilos ×2, Lagarto das Fendas ×2, Mordida Infecciosa ×2, Centopeia Venenosa ×2.

---

## Elites

**Centopeia Imperatriz**
- Vida 25 · mão inicial 4
- Regra: suas unidades com Letal custam 1 a menos e têm +0/+1.
- Deck (25): Centopeia Venenosa ×6, Aranha Tecelã ×4, Lagarto das Fendas ×4, Besouro Cascudo ×4, Mordida Infecciosa ×3, Esporos Sufocantes ×2, Morcego da Gruta ×2.

**Fungo Colossal Desperto**
- Vida 25 · mão inicial 4
- Regra: seus Cogumelos Adultos têm Guarda.
- Deck (25): Cogumelo-Broto ×6, Fungoide Ancião ×4, Toupeira Escavadora ×4, Besouro Cascudo ×4, Esporos Sufocantes ×3, Fungo Colossal ×2, Mordida Infecciosa ×2.

---

## Chefe (P52): Basilisco das Grutas

*Monstro clássico do tema: um lagarto enorme cujo olhar petrifica. O covil é um jardim de fungos crescendo sobre as estátuas das vítimas.*

- Vida 40 · deck 30 · mão inicial 4
- **Regra: Olhar Petrificante.** No fim do turno do Basilisco, a unidade do protagonista com maior Ataque fica Imóvel.
- **Evolução:** 2 pontos, a partir do turno 4 dele.
- **Fase 2: Troca de Pele.** Ao chegar a 20 de Vida ou menos, recupera 8 de Vida (uma vez) e o Olhar passa a afetar as duas unidades de maior Ataque.

**Cartas exclusivas do chefe**

| Carta | Custo | Tipo | Stats | Texto |
|---|---|---|---|---|
| **Estátua Antiga** | 2 | Estrutura | Vida 6 | Enquanto estiver em campo, o Basilisco não pode ser alvo de feitiços |
| **Ninhada de Basilisco** | 3 | Estrutura | Vida 3 | Brotar: vira um Filhote de Basilisco |
| **Filhote de Basilisco** | 3 | Unidade | 3/3 | Ao Evoluir: deixe uma unidade inimiga Imóvel |
| **Cauda Sísmica** | 4 | Feitiço | | Cause 2 de dano a todas as unidades inimigas |
| **Mordida Petrificante** | 5 | Feitiço | | Destrua uma unidade Imóvel |

**Deck (30):** Ninhada de Basilisco ×3, Filhote de Basilisco ×3, Mordida Petrificante ×3, Estátua Antiga ×2, Cauda Sísmica ×2, Lagarto das Fendas ×4, Cogumelo-Broto ×4, Besouro Cascudo ×3, Fungoide Ancião ×2, Mordida Infecciosa ×2, Fungo Colossal ×2.

**Recompensas da primeira vitória**
- **Escama de Basilisco** (neutra social, adicionada ao arquivo de cartas): Tática de 2, cause 3 de dano à Resistência; Perfil Respeito, 6.
- 1 carta de Disciplina à escolha, entre Recompensas.
- Nota de Ergos do grupo 1.

> [!tip] Contrajogo do Olhar
> O Olhar sempre pega a unidade de maior Ataque, então o jogador aprende a manipulá-lo: iscas com Ataque alto, várias unidades medianas, Emboscada ou Escudo. A Mordida Petrificante pune quem ignora o Olhar.

> [!warning] Olhar contra decks de unidade única
> Temporal Warfare, com muitas unidades de Ataque parecido, sente pouco. Draconic Primalism, que aposta numa unidade enorme, sente muito. Isso varia a experiência entre Disciplinas, mas vale testar se Draconic não fica travado no chefe.

> [!tip] Nota de Ergos do grupo 1
> Sugestão: Ergos passou pelo Basilisco e deixou uma anotação sobre o Olhar (dica de contrajogo). Entre as estátuas do covil, uma é de um aventureiro que desceu com ele. Gancho para os grupos seguintes.

---

## Sinais do protótipo

Medido com o deck inicial novo (20 neutras fixas + 10 introdutórias, P53) e com Temporal e Holy repaginadas (P56, P57). Simulação com um bot guloso (joga a carta mais cara que puder, prioriza Brotos e Estruturas, troca bem ou vai no líder), 40 partidas por combinação. É um sinal grosseiro: um humano joga melhor que o bot, principalmente em mira e em quando Evoluir.

| Disciplina | Comuns (faixa) | Imperatriz | Fungo Desperto | Basilisco |
|---|---|---|---|---|
| Temporal Warfare | 70% a 100% | 90% | 48% | 10% |
| Draconic Primalism | 78% a 100% | 98% | 68% | 45% |
| Necrodance | 63% a 100% | 70% | 55% | 0% |
| Holy Shadowmancy | 70% a 100% | 85% | 38% | 5% |
| Enchanting Technology | 30% a 98% | 93% | 23% | 3% |
| Space Wizardry | 53% a 100% | 78% | 33% | 5% |

> [!warning] O que os números sugerem
> - **As Disciplinas ficaram mais próximas entre si:** o núcleo neutro comum achatou as diferenças. Draconic ainda lidera, mas sem a folga de antes.
> - **A repaginada subiu Temporal e Holy:** nos comuns, Temporal foi de 48% a 100% para 70% a 100%, e Holy de 50% a 100% para 70% a 100%. Exigir o abate para o Sacrifício quase não mudou os números do Holy. Na seleção do Holy, a Purificação (limpeza de campo) fez a maior diferença contra encontros de enxame.
> - **O Basilisco continua pesado demais** (0% a 45%). Suspeitos: 40 de Vida somados à cura de 8, Estátua Antiga bloqueando feitiços e o Olhar travando a melhor unidade todo turno.
> - **Revoada na Fenda e Toca das Aranhas ficaram fáceis** (98% a 100%). Para a Revoada, que abre o andar 1, isso serve; a Toca aparece até o andar 4 e precisa de mais pressão.
> - **Jardim de Esporos segue o comum mais difícil** (30% a 78%) e ainda é mais difícil que a elite Centopeia Imperatriz para todas as Disciplinas. O Brotar 4/4 pune muito quem não mata Brotos na hora.
> - **Fungo Colossal Desperto é a elite mais dura** (23% a 68%).
