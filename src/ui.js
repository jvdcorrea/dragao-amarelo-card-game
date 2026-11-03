(function () {
'use strict';
const E = window.Engine;
const TYPE_LABEL = { unit: 'Unidade', spell: 'Feitiço', weapon: 'Arma', structure: 'Estrutura', ritual: 'Ritual', trap: 'Armadilha' };
const typeLabel = d => (d ? ((d.social ? SOC_TYPE : TYPE_LABEL)[d.type] || '') : '');
const KW_LABEL = { guarda: 'Guarda', investida: 'Acelerar', avanco: 'Avanço', letal: 'Letal', dreno: 'Dreno', escudo: 'Escudo', emboscada: 'Emboscada', eco: 'Eco' };
const DISC_NAME = { temporal: 'Temporal Warfare', draconic: 'Draconic Primalism', necro: 'Necrodance', holy: 'Holy Shadowmancy', tech: 'Magitech', space: 'Space Wizardry', neutra: 'Neutra' };
const GLOSS = {
  'Abertura': 'No social, o mesmo que Ao Entrar: efeito quando o Argumento entra.',
  'Repercussão': 'No social, o mesmo que Ao Morrer: efeito quando o Argumento cai.',
  'Ponto Sensível': 'No social, o mesmo que Guarda: Argumentos inimigos precisam derrubá-lo primeiro.',
  'Álibi': 'No social, o mesmo que Escudo: ignora o primeiro dano que receberia.',
  'Enfatizar': 'No social, o mesmo que Evoluir: +2/+2 num Argumento seu.',
  'Perfil': 'Traço do interlocutor: Ganância, Vaidade, Princípios, Procedimento ou Respeito. A Tática certa no Perfil certo rende mais; algumas saem pela culatra.',
  'Compostura': 'Sua vida na negociação.',
  'Resistência': 'A vida do interlocutor. Zere para fechar o acordo.',
  'Lábia': 'A mana da negociação.',
  'Rumor': 'Carta inútil para o interlocutor; se ficar na mão dele no fim do turno, causa 1 de dano à Resistência dele.',
  'Guarda': 'Inimigos precisam atacar unidades com Guarda primeiro.',
  'Acelerar': 'Pode atacar qualquer alvo, inclusive o líder, no turno em que entra.',
  'Avanço': 'Pode atacar unidades no turno em que entra.',
  'Letal': 'Destrói qualquer unidade que ferir.',
  'Dreno': 'O dano causado cura quem controla a carta.',
  'Escudo': 'Ignora a primeira instância de dano.',
  'Emboscada': 'Não pode ser atacada nem alvo de efeitos inimigos até atacar.',
  'Eco': 'Ao morrer pela primeira vez, volta no início do seu próximo turno com o Ataque original e 1 de Vida, sem Eco.',
  'Atraso': 'A unidade só aparece em campo no início do seu próximo turno.',
  'Adiantar': 'Ao jogar, você pode pagar mana a mais para a unidade ganhar Acelerar.',
  'Prever': 'Olhe as cartas do topo do seu deck, pegue uma para a mão e mande as outras para o fundo.',
  'Revelar': 'Quando uma unidade ataca saindo da Emboscada, ela se revela e o efeito Ao Revelar dispara. Se esse ataque destruir a unidade atacada, é um sacrifício: seus Rituais perdem 1 de contagem.',
  'Cristal': '+1 de mana máxima, vazio. Com mana máxima 10, vira compra de 1 carta.',
  'Despertar': 'Efeito extra se sua mana máxima for 7 ou mais.',
  'Compasso': 'Conta as cartas jogadas da mão no turno: 1, 2, 3, e volta ao 1.',
  'Sangria': 'Você pode pagar vida em vez de mana.',
  'Ritual': 'Permanente com contagem; perde 1 no início do seu turno e ativa ao chegar a 0. Não pode ser atacado.',
  'Armadilha': 'Fica oculta e ativa quando a condição acontece no turno inimigo.',
  'Órbita': 'Na mão, ganha 1 Carga sempre que você lança um feitiço.',
  'Módulo': 'Acopla a uma unidade aliada e volta para a mão quando ela morre.',
  'Brotar': 'No início do turno do dono, a carta se transforma. Matar antes evita.',
  'Imóvel': 'Não pode atacar no próximo turno do dono.',
  'Evoluir': 'Evolução: +2/+2 numa unidade sua, que pode atacar unidades neste turno e ativa Ao Evoluir.',
  'Estrutura': 'Permanente com Vida própria; não ataca, mas pode ser atacada.',
  'Felino': 'Marcação dos gatos da guilda; algumas cartas ficam melhores com Felinos em campo.',
};

let st = null;
const ui = { screen: 'title', mode: null, busy: false, disc: null, enc: null, info: null, toast: null, modal: null, nick: '' };
const RULES = 'cartas-v0.19/design-v0.58/inimigos-v0.13/proto-2026-10-29';
const LS_OLD = 'dragao-amarelo-campanhas-antigas-v1', LS_LASTEXP = 'dragao-amarelo-ultimo-export-v1';
const LS_GAMES = 'dragao-amarelo-logs-v1', LS_CUR = 'dragao-amarelo-log-atual-v1', LS_NICK = 'dragao-amarelo-apelido';
const LEGEND = {
  idioma: 'ids de carta em portugues sem acento; nomes e textos completos em cards',
  ref: 'unidade = id#uid; LP/LE = lider do jogador/inimigo',
  board: '[id, uid, ataque (ou R+contagem para ritual), vida, palavras-chave e estados separados por +]',
  investida: 'palavra-chave interna de Acelerar',
  eventos: {
    start: 'deck = deck embaralhado do jogador (topo primeiro), edeck = do inimigo', hand0: 'mao inicial', mull: 'mulligan n, nova mao', keep: 'mao mantida',
    turn: 'retrato no inicio de cada turno, depois da compra: hp [jogador, inimigo], mana maxima, mao do jogador, tamanho da mao inimiga (eh), decks, campos bp/be, evolucoes, arma, armadilhas',
    play: 'carta jogada: s lado, c carta, cost mana paga, life vida paga (Sangria), adi Adiantar, pos posicao no Compasso, tgt alvo, mana restante, car Cargas de Orbita',
    atk: 'ataque: a atacante, as [atk, vida] antes, tgt alvo, ts [atk, vida] do alvo antes, rev 1 se saiu da Emboscada',
    hero: 'ataque com arma do protagonista', res: 'Evolucao (antiga Ressonancia)', prever: 'cartas mostradas e a escolhida', die: 'morte ou destruicao', sac: 'Sacrificio de Ritual',
    ritual: 'Ritual ativado', brotar: 'Brotar', trap: 'Armadilha ativada', phase2: 'chefe trocou de fase', endturn: 'fim do turno: mana nao usada e tamanho da mao', over: 'fim da partida: win P ou E',
  },
  ms: 'milissegundos desde o inicio da partida',
};
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
const lsDel = k => { try { localStorage.removeItem(k); } catch (e) { /* sem armazenamento */ } };
function gameRecord(result) {
  return { cheat: (st.ctx && (st.ctx.mode === 'run' || st.ctx.mode === 'defesa') && camp && camp.cheatUsed) ? true : undefined, id: st.gameId, player: ui.nick || '', rules: RULES, startedAt: new Date(st.t0).toISOString(), endedAt: new Date().toISOString(), result, disc: st.disc, enc: st.encId, seed: st.seed, mulligans: st.mulligans, turns: [E.S(st, 'P').turnCount, E.S(st, 'E').turnCount], hp: [E.S(st, 'P').leader.hp, E.S(st, 'E').leader.hp], events: st.events, log: st.log, ctx: st.ctx || { mode: 'avulsa' } };
}
function pushGame(r) { const games = lsGet(LS_GAMES, []); games.push(r); while (!lsSet(LS_GAMES, games) && games.length > 1) games.shift(); }
function finalizeGame(result) {
  if (!st || st.saved) return;
  pushGame(gameRecord(result || (st.over === 'P' ? 'win' : 'loss')));
  st.saved = true; lsDel(LS_CUR);
}
function persist() { if (!st || st.saved) return; if (st.over) finalizeGame(); else lsSet(LS_CUR, gameRecord('in_progress')); }
(function recoverUnfinished() { const cur = lsGet(LS_CUR, null); if (cur) { cur.result = 'abandoned'; pushGame(cur); lsDel(LS_CUR); } ui.nick = lsGet(LS_NICK, ''); })();
function logCount() { return lsGet(LS_GAMES, []).length; }
function exportCounts() {
  const games = lsGet(LS_GAMES, []); const since = lsGet(LS_LASTEXP, null);
  const cur = st && !st.saved ? 1 : 0;
  return { all: games.length + cur, novas: games.filter(g => !since || g.endedAt > since).length + cur };
}
function openExport() { const c = exportCounts(); ui.modal = { kind: 'export-menu', all: c.all, novas: c.novas }; render(); }
async function makeZip(inner, json) {
  if (!window.JSZip) return null;
  try { const z = new window.JSZip(); z.file(inner, json); return await z.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } }); } catch (e) { return null; }
}
async function deliver(blob, filename) {
  const inClaude = !!(window.claude && typeof window.claude.use === 'function');
  let dl = null;
  if (inClaude) { try { dl = await window.claude.use('downloads'); } catch (e) { dl = null; } }
  if (dl) {
    try { await dl.save({ filename, data: blob }); return 'ok'; }
    catch (err) { const code = err && err.code; if (code === 'declined') return 'declined'; if (code === 'rate_limited') return 'busy'; }
  }
  const file = (() => { try { return new File([blob], filename, { type: blob.type || 'application/octet-stream' }); } catch (e) { return null; } })();
  const touch = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  if (file && navigator.canShare && navigator.share && (touch || inClaude)) {
    try { if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: filename }); return 'ok'; } }
    catch (e) { if (e && e.name === 'AbortError') return 'declined'; }
  }
  if (!inClaude) {
    try { const url = URL.createObjectURL(blob); const lnk = document.createElement('a'); lnk.href = url; lnk.download = filename; document.body.appendChild(lnk); lnk.click(); lnk.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); return 'ok'; } catch (e) { /* janela de cópia */ }
  }
  return 'fail';
}
async function exportLogs(scope) {
  const since = lsGet(LS_LASTEXP, null);
  let games = lsGet(LS_GAMES, []);
  if (scope === 'novas' && since) games = games.filter(g => g.endedAt > since);
  const extra = st && !st.saved ? [gameRecord(st.over ? (st.over === 'P' ? 'win' : 'loss') : 'in_progress')] : [];
  const payload = { format: 'dragao-amarelo-log', version: 1, rules: RULES, exportedAt: new Date().toISOString(), scope: scope || 'tudo', since: scope === 'novas' ? since : null, player: ui.nick || '', userAgent: navigator.userAgent, legend: LEGEND, campaign: camp ? { id: camp.id, name: camp.name || '', cheatUsed: !!camp.cheatUsed, social: camp.social, socialColl: camp.socialColl, quests: camp.quests, gold: camp.gold, advs: camp.advs, fac: camp.fac, flags: camp.flags, created: camp.created, startDisc: camp.startDisc, day: camp.day, floor: camp.floor, cleared: camp.cleared, deck: camp.deck, collection: camp.collection, notes: camp.notes, history: camp.history, run: camp.run ? { floor: camp.run.floor, hp: camp.run.hp, visited: camp.run.visited, mochila: camp.run.mochila } : null } : null, oldCampaigns: lsGet(LS_OLD, []), rarity: R.RARITY, cards: Object.fromEntries(Object.entries(E.DEF).map(([id, d]) => [id, { name: d.name, cost: d.cost, type: d.type, atk: d.atk, hp: d.hp, disc: d.disc || 'inimigo', text: d.text }])), games: games.concat(extra) };
  const json = JSON.stringify(payload);
  const slug = (ui.nick || '').normalize('NFD').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  const base = `dragao-amarelo-log${slug ? '-' + slug : ''}-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}${scope === 'novas' ? '-novas' : ''}`;
  const n = payload.games.length;
  ui.modal = null; toast('Preparando o arquivo...');
  const zip = await makeZip(base + '.json', json);
  const res = await deliver(zip || new Blob([json], { type: 'application/json' }), base + (zip ? '.zip' : '.json'));
  if (res === 'ok') { lsSet(LS_LASTEXP, payload.exportedAt); toast(`Log exportado: ${n} partida${n === 1 ? '' : 's'}${zip ? ', compactado em .zip' : ''}.`); return; }
  if (res === 'declined') { toast('Exportação cancelada.'); return; }
  if (res === 'busy') { toast('Já existe uma confirmação de download aberta.'); return; }
  ui.modal = { kind: 'export', json, name: base + '.json', count: n, exportedAt: payload.exportedAt };
  render();
}
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const P = () => E.S(st, 'P'), O = () => E.S(st, 'E');
const keyOf = r => r.t === 'l' ? 'l:' + r.side : 'e:' + r.uid;
const discOf = e => E.DEF[e.id].disc || (e.owner === 'E' ? 'inimigo' : 'neutra');
const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Abertura ---------- */
function renderSetup() {
  const discs = Object.entries(E.DISC).map(([id, d]) => `
    <button class="opcao disc-${id} ${ui.disc === id ? 'escolhida' : ''}" data-disc="${id}" aria-pressed="${ui.disc === id}">
      <span class="opcao-nome">${esc(d.name)}</span><span class="opcao-papel">${esc(d.role)}</span><span class="opcao-texto">${esc(d.plan)}</span>
    </button>`).join('');
  const titles = { Comum: 'Encontros comuns', Elite: 'Elites', Chefe: 'Chefe' };
  const encs = ['Comum', 'Elite', 'Chefe'].map(t => `<div class="grupo-enc"><h3>${titles[t]}</h3>${Object.entries(E.ENC).filter(([, e]) => e.tier === t).map(([id, e]) => `
    <button class="opcao disc-inimigo ${ui.enc === id ? 'escolhida' : ''}" data-enc="${id}" aria-pressed="${ui.enc === id}">
      <span class="opcao-nome">${esc(e.name)}</span><span class="opcao-papel">${e.tier === 'Comum' ? esc(e.leader) + ', ' : ''}${e.hp} de Vida</span><span class="opcao-texto">${esc(e.rule)}</span>
    </button>`).join('')}</div>`).join('');
  $('#app').innerHTML = `
    <header class="abertura">
      <h1>Dragão Amarelo</h1>
      <p class="sub">Batalha avulsa nas Grutas Vivas</p>
      <p><button class="botao" data-act="home">Voltar ao início</button></p>
      <p class="intro">Escolha uma Disciplina e um encontro do grupo 1. Seu deck inicial tem 30 cartas: 20 neutras fixas, com os Felinos da Guilda, e 10 introdutórias da Disciplina. Você começa com 30 de Vida.</p>
    </header>
    <section class="escolha"><h2>Disciplina</h2><div class="grade-disc">${discs}</div></section>
    <section class="escolha"><h2>Encontro</h2>${encs}</section>
    <div class="acoes-setup"><button class="botao principal" data-act="start" ${ui.disc && ui.enc ? '' : 'disabled'}>Descer</button></div>
    <section class="escolha logs"><h2>Log de partidas</h2>
      <p class="intro">Cada partida fica guardada neste navegador. Exporte o arquivo para analisar depois.</p>
      <div class="linha-logs"><label for="apelido">Apelido no log</label><input id="apelido" type="text" maxlength="40" value="${esc(ui.nick)}" placeholder="ex.: Sanerion" autocomplete="off">
      <button class="botao" data-act="export">Exportar log (${logCount()} partida${logCount() === 1 ? '' : 's'})</button>
      <button class="botao" data-act="clear-logs" ${logCount() ? '' : 'disabled'}>Apagar logs</button></div>
    </section>
    <details class="regras"><summary>Como jogar</summary><ul>
      <li>Você sempre começa. A mana sobe 1 por turno, até 10.</li>
      <li>Toque numa carta da mão para jogá-la. Se ela precisar de alvo, toque no alvo destacado.</li>
      <li>Toque numa unidade sua com contorno verde para atacar. Unidades esperam um turno, salvo Avanço ou Acelerar.</li>
      <li>Guarda obriga o inimigo a atacá-la primeiro. Estruturas podem ser atacadas; Rituais, não.</li>
      <li>A partir do seu turno 4, use Evoluir: 3 vezes por partida, uma por turno.</li>
      <li>O Compasso mostra em que posição (1, 2 ou 3) cai a próxima carta jogada no turno.</li>
      <li>Passe o mouse ou toque em qualquer carta para ver os detalhes ao lado.</li>
    </ul></details>`;
}

/* ---------- Jogo ---------- */
function targetSet() {
  const s = new Set();
  if (!ui.mode) return s;
  (ui.mode.targets || []).forEach(r => s.add(keyOf(r)));
  if (ui.mode.kind === 'resonate') P().board.forEach(e => { if (e.kind === 'unit' && !E.isDead(e)) s.add('e:' + e.uid); });
  return s;
}
function dots(n, total) { let h = ''; for (let i = 0; i < total; i++) h += `<i class="${i < n ? 'cheio' : ''}"></i>`; return `<span class="pontos" aria-label="${n} de ${total}">${h}</span>`; }

function piece(e, tgt) {
  const isT = tgt.has('e:' + e.uid);
  const mine = e.owner === 'P';
  const can = mine && !ui.busy && E.canAttack(st, e) && E.attackTargets(st, 'P', e).length > 0;
  const sick = e.kind === 'unit' && e.summonedTurn === E.S(st, e.owner).turnCount && st.turnSide === e.owner && !E.hasKw(e, 'investida') && !E.hasKw(e, 'avanco') && !e.rushThisTurn;
  const kws = Object.keys(KW_LABEL).filter(k => E.hasKw(e, k)).map(k => `<span class="selo">${KW_LABEL[k]}</span>`).join('');
  const tags = e.tags.map(t => `<span class="selo tag">${esc(t)}</span>`).join('');
  let body = '';
  if (e.kind === 'unit') body = `<span class="stats"><b class="atk" title="${W('Ataque')}">${E.getAtk(st, e)}</b><b class="hp ${e.hp < e.maxHp ? 'ferido' : ''}" title="${W('Vida')}">${e.hp}</b></span>`;
  else if (e.kind === 'structure') body = `<span class="stats"><b class="hp" title="${W('Vida')}">${e.hp}</b></span>`;
  else if (e.kind === 'ritual') body = `<span class="contagem" title="Contagem">${e.countdown}</span>`;
  const estados = [];
  if (e.imovel > 0) estados.push('Imóvel');
  if (sick && mine && !e.attacked) estados.push('Esperando');
  if (e.attacked && mine && st.turnSide === 'P') estados.push('Já atacou');
  if (e.modules.length) estados.push(`${e.modules.length} Módulo${e.modules.length > 1 ? 's' : ''}`);
  const sel = ui.mode && ui.mode.kind === 'attack' && ui.mode.uid === e.uid;
  const cls = ['peca', e.kind, 'disc-' + discOf(e), isT ? 'alvo' : '', can ? 'pode' : '', e.imovel > 0 ? 'imovel' : '', E.hasKw(e, 'guarda') ? 'guarda' : '', e.resonated ? 'ressoou' : '', sel ? 'sel' : ''].join(' ');
  return `<button class="${cls}" data-ent="${e.uid}" data-info="e:${e.uid}" aria-label="${esc(e.name)}"><span class="marca" aria-hidden="true">${iconSvg(cardIconName(e.id))}</span><span class="nome">${esc(e.name)}</span><span class="selos">${kws}${tags}</span>${estados.length ? `<span class="estado">${estados.join(', ')}</span>` : ''}${body}</button>`;
}

function leaderE(tgt) {
  const o = O(), enc = st.enc;
  const isT = tgt.has('l:E');
  const pct = Math.max(0, Math.round(100 * o.leader.hp / o.leader.maxHp));
  const res = enc.boss ? `<span>Evolução ${dots(o.resonance.points, enc.resonance)}</span>` : '';
  return `<section class="lider">
    <div class="lider-id">${iconSvg(typeof ART !== 'undefined' ? ART.enc[st.encId] : null, 'ico-lider')}<span class="lider-nome">${esc(o.leader.name)}</span><span class="lider-tier">${enc.social ? 'Perfil ' + esc(enc.perfil) : enc.tier}${st.phase2 ? ', fase 2' : ''}</span></div>
    <p class="regra">${esc(enc.rule)}</p>
    <button class="alvo-lider ${isT ? 'alvo' : ''}" data-leader="E" data-info="l:E" aria-label="${SOC() ? 'Resistência' : 'Vida'} de ${esc(o.leader.name)}: ${Math.max(0, o.leader.hp)}">
      <span class="vida-num">${Math.max(0, o.leader.hp)}</span><small>de ${o.leader.maxHp}</small>
    </button>
    <div class="lider-num">
      <span class="barra" aria-hidden="true"><i style="width:${pct}%"></i></span>
      <span>${o.mana}/${o.maxMana} de ${W('mana')}</span><span class="conta">Mão ${o.hand.length}</span><span class="conta">Deck ${o.deck.length}</span>${res}
    </div>
  </section>`;
}

function centerBar() {
  let msg, cancel = false, cls = '';
  if (st.over) msg = st.over === 'P' ? (SOC() ? 'Acordo fechado.' : 'Vitória.') : (SOC() ? 'Negociação perdida.' : 'Derrota.');
  else if (st.pending && st.pending.kind === 'mulligan') msg = 'Escolha sua mão inicial.';
  else if (ui.busy || st.turnSide === 'E') { msg = `Vez de ${O().leader.name}.`; cls = 'inimigo-vez'; }
  else if (ui.mode) {
    cancel = true;
    msg = { play: `Escolha um alvo para ${ui.mode.name}.`, attack: 'Escolha o alvo do ataque.', hero: 'Escolha o alvo da sua arma.', resonate: SOC() ? 'Escolha um Argumento seu para Enfatizar.' : 'Escolha uma unidade sua para Evoluir.', confirm: `Toque de novo em ${ui.mode.name} ou em Jogar para confirmar.`, inspect: `${ui.mode.name}: ${ui.mode.reason}` }[ui.mode.kind];
  } else msg = SOC() ? `Seu turno ${P().turnCount}. Use Táticas, ponha Argumentos na mesa, pressione com os que estão prontos e encerre o turno.` : `Seu turno ${P().turnCount}. Jogue cartas, ataque com as unidades prontas e encerre o turno.`;
  const overBtn = st.over ? (st.ctx && st.ctx.mode === 'run' ? '<button class="botao principal" data-act="run-continue">Continuar</button>' : '<button class="botao" data-act="setup">Voltar</button>') : '';
  const m = ui.mode;
  const playBtn = m && m.kind === 'confirm' ? '<button class="botao principal" data-act="confirm-play">Jogar</button>' : '';
  const cancelLbl = m && m.kind === 'inspect' ? 'Fechar' : 'Cancelar';
  let det = '';
  if (m && m.idx !== undefined && ['play', 'confirm', 'inspect'].includes(m.kind)) {
    const inst = P().hand[m.idx];
    if (inst) { const d = E.DEF[inst.id]; det = `<div class="faixa-detalhe"><p class="linha">${typeLabel(d)}${d.tags.length ? ' (' + esc(d.tags.join(', ')) + ')' : ''}, custo ${E.getCost(st, 'P', inst)}</p><p>${fmtText(d.text)}</p>${glossFor(d.text, d.type === 'ritual' ? ['Ritual'] : d.type === 'trap' ? ['Armadilha'] : d.type === 'structure' ? ['Estrutura'] : [])}</div>`; }
  }
  return `<div class="faixa ${cls}"><span>${esc(msg)}</span><span class="faixa-botoes">${playBtn}${cancel ? `<button class="botao discreto" data-act="cancel">${cancelLbl}</button>` : (!st.over ? '<button class="botao discreto" data-act="quit">Sair da partida</button>' : overBtn)}</span>${det}</div>`;
}

function panelP() {
  const p = P();
  const pos = E.compassoPos(st, 'P');
  const beats = [1, 2, 3].map(n => `<span class="batida ${n === pos ? 'agora' : ''}">${n}</span>`).join('');
  const canRes = E.canResonate(st, 'P') && !ui.busy;
  const resInfo = p.turnCount < 4 ? 'a partir do turno 4' : (p.resonance.used ? 'já usada neste turno' : '');
  let crys = '';
  for (let i = 0; i < p.maxMana; i++) crys += `<i class="${i < p.mana ? 'cheio' : ''}"></i>`;
  const extra = p.mana > p.maxMana ? ` +${p.mana - p.maxMana}` : '';
  const canHero = E.canHeroAttack(st, 'P') && !ui.busy;
  const weapon = p.weapon ? `<button class="arma ${canHero ? 'pode' : ''} ${ui.mode && ui.mode.kind === 'hero' ? 'sel' : ''}" data-act="weapon" data-info="w">${esc(p.weapon.name)}: ${p.weapon.atk} de ataque, ${p.weapon.dur} uso${p.weapon.dur > 1 ? 's' : ''}</button>` : '';
  const traps = p.traps.map(id => `<span class="armadilha" data-info="d:${id}">${esc(E.DEF[id].name)}</span>`).join('');
  const pend = p.delayed.map(id => `${E.DEF[id].name} chega no próximo turno`).concat(p.ecoReturns.map(id => `${E.DEF[id].name} volta por Eco no próximo turno`));
  const pct = Math.max(0, Math.round(100 * p.leader.hp / p.leader.maxHp));
  const endOk = st.turnSide === 'P' && !ui.busy && !st.over && !st.pending;
  return `<section class="painel-voce"><div class="painel-dados">
    <div class="voce-vida" data-info="l:P"><b>${Math.max(0, p.leader.hp)}</b><span class="conta">de ${p.leader.maxHp}${SOC() ? ' de Compostura' : ''}</span><span class="barra" aria-hidden="true"><i style="width:${pct}%"></i></span></div>
    <div class="mana" title="${W('Mana')}">${crys}<span>${p.mana}/${p.maxMana}${extra}</span></div>
    ${st.usesCompasso ? `<div class="compasso" title="Compasso: posição da próxima carta"><span class="rotulo">Compasso</span>${beats}</div>` : ''}
    <div class="ressonancia"><button class="botao" data-act="resonate" ${canRes ? '' : 'disabled'}>${W('Evoluir')}</button>${dots(p.resonance.points, 3)}${resInfo ? `<small>${resInfo}</small>` : ''}</div>
    ${weapon}${traps}
    <span class="conta">Deck ${p.deck.length}</span>
    ${pend.length ? `<p class="pendente">${esc(pend.join('; '))}.</p>` : ''}
    </div><button class="selo-turno" data-act="end" ${endOk ? '' : 'disabled'}>Encerrar turno</button>
  </section>`;
}

const KW_RE = new RegExp('(?<![\\p{L}])(Exige Compasso \\d|Compasso \\d(?: ou \\d)?|Ao Entrar|Ao Morrer|Ao Evoluir|Ao Revelar|Ao ativar|Sangria \\d+|Ritual \\d+|Adiantar \\d+|Prever \\d+|Guarda|Acelerar|Avanço|Letal|Dreno|Escudo|Emboscada|Eco|Atraso|Cristal|Despertar|Armadilha|Órbita|Módulo|Brotar|Imóvel|Felinos|Felino|Dragões|Dragão|Abertura|Repercussão|Ponto Sensível|Álibi|Ao Enfatizar|Perfil (?:Ganância|Vaidade|Princípios|Procedimento|Respeito)|Compostura|Resistência|Lábia|Rumores|Rumor|Construto|Rituais|Ritual|Cargas|Carga|Evoluir|Sacrifício)(?![\\p{L}])', 'gu');
const KW_ONLY = /^(?:(?:Ponto Sensível|Álibi|Guarda|Acelerar|Avanço|Letal|Dreno|Escudo|Emboscada|Eco|Atraso|Felino|Dragão|Construto|Órbita|Módulo|Armadilha|Ritual \d+|Sangria \d+|Adiantar \d+|Arma \d+\/\d+)\.\s*)+$/u;
function fmtText(text, compact) {
  if (!text) return '';
  const lines = [];
  text.split(/(?<=\.)\s+(?=[A-ZÀ-Ú])/u).forEach(sn => { const kw = KW_ONLY.test(sn); if (kw && lines.length && lines[lines.length - 1].kw) lines[lines.length - 1].t += ' ' + sn; else lines.push({ t: sn, kw }); });
  const bold = t => esc(t).replace(KW_RE, '<b>$1</b>');
  return lines.map(l => bold(l.t)).join(compact || text.length > 118 ? ' ' : '<br>');
}
function hashStr(t) { let h = 7; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return Math.abs(h); }
function iconSvg(name, cls) { const d = typeof ART !== 'undefined' && name ? ART.icons[name] : null; return d ? `<svg class="${cls || 'ico'}" viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path d="${d}"/></svg>` : ''; }
function cardIconName(id) { if (typeof ART === 'undefined') return null; if (ART.card[id]) return ART.card[id]; const d = E.DEF[id]; if (d && d.social) return d.tags.includes('Felino') ? 'cat' : ART.ui[d.type === 'unit' ? 'arg' : 'tat']; return null; }
function artBand(id, disc, big) {
  const n = cardIconName(id); if (!n) return '';
  const h = hashStr(id);
  return `<span class="arte disc-${disc}${big ? ' grande' : ''}" data-d="${disc}" style="--ang:${100 + h % 160}deg;--px:${h % 37}px;--py:${(h >> 5) % 29}px" aria-hidden="true">${iconSvg(n)}</span>`;
}
function cardHtml(inst, i, extraCls, attrs, cost) {
  const d = E.DEF[inst.id];
  const pos = st ? E.compassoPos(st, 'P') : 1;
  const hit = st && ((d.compasso && d.compasso.includes(pos)) || d.exigeCompasso === pos);
  const c = cost === undefined ? d.cost : cost;
  const stats = d.type === 'unit' ? `<span class="stats"><b class="atk">${d.atk}</b><b class="hp">${d.hp}</b></span>`
    : d.type === 'weapon' ? `<span class="stats"><b class="atk">${d.atk}</b><b class="dur">${d.hp}</b></span>`
    : d.type === 'structure' ? `<span class="stats"><b class="hp">${d.hp}</b></span>` : '';
  const tags = d.tags.length ? ` (${d.tags.join(', ')})` : '';
  return `<button class="carta disc-${d.disc || 'neutra'} ${extraCls}" ${attrs}>
    <span class="custo ${c < d.cost ? 'menor' : c > d.cost ? 'maior' : ''}">${c}</span>
    <span class="nome">${esc(d.name)}</span>
    <span class="tipo">${typeLabel(d)}${esc(tags)}</span>
    ${artBand(inst.id, d.disc || 'neutra')}
    <span class="texto">${fmtText(d.text)}</span>
    ${d.orbita ? `<span class="carga">${inst.cargas || 0} Carga${inst.cargas === 1 ? '' : 's'}</span>` : ''}
    ${hit ? '<span class="no-tempo">No Compasso</span>' : ''}
    ${stats}
  </button>`;
}
function handCard(inst, i) {
  const chk = (st.turnSide === 'P' && !ui.busy && !st.over) ? E.canPlay(st, 'P', i) : { ok: false };
  const sel = ui.mode && ['play', 'confirm', 'inspect'].includes(ui.mode.kind) && ui.mode.idx === i;
  return cardHtml(inst, i, `${chk.ok ? 'jogavel' : 'bloqueada'} ${sel ? 'sel' : ''}`, `data-hand="${i}" data-info="h:${i}"`, E.getCost(st, 'P', inst));
}

