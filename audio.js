'use strict';
// 程序化合成音效 (Web Audio API)，无外部文件
const AU={ctx:null,master:null,sfx:null,mus:null,muted:false,musTimer:null,step:0,vol:.8};
const auGain=()=>AU.muted?0:.75*AU.vol;   // 主音量：vol 0–1（存档 PROFILE.vol），默认 .8 ≈ 原 .6
function auInit(){if(AU.ctx){if(AU.ctx.state==='suspended')AU.ctx.resume();return}
 const C=window.AudioContext||window.webkitAudioContext;if(!C)return;AU.ctx=new C();
 AU.master=AU.ctx.createGain();AU.master.gain.value=auGain();AU.master.connect(AU.ctx.destination);
 AU.sfx=AU.ctx.createGain();AU.sfx.gain.value=.8;AU.sfx.connect(AU.master);
 AU.mus=AU.ctx.createGain();AU.mus.gain.value=.22;AU.mus.connect(AU.master);startMusic();}
function auMute(){AU.muted=!AU.muted;if(AU.master)AU.master.gain.setTargetAtTime(auGain(),AU.ctx.currentTime,.02)}
function auSetVol(v){AU.vol=Math.max(0,Math.min(1,v));if(AU.master)AU.master.gain.setTargetAtTime(auGain(),AU.ctx.currentTime,.02)}
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
 block:()=>{tone(1800,.08,'square',.12,900);noise(.05,.2,5000,'highpass')}};
function sfx(n){if(AU.ctx&&SFX[n])try{SFX[n]()}catch(e){}}
function startMusic(){const bass=[110,110,131,98],mel=[220,262,247,196,220,330,294,247];const beat=.42;
 AU.musTimer=setInterval(()=>{const c=AU.ctx;if(!c||c.state!=='running')return;const s=AU.step++;
  if(s%8===0)tone(bass[(s/8|0)%4],beat*8,'triangle',.25,null,0,AU.mus);
  if(s%2===0){const n=mel[(s/2|0)%8];tone(n*(s%16<8?1:1.5)/1,beat*1.4,'sine',.08,null,0,AU.mus)}
  if(s%4===2)tone(55,.15,'sine',.25,40,0,AU.mus);},420);}
