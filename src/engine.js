/* Dragão Amarelo: motor de regras do protótipo.
   Lógica pura, sem DOM. Cartas são dados + efeitos curtos. */
(function (root) {
'use strict';

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
def('felix', { name: 'Felix, o Familiar', cost: 1, type: 'unit', atk: 1, hp: 1, tags: ['Felino'], disc: 'neutra', text: 'Felino. Ao Entrar: compre 1 carta.', onPlay(st, s) { draw(st, s, 1); } });
def('pocao', { name: 'Poção de Fôlego', cost: 2, type: 'spell', disc: 'neutra', text: 'Recupere 5 de vida.', onPlay(st, s) { heal(st, s, 5); } });
def('mercenario', { name: 'Mercenário de Taverna', cost: 3, type: 'unit', atk: 3, hp: 3, kw: ['guarda'], disc: 'neutra', text: 'Guarda.' });
def('tocha', { name: 'Tocha do Explorador', cost: 1, type: 'spell', disc: 'neutra', target: () => 'enemyUnit', targetRequired: true, text: 'Cause 1 de dano a uma unidade inimiga. Compre 1 carta.', onPlay(st, s, c) { dmg(st, c.target, 1, src(s, { spell: true })); draw(st, s, 1); } });
def('rede', { name: 'Rede de Captura', cost: 1, type: 'spell', disc: 'neutra', target: () => 'enemyUnit', targetRequired: true, text: 'Deixe uma unidade inimiga Imóvel. Se você controlar um Felino, compre 1 carta.', onPlay(st, s, c) { const e = ent(st, c.target); if (e) { setImovel(st, e); log(st, `${e.name} fica Imóvel.`); } if (aliveUnits(st, s).some(x => x.tags.includes('Felino'))) draw(st, s, 1); } });
def('curandeira', { name: 'Gata Curandeira', cost: 2, type: 'unit', atk: 2, hp: 2, tags: ['Felino'], disc: 'neutra', text: 'Felino. Ao Entrar: recupere 3 de vida.', onPlay(st, s) { heal(st, s, 3); } });
def('guardiao', { name: 'Gato Guardião', cost: 2, type: 'unit', atk: 1, hp: 3, kw: ['guarda'], tags: ['Felino'], disc: 'neutra', target: () => 'friendlyUnit', text: 'Felino. Guarda. Ao Entrar: dê Escudo a outra unidade aliada.', onPlay(st, s, c) { const e = ent(st, c.target); if (e && e !== c.ent) e.kw.escudo = true; } });
def('espada', { name: 'Espada de Ferro', cost: 2, type: 'weapon', atk: 2, hp: 2, disc: 'neutra', text: 'Arma 2/2.' });
def('coletor', { name: 'Gato Coletor', cost: 2, type: 'unit', atk: 2, hp: 1, tags: ['Felino'], disc: 'neutra', text: 'Felino. Ao Morrer: compre 1 carta.', onDeath(st, e) { draw(st, e.owner, 1); } });
def('lanceiro', { name: 'Gato Lanceiro', cost: 3, type: 'unit', atk: 3, hp: 2, kw: ['avanco'], tags: ['Felino'], disc: 'neutra', text: 'Felino. Avanço. Se você controlar outro Felino, entra com +1/+0.', onPlay(st, s, c) { if (c.ent && aliveUnits(st, s).some(x => x !== c.ent && x.tags.includes('Felino'))) buff(c.ent, 1, 0); } });
def('bombardeiro', { name: 'Gato Bombardeiro', cost: 3, type: 'unit', atk: 3, hp: 2, tags: ['Felino'], disc: 'neutra', text: 'Felino. Ao Morrer: cause 1 de dano a todos os inimigos.', onDeath(st, e) { aoeAll(st, e.owner, 1, src(e.owner, {})); } });
def('investida_coord', { name: 'Investida Coordenada', cost: 3, type: 'spell', disc: 'neutra', text: 'Suas unidades ganham +1/+0 e Avanço neste turno.', onPlay(st, s) { aliveUnits(st, s).forEach(e => { e.tempAtk += 1; e.tempKw.avanco = true; }); } });
def('capita', { name: 'Capitã dos Felinos', cost: 4, type: 'unit', atk: 3, hp: 4, tags: ['Felino'], disc: 'neutra', text: 'Felino. Ao Entrar: dê +1/+1 aos seus outros Felinos.', onPlay(st, s, c) { aliveUnits(st, s).filter(x => x !== c.ent && x.tags.includes('Felino')).forEach(x => buff(x, 1, 1)); } });

// Temporal Warfare
def('recruta', { name: 'Recruta de Outra Era', cost: 1, type: 'unit', atk: 2, hp: 1, kw: ['eco'], disc: 'temporal', text: 'Eco.' });
def('batedor_amanha', { name: 'Batedor de Amanhã', cost: 1, type: 'unit', atk: 3, hp: 2, kw: ['investida'], atraso: true, disc: 'temporal', text: 'Atraso. Acelerar.' });
def('escudeiro', { name: 'Escudeiro Apressado', cost: 1, type: 'unit', atk: 2, hp: 1, adiantar: 1, disc: 'temporal', text: 'Adiantar 1.' });
def('golpe_previsto', { name: 'Golpe Previsto', cost: 2, type: 'spell', disc: 'temporal', target: () => 'anyEnemy', targetRequired: true, text: 'Cause 2 de dano a um inimigo. Prever 2.', onPlay(st, s, c) { dmg(st, c.target, 2, src(s, { spell: true })); prever(st, s, 2); } });
def('lamina_reb', { name: 'Lâmina Rebobinada', cost: 3, type: 'weapon', atk: 3, hp: 2, disc: 'temporal', text: 'Arma 3/2. Ao Entrar: Prever 2.', onPlay(st, s) { prever(st, s, 2); } });
def('arqueira', { name: 'Arqueira do Passado', cost: 2, type: 'unit', atk: 2, hp: 2, disc: 'temporal', target: () => 'anyEnemy', text: 'Ao Entrar: cause 1 de dano a um inimigo.', onPlay(st, s, c) { if (c.target) dmg(st, c.target, 1, src(s, {})); } });
def('rebobinar', { name: 'Rebobinar', cost: 2, type: 'spell', disc: 'temporal', target: () => 'friendlyUnit', targetRequired: true, text: 'Devolva uma unidade aliada à sua mão; ela custa 1 a menos e ganha Acelerar.', onPlay(st, s, c) { const i = bounce(st, c.target, -1); if (i) i.acelerar = true; } });
def('veterano', { name: 'Veterano Antecipado', cost: 3, type: 'unit', atk: 3, hp: 2, kw: ['investida'], disc: 'temporal', text: 'Acelerar. Ao Evoluir: ganha Eco.', onResonate(st, e) { e.kw.eco = true; e.ecoUsed = false; } });
def('duelista', { name: 'Duelista de Antigamente', cost: 3, type: 'unit', atk: 4, hp: 2, adiantar: 2, disc: 'temporal', text: 'Adiantar 2.' });
def('licao', { name: 'Lição da História', cost: 3, type: 'spell', disc: 'temporal', text: 'Compre 2 cartas. Se uma unidade aliada voltou por Eco neste turno, compre 3.', onPlay(st, s) { draw(st, s, S(st, s).ecoReturnedThisTurn ? 3 : 2); } });
def('coluna', { name: 'Coluna de Amanhã', cost: 3, type: 'unit', atk: 4, hp: 4, kw: ['investida'], atraso: true, disc: 'temporal', text: 'Atraso. Acelerar.' });
def('estandarte', { name: 'Estandarte das Eras', cost: 3, type: 'structure', hp: 4, disc: 'temporal', text: 'Suas unidades com Eco têm +1/+0. Unidades que voltam por Eco voltam com 2 de Vida.' });
def('cavaleiro', { name: 'Cavaleiro da Primeira Coroa', cost: 5, type: 'unit', atk: 5, hp: 3, kw: ['investida'], disc: 'temporal', text: 'Acelerar. Ao Evoluir: ganha Eco.', onResonate(st, e) { e.kw.eco = true; e.ecoUsed = false; } });

// Draconic Primalism
def('ovo', { name: 'Ovo do Penhasco', cost: 1, type: 'unit', atk: 0, hp: 3, kw: ['guarda'], disc: 'draconic', text: 'Guarda. Ao Morrer: invoque um Filhote de Dragão 2/2.', onDeath(st, e) { summon(st, e.owner, 'filhote_dragao'); } });
def('filhote_dragao', { name: 'Filhote de Dragão', cost: 2, type: 'unit', atk: 2, hp: 2, tags: ['Dragão'], token: true, text: 'Dragão.' });
def('seiva', { name: 'Seiva Primordial', cost: 1, type: 'spell', disc: 'draconic', text: 'Ganhe 2 de mana neste turno.', onPlay(st, s) { S(st, s).mana += 2; } });
def('broto', { name: 'Broto Ancestral', cost: 2, type: 'unit', atk: 1, hp: 3, disc: 'draconic', text: 'Ao Entrar: ganhe 1 Cristal.', onPlay(st, s) { cristal(st, s); } });
def('muralha', { name: 'Muralha de Raízes', cost: 2, type: 'unit', atk: 1, hp: 4, kw: ['guarda'], disc: 'draconic', text: 'Guarda. Despertar: entra com +2/+2.', onPlay(st, s, c) { if (despertar(st, s)) buff(c.ent, 2, 2); } });
def('pele', { name: 'Pele de Escamas', cost: 2, type: 'spell', disc: 'draconic', target: () => 'friendlyUnit', targetRequired: true, text: 'Dê +1/+3 e Guarda a uma unidade aliada.', onPlay(st, s, c) { const e = ent(st, c.target); if (e) { buff(e, 1, 3); e.kw.guarda = true; } } });
def('chamado', { name: 'Chamado da Mata', cost: 3, type: 'spell', disc: 'draconic', text: 'Ganhe 1 Cristal. Compre 1 carta.', onPlay(st, s) { cristal(st, s); draw(st, s, 1); } });
def('rugido', { name: 'Rugido Primal', cost: 3, type: 'spell', disc: 'draconic', target: (st, s) => despertar(st, s) ? null : 'enemyUnit', targetRequired: true, text: 'Cause 3 de dano a uma unidade inimiga. Despertar: cause 3 a todas as unidades inimigas em vez disso.', onPlay(st, s, c) { if (despertar(st, s)) aoeUnits(st, s, 3, src(s, { spell: true })); else dmg(st, c.target, 3, src(s, { spell: true })); } });
def('draconete', { name: 'Draconete Curioso', cost: 3, type: 'unit', atk: 3, hp: 3, tags: ['Dragão'], disc: 'draconic', text: 'Dragão. Ao Entrar: se você tiver um Dragão na mão, ganha +1/+1.', onPlay(st, s, c) { if (S(st, s).hand.some(i => DEF[i.id].tags.includes('Dragão'))) buff(c.ent, 1, 1); } });
def('guardia', { name: 'Guardiã do Bosque', cost: 4, type: 'unit', atk: 3, hp: 5, kw: ['guarda'], disc: 'draconic', text: 'Guarda. Ao Evoluir: ganhe 1 Cristal.', onResonate(st, e) { cristal(st, e.owner); } });
def('sopro', { name: 'Sopro Ancestral', cost: 4, type: 'spell', disc: 'draconic', text: 'Cause 2 de dano a todos os inimigos. Se você controlar um Dragão, cause 3.', onPlay(st, s) { const n = S(st, s).board.some(e => e.kind === 'unit' && !isDead(e) && e.tags.includes('Dragão')) ? 3 : 2; aoeAll(st, s, n, src(s, { spell: true })); } });
def('matriarca', { name: 'Matriarca dos Ninhos', cost: 5, type: 'unit', atk: 4, hp: 6, tags: ['Dragão'], disc: 'draconic', text: 'Dragão. Ao Entrar: invoque um Ovo do Penhasco. Despertar: invoque dois.', onPlay(st, s) { const n = despertar(st, s) ? 2 : 1; for (let i = 0; i < n; i++) summon(st, s, 'ovo'); } });
def('tita', { name: 'Titã do Bosque', cost: 7, type: 'unit', atk: 7, hp: 7, kw: ['guarda'], disc: 'draconic', text: 'Guarda. Ao Entrar: recupere 5 de vida.', onPlay(st, s) { heal(st, s, 5); } });

// Necrodance
def('pacto', { name: 'Pacto Sangrento', cost: 0, type: 'spell', disc: 'necro', text: 'Perca 3 de vida. Ganhe 2 de mana neste turno.', playable(st, s) { return S(st, s).leader.hp > 3; }, onPlay(st, s) { S(st, s).leader.hp -= 3; S(st, s).mana += 2; } });
def('esqueleto', { name: 'Esqueleto Bailarino', cost: 1, type: 'unit', atk: 1, hp: 1, disc: 'necro', text: 'Ao Morrer: dê +1/+1 a uma unidade aliada aleatória.', onDeath(st, e) { const o = pick(st, aliveUnits(st, e.owner)); if (o) buff(o, 1, 1); } });
def('passo', { name: 'Passo de Abertura', cost: 0, type: 'spell', disc: 'necro', compasso: [1], target: () => 'enemyUnit', targetRequired: true, text: 'Cause 1 de dano a uma unidade inimiga. Compasso 1: compre 1 carta.', onPlay(st, s, c) { dmg(st, c.target, 1, src(s, { spell: true })); if (onBeat(st, s, c, 1)) draw(st, s, 1); } });
def('metronomo', { name: 'Metrônomo Ósseo', cost: 2, type: 'unit', atk: 2, hp: 2, disc: 'necro', compasso: [2], text: 'Compasso 2: invoque um Esqueleto Bailarino.', onPlay(st, s, c) { if (onBeat(st, s, c, 2)) summon(st, s, 'esqueleto'); } });
def('valsa', { name: 'Valsa Macabra', cost: 2, type: 'spell', disc: 'necro', compasso: [3], target: () => 'friendlyUnit', targetRequired: true, text: 'Destrua uma unidade aliada; o Ao Morrer dela ativa duas vezes. Compasso 3: compre 1 carta.', onPlay(st, s, c) { const e = ent(st, c.target); if (e) { e.extraDeath = (e.extraDeath || 0) + 1; e.destroyed = true; } if (onBeat(st, s, c, 3)) draw(st, s, 1); } });
def('coveiro', { name: 'Coveiro Ritmado', cost: 2, type: 'unit', atk: 1, hp: 3, sangria: 2, disc: 'necro', text: 'Sangria 2. Sempre que uma unidade aliada morrer, ganha +1/+0.', onFriendlyDeath(st, e) { e.atk += 1; } });
def('maldicao', { name: 'Maldição do Contratempo', cost: 2, type: 'spell', disc: 'necro', compasso: [1, 3], text: 'Embaralhe 2 Contratempos no deck inimigo. Compasso 1 ou 3: embaralhe 3.', onPlay(st, s, c) { const n = (onBeat(st, s, c, 1) || onBeat(st, s, c, 3)) ? 3 : 2; for (let i = 0; i < n; i++) shuffleInto(st, opp(s), 'contratempo'); log(st, `${n} Contratempos entram no deck inimigo.`); } });
def('contratempo', { name: 'Contratempo', cost: 1, type: 'spell', token: true, junk: true, text: 'Não faz nada. Ocupa espaço na mão.' });
def('golpe_final', { name: 'Golpe Final da Valsa', cost: 2, type: 'spell', disc: 'necro', exigeCompasso: 3, target: () => 'enemyUnitAtk4', targetRequired: true, text: 'Exige Compasso 3. Destrua uma unidade inimiga com 4 ou menos de Ataque.', onPlay(st, s, c) { const e = ent(st, c.target); if (e) e.destroyed = true; } });
def('menestrel', { name: 'Menestrel Cadavérico', cost: 3, type: 'unit', atk: 2, hp: 3, sangria: 3, disc: 'necro', compasso: [3], text: 'Sangria 3. Compasso 3: cause 2 de dano a todos os inimigos.', onPlay(st, s, c) { if (onBeat(st, s, c, 3)) aoeAll(st, s, 2, src(s, {})); } });
def('mao_alem', { name: 'Mão do Além', cost: 3, type: 'unit', atk: 3, hp: 2, kw: ['dreno'], disc: 'necro', compasso: [2], text: 'Dreno. Compasso 2: ganha Avanço.', onPlay(st, s, c) { if (onBeat(st, s, c, 2)) c.ent.kw.avanco = true; } });
def('maestro', { name: 'Maestro Sem Pulso', cost: 4, type: 'unit', atk: 3, hp: 5, sangria: 4, disc: 'necro', text: 'Sangria 4. Sempre que uma unidade aliada morrer, cause 1 de dano a um inimigo aleatório.', onFriendlyDeath(st, e) { const t = randomEnemyRef(st, e.owner); if (t) dmg(st, t, 1, src(e.owner, {})); } });
def('coro', { name: 'Coro de Lamentos', cost: 4, type: 'spell', disc: 'necro', compasso: [1, 3], text: 'Invoque um Esqueleto Bailarino. Compasso 1 ou 3: invoque mais dois.', onPlay(st, s, c) { const n = (onBeat(st, s, c, 1) || onBeat(st, s, c, 3)) ? 3 : 1; for (let i = 0; i < n; i++) summon(st, s, 'esqueleto'); } });

// Holy Shadowmancy
def('acolito', { name: 'Acólito Vigilante', cost: 1, type: 'unit', atk: 1, hp: 2, kw: ['guarda'], disc: 'holy', text: 'Guarda.' });
def('oracao', { name: 'Oração Breve', cost: 1, type: 'spell', disc: 'holy', target: (st, s) => S(st, s).board.some(e => e.kind === 'ritual' && !e.removed) ? 'ownRitual' : null, targetRequired: true, text: 'Reduza em 1 a contagem de um Ritual seu. Se você não tiver Ritual, compre 1 carta.', onPlay(st, s, c) { if (c.target) { const e = ent(st, c.target); if (e) tickRitual(st, e, 1); } else draw(st, s, 1); } });
def('lamina_veu', { name: 'Lâmina do Véu', cost: 1, type: 'spell', disc: 'holy', target: () => 'enemyUnit', targetRequired: true, text: 'Cause 2 de dano a uma unidade inimiga. Se você controlar uma unidade com Emboscada, cause 3.', onPlay(st, s, c) { dmg(st, c.target, hasEmboscada(st, s) ? 3 : 2, src(s, { spell: true })); } });
def('novico', { name: 'Noviço Sem Rosto', cost: 2, type: 'unit', atk: 2, hp: 2, kw: ['emboscada'], disc: 'holy', text: 'Emboscada. Ao Revelar: ganha +1/+1.', onReveal(st, e) { buff(e, 1, 1); } });
def('juramento', { name: 'Juramento Velado', cost: 2, type: 'ritual', countdown: 3, disc: 'holy', text: 'Ritual 3. Ao ativar: invoque um Anjo Guardião 4/4 com Guarda.', ritualEffect(st, e) { summon(st, e.owner, 'anjo'); } });
def('veu_renovado', { name: 'Véu Renovado', cost: 2, type: 'ritual', countdown: 2, disc: 'holy', text: 'Ritual 2. Ao ativar: suas unidades ganham Emboscada.', ritualEffect(st, e) { aliveUnits(st, e.owner).forEach(x => { x.kw.emboscada = true; }); log(st, 'Suas unidades voltam às sombras.'); } });
def('lamina_prece', { name: 'Lâmina da Prece', cost: 3, type: 'unit', atk: 3, hp: 2, kw: ['emboscada'], sacrificio: 2, disc: 'holy', text: 'Emboscada. Ao Revelar e destruir uma unidade, seus Rituais perdem 2 de contagem em vez de 1.' });
def('anjo', { name: 'Anjo Guardião', cost: 4, type: 'unit', atk: 4, hp: 4, kw: ['guarda'], token: true, text: 'Guarda.' });
def('fanatico', { name: 'Fanático do Véu', cost: 3, type: 'unit', atk: 2, hp: 4, kw: ['guarda'], disc: 'holy', text: 'Guarda. Ao Evoluir: reduza em 1 a contagem de todos os seus Rituais.', onResonate(st, e) { S(st, e.owner).board.filter(x => x.kind === 'ritual' && !x.removed).forEach(r => tickRitual(st, r, 1)); } });
def('assassina', { name: 'Assassina Devota', cost: 3, type: 'unit', atk: 2, hp: 1, kw: ['emboscada', 'letal'], disc: 'holy', text: 'Emboscada. Letal.' });
def('vigilia', { name: 'Vigília Silenciosa', cost: 3, type: 'ritual', countdown: 2, disc: 'holy', text: 'Ritual 2. Ao ativar: destrua a unidade inimiga com maior Ataque.', ritualEffect(st, e) { const us = aliveUnits(st, opp(e.owner)); if (us.length) { us.sort((a, b) => getAtk(st, b) - getAtk(st, a)); us[0].destroyed = true; log(st, `Vigília Silenciosa destrói ${us[0].name}.`); } } });
def('sacerdotisa', { name: 'Sacerdotisa do Crepúsculo', cost: 4, type: 'unit', atk: 3, hp: 5, disc: 'holy', text: 'Ao Entrar: seus Rituais perdem 1 de contagem. Sempre que um Ritual seu ativar, compre 1 carta.', onPlay(st, s) { S(st, s).board.filter(x => x.kind === 'ritual' && !x.removed).forEach(r => tickRitual(st, r, 1)); }, onRitualActivate(st, e) { draw(st, e.owner, 1); } });
def('mestre', { name: 'Mestre Sem Nome', cost: 4, type: 'unit', atk: 4, hp: 3, kw: ['emboscada'], disc: 'holy', text: 'Emboscada. Ao Evoluir: suas outras unidades ganham Emboscada.', onResonate(st, e) { aliveUnits(st, e.owner).filter(x => x !== e).forEach(x => { x.kw.emboscada = true; }); } });
def('julgamento', { name: 'Julgamento Silencioso', cost: 5, type: 'spell', disc: 'holy', target: () => 'enemyUnit', targetRequired: true, costMod(st, s) { return hasEmboscada(st, s) ? -2 : 0; }, text: 'Destrua uma unidade inimiga. Custa 2 a menos se você controlar uma unidade com Emboscada.', onPlay(st, s, c) { const e = ent(st, c.target); if (e) e.destroyed = true; } });
def('purificacao', { name: 'Purificação', cost: 5, type: 'spell', disc: 'holy', text: 'Cause 4 de dano a todas as unidades inimigas.', onPlay(st, s) { aoeUnits(st, s, 4, src(s, { spell: true })); } });

// Space Wizardry
def('faisca', { name: 'Faísca Estelar', cost: 1, type: 'spell', disc: 'space', target: () => 'anyEnemy', targetRequired: true, text: 'Cause 2 de dano a um inimigo.', onPlay(st, s, c) { dmg(st, c.target, 2, src(s, { spell: true })); } });
def('astrolabio', { name: 'Astrolábio Animado', cost: 1, type: 'unit', atk: 1, hp: 2, disc: 'space', text: 'Sempre que você lançar um feitiço, ganha +1/+0 neste turno.', onSpellCast(st, e) { e.tempAtk += 1; } });
def('chuva', { name: 'Chuva de Meteoritos', cost: 2, type: 'spell', disc: 'space', text: 'Cause 3 de dano dividido aleatoriamente entre os inimigos.', onPlay(st, s) { for (let i = 0; i < 3; i++) { const t = randomEnemyRef(st, s); if (t) dmg(st, t, 1, src(s, { spell: true })); } } });
def('aprendiz_astral', { name: 'Aprendiz Astral', cost: 2, type: 'unit', atk: 2, hp: 2, disc: 'space', text: 'Ao Entrar: dê 1 Carga a cada carta com Órbita na sua mão.', onPlay(st, s) { charge(st, s, 1); } });
def('escudo_grav', { name: 'Escudo de Gravidade', cost: 2, type: 'spell', disc: 'space', target: () => 'friendlyUnit', targetRequired: true, text: 'Dê Escudo a uma unidade aliada. Compre 1 carta.', onPlay(st, s, c) { const e = ent(st, c.target); if (e) e.kw.escudo = true; draw(st, s, 1); } });
def('leitura', { name: 'Leitura das Estrelas', cost: 3, type: 'spell', orbita: true, orbitaCost: true, disc: 'space', text: 'Órbita. Custa 1 a menos por Carga. Compre 2 cartas.', onPlay(st, s) { draw(st, s, 2); } });
def('raio', { name: 'Raio Lunar', cost: 3, type: 'spell', disc: 'space', target: () => 'enemyUnit', targetRequired: true, text: 'Cause 4 de dano a uma unidade inimiga. Se ela morrer, dê 1 Carga às suas cartas com Órbita.', onPlay(st, s, c) { const e = ent(st, c.target); dmg(st, c.target, 4, src(s, { spell: true })); if (e && isDead(e)) charge(st, s, 1); } });
def('grifo', { name: 'Grifo Cometário', cost: 3, type: 'unit', atk: 3, hp: 2, kw: ['avanco'], disc: 'space', text: 'Avanço. Ao Evoluir: cause 2 de dano ao líder inimigo.', onResonate(st, e) { dmg(st, { t: 'l', side: opp(e.owner) }, 2, src(e.owner, {})); } });
def('golem_poeira', { name: 'Golem de Poeira Estelar', cost: 4, type: 'unit', atk: 4, hp: 5, kw: ['guarda'], orbita: true, disc: 'space', text: 'Guarda. Órbita: entra com +1/+1 por Carga.', onPlay(st, s, c) { const n = c.inst.cargas || 0; if (n) buff(c.ent, n, n); } });
def('elemental', { name: 'Elemental de Nebulosa', cost: 5, type: 'unit', atk: 4, hp: 5, disc: 'space', text: 'Ao Entrar: cause 1 de dano a todos os inimigos para cada feitiço que você lançou neste turno.', onPlay(st, s) { const n = S(st, s).spellsCastThisTurn; if (n > 0) aoeAll(st, s, n, src(s, {})); } });
def('eclipse', { name: 'Eclipse', cost: 5, type: 'spell', orbita: true, disc: 'space', text: 'Órbita. Cause 2 de dano a todas as unidades inimigas, +1 por Carga (máx. +3).', onPlay(st, s, c) { aoeUnits(st, s, 2 + Math.min(3, c.inst.cargas || 0), src(s, { spell: true })); } });
def('cometa', { name: 'Cometa Convocado', cost: 8, type: 'spell', orbita: true, orbitaCost: true, disc: 'space', target: () => 'anyEnemy', targetRequired: true, text: 'Órbita. Custa 1 a menos por Carga. Cause 6 de dano a um inimigo.', onPlay(st, s, c) { dmg(st, c.target, 6, src(s, { spell: true })); } });

// Magitech
def('automato', { name: 'Autômato de Bolso', cost: 1, type: 'unit', atk: 1, hp: 2, tags: ['Construto'], disc: 'tech', text: 'Construto. Ao Evoluir: ganha Letal.', onResonate(st, e) { e.kw.letal = true; } });
def('frasco', { name: 'Frasco Volátil', cost: 1, type: 'spell', disc: 'tech', target: () => 'friendlyUnit', targetRequired: true, text: 'Dê +1/+0 e Letal a uma unidade aliada neste turno.', onPlay(st, s, c) { const e = ent(st, c.target); if (e) { e.tempAtk += 1; e.tempKw.letal = true; } } });
def('placa', { name: 'Placa de Reforço', cost: 1, type: 'spell', module: true, disc: 'tech', target: () => 'friendlyUnit', targetRequired: true, text: 'Módulo. Acople: +1/+1.', attach(e) { buff(e, 1, 1); } });
def('molas', { name: 'Armadilha de Molas', cost: 2, type: 'trap', disc: 'tech', text: 'Armadilha. Quando uma unidade inimiga atacar, cause 3 de dano a ela.' });
def('aprendiz_alq', { name: 'Aprendiz de Alquimista', cost: 2, type: 'unit', atk: 2, hp: 3, disc: 'tech', text: 'Ao Entrar: crie um Frasco Volátil na sua mão.', onPlay(st, s) { addToHand(st, s, 'frasco'); } });
def('nucleo', { name: 'Núcleo Encantado', cost: 2, type: 'spell', module: true, disc: 'tech', target: () => 'friendlyUnit', targetRequired: true, text: 'Módulo. Acople: +0/+2 e Escudo.', attach(e) { buff(e, 0, 2); e.kw.escudo = true; } });
def('torre', { name: 'Torre de Vigia Mecânica', cost: 3, type: 'structure', hp: 4, disc: 'tech', text: 'No fim do seu turno, cause 1 de dano a um inimigo aleatório.', onEndTurn(st, e) { const t = randomEnemyRef(st, e.owner); if (t) dmg(st, t, 1, src(e.owner, {})); } });
def('golem_latao', { name: 'Golem de Latão', cost: 3, type: 'unit', atk: 2, hp: 4, kw: ['guarda'], tags: ['Construto'], disc: 'tech', text: 'Construto. Guarda. Sempre que um Módulo for acoplado a ele, compre 1 carta.', onModuleAttached(st, e) { draw(st, e.owner, 1); } });
def('besta', { name: 'Besta de Repetição', cost: 3, type: 'weapon', atk: 1, hp: 3, letal: true, disc: 'tech', text: 'Arma 1/3. Letal.' });
def('gas', { name: 'Gás Paralisante', cost: 3, type: 'trap', disc: 'tech', text: 'Armadilha. Quando o inimigo jogar uma unidade, ela não pode atacar no próximo turno dele. Compre 1 carta.' });
def('oficina', { name: 'Oficina Ambulante', cost: 4, type: 'structure', hp: 4, disc: 'tech', text: 'No fim do seu turno, dê +1/+1 a uma unidade aliada aleatória.', onEndTurn(st, e) { const o = pick(st, aliveUnits(st, e.owner)); if (o) buff(o, 1, 1); } });
def('cav_engr', { name: 'Cavaleiro de Engrenagens', cost: 5, type: 'unit', atk: 4, hp: 6, tags: ['Construto'], disc: 'tech', text: 'Construto. Ao Entrar: se você tiver um Módulo na mão, acople-o a esta unidade sem custo.', onPlay(st, s, c) { const h = S(st, s).hand; const i = h.findIndex(x => DEF[x.id].module); if (i >= 0 && c.ent) { const m = h.splice(i, 1)[0]; attachModule(st, c.ent, m.id); } } });

// Inimigos: Grutas Vivas
def('morcego', { name: 'Morcego da Gruta', cost: 1, type: 'unit', atk: 1, hp: 1, kw: ['avanco'], text: 'Avanço.' });
def('broto_cog', { name: 'Cogumelo-Broto', cost: 1, type: 'unit', atk: 0, hp: 1, brotar: 'cog_adulto', text: 'Brotar: vira um Cogumelo Adulto 3/3.' });
def('cog_adulto', { name: 'Cogumelo Adulto', cost: 3, type: 'unit', atk: 3, hp: 3, token: true, text: '' });
def('besouro', { name: 'Besouro Cascudo', cost: 2, type: 'unit', atk: 1, hp: 4, kw: ['guarda'], text: 'Guarda.' });
def('aranha', { name: 'Aranha Tecelã', cost: 2, type: 'unit', atk: 2, hp: 2, target: () => 'enemyUnit', text: 'Ao Entrar: deixe uma unidade inimiga Imóvel.', onPlay(st, s, c) { const e = ent(st, c.target); if (e) { setImovel(st, e); log(st, `${e.name} fica Imóvel.`); } } });
def('enxame', { name: 'Enxame de Grilos', cost: 2, type: 'spell', text: 'Invoque três Grilos 1/1.', onPlay(st, s) { for (let i = 0; i < 3; i++) summon(st, s, 'grilo'); } });
def('grilo', { name: 'Grilo', cost: 1, type: 'unit', atk: 1, hp: 1, token: true, text: '' });
def('esporos', { name: 'Esporos Sufocantes', cost: 2, type: 'spell', text: 'Cause 1 de dano a todas as unidades inimigas.', onPlay(st, s) { aoeUnits(st, s, 1, src(s, { spell: true })); } });
def('lagarto', { name: 'Lagarto das Fendas', cost: 3, type: 'unit', atk: 3, hp: 2, kw: ['emboscada'], text: 'Emboscada.' });
def('toupeira', { name: 'Toupeira Escavadora', cost: 3, type: 'unit', atk: 2, hp: 3, text: 'Ao Morrer: invoque um Cogumelo-Broto.', onDeath(st, e) { summon(st, e.owner, 'broto_cog'); } });
def('ninho', { name: 'Ninho de Morcegos', cost: 3, type: 'structure', hp: 4, text: 'No fim do seu turno, invoque um Morcego da Gruta.', onEndTurn(st, e) { summon(st, e.owner, 'morcego'); } });
def('mordida_inf', { name: 'Mordida Infecciosa', cost: 3, type: 'spell', target: () => 'enemyUnit', targetRequired: true, text: 'Cause 3 de dano a uma unidade inimiga. Se ela morrer, invoque um Cogumelo-Broto.', onPlay(st, s, c) { const e = ent(st, c.target); dmg(st, c.target, 3, src(s, { spell: true })); if (e && isDead(e)) summon(st, s, 'broto_cog'); } });
def('centopeia', { name: 'Centopeia Venenosa', cost: 4, type: 'unit', atk: 3, hp: 3, kw: ['letal'], text: 'Letal.' });
def('fungoide', { name: 'Fungoide Ancião', cost: 4, type: 'unit', atk: 3, hp: 5, text: 'No fim do seu turno, invoque um Cogumelo-Broto.', onEndTurn(st, e) { summon(st, e.owner, 'broto_cog'); } });
def('fungo_colossal', { name: 'Fungo Colossal', cost: 6, type: 'unit', atk: 5, hp: 8, kw: ['guarda'], text: 'Guarda. Ao Entrar: todos os seus Cogumelos-Broto brotam agora.', onPlay(st, s) { S(st, s).board.slice().filter(x => DEF[x.id].brotar && !isDead(x) && x.id === 'broto_cog').forEach(x => brotar(st, x)); } });
def('estatua', { name: 'Estátua Antiga', cost: 2, type: 'structure', hp: 6, text: 'Enquanto estiver em campo, o Basilisco não pode ser alvo de feitiços.' });
def('ninhada', { name: 'Ninhada de Basilisco', cost: 3, type: 'structure', hp: 3, brotar: 'filhote_bas', text: 'Brotar: vira um Filhote de Basilisco.' });
def('filhote_bas', { name: 'Filhote de Basilisco', cost: 3, type: 'unit', atk: 3, hp: 3, text: 'Ao Evoluir: deixe uma unidade inimiga Imóvel.', onResonate(st, e) { const us = aliveUnits(st, opp(e.owner)).filter(x => !hasKw(x, 'emboscada')); if (us.length) { us.sort((a, b) => getAtk(st, b) - getAtk(st, a)); setImovel(st, us[0]); log(st, `${us[0].name} fica Imóvel.`); } } });
def('cauda', { name: 'Cauda Sísmica', cost: 4, type: 'spell', text: 'Cause 2 de dano a todas as unidades inimigas.', onPlay(st, s) { aoeUnits(st, s, 2, src(s, { spell: true })); } });
def('mordida_pet', { name: 'Mordida Petrificante', cost: 5, type: 'spell', target: () => 'enemyImovel', targetRequired: true, text: 'Destrua uma unidade Imóvel.', onPlay(st, s, c) { const e = ent(st, c.target); if (e) e.destroyed = true; } });

// Recompensas e neutras de booster
def('machado', { name: 'Machado de Mil Batalhas', cost: 4, type: 'weapon', atk: 3, hp: 3, disc: 'temporal', text: 'Arma 3/3. Sempre que o protagonista atacar com esta arma, invoque um Recruta de Outra Era.', onWeaponAttack(st, s) { summon(st, s, 'recruta'); } });
def('carga', { name: 'Carga Através dos Séculos', cost: 6, type: 'spell', disc: 'temporal', text: 'Suas unidades ganham +2/+0 e Acelerar neste turno.', onPlay(st, s) { aliveUnits(st, s).forEach(e => { e.tempAtk += 2; e.tempKw.investida = true; }); } });
def('marechal', { name: 'Marechal do Fim dos Tempos', cost: 7, type: 'unit', atk: 6, hp: 6, disc: 'temporal', text: 'Ao Entrar: para até 3 unidades aliadas diferentes que morreram nesta batalha, invoque uma cópia com o Ataque original, 1 de Vida e Eco.', onPlay(st, s) { const ids = []; (S(st, s).deadUnits || []).slice().reverse().forEach(id => { if (!ids.includes(id) && ids.length < 3) ids.push(id); }); ids.forEach(id => { const e = summon(st, s, id); if (e) { e.hp = 1; e.maxHp = 1; e.kw.eco = true; e.ecoUsed = false; } }); } });
def('furia', { name: 'Fúria Selvagem', cost: 5, type: 'spell', disc: 'draconic', target: () => 'friendlyUnit', targetRequired: true, text: 'Dê +4/+4 e Avanço a uma unidade aliada. Despertar: ela ganha Acelerar em vez de Avanço.', onPlay(st, s, c) { const e = ent(st, c.target); if (e) { buff(e, 4, 4); if (despertar(st, s)) e.kw.investida = true; else e.kw.avanco = true; } } });
def('wyrm', { name: 'Wyrm do Âmago', cost: 8, type: 'unit', atk: 8, hp: 8, kw: ['guarda'], tags: ['Dragão'], disc: 'draconic', text: 'Dragão. Guarda. Ao Evoluir: cause 3 de dano a todos os inimigos.', onResonate(st, e) { aoeAll(st, e.owner, 3, src(e.owner, {})); } });
def('rei_dragao', { name: 'Rei-Dragão Ancestral', cost: 10, type: 'unit', atk: 10, hp: 10, tags: ['Dragão'], disc: 'draconic', costMod(st, s) { return -(S(st, s).crystals || 0); }, text: 'Dragão. Custa 1 a menos para cada Cristal que você ganhou nesta batalha. Ao Entrar: destrua todas as outras unidades.', onPlay(st, s, c) { ['P', 'E'].forEach(x => aliveUnits(st, x).forEach(u => { if (u !== c.ent) u.destroyed = true; })); } });
def('bailarina', { name: 'Bailarina Pálida', cost: 5, type: 'unit', atk: 4, hp: 4, kw: ['dreno'], disc: 'necro', text: 'Dreno. Ao Evoluir: devolva à sua mão a última unidade aliada que morreu nesta batalha.', onResonate(st, e) { const id = (S(st, e.owner).deadUnits || []).filter(x => !DEF[x].token).pop(); if (id) { addToHand(st, e.owner, id); log(st, `${DEF[id].name} volta para a mão.`); } } });
def('danse', { name: 'Danse Macabre', cost: 6, type: 'spell', disc: 'necro', compasso: [3], text: 'Destrua todas as unidades. Invoque um Esqueleto 2/2 para cada unidade aliada destruída. Compasso 3: os Esqueletos ganham Dreno.', onPlay(st, s, c) { const mine = aliveUnits(st, s).length; ['P', 'E'].forEach(x => aliveUnits(st, x).forEach(u => { u.destroyed = true; })); resolveDeaths(st); for (let i = 0; i < mine; i++) { const e = summon(st, s, 'esqueleto22'); if (e && onBeat(st, s, c, 3)) e.kw.dreno = true; } } });
def('esqueleto22', { name: 'Esqueleto', cost: 2, type: 'unit', atk: 2, hp: 2, token: true, text: '' });
def('regente', { name: 'Regente da Última Valsa', cost: 7, type: 'unit', atk: 5, hp: 7, sangria: 7, disc: 'necro', text: 'Sangria 7. Enquanto estiver em campo, toda condição de Compasso conta como cumprida.' });
def('liturgia', { name: 'Grande Liturgia', cost: 4, type: 'ritual', countdown: 4, disc: 'holy', text: 'Ritual 4. Ao ativar: invoque dois Anjos Guardiões 4/4 com Guarda.', ritualEffect(st, e) { summon(st, e.owner, 'anjo'); summon(st, e.owner, 'anjo'); } });
def('arauto', { name: 'Arauto da Aurora Velada', cost: 7, type: 'unit', atk: 6, hp: 7, kw: ['guarda', 'escudo'], disc: 'holy', text: 'Guarda. Escudo. Ao Entrar: reduza em 2 a contagem de todos os seus Rituais.', onPlay(st, s) { S(st, s).board.filter(x => x.kind === 'ritual' && !x.removed).forEach(r => tickRitual(st, r, 2)); } });
def('serafim', { name: 'Serafim de Mil Véus', cost: 8, type: 'unit', atk: 7, hp: 7, kw: ['emboscada', 'escudo'], disc: 'holy', text: 'Emboscada. Escudo. Ao Entrar: ative agora todos os seus Rituais.', onPlay(st, s) { S(st, s).board.filter(x => x.kind === 'ritual' && !x.removed).forEach(r => activateRitual(st, r)); } });
def('canhao', { name: 'Canhão de Ombro', cost: 4, type: 'spell', module: true, disc: 'tech', target: () => 'friendlyUnit', targetRequired: true, text: 'Módulo. Acople: +3/+0. Quando a unidade atacar, cause 2 de dano a outro inimigo aleatório.', attach(e) { buff(e, 3, 0); }, onHostAttack(st, a, ref) { const o = opp(a.owner); const c = S(st, o).board.filter(e => (e.kind === 'unit' || e.kind === 'structure') && !isDead(e) && !hasKw(e, 'emboscada') && !(ref.t === 'e' && e.uid === ref.uid)).map(e => ({ t: 'e', uid: e.uid })); if (ref.t !== 'l') c.push({ t: 'l', side: o }); const t = pick(st, c); if (t) dmg(st, t, 2, src(a.owner, {})); } });
def('destilaria', { name: 'Destilaria de Elixires', cost: 5, type: 'structure', hp: 6, disc: 'tech', text: 'No início do seu turno, crie um Frasco Volátil na sua mão.', onStartTurn(st, e) { addToHand(st, e.owner, 'frasco'); } });
def('colosso', { name: 'Colosso Arcano', cost: 8, type: 'unit', atk: 6, hp: 8, kw: ['guarda'], tags: ['Construto'], disc: 'tech', text: 'Construto. Guarda. Ao Entrar: cada Estrutura sua ativa seu efeito agora. Ao Evoluir: ganha Letal e Escudo.', onPlay(st, s) { S(st, s).board.filter(x => x.kind === 'structure' && !isDead(x)).forEach(x => { const d = DEF[x.id]; if (d.onEndTurn) d.onEndTurn(st, x); if (d.onStartTurn) d.onStartTurn(st, x); }); }, onResonate(st, e) { e.kw.letal = true; e.kw.escudo = true; } });
def('quimera', { name: 'Quimera Nebular', cost: 6, type: 'unit', atk: 5, hp: 6, disc: 'space', text: 'Ao Entrar: lance uma cópia do último feitiço que você lançou nesta batalha, com alvos aleatórios.', onPlay(st, s, c) { const id = S(st, s).lastSpell; if (!id) return; const d = DEF[id]; const spec = d.target ? d.target(st, s) : null; const ts = spec ? validTargets(st, s, spec, true) : []; if (spec && d.targetRequired && !ts.length) return; const target = ts.length ? pick(st, ts) : null; log(st, `Quimera Nebular lança ${d.name}.`); if (d.module) { const e = ent(st, target); if (e) attachModule(st, e, id); } else if (d.onPlay) d.onPlay(st, s, { target, pos: c.pos, inst: { id, cargas: 0 }, ent: null }); } });
def('buraco_negro', { name: 'Buraco Negro', cost: 7, type: 'spell', disc: 'space', text: 'Destrua todas as unidades. Para cada unidade destruída, dê 1 Carga a cada carta com Órbita na sua mão.', onPlay(st, s) { let n = 0; ['P', 'E'].forEach(x => aliveUnits(st, x).forEach(u => { u.destroyed = true; n++; })); if (n) charge(st, s, n); } });
def('arquimago', { name: 'Arquimago do Zênite', cost: 9, type: 'unit', atk: 6, hp: 8, disc: 'space', text: 'Seus feitiços custam 1 a menos. Ao Entrar: dê 3 Cargas a cada carta com Órbita na sua mão.', onPlay(st, s) { charge(st, s, 3); } });
def('racao', { name: 'Ração de Viagem', cost: 1, type: 'spell', disc: 'neutra', target: () => 'friendlyUnit', targetRequired: true, text: 'Dê +1/+1 a uma unidade aliada. Se for um Felino, dê +2/+2.', onPlay(st, s, c) { const e = ent(st, c.target); if (e) { const n = e.tags.includes('Felino') ? 2 : 1; buff(e, n, n); } } });
def('bumerangue', { name: 'Bumerangue', cost: 1, type: 'spell', disc: 'neutra', target: () => 'anyEnemy', targetRequired: true, text: 'Cause 1 de dano a um inimigo. No início do seu próximo turno, se você controlar um Felino, ele volta para a sua mão.', onPlay(st, s, c) { dmg(st, c.target, 1, src(s, { spell: true })); S(st, s).boomerang = (S(st, s).boomerang || 0) + 1; } });
def('formacao', { name: 'Formação Defensiva', cost: 2, type: 'spell', disc: 'neutra', text: 'Dê +0/+2 a todas as unidades aliadas.', onPlay(st, s) { aliveUnits(st, s).forEach(e => buff(e, 0, 2)); } });
def('lamina_enc', { name: 'Lâmina Encomendada', cost: 2, type: 'weapon', atk: 2, hp: 3, disc: 'neutra', text: 'Arma 2/3.' });
def('elixir', { name: 'Elixir do Boticário', cost: 3, type: 'spell', disc: 'neutra', text: 'Recupere 4 de vida. Compre 1 carta.', onPlay(st, s) { heal(st, s, 4); draw(st, s, 1); } });
def('barril', { name: 'Barril de Pólvora', cost: 3, type: 'structure', hp: 2, disc: 'neutra', text: 'Quando for destruída, cause 3 de dano a todas as unidades.', onDestroyed(st, e) { ['P', 'E'].forEach(x => aliveUnits(st, x).forEach(u => dmg(st, { t: 'e', uid: u.uid }, 3, src(e.owner, {})))); } });
def('mapa_ergos', { name: 'Mapa Rabiscado de Ergos', cost: 0, type: 'spell', disc: 'neutra', text: 'Compre 1 carta. Se for de Disciplina, ela custa 1 a menos.', onPlay(st, s) { const sd = S(st, s); const before = sd.hand.length; draw(st, s, 1); if (sd.hand.length > before) { const i = sd.hand[sd.hand.length - 1]; const dd = DEF[i.id].disc; if (dd && dd !== 'neutra') i.costMod = (i.costMod || 0) - 1; } } });
def('gigante', { name: 'Gigante das Profundezas', cost: 6, type: 'unit', atk: 6, hp: 7, disc: 'neutra', text: '' });

/* ---------------- Disciplinas e encontros ---------------- */
const DISC = {
  temporal: { name: 'Temporal Warfare', role: 'Aggro', plan: 'Pressão desde o turno 1: Acelerar, unidades que voltam com Eco e Atraso como emboscada.', cards: ['recruta', 'golpe_previsto', 'veterano', 'coluna', 'cavaleiro'] },
  draconic: { name: 'Draconic Primalism', role: 'Ramp', plan: 'Segurar o começo atrás de Guarda, ganhar Cristais e chegar ao Despertar.', cards: ['broto', 'muralha', 'rugido', 'matriarca', 'tita'] },
  necro: { name: 'Necrodance', role: 'Ritmo e morte', plan: 'Turnos de três cartas no Compasso certo, sacrifício e vida como recurso.', cards: ['esqueleto', 'passo', 'metronomo', 'menestrel', 'maestro'] },
  holy: { name: 'Holy Shadowmancy', role: 'Controle', plan: 'Ninjas atacam das sombras, e cada unidade abatida ao se revelar é um sacrifício que acelera os Rituais.', cards: ['novico', 'juramento', 'lamina_prece', 'assassina', 'purificacao'] },
  tech: { name: 'Magitech', role: 'Midrange e valor', plan: 'Módulos que voltam para a mão, Estruturas que geram valor e Armadilhas.', cards: ['placa', 'molas', 'golem_latao', 'torre', 'cav_engr'] },
  space: { name: 'Space Wizardry', role: 'Combo', plan: 'Feitiços baratos carregam a Órbita na mão até um turno explosivo.', cards: ['faisca', 'aprendiz_astral', 'raio', 'golem_poeira', 'cometa'] },
};
const NEUTRAL_STARTER = { felix: 2, tocha: 2, rede: 2, curandeira: 2, guardiao: 2, espada: 2, coletor: 1, pocao: 1, lanceiro: 2, bombardeiro: 2, investida_coord: 1, capita: 1 };

const ENC = {
  revoada: { name: 'Revoada na Fenda', tier: 'Comum', leader: 'Morcego Ancião', hp: 12, hand: 3, rule: 'Seus Morcegos da Gruta têm +1/+0.', deck: { morcego: 6, besouro: 4, enxame: 4, lagarto: 4, ninho: 2 }, onSummon(st, e) { if (e.id === 'morcego') e.atk += 1; } },
  jardim: { name: 'Jardim de Esporos', tier: 'Comum', leader: 'Fungoide Jardineiro', hp: 15, hand: 3, rule: 'Seus Cogumelos-Broto brotam como 4/4.', deck: { broto_cog: 6, besouro: 4, toupeira: 4, esporos: 2, fungoide: 2, mordida_inf: 2 }, onBrotar(st, e) { if (e.id === 'cog_adulto') { e.atk = 4; e.hp = 4; e.maxHp = 4; } } },
  toca: { name: 'Toca das Aranhas', tier: 'Comum', leader: 'Aranha Mãe', hp: 15, hand: 3, rule: 'Suas Aranhas Tecelãs custam 1 a menos.', deck: { aranha: 6, morcego: 4, lagarto: 4, besouro: 2, centopeia: 2, mordida_inf: 2 }, costMod(st, id) { return id === 'aranha' ? -1 : 0; } },
  bicharada: { name: 'Bicharada Mista', tier: 'Comum', leader: 'Toupeira Rainha', hp: 18, hand: 3, rule: 'No início do seu turno, se tiver menos unidades que você, compra 1 carta extra.', deck: { toupeira: 4, morcego: 2, broto_cog: 2, besouro: 2, aranha: 2, enxame: 2, lagarto: 2, mordida_inf: 2, centopeia: 2 }, onStartTurn(st) { if (aliveUnits(st, 'E').length < aliveUnits(st, 'P').length) { draw(st, 'E', 1); log(st, 'Toupeira Rainha compra 1 carta extra.'); } } },
  imperatriz: { name: 'Centopeia Imperatriz', tier: 'Elite', leader: 'Centopeia Imperatriz', hp: 25, hand: 4, rule: 'Suas unidades com Letal custam 1 a menos e têm +0/+1.', deck: { centopeia: 6, aranha: 4, lagarto: 4, besouro: 4, mordida_inf: 3, esporos: 2, morcego: 2 }, costMod(st, id) { return DEF[id].kw.includes('letal') ? -1 : 0; }, onSummon(st, e) { if (e.kw.letal) { e.hp += 1; e.maxHp += 1; } } },
  fungo: { name: 'Fungo Colossal Desperto', tier: 'Elite', leader: 'Fungo Colossal Desperto', hp: 25, hand: 4, rule: 'Seus Cogumelos Adultos têm Guarda.', deck: { broto_cog: 6, fungoide: 4, toupeira: 4, besouro: 4, esporos: 3, fungo_colossal: 2, mordida_inf: 2 }, onBrotar(st, e) { if (e.id === 'cog_adulto') e.kw.guarda = true; } },
  basilisco: { name: 'Basilisco das Grutas', tier: 'Chefe', leader: 'Basilisco das Grutas', hp: 40, hand: 4, boss: true, resonance: 2, rule: 'Olhar Petrificante: no fim do turno dele, sua unidade de maior Ataque fica Imóvel. Com 20 de Vida ou menos, troca de pele (recupera 8) e o Olhar pega duas unidades.', deck: { ninhada: 3, filhote_bas: 3, mordida_pet: 3, estatua: 2, cauda: 2, lagarto: 4, broto_cog: 4, besouro: 3, fungoide: 2, mordida_inf: 2, fungo_colossal: 2 },
    onEndTurn(st) { const us = aliveUnits(st, 'P'); us.sort((a, b) => getAtk(st, b) - getAtk(st, a)); us.slice(0, st.gazeCount).forEach(e => { setImovel(st, e); log(st, `Olhar Petrificante: ${e.name} fica Imóvel.`); }); } },
};

/* ---------------- Utilidades ---------------- */
function S(st, s) { return st.sides[s]; }
function opp(s) { return s === 'P' ? 'E' : 'P'; }
function log(st, msg) { st.log.push(msg); }
function pick(st, arr) { return arr.length ? arr[Math.floor(st.rng() * arr.length)] : null; }
function shuffle(st, arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(st.rng() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
function newInst(st, id, costMod) { return { uid: st.nextUid++, id, cargas: 0, costMod: costMod || 0 }; }
function src(side, o) { return { side, letal: !!o.letal, dreno: !!o.dreno, spell: !!o.spell }; }
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
      sd.leader.hp -= sd.fatigue;
      log(st, `${sd.leader.name} está sem cartas e sofre ${sd.fatigue} de fadiga.`);
      continue;
    }
    const inst = sd.deck.shift();
    if (sd.hand.length >= HAND_MAX) { log(st, `Mão cheia: ${DEF[inst.id].name} é queimada.`); continue; }
    sd.hand.push(inst);
  }
}
function addToHand(st, side, id, costMod) {
  const sd = S(st, side);
  if (sd.hand.length >= HAND_MAX) { log(st, `Mão cheia: ${DEF[id].name} se perde.`); return null; }
  const inst = newInst(st, id, costMod); sd.hand.push(inst); return inst;
}
function shuffleInto(st, side, id) {
  const deck = S(st, side).deck;
  deck.splice(Math.floor(st.rng() * (deck.length + 1)), 0, newInst(st, id));
}
function heal(st, side, n) { const l = S(st, side).leader; l.hp = Math.min(l.maxHp, l.hp + n); }
function cristal(st, side) {
  const sd = S(st, side);
  if (sd.maxMana >= 10) { draw(st, side, 1); log(st, 'Mana máxima já é 10: Cristal vira compra.'); }
  else { sd.maxMana += 1; log(st, `${sd.leader.name} ganha 1 Cristal.`); }
  sd.crystals = (sd.crystals || 0) + 1;
}
function charge(st, side, n) {
  S(st, side).hand.forEach(i => { if (DEF[i.id].orbita) i.cargas = Math.min(CARGA_MAX, (i.cargas || 0) + n); });
}
function setImovel(st, e) { e.imovel = (st.turnSide === e.owner) ? 2 : 1; }
function reveal(st, e) {
  log(st, `${e.name} se revela.`);
  const d = DEF[e.id]; if (d.onReveal) d.onReveal(st, e);
}
function sacrifice(st, e) {
  const n = DEF[e.id].sacrificio || 1;
  const rs = S(st, e.owner).board.filter(x => x.kind === 'ritual' && !x.removed);
  if (!rs.length) return;
  log(st, `Sacrifício: seus Rituais perdem ${n} de contagem.`);
  rec(st, { k: 'sac', u: uidOf(e), n });
  rs.forEach(r => tickRitual(st, r, n));
}

function dmg(st, ref, amount, sc) {
  if (!ref || amount <= 0) return 0;
  if (ref.t === 'l') {
    const sd = S(st, ref.side);
    sd.leader.hp -= amount;
    if (sc.dreno) heal(st, sc.side, amount);
    afterLeaderDamage(st, ref.side);
    return amount;
  }
  const e = ent(st, ref);
  if (!e || isDead(e) || e.kind === 'ritual') return 0;
  if (hasKw(e, 'escudo')) { e.kw.escudo = false; e.tempKw.escudo = false; log(st, `${e.name} perde o Escudo.`); return 0; }
  e.hp -= amount;
  if (sc.letal && e.kind === 'unit') e.destroyed = true;
  if (sc.dreno) heal(st, sc.side, amount);
  return amount;
}
function afterLeaderDamage(st, side) {
  if (side === 'E' && st.enc.boss && !st.phase2) {
    const l = S(st, 'E').leader;
    if (l.hp > 0 && l.hp <= 20) {
      st.phase2 = true; st.gazeCount = 2;
      l.hp = Math.min(l.maxHp, l.hp + 8);
      log(st, 'O Basilisco troca de pele: recupera 8 de Vida e o Olhar passa a pegar duas unidades.');
      rec(st, { k: 'phase2', hp: l.hp });
    }
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
    modules: [], countdown: d.countdown || 0, ecoUsed: false, extraDeath: 0,
    rushThisTurn: false, resonated: false, destroyed: false, removed: false,
  };
  d.kw.forEach(k => { e.kw[k] = true; });
  return e;
}
function boardCount(st, side) { return S(st, side).board.filter(e => !isDead(e)).length; }
function summon(st, side, id) {
  const sd = S(st, side);
  if (boardCount(st, side) >= BOARD_MAX) { log(st, `Sem espaço: ${DEF[id].name} não entra.`); return null; }
  const e = makeEntity(st, side, id);
  sd.board.push(e);
  if (side === 'E' && st.enc.onSummon) st.enc.onSummon(st, e);
  return e;
}
function removeFromBoard(st, e) { const b = S(st, e.owner).board; const i = b.indexOf(e); if (i >= 0) b.splice(i, 1); }
function bounce(st, ref, costMod) {
  const e = ent(st, ref); if (!e) return;
  e.removed = true; removeFromBoard(st, e);
  e.modules.forEach(m => addToHand(st, e.owner, m));
  const inst = addToHand(st, e.owner, e.id, costMod);
  log(st, `${e.name} volta para a mão.`);
  return inst;
}
function attachModule(st, e, modId) {
  DEF[modId].attach(e); e.modules.push(modId);
  log(st, `${DEF[modId].name} acoplado a ${e.name}.`);
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
  log(st, `Ritual ativado: ${e.name}.`);
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
  log(st, `${e.name} brota: vira ${ne.name}.`);
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
    if (sd.hand.length >= HAND_MAX) log(st, `Mão cheia: ${DEF[take.id].name} é queimada.`);
    else { sd.hand.push(take); log(st, `Prever: ${DEF[take.id].name} vai para a mão.`); }
  }
  st.pending = null;
  resolveDeaths(st); checkOver(st);
  return true;
}
function triggerTrap(st, owner, event, e) {
  const sd = S(st, owner);
  const id = event === 'attack' ? 'molas' : 'gas';
  const i = sd.traps.indexOf(id); if (i < 0) return;
  sd.traps.splice(i, 1);
  rec(st, { k: 'trap', c: id, on: uidOf(e) });
  if (id === 'molas') { log(st, `Armadilha de Molas! ${e.name} sofre 3 de dano.`); dmg(st, { t: 'e', uid: e.uid }, 3, src(owner, {})); }
  else { setImovel(st, e); log(st, `Gás Paralisante! ${e.name} fica Imóvel.`); draw(st, owner, 1); }
}

