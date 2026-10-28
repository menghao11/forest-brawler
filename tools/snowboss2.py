# 大雪人BOSS 切图：ref/snowboss_sheet.png → assets/snowboss_atlas.png/.json（并更新 assets/snowman_atlas.js 中的 SNOWBOSS_ATLAS）
# 1) 每个动作面板用 rembg(BiRefNet) 抠出人物（结果缓存于 ref/snowboss_cut/，缺失时自动重新生成；每张单独进程以免爆内存）
# 2) 去重影：只保留主体连通块、alpha 收紧、半透明边缘颜色取最近内部像素（去背景色晕边）
# 3) 统一比例与脚底锚点；所有帧朝右（砸地帧镜像），游戏内按朝向翻转
# 4) 特效单独成图：冰锥 ×2、巨型雪球；表情头像 ×5 用于首领血条
import os,sys,json,re,subprocess
import numpy as np
from PIL import Image,ImageFilter
from scipy import ndimage as nd
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHEET=Image.open(f'{ROOT}/ref/snowboss_sheet.png').convert('RGB')
CUT=f'{ROOT}/ref/snowboss_cut'
R1,R2,F=562,753,1.5
PANELS={'idle':(5,8,205,130,R1),'walk_0':(222,10,332,130,R1),'walk_1':(330,10,442,130,R1),'walk_2':(440,10,548,130,R1),
 'swing':(545,-14,752,130,R1),'smash':(750,-14,1022,130,R1),
 'summon':(8,12,272,170,R2),'throw':(272,12,535,170,R2),'shock':(535,12,822,170,R2),'death':(820,12,1022,170,R2)}
def panel(k):
  a,b,c,d,y0=PANELS[k];return SHEET.crop((int(a*F),y0+int(b*F),int(c*F),y0+int(d*F)))
def rembg_one(k):
  p=f'{CUT}/{k}.png'
  if os.path.exists(p):return Image.open(p)
  tmp=f'/tmp/sb_raw_{k}.png';panel(k).save(tmp)
  subprocess.check_call([sys.executable,'-c',f"from rembg import remove,new_session;from PIL import Image;remove(Image.open('{tmp}'),session=new_session('birefnet-general')).save('{p}')"])
  return Image.open(p)
SCALE={'idle':.82}          # 待机面板画得偏大，缩到与行走一致
FLIP={'smash'}              # 砸地帧原图朝左
UP=1.5                      # 图集放大倍率（游戏内再缩放绘制）
def clean(img):
  a=np.array(img.convert('RGBA')).astype(float);al=a[...,3]/255
  al=np.clip((al-.25)/.55,0,1)
  m=al>.5;lab,n=nd.label(m);sz=nd.sum(m,lab,range(1,n+1));core=lab==(np.argmax(sz)+1)
  near=nd.binary_dilation(core,iterations=2);keep=core.copy()
  for i in range(1,n+1):
    c=lab==i
    if sz[i-1]>40 and (c&near).any():keep|=c
  al=al*nd.binary_dilation(keep,iterations=1)
  inner=al>.95
  idx=nd.distance_transform_edt(~inner,return_distances=False,return_indices=True)
  rgb=a[...,:3][idx[0],idx[1]]
  semi=(al>0)&~inner;a[...,:3][semi]=rgb[semi]
  a[...,3]=al*255
  o=Image.fromarray(a.clip(0,255).astype(np.uint8));bb=o.getbbox();return o.crop(bb)
frames={}
for k in PANELS:
  raw=rembg_one(k)
  if k=='shock':  # 去掉左侧插入的冰晶碎片（冲击波冰锥由游戏代码另行绘制）
    a=np.array(raw.convert('RGBA'));a[:97,:143,3]=0;raw=Image.fromarray(a)
  if k=='death':  # 去掉右上角冰晶
    a=np.array(raw.convert('RGBA'));bb=raw.getbbox();x0=int(bb[0]+(bb[2]-bb[0])*.86);y1=int(bb[1]+(bb[3]-bb[1])*.55)
    sub=a[:y1,x0:].astype(int);ice=(sub[...,2]-sub[...,0]>20);a[:y1,x0:,3][ice]=0;raw=Image.fromarray(a)
  im=clean(raw)
  if k in FLIP:im=im.transpose(Image.FLIP_LEFT_RIGHT)
  s=SCALE.get(k,1)*UP
  im=im.resize((round(im.width*s),round(im.height*s)),Image.LANCZOS).filter(ImageFilter.UnsharpMask(1,40,2))
  al=np.array(im)[...,3];ys,xs=np.where(al>128)
  foot=ys.max();low=ys>foot-(foot-ys.min())*.35
  ax=int(np.median(xs[low])) if k!='death' else im.width//2
  frames[k]=(im,ax,foot)
