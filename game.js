'use strict';
const cv=document.getElementById('c'),ctx=cv.getContext('2d');const W=960,H=540;
const LANE_TOP=300,LANE_BOT=470,STAGE_END=4200,OUT='#15101f';
const keys={},pressed={};
addEventListener('keydown',e=>{const k=e.key.toLowerCase();auInit();if(k==='m'&&!e.repeat)auMute();if(!keys[k])pressed[k]=true;keys[k]=true;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
const hit=k=>{if(pressed[k]){pressed[k]=false;return true}return false};
const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const SPELLS=[
 {id:'fire',name:'火球术',exp:40,mp:1,col:'#ff7a1a',desc:'直线火球，穿透伤害30'},
 {id:'frost',name:'冰霜新星',exp:70,mp:2,col:'#7fe3ff',desc:'冻结周围敌人3秒，伤害15'},
 {id:'bolt',name:'雷击',exp:100,mp:3,col:'#fff36b',desc:'雷电劈中最多5个敌人，伤害40'}];
let G;
function reset(){
 G={t:0,camX:0,lockX:null,state:'play',shake:0,hitstop:0,flash:0,msgs:[],parts:[],pickups:[],projs:[],enemies:[],bolts:[],
  waves:[{x:700,list:['g','g','g','g']},{x:1900,list:['g','g','g','g','elite']},{x:3000,list:['g','g','g','elite','g','g']},{x:3850,list:['boss','g','g']}],
  wave:0,go:0,witchMenu:false,
  witches:[{x:1800,y:320},{x:2930,y:320}],popup:null,waves2:[],
  p:{x:150,y:390,z:0,vz:0,face:1,hp:97,maxhp:97,energy:0,gold:0,exp:0,mp:0,atkLv:0,defLv:0,combo:0,atkT:0,comboWin:0,hurtT:0,inv:0,spells:[],sel:0,prof:0,plv:1,dashT:0,dashCd:0,dashHits:[],jHold:0,specialT:0,castT:0,walk:0}};
 deco();
}
let trees=[],props=[];
function deco(){trees=[];props=[];
 for(let i=0;i<60;i++)trees.push({x:i*110+rnd(-30,30),w:rnd(30,70),layer:Math.random()<.5?0:1,h:rnd(.8,1)});
 for(let x=200;x<STAGE_END;x+=rnd(260,420))props.push({type:'torch',x,y:Math.random()<.5?290:488});
 for(let x=400;x<STAGE_END;x+=rnd(300,500))props.push({type:'crystal',x,y:rnd(270,290),s:rnd(.7,1.3)});
 for(let x=100;x<STAGE_END;x+=rnd(150,250))props.push({type:'rock',x,y:rnd(480,520),s:rnd(.6,1.2)});}
const PROF=[0,15,40,80,140];
const MOVES={2:['旋风斩','连击第4击变为360°旋转范围斩'],3:['突刺冲锋','按住方向前进 + J：高速突刺贯穿敌人'],4:['剑气波','长按J蓄力后松开：发射剑气波'],5:['必杀强化','必杀伤害提升50%，特效升级为金色天穹剑气']};
function gainProf(n){const p=G.p;if(p.plv>=5)return;p.prof+=n;while(p.plv<5&&p.prof>=PROF[p.plv]){p.plv++;const m=MOVES[p.plv];sfx('levelup');G.popup={title:'砍杀熟练度 Lv'+p.plv+'！',text:'解锁：'+m[0],sub:m[1],life:3};particles(p.x,p.y,40,'#ffd34a',30,260)}}
function meleeHit(reach,dmg,kb,around){const p=G.p;let any=0;for(const e of G.enemies){if(e.dead)continue;const dx=(e.x-p.x)*p.face;
 if((around?Math.abs(dx)<reach+20*e.r:(dx>-15&&dx<reach+20*e.r))&&Math.abs(e.y-p.y)<(around?50:28)+8*e.r){damage(e,dmg,kb,p.x);any++}}gainProf(any);return any}
function atk(){return 10+G.p.atkLv*4}function def(){return G.p.defLv*2}
function msg(t,c='#fff'){G.msgs.push({t,c,life:2})}
function spawn(type,x,y){const b={g:{hp:30,sp:70,dmg:6,r:1,exp:10},elite:{hp:80,sp:60,dmg:10,r:1.3,exp:30},boss:{hp:400,sp:55,dmg:16,r:2,exp:80}}[type];
 G.enemies.push({type,x,y,z:0,vz:0,hp:b.hp,maxhp:b.hp,sp:b.sp,dmg:b.dmg,r:b.r,exp:b.exp,face:-1,state:'walk',t:rnd(0,1),hurtT:0,frozen:0,kx:0,walk:0,cd:rnd(.5,1.5),dead:0});}
function particles(x,y,z,col,n,sp=200){for(let i=0;i<n;i++)G.parts.push({x,y,z,vx:rnd(-sp,sp),vz:rnd(50,sp*1.5),vy:rnd(-30,30),life:rnd(.3,.7),col,s:rnd(2,5)})}
function damage(e,d,kb,fromX){if(e.dead)return;e.hp-=d;e.hurtT=.25;e.kx=(e.x<fromX?-1:1)*kb*(e.type==='boss'?.3:1);
 particles(e.x,e.y,40*e.r,'#ffe080',8);G.parts.push({num:Math.round(d),x:e.x,y:e.y,z:70*e.r,vz:60,life:.8,vx:0,vy:0});
 G.p.energy=Math.min(100,G.p.energy+4);sfx('hit');if(e.hp<=0)kill(e);}
function kill(e){e.dead=1;e.deadT=0;sfx('death');G.p.exp+=e.exp;particles(e.x,e.y,30,'#7bd34a',20,260);
 const n=e.type==='boss'?20:e.type==='elite'?8:Math.floor(rnd(2,5));
 for(let i=0;i<n;i++)G.pickups.push({kind:'coin',x:e.x,y:clamp(e.y+rnd(-20,20),LANE_TOP,LANE_BOT),z:20,vz:rnd(150,300),vx:rnd(-120,120),t:0});
 const r=Math.random();
 if(e.type!=='g'||r<.35)G.pickups.push({kind:'potion',x:e.x,y:e.y,z:20,vz:250,vx:rnd(-60,60),t:0});
 if(e.type!=='g'||Math.random()<.18)G.pickups.push({kind:Math.random()<.5?'sword':'armor',x:e.x,y:e.y,z:20,vz:280,vx:rnd(-80,80),t:0});
 msg('+'+e.exp+' 经验','#c9a0ff');}
function update(dt){
 const p=G.p;G.t+=dt;
 if(G.state!=='play'){if(hit('r')||hit('enter'))reset();return}
 // witch menu
 const nearW=G.witches.find(w=>Math.abs(w.x-p.x)<80&&Math.abs(w.y-p.y)<90);
 if(G.witchMenu){if(hit('e')||hit('escape')||!nearW)G.witchMenu=false;
  for(let i=0;i<3;i++)if(hit(String(i+1))){const s=SPELLS[i];
   if(p.spells.includes(s.id))msg('已学会 '+s.name,'#aaa');else if(p.exp<s.exp){msg('经验不足！','#f66');sfx('fail')}
   else{p.exp-=s.exp;p.spells.push(s.id);p.sel=p.spells.length-1;msg('学会了 '+s.name+'！','#e0b0ff');sfx('levelup');particles(p.x,p.y,40,'#c070ff',30);}}
  return}
 if(nearW&&hit('e')){G.witchMenu=true;sfx('witch');return}
 if(G.hitstop>0){G.hitstop-=dt;return}
 // player
 p.atkT-=dt;p.comboWin-=dt;p.hurtT-=dt;p.inv-=dt;p.specialT-=dt;p.castT-=dt;
 let mx=(keys.arrowright||keys.d?1:0)-(keys.arrowleft||keys.a?1:0),my=(keys.arrowdown||keys.s?1:0)-(keys.arrowup||keys.w?1:0);
 const busy=p.atkT>0&&p.z===0||p.hurtT>0;
 if(!busy){p.x+=mx*220*dt;p.y+=my*150*dt;if(mx)p.face=mx;if(mx||my)p.walk+=dt*10;}
 const minX=G.camX+20,maxX=G.lockX!=null?G.lockX+W-20:STAGE_END;
 p.x=clamp(p.x,minX,maxX);p.y=clamp(p.y,LANE_TOP,LANE_BOT);
 if(hit('k')&&p.z===0&&p.hurtT<=0){p.vz=520;sfx('jump')}
 if(p.z>0||p.vz>0){p.vz-=1500*dt;p.z+=p.vz*dt;if(p.z<=0){p.z=0;p.vz=0;particles(p.x,p.y,0,'#8a6a4a',5,80)}}
 p.dashCd-=dt;if(G.popup&&(G.popup.life-=dt)<=0)G.popup=null;
 if(p.dashT>0){p.dashT-=dt;p.x+=p.face*650*dt;for(const e of G.enemies)if(!e.dead&&!p.dashHits.includes(e)&&Math.abs(e.x-p.x)<40*e.r&&Math.abs(e.y-p.y)<30){p.dashHits.push(e);damage(e,atk()*1.6,180,p.x);gainProf(1);G.hitstop=.03;G.shake=5}particles(p.x-p.face*20,p.y,30,'#7fe0ff',2,60)}
 if(keys.j)p.jHold+=dt;
 if(keys.j&&pressed.j===undefined){} if(hit('j'))p.bufJ=.2;p.bufJ=(p.bufJ||0)-dt;
 if(p.bufJ>0&&p.atkT<=0.06&&p.hurtT<=0&&p.dashT<=0){
  const fwd=(p.face>0?(keys.arrowright||keys.d):(keys.arrowleft||keys.a));
  if(p.plv>=3&&fwd&&p.dashCd<=0&&p.comboWin<=0&&p.z===0){p.bufJ=0;p.dashT=.25;p.dashCd=.9;p.dashHits=[];p.atkT=.25;sfx('dash');p.combo=1;msg('突刺冲锋！','#7fe0ff')}
  else{const mx=p.plv>=2?4:3;p.combo=p.comboWin>0?(p.combo%mx)+1:1;p.comboWin=.6;p.bufJ=0;p.atkT=p.combo>=3?.38:.24;
  let any;sfx(p.combo===4?'spin':'swing');if(p.combo===4){any=meleeHit(110,atk()*2.2,200,true);p.spinT=.4;G.shake=6}
  else any=meleeHit(p.combo===3?95:75,atk()*(p.combo===3?1.8:1)*(p.z>0?1.3:1),p.combo===3?160:50,false);
  if(any){G.hitstop=p.combo>=3?.08:.04;G.shake=Math.max(G.shake,p.combo>=3?8:3)}}}
 if(!keys.j){if(p.jHold>.6&&p.plv>=4){G.projs.push({wave:1,x:p.x+p.face*40,y:p.y,z:30,vx:p.face*600,life:1.2,hits:[]});msg('剑气波！','#bff0ff');sfx('wave');G.shake=4}p.jHold=0}
 p.spinT=(p.spinT||0)-dt;
 if(hit('l')){if(p.energy>=100){p.energy=0;p.specialT=1.2;const up=p.plv>=5;sfx('special');G.flash=1;G.shake=18;G.hitstop=.15;
   for(const e of G.enemies)if(!e.dead&&e.x>G.camX-20&&e.x<G.camX+W+20){damage(e,(60+atk()*2)*(up?1.5:1),220,p.x);e.vz=400;}
   msg(up?'必杀·天穹剑气！':'必杀·苍蓝剑气！',up?'#ffe070':'#7fd8ff');}else{msg('体力未满','#aaa');sfx('fail')}}
 if(hit('i')){if(p.spells.length){p.sel=(p.sel+1)%p.spells.length;msg('当前魔法：'+SPELLS.find(s=>s.id===p.spells[p.sel]).name,'#c9a0ff')}else msg('尚未学习魔法','#c9a0ff')}
 if(hit('u'))cast();
 // waves
 const wv=G.waves[G.wave];
 if(G.lockX==null&&wv&&p.x>wv.x+W/2-100){G.lockX=wv.x;wv.list.forEach((t,i)=>spawn(t,wv.x+(i%2?W+40+i*30:-60-i*20),rnd(LANE_TOP,LANE_BOT)));msg(G.wave===3?'首领 · 哥布林酋长 出现！':'第 '+(G.wave+1)+' 波','#ffd34a')}
 if(G.lockX!=null&&G.enemies.every(e=>e.dead)){G.lockX=null;G.wave++;if(G.wave>=G.waves.length){G.state='win';sfx('win')}else{G.go=3;sfx('go');if(G.witches.some(w=>w.x>p.x&&w.x<G.waves[G.wave].x))msg('前方有女巫，按E学习魔法','#e0b0ff')}}
 G.go-=dt;
 // camera
 let tx=p.x-W*.4;if(G.lockX!=null)tx=G.lockX;tx=clamp(tx,0,STAGE_END-W);G.camX+=(tx-G.camX)*Math.min(1,dt*5);
 // enemies
 for(const e of G.enemies){
  if(e.dead){e.deadT+=dt;continue}
  e.x+=e.kx*dt;e.kx*=Math.pow(.02,dt);
  if(e.z>0||e.vz>0){e.vz-=1500*dt;e.z+=e.vz*dt;if(e.z<0){e.z=0;e.vz=0}}
  e.hurtT-=dt;if(e.frozen>0){e.frozen-=dt;continue}if(e.hurtT>0)continue;
  e.cd-=dt;const dx=p.x-e.x,dy=p.y-e.y,rng=55+10*e.r;
  if(e.state==='walk'){e.face=Math.sign(dx)||1;
   const tgtX=p.x-Math.sign(dx)*rng;const ax=tgtX-e.x;
   if(Math.abs(ax)>8)e.x+=Math.sign(ax)*e.sp*dt;if(Math.abs(dy)>6)e.y+=Math.sign(dy)*e.sp*.7*dt;if(Math.abs(ax)>8||Math.abs(dy)>6)e.walk+=dt*8;
   if(Math.abs(dx)<rng+15&&Math.abs(dy)<20&&e.cd<=0){e.state='wind';e.t=e.type==='boss'?.6:.45}}
  else if(e.state==='wind'){e.t-=dt;if(e.t<=0){e.state='strike';e.t=.25;
    if(Math.abs(p.x-e.x)<rng+25*e.r&&Math.abs(p.y-e.y)<26+6*e.r&&p.z<40&&p.inv<=0){
     const d=Math.max(1,e.dmg-def());p.hp-=d;p.hurtT=.3;p.inv=.6;p.energy=Math.min(100,p.energy+8);G.shake=6;p.x+=Math.sign(p.x-e.x)*25;
     G.parts.push({num:d,x:p.x,y:p.y,z:70,vz:60,life:.8,vx:0,vy:0,col:'#ff5555'});sfx('hurt');if(p.hp<=0){p.hp=0;G.state='over';sfx('over')}}}}
  else if(e.state==='strike'){e.t-=dt;if(e.t<=0){e.state='walk';e.cd=rnd(1,2.2)/(e.type==='boss'?1.3:1)}}
  e.y=clamp(e.y,LANE_TOP,LANE_BOT);}
 G.enemies=G.enemies.filter(e=>!e.dead||e.deadT<1);
 // projectiles
 for(const f of G.projs){f.x+=f.vx*dt;f.life-=dt;particles(f.x,f.y,f.z,f.wave?'#bff0ff':'#ffb030',1,40);
  for(const e of G.enemies)if(!e.dead&&!f.hits.includes(e)&&Math.abs(e.x-f.x)<30*e.r&&Math.abs(e.y-f.y)<30){f.hits.push(e);damage(e,f.wave?atk()*2:30,120,f.x-f.vx);particles(f.x,f.y,f.z,f.wave?'#7fe0ff':'#ff6a00',12)}}
 G.projs=G.projs.filter(f=>f.life>0);
 // pickups
 for(const k of G.pickups){k.t+=dt;if(k.z>0||k.vz>0){k.vz-=900*dt;k.z+=k.vz*dt;k.x+=k.vx*dt;if(k.z<0){k.z=0;k.vz=-k.vz*.4;k.vx*=.5;if(k.vz<40)k.vz=0}}
  if(k.t>.5&&Math.abs(k.x-p.x)<30&&Math.abs(k.y-p.y)<25){k.got=1;
   if(k.kind==='coin'){p.gold+=1;sfx('coin')}else if(k.kind==='potion'){sfx('potion');p.mp++;msg('魔法瓶 +1'+(p.spells.length?'':'（尚未学习魔法）'),'#6fb0ff')}
   else if(k.kind==='sword'){sfx('equip');p.atkLv++;msg('获得利剑！攻击 +4','#ffd34a')}else{sfx('equip');p.defLv++;msg('获得护甲！防御 +2','#9fd0ff')}}}
 G.pickups=G.pickups.filter(k=>!k.got);
 for(const q of G.parts){q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;if(!q.num){q.vz-=600*dt;if(q.z<0)q.z=0}}
 G.parts=G.parts.filter(q=>q.life>0);G.bolts=G.bolts.filter(b=>(b.life-=dt)>0);
 for(const m of G.msgs)m.life-=dt;G.msgs=G.msgs.filter(m=>m.life>0).slice(-4);
 G.shake*=Math.pow(.001,dt);G.flash=Math.max(0,G.flash-dt*1.5);
}
function cast(){const p=G.p;if(!p.spells.length){msg('尚未学习魔法','#c9a0ff');sfx('fail');return}
 const s=SPELLS.find(s=>s.id===p.spells[p.sel]);if(p.mp<s.mp){msg('魔法瓶不足（需要'+s.mp+'）','#6fb0ff');return}
 if(p.castT>0)return;p.mp-=s.mp;p.castT=.4;sfx(s.id);msg(s.name+'！',s.col);
 if(s.id==='fire')G.projs.push({x:p.x+p.face*30,y:p.y,z:35,vx:p.face*520,life:1.6,hits:[]});
 if(s.id==='frost'){G.parts.push({ring:1,x:p.x,y:p.y,life:.6,vx:0,vy:0,vz:0,z:0});for(const e of G.enemies)if(!e.dead&&Math.hypot(e.x-p.x,(e.y-p.y)*2)<220){damage(e,15,0,p.x);e.frozen=3}G.shake=6}
 if(s.id==='bolt'){const ts=G.enemies.filter(e=>!e.dead&&e.x>G.camX&&e.x<G.camX+W).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x)).slice(0,5);
  for(const e of ts){G.bolts.push({x:e.x,y:e.y,life:.35,seed:Math.random()});damage(e,40,40,p.x)}G.flash=.4;G.shake=10}}
