// 新动作预览：游戏内真实渲染（冻结主循环，手动步进 updatePlayer），逐帧截取主角附近区域
// 用法：URL=http://localhost:8931/index.html OUT=/tmp/nm_cap node tools/capture_new_moves.js
const {chromium}=require('playwright-core');const fs=require('fs');
const OUT=process.env.OUT||'/tmp/nm_cap';fs.mkdirSync(OUT,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});
 const pg=await b.newPage({viewport:{width:960,height:540}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto(process.env.URL||'http://localhost:8931/index.html');await pg.waitForTimeout(800);
 await pg.evaluate(()=>{__dbg.resetSave();__dbg.start(0)});await pg.waitForTimeout(300);
 await pg.evaluate(()=>{__dbg.speed(0);const G=__G();G.B.waves[0].x=1e9;G.enemies=[];G.msgs=[];const p=G.p;p.x=300;p.y=420;G.camX=0;p.plv=5});
 const raf=()=>pg.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const info=()=>pg.evaluate(()=>{const p=__G().p;const [a,pr]=heroAnim(p);const fr=HERO_ATLAS.anims[a];return {a,f:fr[Math.min(fr.length-1,Math.floor(pr*fr.length))],z:Math.round(p.z),x:Math.round(p.x)}});
 const log=[];let n=0;
 async function shot(tag){await raf();const i=await info();const cx=await pg.evaluate(()=>__G().p.x-__G().camX);
  const f=`${OUT}/${String(n++).padStart(3,'0')}.png`;await pg.screenshot({path:f,clip:{x:Math.max(0,cx-150),y:250,width:300,height:240}});log.push({file:f,tag,...i})}
 const step=(k,fn)=>pg.evaluate(([k,fn])=>{const G=__G();if(fn)eval(fn);for(let i=0;i<k;i++){G.t+=1/60;updatePlayer(1/60);G.enemies=[]}},[k,fn]);
 // 待机参考
 await shot('idle');
 // 跳跃：完整弧线，30fps
 await step(0,"pressed.k=true;keys.k=false");await step(1);await shot('jump');
 for(let i=0;i<60;i++){await step(2);await shot('jump');const s=await info();if(s.a!=='jump')break}
 // 突刺冲锋
 await pg.evaluate(()=>{const p=__G().p;p.x=220});
 await step(0,"startDash()");await shot('thrust');for(let i=0;i<14;i++){await step(2);await shot('thrust');if((await info()).a!=='thrust')break}
 // 旋风斩
 await pg.evaluate(()=>{const p=__G().p;p.x=300});
 await step(0,"G.p.spinT=G.p.spinDur=.46");await shot('spin');for(let i=0;i<16;i++){await step(2);await shot('spin');if((await info()).a!=='spin')break}
 fs.writeFileSync(OUT+'/log.json',JSON.stringify(log,null,0));console.log(JSON.stringify(log.map(l=>l.tag+':'+l.f.slice(-7)+':'+l.f2+l.f+' z'+l.z).slice(0,0)));
 console.log(log.map(l=>`${l.tag} ${l.f.split('/').pop()} ${l.a}/${l.f===undefined?'':''}`).length,'shots');console.log(JSON.stringify(log.map(l=>[l.tag,l.a,l.z])));
 console.log('ERRS',errs);await b.close()})();
