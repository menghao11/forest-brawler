from PIL import Image, ImageFilter
import numpy as np
from scipy import ndimage as nd
im=np.array(Image.open('/workspace/game/ref/snowman_sheet.png').convert('RGB')).astype(float)
x0,y0,x1,y1=(1130,28,1268,180)
c=im[y0:y1,x0:x1]
bord=np.concatenate([c[:,:4],c[:,-4:]],1)
bgr=np.median(bord,1)[:,None,:]
d=np.sqrt(((c-bgr)**2).sum(2))
lum=c.mean(2);r,g,b=c[...,0],c[...,1],c[...,2]
navy=(lum<105)&(b-r>14)
m=(d>40)&~navy
H=c.shape[0];yy=np.arange(H)[:,None]
m&=~((yy>125)&(d<90))
m=nd.binary_closing(m,iterations=2);m=nd.binary_fill_holes(m);m=nd.binary_opening(m,iterations=2)
nv=nd.binary_opening(navy,iterations=2);l2,n2=nd.label(nv);s2=nd.sum(nv,l2,range(1,n2+1));big=np.isin(l2,[i+1 for i,v in enumerate(s2) if v>120]);print('navy blobs',sorted(s2)[-5:]);m&=~big
lab,n=nd.label(m);sz=nd.sum(m,lab,range(1,n+1))
keep=lab==(np.argmax(sz)+1)
keep=nd.binary_erosion(keep,iterations=1)
ys,xs=np.where(keep)
a=nd.gaussian_filter(keep.astype(float),0.6)*255
o=np.dstack([c,a]).clip(0,255).astype(np.uint8)
img=Image.fromarray(o).crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))
img=img.resize((img.width*2,img.height*2),Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.2,60,2))
img.save('/workspace/sp/boss_front.png');print(img.size)
bg=Image.new('RGBA',img.size,(90,140,90,255));bg.alpha_composite(img);bg.resize((img.width*3//2,img.height*3//2)).save('/workspace/sp/v8_front.png')
# 写入 Boss 图集（正面高清立绘，动作由 game.js 补间实现）
import json,re
img.save('/workspace/game/assets/snowboss_atlas.png')
w,h=img.size
A={"image":"assets/snowboss_atlas.png","source":"ref/snowman_sheet.png（大雪人BOSS·正面）","frames":{"front":{"x":0,"y":0,"w":w,"h":h,"ax":w//2,"ay":h-4}},
   "anims":{k:["front"] for k in ["idle","walk","attack","shock","throw","summon","hurt","death"]}}
json.dump(A,open('/workspace/game/assets/snowboss_atlas.json','w'),ensure_ascii=False)
js=open('/workspace/game/assets/snowman_atlas.js').read()
js=re.sub(r'window\.SNOWBOSS_ATLAS=.*',lambda m:'window.SNOWBOSS_ATLAS='+json.dumps(A,ensure_ascii=False)+';',js)
open('/workspace/game/assets/snowman_atlas.js','w').write(js)
