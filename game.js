'use strict';
// 暗夜征途·青衣剑客 —— 2.5D 横版清版动作（Canvas）
const cv=document.getElementById('c'),ctx=cv.getContext('2d');const W=960,H=540;
const LANE_TOP=300,LANE_BOT=470,OUT='#15101f',HS=0.85;
const keys={},pressed={};
addEventListener('keydown',e=>{const k=e.key.toLowerCase();auInit();if(k==='m'&&!e.repeat)auMute();
 if((k==='p'||k==='escape')&&!e.repeat&&canHelp(k)){toggleHelp();e.preventDefault();return}if(!keys[k])pressed[k]=true;keys[k]=true;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
const hit=k=>{if(pressed[k]){pressed[k]=false;return true}return false};
const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),pick=a=>a[Math.floor(Math.random()*a.length)];
// ---------- 资源 ----------
const ASSET_V='20261028';const IMG={};function loadImg(k,src){const i=new Image();i.src=src+(/^assets\/[a-z_]+_atlas\.png$/.test(src)?'?v='+ASSET_V:'');IMG[k]=i;return i}
loadImg('hero',HERO_ATLAS.image);loadImg('gob',GOBLIN_ATLAS.image);loadImg('big',BIGGOBLIN_ATLAS.image);loadImg('bat',BAT_ATLAS.image);loadImg('vamp',VAMPIRE_ATLAS.image);loadImg('fx',FX_ATLAS.image);loadImg('snow',SNOWMAN_ATLAS.image);loadImg('snowboss',SNOWBOSS_ATLAS.image);if(window.PROPS_ATLAS)loadImg('props',PROPS_ATLAS.image);
STAGES.forEach(s=>{if(s.far)loadImg('far'+s.id,s.far)});
const ready=k=>IMG[k]&&IMG[k].complete&&IMG[k].naturalWidth>0;
function drawHeroFrame(name,x,y,face,scale=HS,alpha=1,qx=1,qy=1,rot=0){const f=HERO_ATLAS.frames[name];if(!f||!ready('hero'))return;
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.globalAlpha*=alpha;ctx.translate(x,y);if(rot)ctx.rotate(rot*face);const fs=f.s||1;ctx.scale(face*scale*qx*fs,scale*qy*fs);ctx.drawImage(IMG.hero,f.x,f.y,f.w,f.h,-f.ax,-f.ay,f.w,f.h);ctx.restore()}
function fx(name,x,y,sc=1,alpha=1,flip=1,rot=0,anchor='c'){const f=FX_ATLAS.frames[name];if(!f||!ready('fx'))return;
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=clamp(alpha,0,1);ctx.translate(x,y);if(rot)ctx.rotate(rot);ctx.scale(flip*sc,sc);
 const oy=anchor==='b'?-f.h:-f.h/2;ctx.drawImage(IMG.fx,f.x,f.y,f.w,f.h,-f.w/2,oy,f.w,f.h);ctx.restore()}
function heroFx(name,x,y,sc,alpha,rot=0){const f=HERO_ATLAS.frames[name];if(!f||!ready('hero'))return;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.rotate(rot);ctx.scale(sc,sc);ctx.drawImage(IMG.hero,f.x,f.y,f.w,f.h,-f.ax,-f.ay,f.w,f.h);ctx.restore()}
// ---------- 敌人数据 ----------
// ai: melee 近战 / fast 快速 / shield 正面盾 / ranged 远程 / golem 重甲
const EN={
 goblin:{name:'哥布林刀盾兵',shape:'gob',ai:'melee',hp:30,dmg:6,sp:70,exp:10,r:1,col:'#7a8a3a',block:.3},
 goblin_spear:{name:'哥布林长矛兵',shape:'gob',ai:'melee',hp:32,dmg:8,sp:66,exp:12,r:1,col:'#7a8a3a',reach:42,gear:'spear'},
 goblin_archer:{name:'哥布林弓手',shape:'gob',ai:'ranged',hp:26,dmg:8,sp:64,exp:14,r:1,col:'#7a8a3a',gear:'bow',shot:'arrow'},
 goblin_jumper:{name:'哥布林跳斩手',shape:'gob',ai:'jumper',hp:34,dmg:10,sp:80,exp:14,r:1,col:'#7a8a3a'},
 goblin_captain:{name:'哥布林队长',shape:'big',ai:'brute',hp:120,dmg:11,sp:55,exp:40,r:1.3,sc:.72,col:'#6a7a3a',elite:1},
 goblin_lt:{name:'大哥布林副将',shape:'big',ai:'brute',hp:280,dmg:16,sp:52,exp:70,r:1.5,sc:.85,col:'#6a7a3a',elite:1},
 yeti_pup:{name:'小雪人',shape:'snow',ai:'fast',hp:26,dmg:7,sp:150,exp:12,r:.72,col:'#f4f8ff',face:'#6a9ae0'},
 yeti:{name:'木棒雪人',shape:'snow',ai:'brute',hp:58,dmg:10,sp:62,exp:16,r:1,col:'#eef4fc',face:'#5a8ad8'},
 yeti_thrower:{name:'雪球雪人',shape:'snow',ai:'ranged',hp:40,dmg:10,sp:58,exp:18,r:.92,col:'#f0f6ff',face:'#4a7ac8',shot:'snowball'},
 yeti_big:{name:'冰甲雪人',shape:'snow',tintF:'sepia(.45) hue-rotate(170deg) saturate(2.2) brightness(.97)',ai:'golem',hp:300,dmg:20,sp:40,exp:70,r:1.6,col:'#e4eefa',face:'#3a6ac0',elite:1,horns:1},
 lava_imp:{name:'熔岩小魔',shape:'imp',ai:'fast',hp:24,dmg:7,sp:165,exp:12,r:.85,col:'#d0401a',explode:1},
 flame_warrior:{name:'火焰战士',shape:'warrior',ai:'shield',hp:60,dmg:11,sp:55,exp:18,r:1.15,col:'#8a1a14',horn:'#2a1a10',weapon:'#ff8a20',flame:1},
 flame_caster:{name:'焰灵术士',shape:'caster',ai:'ranged',hp:34,dmg:10,sp:62,exp:18,r:1,col:'#ff9a40',robe:'#5a140c',orb:'#ffb030',shot:'fire'},
 rock_golem:{name:'岩甲巨像',shape:'golem',ai:'golem',hp:260,dmg:20,sp:34,exp:70,r:1.9,col:'#3a3030',lava:1,elite:1},
 bat:{name:'吸血蝙蝠',shape:'bat',ai:'flyer',hp:30,dmg:9,sp:120,exp:18,r:1,sc:.62,col:'#5a1a24',fly:1,drain:1,resist:{thunder:1.5,fire:1.3}},
 giant_bat:{name:'巨蝠',shape:'bat',ai:'flyer',hp:200,dmg:16,sp:100,exp:80,r:1.6,sc:1.05,col:'#7a1a2a',fly:1,drain:1,elite:1,resist:{thunder:1.5,fire:1.3}},
 goblin_merc:{name:'哥布林佣兵',shape:'gob',ai:'melee',hp:70,dmg:14,sp:80,exp:22,r:1.05,sc:1.08,col:'#7a8a3a',block:.4,tint:'rgba(120,0,30,.25)'},
};
// ---------- 首领 ----------
const BOSSES={
 goblin_chief:{name:'哥布林酋长',shape:'big',hp:900,dmg:16,sp:55,exp:150,r:1.9,sc:1.12,col:'#4f8a3a',
  phases:[{at:1,pats:['combo','charge'],cd:1.9},{at:.5,pats:['combo','smash','summon'],summon:'goblin',cd:1.5,msg:'酋长怒吼，召唤援军！'}]},
 great_yeti:{name:'大雪人',shape:'snowboss',hp:2300,dmg:18,sp:60,exp:260,r:2.3,col:'#f2f7ff',face:'#3a6ac8',horns:1,crystals:1,
  phases:[{at:1,pats:['hammer','snowballs','slam','iceSummon','frostwave'],cd:1.6},{at:.6,pats:['snowballs','summon','hammer','iceSummon','slam','frostwave'],summon:'yeti_pup',cd:1.35,msg:'大雪人举锤怒吼，小雪人蜂拥而来！'},{at:.25,pats:['blizzard','hammer','slam','iceSummon','frostwave','roll'],cd:1.05,enrage:1,msg:'暴风雪降临！冰石如雨！'}]},
 flame_king:{name:'焰魔王·赤烎',shape:'warrior',hp:2400,dmg:22,sp:60,exp:400,r:2.4,col:'#7a0a08',horn:'#1a0a08',weapon:'#ff6a10',flame:1,king:1,
  phases:[{at:1,pats:['sweep','fireWave','sweep'],cd:1.6},{at:.6,pats:['geysers','summon','sweep','fireWave'],summon:'lava_imp',cd:1.35,msg:'赤烎召唤熔岩喷泉！'},
   {at:.25,pats:['meteors','fireWave','sweep','geysers'],cd:1.0,enrage:1,shrink:1,msg:'火山爆发！熔岩吞噬战场边缘！'}],
  drop:{equip:'flame_sword',exp:300,msg:'获得【烈炎剑】！火系秘典：经验 +300'}},
 goblin_king:{name:'哥布林大王',shape:'big',hp:3200,dmg:26,sp:58,exp:550,r:2.3,sc:1.45,col:'#4f6a2a',
  phases:[{at:1,pats:['combo','smash','combo'],cd:1.5},{at:.6,pats:['leap','banner','combo','smash'],summon:'goblin_spear',cd:1.3,msg:'大王插下战旗，哥布林士气大振！'},
   {at:.25,pats:['volley','leap','smash','combo'],cd:.95,enrage:1,msg:'大王暴怒！树林中箭雨齐发！'}],
  drop:{equip:'armor',exp:250,msg:'大王的战利品：经验 +250'}},
 goblin_king_shade:{name:'哥布林大王·残影',shape:'big',hp:2200,dmg:26,sp:62,exp:400,r:2.1,sc:1.3,col:'#4f6a2a',mini:1,tint:'rgba(140,0,40,.35)',
  phases:[{at:1,pats:['combo','smash','leap'],cd:1.4},{at:.5,pats:['leap','volley','smash'],cd:1.1,enrage:1,msg:'残影狂暴！'}]},
 vampire_count:{name:'吸血伯爵',shape:'vamp',hp:5200,dmg:30,sp:85,exp:1000,r:1.8,sc:1.0,col:'#7a0a14',resist:{thunder:1.3,fire:1.3},
  phases:[{at:1,pats:['rapier','lunge','batTeleport','rapier'],cd:1.3},
   {at:.6,pats:['bloodPillars','bloodOrbs','rapier','lunge'],cd:1.15,lifesteal:1,msg:'伯爵释放血魔法！命中会吸血回复！'},
   {at:.25,pats:['batSwarm','bloodBurst','bloodPillars','lunge','batTeleport'],cd:.9,lifesteal:1,enrage:1,bloodmoon:1,msg:'血月升起！'}]},
};
// ---------- 魔法树 ----------
const SCHOOLS=[{id:'fire',name:'火系',col:'#ff7a1a',icon:'fire_orb'},{id:'ice',name:'冰系',col:'#7fe3ff',icon:'ice_orb'},{id:'thunder',name:'雷系',col:'#b08cff',icon:'thunder_orb'}];
const SPELLS=[
 {id:'f1',s:'fire',name:'火球术',exp:30,mp:1,desc:'直线火球，伤害30'},
 {id:'f2',s:'fire',name:'连续火球',exp:60,mp:2,desc:'连发3枚火球'},
 {id:'f3',s:'fire',name:'火墙',exp:100,mp:2,desc:'前方火墙持续灼烧3秒'},
 {id:'f4',s:'fire',name:'爆裂火球',exp:150,mp:3,desc:'命中爆炸，范围伤害70'},
 {id:'f5',s:'fire',name:'火焰旋涡',exp:220,mp:3,desc:'身周旋涡吸附并灼烧'},
 {id:'f6',s:'fire',name:'烈焰冲击',exp:300,mp:4,desc:'贯穿全屏火焰冲击120'},
 {id:'i1',s:'ice',name:'冰锥连射',exp:30,mp:1,desc:'扇形冰锥，减速'},
 {id:'i2',s:'ice',name:'冰霜领域',exp:70,mp:2,desc:'冻结周围敌人3秒'},
 {id:'i3',s:'ice',name:'冰爆',exp:130,mp:3,desc:'最近敌人处冰爆，冻结'},
 {id:'i4',s:'ice',name:'寒冰冲击',exp:200,mp:3,desc:'贯穿冰枪，伤害80并冻结'},
 {id:'i5',s:'ice',name:'冰龙术',exp:320,mp:5,desc:'冰龙横扫全屏，伤害150'},
 {id:'t1',s:'thunder',name:'连锁闪电',exp:30,mp:1,desc:'闪电弹跳4个敌人'},
 {id:'t2',s:'thunder',name:'雷电冲刺',exp:80,mp:2,desc:'化雷突进，无敌穿刺'},
 {id:'t3',s:'thunder',name:'电刃斩',exp:140,mp:2,desc:'雷刃剑气贯穿，麻痹'},
 {id:'t4',s:'thunder',name:'雷暴领域',exp:210,mp:3,desc:'4秒内持续落雷'},
 {id:'t5',s:'thunder',name:'天雷降临',exp:320,mp:5,desc:'全屏天雷，伤害160'}];
const SP=id=>SPELLS.find(s=>s.id===id);
const PROF=[0,30,120,300,600];
const MOVES={2:['旋风斩','连击第5击变为360°旋转范围斩'],3:['突刺冲锋','按住方向前进 + J：高速突刺贯穿敌人'],4:['剑气波','长按J蓄力后松开：发射剑气波'],5:['终结技强化','万剑归宗伤害+50%，金色剑雨']};
// ---------- 存档 ----------
const SAVE_KEY='qingyi_brawler_save_v2';
function defProfile(){return {unlocked:1,cleared:[],best:{},gold:0,exp:0,mp:0,atkLv:0,defLv:0,prof:0,plv:1,spells:[],sel:0,flameSword:0,vol:.8}}
function loadSave(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));if(s&&s.unlocked)return Object.assign(defProfile(),s)}catch(e){}return defProfile()}
let SAVE_STR=null;
function writeSave(){try{const j=JSON.stringify(PROFILE);localStorage.setItem(SAVE_KEY,j);SAVE_STR=j;if(localStorage.getItem(SAVE_KEY)!==j)localStorage.setItem(SAVE_KEY,j)}catch(e){}}
// 外部改动（刷新/其他标签/控制台）后与 localStorage 对齐：存档字符串变了就重新载入
function syncSave(){try{const j=localStorage.getItem(SAVE_KEY);if(j&&j!==SAVE_STR){SAVE_STR=j;PROFILE=loadSave();if(PROFILE.vol!=null)auSetVol(PROFILE.vol);SEL=defaultSel()}}catch(e){}}
function defaultSel(){const u=Math.max(1,Math.min(5,PROFILE.unlocked|0));const l=PROFILE.lastSel;return l!=null&&l>=0&&l<u?l:u-1}
let PROFILE=loadSave();try{SAVE_STR=localStorage.getItem(SAVE_KEY)}catch(e){}auSetVol(PROFILE.vol==null?.8:PROFILE.vol);
// ---------- 全局状态 ----------
let G=null,MODE='select',SEL=defaultSel(),RES=null,CREDY=0;const RECTS=[];
let trees=[],props=[];
function maxHpFor(prof){return 97+12*(prof.cleared||[]).length}
function startStage(idx){
 const S=STAGES[idx],B=buildStage(S);const P=PROFILE;const ng=P.ngplus?1.5:1;
 G={S,idx,B,t:0,time:0,camX:0,lockX:null,shake:0,hitstop:0,flash:0,msgs:[],parts:[],pickups:[],pp:[],ep:[],hz:[],zones:[],swords:[],bolts:[],enemies:[],
  wave:0,go:0,menu:null,popup:null,shrink:0,shrinkT:0,bloodmoon:0,boss:null,kills:0,goldStart:P.gold,expStart:P.exp,diff:S.diff*ng,rockT:3,ashT:20,ash:0,lightT:8,amb:[],cleared:0,clearT:0,
  p:{x:150,y:390,z:0,vz:0,face:1,hp:maxHpFor(P),maxhp:maxHpFor(P),energy:0,gold:P.gold,exp:P.exp,mp:P.mp,atkLv:P.atkLv,defLv:P.defLv,flameSword:P.flameSword,
   prof:P.prof,plv:P.plv,spells:[...P.spells],sel:Math.min(P.sel||0,Math.max(0,P.spells.length-1)),combo:0,atkT:0,atkDur:.3,comboWin:0,hurtT:0,inv:0,specialT:0,castT:0,castAnim:'charge',walk:0,
   dashT:0,dashDur:.36,dashCd:0,dashHits:[],jHold:0,spinT:0,spinDur:.46,bufJ:0,hzT:0,dead:0,tdash:0,jt:0,landT:0}};
 G.hurtFlash=0;
 genDecor();MODE='play';msg(S.name+(S.placeholder?'（占位主题）':''),'#ffd34a');
}
function genDecor(){trees=[];props=[];const S=G.S,end=G.B.end;
 for(let i=0;i<end/100;i++)trees.push({x:i*110+rnd(-30,30),w:rnd(30,70),layer:Math.random()<.5?0:1,h:rnd(.8,1)});
 const D=S.decor;const sets={forest:[['crystal',520,'back'],['rock',260,'front']],snow:[['pine',300,'back'],['icerock',260,'front']],
  volcano:[['pillar',420,'back'],['chainpost',320,'front'],['banner',640,'back']],valley:[['mossrock',340,'back']],
  castle:[['gargoyle',760,'back'],['banner',560,'back']]}[D]||[];
 for(const [type,gap,where] of sets)for(let x=rnd(100,300);x<end;x+=rnd(gap*.8,gap*1.3)){
  const y=where==='back'?rnd(268,292):where==='edge'?(Math.random()<.5?290:488):rnd(484,520);props.push({type,x,y,s:rnd(.7,1.25)})}
 // 立绘道具（ref/props_sheet.png）：中景灯具 + 灌木/草，走道下沿零星草丛（参与深度排序），近景层见 drawForeground
 const PS=PROPSET[D];if(PS&&window.PROPS_ATLAS){const sp=PS.sparse?2.2:1,fl=()=>Math.random()<.5?-1:1;
  for(let x=rnd(160,340);x<end;x+=rnd(360,500))props.push({type:'spr',k:pick(PS.lamps),x,y:rnd(280,293),s:rnd(.8,.95),lamp:1,fl:rnd(0,9),flip:fl()});
  for(let x=rnd(40,160);x<end;x+=rnd(120,210)*sp)props.push({type:'spr',k:pick(PS.mid),x,y:rnd(284,299),s:rnd(.55,.85),flip:fl()});
  for(let x=rnd(200,500);x<end;x+=rnd(380,620)*sp)props.push({type:'spr',k:pick(PS.edge),x,y:rnd(474,484),s:rnd(.42,.55),flip:fl(),fade:1})}
 props.sort((a,b)=>a.y-b.y);
 // 关卡危险：熔岩裂缝等（周期性）
 const hz=S.hazards||{};
 if(hz.cracks){G.B.waves.forEach((w,i)=>{if(w.boss)return;for(let k=0;k<hz.cracks.per;k++){const per=hz.cracks.idle+hz.cracks.warn+hz.cracks.act;
  G.hz.push({k:hz.cracks.kind||'crack',x:w.x+rnd(120,W-120),y:rnd(LANE_TOP+15,LANE_BOT-15),rx:rnd(50,80),ry:14,cyc:{per,warn:hz.cracks.warn,act:hz.cracks.act,ofs:rnd(0,per)},dmg:hz.cracks.dmg,t:0,stage:1})}})}
}
function laneAt(x){let top=LANE_TOP,bot=LANE_BOT;for(const s of G.B.segs)if(x>s.x0&&x<s.x1&&s.type==='bridge'){top=s.top;bot=s.bot}
 if(G.shrink>0){top+=G.shrink;bot-=G.shrink}return [top,bot]}
function segAt(x,type){return G.B.segs.find(s=>x>s.x0&&x<s.x1&&s.type===type)}
function atk(){const p=G.p;return 10+p.atkLv*4+(p.flameSword?8:0)}function def(){return G.p.defLv*2}
// 消息队列：同屏最多 3 条，重复文字只刷新，不重叠；其余排队
function msg(t,c='#fff'){if(!G)return;const a=G.msgs.find(m=>m.t===t);if(a){a.life=Math.max(a.life,2.2);return}if((G.msgQ||(G.msgQ=[])).some(m=>m.t===t))return;if(G.msgs.length<3)G.msgs.push({t,c,life:2.2,a:0});else G.msgQ.push({t,c,life:2.2,a:0})}
function particles(x,y,z,col,n,sp=200){for(let i=0;i<n;i++)G.parts.push({x,y,z,vx:rnd(-sp,sp),vz:rnd(50,sp*1.5),vy:rnd(-30,30),life:rnd(.3,.7),col,s:rnd(2,5)})}
function stackZ(x,y,z){let k=0;for(const q of G.parts)if((q.num!=null||q.txt)&&q.life>.35&&Math.abs(q.x-x)<44&&Math.abs(q.y-y)<40)k++;return {x:x+(k%2?14:-6)*Math.min(k,1),z:z+Math.min(k,4)*20,k}}
function numPop(x,y,z,v,col){const s=stackZ(x,y,z);if(s.k>=5)return;G.parts.push({num:Math.round(v),x:s.x,y,z:s.z,vz:60,life:.8,vx:0,vy:0,col})}
// ---------- 敌人 ----------
function spawn(type,x,y,opts={}){
 if(type.startsWith('mini:'))return spawnBoss(type.slice(5),x,y,true);
 const d=EN[type];const df=G.diff;
 const e={type,def:d,x,y,z:d.fly?70:0,vz:0,hp:d.hp*df*(d.elite?1.5:1)*(G.S.hpMul||1),maxhp:d.hp*df*(d.elite?1.5:1)*(G.S.hpMul||1),dmg:d.dmg*(1+.6*(df-1))*earlyDmgMul(),sp:d.sp*(1+.1*(df-1)),r:d.r,sc:d.sc||1,exp:Math.round(d.exp*(1+.5*(G.idx))),
  face:-1,state:'walk',t:0,at:rnd(0,1),hurtT:0,frozen:0,stun:0,slow:0,kx:0,cd:rnd(.6,1.6),dead:0,deadT:0,cool:0,hoverZ:rnd(60,90),ofs:rnd(-1,1),...opts};
 G.enemies.push(e);return e}
