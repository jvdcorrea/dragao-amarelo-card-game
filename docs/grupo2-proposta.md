# Dragão Amarelo: Grupo 2 · A Forja Esquecida (proposta)

*Proposta v0.1 para revisão · andares 6 a 10 · complementa o design (v0.57) e os inimigos do grupo 1 (v0.12) · todos os números são provisórios*

---

## Tema

Abaixo das Grutas Vivas, a rocha esquenta. Uma civilização de **Azers**, anões de fogo vivo e artesãos lendários, ergueu aqui forjas que nunca se apagaram. Os Azers foram embora ou morreram; ficaram os **golens** que eles construíam, os **elementais de fogo e ferro** que alimentavam as fornalhas e alguns Azers que ainda guardam o lugar como se o turno de trabalho nunca tivesse acabado.

O tom continua leve, mas a forja é o primeiro trecho em que a dungeon cobra caro de quem chega despreparado.

**Por que é mais difícil:** os inimigos aguentam mais pancada (Blindagem), crescem sozinhos (Superaquecer e as Forjas) e punem decks que só sabem trocar unidades. Isso empurra o jogador a usar feitiços, a escolher alvos e a montar um deck com cartas de booster, em vez de vencer com o deck inicial.

---

## Palavras-chave novas (2) e antigas que voltam

| Palavra-chave | Texto | O que ensina |
|---|---|---|
| **Blindagem N** (nova) | Cada dano que esta unidade recebe é reduzido em N. **Feitiços ignoram a Blindagem.** | Feitiços valem ouro; golpes pequenos não resolvem. Freia decks que só trocam unidades, como o Draconic, e valoriza Space, Holy e Necro. |
| **Superaquecer** (nova) | No início do turno do dono, esta unidade ganha +1/+0 e sofre 1 de dano. | Escolher entre matar cedo ou aguentar até ela se consumir. Cria um relógio em vez de um impasse. |
| Guarda, Avanço, Letal, Imóvel | Como no grupo 1 | |
| Estruturas atacáveis | As **Forjas** do inimigo fortalecem as unidades dele a cada turno | Prioridade de alvo, como o Ninho de Morcegos |
| Brotar | A **Pilha de Sucata** brota como um golem | O mesmo dilema dos Cogumelos-Broto, agora mais caro |

> [!note] Por que a Blindagem ignora feitiços
> Uma armadura que vale contra tudo transforma lutas em impasses longos, que é exatamente o problema do Basilisco. Deixar os feitiços passarem mantém a luta rápida e dá ao jogador uma resposta clara.

---

## O que cada andar ensina

| Andar | Ensina | Encontros |
|---|---|---|
| 6 | Blindagem | Oficina de Golens |
| 7 | Superaquecer | Oficina, Bocas de Fogo |
| 8 | Forjas e Sucata que brota | Oficina, Bocas de Fogo, Fundição Abandonada; o credor volta depois deste andar |
| 9 | Azers em grupo | Todos os comuns; Elite no fim |
| 10 | Tudo junto | Comuns e Elites no caminho; chefe Ignar, o Coração da Forja |

---

## Números (mais difícil que o grupo 1)

| Nó | Vida do líder | Deck | Mão inicial | Extra |
|---|---|---|---|---|
| Batalha comum | 16 a 22 (grupo 1: 12 a 18) | 22 | 3 | Regra |
| Elite | 30 (grupo 1: 25) | 25 | 4 | Começa com 1 de mana a mais |
| Chefe | 45, em duas fases (Basilisco: 40) | 30 | 4 | Evolução e fases |

- **Meta de dificuldade:** o deck inicial perde a maioria das lutas do grupo 2; um deck com umas 6 a 10 cartas de booster bem escolhidas vence cerca de dois terços. Vou medir com o bot antes de fechar os números.
- **Vida entre lutas:** mantém a recuperação de 6 por vitória e baixa o Acampamento de 12 para 10. Com inimigos mais fortes, a vida deve começar a pesar sozinha.
- **Ouro por luta:** comuns 12 a 16, Elite 30 a 35.

---

## Encontros comuns

| Encontro | Líder | Vida | Regra | Cartas principais |
|---|---|---|---|---|
| **Oficina de Golens** | Capataz Autômato | 18 | Seus Golens entram com Blindagem 1 | Golem de Ferro 2/4, Pilha de Sucata (Brotar: Golem de Sucata 3/3), Golem-Martelo 3/3, Engrenagem Solta (2 de dano) |
| **Bocas de Fogo** | Elemental do Braseiro | 16 | Seus Elementais têm +1 de Vida | Fagulha Viva 1/2 Superaquecer, Elemental Ígneo 2/4 Superaquecer, Lufada Incandescente (1 de dano a todas as suas unidades) |
| **Patrulha Azer** | Sentinela Azer | 20 | No início do turno dele, uma unidade aliada aleatória ganha Blindagem 1 | Azer Sentinela 2/3 Guarda, Azer Lanceiro 3/2 Avanço, Azer Ferreiro 2/2 (Ao Entrar: Blindagem 1 a outra unidade), Martelo Rúnico (deixa uma unidade Imóvel e causa 1 de dano) |
| **Fundição Abandonada** | Fornalha Viva | 22 | Começa com uma Forja em campo | Forja Ardente (Estrutura, 5 de Vida: no fim do turno dele, +1/+0 a uma unidade aliada aleatória), mistura de golens e elementais |

