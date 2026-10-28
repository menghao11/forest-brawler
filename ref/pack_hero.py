import json
from PIL import Image
meta=json.load(open('/workspace/sp/h2/meta.json'))
old=json.load(open('/workspace/sp/hero_atlas_old.json'));oim=Image.open('/workspace/sp/hero_atlas_old.png')
items=[(k,Image.open(f'/workspace/sp/h2/{k}.png'),meta[k]['ax'],meta[k]['ay']) for k in meta]
for k in ['fx_sword','fx_wave','portrait']:
  f=old['frames'][k];items.append((k,oim.crop((f['x'],f['y'],f['x']+f['w'],f['y']+f['h'])),f['ax'],f['ay']))
W=1024;x=y=0;rowh=0;frames={};pos=[]
for k,im,ax,ay in items:
  if x+im.width+2>W:x=0;y+=rowh+2;rowh=0
  pos.append((k,im,x,y));frames[k]=dict(x=x,y=y,w=im.width,h=im.height,ax=int(ax),ay=int(ay));x+=im.width+2;rowh=max(rowh,im.height)
H=y+rowh;at=Image.new('RGBA',(W,H),(0,0,0,0))
for k,im,x,y in pos:at.paste(im.convert('RGBA'),(x,y))
at.save('/workspace/game/assets/hero_atlas.png',optimize=True)
anims={}
for k in meta:
  a,i=k.rsplit('_',1);anims.setdefault(a,[]).append(k)
d={'image':'assets/hero_atlas.png','source':'ref/hero_sheet.png','frames':frames,'anims':anims}
json.dump(d,open('/workspace/game/assets/hero_atlas.json','w'))
open('/workspace/game/assets/hero_atlas.js','w').write('window.HERO_ATLAS='+json.dumps(d)+';\n')
