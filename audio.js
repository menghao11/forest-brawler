'use strict';
// 音效：assets/sfx/*.mp3 真实音效（ref/sfx 生成，见 assets/sfx/LICENSE_SOURCES.md）；文件没加载好 / 浏览器不支持时退回下面的 Web Audio 合成音（原有实现）
// BGM：每关 bgm_stageN 循环（WebAudio 精确循环点，无缝）；首领战若 assets/sfx 有 bgm_boss（manifest.js 列出）自动切换，否则沿用关卡 BGM
// 内存：音效约 35 秒单声道 ≈ 6 MB 解码后常驻；BGM 只在进入关卡时才下载 + 解码（懒加载），同一时间只保留 1 首（≈ 14–16 MB），切歌时释放上一首
const AU={ctx:null,master:null,sfx:null,mus:null,muted:false,musTimer:null,step:0,vol:.8,sfxVol:.8,musVol:.6,
 buf:{},loading:{},stat:{ok:0,fail:[]},last:{},bgm:{want:null,key:null,src:null,buf:null,synth:false,loading:null,off:0},unlocked:false};
const auGain=()=>AU.muted?0:.75;   // 总音量（M 静音）；音效 / 音乐分开调：AU.sfxVol、AU.musVol（存档 PROFILE.sfxVol / musVol）
const SFX_DIR='assets/sfx/';
const SFX_HAVE=n=>!window.SFX_MANIFEST||window.SFX_MANIFEST.includes(n);
// 游戏里的音效名 → 文件（多个 = 变体，随机 / 轮换）；音量系数
const SFX_FILES={swing:['swing_1','swing_2','swing_3'],hit:['hit_light'],hit_heavy:['hit_heavy'],jump:['jump'],land:['land'],hurt:['hurt'],death:['death'],
 step:['step_1','step_2'],step_run:['step_run_1','step_run_2'],dash:['thrust'],spin:['whirlwind'],special:['ultimate'],
 spell_fire:['spell_fire'],spell_ice:['spell_ice'],spell_thunder:['spell_thunder'],spell_thunder_chain:['spell_thunder_chain'],no_mp:['no_mp'],
 clang:['block_clang'],guardbreak:['guard_break'],enrage:['boss_enrage'],boss_intro:['boss_intro'],
 boss_intro_goblin_chief:['boss_intro_goblin_chief'],boss_intro_yeti:['boss_intro_yeti'],boss_intro_flame_lord:['boss_intro_flame_lord'],boss_intro_vampire_count:['boss_intro_vampire_count'],
 goblin_hit:['goblin_hit'],goblin_death:['goblin_death'],coin:['coin'],item_pickup:['item_pickup'],equip:['item_pickup'],potion:['item_pickup'],shop_buy:['shop_buy'],ui_click:['ui_click'],
 win:['victory'],over:['defeat']};
const SFX_VOL={step:.45,step_run:.5,ui_click:.6,coin:.7,goblin_hit:.7,hit:.85,land:.7};
// 首领 id → 登场音效（没有专属的用 boss_intro）
const BOSS_INTRO_SFX={goblin_chief:'boss_intro_goblin_chief',great_yeti:'boss_intro_yeti',flame_king:'boss_intro_flame_lord',vampire_count:'boss_intro_vampire_count'};
// BGM 精确循环长度（LICENSE_SOURCES.md / _src/wav 样本数 ÷ 44100）；文件比这长是 LAME 编码填充
const BGM_LOOP={bgm_boss:1587600,bgm_stage1:1693440,bgm_stage2:2016000,bgm_stage3:1814400,bgm_stage4:1840696,bgm_stage5:1764000};
const LAME_SKIP=1105;// 576 编码延迟 + 529 解码延迟：解码器没按 LAME 头裁掉时从这里开始循环
function auDecode(ab){return new Promise((res,rej)=>{try{const r=AU.ctx.decodeAudioData(ab,res,rej);if(r&&r.then)r.then(res,rej)}catch(e){rej(e)}})}
function auLoad(f){if(AU.buf[f]||AU.loading[f])return AU.loading[f]||Promise.resolve(AU.buf[f]);if(!SFX_HAVE(f)||!window.fetch)return Promise.resolve(null);
 return AU.loading[f]=fetch(SFX_DIR+f+'.mp3').then(r=>{if(!r.ok)throw new Error(r.status);return r.arrayBuffer()}).then(auDecode).then(b=>{AU.buf[f]=b;AU.stat.ok++;delete AU.loading[f];return b})
  .catch(e=>{AU.stat.fail.push(f);delete AU.loading[f];return null})}
