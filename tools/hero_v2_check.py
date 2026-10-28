# 主角动画检查：screenshot_anim_check.png（各动画逐帧按锚点对齐：红线=脚底基线，蓝线=水平锚点）
# + anim_preview.gif（待机 8fps / 行走 12fps / 四段连斩 20,20,18,18fps / 受击）
import json,os
from PIL import Image,ImageDraw
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J=json.load(open(f'{ROOT}/assets/hero_atlas.json'));A=Image.open(f'{ROOT}/assets/hero_atlas.png')
def fr(k,z=1.0):
  f=J['frames'][k];im=A.crop((f['x'],f['y'],f['x']+f['w'],f['y']+f['h']));s=f.get('s',1)*z
  return im.resize((max(1,round(im.width*s)),max(1,round(im.height*s))),Image.LANCZOS),f['ax']*s,f['ay']*s
rows=['idle','walk','atk1','atk2','atk3','atk4','hurt']
CW,RH=150,175;W=CW*8+120;o=Image.new('RGB',(W,RH*(len(rows)+1)+20),(92,104,96));d=ImageDraw.Draw(o)
for r,an in enumerate(rows):
  by=r*RH+150;d.line((0,by,W,by),fill=(220,40,40));d.text((6,by-140),an,fill='white')
  for i,k in enumerate(J['anims'][an]):
    im,ax,ay=fr(k,1.25);cx=120+i*CW+CW//2;o.paste(im,(int(cx-ax),int(by-ay)),im);d.line((cx,by-150,cx,by+4),fill=(60,120,255));d.text((cx-30,by+4),k,fill='white')
# 末行：头像 + 换色后的旧帧
by=len(rows)*RH+150;d.line((0,by,W,by),fill=(220,40,40));d.text((6,by-140),'old(teal)',fill='white')
im,ax,ay=fr('portrait',1);o.paste(im,(120,by-140),im)
for i,k in enumerate(['jump_1','thrust_1','spin_1','wavecast_0','charge_0','ult_0','down_1']):
  im,ax,ay=fr(k,1.25);cx=290+i*CW;o.paste(im,(int(cx-ax),int(by-ay)),im);d.text((cx-30,by+4),k,fill='white')
o.save(f'{ROOT}/screenshot_anim_check.png')
# GIF
seq=[]
for rep in range(2):seq+=[(k,125) for k in J['anims']['idle']]
for rep in range(2):seq+=[(k,83) for k in J['anims']['walk']]
for a,ms in [('atk1',50),('atk2',50),('atk3',55),('atk4',55)]:seq+=[(k,ms) for k in J['anims'][a]]
seq+=[(J['anims']['idle'][0],300)]+[(k,100) for k in J['anims']['hurt']]+[(J['anims']['idle'][0],400)]
frames=[];durs=[]
for k,ms in seq:
  c=Image.new('RGB',(320,230),(70,84,76));dd=ImageDraw.Draw(c);dd.ellipse((110,196,190,212),fill=(50,60,54))
  im,ax,ay=fr(k,1.3);c.paste(im,(int(150-ax),int(205-ay)),im);dd.text((6,6),k,fill='white');frames.append(c);durs.append(ms)
frames[0].save(f'{ROOT}/anim_preview.gif',save_all=True,append_images=frames[1:],duration=durs,loop=0)
print('ok',len(frames))
