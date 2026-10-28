# 第一步：按格裁切（含相邻格中点的横向余量）→ rembg BiRefNet → ref/hero_v2_cut/（每格单独进程，缓存）
import os,sys,subprocess
from PIL import Image
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));from hero_v2_cells import wide_cells
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHEET=Image.open(f'{ROOT}/ref/hero_frames_v2.png').convert('RGB')
for n,b in wide_cells():
  p=f'{ROOT}/ref/hero_v2_cut/{n}.png'
  if os.path.exists(p):continue
  c=SHEET.crop(b);c=c.resize((c.width*3,c.height*3),Image.LANCZOS);tmp=f'/tmp/hv_{n}.png';c.save(tmp)
  subprocess.check_call([sys.executable,'-c',f"from rembg import remove,new_session;from PIL import Image;remove(Image.open('{tmp}'),session=new_session('birefnet-general')).save('{p}')"])
  print('cut',n,flush=True)