function auLoadSfx(){const all=new Set();for(const k in SFX_FILES)SFX_FILES[k].forEach(f=>all.add(f));all.forEach(f=>auLoad(f))}
function auInit(){if(AU.ctx){if(AU.ctx.state==='suspended')AU.ctx.resume();return}
 const C=window.AudioContext||window.webkitAudioContext;if(!C)return;AU.ctx=new C();
 AU.master=AU.ctx.createGain();AU.master.gain.value=auGain();AU.master.connect(AU.ctx.destination);
 AU.sfx=AU.ctx.createGain();AU.sfx.gain.value=AU.sfxVol;AU.sfx.connect(AU.master);
 AU.mus=AU.ctx.createGain();AU.mus.gain.value=AU.musVol*.5;AU.mus.connect(AU.master);auLoadSfx();auMusic(AU.bgm.want||'bgm_stage1',true)}
// iOS：第一次触摸（touchend）里创建 / 恢复 AudioContext 并播一段无声缓冲解锁；之后的音效、换歌都不再需要手势
function auUnlock(){auInit();const c=AU.ctx;if(!c)return;if(c.state!=='running')c.resume();if(AU.unlocked)return;
 try{const b=c.createBuffer(1,1,22050),s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start(0);AU.unlocked=true}catch(e){}}
function auMute(){AU.muted=!AU.muted;if(AU.master)AU.master.gain.setTargetAtTime(auGain(),AU.ctx.currentTime,.02)}
function auSetVol(v){AU.vol=AU.sfxVol=Math.max(0,Math.min(1,v));if(AU.sfx)AU.sfx.gain.setTargetAtTime(AU.sfxVol,AU.ctx.currentTime,.02)}
function auSetMusVol(v){AU.musVol=Math.max(0,Math.min(1,v));if(AU.mus)AU.mus.gain.setTargetAtTime(AU.musVol*.5,AU.ctx.currentTime,.02)}
function tone(f,d,type='square',v=.3,f2=null,delay=0,dest){const c=AU.ctx;if(!c)return;const t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();
 o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);
 g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(dest||AU.sfx);o.start(t);o.stop(t+d+.02)}
let NB=null;function noise(d,v=.3,ff=2000,type='lowpass',delay=0,ff2=null){const c=AU.ctx;if(!c)return;
 if(!NB){NB=c.createBuffer(1,c.sampleRate,c.sampleRate);const a=NB.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1}
 const t=c.currentTime+delay,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=NB;s.loop=true;f.type=type;f.frequency.setValueAtTime(ff,t);if(ff2)f.frequency.exponentialRampToValueAtTime(ff2,t+d);
 g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(f);f.connect(g);g.connect(AU.sfx);s.start(t);s.stop(t+d+.02)}