// ---------- drawing ----------
function ol(fill,lw=3){ctx.fillStyle=fill;ctx.fill();ctx.lineWidth=lw;ctx.strokeStyle=OUT;ctx.stroke()}
function ell(x,y,rx,ry){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2)}
function drawBG(){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0b0d24');g.addColorStop(.5,'#1a1840');g.addColorStop(1,'#120f26');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 for(const L of [0,1]){const par=L?0.6:0.3;
  for(const t of trees){if(t.layer!==L)continue;const x=t.x*(L?1:0.8)-G.camX*par;const xx=((x%(STAGE_END))+STAGE_END)%STAGE_END-100;if(xx<-100||xx>W+100)continue;
   ctx.beginPath();ctx.moveTo(xx-t.w/2,-10);ctx.lineTo(xx+t.w/2,-10);ctx.lineTo(xx+t.w*.6,300);ctx.lineTo(xx-t.w*.6,300);ctx.closePath();
   ol(L?'#2c2240':'#1a1a38',L?3:2);ctx.fillStyle=L?'rgba(120,90,170,.15)':'rgba(80,90,160,.1)';ctx.fillRect(xx-t.w*.3,0,t.w*.15,300);
   if(L){ctx.fillStyle='#4a6cd8';ell(xx+t.w*.1,150+t.w,3,6);ctx.fill()}}
  ctx.fillStyle=L?'rgba(10,8,25,.0)':'rgba(10,8,25,.35)';ctx.fillRect(0,0,W,300);}
 // ground
 ctx.fillStyle='#2a3a2c';ctx.fillRect(0,250,W,H-250);
 ctx.beginPath();ctx.moveTo(0,285);for(let x=0;x<=W;x+=40)ctx.lineTo(x,282+Math.sin((x+G.camX)*.01)*6);ctx.lineTo(W,490);for(let x=W;x>=0;x-=40)ctx.lineTo(x,490+Math.sin((x+G.camX)*.013)*7);ctx.closePath();ol('#6b4a3a',4);
 ctx.fillStyle='rgba(150,110,80,.35)';for(let i=0;i<30;i++){const x=((i*173-G.camX)%W+W)%W;ell(x,300+(i*37)%180,30,6);ctx.fill()}
 // tufts back
 for(let x=-((G.camX)%30);x<W;x+=30){grass(x,284,'#3d5a3a',14)}}