function glossFor(text, extra) {
  const keys = new Set(extra || []);
  Object.keys(GLOSS).forEach(k => { if (text && text.includes(k)) keys.add(k); });
  if (!keys.size) return '';
  return `<dl>${[...keys].filter(k => GLOSS[k]).map(k => `<dt>${k}</dt><dd>${GLOSS[k]}</dd>`).join('')}</dl>`;
}
function infoPanel() {
  const k = ui.info;
  let html = '';
  if (st && k) {
    if (k.startsWith('h:')) {
      const inst = P().hand[+k.slice(2)];
      if (inst) {
        const d = E.DEF[inst.id];
        const chk = E.canPlay(st, 'P', +k.slice(2));
        html = `${artBand(inst.id, d.disc || 'neutra', true)}<h2>${esc(d.name)}</h2><p class="linha">${typeLabel(d)}, custo ${E.getCost(st, 'P', inst)}${d.disc ? ', ' + DISC_NAME[d.disc] : ''}</p><p>${fmtText(d.text)}</p>${!chk.ok && chk.reason && st.turnSide === 'P' ? `<p class="linha">${esc(socTxt(chk.reason))}</p>` : ''}${glossFor(d.text, d.type === 'ritual' ? ['Ritual'] : d.type === 'trap' ? ['Armadilha'] : d.type === 'structure' ? ['Estrutura'] : [])}`;
      }
    } else if (k.startsWith('e:')) {
      const e = E.ent(st, { t: 'e', uid: +k.slice(2) });
      if (e) {
        const d = E.DEF[e.id];
        const kw = Object.keys(KW_LABEL).filter(x => E.hasKw(e, x)).map(x => KW_LABEL[x]);
        const st2 = e.kind === 'unit' ? `${E.getAtk(st, e)} de ${SOC() ? 'Peso' : 'ataque'}, ${e.hp} de ${e.maxHp} de ${W('Vida')}` : e.kind === 'structure' ? `${e.hp} de ${W('Vida')}` : `contagem ${e.countdown}`;
        const extra = kw.slice(); if (e.imovel > 0) extra.push('Imóvel'); if (e.kind === 'ritual') extra.push('Ritual'); if (e.kind === 'structure') extra.push('Estrutura'); if (e.resonated) extra.push('Evoluir');
        html = `${artBand(e.id, discOf(e), true)}<h2>${esc(e.name)}</h2><p class="linha">${typeLabel(d) || 'Unidade'} ${e.owner === 'P' ? 'sua' : 'inimiga'}, ${st2}</p>${d.text ? `<p>${fmtText(d.text)}</p>` : ''}${e.modules.length ? `<p class="linha">Módulos: ${e.modules.map(m => esc(E.DEF[m].name)).join(', ')}</p>` : ''}${glossFor(d.text, extra)}`;
      }
    } else if (k === 'l:E') {
      const o = O();
      html = `<h2>${esc(o.leader.name)}</h2><p class="linha">${st.enc.social ? 'Perfil ' + esc(st.enc.perfil) : st.enc.tier}, ${Math.max(0, o.leader.hp)} de ${o.leader.maxHp} de ${SOC() ? 'Resistência' : 'Vida'}</p><p>${esc(st.enc.rule)}</p>`;
    } else if (k === 'l:P') {
      const p = P();
      html = `<h2>Você</h2><p class="linha">${Math.max(0, p.leader.hp)} de ${p.leader.maxHp} de ${SOC() ? 'Compostura' : 'Vida'}, ${DISC_NAME[st.disc]}</p><p>${SOC() ? 'Ênfases' : 'Evoluções'} restantes: ${p.resonance.points}. Cartas no deck: ${p.deck.length}.</p>${glossFor('Evoluir Compasso')}`;
    } else if (k === 'w' && P().weapon) {
      const w = P().weapon, d = E.DEF[w.id];
      html = `<h2>${esc(w.name)}</h2><p class="linha">Arma, ${w.atk} de ataque, ${w.dur} uso${w.dur > 1 ? 's' : ''} restante${w.dur > 1 ? 's' : ''}</p><p>${fmtText(d.text)}<br>Toque na arma para atacar com o protagonista; atacar uma unidade fere você com o ataque dela.</p>${glossFor(d.text)}`;
    } else if (k.startsWith('d:')) {
      const d = E.DEF[k.slice(2)];
      if (d) html = `${artBand(k.slice(2), d.disc || 'neutra', true)}<h2>${esc(d.name)}</h2><p class="linha">${typeLabel(d)}</p><p>${fmtText(d.text)}</p>${glossFor(d.text, ['Armadilha'])}`;
    }
  }
  return `<section class="info" aria-label="Detalhes">${html || '<p class="info-vazia">Passe o mouse ou toque numa carta para ver os detalhes.</p>'}</section>`;
}
function logPanel() {
  return `<section class="registro"><h2>Registro</h2><ol>${st.log.slice(-80).reverse().map(l => `<li>${esc(socTxt(st.ctx && st.ctx.mode !== 'run' ? l.replace('Você caiu na dungeon.', 'Você caiu.') : l))}</li>`).join('')}</ol></section>`;
}
function overPanel() {
  const win = st.over === 'P';
  return `<div class="veu"><div class="janela resultado" role="dialog" aria-modal="true" aria-labelledby="res-t">
    <h2 id="res-t">${win ? (SOC() ? 'Acordo fechado' : 'Vitória') : (SOC() ? 'Negociação perdida' : 'Derrota')}</h2>
    <p>${SOC() ? (win ? `${esc(O().leader.name)} cedeu no seu turno ${P().turnCount}, com você a ${P().leader.hp} de Compostura.` : `Você perdeu a compostura no turno ${P().turnCount}. ${esc(O().leader.name)} ficou com ${Math.max(0, O().leader.hp)} de Resistência.`) : (win ? `${esc(O().leader.name)} caiu no seu turno ${P().turnCount}, com você a ${P().leader.hp} de Vida.` : `Você caiu no turno ${P().turnCount}. ${esc(O().leader.name)} ficou com ${Math.max(0, O().leader.hp)} de Vida.`)}</p>
    ${win && st.ctx && st.ctx.mode === 'run' && camp && camp.run && camp.run.inBattle ? `<p class="destaque">Recompensa: +${camp.run.inBattle.gold || 0} de ouro.</p>` : ''}
    ${st.ctx && ['run', 'defesa', 'social', 'passeio'].includes(st.ctx.mode) ? `<div class="opcoes"><button class="botao principal" data-act="${{ defesa: 'def-continue', social: 'soc-continue', passeio: 'pas-continue' }[st.ctx.mode] || 'run-continue'}">Continuar</button><button class="botao" data-act="close-over">Ver a mesa</button><button class="botao" data-act="export">Exportar log</button></div>` : ''}<div class="opcoes" ${st.ctx && ['run', 'defesa', 'social', 'passeio'].includes(st.ctx.mode) ? 'hidden' : ''}><button class="botao principal" data-act="again">Jogar de novo</button><button class="botao" data-act="setup">Mudar escolhas</button><button class="botao" data-act="close-over">Ver a mesa</button><button class="botao" data-act="export">Exportar log</button></div>
  </div></div>`;
}
function modalHtml() {
  const m = ui.modal;
  if (m.kind === 'export-menu') {
    return `<div class="veu"><div class="janela" role="dialog" aria-modal="true" aria-labelledby="em-t"><h2 id="em-t">Exportar log</h2><p>O arquivo sai compactado em .zip, cerca de 8 vezes menor. No celular, abre o menu de compartilhar ou salvar.</p><div class="opcoes"><button class="botao principal" data-act="export-novas" ${m.novas ? '' : 'disabled'}>Só as novas (${m.novas})</button><button class="botao" data-act="export-tudo" ${m.all ? '' : 'disabled'}>Tudo (${m.all})</button><button class="botao" data-act="close-modal">Cancelar</button></div><p class="intro">“Novas” são as partidas terminadas depois da última exportação.</p></div></div>`;
  }
  if (m.kind === 'export') {
    return `<div class="veu"><div class="janela" role="dialog" aria-modal="true" aria-labelledby="ex-t"><h2 id="ex-t">Exportar log</h2><p>O download não está disponível aqui. Copie o conteúdo abaixo (${m.count} partida${m.count === 1 ? '' : 's'}) e salve como ${esc(m.name)}.</p><textarea class="export-txt" readonly>${esc(m.json)}</textarea><div class="opcoes"><button class="botao principal" data-act="copy-log">Copiar</button><button class="botao" data-act="close-modal">Fechar</button></div></div></div>`;
  }
  if (m.kind === 'prever') {
    const cards = m.cards.map(inst => {
      const t = m.take === inst.uid;
      return cardHtml(inst, 0, t ? 'sel' : 'fundo', `data-prever="${inst.uid}" aria-pressed="${t}"`).replace('</button>', `<span class="marca">${t ? 'Vai para a mão' : 'Vai para o fundo'}</span></button>`);
    }).join('');
    return `<div class="veu"><div class="janela" role="dialog" aria-modal="true" aria-labelledby="pv-t"><h2 id="pv-t">Prever</h2><p>Escolha uma carta para a mão. As outras vão para o fundo do deck.</p><div class="prever-lista">${cards}</div><div class="opcoes"><button class="botao principal" data-act="prever-ok">Pegar esta</button></div></div></div>`;
  }
  return `<div class="veu"><div class="janela" role="dialog" aria-modal="true" aria-labelledby="md-t"><h2 id="md-t">${esc(m.title)}</h2><p>${esc(m.text)}</p><div class="opcoes">${m.options.map((o, i) => `<button class="botao ${i === 0 ? 'principal' : ''}" data-choice="${o.v}">${esc(o.label)}</button>`).join('')}<button class="botao" data-choice="__cancel">Cancelar</button></div></div></div>`;
}

/* ---------------- Campanha ---------------- */
const R = window.RunLib;
const LS_CAMP = 'dragao-amarelo-campanha-v1';
let camp = lsGet(LS_CAMP, null);
ui.screen = 'title'; ui.deckFilter = 'disc'; ui.scene = null; ui.newDisc = null;
const saveCamp = () => { if (!camp) return; if (typeof cheats !== 'undefined' && cheats.unlimited && camp.acts) camp.acts = {}; lsSet(LS_CAMP, camp); };
function mkRng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = Math.random;
function hist(ev) { if (!camp) return; ev.day = camp.day; ev.t = new Date().toISOString(); (camp.history = camp.history || []).push(ev); }
function addCards(ids) { ids.forEach(id => { camp.collection[id] = (camp.collection[id] || 0) + 1; }); }
function collectionSize() { return Object.values(camp.collection).reduce((a, b) => a + b, 0); }
function ownedDiscs() { return R.DISCS.filter(d => Object.keys(camp.collection).some(id => E.DEF[id].disc === d)); }
const rarTag = id => { const r = R.RARITY[id] || 'C'; return `<span class="rar rar-${r}">${R.RAR[r]}</span>`; };
function cardById(id, extraCls, attrs, note, noteCls) {
  return cardHtml({ id, cargas: 0 }, 0, extraCls || '', attrs || '').replace(/(<span class="tipo">[\s\S]*?<\/span>)/, `$1${rarTag(id)}`).replace(/<\/button>$/, `${note ? `<span class="marca ${noteCls || ''}">${esc(note)}</span>` : ''}</button>`);
}
function copiesNote(id) {
  const n = (camp.collection[id] || 0) + (camp.run ? camp.run.mochila.filter(x => x === id).length : 0);
  return n >= 2 ? [`Repetida: você já tem ${n}`, 'repetida'] : n === 1 ? ['Você tem 1', 'tem1'] : ['Nova', 'nova'];
}
function newCampaign(disc, name) {
  const coll = R.starterCollection(disc);
  camp = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), created: new Date().toISOString(), startDisc: disc, day: 1, floor: 1, cleared: {}, collection: coll, deck: { disc, cards: Object.assign({}, coll) }, notes: [], history: [], run: null };
  if (name) { camp.name = name; camp.introSeen = true; }
  ensureGuild();
  hist({ k: 'campanha', disc });
  saveCamp();
}
function startDescent(floor, revisit) {
  const probs = R.deckProblems(camp.deck, camp.collection);
  if (probs.length) { toast('Ajuste o deck antes de descer: ' + probs[0]); return; }
  ensureGuild();
  if (camp.acts.descer) { toast('Você já desceu hoje. Encerre o dia para descer de novo.'); return; }
  camp.acts.descer = true;
  const seed = (Date.now() ^ (floor * 7919)) >>> 0;
  const withNote = !revisit && !camp.notes.includes(floor);
  camp.run = { floor, revisit: !!revisit, seed, map: R.genMap(mkRng(seed), floor, withNote), pos: null, visited: [], hp: 30, mochila: [], bonus: {}, evUsed: [], inBattle: null, gold: 0 };
  hist({ k: 'descida', floor, revisit: !!revisit, deck: R.deckList(camp.deck) });
  saveCamp();
  ui.screen = 'map'; render(); window.scrollTo(0, 0);
}
function reward(ids, why) {
  const run = camp.run;
  if (run.revisit) return 'Revisita: sem cartas.';
  ids.forEach(id => run.mochila.push(id));
  hist({ k: 'carta', why, cards: ids, floor: run.floor });
  return `${ids.map(id => E.DEF[id].name).join(', ')} ${ids.length > 1 ? 'vão' : 'vai'} para a mochila.`;
}
function hpChange(n) { const run = camp.run; run.hp = Math.max(1, Math.min(30, run.hp + n)); }
function startRunBattle(b) {
  const run = camp.run;
  if (!b.gold) b.gold = goldFor(b.type);
  run.inBattle = b;
  st = E.newGame(camp.deck.disc, b.enc, null, { deck: R.deckList(camp.deck), hp: run.hp, encBonus: b.encBonus || 0, extraHand: (run.bonus.hand || 0) + (run.allHand || 0), extraMana: run.bonus.mana || 0, firstMana: run.bonus.manaFirst || 0 });
  st.gameId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  st.ctx = { mode: 'run', camp: camp.id, day: camp.day, floor: run.floor, node: b.type, final: !!b.final, revisit: run.revisit, hpStart: run.hp, bonus: Object.assign({}, run.bonus) };
  run.bonus = {};
  saveCamp();
  ui.screen = 'battle'; ui.mode = null; ui.info = null; ui.modal = null; ui.busy = false; ui.overClosed = false;
  render(); window.scrollTo(0, 0);
}
function enterNode(id) {
  const run = camp.run; const n = run.map.nodes[id];
  run.pos = id; run.visited.push(id);
  hist({ k: 'no', floor: run.floor, type: n.type, enc: n.enc || null });
  saveCamp();
  if (n.type === 'batalha' || n.type === 'elite' || n.type === 'chefe') { startRunBattle({ nodeId: id, enc: n.enc, encBonus: n.encBonus || 0, type: n.type, final: !!n.final }); return; }
  if (n.type === 'evento') {
    const POOL = run.floor >= 6 ? R.EVENTS2 : R.EVENTS;
    const left = POOL.filter(e => !run.evUsed.includes(e.id));
    let ev = (left.length ? left : POOL)[Math.floor(rnd() * (left.length || POOL.length))];
    if ((run.floor === 7 || run.floor === 8) && !camp.flags.engrenagem && !run.evUsed.includes('cofre') && !run.revisit) ev = R.COFRE;
    run.evUsed.push(ev.id); saveCamp();
    ui.scene = { kind: 'event', ev }; ui.screen = 'scene'; render(); return;
  }
  if (n.type === 'tesouro') { const c = R.treasureCard(rnd, camp.deck.disc); ui.scene = { kind: 'treasure', card: c, text: reward([c], 'tesouro') }; saveCamp(); ui.screen = 'scene'; render(); return; }
  if (n.type === 'acampamento') { ui.scene = { kind: 'camp' }; ui.screen = 'scene'; render(); return; }
  if (n.type === 'banca') { ui.scene = { kind: 'banca', nodeId: id }; ui.screen = 'scene'; render(); return; }
  if (n.type === 'nota') {
    const first = !camp.notes.includes(run.floor);
    if (first) { camp.notes.push(run.floor); run.bonus.hand = (run.bonus.hand || 0) + 1; hist({ k: 'nota', floor: run.floor }); saveCamp(); }
    ui.scene = { kind: 'nota', floor: run.floor, first }; ui.screen = 'scene'; render(); return;
  }
}
function resolveEvent(choice) {
  const run = camp.run; const ev = ui.scene.ev; let txt = '';
  const pool = R.poolOf(camp.deck.disc).concat(R.poolOf('neutra'));
  if (choice === 'sair') txt = 'Você segue em frente.';
  else if (ev.id === 'cogumelos' && choice === 'comer') { if (rnd() < 0.5) { hpChange(10); txt = 'Delicioso. Você recupera 10 de Vida.'; } else { hpChange(-4); txt = 'O brilho não era bom sinal. Você perde 4 de Vida.'; } }
  else if (ev.id === 'cogumelos' && choice === 'colher') txt = reward(['racao'], 'evento');
  else if (ev.id === 'teia' && choice === 'cortar') { hpChange(-4); const fel = R.poolOf('neutra').filter(id => E.DEF[id].tags.includes('Felino')); txt = 'O gato agradece com desdém. ' + reward([fel[Math.floor(rnd() * fel.length)]], 'evento'); }
  else if (ev.id === 'altar' && choice === 'sangue') { hpChange(-6); txt = 'As velas tremem. ' + reward([R.cardFrom(rnd, [camp.deck.disc], 'R')], 'evento'); }
  else if (ev.id === 'altar' && choice === 'rezar') { hpChange(5); txt = 'Um calor estranho. Você recupera 5 de Vida.'; }
  else if (ev.id === 'ponte' && choice === 'correr') { hpChange(-5); run.bonus.mana = (run.bonus.mana || 0) + 1; txt = 'Você chega do outro lado arranhado e acelerado: na próxima luta, comece com +1 de mana máxima.'; }
  else if (ev.id === 'eco' && choice === 'seguir') { run.bonus.hand = (run.bonus.hand || 0) + 1; txt = 'O eco some numa curva, mas você aprende o caminho: na próxima luta, comece com 1 carta a mais.'; }
  else if (ev.id === 'ninho' && choice === 'vasculhar') {
    if (rnd() < 0.6) txt = 'Entre penas e ossos, algo útil. ' + reward([R.cardFrom(rnd, [camp.deck.disc, 'neutra'], 'I')], 'evento');
    else { hist({ k: 'evento', id: ev.id, choice, res: 'luta' }); saveCamp(); const F = R.FLOORS[run.floor]; toast('Os donos do ninho voltaram!'); startRunBattle({ nodeId: run.pos, enc: F.commons[Math.floor(rnd() * F.commons.length)], encBonus: 0, type: 'batalha', final: false, fromEvent: true }); return; }
  }
  else if (ev.id === 'bigorna' && choice === 'cuidado') { run.sucata = (run.sucata || 0) + 1; txt = 'Uma batida certa, e uma lasca de metal útil se solta: +1 de Sucata.'; }
  else if (ev.id === 'bigorna' && choice === 'tudo') { if (rnd() < 0.5) { const eq = Object.keys(R.RARITY).filter(id => R.RARITY[id] === 'R' && (E.DEF[id].type === 'weapon' || E.DEF[id].module) && (E.DEF[id].grupo || 1) <= 2); const pool2 = eq.length ? eq : Object.keys(R.RARITY).filter(id => E.DEF[id].type === 'weapon'); txt = 'O metal canta, e sai da bigorna algo que dá orgulho. ' + reward([pool2[Math.floor(rnd() * pool2.length)]], 'evento'); } else { hpChange(-8); txt = 'Uma fagulha acerta onde não devia. Você perde 8 de Vida.'; } }
  else if (ev.id === 'rio' && choice === 'contornar') { hpChange(-2); txt = 'Pelas beiradas quentes, devagar. Você perde 2 de Vida.'; }
  else if (ev.id === 'rio' && choice === 'ponte') { if (rnd() < 0.6) { run.sucata = (run.sucata || 0) + 4; txt = 'A ponte aguenta, e do outro lado há sucata boa: +4 de Sucata.'; } else { hpChange(-10); txt = 'A ponte cede no meio do caminho. Você chega queimado: perde 10 de Vida.'; } }
  else if (ev.id === 'golem' && choice === 'desmontar') {
    run.sucata = (run.sucata || 0) + 5;
    if (rnd() < 0.5) { hist({ k: 'evento', id: ev.id, choice, res: 'luta' }); saveCamp(); toast('O golem acorda! +5 de Sucata, se você sair vivo.'); startRunBattle({ nodeId: run.pos, enc: 'oficina', encBonus: -6, type: 'batalha' }); return; }
    txt = 'Placa por placa, sem um rangido: +5 de Sucata.';
  }
  else if (ev.id === 'altar_fogo' && choice === 'ouro') { if (camp.gold >= 20) { camp.gold -= 20; hpChange(10); txt = 'A chama aceita o ouro e devolve calor: você recupera 10 de Vida.'; } else txt = 'Você não tem 20 de ouro para oferecer. A chama não se ofende.'; }
  else if (ev.id === 'altar_fogo' && choice === 'vida') { hpChange(-6); run.bonus.mana = (run.bonus.mana || 0) + 1; txt = 'A chama toma um pouco de você e devolve fôlego: na próxima luta, comece com +1 de mana máxima.'; }
  else if (ev.id === 'prisioneiro' && choice === 'negociar') { hist({ k: 'evento', id: ev.id, choice, res: 'negociacao' }); saveCamp(); if (socialProblems().length) { txt = 'Seu deck social não está pronto para essa conversa. O guarda nem olha para você.'; } else { startSocial('guarda_azer', { prisioneiro: true, enc: 'guarda_azer' }); return; } }
  else if (ev.id === 'vapor' && choice === 'esperar') { hpChange(3); txt = 'Paciência e calor seco: você recupera 3 de Vida.'; }
  else if (ev.id === 'vapor' && choice === 'correr') { hpChange(-5); run.bonus.hand = (run.bonus.hand || 0) + 2; txt = 'Queima, mas você chega antes de tudo: na próxima luta, comece com 2 cartas a mais.'; }
  else if (ev.id === 'cofre' && choice === 'abrir') { camp.flags.engrenagem = true; txt = 'Dentro, embrulhada num pano com cheiro de óleo, está uma engrenagem que brilha em roxo: a engrenagem mágica da Chrome. Junto, um bilhete: “Juros inclusos. E.”'; hist({ k: 'item', id: 'engrenagem' }); }
  hist({ k: 'evento', id: ev.id, choice, res: txt });
  saveCamp();
  ui.scene = { kind: 'event', ev, result: txt }; render();
}
function battleDone() {
  const run = camp.run; const b = run.inBattle; const won = st.over === 'P'; const hpEnd = E.S(st, 'P').leader.hp;
  st = null; run.inBattle = null;
  hist({ k: 'luta', floor: run.floor, enc: b.enc, type: b.type, won, hp: hpEnd });
  if (!won) { floorFailed('Você caiu na luta.'); return; }
  const gg = b.gold || goldFor(b.type); camp.gold = (camp.gold || 0) + gg; run.gold = (run.gold || 0) + gg; hist({ k: 'ouro', from: b.type, gold: gg });
  run.hp = Math.min(30, hpEnd + 6);
  let sc = 0; if (run.floor >= 6) { const r = SUCATA[b.type] || SUCATA.batalha; sc = rint(r[0], r[1]); run.sucata = (run.sucata || 0) + sc; }
  toast(`+${gg} de ouro${sc ? ` e +${sc} de Sucata` : ''}.`);
  if (b.final) { floorCleared(); return; }
  if (b.type === 'elite' && !run.revisit) { ui.scene = { kind: 'elite', cards: R.eliteChoices(rnd, camp.deck.disc) }; ui.screen = 'scene'; saveCamp(); render(); return; }
  saveCamp(); ui.screen = 'map'; render(); window.scrollTo(0, 0);
}
function floorCleared() {
  const run = camp.run;
  if (run.revisit) { hist({ k: 'andar', floor: run.floor, res: 'revisita' }); camp.run = null; afterRun(); saveCamp(); ui.scene = { kind: 'msg', title: `Andar ${run.floor} revisitado`, text: `Você volta à superfície com ${run.gold || 0} de ouro. Revisitas não dão cartas.` }; ui.screen = 'scene'; render(); return; }
  addCards(run.mochila);
  camp.cleared[run.floor] = true; camp.floor = Math.max(camp.floor, run.floor + 1);
  hist({ k: 'andar', floor: run.floor, res: 'concluido', mochila: run.mochila.slice() });
  if (run.floor === 3 && !camp.debt && !camp.pending.some(p => p.kind === 'credor')) camp.pending.push({ kind: 'credor' });
  if (run.floor === 8 && !camp.flags.parcela2 && !camp.pending.some(p => p.kind === 'credor')) {
    camp.flags.parcela2 = true;
    if (debtOpen()) camp.debt.amount += 700; else camp.debt = { amount: 700, status: 'pendente', stage: 2, overdue: 0 };
    camp.debt.stage = 2; camp.pending.push({ kind: 'credor', segunda: true });
  }
  if (run.floor === 10 && !camp.flags.ignarTesouro) { camp.gold += 800; camp.flags.ignarTesouro = true; hist({ k: 'tesouro', from: 'ignar', gold: 800 }); }
  let treasure = run.floor === 10 && camp.flags.ignarTesouro && !run.revisit ? 800 : 0; if (run.floor === 5 && !camp.flags.basiliscoTesouro) { treasure = 300; camp.gold += treasure; camp.flags.basiliscoTesouro = true; hist({ k: 'tesouro', from: 'basilisco', gold: treasure }); }
  const pack = R.openFloorPack(rnd, camp.deck.disc, camp.collection); addCards(pack);
  hist({ k: 'booster', type: 'andar', disc: camp.deck.disc, cards: pack });
  ui.scene = { kind: 'booster', type: 'andar', floor: run.floor, mochila: run.mochila.slice(), cards: pack, gold: run.gold || 0, treasure };
  camp.run = null; afterRun(); saveCamp(); ui.screen = 'scene'; render(); window.scrollTo(0, 0);
}
function floorFailed(why) {
  const run = camp.run; let kept = null;
  if (!run.revisit && run.mochila.length) { kept = run.mochila[Math.floor(rnd() * run.mochila.length)]; addCards([kept]); }
  hist({ k: 'andar', floor: run.floor, res: 'derrota', kept, lost: run.mochila.length - (kept ? 1 : 0) });
  camp.run = null; afterRun(); saveCamp();
  ui.scene = { kind: 'msg', title: 'Você caiu', text: `${why} Felix te arrasta de volta à superfície. O andar ${run.floor} recomeça amanhã.${run.gold ? ` O ouro das lutas (${run.gold}) já está no cofre da guilda.` : ''}${kept ? ` Da mochila, só sobrou ${E.DEF[kept].name}.` : ''}` };
  ui.screen = 'scene'; render(); window.scrollTo(0, 0);
}

