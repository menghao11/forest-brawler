// 第 15 轮（评审复测 v20261028l）：drawAtlas 越界报错 / 首领变暗、装备落后的追赶系数、登场黑边 / 3 秒上限 / 冻结 / 跳过
const {chromium,devices}=require('playwright-core');
const URL=process.env.URL||'http://localhost:8931/index.html',MURL=process.env.MURL||'http://localhost:8932/game/index.html',OUT=process.env.OUT||__dirname;
const fails=[];const ok=(c,m)=>{if(!c){console.log('FAIL',m);fails.push(m)}else console.log('ok  ',m)};
// 走到首领波次；fresh=是否清空登场记录（首次登场 2 句）
async function toBoss(pg,s,o={}){await pg.evaluate(([s,o])=>{__dbg.speed(1);__dbg.god(false);__dbg.resetSave();__dbg.unlockAll();PROFILE.cleared=STAGES.slice(0,s-1).map(x=>x.id);if(o.seen)PROFILE.introSeen=Object.fromEntries(Object.keys(BOSS_INTRO).map(k=>[k,1]));__dbg.start(s);const G=__G(),p=G.p;
  if(o.gear){p.atkLv=2;p.eq={weapon:'w2',armor:'a2',acc:'r4'};p.owned=Object.values(p.eq);applyGear(p,true)}
  if(!o.keep)G.enemies=[];G.wave=G.B.waves.length-1;G.lockX=null;G.camX=G.B.waves[G.wave].x;p.x=G.camX+W*.4+10;p.y=(LANE_TOP+LANE_BOT)/2;p.inv=0;p.hp=p.maxhp;window.__t0=null},[s,o]);
 await pg.waitForFunction(()=>__G().boss,null,{timeout:15000,polling:16})}
