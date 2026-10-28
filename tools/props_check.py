# 道具图集检查表：所有帧按锚点对齐到红色底线，黄色十字为光源位置 → screenshot_props_check.png
import json,os
from PIL import Image,ImageDraw
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J=json.load(open(f'{ROOT}/assets/props_atlas.json'));A=Image.open(f'{ROOT}/assets/props_atlas.png')
rows=[[k for k in J['frames'] if k.startswith(('lamp','brazier'))],[k for k in J['frames'] if k.startswith('bush') and not k.endswith('_fg')]+[k for k in J['frames'] if k.startswith('grass') and not k.endswith('_fg')],[k for k in J['frames'] if k.endswith('_fg')]]
W=1900;o=Image.new('RGBA',(W,240+150+200+40),(70,80,90,255));d=ImageDraw.Draw(o);base=[230,380,600]
for r,ks in enumerate(rows):
  x=20;sc=1 if r<2 else .55
  for k in ks:
    f=J['frames'][k];im=A.crop((f['x'],f['y'],f['x']+f['w'],f['y']+f['h']))
    if sc!=1:im=im.resize((int(im.width*sc),int(im.height*sc)))
    ax=int(f['ax']*sc);o.alpha_composite(im,(x,base[r]-int(f['ay']*sc)))
    for lx,ly in f.get('lights',[]):cx,cy=x+ax+int(lx*sc),base[r]+int(ly*sc);d.line((cx-6,cy,cx+6,cy),fill='yellow',width=2);d.line((cx,cy-6,cx,cy+6),fill='yellow',width=2)
    d.text((x,base[r]+4),k,fill='white');x+=max(im.width,90)+14
  d.line((0,base[r],W,base[r]),fill='red',width=1)
o.convert('RGB').save(f'{ROOT}/screenshot_props_check.png')
