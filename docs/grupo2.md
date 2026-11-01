# Dragão Amarelo: Grupo 2 · A Forja Esquecida

*v0.2 · implementado no protótipo · andares 6 a 10 · complementa o design (v0.58), as cartas (v0.19) e os inimigos (v0.13) · números provisórios*

---

## Tema

Abaixo das Grutas Vivas, a rocha esquenta. Uma civilização de **Azers**, anões de fogo vivo e artesãos lendários, ergueu aqui forjas que nunca se apagaram. Ficaram os **golens** que eles construíam, os **elementais de fogo e ferro** que alimentavam as fornalhas e alguns Azers que ainda guardam o lugar. Um deles, **Kryoret**, montou uma banca entre as fornalhas e troca vantagens por sucata.

---

## Palavras-chave

| Palavra-chave | Texto |
|---|---|
| **Blindagem N** (nova) | Danos menores que N não passam; danos de N ou mais passam inteiros. **Feitiços ignoram a Blindagem.** |
| **Superaquecer** (nova) | No início do turno do dono, a unidade ganha +1/+0 e sofre 1 de dano. |
| **Perfurar** (nova, do jogador) | O dano desta unidade ou arma ignora a Blindagem. |
| Voltam do grupo 1 | Guarda, Avanço, Letal, Imóvel, Brotar (a Pilha de Sucata vira golem) e Estruturas atacáveis (as Forjas) |

### Por que a Blindagem ficou como limiar

Comparei as duas regras com o bot simples e os decks iniciais das seis Disciplinas (12 lutas por Disciplina em cada linha), com força equivalente: a regra de redução com Blindagem N contra a de limiar com N + 1.

| Encontro | Redução (tira N de cada dano) | Limiar (danos menores que N não passam) |
|---|---|---|
| O Colosso de Ferro | 10% (de 0% a 33% conforme a Disciplina) | 36% (de 17% a 67%) |
| Matriarca Azer | 17% (de 0% a 33%) | 42% (de 8% a 83%) |
| Ignar | 28% (de 0% a 75%) | 64% (de 42% a 100%) |

A redução punia de forma injusta os decks de unidades pequenas: Magitech e Necrodance ficaram perto de 0% contra os líderes blindados, enquanto o Draconic, de unidades grandes, passava. O limiar pune os golpes pequenos sem zerar ninguém, e o que sobra de diferença entre as Disciplinas é a que já existia no grupo 1. Ficou o **limiar, com feitiços ignorando**: Blindagem 2 nas unidades (bloqueia golpes de 1) e 3 nos líderes blindados (bloqueia golpes de 1 e 2).

---

## Andares

| Andar | Ensina | Encontros |
|---|---|---|
| 6 | Blindagem | Oficina de Golens (o final tem +4 de Vida) |
| 7 | Superaquecer | Oficina, Bocas de Fogo; Elite no fim |
| 8 | Forjas | Oficina, Bocas de Fogo, Fundição Abandonada; o credor volta depois deste andar |
| 9 | Azers | Os quatro comuns; Elite no fim |
| 10 | Tudo junto | Os quatro comuns, Elites no caminho; chefe Ignar |

Cada andar tem 1 ou 2 **Bancas Azer** no mapa. O Acampamento recupera 10 de Vida (12 no grupo 1).

---

## Inimigos

Todos começam com 1 de mana a mais que o protagonista.

| Encontro | Tipo | Líder | Vida | Mão | Regra |
|---|---|---|---|---|---|
| Oficina de Golens | Comum | Capataz Autômato | 28 | 4 | Seus Golens entram com Blindagem 2 |
| Bocas de Fogo | Comum | Elemental do Braseiro | 26 | 4 | Seus Elementais têm +1/+2 |
| Patrulha Azer | Comum | Sentinela Azer | 24 | 4 | No início do turno dele, uma unidade aliada aleatória ganha +1/+0 e Blindagem 1 (acumula) |
| Fundição Abandonada | Comum | Fornalha Viva | 26 | 4 | Começa com uma Forja Ardente em campo |
| O Colosso de Ferro | Elite | O Colosso de Ferro | 30 | 4 | Blindagem 3 enquanto houver uma Forja em campo; começa com uma Forja |
| Matriarca Azer | Elite | Senhora das Bigornas | 30 | 4 | No fim do turno dela, a unidade aliada mais fraca ganha +1/+1 e Blindagem 1 |
| Ignar, o Coração da Forja | Chefe | Ignar | 50 | 4 | Fase 1: Blindagem 3 e um Elemental de Escória por turno. Com 25 de Vida ou menos, derrete: perde a Blindagem, as unidades dele ganham Superaquecer e, no início de cada turno dele, todas as unidades sofrem 1 de dano. Ao Evoluir: Blindagem 2. Evolução 3 |

