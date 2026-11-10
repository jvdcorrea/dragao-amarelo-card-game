// Dragão Amarelo: receptor dos logs de playtest (P99).
// Recebe o envio do jogo, guarda o arquivo numa pasta do Drive e escreve uma linha de resumo numa planilha.
// Publicação e uso: tools/logs/README.md.

const PASTA = 'Dragão Amarelo · logs';
const PLANILHA = 'Dragão Amarelo · resumo dos logs';
const MAX_B64 = 14 * 1024 * 1024;   // mesmo limite do jogo (ENVIO_MAX no ui.js)
const MAX_POR_HORA = 30;            // envios por código de jogador por hora; o resto é recusado
const CABECALHO = ['Recebido', 'Apelido', 'Código', 'Como', 'Partidas', 'Vitórias', 'Derrotas', 'Regras', 'Menu de testes',
  'Dia', 'Andar', 'Ouro', 'Disciplina inicial', 'Modos', 'Arquivo', 'KB'];

// Rode uma vez pelo editor (botão Executar) para autorizar o acesso e criar a pasta e a planilha.
function configurar() {
  const pasta = pasta_(), aba = planilha_();
  Logger.log('Pasta: ' + pasta.getUrl());
  Logger.log('Planilha: ' + aba.getParent().getUrl());
}

// Abrir a URL do App da Web no navegador mostra se ele está no ar.
function doGet() { return json_({ ok: true, servico: 'dragao-amarelo-logs' }); }

function doPost(e) {
  try {
    const corpo = (e && e.postData && e.postData.contents) || '';
    if (corpo.length > MAX_B64 + 200000) return json_({ ok: false, erro: 'grande' });
    const env = JSON.parse(corpo);
    if (!env || env.format !== 'dragao-amarelo-envio' || !env.file || typeof env.file.b64 !== 'string') return json_({ ok: false, erro: 'formato' });
    if (env.file.b64.length > MAX_B64) return json_({ ok: false, erro: 'grande' });
    const id = String(env.playerId || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 40) || 'sem-codigo';

    const cache = CacheService.getScriptCache(), chave = 'envios-' + id, n = Number(cache.get(chave) || 0);
    if (n >= MAX_POR_HORA) return json_({ ok: false, erro: 'limite' });
    cache.put(chave, String(n + 1), 3600);

    const zip = env.file.type === 'zip';
    const nome = String(env.file.name || 'dragao-amarelo-log-' + id).replace(/[^\w.\-]/g, '_').slice(0, 120);
    const blob = Utilities.newBlob(Utilities.base64Decode(env.file.b64), zip ? 'application/zip' : 'application/json', nome);
    const arq = pasta_().createFile(blob);

    const r = env.resumo || {};
    const linha = [new Date(), txt_(env.player), id, env.auto ? 'automático' : 'botão', num_(r.partidas), num_(r.vitorias), num_(r.derrotas),
      txt_(r.rules), r.cheatUsed ? 'sim' : 'não', num_(r.dia), num_(r.andar), num_(r.ouro), txt_(r.disc), txt_(r.modos),
      arq.getUrl(), Math.round(blob.getBytes().length / 1024)];
    const trava = LockService.getScriptLock();
    trava.waitLock(10000);
    try { planilha_().appendRow(linha); } finally { trava.releaseLock(); }
    return json_({ ok: true, arquivo: arq.getName() });
  } catch (err) {
    return json_({ ok: false, erro: String(err).slice(0, 200) });
  }
}

function pasta_() {
  const props = PropertiesService.getScriptProperties(), id = props.getProperty('pasta');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* apagada: cria de novo */ } }
  const p = DriveApp.createFolder(PASTA);
  props.setProperty('pasta', p.getId());
  return p;
}

function planilha_() {
  const props = PropertiesService.getScriptProperties(), id = props.getProperty('planilha');
  if (id) { try { return SpreadsheetApp.openById(id).getSheets()[0]; } catch (e) { /* apagada: cria de novo */ } }
  const ss = SpreadsheetApp.create(PLANILHA), aba = ss.getSheets()[0];
  aba.appendRow(CABECALHO); aba.setFrozenRows(1); aba.getRange(1, 1, 1, CABECALHO.length).setFontWeight('bold');
  DriveApp.getFileById(ss.getId()).moveTo(pasta_());
  props.setProperty('planilha', ss.getId());
  return aba;
}

// Texto vindo do jogador: curto e sem virar fórmula na planilha.
function txt_(v) {
  const s = String(v == null ? '' : v).slice(0, 200);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
function num_(v) { const n = Number(v); return v == null || v === '' || isNaN(n) ? '' : n; }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
