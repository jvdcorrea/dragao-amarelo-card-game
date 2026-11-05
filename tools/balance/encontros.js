/* Taxa de vitória de um bot simples, com os decks iniciais de cada Disciplina, contra encontros escolhidos.
   Uso: node tools/balance/encontros.js "oficina,bocas,ignar" '[["limiar",true,0]]' 12
   Argumentos: lista de encontros; regras de Blindagem a comparar ([modo, feitiços ignoram, Blindagem extra]); lutas por Disciplina.
   O bot é fraco de propósito: os números servem para comparar encontros e regras entre si, não como taxa real. */
const E=require('../../src/engine.js');
function pickT(st, ts){ const str = ts.find(r => r.t === 'e' && (E.ent ? E.ent(st, r) : null) && E.ent(st, r).kind === 'structure'); if (str) return str; const l = ts.find(r => r.t === 'l'); return l || ts[0]; }
function sim(disc, enc, n){ let w=0,turns=0; for(let g=0;g<n;g++){
  const st=E.newGame(disc,enc,2000+g); E.keepHand(st);
  for(let t=0;t<80&&!st.over;t++){ let acted=true,l=0; while(acted&&!st.over&&st.turnSide==='P'&&l++<40){acted=false; if(st.pending&&st.pending.kind==='prever')E.resolvePrever(st,null);
     for(let k=0;k<st.sides.P.hand.length;k++){const c=E.canPlay(st,'P',k); if(!c.ok||c.canMana===false)continue; const d=E.DEF[st.sides.P.hand[k].id]; const o={}; if(c.spec){ if(c.targets&&c.targets.length)o.target=c.targets[0]; else if(d.targetRequired)continue;} if(E.playCard(st,'P',k,o).ok){acted=true;break;}}
     if(E.canResonate(st,'P')){const u=st.sides.P.board.find(e=>e.kind==='unit'&&!E.isDead(e)); if(u)E.resonate(st,'P',u.uid);}
     for(const e of st.sides.P.board) if(!st.over&&E.canAttack(st,e)){const ts=E.attackTargets(st,'P',e); if(ts.length){E.attack(st,'P',e.uid,pickT(st,ts));acted=true;}}
     if(E.canHeroAttack(st,'P')){const ts=E.attackTargets(st,'P',null); if(ts.length){E.heroAttack(st,'P',pickT(st,ts));acted=true;}} }
    if(st.over)break; E.endTurn(st); let k=0; while(!st.over&&st.turnSide==='E'&&k++<40){ if(!E.enemyStep(st)){E.endTurn(st);break;} } }
  if(st.over==='P')w++; turns+=st.sides.P.turnCount; }
  return {w,n,turns:turns/n}; }
const encs=(process.argv[2]||'oficina,bocas,patrulha_azer,fundicao,colosso_ferro,matriarca_azer,ignar').split(',');
const D=['temporal','draconic','necro','holy','tech','space'];
const rules=JSON.parse(process.argv[3]||'[["reduz",true,0],["limiar",true,1]]');
for (const r of rules){ E.setBlindRule(r[0], r[1]); E.BLIND.extra=r[2]||0; const out=[];
  for (const enc of encs){ let T=0; const per=D.map(d=>{const x=sim(d,enc,+(process.argv[4]||12)); T+=x.turns; return Math.round(100*x.w/x.n);}); const avg=Math.round(per.reduce((a,b)=>a+b)/per.length); out.push(`${enc.padEnd(15)} média ${String(avg).padStart(3)}% | min ${Math.min(...per)} max ${Math.max(...per)} | turnos ${(T/6).toFixed(1)} | ${D.map((d,i)=>d.slice(0,4)+' '+per[i]).join(' ')}`); }
  console.log(`== ${r[0]}${r[1]?' (feitiços ignoram)':''}${r[2]?' Blindagem +'+r[2]:''}`); console.log(out.join('\n')); }
