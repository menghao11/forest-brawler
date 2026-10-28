# 道具图集：ref/props_cut/*.png（tools/props_cut.py 用 rembg BiRefNet 抠出，保留地面石块底座）
# → 去灰边/只留主体 → 统一底线锚点、预缩放 → assets/props_atlas.png/.json/.js
# 灯具额外记录光源位置（lights）用于游戏内加色光晕；火盆拆成底座 + 火焰两层，火焰在游戏内摇曳
# 灌木/草另生成前景版本（_fg：更大、压暗、轻微模糊），供近景视差层使用，避免运行时滤镜开销
import os,json
import numpy as np
from PIL import Image,ImageFilter,ImageEnhance
from scipy import ndimage as nd
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CUT=f'{ROOT}/ref/props_cut'
FLAME_CUT=.36   # 火盆：此高度比例以上为火焰层
LAMPS=['lamp_wood','lamp_stonehang','lamp_iron','lamp_crystal','brazier','lamp_wall','lamp_gothic']
BUSH=['bush_flower','bush_dark','bush_yellow','bush_blue','bush_red','bush_snow']
GRASS=['grass_flower','grass_pampas','grass_green','grass_leafy','grass_fern','grass_dry','grass_frost']
HT={**{k:200 for k in LAMPS},'brazier':190,**{k:105 for k in BUSH},**{k:90 for k in GRASS}}
FG_H={**{k:180 for k in BUSH},**{k:160 for k in GRASS}}
def clean(img,keep_min=60):
  a=np.array(img.convert('RGBA')).astype(float);al=a[...,3]/255
  al=np.clip((al-.2)/.6,0,1)
  m=al>.5;lab,n=nd.label(m);sz=nd.sum(m,lab,range(1,n+1));core=lab==(np.argmax(sz)+1)
  near=nd.binary_dilation(core,iterations=6);keep=core.copy()
  for i in range(1,n+1):
    c=lab==i
    if sz[i-1]>keep_min and (c&near).any():keep|=c
  al=al*nd.binary_dilation(keep,iterations=1)
  inner=al>.95
  idx=nd.distance_transform_edt(~inner,return_distances=False,return_indices=True)
  rgb=a[...,:3][idx[0],idx[1]];semi=(al>0)&~inner;a[...,:3][semi]=rgb[semi];a[...,3]=al*255
  o=Image.fromarray(a.clip(0,255).astype(np.uint8));return o.crop(o.getbbox())
def scale_to(im,h):
  s=h/im.height;return im.resize((max(1,round(im.width*s)),h),Image.LANCZOS).filter(ImageFilter.UnsharpMask(1,30,2))
def anchor(im):
  al=np.array(im)[...,3];rows=(al>128).sum(1);ys=np.where(rows>=3)[0];foot=int(ys.max())
  yy,xx=np.where(al>128);low=yy>foot-im.height*.15;return int(np.median(xx[low])),foot
LIGHT_FIX={'lamp_stonehang':[(.79,.52)],'lamp_wall':[(.80,.55)],'lamp_gothic':[(.31,.38),(.78,.39)]}  # 自动检测偏差时手动指定（宽高比例）
def lights(im,k):
  if k in LIGHT_FIX:return [[int(fx*im.width),int(fy*im.height)] for fx,fy in LIGHT_FIX[k]]  # 光源位置：灯罩内最亮的一小撮像素（按亮度^4 加权质心）
  a=np.array(im).astype(float);al=a[...,3];r,g,b=a[...,0],a[...,1],a[...,2]
  if k=='lamp_crystal':v=b+.5*g-r
  elif k=='lamp_gothic':v=r-.7*g-.3*b
  else:v=r+g-b
  def top(mask):
    vv=np.where(mask&(al>200),v,-1e9);thr=np.percentile(vv[mask&(al>200)],98.5);yy,xx=np.where(vv>=thr);w=(vv[yy,xx]-thr+1)**2
    return [int(np.average(xx,weights=w)),int(np.average(yy,weights=w))]
  X=np.arange(im.width)[None,:]+np.zeros((im.height,1))
  if k=='lamp_gothic':return [top(X<im.width/2),top(X>=im.width/2)]
  return [top(X>=0)]
frames={}
for k in LAMPS+BUSH+GRASS:
  im=clean(Image.open(f'{CUT}/{k}.png'))
  big=im
  im=scale_to(big,HT[k]);ax,ay=anchor(im)
  if k=='brazier':  # 火焰层：火盆口以上的火焰色像素，游戏内以加色叠加 + 拉伸摇曳
    a=np.array(im).copy();r,g,b=[a[...,i].astype(int) for i in range(3)]
    fl=(r>170)&(r-b>70)&(a[...,3]>40);cut=int(FLAME_CUT*im.height);fl[cut:]=False
    fa=nd.gaussian_filter(fl.astype(float),1.2);a[...,3]=(fa*a[...,3]).astype(np.uint8)
    fi=Image.fromarray(a);bb=fi.getbbox();fi=fi.crop(bb)
    frames['brazier_flame']=(fi,ax-bb[0],cut-bb[1],[])
    frames['brazier']=(im,ax,ay,[[ax,int(im.height*.2)]])
    continue
  frames[k]=(im,ax,ay,lights(im,k) if k in LAMPS else [])
  if k in FG_H:
    f=scale_to(big,FG_H[k]);f=ImageEnhance.Brightness(f).enhance(.5);f=ImageEnhance.Color(f).enhance(.8);f=f.filter(ImageFilter.GaussianBlur(1.6))
    fx,fy=anchor(f);frames[k+'_fg']=(f,fx,fy,[])
W=2048;x=y=rowh=0;pos={}
for k in sorted(frames,key=lambda k:-frames[k][0].height):
  im=frames[k][0]
  if x+im.width+2>W:x=0;y+=rowh+2;rowh=0
  pos[k]=(x,y);x+=im.width+2;rowh=max(rowh,im.height)
H=y+rowh;atlas=Image.new('RGBA',(W,H))
out={'image':'assets/props_atlas.png','frames':{}}
for k,(im,ax,ay,L) in frames.items():
  px,py=pos[k];atlas.paste(im,(px,py));d={'x':px,'y':py,'w':im.width,'h':im.height,'ax':ax,'ay':ay}
  if L:d['lights']=[[lx-ax,ly-ay] for lx,ly in L]
  out['frames'][k]=d
atlas.save(f'{ROOT}/assets/props_atlas.png',optimize=True)
json.dump(out,open(f'{ROOT}/assets/props_atlas.json','w'),ensure_ascii=False)
open(f'{ROOT}/assets/props_atlas.js','w').write('window.PROPS_ATLAS='+json.dumps(out,separators=(',',':'))+';\n')
print(W,H,len(frames))