function grass(x,y,c,h){ctx.beginPath();ctx.moveTo(x-6,y);ctx.lineTo(x-3,y-h);ctx.lineTo(x,y-2);ctx.lineTo(x+4,y-h*1.1);ctx.lineTo(x+7,y);ctx.closePath();ol(c,2)}
function drawFG(){for(let x=-((G.camX*1.2)%26);x<W;x+=26)grass(x,H+5,'#22331f',30+Math.sin(x)*8);}
function shadow(x,y,r){ctx.fillStyle='rgba(0,0,0,.4)';ell(x,y,r,r*.3);ctx.fill()}
function drawProp(o,sx){const y=o.y;
 if(o.type==='torch'){ctx.beginPath();ctx.rect(sx-5,y-60,10,60);ol('#3a3446');ctx.beginPath();ctx.rect(sx-12,y-68,24,10);ol('#4a4458');
  const f=Math.sin(G.t*15+o.x)*3;const rg=ctx.createRadialGradient(sx,y-80,2,sx,y-80,70);rg.addColorStop(0,'rgba(255,190,80,.5)');rg.addColorStop(1,'rgba(255,150,50,0)');ctx.fillStyle=rg;ctx.fillRect(sx-70,y-150,140,140);
  ctx.beginPath();ctx.moveTo(sx-9,y-68);ctx.quadraticCurveTo(sx-8,y-85,sx+f*.5,y-98+f);ctx.quadraticCurveTo(sx+9,y-85,sx+9,y-68);ol('#ffb030',2);ell(sx,y-76,4,7);ctx.fillStyle='#fff3a0';ctx.fill()}
 if(o.type==='crystal'){ctx.save();ctx.translate(sx,y);ctx.scale(o.s,o.s);ctx.shadowColor='#c04cff';ctx.shadowBlur=15;
  for(const [dx,h,w] of [[-14,40,9],[0,60,12],[14,35,8]]){ctx.beginPath();ctx.moveTo(dx-w,0);ctx.lineTo(dx,-h);ctx.lineTo(dx+w,0);ctx.closePath();ol('#8a2fd0',2.5);ctx.fillStyle='rgba(230,160,255,.6)';ctx.beginPath();ctx.moveTo(dx-2,-4);ctx.lineTo(dx,-h+6);ctx.lineTo(dx+3,-4);ctx.fill()}ctx.restore()}
 if(o.type==='rock'){ctx.beginPath();ctx.moveTo(sx-25*o.s,y);ctx.lineTo(sx-15*o.s,y-28*o.s);ctx.lineTo(sx+12*o.s,y-32*o.s);ctx.lineTo(sx+26*o.s,y);ctx.closePath();ol('#4b4a5a')}}
