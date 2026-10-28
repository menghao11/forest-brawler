from PIL import Image,ImageDraw;import numpy as np,cv2,json
im=np.array(Image.open('/workspace/game/ref/hero_sheet.png').convert('RGB')).astype(np.float32)
v=im.max(2);dark=(v<100).astype(np.uint8)
for hy in (388,538,686,846): dark[hy-16:hy+16,0:215]=0
dark[:,0:14]=0;dark[:,1505:]=0
bands={'move':(384,505),'atk':(540,648),'skill':(684,800),'special':(836,980)}
# (band, x0, x1, count, names)
G=[('move',52,134,1,['idle_0']),('move',196,277,1,['idle_1']),('move',315,565,4,['walk_0','walk_1','walk_2','walk_3']),('move',571,772,3,['run_0','run_1','run_2']),
 ('move',801,869,1,['jump_0']),('move',884,960,1,['jump_1']),('move',974,1055,1,['jump_2']),('move',1087,1196,1,['turn_0']),('move',1203,1303,1,['turn_1']),('move',1311,1390,1,['turn_2']),
 ('atk',27,279,3,['atk1_0','atk1_1','atk1_2']),('atk',315,544,3,['atk2_0','atk2_1','atk2_2']),('atk',602,839,3,['atk3_0','atk3_1','atk3_2']),('atk',892,1158,3,['atk4_0','atk4_1','atk4_2']),('atk',1195,1431,3,['atk5_0','atk5_1','atk5_2']),
 ('skill',37,239,[107,183],['thrust_0','thrust_1','thrust_2']),('skill',282,455,[360,410],['hslash_0','hslash_1','hslash_2']),('skill',486,623,[580],['upslash_0','upslash_1']),('skill',668,755,1,['downslash_0']),
 ('skill',828,1049,[919,985],['spin_0','spin_1','spin_2']),('skill',1262,1340,1,['wavecast_0']),
 ('special',15,212,2,['dodge_0','dodge_1']),('special',245,403,2,['block_0','block_1']),('special',472,564,1,['charge_0']),('special',776,884,1,['ult_0']),
 ('special',1072,1252,2,['hurt_0','hurt_1']),('special',1258,1351,1,['down_0']),('special',1364,1495,1,['down_1'])]
bg=np.median(im[300:380,1000:1400].reshape(-1,3),0)
out={}
for band,x0,x1,k,names in G:
  y0,y1=bands[band];D=dark[y0:y1]
  # body profile (exclude top 30% of band where swords/arcs less) use full dark
  prof=cv2.GaussianBlur(D[:,:].sum(0).astype(np.float32).reshape(1,-1),(15,1),0).ravel()
  cuts=[x0]
  cs=k if isinstance(k,list) else [x0+(x1-x0)*j//k for j in range(1,k)]
  for c in cs:
    lo,hi=c-14,c+14;cuts.append(lo+int(np.argmin(prof[lo:hi])))
  cuts.append(x1)
  for j,nm in enumerate(names):
    a,b=cuts[j],cuts[j+1];pad=6
    L=max(0,a-pad);R=min(im.shape[1],b+pad)
    d=D[:,L:R].copy()
    # exclude neighbours: zero outside [a,b] strictly
    d[:,:a-L]=0;d[:,b-L:]=0
    crop=im[y0:y1,L:R]
    r,g,bb=crop[...,0],crop[...,1],crop[...,2];lum=crop.mean(2);sat=crop.max(2)-crop.min(2)
    # local bg per column: median of low-sat mid-lum pixels in band
    cand=(sat<14)&(lum>120)&(lum<185)
    bgc=np.array([np.median(crop[cand[:,i],i],0) if cand[:,i].sum()>8 else bg for i in range(crop.shape[1])])
    bgc=cv2.GaussianBlur(bgc.reshape(1,-1,3).astype(np.float32),(21,1),0).reshape(-1,3)
    dist=np.sqrt(((crop-bgc[None])**2).sum(2))
    fx=(bb-r>38)&(lum>140)            # blue slash fx
    shadow=(sat<16)&(lum>95)&(lum<bgc.mean(1)[None]+12)
    fg=((dist>26)&~fx&~shadow)|(d>0)
    near=cv2.dilate(d,np.ones((9,9),np.uint8))>0
    m=(fg&near).astype(np.uint8);m[:,:a-L]=0;m[:,b-L:]=0
    m=cv2.morphologyEx(m,cv2.MORPH_OPEN,np.ones((2,2),np.uint8))
    m=cv2.morphologyEx(m,cv2.MORPH_CLOSE,np.ones((3,3),np.uint8))
    n,lab,st,_=cv2.connectedComponentsWithStats(m)
    big=max(range(1,n),key=lambda i:st[i][4])
    keep=np.isin(lab,[i for i in range(1,n) if i==big or st[i][4]>.06*st[big][4]])
    dk=(d>0)&keep;dys=np.where(dk.any(1))[0];dfoot=dys.max()
    dust=(lum>170)&(sat<40)&(np.arange(keep.shape[0])[:,None]>dfoot-6)
    keep=keep&~dust;keep[dfoot+3:]=False
    al=keep.astype(np.float32)
    al=cv2.erode(al,np.ones((2,2),np.uint8),iterations=1)
    al=cv2.GaussianBlur(al,(3,3),0.6)
    # defringe: edge pixels take colour of nearest interior pixel (darken halo)
    inner=cv2.erode(keep.astype(np.uint8),np.ones((3,3),np.uint8))
    blur=cv2.blur(crop*inner[...,None],(5,5));wb=cv2.blur(inner.astype(np.float32),(5,5))
    col=crop.copy();edge=(al>0)&(inner==0)&(wb>0.05)
    col[edge]=(blur[edge]/wb[edge][:,None])*0.6+crop[edge]*0.4
    ys,xs=np.where(al>.5);top=ys.min();foot=dfoot;lx,rx=xs.min(),xs.max()
    hh=foot-top;low=xs[(ys>top+.4*hh)&(ys<top+.7*hh)];cx=int(np.median(low))
    rgba=np.dstack([col,al*255]).astype(np.uint8)[max(0,top-2):foot+2,max(0,lx-2):rx+3]
    out[nm]={'img':rgba,'ax':cx-max(0,lx-2),'ay':foot-max(0,top-2),'h':foot-top}
    Image.fromarray(rgba).save(f'/workspace/sp/h2/{nm}.png')
json.dump({k:{kk:int(vv) for kk,vv in v.items() if kk!='img'} for k,v in out.items()},open('/workspace/sp/h2/meta.json','w'),indent=0)
# contact
cw,ch=150,150;ks=list(out);cols=10;rows=(len(ks)+cols-1)//cols
o=Image.new('RGB',(cw*cols,ch*rows),(255,0,255));dr=ImageDraw.Draw(o)
for i,kk in enumerate(ks):
  f=out[kk];t=Image.fromarray(f['img']);x,y=(i%cols)*cw,(i//cols)*ch
  ox=x+cw//2-f['ax'];oy=y+ch-8-f['ay'];bgp=Image.new('RGBA',o.size,(0,0,0,0));bgp.paste(t,(ox,oy));o.paste(bgp.convert('RGB'),(0,0),bgp)
  dr.text((x+2,y+2),kk,fill='white');dr.line([(x+cw//2-5,y+ch-8),(x+cw//2+5,y+ch-8)],fill=(0,255,0))
o.save('/workspace/sp/h2_contact.png')
print({k:(v['h'],v['img'].shape[1]) for k,v in out.items()})
