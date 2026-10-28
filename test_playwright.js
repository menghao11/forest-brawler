// 桌面端流程测试：选关→波次→终结技→女巫学习→施法→首领→结算→第五关→结局→失败
// 用法：URL=... OUT=截图目录 node test_playwright.js
const {chromium}=require('playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--autoplay-policy=no-user-gesture-required']});
const pg=await b.newPage({viewport:{width:960,height:540}});const errs=[];pg.on('pageerror',e=>errs.push('PE '+e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await pg.goto((process.env.URL||'http://localhost:8931/index.html'));await pg.waitForTimeout(800);await pg.evaluate(()=>{__dbg.resetSave()});
const shot=n=>pg.screenshot({path:(process.env.OUT||'/tmp')+'/'+n+'.png'});const ev=f=>pg.evaluate(f);
await pg.keyboard.press('Enter');await pg.waitForTimeout(300);
await pg.keyboard.down('d');await pg.waitForTimeout(3200);await pg.keyboard.up('d');await pg.waitForTimeout(1800);
console.log(await ev(()=>{const G=__G();return JSON.stringify({x:G.p.x,lock:G.lockX,en:G.enemies.map(e=>[e.type,Math.round(e.x),Math.round(e.y)])})}));
await shot('f_wave1');
for(let k=0;k<20;k++){await pg.keyboard.press('j');await pg.waitForTimeout(120)}
console.log(await ev(()=>{const G=__G();return JSON.stringify({hp:G.p.hp,prof:G.p.prof,en:G.enemies.map(e=>[e.type,Math.round(e.hp),e.dead])})}));
await ev(()=>{__dbg.energy()});await pg.keyboard.press('l');await pg.waitForTimeout(450);await shot('f_ult');await pg.waitForTimeout(1500);
console.log(await ev(()=>JSON.stringify(__G().enemies.map(e=>[e.type,Math.round(e.hp),e.dead]))));
// witch
await ev(()=>{const G=__G();G.enemies=[];G.lockX=null;G.wave=3;G.p.exp=200;const w=G.B.witches[0];G.p.x=w.x-40;G.p.y=w.y+10;G.camX=w.x-400});await pg.waitForTimeout(300);
await pg.keyboard.press('e');await pg.waitForTimeout(200);await pg.keyboard.press('j');await pg.waitForTimeout(100);await pg.keyboard.press('ArrowRight');await pg.keyboard.press('j');await pg.waitForTimeout(200);await shot('f_witch');
console.log(await ev(()=>JSON.stringify({sp:__G().p.spells,exp:__G().p.exp,menu:!!__G().menu})));
await pg.keyboard.press('e');await ev(()=>{__G().p.mp=100});await pg.keyboard.press('u');await pg.waitForTimeout(300);await shot('f_cast');
// boss & results
await ev(()=>{const G=__G();__dbg.skip(G.B.waves.length-1)});await pg.keyboard.down('d');await pg.waitForTimeout(500);await pg.keyboard.up('d');await pg.waitForTimeout(1500);
await ev(()=>{__dbg.god();const B=__dbg.boss();B.hp=B.maxhp*.45});await pg.waitForTimeout(3500);await shot('f_boss1');
await ev(()=>__dbg.killAll());await pg.waitForTimeout(3200);await shot('f_results');console.log('mode',await ev(()=>__dbg.mode()),await ev(()=>JSON.stringify(__dbg.profile())));
await pg.keyboard.press('k');await pg.waitForTimeout(300);await shot('f_select2');
// final stage ending
await ev(()=>{__dbg.unlockAll();__dbg.start(5);__dbg.god();const G=__G();__dbg.skip(G.B.waves.length-1)});await pg.keyboard.down('d');await pg.waitForTimeout(500);await pg.keyboard.up('d');await pg.waitForTimeout(1500);
await ev(()=>{const B=__dbg.boss();B.hp=B.maxhp*.2});await pg.waitForTimeout(5000);await shot('f_vamp3');
await ev(()=>__dbg.killAll());await pg.waitForTimeout(3200);await pg.keyboard.press('Enter');await pg.waitForTimeout(2500);await shot('f_ending');
console.log('mode',await ev(()=>__dbg.mode()),await ev(()=>JSON.stringify(__dbg.profile().ngplusUnlocked)));
// game over
await ev(()=>{__dbg.god(false);__dbg.start(1);__G().p.hp=1});await pg.keyboard.down('d');await pg.waitForTimeout(400);await pg.keyboard.up('d');await ev(()=>{hurtPlayer(50,null)});await pg.waitForTimeout(2200);await shot('f_over');console.log('mode',await ev(()=>__dbg.mode()));
console.log('ERRS',errs.slice(0,10));console.log(errs.length?'DESKTOP_FAIL':'DESKTOP_PASS');await b.close();process.exit(errs.length?1:0)})();
