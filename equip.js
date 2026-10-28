'use strict';
// ===== 装备系统：武器 / 护甲 / 饰品 =====
// 属性 st：atk 攻击  hp 生命  def 防御  crit 暴击率  boss 首领伤害+%  spell 法术伤害+%  mp 魔力上限  regen 魔力回复/秒
// 价格按每关金币收入定价（第1关约 3000–4000，之后每关约 2000–3000）：T1 第1关后、T2 第2关后、T3 第3–4关、T4 终盘目标
const SLOTS=[{id:'weapon',name:'武器',col:'#ffb060'},{id:'armor',name:'护甲',col:'#8fc8ff'},{id:'acc',name:'饰品',col:'#d79bff'}];
const TIER_COL=['#cfcfcf','#9fe08f','#5ab8ff','#d08cff','#ffb030'];
// 数据块由 tools/equip_csv.js 从 docs/equipment.csv 生成/回写（name 名称、desc 描述、lore 背景故事）；手改也可以，改完运行 export 同步表格
// @EQUIP-DATA-BEGIN
const EQUIP=[
 {"id":"w1","slot":"weapon","tier":1,"name":"青钢剑","price":300,"st":{"atk":6},"desc":"入门剑客的佩剑，轻巧趁手。","lore":"师父在你离开山门那天亲手交给你的剑。剑柄缠的青绳打了个奇怪的结，师父说：\"哪天你在别处见到同样的结，就停下来想一想。\""},
 {"id":"w2","slot":"weapon","tier":2,"name":"寒铁剑","price":900,"st":{"atk":12,"crit":0.05},"desc":"雪山寒铁所铸，偶尔能刺中要害。","lore":"剑铺老板说，这批寒铁是十年前一位青衣客从雪山背下来的，他付钱时手套里滴出的不是汗，是冰水。那人后来再没回来取剑。"},
 {"id":"w3","slot":"weapon","tier":3,"name":"屠魔剑","price":2000,"st":{"atk":18,"boss":0.2},"desc":"专为斩杀魔物而铸，对首领伤害更高。","lore":"剑身刻着一行小字：\"斩魔者，终成魔。\"女巫卖给你时说这只是铁匠的玩笑。她说这话时，没有看你的眼睛。"},
 {"id":"w4","slot":"weapon","tier":4,"name":"龙渊剑","price":4200,"st":{"atk":28,"crit":0.1,"boss":0.25},"desc":"传说中的名剑，锋芒所至，首领亦惧。","lore":"龙渊剑曾封印过黑夜古堡的主人。封印破碎那夜，剑被人从古堡带出，剑柄上缠着一根青绳，打着你见过的那个结。"},
 {"id":"w_flame","slot":"weapon","tier":4,"name":"烈炎剑","price":0,"drop":"焰魔王掉落","st":{"atk":20,"spell":0.15,"boss":0.1},"desc":"焰魔王的心火凝成，挥剑时法术更强。","lore":"焰魔王倒下前，把剑推到你面前：\"拿去吧，反正……他也用过。\"火光里，剑身映出一个穿青衣的背影，不是你。"},
 {"id":"a1","slot":"armor","tier":1,"name":"皮甲","price":250,"st":{"hp":20,"def":1},"desc":"朴素的皮甲，聊胜于无。","lore":"森林猎户的旧甲，内衬绣着一个名字，被人用刀刮掉了。猎户说，这是从一个昏倒在林边的青衣少年身上捡来的。"},
 {"id":"a2","slot":"armor","tier":2,"name":"锁子甲","price":750,"st":{"hp":40,"def":3},"desc":"环环相扣，挡得住哥布林的乱刀。","lore":"锁子甲的扣环有一枚是银的，与别的都不一样。女巫说那是\"补丁\"。吸血伯爵最怕的，就是银。"},
 {"id":"a3","slot":"armor","tier":3,"name":"玄铁甲","price":1800,"st":{"hp":70,"def":5},"desc":"火山玄铁所铸，沉重而坚固。","lore":"铸甲的老矿工说，火山里的熔岩本来是冷的，是\"那个人\"去了以后才烧起来的。他不肯说那个人是谁，只说那人穿青衣，带着一位女巫。"},
 {"id":"a4","slot":"armor","tier":4,"name":"龙鳞甲","price":3600,"st":{"hp":110,"def":8,"regen":0.3},"desc":"龙鳞缀成，能慢慢愈合穿戴者的伤口。","lore":"据说龙鳞甲会记住每一任主人的血。你穿上它的第一晚，梦里有人叫你\"师弟\"。"},
 {"id":"a_king","slot":"armor","tier":4,"name":"大王战甲","price":0,"drop":"哥布林大王掉落","st":{"hp":80,"def":6,"crit":0.05},"desc":"哥布林大王的战甲，粗犷却意外合身。","lore":"大王战甲是按人类身形打的，根本不是哥布林的尺码。山谷里的哥布林说，大王的甲是\"古堡里的老爷\"赏的，作为看守山门的报酬。"},
 {"id":"r1","slot":"acc","tier":1,"name":"灵玉坠","price":280,"st":{"mp":20,"spell":0.1,"regen":0.3},"desc":"温润的灵玉，能涵养魔力。","lore":"女巫送你的第一件礼物，免费的。玉里封着一缕红雾，她说那是\"好运\"。夜深时，红雾会朝着黑夜古堡的方向轻轻飘动。"},
 {"id":"r2","slot":"acc","tier":2,"name":"鹰眼戒","price":800,"st":{"crit":0.08,"atk":4},"desc":"鹰眼宝石镶嵌的戒指，让出手更精准。","lore":"戒指内圈刻着两个名字的首字，一个是你师父的，另一个被磨平了。猎鹰从不落在戴着它的人肩上，除非那人穿着青衣。"},
 {"id":"r3","slot":"acc","tier":3,"name":"秘法项链","price":1900,"st":{"spell":0.25,"mp":40,"regen":0.6},"desc":"流动着秘法的项链，大幅强化法术。","lore":"女巫年轻时的项链。她说自己早就不需要了，可每次你施法时，她的手都会下意识地按住空空的领口。"},
 {"id":"r4","slot":"acc","tier":4,"name":"猎魔徽记","price":3900,"st":{"boss":0.3,"crit":0.1,"spell":0.15},"desc":"猎魔人公会的最高徽记，对首领效果拔群。","lore":"徽记背面刻着历任持有者的名字，最后一行是你师父，倒数第二行被划掉了，旁边有人用血补了一句：\"他没有堕落，他是为了救她。\""},
 {"id":"r_blood","slot":"acc","tier":4,"name":"血月吊坠","price":0,"drop":"吸血伯爵掉落","st":{"hp":30,"mp":30,"regen":1,"boss":0.15},"desc":"吸血伯爵心爱的吊坠，生命与魔力源源不绝。","lore":"打开吊坠，里面是一张小像：年轻的女巫依偎着一个穿青衣的剑客。伯爵临死前握着它说：\"告诉她……锅里的药，我一直没喝。\"原来女巫卖给你的每一件装备，都是在引你去古堡，替她结束那个她下不了手的人。"}];
