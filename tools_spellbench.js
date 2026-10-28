// 法术伤害测量：第 2 关首领（眩晕固定）与普通敌人（大血量假人），攻击力固定，无装备
const {chromium}=require('playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const pg=await b.newPage({viewport:{width:960,height:540}});
const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto(process.env.URL||'http://localhost:8931/index.html');await pg.waitForTimeout(800);
const STAGE=+(process.env.STAGE||1),ATKLV=+(process.env.ATKLV||0);
await pg.evaluate(([s,a])=>{__dbg.resetSave();__dbg.unlockAll();__dbg.start(s+1);__dbg.god(true);const G=__G();G.p.atkLv=a;G.p.eq={};applyGear(G.p);__dbg.learnAll()},[STAGE,ATKLV]);
await pg.evaluate(()=>__dbg.skip(__G().B.waves.length-1));await pg.waitForTimeout(1500);
const ids=await pg.evaluate(()=>SPELLS.map(s=>s.id));const rows=[];
async function measure(kind,fn){return pg.evaluate(async([kind,fn])=>{const G=__G(),p=G.p;
  const boss=G.boss;G.enemies.forEach(e=>{if(e!==boss){e.dead=1}});G.enemies=G.enemies.filter(e=>!e.dead);G.ep=[];G.hz=[];G.zones=[];G.pp=[];
  let t;if(kind==='boss'){t=boss}else{boss.x=p.x-3000;boss.stun=99;t=spawn('goblin',0,0)}
  t.maxhp=t.hp=1e7;t.x=p.x+90;t.y=p.y;t.z=0;t.hidden=0;t.inv=0;p.face=1;t.burnT=0;
  __dbg.speed(4);const hold=setInterval(()=>{if(kind!=='boss'){boss.x=p.x-3000;boss.stun=99}t.stun=5;t.x=p.x+90;t.y=p.y;t.z=0;t.hidden=0;t.inv=0;t.state='walk';t.pat=null;t.frozen=0},16);
  const h0=t.hp;await new Promise(r=>setTimeout(r,50));
  if(fn==='melee'){p.combo=0;p.comboWin=0;p.bufJ=.3}else{p.cds={};p.gcd=0;p.mp=p.mpMax=999;p.castT=0;p.atkT=0;p.sel=p.spells.indexOf(fn);castSel()}
  await new Promise(r=>setTimeout(r,fn==='melee'?400:1700));clearInterval(hold);__dbg.speed(1);const d=h0-t.hp;if(kind!=='boss'){t.dead=1}return Math.round(d)},[kind,fn])}
const mHit=await measure('dummy','melee'),mBoss=await measure('boss','melee');
console.log('atk',await pg.evaluate(()=>atk()),'melee hit: dummy',mHit,'boss',mBoss);
for(const id of ids){const r=await pg.evaluate(id=>{const s=SP(id);return {id,name:s.name,mp:s.mp,cd:s.cd}},id);r.dummy=await measure('dummy',id);r.boss=await measure('boss',id);r.xHit=+(r.dummy/mHit).toFixed(1);rows.push(r);console.log(JSON.stringify(r))}
console.log('errs',errs.slice(0,3));await b.close()})();
