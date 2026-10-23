# Dragão Amarelo: Amostra de Cartas

*v0.16 · complementa o documento de design (v0.40) e o arquivo de inimigos · todos os números são provisórios*

**Como ler**
- Colunas: Carta | Custo | Tipo | Stats | Texto.
- Batalha: custo em mana; stats = Ataque/Vida (armas: Ataque/Durabilidade).
- Social: custo em Lábia; stats = Peso/Firmeza. Peso derruba a Firmeza de Argumentos e a Resistência do interlocutor.
- Referência de curva: uma unidade sem texto costuma somar cerca de (2 × custo + 1) em stats. Texto forte se paga com stats menores.
- Regra de dominância: nenhuma carta pode ser estritamente pior que outra da mesma raridade que caiba no mesmo deck (mesma Disciplina ou neutra), ou seja, de mesmo tipo, custo igual ou maior e nada a mais. Entre raridades diferentes, a versão de raridade maior pode ser melhor.

---

## Glossário provisório

### Batalha

| Palavra-chave | Efeito |
|---|---|
| Ao Entrar | Efeito quando a carta é jogada |
| Ao Morrer | Efeito quando a unidade morre |
| Ao Evoluir | Efeito quando a unidade recebe Evolução (+2/+2 e pode atacar unidades no mesmo turno) |
| Guarda | Inimigos precisam atacar unidades com Guarda primeiro |
| Acelerar | Pode atacar qualquer alvo, inclusive o líder, no turno em que entra (antiga Investida; o Haste do MTG) |
| Avanço | Pode atacar unidades no turno em que entra |
| Letal | Destrói qualquer unidade que ferir |
| Dreno | O dano causado cura o protagonista |
| Escudo | Ignora a primeira instância de dano |
| Emboscada | Não pode ser atacada nem alvo de efeitos inimigos até atacar |
| Revelar | Quando uma unidade ataca saindo da Emboscada, ela se revela e o efeito Ao Revelar dispara |
| Sacrifício | Se o ataque que revela a unidade destruir a unidade atacada, seus Rituais perdem 1 de contagem |
| Estrutura | Permanente em campo com Vida própria; não ataca, mas pode ser atacada e destruída por dano (P49) |
| Eco | Ao morrer pela primeira vez, volta no início do seu próximo turno com o Ataque original e 1 de Vida, sem Eco |
| Atraso | A unidade só aparece em campo no início do seu próximo turno. Barateia a carta; com Acelerar, vira uma emboscada |
| Adiantar X | Ao jogar, você pode pagar X de mana a mais para a unidade ganhar Acelerar |
| Prever X | Olhe as X cartas do topo do seu deck, pegue uma para a mão e mande as outras para o fundo |
| Cristal | Ganhar Cristal = +1 de mana máxima, vazio. Se a mana máxima já for 10, compre 1 carta em vez disso. No social, vale para a Lábia |
| Despertar | Efeito extra se sua mana máxima for 7 ou mais (no social, Lábia máxima) |
| Dragão / Construto / Felino | Marcações de unidade; algumas cartas interagem com unidades marcadas |
| Módulo | Feitiço que se acopla a uma unidade aliada e dá o bônus escrito. Quando a unidade morre, o Módulo volta para a sua mão |
| Compasso | Conta só as cartas jogadas da mão no turno (P48): 1, 2, 3. **Compasso X:** efeito extra se esta for a X-ª carta. **Exige Compasso X:** só pode ser jogada nessa posição. Pode combinar posições ("Compasso 1 ou 3"). Depois da 3ª, volta ao 1 (valsa: 1-2-3-1-2-3) |
| Sangria X | Você pode pagar X de vida em vez do custo em mana |
| Ritual X | Permanente com contagem X; perde 1 no início do seu turno e ativa ao chegar a 0. Não pode ser atacado, só removido por efeitos (P49) |
| Armadilha | Permanente oculto; ativa quando sua condição acontece no turno inimigo. Não pode ser atacada (P49) |
| Brotar | No início do turno do dono, a carta se transforma no que está escrito. Matar antes evita a transformação |
| Imóvel | A unidade não pode atacar no próximo turno do dono |
| Órbita | Enquanto está na sua mão, ganha 1 Carga sempre que você lança um feitiço. No social, conta Táticas |

### Social

| Termo | Significado |
|---|---|
| Compostura | Sua vida na negociação |
| Resistência | Vida do interlocutor |
| Lábia | Mana social, mesma curva da batalha |
| Argumento | Unidade social (Peso/Firmeza) |
| Tática | Feitiço social |
| Abertura / Repercussão | Equivalentes de Ao Entrar / Ao Morrer |
| Ponto Sensível | Equivalente de Guarda |
| Álibi | Equivalente de Escudo |
| Ênfase / Ao Enfatizar | Evolução social |
| Perfil | Traço do interlocutor: Ganância, Vaidade, Princípios, Procedimento ou Respeito. A tática certa no perfil certo rende mais; no perfil errado, sai pela culatra |

---

## Temporal Warfare · Aggro (repaginada)

*Fantasia: o protagonista convoca guerreiros do passado com o poder da dungeon. Plano de jogo: bater desde o turno 1 com Acelerar, usar Atraso como desconto e emboscada, e trazer guerreiros de volta com Eco ainda ameaçando.*

**O que mudou (P56)**
- **Acelerar** (antiga Investida, o Haste do MTG) vira a mecânica central.
- **Eco** devolve a unidade com o Ataque original e 1 de Vida, em vez de 1/1.
- **Atraso** barateia a carta; com Acelerar, a unidade aparece e já bate, como uma emboscada.
- **Prever** agora compra: olhe X, pegue 1, o resto vai para o fundo.

**Três eixos internos**
- **Acelerar:** unidades que batem no turno em que entram (Batedor, Veterano, Coluna, Cavaleiro; Adiantar no Escudeiro e no Duelista).
- **Eco:** guerreiros que voltam ainda perigosos (Recruta, Estandarte, Lição da História, Marechal).
- **Armas e alcance:** dano direto e o protagonista atacando (Golpe Previsto, Arqueira, Lâmina, Machado).

**Batalha** (Origem: *Inicial* vem com a Disciplina; *Recompensa* sai da dungeon ou de mestres)

