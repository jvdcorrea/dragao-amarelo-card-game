# CLAUDE.md · Dragão Amarelo

Guia para o Claude Code trabalhar neste repositório. Leia inteiro antes da primeira tarefa.

## O projeto

Card game single-player no estilo Hearthstone/Shadowverse, em português do Brasil. O protagonista herda do tio Ergos a guilda de aventureiros **Dragão Amarelo**, uma dívida com o Banco da Coroa e uma dungeon embaixo da guilda que só a família pode terminar. Felix, o gato alado familiar de Ergos, guia o jogador. Tom: fantasia medieval, comédia leve com momentos sérios.

O protótipo é uma página HTML única, montada a partir de `src/`. Hoje ele tem:

- **Batalha:** 6 Disciplinas (Temporal Warfare, Draconic Primalism, Necrodance, Holy Shadowmancy, Magitech, Space Wizardry) mais cartas básicas (os Felinos da Guilda), mulligan, Evolução e as mecânicas de cada Disciplina.
- **Dungeon:** grupo 1, As Grutas Vivas (andares 1 a 5, chefe Basilisco), e grupo 2, A Forja Esquecida (andares 6 a 10, chefe Ignar). Mapa em grafo, eventos, Tesouros, Notas de Ergos, boosters com raridade.
- **Guilda:** dia com ações (descer, ida à cidade, despacho, obra), aventureiros e missões, instalações (Quadro, Taverna, Alojamento, Recursos Humanos, Ferraria, Área de treinamento), defesas noturnas físicas e sociais, quests.
- **Cidade:** os seis Mestres (vendem boosters e conversam), o Banco da Coroa, a arquivista Lerael Vane e os passeios, que dão cartas sociais.
- **Social:** negociações no mesmo motor da batalha, com vocabulário e paleta próprios (Compostura, Resistência, Lábia, Argumentos, Táticas, Perfil).
- **Dívida:** parcelas cobradas pelo Barão Ostrander, com prazo negociado e juros (P93).
- **Playtest:** batalha avulsa, negociação avulsa, log exportável em .zip e um menu de testes.

## Como o João gosta de trabalhar

- Responda em **português do Brasil**, de forma **concisa e iterativa**.
- Ao corrigir um bug, explique a **causa raiz antes da correção**.
- **Sinalize lacunas** e incertezas em vez de inventar. Ele prefere saber o que não foi verificado.
- **Sem travessões** (— ou –) em texto: documentos, falas do jogo, mensagens de commit. Use vírgula, dois-pontos, ponto ou parênteses. Em código, tudo bem.
- Textos do jogo usam **aspas tipográficas** (“ ” e ’). Aspas retas só em código.
- **Decisões de design são dele.** Quando precisar decidir algo que ele não especificou (números, nomes, falas), decida algo razoável, marque como provisório e **liste no fim da resposta** para ele revisar. Nomes provisórios ficam marcados com `[provisório]` ou `[a decidir]` nos documentos.
- Ele testa muito e manda logs. Leve os logs a sério, mas confira se a campanha usou o menu de testes (`cheatUsed`), porque isso distorce os números.

## Comandos

```bash
python3 tools/build.py                 # monta index.html a partir de src/ (rode depois de qualquer mudança em src/)
node tests/test.js                     # milhares de partidas simuladas, procura erros de motor
node tests/test_pool.js                # decks aleatórios cobrindo as cartas do pool
node tests/greedy.js                   # taxas de vitória de um bot guloso (sinal de balanceamento)
node tools/balance/encontros.js "oficina,ignar" '[["limiar",true,0]]' 12   # bot simples contra encontros escolhidos
python3 tools/economia/simula.py       # simulador da economia de um grupo (dívida, tesouro, prazo, juros)

pip install -r tests/browser/requirements.txt && python3 -m playwright install chromium
python3 tests/browser/run_all.py       # testes de navegador (precisa do index.html montado)
```

