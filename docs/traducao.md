# Dragão Amarelo: tradução para o inglês

*v0.3 · 10/11/2026 · acompanha o design v0.67 (P101, P102)*

O jogo tem dois idiomas, português do Brasil e inglês. A primeira versão do inglês foi traduzida de uma vez, e as escolhas do glossário foram revisadas pelo João em 10/11/2026.

## Como funciona (P101)

- **O texto em português continua no código** e é a própria chave da tradução: `T('Voltar à guilda')` ou `` T`Dia ${n} de ouro` ``. Sem tradução, aparece o português.
- **O inglês fica em `src/lang/`:**
  - `en.js` é o dicionário (texto em português → inglês), um par por linha;
  - `en_tabelas.js` traz as palavras que o código traduz pelo valor (tags, tipos de encontro, Perfis, termos do glossário);
  - `en_regras.js` traz o que não cabe num dicionário: a lista de palavras-chave em destaque, as trocas de vocabulário do social e o acerto do “You” nas frases do registro (“You plays” vira “You play”).
- **Idioma:** o padrão é o português, para qualquer navegador. O inglês se escolhe em Configurações, no item “Idioma · Language”. A troca recarrega a página; a campanha continua salva.
- **Texto novo:** escreva em português dentro de `T(...)` e acrescente a tradução em `en.js`. `node tests/test_i18n.js` lista o que falta, o que sobrou e os marcadores `{0}` que não batem, e joga 414 partidas em inglês.
- **Lógica nunca usa texto traduzido.** Tags (`Felino`), tipos de encontro (`Chefe`) e Perfis (`Ganância`) continuam em português dentro do código; só a exibição passa por `T()`.

## Glossário

### Batalha

| Português | Inglês | Observação |
|---|---|---|
| Vida, Ataque, mana | Health, Attack, mana | |
| Unidade, Feitiço, Arma, Estrutura, Ritual, Armadilha | Unit, Spell, Weapon, Structure, Ritual, Trap | |
| Ao Entrar, Ao Morrer, Ao Evoluir, Ao Revelar | On Enter, On Death, On Evolve, On Reveal | |
| Ritual N, Ao ativar, contagem | Ritual N, On Activate, countdown | |
| Guarda | Guard | |
| Acelerar | Haste | ataca qualquer alvo no turno em que entra |
| Avanço | Rush | ataca unidades no turno em que entra |
| Letal, Dreno, Escudo | Lethal, Drain, Shield | |
| Emboscada, Revelar | Ambush, Reveal | |
| Eco, Atraso, Adiantar N | Echo, Delay, Hurry N | |
| Prever N | Foresee N | |
| Cristal, Despertar | Crystal, Awaken | |
| Compasso N, Exige Compasso N | Tempo N, Requires Tempo N | |
| Sangria N | Bloodprice N | |
| Órbita, Carga | Orbit, Charge | |
| Módulo, Acople | Module, Attach | |
| Brotar | Sprout | |
| Imóvel, deixar Imóvel | Rooted, Root | |
| Blindagem N | Plating N | |
| Superaquecer, Perfurar | Overheat, Pierce | |
| Evoluir, Evolução | Evolve, Evolution | |
| Felino, Dragão, Construto | Feline, Dragon, Construct | tags |
| Comum, Incomum, Rara | Common, Uncommon, Rare | |
| Cause N de dano / Compre / Invoque | Deal N damage / Draw / Summon | |

### Negociação

| Português | Inglês |
|---|---|
| Compostura (sua vida) | Composure |
| Resistência (vida do outro lado) | Resolve |
| Lábia (mana) | Charm |
| Argumento, Tática | Argument, Tactic |
| Peso, Firmeza | Weight, Firmness |
| Abertura, Repercussão | Opener, Fallout |
| Ponto Sensível, Álibi | Sore Spot, Alibi |
| Enfatizar, Ênfase | Emphasize, Emphasis |
| Perfil Ganância, Vaidade, Princípios, Procedimento, Respeito | Greed, Vanity, Principles, Procedure, Respect Profile |
| interlocutor | counterpart (rótulos) e the other party (texto das cartas) |
| Rumor | Rumor |

### Disciplinas (P102)

| Português | Inglês |
|---|---|
| Arte da Guerra Temporal | Temporal Warfare |
| Primalismo Dracônico | Draconic Primalism |
| Necrodança | Necrodance |
| Tenebromancia Sagrada | Holy Shadowmancy |
| Magitech | Magitech |
| Magia Espacial | Space Wizardry |

### Nomes e lugares

| Português | Inglês |
|---|---|
| Dragão Amarelo | Yellow Dragon |
| Barão Ostrander | Baron Ostrander |
| Banco da Coroa | Crown Bank |
| Sociedade Mágica | Magic Society |
| As Grutas Vivas | The Living Grottoes |
| A Forja Esquecida | The Forgotten Forge |
| Banca Azer | Azer Stall |
| Grifo Dourado | Golden Griffin |
| Rua dos Caldeireiros, Rua Baixa | Coppersmiths’ Street, Low Street |
| Cartomante, Cartomancia | Cardmancer, Cardmancy |
| Felinos da Guilda | Guild Felines |
| missões dos aventureiros, quests da história | jobs, quests |
| Quadro de Missões, Taverna, Alojamento, Recursos Humanos, Ferraria, Área de treinamento | Job Board, Tavern, Lodging, Human Resources, Smithy, Training grounds |
| Instalações, Obra, Despacho, Ida à cidade | Facilities, Construction, Dispatch, Trip to the city |
| Mochila, Sucata | Backpack, Scrap |
| Notas de Ergos | Ergos’s Notes |
| Zé Grilo | Joe Cricket |

Ficaram iguais: Felix, Ergos, Lerael Vane, Kryoret, Chrome, Odie, Gun'Liao, Charles Goodwich, Mikeus, Ko, Yaven, Tsubaki, Katya, Matador, Brisa, Vesper, Capitão Brega (virou Captain Brega), Ignar, Azer, Necro-Circus, Macabra, Calmera, ACT e os nomes dos aventureiros aleatórios.

## Decisões (10/11/2026)

- **Blindagem:** Plating.
- **Compasso:** Tempo.
- **Missão e quest:** jobs para os trabalhos dos aventureiros, quests para as tarefas da história.
- **“You” no registro:** fica como está.
- **Idioma padrão:** português, sempre. O inglês é escolha do jogador.
- **Documentos:** só em português.
- **O resto foi aprovado como estava:** Haste e Rush, Rooted, Bloodprice, Hurry, Charm, counterpart e “the other party”, nomes brasileiros dos aventureiros, Brisa e Captain Brega, a piada do Crown Credit Registry, os títulos das músicas do Charles e o inglês sem gênero.

## Lacunas conhecidas

- **Revisão nativa:** ninguém que fala inglês como primeira língua leu o texto ainda.
- **Saves antigos:** cenas que já estavam na fila (`camp.pending`) guardam título e texto prontos, no idioma em que foram criadas. Elas aparecem no idioma antigo depois da troca.
- **Log exportado:** o texto do registro sai no idioma de quem jogou. Os eventos (`events`) não dependem do idioma, e o JSON ganhou o campo `lang`.
- **Telas conferidas no inglês:** título, introdução, guilda, Felix, cidade, Mestres, Banco, Lerael, deck, mapa, batalha, fim de andar, tutorial social, Quadro, Instalações, Taverna, Configurações, Créditos e partidas avulsas. Telas raras (credor, defesas, Banca Azer, eventos do grupo 2) passaram pelo dicionário, mas não por um teste de navegador em inglês.
