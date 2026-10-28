// 第 6 轮：装备描述/背景故事显示（换行、说明页、滚动），桌面 + iPhone
const {chromium,devices}=require('playwright-core');
const URL=process.env.URL||'http://localhost:8931/index.html',MURL=process.env.MURL||'http://localhost:8932/game/index.html',OUT=process.env.OUT||__dirname;
const fails=[];const ok=(c,m)=>{if(!c){console.log('FAIL',m);fails.push(m)}else console.log('ok  ',m)};
const selItem=id=>{const cs=shopCols();for(let c=0;c<cs.length;c++){const r=cs[c].findIndex(i=>i.id===id);if(r>=0){SHOP.col=c;SHOP.row=r;return true}}return false};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});
 // 桌面
 const pg=await b.newPage({viewport:{width:960,height:540}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 const ev=(f,a)=>pg.evaluate(f,a),W=ms=>pg.waitForTimeout(ms);
 await pg.goto(URL);await W(800);await ev(()=>{__dbg.resetSave();__dbg.gold(5000)});await pg.keyboard.press('b');await W(200);
 // 所有物品的描述/故事在两种面板宽度下的换行检查（每行不超宽，内容不丢字）
 let r=await ev(()=>{const bad=[];for(const it of EQUIP)for(const w of [290,236])for(const t of [it.desc,it.lore]){if(!t)continue;const ls=wrapText(t,w-24,12.5);
   if(ls.join('')!==t)bad.push(it.id+' lost');ls.forEach(l=>{const lw=ctx.measureText(l).width;if(lw>w-24+14)bad.push(it.id+' wide '+lw)})}
  return {bad,lore:EQUIP.filter(i=>i.lore).length,desc:EQUIP.filter(i=>i.desc).length}});
 ok(r.bad.length===0&&r.lore===15&&r.desc===15,'15 件描述/故事已导入且换行无溢出、无丢字 '+JSON.stringify(r));
 await ev(new Function('return ('+selItem+')("r_blood")'));await W(100);
 await ev(()=>__tap(642+8+62+29,90+19));await W(200);
 ok(await ev(()=>SHOP.view)===1,'点「说明」页签切换到物品说明');
 r=await ev(()=>({max:SHOP.loreMax,y:SHOP.loreY}));console.log('   商店面板 r_blood 超出', r.max,'px');
 await pg.screenshot({path:OUT+'/screenshot_lore.png'});
 if(r.max>0){await pg.mouse.move(780,300);await pg.mouse.wheel(0,400);await W(150);ok(await ev(()=>SHOP.loreY)>0,'滚轮可滚动');await ev(()=>{SHOP.loreY=0})}
 await pg.keyboard.press('v');await W(100);ok(await ev(()=>SHOP.view)===0,'V 切回属性页');
 // 女巫菜单（较窄面板）
 await pg.keyboard.press('k');await W(200);await ev(()=>__dbg.start(0));await W(300);
 await ev(()=>{const G=__G();G.enemies=[];G.lockX=null;G.wave=3;const w=G.B.witches[0];G.p.x=w.x-40;G.p.y=w.y+10;G.camX=w.x-400});await W(300);
 await pg.keyboard.press('e');await W(150);await pg.keyboard.press('q');await W(150);
 await ev(new Function('return ('+selItem+')("r_blood")'));await pg.keyboard.press('v');await W(200);
 r=await ev(()=>({tab:__G().menu.tab,view:SHOP.view,max:SHOP.loreMax}));ok(r.tab===1&&r.view===1,'女巫菜单商店页也可看说明 '+JSON.stringify(r));
 if(r.max>0){await pg.keyboard.press('PageDown');await W(100);ok(await ev(()=>SHOP.loreY)>0,'PgDn 滚动')}
 await pg.screenshot({path:'/tmp/lore_witch.png'});await ev(()=>{SHOP.view=0});
 ok(errs.length===0,'无页面错误 '+errs.join(' | '));
 // iPhone
 const ctxm=await b.newContext({...devices['iPhone 14 landscape']});const mp=await ctxm.newPage();const merr=[];mp.on('pageerror',e=>merr.push(e.message));
 await mp.goto(MURL);await mp.waitForTimeout(900);const cdp=await ctxm.newCDPSession(mp);
 const cvPt=(x,y)=>mp.evaluate(([x,y])=>{const R=document.getElementById('c').getBoundingClientRect();return {x:R.left+x*R.width/960,y:R.top+y*R.height/540}},[x,y]);
 const touch=async(type,p)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x:p.x,y:p.y}]});
 const tap=async(x,y)=>{const p=await cvPt(x,y);await touch('touchStart',p);await touch('touchEnd',p);await mp.waitForTimeout(150)};
 await mp.evaluate(()=>{__dbg.resetSave();__dbg.gold(5000)});await tap(480,488);ok(await mp.evaluate(()=>__dbg.mode())==='shop','iPhone 打开商店');
 // 点一下选中 r4（徽记），再点「说明」
 const pos=await mp.evaluate(()=>{const cs=shopCols();for(let c=0;c<cs.length;c++){const r=cs[c].findIndex(i=>i.id==='r_blood');if(r>=0)return {c,r}}});
 await mp.evaluate(()=>{EQUIP.find(i=>i.id==='r_blood').lore='（滚动测试用的超长故事）'.repeat(30)}); // 仅内存中，用来测滚动
 await tap(36+pos.c*200+90,112+pos.r*58+26);await tap(642+8+62+29,90+19);
 r=await mp.evaluate(()=>({view:SHOP.view,id:shopCols()[SHOP.col][SHOP.row].id,max:SHOP.loreMax}));ok(r.view===1&&r.id==='r_blood','iPhone 点选物品 + 点「说明」 '+JSON.stringify(r));
 ok(r.max>0,'超长故事需要滚动 '+r.max);
 if(r.max>0){const a=await cvPt(780,380),z=await cvPt(780,250);await touch('touchStart',a);for(let i=1;i<=5;i++)await touch('touchMove',{x:a.x,y:a.y+(z.y-a.y)*i/5});await touch('touchEnd',z);await mp.waitForTimeout(150);
  ok(await mp.evaluate(()=>SHOP.loreY)>0,'iPhone 拖动滚动故事');const y0=await mp.evaluate(()=>SHOP.loreY);await tap(642+290-22+4,90+40+32+(330-44-32)-24+11);ok(await mp.evaluate(()=>SHOP.loreY)>y0,'iPhone 点 ▼ 滚动')}
 await mp.screenshot({path:'/tmp/lore_mobile.png'});
 ok(merr.length===0,'iPhone 无页面错误 '+merr.join(' | '));
 await b.close();console.log(fails.length?'LORE_FAIL':'LORE_PASS')})();
