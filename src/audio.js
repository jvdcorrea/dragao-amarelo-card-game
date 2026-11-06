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
function config(p) { try { config_(p); } catch (e) { console.warn('Som:', e); } }
function config_(p) {
  const m0 = cfg.musica;
  ['efeitos', 'musica', 'mudo'].forEach(k => { if (p[k] !== undefined) cfg[k] = p[k]; });
  if (ok) Howler.mute(!!cfg.mudo);
  if (ok && atual && atual.id !== null && cfg.musica !== m0) atual.howl.volume(volMusica(atual), atual.id);
}
// O controle vai de 0 a 1; elevar ao quadrado espalha a mudança de volume percebida pelo curso todo.
function ganho(v) { return v * v; }
function tocar(nome) { try { tocar_(nome); } catch (e) { console.warn('Som:', e); } }
function tocar_(nome) {
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

/* ---------- Música ---------- */
// tocar, musica e config passam por try/catch (nas versões sem _): erro de áudio do navegador nunca para o jogo.
// Uma faixa em loop por estado. Trocar de estado esmaece a que sai e cresce a que entra; a que sai fica em pausa
// (ou para, sem FEEL.musica.retomar). As faixas só carregam quando o estado aparece pela primeira vez.
const faixas = {};   // estado -> { estado, howl, id, base, src, fmt }
let atual = null;
function volMusica(f) { return f.base * ganho(cfg.musica); }
function criarFaixa(f) {
  const fmts = FEEL.audio.formatos;
  f.howl = new Howl({
    src: [f.src + '.' + fmts[f.fmt]], html5, loop: true, preload: true, volume: 0,
    onloaderror: () => { f.howl.unload(); f.id = null; if (++f.fmt < fmts.length) { criarFaixa(f); if (atual === f) entrar(f); } },
    // Antes do primeiro clique o navegador não deixa tocar; o Howler avisa quando liberar.
    onplayerror: () => f.howl.once('unlock', () => { if (atual === f) entrar(f); }),
  });
}
function faixaDe(estado) {
  if (faixas[estado]) return faixas[estado];
  const F = FEEL.musica.faixas[estado]; if (!F) return null;
  const n = 1 + Math.floor(Math.random() * F.arqs);
  const f = { estado, id: null, fmt: 0, base: F.vol === undefined ? 1 : F.vol, src: `${FEEL.audio.pasta}music/${estado}_${n}` };
  criarFaixa(f);
  return (faixas[estado] = f);
}
function entrar(f) {
  const h = f.howl;
  const crescer = () => { if (atual === f && f.id !== null) h.fade(h.volume(f.id), volMusica(f), FEEL.musica.fadeMs, f.id); };
  if (f.id !== null && h.playing(f.id)) { crescer(); return; }
  // O fade só pega depois que o som começou de fato (no áudio HTML5 o play é assíncrono e um fade antes dele se perde).
  h.once('play', crescer);
  f.id = f.id === null ? h.play() : h.play(f.id);
}
function sair(f) {
  if (!f || f.id === null) return;
  const h = f.howl, id = f.id;
  h.fade(h.volume(id), 0, FEEL.musica.fadeMs, id);
  h.once('fade', () => { if (atual !== f) { if (FEEL.musica.retomar) h.pause(id); else h.stop(id); } }, id);
}
// estado null ou desconhecido mantém o que está tocando.
function musica(estado) { try { musica_(estado); } catch (e) { console.warn('Som:', e); } }
function musica_(estado) {
  if (!ok || !estado || (atual && atual.estado === estado)) return;
  const f = faixaDe(estado); if (!f) return;
  const antes = atual; atual = f;
  sair(antes); entrar(f);
}

init();
return { tocar, musica, config, ativo: () => ok, estadoMusica: () => (atual ? atual.estado : null) };
})();
