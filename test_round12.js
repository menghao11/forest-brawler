// 第 12 轮：主角移动动画（起步 / 走 / 跑 / 刹车 / 转身，可打断、不闪帧、脚踩地面、快速左右点按不抖）+ 首领登场横幅与台词（docs/boss_intro_lines_full.csv）
const {chromium,devices}=require('playwright-core');const {execFileSync}=require('child_process');const fs=require('fs');
const URL=process.env.URL||'http://localhost:8931/index.html',MURL=process.env.MURL||'http://localhost:8932/game/index.html',OUT=process.env.OUT||__dirname;
const fails=[];const ok=(c,m)=>{if(!c){console.log('FAIL',m);fails.push(m)}else console.log('ok  ',m)};
async function setup(pg){await pg.evaluate(()=>{__dbg.speed(1);__dbg.resetSave();__dbg.unlockAll();__dbg.start(1);__dbg.speed(0);const G=__G(),p=G.p;G.enemies=[];G.lockX=null;
 window.__M={reset:()=>{const G=__G(),p=G.p;G.enemies=[];G.ep=[];for(const k in keys)keys[k]=false;for(const k in pressed)pressed[k]=false;Object.assign(p,{face:1,tb:1,tq:0,lc:'idle',lcT:0,walk:0,moving:false,runT:0,atkT:0,dashT:0,spinT:0,z:0,vz:0,landT:0,hurtT:0,castT:0,specialT:0,bufJ:0,combo:0,tdash:0,inv:9});p.x=G.camX+W*.4;p.y=(LANE_TOP+LANE_BOT)/2},
  // 推进 n 帧，每帧记录绘制用的帧名和朝向
  run:(n,keyFn)=>{const G=__G(),p=G.p,out=[];for(let i=0;i<n;i++){if(keyFn)keyFn(i);G.t+=1/60;G.time+=1/60;updatePlayer(1/60);const [a,pr,fc]=heroAnim(p);const fr=HERO_ATLAS.anims[a]||[a];out.push({f:fr[Math.min(fr.length-1,Math.floor(pr*fr.length))],face:fc||p.face,lf:p.face,x:+p.x.toFixed(1),z:p.z})}return out}}})}
