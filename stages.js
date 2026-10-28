'use strict';
// ===== 关卡配置（可替换背景）=====
// 每关的 far 字段指向远景图（assets/bg/ 下）。要替换美术：把图片放进 assets/bg/，改这里的路径即可；
// far 为 null 时使用程序化占位背景（不会请求任何文件）。图片建议高度 320px，横向可无缝平铺。
// hpMul：本关敌人血量倍率；countMul：每波人数倍率（四舍五入，精英也会增加）；batches：每波分几批出现（场上剩 ≤1 只时下一批增援入场）。三者用于调节关卡时长。
// waves 字段用简写（|bridge 桥段窄通道，|river 浅水减速）：'类型*数量,类型*数量'；elite: true 表示关中精英波；rest: true 表示该波之后有女巫休息点。
const STAGES=[
 {id:1,name:'暗夜森林',theme:'森林',placeholder:false,far:'assets/bg/stage1_far.jpg',farY:-10,farAlpha:.85,
  sky:['#0b0d24','#1a1840'],ground:{base:'#2a3a2c',path:'#6b4a3a',pathHi:'rgba(150,110,80,.35)',edge:'#3d5a3a'},
  decor:'forest',ambient:['fireflies'],diff:1,hpMul:1.8,countMul:2,batches:3,boss:'goblin_chief',
  waves:['goblin*3','goblin*4','goblin*4,goblin_spear*1|rest','goblin*5,goblin_spear*1','goblin*4,goblin_spear*2','goblin_captain*1,goblin*3|elite',
   'goblin*6|rest','goblin*5,goblin_spear*2','goblin*4,goblin_spear*3','goblin_captain*1,goblin*4,goblin_spear*1|elite','goblin*6,goblin_spear*2|rest','goblin*5,goblin_spear*3',
   'goblin*7','goblin_captain*2,goblin*3|elite','goblin*6,goblin_spear*3|rest','goblin*6,goblin_spear*3','goblin*8,goblin_spear*2','goblin_captain*2,goblin*4,goblin_spear*2|elite'],
  hazards:{}},
 {id:2,name:'雪岭寒关',theme:'雪山',placeholder:false,far:'assets/bg/stage2_far.jpg',farY:-20,farAlpha:.9,
  sky:['#8fb4e0','#dce8f6'],ground:{base:'#c9d6e6',path:'#e8eef6',pathHi:'rgba(255,255,255,.5)',edge:'#a8bcd4'},
  decor:'snow',ambient:['snow'],diff:1.35,hpMul:1.2,countMul:1.5,batches:3,boss:'great_yeti',resist:{ice:.5,fire:1.5},
  waves:['yeti_pup*4','yeti*2,yeti_pup*3','yeti_thrower*2,yeti_pup*3|rest','yeti*3,yeti_thrower*1,yeti_pup*2','yeti_pup*7','yeti_big*1,yeti_pup*3|elite',
   'yeti*3,yeti_thrower*2|rest','yeti_pup*5,yeti_thrower*2','yeti*4,yeti_pup*3','yeti_big*1,yeti*2,yeti_thrower*2|elite','yeti_pup*6,yeti_thrower*2|rest','yeti*4,yeti_thrower*3',
   'yeti_pup*8,yeti*2','yeti_big*2,yeti_pup*3|elite','yeti*4,yeti_thrower*3|rest','yeti_pup*6,yeti*3,yeti_thrower*2','yeti*5,yeti_thrower*3','yeti_big*2,yeti*3,yeti_thrower*2|elite'],
  hazards:{rocks:{from:6,kind:'icicle',every:4.5}}},
 {id:3,name:'熔岩火山',theme:'火山',placeholder:false,far:'assets/bg/stage3_far.jpg',farY:-30,farAlpha:.95,
  sky:['#2a0806','#6a1a0a'],ground:{base:'#1c1414',path:'#2a2222',pathHi:'rgba(255,90,20,.12)',edge:'#3a1a10'},
  decor:'volcano',ambient:['embers','ash','shimmer'],diff:1.75,hpMul:1.3,batches:2,boss:'flame_king',resist:{fire:.5,ice:1.5},
  waves:['lava_imp*4','lava_imp*3,flame_warrior*1','flame_warrior*2,flame_caster*1,lava_imp*2|rest','lava_imp*5,flame_caster*1','flame_warrior*2,lava_imp*3,flame_caster*1','rock_golem*1,lava_imp*3|elite',
   'flame_warrior*3,flame_caster*2|rest','lava_imp*7,flame_caster*1','flame_warrior*3,lava_imp*3|bridge','lava_imp*6,flame_caster*2|bridge','rock_golem*1,flame_warrior*2,flame_caster*1|elite|bridge','flame_warrior*3,flame_caster*2,lava_imp*2|rest|bridge',
   'lava_imp*8,flame_caster*2','flame_warrior*4,lava_imp*3,flame_caster*1','rock_golem*2,lava_imp*4|elite','lava_imp*6,flame_caster*3|rest','flame_warrior*4,lava_imp*4,flame_caster*2','rock_golem*2,flame_warrior*2,flame_caster*2|elite'],
  hazards:{cracks:{per:3,warn:1,act:.8,idle:2.4,dmg:9},rocks:{from:8,kind:'meteor',every:3.5}},
  bridge:{top:362,bot:418}},
 {id:4,name:'溪谷森林',theme:'溪谷',placeholder:false,far:'assets/bg/stage4_far.jpg',farY:-25,farAlpha:1,
  sky:['#bfe0f0','#e8f4e0'],ground:{base:'#4a6a34',path:'#8a6a44',pathHi:'rgba(200,230,140,.25)',edge:'#3a5a2a'},
  decor:'valley',ambient:['leaves','fireflies','shafts'],diff:2.2,hpMul:1.1,batches:2,boss:'goblin_king',
  waves:['goblin*4,goblin_spear*2','goblin_archer*2,goblin*3','goblin_jumper*2,goblin*3,goblin_spear*1|rest','goblin_spear*3,goblin_archer*2,goblin*2','goblin_jumper*3,goblin*4','goblin_lt*1,goblin*3,goblin_archer*1|elite',
   'goblin*5,goblin_spear*2|rest','goblin_archer*3,goblin_jumper*3','goblin*3,goblin_spear*3|bridge','goblin_jumper*3,goblin_archer*2|bridge','goblin*4,goblin_spear*2,goblin_archer*2|river|rest','goblin_lt*1,goblin_jumper*2,goblin_archer*2|elite|river',
   'goblin*6,goblin_archer*3','goblin_jumper*4,goblin_spear*3','goblin_lt*2,goblin*3|elite|rest','goblin*5,goblin_archer*3,goblin_jumper*2','goblin_spear*4,goblin_jumper*3,goblin_archer*2','goblin_lt*2,goblin_spear*3,goblin_jumper*2,goblin_archer*2|elite'],
  hazards:{},bridge:{top:360,bot:416},river:{top:300,bot:470,slow:.55}},
 {id:5,name:'黑夜古堡',theme:'古堡',placeholder:false,far:'assets/bg/stage5_far.jpg',farY:-20,farAlpha:1,final:1,
  sky:['#05060f','#1a1a30'],ground:{base:'#1a1a24',path:'#2e2e3c',pathHi:'rgba(180,200,255,.14)',edge:'#2a2a36'},
  decor:'castle',ambient:['redleaves','fog','bats','lightning'],diff:2.7,hpMul:1.15,boss:'vampire_count',resist:{thunder:1.4,fire:1.3},
  waves:['bat*4|bridge','bat*3,goblin_merc*2|bridge','bat*4,flame_caster*2|rest|bridge','goblin_merc*3,goblin_archer*2,bat*2','giant_bat*1,bat*4|elite','flame_warrior*2,flame_caster*2,bat*2|rest',
   'goblin_merc*4,bat*4','bat*6,goblin_archer*2','giant_bat*1,goblin_merc*3,flame_caster*1|elite','mini:goblin_king_shade|elite|rest','bat*6,flame_caster*2|hall','giant_bat*2,goblin_merc*3|elite|hall',
   'bat*6,goblin_archer*2,flame_caster*2|rest|hall','goblin_merc*5,bat*4|hall','flame_warrior*3,flame_caster*2,bat*4|hall','giant_bat*2,bat*6,goblin_merc*3,flame_caster*2|elite|hall'],
  hazards:{rocks:{from:6,kind:'bolt',every:4.2}},bridge:{top:362,bot:418},
  hall:{tint:'rgba(30,0,12,.5)',name:'王座大厅'}}
];
const WAVE_GAP=760,WAVE_START=520;
function buildStage(s){
 const waves=[],witches=[],segs=[];let x=WAVE_START;
 s.waves.forEach((w,i)=>{const [list,...flags]=w.split('|');const L=[];if(list.startsWith('mini:')){L.push(list)}else list.split(',').forEach(p=>{const [t,n]=p.split('*');const c=Math.max(1,Math.round((+n||1)*(s.countMul||1)));for(let k=0;k<c;k++)L.push(t)});
  const wv={x,list:L,elite:flags.includes('elite'),bridge:flags.includes('bridge')};waves.push(wv);
  if(wv.bridge)segs.push({x0:x-200,x1:x+W+200,top:s.bridge.top,bot:s.bridge.bot,type:'bridge'});
  if(flags.includes('hall'))segs.push({x0:x-300,x1:x+W+400,top:LANE_TOP,bot:LANE_BOT,type:'hall'});
  if(flags.includes('river'))segs.push({x0:x-100,x1:x+W+100,top:s.river.top,bot:s.river.bot,type:'river',slow:s.river.slow});
  if(flags.includes('rest'))witches.push({x:x+W+60,y:320});
  x+=WAVE_GAP+ (wv.elite?200:0)+ (flags.includes('rest')?360:0);});
 // 合并相邻桥段
 const merged=[];segs.forEach(g=>{const m=merged[merged.length-1];if(m&&g.x0<=m.x1&&m.type===g.type)m.x1=g.x1;else merged.push({...g})});
 const bossX=x+200;waves.push({x:bossX,list:[],boss:s.boss});
 if(s.hall)merged.push({x0:bossX-400,x1:bossX+W+400,top:LANE_TOP,bot:LANE_BOT,type:'hall'});
 return {waves,witches,segs:merged,end:bossX+W+40};
}