Os mesmos atalhos existem como scripts em `package.json` (`npm run build`, `npm test`, `npm run test:browser`).

Antes de entregar qualquer mudança: **build, `node tests/test.js` e `tests/browser/run_all.py`**. Para mudanças em cartas, rode também `node tests/test_pool.js`.

## Estrutura

| Caminho | O que é |
|---|---|
| `index.html` | Página montada. **Gerada pelo build; nunca edite à mão.** Fica no repositório porque o GitHub Pages serve ela. |
| `src/engine.js` | Motor de regras puro, sem DOM: cartas, encontros, combate, IA inimiga, registro de eventos. No navegador vira o global `Engine`; no Node, `require`. |
| `src/run.js` | Campanha: raridades, boosters, grupos e andares, mapa, eventos, Notas de Ergos. Global `RunLib`. |
| `src/ui.js` | Toda a interface e o estado da campanha: batalha, guilda, cidade, diálogos, cenas, editor de deck, logs, menu de testes. |
| `src/style.css`, `src/template.html` | Estilo (claro e escuro) e esqueleto da página. |
| `src/feel.js` | Game feel (P94): todas as durações, intensidades e a lista de sons. Ajuste aqui. |
| `src/audio.js`, `src/fx.js` | Gerenciador de áudio `Som` (Howler) e camada de apresentação `Fx`, que lê `st.fxq` depois de cada `render()` da batalha e anima cópias das peças numa camada fixa (`.fx-camada`) fora de `#app`. Cartas da mão levam `data-uid` para o voo e o deslize; `<html data-anim>` guarda o modo de animação. |
| `src/vendor/howler.core.min.js` | Howler 2.2.4 (MIT), embutido pelo build. |
| `assets/audio/sfx/` | Sons `<nome>_<n>.ogg` ou `.wav`. Placeholders: `python3 tools/audio/placeholders.py`. Autoria no `CREDITS.md`. |
| `src/art.js` | Ícones das cartas, inimigos e mapa. **Gerado** por `tools/arte/gen.py`. |
| `src/img/*.webp` | Ilustrações (guilda, Felix, sala de guerra, Mestres, Lerael, Kryoret). O build embute em base64. |
| `tools/build.py` | Junta `src/` num `index.html` único (imagens viram variáveis CSS `--img-<nome>`). |
| `tools/arte/` | `map.py` (carta ou inimigo para ícone) e `gen.py` (gera `src/art.js` a partir do repositório game-icons). |
| `tools/balance/`, `tools/economia/` | Simuladores de balanceamento. |
| `tests/` | Testes do motor em Node e testes de navegador com Playwright (`tests/browser/`). |
| `docs/` | Documentos de design. Veja a seção Documentos. |

## Arquitetura e convenções do código

### Motor (`src/engine.js`)

- **Cartas** são dados com ganchos: `def(id, {...})` para batalha e `sd_(id, {...})` para cartas sociais. Campos comuns: `name, cost, type (unit, spell, weapon, structure, ritual, trap), atk, hp, kw, tags, disc, text`, e ganchos como `onPlay(st, s, c)`, `onDeath(st, e)`, `onReveal(st, e, alvo)`, `onEndTurn(st, e)`, `onResonate`, `brotar`, `attach` (Módulos), `ritualEffect`. `grupo: 2` marca cartas que só entram nas recompensas depois do andar 5.
- **Palavras-chave** ficam em `kw` (`guarda, avanco, investida, letal, dreno, escudo, emboscada, eco, superaquecer, perfurar`). `e.blind` guarda a Blindagem.
- **Blindagem** (P91): **limiar**. Danos menores que N não passam; danos de N ou mais passam inteiros; feitiços ignoram; Perfurar ignora. A regra está em `BLIND` e `applyBlind`. Blindagem 1 não faz nada sob essa regra, então use 2 ou mais.
- **Encontros** ficam em `ENC`: `name, tier (Comum, Elite, Chefe, Defesa, Social), grupo, leader, hp, hand, deck, rule`, e ganchos opcionais `onStart, onStartTurn, onEndTurn, onSummon, onBrotar, leaderBlind, phaseAt + onPhase2, onEnemyResonate, extraMana, resonance`. Encontros sociais têm `social: true` e `perfil`.
- O estado da partida (`st`) tem `log` (texto para o registro) e `events` (gravados pelo `rec()` e exportados no log).
- **Fila de apresentação** (P94): `fx(st, ev)` põe eventos em `st.fxq` (`draw, gain, burn, mull, play, summon, atk, hero, dmg, bloq, escudo, heal, die, turn`) só quando a interface ligou a fila. Toda mudança de vida passa por `dmg`, `heal` ou `loseLife`; nunca mexa em `hp` direto, ou o `tests/test.js` acusa.

