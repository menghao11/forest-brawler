// 第 10 轮：首领更凶。追赶系数上限、各首领 50% 进入二阶段 + 提示、机器人首领战（间隔 / 发呆 / 后退 / 前摇 / 时长 / 击杀所需次数）、iPhone
const {chromium,devices}=require('playwright-core');const {execFileSync}=require('child_process');
const URL=process.env.URL||'http://localhost:8931/index.html',MURL=process.env.MURL||'http://localhost:8932/game/index.html',OUT=process.env.OUT||__dirname;
const fails=[];const ok=(c,m)=>{if(!c){console.log('FAIL',m);fails.push(m)}else console.log('ok  ',m)};
async function toBoss(pg,s,hp){await pg.evaluate(([s,hp])=>{__dbg.start(s);const G=__G(),p=G.p,B=G.B;G.enemies=[];G.wave=B.waves.length-1;G.lockX=null;const wx=B.waves[G.wave].x;G.camX=wx;p.x=wx+W*.4+10;p.y=(LANE_TOP+LANE_BOT)/2;__dbg.god(true)},[s,hp]);await pg.waitForTimeout(500)}
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const pg=await b.newPage({viewport:{width:960,height:540}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await pg.goto(URL);await pg.waitForTimeout(800);
 const cu=await pg.evaluate(()=>{__dbg.resetSave();__dbg.unlockAll();const r=[];for(let s=1;s<=5;s++){__dbg.start(s);r.push(+bossCatchUp().toFixed(2))}PROFILE.cleared=STAGES.slice(0,4).map(x=>x.id);__dbg.start(5);r.push(bossCatchUp());return r});
 ok(JSON.stringify(cu)==='[1,1.77,2.37,2.5,2.5,1]','追赶系数（新存档直接打 1–5 关）上限 2.5：'+JSON.stringify(cu.slice(0,5))+'，按进度通关后 = '+cu[5]);
 const ph=await pg.evaluate(()=>['goblin_chief','great_yeti','flame_king','goblin_king','vampire_count'].map(k=>BOSSES[k].phases[1].at));ok(ph.every(a=>a===.5),'5 个首领都在 50% 血量进入二阶段 '+JSON.stringify(ph));
 for(let s=1;s<=5;s++){await pg.evaluate(()=>{__dbg.resetSave();__dbg.unlockAll()});await toBoss(pg,s);
  await pg.evaluate(()=>{const e=__G().boss;e.pat=null;e.hp=e.maxhp*.49});await pg.waitForTimeout(250);
  const r=await pg.evaluate(()=>{const G=__G(),e=G.boss;return {phase:e.phase,cue:!!G.bossCue,inv:e.inv>0,name:e.def.name,lanes:G.lanes.filter(L=>L[0]).map(L=>L[0].t)}});
  if(s===3)await pg.screenshot({path:OUT+'/screenshot_r10_phase2.png'});
  ok(r.phase===1&&r.cue&&r.lanes.length>0,'第 '+s+' 关【'+r.name+'】49% 血量 → 二阶段，红色闪屏 + 「吼——！」大字 + 消息 '+JSON.stringify(r.lanes))}
 console.log('ERRS',errs.slice(0,5));
 // 机器人首领战
 const js=JSON.parse(execFileSync('node',[__dirname+'/tools_bossfight.js'],{env:{...process.env,HERO:'normal',REPS:'1',JSON:'1'},maxBuffer:1e8}).toString().trim().split('\n').pop());
 for(const r of js.sum){const s=r.stage;
  ok(r.ttk>=45&&r.ttk<=90,`第 ${s} 关 ${r.name}：正常装备站桩普攻 TTK ${r.ttk} 秒（45–90）`);
  ok(s===1?r.hitsNoGear>=9.5&&r.hitsNoGear<=12.5:r.hitsNoGear>=5.8&&r.hitsNoGear<=9,`第 ${s} 关：无装备英雄约 ${r.hitsNoGear} 下被击倒（目标 ${s===1?'10–12':'6–9'}）`);
  ok(r.gapP1<=2.5&&r.gapP2<=1.8,`第 ${s} 关：攻击间空档最长 一阶段 ${r.gapP1} 秒 / 二阶段起 ${r.gapP2} 秒`);
  ok(r.idleMax<=1&&r.away===0,`第 ${s} 关：玩家在身边时发呆最长 ${r.idleMax} 秒，自主后退 ${r.away} 秒`);
  ok(r.minTele>=.38,`第 ${s} 关：近战出招前摇最短 ${r.minTele} 秒`)}
 const d=devices['iPhone 14 landscape'];const mc=await b.newContext({...d,hasTouch:true,isMobile:true});const mp=await mc.newPage();const merr=[];mp.on('pageerror',e=>merr.push(String(e)));mp.on('console',m=>{if(m.type()==='error')merr.push(m.text())});
 await mp.goto(MURL);await mp.waitForTimeout(800);await mp.evaluate(()=>{__dbg.resetSave();__dbg.unlockAll()});await toBoss(mp,5);
 await mp.evaluate(()=>{const e=__G().boss;e.pat=null;e.hp=e.maxhp*.49});await mp.waitForTimeout(300);const r=await mp.evaluate(()=>({phase:__G().boss.phase,cue:!!__G().bossCue}));
 await mp.screenshot({path:OUT+'/screenshot_r10_phase2_mobile.png'});ok(r.phase===1&&r.cue,'iPhone：伯爵 50% 二阶段提示 '+JSON.stringify(r));console.log('MERRS',merr.slice(0,5));
 const bad=fails.length||errs.length||merr.length;console.log(bad?'ROUND10_FAIL':'ROUND10_PASS');await b.close();process.exit(bad?1:0)})();