| Carta | Custo | Tipo | Stats | Texto | Origem |
|---|---|---|---|---|---|
| **Recruta de Outra Era** | 1 | Unidade | 2/1 | Eco | Inicial |
| **Batedor de Amanhã** | 1 | Unidade | 3/2 | Atraso. Acelerar | Inicial |
| **Escudeiro Apressado** | 1 | Unidade | 2/1 | Adiantar 1 | Inicial |
| **Golpe Previsto** | 2 | Feitiço | | Cause 2 de dano a um inimigo. Prever 2 | Inicial |
| **Arqueira do Passado** | 2 | Unidade | 2/2 | Ao Entrar: cause 1 de dano a um inimigo | Inicial |
| **Rebobinar** | 2 | Feitiço | | Devolva uma unidade aliada à sua mão; ela custa 1 a menos e ganha Acelerar | Inicial |
| **Lâmina Rebobinada** | 3 | Arma | 3/2 | Ao Entrar: Prever 2 | Inicial |
| **Veterano Antecipado** | 3 | Unidade | 3/2 | Acelerar. Ao Evoluir: ganha Eco | Inicial |
| **Duelista de Antigamente** | 3 | Unidade | 4/2 | Adiantar 2 | Inicial |
| **Lição da História** | 3 | Feitiço | | Compre 2 cartas. Se uma unidade aliada voltou por Eco neste turno, compre 3 em vez disso | Inicial |
| **Coluna de Amanhã** | 3 | Unidade | 4/4 | Atraso. Acelerar | Inicial |
| **Estandarte das Eras** | 3 | Estrutura | Vida 4 | Suas unidades com Eco têm +1/+0. Unidades que voltam por Eco voltam com 2 de Vida | Inicial |
| **Machado de Mil Batalhas** | 4 | Arma | 3/3 | Sempre que o protagonista atacar com esta arma, invoque um Recruta de Outra Era | Recompensa |
| **Cavaleiro da Primeira Coroa** | 5 | Unidade | 5/3 | Acelerar. Ao Evoluir: ganha Eco | Inicial |
| **Carga Através dos Séculos** | 6 | Feitiço | | Suas unidades ganham +2/+0 e Acelerar neste turno | Recompensa |
| **Marechal do Fim dos Tempos** | 7 | Unidade | 6/6 | Ao Entrar: para até 3 unidades aliadas diferentes que morreram nesta batalha, invoque uma cópia com o Ataque original, 1 de Vida e Eco | Recompensa |

**Social** (prever as falas, intimidar, precedentes)

| Carta | Custo | Tipo | Stats | Texto | Origem |
|---|---|---|---|---|---|
| **Fala Antecipada** | 1 | Tática | | Olhe a carta do topo do deck do interlocutor; você pode colocá-la no fundo. Compre 1 carta | Inicial |
| **Resposta Ensaiada** | 1 | Tática | | Na próxima vez que o interlocutor usar uma Tática, cause 3 de dano à Resistência dele | Inicial |
| **Olhar de Campo de Batalha** | 2 | Tática | | Cause 2 de dano à Resistência. Perfil Respeito: cause 4 em vez disso | Inicial |
| **Precedente Histórico** | 2 | Argumento | 2/3 | Eco. Abertura: se o perfil for Procedimento, ganha +1/+1 | Inicial |
| **Veterano de Mil Guerras** | 3 | Argumento | 3/2 | Abertura: cause 1 de dano a cada Argumento inimigo com 2 ou menos de Firmeza. Ao Enfatizar: repete a Abertura | Inicial |
| **Lembrança Inconveniente** | 3 | Tática | | Destrua um Argumento inimigo com 3 ou menos de Peso | Recompensa |
| **Testemunha de Outra Época** | 4 | Argumento | 3/4 | Atraso. Quando aparecer, cause 3 de dano à Resistência | Recompensa |
| **Ultimato** | 5 | Tática | | Seus Argumentos ganham +2 de Peso neste turno | Recompensa |

> [!tip] Precedente Histórico contra o governo
> Burocratas costumam ter perfil Procedimento. Um Argumento de "já foi feito assim antes" que volta com Eco é a resposta temática ao cartório que declarou Ergos morto.

**Seleção introdutória** (10 cartas; entra no deck inicial junto com as 20 neutras fixas, P53)

| Carta | Cópias | Custo | O que ensina |
|---|---|---|---|
| Recruta de Outra Era | 2 | 1 | Eco |
| Golpe Previsto | 2 | 2 | Alcance e Prever |
| Veterano Antecipado | 2 | 3 | Acelerar e Ao Evoluir |
| Coluna de Amanhã | 2 | 3 | Atraso + Acelerar como emboscada |
| Cavaleiro da Primeira Coroa | 2 | 5 | Acelerar como finalizador |

Deck inicial completo (30 cartas): custo médio ≈ 2,3. O resto do pool da Disciplina chega por Recompensa e pelos mestres.

---

## Draconic Primalism · Ramp e criaturas grandes (aprofundada)

*Fantasia: a força bruta da natureza e de dragões ancestrais. Plano de jogo: sobreviver ao começo atrás de Guarda, acelerar a mana com Cristais e chegar ao Despertar (mana máxima 7+) antes do inimigo, quando as cartas mudam de patamar e os dragões entram.*

**Três eixos internos**
- **Ramp:** Cristais e mana temporária para pular etapas (Seiva Primordial, Broto Ancestral, Chamado da Mata, Guardiã do Bosque).
- **Despertar:** cartas medianas no começo que viram ameaças depois do 7 (Muralha de Raízes, Rugido Primal, Matriarca dos Ninhos, Fúria Selvagem).
- **Dragões:** unidades grandes e cartas que premiam ter Dragões (Ovo do Penhasco, Draconete Curioso, Sopro Ancestral, Wyrm do Âmago, Rei-Dragão).

**Batalha**

| Carta | Custo | Tipo | Stats | Texto | Origem |
|---|---|---|---|---|---|
| **Ovo do Penhasco** | 1 | Unidade | 0/3 | Guarda. Ao Morrer: invoque um Filhote de Dragão 2/2 (Dragão) | Inicial |
| **Seiva Primordial** | 1 | Feitiço | | Ganhe 2 de mana neste turno | Inicial |
| **Broto Ancestral** | 2 | Unidade | 1/3 | Ao Entrar: ganhe 1 Cristal | Inicial |
| **Muralha de Raízes** | 2 | Unidade | 1/4 | Guarda. Despertar: entra com +2/+2 | Inicial |
| **Pele de Escamas** | 2 | Feitiço | | Dê +1/+3 e Guarda a uma unidade aliada | Inicial |
| **Chamado da Mata** | 3 | Feitiço | | Ganhe 1 Cristal. Compre 1 carta | Inicial |
| **Rugido Primal** | 3 | Feitiço | | Cause 3 de dano a uma unidade. Despertar: cause 3 de dano a todas as unidades inimigas em vez disso | Inicial |
| **Draconete Curioso** | 3 | Unidade (Dragão) | 3/3 | Ao Entrar: se você tiver um Dragão na mão, ganha +1/+1 | Inicial |
| **Guardiã do Bosque** | 4 | Unidade | 3/5 | Guarda. Ao Evoluir: ganhe 1 Cristal | Inicial |
| **Sopro Ancestral** | 4 | Feitiço | | Cause 2 de dano a todos os inimigos. Se você controlar um Dragão, cause 3 em vez disso | Inicial |
| **Matriarca dos Ninhos** | 5 | Unidade (Dragão) | 4/6 | Ao Entrar: invoque um Ovo do Penhasco. Despertar: invoque dois em vez disso | Inicial |
| **Fúria Selvagem** | 5 | Feitiço | | Dê +4/+4 e Avanço a uma unidade aliada. Despertar: ela ganha Acelerar em vez de Avanço | Recompensa |
| **Titã do Bosque** | 7 | Unidade | 7/7 | Guarda. Ao Entrar: recupere 5 de vida | Inicial |
| **Wyrm do Âmago** | 8 | Unidade (Dragão) | 8/8 | Guarda. Ao Evoluir: cause 3 de dano a todos os inimigos | Recompensa |
| **Rei-Dragão Ancestral** | 10 | Unidade (Dragão) | 10/10 | Custa 1 a menos para cada Cristal que você ganhou nesta batalha. Ao Entrar: destrua todas as outras unidades | Recompensa |

