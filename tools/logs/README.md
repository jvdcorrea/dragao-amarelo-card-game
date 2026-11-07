# Envio de logs (P99)

O botão “Enviar log” do jogo (e o envio automático, quando o jogador liga) manda as partidas novas para um Google Apps Script na conta do autor. O script guarda o arquivo `.zip` numa pasta do Google Drive e escreve uma linha de resumo numa planilha.

Enquanto a URL não estiver no jogo, os botões de envio não aparecem e nada muda para o jogador.

## Publicar (uma vez)

1. Abra [script.google.com](https://script.google.com) com a conta que vai receber os logs e crie um **Novo projeto**. Dê um nome, por exemplo “Dragão Amarelo · logs”.
2. Apague o conteúdo de `Código.gs` e cole o conteúdo de `tools/logs/receptor.gs`. Salve.
3. No menu de funções, escolha `configurar` e clique em **Executar**. O Google pede autorização (Drive e Planilhas). Como o script é seu e não verificado, aparece o aviso “O Google não verificou este app”: clique em **Avançado** e depois em **Acessar**. O registro de execução mostra os links da pasta e da planilha criadas.
4. Clique em **Implantar → Nova implantação**. Em tipo, escolha **App da Web**.
   - Executar como: **Eu**.
   - Quem pode acessar: **Qualquer pessoa**.
5. Clique em **Implantar** e copie a **URL do app da Web** (termina em `/exec`). Abrir essa URL no navegador deve mostrar `{"ok":true,"servico":"dragao-amarelo-logs"}`.
6. No repositório, cole a URL em `LOG_ENVIO_URL`, no `src/ui.js`. Depois rode o build e os testes e faça o commit. O GitHub Pages passa a mostrar o botão.

## Atualizar o script depois

Edite o código e use **Implantar → Gerenciar implantações → editar (lápis) → Versão: Nova versão → Implantar**. Assim a URL continua a mesma. Uma “Nova implantação” cria outra URL, e o jogo teria de ser atualizado.

## O que chega

- **Pasta “Dragão Amarelo · logs”:** um arquivo por envio, `dragao-amarelo-log-<apelido ou código>-<data>.zip`, no mesmo formato do “Exportar log”. Os envios automáticos terminam em `-auto`.
- **Planilha “Dragão Amarelo · resumo dos logs”** (dentro da pasta): data, apelido, código do jogador, se veio do botão ou do envio automático, partidas, vitórias, derrotas, versões das regras, se a campanha usou o menu de testes, dia, andar, ouro, Disciplina inicial, modos de jogo, link do arquivo e tamanho.

Cada envio traz só as partidas terminadas depois do envio anterior daquele navegador. O código do jogador (`j-` e 8 letras e números) é sorteado na primeira vez e fica no navegador até a pessoa limpar os dados do site.

## Proteções

- O script só aceita o formato do jogo (`format: 'dragao-amarelo-envio'`) e arquivos de até 14 MB em base64.
- No máximo 30 envios por hora para cada código de jogador.
- Apelidos que começam com `=`, `+`, `-` ou `@` entram como texto, para não virarem fórmula na planilha.

A URL fica pública dentro do `index.html`, então qualquer pessoa poderia enviar arquivos falsos no formato certo. Para um protótipo, o risco é baixo. Se isso acontecer, publique uma nova implantação (URL nova) e atualize o jogo.

## Ler os logs

Baixe da pasta e analise como os logs exportados (veja “Logs de playtest” no `CLAUDE.md`). O Claude Code também pode ler a pasta direto pelo conector do Google Drive, quando ele estiver ligado na sessão.
