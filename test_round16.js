// 第 16 轮：真实音效 / BGM（assets/sfx）。文件加载、事件 → 音效映射、合成兜底、BGM 无缝循环点、首领曲切换、音效 / 音乐双滑条、iPhone 解锁
const {chromium,devices}=require('playwright-core');
const URL=process.env.URL||'http://localhost:8931/index.html',MURL=process.env.MURL||'http://localhost:8932/game/index.html',OUT=process.env.OUT||__dirname;
const fails=[];const ok=(c,m)=>{if(!c){console.log('FAIL',m);fails.push(m)}else console.log('ok  ',m)};
// 记录真正播放的文件（AudioBufferSourceNode.start 时反查 AU.buf）与合成音（createOscillator 次数）
const SPY=()=>{if(window.__au)return;window.__au={files:[],osc:0};const c=AU.ctx,cb=c.createBufferSource.bind(c),co=c.createOscillator.bind(c);
 c.createBufferSource=()=>{const s=cb(),st=s.start.bind(s);s.start=(...a)=>{const k=Object.keys(AU.buf).find(k=>AU.buf[k]===s.buffer);if(k)__au.files.push(k);return st(...a)};return s};
 c.createOscillator=()=>{__au.osc++;return co()}};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--autoplay-policy=no-user-gesture-required']});const pg=await b.newPage({viewport:{width:960,height:540}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await pg.goto(URL);await pg.waitForTimeout(600);await pg.keyboard.press('x');
 const need=await pg.evaluate(()=>{const s=new Set();for(const k in SFX_FILES)SFX_FILES[k].forEach(f=>s.add(f));return s.size});
 await pg.waitForFunction(n=>AU.stat.ok>=n,need,{timeout:20000}).catch(()=>{});
 let r=await pg.evaluate(()=>({ok:AU.stat.ok,fail:AU.stat.fail,man:SFX_MANIFEST.length,miss:[...new Set(Object.values(SFX_FILES).flat())].filter(f=>!AU.buf[f]),ctx:!!AU.ctx}));
 ok(r.ok>=need&&!r.fail.length&&!r.miss.length,'音效文件全部解码（'+need+' 个，BGM 不预加载） '+JSON.stringify(r));
 await pg.evaluate(SPY);
 // 映射：直接调用
 r=await pg.evaluate(()=>{const o={};for(const n of ['dash','spin','special','win','over','enrage','clang','guardbreak','no_mp','shop_buy','ui_click','potion','equip','coin','hit_heavy','spell_thunder_chain','boss_intro_yeti','boss_intro_flame_lord','boss_intro_vampire_count','boss_intro_goblin_chief']){__au.files=[];AU.last={};sfx(n);o[n]=__au.files[0]}
  const sw=new Set();for(let i=0;i<12;i++){AU.last={};__au.files=[];sfx('swing');sw.add(__au.files[0])}o.swing=[...sw].sort().join('/');return o});
 const want={dash:'thrust',spin:'whirlwind',special:'ultimate',win:'victory',over:'defeat',enrage:'boss_enrage',clang:'block_clang',guardbreak:'guard_break',no_mp:'no_mp',shop_buy:'shop_buy',ui_click:'ui_click',potion:'item_pickup',equip:'item_pickup',coin:'coin',hit_heavy:'hit_heavy',spell_thunder_chain:'spell_thunder_chain',boss_intro_yeti:'boss_intro_yeti',boss_intro_flame_lord:'boss_intro_flame_lord',boss_intro_vampire_count:'boss_intro_vampire_count',boss_intro_goblin_chief:'boss_intro_goblin_chief',swing:'swing_1/swing_2/swing_3'};
 ok(Object.keys(want).every(k=>r[k]===want[k]),'音效名 → 文件映射（含挥剑 3 个变体轮换） '+JSON.stringify(r));
 r=await pg.evaluate(()=>{AU.last={};__au.files=[];sfx('boss_intro_nobody');return __au.files[0]});ok(r==='boss_intro','没有专属登场音的首领 → boss_intro '+r);
 // 兜底：文件缺失 → 合成音，不报错
 r=await pg.evaluate(()=>{const b=AU.buf.coin;delete AU.buf.coin;AU.last={};__au.files=[];__au.osc=0;let e=null;try{sfx('coin');sfx('levelup')}catch(x){e=String(x)}AU.buf.coin=b;return {f:__au.files.length,osc:__au.osc,e}});
 ok(!r.e&&r.f===0&&r.osc>0,'缺文件时退回合成音 '+JSON.stringify(r));
 // 游戏内事件：关卡 1 BGM、走路脚步、跳跃 / 落地、施法
 await pg.evaluate(()=>{__dbg.resetSave();__dbg.unlockAll();__dbg.start(1);__dbg.skipIntro&&__dbg.skipIntro()});
 await pg.waitForFunction(()=>AU.bgm.playing==='bgm_stage1',null,{timeout:15000}).catch(()=>{});
 r=await pg.evaluate(()=>{const B=AU.bgm;return {key:B.key,loop:B.src&&B.src.loop,ls:B.loopStart,le:B.loopEnd,dur:B.buf&&B.buf.duration,mus:!!B.src}});
 ok(r.key==='bgm_stage1'&&r.loop&&Math.abs((r.le-r.ls)-1693440/44100)<1e-4&&r.dur>=38.39,'关卡 1 BGM 精确循环 '+(r.le-r.ls).toFixed(5)+' 秒（38.4） '+JSON.stringify(r));
 await pg.evaluate(()=>{const G=__G();G.enemies=[];G.p.inv=99;__au.files=[]});await pg.keyboard.down('d');await pg.waitForTimeout(1600);await pg.keyboard.up('d');
 r=await pg.evaluate(()=>__au.files.filter(f=>/^step/.test(f)));
 const alt=r.every((f,i)=>!i||f!==r[i-1]);
 ok(r.length>=3&&alt,'走 / 跑有脚步声并左右脚交替 '+r.join(','));
 r=await pg.evaluate(async()=>{__au.files=[];AU.last={};const G=__G();G.p.vz=520;G.p.z=1;await new Promise(r=>setTimeout(r,900));return __au.files.slice()});
 ok(r.includes('land'),'落地音 '+r.join(','));
 r=await pg.evaluate(()=>{const p=__G().p;p.spells=['t1'];p.sel=0;p.mp=100;p.cds={};p.gcd=0;__au.files=[];AU.last={};castSel();const a=__au.files.slice();p.cds={};p.gcd=0;p.mp=0;AU.last={};__au.files=[];castSel();return [a,__au.files.slice()]});
 ok(r[0].includes('spell_thunder_chain')&&r[1].includes('no_mp'),'连锁闪电 → spell_thunder_chain；魔力不足 → no_mp '+JSON.stringify(r));
 // 首领：登场音 + bgm_boss 无缝循环 36.000 秒，上一首释放
 await pg.evaluate(()=>{__au.files=[];AU.last={};const G=__G();G.wave=G.B.waves.length-1;G.lockX=null;G.camX=G.B.waves[G.wave].x;G.p.x=G.camX+W*.4+10});
 await pg.waitForFunction(()=>__G().boss,null,{timeout:15000});
 await pg.waitForFunction(()=>AU.bgm.playing==='bgm_boss',null,{timeout:15000}).catch(()=>{});
 r=await pg.evaluate(()=>{const B=AU.bgm;return {files:__au.files.filter(f=>/^boss_intro/.test(f)),key:B.key,ls:B.loopStart,le:B.loopEnd,off:B.off,dur:B.buf&&+B.buf.duration.toFixed(4)}});
 ok(r.files[0]==='boss_intro_goblin_chief','哥布林酋长登场音 '+JSON.stringify(r.files));
 ok(r.key==='bgm_boss'&&Math.abs(r.le-r.ls-36)<1e-6,'首领战切到 bgm_boss，loopEnd−loopStart = '+(r.le-r.ls)+' 秒（36.000），编码延迟跳过 '+r.off+' 秒，解码长度 '+r.dur);
 await pg.screenshot({path:OUT+'/screenshot_r16_boss.png'});
 // 首领死后回到关卡曲
 await pg.evaluate(()=>{__G().boss.dead=1});await pg.waitForFunction(()=>AU.bgm.key==='bgm_stage1',null,{timeout:5000}).catch(()=>{});
 ok(await pg.evaluate(()=>AU.bgm.key)==='bgm_stage1','首领倒下后回到关卡曲');
 // 每关 BGM 循环长度
 const L={1:38.4,2:45.714286,3:41.142857,4:41.739138,5:40};
 for(const s of [2,3,4,5]){await pg.evaluate(s=>{__dbg.start(s);__dbg.skipIntro&&__dbg.skipIntro()},s);
  await pg.waitForFunction(s=>AU.bgm.playing==='bgm_stage'+s,s,{timeout:15000}).catch(()=>{});
  r=await pg.evaluate(()=>({key:AU.bgm.playing,len:AU.bgm.loopEnd-AU.bgm.loopStart}));ok(r.key==='bgm_stage'+s&&Math.abs(r.len-L[s])<1e-5,'关卡 '+s+' BGM 循环 '+r.len.toFixed(6)+' 秒')}
 // BGM 文件缺失 → 合成音乐兜底
 r=await pg.evaluate(async()=>{const m=SFX_MANIFEST;window.SFX_MANIFEST=m.filter(x=>x!=='bgm_stage3');auMusic('bgm_stage3');const o={synth:AU.bgm.synth,timer:!!AU.musTimer,src:!!AU.bgm.src};window.SFX_MANIFEST=m;const k0=musicKey();auMusic(k0);await new Promise(r=>setTimeout(r,1500));o.after={want:k0,key:AU.bgm.playing,timer:!!AU.musTimer,src:!!AU.bgm.src};return o});
 ok(r.synth&&r.timer&&!r.src&&r.after.key===r.after.want&&!r.after.timer&&r.after.src,'BGM 文件缺失 → 合成音乐；恢复后停掉合成 '+JSON.stringify(r));
 // 暂停面板：音效 / 音乐两条滑条
 await pg.evaluate(()=>{__dbg.start(1);__dbg.skipIntro&&__dbg.skipIntro();auSetVol(.5);auSetMusVol(.5)});await pg.waitForTimeout(200);await pg.keyboard.press('p');await pg.waitForTimeout(150);
 for(const k of ['ArrowUp','ArrowRight','ArrowDown','ArrowLeft','ArrowLeft']){await pg.keyboard.press(k);await pg.waitForTimeout(80)}
 r=await pg.evaluate(()=>({s:AU.sfxVol,m:AU.musVol,ps:PROFILE.sfxVol,pm:PROFILE.musVol,help:HELP,g:+AU.mus.gain.value.toFixed(3)}));
 ok(Math.abs(r.s-.55)<1e-6&&Math.abs(r.m-.4)<1e-6&&r.ps===r.s&&r.pm===r.m&&r.help,'暂停面板：→ 调音效 0.55，↓ 后 ← ← 调音乐 0.40，并存档 '+JSON.stringify(r));
 await pg.screenshot({path:OUT+'/screenshot_r16_volume.png'});
 const bx=await pg.evaluate(()=>{const c=document.querySelector('canvas').getBoundingClientRect();return {x:c.left,y:c.top,s:c.width/960}});
 await pg.mouse.click(bx.x+(110+200+360*.8)*bx.s,bx.y+(34+472-114+32)*bx.s);await pg.waitForTimeout(100);
 r=await pg.evaluate(()=>({m:AU.musVol,s:AU.sfxVol}));ok(Math.abs(r.m-.8)<.051&&Math.abs(r.s-.55)<1e-6,'点击音乐滑条 80% 处 → 只改音乐音量 '+JSON.stringify(r));
 r=await pg.evaluate(()=>{PROFILE.sfxVol=null;PROFILE.musVol=null;PROFILE.vol=.3;auVolFromProfile();return [AU.sfxVol,AU.musVol]});ok(r[0]===.3&&r[1]===.6,'旧存档只有 vol → 音效 0.3，音乐默认 0.6 '+r);
 await pg.keyboard.press('p');
 ok(!errs.length,'桌面无控制台错误 '+errs.slice(0,3).join(' | '));
 // iPhone：第一次触摸解锁
 const d=devices['iPhone 14 landscape'];const mc=await b.newContext({...d,hasTouch:true,isMobile:true});const mp=await mc.newPage();const merr=[];mp.on('pageerror',e=>merr.push(String(e)));mp.on('console',m=>{if(m.type()==='error')merr.push(m.text())});
 await mp.goto(MURL);await mp.waitForTimeout(800);const pre=await mp.evaluate(()=>({ctx:!!AU.ctx,unl:AU.unlocked}));
 await mp.touchscreen.tap(200,150);await mp.waitForTimeout(300);
 await mp.waitForFunction(n=>AU.stat.ok>=n,need,{timeout:20000}).catch(()=>{});
 r=await mp.evaluate(()=>({ctx:!!AU.ctx,unl:AU.unlocked,state:AU.ctx&&AU.ctx.state,ok:AU.stat.ok,fail:AU.stat.fail.length}));
 ok(!pre.ctx&&r.ctx&&r.unl&&r.ok>=need&&!r.fail,'iPhone：触摸前无 AudioContext，第一次触摸后创建并解锁、音效全部解码 '+JSON.stringify([pre,r]));
 await mp.evaluate(()=>{__dbg.start(1);__dbg.skipIntro&&__dbg.skipIntro()});await mp.waitForFunction(()=>AU.bgm.playing==='bgm_stage1',null,{timeout:15000}).catch(()=>{});
 ok(await mp.evaluate(()=>!!AU.bgm.src),'iPhone：关卡 BGM 播放');await mp.screenshot({path:OUT+'/screenshot_r16_mobile.png'});
 ok(!merr.length,'iPhone 无控制台错误 '+merr.slice(0,3).join(' | '));
 await b.close();console.log(fails.length?'ROUND16_FAIL '+fails.length:'ROUND16_PASS');process.exit(fails.length?1:0)})();