function logsHtml() {
  return `<section class="escolha logs"><h2>Log de partidas</h2>
    <p class="intro">Cada partida fica guardada neste navegador. Exporte o arquivo para analisar depois.</p>
    <div class="linha-logs"><label for="apelido">Apelido no log</label><input id="apelido" type="text" maxlength="40" value="${esc(ui.nick)}" placeholder="ex.: Sanerion" autocomplete="off">
    <button class="botao" data-act="export">Exportar log (${logCount()} partida${logCount() === 1 ? '' : 's'})</button>
    <button class="botao" data-act="clear-logs" ${logCount() ? '' : 'disabled'}>Apagar logs</button></div></section>`;
}
function gearBtn() { return `<button class="engrenagem" data-act="settings" aria-label="Configurações" title="Configurações">${iconSvg(typeof ART !== 'undefined' ? ART.ui.engrenagem : null) || '⚙'}</button>`; }
/* ===== Guilda: dia, ouro, aventureiros, instalações, defesas e cidade ===== */
const GOLD = { batalha: [8, 12], elite: [20, 25], chefe: [50, 50] };
const GOLD2 = { batalha: [12, 16], elite: [30, 35], chefe: [50, 50] };
const SUCATA = { batalha: [1, 2], elite: [3, 3], chefe: [5, 5] };
const rint = (a, b) => a + Math.floor(rnd() * (b - a + 1));
function goldFor(type) { const T = camp && camp.run && camp.run.floor >= 6 ? GOLD2 : GOLD; const g = T[type] || T.batalha; return rint(g[0], g[1]); }
const ACT_LABEL = { descer: 'Descer', npc: 'Ida à cidade', despachar: 'Despacho', construir: 'Obra' };
const FAC = {
  quadro: { name: 'Quadro de Missões', desc: 'Pedidos de clientes e do governo. Despache aventureiros.' },
  taverna: { name: 'Taverna', desc: 'Onde aventureiros procuram trabalho. Contrate novos membros.' },
  alojamento: { name: 'Alojamento', desc: 'Quartos para os aventureiros. Cada nível abre espaço para mais 2.' },
  treino: { name: 'Área de treinamento', desc: 'Melhorar aventureiros e unidades.', lock: 'Precisa de um instrutor (NPC a definir).' },
  lab: { name: 'Laboratório arcano', desc: 'Melhorar feitiços e outros upgrades mágicos.', lock: 'Precisa de um arcanista (NPC a definir).' },
  ferraria: { name: 'Ferraria', desc: 'Melhorar equipamentos em carta e dos aventureiros.', lock: 'Precisa de um ferreiro (NPC a definir).' },
};
const NOMES = [['Aldo', 'm'], ['Dório', 'm'], ['Elva', 'f'], ['Fausto', 'm'], ['Gilda', 'f'], ['Heitor', 'm'], ['Iara', 'f'], ['Jonas', 'm'], ['Kaila', 'f'], ['Lauro', 'm'], ['Mirela', 'f'], ['Nuno', 'm'], ['Odete', 'f'], ['Pietro', 'm'], ['Quitéria', 'f'], ['Rufino', 'm'], ['Selma', 'f'], ['Tadeu', 'm'], ['Ulla', 'f'], ['Vasco', 'm'], ['Wanda', 'f'], ['Xisto', 'm'], ['Yolanda', 'f'], ['Zé Grilo', 'm'], ['Benedita', 'f'], ['Otávio', 'm'], ['Lúcia', 'f']];
const CLASSES = { guerreiro: { m: 'Guerreiro', f: 'Guerreira', tag: 'escolta' }, batedor: { m: 'Batedor', f: 'Batedora', tag: 'busca' }, mago: { m: 'Mago', f: 'Maga', tag: 'arcano' }, clerigo: { m: 'Clérigo', f: 'Clériga', tag: 'cura' } };
const TAG_NAME = { escolta: 'escolta', busca: 'busca', arcano: 'arcano', cura: 'cura' };
const MISSOES = [
  [1, 'escolta', 'Escoltar um mercador até a vila vizinha'], [1, 'busca', 'Achar o bode fujão do moleiro'], [1, 'cura', 'Levar remédios ao asilo da Rua Baixa'], [1, 'arcano', 'Acender as lamparinas encantadas da praça'],
  [2, 'busca', 'Recuperar um anel perdido no esgoto'], [2, 'escolta', 'Caçar o lobo que ronda as fazendas'], [2, 'arcano', 'Investigar luzes no cemitério'], [2, 'cura', 'Conter a febre na estalagem do porto'],
  [3, 'escolta', 'Proteger a carruagem do coletor de impostos'], [3, 'busca', 'Buscar ervas raras na encosta do vulcão'], [3, 'arcano', 'Fechar um círculo de invocação abandonado'], [3, 'escolta', 'Expulsar bandidos da estrada do norte'],
];
const MESTRES = { temporal: 'Mestre de Temporal Warfare', draconic: 'Mestre de Draconic Primalism', necro: 'Mestre de Necrodance', holy: 'Mestre de Holy Shadowmancy', tech: 'Mestre de Magitech', space: 'Mestre de Space Wizardry' };
const BOOSTER_PRECO = 60, HIRE_BASE = 25, ADV_MAX = 4;
const ALOJ = [60, 120, 200]; /* custo de cada nível do Alojamento; cada nível abre 2 vagas */
const advMax = () => ADV_MAX + 2 * ((camp && camp.fac && camp.fac.alojamento) || 0);
const VENDA = { C: 5, I: 12, R: 30 };
function newAdv(fixed) {
  const used = new Set((camp ? (camp.advs || []).concat(camp.recruits || []) : []).map(a => a.name)); const livres = NOMES.filter(n => !used.has(n[0]));
  const [name, g] = fixed ? [fixed.name, fixed.g] : (livres.length ? livres : NOMES)[Math.floor(rnd() * (livres.length || NOMES.length))];
  const cls = fixed ? fixed.cls : Object.keys(CLASSES)[Math.floor(rnd() * 4)];
  const lvl = fixed ? fixed.lvl : (rnd() < 0.7 ? 1 : 2);
  const a = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, g, cls, lvl, xp: 0, status: 'livre', mission: null, days: 0 };
  if (fixed && fixed.title) a.title = fixed.title;
  return a;
}
const advClass = a => a.title || CLASSES[a.cls][a.g];
function newMission() {
  const [diff, tag, title] = MISSOES[Math.floor(rnd() * MISSOES.length)];
  return { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), diff, tag, title, days: diff, gold: diff * 15 + rint(0, 10), card: diff >= 2 && rnd() < 0.35 };
}
function successChance(a, m) { const match = CLASSES[a.cls].tag === m.tag ? 1 : 0; return Math.max(0.2, Math.min(0.95, 0.6 + 0.15 * (a.lvl + match - m.diff))); }
function ensureGuild() {
  if (!camp) return;
  if (camp.gold === undefined) camp.gold = 0;
  if (!camp.day) camp.day = 1;
  camp.acts = camp.acts || {};
  camp.flags = camp.flags || {};
  camp.advs = camp.advs || [];
  camp.missions = camp.missions || [];
  camp.recruits = camp.recruits || [];
  camp.pending = camp.pending || [];
  camp.quests = camp.quests || [];
  if (camp.cleared && camp.cleared[3] && !camp.debt && !camp.pending.some(p => p.kind === 'credor') && !camp.run) camp.pending.push({ kind: 'credor' });
  camp.fac = camp.fac || { quadro: 'bloq', taverna: 'bloq', treino: 'bloq', lab: 'bloq', ferraria: 'bloq' };
  if (camp.fac.alojamento === undefined) camp.fac.alojamento = 0;
  if (!camp.flags.firstAdv && !camp.pending.some(p => p.kind === 'primeiro-aventureiro') && (camp.history || []).some(h => h.k === 'andar')) camp.pending.push({ kind: 'primeiro-aventureiro' });
  if (camp.defense) registerDefense(camp.defense);
  ensureSocial();
}
function afterRun() {
  if (!camp.flags.firstAdv && !camp.pending.some(p => p.kind === 'primeiro-aventureiro')) camp.pending.push({ kind: 'primeiro-aventureiro' });
}
function refreshBoard() {
  if (camp.fac.quadro === 'ativo') { camp.missions = camp.missions.filter(m => m.taken); while (camp.missions.filter(m => !m.taken).length < 3) camp.missions.push(newMission()); }
  if (camp.fac.taverna === 'ativa') { camp.recruits = []; for (let i = 0; i < 3; i++) camp.recruits.push(newAdv()); }
}
/* Defesas */
const DEF_TEMAS = [
  { leader: 'Enxame do Buraco', text: 'Morcegos famintos sobem pelo alçapão.', pool: { morcego: 6, enxame: 4, ninho: 2, lagarto: 3, besouro: 3 } },
  { leader: 'Ninhada de Aranhas', text: 'Teias aparecem no depósito durante a noite.', pool: { aranha: 6, centopeia: 2, mordida_inf: 3, lagarto: 3, besouro: 3 } },
  { leader: 'Colônia de Fungos', text: 'Algo cresce no porão e não para de crescer.', pool: { broto_cog: 5, toupeira: 3, esporos: 2, fungoide: 2, besouro: 4, mordida_inf: 2 } },
  { leader: 'Bicharada Solta', text: 'Uma porta mal fechada e a bicharada da dungeon invade o salão.', pool: { toupeira: 3, morcego: 3, aranha: 3, enxame: 2, lagarto: 3, besouro: 2, broto_cog: 2 } },
];
/* Humanos com dificuldade variável (P72): a ameaça cresce com os andares concluídos e com o ouro no cofre (riqueza vira risco). */
const DEF_HUMANOS = [
  { id: 'ladroes', leader: 'Vesper, a Ladra-Chefe', text: 'Passos no telhado. Um bando de ladrões ouviu falar do que a guilda traz da dungeon e veio buscar.',
    tiers: [{ h_pivete: 5, h_arrombador: 4, h_vigia: 3, h_fumaca: 2, h_bandido: 2 }, { h_pivete: 3, h_arrombador: 3, h_ladra: 4, h_vigia: 3, h_fumaca: 3, h_facada: 2, h_chaves: 2 }, { h_arrombador: 3, h_ladra: 4, h_vigia: 2, h_fumaca: 3, h_facada: 3, h_chaves: 3, h_bruto: 2 }],
    win: 'A guarda da cidade leva o bando preso e paga o prêmio pela captura', lose: 'Os ladrões fogem pelo telhado com parte do cofre' },
  { id: 'bando', leader: 'Capitão Brega, do Bando da Estrada', text: 'Um bando de salteadores cerca a guilda. Dizem que a estrada agora é deles, e a porta também.',
    tiers: [{ h_bandido: 5, h_pivete: 4, h_vigia: 3, h_besteiro: 2 }, { h_bandido: 4, h_besteiro: 3, h_vigia: 3, h_bruto: 2, h_facada: 2, h_pivete: 2 }, { h_bandido: 3, h_besteiro: 4, h_bruto: 3, h_capitao: 2, h_facada: 2, h_vigia: 2 }],
    win: 'Os salteadores debandam, e a cidade paga o prêmio pela cabeça do bando', lose: 'O bando saqueia o salão antes de ir embora' },
  { id: 'rivais', leader: 'Aventureiros do Grifo Dourado', text: 'Aventureiros da guilda rival invadem o salão para “recuperar” um mapa que juram ser deles. Não é.',
    tiers: [{ h_espadachim: 3, h_bandido: 4, h_clerigo: 2, h_vigia: 3, h_pivete: 3 }, { h_espadachim: 4, h_clerigo: 3, h_rajada: 2, h_vigia: 3, h_besteiro: 3 }, { h_espadachim: 4, h_clerigo: 3, h_rajada: 3, h_bruto: 2, h_besteiro: 2, h_campeao: 2 }],
    win: 'Os rivais saem com o orgulho ferido, e a cidade multa a guilda deles em seu favor', lose: 'Os rivais levam o mapa e um bom pedaço da sua reputação' },
];
const TIER = [{ nome: 'Fácil', hp: 12, gold: [15, 25], multa: 15 }, { nome: 'Média', hp: 18, gold: [25, 40], multa: 25 }, { nome: 'Difícil', hp: 24, gold: [40, 60], multa: 35 }];
function threatTier() {
  const score = Object.keys(camp.cleared).length + Math.floor((camp.gold || 0) / 100);
  let t = score <= 1 ? 0 : score <= 3 ? 1 : 2;
  const r = rnd(); if (r < 0.2) t = Math.max(0, t - 1); else if (r > 0.8) t = Math.min(2, t + 1);
  return t;
}
function newHumanDefense() {
  const h = DEF_HUMANOS[Math.floor(rnd() * DEF_HUMANOS.length)]; const t = threatTier(); const T = TIER[t];
  const deck = {}; Object.entries(h.tiers[t]).forEach(([id, n]) => { deck[id] = Math.max(1, n + rint(-1, 1)); });
  return { human: h.id, tier: t, tierName: T.nome, leader: h.leader, text: h.text, hp: T.hp + rint(-1, 2), deck, gold: rint(T.gold[0], T.gold[1]), multa: T.multa, winText: h.win, loseText: h.lose };
}
function newDefense() {
  if (rnd() < 0.5) return newHumanDefense();
  const t = DEF_TEMAS[Math.floor(rnd() * DEF_TEMAS.length)];
  const deck = {}; const ids = Object.keys(t.pool);
  ids.forEach(id => { deck[id] = Math.max(1, t.pool[id] + rint(-1, 1)); });
  const prog = Object.keys(camp.cleared).length;
  return { leader: t.leader, text: t.text, hp: 10 + prog * 2 + rint(0, 3), deck, gold: rint(15, 25), multa: 20 };
}
const DEF_SOCIAIS = [
  { enc: 'golpista', text: 'Um sujeito de sorriso largo bate à porta oferecendo um “seguro contra dragões” para a guilda, com assinatura hoje mesmo.' },
  { enc: 'protecao', text: 'Dois capangas e um homem de luvas entram sem bater. A rua é perigosa, ele diz, e a proteção dele é a melhor que o seu ouro pode comprar.' },
  { enc: 'rival', text: 'O representante do Grifo Dourado, uma guilda rival, aparece para “avaliar a concorrência” e convencer seus clientes a mudar de casa.' },
];
function newSocialDefense() { const t = DEF_SOCIAIS[Math.floor(rnd() * DEF_SOCIAIS.length)]; const e = E.ENC[t.enc]; return { social: true, enc: t.enc, leader: e.leader, text: t.text, gold: rint(15, 25), multa: 20 }; }
function registerDefense(spec) { if (spec.social) return; E.ENC.defesa = { name: 'Defesa: ' + spec.leader, tier: 'Defesa', leader: spec.leader, hp: spec.hp, hand: 3, rule: 'Invasores na guilda.', deck: spec.deck }; }
function startDefense() {
  const spec = camp.defense; registerDefense(spec);
  st = E.newGame(camp.deck.disc, 'defesa', null, { deck: R.deckList(camp.deck) });
  st.gameId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  st.ctx = { mode: 'defesa', camp: camp.id, day: camp.day, leader: spec.leader, hpStart: 30 };
  saveCamp();
  ui.screen = 'battle'; ui.mode = null; ui.info = null; ui.modal = null; ui.busy = false; ui.overClosed = false; render(); window.scrollTo(0, 0);
}
function defenseDone() {
  const won = st.over === 'P'; const spec = camp.defense; st = null;
  let txt, delta;
  if (won) { delta = spec.gold; camp.gold += delta; txt = spec.winText ? `${spec.winText}: +${delta} de ouro.` : `A guilda está a salvo. Os vizinhos agradecem com uma vaquinha: +${delta} de ouro.`; }
  else { const m = Math.min(camp.gold, spec.multa); delta = -m; camp.gold -= m; txt = spec.loseText ? `${spec.loseText}: ${m} de ouro a menos.` : `Os invasores fazem estrago antes de fugir. Conserto e multa da guarda: ${m} de ouro.`; }
  hist({ k: 'defesa', leader: spec.leader, human: spec.human, tier: spec.tier, won, gold: delta });
  camp.defense = null; camp.pending = camp.pending.filter(p => p.kind !== 'defesa');
  saveCamp();
  ui.scene = { kind: 'msg', title: won ? 'Defesa bem-sucedida' : 'A guilda foi saqueada', text: txt }; ui.screen = 'scene'; render(); window.scrollTo(0, 0);
}
/* Fim do dia */
function finishBuilding(lines) {
  if (camp.building) {
    const b = camp.building;
    if (b.id === 'alojamento') { camp.fac.alojamento = b.level; lines.push(`O alojamento ganhou mais quartos (nível ${b.level}). Agora cabem ${advMax()} aventureiros na guilda.`); hist({ k: 'obra', id: 'alojamento', level: b.level }); }
    if (b.id === 'taverna') { camp.fac.taverna = 'ativa'; lines.push('A taverna está limpa e aberta de novo. Já tem gente procurando trabalho.'); hist({ k: 'obra', id: 'taverna' }); }
    camp.building = null;
  }
}
function processAdvs(lines) {
  camp.advs.forEach(a => {
    if (a.status === 'ferido') { a.days -= 1; if (a.days <= 0) { a.status = 'livre'; lines.push(`${a.name} se recuperou e está ${a.g === 'f' ? 'pronta' : 'pronto'} para outra.`); } }
    else if (a.status === 'missao') {
      a.days -= 1;
      if (a.days <= 0) {
        const m = camp.missions.find(x => x.id === a.mission);
        const ok = m && rnd() < successChance(a, m);
        if (m && ok) {
          camp.gold += m.gold; let extra = '';
          if (m.card) { const c = R.treasureCard(rnd, camp.deck.disc); addCards([c]); extra = ` e trouxe a carta ${E.DEF[c].name}`; }
          a.xp += 1; let up = '';
          if (a.xp >= a.lvl * 2 && a.lvl < 5) { a.lvl += 1; a.xp = 0; up = ` ${a.name} subiu para o nível ${a.lvl}.`; }
          lines.push(`${a.name} concluiu “${m.title}”: +${m.gold} de ouro${extra}.${up}`);
          hist({ k: 'missao', adv: a.name, title: m.title, ok: true, gold: m.gold });
          a.status = 'livre';
        } else {
          lines.push(`${a.name} falhou em “${m ? m.title : 'uma missão'}” e volta sem nada. Precisa de 1 dia para se recuperar.`);
          hist({ k: 'missao', adv: a.name, title: m ? m.title : '', ok: false });
          a.status = 'ferido'; a.days = 1;
        }
        a.mission = null;
        if (m) camp.missions = camp.missions.filter(x => x.id !== m.id);
      }
    }
  });
}
function endDay() {
  const lines = [];
  finishBuilding(lines); processAdvs(lines);
  camp.day += 1; camp.acts = {}; camp.cityTrip = null;
  if (debtOpen() && camp.day > camp.debt.due && !camp.pending.some(p => p.kind === 'credor')) { camp.debt.amount = Math.round(camp.debt.amount * 1.1); camp.debt.overdue = (camp.debt.overdue || 0) + 1; camp.pending.push({ kind: 'credor', volta: true }); lines.push(`O prazo da parcela venceu. Com juros, ela passou para ${camp.debt.amount} de ouro, e o Barão vai aparecer.`); hist({ k: 'parcela-vencida', amount: camp.debt.amount }); }
  refreshBoard();
  if (!camp.defense && camp.day >= 3 && rnd() < 0.2) { camp.defense = camp.flags.socialTut && rnd() < 0.5 ? newSocialDefense() : newDefense(); camp.pending.push({ kind: 'defesa' }); hist({ k: 'defesa-aviso', leader: camp.defense.leader, social: !!camp.defense.social }); }
  hist({ k: 'dia', day: camp.day });
  saveCamp();
  ui.scene = { kind: 'dia', lines }; ui.screen = 'scene'; render(); window.scrollTo(0, 0);
}
/* Telas da guilda */
function guildStatus() {
  const a = camp.acts;
  return `<div class="dia-acoes"><span class="linha">Ações de hoje:</span>${Object.entries(ACT_LABEL).map(([k, l]) => `<span class="acao ${a[k] ? 'usada' : ''}" title="${a[k] ? 'Já feito hoje' : 'Disponível hoje'}">${esc(l)}${a[k] ? ': feito' : ''}</span>`).join('')}</div>`;
}
function pendingScene() {
  const p = camp.pending[0]; if (!p) return null;
  if (p.kind === 'primeiro-aventureiro') return { kind: 'primeiro-aventureiro' };
  if (p.kind === 'sugestao-taverna') return { kind: 'sugestao-taverna' };
  if (p.kind === 'cliente-tutorial') return { kind: 'cliente-tutorial' };
  if (p.kind === 'credor') return { kind: 'credor', volta: !!p.volta, segunda: !!p.segunda };
  if (p.kind === 'felix-divida' && debtOpen()) return { kind: 'felix-divida' };
  if (p.kind === 'defesa' && camp.defense) return { kind: 'defesa' };
  camp.pending.shift(); saveCamp(); return pendingScene();
}
function guildScene(sc) {
  if (sc.kind === 'cliente-tutorial') return socialTutScene();
  if (sc.kind === 'credor') return credorScene(sc);
  if (sc.kind === 'credor-res') return credorResScene(sc);
  if (sc.kind === 'banca') return bancaScene(sc);
  if (sc.kind === 'run-msg') return `<h2>${esc(sc.title)}</h2><p>${esc(sc.text)}</p><div class="opcoes"><button class="botao principal" data-act="${sc.back === 'banca' ? 'g-banca-back' : 'scene-ok'}">Continuar</button></div>`;
  if (sc.kind === 'felix-divida') return felixDebtScene();
  if (sc.kind === 'passeio') return passeioScene(sc);
  if (sc.kind === 'primeiro-aventureiro') {
    return `${felixArt('guilda')}<h2>Alguém bate à porta</h2><p>Você mal tirou a poeira da dungeon das botas quando a porta da guilda range. É Brisa, uma batedora de mochila remendada e olhar curioso.</p><div class="fala"><span class="quem">Brisa</span><p>Ouvi dizer que o Dragão Amarelo voltou a descer. Se a guilda está aberta, eu quero trabalho. Sei achar coisas e sei voltar inteira. Na maioria das vezes.</p></div><div class="fala"><span class="quem">Felix</span><p>Ela fala demais, mas aceita pagamento atrasado. Contrata.</p></div><p class="intro-dica">Aventureiros não lutam com você: eles cumprem missões de clientes e do governo pelo Quadro de Missões e trazem ouro. Personagem provisória: o primeiro aventureiro ainda vai ser definido.</p><div class="opcoes"><button class="botao principal" data-act="g-hire-first">Contratar Brisa</button></div>`;
  }
  if (sc.kind === 'sugestao-taverna') {
    return `${felixArt('guilda')}<h2>Uma ideia do Felix</h2><div class="fala"><span class="quem">Felix</span><p>Uma aventureira não faz uma guilda. Nos fundos tem a velha taverna, onde o Ergos recebia gente de toda parte. Se alguém tirasse as teias, os aventureiros voltariam a aparecer.</p><p>Alguém. Não eu. Eu tenho asas, não vassoura.</p></div><p class="intro-dica">O menu de Instalações está liberado. Fazer faxina na taverna custa só o dia de trabalho de obra.</p><div class="opcoes"><button class="botao principal" data-act="g-ok-taverna">Abrir as Instalações</button><button class="botao" data-act="g-ok-pend">Depois</button></div>`;
  }
  if (sc.kind === 'defesa' && camp.defense && camp.defense.social) {
    const d = camp.defense; const e = E.ENC[d.enc];
    return `<h2>Visita indesejada</h2><p>${esc(d.text)}</p><p>${esc(e.leader)}, Perfil ${esc(e.perfil)}, ${e.hp} de Resistência.</p><p class="intro-dica">Defesas não gastam ações do dia. Vitória: +${d.gold} de ouro. Derrota: sem recompensa e até ${d.multa} de ouro de prejuízo.</p><div class="opcoes"><button class="botao principal" data-act="g-defend-social">${bi('social')}Negociar</button></div>`;
  }
  if (sc.kind === 'defesa') {
    const d = camp.defense;
    return `<h2>Invasão na guilda!</h2><p>${esc(d.text)} À frente deles, ${esc(d.leader)} (${d.hp} de Vida).</p>${d.tierName ? `<p class="ameaca t${d.tier}">Ameaça: ${esc(d.tierName)}</p>` : ''}<p class="intro-dica">Defesas não gastam ações do dia.${d.human ? ' A ameaça cresce com os andares concluídos e com o ouro guardado no cofre.' : ''} Vitória: +${d.gold} de ouro. Derrota: sem recompensa e até ${d.multa} de ouro de prejuízo.</p><div class="opcoes"><button class="botao principal" data-act="g-defend">Defender a guilda</button></div>`;
  }
  if (sc.kind === 'dia') {
    return `<h2>Dia ${camp.day}</h2>${sc.lines.length ? sc.lines.map(l => `<p>${esc(l)}</p>`).join('') : '<p>Um dia tranquilo na guilda.</p>'}<div class="opcoes"><button class="botao principal" data-act="home">Continuar</button></div>`;
  }
  return null;
}
function renderQuadro() {
  const livres = camp.advs.filter(a => a.status === 'livre');
  const advRow = a => `<li class="adv"><b>${esc(a.name)}</b> <span class="linha">${esc(advClass(a))}, nível ${a.lvl}</span> <span class="estado-adv">${a.status === 'livre' ? 'Disponível' : a.status === 'missao' ? `Em missão (${a.days} dia${a.days === 1 ? '' : 's'})` : 'Se recuperando'}</span></li>`;
  const mis = camp.missions.filter(m => !m.taken).map(m => {
    const opts = livres.slice().sort((x, y) => successChance(y, m) - successChance(x, m)).map(a => `<option value="${a.id}">${esc(a.name)} (${esc(advClass(a))} ${a.lvl}): ${Math.round(successChance(a, m) * 100)}%</option>`).join('');
    return `<li class="missao"><div><b>${esc(m.title)}</b><p class="linha">Dificuldade ${m.diff} · ${m.days} dia${m.days === 1 ? '' : 's'} · ${esc(TAG_NAME[m.tag])} · ${m.gold} de ouro${m.card ? ' + uma carta' : ''}</p></div>
      <div class="missao-acao">${livres.length ? `<label class="sr" for="m-${m.id}">Aventureiro</label><select id="m-${m.id}">${opts}</select><button class="botao" data-act="g-dispatch" data-mid="${m.id}">Despachar</button>` : '<span class="linha">Ninguém disponível</span>'}</div></li>`;
  }).join('');
  $('#app').innerHTML = `${gearBtn()}<header class="abertura"><h1>Quadro de Missões</h1><p class="sub">Dia ${camp.day} · ${camp.gold} de ouro</p></header>
  <section class="cena larga guilda-tela">
    <h2>Pedidos</h2><ul class="lista-missoes">${mis || '<li class="vazio">Nenhum pedido novo. Volte amanhã.</li>'}</ul>
    <p class="intro-dica">A chance de sucesso cresce com o nível e quando a especialidade bate com o pedido (Guerreiro: escolta, Batedor: busca, Mago: arcano, Clérigo: cura). Falha: volta sem nada e passa 1 dia se recuperando.</p>
    <h2>Aventureiros (${camp.advs.length}/${advMax()})</h2><ul class="lista-adv">${camp.advs.map(advRow).join('')}</ul>
    <div class="linha-logs"><button class="botao principal" data-act="home">Voltar à guilda</button></div>
  </section>`;
}
function renderInstalacoes() {
  const row = (id) => {
    const f = FAC[id]; const s = camp.fac[id];
    let act = '';
    if (id === 'taverna' && s === 'suja') act = camp.building ? '<span class="linha">Faxina em andamento: fica pronta ao fim do dia.</span>' : `<button class="botao" data-act="g-build-taverna" ${camp.acts.construir ? 'disabled' : ''}>Fazer faxina na taverna (1 dia de trabalho)</button>`;
    else if (id === 'taverna' && s === 'ativa') act = '<button class="botao" data-act="g-taverna">Entrar</button>';
    else if (id === 'quadro' && s === 'ativo') act = '<button class="botao" data-act="g-quadro">Abrir</button>';
    else if (id === 'alojamento') {
      const lvl = s || 0; const cost = ALOJ[lvl];
      if (camp.building && camp.building.id === 'alojamento') act = '<span class="linha">Obra em andamento: fica pronta ao fim do dia.</span>';
      else if (camp.fac.taverna !== 'ativa') act = '<span class="linha">Precisa da Taverna aberta.</span>';
      else if (cost === undefined) act = '<span class="linha">Todos os quartos construídos.</span>';
      else act = `<button class="botao" data-act="g-build-aloj" ${camp.acts.construir || camp.building || camp.gold < cost ? 'disabled' : ''}>${lvl ? 'Ampliar' : 'Construir'} (nível ${lvl + 1}): ${cost} de ouro e 1 dia de trabalho</button>`;
      return `<li class="instalacao ${lvl ? 'ativo' : 'bloq'}"><div><b>${esc(f.name)}</b> <span class="selo-fac">${lvl ? `Nível ${lvl}` : 'Não construído'}</span><p class="linha">${esc(f.desc)} Hoje cabem ${advMax()} aventureiros${cost !== undefined ? `; o próximo nível leva a ${advMax() + 2}` : ''}.</p></div><div>${act}</div></li>`;
    }
    else if (f.lock) act = `<span class="linha">${esc(f.lock)}</span>`;
    const estado = { ativo: 'Ativo', ativa: 'Ativa', suja: 'Abandonada', bloq: 'Bloqueada' }[s] || s;
    return `<li class="instalacao ${s}"><div><b>${esc(f.name)}</b> <span class="selo-fac">${estado}</span><p class="linha">${esc(f.desc)}</p></div><div>${act}</div></li>`;
  };
  $('#app').innerHTML = `${gearBtn()}<header class="abertura"><h1>Instalações</h1><p class="sub">Dia ${camp.day} · ${camp.gold} de ouro · ${camp.acts.construir ? 'obra de hoje já feita' : 'obra de hoje disponível'}</p></header>
  <section class="cena larga guilda-tela"><ul class="lista-fac">${['quadro', 'taverna', 'alojamento', 'treino', 'lab', 'ferraria'].map(row).join('')}</ul>
  <div class="linha-logs"><button class="botao principal" data-act="home">Voltar à guilda</button></div></section>`;
}
function renderTaverna() {
  const full = camp.advs.length >= advMax();
  const cards = camp.recruits.map((a, i) => { const price = HIRE_BASE + 15 * (a.lvl - 1); return `<li class="adv"><b>${esc(a.name)}</b> <span class="linha">${esc(advClass(a))}, nível ${a.lvl}</span><button class="botao" data-act="g-hire" data-idx="${i}" ${full || camp.gold < price ? 'disabled' : ''}>Contratar (${price} de ouro)</button></li>`; }).join('');
  $('#app').innerHTML = `${gearBtn()}<header class="abertura"><h1>Taverna</h1><p class="sub">Dia ${camp.day} · ${camp.gold} de ouro</p></header>
  <section class="cena larga guilda-tela"><p>O cheiro de cerveja velha voltou, o que Felix considera progresso. Hoje, procurando trabalho:</p>
  <ul class="lista-adv">${cards || '<li class="vazio">Ninguém hoje. Volte amanhã.</li>'}</ul>
  <p class="intro-dica">${full ? `A guilda está cheia (${advMax()} aventureiros). O Alojamento, nas Instalações, abre mais vagas.` : 'Os candidatos mudam a cada dia.'} Aventureiros gerados ao acaso, provisórios. No jogo final, contratar envolve batalha social.</p>
  <div class="linha-logs"><button class="botao principal" data-act="home">Voltar à guilda</button></div></section>`;
}
/* Mestres das Disciplinas: retrato, apresentação e diálogo */
const MESTRE_INFO = {
  tech: { name: 'Chrome', title: 'mestra do Magitech', img: 'chrome', pos: '72% 40%', face: '64% 18%',
    place: 'A vitrine da ACT, Magitech & Enchanted Innovations, pisca em roxo: engrenagens, frascos e um autômato que acena sozinho. Na porta, uma mulher de armadura e vestido, cajado de engrenagem na mão, mede você de cima a baixo com um sorriso de quem já calculou o seu preço.',
    greet: 'Isso é um baralho mágico no seu bolso ou está feliz em me ver?',
    indica: { reply: ['Eu adoraria fazer reconhecimento na sua fonte de renda. Aqui, leve esse autômato de graça!'], adv: { name: '9S', g: 'm', cls: 'mago', lvl: 1, title: 'Autômato arcano', quote: 'Obrigado pela oportunidade de emprego. Você não irá se arrepender.' } },
    opts: [
      { id: 'a', label: 'Que? Como assim?', reply: ['O seu bolso está emitindo três frequências arcanas diferentes. Eu só juntei dois com dois. Lógica simples.', 'Ninguém passa pela porta da ACT com uma assinatura mágica dessas sem eu notar. Se quiser saber o que ele faz de verdade, pergunte. A primeira consulta é por conta da casa. A segunda a gente negocia.'] },
      { id: 'b', label: 'Estou feliz em te ver 😏', reply: ['Ah, finalmente alguém com iniciativa. Gostei.', 'Vamos ver se você tem a mesma iniciativa para os negócios. Tudo que você vê aqui é Magitech da mais alta qualidade, certamente investir em equipamento de qualidade é mais atraente que meu rostinho lindo, não?'] },
      { id: 'c', label: 'Você conhece esse baralho mágico? O que pode me dizer sobre ele?', reply: ['Conheço o tipo. Cartas que guardam uma Disciplina inteira, presas ao sangue de quem carrega. Engenharia linda, aliás. Quem fez isso sabia o que estava fazendo.', 'A minha linha é o Magitech: construtos, módulos que você acopla e recupera, armadilhas que funcionam toda vez. Ao contrário de rezar.', 'Eu vendo pacotes da linha. Preço justo. Se lembrar de falar por favor e obrigado, mais justo ainda.'] },
      { id: 'e', after: ['a', 'b', 'c'], laterDay: true, label: 'Você conhecia Ergos?', reply: ['Sim, o antigo dono da Dragão Amarelo. Desapareceu me devendo uma engrenagem mágica, acredita? Espero que ele esteja bem. Era um Cartomante como você.'] },
      { id: 'f', requires: 'e', label: 'Ele é meu tio, eu herdei a guilda dele, junto com as dívidas.', reply: ['Oh. Entendi agora, você é do sangue dele. Significa que você vai achar aquela engrenagem pra mim?'], quest: { id: 'engrenagem', title: 'A engrenagem da Chrome', desc: 'Achar a engrenagem mágica que Ergos ficou devendo à Chrome.' } },
      { id: 'h', needFlag: 'engrenagem', notFlag: 'engrenagemEntregue', label: 'Achei a sua engrenagem mágica!', reply: ['>Chrome segura a engrenagem contra a luz, e os olhos dela brilham no mesmo roxo.', 'Ora, ora. Pontual como um Ergos nunca foi. Sabe o que isso é? O núcleo do meu primeiro autômato. Achei que nunca mais ia ver.', 'Dívida quitada, e com juros: tome 100 de ouro. E, de hoje em diante, você é cliente preferencial da ACT.'], questDone: 'engrenagem', gold: 100 },
      { id: 'g', label: 'Posso pagar depois?', reply: ['Poderia, com juros, mas você tem nome sujo no CERASA. Limpa teu nome antes de sair colecionando credores.'] },
      { id: 'd', requires: 'a', label: 'Quero minha consulta grátis', reply: ['Quem está sintonizado com um baralho como esse e sabe usá-lo é chamado de Cartomante. A comunidade mágica ainda discute se a Cartomancia é ou não uma Disciplina, mas, sinceramente, esses detalhes pouco me importam. O que importa é que um Cartomante pode usar as propriedades do baralho como alavanca para manifestar poderes mágicos com facilidade, e até se sintonizar com uma Disciplina. Eu recomendaria a Magitech, a melhor de todas, obviamente. Há registros de Cartomantes que dominaram mais de uma Disciplina no passado, mas nada que possamos confirmar. Cartomantes já são raros por natureza; os excepcionais são ainda mais raros, e por isso mesmo difíceis de documentar.', 'Por enquanto, foque em equilibrar os custos das cartas para não perder um turno sem fazer nada, depois pense em fazer uma sinergia em suas cartas. Não tenha medo de experimentar cartas diferentes e veja o que funciona melhor.'] },
    ] },
  holy: { name: "Gun'Liao", title: 'mestre do Holy Shadowmancy', img: 'gunliao', pos: '45% 35%', face: '46% 20%',
    place: 'No terraço da catedral, entre gárgulas e vitrais de anjos, um homem de escamas no rosto e olhos amarelos segura um cajado de serpente alada. Ele sorri antes de você chegar perto, como se já esperasse a visita.',
    greet: 'Saudações, cordeiro perdido. Interessado em aprender sobre os deuses e em que moeda eles negociam?',
    greet2: 'Luz e Liturgia. Sombra e Sangue. Sê bem-vinda de volta ao teu lar, alma {fato}.',
    facts: ['teimosa', 'curiosa', 'faminta'],
    indica: { reply: ['Tsubaki.'], narra: 'Uma ninja aparece como se estivesse ali desde sempre.', adv: { name: 'Tsubaki', g: 'f', cls: 'batedor', lvl: 1, title: 'Batedora ninja' } },
    opts: [
      { id: 'a', label: 'Me ensine, mestre.', reply: ['Primeira lição: os deuses não são generosos. São justos. Cobram em fervor, em sacrifício, às vezes em silêncio. Pague o preço certo e até o céu assina contrato com você.', 'Segunda lição: Se alguém precisa pagar o preço em sangue, é melhor que seja um monstro, não acha? Há monstros no mundo todo, esperando para derramar o seu. Não permita.'] },
      { id: 'b', label: 'Você também ensina sobre o que habita as sombras? Achei que clérigos eram do bem!', reply: ['E somos. A luz precisa de quem caminhe onde ela não alcança.', 'Um monstro abatido em silêncio é uma oração surda, tão boa quanto uma peregrinação. Os deuses aceitam as duas, cordeiro. E só um de nós precisa se sentir culpado. Deixe que eu absolvo toda sua culpa.'] },
      { id: 'c', label: 'Estou mais interessado nas artes sombrias.', reply: ['Honestidade. Que raro. Que refrescante.', 'As sombras são o lugar que protege e conforta os de fé enquanto eles esperam a hora certa. Emboscar, Revelar, Sacrificar. Chame de arte sombria se preferir. Eu, pessoalmente, chamo de liturgia com bom timing.'] },
      { id: 'd', label: 'Quais deuses você serve?', reply: ['Depende de que deus eu preciso no momento. Eu gosto do Pelor, o Sol Invicto, quando preciso dispensar justiça e destruir o mal. Susanoo é uma força imparável, muito útil. E é claro, minha favorita, a Serpente Omissa, Serpe da sombra e do tempo. Posso te ensinar sobre eles.'] },
      { id: 'e', label: 'O que acontece com quem não paga?', reply: ['>Ele sorri da sua inocência.', 'Sempre paga, de um jeito ou de outro.'] },
      { id: 'f', label: 'As escamas no seu rosto...', reply: ['É a bênção da Serpente Omissa. Seu poder e seu aspecto permeiam minha forma.'] },
      { id: 'g', needBoss: true, label: 'Eu ofereci o Basilisco aos deuses', reply: ['Eu sei. Bom trabalho.'] },
    ] },
  necro: { name: 'Charles Goodwich', title: 'o bom lich, mestre da Necrodança', img: 'goodwich', pos: '45% 30%', face: '47% 14%',
    place: 'As últimas notas ainda ecoam pela lona do Necro-Circus. A plateia pula no compasso, um-dois-três, um-dois-três, enquanto esqueletos de chapéu de plumas fecham o refrão com violino, alaúde e tambor, e cães e gatos espectrais correm pelo palco. É impossível não balançar a cabeça. Quando a música para, o vocalista desce, um lich de cabelo prateado com uma guitarra que ainda solta faíscas azuis, e acena para você.',
    greet: 'Saudações! Curtiu o show? Quer um autógrafo?',
    greet2: 'Bem-vindo novamente, guerreiro cartomante. Como posso ajudá-lo hoje?',
    indica: { reply: ['Eu tenho um amigo que quer viajar mais pelo mundo. Ele era muito tímido em vida, ele disse!'], adv: { name: 'Matador', g: 'm', cls: 'batedor', lvl: 1, title: 'Esqueleto batedor', quote: 'Buenos días, fuckboy.' } },
    opts: [
      { id: 'a', label: 'Sim, por favor!', once: 'autografo', reply: ['>Ele rabisca o seu ingresso com um floreio e um sorriso de caveira: «Para {nome}, que tem ritmo. Charles G.»', 'Guarda bem. Daqui a uns trezentos anos isso vale uma fortuna. Confia, eu já vi acontecer.'] },
      { id: 'b', label: 'Ótimo show! Está contratando?', reply: ['Valeu! Quem sabe no dia do seu funeral, mas a gente valoriza quem saiba contar até três. Trate de aprender até lá, se ainda estiver interessado!', 'Necrodança é isso: o Compasso. Um, dois, três, e volta. A carta certa no tempo certo e a música faz o resto. Eu dou aula, se quiser. Não precisa morrer antes, juro.'] },
      { id: 'c', label: 'Sabe, eu sou tipo um necrodançarino também, mas meu palco é uma masmorra mágica.', reply: ['Turnê subterrânea! Respeito demais.', 'Eu passei minha vida estudando e aprendendo todos os segredos da magia para conquistar todas as masmorras e acumular poder, mas no fim nada supera o poder de um bom refrão e um sorriso no rosto. Se a sua masmorra tiver eco, sorte sua. Acústica de caverna é outra coisa.'] },
      { id: 'm', label: 'Qual música você tocou hoje?', rot: ['Valsa para Ossos Cansados', 'Três por Quatro por Toda a Eternidade', 'Meu Coração Parou (Mas o Ritmo Não)', 'Morto de Saudade', 'Osso Duro de Roer', 'Sem Pulso, Mas com Swing', 'Até que a Morte nos Junte', 'Cova Rasa, Coração Fundo', 'Réquiem pra Quem Requebra', 'Esqueleto no Armário (Versão Acústica)'], reply: ['Hoje foi “{rot}”. Um clássico do repertório!'] },
      { id: 'n', label: 'Os bichinhos espectrais são seus?', reply: ['São meus pequenos amigos. Eu cuido deles, e as crianças do circo adoram!'] },
      { id: 'q', reqOther: { npc: 'mestre-temporal', opt: 'p3' }, label: 'Como é Macabra? Imagino que seja um lugar macabro.', reply: ['Não sei onde você ouviu esse nome, mas posso te contar um pouco. Macabra é um lugar brutal, tomado por uma grande guerra eterna. Os nativos têm outro nome para o planeta: Calmera. Acreditamos que o mundo já foi mais pacífico, por causa desse nome.', 'Mas os seres Sintrópicos lutam bravamente contra os Entrópicos todos os dias. A guerra ficou tão extrema que os viajantes que vão para lá voltam horrorizados; por isso a chamam de Macabra.', 'Eu? Lutei na linha de frente como um campeão dos Sintrópicos, é claro! Sou um lich diferente.'] },
      { id: 'r', requires: 'q', label: 'Eu achei que liches eram malignos e comiam almas, mas você parece um cara legal.', reply: ['Isso se deve ao magnífico Método Goodwich de Lichdom Ético. Essencialmente, eu sou um lich vegano.', 'Com uma magia sofisticada, eu transmuto objetos inanimados, geralmente rochas, em Ephemera energizado, a matéria dos espíritos, e como isso. Assim, minha mente e minha alma nunca se corrompem pela Entropia.', 'Talvez eu possa te ensinar um dia. Me procure caso você se torne um arquimago.'] },
      { id: 'o', label: 'Por que um lich trocou a magia arcana pela música?', reply: ['>A guitarra fica em silêncio por um instante.', 'Passei séculos tentando não morrer. Um dia percebi que nunca tinha vivido.'] },
    ] },
  temporal: { name: 'Mikeus', title: 'mestre de Temporal Warfare', img: 'mikeus', pos: '48% 30%', face: '50% 12%',
    place: 'No pátio de um dojo, sob nuvens que parecem passar rápido demais, um guerreiro de armadura vermelha e gasta segura um elmo debaixo do braço. A lança dele brilha com runas que você não reconhece, e ele olha para você como quem reencontra um velho conhecido.',
    greet: 'Você. Nós lutaremos juntos no futuro. É melhor começarmos a treinar agora.',
    greet2: 'Chegou bem na hora do treinamento. Vamos.',
    indica: { reply: ['E eu tenho uma aluna verde que poderia ter mais experiência. Katya, venha cá.'], adv: { name: 'Katya', g: 'f', cls: 'guerreiro', lvl: 1, title: 'Guerreira temporal', quote: 'Finalmente! Pode deixar comigo, chefe. Qualquer missão, a qualquer hora. Duas de uma vez, se precisar!' } },
    opts: [
      { id: 'a', label: 'Nós seremos amigos?', reply: ['>Ele fica em silêncio por um tempo longo.', 'Você vai salvar a minha vida duas vezes. Eu vou salvar a sua três. E você vai dizer que eu estou contando errado. Tire suas conclusões.'] },
      { id: 'b', label: 'O que vai acontecer no futuro?', reply: ['Não. Cada palavra que eu digo sobre aquilo muda alguma coisa, e eu já vi o que acontece quando muda demais.', 'Treine. É a única resposta que não cria paradoxo.'] },
      { id: 'c', label: 'Você realmente vê o futuro?', reply: ['Não vejo. Eu lembro. Lutei em guerras que ainda não começaram e em outras que vocês já esqueceram.', 'Eu sou ambos um aprendiz e o fundador da disciplina do Temporal Warfare, então escute quando digo: Golpeie antes, volte depois. A vitória geralmente pertence a quem percebe o confronto antes.'] },
      { id: 'd', label: 'Melhor começar logo então, se você não tem tempo a perder, eu tenho menos ainda.', reply: ['>Mikeus aponta a lança para o dojo e, pela primeira vez, quase sorri.', 'Boa resposta. Foi a mesma que você me deu da outra vez.'] },
      { id: 'p1', requires: 'c', met: 'mestre-tech', label: 'Pode me contar sobre a Chrome?', reply: ['Ela vai ficar famosa por fazer armaduras eficientes e estilosas.'] },
      { id: 'p2', requires: 'c', met: 'mestre-holy', label: "Pode me contar sobre o Gun'Liao?", reply: ['Ele lutou guerras de que ninguém sabe e tem um destino glorioso e sombrio.'] },
      { id: 'p3', requires: 'c', met: 'mestre-necro', label: 'Pode me contar sobre o Charles?', reply: ['Ele vai permanecer. Seus dias de batalha e glória ficaram nas terras de Macabra, sua nação natal.'] },
      { id: 'p5', requires: 'c', met: 'mestre-space', label: 'Pode me contar sobre o Yaven?', reply: ['Nenhum segredo vai se esconder de seus olhos curiosos.'] },
      { id: 'p6', requires: 'c', met: 'mestre-draconic', label: 'Pode me contar sobre o Ko?', reply: ['Também conhecido como O Vagante, ele vai continuar acumulando poder e vai ser endeusado em muitos planetas que visitar. Eu e ele lutaremos muitas vezes ao longo das eras, e assim cultivaremos nossa força.'] },
      { id: 'p4', requires: 'c', label: 'Pode me contar sobre você?', reply: ['Eu era um rapaz comum de um planeta chamado Terra, mas fui acidentalmente transportado para um mundo cheio de perigos. Por sorte, eu descobri os poderes da cronomancia.', 'Eu sei o que você está pensando. Não sei o que é “isekai” e não tive um harém. Por favor, não pergunte...'] },
    ] },
  draconic: { name: 'Ko', title: 'mestre de Draconic Primalism', img: 'ko', pos: '50% 50%', face: '50% 9%',
    place: 'No bosque antigo, nos limites da cidade, a luz das estrelas atravessa as copas como se o céu tivesse descido para ver. Um grifo observa de um galho, e uma fera feita de luz estelar ronda as raízes. No meio da clareira, um ser dracônico de asas cheias de constelações espera de braços soltos. É Ko, viajante das estrelas, e ele olha para você como quem mede a força de alguém só de ver.',
    greet: 'Hmm... Uma certa força de espírito. Mas ainda há muito espaço para crescer. O que você busca por aqui?',
    greet2: 'Você voltou. Sinto que a sua força cresceu um pouco. Ótimo. Vamos ver até onde ela vai.',
    indica: { reply: ['Tem alguém que me segue há dias pedindo para treinar comigo. Leve para a sua guilda. Trabalho também é treino.'], adv: null },
    opts: [
      { id: 'a', label: 'Eu busco a força para destruir meus inimigos', reply: ['Destruir? Hmm. Força que só serve para destruir acaba junto com o último inimigo.', 'Inimigos fortes são presentes. Não destrua todos: cultive rivais naqueles que lutam com bravura. Não faça como eu, ou acabará sozinho no topo.', 'A força primal cresce como uma árvore. Uma raiz firme primeiro, depois um tronco robusto, depois uma explosão de folhas e frutos de poder. Na Draconic Primalism você acumula Cristais de Mana, um a um, até a hora do Despertar. Quando isso acontecer, seus inimigos vão perceber.'] },
      { id: 'b', label: 'Eu gosto de dragões', reply: ['>Os olhos dele brilham, e as constelações das asas parecem acender junto.', 'Eu também! Dragão é a forma que a natureza escolhe para expressar força absoluta. Mas lembre-se de que todo dragão já foi um pequeno ovo.'] },
      { id: 'c', label: 'Você está pelado?', reply: ['>Ko olha para baixo, para as próprias escamas, e pensa por um bom tempo.', '...Sim. Meu corpo é capaz de suportar quando eu atravesso os sete céus e o vazio entre as estrelas, minhas roupas não. Eu posso tentar vestir uma se você achar do meu tamanho.'] },
    ] },
  space: { name: 'Yaven', title: 'mestre de Space Wizardry', img: 'yaven', pos: '50% 50%', face: '31% 36%',
    place: 'Na biblioteca de astronomia, sob uma cúpula cheia de estrelas, um corvídeo de corpo diminuto e energia enorme fala sem parar sobre as últimas descobertas dele. Este é o famoso Yaven, um dos maiores especialistas em magia espacial.',
    greet: 'Olá! Você também veio aprender sobre o universo? Você sabia que o universo tem quatorze bilhões de anos?',
    greet2: 'Olá de novo! Venha, vamos estudar! {fato}',
    facts: [
      'Sabia que a luz do Sol leva uns oito minutos para chegar aqui? Toda vez que você olha para ele, está vendo o passado!',
      'Sabia que um dia em Vênus dura mais que um ano em Vênus? Ele gira tão devagar que dá a volta no Sol antes de dar a volta em si mesmo!',
      'Sabia que no espaço não existe som? O feitiço mais explosivo do mundo, lá fora, é a coisa mais silenciosa que você vai ver.',
      'Sabia que a Lua se afasta da gente uns quatro centímetros por ano? Bem devagarinho. Acho que ela está tomando distância para alguma coisa.',
      'Sabia que Saturno é tão pouco denso que boiaria numa banheira, se alguém achasse uma banheira grande o bastante? Os cosmonautas ainda procuram.',
      'Sabia que uma colher de chá de estrela de nêutrons pesaria bilhões de toneladas? Eu tentei pesar uma vez. A balança não sobreviveu.',
      'Sabia que Marte tem um vulcão, o Monte Olimpo, mais de duas vezes mais alto que a montanha mais alta daqui? Os cosmonautas usam ele de ponto de referência.',
      'Sabia que Júpiter tem uma tempestade maior que o nosso mundo inteiro, girando há séculos? Os cosmonautas chamam de olho do gigante e nunca passam perto.',
      'Sabia que o Sol leva uns duzentos e trinta milhões de anos para dar uma volta na galáxia? Desde que nasceu, ele só deu umas vinte voltas. Ainda é um filhote!',
      'Sabia que os primeiros cosmonautas marcavam o próprio nome nas Cargas da Órbita? Quando os feitiços voltavam todos juntos, cada um sabia qual era o seu.',
      'Sabia que Prever, para um cosmonauta, é só ler o céu antes de todo mundo? As estrelas contam o que vem aí para quem olha com calma.',
      'Sabia que existem mais estrelas no universo do que grãos de areia em todas as praias do mundo? Pelas minhas contas, faltam umas três para eu terminar de catalogar.',
    ],
    indica: { reply: ['Tenho a pessoa certa! Gente da minha turma, que passa tanto tempo olhando para o céu que esquece de olhar para o chão. Um pouco de trabalho na guilda vai fazer bem!'], adv: null },
    opts: [
      { id: 'a', label: 'Eu quero mesmo é lançar feitiços poderosos', reply: ['Poderosos! Ótimo! E sabe de onde vem o poder de verdade? Da Órbita!', 'Cada feitiço que você lança dá uma Carga às cartas de Órbita na sua mão. Um Eclipse carregado varre o campo inteiro, e um Cometa Convocado chega quase de graça. Gravidade é paciência, e paciência acumula!'] },
      { id: 'b', label: 'Quando eu aprendo a conjurar buracos negros?', reply: ['Buraco Negro! O meu favorito! Ele custa caro e destrói tudo que estiver em campo, inclusive o que é seu. Em troca, cada unidade engolida carrega as suas cartas de Órbita.', 'Regra número um dos cosmonautas: nunca conjure um dentro de casa. A minha antiga biblioteca que o diga.'] },
      { id: 'c', label: 'Se a lua orbita a terra há tanto tempo, ela já deve ter acumulado uma carga gigantesca, não? Que tipo de magia será que ela vai lançar?', reply: ['Que pergunta maravilhosa! Eu calculei isso uma vez. Três noites seguidas, sem dormir.', 'Pelas minhas contas, a Lua já tem Cargas suficientes para um feitiço do tamanho do céu. A boa notícia é que ela é muito paciente. A má notícia é que ninguém sabe o que ela está esperando.'] },
    ] },
};
const NPC_INFO = {
  copias: { name: 'Lerael Vane', title: 'arquivista da Sociedade Mágica', img: 'lerael', pos: '50% 50%', face: '60% 26%',
    place: 'No escritório do arquivo da Sociedade Mágica, entre prateleiras de frascos e livros rúnicos, uma elfa de óculos escreve com uma pena que brilha. O crachá diz Lerael Vane. Ela termina a frase antes de levantar os olhos, e as olheiras contam que esta não é a primeira noite em claro.',
    greet: 'Boa noite. Lerael Vane, arquivista da Sociedade Mágica. Se trouxe cartas repetidas, a Sociedade as recebe cordialmente para fins de pesquisa arcana. Há um formulário. Na verdade, há três.',
    greet2: 'Ah, você de novo. Que bom. Os formulários já estão preenchidos com o seu nome; só faltam as cartas.',
    opts: [
      { id: 'a', label: 'O que a Sociedade faz com as minhas cartas?', reply: ['Estudamos. Cada carta é um pequeno fenômeno mágico preso em papel, e as cópias permitem experimentos que um original não aguentaria.', 'Algumas são desmontadas, outras comparadas, uma ou outra pega fogo. Tudo devidamente registrado.'] },
      { id: 'b', label: 'Você parece cansada.', reply: ['>Ela ajeita os óculos e toma um gole longo da caneca.', 'Estou ótima. Este é o meu rosto de quem está ótima.', 'A Sociedade recebe mais cartas do que tem arquivistas. É um bom problema. Para a Sociedade.'] },
      { id: 'c', label: 'O que é a Sociedade Mágica?', reply: ['Uma reunião de magos que concordam em discordar, formalmente e por escrito.', 'Registramos Disciplinas, artefatos e fenômenos. Cartomantes também, quando aparecem. Faz tempo que não aparece nenhum.'] },
    ] },
};
NPC_INFO.banco = { name: 'Barão Ostrander', title: 'banqueiro da Coroa', img: 'nenhuma', pos: '50% 50%', face: '50% 50%',
  place: 'O Banco da Coroa é todo mármore, silêncio e balcões altos demais. Atrás do mais alto deles, o Barão Ostrander confere números com uma pena que nunca erra.',
  greet: 'Banco da Coroa. Se veio pagar, ótimo. Se veio pedir mais prazo, a fila é ali, e ela não anda.',
  opts: [
    { id: 'a', label: 'Quanto exatamente o Ergos devia?', reply: ['Mais do que você gostaria de saber e menos do que eu gostaria de cobrar. A Coroa parcela. Eu fiscalizo.'] },
    { id: 'b', label: 'O senhor conhecia o Ergos?', reply: ['Conhecia o livro-caixa dele. Era o capítulo mais criativo do banco.'] },
  ] };
