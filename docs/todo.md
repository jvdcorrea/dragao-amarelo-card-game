# Dragão Amarelo: Lista de tarefas

*Atualizada em 26/10/2026 · acompanha o design v0.51*

Legenda: **[x]** feito no protótipo · **[~]** feito com placeholder, falta decisão · **[ ]** a fazer

## Lista atual

1. **[x] Booster do andar** (P67). Ao concluir um andar pela primeira vez, só um booster geral, com 2 cartas garantidas da Disciplina do deck. As outras 3 podem ser de qualquer Disciplina ou básicas. Cartas que o jogador ainda não tem têm o dobro de chance, mas repetidas continuam possíveis.
   - *Escolha minha, para revisar:* as 2 garantidas ocupam uma vaga Comum e a vaga Incomum ou Rara.

2. **[ ] Playtest do deck social com todas as funções de editar.** As cartas sociais já estão no arquivo de cartas (Lábia, Argumentos, Táticas, Ênfase; deck inicial de 14 básicas + 6 da Disciplina). Falta:
   - adaptar o motor para a batalha social (Resistência, Compostura, perfis de interlocutor);
   - um editor de deck social igual ao de batalha (filtros, curva, limpar, tipo e stats);
   - um oponente para o teste.
   - *Pergunta:* qual interlocutor estreia o teste? Sugestão: um cliente que enrola para pagar, mais simples que o credor.

3. **[x] Ouro em cada luta vencida** (P69). Batalha 8 a 12, Elite 20 a 25, Chefe 50, inclusive em revisitas. Vai direto para o cofre e não se perde na derrota.

4. **[~] Comprar cartas repetidas (quando passam de 2).** Funciona na cidade com um "Comprador de cópias" provisório (Comum 5, Incomum 12, Rara 30 de ouro). Ideias para não ser um mercador:
   - **Os próprios Mestres aceitam cópias da Disciplina deles** como parte do pagamento do booster. Não cria NPC novo e liga duas coisas que já existem.
   - **Arquivista da biblioteca real:** guarda uma cópia de cada carta "para a posteridade" e paga em ouro. Combina com o salão de livros da ilustração do Felix.
   - **Banco do credor:** aceita cartas como abatimento da dívida, pela avaliação dele (sempre desconfiada). Liga as cópias à dívida.
   - **Gatil:** os Felinos "adotam" as cópias extras e devolvem um recurso próprio para melhorar as cartas básicas.

5. **[~] Evento do primeiro aventureiro** (P70). Na primeira volta de uma descida, Brisa (batedora) pede trabalho e o Quadro de Missões é liberado. Missões rendem ouro, às vezes uma carta, e dão experiência.
   - *Falta:* definir quem é o primeiro aventureiro.

6. **[~] Menu de instalações e Taverna** (P71). Depois da Brisa, Felix sugere reabrir a taverna. "Fazer faxina na taverna" usa a obra do dia e fica pronta ao fim do dia. A Taverna oferece 3 candidatos aleatórios por dia. **[x] Alojamento** (P76): começa com 4 vagas e cada nível abre mais 2, até 10 (60, 120 e 200 de ouro, 1 dia de obra cada).
   - *Falta:* personagens de verdade no lugar dos aleatórios e a contratação por batalha social.

7. **[ ] Outras instalações:** Área de treinamento (melhorar aventureiros e unidades), Laboratório arcano (feitiços e upgrades mágicos), Ferraria (equipamentos em carta e dos aventureiros). Já aparecem bloqueadas, cada uma esperando um NPC.
   - *Falta:* quem libera cada uma, o custo e o que cada melhoria faz.

8. **[~] Defesas com inimigos aleatórios** (P72). A partir do dia 3, 20% de chance por noite. Os invasores são monstros do Buraco, em quatro temas com cartas do grupo 1. Vitória dá ouro; derrota custa até 20 de ouro.
   - *Falta:* ladrões (precisam de cartas humanas), defesas sociais, e Cofre ou vigias reduzindo a chance.

9. **[~] Mestres na cidade** (P73, P74). Seis Mestres vendem boosters de 5 cartas da Disciplina por 60 de ouro. Uma visita na cidade por dia. Cinco já têm retrato e diálogo: Chrome (Magitech), Gun'Liao (Holy Shadowmancy), Charles Goodwich (Necrodança), Mikeus (Temporal Warfare) e Yaven (Space Wizardry).
   - **[x]** Ida à cidade conta só ao voltar; dentro dela, quantos Mestres quiser (P78). Diálogo como registro, com menu de falas já feitas (P78). Indicação de aventureiro depois de comprar um booster: Katya, Matador, 9S e Tsubaki (P79).
   - *Falta:* o Mestre de Draconic Primalism; o aventureiro que o Yaven indica (hoje aleatório); aprender Disciplinas novas com os Mestres (P29).

**[x] Códigos secretos e Menu de testes** (P77), nas Configurações. Partidas de campanhas com testes saem marcadas no log.

**[x] Estrutura de base** (P68): o dia com as quatro ações (descer, visita, despacho, obra, uma vez cada) e o botão "Encerrar o dia". Descer não passa mais o dia sozinho.

## Decisões minhas que valem revisão

- **Despacho:** várias missões no mesmo dia contam como a única ação de despacho do dia.
- **Faxina:** usa a obra do dia, então dá para descer no mesmo dia.
- **Contratação:** custa ouro (25 mais 15 por nível acima de 1) enquanto a batalha social não existe.
- **Missões:** a chance de sucesso é 60% + 15% × (nível + 1 se a especialidade bate − dificuldade), entre 20% e 95%. Nos testes, quase todas deram certo; pode estar generosa.
- **Preços:** boosters dos Mestres a 60 de ouro. Uma descida rende entre 35 e 80 de ouro, e as missões, de 15 a 55.

## Pendências anteriores

- [ ] P36: o problema terminal do mundo.
- [ ] Nome dos Felinos da Guilda; Gigante das Profundezas; nomes em inglês das Disciplinas.
- [ ] Gato Farejador: agora que existe ouro, já pode ser implementado.
- [ ] Clientes: chegam como evento ou exigem visita?
- [ ] Balanceamento do grupo 1: dificuldade geral baixa, Basilisco arrastado, Draconic forte. Testar o Broto 0/1 com Necro e Temporal.
- [ ] Inimigos dos grupos 2 a 4.