function spawnBoss(id,x,y,mini=false){const d=BOSSES[id];const df=G.diff/STAGES[G.idx].diff*(1+.15*(G.diff-1));
 const hm=G.S.hpMul||1;const e={type:id,def:d,boss:1,mini,x,y,z:0,vz:0,hp:d.hp*df*hm,maxhp:d.hp*df*hm,dmg:d.dmg*(G.diff>STAGES[G.idx].diff?1.3:1),sp:d.sp,r:d.r,sc:d.sc||1,exp:d.exp,face:-1,state:'walk',t:0,at:0,hurtT:0,frozen:0,stun:0,slow:0,kx:0,cd:1.5,dead:0,deadT:0,phase:0,pat:null,patT:0,inv:0,hidden:0};
 G.enemies.push(e);if(!mini)G.boss=e;else G.mini=e;msg((mini?'强敌 · ':'首领 · ')+d.name+' 出现！','#ff6060');sfx('roar');G.shake=10;return e}
function earlyDmgMul(){return G.idx===0&&!PROFILE.ngplus?.6+.4*Math.min(1,G.wave/8):1}
// 近战攻击名额：同时只允许 2–3 个近战敌人进攻，其余在外圈游走等待
function maxAttackers(){return G.idx===0?2:3}
function attackers(){let n=0;for(const o of G.enemies)if(o.tok&&!o.dead)n++;return n}
function tryTok(e){if(e.tok)return true;if(e.tokCd>0)return false;if(attackers()<maxAttackers()){e.tok=1;e.tokT=0;return true}return false}
function dropTok(e,cd){if(e.tok){e.tok=0;e.tokCd=cd==null?rnd(.5,1.1):cd}}
function resistOf(e,elem){const r=(e.def.resist)||(G.S.resist)||{};return elem&&r[elem]!=null?r[elem]:1}
// 首领追赶系数：攻击力低于该关预期水平时（如跳关/新存档），对首领伤害按差距放大（最多 ×5），正常成长的英雄不受影响
const BOSS_EXP_ATK=[10,26,42,62,80];
function bossCatchUp(){const a=atk(),ea=BOSS_EXP_ATK[G.idx]||10;return a>=ea?1:Math.min(5,Math.pow(ea/a,.85))}
function damage(e,d,kb,fromX,elem,opts={}){if(e.dead||e.inv>0||e.hidden)return 0;
 let m=resistOf(e,elem);
 const front=Math.sign(fromX-e.x)===Math.sign(e.face)&&!elem;
 if(opts.melee&&front&&!e.stun&&!e.frozen){
  if(e.def.ai==='shield'){m*=.15;if(Math.random()<.5)numText(e,'格挡','#ccc');sfx('block')}
  else if(e.def.block&&Math.random()<e.def.block){m*=.2;numText(e,'格挡','#ccc');sfx('block')}}
 if(e.def.ai==='golem')m*=e.cool>0?1.6:.4;
 if(opts.ult&&(e.def.shape==='bat'||e.def.shape==='vamp'))m*=1.5;
 if(e.boss)m*=bossCatchUp();m*=DBG_ATK;
 const dd=d*m;e.hp-=dd;e.hurtT=e.boss?.08:.25;e.kx=(e.x<fromX?-1:1)*kb*(e.boss?.15:1);
 particles(e.x,e.y,40*e.r+e.z,elem==='fire'?'#ff8a30':elem==='ice'?'#bff0ff':elem==='thunder'?'#d0b0ff':'#ffe080',8);numPop(e.x,e.y,70*e.r+e.z,dd,m>1.2?'#ffd34a':m<.5?'#999':'#fff');
 G.p.energy=Math.min(100,G.p.energy+3);sfx('hit');
 if(e.hp<=0)kill(e);return dd}
function numText(e,t,c){if(G.parts.some(q=>q.txt===t&&q.life>.3&&Math.abs(q.x-e.x)<60&&Math.abs(q.y-e.y)<40))return;const s=stackZ(e.x,e.y,80*e.r);G.parts.push({txt:t,x:s.x,y:e.y,z:s.z,vz:40,life:.6,vx:0,vy:0,col:c})}
function kill(e){e.dead=1;e.deadT=0;sfx('death');const p=G.p;p.exp+=e.exp;G.expGain=(G.expGain||0)+e.exp;G.kills++;particles(e.x,e.y,30+e.z,e.def.col||'#7bd34a',20,260);msg('+'+e.exp+' 经验','#c9a0ff');
 if(e.def.explode){G.hz.push({k:'puddle',x:e.x,y:e.y,rx:44,ry:14,t:0,warn:0,act:3,dmg:6*G.diff});particles(e.x,e.y,10,'#ff7a1a',25,240);sfx('explode')}
 const n=e.boss?24:e.def.elite?8:Math.floor(rnd(2,5));
 for(let i=0;i<n;i++)G.pickups.push({kind:'coin',x:e.x,y:clamp(e.y+rnd(-20,20),LANE_TOP,LANE_BOT),z:20+e.z,vz:rnd(150,300),vx:rnd(-120,120),t:0});
 if(e.boss||e.def.elite||Math.random()<.3)G.pickups.push({kind:'potion',x:e.x,y:e.y,z:20,vz:250,vx:rnd(-60,60),t:0});
 if(e.def.elite||Math.random()<.08)G.pickups.push({kind:Math.random()<.5?'sword':'armor',x:e.x,y:e.y,z:20,vz:280,vx:rnd(-80,80),t:0});
 if(e.boss&&e.def.drop){const d=e.def.drop;if(d.equip==='flame_sword')G.pickups.push({kind:'flame_sword',x:e.x,y:e.y,z:20,vz:300,vx:0,t:0});else if(d.equip)G.pickups.push({kind:d.equip,x:e.x+30,y:e.y,z:20,vz:300,vx:0,t:0});
  p.exp+=d.exp;G.expGain=(G.expGain||0)+d.exp;msg(d.msg,'#ffb040')}
 if(e.boss&&!e.mini){G.clearT=2.5;G.ep=[];G.hz=G.hz.filter(h=>h.stage);G.enemies.forEach(o=>{if(!o.dead&&o!==e){o.hp=0;kill(o)}})}
 if(e.boss&&e.mini)G.mini=null}
let DBG_GOD=false,DBG_ATK=1;// 调试：无敌 / 伤害倍率（整页有效，跨关卡保留）
function hurtPlayer(d,src){const p=G.p;if(DBG_GOD||p.inv>0||p.dead||G.clearT>0)return 0;if(!(d>0))return 0;d=Math.max(1,Math.round(d-def()));p.hp-=d;p.hurtT=.3;p.inv=.7;G.hurtFlash=Math.min(.45,.22+d/p.maxhp*2);p.energy=Math.min(100,p.energy+8);G.shake=6;
 numPop(p.x,p.y,80,d,'#ff5555');sfx('hurt');if(src&&src.x!=null)p.x+=Math.sign(p.x-src.x||1)*20;
 if(p.hp<=0){p.hp=0;p.dead=1;p.deadT=0;sfx('over')}return d}
// ---------- 玩家 ----------
function inReach(e,x0,x1,ytol,zreach=45){const p=G.p;return !e.dead&&!e.hidden&&e.x>x0-18*e.r&&e.x<x1+18*e.r&&Math.abs(e.y-p.y)<ytol+8*e.r&&(e.z-p.z)<zreach}
function meleeHit(range,dmgMul,kb,opts={}){const p=G.p;let n=0;const x0=p.face>0?p.x-10:p.x-range,x1=p.face>0?p.x+range:p.x+10;
 for(const e of G.enemies)if(inReach(e,opts.all?p.x-range:x0,opts.all?p.x+range:x1,opts.ytol||32,opts.up?110:45)){
  damage(e,atk()*dmgMul*rnd(.9,1.1),kb,p.x,null,{melee:!opts.all});n++;if(opts.stun)e.stun=Math.max(e.stun,opts.stun)}
 if(n){G.hitstop=.06;G.shake=Math.max(G.shake,3+n);gainProf(n)}return n}
function gainProf(n){const p=G.p;p.prof+=n;if(p.plv<5&&p.prof>=PROF[p.plv]){p.plv++;const m=MOVES[p.plv];G.popup={t:3,title:'砍杀熟练度 Lv'+p.plv,name:m[0],desc:m[1]};sfx('levelup')}}
function startDash(dur=.36){const p=G.p;p.dashT=p.dashDur=dur;p.dashCd=.8;p.dashHits=[];p.inv=Math.max(p.inv,.3);sfx('dash')}
function swordWave(){const p=G.p;G.pp.push({k:'sword_wave',x:p.x+p.face*40,y:p.y,z:40,vx:p.face*560,dmg:atk()*2.2,life:.9,pierce:1,hits:[],w:34});sfx('wave')}
function special(){const p=G.p;p.energy=0;p.specialT=1.6;p.inv=1.8;G.flash=.4;G.shake=12;sfx('special');
 const lv5=p.plv>=5;msg('终结技 · 万剑归宗！','#ffd34a');
 const tg=G.enemies.filter(e=>!e.dead&&e.x>G.camX-20&&e.x<G.camX+W+20);let i=0;
 for(const e of tg)for(let k=0;k<(lv5?3:2);k++)G.swords.push({x:e.x+rnd(-20,20),y:e.y+1,t:-.25-(i++)*.06,e,dmg:(34+atk()*1.6)*(lv5?1.5:1),gold:lv5});
 for(let k=0;k<14;k++)G.swords.push({x:G.camX+rnd(30,W-30),y:rnd(LANE_TOP,LANE_BOT),t:-.2-k*.07,deco:1,gold:lv5})}
function updatePlayer(dt){const p=G.p;
 if(p.dead&&(p.hp>0||DBG_GOD)){p.dead=0;p.deadT=0;if(p.hp<=0)p.hp=p.maxhp}
 if(p.dead){p.deadT+=dt;if(p.deadT>1.6&&MODE==='play'&&p.hp<=0){MODE='over';OVER_T=0;sfx('fail')}return}
 for(const k of['inv','hurtT','comboWin','dashCd','bufJ','hzT'])p[k]=Math.max(0,p[k]-dt);
 if(G.menu)return;
 const bnd=laneAt(p.x);let sp=200;if(segAt(p.x,'river')&&p.z<5)sp*=G.S.river.slow;
 let mx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),my=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
 if(p.specialT>0){p.specialT-=dt;mx=my=0}
 if(p.castT>0){p.castT-=dt;mx=my=0}
 if(hit('j'))p.bufJ=.3;
 // 突刺
 if(p.dashT>0){const dpr=1-p.dashT/p.dashDur;p.dashT-=dt;if(dpr>.16&&dpr<.74)p.x+=p.face*1000*dt;for(const e of G.enemies)if(!p.dashHits.includes(e)&&inReach(e,p.x-40,p.x+40,36)){p.dashHits.push(e);damage(e,atk()*2,180,p.x-p.face*50,null);G.hitstop=.05;gainProf(1)}
 }else if(p.spinT>0){p.spinT-=dt;p.x+=mx*80*dt}
 else if(p.landT>0&&p.atkT<=0){p.landT-=dt;p.x+=mx*sp*.4*dt}
 else if(p.atkT>0){p.atkT-=dt;p.x+=p.face*30*dt;if(p.bufJ>0&&p.combo!==9&&p.atkT<p.atkDur*.34)p.atkT=0}
 else if(p.specialT<=0&&p.castT<=0&&p.hurtT<=0){
  if(mx)p.face=mx;p.x+=mx*sp*dt;p.y+=my*sp*.6*dt;p.walk+=(mx||my)?dt:0;p.moving=!!(mx||my);
  if(p.bufJ>0&&p.z<=0){
   if(p.plv>=3&&mx&&p.dashCd<=0&&(keys.d||keys.arrowright||keys.a||keys.arrowleft)&&p.tdash>.18){p.bufJ=0;startDash()}
   else{p.bufJ=0;p.combo=p.comboWin>0?p.combo%(p.plv>=2?5:4)+1:1;
    // 四段普攻（新动画 6 帧，约 18–20fps），第 4 帧（剑伸出）判定；熟练度 2 级起第 5 段为旋风斩
    if(p.combo===5){p.spinT=p.spinDur=.46;sfx('spin');setTimeout(()=>G&&meleeHit(110,.85,60,{all:1,ytol:50}),110);setTimeout(()=>G&&meleeHit(115,.85,170,{all:1,ytol:50}),330)}
    else{const c=p.combo,H=HIT[c];p.atkT=p.atkDur=H[0];sfx('swing');setTimeout(()=>G&&meleeHit(H[1],H[2],H[3],{up:c===3}),H[0]*500)}
    p.comboWin=.55}}
  else if(p.bufJ>0&&p.z>0&&p.atkT<=0){p.bufJ=0;p.atkT=.3;p.atkDur=.3;p.combo=9;sfx('swing');setTimeout(()=>G&&meleeHit(80,1.3,90,{up:1}),60)}
  if(hit('k')&&p.z<=0){p.vz=520;p.jt=0;p.landT=0;sfx('jump')}
}
 if(p.specialT<=0&&p.castT<=0&&p.dashT<=0){
  if(hit('l')&&p.energy>=100){p.atkT=p.spinT=0;special()}
  if(hit('u')){p.atkT=p.spinT=0;castSel()}
  if(hit('i')&&p.spells.length){p.sel=(p.sel+1)%p.spells.length;msg('当前魔法：'+SP(p.spells[p.sel]).name,'#c9a0ff')}
 }
 if(mx)p.tdash+=dt;else p.tdash=0;
 // 剑气波蓄力
 if(keys.j&&p.plv>=4&&p.atkT<=0&&p.dashT<=0){p.jHold+=dt}else{if(p.jHold>.55&&p.plv>=4&&!keys.j){p.castAnim='wavecast';p.castT=.3;swordWave()}p.jHold=0}
 if(p.z>0||p.vz>0){p.jt+=dt;p.vz-=1500*dt;p.z+=p.vz*dt;if(p.z<=0){p.z=0;p.vz=0;if(p.atkT<=0&&!p.dead)p.landT=.09}}
 const b2=laneAt(p.x);p.y=clamp(p.y,b2[0],b2[1]);
 const lo=G.camX+44,hi=Math.min(G.lockX!=null?G.lockX+W-44:G.B.end-44,G.camX+W-44);p.x=clamp(p.x,lo,Math.max(lo,hi));
 // 拾取
 for(const k of G.pickups)if(k.z<=4&&Math.abs(k.x-p.x)<30&&Math.abs(k.y-p.y)<24&&!k.got){k.got=1;
  if(k.kind==='coin'){p.gold+=5;sfx('coin')}else if(k.kind==='potion'){p.mp++;msg('魔法瓶 +1','#7fe3ff');sfx('potion')}
  else if(k.kind==='sword'){p.atkLv++;msg('剑刃强化！攻击 +4','#ffd34a');sfx('equip')}else if(k.kind==='armor'){p.defLv++;msg('护甲强化！防御 +2','#9fd0ff');sfx('equip')}
  else if(k.kind==='flame_sword'){p.flameSword=1;msg('装备【烈炎剑】：攻击 +8，剑刃燃烧','#ff8a30');sfx('equip')}}
 G.pickups=G.pickups.filter(k=>!k.got);
 // 女巫
 const wt=nearWitch();if(wt&&hit('e')){G.menu={sel:0,col:0,w:wt};if(!wt.rested){wt.rested=1;p.hp=p.maxhp;msg('女巫的营火：生命完全恢复','#9f9')}sfx('witch')}
}
function nearWitch(){const p=G.p;if(G.lockX!=null)return null;return G.B.witches.find(w=>Math.abs(w.x-p.x)<90&&Math.abs(w.y-p.y)<90)}
// ---------- 魔法 ----------
function nearest(maxd=700){const p=G.p;let b=null,bd=maxd;for(const e of G.enemies){if(e.dead||e.hidden)continue;const d=Math.hypot(e.x-p.x,(e.y-p.y)*2);if(d<bd){bd=d;b=e}}return b}
function castSel(){const p=G.p;if(!p.spells.length){msg('尚未学习魔法（找女巫学习）','#aaa');sfx('fail');return}
 const s=SP(p.spells[p.sel]);if(p.mp<s.mp){msg('魔法瓶不足（需要'+s.mp+'）','#f88');sfx('fail');return}
 p.mp-=s.mp;p.castT=.35;p.castAnim='charge';msg(s.name+'！',SCHOOLS.find(c=>c.id===s.s).col);sfx(s.s==='fire'?'fire':s.s==='ice'?'frost':'bolt');CAST[s.id]()}
function proj(k,o){const p=G.p;G.pp.push(Object.assign({k,x:p.x+p.face*40,y:p.y,z:40,vx:p.face*480,vy:0,life:1.4,hits:[],w:28,pierce:0},o))}
function aoe(x,y,r,dmg,elem,eff={}){for(const e of G.enemies){if(e.dead)continue;if(Math.hypot(e.x-x,(e.y-y)*1.8)<r+14*e.r){damage(e,dmg,eff.kb||80,x,elem);if(eff.freeze)e.frozen=Math.max(e.frozen,eff.freeze);if(eff.stun)e.stun=Math.max(e.stun,eff.stun);if(eff.slow)e.slow=Math.max(e.slow,eff.slow)}}}
function bolt(x1,y1,x2,y2){G.bolts.push({x1,y1,x2,y2,life:.25})}
const CAST={
 f1:()=>proj('fireball',{dmg:30,elem:'fire'}),
 f2:()=>{for(let i=0;i<3;i++)setTimeout(()=>G&&proj('fireball',{dmg:26,elem:'fire',y:G.p.y+(i-1)*14}),i*130)},
 f3:()=>{const p=G.p;G.zones.push({k:'firewall',x:p.x+p.face*120,y:p.y,r:70,t:0,dur:3,tick:.3,acc:0,dmg:14,elem:'fire'})},
 f4:()=>proj('fireball',{dmg:40,elem:'fire',big:1,explode:{r:110,dmg:70}}),
 f5:()=>{G.zones.push({k:'vortex',x:G.p.x,y:G.p.y,r:150,t:0,dur:3,tick:.25,acc:0,dmg:12,elem:'fire',pull:1,follow:1})},
 f6:()=>proj('flame_lance',{dmg:120,elem:'fire',pierce:1,vx:G.p.face*900,life:1.2,w:40}),
 i1:()=>{for(let i=-1;i<=1;i++)proj('ice_lance',{dmg:20,elem:'ice',vy:i*90,slow:2,sc:.5})},
 i2:()=>{const p=G.p;G.zones.push({k:'frost',x:p.x,y:p.y,r:170,t:0,dur:1,tick:9,acc:9,dmg:20,elem:'ice',freeze:3})},
 i3:()=>{const e=nearest();const x=e?e.x:G.p.x+G.p.face*200,y=e?e.y:G.p.y;G.zones.push({k:'iceburst',x,y,r:110,t:0,dur:.7,tick:9,acc:9,dmg:55,elem:'ice',freeze:2.5})},
 i4:()=>proj('ice_lance',{dmg:80,elem:'ice',pierce:1,vx:G.p.face*780,freeze:2.5,sc:1,w:36}),
 i5:()=>{G.zones.push({k:'dragon',x:G.camX+(G.p.face>0?-200:W+200),y:(LANE_TOP+LANE_BOT)/2,vx:G.p.face*900,r:200,t:0,dur:1.5,tick:9,acc:0,dmg:150,elem:'ice',freeze:2,hits:[]});G.shake=10},
 t1:()=>{const p=G.p;let from={x:p.x,y:p.y-50},used=[];for(let i=0;i<4;i++){let b=null,bd=380;for(const e of G.enemies){if(e.dead||used.includes(e))continue;const d=Math.hypot(e.x-from.x,e.y-from.y);if(d<bd){bd=d;b=e}}
  if(!b)break;used.push(b);bolt(from.x,from.y,b.x,b.y-40*b.r-b.z);damage(b,28,40,p.x,'thunder');b.stun=Math.max(b.stun,.6);from={x:b.x,y:b.y-40*b.r-b.z}}},
 t2:()=>{const p=G.p;startDash(.45);p.inv=.6;G.zones.push({k:'thunderdash',x:p.x,y:p.y,r:60,t:0,dur:.45,tick:.08,acc:0,dmg:16,elem:'thunder',follow:1,stun:.8})},
 t3:()=>proj('thunder_blade',{dmg:55,elem:'thunder',pierce:1,vx:G.p.face*640,stun:1.2,w:40}),
 t4:()=>{G.zones.push({k:'storm',x:G.p.x,y:G.p.y,r:260,t:0,dur:4,tick:.35,acc:0,dmg:26,elem:'thunder',follow:1,stun:.5,strike:1})},
 t5:()=>{G.flash=.5;G.shake=14;for(const e of G.enemies)if(!e.dead&&e.x>G.camX-20&&e.x<G.camX+W+20){bolt(e.x,e.y-500,e.x,e.y-e.z);damage(e,160,60,G.p.x,'thunder');e.stun=Math.max(e.stun,1)}}};
function learn(id){const p=G.p,s=SP(id);const i=SPELLS.indexOf(s);const prev=SPELLS[i-1];
 if(p.spells.includes(id))return;if(prev&&prev.s===s.s&&!p.spells.includes(prev.id)){msg('需先学会【'+prev.name+'】','#f88');sfx('fail');return}
 if(p.exp<s.exp){msg('经验不足（需要'+s.exp+'）','#f88');sfx('fail');return}
 p.exp-=s.exp;p.spells.push(id);p.sel=p.spells.length-1;PROFILE.spells=p.spells.slice();PROFILE.sel=p.sel;PROFILE.exp=Math.max(0,PROFILE.exp-s.exp);writeSave();msg('学会了【'+s.name+'】！按 U 施放','#c9a0ff');sfx('levelup')}
function spellState(id){const p=G.p,s=SP(id),i=SPELLS.indexOf(s),prev=SPELLS[i-1];
 if(p.spells.includes(id))return 'learned';if(prev&&prev.s===s.s&&!p.spells.includes(prev.id))return 'locked';return p.exp>=s.exp?'ok':'poor'}
