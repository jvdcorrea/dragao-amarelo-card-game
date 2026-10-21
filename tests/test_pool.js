const E = require('../src/engine.js'); const R = require('../src/run.js');
const src = require('fs').readFileSync(__dirname + '/test.js', 'utf8');
const botSrc = src.slice(src.indexOf('function pick'), src.indexOf('const discs'));
eval(botSrc);
let errors = 0, games = 0; const used = {};
for (const d of R.DISCS) for (let k = 0; k < 60; k++) {
  const rng = (() => { let a = 777 + k * 13 + R.DISCS.indexOf(d) * 101; return () => { a = (a * 1103515245 + 12345) & 0x7fffffff; return a / 0x7fffffff; }; })();
  const pool = R.poolOf(d).concat(R.poolOf('neutra'));
  const deck = []; const cnt = {};
  while (deck.length < 30) { const id = pool[Math.floor(rng() * pool.length)]; if ((cnt[id] || 0) < 2) { cnt[id] = (cnt[id] || 0) + 1; deck.push(id); used[id] = 1; } }
  const encs = Object.keys(E.ENC); const en = encs[k % encs.length];
  let st;
  try {
    st = E.newGame(d, en, 9000 + k, { deck, hp: 20 + (k % 11), extraHand: k % 2, extraMana: k % 3 === 0 ? 1 : 0, encBonus: k % 4 });
    E.keepHand(st);
    let g = 0;
    while (!st.over && g++ < 200) {
      if (st.turnSide === 'P') botTurn(st);
      else { let s = 0; while (E.enemyStep(st) && s++ < 60) invariants(st); if (!st.over) E.endTurn(st); }
      invariants(st);
    }
    if (!st.over) throw new Error('não terminou');
  } catch (e) { errors++; console.log('ERRO', d, en, e.stack.split('\n').slice(0, 3).join(' | ')); if (st) console.log(st.log.slice(-6).join(' / ')); }
  games++;
}
console.log('partidas', games, 'erros', errors, 'cartas cobertas', Object.keys(used).length, 'de', Object.keys(R.RARITY).length);
