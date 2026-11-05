/* Camada de apresentação (P94). O motor deixa eventos em st.fxq; depois de cada desenho da batalha, Fx.flush lê a fila e reage.
   Nada aqui muda o estado da partida, e o motor não espera por nada daqui. O desenho já mostra o estado final;
   as animações correm por cima, numa camada própria fora de #app, para sobreviver aos próximos desenhos. */
const Fx = (function () {
'use strict';
const cfg = { anim: 'normal', social: false };
let fimEm = 0;          // quando a última animação agendada termina
let camada = null;

function config(p) { Object.assign(cfg, p); }
function agora() { return performance.now(); }
function ate(ms) { fimEm = Math.max(fimEm, agora() + ms); }
function agendar(ms, fn) { ate(ms); if (ms <= 0) fn(); else setTimeout(fn, ms); }
// Promessa que resolve quando as animações em curso acabam (o turno inimigo espera por ela).
function idle() { const r = fimEm - agora(); return new Promise(res => (r > 0 ? setTimeout(res, r) : res())); }

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

/* ---------- DOM ---------- */
function pegaCamada() {
  if (!camada || !camada.isConnected) { camada = document.createElement('div'); camada.className = 'fx-camada'; camada.setAttribute('aria-hidden', 'true'); document.body.appendChild(camada); }
  // As cópias ficam fora da mesa; levam junto as cores dela (a negociação tem paleta própria).
  const mesa = document.querySelector('.mesa');
  if (mesa) { const cs = getComputedStyle(mesa); ['--vida', '--mana', '--glow', '--ouro-vivo', '--mesa'].forEach(v => camada.style.setProperty(v, cs.getPropertyValue(v))); }
  return camada;
}
// Antes de desenhar: posição e HTML de cada peça, para animar as que vão sumir.
function capture() {
  const m = new Map();
  document.querySelectorAll('.mesa [data-ent]').forEach(el => m.set(+el.dataset.ent, { rect: el.getBoundingClientRect(), html: el.outerHTML }));
  return m;
}
function elDe(ref) {
  if (!ref) return null;
  if (ref.t === 'l') return document.querySelector(ref.side === 'E' ? '.mesa [data-leader="E"]' : '.mesa .voce-vida');
  return document.querySelector(`.mesa [data-ent="${ref.uid}"]`);
}
// Cópia solta na camada, na posição dada; sem data-* para não receber cliques nem confundir as buscas.
function copia(html, rect) {
  const w = document.createElement('div'); w.className = 'fx-copia';
  Object.assign(w.style, { left: rect.left + 'px', top: rect.top + 'px', width: rect.width + 'px', height: rect.height + 'px' });
  w.innerHTML = html;
  w.querySelectorAll('*').forEach(n => [...n.attributes].forEach(a => { if (a.name.startsWith('data-') || a.name === 'id') n.removeAttribute(a.name); }));
  if (w.firstElementChild) w.firstElementChild.classList.remove('alvo', 'sel', 'pode');
  pegaCamada().appendChild(w);
  return w;
}
function rectDe(ref, fantasmas) {
  if (ref && ref.t === 'e' && fantasmas.has(ref.uid)) return fantasmas.get(ref.uid).getBoundingClientRect();
  const el = elDe(ref); return el ? el.getBoundingClientRect() : null;
}
function centro(r) { return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }

/* ---------- Efeitos ---------- */
function avanco(quem, alvoRect, idaMs, holdMs, voltaMs) {
  const r = quem.getBoundingClientRect(); if (!alvoRect) return;
  const a = centro(r), b = centro(alvoRect), A = FEEL.ataque;
  const dx = (b.x - a.x) * A.alcance, dy = (b.y - a.y) * A.alcance;
  const tot = idaMs + holdMs + voltaMs; if (tot <= 0) return;
  const longe = `translate(${dx}px, ${dy}px) scale(${A.escala})`;
  quem.style.zIndex = 2;
  const an = quem.animate([
    { transform: 'none', easing: 'cubic-bezier(.55,0,.9,.45)' },
    { transform: longe, offset: idaMs / tot },
    { transform: longe, offset: (idaMs + holdMs) / tot, easing: 'cubic-bezier(.2,.7,.3,1)' },
    { transform: 'none' },
  ], { duration: tot });
  ate(tot);
  return an;
}
function flash(rect, opac, holdMs, ms, raio) {
  if (!rect) return;
  const f = document.createElement('div'); f.className = 'fx-flash';
  Object.assign(f.style, { left: rect.left + 'px', top: rect.top + 'px', width: rect.width + 'px', height: rect.height + 'px', borderRadius: raio || '10px' });
  pegaCamada().appendChild(f);
  const tot = holdMs + ms;
  const an = f.animate([{ opacity: opac }, { opacity: opac, offset: tot ? holdMs / tot : 0 }, { opacity: 0 }], { duration: Math.max(1, tot), easing: 'ease-out' });
  an.onfinish = () => f.remove(); ate(tot);
}
function tremida(dano, k) {
  const I = FEEL.impacto;
  if (dano < I.tremidaMinDano) return;
  const px = Math.min(I.tremidaMaxPx, I.tremidaPxPorDano * dano) * (cfg.social ? I.tremidaSocial : 1);
  const ms = I.tremidaMs * k; if (px <= 0 || ms <= 0) return;
  const n = 8, fr = [];
  for (let i = 0; i < n; i++) { const d = px * (1 - i / n); fr.push({ transform: `translate(${(Math.random() * 2 - 1) * d}px, ${(Math.random() * 2 - 1) * d}px)` }); }
  fr.push({ transform: 'none' });
  [document.querySelector('.mesa'), pegaCamada()].forEach(el => { if (el) el.animate(fr, { duration: ms, easing: 'linear' }); });
  ate(ms);
}
function morte(g, ms, mov) {
  if (!g) return;
  const fr = mov ? [{ opacity: 1, transform: 'none', filter: 'none' }, { opacity: 0, transform: 'translateY(8px) scale(.82)', filter: 'grayscale(1)' }] : [{ opacity: 1 }, { opacity: 0 }];
  const an = g.animate(fr, { duration: Math.max(1, ms), easing: 'ease-in', fill: 'forwards' });
  an.onfinish = () => g.remove(); ate(ms);
}

/* ---------- Linha do tempo ---------- */
function sons(evs) {
  const vezes = {};
  return (ev, ms) => {
    const nome = somDe(ev); if (!nome) return;
    vezes[nome] = (vezes[nome] || 0) + 1;
    if (vezes[nome] > FEEL.audio.maxIguais) return;
    agendar(ms, () => Som.tocar(nome));
  };
}
// Sem animação: os sons em etapas fixas, como na fase 1.
function soSom(evs) {
  const tocar = sons(evs);
  evs.forEach(ev => { const nome = somDe(ev); if (nome) tocar(ev, (FEEL.sons[nome].etapa || 0) * FEEL.audio.etapaMs); });
}
function linha(evs, cap) {
  const k = FEEL.tempo.escala[cfg.anim] === undefined ? 1 : FEEL.tempo.escala[cfg.anim];
  const mov = cfg.anim === 'normal' || cfg.anim === 'rapida';
  const A = FEEL.ataque, I = FEEL.impacto, T = FEEL.tempo;
  const tocar = sons(evs);
  // Unidades que morreram nesta leva ganham uma cópia no lugar antigo, que some na hora certa.
  const fantasmas = new Map();
  evs.forEach(ev => { if (ev.k === 'die' && cap && cap.has(ev.u) && !fantasmas.has(ev.u)) { const c = cap.get(ev.u); fantasmas.set(ev.u, copia(c.html, c.rect)); } });

  let t = 0, g = null, atk = null;
  const fechar = () => {
    if (!g) return;
    const grupo = g; g = null;
    const hs = mov && grupo.dano > 0 ? Math.min(I.hitStopMax, I.hitStopMin + I.hitStopPorDano * grupo.dano) * k : 0;
    // Se o atacante morreu no golpe, ele só some depois de voltar.
    const atacanteMorto = atk && atk.ref ? atk.ref.uid : null;
    if (atk) {
      const a = atk; atk = null;
      agendar(a.t, () => {
        let quem = a.ref ? fantasmas.get(a.ref.uid) : null, real = null;
        if (!quem) {
          real = a.ref ? elDe(a.ref) : document.querySelector('.mesa .arma');
          if (!real) return;
          quem = copia(real.outerHTML, real.getBoundingClientRect()); real.style.visibility = 'hidden';
        }
        const an = avanco(quem, rectDe(a.tgt, fantasmas), A.idaMs * k, hs, A.voltaMs * k);
        if (real) { const fim = () => { real.style.visibility = ''; quem.remove(); }; if (an) an.onfinish = fim; else fim(); }
      });
    }
    grupo.hits.forEach(ev => {
      tocar(ev, grupo.t);
      if (!mov || ev.k === 'heal') return;
      agendar(grupo.t, () => {
        const el = ev.ref.t === 'e' ? (fantasmas.get(ev.ref.uid) || elDe(ev.ref)) : elDe(ev.ref);
        if (!el) return;
        const raio = getComputedStyle(el.classList.contains('fx-copia') ? el.firstElementChild || el : el).borderRadius;
        flash(el.getBoundingClientRect(), ev.k === 'dmg' ? I.flashOpacidade : I.flashBloqueio, hs, I.flashMs * k, raio);
      });
    });
    if (mov && grupo.dano) { const d = grupo.dano; agendar(grupo.t + hs, () => tremida(d, k)); }
    const tm = grupo.t + hs;
    grupo.mortes.forEach(ev => {
      tocar(ev, tm);
      const f = fantasmas.get(ev.u); if (!f) return;
      agendar(ev.u === atacanteMorto && mov ? tm + A.voltaMs * k : tm, () => morte(f, I.morteMs * k, mov));
    });
    t = tm + T.entreGolpes * k;
  };
  const abrir = () => { g = { t, hits: [], dano: 0, mortes: [] }; };

  evs.forEach(ev => {
    switch (ev.k) {
      case 'play':
        fechar(); tocar(ev, t); t += T.depoisJogar * k; break;
      case 'atk': case 'hero':
        fechar();
        atk = { t, ref: ev.k === 'atk' ? { t: 'e', uid: ev.a } : null, tgt: ev.tgt, s: ev.s };
        if (ev.k === 'hero' && ev.s !== 'P') atk = null;
        t += (mov ? A.idaMs : FEEL.audio.etapaMs) * k;
        abrir(); break;
      case 'dmg': case 'bloq': case 'escudo': case 'heal':
        // Dano depois de mortes (efeitos Ao Morrer) abre um golpe novo.
        if (g && g.mortes.length) fechar();
        if (!g) abrir();
        g.hits.push(ev); if (ev.k === 'dmg') g.dano += ev.n; break;
      case 'die':
        if (!g) abrir();
        g.mortes.push(ev); break;
      default:
        tocar(ev, t);
    }
  });
  fechar();
  ate(t + (A.voltaMs + I.morteMs) * k);
  // Cópias de mortos que não entraram em nenhum grupo (por segurança) somem no fim.
  fantasmas.forEach(f => { if (f.isConnected && !f.getAnimations().length) agendar(t, () => morte(f, I.morteMs * k, mov)); });
}

function flush(st, cap) {
  if (!st) return;
  // A fila nasce no primeiro desenho da partida: a mão inicial não toca nada.
  if (!st.fxq) { st.fxq = []; return; }
  const evs = st.fxq.splice(0);
  if (!evs.length) return;
  if (!FEEL.tempo.escala[cfg.anim]) soSom(evs); else linha(evs, cap);
}
function pendente(st) { return !!(st && st.fxq && st.fxq.length); }
return { flush, capture, pendente, idle, config };
})();