function drawHero(p,sx,sy){const bob=Math.sin(p.walk)*2,s=p.face;ctx.save();ctx.translate(sx,sy-p.z);if(p.inv>0&&Math.floor(G.t*20)%2)ctx.globalAlpha=.5;ctx.scale(s,1);
 // legs
 const lg=Math.sin(p.walk)*5;ctx.beginPath();ctx.rect(-8+lg,-14,6,14);ol('#2a2440',2);ctx.beginPath();ctx.rect(2-lg,-14,6,14);ol('#2a2440',2);
 // cape & body
 ctx.beginPath();ctx.moveTo(-14,-40+bob);ctx.lineTo(-20,-10);ctx.lineTo(-4,-14);ctx.closePath();ol('#5a2e7a');
 ctx.beginPath();ctx.roundRect(-12,-38+bob,24,26,6);ol('#6a4fa0');ctx.fillStyle='#e8c050';ctx.fillRect(-12,-22+bob,24,4);
 // sword
 const sw=p.atkT>0?(p.combo===2?-0.6:p.combo===3?1.8:1.2)*(p.atkT/.3):-.5;ctx.save();ctx.translate(10,-26+bob);ctx.rotate(-1.2+ (p.atkT>0?2.2-sw:0)+ (p.atkT>0?0:.7));
 ctx.shadowColor='#4fc8ff';ctx.shadowBlur=18;ctx.beginPath();ctx.moveTo(0,-3);ctx.lineTo(58+p.atkLv*4,-1);ctx.lineTo(62+p.atkLv*4,0);ctx.lineTo(58+p.atkLv*4,2);ctx.lineTo(0,3);ctx.closePath();ol('#7fe0ff',2);ctx.shadowBlur=0;ctx.beginPath();ctx.rect(-8,-6,6,12);ol('#c09030',2);ctx.restore();
 if(p.spinT>0){ctx.strokeStyle='rgba(180,240,255,'+p.spinT*2+')';ctx.lineWidth=10;ell(0,-20,90,30);ctx.stroke()}
 if(p.jHold>.6&&p.plv>=4){ctx.fillStyle='rgba(120,220,255,'+(.3+.2*Math.sin(G.t*30))+')';ctx.beginPath();ctx.arc(0,-35,40,0,7);ctx.fill()}
 if(p.atkT>0&&p.z>=0){ctx.strokeStyle='rgba(140,220,255,'+(p.atkT*3)+')';ctx.lineWidth=8;ctx.beginPath();ctx.arc(10,-26,60,-1.2,0.9);ctx.stroke()}
 // head
 ctx.beginPath();ctx.arc(0,-52+bob,15,0,7);ol('#f2d2b0');ctx.fillStyle=OUT;ctx.fillRect(4,-54+bob,3,5);
 // hat
 ell(0,-60+bob,26,7);ol('#f2c230');ctx.beginPath();ctx.moveTo(-12,-60+bob);ctx.quadraticCurveTo(-11,-80+bob,0,-80+bob);ctx.quadraticCurveTo(11,-80+bob,12,-60+bob);ctx.closePath();ol('#f2c230');ctx.fillStyle='#b03a3a';ctx.fillRect(-12,-66+bob,24,4);
 if(p.defLv){ctx.beginPath();ctx.arc(0,-28+bob,10,Math.PI,0);ol('#9ab0c8',2)}
 ctx.restore()}
