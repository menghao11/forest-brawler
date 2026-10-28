'use strict';
// ===== 装备系统：武器 / 护甲 / 饰品 =====
// 属性 st：atk 攻击  hp 生命  def 防御  crit 暴击率  boss 首领伤害+%  spell 法术伤害+%  mp 魔力上限  regen 魔力回复/秒
// 价格按每关金币收入定价（第1关约 3000–4000，之后每关约 2000–3000）：T1 第1关后、T2 第2关后、T3 第3–4关、T4 终盘目标
const SLOTS=[{id:'weapon',name:'武器',col:'#ffb060'},{id:'armor',name:'护甲',col:'#8fc8ff'},{id:'acc',name:'饰品',col:'#d79bff'}];
const TIER_COL=['#cfcfcf','#9fe08f','#5ab8ff','#d08cff','#ffb030'];
// 数据块由 tools/equip_csv.js 从 docs/equipment.csv 生成/回写（name 名称、desc 描述、lore 背景故事）；手改也可以，改完运行 export 同步表格
// @EQUIP-DATA-BEGIN
const EQUIP=[
 {"id":"w1","slot":"weapon","tier":1,"name":"青钢剑","price":500,"st":{"atk":6}},
 {"id":"w2","slot":"weapon","tier":2,"name":"寒铁剑","price":1500,"st":{"atk":12,"crit":0.05}},
 {"id":"w3","slot":"weapon","tier":3,"name":"屠魔剑","price":3200,"st":{"atk":18,"boss":0.2}},
 {"id":"w4","slot":"weapon","tier":4,"name":"龙渊剑","price":6500,"st":{"atk":28,"crit":0.1,"boss":0.25}},
 {"id":"w_flame","slot":"weapon","tier":4,"name":"烈炎剑","price":0,"drop":"焰魔王掉落","st":{"atk":20,"spell":0.15,"boss":0.1}},
 {"id":"a1","slot":"armor","tier":1,"name":"皮甲","price":400,"st":{"hp":20,"def":1}},
 {"id":"a2","slot":"armor","tier":2,"name":"锁子甲","price":1200,"st":{"hp":40,"def":3}},
 {"id":"a3","slot":"armor","tier":3,"name":"玄铁甲","price":2800,"st":{"hp":70,"def":5}},
 {"id":"a4","slot":"armor","tier":4,"name":"龙鳞甲","price":5500,"st":{"hp":110,"def":8,"regen":0.3}},
 {"id":"a_king","slot":"armor","tier":4,"name":"大王战甲","price":0,"drop":"哥布林大王掉落","st":{"hp":80,"def":6,"crit":0.05}},
 {"id":"r1","slot":"acc","tier":1,"name":"灵玉坠","price":450,"st":{"mp":20,"spell":0.1,"regen":0.3}},
 {"id":"r2","slot":"acc","tier":2,"name":"鹰眼戒","price":1300,"st":{"crit":0.08,"atk":4}},
 {"id":"r3","slot":"acc","tier":3,"name":"秘法项链","price":3000,"st":{"spell":0.25,"mp":40,"regen":0.6}},
 {"id":"r4","slot":"acc","tier":4,"name":"猎魔徽记","price":6000,"st":{"boss":0.3,"crit":0.1,"spell":0.15}},
 {"id":"r_blood","slot":"acc","tier":4,"name":"血月吊坠","price":0,"drop":"吸血伯爵掉落","st":{"hp":30,"mp":30,"regen":1,"boss":0.15}}];
