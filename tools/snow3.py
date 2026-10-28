import sys;sys.path.insert(0,'/workspace/sp')
from snow2 import *
CELLS={
 'm':{'idle':[(108,171),(189,263),(279,351),(367,440),(460,540),(560,627)],'_y_idle':(616,682),
      'walk':[(92,161),(186,257),(280,354),(358,437),(453,528),(561,634)],'_y_walk':(684,757),
      'attack':[(124,212),(470,575)],'_y_attack':(762,843),
      'throw':[(108,190),(193,283),(283,368),(368,462)],'_y_throw':(850,924),
      'death':[(132,224),(232,320),(320,420),(420,532),(536,686)],'_y_death':(930,1000)},
 'b':{'idle':[(838,917),(938,1007),(1023,1112),(1108,1192),(1196,1274),(1273,1370)],'_y_idle':(517,567),
      'walk':[(832,930),(930,1019),(1020,1112),(1240,1337),(1338,1440)],'_y_walk':(575,643),
      'attack':[(1235,1355),(1355,1480)],'_y_attack':(650,726),
      'shock':[(945,1060),(1060,1165),(1165,1268)],'_y_shock':(734,805),
      'throw':[(835,927),(1030,1140)],'_y_throw':(814,902),
      'summon':[(995,1150),(1158,1305)],'_y_summon':(912,1002)}}
FXS={'snowball':(330,405,470,548),'iceblock':(215,310,460,550)}
FXCUT=55;KF=150;KB=170
def extract(x0,x1,y0,y1,keepfx=False):
  crop,m,dist,fx=seg(x0,x1,y0,y1,999 if keepfx else FXCUT)
  if keepfx:
    L=crop.mean(2);m=((L>KF)|(crop[...,2]>KB)).astype(np.uint8);m=cv2.morphologyEx(m,cv2.MORPH_OPEN,np.ones((2,2),np.uint8));m=cv2.morphologyEx(m,cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
    inv=(1-m).astype(np.uint8);n,lab=cv2.connectedComponents(inv);border=np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]]));m[(inv==1)&~np.isin(lab,border)]=1
  else:
    m=m&cv2.morphologyEx(m,cv2.MORPH_OPEN,np.ones((5,1),np.uint8))
    fill=((m>0)&~((dist>32)&~fx)&(dist<20)).astype(np.uint8)
    n2,l2,st2,_=cv2.connectedComponentsWithStats(fill)
    for i in range(1,n2):
      if st2[i][4]>90:m[l2==i]=0
  n,lab,st,_=cv2.connectedComponentsWithStats(m)
  if n<2:return None
  big=max(range(1,n),key=lambda i:st[i][4])
  keep=np.isin(lab,[i for i in range(1,n) if i==big or st[i][4]>(.02 if keepfx else .05)*st[big][4]])
  al=keep.astype(np.float32);al=cv2.erode(al,np.ones((2,2),np.uint8));al=cv2.GaussianBlur(al,(3,3),.6)
  inner=cv2.erode(keep.astype(np.uint8),np.ones((3,3),np.uint8));bl=cv2.blur(crop*inner[...,None],(5,5));wb=cv2.blur(inner.astype(np.float32),(5,5))
  col=crop.copy();edge=(al>0)&(inner==0)&(wb>.05);col[edge]=bl[edge]/wb[edge][:,None]*.6+crop[edge]*.4
  ys,xs=np.where(al>.5);top,foot=ys.min(),ys.max();lx,rx=xs.min(),xs.max();hh=foot-top
  mid=xs[(ys>top+.35*hh)&(ys<top+.75*hh)];cx=int(np.median(mid))
  if keepfx:cx=(lx+rx)//2
  # foot: lowest row with substantial mass (ignore flecks)
  rows=(al>.5).sum(1);fr=np.where(rows>max(3,.15*rows.max()))[0];foot2=fr.max()
  if keepfx:foot2=(top+foot)//2
  T,Bt,Lx,Rx=max(0,top-2),min(al.shape[0],foot+2),max(0,lx-2),min(al.shape[1],rx+3)
  rgba=np.dstack([col,al*255]).astype(np.uint8)[T:Bt,Lx:Rx]
  return rgba,cx-Lx,foot2-T
