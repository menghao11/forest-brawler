#!/usr/bin/env python3
"""女巫美术打包：ref/witch/ -> assets/witch_atlas.png + witch_atlas.json + witch_atlas.js

输入（美术规格见 ref/witch/README.md）：
  witch_idle_01..04.png、witch_cast_01..04.png：256x208 RGBA，脚底 y=200，锚点 x=128，面朝左，游戏内按 s=0.625 绘制
  witch_portrait_640.png（或 witch_portrait.png）：半身像
换图：覆盖 ref/witch/ 里的同名文件后运行  python3 tools/witch_pack.py ，再把 index.html / game.js 的 ?v= 版本号加一。
帧数可变（按文件名排序）；FACE_BOX 是头像圆框在半身像中的裁切框（相对 0..1）。
"""
import glob, json, os, sys
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.environ.get('WITCH_DIR', os.path.join(ROOT, 'ref', 'witch'))
OUT = os.environ.get('WITCH_OUT', os.path.join(ROOT, 'assets'))
AX, AY, SCALE = 128, 200, 0.625
FACE_BOX = (0.17, 0.09, 0.75, 0.52)  # 头像裁切 (x0,y0,x1,y1)，相对半身像尺寸
PORTRAIT_H = 300                      # 半身像存储高度
FACE = 128                            # 头像存储边长

def main():
    frames, anims, imgs = {}, {}, []
    for an in ('idle', 'cast'):
        files = sorted(glob.glob(os.path.join(SRC, f'witch_{an}_*.png')))
        if not files and an == 'idle':
            sys.exit('缺少 witch_idle_*.png')
        anims[an] = []
        for f in files:
            im = Image.open(f).convert('RGBA')
            bb = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
            cut = im.crop(bb)
            name = os.path.splitext(os.path.basename(f))[0].replace('witch_', '')
            imgs.append((name, cut, {'ax': AX - bb[0], 'ay': AY - bb[1]}))
            anims[an].append(name)
    pf = os.path.join(SRC, 'witch_portrait_640.png')
    if not os.path.exists(pf):
        pf = os.path.join(SRC, 'witch_portrait.png')
    if os.path.exists(pf):
        p = Image.open(pf).convert('RGBA')
        k = PORTRAIT_H / p.height
        imgs.append(('portrait', p.resize((round(p.width * k), PORTRAIT_H), Image.LANCZOS), {}))
        x0, y0, x1, y1 = FACE_BOX
        fc = p.crop((round(x0 * p.width), round(y0 * p.height), round(x1 * p.width), round(y0 * p.height + (x1 - x0) * p.width)))
        imgs.append(('face', fc.resize((FACE, FACE), Image.LANCZOS), {}))
    # 简单行打包
    W = 1024; x = y = rowh = 0; pos = {}
    for name, im, _ in imgs:
        if x + im.width > W:
            x, y, rowh = 0, y + rowh + 2, 0
        pos[name] = (x, y); x += im.width + 2; rowh = max(rowh, im.height)
    atlas = Image.new('RGBA', (W, y + rowh))
    for name, im, extra in imgs:
        px, py = pos[name]; atlas.paste(im, (px, py))
        frames[name] = {'x': px, 'y': py, 'w': im.width, 'h': im.height, **extra}
    atlas.save(os.path.join(OUT, 'witch_atlas.png'), optimize=True)
    data = {'image': 'assets/witch_atlas.png', 'source': 'ref/witch/', 's': SCALE, 'facing': -1,
            'fps': {'idle': 5, 'cast': 9}, 'anims': anims, 'frames': frames,
            'portrait': 'portrait' if 'portrait' in frames else None, 'face': 'face' if 'face' in frames else None}
    with open(os.path.join(OUT, 'witch_atlas.json'), 'w') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    with open(os.path.join(OUT, 'witch_atlas.js'), 'w') as f:
        f.write('window.WITCH_ATLAS=' + json.dumps(data, ensure_ascii=False) + ';\n')
    print('witch atlas', atlas.size, {k: len(v) for k, v in anims.items()}, 'portrait' in frames)

if __name__ == '__main__':
    main()