**Social** (presença imponente, força bruta, paciência de dragão)

| Carta | Custo | Tipo | Stats | Texto | Origem |
|---|---|---|---|---|---|
| **Calma Ancestral** | 1 | Tática | | Ganhe 1 Cristal (Lábia) | Inicial |
| **Paciência de Dragão** | 2 | Tática | | Recupere 4 de Compostura. Despertar: recupere 8 em vez disso | Inicial |
| **Olhar Inabalável** | 2 | Argumento | 1/5 | Ponto Sensível | Inicial |
| **Bufada de Desdém** | 3 | Tática | | Cause 3 de dano a um Argumento inimigo. Despertar: a todos os Argumentos inimigos | Inicial |
| **Força Bruta** | 4 | Tática | | Cause 4 de dano à Resistência. Perfil Respeito: cause 6 em vez disso | Inicial |
| **Presença Colossal** | 6 | Argumento | 5/7 | Ponto Sensível. Abertura: Argumentos inimigos com 3 ou menos de Peso não podem atacar no próximo turno | Inicial |
| **Tesouro do Ninho** | 3 | Tática | | Cause 2 de dano à Resistência. Perfil Ganância: cause 6 em vez disso | Recompensa |
| **Voz do Ancião** | 8 | Argumento | 7/7 | Abertura: cause 5 de dano à Resistência | Recompensa |

**Seleção introdutória** (10 cartas; entra no deck inicial junto com as 20 neutras fixas, P53)

| Carta | Cópias | Custo | O que ensina |
|---|---|---|---|
| Broto Ancestral | 2 | 2 | Cristal |
| Muralha de Raízes | 2 | 2 | Guarda e Despertar |
| Rugido Primal | 2 | 3 | Remoção que cresce no Despertar |
| Matriarca dos Ninhos | 2 | 5 | Dragões e Ovos |
| Titã do Bosque | 2 | 7 | A recompensa do ramp |

Deck inicial completo (30 cartas): custo médio ≈ 2,6. O resto do pool da Disciplina chega por Recompensa e pelos mestres.

> [!tip] Fraqueza intencional
> Pouca remoção barata e quase nenhuma pressão no começo: Draconic depende de Guarda até o Despertar. Contra inimigos agressivos, isso é o desafio da Disciplina, e é aí que as neutras de controle (Rede de Captura, Tocha do Explorador) ajudam.

> [!warning] Rei-Dragão Ancestral
> Com muitos Cristais, ele pode sair barato e limpar o campo inteiro. Contra chefes com fases, pode resolver lutas cedo demais. Testar; alternativa: em vez de destruir, causa 10 de dano dividido entre as outras unidades.

---

## Necrodance · Valor na morte, vida como recurso (aprofundada)

*Fantasia: mortos-vivos, maldições e uma dança macabra em que o protagonista paga com a própria vida e com a de suas criaturas. Plano de jogo: turnos de várias cartas baratas no ritmo certo, unidades que valem mais mortas do que vivas e vida gasta como recurso.*

> [!tip] Lendo o Compasso
> A contagem é "um, dois, três": a 1ª carta jogada no turno está no tempo 1, a 2ª no tempo 2, a 3ª no tempo 3, e a 4ª volta ao 1, como numa valsa (P48). Na tela, um contador **1 · 2 · 3** destaca a próxima batida, então o jogador sabe exatamente o que cada carta vai fazer antes de jogá-la. Cartas de custo 0 (Pacto Sangrento, Desabafo Mórbido) servem para ajustar o ritmo.

**Três eixos internos**
- **Compasso:** cartas que rendem mais em posições específicas do turno (Passo de Abertura, Metrônomo Ósseo, Menestrel, Golpe Final da Valsa, Regente).
- **Morte:** Ao Morrer e sacrifício deliberado (Esqueleto Bailarino, Valsa Macabra, Coveiro, Maestro, Danse Macabre).
- **Sangue:** Sangria para pagar com vida, Dreno para recuperar e Maldições para travar o inimigo (Pacto Sangrento, Mão do Além, Maldição do Contratempo, Bailarina Pálida).

**Batalha**

| Carta | Custo | Tipo | Stats | Texto | Origem |
|---|---|---|---|---|---|
| **Pacto Sangrento** | 0 | Feitiço | | Perca 3 de vida. Ganhe 2 de mana neste turno | Inicial |
| **Esqueleto Bailarino** | 1 | Unidade | 1/1 | Ao Morrer: dê +1/+1 a uma unidade aliada aleatória | Inicial |
| **Passo de Abertura** | 0 | Feitiço | | Cause 1 de dano a uma unidade. Compasso 1: compre 1 carta | Inicial |
| **Metrônomo Ósseo** | 2 | Unidade | 2/2 | Compasso 2: invoque um Esqueleto Bailarino | Inicial |
| **Valsa Macabra** | 2 | Feitiço | | Destrua uma unidade aliada; o Ao Morrer dela ativa duas vezes. Compasso 3: compre 1 carta | Inicial |
| **Coveiro Ritmado** | 2 | Unidade | 1/3 | Sangria 2. Sempre que uma unidade aliada morrer, ganha +1/+0 | Inicial |
| **Maldição do Contratempo** | 2 | Feitiço | | Embaralhe 2 Contratempos no deck inimigo. Compasso 1 ou 3: embaralhe 3 em vez disso | Inicial |
| **Golpe Final da Valsa** | 2 | Feitiço | | Exige Compasso 3. Destrua uma unidade inimiga com 4 ou menos de Ataque | Inicial |
| **Menestrel Cadavérico** | 3 | Unidade | 2/3 | Sangria 3. Compasso 3: cause 2 de dano a todos os inimigos | Inicial |
| **Mão do Além** | 3 | Unidade | 3/2 | Dreno. Compasso 2: ganha Avanço | Inicial |
| **Maestro Sem Pulso** | 4 | Unidade | 3/5 | Sangria 4. Sempre que uma unidade aliada morrer, cause 1 de dano a um inimigo aleatório | Inicial |
| **Coro de Lamentos** | 4 | Feitiço | | Invoque um Esqueleto Bailarino. Compasso 1 ou 3: invoque mais dois | Inicial |
| **Bailarina Pálida** | 5 | Unidade | 4/4 | Dreno. Ao Evoluir: devolva à sua mão a última unidade aliada que morreu nesta batalha | Recompensa |
| **Danse Macabre** | 6 | Feitiço | | Destrua todas as unidades. Invoque um Esqueleto 2/2 para cada unidade aliada destruída. Compasso 3: os Esqueletos ganham Dreno | Recompensa |
| **Regente da Última Valsa** | 7 | Unidade | 5/7 | Sangria 7. Enquanto estiver em campo, toda condição de Compasso conta como cumprida | Recompensa |
| *Contratempo* (gerada) | 1 | Feitiço | | Não faz nada. Ocupa espaço na mão do inimigo | |

**Social** (humor mórbido, charme macabro, rumores como maldição; Sangria social paga com Compostura)

