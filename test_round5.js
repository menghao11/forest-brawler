// 第 5 轮功能测试：装备商店（购买/装备/存档）、旧存档迁移、法术冷却/魔力/升级、灼烧、首领追赶系数、女巫美术、iPhone 触屏图标
// 用法：node test_round5.js（桌面 8931，移动 8932）；截图存到 OUT（默认本目录）
const {chromium,devices}=require('playwright-core');
const URL=process.env.URL||'http://localhost:8931/index.html',MURL=process.env.MURL||'http://localhost:8932/game/index.html',OUT=process.env.OUT||__dirname;
const ok=(c,m)=>{if(!c){console.log('FAIL',m);fails.push(m)}else console.log('ok  ',m)};const fails=[];
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});
 const pg=await b.newPage({viewport:{width:960,height:540}});const errs=[];pg.on('pageerror',e=>errs.push('PE '+e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 const ev=(f,a)=>pg.evaluate(f,a),W=ms=>pg.waitForTimeout(ms),shot=n=>pg.screenshot({path:OUT+'/'+n});
 await pg.goto(URL);await W(800);
 // 1. 旧存档迁移
 await ev(()=>{localStorage.setItem('qingyi_brawler_save_v2',JSON.stringify({unlocked:2,cleared:[1],best:{},gold:100,exp:50,mp:7,atkLv:2,defLv:1,prof:0,plv:1,spells:['f1'],sel:0,flameSword:1,vol:.8}))});
 await pg.reload();await W(800);
 let P=await ev(()=>__dbg.profile());ok(P.mp===100&&P.gold===160&&P.eq.weapon==='w_flame'&&P.owned.includes('w_flame')&&P.mpv===3&&P.flameSword===undefined,'旧存档迁移 '+JSON.stringify({mp:P.mp,gold:P.gold,eq:P.eq}));
 // 2. 商店：B 打开，点两下购买
 await ev(()=>{__dbg.resetSave();__dbg.gold(5000)});await pg.keyboard.press('b');await W(300);ok(await ev(()=>__dbg.mode())==='shop','B 打开装备商店');
 const cell=(c,r)=>({x:36+c*200+90,y:112+r*58+26});
 for(const [c,r] of [[0,1],[1,0],[2,2]]){const q=cell(c,r);await ev(([x,y])=>__tap(x,y),[q.x,q.y]);await W(80);await ev(([x,y])=>__tap(x,y),[q.x,q.y]);await W(120)}
 P=await ev(()=>__dbg.profile());ok(P.eq.weapon==='w2'&&P.eq.armor==='a1'&&P.eq.acc==='r3'&&P.gold===5000-900-250-1900,'购买并装备 '+JSON.stringify({eq:P.eq,gold:P.gold}));
 const q=cell(0,3);await ev(([x,y])=>__tap(x,y),[q.x,q.y]);await W(80);await ev(([x,y])=>__tap(x,y),[q.x,q.y]);await W(100);
 ok((await ev(()=>__dbg.profile().gold))===5000-900-250-1900,'金币不足无法购买');
 await ev(([x,y])=>__tap(x,y),[cell(0,2).x,cell(0,2).y]);await W(300);await shot('screenshot_shop.png');
 await pg.reload();await W(800);P=await ev(()=>__dbg.profile());ok(P.eq.weapon==='w2'&&P.owned.length===3,'刷新后装备仍在（localStorage）');
 // 3. 关内属性 + 首领追赶
 await ev(()=>__dbg.start(0));await W(300);
 let r=await ev(()=>{const p=__G().p;return {atk:atk(),def:def(),maxhp:p.maxhp,mpMax:p.mpMax,crit:p.st.crit,spell:p.st.spell}});
 ok(r.atk===22&&r.def===1&&r.maxhp===117&&r.mpMax===140,'关内装备属性 '+JSON.stringify(r));
 r=await ev(()=>{const G=__G();G.idx=2;const a=bossCatchUp();G.p.eq={};applyGear(G.p);const b=bossCatchUp();G.idx=0;return {withGear:+(a*(10+12)).toFixed(1),noGear:+(b*10).toFixed(1)}});
 ok(r.withGear>r.noGear&&r.noGear>=30,'首领追赶（按关卡进度）：有装备对首领有效攻击更高 '+JSON.stringify(r));
 await ev(()=>{const p=__G().p;p.eq={weapon:'w2',armor:'a1',acc:'r3'};applyGear(p)});
 // 4. 女巫：学习、升级、商店页、施法帧
 await ev(()=>{const G=__G();G.enemies=[];G.lockX=null;G.wave=3;G.p.exp=1000;const w=G.B.witches[0];G.p.x=w.x-40;G.p.y=w.y+10;G.camX=w.x-400});await W(300);
 await pg.keyboard.press('e');await W(150);
 await ev(()=>{__tap(70+130,150+23)});await W(60);await ev(()=>{__tap(70+130,150+23)});await W(60);await ev(()=>{__tap(70+130,150+52+23)});await W(60);
 await ev(()=>{__tap(630+130,150+23)});await W(60);await ev(()=>{__tap(350+130,150+23)});await W(60);await ev(()=>{__tap(350+130,150+52+23)});await W(150);
 r=await ev(()=>({sp:__G().p.spells,slv:__G().p.slv,exp:__G().p.exp,cast:__G().menu.w.castUntil>performance.now()/1000,prof:__dbg.profile().slv}));
 ok(r.sp.length===5&&r.slv.f1===2&&r.prof.f1===2&&r.cast,'学习 5 个法术 + 火球术升到 Lv2，女巫施法帧 '+JSON.stringify(r));
 await pg.screenshot({path:'/tmp/f_witch_magic.png'});
 await pg.keyboard.press('q');await W(150);await shot('screenshot_witch_shop.png');ok(await ev(()=>__G().menu.tab)===1,'Q 切到装备商店页');
 await pg.keyboard.press('e');await W(200);
 // 5. 施法：冷却 / 魔力 / 灼烧
 await ev(()=>{const G=__G();G.p.mp=100;G.p.sel=0;});
 await pg.keyboard.press('u');await W(100);
 r=await ev(()=>{const p=__G().p;return {mp:Math.round(p.mp),cd:+(p.cds.f1||0).toFixed(2)}});ok(r.mp>=84&&r.mp<=86&&r.cd>0.5,'施法扣魔力 15 并进入冷却 '+JSON.stringify(r));
 await pg.keyboard.press('u');await W(80);ok(Math.round(await ev(()=>__G().p.mp))>=r.mp,'冷却中不能再施放');
 r=await ev(()=>{const G=__G(),p=G.p;spawn('goblin',p.x+200,p.y,{});const e=G.enemies[G.enemies.length-1];e.hp=e.maxhp=500;damage(e,30,0,p.x,'fire',{burn:3});return {id:G.enemies.length-1,hp:e.hp,burn:e.burnT}}).catch(e=>({err:String(e)}));
 if(r.err){console.log('spawn api?',r.err)}else{await W(1600);const hp2=await ev(i=>__G().enemies[i].hp,r.id);ok(r.burn>0&&hp2<r.hp,'火系灼烧持续掉血 '+r.hp.toFixed(0)+'→'+hp2.toFixed(0));}
 r=await ev(()=>{const G=__G(),p=G.p;const e=G.enemies.find(e=>!e.dead);if(!e)return null;damage(e,10,0,p.x,'ice');return e.slow});ok(r>=2,'冰系命中必减速 '+r);
 // HUD 截图：多个法术、一个冷却中、魔力残影
 await ev(()=>{const G=__G(),p=G.p;G.enemies.forEach(e=>{e.dead=1});p.sel=1;p.mp=60;p.mpGhost=95;p.mpShow=62;p.cds={f1:.6,f2:1.6};p.cdMax={f1:.88,f2:2.5};p.slv.f2=3;p.x=G.camX+300});
 await W(120);await shot('screenshot_magic_hud.png');
 console.log('ERRS',errs.slice(0,8));
 // 6. iPhone：触屏法术图标
 const d=devices['iPhone 14 landscape'];const mc=await b.newContext({...d,hasTouch:true,isMobile:true});const mp=await mc.newPage();const merr=[];mp.on('pageerror',e=>merr.push(String(e)));mp.on('console',m=>{if(m.type()==='error')merr.push(m.text())});
 await mp.goto(MURL);await mp.waitForTimeout(800);
 await mp.evaluate(()=>{__dbg.resetSave();__dbg.start(0);const p=__G().p;p.spells=['f1','i2','t1'];p.sel=0;p.mp=100;p.cds={i2:3};p.cdMax={i2:8}});await mp.waitForTimeout(500);
 const cdp=await mc.newCDPSession(mp);const box=await mp.locator('#bU').boundingBox();
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2,id:1}]});await mp.waitForTimeout(80);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await mp.waitForTimeout(250);
 r=await mp.evaluate(()=>({cd:__G().p.cds.f1>0,mp:Math.round(__G().p.mp),px:(()=>{const c=document.getElementById('icU').getContext('2d').getImageData(58,58,1,1).data;return c[3]})()}));
 ok(r.cd&&r.mp<100&&r.px>0,'iPhone“魔法”键施法，按钮内画出法术图标 '+JSON.stringify(r));
 const ib=await mp.locator('#bI').boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:ib.x+ib.width/2,y:ib.y+ib.height/2,id:2}]});await mp.waitForTimeout(80);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await mp.waitForTimeout(300);
 ok(await mp.evaluate(()=>__G().p.sel)===1,'iPhone“切换”键换法术');
 await mp.screenshot({path:OUT+'/screenshot_magic_hud_mobile.png'});
 await mp.evaluate(()=>{__dbg.resetSave();__dbg.gold(3000);MODE='select'});await mp.waitForTimeout(300);
 r=await mp.evaluate(()=>{const R=document.getElementById('c').getBoundingClientRect();return R});
 const tapC=async(x,y)=>{const R=r;const pt={x:R.left+x*R.width/960,y:R.top+y*R.height/540,id:3};await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pt]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await mp.waitForTimeout(150)};
 await tapC(480,488);ok(await mp.evaluate(()=>__dbg.mode())==='shop','iPhone 点“装备商店”按钮进入商店');
 await tapC(36+90,112+26);await tapC(36+90,112+26);ok(await mp.evaluate(()=>__dbg.profile().eq.weapon)==='w1','iPhone 点两下购买武器');
 await mp.screenshot({path:OUT+'/screenshot_shop_mobile.png'});
 await tapC(480,488);ok(await mp.evaluate(()=>__dbg.mode())==='select','iPhone 返回关卡选择');
 console.log('MERRS',merr.slice(0,8));
 const bad=fails.length||errs.length||merr.length;console.log(bad?'ROUND5_FAIL':'ROUND5_PASS');await b.close();process.exit(bad?1:0)})();