const names=r=>r.map(o=>o.f);const runs=a=>{const o=[];for(const x of a){if(o.length&&o[o.length-1][0]===x)o[o.length-1][1]++;else o.push([x,1])}return o};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const pg=await b.newPage({viewport:{width:960,height:540}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await pg.goto(URL);await pg.waitForTimeout(800);
 // 图集：帧数与比例；脚底对齐（用 PIL 扫描每帧最低的不透明像素）
 const A=JSON.parse(fs.readFileSync(__dirname+'/assets/hero_atlas.json','utf8'));const cnt=k=>(A.anims[k]||[]).length;
 ok(cnt('walk')===8&&cnt('run')===6&&cnt('walk_start')===2&&cnt('walk_stop')===2&&cnt('turn')===3&&A.frames.walk_0.s===.625,`图集：walk 8 / run 6 / walk_start 2 / walk_stop 2 / turn 3 帧，比例 ${A.frames.walk_0.s}`);
 const feet=JSON.parse(execFileSync('python3',['-c',`
import json,sys
from PIL import Image
J=json.load(open('${__dirname}/assets/hero_atlas.json'));im=Image.open('${__dirname}/assets/hero_atlas.png').convert('RGBA');o={}
for k,f in J['frames'].items():
  if k.split('_')[0] in('idle','walk','run','turn'):
    a=im.crop((f['x'],f['y'],f['x']+f['w'],f['y']+f['h'])).split()[3].point(lambda v:255 if v>40 else 0);o[k]=round((a.getbbox()[3]-f['ay'])*f.get('s',1),1)
print(json.dumps(o))`]).toString());
 const ground=Object.entries(feet).filter(([k])=>!k.startsWith('run'));const idleF=feet.idle_0;
 ok(ground.every(([k,v])=>Math.abs(v-idleF)<=1),'脚踩地面：walk / walk_start / walk_stop / turn 每帧脚底与 idle 同一条地面线（偏差 ≤1px）'+JSON.stringify(ground.filter(([k,v])=>Math.abs(v-idleF)>1)));
 ok(Object.entries(feet).filter(([k])=>k.startsWith('run')).every(([k,v])=>v<=idleF&&v>=idleF-5),'跑步：着地帧踩地面，腾空帧离地 ≤4px（恢复 lift_px_removed）'+JSON.stringify(Object.fromEntries(Object.entries(feet).filter(([k])=>k.startsWith('run')))));
 await setup(pg);
 // 1) 起步 → 走 → 跑 → 松手刹车 → 站立
 const s1=await pg.evaluate(()=>{__M.reset();const a=__M.run(60,()=>{keys.d=true});const sp1=__G().p.x;const b=__M.run(30,()=>{keys.d=true});const sp2=__G().p.x-sp1;keys.d=false;const c=__M.run(20);return {a,b,c,run:sp2/.5}});
 const R1=runs(names(s1.a));
 ok(R1[0][0]==='walk_start_0'&&R1[1][0]==='walk_start_1'&&R1[0][1]>=4&&R1[0][1]<=6&&R1[1][1]>=4&&R1[1][1]<=6&&R1[2][0]==='walk_0','按住方向：walk_start_01 → 02（各约 1/12 秒）→ 从 walk_01 开始走：'+R1.slice(0,4).map(r=>r.join('×')).join(' '));
 const wr=R1.filter(r=>r[0].startsWith('walk_')&&!r[0].startsWith('walk_s')).slice(0,-1);
 ok(wr.length>=4&&wr.every(r=>r[1]>=4&&r[1]<=6),'走路 12 fps（每帧 4–6 个 60Hz 帧）：'+wr.map(r=>r[1]).join(','));
 const RB=runs(names(s1.b));ok(names(s1.b).every(f=>f.startsWith('run_'))&&RB.slice(1,-1).every(r=>r[1]>=4&&r[1]<=6)&&Math.abs(s1.run-260)<5,`按住约 0.55 秒后转为跑步（12 fps，速度 ${s1.run.toFixed(0)} px/s = 走路 ×1.3）`);
 const RC=runs(names(s1.c));ok(RC[0][0]==='walk_stop_0'&&RC[1][0]==='walk_stop_1'&&RC[2][0].startsWith('idle_')&&RC[0][1]<=6&&RC[1][1]<=6,'松开方向：下一帧立刻刹车 walk_stop_01 → 02 → idle（12 fps）：'+RC.slice(0,3).map(r=>r.join('×')).join(' '));
 // 2) 转身：右 → 正面 → 左，逻辑朝向立即翻转（攻击方向正确），画面播完 turn_03 才翻
 const s2=await pg.evaluate(()=>{__M.reset();const a=__M.run(24,()=>{keys.a=true});keys.a=false;return a});
 const R2=runs(names(s2).filter(f=>f.startsWith('turn')));const t3=s2.findIndex(o=>o.face===-1);
 ok(R2.map(r=>r[0]).join()==='turn_0,turn_1,turn_2'&&R2.every(r=>r[1]>=4&&r[1]<=6)&&s2.slice(0,t3).every(o=>o.face===1)&&s2[0].lf===-1&&!s2.slice(t3).some(o=>o.f.startsWith('turn')),'转身：turn_01 → 02 → 03（12 fps）按原朝向绘制，播完才翻向左；逻辑朝向第 1 帧就翻');
 // 3) 打断：起步 / 刹车 / 转身中按攻击、跳跃、新方向
 const s3=await pg.evaluate(()=>{const o={};const first=(arr)=>arr[0].f;
  for(const [ph,prep] of Object.entries({起步:()=>__M.run(3,()=>{keys.d=true}),刹车:()=>{__M.run(40,()=>{keys.d=true});keys.d=false;return __M.run(3)},转身:()=>__M.run(3,()=>{keys.a=true})})){
   __M.reset();const pre=prep();o[ph]={pre:pre[pre.length-1].f};pressed.j=true;o[ph].j=first(__M.run(1));
   __M.reset();prep();pressed.k=true;o[ph].k=first(__M.run(1));
   __M.reset();prep();for(const k in keys)keys[k]=false;o[ph].dir=names=null}
  // 刹车中按新方向 → 直接走
  __M.reset();__M.run(40,()=>{keys.d=true});keys.d=false;__M.run(3);o.stopDir=__M.run(1,()=>{keys.d=true})[0].f;keys.d=false;
  // 转身中反向 → 倒放回去
  __M.reset();__M.run(9,()=>{keys.a=true});keys.a=false;o.rev=__M.run(14,()=>{keys.d=true}).map(x=>x.f+':'+x.face);keys.d=false;return o});
 for(const ph of ['起步','刹车','转身'])ok(/^(attack|walk_|idle|turn)/.test(s3[ph].pre)&&/^attack1_/.test(s3[ph].j)&&/^jump/.test(s3[ph].k),`${ph}中（${s3[ph].pre}）按攻击下一帧即出拳（${s3[ph].j}），按跳下一帧即起跳（${s3[ph].k}）`);
 ok(/^walk_\d/.test(s3.stopDir),'刹车中按方向：下一帧直接走（'+s3.stopDir+'）');
 const rv=runs(s3.rev);ok(rv[0][0].startsWith('turn_1')&&rv.some(r=>r[0].startsWith('turn_0'))&&!rv.some(r=>r[0].endsWith(':-1')),'转身一半再按回来：倒放 turn 帧回到原朝向，不闪向左：'+rv.map(r=>r.join('×')).join(' '));
 // 4) 走 / 跑 → 出拳 / 跳：不闪站立帧、不卡帧
 const s4=await pg.evaluate(()=>{const o={};for(const n of [30,50]){__M.reset();__M.run(n,()=>{keys.d=true});pressed.j=true;o['j'+n]=__M.run(30,()=>{keys.d=true}).map(x=>x.f);__M.reset();__M.run(n,()=>{keys.d=true});pressed.k=true;o['k'+n]=__M.run(70,()=>{keys.d=true}).map(x=>x.f)}keys.d=false;return o});
 for(const k in s4){const a=s4[k],first=a[0],bad=a.slice(0,a.findIndex(f=>/^(walk_\d|run_)/.test(f))).filter(f=>/^(idle|walk_st)/.test(f));ok((/^attack1_/.test(first)||/^jump/.test(first))&&!bad.length&&a.some(f=>/^(walk_\d|run_)/.test(f)),`${k[0]==='j'?'出拳':'跳'}（${k.slice(1)} 帧时，${+k.slice(1)>33?'跑':'走'}中）：立即切换，结束后直接接回走/跑，不闪站立 / 起步 / 刹车帧`)}
 // 5) 快速左右点按：每 6 帧换向，持续 3 秒
 const s5=await pg.evaluate(()=>{__M.reset();const a=__M.run(180,i=>{const ph=Math.floor(i/6)%2;keys.a=ph===1;keys.d=ph===0});keys.a=keys.d=false;return a});
 const R5=runs(s5.map(o=>o.f+':'+o.face));const one=R5.filter(r=>r[1]<2).length,flips=runs(s5.map(o=>o.face)).length-1;const uniq=[...new Set(s5.map(o=>o.f.replace(/_\d+$/,'')))];
 ok(one<=R5.length*.1&&flips<=3,`快速左右点按（每 0.1 秒换向，3 秒）：画面帧 ${R5.length} 段，只显示 1 帧的 ${one} 段，画面朝向翻转 ${flips} 次（转身来回倒放，不抖）；用到 ${uniq.join('/')}`);
 const s5b=await pg.evaluate(()=>{__M.reset();const a=__M.run(240,i=>{const ph=Math.floor(i/12)%2;keys.a=ph===1;keys.d=ph===0});keys.a=keys.d=false;return a});
 const R5b=runs(s5b.map(o=>o.f+':'+o.face));ok(R5b.filter(r=>r[1]<2).length<=R5b.length*.1,`慢一点左右点按（每 0.2 秒换向，4 秒）：${R5b.length} 段，1 帧段 ${R5b.filter(r=>r[1]<2).length}，朝向翻转 ${runs(s5b.map(o=>o.face)).length-1} 次`);
 // 6) 正常游玩：真按键（键盘事件）+ 截图
 await pg.evaluate(()=>{__M.reset();__dbg.speed(1)});await pg.keyboard.down('d');await pg.waitForTimeout(120);await pg.screenshot({path:OUT+'/screenshot_r12_start.png'});await pg.waitForTimeout(700);await pg.screenshot({path:OUT+'/screenshot_r12_run.png'});
 const live=await pg.evaluate(()=>({lc:__G().p.lc,a:heroAnim(__G().p)[0]}));await pg.keyboard.up('d');await pg.waitForTimeout(40);const live2=await pg.evaluate(()=>heroAnim(__G().p)[0]);await pg.screenshot({path:OUT+'/screenshot_r12_stop.png'});
 await pg.keyboard.down('a');await pg.waitForTimeout(110);await pg.screenshot({path:OUT+'/screenshot_r12_turn.png'});await pg.keyboard.up('a');
 ok(live.lc==='run'&&live.a==='run'&&live2==='walk_stop','实际按键：按住 D 0.8 秒在跑，松开即刹车');
 // 7) 首领登场：横幅（标题列）+ 最多 2 句；再次挑战同一首领只说第 1 句
 const rows=fs.readFileSync(__dirname+'/docs/boss_intro_lines_full.csv','utf8').trim().split('\n').slice(1).map(l=>{const m=l.match(/^(\d+),([^,]+),([^,]+),(\d),"([^"]+)"/);return m&&{stage:+m[1],boss:m[2],title:m[3],ord:+m[4],line:m[5]}}).filter(Boolean);
 const short=fs.readFileSync(__dirname+'/docs/boss_intro_lines.csv','utf8');
 const BI=await pg.evaluate(()=>Object.fromEntries(Object.entries(BOSS_INTRO).map(([k,v])=>[BOSSES[k].name,v])));
 const miss=rows.filter(r=>!BI[r.boss]||BI[r.boss].title!==r.title||BI[r.boss].lines[r.ord-1]!==r.line);
 ok(rows.length===10&&!miss.length&&Object.values(BI).every(v=>v.lines.length<=2)&&!/旁白/.test(short),`首领登场台词：docs/boss_intro_lines_full.csv ${rows.length} 句 + 标题全部接入，每个首领 ≤2 句，无旁白`+(miss.length?JSON.stringify(miss):''));
 for(let s=1;s<=5;s++){const r=await pg.evaluate(async s=>{__dbg.speed(1);if(s===1)__dbg.resetSave();__dbg.unlockAll();const o={};
   for(const tr of [1,2]){__dbg.start(s);const G=__G();G.enemies=[];G.wave=G.B.waves.length-1;G.lockX=null;G.camX=G.B.waves[G.wave].x;G.p.x=G.camX+W*.4+10;G.p.y=(LANE_TOP+LANE_BOT)/2;G.p.inv=99;
    let k=0;const said=[];while(!G.boss&&k++<600){await new Promise(r=>setTimeout(r,16))}const t0=performance.now();o['ban'+tr]=G.bossIntro&&G.bossIntro.title+'|'+G.bossIntro.name;
    while(performance.now()-t0<5600){if(G.say&&said[said.length-1]!==G.say.text)said.push(G.say.text);await new Promise(r=>setTimeout(r,50))}o['say'+tr]=said;o.id=G.boss&&G.boss.id}
   return o},s);
  const L=rows.filter(x=>x.stage===s&&!/残影/.test(x.boss)).sort((a,b)=>a.ord-b.ord);
  ok(r.ban1===L[0].title+'|'+L[0].boss&&JSON.stringify(r.say1)===JSON.stringify(L.map(x=>x.line))&&JSON.stringify(r.say2)===JSON.stringify([L[0].line])&&r.ban2===r.ban1,`第 ${s} 关登场横幅「${r.ban1}」；首次说 ${r.say1.length} 句 ${JSON.stringify(r.say1)}，再次挑战只说 ${JSON.stringify(r.say2)}`);
  if(s===1){await pg.waitForTimeout(10)}}
 await pg.evaluate(()=>{__dbg.resetSave();__dbg.unlockAll();__dbg.start(1);const G=__G();G.enemies=[];G.wave=G.B.waves.length-1;G.lockX=null;G.camX=G.B.waves[G.wave].x;G.p.x=G.camX+W*.4+10;G.p.inv=99});await pg.waitForFunction(()=>__G().boss,null,{timeout:15000});await pg.waitForTimeout(700);await pg.screenshot({path:OUT+'/screenshot_r12_intro.png'});
 ok(!errs.length,'桌面无报错 '+errs.slice(0,3).join(' | '));
 // 8) iPhone：触屏摇杆走 → 刹车 + 登场横幅
 const ctx=await b.newContext({...devices['iPhone 13']});const mp=await ctx.newPage();const merr=[];mp.on('pageerror',e=>merr.push(e.message));await mp.goto(MURL);await mp.waitForTimeout(900);
 await setup(mp);const m=await mp.evaluate(()=>{__M.reset();const a=__M.run(60,()=>{keys.d=true});keys.d=false;const c=__M.run(20);const t=__M.run(24,()=>{keys.a=true});keys.a=false;return {a:a.map(x=>x.f),c:c.map(x=>x.f),t:t.map(x=>x.f)}});
 ok(m.a[0]==='walk_start_0'&&m.a.includes('walk_0')&&m.c[0]==='walk_stop_0'&&m.t.includes('turn_2'),'iPhone：起步 / 走 / 刹车 / 转身帧同样生效');
 await mp.evaluate(()=>{__dbg.speed(1);__dbg.resetSave();__dbg.unlockAll();__dbg.start(2);const G=__G();G.enemies=[];G.wave=G.B.waves.length-1;G.lockX=null;G.camX=G.B.waves[G.wave].x;G.p.x=G.camX+W*.4+10;G.p.inv=99});await mp.waitForFunction(()=>__G().boss,null,{timeout:15000});await mp.waitForTimeout(700);
 const mi=await mp.evaluate(()=>({b:__G().bossIntro&&__G().bossIntro.title,s:__G().say&&__G().say.text}));await mp.screenshot({path:OUT+'/screenshot_r12_iphone_intro.png'});
 ok(mi.b==='冰封巨兽'&&mi.s,'iPhone：登场横幅「'+mi.b+'」+ 台词「'+mi.s+'」');ok(!merr.length,'iPhone 无报错 '+merr.slice(0,3).join(' | '));
 await b.close();console.log(fails.length?'ROUND12_FAIL '+fails.length:'ROUND12_PASS')})();
