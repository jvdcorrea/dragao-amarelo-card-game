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

const discs = Object.keys(E.DISC), encs = Object.keys(E.ENC);
const results = {}; let games = 0, errors = 0;
for (const d of discs) for (const en of encs) {
  let wins = 0, turns = 0;
  for (let k = 0; k < 25; k++) {
    const seed = 1000 + k * 7919 + discs.indexOf(d) * 31 + encs.indexOf(en) * 977;
    let st;
    try {
      st = E.newGame(d, en, seed);
      const mm = Math.floor(st.rng() * 4); for (let q = 0; q < mm; q++) E.mulligan(st);
      E.keepHand(st);
      let guard = 0;
      while (!st.over && guard++ < 200) {
        if (st.turnSide === 'P') botTurn(st);
        else {
          let steps = 0;
          while (E.enemyStep(st) && steps++ < 60) invariants(st);
          if (steps >= 60) throw new Error('IA em loop');
          if (!st.over) E.endTurn(st);
        }
        invariants(st);
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
console.log(`partidas: ${games}, erros: ${errors}`);