| Carta inimiga | Custo | Tipo | Stats | Texto |
|---|---|---|---|---|
| Pilha de Sucata | 1 | Unidade (Golem) | 0/2 | Brotar: vira um Golem de Sucata 3/3 |
| Golem de Sucata | 3 | Unidade (Golem) | 3/3 | |
| Golem de Ferro | 3 | Unidade (Golem) | 2/4 | Blindagem 2 |
| Golem-Martelo | 4 | Unidade (Golem) | 3/4 | Blindagem 2 |
| Engrenagem Solta | 1 | Feitiço | | 2 de dano a uma unidade inimiga |
| Fagulha Viva | 1 | Unidade (Elemental) | 1/2 | Superaquecer |
| Elemental Ígneo | 3 | Unidade (Elemental) | 2/4 | Superaquecer |
| Elemental de Magma | 5 | Unidade (Elemental) | 4/6 | Superaquecer |
| Elemental de Escória | 1 | Unidade (Elemental) | 1/1 | Superaquecer (criado por Ignar) |
| Lufada Incandescente | 2 | Feitiço | | 1 de dano a todas as unidades inimigas |
| Azer Sentinela | 2 | Unidade (Azer) | 2/3 | Guarda |
| Azer Lanceiro | 3 | Unidade (Azer) | 3/2 | Avanço |
| Azer Ferreiro | 2 | Unidade (Azer) | 2/2 | Ao Entrar: Blindagem 1 a outra unidade aliada |
| Martelo Rúnico | 2 | Feitiço | | 1 de dano a uma unidade inimiga e deixa-a Imóvel |
| Forja Ardente | 3 | Estrutura | 5 de Vida | No fim do turno do dono, uma unidade aliada aleatória ganha +1/+1 |

**Dificuldade medida** (bot simples, decks iniciais, 12 lutas por Disciplina): comuns de 60% a 71% de vitórias; Colosso 24%; Matriarca 45%; Ignar cerca de 30%, em 11 turnos em média. Com o mesmo bot, o grupo 1 fica entre 61% e 99% nos comuns, a Imperatriz em 93%, o Fungo em 20% e o Basilisco em 7%. O grupo 2 é mais duro de ponta a ponta, sem o impasse longo do Basilisco. Com cartas de booster e um jogador de verdade, os números sobem.

---

## O credor e o tesouro

- Depois do **andar 8**, o Barão volta para a **segunda parcela: 700 de ouro**, com o prazo negociado (vitória: 4 dias; derrota: 2). Se a primeira ainda estiver aberta, as duas se somam.
- **Tesouro de Ignar**: **800 de ouro** na primeira vitória.
- Ouro por luta no grupo 2: comuns 12 a 16, Elite 30 a 35, chefe 50.

---

## Sucata e a Banca de Kryoret

- **Sucata**: comuns dão 1 ou 2, Elites 3, Ignar 5; alguns eventos dão ou cobram. **Perde-se no fim da descida.**
- **Kryoret**, com retrato próprio na banca:

| Vantagem | Duração | Sucata |
|---|---|---|
| +1 carta na mão inicial | próxima luta | 2 |
| +1 de mana no primeiro turno | próxima luta | 3 |
| Recuperar 8 de Vida | na hora | 3 |
| +2 cartas na mão inicial | próxima luta | 4 |
| +1 Cristal (+1 de mana máxima) | próxima luta | 5 |
| +1 carta na mão inicial | todas as lutas da descida | 8 |

- **Negociar** (uma vez por banca): luta social contra Kryoret, Perfil Respeito, 16 de Resistência. Vitória: 20% de desconto naquela banca.

---

## Eventos

| Evento | Segura | Arriscada |
|---|---|---|
| Bigorna Abandonada | +1 de Sucata | 50%: arma ou Módulo Raro; 50%: perde 8 de Vida |
| Rio de Metal Derretido | Perde 2 de Vida | 60%: +4 de Sucata; 40%: perde 10 de Vida |
| Golem Adormecido | Passar em silêncio | +5 de Sucata; 50% de ele acordar (luta) |
| Altar do Fogo Eterno | 20 de ouro: recupera 10 de Vida | 6 de Vida: +1 de mana máxima na próxima luta |
| Prisioneiro Azer | Não se meter | Negociação com o guarda (Procedimento, 14): +4 de Sucata e desconto em todas as bancas da descida |
| Respiro de Vapor | Recupera 3 de Vida | Perde 5 de Vida: 2 cartas a mais na próxima luta |
| **O Cofre de Ergos** | Garantido no primeiro evento dos andares 7 ou 8, até ser aberto | A engrenagem mágica da Chrome |

**Quest da Chrome**: entregar a engrenagem libera uma fala nova; ela paga 100 de ouro e a quest fecha [recompensa provisória].

---

## Notas de Ergos (6 a 10)

6. Os golens daqui têm placas. Aço não sente arranhão: só magia passa direto, ou um golpe forte de verdade. Anotei duas vezes, porque esqueci da primeira.
7. Os elementais de fogo se consomem sozinhos. Se eu aguentar uns turnos, eles se apagam. Se eu não aguentar, quem se apaga sou eu. Escondi a engrenagem da Chrome num cofre perto das bigornas; devolvo quando voltar. Ela vai cobrar juros.
8. Achei um Azer que não tenta me matar. Troca qualquer coisa por sucata e cobra caro de quem chega sem educação. Cheguei sem educação.
9. As forjas no meio dos salões alimentam tudo em volta. Quebrar a forja primeiro. Sempre a forja primeiro. Esqueci na hora, claro.
10. Lá embaixo o calor some. O que vem depois da forja me assusta de um jeito que nada aqui assustou. Se eu não voltar, Felix, a culpa é do frio, não sua.

