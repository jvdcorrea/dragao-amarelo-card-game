(function () {
'use strict';
const E = window.Engine;
const TYPE_LABEL = { unit: 'Unidade', spell: 'Feitiço', weapon: 'Arma', structure: 'Estrutura', ritual: 'Ritual', trap: 'Armadilha' };
const KW_LABEL = { guarda: 'Guarda', investida: 'Acelerar', avanco: 'Avanço', letal: 'Letal', dreno: 'Dreno', escudo: 'Escudo', emboscada: 'Emboscada', eco: 'Eco' };
const DISC_NAME = { temporal: 'Temporal Warfare', draconic: 'Draconic Primalism', necro: 'Necrodance', holy: 'Holy Shadowmancy', tech: 'Enchanting Technology', space: 'Space Wizardry', neutra: 'Neutra' };
const GLOSS = {
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
const RULES = 'cartas-v0.16/design-v0.41/inimigos-v0.10/proto-2026-10-23';
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
  return { id: st.gameId, player: ui.nick || '', rules: RULES, startedAt: new Date(st.t0).toISOString(), endedAt: new Date().toISOString(), result, disc: st.disc, enc: st.encId, seed: st.seed, mulligans: st.mulligans, turns: [E.S(st, 'P').turnCount, E.S(st, 'E').turnCount], hp: [E.S(st, 'P').leader.hp, E.S(st, 'E').leader.hp], events: st.events, log: st.log, ctx: st.ctx || { mode: 'avulsa' } };
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
  const payload = { format: 'dragao-amarelo-log', version: 1, rules: RULES, exportedAt: new Date().toISOString(), scope: scope || 'tudo', since: scope === 'novas' ? since : null, player: ui.nick || '', userAgent: navigator.userAgent, legend: LEGEND, campaign: camp ? { id: camp.id, name: camp.name || '', created: camp.created, startDisc: camp.startDisc, day: camp.day, floor: camp.floor, cleared: camp.cleared, deck: camp.deck, collection: camp.collection, notes: camp.notes, history: camp.history, run: camp.run ? { floor: camp.run.floor, hp: camp.run.hp, visited: camp.run.visited, mochila: camp.run.mochila } : null } : null, oldCampaigns: lsGet(LS_OLD, []), rarity: R.RARITY, cards: Object.fromEntries(Object.entries(E.DEF).map(([id, d]) => [id, { name: d.name, cost: d.cost, type: d.type, atk: d.atk, hp: d.hp, disc: d.disc || 'inimigo', text: d.text }])), games: games.concat(extra) };
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
  if (e.kind === 'unit') body = `<span class="stats"><b class="atk" title="Ataque">${E.getAtk(st, e)}</b><b class="hp ${e.hp < e.maxHp ? 'ferido' : ''}" title="Vida">${e.hp}</b></span>`;
  else if (e.kind === 'structure') body = `<span class="stats"><b class="hp" title="Vida">${e.hp}</b></span>`;
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
    <div class="lider-id">${iconSvg(typeof ART !== 'undefined' ? ART.enc[st.encId] : null, 'ico-lider')}<span class="lider-nome">${esc(o.leader.name)}</span><span class="lider-tier">${enc.tier}${st.phase2 ? ', fase 2' : ''}</span></div>
    <p class="regra">${esc(enc.rule)}</p>
    <button class="alvo-lider ${isT ? 'alvo' : ''}" data-leader="E" data-info="l:E" aria-label="Vida de ${esc(o.leader.name)}: ${Math.max(0, o.leader.hp)}">
      <span class="vida-num">${Math.max(0, o.leader.hp)}</span><small>de ${o.leader.maxHp}</small>
    </button>
    <div class="lider-num">
      <span class="barra" aria-hidden="true"><i style="width:${pct}%"></i></span>
      <span>${o.mana}/${o.maxMana} de mana</span><span class="conta">Mão ${o.hand.length}</span><span class="conta">Deck ${o.deck.length}</span>${res}
    </div>
  </section>`;
}

function centerBar() {
  let msg, cancel = false, cls = '';
  if (st.over) msg = st.over === 'P' ? 'Vitória.' : 'Derrota.';
  else if (st.pending && st.pending.kind === 'mulligan') msg = 'Escolha sua mão inicial.';
  else if (ui.busy || st.turnSide === 'E') { msg = `Vez de ${O().leader.name}.`; cls = 'inimigo-vez'; }
  else if (ui.mode) {
    cancel = true;
    msg = { play: `Escolha um alvo para ${ui.mode.name}.`, attack: 'Escolha o alvo do ataque.', hero: 'Escolha o alvo da sua arma.', resonate: 'Escolha uma unidade sua para Evoluir.', confirm: `Toque de novo em ${ui.mode.name} ou em Jogar para confirmar.`, inspect: `${ui.mode.name}: ${ui.mode.reason}` }[ui.mode.kind];
  } else msg = `Seu turno ${P().turnCount}. Jogue cartas, ataque com as unidades prontas e encerre o turno.`;
  const overBtn = st.over ? (st.ctx && st.ctx.mode === 'run' ? '<button class="botao principal" data-act="run-continue">Continuar</button>' : '<button class="botao" data-act="setup">Voltar</button>') : '';
  const m = ui.mode;
  const playBtn = m && m.kind === 'confirm' ? '<button class="botao principal" data-act="confirm-play">Jogar</button>' : '';
  const cancelLbl = m && m.kind === 'inspect' ? 'Fechar' : 'Cancelar';
  let det = '';
  if (m && m.idx !== undefined && ['play', 'confirm', 'inspect'].includes(m.kind)) {
    const inst = P().hand[m.idx];
    if (inst) { const d = E.DEF[inst.id]; det = `<div class="faixa-detalhe"><p class="linha">${TYPE_LABEL[d.type]}${d.tags.length ? ' (' + esc(d.tags.join(', ')) + ')' : ''}, custo ${E.getCost(st, 'P', inst)}</p><p>${fmtText(d.text)}</p>${glossFor(d.text, d.type === 'ritual' ? ['Ritual'] : d.type === 'trap' ? ['Armadilha'] : d.type === 'structure' ? ['Estrutura'] : [])}</div>`; }
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
    <div class="voce-vida" data-info="l:P"><b>${Math.max(0, p.leader.hp)}</b><span class="conta">de ${p.leader.maxHp}</span><span class="barra" aria-hidden="true"><i style="width:${pct}%"></i></span></div>
    <div class="mana" title="Mana">${crys}<span>${p.mana}/${p.maxMana}${extra}</span></div>
    ${st.usesCompasso ? `<div class="compasso" title="Compasso: posição da próxima carta"><span class="rotulo">Compasso</span>${beats}</div>` : ''}
    <div class="ressonancia"><button class="botao" data-act="resonate" ${canRes ? '' : 'disabled'}>Evoluir</button>${dots(p.resonance.points, 3)}${resInfo ? `<small>${resInfo}</small>` : ''}</div>
    ${weapon}${traps}
    <span class="conta">Deck ${p.deck.length}</span>
    ${pend.length ? `<p class="pendente">${esc(pend.join('; '))}.</p>` : ''}
    </div><button class="selo-turno" data-act="end" ${endOk ? '' : 'disabled'}>Encerrar turno</button>
  </section>`;
}

const KW_RE = new RegExp('(?<![\\p{L}])(Exige Compasso \\d|Compasso \\d(?: ou \\d)?|Ao Entrar|Ao Morrer|Ao Evoluir|Ao Revelar|Ao ativar|Sangria \\d+|Ritual \\d+|Adiantar \\d+|Prever \\d+|Guarda|Acelerar|Avanço|Letal|Dreno|Escudo|Emboscada|Eco|Atraso|Cristal|Despertar|Armadilha|Órbita|Módulo|Brotar|Imóvel|Felinos|Felino|Dragões|Dragão|Construto|Rituais|Ritual|Cargas|Carga|Evoluir|Sacrifício)(?![\\p{L}])', 'gu');
const KW_ONLY = /^(?:(?:Guarda|Acelerar|Avanço|Letal|Dreno|Escudo|Emboscada|Eco|Atraso|Felino|Dragão|Construto|Órbita|Módulo|Armadilha|Ritual \d+|Sangria \d+|Adiantar \d+|Arma \d+\/\d+)\.\s*)+$/u;
function fmtText(text, compact) {
  if (!text) return '';
  const lines = [];
  text.split(/(?<=\.)\s+(?=[A-ZÀ-Ú])/u).forEach(sn => { const kw = KW_ONLY.test(sn); if (kw && lines.length && lines[lines.length - 1].kw) lines[lines.length - 1].t += ' ' + sn; else lines.push({ t: sn, kw }); });
  const bold = t => esc(t).replace(KW_RE, '<b>$1</b>');
  return lines.map(l => bold(l.t)).join(compact || text.length > 118 ? ' ' : '<br>');
}
function hashStr(t) { let h = 7; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return Math.abs(h); }
function iconSvg(name, cls) { const d = typeof ART !== 'undefined' && name ? ART.icons[name] : null; return d ? `<svg class="${cls || 'ico'}" viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path d="${d}"/></svg>` : ''; }
function cardIconName(id) { return typeof ART !== 'undefined' ? ART.card[id] : null; }
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
    <span class="tipo">${TYPE_LABEL[d.type]}${esc(tags)}</span>
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
        html = `${artBand(inst.id, d.disc || 'neutra', true)}<h2>${esc(d.name)}</h2><p class="linha">${TYPE_LABEL[d.type]}, custo ${E.getCost(st, 'P', inst)}${d.disc ? ', ' + DISC_NAME[d.disc] : ''}</p><p>${fmtText(d.text)}</p>${!chk.ok && chk.reason && st.turnSide === 'P' ? `<p class="linha">${esc(chk.reason)}</p>` : ''}${glossFor(d.text, d.type === 'ritual' ? ['Ritual'] : d.type === 'trap' ? ['Armadilha'] : d.type === 'structure' ? ['Estrutura'] : [])}`;
      }
    } else if (k.startsWith('e:')) {
      const e = E.ent(st, { t: 'e', uid: +k.slice(2) });
      if (e) {
        const d = E.DEF[e.id];
        const kw = Object.keys(KW_LABEL).filter(x => E.hasKw(e, x)).map(x => KW_LABEL[x]);
        const st2 = e.kind === 'unit' ? `${E.getAtk(st, e)} de ataque, ${e.hp} de ${e.maxHp} de Vida` : e.kind === 'structure' ? `${e.hp} de Vida` : `contagem ${e.countdown}`;
        const extra = kw.slice(); if (e.imovel > 0) extra.push('Imóvel'); if (e.kind === 'ritual') extra.push('Ritual'); if (e.kind === 'structure') extra.push('Estrutura'); if (e.resonated) extra.push('Evoluir');
        html = `${artBand(e.id, discOf(e), true)}<h2>${esc(e.name)}</h2><p class="linha">${TYPE_LABEL[d.type] || 'Unidade'} ${e.owner === 'P' ? 'sua' : 'inimiga'}, ${st2}</p>${d.text ? `<p>${fmtText(d.text)}</p>` : ''}${e.modules.length ? `<p class="linha">Módulos: ${e.modules.map(m => esc(E.DEF[m].name)).join(', ')}</p>` : ''}${glossFor(d.text, extra)}`;
      }
    } else if (k === 'l:E') {
      const o = O();
      html = `<h2>${esc(o.leader.name)}</h2><p class="linha">${st.enc.tier}, ${Math.max(0, o.leader.hp)} de ${o.leader.maxHp} de Vida</p><p>${esc(st.enc.rule)}</p>`;
    } else if (k === 'l:P') {
      const p = P();
      html = `<h2>Você</h2><p class="linha">${Math.max(0, p.leader.hp)} de ${p.leader.maxHp} de Vida, ${DISC_NAME[st.disc]}</p><p>Evoluções restantes: ${p.resonance.points}. Cartas no deck: ${p.deck.length}.</p>${glossFor('Evoluir Compasso')}`;
    } else if (k === 'w' && P().weapon) {
      const w = P().weapon, d = E.DEF[w.id];
      html = `<h2>${esc(w.name)}</h2><p class="linha">Arma, ${w.atk} de ataque, ${w.dur} uso${w.dur > 1 ? 's' : ''} restante${w.dur > 1 ? 's' : ''}</p><p>${fmtText(d.text)}<br>Toque na arma para atacar com o protagonista; atacar uma unidade fere você com o ataque dela.</p>${glossFor(d.text)}`;
    } else if (k.startsWith('d:')) {
      const d = E.DEF[k.slice(2)];
      if (d) html = `${artBand(k.slice(2), d.disc || 'neutra', true)}<h2>${esc(d.name)}</h2><p class="linha">${TYPE_LABEL[d.type]}</p><p>${fmtText(d.text)}</p>${glossFor(d.text, ['Armadilha'])}`;
    }
  }
  return `<section class="info" aria-label="Detalhes">${html || '<p class="info-vazia">Passe o mouse ou toque numa carta para ver os detalhes.</p>'}</section>`;
}
function logPanel() {
  return `<section class="registro"><h2>Registro</h2><ol>${st.log.slice(-80).reverse().map(l => `<li>${esc(l)}</li>`).join('')}</ol></section>`;
}
function overPanel() {
  const win = st.over === 'P';
  return `<div class="veu"><div class="janela resultado" role="dialog" aria-modal="true" aria-labelledby="res-t">
    <h2 id="res-t">${win ? 'Vitória' : 'Derrota'}</h2>
    <p>${win ? `${esc(O().leader.name)} caiu no seu turno ${P().turnCount}, com você a ${P().leader.hp} de Vida.` : `Você caiu no turno ${P().turnCount}. ${esc(O().leader.name)} ficou com ${Math.max(0, O().leader.hp)} de Vida.`}</p>
    ${st.ctx && st.ctx.mode === 'run' ? '<div class="opcoes"><button class="botao principal" data-act="run-continue">Continuar</button><button class="botao" data-act="close-over">Ver a mesa</button><button class="botao" data-act="export">Exportar log</button></div>' : ''}<div class="opcoes" ${st.ctx && st.ctx.mode === 'run' ? 'hidden' : ''}><button class="botao principal" data-act="again">Jogar de novo</button><button class="botao" data-act="setup">Mudar escolhas</button><button class="botao" data-act="close-over">Ver a mesa</button><button class="botao" data-act="export">Exportar log</button></div>
  </div></div>`;
}
function modalHtml() {
  const m = ui.modal;
  if (m.kind === 'export-menu') {
    return `<div class="veu"><div class="janela" role="dialog" aria-modal="true" aria-labelledby="em-t"><h2 id="em-t">Exportar log</h2><p>O arquivo sai compactado em .zip, cerca de 8 vezes menor. No celular, abre o menu de compartilhar ou salvar.</p><div class="opcoes"><button class="botao principal" data-act="export-novas" ${m.novas ? '' : 'disabled'}>Só as novas (${m.novas})</button><button class="botao" data-act="export-tudo" ${m.all ? '' : 'disabled'}>Tudo (${m.all})</button><button class="botao" data-act="close-modal">Cancelar</button></div><p class="intro">"Novas" são as partidas terminadas depois da última exportação.</p></div></div>`;
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
const saveCamp = () => { if (camp) lsSet(LS_CAMP, camp); };
function mkRng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = Math.random;
function hist(ev) { if (!camp) return; ev.day = camp.day; ev.t = new Date().toISOString(); (camp.history = camp.history || []).push(ev); }
function addCards(ids) { ids.forEach(id => { camp.collection[id] = (camp.collection[id] || 0) + 1; }); }
function collectionSize() { return Object.values(camp.collection).reduce((a, b) => a + b, 0); }
function ownedDiscs() { return R.DISCS.filter(d => Object.keys(camp.collection).some(id => E.DEF[id].disc === d)); }
const rarTag = id => { const r = R.RARITY[id] || 'C'; return `<span class="rar rar-${r}">${R.RAR[r]}</span>`; };
function cardById(id, extraCls, attrs, note) {
  return cardHtml({ id, cargas: 0 }, 0, extraCls || '', attrs || '').replace(/(<span class="tipo">[\s\S]*?<\/span>)/, `$1${rarTag(id)}`).replace(/<\/button>$/, `${note ? `<span class="marca">${esc(note)}</span>` : ''}</button>`);
}
function newCampaign(disc, name) {
  const coll = R.starterCollection(disc);
  camp = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), created: new Date().toISOString(), startDisc: disc, day: 0, floor: 1, cleared: {}, collection: coll, deck: { disc, cards: Object.assign({}, coll) }, notes: [], history: [], run: null };
  if (name) { camp.name = name; camp.introSeen = true; }
  hist({ k: 'campanha', disc });
  saveCamp();
}
function startDescent(floor, revisit) {
  const probs = R.deckProblems(camp.deck, camp.collection);
  if (probs.length) { toast('Ajuste o deck antes de descer: ' + probs[0]); return; }
  camp.day += 1;
  const seed = (Date.now() ^ (floor * 7919)) >>> 0;
  const withNote = !revisit && !camp.notes.includes(floor);
  camp.run = { floor, revisit: !!revisit, seed, map: R.genMap(mkRng(seed), floor, withNote), pos: null, visited: [], hp: 30, mochila: [], bonus: {}, evUsed: [], inBattle: null };
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
  run.inBattle = b;
  st = E.newGame(camp.deck.disc, b.enc, null, { deck: R.deckList(camp.deck), hp: run.hp, encBonus: b.encBonus || 0, extraHand: run.bonus.hand || 0, extraMana: run.bonus.mana || 0 });
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
    const left = R.EVENTS.filter(e => !run.evUsed.includes(e.id));
    const ev = (left.length ? left : R.EVENTS)[Math.floor(rnd() * (left.length || R.EVENTS.length))];
    run.evUsed.push(ev.id); saveCamp();
    ui.scene = { kind: 'event', ev }; ui.screen = 'scene'; render(); return;
  }
  if (n.type === 'tesouro') { const c = R.treasureCard(rnd, camp.deck.disc); ui.scene = { kind: 'treasure', card: c, text: reward([c], 'tesouro') }; saveCamp(); ui.screen = 'scene'; render(); return; }
  if (n.type === 'acampamento') { ui.scene = { kind: 'camp' }; ui.screen = 'scene'; render(); return; }
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
  hist({ k: 'evento', id: ev.id, choice, res: txt });
  saveCamp();
  ui.scene = { kind: 'event', ev, result: txt }; render();
}
function battleDone() {
  const run = camp.run; const b = run.inBattle; const won = st.over === 'P'; const hpEnd = E.S(st, 'P').leader.hp;
  st = null; run.inBattle = null;
  hist({ k: 'luta', floor: run.floor, enc: b.enc, type: b.type, won, hp: hpEnd });
  if (!won) { floorFailed('Você caiu na luta.'); return; }
  run.hp = Math.min(30, hpEnd + 6);
  if (b.final) { floorCleared(); return; }
  if (b.type === 'elite' && !run.revisit) { ui.scene = { kind: 'elite', cards: R.eliteChoices(rnd, camp.deck.disc) }; ui.screen = 'scene'; saveCamp(); render(); return; }
  saveCamp(); ui.screen = 'map'; render(); window.scrollTo(0, 0);
}
function floorCleared() {
  const run = camp.run;
  if (run.revisit) { hist({ k: 'andar', floor: run.floor, res: 'revisita' }); camp.run = null; saveCamp(); ui.scene = { kind: 'msg', title: `Andar ${run.floor} revisitado`, text: 'Você volta à superfície. Revisitas não dão cartas.' }; ui.screen = 'scene'; render(); return; }
  addCards(run.mochila);
  camp.cleared[run.floor] = true; camp.floor = Math.max(camp.floor, run.floor + 1);
  hist({ k: 'andar', floor: run.floor, res: 'concluido', mochila: run.mochila.slice() });
  ui.scene = { kind: 'booster-choice', floor: run.floor, mochila: run.mochila.slice() };
  camp.run = null; saveCamp(); ui.screen = 'scene'; render(); window.scrollTo(0, 0);
}
function floorFailed(why) {
  const run = camp.run; let kept = null;
  if (!run.revisit && run.mochila.length) { kept = run.mochila[Math.floor(rnd() * run.mochila.length)]; addCards([kept]); }
  hist({ k: 'andar', floor: run.floor, res: 'derrota', kept, lost: run.mochila.length - (kept ? 1 : 0) });
  camp.run = null; saveCamp();
  ui.scene = { kind: 'msg', title: 'Você caiu', text: `${why} Felix te arrasta de volta à superfície. O andar ${run.floor} recomeça amanhã.${kept ? ` Da mochila, só sobrou ${E.DEF[kept].name}.` : ''}` };
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
function renderHome() {
  if (!camp) { ui.screen = 'title'; renderTitle(); return; }
  const valid = !R.deckProblems(camp.deck, camp.collection).length;
  const next = Math.min(camp.floor, 5);
  const allDone = camp.cleared[5];
  const floors = [1, 2, 3, 4, 5].map(f => {
    const done = camp.cleared[f]; const cur = !done && f === camp.floor;
    return `<div class="andar ${done ? 'feito' : cur ? 'atual' : 'bloq'}"><b>${f}</b><span>${done ? 'Concluído' : cur ? 'Próximo' : 'Bloqueado'}</span>${done ? `<button class="botao discreto" data-floor="${f}" data-revisit="1">Revisitar</button>` : ''}</div>`;
  }).join('');
  const mainBtn = camp.run ? `<button class="botao principal" data-act="continue-run">Continuar descida (andar ${camp.run.floor})</button>`
    : allDone ? `<p class="destaque">Grupo 1 concluído: Ergos não estava nas Grutas. O caminho segue mais fundo.</p>`
    : `<button class="botao principal" data-floor="${next}" ${valid ? '' : 'disabled'}>Descer ao andar ${next}</button>`;
  $('#app').innerHTML = `${gearBtn()}<header class="abertura"><h1>Dragão Amarelo</h1><p class="sub">${camp.name ? `Guilda de ${esc(camp.name)} · ` : ''}As Grutas Vivas</p></header>
    <section class="painel-camp">
      <p class="camp-linha">Dia ${camp.day}. Deck de ${esc(DISC_NAME[camp.deck.disc])}: ${R.deckSize(camp.deck)}/30${valid ? '' : ' (precisa de ajuste)'}. Coleção: ${collectionSize()} cartas.</p>
      <div class="andares">${floors}</div>
      <div class="acoes-setup">${mainBtn}</div>
      <div class="linha-logs"><button class="botao" data-act="deck-edit" ${camp.run ? 'disabled title="Disponível entre descidas"' : ''}>Editar deck</button><button class="botao" data-act="camp-notes">Notas de Ergos (${camp.notes.length}/5)</button><button class="botao" data-act="avulsa">Batalha avulsa</button><button class="botao" data-act="to-title">Tela inicial</button></div>
    </section>
    ${logsHtml()}`;
}
function statsMini(d) {
  if (d.type === 'unit') return `<span class="lc-stats" aria-label="Ataque ${d.atk}, Vida ${d.hp}"><b class="atk">${d.atk}</b><b class="hp">${d.hp}</b></span>`;
  if (d.type === 'weapon') return `<span class="lc-stats" aria-label="Ataque ${d.atk}, usos ${d.hp}"><b class="atk">${d.atk}</b><b class="dur">${d.hp}</b></span>`;
  if (d.type === 'structure') return `<span class="lc-stats" aria-label="Vida ${d.hp}"><b class="hp">${d.hp}</b></span>`;
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
    <p>A fachada da guilda (tela inicial) e Felix no balcão (introdução) são ilustrações do projeto, enviadas pelo autor do jogo.</p>
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
    body = `${felixArt('disciplinas')}<div class="fala"><span class="quem">Felix</span><p>Antes de descer, ele deixou anotações sobre seis Disciplinas de combate. Seu sangue vai responder a uma delas.</p><p>Escolha com calma. Ou não: ele também não escolheu com calma.</p></div>
      <p class="intro-dica">Você começa com o deck inicial da Disciplina (20 cartas neutras e 10 dela) e cresce com boosters e recompensas.</p>
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
  const save = camp ? `${camp.name ? esc(camp.name) + ', ' : ''}dia ${camp.day}, ${camp.cleared[5] ? 'Grutas concluídas' : 'andar ' + Math.min(camp.floor, 5)}${camp.run ? ' (descida em andamento)' : ''}` : 'Nenhum jogo salvo.';
  const arte = HAS_IMG('guilda');
  $('#app').innerHTML = `${gearBtn()}<section class="titulo-tela${arte ? ' com-arte' : ''}">
    ${arte ? '<div class="titulo-fundo" role="img" aria-label="Fachada da guilda Dragão Amarelo à noite, com a placa iluminada e as janelas acesas"></div>' : `<div class="titulo-ico">${iconSvg(typeof ART !== 'undefined' ? ART.ui.titulo : null)}</div>`}
    <h1${arte ? ' class="sr"' : ''}>Dragão Amarelo</h1>
    <p class="sub">Uma guilda, uma dívida e um buraco que responde ao seu sangue.</p>
    <div class="titulo-botoes">
      <button class="botao principal" data-act="title-continue" ${camp ? '' : 'disabled'}>Continuar</button>
      <button class="botao" data-act="title-guild">Entrar na guilda</button>
    </div>
    <p class="titulo-save">${save}</p>
    <p class="titulo-rodape">Protótipo, ${esc(RULES)}</p>
  </section>`;
}
function renderSettings() {
  $('#app').innerHTML = `<header class="abertura"><h1>Configurações</h1></header>
  <section class="cena config">
    <div class="config-item"><div><h2>Créditos</h2><p>Autores dos ícones, fontes e bibliotecas.</p></div><button class="botao" data-act="credits">Ver créditos</button></div>
    <div class="config-item perigo"><div><h2>Apagar save</h2><p>${camp ? 'Apaga a campanha: nome, coleção, deck e progresso. Os logs de partidas continuam guardados para exportação.' : 'Não há jogo salvo.'}</p></div><button class="botao" data-act="save-delete" ${camp ? '' : 'disabled'}>Apagar save</button></div>
    <div class="linha-logs"><button class="botao principal" data-act="settings-back">Voltar</button></div>
  </section>`;
}
function renderDeck() {
  const deck = camp.deck, coll = camp.collection;
  const probs = R.deckProblems(deck, coll);
  const discs = ownedDiscs();
  const inDeck = id => deck.cards[id] || 0;
  const sortC = (a, b) => E.DEF[a].cost - E.DEF[b].cost || E.DEF[a].name.localeCompare(E.DEF[b].name);
  const row = (id, side) => {
    const d = E.DEF[id]; const own = coll[id] || 0; const k = inDeck(id);
    const canAdd = k < 2 && k < own && (!d.disc || d.disc === 'neutra' || d.disc === deck.disc);
    const btn = side === 'deck' ? `<button class="botao discreto" data-deckrem="${id}" aria-label="Tirar ${esc(d.name)}">Tirar</button>` : `<button class="botao discreto" data-deckadd="${id}" ${canAdd ? '' : 'disabled'} aria-label="Pôr ${esc(d.name)}">Pôr</button>`;
    const count = side === 'deck' ? `×${k}` : `${k}/${own}`;
    return `<li class="linha-carta disc-${d.disc || 'neutra'}" data-info="d:${id}"><span class="lc-custo">${d.cost}</span><span class="lc-nome"><span class="lc-ico">${iconSvg(cardIconName(id))}</span>${esc(d.name)} ${rarTag(id)}<span class="lc-tipo">${d.module ? 'Feitiço (Módulo)' : TYPE_LABEL[d.type] + (d.tags.length ? ' (' + d.tags.join(', ') + ')' : '')}</span><small>${d.text ? fmtText(d.text, true) : ''}</small></span>${statsMini(d)}<span class="lc-qtd">${count}</span>${btn}</li>`;
  };
  const deckIds = Object.keys(deck.cards).filter(id => deck.cards[id] > 0).sort(sortC);
  const f = ui.deckFilter;
  const collIds = Object.keys(coll).filter(id => coll[id] > 0 && (f === 'todas' || (f === 'neutra' ? (E.DEF[id].disc || 'neutra') === 'neutra' : E.DEF[id].disc === deck.disc))).sort(sortC);
  const curve = [0, 0, 0, 0, 0, 0, 0, 0];
  deckIds.forEach(id => { curve[Math.min(7, E.DEF[id].cost)] += deck.cards[id]; });
  const mx = Math.max(1, ...curve);
  $('#app').innerHTML = `<header class="abertura"><h1>Editar deck</h1><p class="intro">30 cartas, até 2 cópias, uma Disciplina mais neutras.</p></header>
    <div class="linha-logs"><button class="botao principal" data-act="home">Voltar</button>
      <span>Disciplina:</span>${discs.map(d => `<button class="botao ${d === deck.disc ? 'principal' : ''} disc-${d}" data-deckdisc="${d}">${esc(DISC_NAME[d])}</button>`).join('')}</div>
    <p class="camp-linha ${probs.length ? 'erro' : 'ok'}">${R.deckSize(deck)}/30 cartas. ${probs.length ? esc(probs[0]) : 'Deck pronto para descer.'}</p>
    <div class="curva" aria-label="Curva de mana">${curve.map((n, i) => `<div><i style="height:${Math.round(48 * n / mx)}px"></i><span>${i === 7 ? '7+' : i}</span><small>${n}</small></div>`).join('')}</div>
    <div class="editor">
      <section><div class="linha-logs"><h2 style="margin:0">Deck</h2><button class="botao discreto" data-act="deck-clear" ${R.deckSize(deck) ? '' : 'disabled'}>Limpar deck</button></div><ul class="lista-cartas">${deckIds.map(id => row(id, 'deck')).join('') || '<li class="vazio">Vazio</li>'}</ul></section>
      <section><h2>Coleção</h2><div class="linha-logs">${[['disc', DISC_NAME[deck.disc]], ['neutra', 'Neutras'], ['todas', 'Todas']].map(([k, l]) => `<button class="botao ${f === k ? 'principal' : ''}" data-deckfilter="${k}">${esc(l)}</button>`).join('')}</div>
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
  $('#app').innerHTML = `<header class="abertura"><h1>Andar ${run.floor}${run.revisit ? ' (revisita)' : ''}</h1><p class="sub">As Grutas Vivas, dia ${camp.day}</p></header>
    <section class="painel-camp mapa-topo">
      <span class="voce-vida"><b>${run.hp}</b><span class="conta">de 30</span><span class="barra"><i style="width:${Math.round(100 * run.hp / 30)}%"></i></span></span>
      <span title="${esc(run.mochila.map(id => E.DEF[id].name).join(', '))}">Mochila: ${run.mochila.length} carta${run.mochila.length === 1 ? '' : 's'}</span>
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
    body = `<h2>Acampamento</h2><p>Uma fenda seca, longe dos cogumelos. Felix já se acomodou na sua mochila.</p><div class="opcoes coluna"><button class="botao" data-evc="descansar">Descansar (recupere 12 de Vida)</button><button class="botao" data-evc="preparar">Preparar (na próxima luta, comece com 1 carta a mais)</button></div>`;
  } else if (sc.kind === 'nota') {
    body = `<h2>Nota de Ergos</h2><blockquote class="nota">${esc(R.NOTES[sc.floor])}</blockquote><p class="destaque">${sc.first ? 'Felix guarda a anotação. Na próxima luta, comece com 1 carta a mais.' : 'Você já leu esta nota.'}</p><div class="opcoes"><button class="botao principal" data-act="scene-ok">Continuar</button></div>`;
  } else if (sc.kind === 'elite') {
    body = `<h2>Recompensa da Elite</h2><p>Escolha uma carta para a mochila.</p><div class="prever-lista">${sc.cards.map(id => cardById(id, '', `data-pick="${id}"`)).join('')}</div><div class="opcoes"><button class="botao" data-act="pick-skip">Pular</button></div>`;
  } else if (sc.kind === 'booster-choice') {
    body = `<h2>Andar ${sc.floor} concluído</h2><p>${sc.mochila.length ? `Da mochila para a coleção: ${esc(sc.mochila.map(id => E.DEF[id].name).join(', '))}.` : 'A mochila voltou vazia.'} Escolha o seu booster.</p>
      <div class="opcoes"><button class="botao principal disc-${camp.deck.disc}" data-pack="${camp.deck.disc}">Booster de ${esc(DISC_NAME[camp.deck.disc])}</button><button class="botao" data-pack="geral">Booster Geral</button></div>
      <p class="intro">Cada booster tem 5 cartas: 3 Comuns, 1 Incomum e 1 Incomum ou Rara. O Geral pode trazer qualquer Disciplina ou neutra.</p>`;
  } else if (sc.kind === 'booster') {
    body = `<h2>${sc.type === 'geral' ? 'Booster Geral' : 'Booster de ' + esc(DISC_NAME[sc.type])}</h2><div class="prever-lista">${sc.cards.map(id => cardById(id, '', '', camp.collection[id] > 1 ? '' : 'Nova')).join('')}</div><p class="destaque">As cartas já estão na sua coleção.</p><div class="opcoes"><button class="botao principal" data-act="home">Voltar à guilda</button><button class="botao" data-act="deck-edit">Editar deck</button></div>`;
  } else if (sc.kind === 'msg') {
    body = `<h2>${esc(sc.title)}</h2><p>${esc(sc.text)}</p><div class="opcoes"><button class="botao principal" data-act="home">Voltar à guilda</button></div>`;
  } else if (sc.kind === 'notes') {
    body = `<h2>Notas de Ergos</h2>${camp.notes.length ? camp.notes.slice().sort().map(f => `<p class="linha">Andar ${f}</p><blockquote class="nota">${esc(R.NOTES[f])}</blockquote>`).join('') : '<p>Nenhuma nota ainda.</p>'}<div class="opcoes"><button class="botao principal" data-act="home">Voltar</button></div>`;
  }
  const vida = camp && camp.run && ['event', 'camp', 'nota', 'treasure', 'elite'].includes(sc.kind) ? `<p class="vida-cena voce-vida"><b>${camp.run.hp}</b><span class="conta">de 30 de Vida</span><span class="barra"><i style="width:${Math.round(100 * camp.run.hp / 30)}%"></i></span></p>` : '';
  $('#app').innerHTML = `<section class="cena">${vida}${body}</section>`;
}
function renderScreen() {
  if (ui.screen === 'title') renderTitle();
  else if (ui.screen === 'intro' && ui.intro) renderIntro();
  else if (ui.screen === 'settings') renderSettings();
  else if (ui.screen === 'avulsa') renderSetup();
  else if (ui.screen === 'deck' && camp) renderDeck();
  else if (ui.screen === 'credits') renderCredits();
  else if (ui.screen === 'map' && camp && camp.run) renderMap();
  else if (ui.screen === 'scene' && ui.scene) renderScene();
  else { ui.screen = 'home'; renderHome(); }
}
async function runClick(ds) {
  const act = ds.act;
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
  if (act === 'deck-clear') { const c = await choose('Limpar deck', 'Tirar todas as cartas do deck? Elas continuam na coleção.', [{ v: 'sim', label: 'Limpar' }]); if (c === 'sim') { camp.deck.cards = {}; saveCamp(); render(); } return true; }
  if (act === 'deck-edit') { if (camp && camp.run) { toast('O deck só pode ser editado na guilda, entre descidas.'); return true; } ui.screen = 'deck'; ui.deckFilter = 'disc'; render(); window.scrollTo(0, 0); return true; }
  if (ds.deckadd) { const id = ds.deckadd; camp.deck.cards[id] = (camp.deck.cards[id] || 0) + 1; saveCamp(); render(); return true; }
  if (ds.deckrem) { const id = ds.deckrem; camp.deck.cards[id] = Math.max(0, (camp.deck.cards[id] || 0) - 1); if (!camp.deck.cards[id]) delete camp.deck.cards[id]; saveCamp(); render(); return true; }
  if (ds.deckdisc) { const d = ds.deckdisc; camp.deck.disc = d; Object.keys(camp.deck.cards).forEach(id => { const dd = E.DEF[id].disc; if (dd && dd !== 'neutra' && dd !== d) delete camp.deck.cards[id]; }); saveCamp(); render(); return true; }
  if (ds.deckfilter) { ui.deckFilter = ds.deckfilter; render(); return true; }
  if (ds.floor) { startDescent(+ds.floor, ds.revisit === '1'); return true; }
  if (act === 'continue-run') { ui.screen = 'map'; render(); return true; }
  if (act === 'run-resume') { startRunBattle(camp.run.inBattle); return true; }
  if (ds.node !== undefined && ui.screen === 'map') { enterNode(+ds.node); return true; }
  if (act === 'run-giveup') { const c = await choose('Desistir da descida', 'Conta como derrota: você volta à superfície e o andar recomeça amanhã.', [{ v: 'sim', label: 'Desistir' }]); if (c === 'sim') floorFailed('Você desistiu da descida.'); return true; }
  if (ds.evc) {
    if (ui.scene.kind === 'camp') {
      if (ds.evc === 'descansar') { hpChange(12); hist({ k: 'acampamento', choice: 'descansar' }); }
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
function render() {
  if (ui.screen !== 'battle' || !st) { renderScreen(); $('#app').insertAdjacentHTML('beforeend', (ui.toast ? `<div class="aviso" role="status">${esc(ui.toast)}</div>` : '') + (ui.modal ? modalHtml() : '')); return; }
  persist();
  const handScroll = $('.mao') ? $('.mao').scrollLeft : 0;
  const logScroll = $('.registro ol') ? $('.registro ol').scrollTop : 0;
  const tgt = targetSet();
  const mirando = ui.mode && ['play', 'attack', 'hero', 'resonate'].includes(ui.mode.kind);
  $('#app').innerHTML = `<div class="jogo">
    <main class="mesa ${mirando ? 'mirando' : ''}">
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
  if (!chk.ok) { toast(chk.reason || 'Não dá para jogar agora.'); return; }
  const opts = {};
  if (d.sangria && chk.canLife) {
    if (chk.canMana) {
      const c = await choose(d.name, 'Como você quer pagar?', [{ v: 'mana', label: `Pagar ${chk.cost} de mana` }, { v: 'vida', label: `Pagar ${d.sangria} de vida` }]);
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
  if (!r.ok) toast(r.reason);
  afterAction();
}
function runTarget(ref) {
  const m = ui.mode;
  if (m.kind === 'play') { const r = E.playCard(st, 'P', m.idx, Object.assign({}, m.opts, { target: ref })); if (!r.ok) toast(r.reason); }
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
    if (!chk.ok) { ui.mode = { kind: 'inspect', idx, name: E.DEF[inst.id].name, reason: chk.reason || 'Não dá para jogar agora.' }; render(); return; }
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

if (typeof IMG !== 'undefined') for (const [k, v] of Object.entries(IMG)) document.documentElement.style.setProperty('--img-' + k, `url("${v}")`);
render();
})();
