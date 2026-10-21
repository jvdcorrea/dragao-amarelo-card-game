const E = require('../src/engine.js');
const prio = e => (e.id === 'broto_cog' || e.id === 'ninhada') ? 100 : (e.kind === 'structure' ? 60 : E.getAtk(st0, e) * 3 + e.hp);
let st0;
function bestRef(st, refs, side) {
  const ents = refs.filter(r => r.t === 'e').map(r => ({ r, e: E.ent(st, r) })).filter(x => x.e && x.e.owner !== side);
  ents.sort((a, b) => prio(b.e) - prio(a.e));
  return ents.length ? ents[0].r : refs.find(r => r.t === 'l') || refs[0];
}
function greedyTurn(st) {
  st0 = st; let safety = 0;
  while (st.turnSide === 'P' && !st.over && safety++ < 80) {
    const sd = E.S(st, 'P');
    if (st.pending) { E.resolvePrever(st, st.pending.uids[0]); continue; }
    if (E.canResonate(st, 'P')) { const us = sd.board.filter(e => e.kind === 'unit' && !E.isDead(e)).sort((a, b) => E.getAtk(st, b) - E.getAtk(st, a)); if (us.length) { E.resonate(st, 'P', us[0].uid); continue; } }
    const playable = sd.hand.map((x, i) => i).filter(i => { const c = E.canPlay(st, 'P', i); if (!c.ok) return false; const id = sd.hand[i].id; if (id === 'pacto' && sd.leader.hp < 12) return false; if (id === 'valsa') return c.targets.some(r => ['esqueleto', 'ovo'].includes(E.ent(st, r).id)); if (id === 'rebobinar') return false; return c.canMana || sd.leader.hp > 15; })
      .sort((a, b) => E.getCost(st, 'P', sd.hand[b]) - E.getCost(st, 'P', sd.hand[a]));
    if (playable.length) {
      const i = playable[0]; const c = E.canPlay(st, 'P', i); const id = sd.hand[i].id;
      let t = null;
      if (c.targets.length) {
        if (c.spec === 'friendlyUnit') { const own = c.targets.map(r => E.ent(st, r)); own.sort((a, b) => id === 'valsa' ? (['esqueleto','ovo'].includes(b.id) - ['esqueleto','ovo'].includes(a.id)) : E.getAtk(st, b) - E.getAtk(st, a)); t = { t: 'e', uid: own[0].uid }; }
        else if (c.spec === 'ownRitual') t = c.targets[0];
        else t = bestRef(st, c.targets, 'P');
      }
      E.playCard(st, 'P', i, { target: t, payLife: !c.canMana, adiantar: c.canAdiantar });
      continue;
    }
    const atk = sd.board.filter(e => E.canAttack(st, e));
    if (atk.length) {
      const a = atk[0]; const ts = E.attackTargets(st, 'P', a);
      const killable = ts.filter(r => r.t === 'e').map(r => E.ent(st, r)).filter(t => (E.hasKw(a, 'letal') && t.kind === 'unit') || E.getAtk(st, a) >= t.hp).filter(t => t.kind === 'structure' || E.getAtk(st, t) < a.hp || prio(t) >= 100);
      killable.sort((x, y) => prio(y) - prio(x));
      let t = killable.length ? { t: 'e', uid: killable[0].uid } : (ts.find(r => r.t === 'l') || ts[0]);
      if (t) E.attack(st, 'P', a.uid, t); else a.attacked = true;
      continue;
    }
    if (E.canHeroAttack(st, 'P')) { const ts = E.attackTargets(st, 'P', null); if (ts.length) { E.heroAttack(st, 'P', ts.find(r => r.t === 'l') || ts[0]); continue; } }
    break;
  }
  if (!st.over && st.turnSide === 'P' && !st.pending) E.endTurn(st);
}
const out = {};
for (const d of Object.keys(E.DISC)) { const row = []; for (const en of Object.keys(E.ENC)) {
  let w = 0, hpLeft = 0; const N = 40;
  for (let k = 0; k < N; k++) { const st = E.newGame(d, en, 5000 + k * 104729); E.keepHand(st); let g = 0;
    while (!st.over && g++ < 200) { if (st.turnSide === 'P') greedyTurn(st); else { let s = 0; while (E.enemyStep(st) && s++ < 60); if (!st.over) E.endTurn(st); } }
    if (st.over === 'P') { w++; hpLeft += E.S(st, 'P').leader.hp; } }
  row.push(`${en}: ${Math.round(100 * w / N)}%${w ? ` (vida ${Math.round(hpLeft / w)})` : ''}`); }
  out[d] = row.join(' | '); }
console.log(out);
