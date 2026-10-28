# 主角新动画帧：ref/hero_frames_v2.png（预览图：格子 + 灰白棋盘格假透明 + 文件名标签）
# 1) tools/hero_v2_cut.py：按格裁切（横向扩到相邻格中点以保住越界剑尖）×3 放大 → rembg BiRefNet → ref/hero_v2_cut/
# 2) 本脚本：棋盘格清理（与外部连通的中性浅灰/白像素一律透明）→ 只留主体（含剑）→ alpha 收紧 + 边缘去灰晕
#    → 全部帧统一缩放（以待机身高为准）→ 脚底基线 + 躯干中心（同动画内平滑）作为锚点
# 3) 与旧图集中保留的动作（跳、突刺、旋风斩、剑气、蓄力、终结技、倒地等）合并；旧帧蓝色衣袍色相偏移到新青绿色
# 4) 新动作帧（ref/jump_01~06、thrust_01~06、whirlwind_01~08，288x192 透明 PNG，已统一 1.6 倍分辨率）：
#    锚点取 ref/new_moves_anchors.json（ax=128 躯干中心，ay=185 脚底基线），裁到包围盒后入图集，替换旧的跳跃/突刺/旋风斩帧
# 输出 assets/hero_atlas.png/.json/.js（帧带 s 字段：绘制时额外缩放，新帧以 1.6 倍分辨率存储）
import os,sys,json
import numpy as np
from PIL import Image,ImageFilter
from scipy import ndimage as nd
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));from hero_v2_cells import wide_cells
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHEET=Image.open(f'{ROOT}/ref/hero_frames_v2.png').convert('RGB')
RES=1.6            # 新帧存储倍率（游戏内 ×1/RES 绘制）
IDLE_H=100*RES     # 待机身高（与旧帧一致，游戏内 HS=.85）
UP=3               # 裁切放大倍率（与 hero_v2_cut.py 一致）
def checker_clean(cut,orig):
  # 白色飘带 / 内衬是半透明画在棋盘格上的，带有格子纹理：保留形状，但把其中中性浅色像素换成
  # 只在中性像素上做的大半径归一化模糊（抹平格子纹理）；半透明的中性边缘像素视为棋盘格晕边，压低 alpha
  a=np.array(cut.convert('RGBA')).astype(float);al=a[...,3]/255
  rgb=a[...,:3];mx=rgb.max(2);mn=rgb.min(2)
  neutral=(mx-mn<22)&(mn>140)&(al>0)
  w=neutral.astype(float);sig=4*UP
  num=np.dstack([nd.gaussian_filter(rgb[...,i]*w,sig) for i in range(3)]);den=nd.gaussian_filter(w,sig)[...,None]
  flat=num/np.maximum(den,1e-3)
  rgb[neutral]=flat[neutral]
  al[neutral&(al<.85)]*=.35
  a[...,:3]=rgb;a[...,3]=al*255;return Image.fromarray(a.clip(0,255).astype(np.uint8))
def add_sword(cut,orig,inner):
  # BiRefNet 常把灰色剑身当作背景（与灰色棋盘格相近）：在原图中找“非棋盘格”像素
  # （偏暗的描边或有色像素），只取格子内部、与人物相连的部分，闭运算补齐剑身后并入 alpha
  a=np.array(cut).astype(float);al=a[...,3]/255;o=np.array(orig).astype(float)
  lum=o.mean(2);sat=o.max(2)-o.min(2);nc=(lum<165)|(sat>28)
  x0,x1=inner;nc[:,:x0]=0;nc[:,x1:]=0;nc[:3*UP]=0;nc[-3*UP:]=0
  body=nd.binary_dilation(al>.5,iterations=2*UP)
  lab,n=nd.label(nc);hit=np.unique(lab[body&nc]);hit=hit[hit>0]
  add=np.isin(lab,hit)&~(al>.5)
  add=nd.binary_closing(add|(al>.5),iterations=UP+1)&~(al>.5)
  # 只保留细长部分（剑），避免把大片背景并入：去掉与原 alpha 无关的大块
  lab2,n2=nd.label(add);keep=np.zeros_like(add)
  for i in range(1,n2+1):
    c=lab2==i;sz=c.sum()
    if sz<40:continue
    ys,xs=np.where(c);span=max(np.ptp(xs),np.ptp(ys))+1
    if sz/span<9*UP:keep|=c      # 平均宽度不超过约 9px（原图约 3px）
  al=np.maximum(al,nd.gaussian_filter(keep.astype(float),.8)*(keep|nd.binary_dilation(keep)))
  a[...,3]=al*255;a[...,:3][keep]=o[keep];return Image.fromarray(a.clip(0,255).astype(np.uint8))