NPC_INFO.felix = { name: 'Felix', title: 'familiar de Ergos', img: 'warroom', pos: '50% 50%', face: '38% 50%',
  place: 'Felix está enrolado na poltrona da sala de guerra, perto da lareira. Ele abre um olho só quando você se aproxima.',
  greet: 'Hm. Quer conversar? Eu anoto tudo o que você faz lá embaixo. Tudo.',
  opts: [
    { id: 'a', always: true, dyn: 'stats', label: 'Como eu estou indo?' },
    { id: 'b', always: true, dyn: 'falhas', label: 'Onde eu tenho errado?' },
    { id: 'c', always: true, dyn: 'proximo', label: 'O que vem pela frente?' },
  ] };
const FELIX_TIPS = {
  revoada: 'Na Revoada, todo Morcego da Gruta tem +1 de Ataque, e o Ninho de Morcegos invoca mais um a cada turno. Derrube o Ninho cedo.',
  jardim: 'No Jardim, os Cogumelos-Broto brotam como 4/4. Cada Broto morre com 1 de dano: corte no turno em que aparece, e cuide do Fungoide Ancião, que planta um novo por turno.',
  toca: 'Na Toca, as Aranhas Tecelãs saem baratas e deixam suas unidades Imóveis. Espalhe o Ataque em mais de uma unidade e respeite a Centopeia Venenosa: ela tem Letal.',
  bicharada: 'A Toupeira Rainha compra uma carta extra sempre que tem menos unidades que você. Quando estiver na frente no campo, mire na Vida dela e feche a luta rápido.',
  imperatriz: 'Com a Centopeia Imperatriz, tudo que tem Letal fica mais barato e mais resistente. Troque as Centopeias com unidades baratas e guarde as grandes para depois.',
  fungo: 'No Fungo Colossal, os Cogumelos Adultos ganham Guarda, e o Fungo Colossal faz todos os Brotos brotarem quando entra. Limpe os Brotos sempre; dano em área ajuda muito.',
  oficina: 'Na Oficina, os Golens têm Blindagem 2: golpes de 1 não passam. Use feitiços, que ignoram a Blindagem, ou golpes de 2 ou mais. E corte as Pilhas de Sucata antes que virem golem.',
  bocas: 'Os Elementais das Bocas de Fogo superaquecem: ganham Ataque e perdem Vida a cada turno. Se não der para matar cedo, aguente atrás de Guarda até eles se apagarem.',
  patrulha_azer: 'A Patrulha Azer reforça uma unidade por turno com Ataque e Blindagem, que acumula. Não deixe nenhuma crescer: concentre o dano.',
  fundicao: 'A Fundição começa com uma Forja Ardente, que tempera uma unidade por turno. Quebre a Forja primeiro. Sempre a Forja primeiro.',
  colosso_ferro: 'O Colosso tem Blindagem 3 enquanto houver Forja em campo: golpes de 1 e 2 não passam. Derrube a Forja e ele fica exposto.',
  matriarca_azer: 'A Matriarca tempera a unidade mais fraca dela a cada turno. Mate primeiro as pequenas, antes que virem um problema blindado.',
  ignar: 'Ignar tem Blindagem 3 até cair para 25 de Vida e cria um Elemental de Escória por turno. Depois ele derrete: perde a Blindagem, mas esquenta a mesa inteira. Guarde feitiços para a primeira fase e seja rápido na segunda.',
  basilisco: 'O Olhar do Basilisco deixa Imóvel a sua unidade de maior Ataque, e a Mordida Petrificante destrói unidades Imóveis. Espalhe o Ataque em várias unidades médias. A Estátua Antiga protege o Basilisco enquanto estiver em campo, e com 20 de Vida ou menos ele troca de pele e recupera 8: guarde dano para depois disso.',
};
function felixLines(kind) {
  const games = lsGet(LS_GAMES, []).filter(g => g.ctx && g.ctx.camp === camp.id && g.ctx.mode !== 'social' && (g.result === 'win' || g.result === 'loss'));
  const encName = id => (E.ENC[id] && E.ENC[id].name) || id;
  if (kind === 'stats') {
    if (!games.length) return ['Você ainda não lutou nesta campanha. Eu anoto tudo, então capriche.'];
    const w = games.filter(g => g.result === 'win').length, l = games.length - w;
    const dmg = games.map(g => ((g.ctx.hpStart || 30) - Math.max(g.hp[0], 0))); const avg = Math.round(dmg.reduce((a, b) => a + b, 0) / dmg.length * 10) / 10;
    const plays = {}; games.forEach(g => (g.events || []).forEach(e => { if (e.k === 'play' && e.s === 'P') plays[e.c] = (plays[e.c] || 0) + 1; }));
    const fav = Object.entries(plays).sort((a, b) => b[1] - a[1])[0];
    const out = [`Lutas nesta campanha: ${games.length}. Vitórias: ${w}. Derrotas: ${l}.`, `Em média, você sai de cada luta com ${String(avg).replace('.', ',')} de dano a menos.${avg >= 10 ? ' Isso é muito. Eu teria fugido.' : avg <= 3 ? ' Quase sem arranhões. Exibido.' : ''}`];
    if (fav) out.push(fav[0] === 'felix' ? `A sua carta favorita sou eu: ${fav[1]} vezes. Ótimo gosto.` : `A sua carta favorita é ${E.DEF[fav[0]].name}: ${fav[1]} vezes. Eu vejo. Eu sei.`);
    out.push(`Ouro no cofre: ${camp.gold}. Aventureiros na guilda: ${camp.advs.length}.`);
    return out;
  }
  if (kind === 'falhas') {
    const losses = {}; games.filter(g => g.result === 'loss').forEach(g => { losses[g.enc] = (losses[g.enc] || 0) + 1; });
    const top = Object.entries(losses).sort((a, b) => b[1] - a[1]);
    const out = [];
    if (!top.length) out.push('Nenhuma derrota até agora. Não deixe isso subir à cabeça; a minha já está lá em cima, e é desconfortável.');
    else { const [enc, n] = top[0]; out.push(`Você caiu ${n} vez${n === 1 ? '' : 'es'} contra ${encName(enc)}.`); if (FELIX_TIPS[enc]) out.push(FELIX_TIPS[enc]); }
    const list = R.deckList(camp.deck); const avgCost = list.reduce((a, id) => a + E.DEF[id].cost, 0) / Math.max(1, list.length); const cheap = list.filter(id => E.DEF[id].cost <= 2).length;
    if (avgCost > 3.2) out.push(`O seu deck está pesado: custo médio de ${avgCost.toFixed(1).replace('.', ',')}. As lutas costumam acabar antes de as cartas caras saírem.`);
    else if (cheap < 10) out.push(`Só ${cheap} cartas custam 2 ou menos. Os primeiros turnos ficam vazios, e turno vazio é turno do inimigo.`);
    else out.push(`A curva do deck está boa: custo médio de ${avgCost.toFixed(1).replace('.', ',')}.${top.length ? ' O problema não é o baralho. Talvez seja quem segura.' : ''}`);
    return out;
  }
  const floor = camp.cleared[R.MAX_FLOOR] ? null : Math.min(camp.floor, R.MAX_FLOOR);
  if (!floor) return ['Você já atravessou as Grutas Vivas inteiras. O que vem depois, nem eu sei. Ainda.'];
  const F = R.FLOORS[floor]; const out = [`O andar ${floor} tem ${F.commons.map(encName).join(', ').replace(/, ([^,]*)$/, ' e $1')} nas lutas comuns.`];
  if (F.final === 'elite' && floor >= 6) out.push(`No fim, uma Elite: ${F.elites.map(encName).join(' ou ')}. ${FELIX_TIPS.colosso_ferro} ${FELIX_TIPS.matriarca_azer}`);
  else if (F.final === 'elite') out.push(`No fim, uma Elite: ${F.elites.map(encName).join(' ou ')}. Se for o Fungo, limpe os Brotos sempre, de preferência com dano em área. Se for a Imperatriz, troque as Centopeias com unidades baratas e guarde as grandes para depois.`);
  else if (F.final === 'basilisco' || F.final === 'ignar') out.push(`No fim, ${F.final === 'ignar' ? 'Ignar, o Coração da Forja' : 'o ' + encName('basilisco')}. ${FELIX_TIPS[F.final]}`);
  else if (FELIX_TIPS[F.final]) out.push(FELIX_TIPS[F.final]);
  return out;
}
function renderFelix() {
  $('#app').innerHTML = `${gearBtn()}<section class="cena larga guilda-tela">${talkHtml('felix', NPC_INFO.felix, null)}<div class="linha-logs"><button class="botao principal" data-act="home">Voltar à guilda</button></div></section>`;
}
const npcInfo = id => id.startsWith('mestre-') ? MESTRE_INFO[id.slice(7)] : NPC_INFO[id];
function npcArt(m, cls) { return m && HAS_IMG(m.img) ? `<div class="${cls}" role="img" aria-label="${esc(m.name + ', ' + m.title)}" style="background-image: var(--img-${m.img}); background-position: ${cls === 'npc-thumb' ? m.face : m.pos}"></div>` : ''; }
function mestreArt(d, cls) { const m = MESTRE_INFO[d]; return m && HAS_IMG(m.img) ? `<div class="${cls}" role="img" aria-label="${esc(m.name + ', ' + m.title)}" style="background-image: var(--img-${m.img}); background-position: ${cls === 'npc-thumb' ? m.face : m.pos}"></div>` : ''; }
function excessCopies() { return Object.entries(camp.collection).filter(([, n]) => n > 2).map(([id, n]) => ({ id, extra: n - 2, value: VENDA[R.RARITY[id] || 'C'] })); }
const INDICA_LABEL = 'Preciso de aventureiros pra me ajudar na guilda, pode me indicar alguém?';
function startCityTrip() { if (!camp.cityTrip) { camp.cityTrip = { visited: [] }; ui.talkLogs = {}; saveCamp(); } }
function finishCityTrip() {
  if (!camp || !camp.cityTrip) return;
  if (camp.cityTrip.visited.length) { camp.acts.npc = true; hist({ k: 'cidade', visited: camp.cityTrip.visited }); }
  camp.cityTrip = null; ui.talkLogs = {}; saveCamp();
}
function renderCidade() {
  const vis = (camp.cityTrip && camp.cityTrip.visited) || [];
  const npc = (id, name, role, thumb) => `<li class="npc ${vis.includes(id) ? 'visitando' : ''}">${thumb || ''}<div><b>${esc(name)}</b>${hasNewTalk(id) ? ' <span class="badge-novo" title="Falas novas disponíveis" aria-label="Falas novas disponíveis">!</span>' : ''}<p class="linha">${esc(role)}</p></div><button class="botao" data-act="g-visit" data-npc="${id}">${vis.includes(id) ? 'Voltar a falar' : 'Visitar'}</button></li>`;
  const mestres = Object.entries(MESTRES).map(([d, n]) => { const mi = MESTRE_INFO[d]; return mi ? npc('mestre-' + d, `${mi.name}, ${mi.title}`, `Ensina ${DISC_NAME[d]} e vende boosters da Disciplina (5 cartas).`, mestreArt(d, 'npc-thumb')) : npc('mestre-' + d, n, `Vende boosters de ${DISC_NAME[d]} (5 cartas da Disciplina). Personagem a definir.`, '<div class="npc-thumb vazio" aria-hidden="true">?</div>'); }).join('');
  $('#app').innerHTML = `${gearBtn()}<header class="abertura"><h1>Cidade</h1><p class="sub">Dia ${camp.day} · ${camp.gold} de ouro · visite quantos Mestres quiser; a ida conta ao voltar para a guilda</p></header>
  <section class="cena larga guilda-tela"><h2>Mestres das Disciplinas</h2><ul class="lista-npc">${mestres}</ul>
  ${camp.debt && camp.debt.due != null ? `<h2>Banco da Coroa</h2><ul class="lista-npc">${npc('banco', 'Barão Ostrander, Banco da Coroa', debtOpen() ? `Recebe a parcela da dívida: ${camp.debt.amount} de ouro até o fim do dia ${camp.debt.due}.` : 'A parcela está paga. Por enquanto.', '<div class="npc-thumb vazio" aria-hidden="true">B</div>')}</ul>` : ''}
  <h2>Sociedade Mágica</h2><ul class="lista-npc">${npc('copias', 'Lerael Vane, arquivista da Sociedade Mágica', 'Recebe cordialmente as cópias que passam de 2 (o deck só aceita 2), em troca de um honorário, para avançar as pesquisas arcanas.', npcArt(NPC_INFO.copias, 'npc-thumb'))}</ul>
  <div class="linha-logs"><button class="botao principal" data-act="home">Voltar à guilda</button></div></section>`;
}
function optOk(o, id) {
  const f = camp.flags; const said = new Set(((f.said || {})[id]) || []);
  if (o.once && (f.once || {})[o.once]) return false;
  if (o.requires && !said.has(o.requires)) return false;
  if (o.after) { if (!o.after.every(x => said.has(x))) return false; if (o.laterDay) { const sd = (f.saidDay || {})[id] || {}; if (Math.max(...o.after.map(x => sd[x] || 0)) >= camp.day) return false; } }
  if (o.met && !(((f.visits || {})[o.met] || 0) > 0)) return false;
  if (o.reqOther && !(((f.said || {})[o.reqOther.npc]) || []).includes(o.reqOther.opt)) return false;
  if (o.needBoss && !camp.cleared[5]) return false;
  if (o.needFlag && !camp.flags[o.needFlag]) return false;
  if (o.notFlag && camp.flags[o.notFlag]) return false;
  return true;
}
function npcOpts(id, mi, d) {
  const opts = mi.opts.filter(o => optOk(o, id));
  if (d && mi.indica && (camp.flags.bought || {})[d] && camp.flags.firstAdv && !(camp.flags.indicou || {})[d]) opts.push({ id: 'indica', label: INDICA_LABEL });
  return opts;
}
function hasNewTalk(id) {
  const mi = npcInfo(id); if (!mi || !camp) return false;
  const d = id.startsWith('mestre-') ? id.slice(7) : null; const said = new Set(((camp.flags.said || {})[id]) || []);
  return npcOpts(id, mi, d).some(o => !o.always && !said.has(o.id));
}
function talkHtml(id, mi, d) {
  const nome = esc((camp && camp.name) || 'você');
  const fill = t => esc(t).replace(/\{nome\}/g, nome);
      const used = camp.flags.once || {}; const saidSet = new Set(((camp.flags.said || {})[id]) || []);
      const log = ((ui.talkLogs || {})[id]) || [];
      const opts = npcOpts(id, mi, d);
      const novas = opts.filter(o => o.always || !saidSet.has(o.id)), feitas = opts.filter(o => !o.always && saidSet.has(o.id));
      const bt = o => `<button class="botao" data-act="g-talk" data-npc="${id}" data-opt="${o.id}">${esc(o.label)}</button>`;
      const ent = e => e.t === 'voce' ? `<div class="fala voce"><span class="quem">Você</span><p>${fill(e.text)}</p></div>`
        : e.t === 'narra' ? `<p class="narra">${fill(e.text)}</p>`
        : `<div class="fala"><span class="quem">${esc(e.name)}</span>${e.lines.map(l => `<p>${fill(l)}</p>`).join('')}</div>`;
      return `${npcArt(mi, 'npc-arte')}<h2>${esc(mi.name)}</h2><p class="linha">${esc(mi.title[0].toUpperCase() + mi.title.slice(1))}</p><p>${esc(mi.place)}</p>
        <div class="dialogo-log"><div class="fala"><span class="quem">${esc(mi.name)}</span><p>${fill((((camp.flags.visits || {})[id] || 0) > 1 && mi.greet2 ? mi.greet2 : mi.greet).replace('{fato}', mi.facts ? mi.facts[((camp.flags.facts || {})[id] || 0) % mi.facts.length] : ''))}</p></div>${log.map(ent).join('')}</div>
        ${novas.length ? `<div class="opcoes coluna dialogo">${novas.map(bt).join('')}</div>` : ''}
        ${feitas.length ? `<details class="falas-feitas"><summary>Falas já feitas (${feitas.length})</summary><div class="opcoes coluna dialogo">${feitas.map(bt).join('')}</div></details>` : ''}
`;
}
function renderNpc() {
  const id = ui.npc; let body = '';
  if (id.startsWith('mestre-')) {
    const d = id.slice(7); const mi = MESTRE_INFO[d];
    const nome = esc((camp && camp.name) || 'você');
    const fill = t => esc(t).replace(/\{nome\}/g, nome);
    let talk = '';
    if (mi) talk = talkHtml(id, mi, d) + '<h3>Treinamento</h3>';
    body = `${talk || `<h2>${esc(MESTRES[d])}</h2><p class="linha">Personagem a definir.</p>`}<p>Um booster de ${esc(DISC_NAME[d])}: 5 cartas da Disciplina (3 Comuns, 1 Incomum e 1 Incomum ou Rara), com mais chance de cartas que você ainda não tem.</p>
      <div class="opcoes coluna dialogo"><button class="botao principal disc-${d}" data-act="g-buy" data-dd="${d}" ${camp.gold < BOOSTER_PRECO ? 'disabled' : ''}>Comprar booster (${BOOSTER_PRECO} de ouro)</button>${d === 'tech' && (((camp.flags.said || {})[id]) || []).includes('c') ? `<button class="botao" data-act="g-buy" data-dd="tech" data-polite="1" ${camp.gold < BOOSTER_PRECO - 5 ? 'disabled' : ''}>“Boa noite, Chrome! Eu gostaria de fazer um upgrade no meu baralho de Magitech, por favor. Obrigado!” (${BOOSTER_PRECO - 5} de ouro)</button>` : ''}</div>`;
  } else if (id === 'banco') {
    const d = camp.debt;
    body = `${talkHtml(id, NPC_INFO.banco, null)}<h3>Parcela</h3>${debtOpen() ? `<p>Parcela da dívida de Ergos: <b>${d.amount} de ouro</b>, até o fim do dia ${d.due}. Você tem ${camp.gold}.</p><div class="opcoes"><button class="botao principal" data-act="g-pay" ${camp.gold >= d.amount ? '' : 'disabled'}>Pagar a parcela (${d.amount} de ouro)</button></div>` : `<p>A parcela de ${d.amount} de ouro está paga.</p>`}`;
  } else {
    const ex = excessCopies(); const total = ex.reduce((s, x) => s + x.extra * x.value, 0);
    body = `${talkHtml(id, NPC_INFO.copias, null)}<h3>Arquivo</h3><p>${ex.length ? 'A Sociedade paga um honorário de pesquisa por cópia que passa de 2 na sua coleção (o deck só aceita 2):' : 'Você não tem cópias sobrando: nenhuma carta passa de 2 na coleção.'}</p>
      ${ex.length ? `<ul class="lista-npc">${ex.map(x => `<li class="npc"><div><b>${esc(E.DEF[x.id].name)}</b> ${rarTag(x.id)}<p class="linha">${x.extra} cópia${x.extra === 1 ? '' : 's'} extra · ${x.value} de ouro cada</p></div><button class="botao" data-act="g-sell" data-cid="${x.id}">Entregar 1</button></li>`).join('')}</ul>
      <div class="opcoes"><button class="botao principal" data-act="g-sell-all">Entregar todas (+${total} de ouro)</button></div>` : ''}`;
  }
  $('#app').innerHTML = `${gearBtn()}<section class="cena larga guilda-tela"><p class="sub">${camp.gold} de ouro</p>${body}${passeioHtml(id)}<div class="linha-logs"><button class="botao" data-act="g-cidade">Voltar à cidade</button></div></section>`;
}
async function guildClick(act, ds) {
  if (act === 'g-ok-pend') { camp.pending.shift(); saveCamp(); ui.screen = 'home'; render(); return true; }
  if (act === 'g-hire-first') {
    camp.advs.push(newAdv({ name: 'Brisa', g: 'f', cls: 'batedor', lvl: 1 }));
    camp.flags.firstAdv = true; camp.fac.quadro = 'ativo'; camp.pending.shift();
    camp.pending.unshift({ kind: 'sugestao-taverna' });
    refreshBoard(); hist({ k: 'aventureiro', name: 'Brisa', first: true }); saveCamp();
    ui.screen = 'home'; render(); toast('Brisa entrou para a guilda. O Quadro de Missões está liberado.'); return true;
  }
  if (act === 'g-ok-taverna') { camp.pending.shift(); camp.flags.facilities = true; if (camp.fac.taverna === 'bloq') camp.fac.taverna = 'suja'; saveCamp(); ui.screen = 'instalacoes'; render(); return true; }
  if (act === 'g-defend') { startDefense(); return true; }
  if (act === 'g-credor') { startSocial('credor', { credor: true, volta: !!ds.volta, enc: 'credor' }); return true; }
  if (act === 'g-banca-buy') {
    const run = camp.run; const sc = ui.scene; const b = BANCA.find(x => x.id === ds.item); if (!run || !b || !sc) return true;
    const p = bancaPrice(b.cost, sc.nodeId); if ((run.sucata || 0) < p) return true;
    run.sucata -= p; b.apply(run); hist({ k: 'banca', item: b.id, price: p }); saveCamp(); render(); toast(`${b.label}: feito.`); return true;
  }
  if (act === 'g-banca-neg') { if (socialProblems().length) { toast('Ajuste o deck social antes: ' + socialProblems()[0]); return true; } const run = camp.run; run.bancaTried = run.bancaTried || {}; run.bancaTried[ui.scene.nodeId] = true; saveCamp(); startSocial('kryoret', { banca: true, enc: 'kryoret', nodeId: ui.scene.nodeId }); return true; }
  if (act === 'g-banca-back') { ui.scene = { kind: 'banca', nodeId: ui.scene.nodeId }; ui.screen = 'scene'; render(); return true; }
  if (act === 'g-pay') { if (payDebt()) { ui.scene = { kind: 'msg', title: 'Parcela paga', text: `O Barão Ostrander confere cada moeda, anota no livro-caixa e, por um instante, quase sorri. “Pontual. Que novidade.” Restam ${camp.gold} de ouro no cofre.` }; ui.screen = 'scene'; render(); window.scrollTo(0, 0); } else toast('Ouro insuficiente para a parcela.'); return true; }
  if (act === 'g-defend-social') { if (camp.defense && camp.defense.social) startSocial(camp.defense.enc, { defesa: true, enc: camp.defense.enc }); return true; }
  if (act === 'g-end-day') {
    if (camp.run) return true;
    const c = await choose('Encerrar o dia', `Encerrar o dia ${camp.day}? Missões avançam, obras terminam e pode acontecer alguma coisa durante a noite.${!camp.acts.descer ? ' Você ainda não desceu hoje.' : ''}`, [{ v: 'sim', label: 'Encerrar o dia' }]);
    if (c === 'sim') endDay(); return true;
  }
  if (act === 'g-social-tut') { startSocial('cliente', { tut: true, enc: 'cliente' }); return true; }
  if (act === 'g-passeio') { doPasseio(ds.npc); return true; }
  if (act === 'g-passeio-luta') { startPasseioFight(ds.fe); return true; }
  if (act === 'g-passeio-social') { startSocial(ds.se, { passeio: true, enc: ds.se }); return true; }
  if (act === 'g-felix') { ui.talkLogs = ui.talkLogs || {}; ui.talkLogs.felix = []; ui.screen = 'felix'; render(); window.scrollTo(0, 0); return true; }
  if (act === 'g-quadro') { ui.screen = 'quadro'; render(); window.scrollTo(0, 0); return true; }
  if (act === 'g-instalacoes') { ui.screen = 'instalacoes'; render(); window.scrollTo(0, 0); return true; }
  if (act === 'g-taverna') { ui.screen = 'taverna'; render(); window.scrollTo(0, 0); return true; }
  if (act === 'g-cidade') { if (!camp.cityTrip && camp.acts.npc) { toast('Você já foi à cidade hoje.'); return true; } startCityTrip(); ui.screen = 'cidade'; render(); window.scrollTo(0, 0); return true; }
  if (act === 'g-build-taverna') {
    if (camp.acts.construir || camp.building) return true;
    camp.acts.construir = true; camp.building = { id: 'taverna' }; hist({ k: 'obra-inicio', id: 'taverna' }); saveCamp(); render(); toast('Mãos à obra: a taverna fica pronta ao fim do dia.'); return true;
  }
  if (act === 'g-build-aloj') {
    const lvl = camp.fac.alojamento || 0; const cost = ALOJ[lvl];
    if (cost === undefined || camp.acts.construir || camp.building || camp.gold < cost || camp.fac.taverna !== 'ativa') return true;
    camp.gold -= cost; camp.acts.construir = true; camp.building = { id: 'alojamento', level: lvl + 1 }; hist({ k: 'obra-inicio', id: 'alojamento', level: lvl + 1, gold: cost }); saveCamp(); render(); toast(`Obra começada: o alojamento fica pronto ao fim do dia (-${cost} de ouro).`); return true;
  }
  if (act === 'g-dispatch') {
    const m = camp.missions.find(x => x.id === ds.mid); const sel = $(`#m-${ds.mid}`); const a = sel && camp.advs.find(x => x.id === sel.value);
    if (!m || !a || a.status !== 'livre') return true;
    a.status = 'missao'; a.mission = m.id; a.days = m.days; m.taken = true; camp.acts.despachar = true;
    hist({ k: 'despacho', adv: a.name, title: m.title, chance: successChance(a, m) }); saveCamp(); render(); toast(`${a.name} partiu: “${m.title}”.`); return true;
  }
  if (act === 'g-hire') {
    const a = camp.recruits[+ds.idx]; if (!a) return true; const price = HIRE_BASE + 15 * (a.lvl - 1);
    if (camp.gold < price || camp.advs.length >= advMax()) return true;
    camp.gold -= price; camp.advs.push(a); camp.recruits.splice(+ds.idx, 1); hist({ k: 'aventureiro', name: a.name, cls: a.cls, lvl: a.lvl, price }); saveCamp(); render(); toast(`${a.name} entrou para a guilda.`); return true;
  }
  if (act === 'g-visit') {
    if (!camp.cityTrip) { if (camp.acts.npc) { toast('Você já foi à cidade hoje.'); return true; } startCityTrip(); }
    if (!camp.cityTrip.visited.includes(ds.npc)) { camp.cityTrip.visited.push(ds.npc); camp.flags.visits = camp.flags.visits || {}; camp.flags.visits[ds.npc] = (camp.flags.visits[ds.npc] || 0) + 1; if (camp.flags.visits[ds.npc] > 2) { camp.flags.facts = camp.flags.facts || {}; camp.flags.facts[ds.npc] = (camp.flags.facts[ds.npc] || 0) + 1; } hist({ k: 'visita', npc: ds.npc }); saveCamp(); }
    ui.npc = ds.npc; ui.screen = 'npc'; render(); window.scrollTo(0, 0); return true;
  }
  if (act === 'g-talk') {
    const d = ds.npc.startsWith('mestre-') ? ds.npc.slice(7) : null; const mi = npcInfo(ds.npc); if (!mi) return true;
    const o = ds.opt === 'indica' ? { id: 'indica', label: INDICA_LABEL } : mi.opts.find(x => x.id === ds.opt); if (!o || (o.id !== 'indica' && !optOk(o, ds.npc))) return true;
    if (o.once) { camp.flags.once = camp.flags.once || {}; if (camp.flags.once[o.once]) return true; camp.flags.once[o.once] = true; }
    const ents = [{ t: 'voce', text: o.label }];
    if (o.id === 'indica') {
      const ind = mi.indica;
      if (camp.advs.length >= advMax()) ents.push({ t: 'narra', text: 'A guilda está cheia: não há onde acomodar mais ninguém. Amplie o Alojamento e volte a pedir.' });
      else {
        ents.push({ t: 'fala', name: mi.name, lines: ind.reply }); if (ind.narra) ents.push({ t: 'narra', text: ind.narra });
        const a = newAdv(ind.adv); camp.advs.push(a); camp.flags.indicou = camp.flags.indicou || {}; camp.flags.indicou[d] = true;
        ents.push({ t: 'narra', text: `${a.name} entra para a guilda: ${advClass(a)}, nível ${a.lvl}.` });
        if (ind.adv && ind.adv.quote) ents.push({ t: 'fala', name: a.name, lines: [ind.adv.quote] });
        hist({ k: 'aventureiro', name: a.name, from: ds.npc });
      }
    } else {
      let reply = o.dyn ? felixLines(o.dyn) : o.reply;
      if (o.rot) { camp.flags.rot = camp.flags.rot || {}; const key = ds.npc + ':' + o.id; const k = camp.flags.rot[key] || 0; reply = reply.map(r => r.replace('{rot}', o.rot[k % o.rot.length])); camp.flags.rot[key] = k + 1; }
      reply.filter(r => r[0] === '>').forEach(r => ents.push({ t: 'narra', text: r.slice(1) }));
      const ls = reply.filter(r => r[0] !== '>'); if (ls.length) ents.push({ t: 'fala', name: mi.name, lines: ls });
      if (o.questDone) { camp.flags.engrenagemEntregue = true; const q = camp.quests.find(x => x.id === o.questDone); if (q) q.done = true; if (o.gold) camp.gold += o.gold; ents.push({ t: 'narra', text: `Quest concluída: ${q ? q.title : 'pedido'}.${o.gold ? ` +${o.gold} de ouro.` : ''}` }); hist({ k: 'quest-ok', id: o.questDone }); }
      if (o.quest && !camp.quests.some(q => q.id === o.quest.id)) { camp.quests.push(Object.assign({ day: camp.day, from: ds.npc }, o.quest)); ents.push({ t: 'narra', text: `Nova quest: ${o.quest.title}.` }); hist({ k: 'quest', id: o.quest.id }); setTimeout(() => toast(`Nova quest: ${o.quest.title}.`), 30); }
    }
    ui.talkLogs = ui.talkLogs || {}; (ui.talkLogs[ds.npc] = ui.talkLogs[ds.npc] || []).push(...ents);
    if (o.id !== 'indica' || (camp.flags.indicou || {})[d]) { camp.flags.said = camp.flags.said || {}; const arr = camp.flags.said[ds.npc] = camp.flags.said[ds.npc] || []; if (!arr.includes(o.id)) { arr.push(o.id); camp.flags.saidDay = camp.flags.saidDay || {}; (camp.flags.saidDay[ds.npc] = camp.flags.saidDay[ds.npc] || {})[o.id] = camp.day; } }
    hist({ k: 'dialogo', npc: ds.npc, opt: o.id }); saveCamp(); render();
    const last = document.querySelector('.dialogo-log > :last-child'); if (last) last.scrollIntoView({ block: 'nearest' });
    return true;
  }
  if (act === 'g-buy') {
    const d = ds.dd; const price = ds.polite && d === 'tech' && (((camp.flags.said || {})['mestre-tech']) || []).includes('c') ? BOOSTER_PRECO - 5 : BOOSTER_PRECO; if (camp.gold < price) return true;
    camp.gold -= price; const cards = R.openDiscPack(rnd, d, camp.collection); addCards(cards);
    hist({ k: 'booster', type: 'mestre-' + d, cards, price });
    camp.flags.bought = camp.flags.bought || {}; camp.flags.bought[d] = true;
    if (!MESTRE_INFO[d] && camp.flags.firstAdv && !(camp.flags.indicou || {})[d] && camp.advs.length < advMax()) { const a = newAdv(); camp.advs.push(a); camp.flags.indicou = camp.flags.indicou || {}; camp.flags.indicou[d] = true; hist({ k: 'aventureiro', name: a.name, from: 'mestre-' + d }); setTimeout(() => toast(`O mestre indicou ${a.name} (${advClass(a)}) para a guilda.`), 50); }
    saveCamp();
    ui.scene = { kind: 'booster', type: d, cards, back: 'npc' }; ui.screen = 'scene'; render(); window.scrollTo(0, 0); return true;
  }
  if (act === 'g-sell' || act === 'g-sell-all') {
    const ex = excessCopies().filter(x => act === 'g-sell-all' || x.id === ds.cid); let got = 0;
    ex.forEach(x => { const n = act === 'g-sell-all' ? x.extra : 1; camp.collection[x.id] -= n; got += n * x.value; });
    camp.gold += got; hist({ k: 'venda', cards: ex.map(x => x.id), gold: got }); saveCamp(); render(); toast(`A Sociedade Mágica agradece: +${got} de ouro.`); return true;
  }
  return false;
}
/* ===== Deck social: batalha de negociação, editor, tutorial e passeios ===== */
const SOC_TYPE = { unit: 'Argumento', spell: 'Tática', weapon: 'Arma', structure: 'Estrutura', ritual: 'Ritual', trap: 'Armadilha' };
const SOC_W = { 'Ataque': 'Peso', 'Vida': 'Firmeza', 'mana': 'Lábia', 'Mana': 'Lábia', 'Evoluir': 'Enfatizar', 'unidade': 'Argumento' };
const SOC = () => !!(st && st.social);
const W = w => (SOC() ? (SOC_W[w] || w) : w);
const socTxt = t => (SOC() && t ? String(t).replace(/Mana insuficiente/g, 'Lábia insuficiente').replace(/ de vida/g, ' de Compostura').replace(/ de mana/g, ' de Lábia').replace(/unidades/g, 'Argumentos').replace(/ evolui: /g, ' ganha Ênfase: ').replace(/ morre\./g, ' cai por terra.') : t);
function socialStarter(disc) {
  const cards = Object.assign({}, E.SOCIAL_NEUTRAL_STARTER);
  (E.SOCIAL_INTRO[disc] || []).forEach(id => { cards[id] = 2; });
  return cards;
}
function ensureSocial() {
  if (!camp) return;
  if (!camp.social) { const cards = socialStarter(camp.deck.disc); camp.social = { disc: camp.deck.disc, cards: Object.assign({}, cards) }; camp.socialColl = Object.assign({}, cards); }
  if (!camp.socialColl) camp.socialColl = Object.assign({}, camp.social.cards);
  if (camp.fac && camp.fac.taverna === 'ativa' && !camp.flags.socialTut && !(camp.pending || []).some(p => p.kind === 'cliente-tutorial')) camp.pending.push({ kind: 'cliente-tutorial' });
}
function socialSize() { return Object.values(camp.social.cards).reduce((a, b) => a + b, 0); }
function socialProblems() {
  const p = []; const n = socialSize();
  if (n !== 20) p.push(`O deck social tem ${n} carta${n === 1 ? '' : 's'}; precisa de 20.`);
  Object.entries(camp.social.cards).forEach(([id, k]) => {
    const d = E.DEF[id];
    if (k > 2) p.push(`${d.name}: no máximo 2 cópias.`);
    if ((camp.socialColl[id] || 0) < k) p.push(`${d.name}: você só tem ${camp.socialColl[id] || 0}.`);
    if (d.disc && d.disc !== 'neutra' && d.disc !== camp.social.disc) p.push(`${d.name} é de outra Disciplina.`);
  });
  return p;
}
function startSocial(encId, ctx) {
  const pr = socialProblems(); if (pr.length) { toast('Ajuste o deck social antes: ' + pr[0]); ui.deckFrom = ui.screen; ui.deckKind = 'social'; ui.screen = 'deck'; ui.deckFilter = 'disc'; render(); return; }
  const deck = []; Object.entries(camp.social.cards).forEach(([id, n]) => { for (let i = 0; i < n; i++) deck.push(id); });
  st = E.newGame(camp.social.disc, encId, null, { deck, bosses: camp.cleared[5] ? 1 : 0 });
  st.gameId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  st.ctx = Object.assign({ mode: 'social', camp: camp.id, day: camp.day, hpStart: 30 }, ctx || {});
  ui.screen = 'battle'; ui.mode = null; ui.info = null; ui.modal = null; ui.busy = false; ui.overClosed = false; render(); window.scrollTo(0, 0);
}
function socialDone() {
  const won = st.over === 'P'; const ctx = st.ctx; st = null;
  let title = won ? 'Acordo fechado' : 'Negociação perdida', txt;
  if (ctx.tut) {
    const g = won ? 15 : 5; camp.gold += g; camp.flags.socialTut = true; camp.pending = camp.pending.filter(p => p.kind !== 'cliente-tutorial');
    txt = won ? `O cliente admite que o pelo de gato dá personalidade à mesa, paga a conta inteira e ainda deixa gorjeta: +${g} de ouro. Felix aceita os elogios em nome da categoria.` : `O cliente paga só metade, resmungando sobre pelos na cerveja: +${g} de ouro. Felix considera isso uma vitória moral.`;
    hist({ k: 'social', enc: 'cliente', won, gold: g });
  } else if (ctx.defesa) {
    const spec = camp.defense || { gold: 15, multa: 20 }; let delta;
    if (won) { delta = spec.gold; camp.gold += delta; txt = `${spec.leader || 'A visita'} vai embora sem o que veio buscar. A vizinhança comenta, e a fama da guilda rende: +${delta} de ouro.`; }
    else { const m = Math.min(camp.gold, spec.multa); delta = -m; camp.gold -= m; txt = `Você cede mais do que devia. A conta da conversa sai cara: ${m} de ouro.`; }
    title = won ? 'A guilda se defendeu' : 'A guilda saiu perdendo';
    hist({ k: 'defesa', social: true, enc: ctx.enc, won, gold: delta });
    camp.defense = null; camp.pending = camp.pending.filter(p => p.kind !== 'defesa');
  } else if (ctx.passeio) {
    if (won) { const g = rint(5, 10); camp.gold += g; txt = `A conversa termina do seu jeito, e o sujeito ainda paga uma rodada para fazer as pazes: +${g} de ouro. Mikeus assente: “Bom. Da outra vez você precisou de mais palavras.”`; hist({ k: 'social', enc: ctx.enc, won, gold: g }); }
    else { txt = 'A conversa não leva a lugar nenhum. Vocês deixam para lá e seguem caminho. Mikeus não comenta, o que é pior.'; hist({ k: 'social', enc: ctx.enc, won }); }
  } else if (ctx.banca || ctx.prisioneiro) {
    const run = camp.run;
    if (ctx.banca) {
      if (won) { run.bancaNeg = run.bancaNeg || {}; run.bancaNeg[ctx.nodeId] = true; txt = 'Kryoret ri pela primeira vez, um som de fole velho. “Você entende de ofício. Preço de amigo.” Desconto de 20% nesta banca.'; }
      else txt = 'Kryoret cruza os braços. “Educação se aprende. O preço não muda.”';
      hist({ k: 'social', enc: 'kryoret', won }); saveCamp();
      ui.scene = { kind: 'run-msg', title: won ? 'Preço de amigo' : 'Preço cheio', text: txt, back: 'banca', nodeId: ctx.nodeId }; ui.screen = 'scene'; render(); window.scrollTo(0, 0); return;
    }
    if (won) { run.sucata = (run.sucata || 0) + 4; run.bancaDescDescida = true; txt = 'O guarda solta as correntes resmungando sobre regulamentos. O prisioneiro agradece com 4 de Sucata e uma promessa: as Bancas Azer desta descida vão te dar preço de amigo.'; }
    else txt = 'O guarda não se convence. O prisioneiro suspira; ele já ouviu argumentos piores.';
    hist({ k: 'social', enc: 'guarda_azer', won }); saveCamp();
    ui.scene = { kind: 'run-msg', title: won ? 'Prisioneiro libertado' : 'O guarda não cede', text: txt }; ui.screen = 'scene'; render(); window.scrollTo(0, 0); return;
  } else if (ctx.credor) {
    const d = camp.debt || (camp.debt = { amount: 300, status: 'aberta', overdue: 0 });
    const days = won ? (ctx.volta ? 3 : 4) : 2; if (d.status === 'pendente') d.status = 'aberta';
    if (!won && ctx.volta) d.amount = Math.round(d.amount * 1.1);
    d.due = camp.day + days; d.status = 'aberta'; d.felixTip = false;
    camp.pending = camp.pending.filter(p => p.kind !== 'credor');
    title = won ? 'Prazo negociado' : 'O Barão leva a melhor';
    txt = won ? `O Barão fecha o livro-caixa com um estalo. “${days === 4 ? 'Quatro' : 'Três'} dias. ${d.amount} de ouro. Nem um dia a mais, nem uma moeda a menos.”` : `O Barão anota alguma coisa sem tirar os olhos de você. “Dois dias. ${d.amount} de ouro. E considere-se com sorte.”`;
    hist({ k: 'credor', won, amount: d.amount, due: d.due, volta: !!ctx.volta });
    saveCamp();
    ui.scene = { kind: 'credor-res', title, text: txt }; ui.screen = 'scene'; render(); window.scrollTo(0, 0); return;
  } else { txt = won ? 'Você conseguiu o que queria.' : 'Não foi desta vez.'; hist({ k: 'social', enc: ctx.enc, won }); }
  saveCamp();
  ui.scene = { kind: 'msg', title, text: txt }; ui.screen = 'scene'; render(); window.scrollTo(0, 0);
}
/* Dívida: o credor, a parcela e o Banco da Coroa */
function debtOpen() { return !!(camp.debt && camp.debt.status === 'aberta' && camp.debt.due != null); }
function payDebt() {
  const d = camp.debt; if (!debtOpen() || camp.gold < d.amount) return false;
  camp.gold -= d.amount; d.status = 'paga'; d.paidDay = camp.day; hist({ k: 'parcela-paga', amount: d.amount, day: camp.day }); saveCamp(); return true;
}
function credorScene(sc) {
  const d = camp.debt;
  if (sc.segunda && !sc.volta) return `<h2>A segunda parcela</h2><p>O calor da forja ainda está nas suas roupas quando o Barão Ostrander aparece na porta, pontual como sempre.</p><div class="fala"><span class="quem">Barão Ostrander</span><p>A guilda sobreviveu ao primeiro prazo. Parabéns. A Coroa agora espera a parcela cheia: ${d.amount} de ouro.</p><p>Vamos combinar o prazo. Combinar, aqui, significa você me convencer.</p></div><p class="intro-dica">Negociação com o Perfil Procedimento. Vitória: 4 dias de prazo. Derrota: 2 dias.</p><div class="opcoes"><button class="botao principal" data-act="g-credor">${bi('social')}Negociar o prazo</button></div>`;
  if (sc.volta) return `<h2>O credor voltou</h2><p>O prazo venceu, e o Barão Ostrander está de novo na porta da guilda, agora com dois auditores e um sorriso que não chega aos olhos.</p><div class="fala"><span class="quem">Barão Ostrander</span><p>Prazos existem para serem cumpridos. Como este não foi, a parcela agora é de ${d.amount} de ouro. Vamos conversar sobre quando você pretende pagar.</p></div><p class="intro-dica">Negociação com o Perfil Procedimento. Vitória: mais 3 dias de prazo. Derrota: 2 dias, e a parcela sobe mais 10%.</p><div class="opcoes"><button class="botao principal" data-act="g-credor" data-volta="1">${bi('social')}Negociar</button></div>`;
  return `<h2>O credor</h2><p>Mal você volta do terceiro andar, um homem de casaca impecável espera na porta da guilda, com um livro-caixa debaixo do braço e a paciência de quem nunca perdeu uma cobrança.</p>
    <div class="fala"><span class="quem">Barão Ostrander</span><p>Barão Ostrander, do Banco da Coroa. A dívida de Ergos não sumiu junto com ele. Agora ela é sua.</p><p>Como a guilda acabou de reabrir, a Coroa aceita uma primeira parcela reduzida: 300 de ouro. Resta saber em quanto tempo. E eu reconheço um devedor que vai tentar enrolar só de olhar.</p></div>
    <div class="fala"><span class="quem">Felix</span><p>Sorria. Não prometa nada que envolva números.</p></div>
    <p class="intro-dica">Negociação com o Perfil Procedimento: cartas que citam Procedimento rendem mais. Vitória: 4 dias de prazo. Derrota: 2 dias.</p>
    <div class="opcoes"><button class="botao principal" data-act="g-credor">${bi('social')}Negociar o prazo</button></div>`;
}
function credorResScene(sc) {
  const d = camp.debt;
  return `<h2>${esc(sc.title)}</h2><p>${esc(sc.text)}</p><p class="destaque">Parcela: ${d.amount} de ouro até o fim do dia ${d.due}. Você tem ${camp.gold}.</p><p class="intro-dica">O pagamento é feito no Banco da Coroa, na cidade${camp.gold >= d.amount ? ', ou agora mesmo' : ''}.</p>
    <div class="opcoes">${camp.gold >= d.amount ? `<button class="botao principal" data-act="g-pay">Pagar agora (${d.amount} de ouro)</button>` : ''}<button class="botao ${camp.gold >= d.amount ? '' : 'principal'}" data-act="home">Voltar à guilda</button></div>`;
}
const BANCA = [
  { id: 'carta1', label: '+1 carta na mão inicial', dur: 'próxima luta', cost: 2, apply(run) { run.bonus.hand = (run.bonus.hand || 0) + 1; } },
  { id: 'mana1', label: '+1 de mana no primeiro turno', dur: 'próxima luta', cost: 3, apply(run) { run.bonus.manaFirst = (run.bonus.manaFirst || 0) + 1; } },
  { id: 'cura8', label: 'Recuperar 8 de Vida', dur: 'na hora', cost: 3, apply() { hpChange(8); } },
  { id: 'carta2', label: '+2 cartas na mão inicial', dur: 'próxima luta', cost: 4, apply(run) { run.bonus.hand = (run.bonus.hand || 0) + 2; } },
  { id: 'cristal', label: '+1 Cristal (+1 de mana máxima)', dur: 'próxima luta', cost: 5, apply(run) { run.bonus.mana = (run.bonus.mana || 0) + 1; } },
  { id: 'cartaAll', label: '+1 carta na mão inicial', dur: 'todas as lutas desta descida', cost: 8, apply(run) { run.allHand = (run.allHand || 0) + 1; } },
];
function bancaDiscount(nodeId) { const run = camp.run; return !!(run.bancaDescDescida || (run.bancaNeg && run.bancaNeg[nodeId])); }
function bancaPrice(cost, nodeId) { return bancaDiscount(nodeId) ? Math.max(1, Math.round(cost * 0.8)) : cost; }
function bancaScene(sc) {
  const run = camp.run; const suc = run.sucata || 0; const disc = bancaDiscount(sc.nodeId); const tried = run.bancaTried && run.bancaTried[sc.nodeId];
  const rows = BANCA.map(b => { const p = bancaPrice(b.cost, sc.nodeId); return `<li class="npc"><div><b>${esc(b.label)}</b><p class="linha">${esc(b.dur)}</p></div><button class="botao" data-act="g-banca-buy" data-item="${b.id}" ${suc < p ? 'disabled' : ''}>${disc && p < b.cost ? `<s>${b.cost}</s> ` : ''}${p} de Sucata</button></li>`; }).join('');
  return `${HAS_IMG('kryoret') ? '<div class="npc-arte" role="img" aria-label="Kryoret, o Azer da banca" style="background-image: var(--img-kryoret)"></div>' : `<div class="intro-ico">${iconSvg(typeof ART !== 'undefined' ? ART.ui.instalacoes : null)}</div>`}
    <h2>Banca Azer</h2><p>Ao lado de uma fornalha que nunca apagou, um Azer de barba em brasa armou uma tenda cheia de espadas, machados e armaduras, e martela uma lâmina na bigorna sem tirar os olhos de você. Uma placa de cobre diz, em três idiomas: “KRYORET. TROCO POR SUCATA. SEM FIADO.”</p>
    <div class="fala"><span class="quem">Kryoret</span><p>${disc ? 'Você fala a língua do ofício. Para você, preço de amigo.' : tried ? 'Já conversamos. O preço é o preço.' : 'Sucata na mesa, vantagem na mão. Educação abaixa o preço. Falta dela aumenta.'}</p></div>
    <p class="destaque">Sucata: ${suc}. Vida: ${run.hp} de 30.${disc ? ' Desconto de 20% ativo.' : ''}</p>
    <ul class="lista-npc">${rows}</ul>
    <div class="opcoes">${!disc && !tried ? `<button class="botao" data-act="g-banca-neg">${bi('social')}Negociar o preço (luta social)</button>` : ''}<button class="botao principal" data-act="scene-ok">Seguir caminho</button></div>
    <p class="intro-dica">A Sucata se perde no fim da descida, então vale gastar.</p>`;
}
function felixDebtScene() {
  const d = camp.debt;
  return `${felixArt('guilda')}<h2>Um conselho do Felix</h2><div class="fala"><span class="quem">Felix</span><p>Você tem ${camp.gold} de ouro e a parcela é de ${d.amount}. Vá ao Banco da Coroa e pague hoje, antes que o Barão volte com juros.</p><p>E antes que esse ouro escorra pelos seus dedos. Ergos também “ia pagar amanhã”. Todo dia ele ia pagar amanhã.</p></div><div class="opcoes"><button class="botao principal" data-act="g-ok-pend">Entendido</button></div>`;
}
function socialTutScene() {
  const disc = DISC_NAME[camp.deck.disc];
  return `${felixArt('guilda')}<h2>Um cliente reclamando</h2><p>Mal a taverna abre, o primeiro cliente bate a caneca na mesa e levanta a manga do casaco, coberta de pelo de gato.</p>
    <div class="fala"><span class="quem">Cliente</span><p>Esta mesa está imunda de pelo de gato! Eu não vou pagar o preço cheio por isso. Exijo um desconto!</p></div>
    <div class="fala"><span class="quem">Felix</span><p>Pelo de gato é decoração. Mas tudo bem: hora de conversar do jeito da família. Com cartas.</p></div>
    <div class="tutorial-social"><h3>Negociação: o mesmo jogo, outras palavras</h3><dl>
      <dt>Compostura</dt><dd>a sua vida na conversa. Se zerar, você perde a negociação.</dd>
      <dt>Resistência</dt><dd>a vida do interlocutor. Zere para fechar o acordo.</dd>
      <dt>Lábia</dt><dd>a mana: sobe 1 por turno, como na batalha.</dd>
      <dt>Argumento</dt><dd>a unidade, com Peso (ataque) e Firmeza (vida). <b>Ponto Sensível</b> é a Guarda; <b>Álibi</b> é o Escudo.</dd>
      <dt>Tática</dt><dd>o feitiço. <b>Abertura</b> e <b>Repercussão</b> são o Ao Entrar e o Ao Morrer; <b>Enfatizar</b> é a Evolução.</dd>
      <dt>Perfil</dt><dd>o traço do interlocutor. Este cliente é de <b>Ganância</b>: cartas que citam Perfil Ganância rendem mais contra ele.</dd>
    </dl><p class="intro-dica">O seu deck social começou com 20 cartas: 14 básicas e 6 de ${esc(disc)}. Dá para editar em Deck social, na guilda.</p></div>
    <div class="opcoes"><button class="botao principal" data-act="g-social-tut">Negociar com o cliente</button></div>`;
}
/* Passeios: encerrar a ida à cidade passando tempo com alguém */
const ATIV = {
  'mestre-tech': [
    { title: 'Sair para comer', cost: 5, text: 'Chrome escolhe um restaurante caro demais, pede metade do cardápio e deixa você pagar só a sobremesa: 5 de ouro, “simbólicos”. Entre uma garfada e outra, ela fala sobre como os contratos que faz com clientes e fornecedores são os mais espertos e lucrativos do mundo.', broke: 'Você não tem nem para a sobremesa. Chrome paga tudo e cobra em histórias da dungeon, com juros.' },
    { title: 'Garimpar itens raros no mercado', equip: 0.4, text: 'Vocês garimpam as bancas do mercado de antiguidades. Chrome pechincha como quem desarma uma armadilha.', win: 'Entre quinquilharias, ela acha um equipamento de verdade e joga para você: “Considere um investimento.”', lose: 'Nada que preste hoje. “O mercado é assim: hoje não, amanhã talvez.”' },
    { title: 'Visitar os gatos da guilda', text: 'Chrome vai até a guilda só para ver os gatos. Em dez minutos ela está no chão, cercada de Felinos, distribuindo chamegos com uma seriedade de auditoria. Felix finge desinteresse e é o primeiro da fila.' },
  ],
  'mestre-temporal': [
    { title: 'Treinar', text: 'Mikeus te faz repetir o mesmo golpe até o braço tremer. “De novo. No futuro, você erra esse. Hoje, não.”' },
    { title: 'Sair para patrulhar', fight: 0.25, social: { chance: 0.25, encs: ['bebado', 'suspeito'], text: 'No caminho de volta, alguém atravessa a estrada e resolve que hoje é dia de conversa. Mikeus suspira: “Essa luta é sua.”' }, text: 'Vocês patrulham as estradas fora dos muros. Mikeus anda como quem já conhece cada curva do caminho.', win: 'Ele para de repente. “Agora.” Alguma coisa sai do mato.', lose: 'Nada acontece. Mikeus parece aliviado, como quem lembra de uma versão em que aconteceu.' },
    { title: 'Conversar sobre o passado', text: 'Num banco do dojo, Mikeus fala do passado, ou do futuro, depende de quem conta. Fala de amigos que ainda não nasceram e de um café que já não existe. Você não entende tudo, mas ele parece mais leve depois.' },
  ],
  'mestre-necro': [
    { title: 'Compor uma música', text: 'Charles te entrega uma partitura em branco e uma pena. Vocês passam a tarde procurando uma palavra que rime com “sarcófago”. Não existe. Vocês inventam uma.' },
    { title: 'Aprender um instrumento', text: 'Charles te ensina três acordes num alaúde que já foi de um bardo famoso. “Ele não vai sentir falta”, garante. “Ele está na banda.”' },
    { title: 'Buscar uma atração para o circo', text: 'Vocês percorrem a cidade atrás de uma atração nova para o Necro-Circus. Depois de um mímico, dois malabaristas e um fantasma muito tímido, Charles contrata o fantasma.' },
    { title: 'Animar a Dragão Amarelo', text: 'Charles leva a banda espectral até a Dragão Amarelo. Os aventureiros dançam, os gatos fogem, e Felix reclama do barulho batendo o pé no ritmo.' },
  ],
  'mestre-holy': [
    { title: 'Assistir a uma missa', text: 'Gun\'Liao celebra uma missa no terraço da catedral. O sermão é sobre gratidão e sacrifício, e de algum jeito você termina doando algo que nem lembrava de ter trazido.' },
    { title: 'Conversar sobre os deuses', text: 'Entre os vitrais, ele fala dos deuses como quem fala de sócios: quem cobra o quê, quem paga em dia e quem nunca deve ser chamado depois da meia-noite.' },
    { title: 'Alimentar as cobras de estimação', text: 'Ele te leva para alimentar as cobras de estimação. São sete, todas com nome de santo. Uma delas gosta de você mais do que deveria.' },
    { title: 'Acompanhar alguns “favores” para os deuses', text: 'Você acompanha Gun\'Liao em alguns “favores” para os deuses. Nada é explicado. Uma porta é marcada, um homem pede perdão de joelhos, um poço é abençoado. No fim, ele agradece a companhia e lava as mãos devagar.' },
  ],
  'mestre-draconic': [
    { title: 'Levantar peso na academia', text: 'Ko te leva a uma academia de lutadores. Ele levanta uma bigorna em cada mão. Você levanta a própria dignidade, com esforço.' },
    { title: 'Voar e caçar monstros', fight: 0.4, text: 'Ko te carrega pelos céus acima da floresta. O mundo fica pequeno e o vento rouba as suas palavras.', win: 'Lá embaixo, alguma coisa se mexe. Ko sorri e mergulha.', lose: 'A caçada não encontra nada à altura. Ko parece um pouco decepcionado e dá mais uma volta só pela vista.' },
  ],
  'mestre-space': [
    { title: 'Conversar sobre magia', text: 'Yaven passa a tarde explicando teoria mágica com desenhos, gestos e uma quantidade alarmante de estrelinhas no ar. Você entende metade. A metade boa.' },
    { title: 'Visitar a estação espacial mágica', text: 'Yaven te leva à estação espacial mágica, uma torre de cristal que gira sozinha acima das nuvens. Lá de cima, ele aponta os caminhos dos cosmonautas entre as estrelas.' },
    { title: 'Olhar as estrelas', text: 'Vocês deitam no telhado da biblioteca para olhar as estrelas. Yaven dá nome a cada uma. Algumas, ele admite, acabou de batizar.' },
    { title: 'Ver as magias de festa', text: 'Yaven mostra as magias de festa dele: confete que flutua, fogos que formam constelações e um cometa de bolso que dá três voltas na sala e pousa na sua cabeça.' },
  ],
  copias: [
    { title: 'Tomar um café e conversar amenidades', text: 'Lerael faz uma pausa para o café com você. Vocês falam do tempo, de livros e de um gato que dorme todo dia na janela do arquivo.' },
    { title: 'Tomar um café e ouvir as reclamações', text: 'No café, Lerael finalmente desabafa: formulários em triplicata, magos que não devolvem livros e um diretor que acha que arquivo se organiza sozinho. Você escuta. Ela parece que vai dormir melhor só de ter falado.' },
  ],
};
const npcDisc = id => id.startsWith('mestre-') ? id.slice(7) : 'neutra';
function nextAtiv(id) { const list = ATIV[id]; if (!list) return null; return list[((camp.flags.atv || {})[id] || 0) % list.length]; }
function socialCardFor(disc) {
  const pool = E.SOCIAL_POOL[disc] || []; if (!pool.length) return null;
  const w = pool.map(id => (camp.socialColl[id] ? 1 : 2)); let r = rnd() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r < 0) return pool[i]; }
  return pool[pool.length - 1];
}
function passeioHtml(id) {
  const a = nextAtiv(id); if (!a) return '';
  const mi = npcInfo(id); const d = npcDisc(id);
  return `<h3>Passar o tempo</h3><p class="intro-dica">Encerra a ida à cidade: você passa o resto do dia com ${esc(mi.name)} e ganha uma carta social ${d === 'neutra' ? 'básica (educação e bom senso)' : 'de ' + esc(DISC_NAME[d])}.${a.cost ? ` Custa ${a.cost} de ouro, simbólicos.` : ''}</p>
    <div class="opcoes"><button class="botao" data-act="g-passeio" data-npc="${id}">${bi('passeio')}${esc(a.title)}</button></div>`;
}
function doPasseio(id) {
  const a = nextAtiv(id); const mi = npcInfo(id); if (!a || !mi) return;
  camp.flags.atv = camp.flags.atv || {}; camp.flags.atv[id] = (camp.flags.atv[id] || 0) + 1;
  const paras = []; const extras = []; let fight = null, equip = null;
  if (a.cost) { if (camp.gold >= a.cost) { camp.gold -= a.cost; paras.push(a.text); extras.push(`-${a.cost} de ouro`); } else paras.push(a.broke || a.text); }
  else paras.push(a.text);
  if (a.equip) {
    if (rnd() < a.equip) { const ws = Object.keys(R.RARITY).filter(x => E.DEF[x].type === 'weapon'); equip = ws[Math.floor(rnd() * ws.length)]; addCards([equip]); paras.push(a.win); extras.push(`Equipamento: ${E.DEF[equip].name}, para o deck de batalha`); }
    else paras.push(a.lose);
  }
  let socialEnc = null;
  if (a.fight) {
    const ok = !R.deckProblems(camp.deck, camp.collection).length;
    const r = rnd();
    if (ok && r < a.fight) { const F = R.FLOORS[Math.min(camp.floor || 1, 5)]; fight = F.commons[Math.floor(rnd() * F.commons.length)]; paras.push(a.win); }
    else if (a.social && camp.flags.socialTut && r < a.fight + a.social.chance && !socialProblems().length) { socialEnc = a.social.encs[Math.floor(rnd() * a.social.encs.length)]; paras.push(a.social.text); }
    else paras.push(a.lose);
  }
  const card = socialCardFor(npcDisc(id));
  if (card) { camp.socialColl[card] = (camp.socialColl[card] || 0) + 1; }
  if (camp.cityTrip && !camp.cityTrip.visited.includes(id)) camp.cityTrip.visited.push(id);
  hist({ k: 'passeio', npc: id, title: a.title, card, equip, fight });
  finishCityTrip();
  ui.scene = { kind: 'passeio', npc: id, title: a.title, paras, extras, card, fight, socialEnc }; ui.screen = 'scene'; render(); window.scrollTo(0, 0);
}
function passeioScene(sc) {
  const mi = npcInfo(sc.npc);
  const art = mi && HAS_IMG(mi.img) ? npcArt(mi, 'npc-arte') : '';
  return `${art}<h2>${esc(mi.name)}: ${esc(sc.title)}</h2>${sc.paras.map(p => `<p>${esc(p)}</p>`).join('')}
    ${sc.card ? `<h3>Carta social</h3><div class="prever-lista">${cardById(sc.card, '', '', (camp.socialColl[sc.card] || 0) > 1 ? 'Você já tinha' : 'Nova')}</div>` : ''}
    ${sc.extras.length ? `<p class="destaque">${esc(sc.extras.join(' · '))}</p>` : ''}
    <div class="opcoes">${sc.fight ? `<button class="botao principal" data-act="g-passeio-luta" data-fe="${sc.fight}">Lutar: ${esc(E.ENC[sc.fight].name)}</button>` : sc.socialEnc ? `<button class="botao principal" data-act="g-passeio-social" data-se="${sc.socialEnc}">${bi('social')}Conversar: ${esc(E.ENC[sc.socialEnc].leader)}</button>` : '<button class="botao principal" data-act="home">Voltar à guilda</button>'}${sc.card ? `<button class="botao" data-act="deck-social">${bi('social')}Editar deck social</button>` : ''}</div>`;
}
function startPasseioFight(encId) {
  st = E.newGame(camp.deck.disc, encId, null, { deck: R.deckList(camp.deck) });
  st.gameId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  st.ctx = { mode: 'passeio', camp: camp.id, day: camp.day, hpStart: 30 };
  ui.screen = 'battle'; ui.mode = null; ui.info = null; ui.modal = null; ui.busy = false; ui.overClosed = false; render(); window.scrollTo(0, 0);
}
function passeioFightDone() {
  const won = st.over === 'P'; st = null; let txt;
  if (won) { const g = rint(10, 15); camp.gold += g; txt = `Vitória. Vocês voltam com a história e com ${g} de ouro em despojos.`; hist({ k: 'passeio-luta', won, gold: g }); }
  else { txt = 'A luta não sai como o esperado. Vocês voltam com hematomas e nada mais, mas inteiros.'; hist({ k: 'passeio-luta', won }); }
  saveCamp(); ui.scene = { kind: 'msg', title: won ? 'Caçada bem-sucedida' : 'Retirada', text: txt }; ui.screen = 'scene'; render(); window.scrollTo(0, 0);
}
const bi = k => iconSvg(typeof ART !== 'undefined' ? ART.ui[k] : null, 'ico-btn');
function renderHome() {
  if (!camp) { ui.screen = 'title'; renderTitle(); return; }
  ensureGuild(); finishCityTrip();
  if (debtOpen() && camp.gold >= camp.debt.amount && !camp.debt.felixTip && !camp.pending.some(p => p.kind === 'credor')) { camp.debt.felixTip = true; camp.pending.unshift({ kind: 'felix-divida' }); saveCamp(); }
  const ps = pendingScene(); if (ps) { ui.scene = ps; ui.screen = 'scene'; renderScene(); return; }
  const valid = !R.deckProblems(camp.deck, camp.collection).length;
  const next = Math.min(camp.floor, R.MAX_FLOOR);
  const allDone = camp.cleared[R.MAX_FLOOR];
  const floorCard = f => {
    const done = camp.cleared[f]; const cur = !done && f === camp.floor;
    return `<div class="andar ${done ? 'feito' : cur ? 'atual' : 'bloq'}"><b>${f}</b><span>${done ? 'Concluído' : cur ? 'Próximo' : 'Bloqueado'}</span>${done ? `<button class="botao discreto" data-floor="${f}" data-revisit="1" aria-label="Revisitar o andar ${f}" title="Revisitar o andar ${f}" ${camp.acts.descer || camp.run ? 'disabled' : ''}>${bi('revisitar')}<span class="rev-txt">Revisitar</span></button>` : ''}</div>`;
  };
  const floors = Object.entries(R.GRUPOS).filter(([g]) => +g === 1 || camp.cleared[5]).map(([g, G]) => `<div class="grupo-andares"><h3>${esc(G.nome)}</h3><div class="andares">${G.andares.map(floorCard).join('')}</div></div>`).join('');
  const mainBtn = camp.run ? `<button class="botao principal" data-act="continue-run">${bi('descer')}Continuar descida (andar ${camp.run.floor})</button>`
    : allDone ? `<p class="destaque">A Forja Esquecida está para trás. Lá embaixo o calor some, e Ergos espera no frio. O caminho segue mais fundo.</p>`
    : camp.acts.descer ? `<button class="botao principal" disabled>${bi('descer')}Você já desceu hoje</button>`
    : `<button class="botao principal" data-floor="${next}" ${valid ? '' : 'disabled'}>${bi('descer')}Descer ao andar ${next}</button>`;
  const cab = `<h1>Dragão Amarelo</h1><p class="sub">${camp.name ? `Guilda de ${esc(camp.name)} · ` : ''}${esc(R.GRUPOS[R.grupoDo(next)].nome)}</p>`;
  $('#app').innerHTML = `${gearBtn()}${HAS_IMG('warroom') ? `<header class="guilda-hero" role="img" aria-label="Sala de guerra da guilda: mesa com mapa, lareira acesa e Felix dormindo na poltrona"><div>${cab}</div></header>` : `<header class="abertura">${cab}</header>`}
    <section class="painel-camp">
      <p class="camp-linha">Dia ${camp.day} · <b class="ouro">${camp.gold} de ouro</b> · Deck de ${esc(DISC_NAME[camp.deck.disc])}: ${R.deckSize(camp.deck)}/30${valid ? '' : ' (precisa de ajuste)'} · Coleção: ${collectionSize()} cartas</p>
      ${guildStatus()}
      ${camp.debt && camp.debt.due != null ? `<p class="parcela ${debtOpen() ? (camp.debt.due - camp.day <= 1 ? 'urgente' : '') : 'paga'}">${debtOpen() ? `Parcela da dívida: <b>${camp.debt.amount} de ouro</b> até o fim do dia ${camp.debt.due}${camp.debt.due === camp.day ? ' (hoje!)' : ''}. Pague no Banco da Coroa, na cidade.` : `Parcela de ${camp.debt.amount} de ouro paga no dia ${camp.debt.paidDay}.`}</p>` : ''}
      ${camp.quests && camp.quests.length ? `<div class="quests"><b>Quests:</b> ${camp.quests.map(q => `<span class="quest ${q.done ? 'feita' : ''}" title="${esc(q.desc)}">${esc(q.title)}${q.done ? ' (concluída)' : ''}</span>`).join('')}</div>` : ''}
      ${floors}
      <div class="acoes-setup">${mainBtn}</div>
      <div class="linha-logs guilda-botoes"><button class="botao" data-act="g-felix">${bi('felix')}Falar com Felix</button><button class="botao" data-act="g-cidade" ${camp.run || camp.acts.npc ? 'disabled' : ''}>${bi('cidade')}${camp.acts.npc ? 'Você já foi à cidade hoje' : 'Ir à cidade'}</button>${camp.fac.quadro === 'ativo' ? `<button class="botao" data-act="g-quadro">${bi('quadro')}Quadro de Missões</button>` : ''}${camp.flags.facilities ? `<button class="botao" data-act="g-instalacoes">${bi('instalacoes')}Instalações</button>` : ''}${camp.fac.taverna === 'ativa' ? `<button class="botao" data-act="g-taverna">${bi('taverna')}Taverna</button>` : ''}<button class="botao principal-2" data-act="g-end-day" ${camp.run ? 'disabled' : ''}>${bi('dia')}Encerrar o dia</button></div>
      <div class="linha-logs"><button class="botao" data-act="deck-edit" ${camp.run ? 'disabled title="Disponível entre descidas"' : ''}>${bi('deck')}Editar deck</button><button class="botao" data-act="deck-social" ${camp.run ? 'disabled' : ''}>${bi('social')}Editar deck social</button><button class="botao" data-act="camp-notes">${bi('notas')}Notas de Ergos (${camp.notes.length}/5)</button><button class="botao" data-act="avulsa">${bi('avulsa')}Batalha avulsa</button><button class="botao" data-act="to-title">${bi('inicio')}Tela inicial</button></div>
    </section>
    ${logsHtml()}`;
}
function statsMini(d) {
  if (d.type === 'unit') return `<span class="lc-stats" aria-label="${d.social ? 'Peso' : 'Ataque'} ${d.atk}, ${d.social ? 'Firmeza' : 'Vida'} ${d.hp}"><b class="atk">${d.atk}</b><b class="hp">${d.hp}</b></span>`;
  if (d.type === 'weapon') return `<span class="lc-stats" aria-label="Ataque ${d.atk}, usos ${d.hp}"><b class="atk">${d.atk}</b><b class="dur">${d.hp}</b></span>`;
  if (d.type === 'structure') return `<span class="lc-stats" aria-label="${d.social ? 'Firmeza' : 'Vida'} ${d.hp}"><b class="hp">${d.hp}</b></span>`;
  return '<span class="lc-stats"></span>';
}
function renderCredits() {
  const A = typeof ART !== 'undefined' ? ART.authors : [];
  const total = A.reduce((n, a) => n + a.count, 0);
  const lista = A.slice().sort((a, b) => b.count - a.count).map(a => `<li>${a.url ? `<a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.name)}</a>` : esc(a.name)} (${a.count} ícone${a.count === 1 ? '' : 's'})${a.cc0 ? ', domínio público (CC0)' : ''}</li>`).join('');
  $('#app').innerHTML = `<header class="abertura"><h1>Créditos</h1><p class="intro">A arte atual é provisória: ícones sobre fundos gerados pelo próprio jogo, até a arte definitiva.</p></header>
  <section class="cena creditos">
    <h2>Ícones</h2>
    <p>Os ${total} ícones das cartas, dos inimigos e do mapa vêm do <a href="https://game-icons.net" target="_blank" rel="noopener">game-icons.net</a>, sob a licença <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener">Creative Commons Atribuição 3.0 (CC BY 3.0)</a>. Alterações: os ícones foram recoloridos, simplificados e combinados com fundos gerados pelo jogo.</p>
    <ul>${lista}</ul>
    <h2>Ilustrações</h2>
    <p>A fachada da guilda (tela inicial), Felix no balcão (introdução), a sala de guerra (guilda) e os retratos dos Mestres Chrome, Gun'Liao, Charles Goodwich, Mikeus, Yaven e Ko, além da arquivista Lerael Vane (cidade) e de Kryoret, o Azer da banca (Forja Esquecida) são ilustrações do projeto, enviadas pelo autor do jogo.</p>
    <h2>Fontes e bibliotecas</h2>
    <p>Fontes Alegreya e Alegreya Sans, de Juan Pablo del Peral (Huerta Tipográfica), sob a <a href="https://openfontlicense.org" target="_blank" rel="noopener">SIL Open Font License</a>, servidas pelo Google Fonts. Compactação dos logs com <a href="https://stuk.github.io/jszip/" target="_blank" rel="noopener">JSZip</a>, de Stuart Knightley e colaboradores, sob a licença MIT.</p>
    <div class="linha-logs"><button class="botao principal" data-act="settings">Voltar</button></div>
  </section>`;
}
const INTRO = [
  { icon: 'carta', paras: ['A carta chega numa terça-feira, com um selo de cera amarela já meio rachado.', '«{nome}, se esta carta chegou até você, é porque eu me atrasei. De novo.» Assinado: Ergos, seu tio.', 'O resto do papel é uma lista. Um prédio na Rua dos Caldeireiros. As licenças da guilda de aventureiros Dragão Amarelo. E uma dívida com um banqueiro da Coroa, com mais zeros do que você gostaria de contar.', 'Pelo jeito, você herdou tudo. Inclusive a dívida.'] },
  { icon: 'felix', paras: ['O prédio da guilda cheira a poeira, cerveja velha e alguma coisa queimada. No balcão, um gato de asas abre um olho só.'], fala: ['Então você é {nome}. Ergos falava de você. Pouco, mas falava.', 'Sou Felix, o familiar dele. Sim, eu falo. Não, não vou fazer isso em festas.'] },
  { icon: 'buraco', paras: ['Felix aponta com o rabo para um alçapão atrás do balcão. Do buraco sobe um ar frio que não combina com a estação.'], fala: ['Seu tio não morreu. Ele desceu.', 'Embaixo da guilda tem uma dungeon. Ela foi aberta com o sangue da família, então só alguém da família chega ao fim dela. Ergos desceu há semanas e não voltou. Ele está preso lá embaixo. Eu sinto isso.', 'Então, tecnicamente, sobrou para você.'] },
  { icon: 'segredo', paras: ['Felix fica em silêncio por um tempo, o que você logo vai descobrir que é raro.'], fala: ['Ele dizia que no fundo tem a resposta para um problema que o mundo inteiro finge que não existe. Não me pergunte qual.', 'Quando falava disso, ele parava de fazer piada. E o Ergos nunca para de fazer piada.'] },
  { icon: 'felix', paras: ['Felix pula do balcão e empurra com a pata uma caixa de madeira. Dentro, um baralho gasto, de bordas douradas.'], fala: ['Sua família nunca desceu sozinha. Desde os tempos antigos, os felinos lutam ao lado dela. Ninguém lembra mais quem adotou quem.', 'Hoje eles atendem pela magia das cartas: você chama, eles vêm. E vêm felizes, o que, para um gato, é quase um escândalo.', 'Estas são as cartas básicas, os aliados da família. Guardiões, curandeiras, coletores, lanceiros, as ferramentas de sempre e eu, claro. Estou no baralho também. Não comente.'] },
];
const HAS_IMG = k => typeof IMG !== 'undefined' && !!IMG[k];
function felixArt(fallbackIcon) { return HAS_IMG('felix') ? '<div class="intro-arte" role="img" aria-label="Felix, um gato preto de asas, sentado no balcão da guilda entre livros e pergaminhos"></div>' : `<div class="intro-ico felix">${iconSvg(ART.ui[fallbackIcon || 'felix'])}</div>`; }
function introName() { return (ui.intro && ui.intro.name) || ''; }
function renderIntro() {
  const it = ui.intro; const step = it.step; const nome = esc(introName());
  const fill = t => esc(t).replace(/\{nome\}/g, `<b>${nome}</b>`);
  const pular = '<button class="botao discreto" data-act="intro-skip">Pular introdução</button>';
  let body;
  if (step === 0) {
    body = `<div class="intro-ico">${iconSvg(ART.ui.carta)}</div><h2>Antes de tudo</h2><p>Como você se chama?</p>
      <div class="linha-logs"><label for="intro-nome" class="sr">Seu nome</label><input id="intro-nome" type="text" maxlength="24" value="${nome}" placeholder="Seu nome" autocomplete="off"></div>
      <div class="intro-botoes"><button class="botao" data-act="to-title">Voltar</button><button class="botao principal" data-act="intro-next">Continuar</button></div>`;
  } else if (step <= INTRO.length) {
    const sc = INTRO[step - 1];
    body = `${sc.fala ? felixArt(sc.icon) : `<div class="intro-ico">${iconSvg(ART.ui[sc.icon])}</div>`}${sc.paras.map(p => `<p>${fill(p)}</p>`).join('')}${sc.fala ? `<div class="fala"><span class="quem">Felix</span>${sc.fala.map(f => `<p>${fill(f)}</p>`).join('')}</div>` : ''}
      <div class="intro-botoes"><button class="botao" data-act="intro-back">Voltar</button>${pular}<button class="botao principal" data-act="intro-next">Continuar</button></div>`;
  } else if (!camp) {
    const discs = Object.entries(E.DISC).map(([id, d]) => `<button class="opcao disc-${id} ${ui.newDisc === id ? 'escolhida' : ''}" data-newdisc="${id}" aria-pressed="${ui.newDisc === id}"><span class="opcao-nome">${esc(d.name)}</span><span class="opcao-papel">${esc(d.role)}</span><span class="opcao-texto">${esc(d.plan)}</span></button>`).join('');
    body = `${felixArt('disciplinas')}<div class="fala"><span class="quem">Felix</span><p>Os felinos vão com você em qualquer caminho. Mas, antes de descer, Ergos deixou anotações sobre seis Disciplinas de combate, e o seu sangue vai responder a uma delas.</p><p>Escolha com calma. Ou não: ele também não escolheu com calma.</p></div>
      <p class="intro-dica">Você começa com 30 cartas: 20 básicas, os aliados da família, e 10 da Disciplina escolhida. O resto vem de boosters e recompensas.</p>
      <div class="grade-disc">${discs}</div>
      <div class="intro-botoes"><button class="botao" data-act="intro-back">Voltar</button><button class="botao principal" data-act="intro-finish" ${ui.newDisc ? '' : 'disabled'}>Entrar na guilda</button></div>`;
  } else {
    body = `${felixArt('guilda')}<div class="fala"><span class="quem">Felix</span><p>A julgar pela poeira no seu sapato, você já desceu algumas vezes. Ótimo: menos explicação.</p></div>
      <div class="intro-botoes"><button class="botao" data-act="intro-back">Voltar</button><button class="botao principal" data-act="intro-finish">Entrar na guilda</button></div>`;
  }
  $('#app').innerHTML = `<section class="cena intro-cena${step > INTRO.length && !camp ? ' larga' : ''}" aria-live="polite">${body}</section>`;
  const inp = $('#intro-nome'); if (inp) { inp.focus(); inp.addEventListener('input', () => { ui.intro.name = inp.value; }); inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); runClick({ act: 'intro-next' }); } }); }
}
function renderTitle() {
  const save = camp ? `${camp.name ? esc(camp.name) + ', ' : ''}dia ${camp.day}, ${camp.cleared[R.MAX_FLOOR] ? 'Forja concluída' : 'andar ' + Math.min(camp.floor, R.MAX_FLOOR)}${camp.run ? ' (descida em andamento)' : ''}` : 'Nenhum jogo salvo.';
  const arte = HAS_IMG('guilda');
  $('#app').innerHTML = `${gearBtn()}<section class="titulo-tela${arte ? ' com-arte' : ''}">
    ${arte ? '<div class="titulo-fundo" role="img" aria-label="Fachada da guilda Dragão Amarelo à noite, com a placa iluminada e as janelas acesas"></div>' : `<div class="titulo-ico">${iconSvg(typeof ART !== 'undefined' ? ART.ui.titulo : null)}</div>`}
    <h1${arte ? ' class="sr"' : ''}>Dragão Amarelo</h1>
    <p class="sub">Uma guilda, uma dívida e um mistério.</p>
    <div class="titulo-botoes">
      <button class="botao principal" data-act="title-continue" ${camp ? '' : 'disabled'}>Continuar</button>
      <button class="botao" data-act="title-guild">Entrar na guilda</button>
    </div>
    <p class="titulo-save">${save}</p>
    <p class="titulo-rodape">Protótipo, ${esc(RULES)}</p>
  </section>`;
}
/* ===== Códigos secretos e menu de testes ===== */
const LS_CHEAT = 'dragao-amarelo-cheats-v1';
const CODES = { sanerionTestMode1337: 'testes' };
var cheats = lsGet(LS_CHEAT, { unlocked: false, unlimited: false });
function saveCheats() { lsSet(LS_CHEAT, cheats); }
function markCheat(what) { if (!camp) return; camp.cheatUsed = true; hist({ k: 'cheat', what }); saveCamp(); }
function useCode(raw) {
  const code = (raw || '').trim();
  const hit = Object.keys(CODES).find(k => k.toLowerCase() === code.toLowerCase());
  if (!hit) { toast('Código inválido.'); return; }
  if (CODES[hit] === 'testes') { cheats.unlocked = true; saveCheats(); toast('Modo de testes liberado.'); ui.screen = 'cheats'; render(); window.scrollTo(0, 0); }
}
function playerCards() { return Object.keys(R.RARITY).sort((a, b) => ((E.DEF[a].disc || 'neutra').localeCompare(E.DEF[b].disc || 'neutra')) || E.DEF[a].name.localeCompare(E.DEF[b].name)); }
function renderCheats() {
  const num = (id, val, act, label, extra) => `<div class="cheat-linha"><label for="${id}">${label}</label><input id="${id}" type="number" value="${val}" ${extra || ''}><button class="botao" data-act="${act}">Aplicar</button></div>`;
  const btn = (act, label, dis) => `<button class="botao" data-act="${act}" ${dis ? 'disabled' : ''}>${label}</button>`;
  let body;
  if (!camp) body = '<p>Não há campanha salva. Comece uma campanha para usar os testes de guilda e coleção.</p>';
  else {
    ensureGuild();
    const opts = playerCards().map(id => `<option value="${id}" ${ui.chCard === id ? 'selected' : ''}>${esc(DISC_NAME[E.DEF[id].disc || 'neutra'] || 'Neutra')} · ${esc(E.DEF[id].name)} (${camp.collection[id] || 0})</option>`).join('');
    const nCleared = Object.keys(camp.cleared).length;
    body = `<h2>Valores</h2>
      ${num('ch-gold', camp.gold, 'ch-gold', 'Ouro')}
      ${num('ch-day', camp.day, 'ch-day', 'Dia', 'min="1"')}
      <div class="cheat-linha"><label for="ch-floor">Andares concluídos</label><select id="ch-floor">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `<option value="${n}" ${n === nCleared ? 'selected' : ''}>${n}</option>`).join('')}</select><button class="botao" data-act="ch-floor">Aplicar</button></div>
      ${camp.run ? num('ch-hp', camp.run.hp, 'ch-hp', 'Vida na descida', 'min="1" max="30"') : ''}
      <div class="cheat-linha"><label for="ch-aloj">Nível do Alojamento</label><select id="ch-aloj">${[0, 1, 2, 3].map(n => `<option value="${n}" ${n === (camp.fac.alojamento || 0) ? 'selected' : ''}>${n}</option>`).join('')}</select><button class="botao" data-act="ch-aloj">Aplicar</button></div>
      <div class="cheat-linha"><label for="ch-card">Carta</label><select id="ch-card">${opts}</select><button class="botao" data-act="ch-card-add">+1</button><button class="botao" data-act="ch-card-rem">−1</button></div>
      <div class="linha-logs">${btn('ch-all-cards', 'Coleção completa (2 de cada)')}${btn('ch-all-social', 'Coleção social completa (2 de cada)')}</div>
      <h2>Ações do dia</h2>
      <div class="cheat-linha"><label class="cheat-check"><input type="checkbox" data-act="ch-unlimited" ${cheats.unlimited ? 'checked' : ''}> Ações ilimitadas (descer, visita, despacho e obra não se gastam)</label></div>
      <div class="linha-logs">${btn('ch-reset-acts', 'Restaurar as ações de hoje')}${btn('ch-end-day', 'Encerrar o dia agora', !!camp.run)}</div>
      <h2>Eventos e guilda</h2>
      <div class="linha-logs">${btn('ch-ev-adv', 'Chegada do primeiro aventureiro')}${btn('ch-ev-taverna', 'Sugestão da taverna')}${btn('ch-ev-def', 'Defesa agora', !!camp.run)}${btn('ch-ev-social', 'Negociação do cliente (tutorial social)', !!camp.run)}</div>
      <div class="linha-logs">${btn('ch-unlock', 'Liberar Quadro, Instalações e Taverna')}${btn('ch-build-now', 'Concluir a obra agora', !camp.building)}${btn('ch-missions-now', 'Resolver missões agora', !camp.advs.some(a => a.status !== 'livre'))}</div>
      <div class="linha-logs">${btn('ch-refresh', 'Novos pedidos e candidatos')}${btn('ch-free-adv', 'Aventureiro grátis')}${btn('ch-adv-up', 'Subir o nível dos aventureiros')}</div>
      <p class="intro-dica">Tudo o que for feito aqui marca a campanha como “com testes” no log, para não misturar com partidas normais na análise.</p>`;
  }
  $('#app').innerHTML = `${gearBtn()}<header class="abertura"><h1>Menu de testes</h1><p class="sub">${camp ? `Dia ${camp.day} · ${camp.gold} de ouro${camp.cheatUsed ? ' · campanha com testes' : ''}` : 'Sem campanha'}</p></header>
  <section class="cena larga config cheats">${body}
  <div class="linha-logs">${camp ? '<button class="botao principal" data-act="home">Ir para a guilda</button>' : ''}<button class="botao" data-act="settings">Configurações</button><button class="botao" data-act="ch-lock">Desativar modo de testes</button></div></section>`;
}
async function cheatClick(act) {
  const val = id => { const el = $('#' + id); return el ? el.value : null; };
  const done = (msg, what) => { markCheat(what || act); render(); toast(msg); return true; };
  if (act === 'ch-lock') { cheats = { unlocked: false, unlimited: false }; saveCheats(); ui.screen = 'settings'; render(); toast('Modo de testes desativado.'); return true; }
  if (act === 'ch-unlimited') { cheats.unlimited = !cheats.unlimited; saveCheats(); if (cheats.unlimited && camp) { camp.acts = {}; markCheat('ações ilimitadas'); } render(); toast(cheats.unlimited ? 'Ações ilimitadas ligadas.' : 'Ações ilimitadas desligadas.'); return true; }
  if (!camp) return true;
  ensureGuild();
  if (act === 'ch-gold') { camp.gold = Math.max(0, Math.floor(+val('ch-gold') || 0)); return done(`Ouro: ${camp.gold}.`, 'ouro'); }
  if (act === 'ch-day') { camp.day = Math.max(1, Math.floor(+val('ch-day') || 1)); return done(`Dia: ${camp.day}.`, 'dia'); }
  if (act === 'ch-hp' && camp.run) { camp.run.hp = Math.max(1, Math.min(30, Math.floor(+val('ch-hp') || 1))); return done(`Vida na descida: ${camp.run.hp}.`, 'vida'); }
  if (act === 'ch-floor') { const n = +val('ch-floor'); camp.cleared = {}; for (let f = 1; f <= n; f++) camp.cleared[f] = true; camp.floor = n + 1; return done(`Andares concluídos: ${n}.`, 'andares'); }
  if (act === 'ch-aloj') { camp.fac.alojamento = +val('ch-aloj'); return done(`Alojamento no nível ${camp.fac.alojamento}: cabem ${advMax()} aventureiros.`, 'alojamento'); }
  if (act === 'ch-card-add' || act === 'ch-card-rem') {
    const id = val('ch-card'); ui.chCard = id; const d = act === 'ch-card-add' ? 1 : -1;
    camp.collection[id] = Math.max(0, (camp.collection[id] || 0) + d); if (!camp.collection[id]) delete camp.collection[id];
    if (camp.deck.cards[id] > (camp.collection[id] || 0)) { if (camp.collection[id]) camp.deck.cards[id] = camp.collection[id]; else delete camp.deck.cards[id]; }
    markCheat('carta'); toast(`${E.DEF[id].name}: ${camp.collection[id] || 0} na coleção.`); return true;
  }
  if (act === 'ch-all-cards') { playerCards().forEach(id => { camp.collection[id] = Math.max(2, camp.collection[id] || 0); }); return done('Coleção completa: 2 de cada carta.', 'colecao'); }
  if (act === 'ch-all-social') { ensureSocial(); Object.keys(E.DEF).filter(id => E.DEF[id].social && id.startsWith('s_') && !E.DEF[id].token).forEach(id => { camp.socialColl[id] = Math.max(2, camp.socialColl[id] || 0); }); return done('Coleção social completa: 2 de cada carta.', 'colecao social'); }
  if (act === 'ch-ev-social') { if (camp.run) return true; ensureSocial(); camp.pending = camp.pending.filter(p => p.kind !== 'cliente-tutorial'); camp.pending.unshift({ kind: 'cliente-tutorial' }); markCheat('evento social'); ui.screen = 'home'; render(); return true; }
  if (act === 'ch-reset-acts') { camp.acts = {}; return done('Ações de hoje restauradas.', 'acoes'); }
  if (act === 'ch-end-day') { if (camp.run) return true; markCheat('encerrar dia'); endDay(); return true; }
  if (act === 'ch-ev-adv') { camp.flags.firstAdv = false; camp.pending = camp.pending.filter(p => p.kind !== 'primeiro-aventureiro'); camp.pending.unshift({ kind: 'primeiro-aventureiro' }); markCheat('evento aventureiro'); ui.screen = 'home'; render(); return true; }
  if (act === 'ch-ev-taverna') { camp.pending = camp.pending.filter(p => p.kind !== 'sugestao-taverna'); camp.pending.unshift({ kind: 'sugestao-taverna' }); markCheat('evento taverna'); ui.screen = 'home'; render(); return true; }
  if (act === 'ch-ev-def') { if (camp.run) return true; camp.defense = newDefense(); camp.pending = camp.pending.filter(p => p.kind !== 'defesa'); camp.pending.unshift({ kind: 'defesa' }); markCheat('evento defesa'); ui.screen = 'home'; render(); return true; }
  if (act === 'ch-unlock') { camp.flags.firstAdv = true; camp.flags.facilities = true; camp.fac.quadro = 'ativo'; if (camp.fac.taverna !== 'ativa') { camp.fac.taverna = 'ativa'; camp.recruits = []; } camp.pending = camp.pending.filter(p => p.kind === 'defesa'); refreshBoard(); return done('Quadro, Instalações e Taverna liberados.', 'liberar guilda'); }
  if (act === 'ch-build-now') { const lines = []; finishBuilding(lines); markCheat('obra agora'); ui.scene = { kind: 'msg', title: 'Obra concluída', text: lines.join(' ') || 'Nenhuma obra em andamento.' }; ui.screen = 'scene'; render(); return true; }
  if (act === 'ch-missions-now') { camp.advs.forEach(a => { if (a.status !== 'livre') a.days = 1; }); const lines = []; processAdvs(lines); markCheat('missões agora'); ui.scene = { kind: 'msg', title: 'Missões resolvidas', text: lines.join(' ') || 'Ninguém estava fora.' }; ui.screen = 'scene'; render(); return true; }
  if (act === 'ch-refresh') { camp.missions = camp.missions.filter(m => m.taken); if (camp.fac.taverna === 'ativa') camp.recruits = []; refreshBoard(); return done('Novos pedidos e candidatos.', 'renovar'); }
  if (act === 'ch-free-adv') { const a = newAdv(); camp.advs.push(a); return done(`${a.name} (${advClass(a)}) entrou para a guilda.`, 'aventureiro grátis'); }
  if (act === 'ch-adv-up') { camp.advs.forEach(a => { if (a.lvl < 5) { a.lvl += 1; a.xp = 0; } }); return done('Todos os aventureiros subiram um nível.', 'nível aventureiros'); }
  return false;
}
function renderSettings() {
  $('#app').innerHTML = `<header class="abertura"><h1>Configurações</h1></header>
  <section class="cena config">
    <div class="config-item"><div><h2>Créditos</h2><p>Autores dos ícones, fontes e bibliotecas.</p></div><button class="botao" data-act="credits">Ver créditos</button></div>
    <div class="config-item"><div><h2>Códigos secretos</h2><p>${cheats.unlocked ? 'Modo de testes liberado.' : 'Tem um código? Digite aqui.'}</p></div><div class="cheat-codigo"><label class="sr" for="codigo">Código</label><input id="codigo" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Código"><button class="botao" data-act="code">Usar</button>${cheats.unlocked ? '<button class="botao" data-act="cheats">Menu de testes</button>' : ''}</div></div>
    <div class="config-item perigo"><div><h2>Apagar save</h2><p>${camp ? 'Apaga a campanha: nome, coleção, deck e progresso. Os logs de partidas continuam guardados para exportação.' : 'Não há jogo salvo.'}</p></div><button class="botao" data-act="save-delete" ${camp ? '' : 'disabled'}>Apagar save</button></div>
    <div class="linha-logs"><button class="botao principal" data-act="settings-back">Voltar</button></div>
  </section>`;
  const ci = $('#codigo'); if (ci) ci.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); useCode(ci.value); } });
}
const isSocialEd = () => ui.deckKind === 'social';
const curDeck = () => (isSocialEd() ? camp.social : camp.deck);
const curColl = () => (isSocialEd() ? camp.socialColl : camp.collection);
function renderDeck() {
  const SOCED = isSocialEd(); if (SOCED) ensureSocial();
  const deck = curDeck(), coll = curColl();
  const probs = SOCED ? socialProblems() : R.deckProblems(deck, coll);
  const discs = SOCED ? R.DISCS.filter(d => d === deck.disc || Object.keys(camp.socialColl).some(id => camp.socialColl[id] > 0 && E.DEF[id].disc === d)) : ownedDiscs();
  const TOT = SOCED ? 20 : 30;
  const inDeck = id => deck.cards[id] || 0;
  const sortC = (a, b) => E.DEF[a].cost - E.DEF[b].cost || E.DEF[a].name.localeCompare(E.DEF[b].name);
  const row = (id, side) => {
    const d = E.DEF[id]; const own = coll[id] || 0; const k = inDeck(id);
    const canAdd = k < 2 && k < own && (!d.disc || d.disc === 'neutra' || d.disc === deck.disc);
    const btn = side === 'deck' ? `<button class="botao discreto" data-deckrem="${id}" aria-label="Tirar ${esc(d.name)}">Tirar</button>` : `<button class="botao discreto" data-deckadd="${id}" ${canAdd ? '' : 'disabled'} aria-label="Pôr ${esc(d.name)}">Pôr</button>`;
    const count = side === 'deck' ? `×${k}` : `${k}/${own}`;
    return `<li class="linha-carta disc-${d.disc || 'neutra'}" data-info="d:${id}"><span class="lc-custo">${d.cost}</span><span class="lc-nome"><span class="lc-ico">${iconSvg(cardIconName(id))}</span>${esc(d.name)} ${rarTag(id)}<span class="lc-tipo">${d.module ? typeLabel(d) + ' (Módulo)' : typeLabel(d) + (d.tags.length ? ' (' + d.tags.join(', ') + ')' : '')}</span><small>${d.text ? fmtText(d.text, true) : ''}</small></span>${statsMini(d)}<span class="lc-qtd">${count}</span>${btn}</li>`;
  };
  const deckIds = Object.keys(deck.cards).filter(id => deck.cards[id] > 0).sort(sortC);
  const f = ui.deckFilter;
  const collIds = Object.keys(coll).filter(id => coll[id] > 0 && (f === 'todas' || (f === 'neutra' ? (E.DEF[id].disc || 'neutra') === 'neutra' : E.DEF[id].disc === deck.disc))).sort(sortC);
  const curve = [0, 0, 0, 0, 0, 0, 0, 0];
  deckIds.forEach(id => { curve[Math.min(7, E.DEF[id].cost)] += deck.cards[id]; });
  const mx = Math.max(1, ...curve);
  $('#app').innerHTML = `<header class="abertura"><h1>${SOCED ? 'Editar deck social' : 'Editar deck'}</h1><p class="intro">${SOCED ? '20 cartas, até 2 cópias, uma Disciplina mais básicas. A Disciplina do deck social pode ser diferente da do deck de batalha. Novas cartas sociais vêm de passar o tempo com os NPCs da cidade.' : '30 cartas, até 2 cópias, uma Disciplina mais neutras.'}</p></header>
    <div class="linha-logs"><button class="botao principal" data-act="deck-back">Voltar</button>
      <span>Disciplina:</span>${discs.map(d => `<button class="botao ${d === deck.disc ? 'principal' : ''} disc-${d}" data-deckdisc="${d}">${esc(DISC_NAME[d])}</button>`).join('')}<button class="botao" data-act="${SOCED ? 'deck-edit' : 'deck-social'}">${SOCED ? 'Ir para o deck de batalha' : 'Ir para o deck social'}</button></div>
    <p class="camp-linha ${probs.length ? 'erro' : 'ok'}">${R.deckSize(deck)}/${TOT} cartas. ${probs.length ? esc(probs[0]) : SOCED ? 'Deck social pronto para negociar.' : 'Deck pronto para descer.'}</p>
    <div class="curva ${SOCED ? 'social' : ''}" aria-label="${SOCED ? 'Curva de Lábia' : 'Curva de mana'}">${curve.map((n, i) => `<div><i style="height:${Math.round(48 * n / mx)}px"></i><span>${i === 7 ? '7+' : i}</span><small>${n}</small></div>`).join('')}</div>
    <div class="editor">
      <section><div class="linha-logs"><h2 style="margin:0">Deck</h2><button class="botao discreto" data-act="deck-clear" ${R.deckSize(deck) ? '' : 'disabled'}>Limpar deck</button></div><ul class="lista-cartas">${deckIds.map(id => row(id, 'deck')).join('') || '<li class="vazio">Vazio</li>'}</ul></section>
      <section><h2>Coleção</h2><div class="linha-logs">${[['disc', DISC_NAME[deck.disc]], ['neutra', SOCED ? 'Básicas' : 'Neutras'], ['todas', 'Todas']].map(([k, l]) => `<button class="botao ${f === k ? 'principal' : ''}" data-deckfilter="${k}">${esc(l)}</button>`).join('')}</div>
        <ul class="lista-cartas">${collIds.map(id => row(id, 'coll')).join('') || '<li class="vazio">Nada aqui ainda</li>'}</ul></section>
    </div>`;
}
function renderMap() {
  const run = camp.run; const m = run.map; const H = 84;
  const pos = n => ({ x: ((n.col + 0.5) / m.cols) * 100, y: (m.rows - n.row) * H + H / 2 });
  const cur = run.pos == null ? null : m.nodes[run.pos];
  const avail = run.inBattle ? [] : (cur ? cur.next : m.nodes.filter(n => n.row === 0).map(n => n.id));
  const pathEdges = new Set(); for (let i = 0; i + 1 < run.visited.length; i++) pathEdges.add(run.visited[i] + '-' + run.visited[i + 1]);
  const lines = m.nodes.flatMap(n => n.next.map(j => { const a = pos(n), b = pos(m.nodes[j]); return `<line x1="${a.x}%" y1="${a.y}" x2="${b.x}%" y2="${b.y}" class="${pathEdges.has(n.id + '-' + j) ? 'feita' : ''}"/>`; })).join('');
  const encName = id => id ? E.ENC[id].name : '';
  const nodes = m.nodes.map(n => {
    const p = pos(n); const info = R.NODE[n.type];
    const st8 = run.visited.includes(n.id) ? 'visto' : avail.includes(n.id) ? 'livre' : 'bloq';
    const title = info.label + ((n.type === 'elite' || n.type === 'chefe') && n.enc ? ': ' + encName(n.enc) : '');
    return `<button class="no no-${n.type} ${st8} ${n.id === run.pos ? 'aqui' : ''} ${n.final ? 'final' : ''}" style="left:${p.x}%;top:${p.y}px" ${st8 === 'livre' ? `data-node="${n.id}"` : 'tabindex="-1"'} title="${esc(title)}" aria-label="${esc(title)}">${iconSvg(typeof ART !== 'undefined' ? ART.node[n.type] : null) || `<span>${info.icon}</span>`}</button>`;
  }).join('');
  const bonus = []; if (run.bonus.hand) bonus.push(`+${run.bonus.hand} carta na próxima luta`); if (run.bonus.mana) bonus.push(`+${run.bonus.mana} de mana máxima na próxima luta`);
  const resume = run.inBattle ? `<div class="faixa"><span>Uma luta ficou pela metade.</span><button class="botao principal" data-act="run-resume">Retomar a luta</button></div>` : '';
  $('#app').innerHTML = `<header class="abertura"><h1>Andar ${run.floor}${run.revisit ? ' (revisita)' : ''}</h1><p class="sub">${esc(R.GRUPOS[R.grupoDo(run.floor)].nome)}, dia ${camp.day}</p></header>
    <section class="painel-camp mapa-topo">
      <span class="voce-vida"><b>${run.hp}</b><span class="conta">de 30</span><span class="barra"><i style="width:${Math.round(100 * run.hp / 30)}%"></i></span></span>
      <span title="${esc(run.mochila.map(id => E.DEF[id].name).join(', '))}">${run.floor >= 6 ? `Sucata: ${run.sucata || 0} · ` : ''}Mochila: ${run.mochila.length} carta${run.mochila.length === 1 ? '' : 's'}</span>
      <span class="ouro">Ouro na descida: ${run.gold || 0}</span>
      ${bonus.length ? `<span class="destaque">${esc(bonus.join('; '))}</span>` : ''}
      <button class="botao" data-act="run-giveup">Desistir da descida</button>
    </section>
    ${resume}
    <p class="intro centro">Escolha o próximo passo. O caminho sobe; o topo fecha o andar.</p>
    <div class="mapa" style="height:${(m.rows + 1) * H}px"><svg class="mapa-linhas" width="100%" height="${(m.rows + 1) * H}" aria-hidden="true">${lines}</svg>${nodes}</div>
    <p class="legenda">${Object.entries(R.NODE).map(([k, n]) => `<span>${iconSvg(typeof ART !== 'undefined' ? ART.node[k] : null, 'ico-leg') || n.icon} ${n.label}</span>`).join('')}</p>`;
}
function renderScene() {
  const sc = ui.scene; let body = '';
  if (sc.kind === 'event') {
    body = `<h2>${esc(sc.ev.title)}</h2><p>${esc(sc.ev.text)}</p>` + (sc.result ? `<p class="destaque">${esc(sc.result)}</p><div class="opcoes"><button class="botao principal" data-act="scene-ok">Continuar</button></div>`
      : `<div class="opcoes coluna">${sc.ev.choices.map(c => `<button class="botao" data-evc="${c.id}">${esc(c.label)}</button>`).join('')}</div>`);
  } else if (sc.kind === 'treasure') {
    body = `<h2>Tesouro</h2><div class="prever-lista">${cardById(sc.card)}</div><p class="destaque">${esc(sc.text)}</p><div class="opcoes"><button class="botao principal" data-act="scene-ok">Continuar</button></div>`;
  } else if (sc.kind === 'camp') {
    body = `<h2>Acampamento</h2><p>Uma fenda seca, longe dos cogumelos. Felix já se acomodou na sua mochila.</p><div class="opcoes coluna"><button class="botao" data-evc="descansar">Descansar (recupere ${camp.run && camp.run.floor >= 6 ? 10 : 12} de Vida)</button><button class="botao" data-evc="preparar">Preparar (na próxima luta, comece com 1 carta a mais)</button></div>`;
  } else if (sc.kind === 'nota') {
    body = `<h2>Nota de Ergos</h2><blockquote class="nota">${esc(R.NOTES[sc.floor])}</blockquote><p class="destaque">${sc.first ? 'Felix guarda a anotação. Na próxima luta, comece com 1 carta a mais.' : 'Você já leu esta nota.'}</p><div class="opcoes"><button class="botao principal" data-act="scene-ok">Continuar</button></div>`;
  } else if (sc.kind === 'elite') {
    body = `<h2>Recompensa da Elite</h2><p>Escolha uma carta para a mochila.</p><div class="prever-lista">${sc.cards.map(id => { const [t, c] = copiesNote(id); return cardById(id, '', `data-pick="${id}"`, t, c); }).join('')}</div><p class="intro-dica">O deck aceita até 2 cópias de cada carta; a contagem inclui o que já está na mochila.</p><div class="opcoes"><button class="botao" data-act="pick-skip">Pular</button></div>`;
  } else if (sc.kind === 'booster-choice') {
    body = `<h2>Andar ${sc.floor} concluído</h2><p>${sc.mochila.length ? `Da mochila para a coleção: ${esc(sc.mochila.map(id => E.DEF[id].name).join(', '))}.` : 'A mochila voltou vazia.'} Escolha o seu booster.</p>
      <div class="opcoes"><button class="botao principal disc-${camp.deck.disc}" data-pack="${camp.deck.disc}">Booster de ${esc(DISC_NAME[camp.deck.disc])}</button><button class="botao" data-pack="geral">Booster Geral</button></div>
      <p class="intro">Cada booster tem 5 cartas: 3 Comuns, 1 Incomum e 1 Incomum ou Rara. O Geral pode trazer qualquer Disciplina ou neutra.</p>`;
  } else if (sc.kind === 'booster') {
    const intro = sc.type === 'andar' ? `<h2>Andar ${sc.floor} concluído</h2><p>${sc.mochila.length ? `Da mochila para a coleção: ${esc(sc.mochila.map(id => E.DEF[id].name).join(', '))}.` : 'A mochila voltou vazia.'} Ouro das lutas: ${sc.gold}.</p>${sc.treasure ? `<p class="destaque">${sc.floor === 10 ? 'No coração apagado da forja, entre lingotes que Ignar guardava há séculos, você encontra o tesouro dele' : 'No covil do Basilisco, entre ossos e escamas trocadas, você encontra o tesouro dele'}: +${sc.treasure} de ouro.</p>` : ''}<h3>Booster do andar</h3><p class="intro-dica">2 cartas garantidas de ${esc(DISC_NAME[camp.deck.disc])} e 3 de qualquer Disciplina ou básicas, com mais chance de cartas que você ainda não tem.</p>` : `<h2>${sc.type === 'geral' ? 'Booster Geral' : 'Booster de ' + esc(DISC_NAME[sc.type])}</h2>`;
    const back = sc.back === 'npc' ? `<button class="botao principal" data-act="g-visit" data-npc="mestre-${sc.type}">Voltar ao mestre</button>` : '<button class="botao principal" data-act="home">Voltar à guilda</button>';
    body = `${intro}<div class="prever-lista">${sc.cards.map(id => cardById(id, '', '', camp.collection[id] > 1 ? '' : 'Nova')).join('')}</div><p class="destaque">As cartas já estão na sua coleção.</p><div class="opcoes">${back}<button class="botao" data-act="deck-edit">Editar deck</button></div>`;
  } else if (sc.kind === 'msg') {
    body = `<h2>${esc(sc.title)}</h2><p>${esc(sc.text)}</p><div class="opcoes"><button class="botao principal" data-act="${camp && camp.run ? 'scene-ok' : 'home'}">${camp && camp.run ? 'Continuar' : 'Voltar à guilda'}</button></div>`;
  } else if (sc.kind === 'notes') {
    body = `<h2>Notas de Ergos</h2>${camp.notes.length ? camp.notes.slice().sort().map(f => `<p class="linha">Andar ${f}</p><blockquote class="nota">${esc(R.NOTES[f])}</blockquote>`).join('') : '<p>Nenhuma nota ainda.</p>'}<div class="opcoes"><button class="botao principal" data-act="home">Voltar</button></div>`;
  }
  const gsc = guildScene(sc); if (gsc) body = gsc;
  const vida = camp && camp.run && ['event', 'camp', 'nota', 'treasure', 'elite'].includes(sc.kind) ? `<p class="vida-cena voce-vida"><b>${camp.run.hp}</b><span class="conta">de 30 de Vida</span><span class="barra"><i style="width:${Math.round(100 * camp.run.hp / 30)}%"></i></span></p>` : '';
  $('#app').innerHTML = `${camp && !camp.run ? gearBtn() : ''}<section class="cena">${vida}${body}</section>`;
}
function renderScreen() {
  if (ui.screen === 'title') renderTitle();
  else if (ui.screen === 'intro' && ui.intro) renderIntro();
  else if (ui.screen === 'settings') renderSettings();
  else if (ui.screen === 'cheats' && cheats.unlocked) renderCheats();
  else if (ui.screen === 'avulsa') renderSetup();
  else if (ui.screen === 'deck' && camp) renderDeck();
  else if (ui.screen === 'credits') renderCredits();
  else if (ui.screen === 'quadro' && camp) renderQuadro();
  else if (ui.screen === 'instalacoes' && camp) renderInstalacoes();
  else if (ui.screen === 'taverna' && camp) renderTaverna();
  else if (ui.screen === 'cidade' && camp) renderCidade();
  else if (ui.screen === 'npc' && camp && ui.npc) renderNpc();
  else if (ui.screen === 'felix' && camp) renderFelix();
  else if (ui.screen === 'map' && camp && camp.run) renderMap();
  else if (ui.screen === 'scene' && ui.scene) renderScene();
  else { ui.screen = 'home'; renderHome(); }
}
async function runClick(ds) {
  const act = ds.act;
  if (act && act.startsWith('g-') && camp && await guildClick(act, ds)) return true;
  if (act === 'def-continue') { finalizeGame(); defenseDone(); return true; }
  if (act === 'soc-continue') { finalizeGame(); socialDone(); return true; }
  if (act === 'pas-continue') { finalizeGame(); passeioFightDone(); return true; }
  if (act === 'deck-back') { const to = ui.deckFrom || 'home'; ui.deckFrom = null; ui.screen = (to === 'scene' && !ui.scene) || to === 'deck' ? 'home' : to; render(); window.scrollTo(0, 0); return true; }
  if (act === 'deck-social') { if (camp && camp.run) { toast('O deck só pode ser editado na guilda, entre descidas.'); return true; } if (ui.screen !== 'deck') ui.deckFrom = ui.screen; ensureSocial(); ui.deckKind = 'social'; ui.screen = 'deck'; ui.deckFilter = 'disc'; render(); window.scrollTo(0, 0); return true; }
  if (act === 'code') { useCode(($('#codigo') || {}).value); return true; }
  if (act === 'cheats') { if (cheats.unlocked) { ui.screen = 'cheats'; render(); window.scrollTo(0, 0); } return true; }
  if (act && act.startsWith('ch-') && cheats.unlocked && await cheatClick(act)) return true;
  if (ds.newdisc) { ui.newDisc = ds.newdisc; render(); return true; }
  if (act === 'camp-start') { if (ui.newDisc) { newCampaign(ui.newDisc); ui.screen = 'home'; render(); } return true; }
  if (act === 'camp-reset') { const c = await choose('Nova campanha', 'Apagar a campanha atual (coleção, deck e progresso)? Os logs de partida continuam guardados.', [{ v: 'sim', label: 'Apagar e recomeçar' }]); if (c === 'sim') { const old = lsGet(LS_OLD, []); old.push({ id: camp.id, created: camp.created, archivedAt: new Date().toISOString(), startDisc: camp.startDisc, day: camp.day, floor: camp.floor, cleared: camp.cleared, notes: camp.notes, deck: camp.deck, collection: camp.collection, history: camp.history }); while (!lsSet(LS_OLD, old) && old.length > 1) old.shift(); camp = null; lsDel(LS_CAMP); ui.newDisc = null; ui.screen = 'home'; render(); } return true; }
  if (act === 'avulsa') { ui.screen = 'avulsa'; render(); return true; }
  if (act === 'home') { ui.screen = 'home'; ui.scene = null; render(); window.scrollTo(0, 0); return true; }
  if (act === 'camp-notes') { ui.scene = { kind: 'notes' }; ui.screen = 'scene'; render(); return true; }
  if (act === 'credits') { ui.screen = 'credits'; render(); window.scrollTo(0, 0); return true; }
  if (act === 'settings') { if (ui.screen !== 'settings' && ui.screen !== 'credits') ui.settingsFrom = ui.screen; ui.screen = 'settings'; render(); window.scrollTo(0, 0); return true; }
  if (act === 'settings-back') { ui.screen = camp || ui.settingsFrom !== 'home' ? (ui.settingsFrom || 'title') : 'title'; render(); return true; }
  if (act === 'to-title') { ui.screen = 'title'; ui.intro = null; render(); window.scrollTo(0, 0); return true; }
  if (act === 'title-continue') { if (!camp) return true; ui.screen = camp.run ? 'map' : 'home'; render(); window.scrollTo(0, 0); return true; }
  if (act === 'title-guild') { if (camp && camp.introSeen) { ui.screen = 'home'; } else { ui.intro = { step: 0, name: (camp && camp.name) || '' }; ui.newDisc = null; ui.screen = 'intro'; } render(); window.scrollTo(0, 0); return true; }
  if (act === 'intro-next') {
    if (ui.intro.step === 0) { const v = (ui.intro.name || '').trim().replace(/\s+/g, ' '); if (!v) { toast('Escreva um nome para continuar.'); return true; } ui.intro.name = v; }
    ui.intro.step++; render(); window.scrollTo(0, 0); return true;
  }
  if (act === 'intro-back') { ui.intro.step = Math.max(0, ui.intro.step - 1); render(); window.scrollTo(0, 0); return true; }
  if (act === 'intro-skip') { ui.intro.step = INTRO.length + 1; render(); window.scrollTo(0, 0); return true; }
  if (act === 'intro-finish') {
    const name = introName().trim();
    if (!camp) { if (!ui.newDisc) return true; newCampaign(ui.newDisc, name); }
    else { camp.name = name; camp.introSeen = true; saveCamp(); }
    ui.intro = null; ui.newDisc = null; ui.screen = 'home'; render(); window.scrollTo(0, 0); return true;
  }
  if (act === 'save-delete') {
    if (!camp) return true;
    const c = await choose('Apagar save', 'Apagar a campanha salva (nome, coleção, deck e progresso)? Isso não tem volta. Os logs de partidas continuam guardados.', [{ v: 'sim', label: 'Apagar save' }]);
    if (c === 'sim') { const old = lsGet(LS_OLD, []); old.push({ id: camp.id, name: camp.name || '', created: camp.created, archivedAt: new Date().toISOString(), startDisc: camp.startDisc, day: camp.day, floor: camp.floor, cleared: camp.cleared, notes: camp.notes, deck: camp.deck, collection: camp.collection, history: camp.history }); while (!lsSet(LS_OLD, old) && old.length > 1) old.shift(); camp = null; lsDel(LS_CAMP); ui.intro = null; ui.newDisc = null; ui.settingsFrom = 'title'; ui.screen = 'title'; render(); toast('Save apagado.'); }
    return true;
  }
  if (act === 'deck-clear') { const c = await choose('Limpar deck', 'Tirar todas as cartas do deck? Elas continuam na coleção.', [{ v: 'sim', label: 'Limpar' }]); if (c === 'sim') { curDeck().cards = {}; saveCamp(); render(); } return true; }
  if (act === 'deck-edit') { if (camp && camp.run) { toast('O deck só pode ser editado na guilda, entre descidas.'); return true; } if (ui.screen !== 'deck') ui.deckFrom = ui.screen; ui.deckKind = 'batalha'; ui.screen = 'deck'; ui.deckFilter = 'disc'; render(); window.scrollTo(0, 0); return true; }
  if (ds.deckadd) { const id = ds.deckadd; const dk = curDeck(); dk.cards[id] = (dk.cards[id] || 0) + 1; saveCamp(); render(); return true; }
  if (ds.deckrem) { const id = ds.deckrem; const dk = curDeck(); dk.cards[id] = Math.max(0, (dk.cards[id] || 0) - 1); if (!dk.cards[id]) delete dk.cards[id]; saveCamp(); render(); return true; }
  if (ds.deckdisc && isSocialEd()) { const d = ds.deckdisc; camp.social.disc = d; Object.keys(camp.social.cards).forEach(id => { const dd = E.DEF[id].disc; if (dd && dd !== 'neutra' && dd !== d) delete camp.social.cards[id]; }); saveCamp(); render(); return true; }
  if (ds.deckdisc) { const d = ds.deckdisc; camp.deck.disc = d; Object.keys(camp.deck.cards).forEach(id => { const dd = E.DEF[id].disc; if (dd && dd !== 'neutra' && dd !== d) delete camp.deck.cards[id]; });  saveCamp(); render(); return true; }
  if (ds.deckfilter) { ui.deckFilter = ds.deckfilter; render(); return true; }
  if (ds.floor) { startDescent(+ds.floor, ds.revisit === '1'); return true; }
  if (act === 'continue-run') { ui.screen = 'map'; render(); return true; }
  if (act === 'run-resume') { startRunBattle(camp.run.inBattle); return true; }
  if (ds.node !== undefined && ui.screen === 'map') { enterNode(+ds.node); return true; }
  if (act === 'run-giveup') { const c = await choose('Desistir da descida', 'Conta como derrota: você volta à superfície e o andar recomeça amanhã.', [{ v: 'sim', label: 'Desistir' }]); if (c === 'sim') floorFailed('Você desistiu da descida.'); return true; }
  if (ds.evc) {
    if (ui.scene.kind === 'camp') {
      if (ds.evc === 'descansar') { hpChange(camp.run.floor >= 6 ? 10 : 12); hist({ k: 'acampamento', choice: 'descansar' }); }
      else { camp.run.bonus.hand = (camp.run.bonus.hand || 0) + 1; hist({ k: 'acampamento', choice: 'preparar' }); }
      saveCamp(); ui.screen = 'map'; render(); return true;
    }
    resolveEvent(ds.evc); return true;
  }
  if (act === 'scene-ok') { ui.screen = camp && camp.run ? 'map' : 'home'; ui.scene = null; render(); return true; }
  if (ds.pick) { reward([ds.pick], 'elite'); saveCamp(); ui.screen = 'map'; ui.scene = null; render(); return true; }
  if (act === 'pick-skip') { ui.screen = 'map'; ui.scene = null; render(); return true; }
  if (ds.pack) {
    const cards = R.openPack(rnd, ds.pack); addCards(cards);
    hist({ k: 'booster', type: ds.pack, cards });
    saveCamp(); ui.scene = { kind: 'booster', type: ds.pack, cards }; render(); return true;
  }
  if (act === 'run-continue') { finalizeGame(); battleDone(); return true; }
  return false;
}

