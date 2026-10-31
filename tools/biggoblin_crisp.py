# 第一关 Boss（大哥布林）图集清理 + 3x 高清化：
# 1) 填补抠图留下的身体内部透明孔洞（用最近不透明像素颜色）
# 2) 去掉源图烘焙在脚下的白色尘土/地面条（帧底部 28% 内的高亮低饱和像素）
# 3) 只保留主体连通块，alpha 二值化（去半透明毛边）
# 4) LANCZOS 3x 放大 + 轻度锐化，帧记录 s=1/3，绘制时等比缩回 → 冲刺/蓄力时边缘清晰无噪点
# 用法：python3 tools/biggoblin_crisp.py <原始1x图集png>（默认读 git 中的 1x 版本需先导出）
import json,sys,re
import numpy as np
from PIL import Image,ImageFilter
from scipy import ndimage as nd
K=3
src=sys.argv[1] if len(sys.argv)>1 else 'assets/biggoblin_atlas.png'
d=json.load(open('assets/biggoblin_atlas.json'))
if any(f.get('s') for f in d['frames'].values()):sys.exit('already crisp; pass the 1x source + 1x json')
im=np.array(Image.open(src).convert('RGBA')).astype(np.int32)
H,W=im.shape[:2]
out=Image.new('RGBA',(W*K,H*K),(0,0,0,0))
for k,f in d['frames'].items():
  x,y,w,h=f['x'],f['y'],f['w'],f['h'];c=im[y:y+h,x:x+w].copy();a=c[...,3]
  m=a>=110
  rgb=c[...,:3];lum=rgb.mean(2);sat=rgb.max(2)-rgb.min(2)
  rows=np.arange(h)[:,None]*np.ones((1,w),bool)
  smear=((rows>=h*.72)&(lum>150)&(sat<55))|((rows>=h*.8)&(lum>75)&(sat<38))
  m&=~smear
  m=nd.binary_opening(m,structure=np.ones((2,2)))|(m&nd.binary_erosion(m))
  lab,n=nd.label(m,structure=np.ones((3,3)))
  if n:
    sz=nd.sum(m,lab,range(1,n+1));big=np.argmax(sz)+1
    keep=np.zeros_like(m)
    for i in range(1,n+1):
      if i==big or sz[i-1]>.08*sz[big-1]:keep|=lab==i
    m=keep
  filled=nd.binary_fill_holes(m)
  # 小缺口（与外部连通的细缝）也闭合
  filled=nd.binary_fill_holes(nd.binary_closing(filled,iterations=2))&nd.binary_dilation(m,iterations=2)|filled
  # 边缘浅色抠图残边（背景色晕）→ 用内部最近像素颜色替换
  inner=nd.binary_erosion(m,iterations=2)
  halo=m&~inner&(lum>135)&(sat<70)
  if inner.any():
    ii=nd.distance_transform_edt(~inner,return_distances=False,return_indices=True)
    rgb=rgb.copy();rgb[halo]=rgb[ii[0],ii[1]][halo]
  idx=nd.distance_transform_edt(~m,return_distances=False,return_indices=True)
  rgbf=rgb[idx[0],idx[1]]
  o=np.zeros((h,w,4),np.uint8);o[...,:3]=rgbf;o[...,3]=np.where(filled,255,0)
  # 透明处颜色延展，避免放大时边缘发灰
  fr=Image.fromarray(o)
  rgbI=Image.fromarray(rgbf.astype(np.uint8)).resize((w*K,h*K),Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.2,percent=70,threshold=2))
  al=Image.fromarray((filled*255).astype(np.uint8)).resize((w*K,h*K),Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.6))
  al=al.point(lambda v:0 if v<100 else (255 if v>160 else int((v-100)/60*255)))
  big=rgbI.convert('RGBA');big.putalpha(al)
  out.paste(big,(x*K,y*K))
  f.update(x=x*K,y=y*K,w=w*K,h=h*K,ax=f['ax']*K,ay=f['ay']*K,s=round(1/K,6))
out.save('assets/biggoblin_atlas.png',optimize=True)
json.dump(d,open('assets/biggoblin_atlas.json','w'),ensure_ascii=False)
L=open('assets/goblin_atlas.js').read().split('\n')
L=[('window.BIGGOBLIN_ATLAS='+json.dumps(d,ensure_ascii=False)+';') if l.startswith('window.BIGGOBLIN_ATLAS=') else l for l in L]
open('assets/goblin_atlas.js','w').write('\n'.join(L))
print('ok',out.size)
