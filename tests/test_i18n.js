/* Idiomas (P101). Confere o dicionário inglês contra o código e joga partidas em inglês.
   1. Todo T('...') e T`...` do código tem tradução; avisa as traduções que sobraram e marcadores {0} que não batem.
   2. Partidas simuladas em inglês não quebram, e todo texto que o motor pede ao T tem tradução. */
'use strict';
const fs = require('fs'), path = require('path');
const { lex } = require('../tools/i18n/lexer.js');
const RAIZ = path.resolve(__dirname, '..');
const I18N = require('../src/i18n.js');
const vm = require('vm');
const doArquivo = {}; // chaves de cada arquivo de idioma, para separar o dicionário (en.js) das tabelas
for (const f of fs.readdirSync(path.join(RAIZ, 'src/lang')).sort()) {
  const src = fs.readFileSync(path.join(RAIZ, 'src/lang', f), 'utf8');
  vm.runInNewContext(src, { I18N: { add: (l, d) => { doArquivo[f] = Object.keys(d); }, ajuste() {}, regras: {} } });
  require(path.join(RAIZ, 'src/lang', f));
}
const EN = I18N.dic('en');

// 1. chaves do código
const usadas = new Map();
for (const arq of ['engine.js', 'run.js', 'ui.js', 'fx.js', 'feel.js', 'audio.js']) {
  const src = fs.readFileSync(path.join(RAIZ, 'src', arq), 'utf8');
  const { strs, tpls } = lex(src);
  const ehT = i => src[i] === 'T' && !/[\w$.]/.test(src[i - 1] || '');
  const onde = i => `${arq}:${src.slice(0, i).split('\n').length}`;
  for (const s of strs) if (src.slice(s.ini - 2, s.ini) === 'T(' && ehT(s.ini - 2) && /^\s*[),]/.test(src.slice(s.fim))) {
    const k = Function('return ' + src.slice(s.ini, s.fim))(); if (!usadas.has(k)) usadas.set(k, onde(s.ini));
  }
  for (const t of tpls) if (ehT(t.ini - 1)) {
    let k = '', n = 0;
    for (const p of t.partes) k += p.tipo === 'txt' ? Function('return `' + src.slice(p.ini, p.fim) + '`')() : '{' + n++ + '}';
    if (!usadas.has(k)) usadas.set(k, onde(t.ini));
  }
}
const faltam = [...usadas].filter(([k]) => EN[k] === undefined);
const marcas = s => (s.match(/\{\d+\}/g) || []).sort().join();
const tortas = [...usadas].filter(([k]) => EN[k] !== undefined && marcas(EN[k]).split(',').some(m => m && !marcas(k).includes(m)));
// as chaves dinâmicas (T(x)) ficam em en_tabelas.js e não entram nesta conta
const sobram = (doArquivo['en.js'] || []).filter(k => !usadas.has(k));
console.log(`chaves no código: ${usadas.size}; no dicionário inglês: ${Object.keys(EN).length}`);
if (faltam.length) { console.log(`\nSEM TRADUÇÃO (${faltam.length}):`); faltam.forEach(([k, o]) => console.log(`  ${o}  ${JSON.stringify(k)}`)); }
if (tortas.length) { console.log(`\nMARCADOR QUE NÃO EXISTE NO ORIGINAL (${tortas.length}):`); tortas.forEach(([k, o]) => console.log(`  ${o}  ${JSON.stringify(k)} → ${JSON.stringify(EN[k])}`)); }

// 2. partidas em inglês
I18N.usar('en');
const E = require('../src/engine.js'); require('../src/run.js');
const pick = (st, a) => (a.length ? a[Math.floor(st.rng() * a.length)] : null);
function botTurn(st) {
  for (let n = 0; st.turnSide === 'P' && !st.over && n < 80; n++) {
    if (st.pending) { E.resolvePrever(st, pick(st, st.pending.uids)); continue; }
    const sd = E.S(st, 'P');
    if (E.canResonate(st, 'P') && st.rng() < 0.6) { const us = sd.board.filter(e => e.kind === 'unit' && !E.isDead(e)); if (us.length) { E.resonate(st, 'P', pick(st, us).uid); continue; } }
    const ok = sd.hand.map((x, i) => i).filter(i => E.canPlay(st, 'P', i).ok);
    if (ok.length && st.rng() < 0.85) { const i = pick(st, ok); const c = E.canPlay(st, 'P', i); E.playCard(st, 'P', i, { target: c.targets.length ? pick(st, c.targets) : null, payLife: c.canLife && st.rng() < 0.3, adiantar: c.canAdiantar && st.rng() < 0.5 }); continue; }
    const atk = sd.board.filter(e => E.canAttack(st, e));
    if (atk.length) { const ts = E.attackTargets(st, 'P', atk[0]); if (ts.length) E.attack(st, 'P', atk[0].uid, pick(st, ts)); else atk[0].attacked = true; continue; }
    if (E.canHeroAttack(st, 'P')) { const ts = E.attackTargets(st, 'P', null); if (ts.length) { E.heroAttack(st, 'P', pick(st, ts)); continue; } }
    break;
  }
  if (!st.over && st.turnSide === 'P' && !st.pending) E.endTurn(st);
}
let jogos = 0, erros = 0; const pt = [];
const PT = /\b(você|não|com|dano|unidade|carta|turno|vida|joga|ataca|ganha|perde)\b/i;
for (const d of Object.keys(E.DISC)) for (const en of Object.keys(E.ENC)) for (let k = 0; k < 3; k++) {
  try {
    const st = E.newGame(d, en, 500 + k * 131 + jogos);
    E.mulligan(st); E.keepHand(st);
    for (let g = 0; !st.over && g < 200; g++) {
      if (st.turnSide === 'P') botTurn(st);
      else { let s = 0; while (E.enemyStep(st) && s++ < 60); if (!st.over) E.endTurn(st); }
    }
    st.log.forEach(l => { if (PT.test(l) && pt.length < 15) pt.push(`${en}: ${l}`); });
    jogos++;
  } catch (e) { erros++; if (erros < 5) console.log('ERRO', d, en, e.message); }
}
console.log(`\npartidas em inglês: ${jogos}, erros: ${erros}`);
if (I18N.faltando.size) { console.log(`\nTEXTO DO MOTOR SEM TRADUÇÃO (${I18N.faltando.size}):`); [...I18N.faltando].slice(0, 40).forEach(k => console.log('  ' + JSON.stringify(k))); }
if (pt.length) { console.log('\nREGISTRO COM CARA DE PORTUGUÊS:'); pt.forEach(l => console.log('  ' + l)); }
if (sobram.length) { console.log(`\nSOBRANDO NO en.js (${sobram.length}): nenhum T('...') do código usa estas chaves.`); sobram.forEach(k => console.log('  ' + JSON.stringify(k))); }
process.exitCode = faltam.length || tortas.length || erros || I18N.faltando.size ? 1 : 0;
