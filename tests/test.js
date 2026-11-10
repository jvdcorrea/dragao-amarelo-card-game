const E = require('../src/engine.js');

function pick(st, a) { return a.length ? a[Math.floor(st.rng() * a.length)] : null; }

function botTurn(st) {
  let safety = 0;
  while (st.turnSide === 'P' && !st.over && safety++ < 80) {
    if (st.pending) { E.resolvePrever(st, pick(st, st.pending.uids)); continue; }
    const sd = E.S(st, 'P');
    if (E.canResonate(st, 'P') && st.rng() < 0.6) {
      const us = sd.board.filter(e => e.kind === 'unit' && !E.isDead(e));
      if (us.length) { E.resonate(st, 'P', pick(st, us).uid); continue; }
    }
    const playable = sd.hand.map((x, i) => i).filter(i => E.canPlay(st, 'P', i).ok);
    if (playable.length && st.rng() < 0.85) {
      const i = pick(st, playable); const chk = E.canPlay(st, 'P', i);
      const t = chk.targets.length ? pick(st, chk.targets) : null;
      const r = E.playCard(st, 'P', i, { target: t, payLife: chk.canLife && st.rng() < 0.3, adiantar: chk.canAdiantar && st.rng() < 0.5 });
      if (!r.ok) throw new Error('playCard falhou: ' + r.reason + ' ' + sd.hand[i]?.id);
      continue;
    }
    const atk = sd.board.filter(e => E.canAttack(st, e));
    if (atk.length) {
      const a = atk[0]; const ts = E.attackTargets(st, 'P', a);
      if (ts.length) { if (!E.attack(st, 'P', a.uid, pick(st, ts))) throw new Error('ataque falhou'); }
      else a.attacked = true;
      continue;
    }
    if (E.canHeroAttack(st, 'P')) {
      const ts = E.attackTargets(st, 'P', null);
      if (ts.length) { E.heroAttack(st, 'P', pick(st, ts)); continue; }
    }
    break;
  }
  if (!st.over && st.turnSide === 'P' && !st.pending) E.endTurn(st);
}

function invariants(st) {
  for (const s of ['P', 'E']) {
    const sd = E.S(st, s);
    if (sd.board.length > E.BOARD_MAX) throw new Error('campo > 7 em ' + s);
    if (sd.hand.length > E.HAND_MAX) throw new Error('mão > 10 em ' + s);
    if (!Number.isFinite(sd.leader.hp)) throw new Error('vida inválida');
    sd.board.forEach(e => { if (!Number.isFinite(e.atk) || !Number.isFinite(e.hp)) throw new Error('stats inválidos ' + e.id); });
  }
}
// A fila de apresentação (P94) precisa contar toda mudança de vida dos líderes: dano, cura e perda de vida.
function fxCheck(st) {
  const evs = st.fxq.splice(0);
  for (const s of ['P', 'E']) {
    const d = evs.reduce((n, x) => (x.ref && x.ref.t === 'l' && x.ref.side === s ? n + (x.k === 'heal' ? x.n : x.k === 'dmg' ? -x.n : 0) : n), 0);
    const hp = E.S(st, s).leader.hp;
    if (st.fxHp[s] + d !== hp) throw new Error(`fila de efeitos não bate com a vida de ${s}: ${st.fxHp[s]} ${d >= 0 ? '+' : ''}${d}, mas a vida é ${hp}`);
    st.fxHp[s] = hp;
  }
}