// ---------- 敌人AI ----------
function bannerBuff(){return G.enemies.some(e=>!e.dead&&e.type==='war_banner')}
EN.war_banner={name:'哥布林战旗',shape:'banner',ai:'static',hp:160,dmg:0,sp:0,exp:40,r:1.2,col:'#a02020'};
function strike(e,range,dmgMul=1,ytol=34){const p=G.p;const dx=(p.x-e.x)*e.face;
 if(dx>-20&&dx<range&&Math.abs(p.y-e.y)<ytol&&p.z<60){const d=hurtPlayer(e.dmg*dmgMul*(bannerBuff()&&e.def.shape!=='vamp'?1.3:1),e);
  if(d&&(e.def.drain||(e.boss&&curPhase(e).lifesteal))){const h=e.boss?d*2:d;e.hp=Math.min(e.maxhp,e.hp+h);numText(e,'+'+Math.round(h),'#ff4060');particles(p.x,p.y,50,'#c00020',8)}return 1}return 0}
function eShot(e,k){const p=G.p;if(k==='snowball'){lobSnow(e,p.x+rnd(-30,30),p.y+rnd(-12,12),e.dmg,40,1);sfx('swing');return}const a=Math.atan2((p.y-e.y),(p.x-e.x));const sp=k==='arrow'?380:260;
 G.ep.push({k,x:e.x+e.face*20,y:e.y,z:40*e.r+e.z,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*.5,dmg:e.dmg*(k==='arrow'?.8:1),life:3,own:e});sfx(k==='arrow'?'swing':k==='ice'?'frost':'fire')}
function updateEnemy(e,dt){const p=G.p,d=e.def;
 if(e.dead){e.deadT+=dt;e.z=Math.max(0,e.z-200*dt);return}
 e.at+=dt;e.hurtT=Math.max(0,e.hurtT-dt);e.cool=Math.max(0,e.cool-dt);e.slow=Math.max(0,e.slow-dt);e.inv=Math.max(0,(e.inv||0)-dt);
 if(e.kx){e.x+=e.kx*dt*4;e.kx*=.8;if(Math.abs(e.kx)<5)e.kx=0}
 if(e.boss){e.frozen=Math.min(e.frozen,.8);e.stun=Math.min(e.stun,.4)}
 if(e.frozen>0){e.frozen-=dt;return}if(e.stun>0){e.stun-=dt;return}
 if(e.hurtT>0&&!e.boss&&!d.elite)return;
 const sl=(e.slow>0?.5:1)*(bannerBuff()&&d.shape==='gob'?1.2:1);
 if(e.boss)return updateBoss(e,dt,sl);
 const dx=p.x-e.x,dy=p.y-e.y,ad=Math.abs(dx);if(e.state!=='wind'&&e.state!=='leap'&&e.state!=='dive')e.face=dx>0?1:-1;
 e.cd-=dt;e.t+=dt;e.tokCd=Math.max(0,(e.tokCd||0)-dt);if(e.tok){e.tokT+=dt;if(e.tokT>4&&e.state==='walk')dropTok(e,1.5)}
 const ai=d.ai,reach=(d.reach||0)+30+20*e.r;
 if(e.rush&&ad<(e.rush===2?190:330))e.rush=0;
 if(ai==='static')return;
 if(ai==='flyer'){
  if(e.state==='dive'){e.x+=e.vx*dt;e.y+=e.vy*dt;e.z=Math.max(12,e.z-260*dt);if(e.t>.55||(!e.hitDone&&Math.abs(p.x-e.x)<40&&Math.abs(p.y-e.y)<30)){if(!e.hitDone&&Math.abs(p.x-e.x)<45&&Math.abs(p.y-e.y)<30&&p.z<70)strike(e,60,1,40);e.hitDone=1;if(e.t>.55){e.state='rise';e.t=0}}return}
  if(e.state==='rise'){e.z+=150*dt;if(e.z>=e.hoverZ){e.state='walk';e.cd=rnd(1.4,2.6)/G.diff*1.4}return}
  const tx=p.x+(e.ofs>0?140:-140)*(1+.3*Math.sin(e.at)),ty=p.y+Math.sin(e.at*1.7+e.ofs*3)*40;
  e.x+=clamp(tx-e.x,-1,1)*e.sp*sl*dt*(Math.abs(tx-e.x)>10?1:0);e.y+=clamp(ty-e.y,-1,1)*e.sp*.5*sl*dt;e.z+=(e.hoverZ+Math.sin(e.at*4)*8-e.z)*dt*3;
  if(e.cd<=0&&ad<260){e.state='dive';e.t=0;e.hitDone=0;const T=.5;e.vx=dx/T;e.vy=dy/T;e.face=dx>0?1:-1;sfx('swing')}
  return}
 if(e.state==='wind'){if(e.t>=e.wind){e.state='strike';e.t=0;
   if(e.atkType==='smash'){G.shake=8;sfx('erupt');const hx=e.x+e.face*60;if(Math.hypot(p.x-hx,(p.y-e.y)*1.6)<100&&p.z<20)hurtPlayer(e.dmg*1.6,e);particles(hx,e.y,5,'#a08060',16);if(ai==='golem'){e.cool=2;numText(e,'冷却·破绽！','#ffd34a')}}
   else strike(e,reach+10,1)}return}
 if(e.state==='strike'){if(e.t>.35){e.state='walk';e.cd=rnd(.9,1.8)/Math.sqrt(G.diff);dropTok(e)}return}
 if(e.state==='leap'){e.x+=e.vx*dt;e.vz-=1400*dt;e.z+=e.vz*dt;if(e.z<=0){e.z=0;e.state='strike';e.t=0;G.shake=5;if(Math.abs(p.x-e.x)<55&&Math.abs(p.y-e.y)<32&&p.z<20)hurtPlayer(e.dmg*1.3,e)}return}
 if(ai==='ranged'){
  const want=300;let mx=0;if(ad<want-60)mx=-Math.sign(dx);else if(ad>want+80)mx=Math.sign(dx);
  e.x+=mx*e.sp*sl*dt*(e.rush?2.2:1);e.y+=clamp(dy,-1,1)*e.sp*.6*sl*dt;e.moving=!!mx||Math.abs(dy)>4;
  if(e.cd<=0&&Math.abs(dy)<60&&!(G.shotT>0)){eShot(e,d.shot);e.state='strike';e.t=0;e.cd=rnd(2,3)/Math.sqrt(G.diff);G.shotT=G.idx===0?1.4:1.25}return}
 if(ai==='jumper'&&e.cd<=0&&ad<240&&ad>80&&Math.abs(dy)<40&&tryTok(e)){e.state='leap';e.vz=520;e.vx=dx/0.74;e.t=0;sfx('jump');return}
 if(!e.tok&&ad<reach+150&&!tryTok(e)){// 没有进攻名额：在外圈游走等待
  const ring=165+e.ofs*35,side=dx>0?-1:1,tx=p.x+side*ring+Math.sin(e.at*.9+e.ofs*4)*30,ty=p.y+Math.sin(e.at*.7+e.ofs*5)*55;
  const vx=Math.abs(tx-e.x)>8?clamp((tx-e.x)/40,-1,1):0,vy=Math.abs(ty-e.y)>6?clamp((ty-e.y)/30,-1,1):0;
  e.x+=vx*e.sp*.6*sl*dt;e.y+=vy*e.sp*.45*sl*dt;e.moving=!!(vx||vy);const b=laneAt(e.x);e.y=clamp(e.y,b[0],b[1]);return}
 if(ad<reach&&Math.abs(dy)<16){e.moving=0;if(e.cd<=0){e.state='wind';e.t=0;
   if((ai==='brute'||ai==='golem')&&Math.random()<(ai==='golem'?.6:.35)){e.atkType='smash';e.wind=.85}else{e.atkType='hit';e.wind=ai==='fast'?.25:.45}}}
 else{const tx=p.x-Math.sign(dx||1)*(reach-8)+e.ofs*10,ty=p.y+e.ofs*6;const vx=clamp(tx-e.x,-1,1),vy=clamp(ty-e.y,-1,1);
  const s=e.sp*sl*(e.rush?2.4:1);e.x+=vx*s*dt;e.y+=vy*s*.6*dt;e.moving=1}
 const b=laneAt(e.x);e.y=clamp(e.y,b[0],b[1]);
}
function lobSnow(e,tx,ty,dmg,rx=46,sc=1,fl=1.05){const b=laneAt(tx);G.hz.push({k:'snowball',x:clamp(tx,G.camX+20,G.camX+W-20),y:clamp(ty,b[0],b[1]),ox:e.x+e.face*20*e.r,oy:e.y,oz:(e.boss?150:70)*e.r/ (e.boss?2.3:1),rx,ry:rx*.4,t:0,warn:fl,act:.15,dmg,once:1,sc})}
// ---------- 首领AI ----------
function curPhase(e){return e.def.phases[e.phase]}
function updateBoss(e,dt,sl){const p=G.p,d=e.def;const ph=curPhase(e);
 const nx=d.phases[e.phase+1];if(nx&&e.hp/e.maxhp<nx.at&&!e.pat){e.phase++;e.inv=1.2;G.shake=14;sfx('roar');msg(nx.msg||'首领进入新阶段！','#ff6060');
  if(nx.shrink){G.shrinkT=36}if(nx.bloodmoon)G.bloodmoon=1;return}
 const en=ph.enrage?1.3:1;const dx=p.x-e.x,dy=p.y-e.y,ad=Math.abs(dx);
 if(!e.pat){if(!e.hidden)e.face=dx>0?1:-1;e.cd-=dt*en;
  const reach=60+30*e.r;
  if(ad>reach-10||Math.abs(dy)>14){e.x+=Math.sign(dx)*e.sp*sl*en*dt*(ad>reach-10?1:0);e.y+=clamp(dy,-1,1)*e.sp*.6*sl*dt;e.moving=1}else e.moving=0;
  if(e.cd<=0){e.patI=(e.patI||0)+1;let pt=ph.pats[(e.patI+Math.floor(rnd(0,2)))%ph.pats.length];
   if(['combo','sweep','rapier','smash','hammer'].includes(pt)&&ad>220)pt=ph.pats.find(q=>!['combo','sweep','rapier','smash','hammer'].includes(q))||pt;
   e.pat=pt;e.patT=0;e.step=0}
  const b=laneAt(e.x);e.y=clamp(e.y,b[0],b[1]);return}
 e.patT+=dt*en;const T=e.patT;const done=()=>{e.pat=null;e.cd=ph.cd*rnd(.8,1.2)};const reach=70+30*e.r;
 switch(e.pat){
  case 'combo':case 'sweep':case 'rapier':{const n=e.pat==='sweep'?1:e.pat==='rapier'?3:2;const per=e.pat==='rapier'?.38:.55;
   if(T>.5+e.step*per&&e.step<n){e.step++;e.x+=e.face*(e.pat==='rapier'?30:15);sfx('swing');strike(e,reach+(e.pat==='sweep'?50:20),e.pat==='sweep'?1.3:1,e.pat==='sweep'?60:38);
    if(e.pat==='sweep'&&d.flame)particles(e.x+e.face*80,e.y,30,'#ff7a1a',20)}
   if(T>.6+n*per)done();break}
  case 'smash':if(T>.9&&!e.step){e.step=1;G.shake=12;sfx('erupt');const hx=e.x+e.face*80;G.hz.push({k:'shock',x:hx,y:e.y,r0:20,r1:200,t:0,act:.6,dmg:e.dmg*1.2});if(Math.hypot(p.x-hx,(p.y-e.y)*1.6)<110&&p.z<20)hurtPlayer(e.dmg*1.5,e)}
   if(T>1.5)done();break;
  case 'charge':case 'lunge':if(T<.5){e.face=dx>0?1:-1}else if(T<1.15){e.x+=e.face*(e.pat==='lunge'?720:600)*dt;if(!e.step&&strike(e,70,1.2,36))e.step=1;particles(e.x,e.y,10,'#888',1)}else done();
   if(e.x<G.camX+30||e.x>G.camX+W-30){e.x=clamp(e.x,G.camX+30,G.camX+W-30)}break;
  case 'fireWave':if(T>.6&&!e.step){e.step=1;G.ep.push({k:'firewave',x:e.x+e.face*60,y:e.y,z:10,vx:e.face*330,vy:0,dmg:e.dmg,life:3,ground:1});sfx('fire')}if(T>1.2)done();break;
  case 'geysers':case 'bloodPillars':if(!e.step){e.step=1;const b=laneAt(e.x);const rows=[b[0]+20,(b[0]+b[1])/2,b[1]-20];const safe=Math.floor(rnd(0,3));
    rows.forEach((y,ri)=>{if(ri===safe)return;for(let x=G.camX+70;x<G.camX+W;x+=130)G.hz.push({k:e.pat==='geysers'?'geyser':'bloodpillar',x:x+rnd(-15,15),y,rx:50,ry:20,t:0,warn:1+ri*.15,act:.7,dmg:e.dmg*1.1,once:1})});sfx('erupt')}
   if(T>1.6)done();break;
  case 'summon':case 'batSwarm':if(!e.step){e.step=1;const t=e.pat==='batSwarm'?'bat':(ph.summon||'goblin');const n=e.pat==='batSwarm'?5:3;
    for(let i=0;i<n;i++)spawn(t,G.camX+(i%2?W+30:-30),rnd(LANE_TOP,LANE_BOT));sfx('roar')}if(T>1)done();break;
  case 'meteors':case 'icicles':case 'volley':if(!e.step){e.step=1;const n=e.pat==='volley'?9:7;for(let i=0;i<n;i++){const b=laneAt(p.x);
    G.hz.push({k:e.pat==='meteors'?'meteor':e.pat==='icicles'?'icicle':'arrows',x:clamp(p.x+rnd(-260,260),G.camX+30,G.camX+W-30),y:rnd(b[0],b[1]),rx:e.pat==='meteors'?55:42,ry:18,t:0,warn:1.1+i*.12,act:.25,dmg:e.dmg*.9,once:1})}}
   if(T>1.2)done();break;
  case 'iceSpikes':if(!e.step){e.step=1;for(let i=0;i<9;i++)G.hz.push({k:'spike',x:e.x+e.face*(70+i*70),y:p.y,rx:34,ry:14,t:0,warn:.6+i*.08,act:.4,dmg:e.dmg,once:1})}if(T>1.2)done();break;
  case 'leap':if(!e.step){e.step=1;e.tx=p.x;e.ty=p.y;e.sx=e.x;e.sy=e.y;G.hz.push({k:'mark',x:p.x,y:p.y,rx:90,ry:30,t:0,warn:1,act:.01,dmg:0})}
   if(T<1){const k=T;e.x=e.sx+(e.tx-e.sx)*k;e.y=e.sy+(e.ty-e.sy)*k;e.z=Math.sin(k*Math.PI)*260}
   else if(e.step===1){e.step=2;e.z=0;G.shake=16;sfx('erupt');if(Math.hypot(p.x-e.x,(p.y-e.y)*1.6)<100&&p.z<25)hurtPlayer(e.dmg*1.6,e);
    for(let i=0;i<2;i++)G.hz.push({k:'shock',x:e.x,y:e.y,r0:30,r1:320,t:-i*.35,act:.9,dmg:e.dmg*.8})}
   if(T>1.8)done();break;
  case 'banner':if(!e.step){e.step=1;if(!bannerBuff()){const bx=clamp(e.x-e.face*120,G.camX+60,G.camX+W-60);spawn('war_banner',bx,clamp(e.y-30,LANE_TOP,LANE_BOT));msg('战旗：哥布林攻击/速度提升！摧毁它！','#ff9a40')}
   for(let i=0;i<2;i++)spawn(ph.summon||'goblin',G.camX+(i?W+30:-30),rnd(LANE_TOP,LANE_BOT))}if(T>1)done();break;
  case 'batTeleport':if(!e.step){e.step=1;e.hidden=1;particles(e.x,e.y,60,'#300010',30,260);sfx('witch')}
   if(e.step===1&&T>.8){e.step=2;e.hidden=0;e.x=clamp(p.x-p.face*110,G.camX+40,G.camX+W-40);e.y=p.y;e.face=p.x>e.x?1:-1;particles(e.x,e.y,60,'#600018',30,260)}
   if(e.step===2&&T>1.15){e.step=3;sfx('swing');strike(e,reach+20,1.1,40)}if(T>1.5)done();break;
  case 'bloodOrbs':if(T>.5&&e.step<3&&T>.5+e.step*.3){e.step++;const a0=Math.atan2(p.y-e.y,p.x-e.x);for(let i=-2;i<=2;i++){const a=a0+i*.22;G.ep.push({k:'bloodorb',x:e.x+e.face*30,y:e.y,z:60,vx:Math.cos(a)*260,vy:Math.sin(a)*130,dmg:e.dmg*.6,life:3,own:e})}sfx('fire')}
   if(T>1.6)done();break;
  case 'bloodBurst':if(!e.step){e.step=1;G.hz.push({k:'burst',x:e.x,y:e.y,rx:280,ry:110,t:0,warn:1.7,act:.4,dmg:e.dmg*1.8,once:1,noz:1});msg('血爆！远离伯爵！','#ff3040')}if(T>2.3)done();break;
  case 'hammer':if(T<.6){e.face=dx>0?1:-1;if(ad>reach)e.x+=e.face*e.sp*1.2*dt}else if(!e.step){e.step=1;sfx('swing');G.shake=10;strike(e,reach+60,1.4,60);const hx=e.x+e.face*90;particles(hx,e.y,18,'#dff4ff',18,200);G.hz.push({k:'shock',x:hx,y:e.y,r0:10,r1:120,t:0,act:.35,dmg:0,ice:1,sb:e.def.shape==='snowboss'?1:0})}if(T>1.15)done();break;
  case 'snowballs':case 'blizzard':{const n=e.pat==='blizzard'?10:(e.def.shape==='snowboss'?2:3);const per=e.pat==='blizzard'?.14:.6;
   if(T>.55+e.step*per&&e.step<n){e.step++;sfx('swing');const near=e.pat==='snowballs'&&e.step===1;const ice=e.pat==='snowballs'||e.step%3===0;const giant=e.pat==='snowballs'&&e.def.shape==='snowboss';lobSnow(e,p.x+(near?0:rnd(-220,220)),p.y+rnd(-40,40),e.dmg*(giant?1.3:ice?1.1:.8),giant?90:ice?70:48,giant?2.6:ice?2:1.2,(giant?1.25:1.0)+rnd(0,.35));if(giant)G.hz[G.hz.length-1].giant=1;else if(ice)G.hz[G.hz.length-1].ice=1}
   if(T>.9+n*per)done();break}
  case 'slam':if(T>.95&&!e.step){e.step=1;G.shake=16;sfx('erupt');G.hz.push({k:'shock',x:e.x+e.face*60,y:e.y,r0:20,r1:150,t:0,act:.5,dmg:0,ice:1});for(let i=0;i<9;i++)G.hz.push({k:'spike',sb:1,x:e.x+e.face*(110+i*62),y:e.y+rnd(-8,8),rx:30,ry:13,t:0,warn:.08+i*.07,act:.45,dmg:e.dmg*.9,once:1,v:i%2});
    if(Math.hypot(p.x-e.x-e.face*40,(p.y-e.y)*1.6)<110&&p.z<20)hurtPlayer(e.dmg*1.5,e);particles(e.x+e.face*40,e.y,10,'#ffffff',30,240)}
   if(T>1.7)done();break;
  case 'iceSummon':if(T>.35&&!e.step){e.step=1;sfx('roar');const n=ph.enrage?7:5;for(let i=0;i<n;i++){const b=laneAt(p.x);const tx=i===0?p.x:clamp(p.x+rnd(-300,300),G.camX+40,G.camX+W-40);
    G.hz.push({k:'spike',sb:1,x:tx,y:i===0?p.y:rnd(b[0],b[1]),rx:38,ry:16,t:0,warn:1.0+i*.06,act:.55,dmg:e.dmg,once:1,v:i%2,big:1})}msg('冰锥召唤！离开标记！','#bfe6ff')}
   if(T>1.9)done();break;
  case 'frostwave':if(T>.6&&!e.step){e.step=1;G.shake=14;sfx('erupt');for(let i=0;i<3;i++)G.hz.push({k:'shock',x:e.x,y:e.y,r0:40,r1:330+i*50,t:-i*.28,act:1,dmg:e.dmg*.85,ice:1,sb:1});particles(e.x,e.y,10,'#dff4ff',30,260)}
   if(T>1.8)done();break;
  case 'roll':if(!e.step){e.step=1;msg('巨型雪球！跳起或换行躲避！','#bfe6ff')}
   if(T>.8&&e.step===1){e.step=2;const fromL=p.x>G.camX+W/2;const x0=fromL?G.camX-60:G.camX+W+60;G.ep.push({k:'rollball',x:x0,y:p.y,z:0,vx:(fromL?1:-1)*(360+80*(ph.enrage?1:0)),vy:0,dmg:e.dmg*1.2,life:5,ground:1,hw:52,hh:26,rad:58});sfx('roar')}
   if(T>1.4)done();break;
  default:done()}
}
// ---------- 世界更新 ----------
function hzActive(h){if(h.cyc){const t=(G.t+h.cyc.ofs)%h.cyc.per,i=h.cyc.per-h.cyc.warn-h.cyc.act;return t<i?0:t<i+h.cyc.warn?1:2}return h.t<h.warn?1:h.t<h.warn+h.act?2:3}
function spawnBatch(w,L){const b=laneAt(w.x+W/2);L.forEach((t,i)=>{const side=t.startsWith('mini:')?1:(i%3===2?-1:1);const f=G.wave===0;const e=spawn(t,side>0?w.x+W+(f?12:40)+i*(f?22:30):w.x-(f?12:40)-i*20,rnd(b[0],b[1]));if(e&&!e.boss)e.rush=f?2:1})}
function updateWorld(dt){const p=G.p,B=G.B;
 // 波次
 if(G.wave===0&&G.lockX==null&&G.time>=2.2&&B.waves[0].x>G.camX){B.waves[0].x=G.camX}
 if(G.lockX==null&&G.wave<B.waves.length&&(p.x-W*.4>=B.waves[G.wave].x-40||(G.wave===0&&B.waves[0].x<=G.camX+1))){const w=B.waves[G.wave];G.lockX=w.x;G.go=0;
  if(w.boss){spawnBoss(w.boss,w.x+W-150,(LANE_TOP+LANE_BOT)/2)}
  else{const n=w.list.some(t=>t.startsWith('mini:'))?1:Math.min(w.batches||G.S.batches||1,Math.max(1,Math.floor(w.list.length/2)));
   const bs=[];for(let k=0;k<n;k++)bs.push(w.list.filter((_,i)=>i%n===k));spawnBatch(w,bs.shift());G.reinf=bs;
   msg('第 '+(G.wave+1)+' 波'+(w.elite?' · 精英来袭！':''),w.elite?'#ff9a40':'#fff')}}
 if(G.lockX!=null){const camT=G.lockX;G.camX+=(camT-G.camX)*Math.min(1,dt*5);
  if(G.reinf&&G.reinf.length&&!G.B.waves[G.wave].boss&&G.enemies.filter(e=>!e.dead).length<=1){spawnBatch(G.B.waves[G.wave],G.reinf.shift());msg('增援来袭！','#ffb080')}
  if(G.enemies.every(e=>e.dead)&&!(G.reinf&&G.reinf.length)&&!G.B.waves[G.wave].boss){G.lockX=null;G.wave++;G.go=2.5;sfx('go');
   if(B.witches.some(w=>Math.abs(w.x-(B.waves[G.wave-1].x+W+60))<5))msg('前方有女巫营地（按 E 学习魔法/恢复）','#c9a0ff')}}
 else G.camX+=(clamp(p.x-W*.4,0,B.end-W)-G.camX)*Math.min(1,dt*6);
 G.go=Math.max(0,G.go-dt);G.shotT=Math.max(0,(G.shotT||0)-dt);// 远程敌人全局射击间隔：同屏多名弓手不再齐射
 for(const e of G.enemies){updateEnemy(e,dt);if(G.lockX!=null&&!e.dead){const lo=G.lockX+40,hi=G.lockX+W-40;if(e.x>hi)e.x=Math.max(hi,e.x-150*dt);else if(e.x<lo)e.x=Math.min(lo,e.x+150*dt)}}
 G.enemies=G.enemies.filter(e=>!e.dead||e.deadT<1.2);
 // 熔岩缩圈
 if(G.shrinkT>0)G.shrink+=(G.shrinkT-G.shrink)*dt*.5;
 // 关卡落石等
 const hz=G.S.hazards||{};if(hz.rocks&&G.wave>=hz.rocks.from&&G.clearT<=0){G.rockT-=dt;if(G.rockT<=0){G.rockT=hz.rocks.every*rnd(.7,1.3);const b=laneAt(p.x);
  G.hz.push({k:hz.rocks.kind==='bolt'?'skybolt':hz.rocks.kind==='icicle'?'icicle':'meteor',x:clamp(p.x+rnd(-200,200),G.camX+30,G.camX+W-30),y:rnd(b[0],b[1]),rx:44,ry:16,t:0,warn:1.2,act:.25,dmg:10*G.diff,once:1})}}
 // 危险区域
 for(const h of G.hz){h.t+=dt;const st=hzActive(h);
  if(h.k==='shock'){if(h.t>0){const r=h.r0+(h.r1-h.r0)*clamp(h.t/h.act,0,1);const d=Math.hypot(p.x-h.x,(p.y-h.y)*2);if(Math.abs(d-r)<18&&p.z<10&&!h.hit){h.hit=1;hurtPlayer(h.dmg,h)}}continue}
  if(st===2&&!h.fired){if(h.once)h.fired=1;if(['meteor','icicle','skybolt','arrows'].includes(h.k)&&!h.fx){h.fx=1;G.shake=Math.max(G.shake,5);sfx(h.k==='skybolt'?'bolt':'erupt');if(h.k==='skybolt')bolt(h.x,h.y-520,h.x,h.y)}
   if((h.k==='geyser'||h.k==='bloodpillar')&&!h.fx){h.fx=1;sfx('erupt')}
   if(h.k==='snowball'&&!h.fx){h.fx=1;sfx('hit');G.shake=Math.max(G.shake,3*h.sc);particles(h.x,h.y,6,'#ffffff',14+6*h.sc,180*h.sc);particles(h.x,h.y,4,'#bfe0ff',6,120)}
   const inside=((p.x-h.x)/h.rx)**2+((p.y-h.y)/h.ry)**2<1;if(inside&&(h.noz||p.z<30)&&p.hzT<=0){if(h.k==='burst'?Math.hypot(p.x-h.x,(p.y-h.y)*2.5)<h.rx:true){hurtPlayer(h.dmg,h);p.hzT=.6}}
   if(h.k==='burst'&&!h.fx){h.fx=1;G.shake=18;G.flash=.3;sfx('special')}}}
 G.hz=G.hz.filter(h=>h.cyc||(h.k==='shock'?h.t<h.act:h.t<(h.warn||0)+h.act+.3));
 // 玩家投射物
 for(const q of G.pp){q.x+=q.vx*dt;q.y+=(q.vy||0)*dt;q.life-=dt;
  for(const e of G.enemies){if(e.dead||e.hidden||q.hits.includes(e))continue;if(Math.abs(e.x-q.x)<q.w+10*e.r&&Math.abs(e.y-q.y)<26+6*e.r&&e.z<q.z+70){q.hits.push(e);
   damage(e,q.dmg,100,q.x-q.vx*.1,q.elem);if(q.freeze)e.frozen=Math.max(e.frozen,q.freeze);if(q.slow)e.slow=Math.max(e.slow,q.slow);if(q.stun)e.stun=Math.max(e.stun,q.stun);
   if(q.k==='sword_wave')gainProf(1);
   if(q.explode){aoe(q.x,q.y,q.explode.r,q.explode.dmg,'fire');G.zones.push({k:'boom',x:q.x,y:q.y,r:q.explode.r,t:0,dur:.5,tick:9,acc:0,dmg:0});G.shake=8;sfx('explode')}
   if(!q.pierce){q.life=0;break}}}
  if(q.x<G.camX-100||q.x>G.camX+W+100)q.life=0}
 G.pp=G.pp.filter(q=>q.life>0);
 // 敌方投射物
 for(const q of G.ep){q.x+=q.vx*dt;q.y+=q.vy*dt;q.life-=dt;
  if(Math.abs(p.x-q.x)<(q.hw||(q.k==='firewave'?40:22))&&Math.abs(p.y-q.y)<(q.hh||(q.k==='firewave'?22:20))&&(q.ground?p.z<25:Math.abs(p.z+40-q.z)<60)){
   const d=hurtPlayer(q.dmg,q);if(d&&q.k==='bloodorb'&&q.own&&!q.own.dead&&curPhase(q.own)&&curPhase(q.own).lifesteal){q.own.hp=Math.min(q.own.maxhp,q.own.hp+d*1.5)}if(q.k==='rollball'){if(d){p.vz=Math.max(p.vz||0,0);G.shake=10;particles(p.x,p.y,30,'#ffffff',20,200)}}else if(q.k!=='firewave')q.life=0}}
 G.ep=G.ep.filter(q=>q.life>0&&q.x>G.camX-100&&q.x<G.camX+W+100);
 // 法术区域
 for(const z of G.zones){z.t+=dt;if(z.follow){z.x=p.x;z.y=p.y}if(z.vx)z.x+=z.vx*dt;z.acc+=dt;
  if(z.k==='dragon'){for(const e of G.enemies)if(!e.dead&&!z.hits.includes(e)&&Math.abs(e.x-z.x)<90){z.hits.push(e);damage(e,z.dmg,120,z.x-z.vx,'ice');e.frozen=Math.max(e.frozen,z.freeze)}continue}
  if(z.pull)for(const e of G.enemies)if(!e.dead&&!e.boss&&Math.hypot(e.x-z.x,e.y-z.y)<z.r*1.4){e.x+=(z.x-e.x)*dt*1.5;e.y+=(z.y-e.y)*dt*1.5}
  if(z.acc>=z.tick&&z.dmg){z.acc=0;
   if(z.strike){const tg=G.enemies.filter(e=>!e.dead&&Math.hypot(e.x-z.x,e.y-z.y)<z.r);const e=pick(tg.length?tg:[null]);if(e){bolt(e.x,e.y-500,e.x,e.y-e.z);damage(e,z.dmg,40,z.x,'thunder');e.stun=Math.max(e.stun,z.stun)}else{bolt(z.x+rnd(-200,200),z.y-500,z.x+rnd(-200,200),z.y+rnd(-40,40))}}
   else{aoe(z.x,z.y,z.r,z.dmg,z.elem,{freeze:z.freeze,stun:z.stun,kb:20});if(z.k==='firewall')for(const e of G.enemies);}
   if(z.tick>=9)z.dmg=0}}
 G.zones=G.zones.filter(z=>z.t<z.dur);
 // 万剑归宗
 for(const s of G.swords){s.t+=dt;if(s.t>=.35&&!s.done){s.done=1;if(!s.deco&&s.e&&!s.e.dead){damage(s.e,s.dmg,60,G.p.x,null,{ult:1});G.hitstop=.03}particles(s.x,s.y,4,s.gold?'#ffd34a':'#9fe0ff',6,150)}}
 G.swords=G.swords.filter(s=>s.t<.75);
 for(const b of G.bolts)b.life-=dt;G.bolts=G.bolts.filter(b=>b.life>0);
 // 金币物理
 for(const k of G.pickups){k.t+=dt;if(k.z>0||k.vz>0){k.vz-=900*dt;k.z+=k.vz*dt;k.x+=k.vx*dt;if(k.z<=0){k.z=0;k.vz=k.vz<-80?-k.vz*.35:0;k.vx*=.5}}
  if(k.kind==='coin'&&k.t>1&&Math.hypot(k.x-p.x,k.y-p.y)<140){k.x+=(p.x-k.x)*dt*6;k.y+=(p.y-k.y)*dt*6}}
 for(const q of G.parts){q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;if(!q.num&&!q.txt)q.vz-=600*dt;if(q.z<0){q.z=0;q.vx*=.5}q.life-=dt}
 G.parts=G.parts.filter(q=>q.life>0);if(G.parts.length>500)G.parts.splice(0,G.parts.length-500);
 const qn=(G.msgQ||[]).length;for(const m of G.msgs){m.life-=dt*(qn?1.6:1);m.a=Math.min(1,(m.a||0)+dt*6)}G.msgs=G.msgs.filter(m=>m.life>0);while(G.msgs.length<3&&G.msgQ&&G.msgQ.length)G.msgs.push(G.msgQ.shift());
 if(G.popup){G.popup.t-=dt;if(G.popup.t<=0)G.popup=null}
 // 通关（看门狗：首领以任何方式死亡都必须进入结算）
 if(G.wave>=B.waves.length){G.wave=B.waves.length-1}
 if(G.clearT<=0&&!G.clearedDone&&G.boss&&G.boss.dead&&!G.boss.mini){G.clearT=2.5;G.enemies.forEach(o=>{if(!o.dead){o.hp=0;kill(o)}})}
 if(G.clearT>0){G.clearT-=dt;if(G.clearT<=0){G.clearedDone=1;stageClear()}}
}
function stageClear(){const p=G.p,S=G.S,P=PROFILE;sfx('win');
 const first=!P.cleared.includes(S.id);if(first)P.cleared.push(S.id);
 Object.assign(P,{gold:p.gold,exp:p.exp,mp:p.mp,atkLv:p.atkLv,defLv:p.defLv,prof:p.prof,plv:p.plv,spells:p.spells,sel:p.sel,flameSword:p.flameSword});
 P.unlocked=Math.max(P.unlocked,Math.min(STAGES.length,S.id+1));const tm=Math.round(G.time);const best=P.best[S.id];if(!best||tm<best)P.best[S.id]=tm;
 if(S.final){P.ngplusUnlocked=1}
 writeSave();RES={S,time:tm,gold:p.gold-G.goldStart,exp:G.expGain||0,kills:G.kills,first,best:P.best[S.id],final:!!S.final};MODE='results'}
