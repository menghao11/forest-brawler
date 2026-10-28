#!/usr/bin/env node
// 装备表 ⇄ 游戏数据
//   node tools/equip_csv.js export   equip.js 中的 EQUIP → docs/equipment.csv（给文案编辑；Excel 可直接打开，UTF-8 BOM）
//   node tools/equip_csv.js import   docs/equipment.csv → 回写 equip.js 的 @EQUIP-DATA 块（会先校验）
//   node tools/equip_csv.js check    只校验 CSV，不写文件
// 列：id, slot, tier, stats, price, name, description, lore
//   slot  weapon 武器 / armor 护甲 / acc 饰品（也接受中文）
//   tier  1–4（品质颜色：1 绿 2 蓝 3 紫 4 橙）
//   stats 形如 atk=12;crit=0.05 。键：atk 攻击 hp 生命 def 防御 crit 暴击率(0.05=5%) boss Boss伤害(0.2=+20%) spell 法术伤害 mp 魔力上限 regen 魔力回复/秒
//   price 金币价格；首领专属掉落写 drop:掉落说明（如 drop:焰魔王掉落），商店不出售
//   name / description / lore  文案；以「【待写】」开头或留空视为占位，游戏里不显示
// id 是存档里的引用，已上线的 id 不要改名或删除（删除后玩家已拥有的该装备会失效）
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),JS=path.join(ROOT,'equip.js'),CSV=path.join(ROOT,'docs','equipment.csv');
const COLS=['id','slot','tier','stats','price','name','description','lore'];
const STATS=['atk','hp','def','crit','boss','spell','mp','regen'],SLOT_ZH={'武器':'weapon','护甲':'armor','饰品':'acc'},SLOTS=['weapon','armor','acc'];
const PH='【待写】';
function readJS(){const src=fs.readFileSync(JS,'utf8');const m=src.match(/\/\/ @EQUIP-DATA-BEGIN\n([\s\S]*?)\n\/\/ @EQUIP-DATA-END/);if(!m)throw Error('equip.js 缺少 @EQUIP-DATA 标记');
 const EQUIP=new Function(m[1].replace(/^const EQUIP=/,'return '))();return {src,m,EQUIP}}
const q=v=>{v=v==null?'':String(v);return /[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
function parseCSV(t){t=t.replace(/^\uFEFF/,'');const rows=[];let row=[],f='',i=0,inq=false;
 for(;i<t.length;i++){const c=t[i];if(inq){if(c==='"'){if(t[i+1]==='"'){f+='"';i++}else inq=false}else f+=c}
  else if(c==='"')inq=true;else if(c===','){row.push(f);f=''}else if(c==='\n'||c==='\r'){if(c==='\r'&&t[i+1]==='\n')i++;row.push(f);rows.push(row);row=[];f=''}else f+=c}
 if(f!==''||row.length){row.push(f);rows.push(row)}return rows.filter(r=>r.some(x=>x.trim()!==''))}
function exportCSV(){const {EQUIP}=readJS();const lines=[COLS.join(',')];
 for(const it of EQUIP){const st=Object.entries(it.st).map(([k,v])=>k+'='+v).join(';');
  lines.push([it.id,it.slot,it.tier,st,it.price?it.price:'drop:'+(it.drop||'首领掉落'),it.name,it.desc||PH+'装备描述（一句话，界面显示）',it.lore||PH+'背景故事'].map(q).join(','))}
 fs.mkdirSync(path.dirname(CSV),{recursive:true});fs.writeFileSync(CSV,'\uFEFF'+lines.join('\r\n')+'\r\n');console.log('导出',EQUIP.length,'件装备 →',path.relative(ROOT,CSV))}
function readCSV(){const rows=parseCSV(fs.readFileSync(CSV,'utf8'));const head=rows.shift().map(h=>h.trim().toLowerCase());
 const miss=COLS.filter(c=>!head.includes(c));if(miss.length)throw Error('CSV 缺少列：'+miss.join(','));const errs=[],items=[],ids=new Set();
 rows.forEach((r,ri)=>{const g=c=>(r[head.indexOf(c)]||'').trim(),line=ri+2,E=m=>errs.push('第'+line+'行 '+m);
  const id=g('id');if(!/^[a-z][a-z0-9_]*$/.test(id))E('id 只能用小写字母/数字/下划线：'+id);if(ids.has(id))E('id 重复：'+id);ids.add(id);
  const slot=SLOT_ZH[g('slot')]||g('slot');if(!SLOTS.includes(slot))E('slot 应为 weapon/armor/acc：'+g('slot'));
  const tier=+g('tier');if(!(tier>=1&&tier<=4&&Number.isInteger(tier)))E('tier 应为 1–4：'+g('tier'));
  const st={};for(const kv of g('stats').split(/[;；]/).map(x=>x.trim()).filter(Boolean)){const [k,v]=kv.split(/[=:：]/).map(x=>x.trim());if(!STATS.includes(k))E('未知属性 '+k+'（可用：'+STATS.join(' ')+'）');else if(!isFinite(+v))E('属性值不是数字：'+kv);else st[k]=+v}
  if(!Object.keys(st).length)E('stats 为空');
  const pr=g('price');let price=0,drop;if(/^drop[:：]/i.test(pr))drop=pr.replace(/^drop[:：]/i,'').trim()||'首领掉落';else{price=+pr;if(!(price>0&&Number.isInteger(price)))E('price 应为正整数或 drop:说明：'+pr)}
  const txt=c=>{const v=g(c);return v.startsWith(PH)?'':v};const name=g('name');if(!name)E('name 为空');
  const it={id,slot,tier,name,price};if(drop)it.drop=drop;it.st=st;const d=txt('description'),l=txt('lore');if(d)it.desc=d;if(l)it.lore=l;items.push(it)});
 for(const s of SLOTS)if(!items.some(i=>i.slot===s&&i.price))errs.push('槽位 '+s+' 没有可购买的装备');
 if(errs.length)throw Error('CSV 校验失败：\n  '+errs.join('\n  '));return items}
function importCSV(write){const items=readCSV();const {src,m,EQUIP}=readJS();
 const gone=EQUIP.filter(o=>!items.some(i=>i.id===o.id)).map(o=>o.id);if(gone.length)console.warn('警告：这些 id 被删除，玩家存档里的同名装备会失效：',gone.join(','));
 const order=['id','slot','tier','name','price','drop','st','desc','lore'];
 const body='const EQUIP=[\n'+items.map(it=>' '+JSON.stringify(Object.fromEntries(order.filter(k=>it[k]!==undefined).map(k=>[k,it[k]])))).join(',\n')+'];';
 if(!write){console.log('CSV 校验通过：',items.length,'件');return}
 fs.writeFileSync(JS,src.replace(m[0],'// @EQUIP-DATA-BEGIN\n'+body+'\n// @EQUIP-DATA-END'));console.log('已导入',items.length,'件装备 → equip.js（记得把 index.html 里 equip.js 的 ?v= 版本号加一）')}
const cmd=process.argv[2];
try{if(cmd==='export')exportCSV();else if(cmd==='import')importCSV(true);else if(cmd==='check')importCSV(false);else console.log('用法：node tools/equip_csv.js export | import | check')}catch(e){console.error(e.message);process.exit(1)}