| Carta | Custo | Tipo | Stats | Texto | Origem |
|---|---|---|---|---|---|
| **Desabafo Mórbido** | 0 | Tática | | Perca 2 de Compostura. Ganhe 1 de Lábia neste turno | Inicial |
| **Piada de Velório** | 1 | Tática | | Cause 2 de dano à Resistência. Perfil Princípios: cause 2 de dano à sua Compostura em vez disso | Inicial |
| **Charme Fúnebre** | 2 | Argumento | 2/2 | Compasso 2: ganha Álibi | Inicial |
| **Elogio Póstumo** | 2 | Tática | | Exige Compasso 3. Cause 5 de dano à Resistência | Inicial |
| **Boato Assombrado** | 3 | Argumento | 2/3 | Repercussão: embaralhe 2 Rumores no deck do interlocutor | Inicial |
| **Testamento Revelado** | 3 | Tática | | Sangria 3. Destrua um Argumento inimigo | Recompensa |
| **Marcha Fúnebre** | 4 | Tática | | Cause 1 de dano à Resistência para cada Argumento aliado destruído nesta negociação. Compasso 1 ou 3: em dobro | Recompensa |
| **Coral de Carpideiras** | 5 | Argumento | 3/5 | Abertura: se for Compasso 3, cause 3 de dano à Resistência | Recompensa |
| *Rumor* (gerada) | 1 | Tática | | Não faz nada. Se estiver na mão do interlocutor no fim do turno dele, cause 1 de dano à Resistência dele | |

**Seleção introdutória** (10 cartas; entra no deck inicial junto com as 20 neutras fixas, P53)

| Carta | Cópias | Custo | O que ensina |
|---|---|---|---|
| Esqueleto Bailarino | 2 | 1 | Ao Morrer |
| Passo de Abertura | 2 | 0 | Compasso 1 |
| Metrônomo Ósseo | 2 | 2 | Compasso 2 |
| Menestrel Cadavérico | 2 | 3 | Compasso 3 e Sangria |
| Maestro Sem Pulso | 2 | 4 | Valor na morte |

Deck inicial completo (30 cartas): custo médio ≈ 2,0. O resto do pool da Disciplina chega por Recompensa e pelos mestres.

> [!warning] Regente da Última Valsa
> "Todo Compasso cumprido" é um capstone divertido, mas pode apagar a mecânica justamente quando ela fica interessante. Testar; alternativa: o Regente faz a contagem andar de dois em dois (1, 3, 1, 3...).

---

## Holy Shadowmancy · Controle (repaginada)

*Fantasia: a Ordem do Véu [nome provisório], onde anjos, ninjas e fanáticos servem à mesma fé escondida. Plano de jogo: ninjas atacam das sombras, e cada inimigo abatido ao se revelar é um sacrifício de sangue que acelera os Rituais; os Rituais respondem com anjos, julgamentos e novas sombras.*

**O que mudou (P56)**
- **Revelar:** a Emboscada vira ofensiva. Ao atacar saindo da Emboscada, a unidade se revela e dispara Ao Revelar.
- **Sacrifício (P57):** se esse ataque destruir a unidade atacada, seus Rituais perdem 1 de contagem. Só revelar não basta: é o sangue que alimenta o Ritual.
- **Ponte entre ninjas e Rituais:** os ninjas aceleram os Rituais pelo Sacrifício, e o Véu Renovado devolve as unidades às sombras para revelar de novo.
- **Menos cura:** Sacerdotisa, Oração, Purificação e Grande Liturgia perderam a cura.

**Três eixos internos**
- **Sombras:** unidades em Emboscada com Ao Revelar (Noviço, Assassina, Lâmina da Prece, Mestre Sem Nome).
- **Rituais:** contagens que os Sacrifícios aceleram (Juramento Velado, Vigília Silenciosa, Véu Renovado, Grande Liturgia).
- **Fé:** Guarda e remoção para segurar o campo (Acólito, Fanático, Julgamento, Purificação, Arauto).

**Batalha**

| Carta | Custo | Tipo | Stats | Texto | Origem |
|---|---|---|---|---|---|
| **Acólito Vigilante** | 1 | Unidade | 1/2 | Guarda | Inicial |
| **Oração Breve** | 1 | Feitiço | | Reduza em 1 a contagem de um Ritual seu. Se você não tiver Ritual, compre 1 carta | Inicial |
| **Lâmina do Véu** | 1 | Feitiço | | Cause 2 de dano a uma unidade. Se você controlar uma unidade com Emboscada, cause 3 em vez disso | Inicial |
| **Noviço Sem Rosto** | 2 | Unidade | 2/2 | Emboscada. Ao Revelar: ganha +1/+1 | Inicial |
| **Juramento Velado** | 2 | Ritual 3 | | Ao ativar: invoque um Anjo Guardião 4/4 com Guarda | Inicial |
| **Véu Renovado** | 2 | Ritual 2 | | Ao ativar: suas unidades ganham Emboscada | Inicial |
| **Fanático do Véu** | 3 | Unidade | 2/4 | Guarda. Ao Evoluir: reduza em 1 a contagem de todos os seus Rituais | Inicial |
| **Assassina Devota** | 3 | Unidade | 2/1 | Emboscada. Letal | Inicial |
| **Lâmina da Prece** | 3 | Unidade | 3/2 | Emboscada. Ao Revelar e destruir uma unidade, seus Rituais perdem 2 de contagem em vez de 1 | Inicial |
| **Vigília Silenciosa** | 3 | Ritual 2 | | Ao ativar: destrua a unidade inimiga com maior Ataque | Inicial |
| **Sacerdotisa do Crepúsculo** | 4 | Unidade | 3/5 | Ao Entrar: seus Rituais perdem 1 de contagem. Sempre que um Ritual seu ativar, compre 1 carta | Inicial |
| **Mestre Sem Nome** | 4 | Unidade | 4/3 | Emboscada. Ao Evoluir: suas outras unidades ganham Emboscada | Inicial |
| **Julgamento Silencioso** | 5 | Feitiço | | Destrua uma unidade. Custa 2 a menos se você controlar uma unidade com Emboscada | Inicial |
| **Purificação** | 5 | Feitiço | | Cause 4 de dano a todas as unidades inimigas | Inicial |
| **Grande Liturgia** | 4 | Ritual 4 | | Ao ativar: invoque dois Anjos Guardiões 4/4 com Guarda | Recompensa |
| **Arauto da Aurora Velada** | 7 | Unidade | 6/7 | Guarda. Escudo. Ao Entrar: reduza em 2 a contagem de todos os seus Rituais | Recompensa |
| **Serafim de Mil Véus** | 8 | Unidade | 7/7 | Emboscada. Escudo. Ao Entrar: ative agora todos os seus Rituais | Recompensa |

**Social** (sermão e fé; segredos e chantagem)

| Carta | Custo | Tipo | Stats | Texto | Origem |
|---|---|---|---|---|---|
| **Bênção Calculada** | 1 | Tática | | Recupere 3 de Compostura. Perfil Princípios: também cause 2 de dano à Resistência | Inicial |
| **Informante das Sombras** | 2 | Argumento | 1/3 | Emboscada. Abertura: veja a mão do interlocutor; escolha uma carta, ela custa 2 a mais no próximo turno dele (chantagem) | Inicial |
| **Segredo Sussurrado** | 2 | Tática | | Cause 3 de dano à Resistência. Se você controlar um Argumento com Emboscada, cause 5 em vez disso | Inicial |
| **Vigília de Oração** | 2 | Ritual 3 | | Ao ativar: cause 6 de dano à Resistência | Inicial |
| **Testemunha Encapuzada** | 3 | Argumento | 2/4 | Ponto Sensível. Repercussão: compre 1 carta | Inicial |
| **Sermão Inflamado** | 4 | Tática | | Cause 4 de dano à Resistência. Perfil Princípios: cause 8 em vez disso | Inicial |
| **Dossiê Completo** | 5 | Tática | | Destrua todos os Argumentos inimigos com 3 ou menos de Firmeza | Recompensa |
| **Voz da Fé** | 6 | Argumento | 4/6 | Álibi. Abertura: reduza em 2 a contagem de todos os seus Rituais | Recompensa |

