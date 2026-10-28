from PIL import Image,ImageDraw;import numpy as np,cv2,json
im=np.array(Image.open('/workspace/game/ref/snowman_sheet.png').convert('RGB')).astype(np.float32)
lum=im.mean(2);R,Gc,B=im[...,0],im[...,1],im[...,2]
BANDS={'m_idle':(94,700,612,682),'m_walk':(94,700,684,757),'m_melee':(94,700,762,843),'m_throw':(94,700,850,924),'m_die':(94,700,930,1000),
 'b_idle':(825,1525,510,572),'b_walk':(825,1525,575,648),'b_melee':(825,1525,650,732),'b_shock':(825,1525,734,812),'b_throw':(825,1525,814,910),'b_summon':(825,1525,912,1010)}
def seg(x0,x1,y0,y1,fxcut=55):
  crop=im[y0:y1,x0:x1];L=lum[y0:y1,x0:x1]
  bgr=np.array([np.median(crop[i][L[i]<75],0) if (L[i]<75).sum()>20 else np.array([35,50,70]) for i in range(crop.shape[0])])
  bgr=cv2.GaussianBlur(bgr.reshape(-1,1,3).astype(np.float32),(1,9),0).reshape(-1,3)
  dist=np.sqrt(((crop-bgr[:,None])**2).sum(2))
  fx=((B-R)[y0:y1,x0:x1]>fxcut)&(L>110)
  fg=(dist>32)&~fx
  m=cv2.morphologyEx(fg.astype(np.uint8),cv2.MORPH_OPEN,np.ones((2,2),np.uint8))
  m=cv2.morphologyEx(m,cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
  inv=(1-m).astype(np.uint8);n,lab=cv2.connectedComponents(inv);border=np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]]))
  m[(inv==1)&~np.isin(lab,border)]=1
  return crop,m,dist,fx
def groups(m,minw=12,gap=3):
  col=m.sum(0)>2;col=cv2.dilate(col.astype(np.uint8).reshape(1,-1),np.ones((1,gap),np.uint8)).ravel()>0
  gs=[];s=None
  for x,c in enumerate(list(col)+[False]):
    if c and s is None:s=x
    if not c and s is not None:
      if x-s>=minw:gs.append((s,x))
      s=None
  return gs
if __name__=='__main__':
  out=Image.new('RGB',(1400,11*110),(255,0,255));d=ImageDraw.Draw(out)
  for bi,(nm,(x0,x1,y0,y1)) in enumerate(BANDS.items()):
    crop,m,_,_=seg(x0,x1,y0,y1);gs=groups(m)
    print(nm,[(a+x0,b+x0) for a,b in gs])
    rgba=np.dstack([crop,m*255]).astype(np.uint8);t=Image.fromarray(rgba)
    out.paste(t,(0,bi*110),t);out.paste(Image.fromarray(crop.astype(np.uint8)),(710,bi*110))
    for i,(a,b) in enumerate(gs):d.rectangle([a,bi*110,b,bi*110+(y1-y0)],outline=(0,255,0));d.text((a+1,bi*110+1),str(i),fill='yellow')
  out.save('/workspace/sp/sn_seg.png')
