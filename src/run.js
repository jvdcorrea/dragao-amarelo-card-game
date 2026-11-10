/* Dragão Amarelo: campanha (raridade, boosters, mapa, eventos). Lógica pura. */
(function (root) {
'use strict';
const T = (root.I18N || (typeof require !== 'undefined' ? require('./i18n.js') : null)).T;
const E = root.Engine || (typeof require !== 'undefined' ? require('./engine.js') : null);

const RAR = { C: T('Comum'), I: T('Incomum'), R: T('Rara') };
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
  // Grupo 2: A Forja Esquecida (só a partir do andar 6)
  martelo_forja: 'I', gato_ferreiro: 'C', brasa_guardada: 'C', lingote: 'C',
  golpe_vem: 'I', ferreiro_eras: 'C', veterano_bigorna: 'R', ensaio: 'C',
  dragao_escoria: 'I', sopro_magma: 'I', ovo_incandescente: 'C', wyrm_ferro: 'R',
  ferreiro_esqueletico: 'C', requiem_bigorna: 'R', martelo_funebre: 'C', cinzas_dancam: 'I',
  sacerdote_brasa: 'C', ritual_metal: 'R', lamina_obsidiana: 'C', penitente_forja: 'I',
  nucleo_escoria: 'C', golem_amigo: 'I', bancada_rebites: 'C', automato_fundidor: 'R',
  meteoro_ferroso: 'I', astro_fundido: 'C', faisca_magnetica: 'C', cometa_ferro: 'R',
};
/* Grupo de cartas liberado e chance de Rara na vaga Incomum/Rara (P91: 50% nos andares 6 a 10). */
let GRUPO_MAX = 1, RARE_P = 0.35;
function setGrupo(g, rareP) { GRUPO_MAX = g || 1; RARE_P = rareP || 0.35; }
const DISCS = ['temporal', 'draconic', 'necro', 'holy', 'tech', 'space'];
function poolOf(group) { return Object.keys(RARITY).filter(id => (E.DEF[id].disc || 'neutra') === group && (E.DEF[id].grupo || 1) <= GRUPO_MAX); }
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
  const slots = ['C', 'C', 'C', 'I', rng() < RARE_P ? 'R' : 'I'];
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
  const all = DISCS.concat(['neutra']); const top = rng() < RARE_P ? 'R' : 'I';
  return [weightedFrom(rng, [disc], 'C', coll), weightedFrom(rng, all, 'C', coll), weightedFrom(rng, all, 'C', coll), weightedFrom(rng, all, 'I', coll), weightedFrom(rng, [disc], top, coll)];
}
/* Booster de Mestre: 5 cartas da Disciplina. */
function openDiscPack(rng, disc, coll) { const top = rng() < RARE_P ? 'R' : 'I'; return ['C', 'C', 'C', 'I', top].map(rr => weightedFrom(rng, [disc], rr, coll)); }
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
  if (n !== 30) p.push(T`O deck tem ${n} carta${n === 1 ? '' : 's'}; precisa de 30.`);
  Object.entries(deck.cards).forEach(([id, k]) => {
    const d = E.DEF[id];
    if (k > 2) p.push(T`${d.name}: no máximo 2 cópias.`);
    if ((collection[id] || 0) < k) p.push(T`${d.name}: você só tem ${collection[id] || 0}.`);
    if (d.disc && d.disc !== 'neutra' && d.disc !== deck.disc) p.push(T`${d.name} é de outra Disciplina.`);
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
  6: { commons: ['oficina'], elites: [], final: 'oficina', finalBonus: 4 },
  7: { commons: ['oficina', 'bocas'], elites: ['colosso_ferro', 'matriarca_azer'], final: 'elite' },
  8: { commons: ['oficina', 'bocas', 'fundicao'], elites: ['colosso_ferro', 'matriarca_azer'], final: 'elite' },
  9: { commons: ['oficina', 'bocas', 'fundicao', 'patrulha_azer'], elites: ['colosso_ferro', 'matriarca_azer'], final: 'elite' },
  10: { commons: ['oficina', 'bocas', 'fundicao', 'patrulha_azer'], elites: ['colosso_ferro', 'matriarca_azer'], final: 'ignar' },
};
const GRUPOS = { 1: { nome: T('As Grutas Vivas'), andares: [1, 2, 3, 4, 5] }, 2: { nome: T('A Forja Esquecida'), andares: [6, 7, 8, 9, 10] } };
const grupoDo = floor => (floor >= 6 ? 2 : 1);
const MAX_FLOOR = 10;
const NODE = {
  batalha: { label: T('Batalha'), icon: '⚔' }, elite: { label: T('Elite'), icon: '✦' }, evento: { label: T('Evento'), icon: '?' },
  acampamento: { label: T('Acampamento'), icon: '♨' }, tesouro: { label: T('Tesouro'), icon: '◆' }, nota: { label: T('Nota de Ergos'), icon: '✎' },
  chefe: { label: T('Chefe'), icon: '☠' }, banca: { label: T('Banca Azer'), icon: '⚒' },
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
    if (n.final) { n.type = floor === 5 || floor === 10 ? 'chefe' : 'elite'; return; }
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
  if (floor >= 6) {
    const cand = nodes.filter(n => n.row >= 2 && n.row <= 4 && n.type !== 'nota' && n.type !== 'elite');
    const k = Math.min(cand.length, rng() < 0.5 ? 1 : 2);
    for (let i = 0; i < k; i++) { const c = cand.splice(Math.floor(rng() * cand.length), 1)[0]; c.type = 'banca'; }
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
  // Grupo 1: As Grutas Vivas
  { id: 'cogumelos', title: T('Cogumelos Luminosos'), text: T('Um tapete de cogumelos brilha num tom convidativo demais.'),
    choices: [{ id: 'comer', label: T('Comer um (50%: recupere 10 de Vida; 50%: perca 4)') }, { id: 'colher', label: T('Colher para a viagem (ganhe uma Ração de Viagem)') }, { id: 'sair', label: T('Seguir em frente') }] },
  { id: 'teia', title: T('Gato na Teia'), text: T('Um Felino da Guilda pende de uma teia grossa, miando ofendido.'),
    choices: [{ id: 'cortar', label: T('Cortar a teia (perca 4 de Vida; ganhe uma carta Felino)') }, { id: 'sair', label: T('Deixar para outra ocasião') }] },
  { id: 'altar', title: T('Altar Coberto de Musgo'), text: T('Alguém deixou velas acesas aqui. Recentemente.'),
    choices: [{ id: 'sangue', label: T('Oferecer sangue (perca 6 de Vida; ganhe uma carta Rara da sua Disciplina)') }, { id: 'rezar', label: T('Rezar (recupere 5 de Vida)') }, { id: 'sair', label: T('Ignorar') }] },
  { id: 'ponte', title: T('Ponte de Raízes'), text: T('Raízes trançadas cruzam um abismo. Elas rangem.'),
    choices: [{ id: 'correr', label: T('Atravessar correndo (perca 5 de Vida; na próxima luta, comece com +1 de mana máxima)') }, { id: 'sair', label: T('Dar a volta') }] },
  { id: 'ninho', title: T('Ninho Abandonado'), text: T('Um ninho enorme, vazio. Quase vazio.'),
    choices: [{ id: 'vasculhar', label: T('Vasculhar (60%: ganhe uma carta Incomum; 40%: os donos voltam e você luta)') }, { id: 'sair', label: T('Deixar quieto') }] },
  { id: 'eco', title: T('Eco de Passos'), text: T('Passos ecoam à frente, no ritmo exato dos seus. Você para. Eles param.'),
    choices: [{ id: 'seguir', label: T('Seguir o eco (na próxima luta, comece com 1 carta a mais)') }, { id: 'sair', label: T('Voltar pelo caminho conhecido') }] },
];
EVENTS.forEach(e => { e.grupo = 1; });
/* Grupo 2: A Forja Esquecida. Cada evento tem uma escolha segura e uma arriscada. */
const EVENTS2 = [
  { id: 'bigorna', grupo: 2, title: T('Bigorna Abandonada'), text: T('Uma bigorna ainda quente, com um martelo pendurado num prego. Alguém saiu no meio do serviço.'),
    choices: [{ id: 'cuidado', label: T('Bater com cuidado (+1 de Sucata)') }, { id: 'tudo', label: T('Forjar com tudo (50%: uma arma ou Módulo Raro; 50%: perca 8 de Vida)') }, { id: 'sair', label: T('Deixar o martelo onde está') }] },
  { id: 'rio', grupo: 2, title: T('Rio de Metal Derretido'), text: T('Um rio de ferro líquido corta o salão. Há uma ponte, se dá para chamar aquilo de ponte.'),
    choices: [{ id: 'contornar', label: T('Contornar pelas beiradas (perca 2 de Vida)') }, { id: 'ponte', label: T('Atravessar a ponte instável (60%: +4 de Sucata; 40%: perca 10 de Vida)') }] },
  { id: 'golem', grupo: 2, title: T('Golem Adormecido'), text: T('Um golem enorme dorme encostado na parede. As placas dele valem uma fortuna em sucata.'),
    choices: [{ id: 'desmontar', label: T('Desmontar para Sucata (+5 de Sucata; 50%: ele acorda e você luta)') }, { id: 'sair', label: T('Passar na ponta dos pés') }] },
  { id: 'altar_fogo', grupo: 2, title: T('Altar do Fogo Eterno'), text: T('Uma chama que não consome nada arde sobre uma pedra gravada com runas Azer.'),
    choices: [{ id: 'ouro', label: T('Oferecer 20 de ouro (recupere 10 de Vida)') }, { id: 'vida', label: T('Oferecer 6 de Vida (na próxima luta, comece com +1 de mana máxima)') }, { id: 'sair', label: T('Não mexer com fogo') }] },
  { id: 'prisioneiro', grupo: 2, title: T('Prisioneiro Azer'), text: T('Um Azer acorrentado a uma fornalha fria pede ajuda. O guarda dele, outro Azer, cruza os braços.'),
    choices: [{ id: 'negociar', label: T('Negociar com o guarda (luta social: +4 de Sucata e desconto nas Bancas desta descida)') }, { id: 'sair', label: T('Não se meter') }] },
  { id: 'vapor', grupo: 2, title: T('Respiro de Vapor'), text: T('Uma rachadura no chão solta vapor quente em intervalos regulares. O outro lado parece promissor.'),
    choices: [{ id: 'esperar', label: T('Esperar o intervalo certo (recupere 3 de Vida no calor seco)') }, { id: 'correr', label: T('Correr no meio do vapor (perca 5 de Vida; na próxima luta, comece com 2 cartas a mais)') }] },
];
/* Evento garantido nos andares 7 ou 8: o cofre de Ergos com a engrenagem da Chrome. */
const COFRE = { id: 'cofre', grupo: 2, title: T('O Cofre de Ergos'), text: T('Entre duas bigornas, um cofre pequeno com o brasão do Dragão Amarelo. A fechadura reconhece o seu sangue com um estalo.'),
  choices: [{ id: 'abrir', label: T('Abrir o cofre') }] };
const NOTES = {
  1: T('Dia 1. O buraco respondeu ao meu sangue como uma porta que reconhece a chave. Felix acha que é má ideia. Felix acha tudo que é interessante má ideia.'),
  2: T('Os cogumelos daqui crescem rápido demais. Se o broto não for cortado na hora, vira problema. Anotei para não esquecer. De novo.'),
  3: T('Achei uma estrutura que solta morcegos sem parar. Quebre o ninho antes de brigar com a revoada. Sim, isso vale para a vida também.'),
  4: T('Algo grande passou por aqui deixando estátuas. Estátuas com cara de surpresa. Não gosto de estátuas com cara de surpresa.'),
  5: T('O lagarto olha para o mais forte e o transforma em pedra. Então não seja o mais forte: seja muitos. Se alguém da família estiver lendo isto, já falhei em ser muitos.'),
  6: T('Os golens daqui têm placas. Aço não sente arranhão: só magia passa direto, ou um golpe forte de verdade. Anotei duas vezes, porque esqueci da primeira.'),
  7: T('Os elementais de fogo se consomem sozinhos. Se eu aguentar uns turnos, eles se apagam. Se eu não aguentar, quem se apaga sou eu. Escondi a engrenagem da Chrome num cofre perto das bigornas; devolvo quando voltar. Ela vai cobrar juros.'),
  8: T('Achei um Azer que não tenta me matar. Troca qualquer coisa por sucata e cobra caro de quem chega sem educação. Cheguei sem educação.'),
  9: T('As forjas no meio dos salões alimentam tudo em volta. Quebrar a forja primeiro. Sempre a forja primeiro. Esqueci na hora, claro.'),
  10: T('Lá embaixo o calor some. O que vem depois da forja me assusta de um jeito que nada aqui assustou. Se eu não voltar, Felix, a culpa é do frio, não sua.'),
};

const RunLib = { setGrupo, GRUPOS, grupoDo, MAX_FLOOR, EVENTS2, COFRE, RAR, RARITY, DISCS, poolOf, openPack, openFloorPack, openDiscPack, weightedFrom, eliteChoices, treasureCard, cardFrom, starterCollection, deckList, deckSize, deckProblems, FLOORS, NODE, genMap, EVENTS, NOTES };
if (typeof module !== 'undefined' && module.exports) module.exports = RunLib;
else root.RunLib = RunLib;
})(typeof window !== 'undefined' ? window : globalThis);
