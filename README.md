# Dragão Amarelo

Card game single-player no estilo Hearthstone/Shadowverse sobre a guilda de aventureiros Dragão Amarelo: o protagonista herda a guilda, uma dívida e uma dungeon impossivelmente funda, onde o tio Ergos ficou preso.

Este repositório guarda o protótipo jogável e os documentos de design.

## Jogar

[Clique aqui para jogar](https://jvdcorrea.github.io/dragao-amarelo-card-game/)

Abra o `index.html` num navegador (é uma página única, sem dependências além das fontes do Google). Os sons ficam em `assets/audio/`; sem essa pasta ao lado, o jogo funciona em silêncio. Se o GitHub Pages estiver ativado para a branch `main`, ele também fica em `https://jvdcorrea.github.io/dragao-amarelo-card-game/`.

O protótipo tem:
- campanha com dois grupos de andares (As Grutas Vivas e A Forja Esquecida): mapa em grafo, eventos, Notas de Ergos, Elites, chefes, Tesouros, boosters com raridade, coleção salva e editor de deck;
- gestão da guilda: aventureiros e missões, instalações, defesas noturnas, quests e a dívida com o Banco da Coroa;
- cidade com os seis Mestres, o banco, a Sociedade Mágica e passeios;
- negociações sociais no mesmo motor da batalha, com deck social próprio;
- área de playtest: batalha avulsa, negociação avulsa e exportação de log em .zip.

Campanha e logs ficam no `localStorage` do navegador.

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `index.html` | Protótipo montado (gerado; não editar à mão) |
| `src/engine.js` | Motor de regras puro: cartas como dados, combate, IA inimiga, registro de eventos |
| `src/run.js` | Campanha: raridades, boosters, geração do mapa, eventos e notas |
| `src/ui.js` | Interface: batalha, guilda, mapa, cenas, editor de deck, logs |
| `src/style.css`, `src/template.html` | Estilo e esqueleto da página |
| `src/feel.js`, `src/audio.js`, `src/fx.js` | Game feel (P94): configuração de tempos e sons, gerenciador de áudio e camada de apresentação |
| `src/vendor/` | Bibliotecas embutidas pelo build (howler.js) |
| `assets/audio/` | Sons (`sfx/`) e músicas; placeholders gerados por `tools/audio/placeholders.py` |
| `src/art.js` | Arte provisória: ícones e mapeamento carta para ícone (gerado por `tools/arte/gen.py`) |
| `tools/build.py` | Gera o `index.html` a partir de `src/` |
| `tests/` | Testes em Node (partidas simuladas, pool de cartas, bot guloso) e testes de navegador em `tests/browser/` |
| `tools/balance/`, `tools/economia/` | Simuladores de encontros e da economia da dívida |
| `CLAUDE.md` | Guia do projeto para o Claude Code |
| `docs/` | Design (`design.md`), cartas (`cartas.md`), inimigos (`inimigos.md`), lista de tarefas (`todo.md`) e o grupo 2 (`grupo2.md`) |

## Desenvolvimento

Guia completo para desenvolvimento, inclusive com o Claude Code, em [`CLAUDE.md`](CLAUDE.md).

```bash
python3 tools/build.py                 # gera index.html
node tests/test.js                     # partidas simuladas com os decks iniciais, procura erros
node tests/test_pool.js                # decks aleatórios cobrindo as cartas do pool
node tests/greedy.js                   # taxas de vitória de um bot guloso por Disciplina e encontro
python3 tests/browser/run_all.py       # testes de navegador (Playwright)
```

## Versões dos documentos

Design v0.65, cartas v0.19, inimigos v0.13. Lista de tarefas em `docs/todo.md`. Histórico de mudanças em [`CHANGELOG.md`](CHANGELOG.md).

## Créditos

A arte atual é provisória. Os ícones das cartas, dos inimigos e do mapa vêm do [game-icons.net](https://game-icons.net), sob a licença [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/), de Lorc, Delapouite, Skoll, Caro Asercion, DarkZaitzev, Carl Olsen, Cathelineau, Sbed e Zajkonur; foram recoloridos, simplificados e combinados com fundos gerados pelo jogo. A lista completa, com a contagem por autor, fica na tela de Créditos do jogo.

As ilustrações (fachada da guilda, Felix, sala de guerra e os Mestres Chrome, Gun'Liao, Charles Goodwich, Mikeus, Yaven e Ko, além da arquivista Lerael Vane, do Azer Kryoret e do Gato Artífice Odie) ficam em `src/img/` como WebP e são embutidas no `index.html` pelo build.

Fontes Alegreya e Alegreya Sans (SIL Open Font License), servidas pelo Google Fonts. Compactação dos logs com JSZip (MIT). Áudio com howler.js (MIT). Os sons e suas licenças ficam listados no [`CREDITS.md`](CREDITS.md).

Para trocar o ícone de uma carta, edite `tools/arte/map.py` e rode `tools/arte/gen.py` (instruções no topo do arquivo).
