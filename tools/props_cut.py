# 道具切图第一步：ref/props_sheet.png 按格裁切 → rembg(BiRefNet) 抠图，缓存到 ref/props_cut/（每张单独进程，避免内存爆）
import os,sys,subprocess
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHEET=Image.open(f'{ROOT}/ref/props_sheet.png').convert('RGB');F=SHEET.width/1024
ROWS=[(0,258,[0,148,292,415,560,705,860,1024],['lamp_wood','lamp_stonehang','lamp_iron','lamp_crystal','brazier','lamp_wall','lamp_gothic']),
 (258,378,[0,190,350,515,680,840,1024],['bush_flower','bush_dark','bush_yellow','bush_blue','bush_red','bush_snow']),
 (378,505,[0,160,305,435,570,720,865,1024],['grass_flower','grass_pampas','grass_green','grass_leafy','grass_fern','grass_dry','grass_frost'])]
def cells():
  for y0,y1,xs,names in ROWS:
    for i,n in enumerate(names):yield n,SHEET.crop((int(xs[i]*F),int(y0*F),int(xs[i+1]*F),min(SHEET.height,int(y1*F))))
if __name__=='__main__':
  for n,im in cells():
    p=f'{ROOT}/ref/props_cut/{n}.png'
    if os.path.exists(p):continue
    tmp=f'/tmp/pr_raw_{n}.png';im.save(tmp)
    subprocess.check_call([sys.executable,'-c',f"from rembg import remove,new_session;from PIL import Image;remove(Image.open('{tmp}'),session=new_session('birefnet-general')).save('{p}')"])
    print('cut',n,flush=True)