## Elites

| Elite | Vida | Regra | Identidade |
|---|---|---|---|
| **O Colosso de Ferro** | 30 | O Colosso tem Blindagem 2 enquanto houver uma Forja em campo | Teste de prioridade: derrubar a Forja libera o líder |
| **Matriarca Azer, Senhora das Bigornas** | 30 | No fim do turno dela, a unidade aliada mais fraca ganha +1/+1 e Blindagem 1 | Teste de remoção: o campo dela fica mais duro a cada turno |

## Chefe: Ignar, o Coração da Forja

*O elemental primordial que acende todas as fornalhas. Metade fogo, metade ferro, e a razão de a forja nunca ter se apagado.*

- **Fase 1 (45 a 23 de Vida):** Ignar tem Blindagem 2. No fim do turno dele, cria um Elemental de Escória 1/1 com Superaquecer.
- **Fase 2 (22 ou menos):** **Derretimento.** A Blindagem cai, todas as unidades dele ganham Superaquecer, e no início de cada turno dele Ignar causa 1 de dano a todas as unidades em campo.
- **Ao Evoluir:** a unidade evoluída ganha Blindagem 2.
- **Desenho contra o impasse:** a fase 2 é um relógio que corre para os dois lados. Ela fica mais perigosa, mas Ignar perde a defesa, então a luta acaba rápido de um jeito ou de outro. É a lição do Basilisco.
- **Tesouro da primeira vitória:** o suficiente para a segunda parcela e um pouco mais. Proposta: **600 de ouro** para uma parcela de 500.

---

## O credor no grupo 2

Espelhando o grupo 1 (credor no andar 3, tesouro do chefe no 5):

- Depois do **andar 8**, o Barão volta para a **segunda parcela: 500 de ouro** (a primeira foi reduzida porque a guilda tinha acabado de reabrir), com o prazo negociado do mesmo jeito.
- O tesouro de Ignar, no andar 10, cobre a parcela e sobra um pouco.

---

## Sucata e o Azer da banca

- **Sucata:** recurso novo do grupo 2. Cada vitória rende Sucata (comum 1 ou 2, Elite 3, chefe 5), e alguns eventos dão ou cobram Sucata.
- **Banca Azer:** nó novo no mapa (1 ou 2 por andar) com **Durgo Brasa-Mansa** [nome provisório], um Azer exilado que montou uma banca entre as forjas e troca Sucata por vantagens. Quanto melhor, mais caro:

| Vantagem | Duração | Sucata |
|---|---|---|
| +1 carta na mão inicial | próxima luta | 2 |
| +1 de mana no primeiro turno | próxima luta | 3 |
| Recuperar 8 de vida | na hora | 3 |
| +2 cartas na mão inicial | próxima luta | 4 |
| +1 Cristal (+1 de mana máxima) | próxima luta | 5 |
| +1 carta na mão inicial | todas as lutas da descida | 8 |

- **Negociar o preço:** uma vez por visita, dá para negociar com o Durgo (Perfil Respeito: Azers respeitam quem conhece o ofício). Vitória: 20% de desconto em tudo naquela visita. Derrota: preço normal.
- É a estreia do social dentro da dungeon (P41b).

---

## Eventos (risco alto ou risco baixo)

| Evento | Escolha segura | Escolha arriscada |
|---|---|---|
| **Bigorna Abandonada** | Bater com cuidado: +1 de Sucata | Forjar com tudo: 50% de ganhar uma arma ou Módulo Raro; 50% de perder 8 de vida |
| **Rio de Metal Derretido** | Contornar: perde 2 de vida | Ponte instável: 60% de ganhar 4 de Sucata; 40% de perder 10 de vida |
| **Golem Adormecido** | Passar em silêncio | Desmontar para Sucata: +5 de Sucata, mas 50% de ele acordar (luta contra um Golem com Blindagem) |
| **Altar do Fogo Eterno** | Oferecer 20 de ouro: recupera 10 de vida | Oferecer 6 de vida: +1 de mana máxima na próxima luta |
| **Prisioneiro Azer** | Ir embora | Negociar com o guarda (luta social): o prisioneiro libertado dá 4 de Sucata e um desconto permanente na Banca |
| **O cofre de Ergos** | Evento garantido uma vez, nos andares 7 ou 8 | Abrir o cofre que Ergos escondeu entre as bigornas: lá está a **engrenagem mágica da Chrome** (key item). Entregar à Chrome fecha a quest. |