// @EQUIP-DATA-END
const EQ=id=>EQUIP.find(q=>q.id===id);
const STAT_SHORT={atk:'攻击',hp:'生命',def:'防御',crit:'暴击',boss:'Boss伤',spell:'法伤',mp:'魔力',regen:'回魔'};
const STAT_LONG={atk:'攻击',hp:'生命',def:'防御',crit:'暴击率',boss:'Boss伤害',spell:'法术伤害',mp:'魔力上限',regen:'魔力回复'};
const PCT={crit:1,boss:1,spell:1};
function fmtV(k,v,sign=true){const s=sign&&v>=0?'+':'';return PCT[k]?s+Math.round(v*100)+'%':k==='regen'?s+(+v.toFixed(1))+'/秒':s+Math.round(v)}
function fmtStat(k,v){return STAT_SHORT[k]+fmtV(k,v)}
function gearStats(eq){const s={atk:0,hp:0,def:0,crit:0,boss:0,spell:0,mp:0,regen:0};for(const sl in eq||{}){const it=EQ(eq[sl]);if(it)for(const k in it.st)s[k]+=it.st[k]}return s}
function sellPrice(it){return it.price?Math.round(it.price*.5):100+it.tier*120}
const MP_BASE=150,MP_REGEN=.8,POTION_MP=20;
// 总属性（基础 + 淬炼 + 装备）；who = 存档(PROFILE) 或 关内玩家(G.p)
function totalStats(who,eq){const g=gearStats(eq||who.eq);return {atk:10+(who.atkLv|0)*4+g.atk,hp:maxHpFor(PROFILE)+g.hp,def:(who.defLv|0)*2+g.def,crit:g.crit,boss:g.boss,spell:g.spell,mp:MP_BASE+g.mp,regen:MP_REGEN+g.regen}}
// 关内：重新计算装备加成（最大生命、魔力上限、烈炎剑外观）
function applyGear(p,init){const s=gearStats(p.eq);p.st=s;const mh=maxHpFor(PROFILE)+s.hp;
 if(init)p.hp=mh;else if(p.maxhp&&mh>p.maxhp)p.hp+=mh-p.maxhp;p.maxhp=mh;p.hp=Math.min(p.hp,mh);
 p.mpMax=MP_BASE+s.mp;p.mp=Math.min(p.mp,p.mpMax);p.flameSword=p.eq.weapon==='w_flame'?1:0}
