// 金币/经验测量：每关自动推进（杀光、拾取全部掉落），记录结算金币
const {chromium}=require('playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const pg=await b.newPage({viewport:{width:960,height:540}});
const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto(process.env.URL||'http://localhost:8931/index.html');await pg.waitForTimeout(800);
const out=[];
for(let s=0;s<5;s++){await pg.evaluate(()=>{__dbg.resetSave();__dbg.unlockAll()});await pg.evaluate(i=>{__dbg.start(i);__dbg.god(true);__dbg.speed&&__dbg.speed(4)},s);
 for(let k=0;k<600;k++){const m=await pg.evaluate(()=>{const G=__G();if(__dbg.mode()!=='play')return __dbg.mode();if(G.menu){G.menu=null}while(gearOpen())gearAnswer(false);
   for(const e of G.enemies)if(!e.dead&&!e.hidden){e.hp=0;kill(e)}
   for(const q of G.pickups){q.x=G.p.x;q.y=G.p.y;q.z=0;q.vz=0}
   if(G.lockX==null){G.p.x+=300}return 'play'});if(m!=='play')break;await pg.waitForTimeout(60)}
 const r=await pg.evaluate(()=>({mode:__dbg.mode(),res:typeof RES!=='undefined'&&RES?{gold:RES.gold,exp:RES.exp,kills:RES.kills}:null,prompt:!!(__G()&&__G().gearPrompt),owned:__dbg.profile().owned,atkLv:__dbg.profile().atkLv,defLv:__dbg.profile().defLv,time:RES&&RES.time}));out.push({stage:s+1,...r});console.log(JSON.stringify(out[out.length-1]))}
console.log('errs',errs.slice(0,5));await b.close()})();
