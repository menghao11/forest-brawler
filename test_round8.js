// 第 8 轮测试：伤害日志 dmgLog / dmgStats / goldLog、start(n) 按关卡编号（1 起）、atk() 作用于全部伤害（含法术）
// 用法：node test_round8.js（桌面 8931，移动 8932）
const {chromium,devices}=require('playwright-core');
const URL=process.env.URL||'http://localhost:8931/index.html',MURL=process.env.MURL||'http://localhost:8932/game/index.html',OUT=process.env.OUT||__dirname;
const fails=[];const ok=(c,m)=>{if(!c){console.log('FAIL',m);fails.push(m)}else console.log('ok  ',m)};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});
 const pg=await b.newPage({viewport:{width:960,height:540}});const errs=[],tables=[];pg.on('pageerror',e=>errs.push('PE '+e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text());if(m.type()==='table')tables.push(m.text())});
 const ev=(f,a)=>pg.evaluate(f,a),W=ms=>pg.waitForTimeout(ms);
 await pg.goto(URL);await W(800);
 // start(n) 1 起
 let r=await ev(()=>{__dbg.resetSave();__dbg.unlockAll();const z=__dbg.start(0);return {z}});
 const r1=await ev(()=>{__dbg.start(1);return __G().S.id});await W(200);const r2=await ev(()=>{__dbg.start(2);return __G().S.id});
 ok(r.z===false&&r1===1&&r2===2,'start(1)=第 1 关、start(2)=第 2 关、start(0) 拒绝并提示 '+JSON.stringify({r,r1,r2}));
 await ev(()=>{__dbg.resetSave();__dbg.start(1)});await W(300);
 // 木桩：攻击 ×1 与 ×10 下普攻 / 法术 / 灼烧 比例
 const setup=()=>ev(()=>{const G=__G(),p=G.p;G.enemies=[];G.lockX=null;G.pp=[];G.zones=[];p.st=Object.assign({},p.st,{crit:0,spell:0,boss:0});p.face=1;
  spawn('goblin',p.x+60,p.y,{});const e=G.enemies[G.enemies.length-1];e.hp=e.maxhp=1e7;e.ai=null;e.stun=99;__dbg.learnAll();p.mpMax=999;p.mp=999;p.cds={};p.gcd=0;__dbg.dmgLog('clear');return 1});
 const run=async m=>{await setup();await ev(m=>{__dbg.atk(m);const p=__G().p;meleeHit(120,1,0,{src:'普攻 第1段'});p.sel=p.spells.indexOf('f1');castSel()},m);await W(1800);
  return ev(()=>{const L=__dbg.dmgLog(200);const f=s=>L.filter(r=>r.src===s).reduce((a,r)=>a+r.final,0);return {melee:f('普攻 第1段'),meleeRaw:L.filter(r=>r.src==='普攻 第1段').reduce((a,r)=>a+r.raw,0),f1:f('火球术 Lv1'),burnN:L.filter(r=>r.src==='火球术 Lv1 · 灼烧').length,burn1:(L.find(r=>r.src==='火球术 Lv1 · 灼烧')||{}).final,dbg:L.map(r=>r.atkDbg)}})};
 const A=await run(1),B=await run(10);
 ok(Math.abs(B.f1/A.f1-10)<.01&&Math.abs(B.burn1/A.burn1-10)<.01&&Math.abs((B.melee/B.meleeRaw)/(A.melee/A.meleeRaw)-10)<.01&&B.dbg.every(x=>x===10),
  'atk(10) 对普攻、法术、灼烧都 ×10（比例不变）'+JSON.stringify({f1:[A.f1,B.f1],burn:[A.burn1,B.burn1],melee:[+(A.melee/A.meleeRaw).toFixed(2),+(B.melee/B.meleeRaw).toFixed(2)]}));
 await W(200);await pg.screenshot({path:OUT+'/screenshot_dbg_atk_tag.png',clip:{x:600,y:0,width:360,height:90}});
 await ev(()=>__dbg.atk(1));
 // 首领：追赶 / Boss% / 法术 ×0.6 记录；连锁弹跳；玩家受击；地形
 await ev(()=>{__dbg.start(2)});await W(300);
 r=await ev(()=>{const G=__G(),p=G.p;G.enemies=[];G.lockX=null;__dbg.dmgLog('clear');p.st=Object.assign({},p.st,{crit:0,spell:0,boss:.3});
  spawnBoss(STAGES[1].boss,p.x+80,p.y);const e=G.enemies[G.enemies.length-1];e.hp=e.maxhp=1e7;p.face=1;meleeHit(200,1,0,{src:'普攻 第2段'});
  damage(e,10,0,e.x+50,'fire',{src:'火球术 Lv1'});
  for(let i=0;i<3;i++){spawn('goblin',p.x+150+i*40,p.y,{});G.enemies[G.enemies.length-1].hp=1e6}chainBolt(p.x,p.y,3,10,.1);
  __dbg.god(false);p.inv=0;hurtPlayer(12,G.enemies.find(x=>!x.boss));p.inv=0;hurtPlayer(9,{k:'crack',rx:50,cyc:{}});p.hp=p.maxhp;
  for(let i=0;i<260;i++)damage(G.enemies[1],1,0,p.x,null,{src:'填充'});return __dbg.dmgLog(300)});
 const L=r,bossMel=L.find(x=>x.src==='普攻 第2段'&&x.isBoss),bossSp=L.find(x=>x.src==='火球术 Lv1'&&x.isBoss);
 ok(L.length===200,'环形缓冲最多 200 条 '+L.length);
 r=await ev(()=>{const G=__G(),p=G.p;__dbg.dmgLog('clear');const e=G.enemies.find(x=>x.boss);meleeHit(400,1,0,{src:'普攻 第2段'});damage(e,10,0,e.x+50,'fire',{src:'火球术 Lv1'});
  __dbg.skipIntro();for(const x of G.enemies)if(!x.boss){x.dead=0;x.spawnT=0}chainBolt(p.x,p.y,3,10,.1);p.inv=0;G.bossHitT=null;hurtPlayer(12,G.enemies.find(x=>!x.boss&&x.def));p.inv=0;G.bossHitT=null;hurtPlayer(9,{k:'crack',rx:50,cyc:{}});p.hp=p.maxhp;return __dbg.dmgLog(50)});
 const bm=r.find(x=>x.src==='普攻 第2段'&&x.isBoss),bs=r.find(x=>x.src==='火球术 Lv1'&&x.isBoss),ch=r.filter(x=>/连锁弹跳/.test(x.src)),ph=r.filter(x=>x.target==='玩家');
 ok(bm&&Math.abs(bm.catchUp-1.99)<.01&&bm.bossPct===1.3&&bm.spellBoss===1,'日志：首领近战记录追赶 ×1.99（第 13 轮）、Boss% ×1.3 '+JSON.stringify(bm));
 ok(bs&&Math.abs(bs.catchUp-1.99)<.01&&bs.spellBoss===.75&&bs.resist===STAGE2_FIRE(bs),'日志：法术打首领记录 ×0.75、同样的追赶系数、抗性 '+JSON.stringify(bs));
 ok(ch.length>=2,'日志：连锁弹跳逐跳记录 '+ch.map(x=>x.src).join(' / '));
 ok(ph.length===2&&ph.some(x=>!/^地形/.test(x.src))&&ph.some(x=>x.src==='地形 · 地裂'),'日志：玩家受击记录敌人名 / 地形 '+JSON.stringify(ph.map(x=>[x.src,x.raw,x.final])));
 const bad=r.filter(x=>x.target!=='玩家').filter(x=>Math.abs(x.raw*x.atkDbg*x.catchUp*x.bossPct*x.spellBoss*x.spellPct*x.resist*x.crit*x.other-x.final)>.02*Math.max(1,x.final));
 ok(!bad.length,'每条记录：原始 × 各乘数 = 最终 '+JSON.stringify(bad.slice(0,2)));
 r=await ev(()=>__dbg.dmgStats());ok(r.length>=4&&r.every(o=>o.hits>0&&Math.abs(o.avg-o.total/o.hits)<.1),'dmgStats() 按来源汇总（次数 / 总伤 / 平均 / 最大）'+JSON.stringify(r.slice(0,3)));
 ok(tables.length>=3,'console.table 输出 '+tables.length);
 // goldLog
 await ev(()=>{__dbg.start(1)});await W(300);await ev(()=>{__G().p.gold+=37;stageClear()});await W(200);
 r=await ev(()=>__dbg.goldLog());ok(r.length===1&&r[0].stage===1&&r[0].bonus===200&&r[0].gold===237&&r[0].coins===37,'goldLog() 记录每关金币 '+JSON.stringify(r));
 console.log('ERRS',errs.slice(0,8));
 // iPhone
 const d=devices['iPhone 14 landscape'];const mc=await b.newContext({...d,hasTouch:true,isMobile:true});const mp=await mc.newPage();const merr=[];mp.on('pageerror',e=>merr.push(String(e)));mp.on('console',m=>{if(m.type()==='error')merr.push(m.text())});
 await mp.goto(MURL);await mp.waitForTimeout(800);
 r=await mp.evaluate(()=>{__dbg.resetSave();return __dbg.start(1)});await mp.waitForTimeout(400);
 r=await mp.evaluate(()=>{__dbg.atk(10);const G=__G(),p=G.p;spawn('goblin',p.x+60,p.y,{});p.face=1;meleeHit(120,1,0,{src:'普攻 第1段'});return {id:G.S.id,log:__dbg.dmgLog(5).length}});await mp.waitForTimeout(300);
 await mp.screenshot({path:OUT+'/screenshot_round8_mobile.png'});
 ok(r.id===1&&r.log>=1,'iPhone：start(1) = 第 1 关，日志可用 '+JSON.stringify(r));
 console.log('MERRS',merr.slice(0,8));
 const fail=fails.length||errs.length||merr.length;console.log(fail?'ROUND8_FAIL':'ROUND8_PASS');await b.close();process.exit(fail?1:0)})();
function STAGE2_FIRE(x){return x.resist}