# 特效：冰锥（冰锥召唤面板左侧）、巨型雪球（雪球投掷面板，圆形裁切）
summ=np.array(panel('summon')).astype(float)
def spike(x0,y0,x1,y1):
  s=summ[y0:y1,x0:x1];bg=np.median(s[:6].reshape(-1,3),0);d=np.sqrt(((s-bg)**2).sum(2))
  m=nd.binary_fill_holes(nd.binary_opening(d>45,iterations=1));lab,n=nd.label(m);sz=nd.sum(m,lab,range(1,n+1));m=lab==np.argmax(sz)+1
  al=nd.gaussian_filter(m.astype(float),.7);H=s.shape[0];al*=np.clip((H-np.arange(H))/(H*.25),0,1)[:,None]
  im=Image.fromarray(np.dstack([s,al*255]).clip(0,255).astype(np.uint8));im=im.resize((im.width*2,im.height*2),Image.LANCZOS)
  return im,im.width//2,im.height-1
frames['spike_a']=spike(10,50,62,150)
frames['spike_b']=spike(330,70,370,150)
th=np.array(panel('throw')).astype(float);cx,cy,r=305,82,62
yy,xx=np.mgrid[:th.shape[0],:th.shape[1]];dd=np.hypot(xx-cx,yy-cy)
al=np.clip((r-dd)/3,0,1);ball=Image.fromarray(np.dstack([th,al*255]).clip(0,255).astype(np.uint8)).crop((cx-r-2,cy-r-2,cx+r+2,cy+r+2))
frames['snowball']=(ball,ball.width//2,ball.height//2)
# 表情头像（方形裁切，背景保留，游戏内圆形遮罩）
FX0,FY0=750,347
for i,(nm,cx) in enumerate([('face_normal',80),('face_angry',236),('face_roar',396),('face_hurt',549),('face_dead',699)]):
  im=SHEET.crop((FX0+cx-66,FY0+20,FX0+cx+66,FY0+152)).resize((112,112),Image.LANCZOS);frames[nm]=(im.convert('RGBA'),56,56)
# 打包
W=2048;x=y=rowh=0;pos={}
order=sorted(frames,key=lambda k:-frames[k][0].height)
for k in order:
  im=frames[k][0]
  if x+im.width>W:x=0;y+=rowh+2;rowh=0
  pos[k]=(x,y);x+=im.width+2;rowh=max(rowh,im.height)
H=y+rowh;atlas=Image.new('RGBA',(W,H))
J={"image":"assets/snowboss_atlas.png","source":"ref/snowboss_sheet.png","frames":{},"anims":{
 "idle":["idle"],"walk":["walk_0","walk_1","walk_2","walk_1"],"swing":["swing"],"smash":["smash"],"summon":["summon"],
 "throw":["throw"],"shock":["shock"],"death":["death"],"hurt":["idle"]}}
for k,(im,ax,ay) in frames.items():
  px,py=pos[k];atlas.alpha_composite(im,(px,py));J['frames'][k]={"x":px,"y":py,"w":im.width,"h":im.height,"ax":int(ax),"ay":int(ay)}
atlas.save(f'{ROOT}/assets/snowboss_atlas.png');json.dump(J,open(f'{ROOT}/assets/snowboss_atlas.json','w'),ensure_ascii=False)
js=open(f'{ROOT}/assets/snowman_atlas.js').read()
js=re.sub(r'window\.SNOWBOSS_ATLAS=.*',lambda m:'window.SNOWBOSS_ATLAS='+json.dumps(J,ensure_ascii=False)+';',js)
open(f'{ROOT}/assets/snowman_atlas.js','w').write(js)
print(atlas.size,{k:(v['w'],v['h']) for k,v in J['frames'].items()})