// @EQUIP-DATA-END
const EQ=id=>EQUIP.find(q=>q.id===id);
const STAT_SHORT={atk:'攻击',hp:'生命',def:'防御',crit:'暴击',boss:'Boss伤',spell:'法伤',mp:'魔力',regen:'回魔'};
const STAT_LONG={atk:'攻击',hp:'生命',def:'防御',crit:'暴击率',boss:'Boss伤害',spell:'法术伤害',mp:'魔力上限',regen:'魔力回复'};
const PCT={crit:1,boss:1,spell:1};
function fmtV(k,v,sign=true){const s=sign&&v>=0?'+':'';return PCT[k]?s+Math.round(v*100)+'%':k==='regen'?s+(+v.toFixed(1))+'/秒':s+Math.round(v)}
function fmtStat(k,v){return STAT_SHORT[k]+fmtV(k,v)}
function gearStats(eq){const s={atk:0,hp:0,def:0,crit:0,boss:0,spell:0,mp:0,regen:0};for(const sl in eq||{}){const it=EQ(eq[sl]);if(it)for(const k in it.st)s[k]+=it.st[k]}return s}
function sellPrice(it){return it.price?Math.round(it.price*.5):400+it.tier*200}
const MP_BASE=100,MP_REGEN=.5,POTION_MP=20;
// 总属性（基础 + 淬炼 + 装备）；who = 存档(PROFILE) 或 关内玩家(G.p)
function totalStats(who,eq){const g=gearStats(eq||who.eq);return {atk:10+(who.atkLv|0)*4+g.atk,hp:maxHpFor(PROFILE)+g.hp,def:(who.defLv|0)*2+g.def,crit:g.crit,boss:g.boss,spell:g.spell,mp:MP_BASE+g.mp,regen:MP_REGEN+g.regen}}
// 关内：重新计算装备加成（最大生命、魔力上限、烈炎剑外观）
function applyGear(p,init){const s=gearStats(p.eq);p.st=s;const mh=maxHpFor(PROFILE)+s.hp;
 if(init)p.hp=mh;else if(p.maxhp&&mh>p.maxhp)p.hp+=mh-p.maxhp;p.maxhp=mh;p.hp=Math.min(p.hp,mh);
 p.mpMax=MP_BASE+s.mp;p.mp=Math.min(p.mp,p.mpMax);p.flameSword=p.eq.weapon==='w_flame'?1:0}
// 掉落：精英小概率、首领必掉；已拥有则自动按半价出售
const ELITE_TIER=[1,1,2,3,3],BOSS_TIER=[1,2,3,3,4];
function rollGear(maxT,exact){const pool=EQUIP.filter(q=>q.price&&(exact?q.tier===maxT:q.tier<=maxT));let tot=0;const w=pool.map(q=>{const x=exact?1:(maxT-q.tier+1);tot+=x;return x});let r=Math.random()*tot;for(let i=0;i<pool.length;i++){r-=w[i];if(r<=0)return pool[i].id}return pool[0].id}
function gainGear(id){const p=G.p,it=EQ(id);if(!it)return;
 if(p.owned.includes(id)){const g=sellPrice(it);p.gold+=g;msg('重复装备【'+it.name+'】自动出售 +'+g+' 金币','#ffd34a');sfx('coin');return}
 p.owned.push(id);const cur=EQ(p.eq[it.slot]);const auto=!cur||it.tier>cur.tier;if(auto){p.eq[it.slot]=id;applyGear(p)}
 msg('获得装备【'+it.name+'】'+(auto?'，已自动装备':'（可在女巫营地更换）'),TIER_COL[it.tier]);sfx('equip')}
// ---------- 商店界面（关卡选择界面 / 女巫营地共用）----------
const SHOP={col:0,row:0,note:'',noteC:'#fff',noteUntil:0};
function shopNote(t,c='#fff'){SHOP.note=t;SHOP.noteC=c;SHOP.noteUntil=performance.now()+2600}
function shopWho(){return MODE==='play'&&G?G.p:PROFILE}
function shopSelDesc(){const c=shopCols()[SHOP.col],it=c&&c[SHOP.row];return it&&it.desc||''}
function shopCols(){return SLOTS.map(s=>EQUIP.filter(q=>q.slot===s.id))}
function itemState(who,it){if(who.eq&&who.eq[it.slot]===it.id)return 'eq';if((who.owned||[]).includes(it.id))return 'own';if(!it.price)return 'drop';return who.gold>=it.price?'ok':'poor'}
function shopInput(){const cols=shopCols();if(hit('arrowleft')||hit('a'))SHOP.col=(SHOP.col+2)%3;if(hit('arrowright')||hit('d'))SHOP.col=(SHOP.col+1)%3;
 if(hit('arrowup')||hit('w'))SHOP.row=Math.max(0,SHOP.row-1);if(hit('arrowdown')||hit('s'))SHOP.row++;SHOP.row=Math.min(SHOP.row,cols[SHOP.col].length-1);
 if(hit('j')||hit('enter'))shopAct(cols[SHOP.col][SHOP.row])}