### Campanha (`src/run.js`)

- `RARITY` (C, I, R) define o que entra nos boosters. `setGrupo(g, chanceRara)` limita o pool ao grupo liberado; a interface chama isso em todo `render()`.
- `FLOORS` define encontros comuns, Elites e final de cada andar; `GRUPOS`, `grupoDo(andar)` e `MAX_FLOOR` organizam os grupos.
- `EVENTS` (grupo 1), `EVENTS2` (grupo 2), `COFRE` (o cofre de Ergos) e `NOTES` (Notas de Ergos por andar).

### Interface (`src/ui.js`)

- **Estado global:** `camp` (campanha salva no `localStorage`), `st` (partida em curso) e `ui` (estado da tela). `render()` escolhe a tela por `ui.screen`; cenas narrativas usam `ui.screen = 'scene'` e `ui.scene = { kind, ... }`.
- **Roteamento de cliques:** um único `document.addEventListener('click')` lê os `data-*` do elemento clicado.
  - Ações da guilda, cidade, banca e cenas passam por `guildClick`, que **só recebe ações com o prefixo `g-`** (`data-act="g-..."`). Um botão novo sem esse prefixo não faz nada. Foi a causa do bug da Banca Azer.
  - Atributos de clique novos (como `data-sdisc`) precisam entrar na lista do `closest(...)` no tratador global. Foi a causa do bug da negociação avulsa.
- **Cenas pendentes:** eventos que precisam aparecer na guilda entram em `camp.pending`; `pendingScene()` e `guildScene()` desenham cada `kind`.
- **Saves antigos:** toda mudança no formato de `camp` precisa de uma **migração em `ensureGuild()`**. Cuidado com a ordem: só use `camp.fac` depois da linha que o cria.
- **Histórico:** `hist({ k: '...', ... })` registra eventos da campanha, que vão para o log exportado. Registre tudo que mexe com ouro, cartas ou decisões.
- **Versão das regras:** a constante `RULES` (`cartas-vX/design-vY/inimigos-vZ/proto-data`) etiqueta cada partida no log. **Atualize sempre que regras ou números mudarem.**
- **Economia da dívida:** a tabela `ECON` (parcelas, tesouros, juros, prazos). O paradigma está na P93 do design: o tesouro paga a parcela com 20% de margem, o tempo é livre e os juros são a punição.
- **Diálogos:** `MESTRE_INFO` (Mestres) e `NPC_INFO` (Lerael, Banco, Felix). Cada opção pode ter condições (`requires, after + laterDay, met, reqOther, needBoss, needFlag, notFlag, once`) e efeitos (`rot` para texto em rodízio, `dyn` para resposta calculada, `quest`, `questDone`, `gold`, `always`). Linhas que começam com `>` viram narração. O selo “!” de falas novas vem de `hasNewTalk()`.
- **Outros sistemas:** `ATIV` (passeios na cidade), `BANCA` (vantagens do Kryoret por Sucata), `FAC` (instalações), `FELIX_TIPS` (dicas por encontro), `CODES` e `CHEATS` (menu de testes).
- **Menu de testes:** em Configurações, o código `SanerionTestMode1337` (sem diferença de maiúsculas) libera o menu. Campanhas que usam o menu ficam marcadas com `cheatUsed` no log.
- **Testes de navegador** usam `Engine.ENC[...]` mutável para enfraquecer inimigos e atravessar andares rápido; isso só vale dentro do teste.