function mulliganHtml() {
  const p = P(); const next = E.nextMulliganSize(st);
  const cards = p.hand.map((inst, i) => cardHtml(inst, i, '', `data-info="h:${i}" tabindex="-1"`)).join('');
  return `<div class="veu"><div class="janela larga" role="dialog" aria-modal="true" aria-labelledby="mu-t"><h2 id="mu-t">Mão inicial</h2><p>Mantenha ou troque a mão inteira. A primeira troca é grátis; cada troca seguinte vem com uma carta a menos.${st.mulligans ? ` Trocas feitas: ${st.mulligans}.` : ''}</p><div class="prever-lista">${cards || '<span class="vazio">Mão vazia</span>'}</div><div class="opcoes"><button class="botao principal" data-act="keep">Manter</button><button class="botao" data-act="mull" ${p.hand.length ? '' : 'disabled'}>Trocar (${next} carta${next === 1 ? '' : 's'})</button></div></div></div>`;
}
function syncGrupo() { if (!camp) return R.setGrupo(1, 0.35); R.setGrupo(camp.cleared[5] || camp.floor > 5 ? 2 : 1, camp.run && camp.run.floor >= 6 ? 0.5 : 0.35); }
function render() {
  syncGrupo();
  if (ui.screen !== 'battle' || !st) { renderScreen(); $('#app').insertAdjacentHTML('beforeend', (ui.toast ? `<div class="aviso" role="status">${esc(ui.toast)}</div>` : '') + (ui.modal ? modalHtml() : '')); return; }
  persist();
  const handScroll = $('.mao') ? $('.mao').scrollLeft : 0;
  const logScroll = $('.registro ol') ? $('.registro ol').scrollTop : 0;
  const tgt = targetSet();
  const mirando = ui.mode && ['play', 'attack', 'hero', 'resonate'].includes(ui.mode.kind);
  $('#app').innerHTML = `<div class="jogo">
    <main class="mesa ${mirando ? 'mirando' : ''} ${SOC() ? 'social' : ''}">
      ${leaderE(tgt)}
      <div class="fileira inimigo" aria-label="Campo inimigo">${O().board.map(e => piece(e, tgt)).join('') || '<span class="vazio">Campo inimigo vazio</span>'}</div>
      ${centerBar()}
      <div class="fileira aliado" aria-label="Seu campo">${P().board.map(e => piece(e, tgt)).join('') || '<span class="vazio">Seu campo está vazio</span>'}</div>
      ${panelP()}
      <div class="mao" aria-label="Sua mão">${P().hand.map((inst, i) => handCard(inst, i)).join('')}</div>
    </main>
    <aside class="lateral">${infoPanel()}${logPanel()}</aside>
  </div>${ui.toast ? `<div class="aviso" role="status">${esc(ui.toast)}</div>` : ''}${st.over && !ui.overClosed ? overPanel() : ''}${st.pending && st.pending.kind === 'mulligan' ? mulliganHtml() : ''}${ui.modal ? modalHtml() : ''}`;
  if ($('.mao')) $('.mao').scrollLeft = handScroll;
  if ($('.registro ol')) $('.registro ol').scrollTop = logScroll;
}
function refreshInfo() { const el = $('.info'); if (el) el.outerHTML = infoPanel(); }

