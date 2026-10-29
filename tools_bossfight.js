// 首领战机器人：正常装备（或新存档）英雄站桩普攻、不闪避，测首领对玩家的伤害、战斗时长、攻击间隔、发呆 / 后退时间
// 用法：node tools_bossfight.js            （5 关 × normal / fresh 共 10 场，并行）
//       STAGES=2,5 HERO=normal node tools_bossfight.js ；JSON=1 输出 JSON；CAP=240 每场最长游戏秒数
//       BLOCK=1,0 同时跑格挡开 / 关，汇总里给出格挡率与战斗变长多少（默认 BLOCK=1）
const {chromium}=require('playwright-core');
const URL=process.env.URL||'http://localhost:8931/index.html',SPD=+process.env.SPD||4,CAP=+process.env.CAP||240;
// 正常装备：攻击约等于各关预期攻击 10/26/42/62/80（略高），装备按金币进度
const HERO={normal:{1:{atkLv:0,eq:{weapon:'w1',armor:'a1'}},2:{atkLv:0,eq:{weapon:'w2',armor:'a1',acc:'r1'}},3:{atkLv:5,eq:{weapon:'w2',armor:'a2',acc:'r2'}},4:{atkLv:8,eq:{weapon:'w3',armor:'a3',acc:'r2'}},5:{atkLv:10,eq:{weapon:'w4',armor:'a3',acc:'r3'}}},
 fresh:{1:{atkLv:0,eq:{}},2:{atkLv:0,eq:{}},3:{atkLv:0,eq:{}},4:{atkLv:0,eq:{}},5:{atkLv:0,eq:{}}}};