const arp=(notes,step,type,v)=>notes.forEach((n,i)=>tone(n,step*1.6,type,v,null,i*step));
const SFX={
 swing:()=>noise(.12,.25,3000,'bandpass',0,800),
 hit:()=>{noise(.08,.4,1500);tone(160,.1,'square',.2,60)},
 death:()=>{tone(300,.35,'sawtooth',.2,60);noise(.25,.2,800)},
 coin:()=>{tone(988,.06,'square',.12);tone(1319,.12,'square',.12,null,.05)},
 potion:()=>{tone(400,.25,'sine',.25,900);tone(600,.2,'sine',.15,1200,.08)},
 equip:()=>arp([523,659,784],.06,'triangle',.25),
 jump:()=>tone(220,.15,'square',.15,500),
 hurt:()=>{tone(200,.2,'sawtooth',.3,80);noise(.15,.3,600)},
 levelup:()=>arp([523,659,784,1047,1319],.08,'square',.15),
 spin:()=>{noise(.35,.35,500,'bandpass',0,4000);tone(300,.3,'triangle',.2,900)},
 dash:()=>{noise(.25,.35,4000,'highpass',0,1000);tone(600,.2,'sawtooth',.12,150)},
 wave:()=>{tone(1200,.4,'sine',.2,300);noise(.3,.2,6000,'highpass')},
 special:()=>{tone(80,1,'sawtooth',.35,40);noise(.9,.4,200,'lowpass',0,8000);arp([392,523,659,784,1047],.07,'square',.12)},
 fire:()=>{noise(.45,.35,300,'lowpass',0,3000);tone(150,.3,'sawtooth',.15,80)},
 frost:()=>{arp([1568,1319,1175,1568,2093],.04,'sine',.15);noise(.4,.15,5000,'highpass')},
 bolt:()=>{noise(.5,.5,8000,'lowpass',0,200);tone(60,.5,'square',.3,30)},
 witch:()=>arp([440,523,622,740,880],.07,'triangle',.18),
 go:()=>arp([659,784,988],.1,'square',.15),
 win:()=>arp([523,659,784,1047,784,1047,1319],.13,'square',.18),
 over:()=>arp([392,370,349,330,262],.22,'sawtooth',.18),
 fail:()=>tone(150,.12,'square',.12),
 explode:()=>{noise(.5,.5,1200,'lowpass',0,100);tone(90,.4,'sawtooth',.3,30)},
 roar:()=>{tone(110,.8,'sawtooth',.3,55);noise(.7,.3,400,'bandpass',0,150)},
 erupt:()=>{noise(.6,.45,200,'lowpass',0,1500);tone(60,.5,'square',.2,40)},
 block:()=>{tone(1800,.08,'square',.12,900);noise(.05,.2,5000,'highpass')},
 // 首领格挡：金属「锵」——几个不成谐波的正弦泛音 + 高通噪声瞬态
 clang:()=>{[[1240,.45,.16],[1873,.35,.1],[2710,.28,.07],[3480,.2,.05]].forEach(([f,d,v])=>tone(f,d,'sine',v,f*.985));tone(620,.12,'triangle',.12,560);noise(.04,.35,6000,'highpass')},
 guardup:()=>{tone(520,.1,'triangle',.14,880);noise(.08,.15,3000,'bandpass',0,6000)},
 guardbreak:()=>{noise(.3,.45,2500,'lowpass',0,300);tone(900,.25,'sawtooth',.15,140);[1500,2200].forEach(f=>tone(f,.18,'sine',.06,f*.7))}};
// 新名字的合成音兜底
Object.assign(SFX,{hit_heavy:()=>{SFX.hit();tone(90,.2,'square',.2,40)},land:()=>noise(.08,.2,700),step:()=>noise(.04,.08,900),step_run:()=>noise(.04,.1,1200),
 spell_fire:()=>SFX.fire(),spell_ice:()=>SFX.frost(),spell_thunder:()=>SFX.bolt(),spell_thunder_chain:()=>SFX.bolt(),no_mp:()=>SFX.fail(),enrage:()=>SFX.roar(),boss_intro:()=>SFX.roar(),
 goblin_death:()=>SFX.death(),edeath:()=>SFX.death(),item_pickup:()=>SFX.equip(),shop_buy:()=>SFX.coin(),ui_click:()=>tone(880,.04,'square',.08)});