// 掉落：精英小概率、首领必掉；已拥有则自动按半价出售
const ELITE_TIER=[1,1,2,3,3],BOSS_TIER=[1,2,3,3,4];
function rollGear(maxT,exact){const pool=EQUIP.filter(q=>q.price&&(exact?q.tier===maxT:q.tier<=maxT));let tot=0;const w=pool.map(q=>{const x=exact?1:(maxT-q.tier+1);tot+=x;return x});let r=Math.random()*tot;for(let i=0;i<pool.length;i++){r-=w[i];if(r<=0)return pool[i].id}return pool[0].id}
// 获得装备（第 7 轮）：放进背包，不再自动替换已穿戴的装备——
// 槽位空着才直接穿上；否则弹出提示「立即装备？J 是 / K 留在背包」（期间游戏暂停）。本关所有掉落列在结算界面。
function gainGear(id){const p=G.p,it=EQ(id);if(!it)return;const D=(G.drops||(G.drops=[]));
 if(p.owned.includes(id)){const g=sellPrice(it);p.gold+=g;D.push({id,res:'sold',g});msg('重复装备【'+it.name+'】自动出售 +'+g+' 金币','#ffd34a');sfx('coin');return}
 p.owned.push(id);const cur=EQ(p.eq[it.slot]);
 if(!cur){p.eq[it.slot]=id;applyGear(p);D.push({id,res:'eq'});msg('获得装备【'+it.name+'】，已装备（空槽位）',TIER_COL[it.tier]);sfx('equip');return}
 const d={id,res:'bag'};D.push(d);(G.gearQ||(G.gearQ=[])).push(d);G.gearPT=0;pressed.j=pressed.k=pressed.enter=false;
 msg('获得装备【'+it.name+'】，已放入背包',TIER_COL[it.tier]);sfx('equip')}
function gearOpen(){return !!(G&&G.gearQ&&G.gearQ.length)}
function gearAnswer(yes){const d=G.gearQ.shift(),p=G.p,it=EQ(d.id);if(yes){p.eq[it.slot]=d.id;applyGear(p);d.res='eq';msg('已装备【'+it.name+'】',TIER_COL[it.tier]);sfx('equip')}else{msg('【'+it.name+'】留在背包（可在女巫营地/商店更换）','#ccc');sfx('coin')}G.gearPT=0}
function gearPromptInput(dt){G.gearPT=(G.gearPT||0)+dt;if(G.gearPT<.3){pressed.j=pressed.k=false;return}
 if(hit('j')||hit('enter'))gearAnswer(true);else if(hit('k')||hit('escape'))gearAnswer(false)}
