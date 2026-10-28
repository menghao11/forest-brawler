# 敌人图集去重影清理：每帧只保留主体（最大连通块及与之相邻的大块），去除半透明灰边/背景残块/相邻帧碎片/文字标签框
import json,sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd
def clean(name,src,dst,keep_ratio=.25):
  d=json.load(open(f'assets/{name}_atlas.json'))
  im=np.array(Image.open(src).convert('RGBA')).astype(np.int32)
  out=im.copy()
  for k,f in d['frames'].items():
    x,y,w,h=f['x'],f['y'],f['w'],f['h'];c=im[y:y+h,x:x+w].copy();a=c[...,3]
    a[a<128]=0;a[a>=128]=np.maximum(a[a>=128],235)
    m=a>0
    lab,n=nd.label(m,structure=np.ones((3,3)))
    if n==0:continue
    sz=nd.sum(m,lab,range(1,n+1));big=np.argmax(sz)+1
    core=nd.binary_dilation(lab==big,iterations=3)
    keep=np.zeros_like(m)
    for i in range(1,n+1):
      comp=lab==i;ys,xs=np.where(comp);bh,bw=np.ptp(ys)+1,np.ptp(xs)+1
      rgb=c[comp][:,:3];sat=(rgb.max(1)-rgb.min(1)).mean()
      boxy=sz[i-1]>150 and sz[i-1]/(bh*bw)>.8 and sat<25
      if boxy:continue
      if i==big or (core&comp).any() or sz[i-1]>keep_ratio*sz[big-1]:keep|=comp
    # 边缘去灰：外圈 1px 半透明化
    edge=keep&~nd.binary_erosion(keep)
    a2=np.where(keep,a,0);a2[edge]=(a2[edge]*.6).astype(np.int32)
    c[...,3]=a2;c[~keep,:3]=0
    out[y:y+h,x:x+w]=c
  Image.fromarray(out.clip(0,255).astype(np.uint8)).save(dst)
if __name__=='__main__':
  for n in sys.argv[1:]:import os;b=f'/workspace/sp/atl_bak/{n}_atlas.png';clean(n,b if os.path.exists(b) else f'assets/{n}_atlas.png',f'assets/{n}_atlas.png')