let SFX_RR={};
// sfx(名字, 变体序号?)：有解码好的文件就播文件，否则合成音；同名 40ms 内只播一次（防叠爆）
function sfx(n,vi){const c=AU.ctx;if(!c)return;const now=c.currentTime;if(AU.last[n]!=null&&now-AU.last[n]<.04)return;AU.last[n]=now;
 if(/^boss_intro_/.test(n)&&!(SFX_FILES[n]&&AU.buf[SFX_FILES[n][0]]))n='boss_intro';
 const L=SFX_FILES[n];let b=null;if(L){let i=vi!=null?vi%L.length:L.length>1?(SFX_RR[n]=((SFX_RR[n]||0)+1+Math.floor(Math.random()*(L.length-1)))%L.length):0;b=AU.buf[L[i]]}
 if(b){try{const s=c.createBufferSource(),g=c.createGain();s.buffer=b;if(/^(swing|hit|step|goblin_hit)/.test(n))s.playbackRate.value=.95+Math.random()*.1;g.gain.value=SFX_VOL[n]||1;s.connect(g);g.connect(AU.sfx);s.start();return}catch(e){}}
 if(SFX[n])try{SFX[n]()}catch(e){}}
// ---------- BGM ----------
function auMusic(key,force){AU.bgm.want=key;const c=AU.ctx;if(!c)return;const B=AU.bgm;if(!force&&B.key===key&&(B.src||B.synth||B.loading===key))return;
 const stopOld=()=>{if(B.src){const s=B.src,g=B.g;try{g.gain.setTargetAtTime(0,c.currentTime,.15);s.stop(c.currentTime+.6)}catch(e){}B.src=null;B.g=null}B.buf=null;B.playing=null;if(B.synth){stopMusic();B.synth=false}};
 B.key=key;if(!key){stopOld();return}
 if(!SFX_HAVE(key)||!window.fetch){stopOld();B.synth=true;startMusic();return}
 B.loading=key;const p=fetch(SFX_DIR+key+'.mp3').then(r=>{if(!r.ok)throw new Error(r.status);return r.arrayBuffer()}).then(auDecode);
 p.then(buf=>{if(B.want!==key)return;B.loading=null;stopOld();const L=(BGM_LOOP[key]||0)/44100,d=buf.getChannelData(0);
   // 解码器有没有按 LAME 头裁掉编码延迟：多出来 ≥1000 样本且开头近乎无声 → 跳过 1105 样本
   let off=0;if(L&&buf.duration-L>1000/44100){let e=0;for(let i=0;i<400;i++)e+=d[i]*d[i];if(Math.sqrt(e/400)<.003)off=LAME_SKIP/44100}
   const s=c.createBufferSource(),g=c.createGain();s.buffer=buf;s.loop=true;if(L){s.loopStart=off;s.loopEnd=off+L}g.gain.value=0;g.gain.setTargetAtTime(1,c.currentTime,.25);
   s.connect(g);g.connect(AU.mus);s.start(c.currentTime+.02,off);B.playing=key;B.src=s;B.g=g;B.buf=buf;B.off=off;B.loopStart=s.loopStart;B.loopEnd=s.loopEnd})
  .catch(e=>{if(B.want!==key)return;B.loading=null;stopOld();B.synth=true;startMusic()})}
// 首领战：有 bgm_boss 就切过去，否则保持关卡 BGM
function auBossMusic(on,stageKey){if(on&&SFX_HAVE('bgm_boss')&&window.SFX_MANIFEST)auMusic('bgm_boss');else if(!on&&stageKey)auMusic(stageKey)}
function stopMusic(){if(AU.musTimer){clearInterval(AU.musTimer);AU.musTimer=null}}
function startMusic(){if(AU.musTimer)return;const bass=[110,110,131,98],mel=[220,262,247,196,220,330,294,247];const beat=.42;
 AU.musTimer=setInterval(()=>{const c=AU.ctx;if(!c||c.state!=='running')return;const s=AU.step++;
  if(s%8===0)tone(bass[(s/8|0)%4],beat*8,'triangle',.25,null,0,AU.mus);
  if(s%2===0){const n=mel[(s/2|0)%8];tone(n*(s%16<8?1:1.5)/1,beat*1.4,'sine',.08,null,0,AU.mus)}
  if(s%4===2)tone(55,.15,'sine',.25,40,0,AU.mus);},420);}
