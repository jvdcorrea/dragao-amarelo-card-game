/* Camada de apresentação (P94). O motor deixa eventos em st.fxq; depois de cada desenho da batalha, Fx.flush lê a fila e reage.
   Nada aqui muda o estado da partida, e o motor não espera por nada daqui. */
const Fx = (function () {
'use strict';
function somDe(ev) {
  switch (ev.k) {
    case 'draw': case 'gain': return ev.s === 'P' ? 'comprar' : null;
    case 'mull': return 'embaralhar';
    case 'play': return 'jogar';
    case 'dmg': return ev.n >= FEEL.audio.forteApartir ? 'impacto_forte' : 'impacto';
    case 'escudo': case 'bloq': return 'bloqueio';
    case 'heal': return 'cura';
    case 'die': return 'morte';
  }
  return null;
}
function sons(evs) {
  const vezes = {};
  evs.forEach(ev => {
    const nome = somDe(ev); if (!nome) return;
    vezes[nome] = (vezes[nome] || 0) + 1;
    if (vezes[nome] > FEEL.audio.maxIguais) return;
    const ms = (FEEL.sons[nome].etapa || 0) * FEEL.audio.etapaMs;
    if (ms) setTimeout(() => Som.tocar(nome), ms); else Som.tocar(nome);
  });
}
function flush(st) {
  if (!st) return;
  // A fila nasce no primeiro desenho da partida: a mão inicial não toca nada.
  if (!st.fxq) { st.fxq = []; return; }
  const evs = st.fxq.splice(0);
  if (evs.length) sons(evs);
}
return { flush };
})();