function drawGoblin(e,sx,sy){const k=e.r;ctx.save();ctx.translate(sx,sy-e.z);ctx.scale(e.face*k,k);
 if(e.dead){ctx.globalAlpha=1-e.deadT;ctx.rotate(-1.3*Math.min(1,e.deadT*4))}
 const body=e.type==='boss'?'#4f8a3a':e.type==='elite'?'#3f7a6a':'#5aa040',bob=Math.sin(e.walk)*2;
 if(e.hurtT>0)ctx.translate(-3,0);
 ctx.beginPath();ctx.rect(-8,-12,6,12);ol('#3a2a20',2);ctx.beginPath();ctx.rect(2,-12,6,12);ol('#3a2a20',2);
 if(e.type==='boss'){ctx.beginPath();ctx.moveTo(-14,-34);ctx.lineTo(-22,-4);ctx.lineTo(6,-8);ctx.closePath();ol('#8a1f2a')}
 ctx.beginPath();ctx.roundRect(-12,-32+bob,24,22,6);ol(e.type==='elite'?'#5a4a6a':'#7a5a3a');
 // weapon
 const ang=e.state==='wind'?-2:e.state==='strike'?.6:-.6;ctx.save();ctx.translate(10,-24+bob);ctx.rotate(ang);ctx.beginPath();ctx.rect(0,-3,30,6);ol('#6a4a2a',2);
 ctx.beginPath();if(e.type==='g'){ctx.arc(32,0,8,0,7)}else{ctx.moveTo(26,-12);ctx.lineTo(42,0);ctx.lineTo(26,12);ctx.closePath()}ol(e.type==='g'?'#7a5030':'#b0b8c8',2);ctx.restore();
 // head
 ctx.beginPath();ctx.arc(0,-44+bob,14,0,7);ol(e.frozen>0?'#9fe0ff':body);
 ctx.beginPath();ctx.moveTo(-10,-48+bob);ctx.lineTo(-26,-56+bob);ctx.lineTo(-12,-40+bob);ol(body,2);ctx.beginPath();ctx.moveTo(10,-48+bob);ctx.lineTo(24,-58+bob);ctx.lineTo(12,-40+bob);ol(body,2);
 ctx.fillStyle=e.state==='wind'?'#ff3030':'#ffe040';ctx.fillRect(3,-48+bob,5,4);
 if(e.type==='boss'){ctx.beginPath();ctx.moveTo(-10,-56);ctx.lineTo(-8,-68);ctx.lineTo(-2,-60);ctx.lineTo(2,-70);ctx.lineTo(6,-60);ctx.lineTo(10,-68);ctx.lineTo(10,-56);ctx.closePath();ol('#f2c230',2)}
 if(e.frozen>0){ctx.fillStyle='rgba(150,220,255,.4)';ctx.fillRect(-16,-60,32,60)}
 ctx.restore();
 if(!e.dead&&e.hp<e.maxhp){const w=40*k;ctx.fillStyle='#000';ctx.fillRect(sx-w/2-1,sy-70*k-e.z-1,w+2,6);ctx.fillStyle='#e04040';ctx.fillRect(sx-w/2,sy-70*k-e.z,w*e.hp/e.maxhp,4)}}
