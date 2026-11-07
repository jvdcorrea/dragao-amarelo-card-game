# Dragão Amarelo: histórico de mudanças

Mudanças do protótipo desde a chegada dos Mestres como personagens (design v0.44, 26/10/2026). A versão de cada bloco é a do documento de design (`docs/design.md`); os números entre parênteses (Pn) apontam a decisão de design correspondente. Datas no formato dia/mês de 2026.

## v0.66 · 06/11 · Envio de logs com um clique

- **Enviar log (P99).** Um botão na área de logs e na janela de resultado manda as partidas novas para o autor do jogo, sem baixar arquivo. Elas chegam numa pasta do Google Drive, com uma linha de resumo numa planilha.
- **Código do jogador.** Cada navegador ganha um código aleatório, mostrado na área de logs; o apelido continua opcional.
- **Envio automático,** opcional e desligado por padrão, nas Configurações: no máximo a cada 10 minutos, ao fim das partidas e ao abrir o jogo.
- O envio só aparece depois que o receptor for publicado (`tools/logs/`).

## v0.65 · 06/11 · Ataque total, modos de animação e o retrato do Odie

- **Ataque total (P98).** Um botão ao lado de “Encerrar turno” faz todas as unidades prontas atacarem de uma vez, da esquerda para a direita. O alvo é o Guarda visível mais à esquerda; sem Guarda, a vida do oponente. Unidades com Avanço recém-jogadas só atacam se houver Guarda. A arma do protagonista não entra. Na negociação, o botão se chama “Pressão total”.
- **Modos de animação (P94, fase 6).** Nas Configurações: Normal, Rápida (dobro da velocidade), Instantânea (sem animação, só som) e Sem movimento. Sem escolha salva, o jogo segue o sistema (`prefers-reduced-motion`), e dá para voltar a “Seguir o sistema”.
- **Retrato do Odie**, o Gato Artífice, nas cenas da chegada e da Ferraria acesa.
- Testes: casos do Ataque total no motor e dois testes de navegador novos (modos de animação e Ataque total). O bot dos testes passou a reconhecer o fim da batalha avulsa.

## v0.62 a v0.64 · 06/11 · Instalações, Evolução e mapa

- **Tela de Instalações mais clara (P95).** Cada instalação mostra seu estado: pode construir agora, espera (com o motivo), em obra, trancada, completa ou em uso. Só a trancada fica esmaecida. Custo em chips (vermelhos quando falta ouro), comparação “Agora → Próximo nível”, ouro e obra do dia no topo, e um selo “!” no botão Instalações quando alguma obra dá para fazer hoje.
- **Efeito da Evolução (P96).** Som próprio e efeito em camadas: a peça encolhe, cresce com sobra, acende em dourado, solta anéis e faíscas, os atributos pulsam e o “+2/+2” flutua. Uma pausa curta separa a Evolução dos efeitos Ao Evoluir. Vale para os chefes e para o Enfatizar da negociação.
- **Números com contorno.** Dano, cura e Evolução ganharam contorno branco, para ler sobre qualquer fundo.
- **Mapa que responde ao mouse e ao teclado (P97).** O nó para onde dá para ir cresce, acende e dá um pulinho; a trilha até ele acende; todos os nós mostram o nome num rótulo.
- **Banco da Coroa:** pagar a parcela no banco volta para a cidade, com a ida ainda aberta.
- **Correções:** um erro de áudio ou de animação não para mais o turno inimigo (vira aviso no console). Os testes de navegador abrem o Chrome sem saída de áudio, que travava a aba em sessões longas.

## v0.61 · 05/11 · Game feel: som, impacto, números, mão e música (P94)

- **Áudio base.** Canais de efeitos e de música, volumes e mudo nas Configurações, botão de som na guilda e na batalha, tecla M. Sons de comprar, jogar, impacto, bloqueio, cura e morte (placeholders por enquanto).
- **Impacto.** O atacante avança até o alvo e volta; hit-stop curto conforme o dano; flash no alvo; unidades mortas somem no lugar. O turno inimigo espera cada animação terminar. A tremida de tela foi testada e removida depois do playtest.
- **Números flutuantes.** Dano em vermelho, cura em verde, Escudo e Blindagem com a cara dos selos. A vida mostrada só muda no impacto, e a cura acende o número de vida.
- **Cartas na mão.** A carta sob o mouse sobe e inclina seguindo o cursor. A carta jogada voa num arco até onde ela age. Compras chegam em sequência, e o que muda de lugar desliza.
- **Música ambiente.** Uma faixa em loop por estado (menu, mapa, combate, chefe, negociação), com troca suave; a faixa que sai continua de onde parou ao voltar.
- Bastidores: as durações, intensidades e a lista de sons ficam em `src/feel.js`; Howler embutido no build, para funcionar offline.

## v0.60 · 05/11 · Economia da dívida

- **Paradigma da dívida (P93).** O tesouro de cada grupo paga a parcela com margem; o tempo é livre e os juros são a punição. Parcelas de 300 e 700 de ouro, tesouros de 360 e 840, juros de 15%. Prazo de 4 dias se você vence a negociação com o Barão, 3 se perde; extensão de 3 ou 2 dias.
- Felix aconselha pagar só depois do tesouro do grupo.
- Simulador da economia de um grupo (`tools/economia/simula.py`).
- Bastidores: o projeto foi preparado para o Claude Code (CLAUDE.md, testes de navegador no repositório, simulador de encontros, atalhos no `package.json`).

## v0.59 · 04/11 · Instalações novas e guilda reorganizada