const discs = Object.keys(E.DISC), encs = Object.keys(E.ENC);
const results = {}; let games = 0, errors = 0;
for (const d of discs) for (const en of encs) {
  let wins = 0, turns = 0;
  for (let k = 0; k < 25; k++) {
    const seed = 1000 + k * 7919 + discs.indexOf(d) * 31 + encs.indexOf(en) * 977;
    let st;
    try {
      st = E.newGame(d, en, seed);
      st.fxq = []; st.fxHp = { P: E.S(st, 'P').leader.hp, E: E.S(st, 'E').leader.hp };
      const mm = Math.floor(st.rng() * 4); for (let q = 0; q < mm; q++) E.mulligan(st);
      E.keepHand(st);
      let guard = 0;
      while (!st.over && guard++ < 200) {
        if (st.turnSide === 'P') botTurn(st);
        else {
          let steps = 0;
          while (E.enemyStep(st) && steps++ < 60) { invariants(st); fxCheck(st); }
          if (steps >= 60) throw new Error('IA em loop');
          if (!st.over) E.endTurn(st);
        }
        invariants(st); fxCheck(st);
      }
      if (!st.over) throw new Error('partida não terminou');
      if (st.over === 'P') wins++;
      turns += E.S(st, 'P').turnCount;
    } catch (err) {
      errors++;
      console.log(`ERRO ${d} x ${en} seed ${seed}: ${err.stack.split('\n').slice(0, 3).join(' | ')}`);
      if (st) console.log(st.log.slice(-8).join('\n'));
    }
    games++;
  }
  results[`${d} x ${en}`] = `${wins}/25 vitórias, ~${(turns / 25).toFixed(1)} turnos`;
}
console.log(results);

// Ataque total: vida do oponente, ou o Guarda visível mais à esquerda; Avanço recém-jogado sem Guarda fica parado.
(function testeAtaqueTotal() {
  const prep = (meus, deles) => {
    const st = E.newGame('draconic', 'bocas', 7); E.keepHand(st); st.turnSide = 'P';
    ['P', 'E'].forEach(s => { E.S(st, s).board = []; });
    const p = E.S(st, 'P'), t = p.turnCount;
    const m = meus.map(([id, pronto]) => { const e = E.summon(st, 'P', id); e.summonedTurn = pronto ? t - 1 : t; return e; });
    const d = deles.map(id => E.summon(st, 'E', id));
    return { st, m, d };
  };
  const casos = [];
  const espera = (nome, ok) => { casos.push(nome); if (!ok) { errors++; console.log('ERRO ataque total: ' + nome); } };
  let c = prep([['besouro', true]], ['morcego']);
  let n = E.totalAttackNext(c.st, 'P');
  espera('sem Guarda vai na vida', n && n.ref.t === 'l' && n.ref.side === 'E');
  c = prep([['besouro', true]], ['morcego', 'besouro', 'h_vigia']);
  n = E.totalAttackNext(c.st, 'P');
  espera('Guarda mais à esquerda', n && n.ref.t === 'e' && n.ref.uid === c.d[1].uid);
  c = prep([['besouro', true]], ['lagarto']); c.d[0].kw.guarda = true;
  n = E.totalAttackNext(c.st, 'P');
  espera('Guarda em Emboscada não é alvo', n && n.ref.t === 'l');
  c = prep([['morcego', false]], ['morcego']);
  espera('Avanço recém-jogado sem Guarda fica parado', E.totalAttackNext(c.st, 'P') === null);
  c = prep([['morcego', false]], ['besouro']);
  n = E.totalAttackNext(c.st, 'P');
  espera('Avanço recém-jogado ataca o Guarda', n && n.ref.uid === c.d[0].uid);
  c = prep([['morcego', false], ['besouro', true], ['h_vigia', true]], ['morcego']);
  n = E.totalAttackNext(c.st, 'P');
  espera('pula quem não alcança e segue para a direita', n && n.uid === c.m[1].uid && n.ref.t === 'l');
  // Sequência inteira: termina, cada unidade ataca no máximo uma vez, e o Guarda morto abre caminho para a vida.
  c = prep([['lanceiro', true], ['besouro', true], ['h_vigia', true]], ['morcego', 'acolito']);
  const vida0 = E.S(c.st, 'E').leader.hp, atacantes = [];
  for (let i = 0; i < 20 && (n = E.totalAttackNext(c.st, 'P')); i++) { atacantes.push(n.uid); if (!E.attack(c.st, 'P', n.uid, n.ref)) break; }
  espera('sequência termina', !E.totalAttackNext(c.st, 'P'));
  espera('cada unidade ataca uma vez', new Set(atacantes).size === atacantes.length);
  espera('Guarda morto abre a vida', E.isDead(c.d[1]) || !E.S(c.st, 'E').board.includes(c.d[1]));
  espera('vida levou o resto', vida0 - E.S(c.st, 'E').leader.hp === 2);
  console.log(`ataque total: ${casos.length} casos`);
})();
console.log(`partidas: ${games}, erros: ${errors}`);