function drawWitch(w,sx){const y=w.y;ctx.save();ctx.translate(sx,y);
 const rg=ctx.createRadialGradient(30,-10,2,30,-10,80);rg.addColorStop(0,'rgba(150,255,120,.45)');rg.addColorStop(1,'rgba(120,60,200,0)');ctx.fillStyle=rg;ctx.fillRect(-60,-100,180,140);
 ell(32,-12,22,16);ol('#2a2430');ell(32,-24,20,5);ol('#7cff6a',2);for(let i=0;i<3;i++){ctx.fillStyle='rgba(180,255,150,.7)';ell(26+i*7,-32-((G.t*30+i*12)%30),3,3);ctx.fill()}
 ctx.beginPath();ctx.moveTo(-16,0);ctx.lineTo(-10,-40);ctx.lineTo(10,-40);ctx.lineTo(16,0);ctx.closePath();ol('#4a2a6a');
 ctx.beginPath();ctx.arc(0,-50,12,0,7);ol('#b8d890');ctx.fillStyle=OUT;ctx.fillRect(-5,-52,3,3);ctx.fillRect(3,-52,3,3);
 ell(0,-58,24,6);ol('#3a1a5a');ctx.beginPath();ctx.moveTo(-12,-58);ctx.lineTo(8,-98+Math.sin(G.t*2)*3);ctx.lineTo(12,-58);ctx.closePath();ol('#3a1a5a');ctx.fillStyle='#c070ff';ctx.fillRect(-11,-64,23,4);
 ctx.restore();
 if(Math.abs(w.x-G.p.x)<80&&Math.abs(w.y-G.p.y)<90){txt('[E] 女巫 · 学习魔法',sx,y-110,14,'#e0b0ff','center')}}
function drawPickup(k,sx){const y=k.y,z=k.z+Math.sin(G.t*4+k.x)*2;shadow(sx,y,8);
 if(k.kind==='coin'){ell(sx,y-6-z,6*Math.abs(Math.cos(G.t*4+k.x))+1,6);ol('#ffd030',2)}
 if(k.kind==='potion'){ctx.save();ctx.shadowColor='#4fa0ff';ctx.shadowBlur=12;ctx.beginPath();ctx.arc(sx,y-10-z,8,0,7);ol('#3a7aff',2);ctx.restore();ctx.beginPath();ctx.rect(sx-3,y-24-z,6,7);ol('#c0a080',2)}
 if(k.kind==='sword'){ctx.save();ctx.translate(sx,y-14-z);ctx.rotate(-.8);ctx.beginPath();ctx.rect(-2,-14,5,24);ol('#cfe8ff',2);ctx.beginPath();ctx.rect(-6,8,13,4);ol('#c09030',2);ctx.restore()}
 if(k.kind==='armor'){ctx.beginPath();ctx.moveTo(sx-10,y-24-z);ctx.lineTo(sx+10,y-24-z);ctx.lineTo(sx+8,y-6-z);ctx.lineTo(sx,y-2-z);ctx.lineTo(sx-8,y-6-z);ctx.closePath();ol('#8aa8c8',2)}}