---

## Cartas novas (28)

Aparecem nas recompensas depois que o jogador conclui o andar 5 (boosters do andar, Tesouros, Elites e Mestres). Nos andares 6 a 10, a vaga Incomum ou Rara dos boosters dá Rara em 50% das vezes.

| Carta | Disciplina | Custo | Tipo | Texto | Raridade |
|---|---|---|---|---|---|
| Martelo de Forja | Básica | 3 | Arma 3/2 | Perfurar | Incomum |
| Gato Ferreiro | Básica | 3 | Unidade 2/3 (Felino) | Ao Entrar: Blindagem 2 a outro Felino aliado | Comum |
| Brasa Guardada | Básica | 2 | Feitiço | 2 de dano a uma unidade inimiga; se ela morrer, compre 1 carta | Comum |
| Lingote Temperado | Básica | 1 | Feitiço | +0/+1 e Blindagem 2 a uma unidade aliada | Comum |
| Golpe que Ainda Vem | Temporal | 3 | Feitiço | Atraso: no início do seu próximo turno, 5 de dano a um inimigo aleatório | Incomum |
| Ferreiro de Outras Eras | Temporal | 3 | Unidade 3/3 | Eco. Ao Entrar: sua arma ganha +1/+0 | Comum |
| Veterano da Bigorna | Temporal | 4 | Unidade 4/3 | Acelerar. Perfurar | Rara |
| Ensaio de Batalha | Temporal | 1 | Feitiço | Prever 2; se você controlar uma unidade com Acelerar, compre 1 carta | Comum |
| Dragão de Escória | Draconic | 5 | Unidade 5/5 (Dragão) | Guarda. Despertar: Blindagem 3 | Incomum |
| Sopro de Magma | Draconic | 3 | Feitiço | 2 de dano a todos os inimigos. Despertar: 3 | Incomum |
| Ovo Incandescente | Draconic | 2 | Unidade 0/3 | Guarda. Ao Morrer: ganhe 1 Cristal | Comum |
| Wyrm de Ferro | Draconic | 7 | Unidade 6/7 (Dragão) | Blindagem 2. Despertar: Perfurar | Rara |
| Ferreiro Esquelético | Necro | 2 | Unidade 2/2 | Ao Morrer: Blindagem 2 a uma unidade aliada aleatória | Comum |
| Réquiem da Bigorna | Necro | 3 | Feitiço | Exige Compasso 3. Destrua uma unidade inimiga | Rara |
| Martelo Fúnebre | Necro | 2 | Arma 2/2 | Sempre que uma unidade aliada morrer, +1 de durabilidade | Comum |
| Cinzas que Dançam | Necro | 2 | Feitiço | Invoque um Esqueleto Bailarino. Compasso 1: dois | Incomum |
| Sacerdote da Brasa | Holy | 3 | Unidade 2/4 | Emboscada. Ao Revelar: a unidade atacada perde a Blindagem | Comum |
| Ritual do Metal Derretido | Holy | 2 | Ritual 3 | Ao ativar: 3 de dano a todos os inimigos | Rara |
| Lâmina de Obsidiana | Holy | 1 | Feitiço | +2/+0 e Perfurar a uma unidade aliada neste turno | Comum |
| Penitente da Forja | Holy | 4 | Unidade 3/5 | Guarda. Ao Entrar: reduza em 1 a contagem dos seus Rituais | Incomum |
| Núcleo de Escória | Magitech | 2 | Módulo | Acople: +1/+0 e Blindagem 2 | Comum |
| Golem de Sucata Amigo | Magitech | 4 | Unidade 3/5 (Construto) | Blindagem 2 | Incomum |
| Bancada de Rebites | Magitech | 3 | Estrutura, 4 de Vida | No fim do seu turno, Blindagem 2 a uma unidade aliada sem Blindagem | Comum |
| Autômato Fundidor | Magitech | 5 | Unidade 4/4 (Construto) | Perfurar. Ao Entrar: crie um Núcleo de Escória na mão | Rara |
| Meteoro Ferroso | Space | 4 | Feitiço | Órbita. 3 de dano a uma unidade inimiga, +1 por Carga | Incomum |
| Astro Fundido | Space | 4 | Unidade 2/5 | Ao Entrar: 1 Carga às suas cartas com Órbita | Comum |
| Faísca Magnética | Space | 1 | Feitiço | 1 de dano às unidades inimigas com Blindagem e remove a Blindagem delas | Comum |
| Cometa de Ferro | Space | 7 | Feitiço | Órbita. Custa 1 a menos por Carga. 4 de dano a todos os inimigos | Rara |

---

## A decidir

- Recompensa final da quest da Chrome (hoje 100 de ouro).
- Ajuste fino depois de playtests humanos.
- Grupo 3: o frio e o resgate de Ergos.