function drawGearPrompt(){const d=G.gearQ[0],it=EQ(d.id),p=G.p,cur=EQ(p.eq[it.slot]);ctx.fillStyle='rgba(5,3,15,.6)';ctx.fillRect(0,0,W,H);
 const x=W/2-250,y=150,w=500,h=230;rr(x,y,w,h,14);ctx.fillStyle='rgba(24,16,44,.96)';ctx.fill();ctx.strokeStyle=TIER_COL[it.tier];ctx.lineWidth=3;ctx.stroke();
 txt('获得新装备',W/2,y+24,15,'#c9a0ff','center');gearIcon(it.slot,x+40,y+60,1.3,TIER_COL[it.tier]);txt(it.name,x+64,y+56,22,TIER_COL[it.tier]);
 txt(Object.entries(it.st).map(([k,v])=>fmtStat(k,v)).join('  '),x+64,y+82,13,'#9fe08f','left','#000',false);
 txt('当前：'+(cur?cur.name:'—')+'（'+Object.entries(cur?cur.st:{}).map(([k,v])=>fmtStat(k,v)).join(' ')+'）',x+24,y+110,12,'#aaa','left','#000',false);
 const a=totalStats(p),b=totalStats(p,Object.assign({},p.eq,{[it.slot]:it.id}));const ch=[];for(const k of ['atk','hp','def','crit','boss','spell','mp','regen']){const dv=b[k]-a[k];if(Math.abs(dv)>1e-6)ch.push({k,dv})}
 ch.forEach((c,i)=>{const cx=x+24+(i%4)*118,cy=y+136+Math.floor(i/4)*20;txt(STAT_LONG[c.k]+' '+(c.dv>0?'▲':'▼')+fmtV(c.k,Math.abs(c.dv),false),cx,cy,12,c.dv>0?'#7f7':'#f77','left','#000',false)});
 btn(x+40,y+h-52,190,40,'立即装备 (J)',()=>{if(G.gearPT>=.3)gearAnswer(true)},'#3a7a2a');btn(x+w-230,y+h-52,190,40,'留在背包 (K)',()=>{if(G.gearPT>=.3)gearAnswer(false)});
 if(G.gearQ.length>1)txt('还有 '+(G.gearQ.length-1)+' 件',x+w-14,y+20,11,'#aaa','right','#000',false)}