function txt(s,x,y,sz,c,al='left'){ctx.font='bold '+sz+'px "Microsoft YaHei","PingFang SC","Noto Sans CJK SC",sans-serif';ctx.textAlign=al;ctx.lineWidth=4;ctx.strokeStyle=OUT;ctx.strokeText(s,x,y);ctx.fillStyle=c;ctx.fillText(s,x,y)}
function bar(x,y,w,h,v,c,label){ctx.beginPath();ctx.roundRect(x,y,w,h,4);ol('#1a1626',3);ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x+2,y+2,(w-4)*clamp(v,0,1),h-4,3);ctx.fill();if(label)txt(label,x+w/2,y+h-3,h-4,'#fff','center')}
function drawHUD(){const p=G.p;
 // portrait
 ctx.beginPath();ctx.arc(60,478,38,0,7);ol('#2a2440',4);ctx.save();ctx.translate(60,520);ctx.scale(.9,.9);drawHero({...p,x:0,z:0,inv:0,atkT:0,walk:0,face:1},0,0);ctx.restore();
 bar(102,466,200,20,p.hp/p.maxhp,'#5cd040',p.hp+'/'+p.maxhp);
 bar(102,490,170,13,p.energy/100,p.energy>=100?(G.t*6%2<1?'#7fe0ff':'#3a8aff'):'#3a6ad8','体力 '+Math.floor(p.energy)+'/100');
 if(p.energy>=100)txt('[L] 必杀就绪！',102,460,14,'#7fe0ff');
 // spell icon
 const sp=p.spells.length?SPELLS.find(s=>s.id===p.spells[p.sel]):null;ctx.beginPath();ctx.arc(335,482,24,0,7);ol(sp?'#2a2050':'#222',3);
 if(sp){ctx.save();ctx.shadowColor=sp.col;ctx.shadowBlur=14;ctx.beginPath();ctx.arc(335,482,11,0,7);ol(sp.col,2);ctx.restore();if(p.castT>0){ctx.fillStyle='rgba(0,0,0,.6)';ctx.beginPath();ctx.moveTo(335,482);ctx.arc(335,482,24,-Math.PI/2,-Math.PI/2+Math.PI*2*p.castT/.4);ctx.fill()}
  txt(sp.name+' ('+sp.mp+')',335,524,12,sp.col,'center')}else txt('未学魔法',335,524,12,'#888','center');
 txt('U',318,465,12,'#fff');
 const pl=p.plv,pf=pl>=5?1:(p.prof-PROF[pl-1])/(PROF[pl]-PROF[pl-1]);txt('熟练度 Lv'+pl,385,478,13,'#ffd34a');bar(385,484,110,12,pf,'#e8a020',pl>=5?'MAX':(p.prof+'/'+PROF[pl]));
 txt('攻击 '+atk()+(p.atkLv?' (剑+'+p.atkLv+')':''),102,526,13,'#ffd34a');txt('防御 '+def()+(p.defLv?' (甲+'+p.defLv+')':''),220,526,13,'#9fd0ff');
 // right counters
 const items=[['#ffd030','金币',p.gold],['#3a7aff','魔法瓶',p.mp],['#c070ff','经验',p.exp]];
 items.forEach((it,i)=>{const x=730+i*75;ctx.beginPath();ctx.arc(x,490,11,0,7);ol(it[0],2);txt(String(it[2]),x,470,16,'#fff','center');txt(it[1],x,522,12,'#ccc','center')});
 txt(AU.muted?'静音 [M]':'音效开 [M]',20,30,14,AU.muted?'#f88':'#9a8fc0');txt('波次 '+Math.min(G.wave+1,4)+'/4',W-20,30,16,'#ffd34a','right');
 if(G.go>0&&Math.floor(G.t*3)%2)txt('GO →',W-120,200,44,'#ffd34a','center');
 G.msgs.forEach((m,i)=>{ctx.globalAlpha=Math.min(1,m.life*2);txt(m.t,W/2,110+i*28,20,m.c,'center');ctx.globalAlpha=1});
 if(!document.body.classList.contains('touch'))txt('移动:方向键/WASD  J攻击(长按蓄力)  K跳跃  L必杀  U施法  I切换魔法  E交谈  M静音',W/2,22,13,'#9a8fc0','center');}
function drawWitchMenu(){const p=G.p;ctx.fillStyle='rgba(10,5,25,.75)';ctx.fillRect(0,0,W,H);
 ctx.beginPath();ctx.roundRect(230,100,500,320,16);ol('#2a1a40',5);txt('女巫的魔法课',480,145,28,'#e0b0ff','center');txt('当前经验：'+p.exp,480,175,16,'#c9a0ff','center');
 SPELLS.forEach((s,i)=>{const y=215+i*60,learned=p.spells.includes(s.id),ok=p.exp>=s.exp;ctx.globalAlpha=learned||ok?1:.4;
  ctx.beginPath();ctx.arc(270,y,16,0,7);ol(s.col,2);txt('['+(i+1)+'] '+s.name,300,y-2,20,learned?'#8f8':ok?'#fff':'#999');
  txt(s.desc+'  ·  消耗魔法瓶 '+s.mp,300,y+20,13,'#bbb');txt(learned?'已学会':s.exp+' 经验',700,y+4,16,learned?'#8f8':ok?'#ffd34a':'#777','right');ctx.globalAlpha=1});
 txt('按数字键学习，E 关闭',480,400,14,'#aaa','center')}