function shopAct(it){const who=shopWho(),inPlay=who!==PROFILE,st=itemState(who,it);
 if(st==='eq'){shopNote('【'+it.name+'】已经装备着','#aaa');return}
 if(st==='drop'){shopNote('【'+it.name+'】无法购买，只能由首领掉落（'+it.drop+'）','#e0b0ff');sfx('fail');return}
 if(st==='poor'){shopNote('金币不足：需要 '+it.price+'，现有 '+who.gold,'#ff8080');sfx('fail');return}
 if(st==='ok'){who.gold-=it.price;who.owned.push(it.id);if(inPlay)PROFILE.gold=Math.max(0,PROFILE.gold-it.price);sfx('coin');shopNote('购买并装备【'+it.name+'】  -'+it.price+' 金币','#ffd34a')}
 else shopNote('已装备【'+it.name+'】','#8f8');
 who.eq[it.slot]=it.id;sfx('equip');
 if(inPlay){applyGear(who);PROFILE.owned=who.owned.slice();PROFILE.eq=Object.assign({},who.eq);witchCast()}
 writeSave()}
// 装备图标（矢量，按品质着色）
function gearIcon(slot,x,y,s,col){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.lineWidth=1.5;ctx.strokeStyle='#000';ctx.fillStyle=col;
 if(slot==='weapon'){ctx.rotate(-.78);ctx.fillRect(-2.5,-15,5,21);ctx.strokeRect(-2.5,-15,5,21);ctx.fillStyle='#c09030';ctx.fillRect(-7,6,14,3.5);ctx.fillRect(-1.5,9,3,6)}
 else if(slot==='armor'){ctx.beginPath();ctx.moveTo(-11,-10);ctx.lineTo(-4,-12);ctx.lineTo(0,-8);ctx.lineTo(4,-12);ctx.lineTo(11,-10);ctx.lineTo(9,0);ctx.lineTo(8,11);ctx.lineTo(-8,11);ctx.lineTo(-9,0);ctx.closePath();ctx.fill();ctx.stroke()}
 else{ctx.beginPath();ctx.arc(0,-6,8,Math.PI*.15,Math.PI*.85,true);ctx.strokeStyle='#d0b070';ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(7,7);ctx.lineTo(0,14);ctx.lineTo(-7,7);ctx.closePath();ctx.fillStyle=col;ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=1.5;ctx.stroke()}
 ctx.restore()}