**Recompensa da quest da Chrome** [a decidir]: uma arma ou Módulo Raro do Magitech, ou um desconto permanente com ela.

---

## Notas de Ergos (6 a 10)

As notas dão pistas sobre os inimigos e mostram Ergos cada vez mais inseguro sobre o que vem depois.

6. Os golens daqui têm placas. Aço não sente arranhão: só magia passa direto. Anotei duas vezes, porque esqueci da primeira.
7. Os elementais de fogo se consomem sozinhos. Se eu aguentar uns turnos, eles se apagam. Se eu não aguentar, quem se apaga sou eu. Escondi a engrenagem da Chrome num cofre perto das bigornas; devolvo quando voltar. Ela vai cobrar juros.
8. Achei um Azer que não tenta me matar. Troca qualquer coisa por sucata e cobra caro de quem chega sem educação. Cheguei sem educação.
9. As forjas no meio dos salões alimentam tudo em volta. Quebrar a forja primeiro. Sempre a forja primeiro. Esqueci na hora, claro.
10. Lá embaixo o calor some. O que vem depois da forja me assusta de um jeito que nada aqui assustou. Se eu não voltar, Felix, a culpa é do frio, não sua.

---

## Cartas novas (recompensas do grupo 2)

Leva nova de 16 cartas: 2 por Disciplina e 4 básicas com o tema da forja. A vaga Incomum ou Rara dos boosters passa a dar Rara em 50% das vezes nos andares 6 a 10 (hoje 35%).

| Carta | Disciplina | Custo | Tipo | Texto | Raridade |
|---|---|---|---|---|---|
| Martelo de Forja | Básica | 3 | Arma 3/2 | Os ataques do protagonista com esta arma ignoram Blindagem | Incomum |
| Gato Ferreiro | Básica | 3 | Unidade 2/3 (Felino) | Ao Entrar: dê Blindagem 1 a outro Felino aliado | Comum |
| Brasa Guardada | Básica | 2 | Feitiço | Cause 2 de dano a uma unidade inimiga. Se ela morrer, compre 1 carta | Comum |
| Lingote Temperado | Básica | 1 | Feitiço | Dê +0/+2 e Blindagem 1 a uma unidade aliada | Comum |
| Golpe que Ainda Vem | Temporal | 3 | Feitiço | Atraso. No início do seu próximo turno, cause 5 de dano a um inimigo aleatório | Incomum |
| Ferreiro de Outras Eras | Temporal | 3 | Unidade 3/3 | Eco. Ao Entrar: sua arma ganha +1/+0 | Comum |
| Dragão de Escória | Draconic | 5 | Unidade 5/5 (Dragão) | Guarda. Despertar: ganha Blindagem 2 | Rara |
| Sopro de Magma | Draconic | 3 | Feitiço | Cause 2 de dano a todos os inimigos. Despertar: 3 | Incomum |
| Ferreiro Esquelético | Necro | 2 | Unidade 2/2 | Ao Morrer: dê Blindagem 1 a uma unidade aliada aleatória | Comum |
| Réquiem da Bigorna | Necro | 3 | Feitiço | Exige Compasso 3. Destrua uma unidade inimiga | Incomum |
| Sacerdote da Brasa | Holy | 3 | Unidade 2/4 | Emboscada. Ao Revelar: a unidade atacada perde a Blindagem | Comum |
| Ritual do Metal Derretido | Holy | 2 | Ritual 3 | Ao ativar: cause 3 de dano a todos os inimigos | Rara |
| Núcleo de Escória | Magitech | 2 | Módulo | Acople: +2/+0 e Blindagem 1 | Comum |
| Golem de Sucata Amigo | Magitech | 4 | Unidade 3/5 (Construto) | Blindagem 1 | Incomum |
| Meteoro Ferroso | Space | 4 | Feitiço | Órbita. Cause 3 de dano a uma unidade, +1 por Carga | Incomum |
| Astro Fundido | Space | 4 | Unidade 2/5 | Ao Entrar: dê 1 Carga às suas cartas com Órbita | Comum |

A Blindagem também vira uma ferramenta do jogador nessas cartas, então ela precisa ser bem lida nos dois lados da mesa.

---

## Pontos para decidir

1. **Blindagem como proposta:** reduz cada dano em N e feitiços a ignoram. Ou prefere outra regra?
2. **Sucata:** fica guardada entre descidas ou se perde ao fim de cada descida, como incentivo a gastar?
3. **Segunda parcela de 500 e tesouro de 600:** ok, ou outros valores?
4. **Recompensa da quest da Chrome.**
5. **Nome do Azer da banca** e se ele tem retrato.
