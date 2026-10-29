# 普通哥布林图集（第 13 轮）：ref/mobs/goblin/ 新帧（96x80，锚点 48,76，朝右）+ 旧图集保留 idle / run / jumpatk
# 用法：python3 tools/goblin_v2.py [旧图集目录=备份目录] [输出前缀=assets/goblin_atlas]
import json,sys,os,glob
from PIL import Image
OLD=sys.argv[1] if len(sys.argv)>1 else 'assets';OUT=sys.argv[2] if len(sys.argv)>2 else 'assets/goblin_atlas'
SRC=os.environ.get('GOB_DIR','ref/mobs/goblin')
old=json.load(open(f'{OLD}/goblin_atlas.json'));oim=Image.open(f'{OLD}/goblin_atlas.png').convert('RGBA')
anc=json.load(open(f'{SRC}/anchors.json'))
cells=[];anims={}
for an in ('idle','run','jumpatk'):
    anims[an]=[]
    for k in old['anims'][an]:
        f=old['frames'][k];cells.append((k,oim.crop((f['x'],f['y'],f['x']+f['w'],f['y']+f['h'])),f['ax'],f['ay']));anims[an].append(k)
for st,S in anc['states'].items():
    anims[st]=[]
    for i,fn in enumerate(S['frames']):
        im=Image.open(f'{SRC}/{fn}.png').convert('RGBA');bb=im.split()[3].getbbox();fa=anc['frames'][fn]
        x0,y0=max(0,bb[0]-1),max(0,bb[1]-1);x1,y1=min(im.width,bb[2]+1),min(im.height,bb[3]+1)
        k=f'{st}_{i}';cells.append((k,im.crop((x0,y0,x1,y1)),fa['ax']-x0,fa['ay']-y0));anims[st].append(k)
anims['hurt']=anims['hit']
# 简单行打包
W=1024;x=y=rowh=0;pos={}
for k,im,ax,ay in cells:
    if x+im.width>W:x=0;y+=rowh+2;rowh=0
    pos[k]=(x,y);x+=im.width+2;rowh=max(rowh,im.height)
H=y+rowh;sheet=Image.new('RGBA',(W,H))
frames={}
for k,im,ax,ay in cells:
    px,py=pos[k];sheet.paste(im,(px,py));frames[k]={'x':px,'y':py,'w':im.width,'h':im.height,'ax':ax,'ay':ay}
sheet.save(OUT+'.png',optimize=True)
J={'image':'assets/goblin_atlas.png','source':'ref/mobs/goblin (new) + ref/goblin_sheet.png (idle/run/jumpatk)','frames':frames,'anims':anims,
   'timing':{k:{kk:vv for kk,vv in v.items() if kk!='frames'} for k,v in anc['states'].items()}}
json.dump(J,open(OUT+'.json','w'),ensure_ascii=False)
import os
# 同一个 .js 里还有 window.BIGGOBLIN_ATLAS 等其他图集：保留它们，只替换 GOBLIN_ATLAS 这一行
rest=[l for l in open(OUT+'.js').read().splitlines() if l.strip() and not l.startswith('window.GOBLIN_ATLAS=')] if os.path.exists(OUT+'.js') else []
open(OUT+'.js','w').write('\n'.join(['window.GOBLIN_ATLAS='+json.dumps(J,ensure_ascii=False)+';']+rest)+'\n')
print(len(frames),'frames',{k:len(v) for k,v in anims.items()},sheet.size)
