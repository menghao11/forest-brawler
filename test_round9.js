// 第 9 轮自动检查：终极法术 / 普攻倍率、公共冷却、连锁闪电弹跳、第 1 关自动通关（金币、首领掉落提示、消息分道）、iPhone
// 用法：node test_round9.js（桌面 8931，移动 8932）
const {chromium,devices}=require('playwright-core');
const URL=process.env.URL||'http://localhost:8931/index.html',MURL=process.env.MURL||'http://localhost:8932/game/index.html',OUT=process.env.OUT||__dirname;
const fails=[];const ok=(c,m)=>{if(!c){console.log('FAIL',m);fails.push(m)}else console.log('ok  ',m)};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});
 const pg=await b.newPage({viewport:{width:960,height:540}});const errs=[];pg.on('pageerror',e=>errs.push('PE '+e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 const ev=(f,a)=>pg.evaluate(f,a),W=ms=>pg.waitForTimeout(ms);
 await pg.goto(URL);await W(800);
 await ev(()=>{__dbg.resetSave();__dbg.start(1)});await W(300);
 // 魔力
 let r=await ev(()=>{const p=__G().p;return {mpMax:p.mpMax,mid:SPELLS.filter(s=>s.k==='m').map(s=>s.mp),ult:SPELLS.filter(s=>s.k==='u').map(s=>s.mp),basic:SPELLS.filter(s=>s.k==='b').map(s=>s.mp),regen:MP_REGEN}});
 ok(r.mpMax===150&&r.mid.every(m=>m>=45&&m<=50)&&r.ult.every(m=>m>=70&&m<=80),'魔力上限 150（回复 '+r.regen+'/秒），满条约 '+(150/Math.max(...r.mid)).toFixed(1)+'–'+(150/Math.min(...r.mid)).toFixed(1)+' 个中阶法术 '+JSON.stringify(r));
 // 普攻参考 + 终极倍率（单目标、整次施放）
 const prep=()=>ev(()=>{const G=__G(),p=G.p;__dbg.god(true);G.enemies=[];G.lockX=null;G.pp=[];G.zones=[];G.reinf=[];__dbg.learnAll();p.x=G.camX+300;p.y=(LANE_TOP+LANE_BOT)/2;p.face=1;p.st=Object.assign({},p.st,{crit:0});
  const t=spawn('goblin',p.x+90,p.y,{});window.__T=t;window.__X=[p.x+90,p.y];clearInterval(window.__H);window.__H=setInterval(()=>{if(t.dead)return;const G=__G();G.enemies=G.enemies.filter(e=>e===t);G.reinf=[];t.stun=5;t.x=__X[0];t.y=__X[1];t.z=0;t.hp=t.maxhp=1e8;t.frozen=0},8);__dbg.dmgLog('clear');return 1});
 await prep();
 const ref=await ev(()=>{for(let k=0;k<25;k++)for(const c of [1,2,3,4])meleeHit(400,HIT[c][2],0,{all:1,src:'REF'});const L=__dbg.dmgLog(200).filter(x=>x.src==='REF');return L.reduce((a,x)=>a+x.final/x.crit/x.other,0)/L.length});
 const ult={};
 for(const id of ['f6','i5','t4','t5']){await prep();await ev(id=>{const p=__G().p;p.cds={};p.gcd=0;p.mp=999;p.sel=p.spells.indexOf(id);__dbg.speed(4);castSel()},id);await W(2600);
  ult[id]=await ev(([id,ref])=>{__dbg.speed(1);const nm=SP(id).name;const L=__dbg.dmgLog(200).filter(x=>x.src.startsWith(nm));(window.__DL=window.__DL||{})[id]=L.map(x=>[x.t,x.final,x.other,x.target]);return +(L.reduce((a,x)=>a+x.final/x.crit,0)/ref).toFixed(2)},[id,ref])}
 if(process.env.DBG)console.log(await ev(()=>JSON.stringify(window.__DL)));
 ok(Object.values(ult).every(v=>v>=9&&v<=11),'终极法术 ÷ 一次普攻平均（'+ref.toFixed(1)+'）= '+JSON.stringify(ult)+'（目标 9–11）');
 // 公共冷却
 await prep();r=await ev(()=>{const p=__G().p;p.cds={};p.gcd=0;p.mp=999;p.sel=p.spells.indexOf('f1');castSel();const a=p.mp;p.sel=p.spells.indexOf('i1');castSel();return {after1:a,after2:p.mp,gcd:+p.gcd.toFixed(2),i1cd:p.cds.i1||0}});
 await W(900);const r2=await ev(()=>{const p=__G().p;const a=p.mp;castSel();return {cast:p.mp<a,i1cd:+(p.cds.i1||0).toFixed(2)}});
 ok(r.after2===r.after1&&!r.i1cd&&r.gcd>0&&r2.cast,'公共冷却：火球后立即冰锥被拒绝（GCD '+r.gcd+' 秒），0.9 秒后可放 '+JSON.stringify({r,r2}));
 // 连锁闪电
 r=await ev(()=>{const G=__G(),p=G.p;clearInterval(window.__H);G.enemies=[];__dbg.dmgLog('clear');const T=[];for(let i=0;i<6;i++){const e=spawn('goblin',p.x+100+i*70,p.y+(i%2?20:-20),{});e.hp=e.maxhp=1e6;e.stun=9;T.push(e)}
  p.cds={};p.gcd=0;p.mp=999;p.sel=p.spells.indexOf('t1');castSel();const L=__dbg.dmgLog(50).filter(x=>/连锁闪电/.test(x.src));return {n:L.length,targets:T.filter(e=>e.hp<1e6).length,dmg:L.map(x=>+(x.final/x.crit).toFixed(1)),src:L.map(x=>x.src)}});
 ok(r.n===4&&r.targets===4&&r.dmg.every((d,i)=>i===0||Math.abs(d/r.dmg[0]-(1-.1*i))<.02),'连锁闪电：弹跳 4 个不同敌人，每跳 -10% '+JSON.stringify(r.dmg));
 // 第 1 关自动通关：金币、首领掉落提示、消息分道
 await ev(()=>{clearInterval(window.__H);__dbg.resetSave();__dbg.start(1)});await W(300);
 await ev(()=>{const G=__G(),p=G.p;__dbg.god(true);__dbg.gear('w2');__dbg.gear('a2');__dbg.gear('r2');PROFILE.owned=p.owned.slice();PROFILE.eq=Object.assign({},p.eq);G.goldStart=p.gold;
  window.__LN={maxLane:0,samples:0,overlap:0,shown:new Set()};window.__LI=setInterval(()=>{const G=__G();if(!G||!G.lanes)return;const vis=G.lanes.map((L,i)=>L[0]?{i,t:L[0].t}:null).filter(Boolean);__LN.samples++;__LN.maxLane=Math.max(__LN.maxLane,vis.length);vis.forEach(v=>__LN.shown.add(v.i+':'+v.t));
   const ys=vis.map(v=>MSG_Y[v.i]);for(let a=0;a<ys.length;a++)for(let c=a+1;c<ys.length;c++)if(Math.abs(ys[a]-ys[c])<24)__LN.overlap++},50);__dbg.speed(3)});
 let bossPrompt=null,elitePrompts=0,shotDone=0;
 for(let k=0;k<900;k++){const m=await ev(()=>{const G=__G();if(__dbg.mode()!=='play')return {mode:__dbg.mode()};if(G.menu)G.menu=null;
   if(gearOpen()){const bossDead=G.enemies.some(e=>e.boss&&!e.mini&&e.dead)||G.clearT>0||G.clearPend;return {mode:'prompt',boss:bossDead,id:G.gearQ[0].id,t:G.t,qn:G.gearQ.length}}
   for(const e of G.enemies)if(!e.dead&&!e.hidden&&G.t-(e.bornT||0)>0){e.hp=Math.min(e.hp,1);damage(e,1e6,0,G.p.x,null,{src:'测试'})}
   for(const q of G.pickups){q.x=G.p.x;q.y=G.p.y;q.z=0;q.vz=0}
   if(G.lockX==null)G.p.x+=260;return {mode:'play',elite:G.enemies.some(e=>!e.dead&&e.def.elite),lanes:G.lanes.filter(L=>L[0]).length}});
  if(m.mode==='play'&&m.elite&&m.lanes>=2&&!shotDone){shotDone=1;await pg.screenshot({path:OUT+'/screenshot_r9_elite_lanes.png'})}
  if(m.mode==='prompt'){if(m.boss&&!bossPrompt){await W(500);const t2=await ev(()=>__G().t);await pg.screenshot({path:OUT+'/screenshot_r9_boss_prompt.png'});await pg.keyboard.press('k');await W(450);
     const after=await ev(n=>({open:gearOpen()&&__G().gearQ.length>=n,eq:Object.assign({},__G().p.eq),owned:__G().p.owned.slice()}),m.qn);bossPrompt={id:m.id,paused:t2===m.t,...after}}
   else{elitePrompts++;await ev(()=>{const id=G0();gearAnswer(false);const p=__G().p;p.owned=p.owned.filter(x=>x!==id);function G0(){return __G().gearQ[0].id}})}continue}
  if(m.mode!=='play')break;await W(60)}
 await W(500);const fin=await ev(()=>{clearInterval(window.__LI);__dbg.speed(1);return {mode:__dbg.mode(),gold:__dbg.goldLog(),drops:RES&&RES.drops,lanes:{max:__LN.maxLane,overlap:__LN.overlap,samples:__LN.samples,distinct:__LN.shown.size}}});
 await pg.screenshot({path:OUT+'/screenshot_r9_results.png'});
 console.log('STAGE1',JSON.stringify(fin));
 ok(fin.mode==='results'&&fin.gold.length===1&&fin.gold[0].gold>=500&&fin.gold[0].gold<=800,'第 1 关通关金币 '+JSON.stringify(fin.gold[0])+'（1 阶装备 250–300）');
 ok(bossPrompt&&bossPrompt.paused&&!bossPrompt.open&&bossPrompt.owned.includes(bossPrompt.id)&&!Object.values(bossPrompt.eq).includes(bossPrompt.id),'首领掉落【'+(bossPrompt&&bossPrompt.id)+'】弹出提示、游戏暂停，按 K 留在背包，未替换已装备 '+JSON.stringify(bossPrompt));
 ok(fin.drops&&fin.drops.some(d=>bossPrompt&&d.id===bossPrompt.id&&d.res==='bag'),'结算页列出首领掉落 '+JSON.stringify(fin.drops));
 ok(fin.lanes.overlap===0&&fin.lanes.max<=3&&fin.lanes.distinct>5,'整关消息分道：'+fin.lanes.samples+' 次采样，同时最多 '+fin.lanes.max+' 条，重叠 '+fin.lanes.overlap+' 次，共 '+fin.lanes.distinct+' 种消息');
 console.log('ERRS',errs.slice(0,8));
 // iPhone：魔力条 150、施法
 const d=devices['iPhone 14 landscape'];const mc=await b.newContext({...d,hasTouch:true,isMobile:true});const mp=await mc.newPage();const merr=[];mp.on('pageerror',e=>merr.push(String(e)));mp.on('console',m=>{if(m.type()==='error')merr.push(m.text())});
 await mp.goto(MURL);await mp.waitForTimeout(800);await mp.evaluate(()=>{__dbg.resetSave();__dbg.start(1)});await mp.waitForTimeout(400);
 await mp.evaluate(()=>{const p=__G().p;p.spells=['f1','t1'];p.sel=0;p.mp=150});const cdp=await mc.newCDPSession(mp);const box=await mp.locator('#bU').boundingBox();
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2,id:1}]});await mp.waitForTimeout(80);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await mp.waitForTimeout(300);
 r=await mp.evaluate(()=>({mpMax:__G().p.mpMax,mp:Math.round(__G().p.mp)}));await mp.screenshot({path:OUT+'/screenshot_r9_mobile.png'});
 ok(r.mpMax===150&&r.mp>=129&&r.mp<=131,'iPhone：魔力上限 150，施法扣 20 '+JSON.stringify(r));console.log('MERRS',merr.slice(0,8));
 const bad=fails.length||errs.length||merr.length;console.log(bad?'ROUND9_FAIL':'ROUND9_PASS');await b.close();process.exit(bad?1:0)})();