- **Instalações novas (P92):** Ferraria com o Odie (indicado pela Chrome), Recursos Humanos e Área de treinamento (construída pelo Kryoret). O Laboratório arcano ficou de lado.
- Os aventureiros indicados pelos Mestres chegam no nível 3.
- **Guilda em áreas:** o dia em destaque, Dungeon, Cidade, Guilda, Decks e Playtest.
- Negociação avulsa no Playtest; batalha avulsa separada por grupo.
- Selo de cartas novas nos Mestres depois do andar 5.
- Blindagem, Superaquecer e Perfurar no glossário e nas peças.
- Correções: o máximo de Notas de Ergos; a dívida entra no log exportado; os botões da Banca Azer (comprar, negociar e voltar) voltaram a responder.

## v0.58 · 31/10 a 03/11 · Grupo 2: A Forja Esquecida

- **Andares 6 a 10:** Oficina de Golens, Bocas de Fogo, Patrulha Azer, Fundição Abandonada, o Colosso de Ferro, a Matriarca Azer e o chefe Ignar.
- **Mecânicas novas (P91):** Blindagem (limiar: danos abaixo de N não passam, feitiços e Perfurar ignoram), Superaquecer e Perfurar, escolhidas por simulação.
- **28 cartas novas** (4 por Disciplina e 4 básicas), liberadas depois do andar 5.
- **Sucata e a Banca do Kryoret**, com negociação e retrato do Kryoret. Seis eventos novos e o cofre de Ergos.
- Quest da Chrome com a entrega da engrenagem.
- Segunda parcela do credor (700 de ouro) e tesouro do grupo 2 (800, ajustado para 840 na v0.60).
- Notas de Ergos 6 a 10, dicas do Felix para os inimigos novos, ícones das cartas novas e das defesas humanas.
- Documento próprio do grupo: `docs/grupo2.md`.

## v0.57 · 30/10 · Invasores humanos

- **Defesas com invasores humanos (P72):** 15 cartas humanas (ladrões, salteadores e aventureiros da guilda rival) em três bandos, Vesper, Capitão Brega e Grifo Dourado, cada um com três níveis de ameaça.
- A ameaça cresce com os andares concluídos e com o ouro no cofre; recompensa e multa acompanham.
- Metade das defesas físicas passa a ser humana.

## v0.55 a v0.56 · 28/10 · Negociação social, credor e Banco da Coroa

- **Deck social jogável (P86, P87).** Negociações no mesmo motor da batalha, com vocabulário e paleta próprios. 66 cartas sociais, editor de deck social (20 cartas) e o tutorial do cliente do pelo de gato quando a Taverna abre.
- **Passeios:** encerrar a ida à cidade com um NPC dá uma carta social da Disciplina dele, com atividades em rodízio. A Lerael dá cartas de educação e bom senso.
- **Credor (P88 a P90).** Depois do terceiro andar, a negociação do prazo da primeira parcela. Banco da Coroa na cidade, vencimento com juros e o tesouro do Basilisco na primeira vitória.
- **Defesas sociais:** golpista, cobrador de proteção e guilda rival, além de conversas na patrulha.
- O deck social ganhou Disciplina própria e o botão “Editar deck social”.
- Falas novas: Charles fala da Macabra e do Lichdom Ético; textos revisados de Mikeus, Brisa, Chrome e Lerael.

## v0.53 a v0.54 · 28/10 · Lerael, falas condicionais e quests

- **Lerael Vane (P81),** arquivista da Sociedade Mágica, com retrato, chegada, saudações e falas. Ela recebe as cartas que passam de 2 cópias em troca de um honorário (substitui o comprador provisório).
- **Falas condicionais (P82 a P85):** liberadas depois de outra fala, num dia seguinte, depois de conhecer um Mestre ou depois do Basilisco; falas em rodízio; selo de falas novas ao lado dos NPCs na cidade.
- Falas novas de todos os Mestres: Chrome (Ergos, a quest da engrenagem, pagar depois), Gun'Liao (deuses, quem não paga, a oferenda do Basilisco), Charles (a música do dia, bichinhos espectrais, um momento sério) e Mikeus (o futuro de cada Mestre e a própria história).
- Quests listadas na guilda.
- **Falar com Felix:** estatísticas, onde você tem caído e o que vem pela frente.

## v0.44 a v0.52 · 26 e 27/10 · Os Mestres

- **Os seis Mestres ganham personagem**, com retrato, cena de chegada, saudação e falas: Chrome (Magitech), Gun'Liao (Holy Shadowmancy), Charles Goodwich (Necrodance) e Mikeus (Temporal Warfare) em v0.44 (P74); Yaven (Space Wizardry) em v0.50; Ko (Draconic Primalism) em v0.52.
- Saudação diferente da segunda visita em diante. Yaven conta uma curiosidade nova sobre o espaço a cada visita.
- **Ida à cidade (P78, P79):** a ida só é gasta ao voltar para a guilda, e dentro dela dá para visitar quantos Mestres quiser. As falas ficam registradas na tela, e as já feitas vão para um menu recolhível.
- **Indicações:** depois de comprar um booster, cada Mestre indica um aventureiro (Katya, Matador, 9S, Tsubaki).
- **Chrome dá uma consulta grátis sobre Cartomantes (P80).**
- A loja dos Mestres passa a se chamar Treinamento.
- Sala de guerra como cabeçalho da guilda; ilustrações inteiras, sem corte.
- **Enchanting Technology passa a se chamar Magitech (P75).** O id interno continua `tech`, então logs antigos seguem compatíveis.
- **Alojamento (P76):** nova instalação que começa com 4 vagas de aventureiro e abre mais 2 por nível, até 10.
- **Códigos secretos e menu de testes (P77)** nas Configurações. Campanhas que usam o menu ficam marcadas no log.
- A escolha da Elite mostra se a carta é nova, se você tem 1 ou se é repetida.
- Tela inicial: “Uma guilda, uma dívida e um mistério.”