**Seleção introdutória** (10 cartas; entra no deck inicial junto com as 20 neutras fixas, P53)

| Carta | Cópias | Custo | O que ensina |
|---|---|---|---|
| Noviço Sem Rosto | 2 | 2 | Emboscada e Revelar |
| Juramento Velado | 2 | 2 | Ritual |
| Lâmina da Prece | 2 | 3 | Sacrifício dobrado |
| Assassina Devota | 2 | 3 | Letal garante o Sacrifício |
| Purificação | 2 | 5 | Limpeza de campo |

Deck inicial completo (30 cartas): custo médio ≈ 2,4. O resto do pool da Disciplina chega por Recompensa e pelos mestres.

> [!tip] O loop da Ordem
> Esconder, revelar, abater (Sacrifício), acelerar o Ritual, colher. O Véu Renovado (fora da seleção introdutória) fecha o ciclo devolvendo as unidades às sombras para revelar de novo.

> [!tip] Rituais legíveis
> A contagem e o efeito de cada Ritual ficam visíveis o tempo todo, para o jogador e para a IA. Um bom inimigo de controle deveria reagir a eles (correr antes que ativem), e isso vira parte do desafio.

> [!warning] Serafim de Mil Véus
> Ativar todos os Rituais de uma vez, com uma Grande Liturgia em campo, gera um turno enorme. É o capstone, então algum exagero é desejado; testar se não resolve chefes em um turno só.

---

## Enchanting Technology · Midrange e valor (aprofundada)

*Fantasia: engenhocas encantadas, alquimia e engenharia arcana. Plano de jogo: unidades medianas que acumulam Módulos, Estruturas que geram valor turno a turno e Armadilhas que punem o inimigo. Raramente vence rápido; vence porque cada troca deixa algo para trás.*

**Três eixos internos**
- **Construtos e Módulos:** upgrades acoplados que voltam para a mão quando a unidade morre (Placa de Reforço, Núcleo Encantado, Golem de Latão, Cavaleiro de Engrenagens, Canhão de Ombro).
- **Estruturas e Armadilhas:** valor contínuo e punição (Torre de Vigia, Oficina Ambulante, Armadilha de Molas, Gás Paralisante, Destilaria).
- **Alquimia e armas:** venenos, poções e Letal (Frasco Volátil, Aprendiz de Alquimista, Besta de Repetição, Autômato de Bolso).

**Batalha**

| Carta | Custo | Tipo | Stats | Texto | Origem |
|---|---|---|---|---|---|
| **Autômato de Bolso** | 1 | Unidade (Construto) | 1/2 | Ao Evoluir: ganha Letal | Inicial |
| **Frasco Volátil** | 1 | Feitiço | | Dê +1/+0 e Letal a uma unidade aliada neste turno | Inicial |
| **Placa de Reforço** | 1 | Feitiço (Módulo) | | Acople: +1/+1 | Inicial |
| **Armadilha de Molas** | 2 | Armadilha | | Quando uma unidade inimiga atacar, cause 3 de dano a ela | Inicial |
| **Aprendiz de Alquimista** | 2 | Unidade | 2/3 | Ao Entrar: crie um Frasco Volátil na sua mão | Inicial |
| **Núcleo Encantado** | 2 | Feitiço (Módulo) | | Acople: +0/+2 e Escudo | Inicial |
| **Torre de Vigia Mecânica** | 3 | Estrutura | Vida 4 | No fim do seu turno, cause 1 de dano a um inimigo aleatório | Inicial |
| **Golem de Latão** | 3 | Unidade (Construto) | 2/4 | Guarda. Sempre que um Módulo for acoplado a ele, compre 1 carta | Inicial |
| **Besta de Repetição** | 3 | Arma | 1/3 | Letal | Inicial |
| **Gás Paralisante** | 3 | Armadilha | | Quando o inimigo jogar uma unidade, ela não pode atacar no próximo turno dele. Compre 1 carta | Inicial |
| **Oficina Ambulante** | 4 | Estrutura | Vida 4 | No fim do seu turno, dê +1/+1 a uma unidade aliada aleatória | Inicial |
| **Cavaleiro de Engrenagens** | 5 | Unidade (Construto) | 4/6 | Ao Entrar: se você tiver um Módulo na mão, acople-o a esta unidade sem custo | Inicial |
| **Canhão de Ombro** | 4 | Feitiço (Módulo) | | Acople: +3/+0. Quando a unidade atacar, cause 2 de dano a outro inimigo aleatório | Recompensa |
| **Destilaria de Elixires** | 5 | Estrutura | Vida 6 | No início do seu turno, crie um Frasco Volátil na sua mão | Recompensa |
| **Colosso Arcano** | 8 | Unidade (Construto) | 6/8 | Guarda. Ao Entrar: cada Estrutura sua ativa seu efeito agora. Ao Evoluir: ganha Letal e Escudo | Recompensa |

**Social** (demonstrações, presentes engenhosos, contratos bem redigidos)

| Carta | Custo | Tipo | Stats | Texto | Origem |
|---|---|---|---|---|---|
| **Amostra Grátis** | 1 | Tática | | Recupere 2 de Compostura. Perfil Ganância: também cause 3 de dano à Resistência | Inicial |
| **Demonstração Impressionante** | 2 | Tática | | Cause 3 de dano à Resistência. Perfil Ganância: compre 1 carta | Inicial |
| **Cláusula Escondida** | 2 | Armadilha | | Quando um Argumento inimigo atacar, destrua-o se tiver 2 ou menos de Peso | Inicial |
| **Adendo Técnico** | 2 | Tática (Módulo) | | Acople a um Argumento aliado: +1/+2 | Inicial |
| **Contrato Blindado** | 3 | Argumento | 1/5 | Ponto Sensível. Álibi | Inicial |
| **Protótipo Falante** | 3 | Argumento | 2/3 | Abertura: crie uma Amostra Grátis na sua mão | Inicial |
| **Patente Registrada** | 4 | Estrutura | Vida 4 | No fim do seu turno, cause 1 de dano à Resistência. Perfil Procedimento: cause 2 em vez disso | Recompensa |
| **Exposição Grandiosa** | 5 | Tática | | Cause 2 de dano à Resistência para cada Argumento e Estrutura que você controla | Recompensa |

**Seleção introdutória** (10 cartas; entra no deck inicial junto com as 20 neutras fixas, P53)

| Carta | Cópias | Custo | O que ensina |
|---|---|---|---|
| Placa de Reforço | 2 | 1 | Módulo |
| Armadilha de Molas | 2 | 2 | Armadilha |
| Golem de Latão | 2 | 3 | Construto que compra com Módulos |
| Torre de Vigia Mecânica | 2 | 3 | Estrutura |
| Cavaleiro de Engrenagens | 2 | 5 | Acoplar Módulo de graça |