def clean(img):
  a=np.array(img).astype(float);al=a[...,3]/255
  al=np.clip((al-.25)/.55,0,1)
  m=al>.5;lab,n=nd.label(m);sz=nd.sum(m,lab,range(1,n+1));core=lab==(np.argmax(sz)+1)
  near=nd.binary_dilation(core,iterations=8);keep=core.copy()
  for i in range(1,n+1):
    c=lab==i
    if sz[i-1]>150 and (c&near).any():keep|=c
  al=al*nd.binary_dilation(keep,iterations=1)
  inner=al>.95
  idx=nd.distance_transform_edt(~inner,return_distances=False,return_indices=True)
  rgb=a[...,:3][idx[0],idx[1]];semi=(al>0)&~inner;a[...,:3][semi]=rgb[semi];a[...,3]=al*255
  return Image.fromarray(a.clip(0,255).astype(np.uint8))
raw={}
from hero_v2_cells import cells
INNER={n:b for n,b in cells()}
for n,b in wide_cells():
  orig=SHEET.crop(b);orig=orig.resize((orig.width*UP,orig.height*UP),Image.LANCZOS)
  cut=Image.open(f'{ROOT}/ref/hero_v2_cut/{n}.png').convert('RGBA')
  ib=INNER[n];inner=((ib[0]-b[0])*UP,(ib[2]-b[0])*UP)
  raw[n]=clean(checker_clean(add_sword(cut,orig,inner),orig))
def feet_y(al):
  rows=(al>128).sum(1);ys=np.where(rows>=14)[0];return int(ys.max())
def torso_x(al,fy):
  ys,xs=np.where(al>128);top=ys.min();h=fy-top
  sel=(ys>top+h*.35)&(ys<top+h*.62)
  # 剑是细长条：只统计每行最长连续段附近（取该带内像素的中位数，剑像素占比很小）
  return float(np.median(xs[sel]))
# 统一缩放：以待机帧身高中位数为准
hs=[feet_y(np.array(raw[k])[...,3])-np.where(np.array(raw[k])[...,3]>128)[0].min() for k in raw if k.startswith('idle')]
S=IDLE_H/np.median(hs)
info={}
for k,im in raw.items():
  im=im.resize((max(1,round(im.width*S)),max(1,round(im.height*S))),Image.LANCZOS).filter(ImageFilter.UnsharpMask(1,25,2))
  al=np.array(im)[...,3];fy=feet_y(al);tx=torso_x(al,fy)
  bb=im.getbbox();im=im.crop(bb);info[k]=[im,tx-bb[0],fy-bb[1]]
# 锚点：ay=脚底基线；ax=躯干中心，同一动画内做 3 帧滑动平均（循环动画首尾相接）以消除抖动，保留真实的重心位移
groups={}
for k in info:groups.setdefault(k.rsplit('_',1)[0],[]).append(k)
OUT={}
for g,ks in groups.items():
  ks.sort();n=len(ks);cyc=g in('idle','walk')
  # 躯干中心相对“脚底中点”的偏移做平滑，再加回脚底中点
  foot=[];off=[]
  for k in ks:
    im,tx,fy=info[k];al=np.array(im)[...,3];ys,xs=np.where(al>128);low=ys>fy-im.height*.07
    fc=float(np.median(xs[low]));foot.append(fc);off.append(tx-fc)
  for i,k in enumerate(ks):
    if cyc:o=(off[i-1]+off[i]+off[(i+1)%n])/3
    else:o=(off[max(0,i-1)]+off[i]+off[min(n-1,i+1)])/3
    im,tx,fy=info[k];OUT[g+'_'+str(i)]=(im,int(round(foot[i]+o)),int(fy),1/RES)
