/* Dragão Amarelo: idiomas (P101).
   O texto em português fica no código e é a própria chave; cada idioma traz um dicionário { 'texto em português': 'tradução' }.
   T`Dia ${d} de ouro` e T('Dia {0} de ouro', d) procuram a chave 'Dia {0} de ouro'. Sem tradução, sai o português.
   O idioma vem das preferências (dragao-amarelo-prefs-v1); sem escolha, é o português. Trocar recarrega a página. */
(function (root) {
'use strict';
const IDIOMAS = { pt: 'Português', en: 'English' };
const DIC = {};
const faltando = new Set();
function inicial() {
  try { const p = JSON.parse(root.localStorage.getItem('dragao-amarelo-prefs-v1') || '{}'); if (IDIOMAS[p.lang]) return p.lang; } catch (e) { /* sem armazenamento */ }
  return 'pt';
}
let lang = typeof root.localStorage !== 'undefined' ? inicial() : 'pt';
const chaves = new WeakMap();
function chaveDe(partes) {
  let k = chaves.get(partes);
  if (k === undefined) { k = partes[0]; for (let i = 1; i < partes.length; i++) k += '{' + (i - 1) + '}' + partes[i]; chaves.set(partes, k); }
  return k;
}
function preenche(s, vals) { return vals.length ? s.replace(/\{(\d+)\}/g, (m, i) => (+i < vals.length ? String(vals[+i]) : m)) : s; }
function busca(k) {
  if (lang === 'pt') return k;
  const d = DIC[lang]; const v = d && d[k];
  if (v === undefined) { faltando.add(k); return k; }
  return v;
}
// Cada idioma pode ajustar a frase pronta (no inglês, “You plays” vira “You play”).
const ajustes = {};
function T(s, ...vals) {
  const r = preenche(busca(Array.isArray(s) && s.raw ? chaveDe(s) : String(s)), vals);
  return ajustes[lang] ? ajustes[lang](r) : r;
}
const I18N = {
  T, IDIOMAS, faltando,
  get lang() { return lang; },
  usar(l) { if (IDIOMAS[l]) lang = l; },
  add(l, d) { DIC[l] = Object.assign(DIC[l] || {}, d); },
  ajuste(l, f) { ajustes[l] = f; },
  // regras de texto por idioma que não cabem no dicionário: palavras-chave em destaque (kw, kwSo) e trocas do social (social). Veja o ui.js.
  regras: {},
  dic: l => DIC[l] || {},
};
root.I18N = I18N; root.T = T;
if (typeof module !== 'undefined' && module.exports) module.exports = I18N;
})(typeof window !== 'undefined' ? window : globalThis);