let toastTimer = null;
function toast(msg) { ui.toast = msg; render(); clearTimeout(toastTimer); toastTimer = setTimeout(() => { ui.toast = null; render(); }, 2200); }

function choose(title, text, options) {
  return new Promise(res => { ui.modal = { kind: 'choice', title, text, options, resolve: res }; render(); });
}
function openPrever() {
  const p = P();
  const cards = st.pending.uids.map(u => p.deck.find(i => i.uid === u)).filter(Boolean);
  ui.modal = { kind: 'prever', cards, take: cards.length ? cards[0].uid : null };
  render();
}
function afterAction() {
  ui.mode = null;
  render();
  if (st.pending && st.pending.kind === 'prever') openPrever();
}

async function startPlay(idx) {
  const inst = P().hand[idx]; if (!inst) return;
  const d = E.DEF[inst.id];
  const chk = E.canPlay(st, 'P', idx);
  if (!chk.ok) { toast(socTxt(chk.reason) || 'Não dá para jogar agora.'); return; }
  const opts = {};
  if (d.sangria && chk.canLife) {
    if (chk.canMana) {
      const c = await choose(d.name, 'Como você quer pagar?', [{ v: 'mana', label: `Pagar ${chk.cost} de ${W('mana')}` }, { v: 'vida', label: `Pagar ${d.sangria} de ${SOC() ? 'Compostura' : 'vida'}` }]);
      if (c === null) return;
      opts.payLife = c === 'vida';
    } else opts.payLife = true;
  }
  if (d.adiantar && chk.canAdiantar && !opts.payLife) {
    const c = await choose(d.name, 'Adiantar esta unidade?', [{ v: 'n', label: `Jogar normal por ${chk.cost}` }, { v: 'a', label: `Adiantar por ${chk.cost + d.adiantar}, com Acelerar` }]);
    if (c === null) return;
    opts.adiantar = c === 'a';
  }
  if (chk.spec && chk.targets.length) { ui.mode = { kind: 'play', idx, opts, targets: chk.targets, name: d.name }; render(); return; }
  const r = E.playCard(st, 'P', idx, opts);
  if (!r.ok) toast(socTxt(r.reason));
  afterAction();
}
function runTarget(ref) {
  const m = ui.mode;
  if (m.kind === 'play') { const r = E.playCard(st, 'P', m.idx, Object.assign({}, m.opts, { target: ref })); if (!r.ok) toast(socTxt(r.reason)); }
  else if (m.kind === 'attack') E.attack(st, 'P', m.uid, ref);
  else if (m.kind === 'hero') E.heroAttack(st, 'P', ref);
  afterAction();
}
function inTargets(ref) { return ui.mode && ui.mode.targets && ui.mode.targets.some(r => E.sameRef(r, ref)); }