def build(key,name,scale=1.0):
  frames={};anims={};imgs=[]
  C=CELLS[key]
  for an,lst in C.items():
    if an.startswith('_'):continue
    y0,y1=C['_y_'+an]
    for i,(a,b) in enumerate(lst):
      r=extract(a,b,y0,y1);
      if r is None:continue
      if key=='b' and an=='idle':
        t=Image.fromarray(r[0]);k=1.17;t=t.resize((round(t.width*k),round(t.height*k)),Image.LANCZOS);r=(np.array(t),r[1]*k,r[2]*k)
      imgs.append((f'{an}_{i}',)+r);anims.setdefault(an,[]).append(f'{an}_{i}')
  for k,(a,b,y0,y1) in FXS.items():
    if key=='m':
      r=extract(a,b,y0,y1,keepfx=True);imgs.append((k,)+r)
  W=1024;x=y=rowh=0;pos=[]
  for k,img,ax,ay in imgs:
    t=Image.fromarray(img)
    if scale!=1:
      t=t.resize((round(t.width*scale),round(t.height*scale)),Image.LANCZOS);ax*=scale;ay*=scale
      from PIL import ImageFilter
      rgb=t.convert('RGB').filter(ImageFilter.UnsharpMask(radius=1.4,percent=90,threshold=2));rgb.putalpha(t.getchannel('A'));t=rgb
    if x+t.width+2>W:x=0;y+=rowh+2;rowh=0
    pos.append((t,x,y));frames[k]=dict(x=x,y=y,w=t.width,h=t.height,ax=int(round(ax)),ay=int(round(ay)));x+=t.width+2;rowh=max(rowh,t.height)
  at=Image.new('RGBA',(W,y+rowh));[at.paste(t,(x,y)) for t,x,y in pos]
  at.save(f'/workspace/game/assets/{name}_atlas.png',optimize=True)
  return {'image':f'assets/{name}_atlas.png','source':'ref/snowman_sheet.png','frames':frames,'anims':anims}
if __name__=='__main__':
  A=build('m','snowman',1.5);Bo=build('b','snowboss',2.0)
  A['anims']['hurt']=['death_0'];Bo['anims']['hurt']=['shock_0'];Bo['anims']['death']=['shock_0','summon_1'][:1]
  json.dump(A,open('/workspace/game/assets/snowman_atlas.json','w'));json.dump(Bo,open('/workspace/game/assets/snowboss_atlas.json','w'))
  open('/workspace/game/assets/snowman_atlas.js','w').write('window.SNOWMAN_ATLAS='+json.dumps(A)+';\nwindow.SNOWBOSS_ATLAS='+json.dumps(Bo)+';\n')
  # contact
  for nm,D in (('snowman',A),('snowboss',Bo)):
    at=Image.open(f'/workspace/game/assets/{nm}_atlas.png');ks=list(D['frames']);cw,ch=200,190;cols=8
    o=Image.new('RGB',(cw*cols,ch*((len(ks)+cols-1)//cols)),(255,0,255));dr=ImageDraw.Draw(o)
    for i,k in enumerate(ks):
      f=D['frames'][k];t=at.crop((f['x'],f['y'],f['x']+f['w'],f['y']+f['h']));X,Y=(i%cols)*cw,(i//cols)*ch
      o.paste(t,(X+cw//2-f['ax'],Y+ch-10-f['ay']),t);dr.text((X+2,Y+2),k,fill='white');dr.line([(X+cw//2-6,Y+ch-10),(X+cw//2+6,Y+ch-10)],fill=(0,255,0))
    o.save(f'/workspace/sp/{nm}_contact.png')
  print({k:len(v) for k,v in A['anims'].items()},{k:len(v) for k,v in Bo['anims'].items()})
