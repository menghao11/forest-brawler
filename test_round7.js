// 第 7 轮测试：法术平衡（公共冷却、首领 ×0.75、与近战同追赶）、首领伤害%（固定攻击）、装备掉落提示（J/K/点按）+结算掉落列表、消息分道、调试命令、女巫营地传送
// 用法：node test_round7.js（桌面 8931，移动 8932）；截图存到 OUT（默认本目录）
const {chromium,devices}=require('playwright-core');
const URL=process.env.URL||'http://localhost:8931/index.html',MURL=process.env.MURL||'http://localhost:8932/game/index.html',OUT=process.env.OUT||__dirname;
const fails=[];const ok=(c,m)=>{if(!c){console.log('FAIL',m);fails.push(m)}else console.log('ok  ',m)};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});
 const pg=await b.newPage({viewport:{width:960,height:540}});const errs=[];pg.on('pageerror',e=>errs.push('PE '+e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 const ev=(f,a)=>pg.evaluate(f,a),W=ms=>pg.waitForTimeout(ms),shot=n=>pg.screenshot({path:OUT+'/'+n});
 await pg.goto(URL);await W(800);
 // 调试：关卡外 give 不报错并写进存档
 let r=await ev(()=>{__dbg.resetSave();try{const a=__dbg.give(100,20);return {a,exp:__dbg.profile().exp}}catch(e){return {err:String(e)}}});
 ok(!r.err&&r.exp===100,'关卡外 give() 不报错，写入存档 '+JSON.stringify(r));
 // 首领追赶按关卡进度；固定攻击下首领伤害% 生效
 await ev(()=>{__dbg.resetSave();__dbg.unlockAll();__dbg.start(2)});await W(300);
 r=await ev(()=>{const G=__G();const out={};
  out.cu=[0,1,2,3,4].map(i=>{G.idx=i;return +progCatchUp().toFixed(2)});G.idx=1;
  const p=G.p;const id=STAGES[1].boss;spawnBoss(id,p.x+300,p.y);const e=G.enemies[G.enemies.length-1];
  const hit=(d,elem)=>{e.inv=0;e.hp=e.maxhp=1e6;e.stun=0;e.frozen=0;damage(e,d,0,e.x+50,elem,{});return +(1e6-e.hp).toFixed(2)};
  p.st=Object.assign({},p.st,{crit:0,spell:0,boss:0});out.b0=hit(10);p.st.boss=.3;out.b30=hit(10);p.st.boss=0;out.atk16=hit(16);
  out.ice=hit(10,'ice');out.iceRes=resistOf(e,'ice');PROFILE.cleared.push(STAGES[0].id);out.afterClear=hit(10);out.prog=progCatchUp();out.gcu=gearCatchUp();return out});
 ok(Math.abs(r.b30/r.b0-1.3)<.01&&Math.abs(r.atk16/r.b0-1.6)<.01,'固定攻击 10：首领伤害+30% → ×'+(r.b30/r.b0).toFixed(2)+'；攻击 16 → ×'+(r.atk16/r.b0).toFixed(2)+' '+JSON.stringify(r));
 ok(Math.abs(r.ice-10*r.iceRes*.75*r.cu[1])<.05,'法术打首领 ×0.75，与近战同样吃追赶系数，首领抗性 ≥0.75 '+r.ice);
 ok(r.cu[0]===1&&r.cu[1]>1&&r.prog===1&&Math.abs(r.afterClear-10*Math.max(1,r.gcu))<.05,'关卡进度追赶系数（通关上一关后 =1，剩下只有装备追赶 ×'+(+r.gcu).toFixed(2)+'）'+JSON.stringify(r.cu));
 // 无敌
 await ev(()=>__dbg.start(1));await W(300);r=await ev(()=>{__dbg.god();const G=__G(),p=G.p;const d=hurtPlayer(9999);for(let i=0;i<6;i++)spawn('goblin',p.x+30+i*8,p.y,{});return {d,max:p.maxhp}});await W(3500);
 const g2=await ev(()=>({mode:__dbg.mode(),dead:__G().p.dead,hp:__G().p.hp,foes:__G().enemies.filter(e=>!e.dead).length}));
 ok(r.d===0&&g2.mode==='play'&&!g2.dead&&g2.hp===r.max,'god() 无敌：6 只哥布林围殴 3.5 秒血量不变 '+JSON.stringify(g2));
 await ev(()=>{__dbg.killAll()});
 await ev(()=>{__dbg.god(false)});
 // atk(10) 显示在 HUD
 r=await ev(()=>{__dbg.atk(10);return atk()});await W(200);await pg.screenshot({path:OUT+'/screenshot_dbg_hud.png',clip:{x:0,y:440,width:960,height:100}});
 const tag=await ev(()=>{const c=document.getElementById('c').getContext('2d').getImageData(860,60,100,12).data;let n=0;for(let i=0;i<c.length;i+=4)if(c[i]>200&&c[i+1]<130)n++;return n});
 ok(tag>10,'atk(10)：HUD 右上角红色“调试：伤害 ×10”标签 px='+tag);await ev(()=>__dbg.atk(1));
 // 公共冷却
 r=await ev(()=>{const G=__G(),p=G.p;__dbg.learnAll();p.mpMax=999;p.mp=999;p.cds={};p.gcd=0;p.sel=p.spells.indexOf('f1');return 1});
 await pg.keyboard.press('u');await W(60);
 r=await ev(()=>{const p=__G().p;const m1=p.mp,g=p.gcd;p.sel=p.spells.indexOf('t1');return {m1,g}});
 await pg.keyboard.press('u');await W(60);
 let r2=await ev(()=>({mp:__G().p.mp,t1:__G().p.cds.t1||0}));
 ok(Math.abs(r.m1-(999-20))<1&&r.g>0&&r2.mp<=r.m1+1&&r2.mp>=r.m1-.5&&!r2.t1,'公共冷却：火球后立刻换闪电不能施放 '+JSON.stringify({r,r2}));
 await W(900);await pg.keyboard.press('u');await W(60);r2=await ev(()=>__G().p.mp);ok(r2<r.m1,'公共冷却结束后可施放 mp='+r2);
 // 装备掉落提示：暂停、K 留在背包、J 装备，结算列出掉落
 await ev(()=>{__dbg.resetSave();__dbg.start(1)});await W(300);await ev(()=>{__dbg.gear('w1');__dbg.gear('a1');__G().drops=[]});await W(200);
 await ev(()=>{gainGear('w3');gainGear('a2');gainGear('r2');gainGear('w1')});
 r=await ev(()=>({open:gearOpen(),q:__G().gearQ.length,t:__G().t,eq:Object.assign({},__G().p.eq)}));await W(500);await shot('screenshot_gear_prompt.png');
 r2=await ev(()=>__G().t);
 ok(r.open&&r.q===2&&r.eq.weapon==='w1'&&r.eq.acc==='r2'&&r2===r.t,'Boss 装备不自动替换：2 件进提示队列（空槽位直接装），弹窗时游戏暂停 '+JSON.stringify(r));
 await pg.keyboard.press('k');await W(450);await pg.keyboard.press('j');await W(200);
 r=await ev(()=>({eq:__G().p.eq,own:__G().p.owned,open:gearOpen(),drops:__G().drops}));
 ok(r.eq.weapon==='w1'&&r.eq.armor==='a2'&&r.own.includes('w3')&&!r.open,'K 留在背包 / J 装备 '+JSON.stringify(r));
 await ev(()=>{stageClear()});await W(400);await shot('screenshot_results_drops.png');
 r=await ev(()=>({mode:__dbg.mode(),drops:RES.drops.map(d=>d.id+':'+d.res),bonus:RES.bonus,prof:__dbg.profile().eq}));
 ok(r.mode==='results'&&r.drops.length===4&&r.bonus===200&&r.prof.weapon==='w1','结算页列出掉落 + 通关奖励 '+JSON.stringify(r));
 // 消息分道：同时刷一堆提示，各占一条道
 await ev(()=>{__dbg.unlockAll();__dbg.start(3)});await W(300);await ev(()=>{msg('精英来袭！','#f66');msgExp(30);msgExp(25);msg('援军到达','#fa0');msg('法术冷却中 1.2 秒','#aaf',2);msg('按 → 前进');msg('首领已离开标记','#fcc');msg('+24 金币','#ffd34a')});await W(250);
 r=await ev(()=>__G().lanes.map(L=>L.map(m=>m.t)));await shot('screenshot_msg_lanes.png');
 ok(r.length===3&&r.every(L=>L.length>=1),'消息分 3 条固定道（每道同时只显示 1 条） '+JSON.stringify(r));
 // 女巫营地
 r=await ev(()=>({list:__dbg.witches(),go:__dbg.witch()}));await W(300);
 const near=await ev(()=>{const G=__G();return Math.abs(G.B.witches[0].x-G.p.x)<100});
 await pg.keyboard.press('e');await W(200);const menu=await ev(()=>!!__G().menu);await pg.keyboard.press('Escape');await W(150);
 const here=await ev(()=>__dbg.witch('here'));
 ok(r.go&&near&&menu&&here&&r.list,'__dbg.witch() 传送到营地并能打开女巫菜单；witch("here") 召唤 '+JSON.stringify(r.list));
 console.log('ERRS',errs.slice(0,8));
 // iPhone
 const d=devices['iPhone 14 landscape'];const mc=await b.newContext({...d,hasTouch:true,isMobile:true});const mp=await mc.newPage();const merr=[];mp.on('pageerror',e=>merr.push(String(e)));mp.on('console',m=>{if(m.type()==='error')merr.push(m.text())});
 await mp.goto(MURL);await mp.waitForTimeout(800);const cdp=await mc.newCDPSession(mp);
 const touch=async(x,y)=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});await mp.waitForTimeout(80);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await mp.waitForTimeout(200)};
 await mp.evaluate(()=>{__dbg.resetSave();__dbg.start(1)});await mp.waitForTimeout(300);await mp.evaluate(()=>{__dbg.gear('w1');__dbg.gear('a1');gainGear('w2');gainGear('a3')});await mp.waitForTimeout(500);
 await mp.screenshot({path:OUT+'/screenshot_gear_prompt_mobile.png'});
 const bj=await mp.locator('#bJ').boundingBox();await touch(bj.x+bj.width/2,bj.y+bj.height/2);
 const R=await mp.evaluate(()=>document.getElementById('c').getBoundingClientRect());
 await touch(R.left+(480+250-230+95)*R.width/960,R.top+(150+230-52+20)*R.height/540);
 r=await mp.evaluate(()=>({eq:__G().p.eq,open:gearOpen()}));
 ok(r.eq.weapon==='w2'&&r.eq.armor==='a1'&&!r.open,'iPhone：攻击键=立即装备，点“留在背包” '+JSON.stringify(r));
 await mp.evaluate(()=>{__dbg.atk(10);msg('精英来袭！','#f66');msgExp(30);msg('法术冷却中','#aaf',2)});await mp.waitForTimeout(300);await mp.screenshot({path:OUT+'/screenshot_round7_mobile.png'});
 await mp.evaluate(()=>{__dbg.atk(1);stageClear()});await mp.waitForTimeout(400);await mp.screenshot({path:OUT+'/screenshot_results_mobile.png'});
 console.log('MERRS',merr.slice(0,8));
 const bad=fails.length||errs.length||merr.length;console.log(bad?'ROUND7_FAIL':'ROUND7_PASS');await b.close();process.exit(bad?1:0)})();
