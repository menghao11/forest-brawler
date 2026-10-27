// 移动端触控测试：iPhone 14 横屏模拟 + CDP 多点触控
const {chromium,devices}=require('playwright-core');
const URL=process.env.URL||'http://localhost:8932/game/index.html';
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome'});
 const d=devices['iPhone 14 landscape']||devices['iPhone 14'];
 const ctx=await b.newContext({...d,hasTouch:true,isMobile:true});const pg=await ctx.newPage();const errs=[];
 pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});pg.on('pageerror',e=>errs.push(String(e)));
 await pg.goto(URL);await pg.waitForTimeout(600);
 const cdp=await ctx.newCDPSession(pg);
 const center=async sel=>pg.evaluate(s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}},sel);
 const T=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts});
 const j=await center('#joy'),a=await center('#bJ');
 const info=await pg.evaluate(()=>({touch:document.body.classList.contains('touch'),vw:innerWidth,vh:innerHeight,cw:document.getElementById('c').style.width}));
 const x0=await pg.evaluate(()=>__G().p.x);
 // 摇杆向右推 (id 0)
 await T('touchStart',[{x:j.x,y:j.y,id:0}]);await T('touchMove',[{x:j.x+50,y:j.y,id:0}]);await pg.waitForTimeout(4500);
 const x1=await pg.evaluate(()=>__G().p.x);
 // 摇杆右上斜方向检测 2.5D
 await T('touchMove',[{x:j.x+40,y:j.y-40,id:0}]);await pg.waitForTimeout(100);const diag=await pg.evaluate(()=>({d:keys.d,w:keys.w}));
 await T('touchMove',[{x:j.x+50,y:j.y,id:0}]);
 // 多点：保持摇杆 + 连点攻击
 await pg.evaluate(()=>{const G=__G(),p=G.p;G.enemies.forEach(e=>{e.x=p.x+60+Math.random()*20;e.y=p.y;e.kx=0})});
 let hits=0;for(let i=0;i<25;i++){await T('touchStart',[{x:j.x+50,y:j.y,id:0},{x:a.x,y:a.y,id:1}]);await pg.waitForTimeout(60);await T('touchEnd',[{x:j.x+50,y:j.y,id:0}]);await pg.waitForTimeout(140)}
 const st=await pg.evaluate(()=>{const G=__G();return {prof:G.p.prof,exp:G.p.exp,swingsHit:G.p.prof,energy:G.p.energy,lock:G.lockX}});
 await pg.screenshot({path:__dirname+'/screenshot_mobile.png'});
 await T('touchEnd',[]);
 // 必杀发光 & 魔法按钮
 await pg.evaluate(()=>{__G().p.energy=100});await pg.waitForTimeout(300);const glow=await pg.evaluate(()=>document.getElementById('bL').classList.contains('ready'));
 // 女巫对话按钮 + 点选法术
 await pg.evaluate(()=>{const G=__G();G.enemies=[];G.lockX=null;G.wave=1;G.p.x=1800;G.p.y=330;G.camX=1450;G.p.exp=100;G.p.spells=[]});await pg.waitForTimeout(300);
 const eVis=await pg.evaluate(()=>getComputedStyle(document.getElementById('bE')).display);
 console.log('dbg',JSON.stringify(await pg.evaluate(()=>({st:__G().state,x:__G().p.x,y:__G().p.y,hp:__G().p.hp,menu:__G().witchMenu}))),JSON.stringify(st),x0,x1);await pg.tap('#bE');await pg.waitForTimeout(150);const menu=await pg.evaluate(()=>__G().witchMenu);
 const rc=await pg.evaluate(()=>{const r=document.getElementById('c').getBoundingClientRect();return {x:r.left+400*r.width/960,y:r.top+222*r.height/540}});
 await pg.touchscreen.tap(rc.x,rc.y);await pg.waitForTimeout(150);const learned=await pg.evaluate(()=>__G().p.spells);
 await pg.screenshot({path:__dirname+'/screenshot_mobile_witch.png'});
 // 竖屏提示
 await pg.setViewportSize({width:390,height:844});await pg.waitForTimeout(200);const rot=await pg.evaluate(()=>getComputedStyle(document.getElementById('rot')).display);
 console.log(JSON.stringify({info,x0,x1,diag,st,glow,eVis,menu,learned,rot}));console.log('errors',errs);await b.close()})();