const cvPix=(pg,pts)=>pg.evaluate(pts=>{const c=document.querySelector('canvas'),x=c.getContext('2d');return pts.map(([a,b])=>{const d=x.getImageData(a*c.width/960|0,b*c.height/540|0,1,1).data;return Math.round((d[0]+d[1]+d[2])/3)})},pts);
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const pg=await b.newPage({viewport:{width:960,height:540}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await pg.goto(URL);await pg.waitForTimeout(900);
 // 1) drawAtlas：负数 / NaN / 越界 / 缺帧都不抛错
 let r=await pg.evaluate(()=>{const o=[];const A=VAMPIRE_ATLAS;for(const [an,t,loop] of [['attack',-.13,true],['attack',-5,false],['attack',NaN,true],['attack',1e9,false],['nope',-1,true],['attack',Infinity,true]]){try{drawAtlas(A,'vamp',an,t,100,300,1,1,loop,8);o.push('ok')}catch(e){o.push(String(e))}}
  const B={anims:{x:['missing'],idle:['missing2']},frames:{}};try{drawAtlas(B,'vamp','x',0,1,1,1,1);o.push('ok')}catch(e){o.push(String(e))}return o});
 ok(r.every(x=>x==='ok'),'drawAtlas：负数 / NaN / 无穷 / 越界 / 缺帧 → 夹回范围或退回 idle，不抛错 '+JSON.stringify(r));
 // 根因复现：伯爵格挡反击 rapier 时 patT=-0.1 → 旧代码 floor(-0.16*8)%n = -2 → 报错
 await toBoss(pg,5,{seen:1});await pg.evaluate(()=>__dbg.skipIntro());
 r=await pg.evaluate(async()=>{const G=__G(),e=G.boss;e.introWait=0;window.__lastErr=null;const a=[];for(let k=0;k<6;k++){e.guard=.0001;e.counter=1;guardTick(e,.01);a.push([e.pat,+e.patT.toFixed(2),enemyAnim(e)[0]]);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));e.pat=null}return {a,err:window.__lastErr}});
 ok(r.a[0][0]==='rapier'&&r.a[0][1]<0&&!r.err,'第 5 关伯爵格挡反击（patT=-0.1）绘制正常，无 TypeError '+JSON.stringify(r));
 // 第 5 关二阶段实战 12 秒（无敌、格挡 always）：无帧报错
 r=await pg.evaluate(async()=>{const G=__G(),e=G.boss;__dbg.god(true);__dbg.block('always');e.hp=e.maxhp*.45;window.__lastErr=null;__dbg.speed(4);
   const bot=setInterval(()=>{const p=G.p;for(const k of ['arrowleft','arrowright','arrowup','arrowdown'])keys[k]=false;const dx=e.x-p.x,dy=e.y-p.y;if(Math.abs(dx)>85)keys[dx>0?'arrowright':'arrowleft']=true;if(Math.abs(dy)>8)keys[dy>0?'arrowdown':'arrowup']=true;if(Math.abs(dx)<110)pressed.j=true;e.hp=Math.max(e.hp,e.maxhp*.3)},10);
   await new Promise(r=>setTimeout(r,3000));clearInterval(bot);__dbg.speed(1);__dbg.god(false);const bs=__dbg.block('stats');__dbg.block(true);return {err:window.__lastErr,blocks:bs.blocks,counters:bs.counters}});
 ok(!r.err,'第 5 关实战（格挡 always，约 12 游戏秒）：格挡 '+r.blocks+' 次、反击 '+r.counters+' 次，无帧报错 '+(r.err||''));
 // 2) 追赶：装备落后（Lv2 + 首领+30%，正常通关进度）
 const cu={};for(const s of [3,5]){await toBoss(pg,s,{gear:1,seen:1});cu[s]=await pg.evaluate(()=>({atk:atk(),boss:__G().p.st.boss,cu:+bossCatchUp().toFixed(2),prog:+progCatchUp().toFixed(2)}))}
 ok(cu[3].prog===1&&cu[5].prog===1&&cu[3].cu>=1.2&&cu[3].cu<=1.35&&cu[5].cu>=1.9&&cu[5].cu<=2.1&&cu[5].boss===.3,'Lv2 + 首领伤害+30%（正常进度）：追赶按实际攻击 '+JSON.stringify(cu));
 const nm=await pg.evaluate(()=>{__dbg.resetSave();__dbg.unlockAll();PROFILE.cleared=STAGES.slice(0,4).map(x=>x.id);__dbg.start(5);const p=__G().p;p.atkLv=10;p.eq={weapon:'w4',armor:'a3',acc:'r3'};applyGear(p,true);return +bossCatchUp().toFixed(2)});
 ok(nm<=1.05,'正常装备第 5 关追赶 ≈1：'+nm);
 // 3) 登场：首次（2 句）第 5 关，不按键
 await toBoss(pg,5);const t0=Date.now();await pg.waitForTimeout(700);
 const pix=await cvPix(pg,[[480,20],[480,525],[300,25],[700,515]]);
 r=await pg.evaluate(()=>{const G=__G(),e=G.boss,p=G.p;return {intro:!!G.bossIntro,dur:G.bossIntro&&G.bossIntro.dur,time:G.time,ex:e.x,hp:p.hp,say:G.say&&G.say.text,blocked:hurtPlayer(20,e),hp2:p.hp}});
 await pg.screenshot({path:OUT+'/screenshot_r15_intro.png'});
 ok(r.intro&&r.dur<=3&&pix.every(v=>v<45),'登场上下黑边清晰（94% 不透明 + 金边），黑边处亮度 '+JSON.stringify(pix));
 ok(r.blocked===0&&r.hp2===r.hp,'登场中玩家受伤被挡（登场）');
 await pg.waitForTimeout(1000);const r2=await pg.evaluate(()=>{const G=__G();return {time:G.time,ex:G.boss.x,say:G.say&&G.say.text}});
 ok(r2.time===r.time&&r2.ex===r.ex,'登场中战场冻结（游戏时间 / 首领位置不变）');
 await pg.waitForFunction(()=>!__G().bossIntro,null,{timeout:6000,polling:16});const len=(Date.now()-t0)/1000;
 ok(len<=3.3,'第 5 关首次登场共 '+len.toFixed(2)+' 秒（硬上限 3 秒 + 测量误差），2 句：'+JSON.stringify([r.say,r2.say]));
 ok(r.say&&r2.say&&r.say!==r2.say,'首次登场 2 句都在 3 秒内说完');
 // 4) 第 1 关：带小怪、站着不动，登场 + 结束后 1 秒不掉血，首领 1 秒内不出招
 await toBoss(pg,1,{keep:1});r=await pg.evaluate(async()=>{const G=__G(),p=G.p,e=G.boss;p.inv=0;const hp0=p.hp;
   for(let i=0;i<3;i++){spawn('goblin_archer',p.x+60+i*30,p.y+(i-1)*20,{});const a=G.enemies[G.enemies.length-1];a.cd=0}
   G.ep.push({k:'arrow',x:p.x+30,y:p.y,z:30,vx:-200,vy:0,dmg:20,t:0});
   while(G.bossIntro)await new Promise(r=>setTimeout(r,16));const tEnd=G.time,ep=G.ep.length;let pat=null,patAt=null,hpEnd=p.hp;
   while(G.time-tEnd<1.0){if(e.pat&&!pat){pat=e.pat;patAt=G.time-tEnd}await new Promise(r=>setTimeout(r,16))}
   return {hp0,hpEnd,hp1:p.hp,pat,patAt,ep,adds:G.enemies.length}});
 ok(r.hpEnd===r.hp0&&r.hp1===r.hp0&&!r.pat&&r.ep===0,'第 1 关站着不动：登场中 + 结束后 1 秒不掉血（'+r.hp0+'→'+r.hp1+'），首领 1 秒内不出招，开场投射物已清除 '+JSON.stringify(r));
 // 5) 跳过：J / Esc / 点击
 for(const how of ['j','Escape','click']){await toBoss(pg,2);await pg.waitForTimeout(300);
  const c0=await pg.evaluate(()=>__G().p.combo||0);if(how==='click')await pg.mouse.click(480,300);else await pg.keyboard.press(how);await pg.waitForTimeout(120);
  const s=await pg.evaluate(()=>({intro:!!__G().bossIntro,help:typeof HELP!=='undefined'?HELP:0,combo:__G().p.combo||0,atkT:__G().p.atkT||0,say:!!(__G().say&&__G().say.intro)}));
  ok(!s.intro&&!s.help&&!s.say&&s.combo===c0,`按 ${how} 跳过登场（不出招、不打开暂停）`+JSON.stringify(s))}
 // 6) 普通怪出生淡入：淡入中半透明、不能出手、伤害被挡
 await toBoss(pg,2,{seen:1});await pg.evaluate(()=>__dbg.skipIntro());
 r=await pg.evaluate(async()=>{const G=__G(),p=G.p;__dbg.speed(0);G.enemies=G.enemies.filter(e=>e.boss);G.boss.introWait=99;G.boss.cd=99;p.inv=0;p.hp=p.maxhp;
   const e=spawn('goblin',p.x+40,p.y,{});e.face=-1;e.cd=0;const o={s0:e.spawnT,hp0:p.hp,blocked:hurtPlayer(10,e),strike:strike(e,80,1,40),states:[]};
   for(let k=0;k<20;k++){updateEnemy(e,1/60);G.time+=1/60;o.states.push(e.state)}o.spawn1=e.spawnT;o.hp1=p.hp;
   for(let k=0;k<120&&e.state!=='wind'&&e.state!=='strike';k++){updateEnemy(e,1/60);G.time+=1/60}o.later=e.state;__dbg.speed(1);return o});
 ok(r.s0>.3&&r.blocked===0&&r.strike===false&&r.hp1===r.hp0&&r.states.every(x=>x==='walk')&&r.spawn1>0,'哥布林出生淡入 0.35 秒：淡入中不出手、碰撞/攻击伤害被挡 '+JSON.stringify({s0:r.s0,blocked:r.blocked,strike:r.strike,hp:[r.hp0,r.hp1]}));
 ok(r.later==='wind'||r.later==='strike','淡入结束后正常出手（'+r.later+'）');
 // 7) 普通小怪不格挡：刀盾兵 / 佣兵 / 火焰盾卫正面普攻全额伤害，不出现「格挡」「盾挡」
 r=await pg.evaluate(()=>{const G=__G(),p=G.p;const R=Math.random;Math.random=()=>0;const out=[];
   for(const ty of ['goblin','goblin_merc','flame_warrior']){if(!EN[ty])continue;const e=spawn(ty,p.x+50,p.y,{});e.spawnT=0;e.face=-1;e.hp=e.maxhp=1e4;G.parts=[];__dbg.dmgLog('clear');damage(e,5,0,p.x,null,{melee:1});const L=__dbg.dmgLog(1)[0];out.push([ty,G.parts.filter(q=>q.txt).map(q=>q.txt).join(','),L&&L.other])}
   Math.random=R;return out});
 ok(r.length>=2&&r.every(([t,x,o])=>!/盾挡|格挡/.test(x)&&o===1),'普通小怪不再格挡（正面普攻全额伤害，无「格挡/盾挡」） '+JSON.stringify(r));
 // 8) __dbg.speed(0.25) 慢动作 / speed(1) 恢复
 r=await pg.evaluate(async()=>{const G=__G();G.enemies=G.enemies.filter(e=>e.boss);const m=async v=>{__dbg.speed(v);const t0=G.time,w0=performance.now();await new Promise(r=>setTimeout(r,1000));return (G.time-t0)/((performance.now()-w0)/1000)};const a=await m(.25),b=await m(1);return {a:+a.toFixed(3),b:+b.toFixed(3)}});
 ok(r.a>.17&&r.a<.3&&r.b>.75&&r.b<1.1,'__dbg.speed(0.25) 游戏时间 ×'+r.a+'，speed(1) 恢复 ×'+r.b);
 // 9) __dbg.animLog：哥布林 受击→倒地→起身；首领 举盾→格挡→破防
 r=await pg.evaluate(async()=>{const G=__G(),p=G.p;__dbg.animLog('clear');const c0=__dbg.animLog(50).length;
   const e=spawn('goblin',p.x+60,p.y,{});e.spawnT=0;e.cd=99;const wait=s=>new Promise(r=>setTimeout(r,s*1000));
   await wait(.1);damage(e,1,0,p.x,null,{});await wait(.35);damage(e,1,KD_KB+50,p.x,null,{});await wait(2.6);
   const b=G.boss;b.introWait=0;b.pat=null;b.cd=99;b.x=p.x+90;b.y=p.y;b.face=-1;__dbg.block('always');
   for(let i=0;i<3;i++){damage(b,1,0,p.x,null,{melee:1});await wait(.05)}await wait(.5);damage(b,1,0,p.x,null,{melee:1});await wait(.1);damage(b,1,0,p.x+500,null,{melee:1});await wait(.3);__dbg.block(true);
   const L=__dbg.animLog(80),g=L.filter(o=>o.ent.endsWith('#'+e.uid)),B=L.filter(o=>o.ent.startsWith('boss:'));
   const seq=(arr,want)=>{let i=0;for(const o of arr)if(o.state===want[i])i++;return i===want.length};
   const n3=__dbg.animLog(3).length;const clr=__dbg.animLog('clear');
   return {c0,gob:g.map(o=>o.state+'#'+o.frame),boss:B.map(o=>o.state),okG:seq(g,['hit','knockdown','getup']),okB:seq(B,['guard_raise','block','guardbreak']),fields:Object.keys(L[0]||{}),n3,after:__dbg.animLog(10).length,clr}});
 ok(r.c0===0&&r.okG&&r.okB&&r.n3===3&&['t','ent','state','frame'].every(k=>r.fields.includes(k)),'__dbg.animLog：哥布林 '+r.gob.join(' → ')+'；首领 '+[...new Set(r.boss)].join(' → '));
 ok(r.after<=1&&/cleared/.test(r.clr),"__dbg.animLog('clear') 清空日志");
 ok(!errs.length,'桌面无报错 '+errs.slice(0,3).join(' | '));
 // iPhone：点屏幕跳过、黑边
 const ctx=await b.newContext({...devices['iPhone 13']});const mp=await ctx.newPage();const me=[];mp.on('pageerror',e=>me.push(e.message));mp.on('console',m=>{if(m.type()==='error')me.push(m.text())});
 await mp.goto(MURL);await mp.waitForTimeout(1000);await toBoss(mp,3);await mp.waitForTimeout(600);await mp.screenshot({path:OUT+'/screenshot_r15_mobile_intro.png'});
 const mpix=await cvPix(mp,[[480,20],[480,525]]);const box=await mp.evaluate(()=>{const r=document.querySelector('canvas').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}});
 await mp.touchscreen.tap(box.x,box.y);await mp.waitForTimeout(150);const ms=await mp.evaluate(()=>({intro:!!__G().bossIntro,combo:__G().p.combo||0}));
 ok(mpix.every(v=>v<45)&&!ms.intro,'iPhone：黑边 '+JSON.stringify(mpix)+'，点屏幕跳过登场 '+JSON.stringify(ms));
 ok(!me.length,'iPhone 无报错 '+me.slice(0,3).join(' | '));
 await b.close();console.log(fails.length?'ROUND15_FAIL '+fails.length:'ROUND15_PASS')})();
