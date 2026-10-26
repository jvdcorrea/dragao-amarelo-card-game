/* Dragão Amarelo: campanha (raridade, boosters, mapa, eventos). Lógica pura. */
(function (root) {
'use strict';
const E = root.Engine || (typeof require !== 'undefined' ? require('./engine.js') : null);

const RAR = { C: 'Comum', I: 'Incomum', R: 'Rara' };
const RARITY = {
  // Temporal
  recruta: 'C', batedor_amanha: 'C', escudeiro: 'C', golpe_previsto: 'C', arqueira: 'C', veterano: 'C', duelista: 'C',
  rebobinar: 'I', lamina_reb: 'I', licao: 'I', coluna: 'I', estandarte: 'I', cavaleiro: 'I',
  machado: 'R', carga: 'R', marechal: 'R',
  // Draconic
  ovo: 'C', seiva: 'C', broto: 'C', muralha: 'C', pele: 'C', chamado: 'C', draconete: 'C',
  rugido: 'I', guardia: 'I', sopro: 'I', matriarca: 'I', tita: 'I',
  furia: 'R', wyrm: 'R', rei_dragao: 'R',
  // Necrodance
  esqueleto: 'C', passo: 'C', metronomo: 'C', coveiro: 'C', mao_alem: 'C', pacto: 'C',
  valsa: 'I', maldicao: 'I', golpe_final: 'I', menestrel: 'I', maestro: 'I', coro: 'I',
  bailarina: 'R', danse: 'R', regente: 'R',
  // Holy
  acolito: 'C', oracao: 'C', lamina_veu: 'C', novico: 'C', juramento: 'C', fanatico: 'C',
  veu_renovado: 'I', assassina: 'I', lamina_prece: 'I', vigilia: 'I', sacerdotisa: 'I', mestre: 'I', julgamento: 'I', purificacao: 'I',
  liturgia: 'R', arauto: 'R', serafim: 'R',
  // Tech
  automato: 'C', frasco: 'C', placa: 'C', molas: 'C', aprendiz_alq: 'C', nucleo: 'C',
  torre: 'I', golem_latao: 'I', besta: 'I', gas: 'I', oficina: 'I', cav_engr: 'I',
  canhao: 'R', destilaria: 'R', colosso: 'R',
  // Space
  faisca: 'C', astrolabio: 'C', chuva: 'C', aprendiz_astral: 'C', escudo_grav: 'C',
  leitura: 'I', raio: 'I', grifo: 'I', golem_poeira: 'I', elemental: 'I', eclipse: 'I', cometa: 'I',
  quimera: 'R', buraco_negro: 'R', arquimago: 'R',
  // Neutras
  felix: 'C', tocha: 'C', rede: 'C', curandeira: 'C', guardiao: 'C', espada: 'C', coletor: 'C', pocao: 'C', lanceiro: 'C', bombardeiro: 'C', racao: 'C', bumerangue: 'C',
  investida_coord: 'I', capita: 'I', formacao: 'I', lamina_enc: 'I', elixir: 'I', barril: 'I',
  mapa_ergos: 'R', gigante: 'R',
};
const DISCS = ['temporal', 'draconic', 'necro', 'holy', 'tech', 'space'];
function poolOf(group) { return Object.keys(RARITY).filter(id => (E.DEF[id].disc || 'neutra') === group); }
function pick(rng, a) { return a[Math.floor(rng() * a.length)]; }
function rollRarity(rng, w) { const r = rng(); return r < w.C ? 'C' : r < w.C + w.I ? 'I' : 'R'; }
function cardFrom(rng, groups, rar) {
  let cands = [];
  groups.forEach(g => { cands = cands.concat(poolOf(g).filter(id => RARITY[id] === rar)); });
  if (!cands.length) groups.forEach(g => { cands = cands.concat(poolOf(g)); });
  return pick(rng, cands);
}
/* Booster: 3 Comuns, 1 Incomum e 1 vaga que vira Rara em 35% das vezes. */
function openPack(rng, type) {
  const groups = type === 'geral' ? DISCS.concat(['neutra']) : [type];
  const slots = ['C', 'C', 'C', 'I', rng() < 0.35 ? 'R' : 'I'];
  return slots.map(r => cardFrom(rng, groups, r));
}
/* Escolha com peso: cartas que o jogador ainda não tem valem o dobro. */
function weightedFrom(rng, groups, rar, coll) {
  let cands = [];
  groups.forEach(g => { cands = cands.concat(poolOf(g).filter(id => RARITY[id] === rar)); });
  if (!cands.length) groups.forEach(g => { cands = cands.concat(poolOf(g)); });
  if (!coll) return pick(rng, cands);
  const w = cands.map(id => (coll[id] ? 1 : 2)); let r = rng() * w.reduce((s, x) => s + x, 0);
  for (let i = 0; i < cands.length; i++) { r -= w[i]; if (r < 0) return cands[i]; }
  return cands[cands.length - 1];
}
/* Booster do andar: geral, com 2 cartas garantidas da Disciplina do deck (1 Comum e a vaga Incomum/Rara). */
function openFloorPack(rng, disc, coll) {
  const all = DISCS.concat(['neutra']); const top = rng() < 0.35 ? 'R' : 'I';
  return [weightedFrom(rng, [disc], 'C', coll), weightedFrom(rng, all, 'C', coll), weightedFrom(rng, all, 'C', coll), weightedFrom(rng, all, 'I', coll), weightedFrom(rng, [disc], top, coll)];
}
/* Booster de Mestre: 5 cartas da Disciplina. */
function openDiscPack(rng, disc, coll) { const top = rng() < 0.35 ? 'R' : 'I'; return ['C', 'C', 'C', 'I', top].map(rr => weightedFrom(rng, [disc], rr, coll)); }
function eliteChoices(rng, disc) { return [0, 1, 2].map(() => cardFrom(rng, [disc, 'neutra'], rng() < 0.3 ? 'R' : 'I')); }
function treasureCard(rng, disc) { return cardFrom(rng, [disc, 'neutra'], rollRarity(rng, { C: 0.55, I: 0.35 })); }

function starterCollection(disc) {
  const c = {};
  E.DISC[disc].cards.forEach(id => { c[id] = (c[id] || 0) + 2; });
  Object.entries(E.NEUTRAL_STARTER).forEach(([id, n]) => { c[id] = (c[id] || 0) + n; });
  return c;
}
function deckList(deck) { const out = []; Object.entries(deck.cards).forEach(([id, n]) => { for (let i = 0; i < n; i++) out.push(id); }); return out; }
function deckSize(deck) { return Object.values(deck.cards).reduce((a, b) => a + b, 0); }
function deckProblems(deck, collection) {
  const p = [];
  const n = deckSize(deck);
  if (n !== 30) p.push(`O deck tem ${n} carta${n === 1 ? '' : 's'}; precisa de 30.`);
  Object.entries(deck.cards).forEach(([id, k]) => {
    const d = E.DEF[id];
    if (k > 2) p.push(`${d.name}: no máximo 2 cópias.`);
    if ((collection[id] || 0) < k) p.push(`${d.name}: você só tem ${collection[id] || 0}.`);
    if (d.disc && d.disc !== 'neutra' && d.disc !== deck.disc) p.push(`${d.name} é de outra Disciplina.`);
  });
  return p;
}

/* ---------------- Andares ---------------- */
const FLOORS = {
  1: { commons: ['revoada'], elites: [], final: 'revoada', finalBonus: 5 },
  2: { commons: ['revoada', 'jardim'], elites: ['imperatriz', 'fungo'], final: 'elite' },
  3: { commons: ['revoada', 'jardim', 'bicharada'], elites: ['imperatriz', 'fungo'], final: 'elite' },
  4: { commons: ['revoada', 'jardim', 'bicharada', 'toca'], elites: ['imperatriz', 'fungo'], final: 'elite' },
  5: { commons: ['revoada', 'jardim', 'bicharada', 'toca'], elites: ['imperatriz', 'fungo'], final: 'basilisco' },
};
const NODE = {
  batalha: { label: 'Batalha', icon: '⚔' }, elite: { label: 'Elite', icon: '✦' }, evento: { label: 'Evento', icon: '?' },
  acampamento: { label: 'Acampamento', icon: '♨' }, tesouro: { label: 'Tesouro', icon: '◆' }, nota: { label: 'Nota de Ergos', icon: '✎' },
  chefe: { label: 'Chefe', icon: '☠' },
};
function genMap(rng, floor, withNote) {
  const ROWS = 6, COLS = 4;
  const nodes = [], grid = {}, edges = [];
  const get = (r, c) => { const k = r + ':' + c; if (!grid[k]) { grid[k] = { id: nodes.length, row: r, col: c, next: [] }; nodes.push(grid[k]); } return grid[k]; };
  const crosses = (r, c0, c1) => edges.some(([r0, a, b]) => r0 === r && (a - c0) * (b - c1) < 0);
  const used = [];
  for (let p = 0; p < 3; p++) {
    let c = Math.floor(rng() * COLS);
    if (used.includes(c) && p < 2) c = [0, 1, 2, 3].find(x => !used.includes(x));
    used.push(c);
    let prev = get(0, c);
    for (let r = 1; r < ROWS; r++) {
      let opts = [c - 1, c, c + 1].filter(x => x >= 0 && x < COLS && !crosses(r - 1, c, x));
      if (!opts.length) opts = [c];
      const nc = opts[Math.floor(rng() * opts.length)];
      edges.push([r - 1, c, nc]);
      const n = get(r, nc);
      if (!prev.next.includes(n.id)) prev.next.push(n.id);
      prev = n; c = nc;
    }
  }
  const fin = { id: nodes.length, row: ROWS, col: (COLS - 1) / 2, next: [], final: true };
  nodes.push(fin);
  nodes.filter(n => n.row === ROWS - 1).forEach(n => n.next.push(fin.id));
  const F = FLOORS[floor];
  const parents = id => nodes.filter(n => n.next.includes(id));
  nodes.forEach(n => {
    if (n.final) { n.type = floor === 5 ? 'chefe' : 'elite'; return; }
    if (n.row === 0) { n.type = 'batalha'; return; }
    if (n.row === ROWS - 1) { n.type = rng() < 0.6 ? 'acampamento' : 'batalha'; return; }
    const w = [['batalha', 45], ['evento', 22], ['tesouro', 10], ['acampamento', 10]];
    if (F.elites.length && n.row >= 2 && !parents(n.id).some(p => p.type === 'elite')) w.push(['elite', 13]);
    const tot = w.reduce((a, x) => a + x[1], 0); let r = rng() * tot;
    n.type = w.find(x => (r -= x[1]) < 0)[0];
  });
  if (withNote) {
    const mids = nodes.filter(n => n.row >= 1 && n.row <= 4);
    pick(rng, mids).type = 'nota';
  }
  nodes.forEach(n => {
    if (n.type === 'batalha') n.enc = pick(rng, F.commons);
    if (n.type === 'elite' && !n.final) n.enc = pick(rng, F.elites);
    if (n.final) { n.enc = F.final === 'elite' ? pick(rng, F.elites) : F.final; n.encBonus = F.finalBonus || 0; }
  });
  return { rows: ROWS, cols: COLS, nodes };
}

/* ---------------- Eventos e notas ---------------- */
const EVENTS = [
  { id: 'cogumelos', title: 'Cogumelos Luminosos', text: 'Um tapete de cogumelos brilha num tom convidativo demais.',
    choices: [{ id: 'comer', label: 'Comer um (50%: recupere 10 de Vida; 50%: perca 4)' }, { id: 'colher', label: 'Colher para a viagem (ganhe uma Ração de Viagem)' }, { id: 'sair', label: 'Seguir em frente' }] },
  { id: 'teia', title: 'Gato na Teia', text: 'Um Felino da Guilda pende de uma teia grossa, miando ofendido.',
    choices: [{ id: 'cortar', label: 'Cortar a teia (perca 4 de Vida; ganhe uma carta Felino)' }, { id: 'sair', label: 'Deixar para outra ocasião' }] },
  { id: 'altar', title: 'Altar Coberto de Musgo', text: 'Alguém deixou velas acesas aqui. Recentemente.',
    choices: [{ id: 'sangue', label: 'Oferecer sangue (perca 6 de Vida; ganhe uma carta Rara da sua Disciplina)' }, { id: 'rezar', label: 'Rezar (recupere 5 de Vida)' }, { id: 'sair', label: 'Ignorar' }] },
  { id: 'ponte', title: 'Ponte de Raízes', text: 'Raízes trançadas cruzam um abismo. Elas rangem.',
    choices: [{ id: 'correr', label: 'Atravessar correndo (perca 5 de Vida; na próxima luta, comece com +1 de mana máxima)' }, { id: 'sair', label: 'Dar a volta' }] },
  { id: 'ninho', title: 'Ninho Abandonado', text: 'Um ninho enorme, vazio. Quase vazio.',
    choices: [{ id: 'vasculhar', label: 'Vasculhar (60%: ganhe uma carta Incomum; 40%: os donos voltam e você luta)' }, { id: 'sair', label: 'Deixar quieto' }] },
  { id: 'eco', title: 'Eco de Passos', text: 'Passos ecoam à frente, no ritmo exato dos seus. Você para. Eles param.',
    choices: [{ id: 'seguir', label: 'Seguir o eco (na próxima luta, comece com 1 carta a mais)' }, { id: 'sair', label: 'Voltar pelo caminho conhecido' }] },
];
const NOTES = {
  1: 'Dia 1. O buraco respondeu ao meu sangue como uma porta que reconhece a chave. Felix acha que é má ideia. Felix acha tudo que é interessante má ideia.',
  2: 'Os cogumelos daqui crescem rápido demais. Se o broto não for cortado na hora, vira problema. Anotei para não esquecer. De novo.',
  3: 'Achei uma estrutura que solta morcegos sem parar. Quebre o ninho antes de brigar com a revoada. Sim, isso vale para a vida também.',
  4: 'Algo grande passou por aqui deixando estátuas. Estátuas com cara de surpresa. Não gosto de estátuas com cara de surpresa.',
  5: 'O lagarto olha para o mais forte e o transforma em pedra. Então não seja o mais forte: seja muitos. Se alguém da família estiver lendo isto, já falhei em ser muitos.',
};

const RunLib = { RAR, RARITY, DISCS, poolOf, openPack, openFloorPack, openDiscPack, weightedFrom, eliteChoices, treasureCard, cardFrom, starterCollection, deckList, deckSize, deckProblems, FLOORS, NODE, genMap, EVENTS, NOTES };
if (typeof module !== 'undefined' && module.exports) module.exports = RunLib;
else root.RunLib = RunLib;
})(typeof window !== 'undefined' ? window : globalThis);
