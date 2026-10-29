// 第 11 轮：首领格挡。连击触发（几率 35% / 55%）、举盾提示、格挡 15% + 火花 / 金属声 / 「格挡！」+ 反击（前摇 ≥0.4 秒）、
// 破防（背后 / 跳劈 / 突刺 / 旋风斩 → 硬直 1 秒「破防！」）、法术不被格挡、出招中不格挡、台词（docs/boss_block_lines.csv）、调试开关、机器人对比、iPhone
const {chromium,devices}=require('playwright-core');const {execFileSync}=require('child_process');const fs=require('fs');
const URL=process.env.URL||'http://localhost:8931/index.html',MURL=process.env.MURL||'http://localhost:8932/game/index.html',OUT=process.env.OUT||__dirname;
const fails=[];const ok=(c,m)=>{if(!c){console.log('FAIL',m);fails.push(m)}else console.log('ok  ',m)};
const IDS=['goblin_chief','great_yeti','flame_king','goblin_king','vampire_count'];
async function toBoss(pg,s){await pg.evaluate(s=>{__dbg.speed(1);__dbg.resetSave();__dbg.unlockAll();__dbg.start(s);const G=__G(),p=G.p,B=G.B;G.enemies=[];G.wave=B.waves.length-1;G.lockX=null;const wx=B.waves[G.wave].x;G.camX=wx;p.x=wx+W*.4+10;p.y=(LANE_TOP+LANE_BOT)/2;__dbg.god(true);__dbg.block(true)},s);await pg.waitForTimeout(500);
 await pg.evaluate(()=>{__dbg.speed(0);const G=__G(),e=G.boss,p=G.p;G.ep=[];G.hz=G.hz.filter(h=>h.stage);G.enemies=G.enemies.filter(o=>o===e);e.pat=null;e.cd=99;e.inv=0;e.hidden=0;e.z=0;e.phase=0;e.x=G.camX+W*.6;e.y=(LANE_TOP+LANE_BOT)/2;e.face=-1;p.x=e.x-80;p.y=e.y;p.z=0;p.face=1;
  // 页面内工具：正面普攻 / 推进首领逻辑
  window.__T={front:(src='普攻 第1段')=>damage(e,10,0,p.x,null,{melee:true,src}),
   step:(t,stop)=>{let k=0;for(;k<t*60;k++){const G=__G();G.time+=1/60;G.t+=1/60;updateBoss(e,1/60,1);if(stop&&stop())break}return k/60},
   reset:()=>{e.pat=null;e.cd=99;e.gRaise=0;e.guard=0;e.stagT=0;e.counter=0;e.blockCd=0;e.mh=[];e.isCounter=0;e.hp=e.maxhp*.8;e.x=__G().camX+W*.6;e.y=p.y;e.face=-1;p.x=e.x-80;G.say=null},
   last:()=>DLOG[DLOG.length-1]}})}
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const pg=await b.newPage({viewport:{width:960,height:540}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await pg.goto(URL);await pg.waitForTimeout(800);
 // 台词表与 CSV 一致
 const csv=fs.readFileSync(__dirname+'/docs/boss_block_lines.csv','utf8').trim().split('\n').slice(1).map(l=>{const m=l.match(/^(\d+),([^,]+),([^,]+),"([^"]+)"/);return m&&{stage:+m[1],boss:m[2],trig:m[3],line:m[4]}}).filter(Boolean);
 const BL=await pg.evaluate(()=>({L:BLOCK_LINES,names:Object.fromEntries(Object.keys(BLOCK_LINES).map(k=>[k,BOSSES[k].name]))}));
 const KEY={'首次格挡':'first','二阶段格挡':'p2','破防':'brk','格挡':'first'};let miss=csv.filter(r=>{const id=Object.keys(BL.names).find(k=>BL.names[k]===r.boss);return !id||BL.L[id][KEY[r.trig]]!==r.line});
 ok(csv.length===12&&!miss.length,'docs/boss_block_lines.csv 的 '+csv.length+' 句台词全部接入（含第 4 关残影）'+(miss.length?' 缺：'+JSON.stringify(miss):''));
 const C=await pg.evaluate(()=>({mul:GUARD_MUL,raise:GUARD_RAISE,dur:GUARD_DUR,stag:GUARD_STAG,cd:GUARD_CD,p:GUARD_P,win:GUARD_WIN,hits:GUARD_HITS}));
 ok(C.mul===.15&&C.dur+C.raise<=1.5&&C.stag===1&&C.cd[0]>=3&&C.cd[1]<=4&&C.p[0]===.35&&C.p[1]===.55&&C.hits===3&&C.win===1.5,'参数：1.5 秒内 3 下触发，几率 35%/55%，举盾 '+C.raise+' + 格挡 '+C.dur+' 秒，冷却 3–4 秒，格挡伤害 15%，破防硬直 1 秒');
 for(let s=1;s<=5;s++){await toBoss(pg,s);const id=IDS[s-1];
  const r=await pg.evaluate(()=>{const G=__G(),e=G.boss,T=__T,o={};__dbg.block('always');T.reset();
   T.front();T.front();o.before=!!e.gRaise;T.front();o.raise=e.gRaise>0;o.say=G.say&&G.say.text;o.flash=e.gRaise;
   T.front();o.raiseHit=T.last().other;// 举盾提示期间还没开始挡
   T.step(.3);o.guard=+e.guard.toFixed(2);
   T.front();const L=T.last();o.blk={g:L.guard,other:L.other,final:L.final,raw:L.raw};o.counterFlag=e.counter;o.guardLeft=+e.guard.toFixed(2);o.txt=G.parts.some(q=>q.txt==='格挡！');
   const n0=DLOG.length;T.step(.5,()=>!!e.pat);o.pat=e.pat;o.isCounter=e.isCounter;const t0=e.patAt;T.step(2,()=>DLOG.slice(n0).some(x=>x.target.startsWith('玩家')));const h=DLOG.slice(n0).find(x=>x.target.startsWith('玩家'));o.tele=h?+(h.t-t0).toFixed(2):null;
   // 出招中不格挡
   T.reset();e.pat='combo';e.patT=.1;T.front();T.front();T.front();o.duringAtk=!!(e.gRaise||e.guard);
   // 破防
   o.brk={};const P=G.p;for(const [k,f] of Object.entries({背后普攻:()=>{P.x=e.x+80;damage(e,10,0,P.x,null,{melee:true,src:'普攻 第1段'});P.x=e.x-80},跳劈:()=>damage(e,10,0,P.x,null,{melee:true,brk:1,src:'跳劈'}),突刺:()=>damage(e,10,180,P.x,null,{src:'突刺冲锋'}),旋风斩:()=>damage(e,10,60,P.x,null,{melee:false,src:'旋风斩 (第5段) 1'})})){
    T.reset();startGuard(e);T.step(.3);const g=e.guard>0;f();const L=T.last();o.brk[k]=g&&L.guard==='破防'&&e.stagT>=.99&&!(e.guard>0)&&L.other===1;
    const st=T.step(1.5,()=>!(e.stagT>0));o.brk[k+'硬直']=+st.toFixed(2)}
   o.brkTxt=G.parts.some(q=>q.txt==='破防！');
   // 法术：不被格挡、也不破防
   T.reset();startGuard(e);T.step(.3);damage(e,10,0,G.p.x,'fire',{src:'火球'});const S=T.last();o.spell=!S.guard&&e.guard>0&&S.other===1;
   // 二阶段台词
   T.reset();e.phase=1;e.said={first:1};startGuard(e);o.p2say=G.say&&G.say.text;e.phase=0;
   // 关闭开关
   T.reset();__dbg.block(false);T.front();T.front();T.front();o.off=!(e.gRaise>0);__dbg.block(true);
   T.reset();return o});
  const L=BL.L[id];
  ok(!r.before&&r.raise&&r.say===L.first,`第 ${s} 关【${BL.names[id]}】1.5 秒内第 3 下正面普攻 → 举盾提示（白闪 + "!"）并说出首次台词「${r.say}」`);
  ok(r.raiseHit===1&&r.guard>=.95&&r.guard<=1.0,`第 ${s} 关：举盾提示 ${C.raise} 秒期间不挡（倍率 ${r.raiseHit}），随后格挡 ${r.guard} 秒`);
  ok(r.blk.g==='格挡'&&Math.abs(r.blk.other-.15)<1e-6&&r.txt&&r.counterFlag===1&&r.guardLeft<=.3,`第 ${s} 关：格挡中正面普攻只吃 15%（${r.blk.final}/${r.blk.raw}…×其他 ${r.blk.other}），火花 +「格挡！」，0.3 秒内转入反击`);
  ok(r.isCounter===1&&r.pat&&r.tele>=.4,`第 ${s} 关：反击招式 ${r.pat}，从出招到命中 ${r.tele} 秒（≥0.4 前摇）`);
  ok(r.duringAtk===false,`第 ${s} 关：首领出招中不会格挡`);
  ok(Object.keys(r.brk).filter(k=>!k.endsWith('硬直')).every(k=>r.brk[k])&&r.brkTxt&&Object.keys(r.brk).filter(k=>k.endsWith('硬直')).every(k=>r.brk[k]>=.95&&r.brk[k]<=1.05),`第 ${s} 关：破防（背后 / 跳劈 / 突刺 / 旋风斩）→ 全额伤害 +「破防！」+ 硬直 ${JSON.stringify(Object.fromEntries(Object.entries(r.brk).filter(([k])=>k.endsWith('硬直'))))}`);
  ok(r.spell,`第 ${s} 关：法术不被格挡、不破防（全额伤害，盾仍举着）`);
  ok(r.p2say===L.p2,`第 ${s} 关：二阶段格挡台词「${r.p2say}」`);
  ok(r.off,`第 ${s} 关：__dbg.block(false) 关闭格挡`)}
 // 第 5 关：破防台词；几率统计；调试命令不受影响
 await toBoss(pg,5);
 const v=await pg.evaluate(()=>{const G=__G(),e=G.boss,T=__T,o={};T.reset();startGuard(e);e.said={first:1};T.step(.3);G.say=null;G.p.x=e.x+80;damage(e,10,0,G.p.x,null,{melee:true,src:'普攻 第1段'});o.brkSay=G.say&&G.say.text;T.reset();
  // 几率（block(true)：按真实几率）
  __dbg.block(true);for(const ph of [0,1]){let n=0,k=0;for(let i=0;i<3000;i++){T.reset();e.phase=ph;T.front();T.front();T.front();n++;if(e.gRaise>0)k++}o['p'+ph]=+(k/n).toFixed(3)}e.phase=0;T.reset();
  // god / atk 调试命令：格挡仍生效，倍率照常
  __dbg.atk(2);__dbg.block('always');T.front();T.front();T.front();T.step(.3);T.front();const L=T.last();o.atk={dbg:L.atkDbg,other:L.other,g:L.guard};__dbg.atk(1);o.god=__dbg.god(true)===true;o.stats=__dbg.block('stats');__dbg.block(true);T.reset();return o});
 ok(v.brkSay==='好剑……她选对人了。','吸血伯爵破防台词「'+v.brkSay+'」');
 ok(Math.abs(v.p0-.35)<.04&&Math.abs(v.p1-.55)<.04,'实测触发几率：一阶段 '+v.p0+'、二阶段 '+v.p1+'（3000 次连击）');
 ok(v.atk.dbg===2&&Math.abs(v.atk.other-.15)<1e-6&&v.atk.g==='格挡'&&v.god&&v.stats&&v.stats.blocks>0,'调试：atk(2) 下格挡照常（×2 记录 + 15%），god() 正常，block(\'stats\') '+JSON.stringify(v.stats));
 // 残影小首领
 await toBoss(pg,4);
 const m=await pg.evaluate(()=>{const G=__G(),p=G.p;__dbg.block('always');const e=spawnBoss('goblin_king_shade',p.x+80,p.y,true);e.cd=99;e.face=-1;e.inv=0;for(let i=0;i<3;i++)damage(e,10,0,p.x,null,{melee:true,src:'普攻 第1段'});const o={raise:e.gRaise>0,say:G.say&&G.say.text};__dbg.block(true);return o});
 ok(m.raise&&m.say==='老爷……在等你。','第 4 关残影小首领也会格挡，台词「'+m.say+'」');
 // 截图：举盾 / 格挡（护盾弧 + 台词气泡）/ 破防硬直
 await toBoss(pg,3);
 await pg.evaluate(()=>{__dbg.block('always');const T=__T;T.reset();T.front();T.front();T.front();T.step(.12)});await pg.waitForTimeout(120);await pg.screenshot({path:OUT+'/screenshot_r11_raise.png'});
 await pg.evaluate(()=>{__T.step(.2)});await pg.waitForTimeout(120);await pg.screenshot({path:OUT+'/screenshot_r11_guard.png'});
 await pg.evaluate(()=>{const G=__G(),e=G.boss;damage(e,10,0,G.p.x,null,{melee:true,brk:1,src:'跳劈'});__T.step(.1);__dbg.block(true)});await pg.waitForTimeout(120);await pg.screenshot({path:OUT+'/screenshot_r11_break.png'});
 await pg.evaluate(()=>__dbg.speed(1));
 console.log('ERRS',errs.slice(0,5));
 // 机器人对比：格挡开 / 关
 const js=JSON.parse(execFileSync('node',[__dirname+'/tools_bossfight.js'],{env:{...process.env,HERO:'normal',REPS:'1',BLOCK:'1,0',PAR:'10',JSON:'1'},maxBuffer:1e8}).toString().trim().split('\n').pop());
 for(const r of js.sum.filter(r=>r.block)){const c=js.cmp.find(x=>x.stage===r.stage)||{};
  ok(r.ttk>=45&&r.ttk<90&&r.gapP1<=2.5&&r.gapP2<=1.8&&r.idleMax<=1&&r.away===0&&r.minTele>=.38,`机器人 第 ${r.stage} 关 ${r.name}：格挡开 TTK ${r.ttk} 秒（关 ${c.ttkOff}，${c.longerPct>=0?'+':''}${c.longerPct}%），格挡 ${r.blocks} 次 / 连击 ${r.blockRate} 率，破防 ${r.breaks}，反击 ${r.counters}；间隔 ${r.gapP1}/${r.gapP2}，发呆 ${r.idleMax}`)}
 ok(js.sum.some(r=>r.block&&r.blocks>0),'机器人战斗中首领确实会格挡');
 // iPhone
 const d=devices['iPhone 14 landscape'];const mc=await b.newContext({...d,hasTouch:true,isMobile:true});const mp=await mc.newPage();const merr=[];mp.on('pageerror',e=>merr.push(String(e)));mp.on('console',m=>{if(m.type()==='error')merr.push(m.text())});
 await mp.goto(MURL);await mp.waitForTimeout(800);await toBoss(mp,5);
 const mr=await mp.evaluate(()=>{__dbg.block('always');const G=__G(),e=G.boss,T=__T;T.reset();T.front();T.front();T.front();T.step(.3);const o={guard:e.guard>0,say:G.say&&G.say.text};__dbg.block(true);return o});await mp.waitForTimeout(150);
 await mp.screenshot({path:OUT+'/screenshot_r11_guard_mobile.png'});ok(mr.guard&&mr.say==='师父还是只教这一招吗？','iPhone：伯爵举盾 + 台词气泡 '+JSON.stringify(mr));await mp.evaluate(()=>__dbg.speed(1));console.log('MERRS',merr.slice(0,5));
 const bad=fails.length||errs.length||merr.length;console.log(bad?'ROUND11_FAIL':'ROUND11_PASS');await b.close();process.exit(bad?1:0)})();
