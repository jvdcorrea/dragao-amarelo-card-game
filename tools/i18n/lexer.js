/* Lexer mínimo de JavaScript para as ferramentas de tradução: acha strings e templates com as posições no código. */
'use strict';
const REGEX_ANTES = new Set('(,=:[!&|?{};+-*%<>~^'.split(''));
const PALAVRAS_REGEX = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw', 'instanceof', 'yield', 'await']);
// Devolve { strs: [{ q, ini, fim, val }], tpls: [{ ini, fim, partes: [{ tipo: 'txt'|'expr', ini, fim }] }] }
function lex(src) {
  const strs = [], tpls = [];
  let i = 0, ult = '', ultPalavra = '';
  const n = src.length;
  function pulaString(q) { // i em cima da aspa
    const ini = i; i++;
    while (i < n && src[i] !== q) { if (src[i] === '\\') i++; i++; }
    i++; strs.push({ q, ini, fim: i, val: src.slice(ini + 1, i - 1) });
  }
  function pulaRegex() {
    i++; let classe = false;
    while (i < n) { const c = src[i]; if (c === '\\') { i += 2; continue; } if (c === '[') classe = true; else if (c === ']') classe = false; else if (c === '/' && !classe) break; else if (c === '\n') break; i++; }
    i++; while (i < n && /[a-z]/i.test(src[i])) i++;
  }
  function template() { // i em cima da crase
    const t = { ini: i, partes: [] }; tpls.push(t); i++;
    let txt = i;
    while (i < n) {
      const c = src[i];
      if (c === '\\') { i += 2; continue; }
      if (c === '`') { if (i > txt) t.partes.push({ tipo: 'txt', ini: txt, fim: i }); i++; t.fim = i; return; }
      if (c === '$' && src[i + 1] === '{') {
        if (i > txt) t.partes.push({ tipo: 'txt', ini: txt, fim: i });
        i += 2; const ei = i; codigo(true); t.partes.push({ tipo: 'expr', ini: ei, fim: i }); i++; txt = i; continue;
      }
      i++;
    }
  }
  function codigo(dentro) { // até a chave que fecha (dentro de ${}) ou o fim
    let prof = 0;
    while (i < n) {
      const c = src[i];
      if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
      if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i + 2) + 2; continue; }
      if (c === '"' || c === "'") { pulaString(c); ult = 'str'; ultPalavra = ''; continue; }
      if (c === '`') { template(); ult = 'str'; ultPalavra = ''; continue; }
      if (c === '/') { if (ult === '' || REGEX_ANTES.has(ult) || PALAVRAS_REGEX.has(ultPalavra)) { pulaRegex(); ult = 're'; ultPalavra = ''; continue; } }
      if (c === '{') prof++;
      if (c === '}') { if (dentro && prof === 0) return; prof--; }
      if (/\s/.test(c)) { i++; continue; }
      if (/[A-Za-z0-9_$]/.test(c)) { const ini = i; while (i < n && /[A-Za-z0-9_$]/.test(src[i])) i++; ultPalavra = src.slice(ini, i); ult = 'id'; continue; }
      ult = c; ultPalavra = ''; i++;
    }
  }
  codigo(false);
  return { strs, tpls };
}
module.exports = { lex };
