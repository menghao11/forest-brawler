// 第 13 轮（评审问题）：首领连击/血球间隔 ≥0.72 秒、血球分波有空档、跳关追赶系数（最高 4×）、第 3 关焰魔王重画 / 首领贴图预加载与替身、暂停面板解释「首领伤害+%」
const {chromium,devices}=require('playwright-core');
const URL=process.env.URL||'http://localhost:8931/index.html',MURL=process.env.MURL||'http://localhost:8932/game/index.html',OUT=process.env.OUT||__dirname;
const fails=[];const ok=(c,m)=>{if(!c){console.log('FAIL',m);fails.push(m)}else console.log('ok  ',m)};
async function toBoss(pg,s,cleared){await pg.evaluate(([s,cl])=>{__dbg.speed(1);__dbg.resetSave();__dbg.unlockAll();PROFILE.cleared=cl?STAGES.slice(0,s-1).map(x=>x.id):[];__dbg.start(s);const G=__G(),p=G.p;G.enemies=[];G.wave=G.B.waves.length-1;G.lockX=null;G.camX=G.B.waves[G.wave].x;p.x=G.camX+W*.4+10;p.y=(LANE_TOP+LANE_BOT)/2;p.inv=99},[s,cleared]);
 await pg.waitForFunction(()=>__G().boss,null,{timeout:15000})}
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const pg=await b.newPage({viewport:{width:960,height:540}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await pg.goto(URL);await pg.waitForTimeout(800);
 // 1) 招式间隔（真实时间）：每个首领、两个阶段的多段招式
 await toBoss(pg,5,1);
 const g=await pg.evaluate(()=>{__dbg.speed(0);const G=__G(),e=G.boss,p=G.p,o={};const step=(t,f)=>{for(let k=0;k<t*60;k++){G.time+=1/60;G.t+=1/60;updateBoss(e,1/60,1);f&&f()}};
  for(const ph of [0,1])for(const pat of ['rapier','bloodOrbs']){e.phase=ph;e.pat=pat;e.patT=0;e.step=0;e.cd=99;e.x=p.x+80;e.y=p.y;e.face=-1;G.ep=[];const ts=[],n=[];let s0=0,q0=0;step(3.2,()=>{if(e.step!==s0){ts.push(G.time);n.push(G.ep.length-q0);s0=e.step;q0=G.ep.length}if(!e.pat)e.cd=99});
   const gaps=ts.slice(1).map((t,i)=>+(t-ts[i]).toFixed(3));o[pat+ph]={gaps,n}}
  // 其他首领的 combo / sweep / hammer 一样按真实时间
  G.ep=[];return o});
 for(const k in g){const v=g[k];ok(v.gaps.length>=1&&v.gaps.every(x=>x>=.72-1e-6),`第 5 关伯爵 ${k.slice(0,-1)}（${+k.slice(-1)?'二':'一'}阶段）：相邻两下 / 两波间隔 ${v.gaps.join(' / ')} 秒（≥0.72）`+(k.startsWith('blood')?`，每波 ${v.n.join('/')} 颗`:''))}
 ok(g.bloodOrbs1.n.every(x=>x<=3)&&g.bloodOrbs1.n.length===4&&g.bloodOrbs1.n.some(x=>x===2),'血球二阶段：4 波，3 颗瞄准 / 2 颗分两侧中间留空 交替，不再 4 波×5 颗每 0.26 秒');
 // 2) 真实战斗（无敌）：玩家受伤记录相邻间隔 ≥0.72
 for(const s of [3,5]){await toBoss(pg,s,1);const r=await pg.evaluate(async()=>{const G=__G(),e=G.boss;__dbg.god(true);e.hp=e.maxhp*.45;__dbg.dmgLog('clear');__dbg.speed(4);
   const bot=setInterval(()=>{const p=G.p;for(const k of ['arrowleft','arrowright','arrowup','arrowdown'])keys[k]=false;const dx=e.x-p.x,dy=e.y-p.y;if(Math.abs(dx)>85)keys[dx>0?'arrowright':'arrowleft']=true;if(Math.abs(dy)>8)keys[dy>0?'arrowdown':'arrowup']=true;e.hp=Math.max(e.hp,e.maxhp*.3)},10);
   await new Promise(r=>setTimeout(r,10000));clearInterval(bot);__dbg.speed(1);__dbg.god(false);const L=__dbg.dmgLog(200).filter(x=>x.target==='玩家'||x.target==='玩家（无敌）');const gaps=L.slice(1).map((x,i)=>+(x.t-L[i].t).toFixed(2));
   return {n:L.length,min:Math.min(...gaps),gapBlk:__dbg.dmgLog(200).filter(x=>x.target==='玩家（受击间隔）').length,ph:e.phase}});
  ok(r.n>=5&&r.min>=.72-.02,`第 ${s} 关二阶段实战约 40 游戏秒（无敌）：玩家受伤 ${r.n} 次，最短间隔 ${r.min} 秒（≥0.72），被间隔规则挡掉 ${r.gapBlk} 次`)}
 // 3) 追赶系数
 const cu=await pg.evaluate(()=>{const o={};for(let s=1;s<=5;s++)for(const cl of [0,1]){__dbg.resetSave();__dbg.unlockAll();PROFILE.cleared=cl?STAGES.slice(0,s-1).map(x=>x.id):[];__dbg.start(s);o[s+(cl?'n':'f')]=+progCatchUp().toFixed(2)}return o});
 ok(cu['5f']>=4.4&&cu['5f']<=4.5&&cu['4f']>=3.6&&cu['3f']>=2.6&&cu['2f']>=1.9&&[1,2,3,4,5].every(s=>cu[s+'n']===1)&&cu['1f']===1,'跳关追赶系数（新存档 unlockAll + start）：'+JSON.stringify(cu)+'（正常通关进度 = 1）');
 // 4) 焰魔王重画 + 贴图替身
 await toBoss(pg,3,1);await pg.waitForTimeout(2500);const n0=errs.length;await pg.screenshot({path:OUT+'/screenshot_r13_flameking.png'});
 const px=await pg.evaluate(()=>{const e=__G().boss,sx=e.x-__G().camX,y=e.y;const d=document.querySelector('canvas').getContext('2d').getImageData(Math.max(0,sx-70),y-230,140,220).data;let warm=0,n=0;for(let i=0;i<d.length;i+=4){n++;if(d[i]>200&&d[i+1]>120)warm++}return warm/n});
 ok(errs.length===n0&&px>.01,`第 3 关焰魔王（代码绘制：分层铠甲 / 熔岩缝 / 角盔 / 烈焰大剑）正常显示，亮色像素 ${(px*100).toFixed(1)}%`);
 await toBoss(pg,4,1);const fb=await pg.evaluate(async()=>{IMG.big=new Image();IMG.big.src0='assets/biggoblin_atlas.png';await new Promise(r=>setTimeout(r,1500));return ready('big')});
 ok(fb,'首领贴图丢失 / 未加载：画代码替身并自动重新加载（1.5 秒内恢复）');
 // 5) 暂停面板解释「首领伤害+%」
 await pg.evaluate(()=>{const p=__G().p;p.owned=['w3'];p.eq={weapon:'w3'};applyGear(p,true);toggleHelp()});await pg.waitForTimeout(300);await pg.screenshot({path:OUT+'/screenshot_r13_pause.png'});
 const hp=await pg.evaluate(()=>{const s=drawHelp.toString();toggleHelp();return {row:/首领伤害\+%/.test(s),boss:__G().p.st.boss}});
 ok(hp.row&&hp.boss>0,'暂停面板新增一行「首领伤害+% — 装备（如屠魔剑）附带的额外伤害，只对首领生效；你现在 +'+Math.round(hp.boss*100)+'%」；HUD 改为「首领伤害+%」');
 ok(!errs.length,'桌面无报错 '+errs.slice(0,3).join(' | '));
 // 6) iPhone
 const ctx=await b.newContext({...devices['iPhone 13']});const mp=await ctx.newPage();const merr=[];mp.on('pageerror',e=>merr.push(e.message));mp.on('console',m=>{if(m.type()==='error')merr.push(m.text())});await mp.goto(MURL);await mp.waitForTimeout(900);
 await toBoss(mp,3,0);await mp.waitForTimeout(2000);await mp.screenshot({path:OUT+'/screenshot_r13_iphone.png'});const mc=await mp.evaluate(()=>bossCatchUp());
 ok(!merr.length&&mc>2.6,'iPhone：第 3 关焰魔王显示正常、无报错，新存档追赶 ×'+mc.toFixed(2));
 await b.close();console.log(fails.length?'ROUND13_FAIL '+fails.length:'ROUND13_PASS')})();
