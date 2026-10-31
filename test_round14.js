// 第 14 轮：普通哥布林新帧（ref/mobs/goblin）：走路 / 攻击前摇+出刀 / 受击后仰 / 击倒→起身 / 死亡淡出 / 转身；脚底贴地；蝙蝠、雪人不变
const {chromium,devices}=require('playwright-core');
const URL=process.env.URL||'http://localhost:8931/index.html',MURL=process.env.MURL||'http://localhost:8932/game/index.html',OUT=process.env.OUT||__dirname;
const fails=[];const ok=(c,m)=>{if(!c){console.log('FAIL',m);fails.push(m)}else console.log('ok  ',m)};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const pg=await b.newPage({viewport:{width:960,height:540}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await pg.goto(URL);await pg.waitForTimeout(800);
 const at=await pg.evaluate(()=>{const A=GOBLIN_ATLAS,o={};for(const k in A.anims)o[k]=A.anims[k].length;return o});
 ok(at.walk===6&&at.attack===6&&at.hit===2&&at.knockdown===3&&at.getup===3&&at.death===4&&at.turn===2&&at.idle>=1&&at.jumpatk>=1,'图集：'+JSON.stringify(at));
 // 脚底：每帧最低的不透明像素行 = 锚点（±2px），knockdown_02 腾空除外
 await pg.waitForFunction(()=>IMG.gob&&IMG.gob.complete&&IMG.gob.naturalWidth>0,null,{timeout:10000});
 const feet=await pg.evaluate(()=>{const A=GOBLIN_ATLAS,img=IMG.gob,c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);const D=x.getImageData(0,0,c.width,c.height).data,o={};
  for(const an of ['walk','attack','hit','getup','turn','idle','knockdown','death'])A.anims[an].forEach((k,i)=>{const f=A.frames[k];let lo=-1;for(let yy=f.h-1;yy>=0&&lo<0;yy--)for(let xx=0;xx<f.w;xx++)if(D[((f.y+yy)*c.width+f.x+xx)*4+3]>40){lo=yy;break}o[an+'_'+(i+1)]=lo-f.ay});return o});
 const badFeet=Object.entries(feet).filter(([k,v])=>k!=='knockdown_2'&&Math.abs(v)>2);
 ok(!badFeet.length&&feet.knockdown_2<-4,'脚底贴地（帧底 − 锚点，px）：'+JSON.stringify(feet)+(badFeet.length?' 不贴地 '+JSON.stringify(badFeet):''));
 // 动画状态机（逐帧推进，暂停主循环）
 const r=await pg.evaluate(()=>{__dbg.speed(1);__dbg.resetSave();__dbg.start(1);__dbg.speed(0);const G=__G(),p=G.p,o={};p.inv=999;__dbg.god(true);
  const mk=(type)=>{G.enemies=[];spawn(type,p.x+260,p.y,{spawnT:0});const e=G.enemies[G.enemies.length-1];e.hp=e.maxhp=1e6;return e};
  const step=(e,t,f)=>{for(let k=0;k<Math.round(t*60);k++){G.time+=1/60;updateEnemy(e,1/60);f&&f()}};
  const A=e=>enemyAnim(e);
  let e=mk('goblin');e.cd=99;step(e,.3);o.walk=A(e).slice(0,4);
  e.state='wind';e.wind=.45;e.t=0;o.w0=A(e)[1];e.t=.3;o.w1=A(e)[1];e.state='strike';const st=[];for(const t of [0,.1,.19,.28,.34]){e.t=t;st.push(A(e)[1])}o.strike=st;e.state='walk';
  e.hurtT=0;damage(e,5,40,e.x-30,null,{});const hs=[];for(let i=0;i<14;i++){const a=A(e);hs.push([a[0],Math.floor(a[1]*a[3]),+(a[5]||0).toFixed(1)]);step(e,1/60)}o.hit=hs.filter((x,i)=>i%3===0);
  e=mk('goblin_spear');e.cd=0;const x0=e.x;damage(e,5,170,e.x-30,null,{});o.down0=e.down;const seq=[];let zmax=0,lastN='',t=0,moved=0;
  step(e,1.3,()=>{t+=1/60;zmax=Math.max(zmax,e.z);const a=A(e),n=a[0]+'_'+Math.min(a[0]==='knockdown'?2:9,Math.floor(a[1]*a[3]));if(n!==lastN){seq.push([n,+t.toFixed(2)]);lastN=n}if(e.down!=null&&(e.state==='wind'||e.state==='strike'))moved=1});
  o.down=seq;o.zmax=+zmax.toFixed(1);o.attackedWhileDown=moved;o.after=e.down;
  e=mk('goblin_archer');e.hp=1;damage(e,50,10,e.x-30,null,{});const ds=[];const al=[];for(let i=0;i<100;i++){const a=A(e);ds.push(Math.floor(a[1]*a[3]));e.deadT+=1/60;al.push(clamp(1-(e.deadT-.7)/.8,0,1))}o.death=[...new Set(ds.map(x=>Math.min(x,3)))];o.alpha=[al[30],al[60],al[95]].map(x=>+x.toFixed(2));
  e=mk('goblin_jumper');e.cd=99;e.face=1;e.vf=1;e.state='walk';e.moving=1;const tn=[];e.face=-1;gobTurn(e,0);for(let i=0;i<18;i++){const a=A(e);tn.push(a[0]==='turn'?a[0]+a[1]+(a[4]>0?'R':'L'):a[0]);gobTurn(e,1/60);e.face=-1}o.turn=[...new Set(tn)];
  e=mk('goblin_merc');o.merc=A(e)[0];
  // 蝙蝠 / 雪人：不走新逻辑
  G.enemies=[];spawn('bat',p.x+200,p.y-40,{});const bt=G.enemies[0];o.bat=A(bt)[0];o.batVf=bt.vf===undefined;
  __dbg.god(false);return o});
 ok(r.walk[0]==='walk'&&r.walk[3]===10,'走路 6 帧 10fps '+JSON.stringify(r.walk));
 ok(r.w0===0&&r.w1===1&&JSON.stringify(r.strike)==='[2,3,5,5,5]'.replace('5,5,5','4,5,5'),'攻击：前摇 01→02（0.45 秒），出刀 03→06 每帧 90ms '+JSON.stringify([r.w0,r.w1,r.strike]));
 ok(r.hit[0][0]==='hit'&&r.hit.some(x=>x[1]===1)&&r.hit.some(x=>Math.abs(x[2])>=3),'受击：hit 01→02 随时间推进 + 后仰位移 '+JSON.stringify(r.hit));
 const dn=r.down.map(x=>x[0]);
 ok(r.down0===0&&dn[0]==='knockdown_0'&&dn.includes('knockdown_1')&&dn.includes('knockdown_2')&&dn.includes('getup_2')&&dn[dn.length-1].startsWith('walk')||dn[dn.length-1].startsWith('idle'),'重击击倒 → 躺 → 起身 → 恢复 '+JSON.stringify(r.down));
 const gu=r.down.find(x=>x[0]==='getup_0'),bk=r.down.find(x=>/^(walk|idle)/.test(x[0]));
 ok(r.zmax>=8&&!r.attackedWhileDown&&r.after==null&&gu&&Math.abs(gu[1]-.75)<.05&&bk&&Math.abs(bk[1]-1.13)<.06,`击倒中腾空（最高 ${r.zmax}px）、不出手；0.75 秒起身、约 1.125 秒恢复`);
 ok(JSON.stringify(r.death)==='[0,1,2,3]'&&r.alpha[0]===1&&r.alpha[1]>0&&r.alpha[1]<1&&r.alpha[2]===0,'死亡 4 帧 8fps，停在 04 后淡出 '+JSON.stringify(r));
 ok(JSON.stringify(r.turn)==='["turn0R","turn1R","turn0L","walk"]'||JSON.stringify(r.turn)==='["turn0R","turn1R","turn0L","idle"]','转身 右→左：turn_01 → turn_02 → 镜像 turn_01 '+JSON.stringify(r.turn));
 ok(r.merc&&r.bat&&r.batVf,'雇佣兵哥布林也用新帧；蝙蝠不变 '+r.merc+' / '+r.bat);
 // 实战：第 1 关打一群哥布林，四段连击击倒，无报错，截图
 await pg.evaluate(()=>{__dbg.speed(1);__dbg.resetSave();__dbg.start(1);const G=__G(),p=G.p;G.enemies=[];G.lockX=null;p.inv=999;for(let i=0;i<3;i++){spawn(['goblin','goblin_spear','goblin_archer'][i],p.x+70+i*30,p.y+(i-1)*14,{});G.enemies[G.enemies.length-1].hp=400}});
 await pg.evaluate(()=>{window.__r14={combo:0,down:[]};window.__r14i=setInterval(()=>{const G=__G();__r14.combo=Math.max(__r14.combo,G.p.combo||0);for(const e of G.enemies)if(e.def.shape==='gob'&&e.down!=null&&!__r14.down.includes(e.type))__r14.down.push(e.type)},10)});
 for(let i=0;i<8;i++){await pg.keyboard.press('j');await pg.waitForTimeout(160)}
 await pg.waitForTimeout(200);const live=await pg.evaluate(()=>{clearInterval(__r14i);return __r14});
 await pg.screenshot({path:OUT+'/screenshot_r14_knockdown.png'});
 ok(live.down.length>0,'实战：连击第 4 下把哥布林打倒 '+JSON.stringify(live));
 await pg.waitForTimeout(1500);await pg.screenshot({path:OUT+'/screenshot_r14_getup.png'});
 ok(!errs.length,'桌面无报错 '+errs.slice(0,3).join(' | '));
 // iPhone
 const ctx=await b.newContext({...devices['iPhone 13']});const mp=await ctx.newPage();const me=[];mp.on('pageerror',e=>me.push(e.message));mp.on('console',m=>{if(m.type()==='error')me.push(m.text())});
 await mp.goto(MURL);await mp.waitForTimeout(1000);await mp.evaluate(()=>{__dbg.resetSave();__dbg.start(1);const G=__G(),p=G.p;G.enemies=[];G.lockX=null;spawn('goblin',p.x+60,p.y,{});damage(G.enemies[0],1,170,p.x,null,{})});await mp.waitForTimeout(500);
 await mp.screenshot({path:OUT+'/screenshot_r14_mobile.png'});ok(!me.length,'iPhone 无报错 '+me.slice(0,3).join(' | '));
 await b.close();console.log(fails.length?'ROUND14_FAIL '+fails.length:'ROUND14_PASS')})();
