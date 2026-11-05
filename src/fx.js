/* Camada de apresentação (P94). O motor deixa eventos em st.fxq; depois de cada desenho da batalha, Fx.flush lê a fila e reage.
   Nada aqui muda o estado da partida, e o motor não espera por nada daqui. O desenho já mostra o estado final;
   as animações correm por cima, numa camada própria fora de #app, para sobreviver aos próximos desenhos. */
const Fx = (function () {
'use strict';
const cfg = { anim: 'normal', social: false };
// Quando a última ação termina de ler: impactos e o avanço do atacante. Os sumiços (números, brilho, mortos, flash)
// continuam por cima da próxima ação e não seguram o turno inimigo.
let fimEm = 0;
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
const chave = ref => (ref.t === 'l' ? 'l:' + ref.side : 'e:' + ref.uid);
function pegaCamada() {
  if (!camada || !camada.isConnected) { camada = document.createElement('div'); camada.className = 'fx-camada'; camada.setAttribute('aria-hidden', 'true'); document.body.appendChild(camada); }
  // As cópias ficam fora da mesa; levam junto as cores dela (a negociação tem paleta própria).
  const mesa = document.querySelector('.mesa');
  if (mesa) { const cs = getComputedStyle(mesa); ['--vida', '--mana', '--glow', '--ouro-vivo', '--mesa'].forEach(v => camada.style.setProperty(v, cs.getPropertyValue(v))); }
  return camada;
}
// Antes de desenhar: posição e HTML de cada peça (e:uid) e carta da mão (h:uid), para animar o que some ou muda de lugar.
function capture() {
  const m = new Map();
  document.querySelectorAll('.mesa [data-ent]').forEach(el => m.set('e:' + el.dataset.ent, { rect: el.getBoundingClientRect(), html: el.outerHTML }));
  document.querySelectorAll('.mao [data-uid]').forEach(el => m.set('h:' + el.dataset.uid, { rect: el.getBoundingClientRect(), html: el.outerHTML }));
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
function centro(r) { return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
// Número de vida dentro de uma peça, do líder inimigo ou do seu painel.
function numNo(el, ref) {
  if (!el) return null;
  if (ref.t === 'l') return el.querySelector(ref.side === 'E' ? '.vida-num' : 'b');
  return el.querySelector('.stats .hp');
}
function barraDe(ref) { return ref.t === 'l' ? document.querySelector(ref.side === 'E' ? '.mesa .lider .barra i' : '.mesa .voce-vida .barra i') : null; }

/* ---------- Efeitos ---------- */
function avanco(quem, alvoRect, idaMs, holdMs, voltaMs) {
  const r = quem.getBoundingClientRect(); if (!alvoRect) return null;
  const a = centro(r), b = centro(alvoRect), A = FEEL.ataque;
  const dx = (b.x - a.x) * A.alcance, dy = (b.y - a.y) * A.alcance;
  const tot = idaMs + holdMs + voltaMs; if (tot <= 0) return null;
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
  an.onfinish = () => f.remove();
}
// Ataque com arma: um corte atravessa o alvo.
function corte(rect, k) {
  const C = FEEL.arma; if (!rect) return;
  const c = centro(rect), len = Math.hypot(rect.width, rect.height) * C.comprimento, ms = C.corteMs * k;
  const d = document.createElement('div'); d.className = 'fx-corte';
  Object.assign(d.style, { left: c.x - len / 2 + 'px', top: c.y - C.espessura / 2 + 'px', width: len + 'px', height: C.espessura + 'px', transform: `rotate(${C.angulo}deg)` });
  d.style.setProperty('--corte', C.cor);
  pegaCamada().appendChild(d);
  const an = d.animate([
    { clipPath: 'inset(0 100% 0 0)', opacity: 1 },
    { clipPath: 'inset(0 0 0 0)', opacity: 1, offset: 0.4 },
    { clipPath: 'inset(0 0 0 70%)', opacity: 0 },
  ], { duration: Math.max(1, ms), easing: 'cubic-bezier(.3,.8,.4,1)' });
  an.onfinish = () => d.remove();
}
function brilhoCura(ref, k) {
  const C = FEEL.cura, n = numNo(elDe(ref), ref); if (!n) return;
  const g = `0 0 ${C.raioPx / 2}px ${C.cor}, 0 0 ${C.raioPx}px ${C.cor}, 0 0 ${C.raioPx * 2}px ${C.cor}`;
  const ms = C.brilhoMs * k;
  n.animate([{ textShadow: g, color: C.cor }, { textShadow: g, color: C.cor, offset: 0.3 }, { textShadow: '0 0 0 transparent' }], { duration: Math.max(1, ms), easing: 'ease-out' });
}
// Sobre peças, o número nasce no terço de cima; sobre líderes, logo acima do número de vida, para não cobri-lo.
function numero(rect, acima, texto, cor, degrau, k, mov) {
  const N = FEEL.numeros; if (!rect) return;
  const d = document.createElement('div'); d.className = cor ? 'fx-num' : 'fx-num fx-selo'; d.textContent = texto; if (cor) d.style.color = cor;
  Object.assign(d.style, { left: rect.left + rect.width / 2 + 'px', top: (acima ? rect.top - 8 : rect.top + rect.height * 0.3) - degrau * N.pilhaPx + 'px' });
  pegaCamada().appendChild(d);
  const ms = N.ms * k, base = 'translate(-50%, -50%)';
  const fr = mov ? [
    { transform: `${base} scale(${N.pop})`, opacity: 0 },
    { transform: `${base} scale(1)`, opacity: 1, offset: 0.15 },
    { transform: `${base} translateY(${-N.subirPx * 0.6}px)`, opacity: 1, offset: 0.6 },
    { transform: `${base} translateY(${-N.subirPx}px)`, opacity: 0 },
  ] : [{ transform: base, opacity: 1 }, { transform: base, opacity: 1, offset: 0.7 }, { transform: base, opacity: 0 }];
  const an = d.animate(fr, { duration: Math.max(1, ms), easing: 'ease-out', fill: 'forwards' });
  an.onfinish = () => d.remove();
}
// Carta jogada: voa da mão ao destino num arco. Peças pousam (a cópia some e a peça real aparece); feitiços somem no alvo.
function arco(c, alvo, ms, pousa) {
  const M = FEEL.mao, p = copia(c.html, c.rect), a = centro(c.rect), b = alvo ? centro(alvo) : a;
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const cx = (a.x + b.x) / 2, cy = Math.min(a.y, b.y) - dist * M.arcoAltura;
  const sFim = pousa && alvo ? Math.min(1, alvo.width / c.rect.width) : M.arcoEscalaFeitico;
  const fr = [];
  for (let i = 0; i <= 10; i++) {
    const u = i / 10, v = 1 - u;
    const x = v * v * a.x + 2 * v * u * cx + u * u * b.x, y = v * v * a.y + 2 * v * u * cy + u * u * b.y;
    fr.push({ transform: `translate(${x - a.x}px, ${y - a.y}px) rotate(${4 * u * v * M.arcoGiro}deg) scale(${1 + (sFim - 1) * u})`, opacity: pousa || u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3 });
  }
  p.style.zIndex = 3;
  const an = p.animate(fr, { duration: Math.max(1, ms), easing: 'cubic-bezier(.45,0,.35,1)' });
  an.onfinish = () => p.remove();
}
// Peça nova aparece na hora dela: pouso com aperto (vinda do arco) ou queda curta (inimigo e efeitos).
function entra(el, t, doArco, k) {
  const M = FEEL.mao;
  const fr = doArco
    ? [{ opacity: 0, transform: `scale(${M.pousoEscala})` }, { opacity: 1, transform: `scale(${M.pousoEscala})`, offset: 0.01 }, { opacity: 1, transform: 'none' }]
    : [{ opacity: 0, transform: 'translateY(-24px) scale(.85)' }, { opacity: 1, transform: 'none' }];
  el.animate(fr, { duration: Math.max(1, (doArco ? M.pousoMs : M.entradaMs) * k), delay: t, easing: 'cubic-bezier(.34,1.5,.64,1)', fill: 'backwards' });
}
// Carta comprada chega à mão vinda de baixo e da direita, com um leve passo além do lugar.
function chega(el, t, k) {
  const M = FEEL.mao;
  el.animate([{ opacity: 0, transform: `translate(${M.compraDesloc}px, ${M.compraDesloc * 0.5}px) rotate(6deg) scale(.85)` }, { opacity: 1, transform: 'none' }],
    { duration: Math.max(1, M.compraMs * k), delay: t, easing: 'cubic-bezier(.34,1.4,.64,1)', fill: 'backwards' });
}
// O que mudou de lugar no desenho novo sai do lugar antigo e desliza (FLIP), depois de uma espera opcional.
function desliza(el, r0, delay, ms) {
  const r1 = el.getBoundingClientRect(), dx = r0.left - r1.left, dy = r0.top - r1.top;
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
  el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: Math.max(1, ms), delay, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'backwards' });
}
function morte(g, ms, mov) {
  if (!g) return;
  const fr = mov ? [{ opacity: 1, transform: 'none', filter: 'none' }, { opacity: 0, transform: 'translateY(8px) scale(.82)', filter: 'grayscale(1)' }] : [{ opacity: 1 }, { opacity: 0 }];
  const an = g.animate(fr, { duration: Math.max(1, ms), easing: 'ease-in', fill: 'forwards' });
  an.onfinish = () => g.remove();
}

/* ---------- Linha do tempo ---------- */
function sons() {
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
  const tocar = sons();
  evs.forEach(ev => { const nome = somDe(ev); if (nome) tocar(ev, (FEEL.sons[nome].etapa || 0) * FEEL.audio.etapaMs); });
}
function linha(st, evs, cap) {
  const k = FEEL.tempo.escala[cfg.anim] === undefined ? 1 : FEEL.tempo.escala[cfg.anim];
  const mov = cfg.anim === 'normal' || cfg.anim === 'rapida';
  const A = FEEL.ataque, I = FEEL.impacto, T = FEEL.tempo, N = FEEL.numeros;
  const tocar = sons();
  // Cópias por chave: mortos desta leva (no lugar antigo) e atacantes vivos durante o avanço.
  const copias = new Map(), mortos = [], somem = new Set();
  evs.forEach(ev => {
    if (ev.k !== 'die' || !cap || !cap.has('e:' + ev.u) || copias.has('e:' + ev.u)) return;
    const c = cap.get('e:' + ev.u), g = copia(c.html, c.rect); copias.set('e:' + ev.u, g); mortos.push(g);
  });
  const elOuCopia = ref => copias.get(chave(ref)) || elDe(ref);

  // A vida mostrada volta ao valor de antes e muda no impacto de cada golpe.
  const vida = new Map();
  evs.forEach(ev => {
    if ((ev.k !== 'dmg' && ev.k !== 'heal') || !ev.ref) return;
    const c = chave(ev.ref); if (!vida.has(c)) vida.set(c, { ref: ev.ref, d: 0 });
    vida.get(c).d += ev.k === 'heal' ? ev.n : -ev.n;
  });
  vida.forEach((x, c) => {
    if (x.ref.t === 'l') { const l = st.sides[x.ref.side].leader; x.v = l.hp - x.d; x.max = l.maxHp; }
    else {
      const e = ['P', 'E'].map(s => st.sides[s].board.find(u => u.uid === x.ref.uid)).find(Boolean);
      if (e && !copias.has(c)) x.v = e.hp - x.d;
      else { const n = numNo(copias.get(c), x.ref); x.v = n ? parseInt(n.textContent, 10) : NaN; }
    }
    if (Number.isFinite(x.v)) mostrar(x, 0); else vida.delete(c);
  });
  function mostrar(x, ms) {
    const vis = Math.max(0, x.v);
    [elDe(x.ref), copias.get(chave(x.ref))].forEach(el => { const n = numNo(el, x.ref); if (n) n.textContent = vis; });
    const b = barraDe(x.ref);
    if (b && x.max) {
      const w = Math.max(0, Math.round(100 * x.v / x.max)) + '%';
      if (ms > 0 && b.style.width) b.animate([{ width: b.style.width }, { width: w }], { duration: ms, easing: 'ease-out' });
      b.style.width = w;
    }
  }

  const degraus = {};
  function numeroDe(ev, k) {
    const c = chave(ev.ref), el = elOuCopia(ev.ref); if (!el) return;
    const C = N.cores, R = N.rotulos;
    const [txt, cor] = ev.k === 'dmg' ? ['-' + ev.n, C.dano] : ev.k === 'heal' ? ['+' + ev.n, C.cura] : [ev.k === 'escudo' ? (cfg.social ? R.escudoSocial : R.escudo) : R.bloq, null];
    const dg = degraus[c] = (degraus[c] === undefined ? 0 : degraus[c] + 1);
    const lider = ev.ref.t === 'l', alvo = (lider && numNo(el, ev.ref)) || el;
    numero(alvo.getBoundingClientRect(), lider, txt, cor, dg % 3, k, mov);
  }

  // Destino do voo de uma carta jogada: a peça nova, o alvo, a arma, a armadilha ou o meio da mesa.
  function destinoDe(ev) {
    let el = ev.e ? elDe({ t: 'e', uid: ev.e }) : ev.tgt ? elOuCopia(ev.tgt) : null;
    if (!el) {
      const d = typeof Engine !== 'undefined' ? Engine.DEF[ev.c] : null;
      if (d && d.type === 'weapon') el = document.querySelector('.mesa .arma');
      if (d && d.type === 'trap') { const ts = document.querySelectorAll('.mesa .armadilha'); el = ts[ts.length - 1]; }
    }
    el = el || document.querySelector('.mesa .faixa');
    return el ? el.getBoundingClientRect() : null;
  }
  const M = FEEL.mao;
  const entradas = new Map(), compras = [];   // peças novas (uid -> hora) e cartas compradas
  let tPrimeiraMorte = null;

  let t = 0, g = null, atk = null;
  const fechar = () => {
    if (!g) return;
    const grupo = g; g = null;
    const hs = mov && grupo.dano > 0 ? Math.min(I.hitStopMax, I.hitStopMin + I.hitStopPorDano * grupo.dano) * k : 0;
    // Se o atacante morreu no golpe, ele só some depois de voltar.
    const atacanteMorto = atk && atk.ref ? atk.ref.uid : null;
    if (atk) {
      const a = atk; atk = null;
      if (a.hero) { if (mov) agendar(a.t, () => { const el = elOuCopia(a.tgt); if (el) corte(el.getBoundingClientRect(), k); }); }
      else if (mov) ate(a.t + (A.idaMs + A.voltaMs) * k + hs);
      if (!a.hero && mov) agendar(a.t, () => {
        let quem = copias.get(chave(a.ref)), real = null;
        if (!quem) {
          real = elDe(a.ref); if (!real) return;
          quem = copia(real.outerHTML, real.getBoundingClientRect()); real.style.visibility = 'hidden';
          copias.set(chave(a.ref), quem);
        }
        const tg = elOuCopia(a.tgt);
        const an = avanco(quem, tg ? tg.getBoundingClientRect() : null, A.idaMs * k, hs, A.voltaMs * k);
        if (real) {
          const fim = () => { real.style.visibility = ''; quem.remove(); if (copias.get(chave(a.ref)) === quem) copias.delete(chave(a.ref)); };
          if (an) an.onfinish = fim; else fim();
        }
      });
    }
    const tm = grupo.t + hs;
    if (grupo.mortes.length && tPrimeiraMorte === null) tPrimeiraMorte = tm;
    grupo.hits.forEach(ev => {
      tocar(ev, grupo.t);
      if (mov && ev.k !== 'heal') agendar(grupo.t, () => {
        const el = elOuCopia(ev.ref); if (!el) return;
        const raio = getComputedStyle(el.classList.contains('fx-copia') ? el.firstElementChild || el : el).borderRadius;
        flash(el.getBoundingClientRect(), ev.k === 'dmg' ? I.flashOpacidade : I.flashBloqueio, hs, I.flashMs * k, raio);
      });
      agendar(tm, () => {
        const x = vida.get(chave(ev.ref));
        if (x && (ev.k === 'dmg' || ev.k === 'heal')) { x.v += ev.k === 'heal' ? ev.n : -ev.n; mostrar(x, I.barraMs * k); }
        if (ev.k === 'heal') brilhoCura(ev.ref, k);
        numeroDe(ev, k);
      });
    });
    grupo.mortes.forEach(ev => {
      tocar(ev, tm);
      const f = copias.get('e:' + ev.u); if (!f || !mortos.includes(f) || somem.has(f)) return;
      somem.add(f);
      agendar(ev.u === atacanteMorto && mov ? tm + A.voltaMs * k : tm, () => morte(f, I.morteMs * k, mov));
    });
    t = tm + T.entreGolpes * k;
  };
  const abrir = () => { g = { t, hits: [], dano: 0, mortes: [] }; };

  evs.forEach(ev => {
    switch (ev.k) {
      case 'play': {
        fechar();
        const h = mov && ev.s === 'P' && cap ? cap.get('h:' + ev.u) : null;
        if (h) {
          const ms = M.arcoMs * k, t0 = t;
          if (ev.e) entradas.set(ev.e, { t: t0 + ms, arco: true });
          agendar(t0, () => arco(h, destinoDe(ev), ms, !!ev.e));
          tocar(ev, t0 + ms * 0.85);   // o som cai quando a carta chega
          t += ms;
        } else {
          tocar(ev, t);
          if (ev.e) entradas.set(ev.e, { t });
          t += T.depoisJogar * k;
        }
        break;
      }
      case 'summon':
        if (!entradas.has(ev.u)) entradas.set(ev.u, { t });
        break;
      case 'draw': case 'gain':
        if (ev.s === 'P') { const tc = t + compras.length * M.compraIntervalo * k; compras.push({ u: ev.u, t: tc }); tocar(ev, tc); }
        break;
      case 'atk':
        fechar();
        atk = { t, ref: { t: 'e', uid: ev.a }, tgt: ev.tgt };
        t += (mov ? A.idaMs : FEEL.audio.etapaMs) * k;
        abrir(); break;
      case 'hero':
        fechar();
        atk = { t, hero: true, tgt: ev.tgt };
        t += (mov ? FEEL.arma.contatoMs : FEEL.audio.etapaMs) * k;
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
  if (mov) {
    // Mão: as cartas que ficaram deslizam para o lugar novo; as compradas chegam em sequência.
    document.querySelectorAll('.mao [data-uid]').forEach(el => {
      const c = cap && cap.get('h:' + el.dataset.uid);
      if (c) desliza(el, c.rect, 0, M.reflowMs * k);
    });
    compras.forEach(c => { const el = document.querySelector(`.mao [data-uid="${c.u}"]`); if (el && !(cap && cap.has('h:' + c.u))) chega(el, c.t, k); });
    // Mesa: as peças que mudaram de lugar esperam o morto sumir ou a nova pousar, e então deslizam.
    const tEntr = [...entradas.values()].map(x => x.t);
    const tsl = Math.min(tPrimeiraMorte === null ? Infinity : tPrimeiraMorte, ...tEntr);
    document.querySelectorAll('.mesa [data-ent]').forEach(el => {
      const c = cap && cap.get('e:' + el.dataset.ent);
      if (c) desliza(el, c.rect, Number.isFinite(tsl) ? tsl : 0, M.reflowMs * k);
    });
    entradas.forEach((x, uid) => { const el = elDe({ t: 'e', uid }); if (el && !(cap && cap.has('e:' + uid))) entra(el, x.t, x.arco, k); });
  }
  ate(t);
  // Cópias de mortos que não entraram em nenhum grupo (por segurança) somem no fim.
  mortos.forEach(f => { if (!somem.has(f)) agendar(t, () => morte(f, I.morteMs * k, mov)); });
}

function flush(st, cap) {
  if (!st) return;
  // A fila nasce no primeiro desenho da partida: a mão inicial não toca nada.
  if (!st.fxq) { st.fxq = []; return; }
  const evs = st.fxq.splice(0);
  if (!evs.length) return;
  if (!FEEL.tempo.escala[cfg.anim]) soSom(evs); else linha(st, evs, cap);
}
function pendente(st) { return !!(st && st.fxq && st.fxq.length); }

/* ---------- Mão: inclinação seguindo o cursor ---------- */
(function ligarMao() {
  const M = FEEL.mao, raiz = document.documentElement.style;
  raiz.setProperty('--mao-subir', -M.subirPx + 'px'); raiz.setProperty('--mao-escala', M.escala); raiz.setProperty('--mao-brilho', M.brilho);
  const base = new WeakMap();   // retângulo da carta antes de inclinar (inclinada, ela muda de tamanho e a conta tremeria)
  const cartaDe = ev => (ev.target && ev.target.closest ? ev.target.closest('.mao .carta') : null);
  document.addEventListener('pointermove', ev => {
    const c = cartaDe(ev);
    if (!c || ev.pointerType !== 'mouse' || !(cfg.anim === 'normal' || cfg.anim === 'rapida')) return;
    if (!base.has(c)) base.set(c, c.getBoundingClientRect());
    const r = base.get(c), x = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)), y = Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height));
    c.style.setProperty('--rx', ((0.5 - y) * 2 * M.inclinacao).toFixed(2) + 'deg');
    c.style.setProperty('--ry', ((x - 0.5) * 2 * M.inclinacao).toFixed(2) + 'deg');
    c.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); c.style.setProperty('--my', (y * 100).toFixed(1) + '%');
  });
  document.addEventListener('pointerout', ev => {
    const c = cartaDe(ev);
    if (c && !c.contains(ev.relatedTarget)) { base.delete(c); ['--rx', '--ry'].forEach(v => c.style.removeProperty(v)); }
  });
})();
return { flush, capture, pendente, idle, config };
})();
