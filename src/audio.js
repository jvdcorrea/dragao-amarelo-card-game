/* Áudio (P94): canais de efeitos e música sobre o Howler, com volume por canal e mudo.
   Sem o Howler ou sem os arquivos, tudo vira silêncio e o jogo segue igual. */
const Som = (function () {
'use strict';
const ok = typeof Howl !== 'undefined' && typeof Howler !== 'undefined';
// Em file:// o Web Audio não consegue ler os arquivos; o áudio HTML5 consegue.
const html5 = typeof location !== 'undefined' && location.protocol === 'file:';
const cfg = Object.assign({}, FEEL.audio.padroes);
const banco = {};   // nome -> Howls que carregaram
const ultimo = {};  // nome -> índice da última variação tocada, para não repetir em seguida

// Tenta cada formato em ordem; o que não existir some do sorteio sem erro.
function carregar(nome, base, f) {
  const fmts = FEEL.audio.formatos;
  const h = new Howl({
    src: [base + '.' + fmts[f]], html5, preload: true,
    onload: () => banco[nome].push(h),
    onloaderror: () => { h.unload(); if (f + 1 < fmts.length) carregar(nome, base, f + 1); },
  });
}
function init() {
  if (!ok) return;
  Object.entries(FEEL.sons).forEach(([nome, s]) => {
    banco[nome] = [];
    for (let i = 1; i <= s.arqs; i++) carregar(nome, `${FEEL.audio.pasta}sfx/${nome}_${i}`, 0);
  });
}
function config(p) {
  ['efeitos', 'musica', 'mudo'].forEach(k => { if (p[k] !== undefined) cfg[k] = p[k]; });
  if (ok) Howler.mute(!!cfg.mudo);
}
// O controle vai de 0 a 1; elevar ao quadrado espalha a mudança de volume percebida pelo curso todo.
function ganho(v) { return v * v; }
function tocar(nome) {
  if (!ok || cfg.mudo || !cfg.efeitos) return;
  const s = FEEL.sons[nome], lista = banco[nome];
  if (!s || !lista || !lista.length) return;
  let i = Math.floor(Math.random() * lista.length);
  if (lista.length > 1 && i === ultimo[nome]) i = (i + 1 + Math.floor(Math.random() * (lista.length - 1))) % lista.length;
  ultimo[nome] = i;
  const h = lista[i];
  const id = h.play();
  h.volume((s.vol === undefined ? 1 : s.vol) * ganho(cfg.efeitos), id);
  const v = FEEL.audio.variacaoTom;
  if (v) h.rate(1 + (Math.random() * 2 - 1) * v, id);
}

init();
return { tocar, config, ativo: () => ok };
})();