# 头像：取 idle_01 头部
im0,ax0,ay0,_=OUT['idle_0'];al=np.array(im0)[...,3];ys,xs=np.where(al>128);top=ys.min()
P=PORT_SIZE=int(IDLE_H*.42)
rgb=np.array(im0)[...,:3].astype(int);skin=(al>200)&(rgb[...,0]>190)&(rgb[...,0]-rgb[...,2]>25)&(rgb[...,1]>140)&(np.arange(al.shape[0])[:,None]<top+IDLE_H*.4)
sy,sx=np.where(skin);cx,cy=int(np.median(sx)),int(np.median(sy))   # 以脸部肤色中心为准
px=cx-int(P*.55);py=cy-int(P*.52)
por=im0.crop((px,py,px+P,py+P)).resize((128,128),Image.LANCZOS)
bgc=Image.new('RGBA',(128,128),(30,40,46,255));bgc.alpha_composite(por);OUT['portrait']=(bgc,64,64,.78)
# 旧帧：从现有图集取出（保留的动作），蓝色衣袍色相偏移到青绿
J=json.load(open(f'{ROOT}/assets/hero_atlas_v1.json'));A=Image.open(f'{ROOT}/assets/hero_atlas_v1.png').convert('RGBA')
KEEP=['turn','hslash','upslash','downslash','wavecast','dodge','block','charge','ult','down']
NEW={'jump':'jump','thrust':'thrust','spin':'whirlwind'}   # 动画名 → ref 文件前缀
def teal(im):
  a=np.array(im);hsv=np.array(im.convert('RGB').convert('HSV')).astype(int)
  h,sat,v=hsv[...,0],hsv[...,1],hsv[...,2];m=(h>=135)&(h<=180)&(sat>35)
  h[m]=h[m]-24;sat[m]=np.minimum(255,sat[m]*1.12).astype(int)
  rgb=np.array(Image.fromarray(np.dstack([h,sat,v]).astype(np.uint8),'HSV').convert('RGB'))
  a[...,:3]=rgb;return Image.fromarray(a)
for an in KEEP:
  for k in J['anims'][an]:
    f=J['frames'][k];im=A.crop((f['x'],f['y'],f['x']+f['w'],f['y']+f['h']));OUT[k]=(teal(im),f['ax'],f['ay'],1)
for k in ['fx_sword','fx_wave']:
  f=J['frames'][k];OUT[k]=(A.crop((f['x'],f['y'],f['x']+f['w'],f['y']+f['h'])),f['ax'],f['ay'],1)
NEW_DIR=os.environ.get('NEW_MOVES_DIR','ref')   # 新招式帧目录；换一版美术：NEW_MOVES_DIR=ref/v2 python3 tools/hero_v2.py
NA=json.load(open(f'{ROOT}/{NEW_DIR}/new_moves_anchors.json'))
anims={a:list(J['anims'][a]) for a in KEEP}
import glob
for an,pre in NEW.items():
  fs=sorted(glob.glob(f'{ROOT}/{NEW_DIR}/{pre}_[0-9][0-9].png'));anims[an]=[]
  for i,f in enumerate(fs):
    im=Image.open(f).convert('RGBA');a=np.array(im);a[...,3][a[...,3]<10]=0;a[...,:3][a[...,3]==0]=0;im=Image.fromarray(a)
    m=NA['frames'].get(os.path.basename(f)[:-4],{});ax,ay=m.get('ax',NA['anchor_x']),m.get('ay',NA['baseline_y'])
    bb=im.getbbox();k=f'{an}_{i}';OUT[k]=(im.crop(bb),ax-bb[0],ay-bb[1],1/RES);anims[an].append(k)
anims['idle']=[f'idle_{i}' for i in range(6)];anims['walk']=[f'walk_{i}' for i in range(8)];anims['run']=anims['walk']
for i in range(1,5):anims[f'atk{i}']=[f'attack{i}_{j}' for j in range(6)]
anims['hurt']=[f'hit_{i}' for i in range(3)]
W=2048;x=y=rowh=0;pos={}
for k in sorted(OUT,key=lambda k:-OUT[k][0].height):
  im=OUT[k][0]
  if x+im.width+2>W:x=0;y+=rowh+2;rowh=0
  pos[k]=(x,y);x+=im.width+2;rowh=max(rowh,im.height)
at=Image.new('RGBA',(W,y+rowh));fr={}
for k,(im,ax,ay,sc) in OUT.items():
  px,py=pos[k];at.paste(im,(px,py));fr[k]={'x':px,'y':py,'w':im.width,'h':im.height,'ax':ax,'ay':ay}
  if sc!=1:fr[k]['s']=round(sc,4)
at.save(f'{ROOT}/assets/hero_atlas.png',optimize=True)
d={'image':'assets/hero_atlas.png','source':'ref/hero_frames_v2.png + ref/hero_sheet.png','frames':fr,'anims':anims}
json.dump(d,open(f'{ROOT}/assets/hero_atlas.json','w'))
open(f'{ROOT}/assets/hero_atlas.js','w').write('window.HERO_ATLAS='+json.dumps(d,separators=(',',':'))+';\n')
print('scale',round(S,3),'frames',len(fr),'atlas',at.size)