function draw(){ctx.save();if(G.shake>.5)ctx.translate(rnd(-G.shake,G.shake),rnd(-G.shake,G.shake));
 drawBG();const cx=G.camX;
 const list=[];for(const o of props)list.push({y:o.y,f:()=>drawProp(o,o.x-cx)});
 for(const w of G.witches)list.push({y:w.y,f:()=>drawWitch(w,w.x-cx)});
 for(const k of G.pickups)list.push({y:k.y,f:()=>drawPickup(k,k.x-cx)});
 for(const e of G.enemies)list.push({y:e.y,f:()=>{shadow(e.x-cx,e.y,16*e.r);drawGoblin(e,e.x-cx,e.y)}});
 list.push({y:G.p.y,f:()=>{shadow(G.p.x-cx,G.p.y,16-Math.min(8,G.p.z/15));drawHero(G.p,G.p.x-cx,G.p.y)}});
 for(const f of G.projs)list.push({y:f.y,f:()=>{shadow(f.x-cx,f.y,10);ctx.save();if(f.wave){ctx.shadowColor='#7fe0ff';ctx.shadowBlur=24;ctx.beginPath();const X=f.x-cx,Y=f.y-f.z,d=Math.sign(f.vx);ctx.moveTo(X-d*10,Y-40);ctx.quadraticCurveTo(X+d*30,Y,X-d*10,Y+30);ctx.quadraticCurveTo(X+d*8,Y,X-d*10,Y-40);ol('#bff0ff',2)}else{ctx.shadowColor='#ff8000';ctx.shadowBlur=20;ell(f.x-cx,f.y-f.z,14,10);ol('#ff9a20',2)}ctx.restore()}});
 list.sort((a,b)=>a.y-b.y).forEach(o=>o.f());
 for(const q of G.parts){const x=q.x-cx,y=q.y-q.z;
  if(q.num!=null){txt(String(q.num),x,y,18,q.col||'#fff','center')}
  else if(q.ring){ctx.strokeStyle='rgba(150,230,255,'+q.life*1.5+')';ctx.lineWidth=8;ell(x,q.y,220*(1-q.life/.6)+20,110*(1-q.life/.6)+10);ctx.stroke()}
  else{ctx.fillStyle=q.col;ctx.fillRect(x-q.s/2,y-q.s/2,q.s,q.s)}}
 for(const b of G.bolts){const x=b.x-cx;ctx.strokeStyle='#fff8a0';ctx.lineWidth=5;ctx.shadowColor='#ffff60';ctx.shadowBlur=20;ctx.beginPath();ctx.moveTo(x,0);let yy=0;while(yy<b.y-40){yy+=30;ctx.lineTo(x+rnd(-14,14),yy)}ctx.stroke();ctx.shadowBlur=0}
 if(G.p.specialT>0){const a=G.p.specialT/1.2,up=G.p.plv>=5;ctx.fillStyle=(up?'rgba(255,200,60,':'rgba(80,180,255,')+a*.3+')';ctx.fillRect(0,0,W,H);ctx.strokeStyle=(up?'rgba(255,240,160,':'rgba(180,240,255,')+a+')';ctx.lineWidth=14;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(0,260+i*50+(1-a)*80);ctx.lineTo(W,240+i*50-(1-a)*80);ctx.stroke()}txt(up?'必杀·天穹剑气':'必杀·苍蓝剑气',W/2,250,48,up?'#ffe070':'#bff0ff','center');if(up)for(let i=0;i<12;i++){ctx.fillStyle='rgba(255,230,120,'+a+')';ctx.fillRect(rnd(0,W),rnd(0,H),4,rnd(20,60))}}
 drawFG();ctx.restore();
 if(G.flash>0){ctx.fillStyle='rgba(255,255,255,'+G.flash*.6+')';ctx.fillRect(0,0,W,H)}
 drawHUD();if(G.popup){const q=G.popup,a=Math.min(1,q.life*2),sc=1+Math.max(0,q.life-2.7)*2;ctx.save();ctx.globalAlpha=a;ctx.translate(W/2,170);ctx.scale(sc,sc);ctx.beginPath();ctx.roundRect(-230,-50,460,110,14);ol('rgba(40,25,10,.88)',4);txt(q.title,0,-12,28,'#ffd34a','center');txt(q.text,0,22,22,'#fff','center');txt(q.sub,0,46,13,'#ccc','center');ctx.restore()}
 if(G.witchMenu)drawWitchMenu();
 if(G.state!=='play'){ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(0,0,W,H);txt(G.state==='win'?'胜 利 ！':'游 戏 结 束',W/2,230,60,G.state==='win'?'#ffd34a':'#ff5050','center');
  txt('金币 '+G.p.gold+'   经验 '+G.p.exp,W/2,290,22,'#fff','center');txt('按 R 或 回车 重新开始',W/2,340,20,'#ccc','center')}}
let last=performance.now();function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;update(dt);draw();requestAnimationFrame(loop)}
reset();window.__G=()=>G;requestAnimationFrame(loop);