## Checklists

**Carta nova**
1. Definir no `engine.js` (com `grupo` se não for do grupo 1).
2. Raridade em `RARITY` no `run.js`.
3. Ícone em `tools/arte/map.py` e `python3 tools/arte/gen.py <pasta do game-icons>` (clone de `https://github.com/game-icons/icons`).
4. Documentar em `docs/cartas.md` (ou no documento do grupo).
5. Rodar `node tests/test_pool.js`.

**Palavra-chave nova:** motor, glossário (`GLOSS`), destaque (`KW_RE`), selo (`KW_LABEL`) e, se for estado, os estados da peça em campo.

**Encontro novo:** `ENC`, `FLOORS`, `FELIX_TIPS`, ícone em `map.py`, `docs/inimigos.md` e uma rodada de `tools/balance/encontros.js`.

**NPC ou ilustração nova:** converter para WebP com 1100 px de largura e qualidade 76 (Pillow), salvar em `src/img/<nome>.webp`, usar `HAS_IMG('<nome>')` e `var(--img-<nome>)`, e citar nos Créditos (`ui.js`) e no `README.md`.

**Toda entrega**
1. Build e testes.
2. Documentos atualizados, com versão nova (cabeçalho do arquivo, `RULES` e a linha de versões do `README.md`) e o próximo número de decisão (**a próxima é a P95**).
3. `docs/todo.md` atualizado.
4. Commit em português, com título curto e itens no corpo.

## Documentos (`docs/`)

| Arquivo | Conteúdo | Versão atual |
|---|---|---|
| `design.md` | Documento de design. Decisões numeradas de P1 a P94; a P de cada mudança vai no texto e no commit. | v0.61 |
| `cartas.md` | Cartas de batalha e sociais, glossário, raridades. | v0.19 |
| `inimigos.md` | Encontros, regras e decks inimigos. | v0.13 |
| `grupo2.md` | Tudo do grupo 2 (A Forja Esquecida), com as simulações da Blindagem. | v0.2 |
| `todo.md` | Pendências e decisões a revisar. | acompanha o design |

## Logs de playtest

Os jogadores exportam um `.zip` na área de Playtest da guilda. Dentro, um JSON com:
- **Identificação:** `player` (apelido) e `scope` (todas as partidas ou só as novas).
- **`games`:** cada partida, com `enc, disc, result, rules, turns, hp, events, ctx`. `ctx.mode` vale `run`, `defesa`, `social` ou `avulsa`.
- **`campaign`:** o save inteiro, com `history`, `debt`, `quests` e `cheatUsed`.

Para analisar, agrupe por encontro e versão (`rules`), olhe vitórias, turnos, dano levado (`ctx.hpStart - hp[0]`) e o histórico de ouro.

## Publicação

O `index.html` montado e commitado na `main` é servido pelo GitHub Pages em `https://jvdcorrea.github.io/dragao-amarelo-card-game/`. Existe também uma cópia publicada como artefato no claude.ai, mantida pelo chat; o Claude Code não publica lá. Se precisar atualizar o artefato, avise o João.

## Onde paramos

Pendências principais (detalhes em `docs/todo.md`):
- Calibrar a economia com uma campanha sem o menu de testes.
- Envio automático de logs. Opções estudadas: banco de dados do artefato no claude.ai, Google Apps Script para o GitHub Pages, Firebase.
- Retrato do Odie e a recompensa final da quest da Chrome (hoje 100 de ouro, provisória).
- Playtests humanos do grupo 2.
- Grupo 3: o frio e o resgate de Ergos.
- Draconic segue mais forte que as outras Disciplinas nos testes.
- Problema terminal do mundo (P36) e aprender Disciplinas com os Mestres (P29).