// ---------- 绘制辅助 ----------
function txt(t,x,y,size=16,col='#fff',align='left',stroke='#000',bold=true){ctx.font=(bold?'bold ':'')+size+'px "PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif';ctx.textAlign=align;ctx.textBaseline='middle';
 if(stroke){ctx.lineWidth=Math.max(3,size/5);ctx.strokeStyle=stroke;ctx.lineJoin='round';ctx.strokeText(t,x,y)}ctx.fillStyle=col;ctx.fillText(t,x,y)}
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function bar(x,y,w,h,v,col,bg='#222'){rr(x,y,w,h,h/2);ctx.fillStyle=bg;ctx.fill();if(v>0){rr(x,y,Math.max(h,w*clamp(v,0,1)),h,h/2);ctx.fillStyle=col;ctx.fill()}rr(x,y,w,h,h/2);ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.stroke()}
function ell(x,y,rx,ry,col){ctx.beginPath();ctx.ellipse(x,y,Math.max(1,rx),Math.max(1,ry),0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill()}
function drawAtlas(A,ik,anim,t,x,y,face,sc,loop=true,fps=8){const fr=A.anims[anim]||A.anims.idle;if(!fr||!ready(ik))return;let i=Math.floor(t*fps);i=loop?i%fr.length:Math.min(i,fr.length-1);
 const f=A.frames[fr[i]];ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.translate(x,y);ctx.scale(face*sc,sc);ctx.drawImage(IMG[ik],f.x,f.y,f.w,f.h,-f.ax,-f.ay,f.w,f.h);ctx.restore()}
function hash(n){const s=Math.sin(n*127.1)*43758.5453;return s-Math.floor(s)}
// ---------- 背景 ----------
const THEME={forest:{mid:'#14202a',tree:'#0d1820'},snow:{mid:'#5a6a86',tree:'#2a3a52'},volcano:{mid:'#2a0f0c',tree:'#1a0808'},valley:{mid:'#1a3020',tree:'#0f2416'},castle:{mid:'#151527',tree:'#0b0b18'}};
function drawBG(){const S=G.S,cx=G.camX,th=THEME[S.decor]||THEME.forest;
 const g=ctx.createLinearGradient(0,0,0,300);g.addColorStop(0,S.sky[0]);g.addColorStop(1,S.sky[1]);ctx.fillStyle=g;ctx.fillRect(0,0,W,300);
 const im=IMG['far'+S.id];if(im&&ready('far'+S.id)){const sc=330/im.height,iw=im.width*sc;let ox=-((cx*.15)%iw);ctx.globalAlpha=S.farAlpha;for(let x=ox;x<W;x+=iw)ctx.drawImage(im,x,S.farY,iw,330);ctx.globalAlpha=1}
 if(G.bloodmoon){ctx.fillStyle='rgba(160,0,20,.28)';ctx.fillRect(0,0,W,300);ell(760,80,46,46,'rgba(255,40,40,.5)')}
 // 中景剪影
 ctx.fillStyle=th.tree;if(S.decor!=='valley')for(const t of trees){if(t.layer)continue;const x=t.x-cx*.45;const sx=((x%(W+400))+W+400)%(W+400)-200;
  if(S.decor==='castle'){ctx.fillRect(sx,230,t.w,60);for(let k=0;k<t.w;k+=14)ctx.fillRect(sx+k,222,8,10)}
  else if(S.decor==='volcano'){ctx.beginPath();ctx.moveTo(sx-t.w,290);ctx.lineTo(sx,290-90*t.h);ctx.lineTo(sx+t.w*.6,290);ctx.fill()}
  else{ctx.beginPath();ctx.moveTo(sx-t.w*.6,292);ctx.lineTo(sx,292-120*t.h);ctx.lineTo(sx+t.w*.6,292);ctx.fill()}}
 // 地面
 const gb=ctx.createLinearGradient(0,280,0,H);gb.addColorStop(0,S.ground.edge);gb.addColorStop(1,S.ground.base);ctx.fillStyle=gb;ctx.fillRect(0,282,W,H-282);
 ctx.fillStyle=S.ground.path;ctx.fillRect(0,LANE_TOP-24,W,LANE_BOT-LANE_TOP+48);
 ctx.fillStyle=S.ground.pathHi;for(let i=Math.floor(cx/64)-1;i<(cx+W)/64+1;i++){for(let r=0;r<4;r++){const h=hash(i*7+r);const x=i*64+h*50-cx,y=LANE_TOP-10+r*46+hash(i+r*3)*20;
  if(S.decor==='castle'){ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=2;ctx.strokeRect(x,y,40+h*14,22);ctx.fillRect(x+2,y+2,30,4)}
  else ell(x,y,10+h*14,3+h*3,S.ground.pathHi)}}
 if(S.decor==='volcano'){ctx.save();ctx.globalCompositeOperation='lighter';const pul=.5+.5*Math.sin(G.t*2);for(let i=Math.floor(cx/150)-1;i<(cx+W)/150+1;i++){const x=i*150-cx+hash(i)*60,y=LANE_TOP+hash(i*3)*(LANE_BOT-LANE_TOP);
  ctx.strokeStyle=`rgba(255,${90+hash(i)*60|0},20,${.25+.35*pul})`;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+30,y+8);ctx.lineTo(x+55,y+2);ctx.lineTo(x+80,y+12);ctx.stroke()}ctx.restore()}
 if(S.decor==='castle'){const sh=ctx.createLinearGradient(0,LANE_TOP,0,LANE_BOT);sh.addColorStop(0,'rgba(170,190,255,.10)');sh.addColorStop(.5,'rgba(170,190,255,.02)');sh.addColorStop(1,'rgba(170,190,255,.08)');ctx.fillStyle=sh;ctx.fillRect(0,LANE_TOP-24,W,LANE_BOT-LANE_TOP+48)}
 if(S.decor==='snow'){ctx.fillStyle='rgba(255,255,255,.35)';for(let i=Math.floor(cx/90)-1;i<(cx+W)/90+1;i++)ell(i*90-cx+hash(i)*40,LANE_TOP+hash(i*5)*170,30,6,'rgba(255,255,255,.25)')}
 // 分段：桥/河/大厅
 for(const s of G.B.segs){const x0=s.x0-cx,x1=s.x1-cx;if(x1<0||x0>W)continue;
  if(s.type==='bridge'){const voidCol=S.decor==='volcano'?'#3a0a04':S.decor==='valley'?'#1d4a5a':'#07070e';ctx.fillStyle=voidCol;ctx.fillRect(x0,LANE_TOP-26,x1-x0,LANE_BOT-LANE_TOP+52);
   if(S.decor==='volcano'){ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(255,80,10,${.25+.1*Math.sin(G.t*3)})`;ctx.fillRect(x0,LANE_TOP-26,x1-x0,LANE_BOT-LANE_TOP+52);ctx.restore()}
   if(S.decor==='valley'){ctx.strokeStyle='rgba(200,240,255,.3)';for(let k=0;k<12;k++){const yy=LANE_TOP+hash(k)*170,xx=x0+((hash(k*3)*(x1-x0)+G.t*40)%(x1-x0));ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx+30,yy);ctx.stroke()}}
   ctx.fillStyle=S.decor==='castle'?'#3c3a44':'#5a3a20';ctx.fillRect(x0,s.top-16,x1-x0,s.bot-s.top+32);ctx.strokeStyle='rgba(0,0,0,.45)';ctx.lineWidth=2;
   for(let x=x0-((x0+cx)%26);x<x1;x+=26){ctx.beginPath();ctx.moveTo(x,s.top-16);ctx.lineTo(x,s.bot+16);ctx.stroke()}
   ctx.fillStyle='#222';for(const yy of[s.top-18,s.bot+14]){ctx.fillRect(x0,yy,x1-x0,4)}for(let x=x0+40;x<x1;x+=160){ctx.fillStyle='#2a1a10';ctx.fillRect(x,s.top-46,8,34);ctx.fillRect(x,s.bot+6,8,34)}}
  if(s.type==='river'){ctx.fillStyle='rgba(60,140,190,.45)';ctx.fillRect(x0,s.top,x1-x0,s.bot-s.top);ctx.strokeStyle='rgba(220,250,255,.35)';ctx.lineWidth=2;
   for(let k=0;k<16;k++){const yy=s.top+hash(k)*(s.bot-s.top),xx=x0+((hash(k*7)*(x1-x0)+G.t*30)%(x1-x0));ctx.beginPath();ctx.moveTo(xx,yy);ctx.quadraticCurveTo(xx+12,yy-3,xx+24,yy);ctx.stroke()}}
  if(s.type==='hall'){ctx.fillStyle='#4a0a14';ctx.fillRect(x0,(LANE_TOP+LANE_BOT)/2-30,x1-x0,60);ctx.fillStyle='#c9a040';ctx.fillRect(x0,(LANE_TOP+LANE_BOT)/2-32,x1-x0,3);ctx.fillRect(x0,(LANE_TOP+LANE_BOT)/2+29,x1-x0,3);
   for(let x=x0-((x0+cx)%220);x<x1;x+=220){ctx.fillStyle='#1a1424';ctx.fillRect(x,120,34,LANE_TOP-110);ctx.fillStyle='#2a2238';ctx.fillRect(x+4,120,8,LANE_TOP-110)}}}
 // 熔岩边缘缩圈
 if(G.shrink>1){ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle='rgba(255,70,0,.55)';ctx.fillRect(0,LANE_TOP-24,W,G.shrink+24);ctx.fillRect(0,LANE_BOT-G.shrink,W,G.shrink+24);ctx.restore()}
}
// ---------- 道具/装饰 ----------
const PROPSET={
 forest:{lamps:['lamp_wood','lamp_stonehang','brazier'],mid:['bush_dark','grass_fern','bush_blue','bush_dark'],edge:['grass_fern','grass_green'],fg:['bush_dark','grass_fern','bush_blue']},
 snow:{lamps:['lamp_crystal'],mid:['bush_snow','grass_frost','grass_frost'],edge:['grass_frost'],fg:['bush_snow','grass_frost']},
 volcano:{lamps:['brazier'],mid:['grass_dry','grass_dry','grass_dry','bush_red'],edge:['grass_dry'],fg:['grass_dry','grass_dry','bush_red'],sparse:1},
 valley:{lamps:['lamp_wood','lamp_stonehang','lamp_wall'],mid:['bush_flower','bush_yellow','grass_pampas','grass_fern','grass_flower','grass_green'],edge:['grass_flower','grass_green','grass_fern'],fg:['grass_fern','grass_pampas','bush_flower','grass_green']},
 castle:{lamps:['lamp_gothic','lamp_wall'],mid:['bush_red'],edge:['bush_red'],fg:['bush_red'],sparse:1}};
const GLOWCOL={lamp_wood:'255,170,70',lamp_stonehang:'255,165,60',lamp_iron:'255,190,100',lamp_wall:'255,160,60',lamp_crystal:'110,180,255',brazier:'255,120,30',lamp_gothic:'255,40,40'};
const GLOWC={};function glowTex(c){if(GLOWC[c])return GLOWC[c];const cv=document.createElement('canvas');cv.width=cv.height=128;const g=cv.getContext('2d');const gr=g.createRadialGradient(64,64,0,64,64,64);
 gr.addColorStop(0,`rgba(${c},.9)`);gr.addColorStop(.25,`rgba(${c},.45)`);gr.addColorStop(.6,`rgba(${c},.12)`);gr.addColorStop(1,`rgba(${c},0)`);g.fillStyle=gr;g.fillRect(0,0,128,128);return GLOWC[c]=cv}
// 玩家被前景道具遮挡时淡出（不影响可读性）
function propFade(o,sx,f,s){const p=G.p;if(!p)return 1;const px=p.x-G.camX,py=p.y-(p.z||0),x0=sx-f.ax*s,x1=sx+(f.w-f.ax)*s,y0=o.y-f.ay*s;
 const hit=px+28>x0&&px-28<x1&&py>y0+8&&py-125<o.y&&py<o.y+40;o.fade+=((hit?.32:1)-o.fade)*.18;return o.fade}
function drawPropSpr(o,x){const A=window.PROPS_ATLAS,f=A&&A.frames[o.k];if(!f||!ready('props')||x<-260||x>W+260)return;const s=o.s,t=G.t+o.fl*1.7;
 const al=o.fade!=null?propFade(o,x,f,s):1;ctx.save();ctx.globalAlpha=al;ctx.translate(x,o.y);
 if(o.lamp){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.3*al;ctx.drawImage(glowTex(GLOWCOL[o.k]),-130*s,-30*s,260*s,60*s);ctx.restore()}
 ctx.save();ctx.scale(s*o.flip,s);ctx.drawImage(IMG.props,f.x,f.y,f.w,f.h,-f.ax,-f.ay,f.w,f.h);
 if(o.k==='brazier'){const g=A.frames.brazier_flame,L=f.lights[0];ctx.translate(L[0],L[1]+f.h*.16);ctx.transform(1,0,.07*Math.sin(t*6.5)+.04*Math.sin(t*15),1,0,0);
  ctx.scale(1+.05*Math.sin(t*9),1+.13*Math.sin(t*11)+.07*Math.sin(t*23));ctx.globalCompositeOperation='lighter';ctx.globalAlpha=al*(.5+.25*Math.sin(t*13));ctx.drawImage(IMG.props,g.x,g.y,g.w,g.h,-g.ax,-g.ay,g.w,g.h)}
 ctx.restore();
 if(o.lamp&&f.lights){const fk=.86+.09*Math.sin(t*8.3)+.05*Math.sin(t*21.7),c=GLOWCOL[o.k],tex=glowTex(c),big=o.k==='brazier'?1.35:1;ctx.globalCompositeOperation='lighter';
  for(const [lx,ly] of f.lights){const gx=lx*s*o.flip,gy=ly*s,R=125*s*fk*big;ctx.globalAlpha=al*.7*fk;ctx.drawImage(tex,gx-R,gy-R,R*2,R*2);ctx.globalAlpha=al*.5;const r2=26*s*fk*big;ctx.drawImage(tex,gx-r2,gy-r2,r2*2,r2*2)}
  if(o.k==='brazier'&&Math.random()<.12)particles(o.x+f.lights[0][0]*s*o.flip,o.y-1,-f.lights[0][1]*s+12,Math.random()<.5?'#ffb040':'#ff7020',1,45)}
 ctx.restore()}
function drawProp(o,x){if(o.type==='spr'){drawPropSpr(o,x);return}const y=o.y,s=o.s;ctx.save();ctx.translate(x,y);ctx.scale(s,s);
 const flick=.8+.2*Math.sin(G.t*13+o.x);
 switch(o.type){
  case 'torch':case 'brazier':ctx.fillStyle='#2a1a12';ctx.fillRect(-4,-70,8,70);ctx.fillStyle='#4a3020';ctx.fillRect(-12,-78,24,10);ctx.globalCompositeOperation='lighter';
   const gr=ctx.createRadialGradient(0,-88,2,0,-88,70*flick);gr.addColorStop(0,'rgba(255,190,90,.55)');gr.addColorStop(1,'rgba(255,90,20,0)');ctx.fillStyle=gr;ctx.fillRect(-80,-160,160,160);
   ctx.fillStyle='#ffb040';ctx.beginPath();ctx.ellipse(0,-90,8*flick,16*flick,0,0,7);ctx.fill();ctx.fillStyle='#fff3c0';ctx.beginPath();ctx.ellipse(0,-86,4,8,0,0,7);ctx.fill();break;
  case 'crystal':ctx.globalCompositeOperation='lighter';ctx.fillStyle='rgba(120,200,255,.35)';ctx.beginPath();ctx.ellipse(0,-20,40,30,0,0,7);ctx.fill();ctx.globalCompositeOperation='source-over';
   ctx.fillStyle='#4aa8e8';ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(-4,-50);ctx.lineTo(6,0);ctx.fill();ctx.fillStyle='#8fd8ff';ctx.beginPath();ctx.moveTo(2,0);ctx.lineTo(14,-34);ctx.lineTo(20,0);ctx.fill();break;
  case 'rock':case 'icerock':case 'mossrock':ctx.fillStyle=o.type==='icerock'?'#a8c0dc':o.type==='mossrock'?'#3a4a3a':'#2a2a34';ctx.beginPath();ctx.ellipse(0,-10,34,18,0,0,7);ctx.fill();
   if(o.type==='mossrock'){ctx.fillStyle='#4a8a3a';ctx.beginPath();ctx.ellipse(-4,-22,22,7,0,0,7);ctx.fill()}break;
  case 'pine':ctx.fillStyle='#24384e';for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-34+i*6,-20-i*30);ctx.lineTo(0,-70-i*30);ctx.lineTo(34-i*6,-20-i*30);ctx.fill()}ctx.fillStyle='#e8f0ff';ctx.fillRect(-20,-52,40,4);break;
  case 'lantern':ctx.fillStyle='#3a2a1a';ctx.fillRect(-3,-60,6,60);ctx.fillStyle='#ffcc66';ctx.globalCompositeOperation='lighter';ctx.beginPath();ctx.arc(0,-66,10*flick,0,7);ctx.fill();ctx.fillStyle='rgba(255,200,100,.18)';ctx.beginPath();ctx.arc(0,-66,40,0,7);ctx.fill();break;
  case 'pillar':ctx.fillStyle='#2a1a16';ctx.fillRect(-14,-120,28,120);ctx.fillStyle='#ff6a20';ctx.globalCompositeOperation='lighter';ctx.fillRect(-2,-110,3,80);break;
  case 'chainpost':ctx.fillStyle='#1a1414';ctx.fillRect(-6,-60,12,60);ctx.strokeStyle='#555';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-56);ctx.quadraticCurveTo(60,-20,120,-56);ctx.stroke();break;
  case 'banner':ctx.fillStyle='#1a1414';ctx.fillRect(-3,-140,6,140);ctx.fillStyle=G.S.decor==='castle'?'#7a0a1a':'#8a2010';ctx.beginPath();ctx.moveTo(3,-136);ctx.lineTo(44,-136);ctx.lineTo(44,-60);ctx.lineTo(24,-74);ctx.lineTo(3,-60);ctx.fill();ctx.fillStyle='#d0a040';ctx.fillRect(18,-118,10,10);break;
  case 'fern':ctx.strokeStyle='#2f6a2a';ctx.lineWidth=3;for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(i*12,-30,i*22,-36+Math.abs(i)*5);ctx.stroke()}break;
  case 'gargoyle':ctx.fillStyle='#1c1c26';ctx.fillRect(-18,-60,36,60);ctx.beginPath();ctx.moveTo(-24,-60);ctx.lineTo(-40,-100);ctx.lineTo(-6,-80);ctx.lineTo(0,-96);ctx.lineTo(6,-80);ctx.lineTo(40,-100);ctx.lineTo(24,-60);ctx.fill();ctx.fillStyle='#c02020';ctx.fillRect(-6,-86,3,3);ctx.fillRect(3,-86,3,3);break;
  case 'ivy':ctx.fillStyle='#7a0a14';for(let i=0;i<9;i++){ctx.beginPath();ctx.ellipse(hash(i+o.x)*60-30,-hash(i*3+o.x)*50,7,4,hash(i)*3,0,7);ctx.fill()}break;
 }ctx.restore()}
// ---------- 实体绘制 ----------
const GOB_FACE=1;
function shadow(x,y,r,a=.35){ell(x,y,r,r*.32,`rgba(0,0,0,${a})`)}
const HIT={1:[.30,82,1,60],2:[.30,85,1.1,70],3:[.33,95,1.4,140],4:[.33,100,1.5,170]};// [时长, 距离, 伤害倍率, 击退]
function heroAnim(p){
 if(p.dead)return ['down',Math.min(1,p.deadT/.6)];if(p.hurtT>0)return ['hurt',1-p.hurtT/.3];if(p.specialT>0)return ['ult',0];
 if(p.castT>0)return [p.castAnim,1-p.castT/.35];
 if(p.dashT>0){const q=1-p.dashT/p.dashDur;return ['thrust',(q<.08?0:q<.16?1:q<.42?2:q<.74?3:q<.88?4:5)/6+.01]}
 if(p.spinT>0)return ['spin',1-p.spinT/p.spinDur];
 if(p.atkT>0){const k={1:'atk1',2:'atk2',3:'atk3',4:'atk4',9:'downslash'}[p.combo]||'atk1';return [k,1-p.atkT/p.atkDur]}
 if(p.jHold>.3)return ['charge',0];
 // 跳跃 6 帧：起跳下蹲 → 上升 → 顶点收腿 → 下落 → 伸腿 → 落地缓冲（脚底基线在帧内，高度由 p.z 提供）
 if(p.z>0)return ['jump',(p.jt<.07?0:p.vz>180?1:p.vz>-120?2:p.vz>-380?3:4)/6+.01];if(p.landT>0)return ['jump',.99];
 if(p.moving)return ['walk',(p.walk*1.5)%1];return ['idle',(G.t*8/6)%1]}// 走 12fps（8 帧/0.67s，配合 200px/s），待机 8fps
// 补间：给帧数少的动作加挤压/位移，避免单帧停顿
function heroTween(p,a,pr){const e=Math.sin(Math.min(1,pr)*Math.PI);let ox=0,oy=0,qx=1,qy=1,rot=0;
 if(a==='idle'||a==='walk'||/^atk[1-4]$/.test(a)){}// 新逐帧动画自带动作，不再补间
 else if(/^atk|upslash|downslash/.test(a)){const k=pr<.18?pr/.18:1;ox=(k*10-(pr>.6?(pr-.6)*14:0));qx=1+.05*e;qy=1-.04*e;if(a==='downslash'){rot=.12*e;oy=6*e}if(a==='upslash')oy=-6*e}
 else if(a==='thrust'||a==='spin'||a==='jump'){}// 新逐帧动画（ref/jump、thrust、whirlwind），不补间
 else if(a==='charge'||a==='wavecast'){qy=1+.03*Math.sin(G.t*18);qx=1-.02*Math.sin(G.t*18);if(a==='wavecast')ox=10*e}
 else if(a==='ult'){qy=1+.05*e;qx=1-.03*e;oy=-6*e}
 else if(a==='hurt'){ox=-5*e}
 return {ox,oy,qx,qy,rot}}
function drawHero(p,sx){const [a,pr]=heroAnim(p);const fr=HERO_ATLAS.anims[a];const name=fr[Math.min(fr.length-1,Math.floor(pr*fr.length))];const tw=heroTween(p,a,pr);
 shadow(sx,p.y,26-Math.min(12,p.z/10));const y=p.y-p.z;
 if(p.specialT>0){ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(sx,y-60,5,sx,y-60,120);g.addColorStop(0,p.plv>=5?'rgba(255,220,100,.6)':'rgba(140,220,255,.55)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(sx-130,y-190,260,260);ctx.restore()}
 if(p.jHold>.3&&p.plv>=4){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.4+.3*Math.sin(G.t*20);ell(sx,y-50,40,56,'rgba(120,200,255,.35)');ctx.restore()}
 if(p.dashT>0&&p.dashT<p.dashDur*.86){ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createLinearGradient(sx-p.face*110,0,sx,0);g.addColorStop(0,'rgba(120,200,255,0)');g.addColorStop(1,'rgba(150,220,255,.35)');ctx.fillStyle=g;ctx.fillRect(Math.min(sx,sx-p.face*110),y-70,110,40);ctx.restore()}
 const blink=p.inv>0&&!p.specialT&&!p.dashT&&Math.floor(G.t*16)%2;drawHeroFrame(name,sx+p.face*tw.ox,y+tw.oy,p.face,HS,blink?.6:1,tw.qx,tw.qy,tw.rot);
 // 剑光（装备升级=更亮更大，烈炎剑=火焰）
 if(p.atkT>0||p.spinT>0){const pr2=p.spinT>0?1-p.spinT/p.spinDur:1-p.atkT/p.atkDur;const sc=.7+.07*Math.min(5,p.atkLv);const al=Math.sin(pr2*Math.PI)*(.55+.08*Math.min(5,p.atkLv));
  if(p.spinT>0){fx('sword_slash',sx+40,y-45,sc*1.2,al,1,pr2*6);fx('sword_slash',sx-40,y-45,sc*1.2,al,-1,-pr2*6)}
  else fx('sword_slash',sx+p.face*52,y-({2:56,3:36,4:52,9:25}[p.combo]||48),sc*(p.combo===4?1.15:1),al,p.face,({2:-.35,3:.25,4:-.15,9:.6}[p.combo]||0)*p.face);
  if(p.flameSword)fx('fireball_s',sx+p.face*52,y-50,1.1,al*.8,p.face)}
 if(p.flameSword&&!p.dead)fx('fireball_s',sx+p.face*30,y-60+Math.sin(G.t*8)*3,.35,.35+.15*Math.sin(G.t*11))}
function enemyAnim(e){const d=e.def;if(e.dead)return ['death',e.deadT,false,6];if(e.hurtT>0)return ['hurt',.12,false,8];
 const sh=d.shape;
 if(sh==='bat'){if(e.state==='dive')return ['attack',e.t,false,9];return ['fly',e.at,true,10]}
 if(sh==='snowboss'){const P=e.pat,T=e.patT||0;
  if(P==='snowballs'||P==='blizzard')return ['throw',T,true,P==='blizzard'?9:6];
  if(P==='slam')return T<.95?['attack',0,false,1]:['shock',(T-.95),false,7];
  if(P==='hammer'||P==='roll'){const w=P==='hammer'?.6:.8;return ['attack',T<w?0:1,false,1]}
  if(P==='summon')return ['summon',T,true,4];
  if(e.moving)return ['walk',e.at,true,curPhase(e)&&curPhase(e).enrage?11:8];return ['idle',e.at,true,6]}
 if(sh==='snow'){if(d.ai==='ranged'&&e.state==='strike')return ['throw',e.t,false,11];if(d.ai==='ranged'&&e.cd<.3&&!e.moving)return ['throw',0,false,1];
  if(e.state==='wind')return ['attack',0,false,1];if(e.state==='strike')return ['attack',1,false,1];if(e.state==='leap')return ['attack',1,false,1];
  if(e.moving)return ['walk',e.at,true,d.ai==='fast'?13:9];return ['idle',e.at,true,6]}
 if(e.boss&&e.pat){const T=e.patT;if(sh==='big'){if(e.pat==='smash')return ['smash',T*.9,false,4];if(e.pat==='leap')return ['leap',T,false,3];if(['combo','sweep'].includes(e.pat))return ['attack',T*1.3,true,8];if(e.pat==='charge')return ['run',T,true,10];return ['idle',T,true,6]}
  if(sh==='vamp'){if(['bloodPillars','bloodOrbs','bloodBurst','batSwarm'].includes(e.pat))return ['attack2',T,false,4];if(e.pat==='lunge')return ['attack2',.6+T,false,6];return ['attack',T*1.6,true,8]}}
 if(e.state==='wind'||e.state==='strike'){const T=e.state==='wind'?e.t/e.wind*.5:.5+e.t;if(sh==='big'&&e.atkType==='smash')return ['smash',T*1.5,false,4];return ['attack',T*1.8,false,5]}
 if(e.state==='leap')return [sh==='big'?'leap':'jumpatk',e.t,false,6];
 if(e.moving)return [d.ai==='fast'||e.boss&&curPhase(e).enrage?'run':'walk',e.at,true,8];return ['idle',e.at,true,5]}
// 大雪人：ref/snowboss_sheet.png 动作帧（BiRefNet 抠图）+ 帧间补间（稀疏帧靠挤压/位移/旋转过渡）
function drawBossFrame(name,x,y,face,sx,sy){const A=SNOWBOSS_ATLAS,f=A.frames[name];if(!f||!ready('snowboss'))return;ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.translate(x,y);ctx.scale(face*sx,sy);ctx.drawImage(IMG.snowboss,f.x,f.y,f.w,f.h,-f.ax,-f.ay,f.w,f.h);ctx.restore()}
function bossPose(e){const P=e.pat,T=e.patT||0,o={fr:'idle',dx:0,dy:0,qx:1,qy:1,rot:0,glow:0,arc:0};const br=Math.sin(G.t*3);
 if(e.dead){const k=Math.min(1,e.deadT/.35);o.fr=e.deadT<.25?'shock':'death';if(e.deadT<.25){o.qy=1-.1*k}else{const j=Math.min(1,(e.deadT-.25)/.2);o.qy=.85+.15*j;o.dy=6*(1-j)}return o}
 if(P==='hammer'){if(T<.6){const k=T/.6;o.fr='swing';o.rot=-.1*k;o.qy=1+.04*k;o.dx=-e.face*8*k}
  else{const k=Math.min(1,(T-.6)/.08),r=Math.max(0,1-(T-.75)/.4);o.fr='shock';o.dx=e.face*(18*k*Math.min(1,r+.3));o.qy=1-.08*k*r;o.qx=1+.06*k*r;o.rot=.06*k*r;o.arc=T<.92?1-(T-.6)/.32:0}}
 else if(P==='slam'){if(T<.22){const k=T/.22;o.fr='idle';o.qy=1-.12*k;o.qx=1+.08*k}else if(T<.95){const k=(T-.22)/.73;o.fr='smash';o.dy=-Math.sin(k*Math.PI)*70;o.rot=-.06+.12*k}
  else{const r=Math.max(0,1-(T-.95)/.35);o.fr='shock';o.qy=1-.14*r;o.qx=1+.1*r}}
 else if(P==='iceSummon'||P==='summon'){const k=Math.min(1,T/.3);o.fr=T<.12?'idle':'summon';o.qy=.9+.1*k+.02*br;o.dx=T>.3?Math.sin(G.t*40)*2.5:0;o.glow=.12+.08*Math.sin(G.t*10)}
 else if(P==='frostwave'){if(T<.6){const k=T/.6;o.fr='summon';o.qy=1+.05*k;o.dy=-14*Math.sin(k*Math.PI*.5);o.glow=.2*k}else{const r=Math.max(0,1-(T-.6)/.35);o.fr='shock';o.qy=1-.14*r;o.qx=1+.1*r;o.glow=.25*r}}
 else if(P==='snowballs'||P==='blizzard'){const per=P==='blizzard'?.14:.6;if(T<.55){const k=T/.55;o.fr='summon';o.qy=.94+.06*k;o.rot=-.06*k}else{const ph=((T-.55)/per)%1;o.fr=ph<.55?'throw':'summon';o.rot=ph<.55?.05*(1-ph/.55):-.04;o.dx=ph<.55?e.face*8*(1-ph/.55):0}}
 else if(P==='roll'){o.fr=T<.8?'swing':'throw';if(T>=.8){const r=Math.max(0,1-(T-.8)/.4);o.dx=e.face*12*r}}
 else if(e.moving){const i=Math.floor(e.at*5)%4;o.fr=['walk_0','walk_1','walk_2','walk_1'][i];const w=Math.sin(e.at*5*Math.PI/2);o.dy=-Math.abs(w)*4;o.rot=.02*w}
 else{o.fr='idle';o.qy=1+.025*br;o.qx=1-.012*br}
 if(e.hurtT>0){o.rot-=.05;o.dx-=e.face*4}
 if(curPhase(e)&&curPhase(e).enrage&&!o.glow)o.glow=.08+.05*Math.sin(G.t*6);return o}
function drawEnemy(e,sx){const d=e.def,sh=d.shape;const y=e.y-e.z;if(e.hidden){return}
 const alpha=e.dead?clamp((sh==='snowboss'?2.4:1.2)-e.deadT,0,1):1;ctx.save();ctx.globalAlpha=alpha;
 shadow(sx,e.y,22*e.r*(d.fly?.7:1),d.fly?.25:.35);
 const [an,t,loop,fps]=enemyAnim(e);
 if(sh==='gob'||sh==='big'||sh==='bat'||sh==='vamp'||sh==='snow'||sh==='snowboss'){const A={gob:GOBLIN_ATLAS,big:BIGGOBLIN_ATLAS,bat:BAT_ATLAS,vamp:VAMPIRE_ATLAS,snow:SNOWMAN_ATLAS,snowboss:SNOWBOSS_ATLAS}[sh];const ik=sh;
  const base={gob:1.35,big:1.7,bat:1.5,vamp:1.55,snow:.85*e.r,snowboss:.9}[sh];let sc=base*(e.sc||1);
  const an2=A.anims[an]?an:'idle';
  if(e.frozen>0)ctx.filter='saturate(.2) brightness(1.3) hue-rotate(160deg)';else if(e.hurtT>0)ctx.filter='brightness(2)';else if(e.stun>0)ctx.filter='brightness(1.3)';else if(d.tintF)ctx.filter=d.tintF;
  if(d.tintF&&!e.dead){ctx.save();ctx.globalCompositeOperation='lighter';ell(sx,y-45*e.r,30*e.r,40*e.r,'rgba(90,170,255,.13)');ctx.restore()}
  if(sh==='snowboss'&&e.pat==='slam'&&e.patT<.95){ctx.save();ctx.globalCompositeOperation='lighter';ell(sx+e.face*40,y,60*e.patT+20,(60*e.patT+20)*.3,`rgba(140,210,255,${.25*e.patT})`);ctx.restore()}
  if(sh==='snowboss'){const q=bossPose(e);ctx.save();ctx.translate(sx+q.dx,y+q.dy);ctx.rotate(q.rot*e.face);ctx.scale(q.qx,q.qy);
   if(q.glow){ctx.save();ctx.globalCompositeOperation='lighter';ell(0,-95,95,110,`rgba(120,200,255,${q.glow})`);ctx.restore()}
   drawBossFrame(q.fr,0,0,e.face*GOB_FACE,sc,sc);ctx.restore();
   if(q.arc>0){ctx.save();const cx=sx+e.face*40,cy=y-80,a0=e.face>0?-1.7:Math.PI-1.1,a1=e.face>0?1.1:Math.PI+1.7;ctx.lineCap='round';for(const [lw,c] of [[22,'rgba(90,170,255,'+(.35*q.arc)+')'],[12,'rgba(200,240,255,'+(.8*q.arc)+')'],[4,'rgba(255,255,255,'+q.arc+')']]){ctx.strokeStyle=c;ctx.lineWidth=lw*(.5+.5*q.arc);ctx.beginPath();ctx.ellipse(cx,cy,130,95,0,a0,a1,e.face<0);ctx.stroke()}ctx.restore()}}
  else drawAtlas(A,ik,an2,loop?t:t,sx,y,e.face*GOB_FACE,sc,loop,fps);ctx.filter='none';
  if(d.tint||(d.phases&&e.boss&&e.def.tint)){/* 色调靠光晕表现 */ctx.save();ctx.globalCompositeOperation='lighter';ell(sx,y-40*e.r,26*e.r,34*e.r,'rgba(160,0,40,.12)');ctx.restore()}
  if(d.gear==='spear'){ctx.strokeStyle='#8a6a3a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(sx-e.face*10,y-34);ctx.lineTo(sx+e.face*46,y-46);ctx.stroke();ctx.fillStyle='#cfd8e0';ctx.beginPath();ctx.moveTo(sx+e.face*46,y-50);ctx.lineTo(sx+e.face*58,y-47);ctx.lineTo(sx+e.face*46,y-42);ctx.fill()}
  if(d.gear==='bow'){ctx.strokeStyle='#6a4a2a';ctx.lineWidth=3;ctx.beginPath();ctx.arc(sx+e.face*16,y-40,18,-1.3,1.3,e.face<0);ctx.stroke()}
 }else drawProc(e,sx,y,an,t);
 if(e.frozen>0){ctx.globalAlpha=.5*alpha;ell(sx,y-36*e.r,26*e.r,40*e.r,'rgba(170,230,255,.6)')}
 if(e.stun>0)txt('⚡',sx,y-90*e.r,14,'#ffe060','center');
 if(e.cool>0)txt('破绽',sx,y-90*e.r,14,'#ffd34a','center');
 ctx.restore();
 if(!e.dead&&!e.boss&&e.hp<e.maxhp){bar(sx-22*e.r,y-(d.fly?60:95)*e.r*(sh==='big'?e.sc*1.2:1),44*e.r,6,e.hp/e.maxhp,d.elite?'#ff9a40':'#e04040')}}
function drawProc(e,sx,y,an,t){const d=e.def,r=e.r,f=e.face;const bob=an==='walk'||an==='run'?Math.sin(e.at*12)*2:0;ctx.save();ctx.translate(sx,y+bob);ctx.scale(f*r,r);
 if(e.frozen>0)ctx.filter='saturate(.3) brightness(1.3)';if(e.hurtT>0)ctx.filter='brightness(2)';const atkP=an==='attack'?Math.min(1,t):0;
 const O=(c,w=2)=>{ctx.fillStyle=c;ctx.fill();ctx.lineWidth=w;ctx.strokeStyle=OUT;ctx.stroke()};
 switch(d.shape){
  case 'beast':ctx.beginPath();ctx.ellipse(0,-22,28,14,0,0,7);O(d.col);ctx.beginPath();ctx.ellipse(26,-32,12,9,-.3,0,7);O(d.col);ctx.beginPath();ctx.moveTo(30,-40);ctx.lineTo(34,-52);ctx.lineTo(38,-38);O(d.col);
   for(const lx of[-18,-8,12,20]){ctx.fillStyle=d.col;ctx.fillRect(lx,-12,5,12+Math.sin(e.at*14+lx)*2)}ctx.fillStyle='#4af';ctx.fillRect(30,-35,3,3);if(e.boss){ctx.fillStyle='#bfe8ff';ctx.beginPath();ctx.moveTo(-10,-34);ctx.lineTo(-4,-48);ctx.lineTo(2,-34);ctx.fill()}break;
  case 'warrior':ctx.beginPath();ctx.rect(-14,-56,28,40);O(d.col);ctx.beginPath();ctx.arc(0,-66,12,0,7);O('#3a2a28');ctx.beginPath();ctx.moveTo(-10,-74);ctx.lineTo(-18,-90);ctx.lineTo(-4,-76);ctx.moveTo(10,-74);ctx.lineTo(18,-90);ctx.lineTo(4,-76);O(d.horn);
   ctx.fillStyle='#ff4020';ctx.fillRect(2,-68,3,3);ctx.fillRect(7,-68,3,3);ctx.fillStyle='#222';ctx.fillRect(-12,-16,9,16);ctx.fillRect(3,-16,9,16);
   ctx.save();ctx.rotate(-.4+atkP*1.6);ctx.fillStyle=d.weapon;ctx.fillRect(8,-60,6,-(e.boss?70:50));ctx.restore();
   if(d.ai==='shield'){ctx.beginPath();ctx.ellipse(18,-38,8,20,0,0,7);O('#5a5a6a')}
   if(d.flame){ctx.restore();ctx.save();fx('fireball_s',sx+f*r*30,y-r*90,.5*r,.5+.2*Math.sin(G.t*9));}break;
  case 'caster':ctx.beginPath();ctx.moveTo(-16,0);ctx.lineTo(-10,-50);ctx.lineTo(10,-50);ctx.lineTo(16,0);O(d.robe);ctx.beginPath();ctx.arc(0,-58,10,0,7);O(d.col);ctx.beginPath();ctx.moveTo(-12,-62);ctx.lineTo(0,-84);ctx.lineTo(12,-62);O(d.robe);
   ctx.fillStyle='#4a3a2a';ctx.fillRect(14,-70,3,70);ctx.restore();ctx.save();ctx.globalCompositeOperation='lighter';ell(sx+f*r*15,y-r*74,8+atkP*6,8+atkP*6,d.orb);break;
  case 'golem':ctx.beginPath();ctx.ellipse(0,-34,26,30,0,0,7);O(d.col,3);ctx.beginPath();ctx.ellipse(0,-70,14,11,0,0,7);O(d.col,3);ctx.beginPath();ctx.ellipse(22-atkP*4,-30+atkP*10,10,18,0,0,7);O(d.col,3);
   if(d.lava||e.cool>0){ctx.strokeStyle=e.cool>0?'#ffd34a':'#ff6a10';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-10,-50);ctx.lineTo(0,-30);ctx.lineTo(-6,-14);ctx.stroke()}ctx.fillStyle='#ff3';ctx.fillRect(4,-73,4,3);break;
  case 'imp':ctx.beginPath();ctx.arc(0,-20,14,0,7);O(d.col);ctx.beginPath();ctx.moveTo(-8,-30);ctx.lineTo(-12,-42);ctx.lineTo(-2,-32);ctx.moveTo(8,-30);ctx.lineTo(12,-42);ctx.lineTo(2,-32);O('#2a0a04');ctx.fillStyle='#ffd34a';ctx.fillRect(3,-24,3,3);ctx.fillRect(8,-24,3,3);
   ctx.restore();ctx.save();fx('fireball_s',sx,y-r*24,.6*r,.35+.2*Math.sin(G.t*13+e.ofs*9));break;
  case 'yeti':drawYeti(e,an,t);break;
  case 'banner':ctx.fillStyle='#3a2a1a';ctx.fillRect(-3,-110,6,110);ctx.beginPath();ctx.moveTo(3,-108);ctx.lineTo(50+Math.sin(G.t*4)*4,-100);ctx.lineTo(46,-60);ctx.lineTo(3,-66);O('#a02020');ctx.fillStyle='#ffd34a';ctx.fillRect(18,-92,12,12);break;
 }ctx.restore()}
function furBlob(cx,cy,rx,ry,n,j,seed){ctx.beginPath();for(let i=0;i<=n;i++){const a=i/n*Math.PI*2;const k=i%2?1:1-j*(.6+.4*Math.sin(seed+i*1.7));const x=cx+Math.cos(a)*rx*k,y=cy+Math.sin(a)*ry*k;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath()}
function drawYeti(e,an,t){const d=e.def,L=3.2/Math.sqrt(e.r);const fur=d.col,shade='#b8cce6',face=d.face,dark='#1d2a4a';
 const F=(c)=>{ctx.fillStyle=c;ctx.fill();ctx.lineWidth=L;ctx.strokeStyle=OUT;ctx.lineJoin='round';ctx.stroke()};
 const walk=an==='walk'||an==='run'?Math.sin(e.at*(an==='run'?16:10)):0;
 // 姿态：举手（投掷/捶地蓄力）、砸下、蹲伏
 let armUp=0,lean=0,crouch=0,ball=0;const P=e.boss&&e.pat,T=e.patT||0;
 if(P==='snowballs'||P==='blizzard'){armUp=Math.min(1,T*3)*(.6+.4*Math.abs(Math.sin(T*10)));ball=1}
 else if(P==='slam'){armUp=T<.95?Math.min(1,T*1.6):0;lean=T>=.95?.35:-.1*armUp;crouch=T>=.95&&T<1.3?6:0}
 else if(P==='roll'){armUp=T<.8?T:0;lean=T>.8?.3:0}
 else if(P==='summon'){armUp=.5+.5*Math.abs(Math.sin(T*14))}
 else if(an==='attack'){const k=clamp(t,0,1);if(d.ai==='ranged'){armUp=k<.5?k*2:0;ball=k<.5;lean=k>.5?.2:0}else{armUp=k<.45?k*2:0;lean=k>.45?.3:0}}
 else if(an==='smash'){armUp=t<.5?1:0;lean=t>=.5?.35:0}
 if(e.state==='wind'&&d.ai==='ranged'){armUp=1;ball=1}
 ctx.translate(0,crouch);
 // 腿
 for(const s of[-1,1]){const sw=walk*s*6;ctx.beginPath();ctx.ellipse(-4+s*12+sw,-10,11,13,0,0,7);F(fur);ctx.beginPath();ctx.ellipse(-2+s*12+sw+3,-1,12,5,0,0,7);F('#9ab4d8')}
 ctx.rotate(lean);
 // 后臂
 const arm=(s,front)=>{ctx.save();ctx.translate(s*4+6,-62);const a=front?(armUp*2.7+walk*.35+.15):(armUp*2.4-walk*.35+.05);ctx.rotate(a);ctx.beginPath();ctx.ellipse(0,22,10,24,0,0,7);F(front?fur:shade);ctx.beginPath();ctx.ellipse(0,46,11,9,0,0,7);F('#7f9cc8');
  if(ball&&front&&armUp>.5)drawSnowball(0,56,e.boss?8:10,0);ctx.restore()};
 arm(-1,false);
 // 身体
 furBlob(0,-46,30,36,26,.12,e.ofs*7);F(fur);
 ctx.save();furBlob(0,-46,30,36,26,.12,e.ofs*7);ctx.clip();ctx.fillStyle=shade;ctx.beginPath();ctx.ellipse(-10,-22,34,18,0,0,7);ctx.fill();ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.ellipse(8,-64,14,8,-.4,0,7);ctx.fill();ctx.restore();
 // 胸毛纹
 ctx.strokeStyle='rgba(120,150,200,.7)';ctx.lineWidth=1.5;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(6+i*5,-44+i*3);ctx.lineTo(10+i*5,-36+i*3);ctx.stroke()}
 if(d.crystals){for(let i=0;i<4;i++){ctx.beginPath();const bx=-26+i*7,by=-66+i*10;ctx.moveTo(bx,by);ctx.lineTo(bx-14,by-14+i*2);ctx.lineTo(bx+2,by-4);F('#9fdcff')}}
 // 头
 furBlob(10,-80,20,17,20,.14,e.ofs*3);F(fur);
 if(d.horns){ctx.beginPath();ctx.moveTo(-2,-90);ctx.quadraticCurveTo(-16,-104,-8,-114);ctx.quadraticCurveTo(-4,-100,6,-94);F('#cfd8e6');ctx.beginPath();ctx.moveTo(18,-92);ctx.quadraticCurveTo(26,-106,20,-116);ctx.quadraticCurveTo(30,-102,26,-90);F('#cfd8e6')}
 // 蓝色脸
 ctx.beginPath();ctx.ellipse(17,-77,12,11,0,0,7);F(face);
 ctx.fillStyle='rgba(255,255,255,.25)';ctx.beginPath();ctx.ellipse(14,-82,6,3,0,0,7);ctx.fill();
 // 眉+眼
 const angry=e.boss&&curPhase(e).enrage;ctx.fillStyle=dark;ctx.beginPath();ctx.moveTo(9,-86);ctx.lineTo(19,-83);ctx.lineTo(19,-85);ctx.lineTo(9,-89);ctx.fill();ctx.beginPath();ctx.moveTo(21,-83);ctx.lineTo(28,-86);ctx.lineTo(28,-88);ctx.lineTo(21,-85);ctx.fill();
 ctx.fillStyle=angry?'#ff5040':'#ffe680';ctx.fillRect(12,-82,4,3);ctx.fillRect(22,-82,4,3);
 // 嘴（攻击时张开）
 const open=armUp>.3||an==='attack'||P==='summon'?1:0;ctx.beginPath();ctx.ellipse(19,-70,6,open?4.5:1.8,0,0,7);F(dark);if(open){ctx.fillStyle='#fff';ctx.fillRect(15,-74,2,2.5);ctx.fillRect(21,-74,2,2.5)}
 // 前臂
 arm(1,true)}
function drawWitch(w,sx){const y=w.y;shadow(sx,y,24);ctx.save();ctx.translate(sx,y);
 const rg=ctx.createRadialGradient(36,-10,2,36,-10,80);rg.addColorStop(0,'rgba(150,255,120,.4)');rg.addColorStop(1,'rgba(120,60,200,0)');ctx.fillStyle=rg;ctx.fillRect(-60,-100,180,140);
 ell(36,-12,22,14,'#2a2430');ell(36,-24,19,5,'#7cff6a');for(let i=0;i<3;i++)ell(30+i*7,-32-((G.t*30+i*12)%30),3,3,'rgba(180,255,150,.7)');
 ctx.beginPath();ctx.moveTo(-16,0);ctx.lineTo(-10,-40);ctx.lineTo(10,-40);ctx.lineTo(16,0);ctx.fillStyle='#4a2a6a';ctx.fill();ell(0,-50,12,12,'#b8d890');ctx.fillStyle=OUT;ctx.fillRect(-5,-52,3,3);ctx.fillRect(3,-52,3,3);
 ell(0,-58,24,6,'#3a1a5a');ctx.beginPath();ctx.moveTo(-12,-58);ctx.lineTo(8,-98+Math.sin(G.t*2)*3);ctx.lineTo(12,-58);ctx.fillStyle='#3a1a5a';ctx.fill();ctx.fillStyle='#c070ff';ctx.fillRect(-11,-64,23,4);ctx.restore();
 if(Math.abs(w.x-G.p.x)<90&&Math.abs(w.y-G.p.y)<90)txt('[E] 女巫 · 学习魔法 / 休息',sx,y-112,14,'#e0b0ff','center')}
function drawPickup(k,sx){const y=k.y,z=k.z+Math.sin(G.t*4+k.x)*2;shadow(sx,y,8);
 if(k.kind==='coin'){ell(sx,y-6-z,6*Math.abs(Math.cos(G.t*4+k.x))+1,6,'#ffd030')}
 if(k.kind==='potion'){ell(sx,y-10-z,8,8,'#3a7aff');ctx.fillStyle='#c0a080';ctx.fillRect(sx-3,y-24-z,6,7);ctx.save();ctx.globalCompositeOperation='lighter';ell(sx,y-10-z,14,14,'rgba(80,160,255,.3)');ctx.restore()}
 if(k.kind==='sword'||k.kind==='flame_sword'){ctx.save();ctx.translate(sx,y-14-z);ctx.rotate(-.8);ctx.fillStyle=k.kind==='flame_sword'?'#ff7a20':'#cfe8ff';ctx.fillRect(-2,-16,5,26);ctx.fillStyle='#c09030';ctx.fillRect(-6,8,13,4);ctx.restore();if(k.kind==='flame_sword')fx('fireball_s',sx,y-20-z,.6,.6)}
 if(k.kind==='armor'){ctx.beginPath();ctx.moveTo(sx-10,y-24-z);ctx.lineTo(sx+10,y-24-z);ctx.lineTo(sx+8,y-6-z);ctx.lineTo(sx,y-2-z);ctx.lineTo(sx-8,y-6-z);ctx.closePath();ctx.fillStyle='#8aa8c8';ctx.fill()}}
// ---------- 特效绘制 ----------
function drawHazard(h){const sx=h.x-G.camX;if(sx<-300||sx>W+300)return;const st=hzActive(h);
 if(h.k==='shock'){if(h.t<0)return;const r=h.r0+(h.r1-h.r0)*clamp(h.t/h.act,0,1);if(h.ice){const a=1-h.t/h.act;ctx.save();ctx.globalAlpha=a;for(let i=0;i<14;i++){const an=i/14*Math.PI*2,px=sx+Math.cos(an)*r,py=h.y+Math.sin(an)*r/2,hh=(18+10*hash(i+h.r1))*a+6;if(h.sb&&ready('snowboss')){drawBossFrame(i%2?'spike_b':'spike_a',px,py+3,1,.32*(.5+a*.6),.32*(.5+a*.6));continue}ctx.fillStyle=i%2?'#cfeeff':'#8fd0ff';ctx.strokeStyle=OUT;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(px-6,py);ctx.lineTo(px,py-hh);ctx.lineTo(px+6,py);ctx.closePath();ctx.fill();ctx.stroke()}ctx.restore();ctx.strokeStyle=`rgba(170,225,255,${a})`;ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(sx,h.y,r,r/2,0,0,7);ctx.stroke();return}ctx.strokeStyle=`rgba(255,220,150,${1-h.t/h.act})`;ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(sx,h.y,r,r/2,0,0,7);ctx.stroke();return}
 const wc={crack:'255,90,20',puddle:'255,110,20',geyser:'255,90,20',bloodpillar:'220,0,40',meteor:'255,120,40',icicle:'150,220,255',skybolt:'200,170,255',arrows:'255,230,150',spike:'150,220,255',snowball:'120,170,230',mark:'255,200,80',burst:'255,0,40'}[h.k]||'255,255,255';
 if(st===1||(h.k==='crack'&&st===0)){const pr=h.cyc?0:clamp(h.t/h.warn,0,1);const a=st===0?.18:.35+.35*Math.abs(Math.sin(G.t*12));
  ctx.strokeStyle=`rgba(${wc},${a})`;ctx.lineWidth=3;ctx.setLineDash([8,6]);ctx.beginPath();ctx.ellipse(sx,h.y,h.rx,h.ry,0,0,7);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle=`rgba(${wc},${st===0?.08:.18})`;ctx.beginPath();ctx.ellipse(sx,h.y,h.rx*(h.cyc?1:pr),h.ry*(h.cyc?1:pr),0,0,7);ctx.fill();
  if(['meteor','icicle','arrows','skybolt'].includes(h.k)){const fall=(1-pr)*420;ell(sx,h.y,h.rx*.5*pr,h.ry*.5*pr,'rgba(0,0,0,.4)');
   if(h.k==='meteor')fx('fireball',sx+fall*.3,h.y-fall-20,.8,.9,1,.6);else if(h.k==='icicle')fx('ice_lance',sx,h.y-fall-20,.4,.9,1,Math.PI/2);else if(h.k==='arrows'){ctx.strokeStyle='#ddd';ctx.lineWidth=2;for(let i=0;i<4;i++){const ax=sx+(i-1.5)*14,ay=h.y-fall-i*10;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(ax+4,ay-22);ctx.stroke()}}}
  if(h.k==='snowball'){const ox=h.ox-G.camX;const bx=ox+(sx-ox)*pr,by=h.oy+(h.y-h.oy)*pr-h.oz*(1-pr)-Math.sin(pr*Math.PI)*(160+60*h.sc);ell(sx,h.y,h.rx*.6*pr,h.ry*.6*pr,'rgba(10,20,50,.45)');if(h.giant)drawSprite(SNOWBOSS_ATLAS,'snowboss','snowball',bx,by,26*h.sc,G.t*3);else drawSnowball(bx,by,(h.ice?13:9)*h.sc,G.t*(h.ice?4:8),h.ice)}
  if(h.k==='burst')txt('!',sx,h.y-140,40,'#ff3040','center');
  if(h.k==='skybolt'){const left=h.warn-h.t;if(left<1.0){const k=1-left/1.0,pl=.5+.5*Math.sin(G.t*30);ctx.save();ctx.globalCompositeOperation='lighter';
   ctx.fillStyle=`rgba(190,160,255,${.25+.35*k*pl})`;ctx.beginPath();ctx.ellipse(sx,h.y,h.rx*(1.15-.25*k),h.ry*(1.15-.25*k),0,0,7);ctx.fill();
   ctx.strokeStyle=`rgba(235,220,255,${.6+.4*pl})`;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(sx,h.y,h.rx,h.ry,0,0,7);ctx.stroke();ctx.beginPath();ctx.moveTo(sx-h.rx*.6,h.y);ctx.lineTo(sx+h.rx*.6,h.y);ctx.moveTo(sx,h.y-h.ry*.7);ctx.lineTo(sx,h.y+h.ry*.7);ctx.stroke();
   const g=ctx.createLinearGradient(0,0,0,h.y);g.addColorStop(0,'rgba(200,180,255,0)');g.addColorStop(1,`rgba(200,180,255,${.12+.3*k})`);ctx.fillStyle=g;ctx.fillRect(sx-6-8*k,0,12+16*k,h.y);ctx.restore();
   txt('⚡',sx,h.y-34-6*pl,22+6*k,'#fff3a0','center','#3a1a6a')}}
  return}
 if(st===2||(st===3&&h.sb&&h.k==='spike')){const k=h.k;ctx.save();
  if(k==='crack'||k==='puddle'){ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(255,${100+60*Math.random()|0},20,.55)`;ctx.beginPath();ctx.ellipse(sx,h.y,h.rx,h.ry,0,0,7);ctx.fill();fx('firewall',sx,h.y+4,h.rx/90,.6,1,0,'b')}
  else if(k==='geyser'){fx('firewall',sx,h.y+6,.8,.95,1,0,'b');fx('explosion',sx,h.y-60,.7,.6)}
  else if(k==='bloodpillar'){fx('blood_pillar',sx,h.y+6,1.1,1,1,0,'b')}
  else if(k==='meteor'){fx('explosion',sx,h.y-30,.9,1)}
  else if(k==='spike'&&h.sb&&ready('snowboss')){const tt=h.t-h.warn,up=clamp(tt/.1,0,1),down=clamp((h.act+.3-tt)/.25,0,1),k2=up*down;
   ell(sx,h.y,h.rx*1.1,h.ry*1.1,`rgba(190,235,255,${.35*k2})`);drawBossFrame(h.v?'spike_b':'spike_a',sx,h.y+4,1,(h.big?.85:.62),(h.big?.85:.62)*k2);
   if(tt<.12)particles(h.x,h.y,4,'#dff4ff',4,120)}
  else if(k==='icicle'||k==='spike'){fx('ice_spikes',sx,h.y+6,.7,1,1,0,'b')}
  else if(k==='skybolt'){fx('thunder_orb',sx,h.y-20,1,1)}
  else if(k==='arrows'){ctx.strokeStyle='#ccc';ctx.lineWidth=2;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(sx+(i-2)*12,h.y);ctx.lineTo(sx+(i-2)*12+3,h.y-18);ctx.stroke()}}
  else if(k==='burst'){fx('blood_burst',sx,h.y-30,3.2,1)}
  else if(k==='snowball'){const q=clamp((h.t-h.warn)/h.act,0,1);ctx.globalAlpha=1-q*.6;ctx.fillStyle='#f4f8ff';ctx.strokeStyle=OUT;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(sx,h.y,h.rx*(.5+q*.6),h.ry*(.5+q*.6),0,0,7);ctx.fill();ctx.stroke();for(let i=0;i<6;i++){const a=i*1.05;ell(sx+Math.cos(a)*h.rx*(.4+q*.7),h.y+Math.sin(a)*h.ry*(.4+q*.7)-q*10,5*h.sc,4*h.sc,'#ffffff')}}
  ctx.restore()}}