function resolveDeaths(st) {
  for (let guard = 0; guard < 100; guard++) {
    const dead = [];
    ['P', 'E'].forEach(s => S(st, s).board.forEach(e => { if (e.kind !== 'ritual' && (e.destroyed || e.hp <= 0)) dead.push(e); }));
    if (!dead.length) break;
    dead.forEach(e => removeFromBoard(st, e));
    dead.forEach(e => {
      const sd = S(st, e.owner); const d = DEF[e.id];
      log(st, `${e.name} ${e.kind === 'structure' ? 'é destruída' : 'morre'}.`);
      rec(st, { k: 'die', u: uidOf(e), o: e.owner });
      e.modules.forEach(m => { addToHand(st, e.owner, m); });
      if (e.kind === 'structure' && d.onDestroyed) d.onDestroyed(st, e);
      if (e.kind === 'unit') {
        (sd.deadUnits = sd.deadUnits || []).push(e.id);
        const times = 1 + (e.extraDeath || 0);
        if (d.onDeath) for (let k = 0; k < times; k++) d.onDeath(st, e);
        if (e.kw.eco && !e.ecoUsed) sd.ecoReturns.push(e.id);
        sd.board.forEach(o => { if (!isDead(o) && DEF[o.id].onFriendlyDeath) DEF[o.id].onFriendlyDeath(st, o, e); });
      }
    });
    if (checkOver(st)) break;
  }
}
function checkOver(st) {
  if (st.over) return true;
  const p = S(st, 'P').leader.hp, e = S(st, 'E').leader.hp;
  if (p <= 0) { st.over = 'E'; log(st, 'Você caiu na dungeon.'); rec(st, { k: 'over', win: 'E', turns: [S(st, 'P').turnCount, S(st, 'E').turnCount], hp: [p, e] }); return true; }
  if (e <= 0) { st.over = 'P'; log(st, `${S(st, 'E').leader.name} foi derrotado.`); rec(st, { k: 'over', win: 'P', turns: [S(st, 'P').turnCount, S(st, 'E').turnCount], hp: [p, e] }); return true; }
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
  if (!inst) return { ok: false, reason: 'Carta inválida.' };
  if (st.over || st.pending || st.turnSide !== side) return { ok: false, reason: 'Não é a sua vez.' };
  const d = DEF[inst.id];
  const pos = compassoPos(st, side);
  if (d.exigeCompasso && d.exigeCompasso !== pos && !hasRegente(st, side)) return { ok: false, reason: `Só pode ser a ${d.exigeCompasso}ª carta do Compasso (agora é a ${pos}ª).` };
  if (d.playable && !d.playable(st, side)) return { ok: false, reason: 'Vida baixa demais para isso.' };
  const cost = getCost(st, side, inst);
  const canMana = sd.mana >= cost;
  const canLife = !!d.sangria && sd.leader.hp > d.sangria;
  if (!canMana && !canLife) return { ok: false, reason: 'Mana insuficiente.' };
  if (['unit', 'structure', 'ritual'].includes(d.type)) {
    const n = boardCount(st, side) + (d.atraso ? sd.delayed.length : 0);
    if (n >= BOARD_MAX) return { ok: false, reason: 'Campo cheio.' };
  }
  if (d.type === 'trap' && sd.traps.length >= TRAP_MAX) return { ok: false, reason: 'Limite de 3 Armadilhas.' };
  const spec = d.target ? d.target(st, side) : null;
  const targets = spec ? validTargets(st, side, spec, d.type === 'spell') : [];
  if (spec && d.targetRequired && !targets.length) return { ok: false, reason: 'Sem alvo válido.' };
  const canAdiantar = !!d.adiantar && sd.mana >= cost + d.adiantar;
  return { ok: true, cost, canMana, canLife, canAdiantar, spec, targets, pos };
}
function playCard(st, side, idx, opts) {
  opts = opts || {};
  const chk = canPlay(st, side, idx); if (!chk.ok) return chk;
  const sd = S(st, side); const inst = sd.hand[idx]; const d = DEF[inst.id];
  let target = opts.target || null;
  if (chk.spec && chk.targets.length) {
    if (!target || !chk.targets.some(r => sameRef(r, target))) return { ok: false, reason: 'Escolha um alvo.' };
  } else target = null;
  let payLife = !!opts.payLife && chk.canLife;
  if (!chk.canMana) payLife = true;
  const adiantar = !!opts.adiantar && chk.canAdiantar && !payLife;
  const tgtOut = refOut(st, target);
  sd.hand.splice(idx, 1);
  if (payLife) sd.leader.hp -= d.sangria; else sd.mana -= chk.cost + (adiantar ? d.adiantar : 0);
  const pos = compassoPos(st, side); sd.cardsPlayedThisTurn++;
  log(st, `${sd.leader.short} joga ${d.name}${payLife ? ` pagando ${d.sangria} de vida` : ''}${adiantar ? ', Adiantada' : ''}.`);
  rec(st, { k: 'play', s: side, c: inst.id, u: inst.uid, cost: payLife ? 0 : chk.cost + (adiantar ? d.adiantar : 0), life: payLife ? d.sangria : 0, adi: adiantar ? 1 : 0, pos, tgt: tgtOut, mana: sd.mana, car: inst.cargas || 0 });
  const ctx = { target, pos, inst, ent: null };
  if (d.type === 'unit') {
    if (d.atraso) { sd.delayed.push(inst.id); log(st, `${d.name} chega no próximo turno.`); }
    else {
      const e = summon(st, side, inst.id); ctx.ent = e;
      if (e && (adiantar || inst.acelerar)) e.kw.investida = true;
      if (e && side === 'E') triggerTrap(st, 'P', 'play', e);
      if (e && d.onPlay) d.onPlay(st, side, ctx);
    }
  } else if (d.type === 'structure' || d.type === 'ritual') {
    const e = summon(st, side, inst.id); ctx.ent = e;
    if (e && d.onPlay) d.onPlay(st, side, ctx);
  } else if (d.type === 'weapon') {
    sd.weapon = { id: d.id, name: d.name, atk: d.atk, dur: d.hp, letal: !!d.letal };
    if (d.onPlay) d.onPlay(st, side, ctx);
  } else if (d.type === 'trap') {
    sd.traps.push(inst.id);
  } else if (d.type === 'spell') {
    sd.spellsCastThisTurn++;
    if (d.module) { const e = ent(st, target); if (e) attachModule(st, e, inst.id); }
    else if (d.onPlay) d.onPlay(st, side, ctx);
    charge(st, side, 1);
    sd.lastSpell = inst.id;
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
  rec(st, { k: 'atk', s: side, a: uidOf(a), as: [getAtk(st, a), a.hp], tgt: refOut(st, ref), ts: statOf(st, ref), rev: hasKw(a, 'emboscada') ? 1 : 0 });
  if (side === 'E') triggerTrap(st, 'P', 'attack', a);
  if (isDead(a)) { resolveDeaths(st); return true; }
  const revealing = hasKw(a, 'emboscada');
  if (revealing) {
    a.kw.emboscada = false; a.tempKw.emboscada = false;
    reveal(st, a);
    const tt = ref.t === 'e' ? ent(st, ref) : null;
    if (isDead(a) || (ref.t === 'e' && (!tt || isDead(tt)))) { resolveDeaths(st); checkOver(st); return true; }
  }
  a.modules.forEach(m => { if (DEF[m].onHostAttack) DEF[m].onHostAttack(st, a, ref); });
  if (ref.t === 'e') { const t0 = ent(st, ref); if (!t0 || isDead(t0)) { resolveDeaths(st); checkOver(st); return true; } }
  const aAtk = getAtk(st, a);
  const sc = src(side, { letal: hasKw(a, 'letal'), dreno: hasKw(a, 'dreno') });
  if (ref.t === 'l') {
    log(st, `${a.name} ataca ${S(st, ref.side).leader.name} (${aAtk}).`);
    dmg(st, ref, aAtk, sc);
  } else {
    const t = ent(st, ref);
    const tAtk = t.kind === 'unit' ? getAtk(st, t) : 0;
    const tsc = src(t.owner, { letal: hasKw(t, 'letal'), dreno: hasKw(t, 'dreno') });
    log(st, `${a.name} ataca ${t.name}.`);
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
  rec(st, { k: 'hero', s: side, w: w.id, wa: [w.atk, w.dur], tgt: refOut(st, ref), ts: statOf(st, ref) });
  if (DEF[w.id].onWeaponAttack) DEF[w.id].onWeaponAttack(st, side);
  const sc = src(side, { letal: w.letal });
  if (ref.t === 'l') { log(st, `Você ataca ${S(st, ref.side).leader.name} com ${w.name} (${w.atk}).`); dmg(st, ref, w.atk, sc); }
  else {
    const t = ent(st, ref);
    const tAtk = t.kind === 'unit' ? getAtk(st, t) : 0;
    log(st, `Você ataca ${t.name} com ${w.name}.`);
    dmg(st, ref, w.atk, sc);
    if (tAtk > 0) dmg(st, { t: 'l', side }, tAtk, src(t.owner, { dreno: hasKw(t, 'dreno') }));
  }
  w.dur -= 1;
  if (w.dur <= 0) { log(st, `${w.name} se quebra.`); sd.weapon = null; }
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
  sd.resonance.points -= 1; sd.resonance.used = true;
  log(st, `${e.name} evolui: +2/+2.`);
  rec(st, { k: 'res', s: side, u: uidOf(e) });
  const d = DEF[e.id]; if (d.onResonate) d.onResonate(st, e);
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
  log(st, `Turno ${sd.turnCount}: ${sd.leader.name}.`);
  sd.delayed.splice(0).forEach(id => {
    const e = summon(st, side, id);
    if (e) { log(st, `${e.name} aparece.`); if (DEF[id].onAppear) DEF[id].onAppear(st, e); }
  });
  const est = sd.board.some(x => x.id === 'estandarte' && !isDead(x));
  sd.ecoReturns.splice(0).forEach(id => {
    const e = summon(st, side, id);
    if (e) { e.kw.eco = false; e.ecoUsed = true; const v = est ? 2 : 1; e.hp = v; e.maxHp = v; sd.ecoReturnedThisTurn = true; log(st, `${e.name} volta por Eco.`); }
  });
  sd.board.slice().forEach(e => { if (!isDead(e) && DEF[e.id].brotar) brotar(st, e); });
  sd.board.slice().forEach(e => { if (e.kind === 'ritual' && !e.removed) tickRitual(st, e, 1); });
  sd.board.slice().forEach(e => { if (!isDead(e) && DEF[e.id].onStartTurn) DEF[e.id].onStartTurn(st, e); });
  if (sd.boomerang) { const n = sd.boomerang; sd.boomerang = 0; if (aliveUnits(st, side).some(x => x.tags.includes('Felino'))) for (let i = 0; i < n; i++) { addToHand(st, side, 'bumerangue'); log(st, 'O Bumerangue volta.'); } }
  if (side === 'E' && st.enc.onStartTurn) st.enc.onStartTurn(st);
  draw(st, side, 1);
  resolveDeaths(st); checkOver(st);
  snap(st, side);
}
function endTurn(st) {
  if (st.over || st.pending) return false;
  const side = st.turnSide; const sd = S(st, side);
  rec(st, { k: 'endturn', s: side, n: sd.turnCount, manaLeft: sd.mana, hand: sd.hand.length });
  sd.board.slice().forEach(e => { if (!isDead(e) && DEF[e.id].onEndTurn) DEF[e.id].onEndTurn(st, e); });
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
  st.sides.P = mk('P', 'Você', 'Você', 30); st.sides.P.resonance.points = 3;
  if (opts.hp) st.sides.P.leader.hp = Math.min(30, opts.hp);
  if (opts.extraMana) st.sides.P.maxMana = opts.extraMana;
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
  log(st, `${enc.name}. Regra: ${enc.rule}`);
  return st;
}
function nextMulliganSize(st) { return Math.max(0, st.handSize - st.mulligans); }
function mulligan(st) {
  if (!st.pending || st.pending.kind !== 'mulligan') return false;
  const sd = S(st, 'P');
  if (!sd.hand.length) return false;
  const size = nextMulliganSize(st);
  st.mulligans += 1;
  sd.deck.push(...sd.hand.splice(0)); shuffle(st, sd.deck);
  draw(st, 'P', size);
  log(st, `Mulligan ${st.mulligans}: nova mão com ${size} carta${size === 1 ? '' : 's'}.`);
  rec(st, { k: 'mull', n: st.mulligans, size, hand: sd.hand.map(i => i.id) });
  return true;
}
function keepHand(st) {
  if (!st.pending || st.pending.kind !== 'mulligan') return false;
  st.pending = null;
  rec(st, { k: 'keep', mulls: st.mulligans, hand: S(st, 'P').hand.map(i => i.id) });
  startTurn(st, 'P');
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

const Engine = {
  DEF, DISC, ENC, NEUTRAL_STARTER, BOARD_MAX, HAND_MAX,
  newGame, mulligan, keepHand, nextMulliganSize, canPlay, playCard, attack, heroAttack, canHeroAttack, resonate, canResonate, endTurn,
  resolvePrever, enemyStep, validTargets, attackTargets, canAttack, getCost, getAtk, hasKw, isDead,
  compassoPos, ent, S, sameRef, despertar,
};
if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
else root.Engine = Engine;
})(typeof window !== 'undefined' ? window : globalThis);
