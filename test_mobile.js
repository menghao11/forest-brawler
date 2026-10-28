// 移动端触控测试：iPhone 14 横屏模拟 + CDP 多点触控（关卡选择 → 战斗 → 女巫法术树 → 竖屏提示）
const {chromium,devices}=require('playwright-core');
const URL=process.env.URL||'http://localhost:8932/game/index.html';const OUT=process.env.OUT||__dirname;
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome'});
 const d=devices['iPhone 14 landscape']||devices['iPhone 14'];
 const ctx=await b.newContext({...d,hasTouch:true,isMobile:true});const pg=await ctx.newPage();const errs=[];
 pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});pg.on('pageerror',e=>errs.push(String(e)));
 await pg.goto(URL);await pg.waitForTimeout(800);await pg.evaluate(()=>__dbg.resetSave());
 const cdp=await ctx.newCDPSession(pg);
 const T=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts});
 const cvPt=(x,y)=>pg.evaluate(([x,y])=>{const r=document.getElementById('c').getBoundingClientRect();return {x:r.left+x*r.width/960,y:r.top+y*r.height/540}},[x,y]);
 const info=await pg.evaluate(()=>({touch:document.body.classList.contains('touch'),vw:innerWidth,vh:innerHeight,mode:__dbg.mode()}));
 await pg.screenshot({path:OUT+'/screenshot_mobile_select.png'});
 // 点击“开始”按钮（画布坐标 480,433）
 const st=await cvPt(480,433);await pg.touchscreen.tap(st.x,st.y);await pg.waitForTimeout(400);
 const mode=await pg.evaluate(()=>__dbg.mode());
 const center=async sel=>pg.evaluate(s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}},sel);
 const j=await center('#joy'),a=await center('#bJ');
 const x0=await pg.evaluate(()=>__G().p.x);
 await T('touchStart',[{x:j.x,y:j.y,id:0}]);await T('touchMove',[{x:j.x+50,y:j.y,id:0}]);await pg.waitForTimeout(4200);
 const x1=await pg.evaluate(()=>__G().p.x);
 await T('touchMove',[{x:j.x+40,y:j.y-40,id:0}]);await pg.waitForTimeout(100);const diag=await pg.evaluate(()=>({d:keys.d,w:keys.w}));
 await T('touchMove',[{x:j.x+50,y:j.y,id:0}]);
 await pg.evaluate(()=>{const G=__G(),p=G.p;__dbg.god();G.enemies.forEach(e=>{e.x=p.x+60+Math.random()*20;e.y=p.y;e.kx=0})});
 for(let i=0;i<25;i++){await T('touchStart',[{x:j.x+50,y:j.y,id:0},{x:a.x,y:a.y,id:1}]);await pg.waitForTimeout(60);await T('touchEnd',[{x:j.x+50,y:j.y,id:0}]);await pg.waitForTimeout(140)}
 const fight=await pg.evaluate(()=>{const G=__G();return {prof:G.p.prof,exp:G.p.exp,kills:G.kills,lock:G.lockX}});
 await pg.screenshot({path:OUT+'/screenshot_mobile.png'});
 await T('touchEnd',[]);
 await pg.evaluate(()=>{__G().p.energy=100});await pg.waitForTimeout(300);const glow=await pg.evaluate(()=>document.getElementById('bL').classList.contains('ready'));
 const l=await center('#bL');await pg.touchscreen.tap(l.x,l.y);await pg.waitForTimeout(200);const ult=await pg.evaluate(()=>__G().p.specialT>0);await pg.waitForTimeout(1800);
 // 女巫营地：按钮 + 点选法术树
 await pg.evaluate(()=>{const G=__G();G.enemies=[];G.lockX=null;G.wave=3;const w=G.B.witches[0];G.p.x=w.x-40;G.p.y=w.y+10;G.camX=w.x-400;G.p.exp=100;G.p.spells=[]});await pg.waitForTimeout(400);
 const eVis=await pg.evaluate(()=>getComputedStyle(document.getElementById('bE')).display);
 await pg.tap('#bE');await pg.waitForTimeout(250);const menu=await pg.evaluate(()=>!!__G().menu);
 const r1=await cvPt(70+280*2+100,150+23);await pg.touchscreen.tap(r1.x,r1.y);await pg.waitForTimeout(200);  // 雷系 1：连锁闪电
 const learned=await pg.evaluate(()=>__G().p.spells);
 await pg.screenshot({path:OUT+'/screenshot_mobile_witch.png'});
 const cl=await cvPt(480,487);await pg.touchscreen.tap(cl.x,cl.y);await pg.waitForTimeout(200);const closed=await pg.evaluate(()=>!__G().menu);
 await pg.setViewportSize({width:390,height:844});await pg.waitForTimeout(200);const rot=await pg.evaluate(()=>getComputedStyle(document.getElementById('rot')).display);
 const res={info,mode,x0,x1,diag,fight,glow,ult,eVis,menu,learned,closed,rot};console.log(JSON.stringify(res));
 const ok=info.touch&&mode==='play'&&x1>x0+300&&diag.d&&diag.w&&fight.prof>0&&glow&&ult&&eVis!=='none'&&menu&&learned.includes('t1')&&closed&&rot!=='none'&&!errs.length;
 console.log(ok?'MOBILE_PASS':'MOBILE_FAIL','errors',errs);await b.close();process.exit(ok?0:1)})();