// review：评审的玩法 = 新存档 unlockAll() + start(关) + god(true)，0 级、无装备（跳关追赶系数最大）
HERO.review=HERO.fresh;
async function fight(b,stage,hero,blk=1){const pg=await b.newPage({viewport:{width:960,height:540}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto(URL);await pg.waitForTimeout(700);const H=HERO[hero][stage];
 await pg.evaluate(([s,H,hero,blk])=>{__dbg.block(!!blk);__dbg.god(hero==='review');__dbg.resetSave();__dbg.unlockAll();PROFILE.cleared=hero==='normal'?[1,2,3,4,5].slice(0,s-1).map(i=>STAGES[i-1].id):[];__dbg.start(s);
  const G=__G(),p=G.p;p.atkLv=H.atkLv;p.eq=Object.assign({},H.eq);p.owned=Object.values(H.eq);applyGear(p,true);p.hp=p.maxhp;
  const B=G.B;G.enemies=[];G.pickups=[];G.wave=B.waves.length-1;G.lockX=null;const wx=B.waves[G.wave].x;G.camX=wx;p.x=wx+W*.4+10;p.y=(LANE_TOP+LANE_BOT)/2;__dbg.dmgLog('clear');__dbg.speed(1)},[stage,H,hero,blk]);
 await pg.waitForTimeout(400);
 const info=await pg.evaluate(([CAP,SPD])=>{const G=__G(),p=G.p,bs=G.boss;if(!bs)return {err:'no boss'};
  window.__R={max:p.maxhp,atk:atk(),def:def(),catchUp:bossCatchUp(),bossHp:bs.maxhp,name:bs.def.name,t0:G.time,pats:[],idle:0,idleMax:0,idleRun:0,away:0,phaseAt:[],done:0,dmgTaken:0};
  const R=__R;let cur=null,lastEnd=null,lastT=G.time,lastX=bs.x,lastPh=bs.phase;R.reach=60+30*bs.r;
  window.__BOT=setInterval(()=>{const G=__G();if(!G||!G.p)return;const p=G.p,e=G.boss;for(const k of ['arrowleft','arrowright','arrowup','arrowdown'])keys[k]=false;
   if(p.hp<p.maxhp){R.dmgTaken+=p.maxhp-p.hp;p.hp=p.maxhp}p.dead=0;
   if(G.menu)G.menu=null;while(gearOpen())gearAnswer(false);
   if(!e||e.dead||__dbg.mode()!=='play'){if(!R.done){R.done=1;R.ttk=G.time-R.t0}return}
   const t=G.time,dtt=t-lastT;
   if(G.time-R.t0>CAP){R.done=1;R.ttk=null;R.hpLeft=e.hp/e.maxhp;return}
   // 机器人：贴近首领、对齐行、普攻；不闪避
   if(!e.hidden){const dx=e.x-p.x,dy=e.y-p.y;if(Math.abs(dx)>85)keys[dx>0?'arrowright':'arrowleft']=true;else if(Math.abs(dx)<40)keys[dx>0?'arrowleft':'arrowright']=true;
    if(Math.abs(dy)>8)keys[dy>0?'arrowdown':'arrowup']=true;if(Math.abs(dx)<110&&Math.abs(dy)<24){if(Math.abs(dx)>=40)p.face=Math.sign(dx)||1;pressed.j=true}}
   // 记录首领攻击 / 发呆 / 后退
   if(e.phase!==lastPh){R.phaseAt.push({ph:e.phase,t:+(t-R.t0).toFixed(1)});lastPh=e.phase}
   const gu=e.gRaise>0||e.guard>0||e.stagT>0,act=e.pat||(gu?(e.stagT>0?'stagger':'guard'):null);
   if(act&&cur&&cur.pat!==act&&!e.pat){cur.e=t-R.t0;lastEnd=cur.e;cur=null}
   if(act&&!cur){cur={pat:e.isCounter?'counter:'+e.pat:act,ph:e.phase,s:(e.patAt!=null?e.patAt:t)-R.t0,gap:lastEnd==null?null:(e.patAt!=null?e.patAt:t)-R.t0-lastEnd,n0:DLOG.length};R.pats.push(cur)}
   if(cur&&cur.tele==null&&cur.pat!=='guard'&&cur.pat!=='stagger'){for(let i=cur.n0;i<DLOG.length;i++){const x=DLOG[i];if(x.target.startsWith('玩家')&&x.src===R.name+'（首领）'){cur.tele=+(x.t-R.t0-cur.s).toFixed(2);break}}}
   if(cur&&!act){cur.e=t-R.t0;lastEnd=cur.e;cur=null}
   const near=Math.abs(p.x-e.x)<R.reach+40&&Math.abs(p.y-e.y)<40;
   if(!e.pat&&!e.hidden&&!e.moving&&near&&!gu&&!(e.stun>0)&&!(e.frozen>0)){R.idleRun+=dtt;R.idleMax=Math.max(R.idleMax,R.idleRun)}else R.idleRun=0;
   if(!e.pat&&!gu&&!R.prevPat&&e.moving&&dtt>0&&Math.abs(e.kx||0)<1&&Math.sign(e.x-lastX)===-Math.sign(p.x-e.x)&&Math.abs(e.x-lastX)>.5)R.away+=dtt;
   R.prevPat=!!e.pat||e.hidden;lastT=t;lastX=e.x},8);__dbg.speed(SPD);return {ok:1}},[CAP,SPD]);
 if(info.err){await pg.close();return {stage,hero,err:info.err}}
 for(let i=0;i<CAP*1000/SPD/250+40;i++){await pg.waitForTimeout(250);if(await pg.evaluate(()=>__R.done))break}
 const r=await pg.evaluate(()=>{clearInterval(__BOT);__dbg.speed(1);const R=__R;const nm=R.name;
  const L=DLOG.filter(x=>x.target==='玩家');const boss=L.filter(x=>x.src.startsWith(nm));const haz=L.filter(x=>x.src.startsWith('危害'));
  const sum=a=>a.reduce((s,x)=>s+x.final,0);const raws=boss.map(x=>x.raw);
  R.pats.forEach((q,i)=>{if(q.pat==='stagger'||(i&&R.pats[i-1].pat==='stagger'))q.gap=null});
  const gaps=[0,1].map(k=>R.pats.filter(q=>q.gap!=null&&(k?q.ph>=1:q.ph===0)).map(q=>q.gap));
  const BS=__dbg.block('stats')||{};const mh=DLOG.filter(x=>x.isBoss&&/^普攻|^跳劈/.test(x.src));
  const s2s=[0,1].map(k=>{const P=R.pats.filter(q=>k?q.ph>=1:q.ph===0);let m=0;for(let i=1;i<P.length;i++)if(P[i].ph===P[i-1].ph&&P[i].pat!=='stagger'&&P[i-1].pat!=='stagger')m=Math.max(m,P[i].s-P[i-1].s);return +m.toFixed(2)});
  const ttk=R.ttk;const T=ttk||(G=>G.time-R.t0)(__G());
  return {name:nm,atk:R.atk,def:R.def,hpMax:R.max,catchUp:+R.catchUp.toFixed(2),bossHp:Math.round(R.bossHp),ttk:ttk==null?null:+ttk.toFixed(1),hpLeftBoss:R.hpLeft,
   taken:Math.round(sum(L)),takenPct:Math.round(sum(L)/R.max*100),bossDmg:Math.round(sum(boss)),hazDmg:Math.round(sum(haz)),bossPct:Math.round(sum(boss)/R.max*100),
   bossDps:+(sum(boss)/T).toFixed(2),allDps:+(sum(L)/T).toFixed(2),bossHits:boss.length,avgRaw:+(raws.reduce((a,b)=>a+b,0)/Math.max(1,raws.length)).toFixed(1),maxRaw:Math.max(0,...raws),
   attacks:R.pats.length,phases:R.phaseAt,gapMax:gaps.map(g=>g.length?+Math.max(...g).toFixed(2):null),gapAvg:gaps.map(g=>g.length?+(g.reduce((a,b)=>a+b,0)/g.length).toFixed(2):null),startToStartMax:s2s,
   idleMax:+R.idleMax.toFixed(2),minTele:(()=>{const v=R.pats.filter(q=>q.tele!=null).map(q=>q.tele);return v.length?Math.min(...v):null})(),teleByPat:R.pats.filter(q=>q.tele!=null).reduce((m,q)=>(m[q.pat]=Math.min(m[q.pat]??9,q.tele),m),{}),away:+R.away.toFixed(2),block:{on:BS.on,streaks:BS.streaks,blocks:BS.blocks,rate:BS.streaks?+(BS.blocks/BS.streaks).toFixed(2):0,blockedHits:BS.blockedHits,meleeHits:mh.length,blockedPct:mh.length?+(100*mh.filter(x=>x.guard==='格挡').length/mh.length).toFixed(1):0,breaks:BS.breaks,counters:BS.counters,guardT:+(BS.guardT||0).toFixed(1),staggerT:+(BS.staggerT||0).toFixed(1),lines:BS.lines,perMin:R.ttk?+(BS.blocks/R.ttk*60).toFixed(1):null},pats:Object.entries(R.pats.reduce((m,q)=>(m[q.pat]=(m[q.pat]||0)+1,m),{})).map(a=>a.join('×')).join(' ')}});
 await pg.close();return {stage,hero,blk,...r,errs:errs.slice(0,3)}}
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});
 const st=(process.env.STAGES||'1,2,3,4,5').split(',').map(Number),hs=(process.env.HERO||'normal,fresh,review').split(',');
 const REPS=+process.env.REPS||2;const BL=(process.env.BLOCK||'1').split(',').map(Number);const jobs=[];for(const bl of BL)for(const h of hs)for(const s of st)for(let k=0;k<REPS;k++)jobs.push([s,h,bl]);const out=[];
 const N=+process.env.PAR||5;for(let i=0;i<jobs.length;i+=N)out.push(...await Promise.all(jobs.slice(i,i+N).map(([s,h,bl])=>fight(b,s,h,bl))));
 for(const r of out){const exp=97+12*(r.stage-1);r.hitsNoGear=r.avgRaw?+(exp/r.avgRaw).toFixed(1):null;
  if(process.env.JSON)continue;
  console.log(`S${r.stage} ${r.hero.padEnd(6)} ${r.name} atk ${r.atk} def ${r.def} hp ${r.hpMax} cu ${r.catchUp} bossHp ${r.bossHp} | TTK ${r.ttk}s | 承伤 ${r.taken} (${r.takenPct}%) 首领 ${r.bossDmg} (${r.bossPct}%) 危害 ${r.hazDmg} | 首领DPS ${r.bossDps} 全部DPS ${r.allDps} | 首领命中 ${r.bossHits} 均 ${r.avgRaw} 最大 ${r.maxRaw} 无装备击杀需 ${r.hitsNoGear} 下 | 攻击 ${r.attacks} 间隔最大 P1 ${r.gapMax[0]} P2 ${r.gapMax[1]} (均 ${r.gapAvg}) 起-起最大 ${r.startToStartMax} | 发呆最长 ${r.idleMax}s 后退 ${r.away}s | ${JSON.stringify(r.phases)} | ${r.pats}${r.errs.length?' ERR '+r.errs:''} | 格挡${r.blk?'开':'关'} ${JSON.stringify(r.block)}`)}
 // 汇总：同一关同一英雄多次取平均（间隔 / 发呆 / 后退取最大）
 const G={};for(const r of out){const k=r.stage+' '+r.hero+' '+r.blk;(G[k]=G[k]||[]).push(r)}const avg=(L,f)=>{const v=L.map(f).filter(x=>x!=null);return v.length?+(v.reduce((a,b)=>a+b,0)/v.length).toFixed(1):null};
 const sum=[];for(const k in G){const L=G[k];const r0=L[0];sum.push({stage:r0.stage,hero:r0.hero,block:r0.blk,blockRate:avg(L,r=>r.block.rate),blocks:avg(L,r=>r.block.blocks),blocksPerMin:avg(L,r=>r.block.perMin),blockedPct:avg(L,r=>r.block.blockedPct),breaks:avg(L,r=>r.block.breaks),counters:avg(L,r=>r.block.counters),name:r0.name,atk:r0.atk,hp:r0.hpMax,catchUp:r0.catchUp,bossHp:r0.bossHp,n:L.length,ttk:avg(L,r=>r.ttk),timeouts:L.filter(r=>r.ttk==null).length,takenPct:avg(L,r=>r.takenPct),bossPct:avg(L,r=>r.bossPct),bossDps:avg(L,r=>r.bossDps),avgRaw:avg(L,r=>r.avgRaw),hitsNoGear:avg(L,r=>r.hitsNoGear),
  gapP1:Math.max(...L.map(r=>r.gapMax[0]||0)),gapP2:Math.max(...L.map(r=>r.gapMax[1]||0)),s2sP1:Math.max(...L.map(r=>r.startToStartMax[0])),s2sP2:Math.max(...L.map(r=>r.startToStartMax[1])),idleMax:Math.max(...L.map(r=>r.idleMax)),away:Math.max(...L.map(r=>r.away)),minTele:Math.min(...L.map(r=>r.minTele==null?9:r.minTele))})}
 // 格挡开 / 关对比：战斗变长多少
 const cmp=[];for(const a of sum)if(a.block){const b0=sum.find(x=>x.stage===a.stage&&x.hero===a.hero&&!x.block);if(b0&&a.ttk&&b0.ttk)cmp.push({stage:a.stage,hero:a.hero,ttkOn:a.ttk,ttkOff:b0.ttk,longerPct:+((a.ttk/b0.ttk-1)*100).toFixed(1)})}
 if(process.env.JSON)console.log(JSON.stringify({runs:out,sum,cmp}));else{console.log('SUMMARY');for(const r of sum)console.log(JSON.stringify(r));if(cmp.length){console.log('BLOCK_CMP');for(const c of cmp)console.log(JSON.stringify(c))}}
 if(process.env.OUTJSON)require('fs').writeFileSync(process.env.OUTJSON,JSON.stringify({runs:out,sum,cmp}));await b.close()})();