Deck inicial completo (30 cartas): custo médio ≈ 2,3. O resto do pool da Disciplina chega por Recompensa e pelos mestres.

> [!tip] Módulo é a assinatura
> O Módulo voltar para a mão quando a unidade morre é o que faz a Disciplina "nunca perder carta". Cada remoção do inimigo custa a ele uma carta e a você só a unidade.

> [!warning] Golem de Latão + Módulos
> Módulo barato que volta para a mão + Golem que compra a cada acoplamento = motor de compra de cartas. Ótimo para o papel de valor, mas vale testar se não fica infinito com Módulos de custo 1.

---

## Space Wizardry · Combo e dano direto (aprofundada)

*Fantasia: magia clássica com cara de cosmos; arcanismo, estrelas e monstros clássicos convocados de outros céus. Plano de jogo: feitiços baratos controlam o campo e carregam as cartas com Órbita na mão até um turno explosivo de dano direto.*

**Três eixos internos**
- **Órbita:** cartas que ficam mais fortes ou baratas na mão a cada feitiço lançado (Aprendiz Astral, Leitura das Estrelas, Golem de Poeira Estelar, Eclipse, Cometa Convocado, Arquimago).
- **Dano direto:** feitiços que limpam unidades e fecham a partida no herói inimigo (Faísca Estelar, Chuva de Meteoritos, Raio Lunar, Grifo Cometário).
- **Invocações clássicas:** monstros com toque cósmico que seguram o campo e premiam feitiços (Astrolábio Animado, Elemental de Nebulosa, Quimera Nebular).

**Batalha**

| Carta | Custo | Tipo | Stats | Texto | Origem |
|---|---|---|---|---|---|
| **Faísca Estelar** | 1 | Feitiço | | Cause 2 de dano | Inicial |
| **Astrolábio Animado** | 1 | Unidade | 1/2 | Sempre que você lançar um feitiço, ganha +1/+0 neste turno | Inicial |
| **Chuva de Meteoritos** | 2 | Feitiço | | Cause 3 de dano dividido aleatoriamente entre os inimigos | Inicial |
| **Aprendiz Astral** | 2 | Unidade | 2/2 | Ao Entrar: dê 1 Carga a cada carta com Órbita na sua mão | Inicial |
| **Escudo de Gravidade** | 2 | Feitiço | | Dê Escudo a uma unidade aliada. Compre 1 carta | Inicial |
| **Leitura das Estrelas** | 3 | Feitiço | | Órbita. Custa 1 a menos por Carga. Compre 2 cartas | Inicial |
| **Raio Lunar** | 3 | Feitiço | | Cause 4 de dano a uma unidade. Se ela morrer, dê 1 Carga a cada carta com Órbita na sua mão | Inicial |
| **Grifo Cometário** | 3 | Unidade | 3/2 | Avanço. Ao Evoluir: cause 2 de dano ao herói inimigo | Inicial |
| **Golem de Poeira Estelar** | 4 | Unidade | 4/5 | Guarda. Órbita: entra com +1/+1 por Carga | Inicial |
| **Elemental de Nebulosa** | 5 | Unidade | 4/5 | Ao Entrar: cause 1 de dano a todos os inimigos para cada feitiço que você lançou neste turno | Inicial |
| **Eclipse** | 5 | Feitiço | | Órbita. Cause 2 de dano a todas as unidades inimigas, +1 por Carga (máx. +3) | Inicial |
| **Cometa Convocado** | 8 | Feitiço | | Órbita. Custa 1 a menos por Carga. Cause 6 de dano a um inimigo | Inicial |
| **Quimera Nebular** | 6 | Unidade | 5/6 | Ao Entrar: lance uma cópia do último feitiço que você lançou nesta batalha, com alvos aleatórios | Recompensa |
| **Buraco Negro** | 7 | Feitiço | | Destrua todas as unidades. Para cada unidade destruída, dê 1 Carga a cada carta com Órbita na sua mão | Recompensa |
| **Arquimago do Zênite** | 9 | Unidade | 6/8 | Seus feitiços custam 1 a menos. Ao Entrar: dê 3 Cargas a cada carta com Órbita na sua mão | Recompensa |

**Social** (misterioso e sábio, jargão que confunde)

| Carta | Custo | Tipo | Stats | Texto | Origem |
|---|---|---|---|---|---|
| **Jargão Celeste** | 1 | Tática | | Um Argumento inimigo perde todo o texto | Inicial |
| **Citação Obscura** | 1 | Tática | | Cause 2 de dano à Resistência. Perfil Procedimento: cause 4 em vez disso | Inicial |
| **Aura de Mistério** | 2 | Argumento | 1/4 | Álibi | Inicial |
| **Profecia Vaga** | 2 | Tática | | Órbita. Cause 2 de dano à Resistência, +1 por Carga | Inicial |
| **Diagrama Incompreensível** | 3 | Argumento | 2/3 | Ponto Sensível. Abertura: dê 1 Carga a cada carta com Órbita na sua mão | Inicial |
| **Ar de Oráculo** | 4 | Argumento | 2/4 | Abertura: cause 1 de dano à Resistência para cada Tática que você usou nesta negociação | Inicial |
| **Silêncio Estelar** | 3 | Tática | | Todos os Argumentos inimigos perdem o texto | Recompensa |
| **Revelação Cósmica** | 6 | Tática | | Órbita. Custa 1 a menos por Carga. Cause 6 de dano à Resistência | Recompensa |

**Seleção introdutória** (10 cartas; entra no deck inicial junto com as 20 neutras fixas, P53)

| Carta | Cópias | Custo | O que ensina |
|---|---|---|---|
| Faísca Estelar | 2 | 1 | Dano direto |
| Aprendiz Astral | 2 | 2 | Cargas |
| Raio Lunar | 2 | 3 | Remoção que carrega a Órbita |
| Golem de Poeira Estelar | 2 | 4 | Órbita numa unidade |
| Cometa Convocado | 2 | 8 | Órbita como finalizador |

Deck inicial completo (30 cartas): custo médio ≈ 2,6 (nominal; Órbita barateia). O resto do pool da Disciplina chega por Recompensa e pelos mestres.

> [!tip] Órbita legível
> Cada carta com Órbita mostra seu contador de Cargas na mão, e o custo atualizado aparece direto na carta. Sem isso, o combo vira conta de cabeça. Um teto de Cargas por carta (ex.: 5) evita loops.

> [!warning] Arquimago do Zênite
> Feitiços mais baratos e 3 Cargas de uma vez podem gerar um turno praticamente infinito com feitiços de custo 1. É o capstone, mas testar com cuidado; alternativa: só a redução de custo, sem as Cargas.

---

## Neutras

*Tema (P53): os Felinos da Guilda [nome provisório], gatos aventureiros que acompanham o protagonista, mais equipamentos, armas e táticas mundanas. Algumas excepcionais (um golem, uma criatura lendária) ficam para depois.*

> [!warning] Nome dos gatos
> Palico é um termo da Capcom (Monster Hunter). Os gatos daqui são originais: usam a marcação **Felino**, e o grupo se chama provisoriamente Felinos da Guilda. Felix passa a ser um deles.

