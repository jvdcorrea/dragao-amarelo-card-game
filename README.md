# Dragão Amarelo

Card game single-player no estilo Hearthstone/Shadowverse sobre a guilda de aventureiros Dragão Amarelo: o protagonista herda a guilda, uma dívida e uma dungeon impossivelmente funda, onde o tio Ergos ficou preso.

Este repositório guarda o protótipo jogável e os documentos de design.

## Jogar

[Clique aqui para jogar](https://jvdcorrea.github.io/dragao-amarelo-card-game/)

Abra o `index.html` num navegador (é uma página única, sem dependências além das fontes do Google). Se o GitHub Pages estiver ativado para a branch `main`, ele também fica em `https://jvdcorrea.github.io/dragao-amarelo-card-game/`.

O protótipo tem:
- campanha do grupo 1 (As Grutas Vivas): mapa em grafo, eventos, Notas de Ergos, Elites, Tesouros, boosters com raridade, coleção salva e editor de deck;
- batalha avulsa com as 6 Disciplinas e os 7 encontros do grupo 1;
- mulligan, Evolução, Compasso, Órbita, Módulos, Rituais e as demais mecânicas;
- exportação de log em .zip (partidas e histórico das campanhas), com opção de exportar só as partidas novas.

Campanha e logs ficam no `localStorage` do navegador.

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `index.html` | Protótipo montado (gerado; não editar à mão) |
| `src/engine.js` | Motor de regras puro: cartas como dados, combate, IA inimiga, registro de eventos |
| `src/run.js` | Campanha: raridades, boosters, geração do mapa, eventos e notas |
| `src/ui.js` | Interface: batalha, guilda, mapa, cenas, editor de deck, logs |
| `src/style.css`, `src/template.html` | Estilo e esqueleto da página |
| `src/art.js` | Arte provisória: ícones e mapeamento carta para ícone (gerado por `tools/arte/gen.py`) |
| `tools/build.py` | Gera o `index.html` a partir de `src/` |
| `tests/` | Testes em Node: partidas simuladas, todas as cartas do pool e um bot guloso para sinais de balanceamento |
| `docs/` | Design (`design.md`), cartas (`cartas.md`), inimigos (`inimigos.md`) e lista de tarefas (`todo.md`) |

## Desenvolvimento

```bash
python3 tools/build.py          # gera index.html
node tests/test.js              # 1.050 partidas com os decks iniciais, procura erros
node tests/test_pool.js         # decks aleatórios cobrindo todas as cartas
node tests/greedy.js            # taxas de vitória de um bot guloso por Disciplina e encontro
```

## Versões dos documentos

Design v0.45, cartas v0.17, inimigos v0.10. Lista de tarefas em `docs/todo.md`.

## Créditos

A arte atual é provisória. Os ícones das cartas, dos inimigos e do mapa vêm do [game-icons.net](https://game-icons.net), sob a licença [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/), de Lorc, Delapouite, Skoll, Caro Asercion, DarkZaitzev, Carl Olsen, Cathelineau, Sbed e Zajkonur; foram recoloridos, simplificados e combinados com fundos gerados pelo jogo. A lista completa, com a contagem por autor, fica na tela de Créditos do jogo.

As ilustrações (fachada da guilda, Felix, sala de guerra e os Mestres Chrome, Gun'Liao, Charles Goodwich e Mikeus) ficam em `src/img/` como WebP e são embutidas no `index.html` pelo build.

Fontes Alegreya e Alegreya Sans (SIL Open Font License), servidas pelo Google Fonts. Compactação dos logs com JSZip (MIT).

Para trocar o ícone de uma carta, edite `tools/arte/map.py` e rode `tools/arte/gen.py` (instruções no topo do arquivo).