function drawSprite(A,ik,name,x,y,sz,rot){const f=A.frames[name];if(!f||!ready(ik))return false;ctx.save();ctx.imageSmoothingEnabled=true;ctx.translate(x,y);ctx.rotate(rot);const k=sz/Math.max(f.w,f.h);ctx.scale(k,k);ctx.drawImage(IMG[ik],f.x,f.y,f.w,f.h,-f.w/2,-f.h/2,f.w,f.h);ctx.restore();return true}
function drawSnowball(x,y,r,rot,ice){if(drawSprite(SNOWMAN_ATLAS,'snow',ice?'iceblock':'snowball',x,y,r*2.2,rot))return;ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.beginPath();ctx.arc(0,0,r,0,7);const g=ctx.createRadialGradient(-r*.35,-r*.35,r*.1,0,0,r);g.addColorStop(0,'#ffffff');g.addColorStop(.7,'#e4eefa');g.addColorStop(1,'#a8c4e4');ctx.fillStyle=g;ctx.fill();ctx.lineWidth=Math.max(2,r*.08);ctx.strokeStyle=OUT;ctx.stroke();
 if(r>14){ctx.strokeStyle='rgba(120,160,210,.6)';ctx.lineWidth=r*.06;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(0,0,r*(.35+i*.18),i*2,i*2+1.6);ctx.stroke()}}ctx.restore()}
