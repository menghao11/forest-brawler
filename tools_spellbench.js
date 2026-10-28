// 法术 / 普攻 伤害比测量（第 9 轮）。每个法术单目标「整次施放总伤」（含灼烧、爆炸、多段）÷ 同一时刻「一次普攻平均伤害」（连招 1–4 段平均，不含暴击）。
// 场景：SCEN=s1|s2|s5（第 1 关小怪 / 第 2 关首领 / 第 5 关首领），HERO=fresh|geared（新存档 / 正常装备），默认全部跑。
// 用法：node tools_spellbench.js   或   SCEN=s2 HERO=geared node tools_spellbench.js；JSON=1 输出 JSON
const {chromium}=require('playwright-core');
const SC={s1:{stage:1,boss:0},s2:{stage:2,boss:1},s5:{stage:5,boss:1}};
const HERO={fresh:{s1:{atkLv:0,eq:{},clr:[]},s2:{atkLv:0,eq:{},clr:[]},s5:{atkLv:0,eq:{},clr:[]}},
 geared:{s1:{atkLv:5,eq:{weapon:'w1',armor:'a1',acc:'r1'},clr:[]},s2:{atkLv:12,eq:{weapon:'w2',armor:'a2',acc:'r2'},clr:[1]},s5:{atkLv:45,eq:{weapon:'w3',armor:'a3',acc:'r3'},clr:[1,2,3,4]}}};
const TGT={b:[2.5,3],m:[4,5],u:[9,11]};
async function bench(b,scen,hero){const pg=await b.newPage({viewport:{width:960,height:540}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto(process.env.URL||'http://localhost:8931/index.html');await pg.waitForTimeout(800);
 const S=SC[scen],H=HERO[hero][scen];
 await pg.evaluate(([S,H])=>{__dbg.resetSave();__dbg.unlockAll();PROFILE.cleared=H.clr.slice();__dbg.start(S.stage);__dbg.god(true);const G=__G();G.p.atkLv=H.atkLv;G.p.eq=Object.assign({},H.eq);G.p.owned=Object.values(H.eq);applyGear(G.p);__dbg.learnAll()},[S,H]);
 await pg.evaluate(()=>__dbg.skip(__G().B.waves.length-1));await pg.waitForTimeout(1500);
 const info=await pg.evaluate(S=>{const G=__G(),p=G.p;const boss=G.boss;G.enemies.forEach(e=>{if(e!==boss)e.dead=1});G.enemies=G.enemies.filter(e=>!e.dead);G.reinf=[];
  let t;if(S.boss)t=boss;else{boss.x=p.x-3000;boss.stun=1e9;t=spawn('goblin',0,0)}window.__T=t;
  return {atk:atk(),catchUp:+bossCatchUp().toFixed(3),spellPct:1+p.st.spell,bossPct:1+p.st.boss,crit:p.st.crit,target:t.def.name||t.type,res:{fire:resistOf(t,'fire'),ice:resistOf(t,'ice'),thunder:resistOf(t,'thunder')}}},S);
 const run=(fn,wait)=>pg.evaluate(async([fn,wait,isBoss])=>{const G=__G(),p=G.p,t=window.__T,boss=G.boss;G.enemies=G.enemies.filter(e=>e===t||e===boss);G.ep=[];G.hz=[];G.zones=[];G.pp=[];
   p.x=G.camX+300;p.y=(LANE_TOP+LANE_BOT)/2;p.face=1;p.dashT=0;const x0=p.x+90,y0=p.y;
   const pin=()=>{if(!isBoss){boss.x=p.x-3000;boss.stun=1e9}t.stun=5;t.x=x0;t.y=y0;t.z=0;t.vz=0;t.hidden=0;t.inv=0;t.state='walk';t.pat=null;t.frozen=0;t.hp=t.maxhp=1e8;t.dead=0};
   pin();t.burnT=0;__dbg.dmgLog('clear');__dbg.speed(4);const hold=setInterval(pin,8);await new Promise(r=>setTimeout(r,40));
   if(fn==='melee'){for(let k=0;k<25;k++)for(const c of [1,2,3,4])meleeHit(400,HIT[c][2],0,{all:1,src:'REF'})}
   else{p.cds={};p.gcd=0;p.mp=p.mpMax=999;p.castT=0;p.atkT=0;p.sel=p.spells.indexOf(fn);castSel()}
   await new Promise(r=>setTimeout(r,wait));clearInterval(hold);__dbg.speed(1);
   const L=__dbg.dmgLog(200).filter(r=>r.target===(t.def.name||t.type)||r.isBoss===isBoss&&isBoss);
   if(fn==='melee'){const R=L.filter(r=>r.src==='REF');return R.reduce((a,r)=>a+r.final/r.crit/r.other,0)/R.length}
   const nm=SP(fn).name;const R=L.filter(r=>r.src.startsWith(nm));return {total:R.reduce((a,r)=>a+r.final/r.crit,0),hits:R.length,burn:R.filter(r=>/灼烧/.test(r.src)).reduce((a,r)=>a+r.final/r.crit,0)}},[fn,wait,!!S.boss]);
 const ref=await run('melee',200);const ids=await pg.evaluate(()=>SPELLS.map(s=>({id:s.id,name:s.name,k:s.k,s:s.s,mp:s.mp,cd:s.cd})));const rows=[];
 for(const sp of ids){const r=await run(sp.id,2600);const ratio=r.total/ref;const f=info.spellPct*(S.boss?.75:1)*info.res[sp.s];
  rows.push({...sp,total:+r.total.toFixed(1),hits:r.hits,burn:+(r.burn/ref).toFixed(2),ratio:+ratio.toFixed(2),base:+(ratio/f).toFixed(2),ok:ratio/f>=TGT[sp.k][0]-.05&&ratio/f<=TGT[sp.k][1]+.05})}
 await pg.close();return {scen,hero,info,ref:+ref.toFixed(2),rows,errs}}
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});
 const scens=(process.env.SCEN||'s1,s2,s5').split(','),heroes=(process.env.HERO||'fresh,geared').split(',');
 const jobs=[];for(const s of scens)for(const h of heroes)jobs.push(bench(b,s,h));const R=await Promise.all(jobs);
 if(process.env.JSON)console.log(JSON.stringify(R));
 for(const r of R){console.log(`\n== ${r.scen} ${r.hero}: target ${r.info.target}, atk ${r.info.atk}, catchUp ${r.info.catchUp}, boss% ×${r.info.bossPct}, spell% ×${r.info.spellPct}, resist ${JSON.stringify(r.info.res)}, avg normal hit ${r.ref}`);
  for(const x of r.rows)console.log(`${x.ok?'  ':'XX'} ${x.id} ${x.name.padEnd(5,'　')} ${x.k} mp${x.mp} cd${x.cd}  total ${String(x.total).padStart(7)}  hits ${String(x.hits).padStart(3)}  ×hit ${String(x.ratio).padStart(5)}  base ${String(x.base).padStart(5)}  burn ${x.burn}`);
  if(r.errs.length)console.log('errs',r.errs.slice(0,3))}
 const bad=R.flatMap(r=>r.rows.filter(x=>!x.ok).map(x=>r.scen+'/'+r.hero+'/'+x.id));console.log(bad.length?'BENCH_OUT_OF_TARGET '+bad.join(' '):'BENCH_ALL_IN_TARGET');await b.close()})();