const SHOP_CW=194,SHOP_CH=52,SHOP_GAP=6;
function drawShopGrid(x0,y0){const who=shopWho(),cols=shopCols();
 SLOTS.forEach((sl,ci)=>{const x=x0+ci*(SHOP_CW+SHOP_GAP);gearIcon(sl.id,x+12,y0-16,.9,sl.col);txt(sl.name,x+28,y0-16,17,sl.col);
  cols[ci].forEach((it,ri)=>{const y=y0+ri*(SHOP_CH+SHOP_GAP),st=itemState(who,it),cur=SHOP.col===ci&&SHOP.row===ri,tc=TIER_COL[it.tier];
   rr(x,y,SHOP_CW,SHOP_CH,8);ctx.fillStyle=st==='eq'?'rgba(80,200,120,.2)':cur?'rgba(255,255,255,.14)':'rgba(0,0,0,.32)';ctx.fill();
   ctx.strokeStyle=cur?'#ffd34a':st==='eq'?'#6fd88f':'rgba(255,255,255,.12)';ctx.lineWidth=cur?2.5:1.5;ctx.stroke();
   ctx.fillStyle=tc;ctx.fillRect(x+3,y+8,3,SHOP_CH-16);
   const dim=st==='poor'||st==='drop';if(dim)ctx.globalAlpha=.62;gearIcon(it.slot,x+21,y+SHOP_CH/2,1.05,tc);
   txt(it.name,x+38,y+14,14,tc);const ss=Object.entries(it.st).map(([k,v])=>fmtStat(k,v));
   txt(ss.slice(0,2).join('  '),x+38,y+31,10.5,'#ddd','left','#000',false);if(ss.length>2)txt(ss.slice(2).join('  '),x+38,y+44,10.5,'#ddd','left','#000',false);
   const lab=st==='eq'?'装备中':st==='own'?'已拥有':st==='drop'?'首领掉落':it.price+'金';
   txt(lab,x+SHOP_CW-7,y+14,12,st==='eq'?'#8f8':st==='own'?'#9fd0ff':st==='ok'?'#ffd34a':st==='drop'?'#c9a0ff':'#ff8080','right');ctx.globalAlpha=1;
   RECTS.push({x,y,w:SHOP_CW,h:SHOP_CH,fn:()=>{if(SHOP.col===ci&&SHOP.row===ri)shopAct(it);else{SHOP.col=ci;SHOP.row=ri;sfx('coin')}}})})})}
// 右侧：当前装备 + 总属性（选中物品时显示装备后的变化）
function drawGearPanel(x,y,w,h){const who=shopWho(),cols=shopCols(),sel=cols[SHOP.col]&&cols[SHOP.col][SHOP.row];
 rr(x,y,w,h,12);ctx.fillStyle='rgba(10,6,24,.75)';ctx.fill();ctx.strokeStyle='#5a4a80';ctx.lineWidth=2;ctx.stroke();
 txt('当前装备',x+14,y+18,15,'#ffd34a');
 SLOTS.forEach((sl,i)=>{const yy=y+44+i*26,it=EQ(who.eq[sl.id]);gearIcon(sl.id,x+22,yy,.75,it?TIER_COL[it.tier]:'#555');txt(sl.name,x+36,yy,12,'#aaa');txt(it?it.name:'— 空 —',x+76,yy,13,it?TIER_COL[it.tier]:'#666')});
 const ref=(who.atkLv|0)+(who.defLv|0);let yy=y+44+3*26;if(ref){txt('淬炼  武器+'+(who.atkLv|0)+'  护甲+'+(who.defLv|0),x+14,yy,11,'#c9a0ff','left','#000',false);yy+=18}
 const cur=totalStats(who),eq2=sel?Object.assign({},who.eq,{[sel.slot]:sel.id}):who.eq,nxt=totalStats(who,eq2);
 txt('总属性'+(sel&&who.eq[sel.slot]!==sel.id?'（→ 装备 '+sel.name+'）':''),x+14,yy+4,13,'#ffd34a');yy+=24;
 const keys=['atk','hp','def','crit','boss','spell','mp','regen'];
 const rh=Math.min(20,(y+h-yy-4)/keys.length);
 keys.forEach((k,i)=>{const cy=yy+i*rh;txt(STAT_LONG[k],x+16,cy,11.5,'#c9a0ff','left','#000',false);
  const v=cur[k],d=nxt[k]-v;txt(fmtV(k,v,false),x+w-74,cy,12,'#fff','right');if(Math.abs(d)>1e-6)txt((d>0?'▲':'▼')+fmtV(k,Math.abs(d),false),x+w-68,cy,11,d>0?'#7f7':'#f77','left','#000',false)});
 txt('金币 '+who.gold,x+w-14,y+18,15,'#ffd34a','right')}
