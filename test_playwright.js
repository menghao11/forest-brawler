const {chromium}=require('playwright-core');(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required'],executablePath:'/usr/bin/google-chrome'});const pg=await b.newPage({viewport:{width:960,height:540}});
const errs=[];pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto((process.env.URL||'http://localhost:8932/game/index.html'));await pg.waitForTimeout(500);console.log('E',errs);
await pg.keyboard.down('d');await pg.waitForTimeout(4500);await pg.keyboard.up('d');
for(let i=0;i<60;i++){await pg.keyboard.press('j');await pg.waitForTimeout(120);if(i%10==0){await pg.keyboard.down('d');await pg.waitForTimeout(150);await pg.keyboard.up('d')}}
await pg.keyboard.press('u');await pg.waitForTimeout(200);
let s=await pg.evaluate(()=>{const G=__G();return {prof:G.p.prof,plv:G.p.plv,witchVisible:G.witches.some(w=>w.x>G.camX-60&&w.x<G.camX+1020),lock:G.lockX,wave:G.wave,en:G.enemies.filter(e=>!e.dead).length,gold:G.p.gold,exp:G.p.exp,hp:G.p.hp,en2:G.p.energy,pick:G.pickups.length,msgs:G.msgs.map(m=>m.t)}});console.log(JSON.stringify(s),errs);
// test spells & special
await pg.evaluate(()=>{const G=__G();G.p.spells=['fire','frost','bolt'];G.p.mp=9;G.p.energy=100;G.p.hp=97;});
await pg.keyboard.press('u');await pg.waitForTimeout(150);await pg.screenshot({path:'/workspace/game/screenshot.png'});await pg.keyboard.press('i');await pg.keyboard.press('u');await pg.waitForTimeout(100);
await pg.keyboard.press('l');await pg.waitForTimeout(250);await pg.screenshot({path:'/workspace/game/screenshot_special.png'});
// witch menu
await pg.evaluate(()=>{const G=__G();G.enemies=[];G.lockX=null;G.p.x=1800;G.p.y=330;G.p.spells=[];G.p.exp=60;G.camX=1450});await pg.waitForTimeout(300);
await pg.keyboard.press('e');await pg.waitForTimeout(100);await pg.keyboard.press('1');await pg.waitForTimeout(100);await pg.screenshot({path:'/workspace/game/screenshot_witch.png'});
console.log(JSON.stringify(await pg.evaluate(()=>({sp:__G().p.spells,exp:__G().p.exp,state:__G().state}))));
// proficiency test
await pg.evaluate(()=>{const G=__G();G.state='play';G.witchMenu=false;G.p.plv=1;G.p.prof=14;G.p.specialT=0;G.go=0;G.flash=0;G.p.x=2500;G.p.y=390;G.camX=2200;G.p.face=1;G.enemies=[];G.lockX=2200;G.popup=null;G.msgs=[];['g','g','elite'].forEach((t,i)=>{G.enemies.push&&0});});
await pg.evaluate(()=>{const G=__G();const sp=(x,y)=>{G.enemies.push({type:'g',x,y,z:0,vz:0,hp:300,maxhp:300,sp:0,dmg:0,r:1,exp:10,face:-1,state:'walk',t:0,hurtT:0,frozen:0,kx:0,walk:0,cd:99,dead:0})};sp(2550,390);sp(2580,400);sp(2440,385)});
await pg.keyboard.press('j');await pg.waitForTimeout(350);await pg.screenshot({path:'/workspace/game/screenshot_skill.png'});
await pg.waitForTimeout(500);let spun=0;for(let i=0;i<4;i++){await pg.keyboard.press('j');await pg.waitForTimeout(i==2?360:220);console.log('c',await pg.evaluate(()=>[__G().p.combo,__G().p.atkT.toFixed(2),__G().p.plv]));if(await pg.evaluate(()=>__G().p.spinT>0))spun=1}
const r1=await pg.evaluate((spun)=>({plv:__G().p.plv,popup:!!__G().popup,spun}),spun);
await pg.evaluate(()=>{const G=__G();G.p.plv=4;G.p.prof=80;G.p.x=2450;G.p.comboWin=0;G.p.atkT=0;G.p.combo=0});await pg.waitForTimeout(700);
await pg.keyboard.down('d');await pg.keyboard.press('j');await pg.waitForTimeout(80);const dash=await pg.evaluate(()=>__G().p.dashT>0);await pg.keyboard.up('d');await pg.waitForTimeout(800);
await pg.keyboard.down('j');await pg.waitForTimeout(900);await pg.keyboard.up('j');await pg.waitForTimeout(60);const wave=await pg.evaluate(()=>__G().projs.some(f=>f.wave));
await pg.screenshot({path:'/workspace/game/screenshot_wave.png'});
console.log('skills',JSON.stringify({r1,dash,wave}));
const au=await pg.evaluate(async()=>{const r={ctx:!!AU.ctx,state:AU.ctx&&AU.ctx.state};for(const k in SFX)sfx(k);await new Promise(r=>setTimeout(r,300));r.m0=AU.muted;return r});await pg.keyboard.press('m');au.m1=await pg.evaluate(()=>AU.muted);await pg.screenshot({path:'/workspace/game/screenshot_mute.png'});await pg.keyboard.press('m');console.log('audio',JSON.stringify(au));console.log('errors',errs);await b.close()})();