**Origem das neutras**
- **Inicial:** vem no deck inicial.
- **Guilda:** comprada ou fabricada nas instalações (Ferraria, Laboratório, Escritório).
- **Contato:** liberada por um NPC da cidade (ferreiro, boticário, cartório...).
- **Recompensa:** sai da dungeon.

### Batalha: as 20 neutras fixas do deck inicial

| Carta | Cópias | Custo | Tipo | Stats | Texto |
|---|---|---|---|---|---|
| **Felix, o Familiar** | 2 | 1 | Unidade (Felino) | 1/1 | Ao Entrar: compre 1 carta |
| **Tocha do Explorador** | 2 | 1 | Feitiço | | Cause 1 de dano a uma unidade inimiga. Compre 1 carta |
| **Rede de Captura** | 2 | 1 | Feitiço | | Deixe uma unidade inimiga Imóvel. Se você controlar um Felino, compre 1 carta |
| **Gata Curandeira** | 2 | 2 | Unidade (Felino) | 2/2 | Ao Entrar: recupere 3 de vida |
| **Gato Guardião** | 2 | 2 | Unidade (Felino) | 1/3 | Guarda. Ao Entrar: dê Escudo a outra unidade aliada |
| **Espada de Ferro** | 2 | 2 | Arma | 2/2 | |
| **Gato Coletor** | 1 | 2 | Unidade (Felino) | 2/1 | Ao Morrer: compre 1 carta |
| **Poção de Fôlego** | 1 | 2 | Feitiço | | Recupere 5 de vida |
| **Gato Lanceiro** | 2 | 3 | Unidade (Felino) | 3/2 | Avanço. Se você controlar outro Felino, entra com +1/+0 |
| **Gato Bombardeiro** | 2 | 3 | Unidade (Felino) | 3/2 | Ao Morrer: cause 1 de dano a todos os inimigos |
| **Investida Coordenada** | 1 | 3 | Feitiço | | Suas unidades ganham +1/+0 e Avanço neste turno |
| **Capitã dos Felinos** | 1 | 4 | Unidade (Felino) | 3/4 | Ao Entrar: dê +1/+1 aos seus outros Felinos |
| | **20** | | | | Custo médio ≈ 2,1; 12 Felinos |

O núcleo neutro é barato de propósito: cobre os turnos 1 a 3 de qualquer Disciplina, e as 10 cartas introdutórias trazem a identidade e o topo da curva.

### Batalha: outras neutras

| Carta | Custo | Tipo | Stats | Texto | Origem |
|---|---|---|---|---|---|
| **Mapa Rabiscado de Ergos** | 0 | Feitiço | | Compre 1 carta. Se for de Disciplina, ela custa 1 a menos | Recompensa (nota) |
| **Gato Farejador** | 1 | Unidade (Felino) | 1/2 | Ao Atacar o líder inimigo: ganhe [X] de ouro no fim da batalha | Recompensa |
| **Ração de Viagem** | 1 | Feitiço | | Dê +1/+1 a uma unidade aliada. Se for um Felino, dê +2/+2 | Guilda |
| **Bumerangue** | 1 | Feitiço | | Cause 1 de dano a um inimigo. No início do seu próximo turno, se você controlar um Felino, ele volta para a sua mão | Guilda |
| **Formação Defensiva** | 2 | Feitiço | | Dê +0/+2 a todas as unidades aliadas | Guilda |
| **Lâmina Encomendada** | 2 | Arma | 2/3 | | Contato (ferreiro) |
| **Elixir do Boticário** | 3 | Feitiço | | Recupere 4 de vida. Compre 1 carta | Contato (boticário) |
| **Barril de Pólvora** | 3 | Estrutura | Vida 2 | Quando for destruída, cause 3 de dano a todas as unidades | Guilda |

### Excepcionais [A DEFINIR]

Espaço para as neutras que não cabem em nenhuma Disciplina (um golem, uma criatura lendária). O **Gigante das Profundezas** (6 de custo, 6/7, sem texto, Recompensa) fica como marcador até você definir.

> [!tip] Felinos como cola
> A marcação Felino dá identidade às neutras sem roubar assinatura de nenhuma Disciplina: Capitã, Lanceiro, Rede de Captura, Ração e Bumerangue ficam melhores com gatos em campo. A Rede de Captura é um feitiço imediato, e não uma Armadilha, para não invadir o território de Enchanting Technology.

> [!warning] Gato Farejador
> Ouro por ataque transforma revisitas em farm otimizável. Definir [X] com teto por batalha (ou por dia) para ele ser um bônus simpático, não a estratégia ótima de renda.

### Social

| Carta | Custo | Tipo | Stats | Texto | Origem |
|---|---|---|---|---|---|
| **Suborno Discreto** | 0 | Tática | | Custa também [X] de ouro da guilda. Cause 5 de dano à Resistência. Contra o credor, o dano vai para a sua Compostura | Guilda |
| **Felix Ronronando** | 1 | Argumento (Felino) | 1/1 | Abertura: compre 1 carta | Inicial |
| **Elogio Calculado** | 1 | Tática | | Cause 2 de dano à Resistência. Perfil Vaidade: cause 4 em vez disso | Inicial |
| **Respirar Fundo** | 1 | Tática | | Recupere 3 de Compostura | Inicial |
| **Argumento Sólido** | 2 | Argumento | 2/3 | | Inicial |
| **Gato de Colo** | 2 | Argumento (Felino) | 1/3 | Ponto Sensível. Abertura: recupere 2 de Compostura | Inicial |
| **Contraproposta** | 2 | Tática | | Destrua um Argumento inimigo com 2 ou menos de Peso | Inicial |
| **Carta de Recomendação** | 2 | Argumento | 1/4 | Ponto Sensível. Abertura: se a reputação da guilda for alta [A DEFINIR], ganha +2/+0 | Guilda |
| **Fofoca de Taverna** | 2 | Tática | | Compre 2 cartas. O interlocutor compra 1 | Contato (taverna) |
| **Troféu das Profundezas** | 2 | Tática | | Cause 2 de dano à Resistência, +1 para cada chefe derrotado na campanha | Recompensa |
| **Escama de Basilisco** | 2 | Tática | | Cause 3 de dano à Resistência. Perfil Respeito: cause 6 em vez disso | Recompensa (chefe do grupo 1) |
| **Ponto Bem Colocado** | 3 | Tática | | Cause 3 de dano à Resistência ou a um Argumento | Inicial |
| **Testemunha da Guilda** | 3 | Argumento | 2/4 | Repercussão: recupere 3 de Compostura | Guilda |
| **Selo Oficial** | 4 | Argumento | 3/5 | Ponto Sensível. Abertura: se o perfil for Procedimento, cause 3 de dano à Resistência | Contato (cartório) |

> [!tip] Felix nos dois decks
> Como as duas batalhas usam o mesmo motor, Felix ganha uma versão social espelhada quase de graça. Reforça o mascote e os Felinos sem custo de sistema.

---

## Decks sociais iniciais (P54)

O deck social usa sempre a mesma Disciplina do deck de batalha e segue a mesma lógica do deck inicial: **14 neutras fixas + seleção introdutória de 6 cartas da Disciplina** (20 cartas, até 2 cópias).