// 关卡选择界面的商店（B 键 / 按钮进入）
function drawShopScreen(){panelBG();txt('装备商店',W/2,40,30,'#ffd34a','center');drawWitchPortrait(70,46,30);txt('女巫的杂货摊：金币购买，存档保存',112,46,13,'#c9a0ff');
 drawShopGrid(36,112);drawGearPanel(642,90,290,330);
 const now=performance.now();if(now<SHOP.noteUntil)txt(SHOP.note,W/2,436,15,SHOP.noteC,'center');else{const d=shopSelDesc();txt(d||'←→↑↓ 选择  J 购买/装备  K 返回   ·   触屏：点一下选中，再点一次购买/装备',W/2,436,d?14:12,d?'#e8dcc0':'#aaa','center')}
 btn(W/2-110,466,220,44,'返回关卡选择 (K)',()=>{MODE='select'},'#4a2a6a');
 shopInput();if(hit('k')||hit('escape')||hit('b'))MODE='select'}
// ---------- 女巫：可替换美术（assets/witch_atlas.*，由 tools/witch_pack.py 从 ref/witch/ 生成）----------
function witchCast(w){w=w||(G&&G.menu&&G.menu.w);if(w)w.castUntil=performance.now()/1000+WITCH_CAST_T}
const WITCH_CAST_T=.9;
// 当前帧：施法（教学/升级/购买时）播放 cast 01–04，否则 idle 循环（约 5fps）
function witchFrame(w){const A=window.WITCH_ATLAS;if(!A||!ready('witch'))return null;const now=performance.now()/1000;
 const casting=w&&w.castUntil>now&&A.anims.cast&&A.anims.cast.length,fr=casting?A.anims.cast:A.anims.idle;
 const i=casting?Math.min(fr.length-1,Math.floor((now-(w.castUntil-WITCH_CAST_T))/WITCH_CAST_T*fr.length)):Math.floor(now*((A.fps&&A.fps.idle)||5))%fr.length;
 return A.frames[fr[Math.max(0,i)]]}
function drawWitchSprite(w,sx,y,sc=1){const f=witchFrame(w);if(!f)return false;const A=window.WITCH_ATLAS,s=(A.s||.625)*sc;
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(IMG.witch,f.x,f.y,f.w,f.h,sx-f.ax*s,y-f.ay*s,f.w*s,f.h*s);ctx.restore();return true}
// 圆形头像（女巫菜单 / 商店标题）
function drawWitchPortrait(x,y,r){ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fillStyle='#24163c';ctx.fill();ctx.clip();
 const A=window.WITCH_ATLAS,f=A&&ready('witch')&&A.face&&A.frames[A.face];
 if(f){ctx.imageSmoothingQuality='high';ctx.drawImage(IMG.witch,f.x,f.y,f.w,f.h,x-r,y-r,2*r,2*r)}
 else{ctx.translate(x,y+r*.55);const k=r/26;ctx.scale(k,k);ctx.beginPath();ctx.moveTo(-22,30);ctx.lineTo(-14,-2);ctx.lineTo(14,-2);ctx.lineTo(22,30);ctx.fillStyle='#4a2a6a';ctx.fill();
  ell(0,-14,14,14,'#b8d890');ctx.fillStyle=OUT;ctx.fillRect(-6,-16,3.5,3.5);ctx.fillRect(3,-16,3.5,3.5);
  ell(0,-24,30,7,'#3a1a5a');ctx.beginPath();ctx.moveTo(-14,-24);ctx.lineTo(10,-60);ctx.lineTo(14,-24);ctx.fillStyle='#3a1a5a';ctx.fill();ctx.fillStyle='#c070ff';ctx.fillRect(-13,-31,27,5)}
 ctx.restore();ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.strokeStyle='#c070ff';ctx.lineWidth=3;ctx.stroke()}
// 半身像（底部对齐 x,yb，高 h）；没有美术时退回圆形头像
function drawWitchBust(x,yb,h,alpha=1){const A=window.WITCH_ATLAS,f=A&&ready('witch')&&A.portrait&&A.frames[A.portrait];
 if(!f){drawWitchPortrait(x,yb-h/2,h/3);return}const k=h/f.h;ctx.save();ctx.globalAlpha=alpha;ctx.imageSmoothingQuality='high';ctx.drawImage(IMG.witch,f.x,f.y,f.w,f.h,x-f.w*k/2,yb-h,f.w*k,h);ctx.restore()}
