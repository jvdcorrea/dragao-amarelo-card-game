/* Dragão Amarelo: motor de regras do protótipo.
   Lógica pura, sem DOM. Cartas são dados + efeitos curtos. */
(function (root) {
'use strict';
const T = (root.I18N || (typeof require !== 'undefined' ? require('./i18n.js') : null)).T;

const BOARD_MAX = 7, HAND_MAX = 10, TRAP_MAX = 3, CARGA_MAX = 5;

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* ---------------- Cartas ---------------- */
const DEF = {};
function def(id, o) { o.id = id; o.kw = o.kw || []; o.tags = o.tags || []; DEF[id] = o; return o; }

// Neutras
def('felix', { name: T('Felix, o Familiar'), cost: 1, type: 'unit', atk: 1, hp: 1, tags: ['Felino'], disc: 'neutra', text: T('Felino. Ao Entrar: compre 1 carta.'), onPlay(st, s) { draw(st, s, 1); } });
def('pocao', { name: T('Poção de Fôlego'), cost: 2, type: 'spell', disc: 'neutra', text: T('Recupere 5 de vida.'), onPlay(st, s) { heal(st, s, 5); } });
def('mercenario', { name: T('Mercenário de Taverna'), cost: 3, type: 'unit', atk: 3, hp: 3, kw: ['guarda'], disc: 'neutra', text: T('Guarda.') });
def('tocha', { name: T('Tocha do Explorador'), cost: 1, type: 'spell', disc: 'neutra', target: () => 'enemyUnit', targetRequired: true, text: T('Cause 1 de dano a uma unidade inimiga. Compre 1 carta.'), onPlay(st, s, c) { dmg(st, c.target, 1, src(s, { spell: true })); draw(st, s, 1); } });
def('rede', { name: T('Rede de Captura'), cost: 1, type: 'spell', disc: 'neutra', target: () => 'enemyUnit', targetRequired: true, text: T('Deixe uma unidade inimiga Imóvel. Se você controlar um Felino, compre 1 carta.'), onPlay(st, s, c) { const e = ent(st, c.target); if (e) { setImovel(st, e); log(st, T`${e.name} fica Imóvel.`); } if (aliveUnits(st, s).some(x => x.tags.includes('Felino'))) draw(st, s, 1); } });
def('curandeira', { name: T('Gata Curandeira'), cost: 2, type: 'unit', atk: 2, hp: 2, tags: ['Felino'], disc: 'neutra', text: T('Felino. Ao Entrar: recupere 3 de vida.'), onPlay(st, s) { heal(st, s, 3); } });
def('guardiao', { name: T('Gato Guardião'), cost: 2, type: 'unit', atk: 1, hp: 3, kw: ['guarda'], tags: ['Felino'], disc: 'neutra', target: () => 'friendlyUnit', text: T('Felino. Guarda. Ao Entrar: dê Escudo a outra unidade aliada.'), onPlay(st, s, c) { const e = ent(st, c.target); if (e && e !== c.ent) e.kw.escudo = true; } });
def('espada', { name: T('Espada de Ferro'), cost: 2, type: 'weapon', atk: 2, hp: 2, disc: 'neutra', text: T('Arma 2/2.') });
def('coletor', { name: T('Gato Coletor'), cost: 2, type: 'unit', atk: 2, hp: 1, tags: ['Felino'], disc: 'neutra', text: T('Felino. Ao Morrer: compre 1 carta.'), onDeath(st, e) { draw(st, e.owner, 1); } });
def('lanceiro', { name: T('Gato Lanceiro'), cost: 3, type: 'unit', atk: 3, hp: 2, kw: ['avanco'], tags: ['Felino'], disc: 'neutra', text: T('Felino. Avanço. Se você controlar outro Felino, entra com +1/+0.'), onPlay(st, s, c) { if (c.ent && aliveUnits(st, s).some(x => x !== c.ent && x.tags.includes('Felino'))) buff(c.ent, 1, 0); } });
def('bombardeiro', { name: T('Gato Bombardeiro'), cost: 3, type: 'unit', atk: 3, hp: 2, tags: ['Felino'], disc: 'neutra', text: T('Felino. Ao Morrer: cause 1 de dano a todos os inimigos.'), onDeath(st, e) { aoeAll(st, e.owner, 1, src(e.owner, {})); } });
def('investida_coord', { name: T('Investida Coordenada'), cost: 3, type: 'spell', disc: 'neutra', text: T('Suas unidades ganham +1/+0 e Avanço neste turno.'), onPlay(st, s) { aliveUnits(st, s).forEach(e => { e.tempAtk += 1; e.tempKw.avanco = true; }); } });
def('capita', { name: T('Capitã dos Felinos'), cost: 4, type: 'unit', atk: 3, hp: 4, tags: ['Felino'], disc: 'neutra', text: T('Felino. Ao Entrar: dê +1/+1 aos seus outros Felinos.'), onPlay(st, s, c) { aliveUnits(st, s).filter(x => x !== c.ent && x.tags.includes('Felino')).forEach(x => buff(x, 1, 1)); } });

// Temporal Warfare
def('recruta', { name: T('Recruta de Outra Era'), cost: 1, type: 'unit', atk: 2, hp: 1, kw: ['eco'], disc: 'temporal', text: T('Eco.') });
def('batedor_amanha', { name: T('Batedor de Amanhã'), cost: 1, type: 'unit', atk: 3, hp: 2, kw: ['investida'], atraso: true, disc: 'temporal', text: T('Atraso. Acelerar.') });
def('escudeiro', { name: T('Escudeiro Apressado'), cost: 1, type: 'unit', atk: 2, hp: 1, adiantar: 1, disc: 'temporal', text: T('Adiantar 1.') });
def('golpe_previsto', { name: T('Golpe Previsto'), cost: 2, type: 'spell', disc: 'temporal', target: () => 'anyEnemy', targetRequired: true, text: T('Cause 2 de dano a um inimigo. Prever 2.'), onPlay(st, s, c) { dmg(st, c.target, 2, src(s, { spell: true })); prever(st, s, 2); } });
def('lamina_reb', { name: T('Lâmina Rebobinada'), cost: 3, type: 'weapon', atk: 3, hp: 2, disc: 'temporal', text: T('Arma 3/2. Ao Entrar: Prever 2.'), onPlay(st, s) { prever(st, s, 2); } });
def('arqueira', { name: T('Arqueira do Passado'), cost: 2, type: 'unit', atk: 2, hp: 2, disc: 'temporal', target: () => 'anyEnemy', text: T('Ao Entrar: cause 1 de dano a um inimigo.'), onPlay(st, s, c) { if (c.target) dmg(st, c.target, 1, src(s, {})); } });
def('rebobinar', { name: T('Rebobinar'), cost: 2, type: 'spell', disc: 'temporal', target: () => 'friendlyUnit', targetRequired: true, text: T('Devolva uma unidade aliada à sua mão; ela custa 1 a menos e ganha Acelerar.'), onPlay(st, s, c) { const i = bounce(st, c.target, -1); if (i) i.acelerar = true; } });
def('veterano', { name: T('Veterano Antecipado'), cost: 3, type: 'unit', atk: 3, hp: 2, kw: ['investida'], disc: 'temporal', text: T('Acelerar. Ao Evoluir: ganha Eco.'), onResonate(st, e) { e.kw.eco = true; e.ecoUsed = false; } });
def('duelista', { name: T('Duelista de Antigamente'), cost: 3, type: 'unit', atk: 4, hp: 2, adiantar: 2, disc: 'temporal', text: T('Adiantar 2.') });
def('licao', { name: T('Lição da História'), cost: 3, type: 'spell', disc: 'temporal', text: T('Compre 2 cartas. Se uma unidade aliada voltou por Eco neste turno, compre 3.'), onPlay(st, s) { draw(st, s, S(st, s).ecoReturnedThisTurn ? 3 : 2); } });
def('coluna', { name: T('Coluna de Amanhã'), cost: 3, type: 'unit', atk: 4, hp: 4, kw: ['investida'], atraso: true, disc: 'temporal', text: T('Atraso. Acelerar.') });
def('estandarte', { name: T('Estandarte das Eras'), cost: 3, type: 'structure', hp: 4, disc: 'temporal', text: T('Suas unidades com Eco têm +1/+0. Unidades que voltam por Eco voltam com 2 de Vida.') });
def('cavaleiro', { name: T('Cavaleiro da Primeira Coroa'), cost: 5, type: 'unit', atk: 5, hp: 3, kw: ['investida'], disc: 'temporal', text: T('Acelerar. Ao Evoluir: ganha Eco.'), onResonate(st, e) { e.kw.eco = true; e.ecoUsed = false; } });

// Draconic Primalism
def('ovo', { name: T('Ovo do Penhasco'), cost: 1, type: 'unit', atk: 0, hp: 3, kw: ['guarda'], disc: 'draconic', text: T('Guarda. Ao Morrer: invoque um Filhote de Dragão 2/2.'), onDeath(st, e) { summon(st, e.owner, 'filhote_dragao'); } });
def('filhote_dragao', { name: T('Filhote de Dragão'), cost: 2, type: 'unit', atk: 2, hp: 2, tags: ['Dragão'], token: true, text: T('Dragão.') });
def('seiva', { name: T('Seiva Primordial'), cost: 1, type: 'spell', disc: 'draconic', text: T('Ganhe 2 de mana neste turno.'), onPlay(st, s) { S(st, s).mana += 2; } });
def('broto', { name: T('Broto Ancestral'), cost: 2, type: 'unit', atk: 1, hp: 3, disc: 'draconic', text: T('Ao Entrar: ganhe 1 Cristal.'), onPlay(st, s) { cristal(st, s); } });
def('muralha', { name: T('Muralha de Raízes'), cost: 2, type: 'unit', atk: 1, hp: 4, kw: ['guarda'], disc: 'draconic', text: T('Guarda. Despertar: entra com +2/+2.'), onPlay(st, s, c) { if (despertar(st, s)) buff(c.ent, 2, 2); } });
def('pele', { name: T('Pele de Escamas'), cost: 2, type: 'spell', disc: 'draconic', target: () => 'friendlyUnit', targetRequired: true, text: T('Dê +1/+3 e Guarda a uma unidade aliada.'), onPlay(st, s, c) { const e = ent(st, c.target); if (e) { buff(e, 1, 3); e.kw.guarda = true; } } });
def('chamado', { name: T('Chamado da Mata'), cost: 3, type: 'spell', disc: 'draconic', text: T('Ganhe 1 Cristal. Compre 1 carta.'), onPlay(st, s) { cristal(st, s); draw(st, s, 1); } });
def('rugido', { name: T('Rugido Primal'), cost: 3, type: 'spell', disc: 'draconic', target: (st, s) => despertar(st, s) ? null : 'enemyUnit', targetRequired: true, text: T('Cause 3 de dano a uma unidade inimiga. Despertar: cause 3 a todas as unidades inimigas em vez disso.'), onPlay(st, s, c) { if (despertar(st, s)) aoeUnits(st, s, 3, src(s, { spell: true })); else dmg(st, c.target, 3, src(s, { spell: true })); } });
def('draconete', { name: T('Draconete Curioso'), cost: 3, type: 'unit', atk: 3, hp: 3, tags: ['Dragão'], disc: 'draconic', text: T('Dragão. Ao Entrar: se você tiver um Dragão na mão, ganha +1/+1.'), onPlay(st, s, c) { if (S(st, s).hand.some(i => DEF[i.id].tags.includes('Dragão'))) buff(c.ent, 1, 1); } });
def('guardia', { name: T('Guardiã do Bosque'), cost: 4, type: 'unit', atk: 3, hp: 5, kw: ['guarda'], disc: 'draconic', text: T('Guarda. Ao Evoluir: ganhe 1 Cristal.'), onResonate(st, e) { cristal(st, e.owner); } });
def('sopro', { name: T('Sopro Ancestral'), cost: 4, type: 'spell', disc: 'draconic', text: T('Cause 2 de dano a todos os inimigos. Se você controlar um Dragão, cause 3.'), onPlay(st, s) { const n = S(st, s).board.some(e => e.kind === 'unit' && !isDead(e) && e.tags.includes('Dragão')) ? 3 : 2; aoeAll(st, s, n, src(s, { spell: true })); } });
def('matriarca', { name: T('Matriarca dos Ninhos'), cost: 5, type: 'unit', atk: 4, hp: 6, tags: ['Dragão'], disc: 'draconic', text: T('Dragão. Ao Entrar: invoque um Ovo do Penhasco. Despertar: invoque dois.'), onPlay(st, s) { const n = despertar(st, s) ? 2 : 1; for (let i = 0; i < n; i++) summon(st, s, 'ovo'); } });
def('tita', { name: T('Titã do Bosque'), cost: 7, type: 'unit', atk: 7, hp: 7, kw: ['guarda'], disc: 'draconic', text: T('Guarda. Ao Entrar: recupere 5 de vida.'), onPlay(st, s) { heal(st, s, 5); } });

// Necrodance
def('pacto', { name: T('Pacto Sangrento'), cost: 0, type: 'spell', disc: 'necro', text: T('Perca 3 de vida. Ganhe 2 de mana neste turno.'), playable(st, s) { return S(st, s).leader.hp > 3; }, onPlay(st, s) { loseLife(st, { t: 'l', side: s }, 3); S(st, s).mana += 2; } });
def('esqueleto', { name: T('Esqueleto Bailarino'), cost: 1, type: 'unit', atk: 1, hp: 1, disc: 'necro', text: T('Ao Morrer: dê +1/+1 a uma unidade aliada aleatória.'), onDeath(st, e) { const o = pick(st, aliveUnits(st, e.owner)); if (o) buff(o, 1, 1); } });
def('passo', { name: T('Passo de Abertura'), cost: 0, type: 'spell', disc: 'necro', compasso: [1], target: () => 'enemyUnit', targetRequired: true, text: T('Cause 1 de dano a uma unidade inimiga. Compasso 1: compre 1 carta.'), onPlay(st, s, c) { dmg(st, c.target, 1, src(s, { spell: true })); if (onBeat(st, s, c, 1)) draw(st, s, 1); } });
def('metronomo', { name: T('Metrônomo Ósseo'), cost: 2, type: 'unit', atk: 2, hp: 2, disc: 'necro', compasso: [2], text: T('Compasso 2: invoque um Esqueleto Bailarino.'), onPlay(st, s, c) { if (onBeat(st, s, c, 2)) summon(st, s, 'esqueleto'); } });
def('valsa', { name: T('Valsa Macabra'), cost: 2, type: 'spell', disc: 'necro', compasso: [3], target: () => 'friendlyUnit', targetRequired: true, text: T('Destrua uma unidade aliada; o Ao Morrer dela ativa duas vezes. Compasso 3: compre 1 carta.'), onPlay(st, s, c) { const e = ent(st, c.target); if (e) { e.extraDeath = (e.extraDeath || 0) + 1; e.destroyed = true; } if (onBeat(st, s, c, 3)) draw(st, s, 1); } });
def('coveiro', { name: T('Coveiro Ritmado'), cost: 2, type: 'unit', atk: 1, hp: 3, sangria: 2, disc: 'necro', text: T('Sangria 2. Sempre que uma unidade aliada morrer, ganha +1/+0.'), onFriendlyDeath(st, e) { e.atk += 1; } });
def('maldicao', { name: T('Maldição do Contratempo'), cost: 2, type: 'spell', disc: 'necro', compasso: [1, 3], text: T('Embaralhe 2 Contratempos no deck inimigo. Compasso 1 ou 3: embaralhe 3.'), onPlay(st, s, c) { const n = (onBeat(st, s, c, 1) || onBeat(st, s, c, 3)) ? 3 : 2; for (let i = 0; i < n; i++) shuffleInto(st, opp(s), 'contratempo'); log(st, T`${n} Contratempos entram no deck inimigo.`); } });
def('contratempo', { name: T('Contratempo'), cost: 1, type: 'spell', token: true, junk: true, text: T('Não faz nada. Ocupa espaço na mão.') });
def('golpe_final', { name: T('Golpe Final da Valsa'), cost: 2, type: 'spell', disc: 'necro', exigeCompasso: 3, target: () => 'enemyUnitAtk4', targetRequired: true, text: T('Exige Compasso 3. Destrua uma unidade inimiga com 4 ou menos de Ataque.'), onPlay(st, s, c) { const e = ent(st, c.target); if (e) e.destroyed = true; } });
def('menestrel', { name: T('Menestrel Cadavérico'), cost: 3, type: 'unit', atk: 2, hp: 3, sangria: 3, disc: 'necro', compasso: [3], text: T('Sangria 3. Compasso 3: cause 2 de dano a todos os inimigos.'), onPlay(st, s, c) { if (onBeat(st, s, c, 3)) aoeAll(st, s, 2, src(s, {})); } });
def('mao_alem', { name: T('Mão do Além'), cost: 3, type: 'unit', atk: 3, hp: 2, kw: ['dreno'], disc: 'necro', compasso: [2], text: T('Dreno. Compasso 2: ganha Avanço.'), onPlay(st, s, c) { if (onBeat(st, s, c, 2)) c.ent.kw.avanco = true; } });
def('maestro', { name: T('Maestro Sem Pulso'), cost: 4, type: 'unit', atk: 3, hp: 5, sangria: 4, disc: 'necro', text: T('Sangria 4. Sempre que uma unidade aliada morrer, cause 1 de dano a um inimigo aleatório.'), onFriendlyDeath(st, e) { const t = randomEnemyRef(st, e.owner); if (t) dmg(st, t, 1, src(e.owner, {})); } });
def('coro', { name: T('Coro de Lamentos'), cost: 4, type: 'spell', disc: 'necro', compasso: [1, 3], text: T('Invoque um Esqueleto Bailarino. Compasso 1 ou 3: invoque mais dois.'), onPlay(st, s, c) { const n = (onBeat(st, s, c, 1) || onBeat(st, s, c, 3)) ? 3 : 1; for (let i = 0; i < n; i++) summon(st, s, 'esqueleto'); } });

// Holy Shadowmancy
def('acolito', { name: T('Acólito Vigilante'), cost: 1, type: 'unit', atk: 1, hp: 2, kw: ['guarda'], disc: 'holy', text: T('Guarda.') });
def('oracao', { name: T('Oração Breve'), cost: 1, type: 'spell', disc: 'holy', target: (st, s) => S(st, s).board.some(e => e.kind === 'ritual' && !e.removed) ? 'ownRitual' : null, targetRequired: true, text: T('Reduza em 1 a contagem de um Ritual seu. Se você não tiver Ritual, compre 1 carta.'), onPlay(st, s, c) { if (c.target) { const e = ent(st, c.target); if (e) tickRitual(st, e, 1); } else draw(st, s, 1); } });
def('lamina_veu', { name: T('Lâmina do Véu'), cost: 1, type: 'spell', disc: 'holy', target: () => 'enemyUnit', targetRequired: true, text: T('Cause 2 de dano a uma unidade inimiga. Se você controlar uma unidade com Emboscada, cause 3.'), onPlay(st, s, c) { dmg(st, c.target, hasEmboscada(st, s) ? 3 : 2, src(s, { spell: true })); } });
def('novico', { name: T('Noviço Sem Rosto'), cost: 2, type: 'unit', atk: 2, hp: 2, kw: ['emboscada'], disc: 'holy', text: T('Emboscada. Ao Revelar: ganha +1/+1.'), onReveal(st, e) { buff(e, 1, 1); } });
def('juramento', { name: T('Juramento Velado'), cost: 2, type: 'ritual', countdown: 3, disc: 'holy', text: T('Ritual 3. Ao ativar: invoque um Anjo Guardião 4/4 com Guarda.'), ritualEffect(st, e) { summon(st, e.owner, 'anjo'); } });
def('veu_renovado', { name: T('Véu Renovado'), cost: 2, type: 'ritual', countdown: 2, disc: 'holy', text: T('Ritual 2. Ao ativar: suas unidades ganham Emboscada.'), ritualEffect(st, e) { aliveUnits(st, e.owner).forEach(x => { x.kw.emboscada = true; }); log(st, T('Suas unidades voltam às sombras.')); } });
def('lamina_prece', { name: T('Lâmina da Prece'), cost: 3, type: 'unit', atk: 3, hp: 2, kw: ['emboscada'], sacrificio: 2, disc: 'holy', text: T('Emboscada. Ao Revelar e destruir uma unidade, seus Rituais perdem 2 de contagem em vez de 1.') });
def('anjo', { name: T('Anjo Guardião'), cost: 4, type: 'unit', atk: 4, hp: 4, kw: ['guarda'], token: true, text: T('Guarda.') });
def('fanatico', { name: T('Fanático do Véu'), cost: 3, type: 'unit', atk: 2, hp: 4, kw: ['guarda'], disc: 'holy', text: T('Guarda. Ao Evoluir: reduza em 1 a contagem de todos os seus Rituais.'), onResonate(st, e) { S(st, e.owner).board.filter(x => x.kind === 'ritual' && !x.removed).forEach(r => tickRitual(st, r, 1)); } });
def('assassina', { name: T('Assassina Devota'), cost: 3, type: 'unit', atk: 2, hp: 1, kw: ['emboscada', 'letal'], disc: 'holy', text: T('Emboscada. Letal.') });
def('vigilia', { name: T('Vigília Silenciosa'), cost: 3, type: 'ritual', countdown: 2, disc: 'holy', text: T('Ritual 2. Ao ativar: destrua a unidade inimiga com maior Ataque.'), ritualEffect(st, e) { const us = aliveUnits(st, opp(e.owner)); if (us.length) { us.sort((a, b) => getAtk(st, b) - getAtk(st, a)); us[0].destroyed = true; log(st, T`Vigília Silenciosa destrói ${us[0].name}.`); } } });
def('sacerdotisa', { name: T('Sacerdotisa do Crepúsculo'), cost: 4, type: 'unit', atk: 3, hp: 5, disc: 'holy', text: T('Ao Entrar: seus Rituais perdem 1 de contagem. Sempre que um Ritual seu ativar, compre 1 carta.'), onPlay(st, s) { S(st, s).board.filter(x => x.kind === 'ritual' && !x.removed).forEach(r => tickRitual(st, r, 1)); }, onRitualActivate(st, e) { draw(st, e.owner, 1); } });
def('mestre', { name: T('Mestre Sem Nome'), cost: 4, type: 'unit', atk: 4, hp: 3, kw: ['emboscada'], disc: 'holy', text: T('Emboscada. Ao Evoluir: suas outras unidades ganham Emboscada.'), onResonate(st, e) { aliveUnits(st, e.owner).filter(x => x !== e).forEach(x => { x.kw.emboscada = true; }); } });
def('julgamento', { name: T('Julgamento Silencioso'), cost: 5, type: 'spell', disc: 'holy', target: () => 'enemyUnit', targetRequired: true, costMod(st, s) { return hasEmboscada(st, s) ? -2 : 0; }, text: T('Destrua uma unidade inimiga. Custa 2 a menos se você controlar uma unidade com Emboscada.'), onPlay(st, s, c) { const e = ent(st, c.target); if (e) e.destroyed = true; } });
def('purificacao', { name: T('Purificação'), cost: 5, type: 'spell', disc: 'holy', text: T('Cause 4 de dano a todas as unidades inimigas.'), onPlay(st, s) { aoeUnits(st, s, 4, src(s, { spell: true })); } });

// Space Wizardry
def('faisca', { name: T('Faísca Estelar'), cost: 1, type: 'spell', disc: 'space', target: () => 'anyEnemy', targetRequired: true, text: T('Cause 2 de dano a um inimigo.'), onPlay(st, s, c) { dmg(st, c.target, 2, src(s, { spell: true })); } });
def('astrolabio', { name: T('Astrolábio Animado'), cost: 1, type: 'unit', atk: 1, hp: 2, disc: 'space', text: T('Sempre que você lançar um feitiço, ganha +1/+0 neste turno.'), onSpellCast(st, e) { e.tempAtk += 1; } });
def('chuva', { name: T('Chuva de Meteoritos'), cost: 2, type: 'spell', disc: 'space', text: T('Cause 3 de dano dividido aleatoriamente entre os inimigos.'), onPlay(st, s) { for (let i = 0; i < 3; i++) { const t = randomEnemyRef(st, s); if (t) dmg(st, t, 1, src(s, { spell: true })); } } });
def('aprendiz_astral', { name: T('Aprendiz Astral'), cost: 2, type: 'unit', atk: 2, hp: 2, disc: 'space', text: T('Ao Entrar: dê 1 Carga a cada carta com Órbita na sua mão.'), onPlay(st, s) { charge(st, s, 1); } });
def('escudo_grav', { name: T('Escudo de Gravidade'), cost: 2, type: 'spell', disc: 'space', target: () => 'friendlyUnit', targetRequired: true, text: T('Dê Escudo a uma unidade aliada. Compre 1 carta.'), onPlay(st, s, c) { const e = ent(st, c.target); if (e) e.kw.escudo = true; draw(st, s, 1); } });
def('leitura', { name: T('Leitura das Estrelas'), cost: 3, type: 'spell', orbita: true, orbitaCost: true, disc: 'space', text: T('Órbita. Custa 1 a menos por Carga. Compre 2 cartas.'), onPlay(st, s) { draw(st, s, 2); } });
def('raio', { name: T('Raio Lunar'), cost: 3, type: 'spell', disc: 'space', target: () => 'enemyUnit', targetRequired: true, text: T('Cause 4 de dano a uma unidade inimiga. Se ela morrer, dê 1 Carga às suas cartas com Órbita.'), onPlay(st, s, c) { const e = ent(st, c.target); dmg(st, c.target, 4, src(s, { spell: true })); if (e && isDead(e)) charge(st, s, 1); } });
def('grifo', { name: T('Grifo Cometário'), cost: 3, type: 'unit', atk: 3, hp: 2, kw: ['avanco'], disc: 'space', text: T('Avanço. Ao Evoluir: cause 2 de dano ao líder inimigo.'), onResonate(st, e) { dmg(st, { t: 'l', side: opp(e.owner) }, 2, src(e.owner, {})); } });
def('golem_poeira', { name: T('Golem de Poeira Estelar'), cost: 4, type: 'unit', atk: 4, hp: 5, kw: ['guarda'], orbita: true, disc: 'space', text: T('Guarda. Órbita: entra com +1/+1 por Carga.'), onPlay(st, s, c) { const n = c.inst.cargas || 0; if (n) buff(c.ent, n, n); } });
def('elemental', { name: T('Elemental de Nebulosa'), cost: 5, type: 'unit', atk: 4, hp: 5, disc: 'space', text: T('Ao Entrar: cause 1 de dano a todos os inimigos para cada feitiço que você lançou neste turno.'), onPlay(st, s) { const n = S(st, s).spellsCastThisTurn; if (n > 0) aoeAll(st, s, n, src(s, {})); } });
def('eclipse', { name: T('Eclipse'), cost: 5, type: 'spell', orbita: true, disc: 'space', text: T('Órbita. Cause 2 de dano a todas as unidades inimigas, +1 por Carga (máx. +3).'), onPlay(st, s, c) { aoeUnits(st, s, 2 + Math.min(3, c.inst.cargas || 0), src(s, { spell: true })); } });
def('cometa', { name: T('Cometa Convocado'), cost: 8, type: 'spell', orbita: true, orbitaCost: true, disc: 'space', target: () => 'anyEnemy', targetRequired: true, text: T('Órbita. Custa 1 a menos por Carga. Cause 6 de dano a um inimigo.'), onPlay(st, s, c) { dmg(st, c.target, 6, src(s, { spell: true })); } });

// Magitech
def('automato', { name: T('Autômato de Bolso'), cost: 1, type: 'unit', atk: 1, hp: 2, tags: ['Construto'], disc: 'tech', text: T('Construto. Ao Evoluir: ganha Letal.'), onResonate(st, e) { e.kw.letal = true; } });
def('frasco', { name: T('Frasco Volátil'), cost: 1, type: 'spell', disc: 'tech', target: () => 'friendlyUnit', targetRequired: true, text: T('Dê +1/+0 e Letal a uma unidade aliada neste turno.'), onPlay(st, s, c) { const e = ent(st, c.target); if (e) { e.tempAtk += 1; e.tempKw.letal = true; } } });
def('placa', { name: T('Placa de Reforço'), cost: 1, type: 'spell', module: true, disc: 'tech', target: () => 'friendlyUnit', targetRequired: true, text: T('Módulo. Acople: +1/+1.'), attach(e) { buff(e, 1, 1); } });
def('molas', { name: T('Armadilha de Molas'), cost: 2, type: 'trap', disc: 'tech', text: T('Armadilha. Quando uma unidade inimiga atacar, cause 3 de dano a ela.') });
def('aprendiz_alq', { name: T('Aprendiz de Alquimista'), cost: 2, type: 'unit', atk: 2, hp: 3, disc: 'tech', text: T('Ao Entrar: crie um Frasco Volátil na sua mão.'), onPlay(st, s) { addToHand(st, s, 'frasco'); } });
def('nucleo', { name: T('Núcleo Encantado'), cost: 2, type: 'spell', module: true, disc: 'tech', target: () => 'friendlyUnit', targetRequired: true, text: T('Módulo. Acople: +0/+2 e Escudo.'), attach(e) { buff(e, 0, 2); e.kw.escudo = true; } });
def('torre', { name: T('Torre de Vigia Mecânica'), cost: 3, type: 'structure', hp: 4, disc: 'tech', text: T('No fim do seu turno, cause 1 de dano a um inimigo aleatório.'), onEndTurn(st, e) { const t = randomEnemyRef(st, e.owner); if (t) dmg(st, t, 1, src(e.owner, {})); } });
def('golem_latao', { name: T('Golem de Latão'), cost: 3, type: 'unit', atk: 2, hp: 4, kw: ['guarda'], tags: ['Construto'], disc: 'tech', text: T('Construto. Guarda. Sempre que um Módulo for acoplado a ele, compre 1 carta.'), onModuleAttached(st, e) { draw(st, e.owner, 1); } });
def('besta', { name: T('Besta de Repetição'), cost: 3, type: 'weapon', atk: 1, hp: 3, letal: true, disc: 'tech', text: T('Arma 1/3. Letal.') });
def('gas', { name: T('Gás Paralisante'), cost: 3, type: 'trap', disc: 'tech', text: T('Armadilha. Quando o inimigo jogar uma unidade, ela não pode atacar no próximo turno dele. Compre 1 carta.') });
def('oficina', { name: T('Oficina Ambulante'), cost: 4, type: 'structure', hp: 4, disc: 'tech', text: T('No fim do seu turno, dê +1/+1 a uma unidade aliada aleatória.'), onEndTurn(st, e) { const o = pick(st, aliveUnits(st, e.owner)); if (o) buff(o, 1, 1); } });
def('cav_engr', { name: T('Cavaleiro de Engrenagens'), cost: 5, type: 'unit', atk: 4, hp: 6, tags: ['Construto'], disc: 'tech', text: T('Construto. Ao Entrar: se você tiver um Módulo na mão, acople-o a esta unidade sem custo.'), onPlay(st, s, c) { const h = S(st, s).hand; const i = h.findIndex(x => DEF[x.id].module); if (i >= 0 && c.ent) { const m = h.splice(i, 1)[0]; attachModule(st, c.ent, m.id); } } });

// Inimigos: Grutas Vivas
def('morcego', { name: T('Morcego da Gruta'), cost: 1, type: 'unit', atk: 1, hp: 1, kw: ['avanco'], text: T('Avanço.') });
def('broto_cog', { name: T('Cogumelo-Broto'), cost: 1, type: 'unit', atk: 0, hp: 1, brotar: 'cog_adulto', text: T('Brotar: vira um Cogumelo Adulto 3/3.') });
def('cog_adulto', { name: T('Cogumelo Adulto'), cost: 3, type: 'unit', atk: 3, hp: 3, token: true, text: '' });
def('besouro', { name: T('Besouro Cascudo'), cost: 2, type: 'unit', atk: 1, hp: 4, kw: ['guarda'], text: T('Guarda.') });
def('aranha', { name: T('Aranha Tecelã'), cost: 2, type: 'unit', atk: 2, hp: 2, target: () => 'enemyUnit', text: T('Ao Entrar: deixe uma unidade inimiga Imóvel.'), onPlay(st, s, c) { const e = ent(st, c.target); if (e) { setImovel(st, e); log(st, T`${e.name} fica Imóvel.`); } } });
def('enxame', { name: T('Enxame de Grilos'), cost: 2, type: 'spell', text: T('Invoque três Grilos 1/1.'), onPlay(st, s) { for (let i = 0; i < 3; i++) summon(st, s, 'grilo'); } });
def('grilo', { name: T('Grilo'), cost: 1, type: 'unit', atk: 1, hp: 1, token: true, text: '' });
def('esporos', { name: T('Esporos Sufocantes'), cost: 2, type: 'spell', text: T('Cause 1 de dano a todas as unidades inimigas.'), onPlay(st, s) { aoeUnits(st, s, 1, src(s, { spell: true })); } });
def('lagarto', { name: T('Lagarto das Fendas'), cost: 3, type: 'unit', atk: 3, hp: 2, kw: ['emboscada'], text: T('Emboscada.') });
def('toupeira', { name: T('Toupeira Escavadora'), cost: 3, type: 'unit', atk: 2, hp: 3, text: T('Ao Morrer: invoque um Cogumelo-Broto.'), onDeath(st, e) { summon(st, e.owner, 'broto_cog'); } });
def('ninho', { name: T('Ninho de Morcegos'), cost: 3, type: 'structure', hp: 4, text: T('No fim do seu turno, invoque um Morcego da Gruta.'), onEndTurn(st, e) { summon(st, e.owner, 'morcego'); } });
def('mordida_inf', { name: T('Mordida Infecciosa'), cost: 3, type: 'spell', target: () => 'enemyUnit', targetRequired: true, text: T('Cause 3 de dano a uma unidade inimiga. Se ela morrer, invoque um Cogumelo-Broto.'), onPlay(st, s, c) { const e = ent(st, c.target); dmg(st, c.target, 3, src(s, { spell: true })); if (e && isDead(e)) summon(st, s, 'broto_cog'); } });
def('centopeia', { name: T('Centopeia Venenosa'), cost: 4, type: 'unit', atk: 3, hp: 3, kw: ['letal'], text: T('Letal.') });
def('fungoide', { name: T('Fungoide Ancião'), cost: 4, type: 'unit', atk: 3, hp: 5, text: T('No fim do seu turno, invoque um Cogumelo-Broto.'), onEndTurn(st, e) { summon(st, e.owner, 'broto_cog'); } });
def('fungo_colossal', { name: T('Fungo Colossal'), cost: 6, type: 'unit', atk: 5, hp: 8, kw: ['guarda'], text: T('Guarda. Ao Entrar: todos os seus Cogumelos-Broto brotam agora.'), onPlay(st, s) { S(st, s).board.slice().filter(x => DEF[x.id].brotar && !isDead(x) && x.id === 'broto_cog').forEach(x => brotar(st, x)); } });
def('estatua', { name: T('Estátua Antiga'), cost: 2, type: 'structure', hp: 6, text: T('Enquanto estiver em campo, o Basilisco não pode ser alvo de feitiços.') });
def('ninhada', { name: T('Ninhada de Basilisco'), cost: 3, type: 'structure', hp: 3, brotar: 'filhote_bas', text: T('Brotar: vira um Filhote de Basilisco.') });
def('filhote_bas', { name: T('Filhote de Basilisco'), cost: 3, type: 'unit', atk: 3, hp: 3, text: T('Ao Evoluir: deixe uma unidade inimiga Imóvel.'), onResonate(st, e) { const us = aliveUnits(st, opp(e.owner)).filter(x => !hasKw(x, 'emboscada')); if (us.length) { us.sort((a, b) => getAtk(st, b) - getAtk(st, a)); setImovel(st, us[0]); log(st, T`${us[0].name} fica Imóvel.`); } } });
def('cauda', { name: T('Cauda Sísmica'), cost: 4, type: 'spell', text: T('Cause 2 de dano a todas as unidades inimigas.'), onPlay(st, s) { aoeUnits(st, s, 2, src(s, { spell: true })); } });
def('mordida_pet', { name: T('Mordida Petrificante'), cost: 5, type: 'spell', target: () => 'enemyImovel', targetRequired: true, text: T('Destrua uma unidade Imóvel.'), onPlay(st, s, c) { const e = ent(st, c.target); if (e) e.destroyed = true; } });

// Humanos das defesas físicas (P72): ladrões, bandidos e aventureiros rivais
def('h_pivete', { name: T('Pivete Ligeiro'), cost: 1, type: 'unit', atk: 1, hp: 1, kw: ['avanco'], tags: ['Humano'], text: T('Avanço.') });
def('h_vigia', { name: T('Vigia do Bando'), cost: 2, type: 'unit', atk: 1, hp: 3, kw: ['guarda'], tags: ['Humano'], text: T('Guarda.') });
def('h_arrombador', { name: T('Arrombador'), cost: 2, type: 'unit', atk: 2, hp: 2, kw: ['emboscada'], tags: ['Humano'], text: T('Emboscada.') });
def('h_ladra', { name: T('Ladra de Telhado'), cost: 3, type: 'unit', atk: 3, hp: 2, kw: ['emboscada'], tags: ['Humano'], text: T('Emboscada.') });
def('h_chaves', { name: T('Mestre das Chaves'), cost: 4, type: 'unit', atk: 3, hp: 4, tags: ['Humano'], text: T('Ao Entrar: compre 1 carta.'), onPlay(st, s) { draw(st, s, 1); } });
def('h_fumaca', { name: T('Bomba de Fumaça'), cost: 2, type: 'spell', target: () => 'enemyUnit', targetRequired: true, text: T('Deixe uma unidade inimiga Imóvel.'), onPlay(st, s, c) { const e = ent(st, c.target); if (e) { setImovel(st, e); log(st, T`${e.name} se perde na fumaça.`); } } });
def('h_facada', { name: T('Facada nas Costas'), cost: 2, type: 'spell', target: () => 'enemyUnit', targetRequired: true, text: T('Cause 3 de dano a uma unidade inimiga.'), onPlay(st, s, c) { dmg(st, c.target, 3, src(s, { spell: true })); } });
def('h_bandido', { name: T('Bandido da Estrada'), cost: 2, type: 'unit', atk: 2, hp: 3, tags: ['Humano'], text: '' });
def('h_besteiro', { name: T('Besteiro'), cost: 3, type: 'unit', atk: 2, hp: 3, tags: ['Humano'], text: T('Ao Entrar: cause 2 de dano ao protagonista.'), onPlay(st, s) { dmg(st, { t: 'l', side: opp(s) }, 2, src(s, {})); } });
def('h_bruto', { name: T('Mercenário Brutamontes'), cost: 4, type: 'unit', atk: 4, hp: 5, kw: ['guarda'], tags: ['Humano'], text: T('Guarda.') });
def('h_capitao', { name: T('Capitão do Bando'), cost: 5, type: 'unit', atk: 4, hp: 5, tags: ['Humano'], text: T('Ao Entrar: dê +1/+1 às outras unidades aliadas.'), onPlay(st, s, c) { aliveUnits(st, s).filter(x => x !== c.ent).forEach(x => buff(x, 1, 1)); } });
def('h_espadachim', { name: T('Espadachim Rival'), cost: 3, type: 'unit', atk: 3, hp: 3, kw: ['escudo'], tags: ['Humano'], text: T('Escudo.') });
def('h_clerigo', { name: T('Clérigo Rival'), cost: 3, type: 'unit', atk: 2, hp: 4, tags: ['Humano'], text: T('Ao Entrar: o líder dele recupera 4 de vida.'), onPlay(st, s) { heal(st, s, 4); } });
def('h_rajada', { name: T('Rajada Arcana Rival'), cost: 4, type: 'spell', text: T('Cause 2 de dano a todas as unidades inimigas.'), onPlay(st, s) { aoeUnits(st, s, 2, src(s, { spell: true })); } });
def('h_campeao', { name: T('Campeão dos Rivais'), cost: 6, type: 'unit', atk: 6, hp: 6, kw: ['guarda'], tags: ['Humano'], text: T('Guarda. Ao Entrar: cause 2 de dano ao protagonista.'), onPlay(st, s) { dmg(st, { t: 'l', side: opp(s) }, 2, src(s, {})); } });

// Grupo 2: cartas novas da Forja (P91). grupo: 2 = só aparecem em recompensas a partir do andar 6.
const g2 = (id, o) => def(id, Object.assign({ grupo: 2 }, o));
const blindGive = (e, n) => { if (e) { e.blind = Math.max(e.blind || 0, n); } };
g2('martelo_forja', { name: T('Martelo de Forja'), cost: 3, type: 'weapon', atk: 3, hp: 2, pierce: true, disc: 'neutra', text: T('Arma 3/2. Perfurar.') });
g2('gato_ferreiro', { name: T('Gato Ferreiro'), cost: 3, type: 'unit', atk: 2, hp: 3, tags: ['Felino'], disc: 'neutra', text: T('Felino. Ao Entrar: dê Blindagem 2 a outro Felino aliado.'), onPlay(st, s, c) { const o = pick(st, aliveUnits(st, s).filter(x => x !== c.ent && x.tags.includes('Felino'))); if (o) { blindGive(o, 2); log(st, T`${o.name} ganha Blindagem 2.`); } } });
g2('brasa_guardada', { name: T('Brasa Guardada'), cost: 2, type: 'spell', disc: 'neutra', target: () => 'enemyUnit', targetRequired: true, text: T('Cause 2 de dano a uma unidade inimiga. Se ela morrer, compre 1 carta.'), onPlay(st, s, c) { const e = ent(st, c.target); dmg(st, c.target, 2, src(s, { spell: true })); if (e && isDead(e)) draw(st, s, 1); } });
g2('lingote', { name: T('Lingote Temperado'), cost: 1, type: 'spell', disc: 'neutra', target: () => 'friendlyUnit', targetRequired: true, text: T('Dê +0/+1 e Blindagem 2 a uma unidade aliada.'), onPlay(st, s, c) { const e = ent(st, c.target); if (e) { buff(e, 0, 1); blindGive(e, 2); } } });
// Temporal
g2('golpe_vem', { name: T('Golpe que Ainda Vem'), cost: 3, type: 'spell', disc: 'temporal', text: T('Atraso. No início do seu próximo turno, cause 5 de dano a um inimigo aleatório.'), onPlay(st, s) { const sd = S(st, s); sd.strikes = sd.strikes || []; sd.strikes.push(5); log(st, T('Um golpe parte para o futuro.')); } });
g2('ferreiro_eras', { name: T('Ferreiro de Outras Eras'), cost: 3, type: 'unit', atk: 3, hp: 3, kw: ['eco'], disc: 'temporal', text: T('Eco. Ao Entrar: sua arma ganha +1/+0.'), onPlay(st, s) { const w = S(st, s).weapon; if (w) { w.atk += 1; log(st, T`${w.name} ganha +1 de Ataque.`); } } });
g2('veterano_bigorna', { name: T('Veterano da Bigorna'), cost: 4, type: 'unit', atk: 4, hp: 3, kw: ['investida', 'perfurar'], disc: 'temporal', text: T('Acelerar. Perfurar.') });
g2('ensaio', { name: T('Ensaio de Batalha'), cost: 1, type: 'spell', disc: 'temporal', text: T('Prever 2. Se você controlar uma unidade com Acelerar, compre 1 carta.'), onPlay(st, s) { prever(st, s, 2); if (aliveUnits(st, s).some(x => hasKw(x, 'investida'))) draw(st, s, 1); } });
// Draconic
g2('dragao_escoria', { name: T('Dragão de Escória'), cost: 5, type: 'unit', atk: 5, hp: 5, kw: ['guarda'], tags: ['Dragão'], disc: 'draconic', text: T('Dragão. Guarda. Despertar: ganha Blindagem 3.'), onPlay(st, s, c) { if (despertar(st, s)) blindGive(c.ent, 3); } });
g2('sopro_magma', { name: T('Sopro de Magma'), cost: 3, type: 'spell', disc: 'draconic', text: T('Cause 2 de dano a todos os inimigos. Despertar: 3.'), onPlay(st, s) { aoeAll(st, s, despertar(st, s) ? 3 : 2, src(s, { spell: true })); } });
g2('ovo_incandescente', { name: T('Ovo Incandescente'), cost: 2, type: 'unit', atk: 0, hp: 3, kw: ['guarda'], disc: 'draconic', text: T('Guarda. Ao Morrer: ganhe 1 Cristal.'), onDeath(st, e) { cristal(st, e.owner); } });
g2('wyrm_ferro', { name: T('Wyrm de Ferro'), cost: 7, type: 'unit', atk: 6, hp: 7, blind: 2, tags: ['Dragão'], disc: 'draconic', text: T('Dragão. Blindagem 2. Despertar: ganha Perfurar.'), onPlay(st, s, c) { if (despertar(st, s) && c.ent) c.ent.kw.perfurar = true; } });
// Necrodance
g2('ferreiro_esqueletico', { name: T('Ferreiro Esquelético'), cost: 2, type: 'unit', atk: 2, hp: 2, disc: 'necro', text: T('Ao Morrer: dê Blindagem 2 a uma unidade aliada aleatória.'), onDeath(st, e) { const o = pick(st, aliveUnits(st, e.owner)); if (o) { blindGive(o, 2); log(st, T`${o.name} ganha Blindagem 2.`); } } });
g2('requiem_bigorna', { name: T('Réquiem da Bigorna'), cost: 3, type: 'spell', exigeCompasso: 3, disc: 'necro', target: () => 'enemyUnit', targetRequired: true, text: T('Exige Compasso 3. Destrua uma unidade inimiga.'), onPlay(st, s, c) { const e = ent(st, c.target); if (e) { e.destroyed = true; log(st, T`${e.name} cai no último compasso.`); } } });
g2('martelo_funebre', { name: T('Martelo Fúnebre'), cost: 2, type: 'weapon', atk: 2, hp: 2, disc: 'necro', text: T('Arma 2/2. Sempre que uma unidade aliada morrer, esta arma ganha +1 de durabilidade.') });
g2('cinzas_dancam', { name: T('Cinzas que Dançam'), cost: 2, type: 'spell', compasso: [1], disc: 'necro', text: T('Invoque um Esqueleto Bailarino. Compasso 1: invoque dois.'), onPlay(st, s, c) { const n = onBeat(st, s, c, 1) ? 2 : 1; for (let i = 0; i < n; i++) summon(st, s, 'esqueleto'); } });
// Holy Shadowmancy
g2('sacerdote_brasa', { name: T('Sacerdote da Brasa'), cost: 3, type: 'unit', atk: 2, hp: 4, kw: ['emboscada'], disc: 'holy', text: T('Emboscada. Ao Revelar: a unidade atacada perde a Blindagem.'), onReveal(st, e, t) { if (t && t.blind) { t.blind = 0; log(st, T`${t.name} perde a Blindagem.`); } } });
g2('ritual_metal', { name: T('Ritual do Metal Derretido'), cost: 2, type: 'ritual', countdown: 3, disc: 'holy', text: T('Ritual 3. Ao ativar: cause 3 de dano a todos os inimigos.'), ritualEffect(st, e) { aoeAll(st, e.owner, 3, src(e.owner, { spell: true })); } });
g2('lamina_obsidiana', { name: T('Lâmina de Obsidiana'), cost: 1, type: 'spell', disc: 'holy', target: () => 'friendlyUnit', targetRequired: true, text: T('Dê +2/+0 e Perfurar a uma unidade aliada neste turno.'), onPlay(st, s, c) { const e = ent(st, c.target); if (e) { e.tempAtk = (e.tempAtk || 0) + 2; e.tempKw.perfurar = true; } } });
g2('penitente_forja', { name: T('Penitente da Forja'), cost: 4, type: 'unit', atk: 3, hp: 5, kw: ['guarda'], disc: 'holy', text: T('Guarda. Ao Entrar: reduza em 1 a contagem de todos os seus Rituais.'), onPlay(st, s) { S(st, s).board.filter(x => x.kind === 'ritual' && !x.removed).forEach(r => tickRitual(st, r, 1)); } });
// Magitech
g2('nucleo_escoria', { name: T('Núcleo de Escória'), cost: 2, type: 'spell', module: true, disc: 'tech', target: () => 'friendlyUnit', targetRequired: true, text: T('Módulo. Acople: +1/+0 e Blindagem 2.'), attach(e) { buff(e, 1, 0); blindGive(e, 2); } });
g2('golem_amigo', { name: T('Golem de Sucata Amigo'), cost: 4, type: 'unit', atk: 3, hp: 5, blind: 2, tags: ['Construto'], disc: 'tech', text: T('Construto. Blindagem 2.') });
g2('bancada_rebites', { name: T('Bancada de Rebites'), cost: 3, type: 'structure', hp: 4, disc: 'tech', text: T('No fim do seu turno, dê Blindagem 2 a uma unidade aliada aleatória sem Blindagem.'), onEndTurn(st, e) { const o = pick(st, aliveUnits(st, e.owner).filter(x => !x.blind)); if (o) { blindGive(o, 2); log(st, T`A Bancada de Rebites blinda ${o.name}.`); } } });
g2('automato_fundidor', { name: T('Autômato Fundidor'), cost: 5, type: 'unit', atk: 4, hp: 4, kw: ['perfurar'], tags: ['Construto'], disc: 'tech', text: T('Construto. Perfurar. Ao Entrar: crie um Núcleo de Escória na sua mão.'), onPlay(st, s) { addToHand(st, s, 'nucleo_escoria'); } });
// Space Wizardry
g2('meteoro_ferroso', { name: T('Meteoro Ferroso'), cost: 4, type: 'spell', orbita: true, disc: 'space', target: () => 'enemyUnit', targetRequired: true, text: T('Órbita. Cause 3 de dano a uma unidade inimiga, +1 por Carga.'), onPlay(st, s, c) { dmg(st, c.target, 3 + (c.inst.cargas || 0), src(s, { spell: true })); } });
g2('astro_fundido', { name: T('Astro Fundido'), cost: 4, type: 'unit', atk: 2, hp: 5, disc: 'space', text: T('Ao Entrar: dê 1 Carga às suas cartas com Órbita.'), onPlay(st, s) { charge(st, s, 1); } });
g2('faisca_magnetica', { name: T('Faísca Magnética'), cost: 1, type: 'spell', disc: 'space', text: T('Cause 1 de dano a todas as unidades inimigas com Blindagem e remova a Blindagem delas.'), onPlay(st, s) { aliveUnits(st, opp(s)).filter(e => e.blind).forEach(e => { dmg(st, { t: 'e', uid: e.uid }, 1, src(s, { spell: true })); e.blind = 0; }); log(st, T('A Faísca Magnética arranca as placas.')); } });
g2('cometa_ferro', { name: T('Cometa de Ferro'), cost: 7, type: 'spell', orbita: true, orbitaCost: true, disc: 'space', text: T('Órbita. Custa 1 a menos por Carga. Cause 4 de dano a todos os inimigos.'), onPlay(st, s) { aoeAll(st, s, 4, src(s, { spell: true })); } });

// Recompensas e neutras de booster
def('machado', { name: T('Machado de Mil Batalhas'), cost: 4, type: 'weapon', atk: 3, hp: 3, disc: 'temporal', text: T('Arma 3/3. Sempre que o protagonista atacar com esta arma, invoque um Recruta de Outra Era.'), onWeaponAttack(st, s) { summon(st, s, 'recruta'); } });
def('carga', { name: T('Carga Através dos Séculos'), cost: 6, type: 'spell', disc: 'temporal', text: T('Suas unidades ganham +2/+0 e Acelerar neste turno.'), onPlay(st, s) { aliveUnits(st, s).forEach(e => { e.tempAtk += 2; e.tempKw.investida = true; }); } });
def('marechal', { name: T('Marechal do Fim dos Tempos'), cost: 7, type: 'unit', atk: 6, hp: 6, disc: 'temporal', text: T('Ao Entrar: para até 3 unidades aliadas diferentes que morreram nesta batalha, invoque uma cópia com o Ataque original, 1 de Vida e Eco.'), onPlay(st, s) { const ids = []; (S(st, s).deadUnits || []).slice().reverse().forEach(id => { if (!ids.includes(id) && ids.length < 3) ids.push(id); }); ids.forEach(id => { const e = summon(st, s, id); if (e) { e.hp = 1; e.maxHp = 1; e.kw.eco = true; e.ecoUsed = false; } }); } });
def('furia', { name: T('Fúria Selvagem'), cost: 5, type: 'spell', disc: 'draconic', target: () => 'friendlyUnit', targetRequired: true, text: T('Dê +4/+4 e Avanço a uma unidade aliada. Despertar: ela ganha Acelerar em vez de Avanço.'), onPlay(st, s, c) { const e = ent(st, c.target); if (e) { buff(e, 4, 4); if (despertar(st, s)) e.kw.investida = true; else e.kw.avanco = true; } } });
def('wyrm', { name: T('Wyrm do Âmago'), cost: 8, type: 'unit', atk: 8, hp: 8, kw: ['guarda'], tags: ['Dragão'], disc: 'draconic', text: T('Dragão. Guarda. Ao Evoluir: cause 3 de dano a todos os inimigos.'), onResonate(st, e) { aoeAll(st, e.owner, 3, src(e.owner, {})); } });
def('rei_dragao', { name: T('Rei-Dragão Ancestral'), cost: 10, type: 'unit', atk: 10, hp: 10, tags: ['Dragão'], disc: 'draconic', costMod(st, s) { return -(S(st, s).crystals || 0); }, text: T('Dragão. Custa 1 a menos para cada Cristal que você ganhou nesta batalha. Ao Entrar: destrua todas as outras unidades.'), onPlay(st, s, c) { ['P', 'E'].forEach(x => aliveUnits(st, x).forEach(u => { if (u !== c.ent) u.destroyed = true; })); } });
def('bailarina', { name: T('Bailarina Pálida'), cost: 5, type: 'unit', atk: 4, hp: 4, kw: ['dreno'], disc: 'necro', text: T('Dreno. Ao Evoluir: devolva à sua mão a última unidade aliada que morreu nesta batalha.'), onResonate(st, e) { const id = (S(st, e.owner).deadUnits || []).filter(x => !DEF[x].token).pop(); if (id) { addToHand(st, e.owner, id); log(st, T`${DEF[id].name} volta para a mão.`); } } });
def('danse', { name: T('Danse Macabre'), cost: 6, type: 'spell', disc: 'necro', compasso: [3], text: T('Destrua todas as unidades. Invoque um Esqueleto 2/2 para cada unidade aliada destruída. Compasso 3: os Esqueletos ganham Dreno.'), onPlay(st, s, c) { const mine = aliveUnits(st, s).length; ['P', 'E'].forEach(x => aliveUnits(st, x).forEach(u => { u.destroyed = true; })); resolveDeaths(st); for (let i = 0; i < mine; i++) { const e = summon(st, s, 'esqueleto22'); if (e && onBeat(st, s, c, 3)) e.kw.dreno = true; } } });
def('esqueleto22', { name: T('Esqueleto'), cost: 2, type: 'unit', atk: 2, hp: 2, token: true, text: '' });
def('regente', { name: T('Regente da Última Valsa'), cost: 7, type: 'unit', atk: 5, hp: 7, sangria: 7, disc: 'necro', text: T('Sangria 7. Enquanto estiver em campo, toda condição de Compasso conta como cumprida.') });
def('liturgia', { name: T('Grande Liturgia'), cost: 4, type: 'ritual', countdown: 4, disc: 'holy', text: T('Ritual 4. Ao ativar: invoque dois Anjos Guardiões 4/4 com Guarda.'), ritualEffect(st, e) { summon(st, e.owner, 'anjo'); summon(st, e.owner, 'anjo'); } });
def('arauto', { name: T('Arauto da Aurora Velada'), cost: 7, type: 'unit', atk: 6, hp: 7, kw: ['guarda', 'escudo'], disc: 'holy', text: T('Guarda. Escudo. Ao Entrar: reduza em 2 a contagem de todos os seus Rituais.'), onPlay(st, s) { S(st, s).board.filter(x => x.kind === 'ritual' && !x.removed).forEach(r => tickRitual(st, r, 2)); } });
def('serafim', { name: T('Serafim de Mil Véus'), cost: 8, type: 'unit', atk: 7, hp: 7, kw: ['emboscada', 'escudo'], disc: 'holy', text: T('Emboscada. Escudo. Ao Entrar: ative agora todos os seus Rituais.'), onPlay(st, s) { S(st, s).board.filter(x => x.kind === 'ritual' && !x.removed).forEach(r => activateRitual(st, r)); } });
def('canhao', { name: T('Canhão de Ombro'), cost: 4, type: 'spell', module: true, disc: 'tech', target: () => 'friendlyUnit', targetRequired: true, text: T('Módulo. Acople: +3/+0. Quando a unidade atacar, cause 2 de dano a outro inimigo aleatório.'), attach(e) { buff(e, 3, 0); }, onHostAttack(st, a, ref) { const o = opp(a.owner); const c = S(st, o).board.filter(e => (e.kind === 'unit' || e.kind === 'structure') && !isDead(e) && !hasKw(e, 'emboscada') && !(ref.t === 'e' && e.uid === ref.uid)).map(e => ({ t: 'e', uid: e.uid })); if (ref.t !== 'l') c.push({ t: 'l', side: o }); const t = pick(st, c); if (t) dmg(st, t, 2, src(a.owner, {})); } });
def('destilaria', { name: T('Destilaria de Elixires'), cost: 5, type: 'structure', hp: 6, disc: 'tech', text: T('No início do seu turno, crie um Frasco Volátil na sua mão.'), onStartTurn(st, e) { addToHand(st, e.owner, 'frasco'); } });
def('colosso', { name: T('Colosso Arcano'), cost: 8, type: 'unit', atk: 6, hp: 8, kw: ['guarda'], tags: ['Construto'], disc: 'tech', text: T('Construto. Guarda. Ao Entrar: cada Estrutura sua ativa seu efeito agora. Ao Evoluir: ganha Letal e Escudo.'), onPlay(st, s) { S(st, s).board.filter(x => x.kind === 'structure' && !isDead(x)).forEach(x => { const d = DEF[x.id]; if (d.onEndTurn) d.onEndTurn(st, x); if (d.onStartTurn) d.onStartTurn(st, x); }); }, onResonate(st, e) { e.kw.letal = true; e.kw.escudo = true; } });
def('quimera', { name: T('Quimera Nebular'), cost: 6, type: 'unit', atk: 5, hp: 6, disc: 'space', text: T('Ao Entrar: lance uma cópia do último feitiço que você lançou nesta batalha, com alvos aleatórios.'), onPlay(st, s, c) { const id = S(st, s).lastSpell; if (!id) return; const d = DEF[id]; const spec = d.target ? d.target(st, s) : null; const ts = spec ? validTargets(st, s, spec, true) : []; if (spec && d.targetRequired && !ts.length) return; const target = ts.length ? pick(st, ts) : null; log(st, T`Quimera Nebular lança ${d.name}.`); if (d.module) { const e = ent(st, target); if (e) attachModule(st, e, id); } else if (d.onPlay) d.onPlay(st, s, { target, pos: c.pos, inst: { id, cargas: 0 }, ent: null }); } });
def('buraco_negro', { name: T('Buraco Negro'), cost: 7, type: 'spell', disc: 'space', text: T('Destrua todas as unidades. Para cada unidade destruída, dê 1 Carga a cada carta com Órbita na sua mão.'), onPlay(st, s) { let n = 0; ['P', 'E'].forEach(x => aliveUnits(st, x).forEach(u => { u.destroyed = true; n++; })); if (n) charge(st, s, n); } });
def('arquimago', { name: T('Arquimago do Zênite'), cost: 9, type: 'unit', atk: 6, hp: 8, disc: 'space', text: T('Seus feitiços custam 1 a menos. Ao Entrar: dê 3 Cargas a cada carta com Órbita na sua mão.'), onPlay(st, s) { charge(st, s, 3); } });
def('racao', { name: T('Ração de Viagem'), cost: 1, type: 'spell', disc: 'neutra', target: () => 'friendlyUnit', targetRequired: true, text: T('Dê +1/+1 a uma unidade aliada. Se for um Felino, dê +2/+2.'), onPlay(st, s, c) { const e = ent(st, c.target); if (e) { const n = e.tags.includes('Felino') ? 2 : 1; buff(e, n, n); } } });
def('bumerangue', { name: T('Bumerangue'), cost: 1, type: 'spell', disc: 'neutra', target: () => 'anyEnemy', targetRequired: true, text: T('Cause 1 de dano a um inimigo. No início do seu próximo turno, se você controlar um Felino, ele volta para a sua mão.'), onPlay(st, s, c) { dmg(st, c.target, 1, src(s, { spell: true })); S(st, s).boomerang = (S(st, s).boomerang || 0) + 1; } });
def('formacao', { name: T('Formação Defensiva'), cost: 2, type: 'spell', disc: 'neutra', text: T('Dê +0/+2 a todas as unidades aliadas.'), onPlay(st, s) { aliveUnits(st, s).forEach(e => buff(e, 0, 2)); } });
def('lamina_enc', { name: T('Lâmina Encomendada'), cost: 2, type: 'weapon', atk: 2, hp: 3, disc: 'neutra', text: T('Arma 2/3.') });
def('elixir', { name: T('Elixir do Boticário'), cost: 3, type: 'spell', disc: 'neutra', text: T('Recupere 4 de vida. Compre 1 carta.'), onPlay(st, s) { heal(st, s, 4); draw(st, s, 1); } });
def('barril', { name: T('Barril de Pólvora'), cost: 3, type: 'structure', hp: 2, disc: 'neutra', text: T('Quando for destruída, cause 3 de dano a todas as unidades.'), onDestroyed(st, e) { ['P', 'E'].forEach(x => aliveUnits(st, x).forEach(u => dmg(st, { t: 'e', uid: u.uid }, 3, src(e.owner, {})))); } });
def('mapa_ergos', { name: T('Mapa Rabiscado de Ergos'), cost: 0, type: 'spell', disc: 'neutra', text: T('Compre 1 carta. Se for de Disciplina, ela custa 1 a menos.'), onPlay(st, s) { const sd = S(st, s); const before = sd.hand.length; draw(st, s, 1); if (sd.hand.length > before) { const i = sd.hand[sd.hand.length - 1]; const dd = DEF[i.id].disc; if (dd && dd !== 'neutra') i.costMod = (i.costMod || 0) - 1; } } });
def('gigante', { name: T('Gigante das Profundezas'), cost: 6, type: 'unit', atk: 6, hp: 7, disc: 'neutra', text: '' });

/* ---------------- Disciplinas e encontros ---------------- */
const DISC = {
  temporal: { name: T('Arte da Guerra Temporal'), role: T('Aggro'), plan: T('Pressão desde o turno 1: Acelerar, unidades que voltam com Eco e Atraso como emboscada.'), cards: ['recruta', 'golpe_previsto', 'veterano', 'coluna', 'cavaleiro'] },
  draconic: { name: T('Primalismo Dracônico'), role: T('Ramp'), plan: T('Segurar o começo atrás de Guarda, ganhar Cristais e chegar ao Despertar.'), cards: ['broto', 'muralha', 'rugido', 'matriarca', 'tita'] },
  necro: { name: T('Necrodança'), role: T('Ritmo e morte'), plan: T('Turnos de três cartas no Compasso certo, sacrifício e vida como recurso.'), cards: ['esqueleto', 'passo', 'metronomo', 'menestrel', 'maestro'] },
  holy: { name: T('Tenebromancia Sagrada'), role: T('Controle'), plan: T('Ninjas atacam das sombras, e cada unidade abatida ao se revelar é um sacrifício que acelera os Rituais.'), cards: ['novico', 'juramento', 'lamina_prece', 'assassina', 'purificacao'] },
  tech: { name: T('Magitech'), role: T('Midrange e valor'), plan: T('Módulos que voltam para a mão, Estruturas que geram valor e Armadilhas.'), cards: ['placa', 'molas', 'golem_latao', 'torre', 'cav_engr'] },
  space: { name: T('Magia Espacial'), role: T('Combo'), plan: T('Feitiços baratos carregam a Órbita na mão até um turno explosivo.'), cards: ['faisca', 'aprendiz_astral', 'raio', 'golem_poeira', 'cometa'] },
};
const NEUTRAL_STARTER = { felix: 2, tocha: 2, rede: 2, curandeira: 2, guardiao: 2, espada: 2, coletor: 1, pocao: 1, lanceiro: 2, bombardeiro: 2, investida_coord: 1, capita: 1 };

const ENC = {
  revoada: { name: T('Revoada na Fenda'), tier: 'Comum', leader: T('Morcego Ancião'), hp: 12, hand: 3, rule: T('Seus Morcegos da Gruta têm +1/+0.'), deck: { morcego: 6, besouro: 4, enxame: 4, lagarto: 4, ninho: 2 }, onSummon(st, e) { if (e.id === 'morcego') e.atk += 1; } },
  jardim: { name: T('Jardim de Esporos'), tier: 'Comum', leader: T('Fungoide Jardineiro'), hp: 15, hand: 3, rule: T('Seus Cogumelos-Broto brotam como 4/4.'), deck: { broto_cog: 6, besouro: 4, toupeira: 4, esporos: 2, fungoide: 2, mordida_inf: 2 }, onBrotar(st, e) { if (e.id === 'cog_adulto') { e.atk = 4; e.hp = 4; e.maxHp = 4; } } },
  toca: { name: T('Toca das Aranhas'), tier: 'Comum', leader: T('Aranha Mãe'), hp: 15, hand: 3, rule: T('Suas Aranhas Tecelãs custam 1 a menos.'), deck: { aranha: 6, morcego: 4, lagarto: 4, besouro: 2, centopeia: 2, mordida_inf: 2 }, costMod(st, id) { return id === 'aranha' ? -1 : 0; } },
  bicharada: { name: T('Bicharada Mista'), tier: 'Comum', leader: T('Toupeira Rainha'), hp: 18, hand: 3, rule: T('No início do seu turno, se tiver menos unidades que você, compra 1 carta extra.'), deck: { toupeira: 4, morcego: 2, broto_cog: 2, besouro: 2, aranha: 2, enxame: 2, lagarto: 2, mordida_inf: 2, centopeia: 2 }, onStartTurn(st) { if (aliveUnits(st, 'E').length < aliveUnits(st, 'P').length) { draw(st, 'E', 1); log(st, T('Toupeira Rainha compra 1 carta extra.')); } } },
  imperatriz: { name: T('Centopeia Imperatriz'), tier: 'Elite', leader: T('Centopeia Imperatriz'), hp: 25, hand: 4, rule: T('Suas unidades com Letal custam 1 a menos e têm +0/+1.'), deck: { centopeia: 6, aranha: 4, lagarto: 4, besouro: 4, mordida_inf: 3, esporos: 2, morcego: 2 }, costMod(st, id) { return DEF[id].kw.includes('letal') ? -1 : 0; }, onSummon(st, e) { if (e.kw.letal) { e.hp += 1; e.maxHp += 1; } } },
  fungo: { name: T('Fungo Colossal Desperto'), tier: 'Elite', leader: T('Fungo Colossal Desperto'), hp: 25, hand: 4, rule: T('Seus Cogumelos Adultos têm Guarda.'), deck: { broto_cog: 6, fungoide: 4, toupeira: 4, besouro: 4, esporos: 3, fungo_colossal: 2, mordida_inf: 2 }, onBrotar(st, e) { if (e.id === 'cog_adulto') e.kw.guarda = true; } },
  basilisco: { name: T('Basilisco das Grutas'), tier: 'Chefe', leader: T('Basilisco das Grutas'), hp: 40, hand: 4, boss: true, resonance: 2, phaseAt: 20,
    onPhase2(st) { st.gazeCount = 2; heal(st, 'E', 8); log(st, T('O Basilisco troca de pele: recupera 8 de Vida e o Olhar passa a pegar duas unidades.')); }, rule: T('Olhar Petrificante: no fim do turno dele, sua unidade de maior Ataque fica Imóvel. Com 20 de Vida ou menos, troca de pele (recupera 8) e o Olhar pega duas unidades.'), deck: { ninhada: 3, filhote_bas: 3, mordida_pet: 3, estatua: 2, cauda: 2, lagarto: 4, broto_cog: 4, besouro: 3, fungoide: 2, mordida_inf: 2, fungo_colossal: 2 },
    onEndTurn(st) { const us = aliveUnits(st, 'P'); us.sort((a, b) => getAtk(st, b) - getAtk(st, a)); us.slice(0, st.gazeCount).forEach(e => { setImovel(st, e); log(st, T`Olhar Petrificante: ${e.name} fica Imóvel.`); }); } },
};

/* ---------------- Grupo 2: A Forja Esquecida ---------------- */
const blindTo = (e, n) => { if (e) e.blind = (e.blind || 0) + n; };
def('g_pilha', { name: T('Pilha de Sucata'), cost: 1, type: 'unit', atk: 0, hp: 2, tags: ['Golem'], brotar: 'g_golem_sucata', text: T('Brotar: vira um Golem de Sucata 3/3.') });
def('g_golem_sucata', { name: T('Golem de Sucata'), cost: 3, type: 'unit', atk: 3, hp: 3, tags: ['Golem'], text: '' });
def('g_golem_ferro', { name: T('Golem de Ferro'), cost: 3, type: 'unit', atk: 2, hp: 4, blind: 2, tags: ['Golem'], text: T('Blindagem 2.') });
def('g_golem_martelo', { name: T('Golem-Martelo'), cost: 4, type: 'unit', atk: 3, hp: 4, blind: 2, tags: ['Golem'], text: T('Blindagem 2.') });
def('g_engrenagem', { name: T('Engrenagem Solta'), cost: 1, type: 'spell', target: () => 'enemyUnit', targetRequired: true, text: T('Cause 2 de dano a uma unidade inimiga.'), onPlay(st, s, c) { dmg(st, c.target, 2, src(s, { spell: true })); } });
def('g_fagulha', { name: T('Fagulha Viva'), cost: 1, type: 'unit', atk: 1, hp: 2, kw: ['superaquecer'], tags: ['Elemental'], text: T('Superaquecer.') });
def('g_igneo', { name: T('Elemental Ígneo'), cost: 3, type: 'unit', atk: 2, hp: 4, kw: ['superaquecer'], tags: ['Elemental'], text: T('Superaquecer.') });
def('g_magma', { name: T('Elemental de Magma'), cost: 5, type: 'unit', atk: 4, hp: 6, kw: ['superaquecer'], tags: ['Elemental'], text: T('Superaquecer.') });
def('g_escoria', { name: T('Elemental de Escória'), cost: 1, type: 'unit', atk: 1, hp: 1, kw: ['superaquecer'], tags: ['Elemental'], text: T('Superaquecer.') });
def('g_lufada', { name: T('Lufada Incandescente'), cost: 2, type: 'spell', text: T('Cause 1 de dano a todas as unidades inimigas.'), onPlay(st, s) { aoeUnits(st, s, 1, src(s, { spell: true })); } });
def('g_sentinela', { name: T('Azer Sentinela'), cost: 2, type: 'unit', atk: 2, hp: 3, kw: ['guarda'], tags: ['Azer'], text: T('Guarda.') });
def('g_lanceiro', { name: T('Azer Lanceiro'), cost: 3, type: 'unit', atk: 3, hp: 2, kw: ['avanco'], tags: ['Azer'], text: T('Avanço.') });
def('g_ferreiro', { name: T('Azer Ferreiro'), cost: 2, type: 'unit', atk: 2, hp: 2, tags: ['Azer'], text: T('Ao Entrar: dê Blindagem 1 a outra unidade aliada aleatória.'), onPlay(st, s, c) { const o = pick(st, aliveUnits(st, s).filter(x => x !== c.ent)); if (o) { blindTo(o, 1); log(st, T`${o.name} ganha Blindagem 1.`); } } });
def('g_martelo_runico', { name: T('Martelo Rúnico'), cost: 2, type: 'spell', target: () => 'enemyUnit', targetRequired: true, text: T('Cause 1 de dano a uma unidade inimiga e deixe-a Imóvel.'), onPlay(st, s, c) { const e = ent(st, c.target); dmg(st, c.target, 1, src(s, { spell: true })); if (e && !isDead(e)) setImovel(st, e); } });
def('g_forja', { name: T('Forja Ardente'), cost: 3, type: 'structure', hp: 5, tags: ['Forja'], text: T('No fim do turno do dono, uma unidade aliada aleatória ganha +1/+1.'), onEndTurn(st, e) { const u = pick(st, aliveUnits(st, e.owner)); if (u) { buff(u, 1, 1); log(st, T`A Forja Ardente tempera ${u.name}: +1/+1.`); } } });
const hasForja = (st, side) => S(st, side).board.some(x => x.id === 'g_forja' && !isDead(x));
Object.assign(ENC, {
  oficina: { name: T('Oficina de Golens'), tier: 'Comum', grupo: 2, leader: T('Capataz Autômato'), hp: 28, hand: 4, extraMana: 1, rule: T('Seus Golens entram com Blindagem 2.'), deck: { g_pilha: 4, g_golem_ferro: 5, g_golem_martelo: 5, g_engrenagem: 4, g_sentinela: 3, g_golem_sucata: 3 }, onSummon(st, e) { if (e.owner === 'E' && e.tags.includes('Golem')) e.blind = Math.max(e.blind || 0, 2); }, onBrotar(st, e) { if (e.tags && e.tags.includes('Golem')) e.blind = Math.max(e.blind || 0, 2); } },
  bocas: { name: T('Bocas de Fogo'), tier: 'Comum', grupo: 2, leader: T('Elemental do Braseiro'), hp: 26, hand: 4, extraMana: 1, rule: T('Seus Elementais têm +1/+2.'), deck: { g_fagulha: 5, g_igneo: 6, g_lufada: 5, g_engrenagem: 3, g_magma: 4 }, onSummon(st, e) { if (e.owner === 'E' && e.tags.includes('Elemental')) buff(e, 1, 2); } },
  patrulha_azer: { name: T('Patrulha Azer'), tier: 'Comum', grupo: 2, leader: T('Sentinela Azer'), hp: 24, hand: 4, extraMana: 1, rule: T('No início do turno dele, uma unidade aliada aleatória ganha +1/+0 e Blindagem 1 (a Blindagem acumula).'), deck: { g_sentinela: 5, g_lanceiro: 6, g_ferreiro: 4, g_martelo_runico: 4, g_golem_martelo: 3 }, onStartTurn(st) { const u = pick(st, aliveUnits(st, 'E')); if (u) { u.atk += 1; blindTo(u, 1); log(st, T`${u.name} ganha +1/+0 e Blindagem 1.`); } } },
  fundicao: { name: T('Fundição Abandonada'), tier: 'Comum', grupo: 2, leader: T('Fornalha Viva'), hp: 26, hand: 4, extraMana: 1, rule: T('Começa com uma Forja Ardente em campo.'), deck: { g_forja: 3, g_fagulha: 3, g_golem_ferro: 4, g_igneo: 5, g_golem_martelo: 3, g_lufada: 3, g_magma: 2 }, onStart(st) { summon(st, 'E', 'g_forja'); } },
  colosso_ferro: { name: T('O Colosso de Ferro'), tier: 'Elite', grupo: 2, leader: T('O Colosso de Ferro'), hp: 30, hand: 4, extraMana: 1, rule: T('O Colosso tem Blindagem 3 enquanto houver uma Forja em campo. Começa com uma Forja.'), deck: { g_forja: 2, g_golem_ferro: 5, g_golem_martelo: 4, g_pilha: 5, g_engrenagem: 4, g_sentinela: 5 }, leaderBlind(st) { return hasForja(st, 'E') ? 3 : 0; }, onStart(st) { summon(st, 'E', 'g_forja'); } },
  matriarca_azer: { name: T('Matriarca Azer'), tier: 'Elite', grupo: 2, leader: T('Senhora das Bigornas'), hp: 30, hand: 4, extraMana: 1, rule: T('No fim do turno dela, a unidade aliada mais fraca ganha +1/+1 e Blindagem 1.'), deck: { g_sentinela: 5, g_lanceiro: 5, g_ferreiro: 5, g_martelo_runico: 4, g_golem_ferro: 3, g_igneo: 3 }, onEndTurn(st) { const us = aliveUnits(st, 'E').sort((a, b) => (a.atk + a.hp) - (b.atk + b.hp)); const u = us[0]; if (u) { buff(u, 1, 1); blindTo(u, 1); log(st, T`A Matriarca tempera ${u.name}: +1/+1 e Blindagem 1.`); } } },
  ignar: { name: T('Ignar, o Coração da Forja'), tier: 'Chefe', grupo: 2, leader: T('Ignar'), hp: 50, hand: 4, boss: true, resonance: 3, phaseAt: 25, extraMana: 1,
    rule: T('Fase 1: Blindagem 3; no fim do turno dele, cria um Elemental de Escória. Com 25 de Vida ou menos, derrete: perde a Blindagem, as unidades dele ganham Superaquecer e, no início de cada turno dele, todas as unidades sofrem 1 de dano.'),
    deck: { g_igneo: 5, g_magma: 5, g_golem_ferro: 4, g_golem_martelo: 4, g_lufada: 4, g_forja: 2, g_fagulha: 3, g_martelo_runico: 3 },
    leaderBlind(st) { return st.phase2 ? 0 : 3; },
    onEndTurn(st) { if (!st.phase2) { const e = summon(st, 'E', 'g_escoria'); if (e) log(st, T('Ignar cospe um Elemental de Escória.')); } },
    onPhase2(st) { aliveUnits(st, 'E').forEach(u => { u.kw.superaquecer = true; }); log(st, T('Ignar derrete: perde a Blindagem, e o calor toma conta da mesa.')); },
    onStartTurn(st) { if (st.phase2) { ['P', 'E'].forEach(sd => aliveUnits(st, sd).forEach(u => dmg(st, { t: 'e', uid: u.uid }, 1, src('E', { spell: true })))); log(st, T('O calor de Ignar causa 1 de dano a todas as unidades.')); } },
    onSummon(st, e) { if (st.phase2 && e.owner === 'E' && e.kind === 'unit') e.kw.superaquecer = true; },
    onEnemyResonate(st, e) { blindTo(e, 2); log(st, T`${e.name} ganha Blindagem 2.`); } },
});

/* ---------------- Utilidades ---------------- */
function S(st, s) { return st.sides[s]; }
function opp(s) { return s === 'P' ? 'E' : 'P'; }
function log(st, msg) { st.log.push(msg); }
function pick(st, arr) { return arr.length ? arr[Math.floor(st.rng() * arr.length)] : null; }
function shuffle(st, arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(st.rng() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
function newInst(st, id, costMod) { return { uid: st.nextUid++, id, cargas: 0, costMod: costMod || 0 }; }
function src(side, o) { return { side, letal: !!o.letal, dreno: !!o.dreno, spell: !!o.spell, pierce: !!o.pierce }; }
function sameRef(a, b) { return a && b && a.t === b.t && (a.t === 'l' ? a.side === b.side : a.uid === b.uid); }
function isDead(e) { return !!(e.removed || e.destroyed || (e.kind !== 'ritual' && e.hp <= 0)); }
function hasKw(e, k) { return !!(e.kw[k] || e.tempKw[k]); }
function buff(e, a, h) { if (!e) return; e.atk += a; e.hp += h; e.maxHp += h; }
function aliveUnits(st, s) { return S(st, s).board.filter(e => e.kind === 'unit' && !isDead(e)); }
function hasEmboscada(st, s) { return aliveUnits(st, s).some(e => hasKw(e, 'emboscada')); }
function despertar(st, s) { return S(st, s).maxMana >= 7; }
function getAtk(st, e) {
  let a = e.atk + (e.tempAtk || 0);
  if (e.kw.eco && S(st, e.owner).board.some(x => x.id === 'estandarte' && !isDead(x))) a += 1;
  return Math.max(0, a);
}
function ent(st, ref) {
  if (!ref || ref.t !== 'e') return null;
  for (const s of ['P', 'E']) { const e = S(st, s).board.find(x => x.uid === ref.uid); if (e) return e; }
  return null;
}
function rec(st, ev) { if (!st.events) return; ev.ms = Date.now() - st.t0; st.events.push(ev); }
/* Fila de apresentação (P94): a interface liga com st.fxq = [] e lê depois de cada desenho. Sem a fila (Node, simulações), não faz nada.
   Não vai para o log exportado. */
function fx(st, ev) { if (st.fxq) st.fxq.push(ev); }
function refCopy(ref) { return ref.t === 'l' ? { t: 'l', side: ref.side } : { t: 'e', uid: ref.uid }; }
function uidOf(e) { return e.id + '#' + e.uid; }
function refOut(st, ref) { if (!ref) return null; if (ref.t === 'l') return 'L' + ref.side; const e = ent(st, ref); return e ? uidOf(e) : '#' + ref.uid; }
function statOf(st, ref) { if (!ref) return null; if (ref.t === 'l') return [0, S(st, ref.side).leader.hp]; const e = ent(st, ref); return e ? [e.kind === 'unit' ? getAtk(st, e) : 0, e.kind === 'ritual' ? e.countdown : e.hp] : null; }
function boardOut(st, side) { return S(st, side).board.filter(e => !isDead(e)).map(e => [e.id, e.uid, e.kind === 'ritual' ? 'R' + e.countdown : getAtk(st, e), e.hp, Object.keys(e.kw).filter(k => e.kw[k]).concat(Object.keys(e.tempKw).filter(k => e.tempKw[k])).concat(e.imovel ? ['imovel'] : []).concat(e.modules.map(m => 'mod:' + m)).join('+')]); }
function snap(st, side) {
  const P = S(st, 'P'), O = S(st, 'E');
  rec(st, { k: 'turn', s: side, n: S(st, side).turnCount, hp: [P.leader.hp, O.leader.hp], mana: [P.maxMana, O.maxMana], hand: P.hand.map(i => i.id), eh: O.hand.length, deck: [P.deck.length, O.deck.length], bp: boardOut(st, 'P'), be: boardOut(st, 'E'), res: [P.resonance.points, O.resonance.points], w: P.weapon ? [P.weapon.id, P.weapon.atk, P.weapon.dur] : null, traps: P.traps.slice() });
}
function hasRegente(st, s) { return S(st, s).board.some(e => e.id === 'regente' && !isDead(e)); }
function onBeat(st, s, c, n) { return c.pos === n || hasRegente(st, s); }
function compassoPos(st, s) { return (S(st, s).cardsPlayedThisTurn % 3) + 1; }
function leaderSpellImmune(st, side) { return side === 'E' && S(st, 'E').board.some(e => e.id === 'estatua' && !isDead(e)); }

function getCost(st, side, inst) {
  const d = DEF[inst.id];
  let c = d.cost + (inst.costMod || 0);
  if (d.orbitaCost) c -= inst.cargas || 0;
  if (d.costMod) c += d.costMod(st, side);
  if (d.type === 'spell') c -= S(st, side).board.filter(e => e.id === 'arquimago' && !isDead(e)).length;
  if (side === 'E' && st.enc.costMod) c += st.enc.costMod(st, inst.id);
  return Math.max(0, c);
}

/* ---------------- Efeitos básicos ---------------- */
function draw(st, side, n) {
  const sd = S(st, side);
  for (let k = 0; k < n; k++) {
    if (!sd.deck.length) {
      sd.fatigue = (sd.fatigue || 0) + 1;
      loseLife(st, { t: 'l', side }, sd.fatigue);
      log(st, T`${sd.leader.name} está sem cartas e sofre ${sd.fatigue} de fadiga.`);
      continue;
    }
    const inst = sd.deck.shift();
    if (sd.hand.length >= HAND_MAX) { log(st, T`Mão cheia: ${DEF[inst.id].name} é queimada.`); fx(st, { k: 'burn', s: side, c: inst.id }); continue; }
    sd.hand.push(inst);
    fx(st, { k: 'draw', s: side, u: inst.uid });
  }
}
function addToHand(st, side, id, costMod) {
  const sd = S(st, side);
  if (sd.hand.length >= HAND_MAX) { log(st, T`Mão cheia: ${DEF[id].name} se perde.`); return null; }
  const inst = newInst(st, id, costMod); sd.hand.push(inst); fx(st, { k: 'gain', s: side, u: inst.uid }); return inst;
}
function shuffleInto(st, side, id) {
  const deck = S(st, side).deck;
  deck.splice(Math.floor(st.rng() * (deck.length + 1)), 0, newInst(st, id));
}
function heal(st, side, n) { const l = S(st, side).leader; const h0 = l.hp; l.hp = Math.min(l.maxHp, l.hp + n); if (l.hp !== h0) fx(st, { k: 'heal', ref: { t: 'l', side }, n: l.hp - h0 }); }
/* Perda de vida que não é dano: não passa por Escudo nem Blindagem (fadiga, Sangria, Pacto, Superaquecer). */
function loseLife(st, ref, n) {
  if (n <= 0) return;
  if (ref.t === 'l') S(st, ref.side).leader.hp -= n;
  else { const e = ent(st, ref); if (!e) return; e.hp -= n; }
  fx(st, { k: 'dmg', ref: refCopy(ref), n, vida: 1 });
}
function cristal(st, side) {
  const sd = S(st, side);
  if (sd.maxMana >= 10) { draw(st, side, 1); log(st, T('Mana máxima já é 10: Cristal vira compra.')); }
  else { sd.maxMana += 1; log(st, T`${sd.leader.name} ganha 1 Cristal.`); }
  sd.crystals = (sd.crystals || 0) + 1;
}
function charge(st, side, n) {
  S(st, side).hand.forEach(i => { if (DEF[i.id].orbita) i.cargas = Math.min(CARGA_MAX, (i.cargas || 0) + n); });
}
function setImovel(st, e) { e.imovel = (st.turnSide === e.owner) ? 2 : 1; }
function reveal(st, e, target) {
  log(st, T`${e.name} se revela.`);
  const d = DEF[e.id]; if (d.onReveal) d.onReveal(st, e, target);
}
function sacrifice(st, e) {
  const n = DEF[e.id].sacrificio || 1;
  const rs = S(st, e.owner).board.filter(x => x.kind === 'ritual' && !x.removed);
  if (!rs.length) return;
  log(st, T`Sacrifício: seus Rituais perdem ${n} de contagem.`);
  rec(st, { k: 'sac', u: uidOf(e), n });
  rs.forEach(r => tickRitual(st, r, n));
}

/* Blindagem N (grupo 2, P91): danos menores que N não passam; danos de N ou mais passam inteiros. Feitiços ignoram.
   A variante 'reduz' (tira N de cada dano) ficou só para simulação: punia demais os decks de unidades pequenas. */
const BLIND = { mode: 'limiar', spellsIgnore: true, extra: 0 };
function setBlindRule(mode, spellsIgnore) { BLIND.mode = mode; BLIND.spellsIgnore = spellsIgnore !== false; }
function blindOf(st, ref) {
  if (ref.t === 'l') return ref.side === 'E' && st.enc.leaderBlind ? st.enc.leaderBlind(st) : 0;
  const e = ent(st, ref); return e ? (e.blind || 0) : 0;
}
function applyBlind(st, ref, amount, sc) {
  const b0 = blindOf(st, ref); const b = b0 ? b0 + (BLIND.extra || 0) : 0; if (!b || sc.pierce || (sc.spell && BLIND.spellsIgnore)) return amount;
  const out = BLIND.mode === 'limiar' ? (amount < b ? 0 : amount) : Math.max(0, amount - b);
  if (out < amount) log(st, T`A Blindagem segura ${amount - out} de dano.`);
  return out;
}
function dmg(st, ref, amount, sc) {
  if (!ref || amount <= 0) return 0;
  const a0 = amount;
  if (ref.t === 'l') {
    amount = applyBlind(st, ref, amount, sc); if (amount <= 0) { fx(st, { k: 'bloq', ref: refCopy(ref), n: a0 }); return 0; }
    const sd = S(st, ref.side);
    sd.leader.hp -= amount;
    fx(st, { k: 'dmg', ref: refCopy(ref), n: amount, sp: sc.spell ? 1 : 0 });
    if (sc.dreno) heal(st, sc.side, amount);
    afterLeaderDamage(st, ref.side);
    return amount;
  }
  const e = ent(st, ref);
  if (!e || isDead(e) || e.kind === 'ritual') return 0;
  if (hasKw(e, 'escudo')) { e.kw.escudo = false; e.tempKw.escudo = false; log(st, T`${e.name} perde o Escudo.`); fx(st, { k: 'escudo', ref: refCopy(ref), n: a0 }); return 0; }
  amount = applyBlind(st, ref, amount, sc); if (amount <= 0) { fx(st, { k: 'bloq', ref: refCopy(ref), n: a0 }); return 0; }
  e.hp -= amount;
  fx(st, { k: 'dmg', ref: refCopy(ref), n: amount, sp: sc.spell ? 1 : 0, letal: sc.letal && e.kind === 'unit' ? 1 : 0 });
  if (sc.letal && e.kind === 'unit') e.destroyed = true;
  if (sc.dreno) heal(st, sc.side, amount);
  return amount;
}
function afterLeaderDamage(st, side) {
  if (side === 'E' && st.enc.phaseAt && !st.phase2) {
    const l = S(st, 'E').leader;
    if (l.hp > 0 && l.hp <= st.enc.phaseAt) { st.phase2 = true; st.enc.onPhase2(st); rec(st, { k: 'phase2', hp: l.hp }); }
  }
}
function aoeUnits(st, side, n, sc) { aliveUnits(st, opp(side)).forEach(e => dmg(st, { t: 'e', uid: e.uid }, n, sc)); }
function aoeAll(st, side, n, sc) {
  const o = opp(side);
  S(st, o).board.filter(e => (e.kind === 'unit' || e.kind === 'structure') && !isDead(e)).forEach(e => dmg(st, { t: 'e', uid: e.uid }, n, sc));
  dmg(st, { t: 'l', side: o }, n, sc);
}
function randomEnemyRef(st, side) {
  const o = opp(side);
  const c = S(st, o).board.filter(e => (e.kind === 'unit' || e.kind === 'structure') && !isDead(e) && !hasKw(e, 'emboscada')).map(e => ({ t: 'e', uid: e.uid }));
  c.push({ t: 'l', side: o });
  return pick(st, c);
}

function makeEntity(st, owner, id) {
  const d = DEF[id];
  const e = {
    uid: st.nextUid++, id, name: d.name, owner, kind: d.type === 'unit' ? 'unit' : d.type,
    atk: d.atk || 0, hp: d.hp || 0, maxHp: d.hp || 0, kw: {}, tags: d.tags.slice(),
    summonedTurn: S(st, owner).turnCount, attacked: false, imovel: 0, tempAtk: 0, tempKw: {},
    modules: [], countdown: d.countdown || 0, ecoUsed: false, extraDeath: 0, blind: d.blind || 0,
    rushThisTurn: false, resonated: false, destroyed: false, removed: false,
  };
  d.kw.forEach(k => { e.kw[k] = true; });
  return e;
}
function boardCount(st, side) { return S(st, side).board.filter(e => !isDead(e)).length; }
function summon(st, side, id) {
  const sd = S(st, side);
  if (boardCount(st, side) >= BOARD_MAX) { log(st, T`Sem espaço: ${DEF[id].name} não entra.`); return null; }
  const e = makeEntity(st, side, id);
  sd.board.push(e);
  if (side === 'E' && st.enc.onSummon) st.enc.onSummon(st, e);
  fx(st, { k: 'summon', s: side, u: e.uid });
  return e;
}
function removeFromBoard(st, e) { const b = S(st, e.owner).board; const i = b.indexOf(e); if (i >= 0) b.splice(i, 1); }
function bounce(st, ref, costMod) {
  const e = ent(st, ref); if (!e) return;
  e.removed = true; removeFromBoard(st, e);
  e.modules.forEach(m => addToHand(st, e.owner, m));
  const inst = addToHand(st, e.owner, e.id, costMod);
  log(st, T`${e.name} volta para a mão.`);
  return inst;
}
function attachModule(st, e, modId) {
  DEF[modId].attach(e); e.modules.push(modId);
  log(st, T`${DEF[modId].name} acoplado a ${e.name}.`);
  const d = DEF[e.id]; if (d.onModuleAttached) d.onModuleAttached(st, e);
}
function tickRitual(st, e, n) {
  if (e.removed) return;
  e.countdown -= n;
  if (e.countdown <= 0) activateRitual(st, e);
}
function activateRitual(st, e) {
  if (e.removed) return;
  e.removed = true; removeFromBoard(st, e);
  log(st, T`Ritual ativado: ${e.name}.`);
  rec(st, { k: 'ritual', c: e.id, o: e.owner });
  DEF[e.id].ritualEffect(st, e);
  S(st, e.owner).board.forEach(x => { if (!isDead(x) && DEF[x.id].onRitualActivate) DEF[x.id].onRitualActivate(st, x); });
}
function brotar(st, e) {
  const d = DEF[e.id]; if (!d.brotar) return;
  const b = S(st, e.owner).board; const i = b.indexOf(e); if (i < 0) return;
  const ne = makeEntity(st, e.owner, d.brotar);
  ne.summonedTurn = e.summonedTurn;
  b[i] = ne;
  if (e.owner === 'E' && st.enc.onBrotar) st.enc.onBrotar(st, ne);
  log(st, T`${e.name} brota: vira ${ne.name}.`);
  rec(st, { k: 'brotar', from: e.id, to: uidOf(ne) });
}
function prever(st, side, n) {
  const sd = S(st, side); const top = sd.deck.slice(0, n);
  if (!top.length || side !== 'P') return;
  st.pending = { kind: 'prever', side, uids: top.map(i => i.uid) };
}
function resolvePrever(st, takeUid) {
  if (!st.pending || st.pending.kind !== 'prever') return false;
  const sd = S(st, st.pending.side);
  const ids = st.pending.uids;
  const cards = ids.map(u => sd.deck.find(i => i.uid === u)).filter(Boolean);
  sd.deck = sd.deck.filter(i => !ids.includes(i.uid));
  const take = cards.find(i => i.uid === takeUid) || cards[0];
  rec(st, { k: 'prever', shown: cards.map(i => i.id), take: take ? take.id : null });
  sd.deck = sd.deck.concat(cards.filter(i => i !== take));
  if (take) {
    if (sd.hand.length >= HAND_MAX) log(st, T`Mão cheia: ${DEF[take.id].name} é queimada.`);
    else { sd.hand.push(take); log(st, T`Prever: ${DEF[take.id].name} vai para a mão.`); }
  }
  st.pending = null;
  resolveDeaths(st); checkOver(st);
  return true;
}
function triggerTrap(st, owner, event, e) {
  const sd = S(st, owner);
  if (event === 'attack' && !sd.traps.includes('molas') && sd.traps.includes('s_clausula')) {
    if (getAtk(st, e) > 2) return;
    sd.traps.splice(sd.traps.indexOf('s_clausula'), 1); rec(st, { k: 'trap', c: 's_clausula', on: uidOf(e) });
    log(st, T`Cláusula Escondida! ${e.name} é anulado.`); e.destroyed = true; return;
  }
  const id = event === 'attack' ? 'molas' : 'gas';
  const i = sd.traps.indexOf(id); if (i < 0) return;
  sd.traps.splice(i, 1);
  rec(st, { k: 'trap', c: id, on: uidOf(e) });
  if (id === 'molas') { log(st, T`Armadilha de Molas! ${e.name} sofre 3 de dano.`); dmg(st, { t: 'e', uid: e.uid }, 3, src(owner, {})); }
  else { setImovel(st, e); log(st, T`Gás Paralisante! ${e.name} fica Imóvel.`); draw(st, owner, 1); }
}

function resolveDeaths(st) {
  for (let guard = 0; guard < 100; guard++) {
    const dead = [];
    ['P', 'E'].forEach(s => S(st, s).board.forEach(e => { if (e.kind !== 'ritual' && (e.destroyed || e.hp <= 0)) dead.push(e); }));
    if (!dead.length) break;
    dead.forEach(e => removeFromBoard(st, e));
    dead.forEach(e => {
      const sd = S(st, e.owner); const d = DEF[e.id];
      log(st, e.kind === 'structure' ? T`${e.name} é destruída.` : T`${e.name} morre.`);
      rec(st, { k: 'die', u: uidOf(e), o: e.owner });
      fx(st, { k: 'die', u: e.uid, o: e.owner, kind: e.kind });
      e.modules.forEach(m => { addToHand(st, e.owner, m); });
      if (e.kind === 'structure' && d.onDestroyed) d.onDestroyed(st, e);
      if (e.kind === 'unit') {
        (sd.deadUnits = sd.deadUnits || []).push(e.id);
        const times = 1 + (e.extraDeath || 0);
        if (d.onDeath && !e.silenced) for (let k = 0; k < times; k++) d.onDeath(st, e);
        if (e.kw.eco && !e.ecoUsed) sd.ecoReturns.push(e.id);
        sd.board.forEach(o => { if (!isDead(o) && !o.silenced && DEF[o.id].onFriendlyDeath) DEF[o.id].onFriendlyDeath(st, o, e); });
        if (e.kind === 'unit' && sd.weapon && sd.weapon.id === 'martelo_funebre') { sd.weapon.dur += 1; log(st, T('O Martelo Fúnebre ganha +1 de durabilidade.')); }
      }
    });
    if (checkOver(st)) break;
  }
}
function checkOver(st) {
  if (st.over) return true;
  const p = S(st, 'P').leader.hp, e = S(st, 'E').leader.hp;
  if (p <= 0) { st.over = 'E'; log(st, st.enc && st.enc.social ? T('Você perdeu a compostura.') : T('Você caiu na dungeon.')); rec(st, { k: 'over', win: 'E', turns: [S(st, 'P').turnCount, S(st, 'E').turnCount], hp: [p, e] }); return true; }
  if (e <= 0) { st.over = 'P'; log(st, st.enc && st.enc.social ? T`${S(st, 'E').leader.name} cede.` : T`${S(st, 'E').leader.name} foi derrotado.`); rec(st, { k: 'over', win: 'P', turns: [S(st, 'P').turnCount, S(st, 'E').turnCount], hp: [p, e] }); return true; }
  return false;
}

/* ---------------- Ações ---------------- */
function validTargets(st, side, spec, isSpell) {
  const o = opp(side);
  const ob = S(st, o).board.filter(e => !isDead(e)), mb = S(st, side).board.filter(e => !isDead(e));
  const ref = e => ({ t: 'e', uid: e.uid });
  const vis = e => !hasKw(e, 'emboscada');
  switch (spec) {
    case 'enemyUnit': return ob.filter(e => e.kind === 'unit' && vis(e)).map(ref);
    case 'enemyUnitAtk4': return ob.filter(e => e.kind === 'unit' && vis(e) && getAtk(st, e) <= 4).map(ref);
    case 'enemyUnitAtk3': return ob.filter(e => e.kind === 'unit' && vis(e) && getAtk(st, e) <= 3).map(ref);
    case 'enemyUnitAtk2': return ob.filter(e => e.kind === 'unit' && vis(e) && getAtk(st, e) <= 2).map(ref);
    case 'enemyImovel': return ob.filter(e => e.kind === 'unit' && vis(e) && e.imovel > 0).map(ref);
    case 'anyEnemy': {
      const r = ob.filter(e => (e.kind === 'unit' || e.kind === 'structure') && vis(e)).map(ref);
      if (!(isSpell && leaderSpellImmune(st, o))) r.push({ t: 'l', side: o });
      return r;
    }
    case 'friendlyUnit': return mb.filter(e => e.kind === 'unit').map(ref);
    case 'ownRitual': return mb.filter(e => e.kind === 'ritual').map(ref);
  }
  return [];
}
function canAttack(st, e) {
  if (!e || e.kind !== 'unit' || isDead(e) || e.attacked || e.imovel > 0 || getAtk(st, e) <= 0) return false;
  if (st.turnSide !== e.owner || st.over || st.pending) return false;
  const sick = e.summonedTurn === S(st, e.owner).turnCount;
  if (!sick) return true;
  return hasKw(e, 'investida') || hasKw(e, 'avanco') || e.rushThisTurn;
}
function canHitFace(st, e) {
  if (!e) return true;
  const sick = e.summonedTurn === S(st, e.owner).turnCount;
  return !sick || hasKw(e, 'investida');
}
function attackTargets(st, side, attacker) {
  const o = opp(side);
  const ob = S(st, o).board.filter(e => !isDead(e) && (e.kind === 'unit' || e.kind === 'structure') && !hasKw(e, 'emboscada'));
  const guards = ob.filter(e => e.kind === 'unit' && hasKw(e, 'guarda'));
  const list = guards.length ? guards : ob;
  const refs = list.map(e => ({ t: 'e', uid: e.uid }));
  if (!guards.length && canHitFace(st, attacker)) refs.push({ t: 'l', side: o });
  return refs;
}
function canPlay(st, side, idx) {
  const sd = S(st, side); const inst = sd.hand[idx];
  if (!inst) return { ok: false, reason: T('Carta inválida.') };
  if (st.over || st.pending || st.turnSide !== side) return { ok: false, reason: T('Não é a sua vez.') };
  const d = DEF[inst.id];
  const pos = compassoPos(st, side);
  if (d.exigeCompasso && d.exigeCompasso !== pos && !hasRegente(st, side)) return { ok: false, reason: T`Só pode ser a ${d.exigeCompasso}ª carta do Compasso (agora é a ${pos}ª).` };
  if (d.playable && !d.playable(st, side)) return { ok: false, reason: T('Vida baixa demais para isso.') };
  const cost = getCost(st, side, inst);
  const canMana = sd.mana >= cost;
  const canLife = !!d.sangria && sd.leader.hp > d.sangria;
  if (!canMana && !canLife) return { ok: false, reason: T('Mana insuficiente.') };
  if (['unit', 'structure', 'ritual'].includes(d.type)) {
    const n = boardCount(st, side) + (d.atraso ? sd.delayed.length : 0);
    if (n >= BOARD_MAX) return { ok: false, reason: T('Campo cheio.') };
  }
  if (d.type === 'trap' && sd.traps.length >= TRAP_MAX) return { ok: false, reason: T('Limite de 3 Armadilhas.') };
  const spec = d.target ? d.target(st, side) : null;
  const targets = spec ? validTargets(st, side, spec, d.type === 'spell') : [];
  if (spec && d.targetRequired && !targets.length) return { ok: false, reason: T('Sem alvo válido.') };
  const canAdiantar = !!d.adiantar && sd.mana >= cost + d.adiantar;
  return { ok: true, cost, canMana, canLife, canAdiantar, spec, targets, pos };
}
function playCard(st, side, idx, opts) {
  opts = opts || {};
  const chk = canPlay(st, side, idx); if (!chk.ok) return chk;
  const sd = S(st, side); const inst = sd.hand[idx]; const d = DEF[inst.id];
  let target = opts.target || null;
  if (chk.spec && chk.targets.length) {
    if (!target || !chk.targets.some(r => sameRef(r, target))) return { ok: false, reason: T('Escolha um alvo.') };
  } else target = null;
  let payLife = !!opts.payLife && chk.canLife;
  if (!chk.canMana) payLife = true;
  const adiantar = !!opts.adiantar && chk.canAdiantar && !payLife;
  const tgtOut = refOut(st, target);
  sd.hand.splice(idx, 1);
  if (payLife) loseLife(st, { t: 'l', side }, d.sangria); else sd.mana -= chk.cost + (adiantar ? d.adiantar : 0);
  const pos = compassoPos(st, side); sd.cardsPlayedThisTurn++;
  log(st, T`${sd.leader.short} joga ${d.name}${payLife ? ` ${T`pagando ${d.sangria} de vida`}` : ''}${adiantar ? T(', Adiantada') : ''}.`);
  rec(st, { k: 'play', s: side, c: inst.id, u: inst.uid, cost: payLife ? 0 : chk.cost + (adiantar ? d.adiantar : 0), life: payLife ? d.sangria : 0, adi: adiantar ? 1 : 0, pos, tgt: tgtOut, mana: sd.mana, car: inst.cargas || 0 });
  const fev = { k: 'play', s: side, c: inst.id, u: inst.uid, e: null, tgt: target ? refCopy(target) : null }; fx(st, fev);
  const ctx = { target, pos, inst, ent: null };
  if (d.type === 'unit') {
    if (d.atraso) { sd.delayed.push(inst.id); log(st, T`${d.name} chega no próximo turno.`); }
    else {
      const e = summon(st, side, inst.id); ctx.ent = e; if (e) fev.e = e.uid;
      if (e && (adiantar || inst.acelerar)) e.kw.investida = true;
      if (e && side === 'E') triggerTrap(st, 'P', 'play', e);
      if (e && d.onPlay) d.onPlay(st, side, ctx);
    }
  } else if (d.type === 'structure' || d.type === 'ritual') {
    const e = summon(st, side, inst.id); ctx.ent = e; if (e) fev.e = e.uid;
    if (e && d.onPlay) d.onPlay(st, side, ctx);
  } else if (d.type === 'weapon') {
    sd.weapon = { id: d.id, name: d.name, atk: d.atk, dur: d.hp, letal: !!d.letal };
    if (d.onPlay) d.onPlay(st, side, ctx);
  } else if (d.type === 'trap') {
    sd.traps.push(inst.id);
  } else if (d.type === 'spell') {
    sd.spellsCastThisTurn++; sd.spellsTotal = (sd.spellsTotal || 0) + 1;
    if (d.module) { const e = ent(st, target); if (e) attachModule(st, e, inst.id); }
    else if (d.onPlay) d.onPlay(st, side, ctx);
    charge(st, side, 1);
    sd.lastSpell = inst.id;
    const os_ = S(st, opp(side)); if (os_.resposta) { os_.resposta -= 1; log(st, T('Resposta Ensaiada!')); dmg(st, { t: 'l', side }, 3, src(opp(side), {})); }
    sd.board.forEach(e => { if (!isDead(e) && DEF[e.id].onSpellCast) DEF[e.id].onSpellCast(st, e); });
  }
  if (sd.leader.hp <= 0) checkOver(st);
  resolveDeaths(st); checkOver(st);
  return { ok: true };
}
function attack(st, side, uid, ref) {
  if (st.over || st.pending || st.turnSide !== side) return false;
  const a = ent(st, { t: 'e', uid });
  if (!a || a.owner !== side || !canAttack(st, a)) return false;
  if (!attackTargets(st, side, a).some(r => sameRef(r, ref))) return false;
  a.attacked = true;
  fx(st, { k: 'atk', s: side, a: a.uid, tgt: refCopy(ref) });
  rec(st, { k: 'atk', s: side, a: uidOf(a), as: [getAtk(st, a), a.hp], tgt: refOut(st, ref), ts: statOf(st, ref), rev: hasKw(a, 'emboscada') ? 1 : 0 });
  if (side === 'E') triggerTrap(st, 'P', 'attack', a);
  if (isDead(a)) { resolveDeaths(st); return true; }
  const revealing = hasKw(a, 'emboscada');
  if (revealing) {
    a.kw.emboscada = false; a.tempKw.emboscada = false;
    reveal(st, a, ref && ref.t === 'e' ? ent(st, ref) : null);
    const tt = ref.t === 'e' ? ent(st, ref) : null;
    if (isDead(a) || (ref.t === 'e' && (!tt || isDead(tt)))) { resolveDeaths(st); checkOver(st); return true; }
  }
  a.modules.forEach(m => { if (DEF[m].onHostAttack) DEF[m].onHostAttack(st, a, ref); });
  if (ref.t === 'e') { const t0 = ent(st, ref); if (!t0 || isDead(t0)) { resolveDeaths(st); checkOver(st); return true; } }
  const aAtk = getAtk(st, a);
  const sc = src(side, { letal: hasKw(a, 'letal'), dreno: hasKw(a, 'dreno'), pierce: hasKw(a, 'perfurar') });
  if (ref.t === 'l') {
    log(st, T`${a.name} ataca ${S(st, ref.side).leader.name} (${aAtk}).`);
    dmg(st, ref, aAtk, sc);
  } else {
    const t = ent(st, ref);
    const tAtk = t.kind === 'unit' ? getAtk(st, t) : 0;
    const tsc = src(t.owner, { letal: hasKw(t, 'letal'), dreno: hasKw(t, 'dreno') });
    log(st, T`${a.name} ataca ${t.name}.`);
    dmg(st, ref, aAtk, sc);
    if (tAtk > 0) dmg(st, { t: 'e', uid: a.uid }, tAtk, tsc);
    if (revealing && t.kind === 'unit' && isDead(t)) sacrifice(st, a);
  }
  resolveDeaths(st); checkOver(st);
  return true;
}
function canHeroAttack(st, side) {
  const sd = S(st, side);
  return !!sd.weapon && !sd.heroAttacked && st.turnSide === side && !st.over && !st.pending;
}
function heroAttack(st, side, ref) {
  if (!canHeroAttack(st, side)) return false;
  if (!attackTargets(st, side, null).some(r => sameRef(r, ref))) return false;
  const sd = S(st, side); const w = sd.weapon;
  sd.heroAttacked = true;
  fx(st, { k: 'hero', s: side, tgt: refCopy(ref) });
  rec(st, { k: 'hero', s: side, w: w.id, wa: [w.atk, w.dur], tgt: refOut(st, ref), ts: statOf(st, ref) });
  if (DEF[w.id].onWeaponAttack) DEF[w.id].onWeaponAttack(st, side);
  const sc = src(side, { letal: w.letal, pierce: !!DEF[w.id].pierce });
  if (ref.t === 'l') { log(st, T`Você ataca ${S(st, ref.side).leader.name} com ${w.name} (${w.atk}).`); dmg(st, ref, w.atk, sc); }
  else {
    const t = ent(st, ref);
    const tAtk = t.kind === 'unit' ? getAtk(st, t) : 0;
    log(st, T`Você ataca ${t.name} com ${w.name}.`);
    dmg(st, ref, w.atk, sc);
    if (tAtk > 0) dmg(st, { t: 'l', side }, tAtk, src(t.owner, { dreno: hasKw(t, 'dreno') }));
  }
  w.dur -= 1;
  if (w.dur <= 0) { log(st, T`${w.name} se quebra.`); sd.weapon = null; }
  resolveDeaths(st); checkOver(st);
  return true;
}
function canResonate(st, side) {
  const sd = S(st, side);
  return sd.resonance.points > 0 && !sd.resonance.used && sd.turnCount >= 4 && st.turnSide === side && !st.over && !st.pending;
}
function resonate(st, side, uid) {
  if (!canResonate(st, side)) return false;
  const e = ent(st, { t: 'e', uid });
  if (!e || e.owner !== side || e.kind !== 'unit' || isDead(e)) return false;
  const sd = S(st, side);
  buff(e, 2, 2); e.resonated = true; e.rushThisTurn = true;
  fx(st, { k: 'evolve', s: side, u: e.uid, a: 2, h: 2 });
  sd.resonance.points -= 1; sd.resonance.used = true;
  log(st, T`${e.name} evolui: +2/+2.`);
  rec(st, { k: 'res', s: side, u: uidOf(e) });
  const d = DEF[e.id]; if (d.onResonate) d.onResonate(st, e);
  if (side === 'E' && st.enc.onEnemyResonate) st.enc.onEnemyResonate(st, e);
  resolveDeaths(st); checkOver(st);
  return true;
}
function startTurn(st, side) {
  st.turnSide = side;
  const sd = S(st, side);
  sd.turnCount += 1;
  sd.maxMana = Math.min(10, sd.maxMana + 1); sd.mana = sd.maxMana;
  sd.cardsPlayedThisTurn = 0; sd.spellsCastThisTurn = 0; sd.ecoReturnedThisTurn = false;
  sd.resonance.used = false; sd.heroAttacked = false;
  sd.board.forEach(e => { e.attacked = false; });
  log(st, T`Turno ${sd.turnCount}: ${sd.leader.name}.`);
  fx(st, { k: 'turn', s: side, n: sd.turnCount });
  sd.delayed.splice(0).forEach(id => {
    const e = summon(st, side, id);
    if (e) { log(st, T`${e.name} aparece.`); if (DEF[id].onAppear) DEF[id].onAppear(st, e); }
  });
  const est = sd.board.some(x => x.id === 'estandarte' && !isDead(x));
  sd.ecoReturns.splice(0).forEach(id => {
    const e = summon(st, side, id);
    if (e) { e.kw.eco = false; e.ecoUsed = true; const v = est ? 2 : 1; e.hp = v; e.maxHp = v; sd.ecoReturnedThisTurn = true; log(st, T`${e.name} volta por Eco.`); }
  });
  if (sd.strikes && sd.strikes.length) { sd.strikes.splice(0).forEach(n => { const t = randomEnemyRef(st, side); if (t) { dmg(st, t, n, src(side, { spell: true })); log(st, T`O golpe que vinha chega: ${n} de dano.`); } }); }
  sd.board.slice().forEach(e => { if (!isDead(e) && !e.silenced && DEF[e.id].brotar) brotar(st, e); });
  sd.board.slice().forEach(e => { if (e.kind === 'unit' && !isDead(e) && hasKw(e, 'superaquecer')) { e.atk += 1; loseLife(st, { t: 'e', uid: e.uid }, 1); log(st, T`${e.name} superaquece: +1 de Ataque, -1 de Vida.`); } });
  sd.board.slice().forEach(e => { if (e.kind === 'ritual' && !e.removed) tickRitual(st, e, 1); });
  sd.board.slice().forEach(e => { if (!isDead(e) && !e.silenced && DEF[e.id].onStartTurn) DEF[e.id].onStartTurn(st, e); });
  if (sd.boomerang) { const n = sd.boomerang; sd.boomerang = 0; if (aliveUnits(st, side).some(x => x.tags.includes('Felino'))) for (let i = 0; i < n; i++) { addToHand(st, side, 'bumerangue'); log(st, T('O Bumerangue volta.')); } }
  if (side === 'E' && st.enc.onStartTurn) st.enc.onStartTurn(st);
  draw(st, side, 1);
  resolveDeaths(st); checkOver(st);
  snap(st, side);
}
function endTurn(st) {
  if (st.over || st.pending) return false;
  const side = st.turnSide; const sd = S(st, side);
  rec(st, { k: 'endturn', s: side, n: sd.turnCount, manaLeft: sd.mana, hand: sd.hand.length });
  sd.board.slice().forEach(e => { if (!isDead(e) && !e.silenced && DEF[e.id].onEndTurn) DEF[e.id].onEndTurn(st, e); });
  sd.hand.slice().forEach(i => { const dd = DEF[i.id]; if (dd.onEndTurnInHand) dd.onEndTurnInHand(st, side, i); if (i.chantagem) { i.costMod -= i.chantagem; i.chantagem = 0; } });
  if (side === 'E' && st.enc.onEndTurn) st.enc.onEndTurn(st);
  resolveDeaths(st); if (checkOver(st)) return true;
  sd.board.forEach(e => { e.tempAtk = 0; e.tempKw = {}; e.rushThisTurn = false; if (e.imovel > 0) e.imovel -= 1; });
  startTurn(st, opp(side));
  return true;
}

function newGame(discId, encId, seed, opts) {
  opts = opts || {};
  const enc = ENC[encId];
  const seed0 = seed || (Date.now() & 0x7fffffff);
  const st = { rng: mulberry32(seed0), seed: seed0, t0: Date.now(), events: [], nextUid: 1, log: [], over: null, pending: null, turnSide: 'P', disc: discId, encId, enc, phase2: false, gazeCount: 1, sides: {} };
  const mk = (side, name, short, hp) => ({ side, leader: { name, short, hp, maxHp: hp }, mana: 0, maxMana: 0, deck: [], hand: [], board: [], traps: [], delayed: [], ecoReturns: [], cardsPlayedThisTurn: 0, spellsCastThisTurn: 0, ecoReturnedThisTurn: false, resonance: { points: 0, used: false }, weapon: null, heroAttacked: false, turnCount: 0, fatigue: 0 });
  st.sides.P = mk('P', T('Você'), T('Você'), 30); st.sides.P.resonance.points = 3;
  if (opts.hp) st.sides.P.leader.hp = Math.min(30, opts.hp);
  if (opts.extraMana) st.sides.P.maxMana = opts.extraMana;
  st.bosses = opts.bosses || 0; st.social = !!enc.social;
  st.sides.E = mk('E', enc.leader, enc.leader, enc.hp + (opts.encBonus || 0)); st.sides.E.resonance.points = enc.resonance || 0;
  const pd = [];
  if (opts.deck) opts.deck.forEach(id => pd.push(id));
  else {
    DISC[discId].cards.forEach(id => { pd.push(id, id); });
    Object.entries(NEUTRAL_STARTER).forEach(([id, n]) => { for (let i = 0; i < n; i++) pd.push(id); });
  }
  st.sides.P.deck = shuffle(st, pd.map(id => newInst(st, id)));
  const ed = [];
  Object.entries(enc.deck).forEach(([id, n]) => { for (let i = 0; i < n; i++) ed.push(id); });
  st.sides.E.deck = shuffle(st, ed.map(id => newInst(st, id)));
  rec(st, { k: 'start', disc: discId, enc: encId, seed: seed0, deck: st.sides.P.deck.map(i => i.id), edeck: st.sides.E.deck.map(i => i.id) });
  draw(st, 'P', 3 + (opts.extraHand || 0)); draw(st, 'E', enc.hand);
  rec(st, { k: 'hand0', hand: st.sides.P.hand.map(i => i.id) });
  st.usesCompasso = st.sides.P.deck.concat(st.sides.P.hand).some(i => DEF[i.id].compasso || DEF[i.id].exigeCompasso);
  st.handSize = 3 + (opts.extraHand || 0); st.mulligans = 0; st.pending = { kind: 'mulligan' };
  if (enc.extraMana) st.sides.E.maxMana = enc.extraMana;
  st.firstMana = opts.firstMana || 0;
  if (enc.onStart) enc.onStart(st);
  log(st, T`${enc.name}. Regra: ${enc.rule}`);
  return st;
}
function nextMulliganSize(st) { return Math.max(0, st.handSize - st.mulligans); }
function mulligan(st) {
  if (!st.pending || st.pending.kind !== 'mulligan') return false;
  const sd = S(st, 'P');
  if (!sd.hand.length) return false;
  const size = nextMulliganSize(st);
  st.mulligans += 1;
  fx(st, { k: 'mull', n: st.mulligans });
  sd.deck.push(...sd.hand.splice(0)); shuffle(st, sd.deck);
  draw(st, 'P', size);
  log(st, T`Mulligan ${st.mulligans}: nova mão com ${size} carta${size === 1 ? '' : 's'}.`);
  rec(st, { k: 'mull', n: st.mulligans, size, hand: sd.hand.map(i => i.id) });
  return true;
}
function keepHand(st) {
  if (!st.pending || st.pending.kind !== 'mulligan') return false;
  st.pending = null;
  rec(st, { k: 'keep', mulls: st.mulligans, hand: S(st, 'P').hand.map(i => i.id) });
  startTurn(st, 'P');
  if (st.firstMana) { S(st, 'P').mana += st.firstMana; log(st, T`+${st.firstMana} de mana neste primeiro turno.`); }
  return true;
}

/* ---------------- IA inimiga ---------------- */
function aiPlan(st, inst, chk) {
  const d = DEF[inst.id];
  const pUnits = aliveUnits(st, 'P');
  const byAtk = refs => refs.map(r => ent(st, r)).filter(Boolean).sort((a, b) => getAtk(st, b) - getAtk(st, a));
  switch (d.id) {
    case 'esporos': return (pUnits.some(e => e.hp <= 1) || pUnits.length >= 2) ? {} : null;
    case 'cauda': return (pUnits.some(e => e.hp <= 2) || pUnits.length >= 2) ? {} : null;
    case 'enxame': return boardCount(st, 'E') <= 4 ? {} : null;
    case 'mordida_inf': {
      if (!chk.targets.length) return null;
      const es = byAtk(chk.targets); const kill = es.find(e => e.hp <= 3 && !hasKw(e, 'escudo'));
      return { target: { t: 'e', uid: (kill || es[0]).uid } };
    }
    case 'mordida_pet': {
      if (!chk.targets.length) return null;
      return { target: { t: 'e', uid: byAtk(chk.targets)[0].uid } };
    }
  }
  if (chk.spec && chk.targets.length) { const es = byAtk(chk.targets); if (es.length) return { target: { t: 'e', uid: es[0].uid } }; }
  return {};
}
function aiAttackTarget(st, a) {
  const refs = attackTargets(st, 'E', a); if (!refs.length) return null;
  const P = S(st, 'P'); const aAtk = getAtk(st, a); const letal = hasKw(a, 'letal');
  const ents = refs.filter(r => r.t === 'e').map(r => ent(st, r)).filter(Boolean);
  const face = refs.find(r => r.t === 'l');
  const guardForced = !face && ents.some(t => hasKw(t, 'guarda'));
  const potential = S(st, 'E').board.filter(e => canAttack(st, e) && canHitFace(st, e)).reduce((s, e) => s + getAtk(st, e), 0);
  if (face && potential >= P.leader.hp) return face;
  const kills = t => t.kind === 'structure' ? aAtk >= t.hp : ((letal || aAtk >= t.hp) && !hasKw(t, 'escudo'));
  const survives = t => t.kind === 'structure' || getAtk(st, t) < a.hp;
  const val = t => t.kind === 'structure' ? 6 : getAtk(st, t) * 2 + t.hp;
  let best = null, bv = -1;
  ents.forEach(t => { if (kills(t) && survives(t)) { const v = val(t); if (v > bv) { bv = v; best = t; } } });
  if (best) return { t: 'e', uid: best.uid };
  const myVal = aAtk * 2 + a.hp;
  ents.forEach(t => { if (t.kind === 'unit' && kills(t) && val(t) > myVal) { const v = val(t); if (v > bv) { bv = v; best = t; } } });
  if (best) return { t: 'e', uid: best.uid };
  if (face) return face;
  if (guardForced) { ents.sort((x, y) => x.hp - y.hp); return { t: 'e', uid: ents[0].uid }; }
  return null;
}
function enemyStep(st) {
  if (st.over || st.turnSide !== 'E') return null;
  const sd = S(st, 'E');
  if (canResonate(st, 'E')) {
    const us = aliveUnits(st, 'E');
    if (us.length) {
      const best = us.find(e => e.id === 'filhote_bas') || us.slice().sort((a, b) => getAtk(st, b) - getAtk(st, a))[0];
      if (resonate(st, 'E', best.uid)) return 'resonate';
    }
  }
  const order = sd.hand.map((inst, i) => ({ inst, i })).filter(x => !DEF[x.inst.id].junk)
    .sort((a, b) => getCost(st, 'E', b.inst) - getCost(st, 'E', a.inst));
  for (const { inst, i } of order) {
    const chk = canPlay(st, 'E', i); if (!chk.ok || !chk.canMana) continue;
    const plan = aiPlan(st, inst, chk); if (!plan) continue;
    const r = playCard(st, 'E', i, { target: plan.target }); if (r.ok) return 'play';
  }
  const attackers = sd.board.filter(e => canAttack(st, e)).sort((a, b) => getAtk(st, b) - getAtk(st, a));
  for (const a of attackers) {
    const t = aiAttackTarget(st, a);
    if (t && attack(st, 'E', a.uid, t)) return 'attack';
    a.attacked = true;
  }
  return null;
}

/* ================= Social: mesmo motor, outro vocabulário =================
   Argumento = unidade (Peso/Firmeza), Tática = feitiço, Lábia = mana,
   Compostura = sua vida, Resistência = vida do interlocutor,
   Abertura = Ao Entrar, Repercussão = Ao Morrer, Ponto Sensível = Guarda,
   Álibi = Escudo, Ênfase = Evolução. Perfil = traço do interlocutor. */
function perfil(st, p) { return !!(st.enc && st.enc.perfil === p); }
function hitR(st, s, n) { dmg(st, { t: 'l', side: opp(s) }, n, src(s, { spell: true })); }
function silence(st, e) { if (!e) return; e.silenced = true; e.kw = {}; e.tempKw = {}; log(st, T`${e.name} perde todo o texto.`); }
const sd_ = (id, o) => def(id, Object.assign({ social: true }, o));
// Neutras sociais
sd_('s_felix', { name: T('Felix Ronronando'), cost: 1, type: 'unit', atk: 1, hp: 1, tags: ['Felino'], disc: 'neutra', text: T('Felino. Abertura: compre 1 carta.'), onPlay(st, s) { draw(st, s, 1); } });
sd_('s_elogio', { name: T('Elogio Calculado'), cost: 1, type: 'spell', disc: 'neutra', text: T('Cause 2 de dano à Resistência. Perfil Vaidade: cause 4 em vez disso.'), onPlay(st, s) { hitR(st, s, perfil(st, 'Vaidade') ? 4 : 2); } });
sd_('s_respirar', { name: T('Respirar Fundo'), cost: 1, type: 'spell', disc: 'neutra', text: T('Recupere 3 de Compostura.'), onPlay(st, s) { heal(st, s, 3); } });
sd_('s_solido', { name: T('Argumento Sólido'), cost: 2, type: 'unit', atk: 2, hp: 3, disc: 'neutra', text: '' });
sd_('s_colo', { name: T('Gato de Colo'), cost: 2, type: 'unit', atk: 1, hp: 3, kw: ['guarda'], tags: ['Felino'], disc: 'neutra', text: T('Felino. Ponto Sensível. Abertura: recupere 2 de Compostura.'), onPlay(st, s) { heal(st, s, 2); } });
sd_('s_contra', { name: T('Contraproposta'), cost: 2, type: 'spell', disc: 'neutra', target: () => 'enemyUnitAtk2', targetRequired: true, text: T('Destrua um Argumento inimigo com 2 ou menos de Peso.'), onPlay(st, s, c) { const e = ent(st, c.target); if (e) e.destroyed = true; } });
sd_('s_ponto', { name: T('Ponto Bem Colocado'), cost: 3, type: 'spell', disc: 'neutra', target: () => 'anyEnemy', targetRequired: true, text: T('Cause 3 de dano à Resistência ou a um Argumento.'), onPlay(st, s, c) { dmg(st, c.target, 3, src(s, { spell: true })); } });
sd_('s_fofoca', { name: T('Fofoca de Taverna'), cost: 2, type: 'spell', disc: 'neutra', text: T('Compre 2 cartas. O interlocutor compra 1.'), onPlay(st, s) { draw(st, s, 2); draw(st, opp(s), 1); } });
sd_('s_trofeu', { name: T('Troféu das Profundezas'), cost: 2, type: 'spell', disc: 'neutra', text: T('Cause 2 de dano à Resistência, +1 para cada chefe derrotado na campanha.'), onPlay(st, s) { hitR(st, s, 2 + (st.bosses || 0)); } });
sd_('s_escama', { name: T('Escama de Basilisco'), cost: 2, type: 'spell', disc: 'neutra', text: T('Cause 3 de dano à Resistência. Perfil Respeito: cause 6 em vez disso.'), onPlay(st, s) { hitR(st, s, perfil(st, 'Respeito') ? 6 : 3); } });
sd_('s_testemunha', { name: T('Testemunha da Guilda'), cost: 3, type: 'unit', atk: 2, hp: 4, disc: 'neutra', text: T('Repercussão: recupere 3 de Compostura.'), onDeath(st, e) { heal(st, e.owner, 3); } });
sd_('s_selo', { name: T('Selo Oficial'), cost: 4, type: 'unit', atk: 3, hp: 5, kw: ['guarda'], disc: 'neutra', text: T('Ponto Sensível. Abertura: se o Perfil for Procedimento, cause 3 de dano à Resistência.'), onPlay(st, s) { if (perfil(st, 'Procedimento')) hitR(st, s, 3); } });
// Educação e bom senso (vêm da Lerael)
sd_('s_por_favor', { name: T('Por Favor e Obrigado'), cost: 1, type: 'spell', disc: 'neutra', text: T('Recupere 2 de Compostura e cause 1 de dano à Resistência. Perfil Vaidade ou Princípios: cause 3 em vez disso.'), onPlay(st, s) { heal(st, s, 2); hitR(st, s, perfil(st, 'Vaidade') || perfil(st, 'Princípios') ? 3 : 1); } });
sd_('s_bom_senso', { name: T('Bom Senso'), cost: 2, type: 'spell', disc: 'neutra', text: T('Compre 1 carta. Se o interlocutor tiver mais Argumentos que você, compre 2 em vez disso.'), onPlay(st, s) { draw(st, s, aliveUnits(st, opp(s)).length > aliveUnits(st, s).length ? 2 : 1); } });
// Temporal Warfare
sd_('s_fala', { name: T('Fala Antecipada'), cost: 1, type: 'spell', disc: 'temporal', text: T('Olhe a carta do topo do deck do interlocutor; se for uma Tática, ela vai para o fundo. Compre 1 carta.'), onPlay(st, s) { const dk = S(st, opp(s)).deck; if (dk.length) { const d0 = DEF[dk[0].id]; if (d0.type === 'spell') { dk.push(dk.shift()); log(st, T`Você antecipa ${d0.name} e a manda para o fundo.`); } else log(st, T`A próxima carta do interlocutor é ${d0.name}.`); } draw(st, s, 1); } });
sd_('s_resposta', { name: T('Resposta Ensaiada'), cost: 1, type: 'spell', disc: 'temporal', text: T('Na próxima vez que o interlocutor usar uma Tática, cause 3 de dano à Resistência dele.'), onPlay(st, s) { S(st, s).resposta = (S(st, s).resposta || 0) + 1; } });
sd_('s_olhar', { name: T('Olhar de Campo de Batalha'), cost: 2, type: 'spell', disc: 'temporal', text: T('Cause 2 de dano à Resistência. Perfil Respeito: cause 4 em vez disso.'), onPlay(st, s) { hitR(st, s, perfil(st, 'Respeito') ? 4 : 2); } });
sd_('s_precedente', { name: T('Precedente Histórico'), cost: 2, type: 'unit', atk: 2, hp: 3, kw: ['eco'], disc: 'temporal', text: T('Eco. Abertura: se o Perfil for Procedimento, ganha +1/+1.'), onPlay(st, s, c) { if (perfil(st, 'Procedimento') && c.ent) buff(c.ent, 1, 1); } });
sd_('s_veterano', { name: T('Veterano de Mil Guerras'), cost: 3, type: 'unit', atk: 3, hp: 2, disc: 'temporal', text: T('Abertura: cause 1 de dano a cada Argumento inimigo com 2 ou menos de Firmeza. Ao Enfatizar: repete a Abertura.'), onPlay(st, s) { aliveUnits(st, opp(s)).filter(e => e.hp <= 2).forEach(e => dmg(st, { t: 'e', uid: e.uid }, 1, src(s, {}))); }, onResonate(st, e) { aliveUnits(st, opp(e.owner)).filter(x => x.hp <= 2).forEach(x => dmg(st, { t: 'e', uid: x.uid }, 1, src(e.owner, {}))); } });
sd_('s_lembranca', { name: T('Lembrança Inconveniente'), cost: 3, type: 'spell', disc: 'temporal', target: () => 'enemyUnitAtk3', targetRequired: true, text: T('Destrua um Argumento inimigo com 3 ou menos de Peso.'), onPlay(st, s, c) { const e = ent(st, c.target); if (e) e.destroyed = true; } });
sd_('s_testemunha_epoca', { name: T('Testemunha de Outra Época'), cost: 4, type: 'unit', atk: 3, hp: 4, atraso: true, disc: 'temporal', text: T('Atraso. Quando aparecer, cause 3 de dano à Resistência.'), onAppear(st, e) { hitR(st, e.owner, 3); } });
sd_('s_ultimato', { name: T('Ultimato'), cost: 5, type: 'spell', disc: 'temporal', text: T('Seus Argumentos ganham +2 de Peso neste turno.'), onPlay(st, s) { aliveUnits(st, s).forEach(e => { e.tempAtk += 2; }); } });
// Draconic Primalism
sd_('s_calma', { name: T('Calma Ancestral'), cost: 1, type: 'spell', disc: 'draconic', text: T('Ganhe 1 Cristal (Lábia).'), onPlay(st, s) { cristal(st, s); } });
sd_('s_paciencia', { name: T('Paciência de Dragão'), cost: 2, type: 'spell', disc: 'draconic', text: T('Recupere 4 de Compostura. Despertar: recupere 8 em vez disso.'), onPlay(st, s) { heal(st, s, despertar(st, s) ? 8 : 4); } });
sd_('s_olhar_inab', { name: T('Olhar Inabalável'), cost: 2, type: 'unit', atk: 1, hp: 5, kw: ['guarda'], disc: 'draconic', text: T('Ponto Sensível.') });
sd_('s_bufada', { name: T('Bufada de Desdém'), cost: 3, type: 'spell', disc: 'draconic', target: (st, s) => despertar(st, s) ? null : 'enemyUnit', targetRequired: true, text: T('Cause 3 de dano a um Argumento inimigo. Despertar: a todos os Argumentos inimigos.'), onPlay(st, s, c) { if (despertar(st, s)) aoeUnits(st, s, 3, src(s, { spell: true })); else dmg(st, c.target, 3, src(s, { spell: true })); } });
sd_('s_forca', { name: T('Força Bruta'), cost: 4, type: 'spell', disc: 'draconic', text: T('Cause 4 de dano à Resistência. Perfil Respeito: cause 6 em vez disso.'), onPlay(st, s) { hitR(st, s, perfil(st, 'Respeito') ? 6 : 4); } });
sd_('s_presenca', { name: T('Presença Colossal'), cost: 6, type: 'unit', atk: 5, hp: 7, kw: ['guarda'], disc: 'draconic', text: T('Ponto Sensível. Abertura: Argumentos inimigos com 3 ou menos de Peso ficam Imóveis.'), onPlay(st, s) { aliveUnits(st, opp(s)).filter(e => getAtk(st, e) <= 3).forEach(e => setImovel(st, e)); } });
sd_('s_tesouro', { name: T('Tesouro do Ninho'), cost: 3, type: 'spell', disc: 'draconic', text: T('Cause 2 de dano à Resistência. Perfil Ganância: cause 6 em vez disso.'), onPlay(st, s) { hitR(st, s, perfil(st, 'Ganância') ? 6 : 2); } });
sd_('s_voz_anciao', { name: T('Voz do Ancião'), cost: 8, type: 'unit', atk: 7, hp: 7, disc: 'draconic', text: T('Abertura: cause 5 de dano à Resistência.'), onPlay(st, s) { hitR(st, s, 5); } });
// Necrodance
sd_('s_desabafo', { name: T('Desabafo Mórbido'), cost: 0, type: 'spell', disc: 'necro', text: T('Perca 2 de Compostura. Ganhe 1 de Lábia neste turno.'), onPlay(st, s) { loseLife(st, { t: 'l', side: s }, 2); S(st, s).mana += 1; } });
sd_('s_piada', { name: T('Piada de Velório'), cost: 1, type: 'spell', disc: 'necro', text: T('Cause 2 de dano à Resistência. Perfil Princípios: cause 2 de dano à sua Compostura em vez disso.'), onPlay(st, s) { if (perfil(st, 'Princípios')) { loseLife(st, { t: 'l', side: s }, 2); log(st, T('A piada pegou mal.')); } else hitR(st, s, 2); } });
sd_('s_charme', { name: T('Charme Fúnebre'), cost: 2, type: 'unit', atk: 2, hp: 2, compasso: [2], disc: 'necro', text: T('Compasso 2: ganha Álibi.'), onPlay(st, s, c) { if (c.ent && onBeat(st, s, c, 2)) c.ent.kw.escudo = true; } });
sd_('s_elogio_postumo', { name: T('Elogio Póstumo'), cost: 2, type: 'spell', disc: 'necro', exigeCompasso: 3, text: T('Exige Compasso 3. Cause 5 de dano à Resistência.'), onPlay(st, s) { hitR(st, s, 5); } });
sd_('s_boato', { name: T('Boato Assombrado'), cost: 3, type: 'unit', atk: 2, hp: 3, disc: 'necro', text: T('Repercussão: embaralhe 2 Rumores no deck do interlocutor.'), onDeath(st, e) { shuffleInto(st, opp(e.owner), 's_rumor'); shuffleInto(st, opp(e.owner), 's_rumor'); log(st, T('2 Rumores correm pela cidade.')); } });
sd_('s_testamento', { name: T('Testamento Revelado'), cost: 3, type: 'spell', sangria: 3, disc: 'necro', target: () => 'enemyUnit', targetRequired: true, text: T('Sangria 3. Destrua um Argumento inimigo.'), onPlay(st, s, c) { const e = ent(st, c.target); if (e) e.destroyed = true; } });
sd_('s_marcha', { name: T('Marcha Fúnebre'), cost: 4, type: 'spell', compasso: [1, 3], disc: 'necro', text: T('Cause 1 de dano à Resistência para cada Argumento aliado destruído nesta negociação. Compasso 1 ou 3: em dobro.'), onPlay(st, s, c) { const n = (S(st, s).deadUnits || []).length * ((onBeat(st, s, c, 1) || onBeat(st, s, c, 3)) ? 2 : 1); if (n) hitR(st, s, n); } });
sd_('s_coral', { name: T('Coral de Carpideiras'), cost: 5, type: 'unit', atk: 3, hp: 5, compasso: [3], disc: 'necro', text: T('Abertura: se for Compasso 3, cause 3 de dano à Resistência.'), onPlay(st, s, c) { if (onBeat(st, s, c, 3)) hitR(st, s, 3); } });
sd_('s_rumor', { name: T('Rumor'), cost: 1, type: 'spell', token: true, junk: true, text: T('Não faz nada. Se estiver na mão do interlocutor no fim do turno dele, cause 1 de dano à Resistência dele.'), onEndTurnInHand(st, s) { if (s === 'E') { loseLife(st, { t: 'l', side: s }, 1); log(st, T('Um Rumor incomoda o interlocutor.')); } } });
// Holy Shadowmancy
sd_('s_bencao', { name: T('Bênção Calculada'), cost: 1, type: 'spell', disc: 'holy', text: T('Recupere 3 de Compostura. Perfil Princípios: também cause 2 de dano à Resistência.'), onPlay(st, s) { heal(st, s, 3); if (perfil(st, 'Princípios')) hitR(st, s, 2); } });
sd_('s_informante', { name: T('Informante das Sombras'), cost: 2, type: 'unit', atk: 1, hp: 3, kw: ['emboscada'], disc: 'holy', text: T('Emboscada. Abertura: a carta mais cara na mão do interlocutor custa 2 a mais no próximo turno dele (chantagem).'), onPlay(st, s) { const h = S(st, opp(s)).hand.filter(i => !DEF[i.id].junk); if (!h.length) return; h.sort((a, b) => DEF[b.id].cost - DEF[a.id].cost); h[0].costMod = (h[0].costMod || 0) + 2; h[0].chantagem = (h[0].chantagem || 0) + 2; log(st, T`Chantagem: ${DEF[h[0].id].name} fica mais cara.`); } });
sd_('s_segredo', { name: T('Segredo Sussurrado'), cost: 2, type: 'spell', disc: 'holy', text: T('Cause 3 de dano à Resistência. Se você controlar um Argumento com Emboscada, cause 5 em vez disso.'), onPlay(st, s) { hitR(st, s, hasEmboscada(st, s) ? 5 : 3); } });
sd_('s_vigilia_oracao', { name: T('Vigília de Oração'), cost: 2, type: 'ritual', countdown: 3, disc: 'holy', text: T('Ritual 3. Ao ativar: cause 6 de dano à Resistência.'), ritualEffect(st, e) { hitR(st, e.owner, 6); } });
sd_('s_testemunha_enc', { name: T('Testemunha Encapuzada'), cost: 3, type: 'unit', atk: 2, hp: 4, kw: ['guarda'], disc: 'holy', text: T('Ponto Sensível. Repercussão: compre 1 carta.'), onDeath(st, e) { draw(st, e.owner, 1); } });
sd_('s_sermao', { name: T('Sermão Inflamado'), cost: 4, type: 'spell', disc: 'holy', text: T('Cause 4 de dano à Resistência. Perfil Princípios: cause 8 em vez disso.'), onPlay(st, s) { hitR(st, s, perfil(st, 'Princípios') ? 8 : 4); } });
sd_('s_dossie', { name: T('Dossiê Completo'), cost: 5, type: 'spell', disc: 'holy', text: T('Destrua todos os Argumentos inimigos com 3 ou menos de Firmeza.'), onPlay(st, s) { aliveUnits(st, opp(s)).filter(e => e.hp <= 3).forEach(e => { e.destroyed = true; }); } });
sd_('s_voz_fe', { name: T('Voz da Fé'), cost: 6, type: 'unit', atk: 4, hp: 6, kw: ['escudo'], disc: 'holy', text: T('Álibi. Abertura: reduza em 2 a contagem de todos os seus Rituais.'), onPlay(st, s) { S(st, s).board.slice().forEach(e => { if (e.kind === 'ritual' && !e.removed) tickRitual(st, e, 2); }); } });
// Magitech
sd_('s_amostra', { name: T('Amostra Grátis'), cost: 1, type: 'spell', disc: 'tech', text: T('Recupere 2 de Compostura. Perfil Ganância: também cause 3 de dano à Resistência.'), onPlay(st, s) { heal(st, s, 2); if (perfil(st, 'Ganância')) hitR(st, s, 3); } });
sd_('s_demonstracao', { name: T('Demonstração Impressionante'), cost: 2, type: 'spell', disc: 'tech', text: T('Cause 3 de dano à Resistência. Perfil Ganância: compre 1 carta.'), onPlay(st, s) { hitR(st, s, 3); if (perfil(st, 'Ganância')) draw(st, s, 1); } });
sd_('s_clausula', { name: T('Cláusula Escondida'), cost: 2, type: 'trap', disc: 'tech', text: T('Armadilha. Quando um Argumento inimigo com 2 ou menos de Peso atacar, destrua-o.') });
sd_('s_adendo', { name: T('Adendo Técnico'), cost: 2, type: 'spell', module: true, disc: 'tech', target: () => 'friendlyUnit', targetRequired: true, text: T('Módulo. Acople a um Argumento aliado: +1/+2.'), attach(e) { buff(e, 1, 2); } });
sd_('s_contrato', { name: T('Contrato Blindado'), cost: 3, type: 'unit', atk: 1, hp: 5, kw: ['guarda', 'escudo'], disc: 'tech', text: T('Ponto Sensível. Álibi.') });
sd_('s_prototipo', { name: T('Protótipo Falante'), cost: 3, type: 'unit', atk: 2, hp: 3, disc: 'tech', text: T('Abertura: crie uma Amostra Grátis na sua mão.'), onPlay(st, s) { addToHand(st, s, 's_amostra'); } });
sd_('s_patente', { name: T('Patente Registrada'), cost: 4, type: 'structure', hp: 4, disc: 'tech', text: T('No fim do seu turno, cause 1 de dano à Resistência. Perfil Procedimento: cause 2 em vez disso.'), onEndTurn(st, e) { hitR(st, e.owner, perfil(st, 'Procedimento') ? 2 : 1); } });
sd_('s_exposicao', { name: T('Exposição Grandiosa'), cost: 5, type: 'spell', disc: 'tech', text: T('Cause 2 de dano à Resistência para cada Argumento e Estrutura que você controla.'), onPlay(st, s) { const n = S(st, s).board.filter(e => !isDead(e) && (e.kind === 'unit' || e.kind === 'structure')).length; if (n) hitR(st, s, 2 * n); } });
// Space Wizardry
sd_('s_jargao', { name: T('Jargão Celeste'), cost: 1, type: 'spell', disc: 'space', target: () => 'enemyUnit', targetRequired: true, text: T('Um Argumento inimigo perde todo o texto.'), onPlay(st, s, c) { silence(st, ent(st, c.target)); } });
sd_('s_citacao', { name: T('Citação Obscura'), cost: 1, type: 'spell', disc: 'space', text: T('Cause 2 de dano à Resistência. Perfil Procedimento: cause 4 em vez disso.'), onPlay(st, s) { hitR(st, s, perfil(st, 'Procedimento') ? 4 : 2); } });
sd_('s_aura', { name: T('Aura de Mistério'), cost: 2, type: 'unit', atk: 1, hp: 4, kw: ['escudo'], disc: 'space', text: T('Álibi.') });
sd_('s_profecia', { name: T('Profecia Vaga'), cost: 2, type: 'spell', orbita: true, disc: 'space', text: T('Órbita. Cause 2 de dano à Resistência, +1 por Carga.'), onPlay(st, s, c) { hitR(st, s, 2 + (c.inst.cargas || 0)); } });
sd_('s_diagrama', { name: T('Diagrama Incompreensível'), cost: 3, type: 'unit', atk: 2, hp: 3, kw: ['guarda'], disc: 'space', text: T('Ponto Sensível. Abertura: dê 1 Carga a cada carta com Órbita na sua mão.'), onPlay(st, s) { charge(st, s, 1); } });
sd_('s_oraculo', { name: T('Ar de Oráculo'), cost: 4, type: 'unit', atk: 2, hp: 4, disc: 'space', text: T('Abertura: cause 1 de dano à Resistência para cada Tática que você usou nesta negociação.'), onPlay(st, s) { const n = S(st, s).spellsTotal || 0; if (n) hitR(st, s, n); } });
sd_('s_silencio', { name: T('Silêncio Estelar'), cost: 3, type: 'spell', disc: 'space', text: T('Todos os Argumentos inimigos perdem o texto.'), onPlay(st, s) { aliveUnits(st, opp(s)).forEach(e => silence(st, e)); } });
sd_('s_revelacao', { name: T('Revelação Cósmica'), cost: 6, type: 'spell', orbita: true, orbitaCost: true, disc: 'space', text: T('Órbita. Custa 1 a menos por Carga. Cause 6 de dano à Resistência.'), onPlay(st, s) { hitR(st, s, 6); } });
// Interlocutor do tutorial: cliente que reclama do pelo de gato
sd_('e_reclamacao', { name: T('Reclamação Insistente'), cost: 1, type: 'unit', atk: 1, hp: 2, text: '' });
sd_('e_pelo', { name: T('Pelo de Gato na Manga'), cost: 1, type: 'spell', text: T('Cause 2 de dano à sua Compostura.'), onPlay(st, s) { hitR(st, s, 2); } });
sd_('e_desconto', { name: T('Pedido de Desconto'), cost: 2, type: 'unit', atk: 2, hp: 2, text: '' });
sd_('e_gerente', { name: T('Quero Falar com o Gerente'), cost: 3, type: 'unit', atk: 2, hp: 4, kw: ['guarda'], text: T('Ponto Sensível.') });
sd_('e_avaliacao', { name: T('Ameaça de Avaliação Ruim'), cost: 3, type: 'spell', text: T('Cause 3 de dano à sua Compostura.'), onPlay(st, s) { hitR(st, s, 3); } });
ENC.cliente = { name: T('Cliente da Taverna'), tier: 'Social', social: true, perfil: 'Ganância', leader: T('Cliente Reclamão'), hp: 12, hand: 3, rule: T('Perfil Ganância. Quer pagar menos porque a mesa está cheia de pelo de gato.'), deck: { e_reclamacao: 4, e_pelo: 3, e_desconto: 4, e_gerente: 2, e_avaliacao: 2 } };
// Interlocutores das defesas sociais, das patrulhas e do credor
const eT = (id, name, cost, n, text) => sd_(id, { name, cost, type: 'spell', text: text || T`Cause ${n} de dano à sua Compostura.`, onPlay(st, s) { hitR(st, s, n); } });
const eA = (id, name, cost, atk, hp, kw, text, extra) => sd_(id, Object.assign({ name, cost, type: 'unit', atk, hp, kw: kw || [], text: text || (kw && kw.includes('guarda') ? T('Ponto Sensível.') : '') }, extra || {}));
eT('e_lero', T('Conversa Fiada'), 1, 2);
eA('e_proposta', T('Proposta Imperdível'), 2, 2, 2);
eA('e_comparsa', T('Comparsa'), 2, 1, 3, ['guarda']);
eT('e_promessa', T('Promessa Vazia'), 2, 3);
eA('e_capanga', T('Capanga'), 3, 3, 2);
eT('e_ameaca', T('Ameaça Velada'), 2, 3);
eA('e_brutamontes', T('Brutamontes'), 4, 3, 4, ['guarda']);
eT('e_taxa', T('Taxa de Proteção'), 3, 4);
eT('e_fanfarra', T('Fanfarronice'), 1, 2);
eA('e_trofeu_rival', T('Troféu Exibido'), 2, 2, 3);
eA('e_campeao', T('Campeão da Guilda Rival'), 4, 4, 3);
eT('e_desdem', T('Desdém Profissional'), 3, 4);
eT('e_soluco', T('Soluço Ofensivo'), 1, 2);
eA('e_cantoria', T('Cantoria Desafinada'), 2, 1, 4, ['guarda']);
eA('e_amigo_bar', T('Amigo de Bar'), 1, 1, 2);
eT('e_olhar_desc', T('Olhar Desconfiado'), 1, 2);
eA('e_evasiva', T('Resposta Evasiva'), 2, 2, 3, ['guarda']);
eA('e_alibi', T('Álibi Ensaiado'), 3, 2, 3, ['escudo'], T('Álibi.'));
eT('e_notificacao', T('Notificação Oficial'), 1, 2);
eT('e_juros', T('Juros Compostos'), 2, 3);
eA('e_multa', T('Cláusula de Multa'), 3, 2, 4, ['guarda']);
eA('e_auditor', T('Auditor da Coroa'), 3, 3, 3);
eA('e_contador', T('Contador Implacável'), 2, 2, 2, [], T('Abertura: cause 1 de dano à sua Compostura.'), { onPlay(st, s) { hitR(st, s, 1); } });
sd_('e_penhora', { name: T('Penhora'), cost: 4, type: 'spell', target: () => 'enemyUnit', targetRequired: true, text: T('Destrua um Argumento seu.'), onPlay(st, s, c) { const e = ent(st, c.target); if (e) { e.destroyed = true; log(st, T`${e.name} é penhorado.`); } } });
const socEnc = (id, o) => { ENC[id] = Object.assign({ tier: 'Social', social: true, hand: 3 }, o); };
socEnc('golpista', { name: T('Golpista na Porta'), perfil: 'Ganância', leader: T('Golpista de Fala Mansa'), hp: 14, rule: T('Perfil Ganância. Quer vender à guilda um “seguro contra dragões”.'), deck: { e_lero: 4, e_proposta: 4, e_comparsa: 3, e_promessa: 3, e_amigo_bar: 2 } });
socEnc('protecao', { name: T('Cobrador de Proteção'), perfil: 'Respeito', leader: T('Cobrador de Proteção'), hp: 16, rule: T('Perfil Respeito. Diz que a rua é perigosa e que a proteção dele custa caro.'), deck: { e_capanga: 4, e_ameaca: 4, e_brutamontes: 2, e_taxa: 2, e_lero: 3 } });
socEnc('rival', { name: T('Guilda Rival'), perfil: 'Vaidade', leader: T('Representante do Grifo Dourado'), hp: 16, rule: T('Perfil Vaidade. A guilda rival veio “avaliar a concorrência” e roubar clientes.'), deck: { e_fanfarra: 4, e_trofeu_rival: 4, e_campeao: 2, e_desdem: 2, e_proposta: 3 } });
socEnc('bebado', { name: T('Bêbado na Estrada'), perfil: 'Vaidade', leader: T('Bêbado Chato'), hp: 10, rule: T('Perfil Vaidade. Acha que sabe lutar melhor que vocês e quer provar no grito.'), deck: { e_soluco: 5, e_cantoria: 3, e_amigo_bar: 4, e_lero: 3 } });
socEnc('suspeito', { name: T('Figura Suspeita'), perfil: 'Procedimento', leader: T('Figura Suspeita'), hp: 12, rule: T('Perfil Procedimento. Diz que só estava passando. Carrega um mapa da guilda.'), deck: { e_olhar_desc: 4, e_evasiva: 3, e_alibi: 2, e_lero: 3, e_proposta: 3 } });
socEnc('credor', { name: T('O Credor'), perfil: 'Procedimento', leader: T('Barão Ostrander'), hp: 22, rule: T('Perfil Procedimento. Veio cobrar a dívida de Ergos e espera o pior de todo devedor.'), deck: { e_notificacao: 4, e_juros: 4, e_multa: 3, e_auditor: 3, e_contador: 3, e_penhora: 2 } });
// Azers da Forja (grupo 2): Kryoret, o Azer da banca, e o guarda do prisioneiro
eT('e_olhar_ferreiro', T('Olhar de Ferreiro'), 1, 2);
eA('e_bigorna_arg', T('Bigorna de Argumentos'), 2, 1, 4, ['guarda']);
eA('e_orgulho', T('Orgulho do Ofício'), 3, 3, 3);
eT('e_preco_justo', T('Preço Justo, Diz Ele'), 3, 4);
eA('e_aprendiz_azer', T('Aprendiz Atento'), 1, 1, 2);
socEnc('kryoret', { name: T('Banca Azer'), perfil: 'Respeito', leader: T('Kryoret'), hp: 16, rule: T('Perfil Respeito. Azers respeitam quem conhece o ofício e cobram caro de quem chega sem educação.'), deck: { e_olhar_ferreiro: 4, e_bigorna_arg: 3, e_orgulho: 3, e_preco_justo: 2, e_aprendiz_azer: 3 } });
socEnc('guarda_azer', { name: T('Guarda Azer'), perfil: 'Procedimento', leader: T('Guarda Azer'), hp: 14, rule: T('Perfil Procedimento. O prisioneiro só sai com uma boa razão, de preferência por escrito.'), deck: { e_olhar_ferreiro: 4, e_bigorna_arg: 4, e_notificacao: 3, e_aprendiz_azer: 3, e_orgulho: 2 } });
const SOCIAL_NEUTRAL_STARTER = { s_felix: 2, s_elogio: 2, s_respirar: 2, s_solido: 2, s_colo: 2, s_contra: 2, s_ponto: 2 };
const SOCIAL_INTRO = { temporal: ['s_fala', 's_precedente', 's_veterano'], draconic: ['s_calma', 's_forca', 's_presenca'], necro: ['s_desabafo', 's_charme', 's_elogio_postumo'], holy: ['s_informante', 's_vigilia_oracao', 's_sermao'], tech: ['s_demonstracao', 's_clausula', 's_adendo'], space: ['s_jargao', 's_profecia', 's_diagrama'] };
const SOCIAL_POOL = {
  temporal: ['s_fala', 's_resposta', 's_olhar', 's_precedente', 's_veterano', 's_lembranca', 's_testemunha_epoca', 's_ultimato'],
  draconic: ['s_calma', 's_paciencia', 's_olhar_inab', 's_bufada', 's_forca', 's_presenca', 's_tesouro', 's_voz_anciao'],
  necro: ['s_desabafo', 's_piada', 's_charme', 's_elogio_postumo', 's_boato', 's_testamento', 's_marcha', 's_coral'],
  holy: ['s_bencao', 's_informante', 's_segredo', 's_vigilia_oracao', 's_testemunha_enc', 's_sermao', 's_dossie', 's_voz_fe'],
  tech: ['s_amostra', 's_demonstracao', 's_clausula', 's_adendo', 's_contrato', 's_prototipo', 's_patente', 's_exposicao'],
  space: ['s_jargao', 's_citacao', 's_aura', 's_profecia', 's_diagrama', 's_oraculo', 's_silencio', 's_revelacao'],
  neutra: ['s_por_favor', 's_bom_senso', 's_fofoca', 's_testemunha', 's_selo'],
};

const Engine = {
  DEF, DISC, ENC, NEUTRAL_STARTER, BOARD_MAX, HAND_MAX, BLIND, setBlindRule, summon, dmg, SOCIAL_NEUTRAL_STARTER, SOCIAL_INTRO, SOCIAL_POOL,
  newGame, mulligan, keepHand, nextMulliganSize, canPlay, playCard, attack, heroAttack, canHeroAttack, resonate, canResonate, endTurn,
  resolvePrever, enemyStep, validTargets, attackTargets, canAttack, getCost, getAtk, hasKw, isDead,
  compassoPos, ent, S, sameRef, despertar,
};
if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
else root.Engine = Engine;
})(typeof window !== 'undefined' ? window : globalThis);