**Neutras sociais fixas (14)**

| Carta | Cópias | Custo | Tipo | Stats | Texto |
|---|---|---|---|---|---|
| **Felix Ronronando** | 2 | 1 | Argumento (Felino) | 1/1 | Abertura: compre 1 carta |
| **Elogio Calculado** | 2 | 1 | Tática | | Cause 2 de dano à Resistência. Perfil Vaidade: cause 4 em vez disso |
| **Respirar Fundo** | 2 | 1 | Tática | | Recupere 3 de Compostura |
| **Argumento Sólido** | 2 | 2 | Argumento | 2/3 | |
| **Gato de Colo** | 2 | 2 | Argumento (Felino) | 1/3 | Ponto Sensível. Abertura: recupere 2 de Compostura |
| **Contraproposta** | 2 | 2 | Tática | | Destrua um Argumento inimigo com 2 ou menos de Peso |
| **Ponto Bem Colocado** | 2 | 3 | Tática | | Cause 3 de dano à Resistência ou a um Argumento |
| | **14** | | | | Custo médio ≈ 1,7 |

**Seleção introdutória social (6 por Disciplina, 3 cartas ×2)**

| Disciplina | Cartas | O que ensina |
|---|---|---|
| Temporal Warfare | Fala Antecipada, Precedente Histórico, Veterano de Mil Guerras | Prever as falas, Eco social, intimidar com Ênfase |
| Draconic Primalism | Calma Ancestral, Força Bruta, Presença Colossal | Cristal de Lábia, perfil Respeito, força bruta no topo |
| Necrodance | Desabafo Mórbido, Charme Fúnebre, Elogio Póstumo | Compasso 1, 2 e 3 (o custo 0 ajuda a acertar o ritmo) |
| Holy Shadowmancy | Informante das Sombras, Vigília de Oração, Sermão Inflamado | Chantagem, Ritual social, perfil Princípios |
| Enchanting Technology | Demonstração Impressionante, Cláusula Escondida, Adendo Técnico | Perfil Ganância, Armadilha social, Módulo social |
| Space Wizardry | Jargão Celeste, Profecia Vaga, Diagrama Incompreensível | Silenciar, Órbita social, Cargas |

---

## Raridades e boosters (P59)

Três raridades: **Comum**, **Incomum** e **Rara**. Em geral, as cartas de Recompensa são Raras; as Iniciais se dividem entre Comuns e Incomuns.

**Booster:** 5 cartas, sendo 3 Comuns, 1 Incomum e 1 vaga que vira Rara em 35% das vezes (senão, Incomum). Existe um booster por Disciplina (só cartas dela) e um **Geral** (qualquer Disciplina ou neutra). Ao concluir um andar pela primeira vez, o jogador escolhe entre o booster da Disciplina do deck e o Geral.

| Grupo | Comuns | Incomuns | Raras |
|---|---|---|---|
| Temporal Warfare | Recruta de Outra Era, Batedor de Amanhã, Escudeiro Apressado, Golpe Previsto, Arqueira do Passado, Veterano Antecipado, Duelista de Antigamente | Rebobinar, Lâmina Rebobinada, Lição da História, Coluna de Amanhã, Estandarte das Eras, Cavaleiro da Primeira Coroa | Machado de Mil Batalhas, Carga Através dos Séculos, Marechal do Fim dos Tempos |
| Draconic Primalism | Ovo do Penhasco, Seiva Primordial, Broto Ancestral, Muralha de Raízes, Pele de Escamas, Chamado da Mata, Draconete Curioso | Rugido Primal, Guardiã do Bosque, Sopro Ancestral, Matriarca dos Ninhos, Titã do Bosque | Fúria Selvagem, Wyrm do Âmago, Rei-Dragão Ancestral |
| Necrodance | Esqueleto Bailarino, Passo de Abertura, Metrônomo Ósseo, Coveiro Ritmado, Mão do Além, Pacto Sangrento | Valsa Macabra, Maldição do Contratempo, Golpe Final da Valsa, Menestrel Cadavérico, Maestro Sem Pulso, Coro de Lamentos | Bailarina Pálida, Danse Macabre, Regente da Última Valsa |
| Holy Shadowmancy | Acólito Vigilante, Oração Breve, Lâmina do Véu, Noviço Sem Rosto, Juramento Velado, Fanático do Véu | Véu Renovado, Assassina Devota, Lâmina da Prece, Vigília Silenciosa, Sacerdotisa do Crepúsculo, Mestre Sem Nome, Julgamento Silencioso, Purificação | Grande Liturgia, Arauto da Aurora Velada, Serafim de Mil Véus |
| Enchanting Technology | Autômato de Bolso, Frasco Volátil, Placa de Reforço, Armadilha de Molas, Aprendiz de Alquimista, Núcleo Encantado | Torre de Vigia Mecânica, Golem de Latão, Besta de Repetição, Gás Paralisante, Oficina Ambulante, Cavaleiro de Engrenagens | Canhão de Ombro, Destilaria de Elixires, Colosso Arcano |
| Space Wizardry | Faísca Estelar, Astrolábio Animado, Chuva de Meteoritos, Aprendiz Astral, Escudo de Gravidade | Leitura das Estrelas, Raio Lunar, Grifo Cometário, Golem de Poeira Estelar, Elemental de Nebulosa, Eclipse, Cometa Convocado | Quimera Nebular, Buraco Negro, Arquimago do Zênite |
| Neutras | Felix, o Familiar, Tocha do Explorador, Rede de Captura, Gata Curandeira, Gato Guardião, Espada de Ferro, Gato Coletor, Poção de Fôlego, Gato Lanceiro, Gato Bombardeiro, Ração de Viagem, Bumerangue | Investida Coordenada, Capitã dos Felinos, Formação Defensiva, Lâmina Encomendada, Elixir do Boticário, Barril de Pólvora | Mapa Rabiscado de Ergos, Gigante das Profundezas |

> [!warning] Gato Farejador fora dos boosters
> Ele dá ouro, e o protótipo ainda não tem economia de ouro. Volta quando a guilda entrar.

---

## O que esta amostra testa

- **Keyword + Ao Evoluir** (Veterano Antecipado, Autômato de Bolso): Evolução como ponto de virada de uma carta comum.
- **Mana máxima** (Broto Ancestral, Despertar): se o ramp funciona com a curva clássica e o jogador sempre começando.
- **Rituais** (Juramento Velado + Fanático do Véu): se a contagem regressiva é legível e se a aceleração por Evolução é divertida.
- **Órbita** (Aprendiz Astral + Cometa Convocado): se o combo fica satisfatório sem exigir muita conta.
- **Perfis** (Piada de Velório, Sermão Inflamado, Elogio Calculado): risco e recompensa de conhecer o interlocutor.
- **Ouro como custo social** (Suborno Discreto): liga a negociação à economia da guilda e ao perfil desconfiado do credor.

> [!success] Sangria × vida que carrega entre lutas → mantida
> Pagar com vida pesa no andar inteiro, não só na luta (P41). A tensão é intencional.

> [!success] Atraso + Acelerar → emboscada (P56)
> A unidade com Atraso e Acelerar aparece no início do seu turno e já pode bater. O aviso de um turno ao inimigo é o custo, e o Atraso barateia a carta.