// ---------- 商店界面（关卡选择界面 / 女巫营地共用）----------
const SHOP={col:0,row:0,note:'',noteC:'#fff',noteUntil:0};
function shopNote(t,c='#fff'){SHOP.note=t;SHOP.noteC=c;SHOP.noteUntil=performance.now()+2600}
function shopWho(){return MODE==='play'&&G?G.p:PROFILE}
function shopSelDesc(){const c=shopCols()[SHOP.col],it=c&&c[SHOP.row];if(!it)return '';return (it.desc||'')+(it.lore&&SHOP.view!==1?'   ·  点「说明」或按 V 看背景故事':'')}
function shopCols(){return SLOTS.map(s=>EQUIP.filter(q=>q.slot===s.id))}
function itemState(who,it){if(who.eq&&who.eq[it.slot]===it.id)return 'eq';if((who.owned||[]).includes(it.id))return 'own';if(!it.price)return 'drop';return who.gold>=it.price?'ok':'poor'}
function shopInput(){const cols=shopCols();if(hit('v')){SHOP.view=SHOP.view?0:1;sfx('coin')}if(SHOP.view===1){if(hit('pageup'))scrollLore(-60);if(hit('pagedown'))scrollLore(60)}if(hit('arrowleft')||hit('a'))SHOP.col=(SHOP.col+2)%3;if(hit('arrowright')||hit('d'))SHOP.col=(SHOP.col+1)%3;
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
// 自动换行（中文逐字；行首不放标点，行尾不放开引号/开括号）
const NO_HEAD='，。、；：？！…）」』”’》〉】,.;:?!)%',NO_TAIL='（「『“‘《〈【(';
function wrapText(t,maxW,size,bold=false){ctx.font=(bold?'bold ':'')+size+'px "PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
 const out=[];for(const para of String(t||'').split('\n')){let line='';const ch=[...para];
  for(let i=0;i<ch.length;i++){const c=ch[i];if(line&&ctx.measureText(line+c).width>maxW){
    if(NO_HEAD.includes(c)){line+=c;continue} // 标点悬挂在行尾
    let carry='';while(line.length>1&&NO_TAIL.includes(line[line.length-1])){carry=line[line.length-1]+carry;line=line.slice(0,-1)}
    out.push(line);line=carry+c}else line+=c}
  out.push(line)}return out}
// 物品说明（名称、品质、属性、描述、背景故事）；内容超出时可滚动（滚轮 / 拖动 / ▲▼ / PgUp PgDn）
function drawItemInfo(it,x,y,w,h){const who=shopWho(),st=itemState(who,it),tc=TIER_COL[it.tier];
 const key=it.id+'|'+w;if(SHOP.loreFor!==key){SHOP.loreFor=key;SHOP.loreY=0}
 const pad=12;let iw=w-pad*2,rows;const build=()=>{rows=[];const L=(t,sz,c,lh,bold=false)=>{for(const l of wrapText(t,iw,sz,bold))rows.push({t:l,sz,c,lh,bold})};
 L(SLOTS.find(s=>s.id===it.slot).name+' · '+['','一','二','三','四'][it.tier]+'阶 · '+(st==='eq'?'装备中':st==='own'?'已拥有':it.price?it.price+' 金币':(it.drop||'首领掉落')),11.5,'#aaa',17);
 {ctx.font='bold 12.5px "PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif';let ln='';for(const tk of Object.entries(it.st).map(([k,v])=>fmtStat(k,v))){const t2=ln?ln+'  '+tk:tk;if(ln&&ctx.measureText(t2).width>iw){rows.push({t:ln,sz:12.5,c:'#9fe08f',lh:18,bold:true});ln=tk}else ln=t2}if(ln)rows.push({t:ln,sz:12.5,c:'#9fe08f',lh:18,bold:true})} // 属性按词条换行，不拆开
 if(it.desc){rows.push({gap:6});L(it.desc,13,'#f0e6c8',19)}
 if(it.lore){rows.push({gap:8,rule:1});L(it.lore,12.5,'#cbbfe6',19)}
 if(!it.desc&&!it.lore){rows.push({gap:6});L('（暂无说明）',12,'#777',18)}};
 const vh0=h-32,tot=()=>rows.reduce((a,r)=>a+(r.gap||r.lh),0);build();if(tot()>vh0-4){iw-=20;build()} // 需要滚动时给 ▲▼ 留出位置
 gearIcon(it.slot,x+pad+9,y+14,1,tc);txt(it.name,x+pad+26,y+14,17,tc);
 const top=y+32,vh=h-32;let total=0;for(const r of rows)total+=r.gap||r.lh;const maxS=Math.max(0,total-vh+4);SHOP.loreMax=maxS;SHOP.loreY=clamp(SHOP.loreY||0,0,maxS);
 ctx.save();ctx.beginPath();ctx.rect(x,top,w,vh);ctx.clip();let cy=top-SHOP.loreY;
 for(const r of rows){if(r.gap){if(r.rule){ctx.fillStyle='rgba(201,160,255,.25)';ctx.fillRect(x+pad,cy+r.gap/2,iw,1)}cy+=r.gap;continue}
  if(cy+r.lh>top-20&&cy<top+vh+20)txt(r.t,x+pad,cy+r.lh/2,r.sz,r.c,'left','#000',r.bold);cy+=r.lh}
 ctx.restore();
 if(maxS>0){const bx=x+w-22;const fr=SHOP.loreY/maxS;ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(x+w-5,top+4,3,vh-8);ctx.fillStyle='#c9a0ff';ctx.fillRect(x+w-5,top+4+(vh-8-24)*fr,3,24);
  [[-1,top+2,'▲'],[1,top+vh-24,'▼']].forEach(([d,by,t])=>{const off=d<0?SHOP.loreY<=0:SHOP.loreY>=maxS;rr(bx-6,by,20,22,6);ctx.fillStyle=off?'rgba(40,30,60,.5)':'rgba(90,60,140,.9)';ctx.fill();txt(t,bx+4,by+11,11,off?'#666':'#fff','center');
   RECTS.push({x:bx-14,y:by-6,w:36,h:34,fn:()=>scrollLore(d*60)})})}}
function scrollLore(d){SHOP.loreY=clamp((SHOP.loreY||0)+d,0,SHOP.loreMax||0)}
function shopPanelOpen(){return MODE==='shop'||(MODE==='play'&&G&&G.menu&&G.menu.tab===1)}
window.__scrollPanel=d=>{if(shopPanelOpen()&&SHOP.view===1)scrollLore(d)};
document.getElementById('c').addEventListener('wheel',e=>{if(shopPanelOpen()&&SHOP.view===1){e.preventDefault();scrollLore(e.deltaY*.5)}},{passive:false});
// 右侧面板：页签「属性」（当前装备 + 总属性，选中物品时显示装备后的变化）/「说明」（选中物品的描述与背景故事）
function drawGearPanel(x,y,w,h){const who=shopWho(),cols=shopCols(),sel=cols[SHOP.col]&&cols[SHOP.col][SHOP.row];
 rr(x,y,w,h,12);ctx.fillStyle='rgba(10,6,24,.75)';ctx.fill();ctx.strokeStyle='#5a4a80';ctx.lineWidth=2;ctx.stroke();
 ['属性','说明'].forEach((t,i)=>{const tx=x+8+i*62,on=(SHOP.view|0)===i;rr(tx,y+6,58,26,8);ctx.fillStyle=on?'#6a3aa0':'rgba(0,0,0,.35)';ctx.fill();ctx.strokeStyle=on?'#ffd34a':'#5a4a80';ctx.lineWidth=1.5;ctx.stroke();
  txt(t,tx+29,y+19,13,on?'#fff':'#aaa','center');RECTS.push({x:tx,y:y+2,w:58,h:34,fn:()=>{SHOP.view=i}})});
 txt('(V)',x+134,y+19,10,'#777','left','#000',false);txt('金币 '+who.gold,x+w-12,y+19,14,'#ffd34a','right');
 if(SHOP.view===1){if(sel)drawItemInfo(sel,x,y+40,w,h-44);return}
 SLOTS.forEach((sl,i)=>{const yy=y+52+i*24,it=EQ(who.eq[sl.id]);gearIcon(sl.id,x+22,yy,.75,it?TIER_COL[it.tier]:'#555');txt(sl.name,x+36,yy,12,'#aaa');txt(it?it.name:'— 空 —',x+76,yy,13,it?TIER_COL[it.tier]:'#666')});
 const ref=(who.atkLv|0)+(who.defLv|0);let yy=y+52+3*24-4;if(ref){txt('淬炼  武器+'+(who.atkLv|0)+'  护甲+'+(who.defLv|0),x+14,yy,11,'#c9a0ff','left','#000',false);yy+=18}
 const cur=totalStats(who),eq2=sel?Object.assign({},who.eq,{[sel.slot]:sel.id}):who.eq,nxt=totalStats(who,eq2);
 txt('总属性'+(sel&&who.eq[sel.slot]!==sel.id?'（→ '+sel.name+'）':''),x+14,yy+4,13,'#ffd34a');yy+=24;
 const keys=['atk','hp','def','crit','boss','spell','mp','regen'];
 const rh=Math.min(20,(y+h-yy-4)/keys.length);
 keys.forEach((k,i)=>{const cy=yy+i*rh;txt(STAT_LONG[k],x+16,cy,11.5,'#c9a0ff','left','#000',false);
  const v=cur[k],d=nxt[k]-v;txt(fmtV(k,v,false),x+w-74,cy,12,'#fff','right');if(Math.abs(d)>1e-6)txt((d>0?'▲':'▼')+fmtV(k,Math.abs(d),false),x+w-68,cy,11,d>0?'#7f7':'#f77','left','#000',false)})}
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