function drawProj(q,enemy){const sx=q.x-G.camX,y=q.y-q.z;shadow(sx,q.y,10,.2);const fl=Math.sign(q.vx)||1;
 const m={fireball:['fireball',q.big?1.3:.8],flame_lance:['flame_lance',1],ice_lance:['ice_lance',q.sc||.6],thunder_blade:['thunder_blade',.8],sword_wave:[null,1],fire:['fireball_s',.8],ice:['ice_orb',.6],orb:['thunder_orb',.5],bloodorb:['blood_pillar',.25],firewave:['firewall',.7]}[q.k];
 if(q.k==='sword_wave'){heroFx('fx_wave',sx,y,.9,.95);return}
 if(q.k==='arrow'){ctx.strokeStyle='#d8c8a0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx,y);ctx.lineTo(sx-q.vx*.06,y-q.vy*.06);ctx.stroke();return}
 if(q.k==='bloodorb'){ctx.save();ctx.globalCompositeOperation='lighter';ell(sx,y,10,10,'rgba(255,20,60,.9)');ell(sx,y,18,18,'rgba(200,0,40,.35)');ctx.restore();return}
 if(q.k==='firewave'){fx('firewall',sx,q.y+6,.7,.95,fl,0,'b');return}
 if(q.k==='rollball'){ell(sx,q.y+2,q.rad*1.05,q.rad*.32,'rgba(10,20,50,.4)');if(!drawSprite(SNOWBOSS_ATLAS,'snowboss','snowball',sx,q.y-q.rad,q.rad*2.1,q.x/q.rad*fl))drawSnowball(sx,q.y-q.rad,q.rad,q.x/q.rad*fl);if(Math.random()<.5)particles(q.x-fl*q.rad,q.y,4,'#ffffff',4,90);return}
 if(m)fx(m[0],sx,y,m[1],1,fl)}
function drawZone(z){const sx=z.x-G.camX;const a=clamp(Math.min(z.t*4,(z.dur-z.t)*3),0,1);
 switch(z.k){case 'firewall':fx('firewall',sx,z.y+10,1.1,a,1,0,'b');break;case 'vortex':fx('vortex',sx,z.y-40,1.3,a*.9,1,0);break;
  case 'frost':fx('frost_field',sx,z.y-10,1.7,a);break;case 'iceburst':fx('ice_burst',sx,z.y-30,1.4,a);break;
  case 'dragon':fx('ice_dragon',sx,z.y-60,2.4,a,Math.sign(z.vx));break;case 'thunderdash':fx('chain',sx,z.y-50,.5,a*.8,G.p.face);break;
  case 'storm':fx('storm_field',sx,z.y-60,2,a*.6);break;case 'boom':fx('explosion',sx,z.y-40,1.5,a);break}}
function drawSwords(){for(const s of G.swords){if(s.t<0)continue;const sx=s.x-G.camX;const k=clamp(s.t/.35,0,1);const zz=(1-k*k)*420;
 if(k<1){ell(sx,s.y,10*k+4,4*k+2,'rgba(0,0,0,.35)');ctx.save();if(s.gold)ctx.filter='sepia(1) saturate(4) brightness(1.2)';heroFx('fx_sword',sx,s.y-zz,.8,1);ctx.restore()}
 else{heroFx('fx_sword',sx,s.y+6,.8,clamp(1-(s.t-.35)/.4,0,1));fx('sword_slash',sx,s.y-20,.6,clamp(1-(s.t-.35)/.3,0,1)*.7)}}}
function drawBolts(){ctx.save();ctx.globalCompositeOperation='lighter';for(const b of G.bolts){const sx1=b.x1-G.camX,sx2=b.x2-G.camX;ctx.strokeStyle=`rgba(200,170,255,${b.life*4})`;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(sx1,b.y1);
 for(let i=1;i<8;i++){const t=i/8;ctx.lineTo(sx1+(sx2-sx1)*t+rnd(-12,12),b.y1+(b.y2-b.y1)*t+rnd(-8,8))}ctx.lineTo(sx2,b.y2);ctx.stroke();ctx.lineWidth=1.5;ctx.strokeStyle='#fff';ctx.stroke()}ctx.restore()}
// ---------- 环境氛围 ----------
function ambient(dt){const S=G.S,A=S.ambient||[];const list=G.amb;
 const spawnP=(k,n)=>{for(let i=0;i<n;i++)list.push({k,x:rnd(0,W),y:k==='leaves'||k==='redleaves'||k==='ash'||k==='snow'?-10:rnd(0,H),vx:0,vy:0,life:rnd(4,9),t:0,s:rnd(.6,1.4),ph:rnd(0,7)})};
 const want={embers:30,ash:40,leaves:16,redleaves:18,fireflies:22,snow:60,fog:4,bats:1}; 
 for(const k of A){if(!want[k])continue;const n=list.filter(p=>p.k===k).length;if(n<want[k]&&Math.random()<.3)spawnP(k,1)}
 if(S.decor==='snow'&&list.filter(p=>p.k==='snow').length<60)spawnP('snow',1);
 for(const p of list){p.t+=dt;p.life-=dt;
  switch(p.k){case 'embers':p.y-=30*dt*p.s;p.x+=Math.sin(p.t*2+p.ph)*20*dt;break;case 'ash':case 'snow':p.y+=40*dt*p.s;p.x+=Math.sin(p.t+p.ph)*15*dt-8*dt;break;
   case 'leaves':case 'redleaves':p.y+=35*dt*p.s;p.x+=Math.sin(p.t*1.5+p.ph)*40*dt-15*dt;break;case 'fireflies':p.x+=Math.sin(p.t*.7+p.ph)*20*dt;p.y+=Math.cos(p.t*.9+p.ph)*15*dt;break;
   case 'fog':p.x+=12*dt*p.s;break;case 'bats':p.x+=90*dt;p.y=90+Math.sin(p.t*3)*15+p.ph*6;break}}
 G.amb=list.filter(p=>p.life>0&&p.y<H+20);
 if(A.includes('lightning')){G.lightT-=dt;if(G.lightT<=0){G.lightT=rnd(7,14);G.light=.35;sfx('bolt')}}G.light=Math.max(0,(G.light||0)-dt)}
function drawAmbient(){ctx.save();for(const p of G.amb){const a=clamp(Math.min(p.t,p.life),0,1);
 switch(p.k){case 'embers':ctx.globalCompositeOperation='lighter';ell(p.x,p.y,2*p.s,2*p.s,`rgba(255,${120+80*Math.sin(p.t*6)|0},40,${a})`);break;
  case 'ash':ctx.globalCompositeOperation='source-over';ell(p.x,p.y,1.6*p.s,1.6*p.s,`rgba(90,80,80,${a*.7})`);break;
  case 'snow':ctx.globalCompositeOperation='source-over';ell(p.x,p.y,2*p.s,2*p.s,`rgba(255,255,255,${a*.8})`);break;
  case 'leaves':case 'redleaves':ctx.globalCompositeOperation='source-over';ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.t*2+p.ph);ell(0,0,5*p.s,2.5*p.s,p.k==='redleaves'?`rgba(180,20,30,${a})`:`rgba(120,170,60,${a})`);ctx.restore();break;
  case 'fireflies':ctx.globalCompositeOperation='lighter';ell(p.x,p.y,2.5,2.5,`rgba(220,255,120,${a*(.5+.5*Math.sin(p.t*4+p.ph))})`);break;
  case 'fog':ctx.globalCompositeOperation='source-over';const g=ctx.createRadialGradient(p.x,LANE_BOT-p.ph*15,10,p.x,LANE_BOT-p.ph*15,220);g.addColorStop(0,`rgba(150,150,180,${.12*a})`);g.addColorStop(1,'rgba(150,150,180,0)');ctx.fillStyle=g;ctx.fillRect(p.x-220,LANE_BOT-240,440,440);break;
  case 'bats':ctx.globalCompositeOperation='source-over';ctx.fillStyle='rgba(10,5,10,.8)';const w=Math.sin(p.t*14)*6;ctx.beginPath();ctx.moveTo(p.x-10,p.y-w);ctx.lineTo(p.x,p.y);ctx.lineTo(p.x+10,p.y-w);ctx.lineTo(p.x,p.y+3);ctx.fill();break}}
 ctx.restore();const A=G.S.ambient||[];
 if(A.includes('shafts')){ctx.save();ctx.globalCompositeOperation='lighter';for(let i=0;i<4;i++){const x=((i*300-G.camX*.3)%1200+1200)%1200-120;const g=ctx.createLinearGradient(x,0,x+120,H);g.addColorStop(0,'rgba(255,240,180,.10)');g.addColorStop(1,'rgba(255,240,180,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+60,0);ctx.lineTo(x+220,H);ctx.lineTo(x+120,H);ctx.fill()}ctx.restore()}
 if(A.includes('shimmer')){ctx.save();ctx.globalAlpha=.06;ctx.fillStyle='#ff8030';for(let i=0;i<6;i++)ctx.fillRect(0,250+i*12+Math.sin(G.t*3+i)*3,W,4);ctx.restore()}
 if(G.light>0){ctx.fillStyle=`rgba(200,210,255,${G.light})`;ctx.fillRect(0,0,W,H)}}
function drawForeground(){const S=G.S;const cx=G.camX*1.25;const PS=PROPSET[S.decor],A=window.PROPS_ATLAS;ctx.save();
 if(!G.fgF)G.fgF={};const p=G.p,px=p?p.x-G.camX:-999,py=p?p.y-(p.z||0):0;
 for(let i=Math.floor(cx/400)-1;i<(cx+W)/400+1;i++){const x=i*400-cx+hash(i)*140;const y=H+16;
  if(S.decor==='volcano'&&hash(i*7)<.4){ctx.fillStyle='#120606';ctx.beginPath();ctx.moveTo(x-40,y);ctx.lineTo(x,y-50-hash(i)*30);ctx.lineTo(x+50,y);ctx.fill();continue}
  if(!PS||!A||!ready('props')||(PS.sparse&&hash(i*3)<.35))continue;
  const k=PS.fg[Math.floor(hash(i*11)*PS.fg.length)]+'_fg',f=A.frames[k];if(!f)continue;const sc=.85+hash(i*5)*.3,fl=hash(i*13)<.5?-1:1;
  const hit=px+30>x-f.ax*sc&&px-30<x+(f.w-f.ax)*sc&&py>y-f.ay*sc-10;const cur=G.fgF[i]??.95;const a=G.fgF[i]=cur+((hit?.3:.95)-cur)*.15;
  ctx.globalAlpha=a;ctx.save();ctx.translate(x,y);ctx.scale(sc*fl,sc);ctx.drawImage(IMG.props,f.x,f.y,f.w,f.h,-f.ax,-f.ay,f.w,f.h);ctx.restore()}
 ctx.restore()}
// ---------- HUD ----------
function orbIcon(name,x,y,sc){fx(name,x,y,sc,1)}
function drawHUD(){const p=G.p;
 // 头像
 ctx.save();ctx.beginPath();ctx.arc(60,478,40,0,7);ctx.fillStyle='#1e1a30';ctx.fill();ctx.clip();drawHeroFrame('portrait',60,478,1,.8);ctx.restore();
 ctx.beginPath();ctx.arc(60,478,40,0,7);ctx.lineWidth=4;ctx.strokeStyle=p.energy>=100?'#7fe0ff':'#3a3050';ctx.stroke();
 bar(108,462,210,20,p.hp/p.maxhp,p.hp/p.maxhp<.3?'#e04040':'#5cd040');txt(Math.ceil(p.hp)+'/'+p.maxhp,213,472,13,'#fff','center');
 bar(108,488,180,13,p.energy/100,p.energy>=100?(G.t*6%2<1?'#7fe0ff':'#3a8aff'):'#3a6ad8');txt('怒气 '+Math.floor(p.energy),198,495,11,'#fff','center');
 if(p.energy>=100)txt('[L] 怒气必杀·万剑归宗',108,452,13,'#7fe0ff');
 txt('攻 '+atk()+(p.flameSword?' 烈炎剑':'')+'  防 '+def(),108,520,13,'#ffd34a');
 const sp=p.spells.length?SP(p.spells[p.sel]):null;ctx.beginPath();ctx.arc(350,480,24,0,7);ctx.fillStyle='#1e1a30';ctx.fill();ctx.strokeStyle='#5a4a80';ctx.lineWidth=3;ctx.stroke();
 if(sp){const sc=SCHOOLS.find(c=>c.id===sp.s);orbIcon(sc.icon,350,480,.7);txt(sp.name+' ('+sp.mp+'瓶)',350,520,12,sc.col,'center')}else txt('未学魔法',350,520,12,'#888','center');
 txt('U',332,462,12,'#fff');if(p.spells.length>1)txt('I ⇄',372,462,11,'#ccc');
 const pl=p.plv,pf=pl>=5?1:(p.prof-PROF[pl-1])/(PROF[pl]-PROF[pl-1]);txt('砍杀熟练度 Lv'+pl,395,474,12,'#ffd34a');bar(395,484,110,11,pf,'#e8a020');txt(pl>=5?'MAX':p.prof+'/'+PROF[pl],450,490,10,'#fff','center');
 const items=[['#ffd030','金币',p.gold],['#3a7aff','魔法瓶',p.mp],['#c070ff','经验',p.exp]];
 items.forEach((it,i)=>{const x=740+i*72;ell(x,492,11,11,it[0]);txt(String(it[2]),x,470,16,'#fff','center');txt(it[1],x,520,12,'#ccc','center')});
 // 顶部
 const tx=20;txt('第'+G.S.id+'关 · '+G.S.name,tx,24,16,'#ffd34a');const nw=G.B.waves.length-1;txt(G.wave>=nw?'首领战':'波次 '+Math.min(G.wave+1,nw)+'/'+nw,tx,46,13,'#ddd');
 txt(fmtT(G.time),W-20,24,15,'#fff','right');txt((AU.muted?'静音 [M]':'音效 [M]')+'  帮助 [P]',W-20,46,12,AU.muted?'#f88':'#9a8fc0','right');
 const bs=G.boss&&!G.boss.dead?G.boss:G.mini&&!G.mini.dead?G.mini:null;
 if(bs){const w=440,x=(W-w)/2;ctx.save();rr(x-62,48,w+74,46,12);ctx.fillStyle='rgba(8,6,16,.55)';ctx.fill();ctx.restore();if(bs.def.shape==='snowboss'&&ready('snowboss')){const fc=bs.hurtT>0||bs.hp/bs.maxhp<.1?'face_hurt':['face_normal','face_angry','face_roar'][bs.phase]||'face_roar';
   ctx.save();ctx.beginPath();ctx.arc(x-30,78,26,0,7);ctx.fillStyle='#1a2236';ctx.fill();ctx.clip();drawBossFrame(fc,x-30,78,1,.5,.5);ctx.restore();ctx.strokeStyle=bs.phase>=2?'#ff5050':'#bfe6ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x-30,78,26,0,7);ctx.stroke()}
  txt(bs.def.name,W/2,62,16,'#ff8080','center');bar(x,72,w,14,bs.hp/bs.maxhp,'#d02030');
  bs.def.phases.forEach((ph,i)=>{if(i){const px=x+w*ph.at;ctx.fillStyle='#fff';ctx.fillRect(px-1,70,2,18)}})}
 if(G.go>0&&Math.floor(G.t*3)%2)txt('GO →',W-120,200,44,'#ffd34a','center');
 G.msgs.forEach((m,i)=>{ctx.globalAlpha=Math.min(1,m.life*2,m.a==null?1:m.a);txt(m.t,W/2,122+i*26,18,m.c,'center');ctx.globalAlpha=1});
 if(G.popup){const q=G.popup,py=206;ctx.globalAlpha=Math.min(1,q.t*2);rr(W/2-200,py,400,90,12);ctx.fillStyle='rgba(30,20,10,.85)';ctx.fill();ctx.strokeStyle='#ffd34a';ctx.lineWidth=3;ctx.stroke();
  txt(q.title,W/2,py+22,18,'#ffd34a','center');txt('习得：'+q.name,W/2,py+48,22,'#fff','center');txt(q.desc,W/2,py+73,13,'#ddd','center');ctx.globalAlpha=1}
 // 操作提示：等关卡名/波次提示消失后再出现，显示 10 秒，放在画面下方（HUD 上方），不与顶部标题挤在一起
 if(!document.body.classList.contains('touch')&&!bs){if(G.hintT==null&&G.time>2.5&&!G.msgs.some(m=>m.t===G.S.name))G.hintT=G.time;if(G.hintT!=null&&G.time-G.hintT<10){const k=G.time-G.hintT,a=Math.min(1,k*3,(10-k)*1.5);ctx.globalAlpha=a;rr(W/2-330,416,660,24,12);ctx.fillStyle='rgba(10,6,24,.6)';ctx.fill();txt('方向键/WASD移动  J攻击(长按蓄力)  K跳跃  L终结技  U施法  I切换  E女巫  P帮助  M静音',W/2,428,13,'#e0d6ff','center');ctx.globalAlpha=1}}}
function fmtT(t){t=Math.floor(t);return Math.floor(t/60)+':'+String(t%60).padStart(2,'0')}
// ---------- 女巫菜单 ----------
function witchMenuInput(){const m=G.menu;const cols=SCHOOLS.map(s=>SPELLS.filter(q=>q.s===s.id));
 if(hit('arrowleft')||hit('a'))m.col=(m.col+2)%3;if(hit('arrowright')||hit('d'))m.col=(m.col+1)%3;
 if(hit('arrowup')||hit('w'))m.sel=Math.max(0,m.sel-1);if(hit('arrowdown')||hit('s'))m.sel=m.sel+1;m.sel=Math.min(m.sel,cols[m.col].length-1);
 if(hit('j')||hit('enter'))learn(cols[m.col][m.sel].id);if(hit('e')||hit('escape')||hit('k'))G.menu=null}
function drawWitchMenu(){const p=G.p,m=G.menu;ctx.fillStyle='rgba(10,5,25,.8)';ctx.fillRect(0,0,W,H);
 rr(40,30,W-80,H-60,16);ctx.fillStyle='#21153a';ctx.fill();ctx.strokeStyle='#8a5ac8';ctx.lineWidth=4;ctx.stroke();
 txt('女巫的魔法课 · 营火休息',W/2,62,26,'#e0b0ff','center');txt('当前经验：'+p.exp+'    魔法瓶：'+p.mp,W/2,92,15,'#c9a0ff','center');
 SCHOOLS.forEach((sc,ci)=>{const x=70+ci*280;orbIcon(sc.icon,x+20,122,.55);txt(sc.name,x+46,122,20,sc.col);
  SPELLS.filter(q=>q.s===sc.id).forEach((s,ri)=>{const y=150+ri*52,st=spellState(s.id),cur=m.col===ci&&m.sel===ri;
   rr(x,y,262,46,8);ctx.fillStyle=cur?'rgba(255,255,255,.14)':'rgba(0,0,0,.25)';ctx.fill();if(cur){ctx.strokeStyle=sc.col;ctx.lineWidth=2;ctx.stroke()}
   ctx.globalAlpha=st==='learned'||st==='ok'?1:.45;txt((ri+1)+'. '+s.name,x+10,y+14,16,st==='learned'?'#8f8':'#fff');txt(s.desc,x+10,y+34,11,'#bbb',undefined,null,false);
   txt(st==='learned'?'已学会':st==='locked'?'需前置':s.exp+'经验',x+252,y+14,13,st==='learned'?'#8f8':st==='ok'?'#ffd34a':'#888','right');txt(s.mp+'瓶',x+252,y+34,11,'#7fe3ff','right');ctx.globalAlpha=1;
   RECTS.push({x,y,w:262,h:46,fn:()=>{m.col=ci;m.sel=ri;learn(s.id)}})})});
 rr(W/2-70,H-70,140,34,8);ctx.fillStyle='#4a2a6a';ctx.fill();txt('关闭 [E]',W/2,H-53,16,'#fff','center');RECTS.push({x:W/2-70,y:H-70,w:140,h:34,fn:()=>{G.menu=null}});
 txt('←→ 选择系别  ↑↓ 选择法术  J 学习（同系需按顺序）',W/2,H-90,12,'#aaa','center')}
// ---------- 场景绘制 ----------
function drawPlay(){ctx.save();if(G.shake>0)ctx.translate(rnd(-G.shake,G.shake),rnd(-G.shake,G.shake)*.6);
 drawBG();const cx=G.camX;
 for(const o of props)if(o.y<LANE_TOP){const sx=o.x-cx;if(sx>-100&&sx<W+100)drawProp(o,sx)}
 for(const h of G.hz)if(hzActive(h)!==2||['crack','puddle'].includes(h.k))drawHazard(h);
 const list=[];for(const o of props)if(o.y>=LANE_TOP&&o.y<LANE_BOT+16)list.push({y:o.y,d:()=>drawProp(o,o.x-cx)});
 for(const w of G.B.witches)if(G.lockX==null||w.x<G.lockX)list.push({y:w.y,d:()=>drawWitch(w,w.x-cx)});
 for(const k of G.pickups)list.push({y:k.y,d:()=>drawPickup(k,k.x-cx)});
 for(const e of G.enemies){const sx=e.x-cx;if(sx>-200&&sx<W+200)list.push({y:e.y+(e.def.fly?.5:0),d:()=>drawEnemy(e,sx)})}
 list.push({y:G.p.y+.1,d:()=>drawHero(G.p,G.p.x-cx)});
 for(const z of G.zones)list.push({y:z.y+1,d:()=>drawZone(z)});
 for(const q of G.pp)list.push({y:q.y+1,d:()=>drawProj(q)});for(const q of G.ep)list.push({y:q.y+1,d:()=>drawProj(q,1)});
 for(const h of G.hz)if(hzActive(h)===2&&!['crack','puddle'].includes(h.k))list.push({y:h.y+2,d:()=>drawHazard(h)});
 list.sort((a,b)=>a.y-b.y).forEach(o=>o.d());
 drawSwords();drawBolts();
 for(const q of G.parts){const sx=q.x-cx,y=q.y-q.z;if(q.num!=null)txt(String(q.num),sx,y,18,q.col,'center');else if(q.txt)txt(q.txt,sx,y,14,q.col,'center');else{ctx.fillStyle=q.col;ctx.globalAlpha=clamp(q.life*2,0,1);ctx.fillRect(sx,y,q.s,q.s);ctx.globalAlpha=1}}
 for(const o of props)if(o.y>=LANE_BOT+16){const sx=o.x-cx;if(sx>-100&&sx<W+100)drawProp(o,sx)}
 drawForeground();drawAmbient();
 // 王座大厅暗色
 const hs=G.B.segs.filter(s=>s.type==='hall');let cov=0;for(const s of hs)cov+=Math.max(0,Math.min(s.x1,cx+W)-Math.max(s.x0,cx));if(cov>0&&G.S.hall){ctx.globalAlpha=cov/W;ctx.fillStyle=G.S.hall.tint;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1}
 if(G.bloodmoon){ctx.fillStyle='rgba(120,0,10,.18)';ctx.fillRect(0,0,W,H)}
 if(G.flash>0){ctx.fillStyle=`rgba(255,255,255,${G.flash})`;ctx.fillRect(0,0,W,H)}
 ctx.restore();drawDanger();drawHUD();if(G.menu)drawWitchMenu();
 if(G.clearT>0)txt(G.S.final?'吸血伯爵已被击败！':'关卡完成！',W/2,200,40,'#ffd34a','center')}
// 受击红闪 + 低血量（<25%）脉动红色暗角
function drawDanger(){const p=G.p;
 if(G.hurtFlash>0){ctx.fillStyle=`rgba(255,20,20,${G.hurtFlash*.55})`;ctx.fillRect(0,0,W,H);
  const g=ctx.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,W*.62);g.addColorStop(0,'rgba(255,0,0,0)');g.addColorStop(1,`rgba(220,0,0,${G.hurtFlash*1.4})`);ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
 const r=p.hp/p.maxhp;if(!p.dead&&r<.25){const pulse=.5+.5*Math.sin(G.t*(5+8*(.25-r)));const a=(.28+.3*(1-r/.25))*(.55+.45*pulse);
  const g=ctx.createRadialGradient(W/2,H/2,H*.38,W/2,H/2,W*.66);g.addColorStop(0,'rgba(120,0,0,0)');g.addColorStop(.6,`rgba(150,0,0,${a*.35})`);g.addColorStop(1,`rgba(200,0,10,${a})`);ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}}
// ---------- 帮助 / 暂停面板（P 或 Esc，触屏右上“暂停”按钮）----------
let HELP=0;
function canHelp(k){if(MODE==='play'){if(G&&G.menu&&k==='escape')return false;return !(G&&G.p.dead)}return MODE==='select'||(HELP&&k==='p')}
function toggleHelp(){HELP=HELP?0:1;for(const k in keys)keys[k]=false;for(const k in pressed)pressed[k]=false;sfx('fail');if(!HELP){PROFILE.vol=AU.vol;writeSave()}}
function setVol(v){auSetVol(Math.round(clamp(v,0,1)*20)/20);PROFILE.vol=AU.vol;writeSave()}
function drawHelp(){ctx.fillStyle='rgba(8,5,18,.82)';ctx.fillRect(0,0,W,H);const x0=110,y0=34,w=740,h=472;
 rr(x0,y0,w,h,16);ctx.fillStyle='rgba(28,20,48,.96)';ctx.fill();ctx.strokeStyle='#ffd34a';ctx.lineWidth=3;ctx.stroke();
 txt('暂停 · 操作说明',W/2,y0+30,26,'#ffd34a','center');const T=document.body.classList.contains('touch');
 const rows=[
  ['移动',T?'左侧摇杆（8 方向）':'WASD / 方向键'],
  ['J 攻击',T?'“攻击”键：连按四段连击':'连按四段连击；空中按 J 下劈'],
  ['K 跳跃',T?'“跳跃”键；空中按攻击为下劈':'起跳后可在空中下劈'],
  ['砍杀熟练度','HUD 中下方黄条：普攻每命中 1 个敌人 +1，满 30/120/300/600 升级，跨关保留'],
  ['熟练度招式','Lv2 旋风斩（第5击） · Lv3 方向+J 突刺冲锋 · Lv4 长按 J 剑气波'],
  ['L 怒气必杀','击中/受伤积累怒气，满 100 释放「万剑归宗」'],
  ['U 法术','施放当前法术，消耗魔法瓶'],
  ['I 切换','切换已学会的法术（HUD 中间图标）'],
  ['E 女巫','靠近女巫营地按 E：学习法术（消耗经验）并回满生命'],
  ['魔法瓶','击败敌人掉落，施法的消耗品，跨关保留'],
  ['金币','击败敌人掉落，自动拾取，计入存档'],
  ['M 静音  P/Esc','静音切换 · 打开/关闭本面板（游戏暂停）']];
 rows.forEach((r,i)=>{const y=y0+68+i*26.5;txt(r[0],x0+40,y,15,'#c9a0ff');txt(r[1],x0+200,y,14,'#eee')});
 const sy=y0+h-82;txt('音量',x0+40,sy,16,'#ffd34a');const sx=x0+200,sw=360;
 bar(sx,sy-8,sw,16,AU.vol,'#7fe0ff');ctx.beginPath();ctx.arc(sx+sw*AU.vol,sy,11,0,7);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.stroke();
 txt(Math.round(AU.vol*100)+'%'+(AU.muted?'（已静音）':''),sx+sw+20,sy,14,'#fff');
 RECTS.push({x:sx-12,y:sy-20,w:sw+24,h:40,fn:(tx)=>setVol((tx-sx)/sw)});
 txt('← → 调节音量',x0+40,sy+24,11,'#999');
 btn(W/2-110,y0+h-50,220,40,'继续游戏 ('+(T?'点击':'P / Esc')+')',()=>toggleHelp(),'#7a3a1a');
 if(hit('arrowleft')||hit('a'))setVol(AU.vol-.05);if(hit('arrowright')||hit('d'))setVol(AU.vol+.05)}
// ---------- 菜单场景 ----------
let selT=0,resetArm=0;
function panelBG(){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0b0818');g.addColorStop(1,'#1d1530');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 const im=IMG['far'+(STAGES[SEL]&&STAGES[SEL].far?STAGES[SEL].id:1)];if(im&&im.complete&&im.naturalWidth){ctx.globalAlpha=.35;const sc=H/im.height;ctx.drawImage(im,-(selT*12%(im.width*sc-W)),0,im.width*sc,H);ctx.globalAlpha=1}}
function btn(x,y,w,h,label,fn,col='#4a2a6a'){rr(x,y,w,h,10);ctx.fillStyle=col;ctx.fill();ctx.strokeStyle='#e0c070';ctx.lineWidth=2;ctx.stroke();txt(label,x+w/2,y+h/2,17,'#fff','center');RECTS.push({x,y,w,h,fn})}
function startSel(i){i=Math.max(0,Math.min(STAGES.length-1,i|0));if(i+1>PROFILE.unlocked){sfx('fail');return}auInit();sfx('go');SEL=i;if(PROFILE.lastSel!==i){PROFILE.lastSel=i;writeSave()}startStage(i)}
addEventListener('storage',e=>{if(e.key===SAVE_KEY&&MODE==='select')syncSave()});addEventListener('pageshow',()=>{if(MODE==='select')syncSave()});addEventListener('focus',()=>{if(MODE==='select')syncSave()});
let SYNC_T=0;
function drawSelect(dt){selT+=dt;SYNC_T-=dt;if(SYNC_T<=0){SYNC_T=.5;syncSave()}panelBG();const P=PROFILE;if(SEL+1>P.unlocked)SEL=defaultSel();
 txt('暗夜征途 · 青衣剑客',W/2,48,36,'#ffd34a','center');txt('选择关卡'+(P.ngplus?'  ·  新游戏+ 进行中':''),W/2,84,16,'#c9a0ff','center');
 const cw=170,gap=12,x0=(W-(cw*5+gap*4))/2;
 STAGES.forEach((s,i)=>{const x=x0+i*(cw+gap),y=110,h=250,lock=s.id>P.unlocked,cur=i===SEL;
  rr(x,y,cw,h,12);ctx.fillStyle=cur?'#3a2a5a':'#221a34';ctx.fill();ctx.strokeStyle=cur?'#ffd34a':'#5a4a80';ctx.lineWidth=cur?4:2;ctx.stroke();
  const im=IMG['far'+s.id];ctx.save();rr(x+8,y+8,cw-16,100,8);ctx.clip();if(im&&im.complete&&im.naturalWidth){ctx.drawImage(im,0,0,Math.min(im.width,im.height*1.54),im.height,x+8,y+8,cw-16,100)}else{ctx.fillStyle=s.sky[1];ctx.fillRect(x+8,y+8,cw-16,100)}
  if(lock){ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(x+8,y+8,cw-16,100)}ctx.restore();
  txt('第'+s.id+'关',x+cw/2,y+128,14,'#c9a0ff','center');txt(s.name,x+cw/2,y+152,20,lock?'#777':'#fff','center');
  txt('首领：'+BOSSES[s.boss].name,x+cw/2,y+180,12,lock?'#666':'#ff9090','center');
  txt(lock?'🔒 未解锁':P.cleared.includes(s.id)?'✔ 已通关 '+fmtT(P.best[s.id]||0):'未通关',x+cw/2,y+204,12,lock?'#777':P.cleared.includes(s.id)?'#8f8':'#ffd34a','center');
  txt('难度 '+'★'.repeat(i+1),x+cw/2,y+228,12,'#ffb040','center');
  RECTS.push({x,y,w:cw,h,fn:()=>{if(lock){SEL=i;sfx('fail')}else startSel(i)}})});
 txt('生命 '+maxHpFor(P)+'  攻击+'+P.atkLv*4+'  防御+'+P.defLv*2+'  熟练度 Lv'+P.plv+'  经验 '+P.exp+'  金币 '+P.gold+'  魔法瓶 '+P.mp+'  已学法术 '+P.spells.length+'/16',W/2,388,13,'#ddd','center');
 btn(W/2-110,410,220,46,'开始 · '+STAGES[SEL].name,()=>startSel(SEL),'#7a3a1a');
 if(P.ngplusUnlocked)btn(W/2+130,416,150,36,P.ngplus?'新游戏+ 进行中':'开启 新游戏+',()=>{if(!P.ngplus){P.ngplus=1;P.unlocked=1;P.cleared=[];writeSave();sfx('levelup')}},'#5a1a3a');
 btn(W/2-280,416,150,36,resetArm?'再点一次确认':'重置存档',()=>{if(resetArm){PROFILE=defProfile();writeSave();resetArm=0;SEL=0}else resetArm=1},'#333');
 txt('←→ 选择  Enter/J 开始  ·  进度自动保存在本机浏览器',W/2,488,12,'#aaa','center');
 if(hit('arrowleft')||hit('a'))SEL=(SEL+4)%5;if(hit('arrowright')||hit('d'))SEL=(SEL+1)%5;if(hit('enter')||hit('j')||hit(' '))startSel(SEL)}
function drawResults(){panelBG();const R=RES;rr(200,70,560,400,16);ctx.fillStyle='rgba(20,14,36,.92)';ctx.fill();ctx.strokeStyle='#ffd34a';ctx.lineWidth=3;ctx.stroke();
 txt('关卡完成！',W/2,110,34,'#ffd34a','center');txt('第'+R.S.id+'关 · '+R.S.name,W/2,148,18,'#fff','center');
 const rows=[['用时',fmtT(R.time)+(R.best===R.time?'  (新纪录)':'  最佳 '+fmtT(R.best))],['获得金币',R.gold],['获得经验',R.exp],['击败敌人',R.kills]];
 rows.forEach((r,i)=>{txt(r[0],300,200+i*40,18,'#c9a0ff');txt(String(r[1]),660,200+i*40,18,'#fff','right')});
 if(R.first&&!R.final)txt('解锁：第'+(R.S.id+1)+'关 · '+STAGES[R.S.id].name+'   最大生命 +12',W/2,365,15,'#8f8','center');
 if(R.final){btn(W/2-110,400,220,46,'观看结局',()=>{MODE='ending';CREDY=H},'#7a1a2a')}
 else{btn(W/2-230,400,200,46,'下一关',()=>{SEL=R.S.id;startSel(R.S.id)},'#7a3a1a');btn(W/2+30,400,200,46,'返回关卡选择',()=>{MODE='select';SEL=R.S.id})}
 if(hit('enter')||hit('j')){if(R.final){MODE='ending';CREDY=H}else{SEL=R.S.id;startSel(R.S.id)}}if(hit('escape')||hit('k')){MODE='select';SEL=Math.min(4,R.S.id)}}
let OVER_T=0;
function drawOver(){drawPlay();const ok=OVER_T>=.8;ctx.fillStyle='rgba(20,0,0,.65)';ctx.fillRect(0,0,W,H);txt('战败……',W/2,190,48,'#ff5050','center');txt('本关进度未保存，可从关卡开头重新挑战',W/2,240,16,'#ddd','center');
 if(!ok){ctx.globalAlpha=.45}btn(W/2-230,300,200,48,'重新挑战 (J)',()=>{if(OVER_T>=.8)startSel(G.idx)},'#7a3a1a');btn(W/2+30,300,200,48,'关卡选择 (K)',()=>{if(OVER_T>=.8)MODE='select'});ctx.globalAlpha=1;
 if(!ok){for(const k in pressed)pressed[k]=false;return}
 if(hit('j')||hit('enter')||hit('r'))startSel(G.idx);if(hit('k')||hit('escape'))MODE='select'}
const CREDITS=['通 关','','吸血伯爵倒下，血月散去。','青衣剑客收剑入鞘，黎明照进古堡。','','—— 暗夜征途 · 青衣剑客 ——','','第一关  暗夜森林 · 哥布林酋长','第二关  雪岭寒关 · 霜狼王·凛','第三关  熔岩火山 · 焰魔王·赤烎','第四关  溪谷森林 · 哥布林大王','第五关  黑夜古堡 · 吸血伯爵','',
 '程序 / 关卡 / 音效：Grok Bot（Canvas + Web Audio，无外部依赖）','角色与场景美术：项目参考图（ref/）','','已解锁「新游戏+」：敌人更强，保留全部能力','','感谢游玩！'];
function drawEnding(dt){ctx.fillStyle='#05030a';ctx.fillRect(0,0,W,H);const im=IMG.far5;if(im&&im.complete&&im.naturalWidth){ctx.globalAlpha=.4;ctx.drawImage(im,0,0,im.height*3,im.height,0,0,W,H*.6);ctx.globalAlpha=1}
 CREDY-=dt*40;CREDITS.forEach((l,i)=>{const y=CREDY+i*40;if(y>-40&&y<H+40)txt(l,W/2,y,i===0?56:18,i===0?'#ffd34a':'#eee','center')});
 drawHeroFrame('idle',W/2,H-30,1,.9);if(CREDY<-CREDITS.length*40)CREDY=H;
 btn(W-200,H-60,170,40,'返回关卡选择',()=>{MODE='select';SEL=0});if(hit('enter')||hit('escape'))MODE='select'}
// ---------- 主循环 ----------
let last=performance.now(),SPEED=1;
let FRAME_ERR=0;
function frame(now){let dt=Math.min(.05,(now-last)/1000);last=now;RECTS.length=0;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,W,H);
 try{
 if(HELP&&MODE!=='play'&&MODE!=='select')HELP=0;
 if(HELP&&MODE==='select'){panelBG();drawHelp()}
 else if(HELP&&MODE==='play'){drawPlay();drawHelp()}
 else if(MODE==='select')drawSelect(dt);else if(MODE==='results')drawResults();else if(MODE==='ending')drawEnding(dt);
 else if(MODE==='over'){OVER_T+=dt;drawOver()}
 else if(MODE==='play'){
  if(G.menu){witchMenuInput()}
  for(let si=0;si<SPEED&&MODE==='play';si++){if(G.hitstop>0){G.hitstop-=dt}else if(!G.menu){G.t+=dt;G.time+=dt;updatePlayer(dt);updateWorld(dt);ambient(dt)}}
  G.shake=Math.max(0,G.shake-dt*30);G.flash=Math.max(0,G.flash-dt*1.5);G.hurtFlash=Math.max(0,G.hurtFlash-dt*1.6);drawPlay()}
 }catch(err){FRAME_ERR++;if(FRAME_ERR<5)console.error(err);window.__lastErr=String(err&&err.stack||err)}
 if(HELP||!(MODE==='play'&&G&&G.hitstop>0))for(const k in pressed)pressed[k]=false;requestAnimationFrame(frame)}
requestAnimationFrame(frame);
function tapAt(x,y){for(let i=RECTS.length-1;i>=0;i--){const r=RECTS[i];if(x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h){auInit();r.fn(x,y);return true}}return false}
cv.addEventListener('click',e=>{const b=cv.getBoundingClientRect();tapAt((e.clientX-b.left)*W/b.width,(e.clientY-b.top)*H/b.height)});
window.__tap=tapAt;window.__G=()=>G;window.__help=()=>{if(canHelp('p'))toggleHelp()};window.__helpOpen=()=>!!HELP;
window.__dbg={mode:()=>MODE,start:i=>startSel(i),profile:()=>PROFILE,
 skip:n=>{if(!G||!G.B||!G.B.waves.length)return false;const L=G.B.waves.length;n=Math.max(0,Math.min(L-1,Math.floor(+n)||0));const w=G.B.waves[n];if(!w)return false;G.enemies=[];G.reinf=[];G.lockX=null;G.boss=null;G.mini=null;G.wave=n;G.p.x=w.x+W*.4-30;G.camX=Math.max(0,w.x-60);return n},
 god:(on=true)=>{DBG_GOD=!!on;if(G&&G.p){const p=G.p;if(on){p.dead=0;p.deadT=0;p.hp=p.maxhp}}return DBG_GOD},atk:(m=1)=>{DBG_ATK=Math.max(0,+m||1);return DBG_ATK},give:(e,m)=>{G.p.exp+=e;G.p.mp+=m},learnAll:()=>{G.p.spells=SPELLS.map(s=>s.id)},
 props:()=>props,killAll:()=>{const L=G.enemies.slice();const bs=L.filter(e=>e.boss&&!e.mini);L.filter(e=>!bs.includes(e)).concat(bs).forEach(e=>{if(!e.dead){e.hp=0;kill(e)}})},unlockAll:()=>{PROFILE.unlocked=5;writeSave()},setPlv:l=>{G.p.plv=l;G.p.prof=PROF[l-1]},energy:()=>{G.p.energy=100},
 boss:()=>G.boss,speed:n=>{SPEED=n},help:()=>HELP,overT:()=>OVER_T,resetSave:()=>{PROFILE=defProfile();writeSave()}};