function endPlayerTurn() {
  if (ui.busy || st.turnSide !== 'P' || st.over || st.pending) return;
  ui.mode = null;
  E.endTurn(st);
  if (st.over) { render(); return; }
  runEnemy();
}
function runEnemy() {
  ui.busy = true; render();
  const delay = reduced() ? 150 : 650;
  const step = () => {
    if (!st || st.over) { ui.busy = false; render(); return; }
    const r = E.enemyStep(st);
    render();
    if (r) setTimeout(step, delay);
    else { if (!st.over) E.endTurn(st); ui.busy = false; afterAction(); }
  };
  setTimeout(step, delay);
}
function startGame() {
  st = E.newGame(ui.disc, ui.enc);
  st.gameId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  st.ctx = { mode: 'avulsa' }; ui.screen = 'battle';
  ui.mode = null; ui.info = null; ui.modal = null; ui.busy = false; ui.overClosed = false;
  render();
  window.scrollTo(0, 0);
}

document.addEventListener('click', async ev => {
  const t = ev.target.closest('[data-act],[data-hand],[data-ent],[data-leader],[data-disc],[data-enc],[data-choice],[data-prever],[data-newdisc],[data-floor],[data-node],[data-deckadd],[data-deckrem],[data-deckdisc],[data-deckfilter],[data-evc],[data-pick],[data-pack]');
  if (!t) return;
  const ds = t.dataset;
  if (ds.choice === undefined && !ds.prever && await runClick(ds)) return;
  if (ds.disc) { ui.disc = ds.disc; render(); return; }
  if (ds.act === 'export') { openExport(); return; }
  if (ds.act === 'export-novas') { exportLogs('novas'); return; }
  if (ds.act === 'export-tudo') { exportLogs('tudo'); return; }
  if (ds.act === 'close-modal') { ui.modal = null; render(); return; }
  if (ds.act === 'copy-log') {
    const ta = $('.export-txt'); if (ta) { ta.focus(); ta.select(); }
    try { await navigator.clipboard.writeText(ui.modal.json); if (ui.modal.exportedAt) lsSet(LS_LASTEXP, ui.modal.exportedAt); toast('Copiado.'); } catch (e) { try { document.execCommand('copy'); toast('Copiado.'); } catch (e2) { toast('Selecionei o texto; copie com Ctrl+C.'); } }
    return;
  }
  if (ds.act === 'quit') {
    const inRun = st && st.ctx && st.ctx.mode === 'run';
    const c = await choose('Sair da partida', inRun ? 'Conta como derrota no andar: você volta à superfície.' : 'A partida fica no log como abandonada.', [{ v: 'sim', label: 'Sair' }]);
    if (c === 'sim' && st) { finalizeGame('abandoned'); ui.mode = null; ui.busy = false; if (inRun) { st = null; camp.run.inBattle = null; floorFailed('Você abandonou a luta.'); } else { st = null; ui.screen = 'avulsa'; render(); } }
    return;
  }
  if (ds.act === 'clear-logs') {
    const c = await choose('Apagar logs', `Apagar as ${logCount()} partidas guardadas neste navegador? Exporte antes se quiser guardar.`, [{ v: 'sim', label: 'Apagar' }]);
    if (c === 'sim') { lsDel(LS_GAMES); toast('Logs apagados.'); }
    return;
  }
  if (ds.enc) { ui.enc = ds.enc; render(); return; }
  if (ds.choice !== undefined) { const m = ui.modal; ui.modal = null; render(); m.resolve(ds.choice === '__cancel' ? null : ds.choice); return; }
  if (ds.prever) { ui.modal.take = +ds.prever; render(); return; }
  const act = ds.act;
  if (act === 'start') { startGame(); return; }
  if (act === 'again') { if (st && !st.over) finalizeGame('abandoned'); startGame(); return; }
  if (act === 'setup') { if (st && !st.over) finalizeGame('abandoned'); st = null; ui.mode = null; ui.screen = 'avulsa'; render(); return; }
  if (act === 'close-over') { ui.overClosed = true; render(); return; }
  if (act === 'keep') { E.keepHand(st); afterAction(); return; }
  if (act === 'mull') { E.mulligan(st); render(); return; }
  if (act === 'prever-ok') { const t = ui.modal.take; ui.modal = null; E.resolvePrever(st, t); afterAction(); return; }
  if (!st) return;
  if (ds.info) ui.info = ds.info;
  if (ui.busy || st.over || st.turnSide !== 'P' || ui.modal) { refreshInfo(); return; }
  if (act === 'cancel') { ui.mode = null; render(); return; }
  if (act === 'confirm-play') { if (ui.mode && ui.mode.kind === 'confirm') { const i = ui.mode.idx; ui.mode = null; await startPlay(i); } return; }
  if (act === 'end') { endPlayerTurn(); return; }
  if (act === 'resonate') {
    if (ui.mode && ui.mode.kind === 'resonate') { ui.mode = null; render(); return; }
    if (E.canResonate(st, 'P')) { ui.mode = { kind: 'resonate' }; render(); }
    return;
  }
  if (act === 'weapon') {
    if (ui.mode && ui.mode.kind === 'hero') { ui.mode = null; render(); return; }
    if (!E.canHeroAttack(st, 'P')) { toast('A arma já atacou neste turno.'); return; }
    const targets = E.attackTargets(st, 'P', null);
    if (!targets.length) { toast('Nenhum alvo para a arma.'); return; }
    ui.mode = { kind: 'hero', targets }; render(); return;
  }
  if (ds.hand !== undefined) {
    const idx = +ds.hand;
    if (ui.mode && ui.mode.kind === 'play' && ui.mode.idx === idx) { ui.mode = null; render(); return; }
    if (ui.mode && ui.mode.kind === 'confirm' && ui.mode.idx === idx) { ui.mode = null; await startPlay(idx); return; }
    const inst = P().hand[idx]; if (!inst) return;
    const chk = E.canPlay(st, 'P', idx);
    if (!chk.ok) { ui.mode = { kind: 'inspect', idx, name: E.DEF[inst.id].name, reason: socTxt(chk.reason) || 'Não dá para jogar agora.' }; render(); return; }
    if (chk.spec && chk.targets.length) { ui.mode = null; await startPlay(idx); return; }
    ui.mode = { kind: 'confirm', idx, name: E.DEF[inst.id].name }; render();
    return;
  }
  if (ds.leader) {
    const ref = { t: 'l', side: ds.leader };
    if (inTargets(ref)) { runTarget(ref); return; }
    render(); return;
  }
  if (ds.ent) {
    const uid = +ds.ent; const ref = { t: 'e', uid };
    const e = E.ent(st, ref);
    if (inTargets(ref)) { runTarget(ref); return; }
    if (ui.mode && ui.mode.kind === 'resonate') {
      if (e && e.owner === 'P' && e.kind === 'unit') { E.resonate(st, 'P', uid); afterAction(); }
      return;
    }
    if (ui.mode && ui.mode.kind === 'attack' && ui.mode.uid === uid) { ui.mode = null; render(); return; }
    if (e && e.owner === 'P' && E.canAttack(st, e)) {
      const targets = E.attackTargets(st, 'P', e);
      if (!targets.length) { toast('Nenhum alvo ao alcance desta unidade.'); return; }
      ui.mode = { kind: 'attack', uid, targets }; render(); return;
    }
    render();
  }
});
document.addEventListener('input', ev => {
  if (ev.target && ev.target.id === 'apelido') { ui.nick = ev.target.value.slice(0, 40); lsSet(LS_NICK, ui.nick); }
});
document.addEventListener('mouseover', ev => {
  if (!st) return;
  const t = ev.target.closest('[data-info]');
  if (t && t.dataset.info !== ui.info) { ui.info = t.dataset.info; refreshInfo(); }
});
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape') {
    if (ui.modal && ui.modal.kind === 'choice') { const m = ui.modal; ui.modal = null; render(); m.resolve(null); return; }
    if (ui.mode) { ui.mode = null; render(); }
  }
});

if (camp) { ensureGuild(); saveCamp(); }
if (typeof IMG !== 'undefined') for (const [k, v] of Object.entries(IMG)) document.documentElement.style.setProperty('--img-' + k, `url("${v}")`);
render();
})();
