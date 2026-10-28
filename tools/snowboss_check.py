# 生成 screenshot_snowboss_check.png：所有帧按脚底锚点对齐在同一地平线上（检查单人物、无晕边、比例/锚点一致）
import json,os
from PIL import Image,ImageDraw,ImageFont
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J=json.load(open(f'{ROOT}/assets/snowboss_atlas.json'));A=Image.open(f'{ROOT}/assets/snowboss_atlas.png')
try:font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',16)
except Exception:font=None
body=['idle','walk_0','walk_1','walk_2','swing','smash','summon','throw','shock','death']
fxs=['spike_a','spike_b','snowball','face_normal','face_angry','face_roar','face_hurt','face_dead']
cw,base=330,330;out=Image.new('RGB',(cw*5,(base+40)*2+260),(52,62,84));d=ImageDraw.Draw(out)
for i,k in enumerate(body):
  f=J['frames'][k];im=A.crop((f['x'],f['y'],f['x']+f['w'],f['y']+f['h']))
  col,row=i%5,i//5;ox=col*cw+cw//2;oy=row*(base+40)+base
  bg=(214,226,240) if (i+row)%2 else (120,132,150);d.rectangle((col*cw,row*(base+40),col*cw+cw-2,oy+38),fill=bg)
  d.line((col*cw,oy,col*cw+cw,oy),fill=(255,60,60));d.line((ox,oy-300,ox,oy+8),fill=(255,60,60))
  out.paste(im,(ox-f['ax'],oy-f['ay']),im);d.text((col*cw+6,row*(base+40)+4),k,fill=(0,0,0),font=font)
y0=(base+40)*2+10;x=10
for k in fxs:
  f=J['frames'][k];im=A.crop((f['x'],f['y'],f['x']+f['w'],f['y']+f['h']));d.rectangle((x-4,y0,x+im.width+4,y0+230),fill=(120,132,150) if k.startswith('face') else (40,70,50))
  out.paste(im,(x,y0+20),im);d.text((x,y0+2),k,fill=(255,255,255),font=font);x+=im.width+24
out.save(f'{ROOT}/screenshot_snowboss_check.png');print(out.size)
