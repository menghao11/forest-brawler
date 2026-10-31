#!/usr/bin/env python3
"""写 assets/sfx/manifest.js：列出 assets/sfx/ 里现有的 mp3（audio.js 只加载清单里的文件，不会去请求不存在的文件 → 控制台没有 404）。
用法：把新音效 / bgm_boss.mp3 放进 assets/sfx/ 后运行  python3 tools/sfx_manifest.py
（不放 bgm_boss.mp3 时首领战沿用关卡 BGM；放进去并重跑本脚本后自动切换。）"""
import os, json, glob
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'sfx')
names = sorted(os.path.basename(f)[:-4] for f in glob.glob(os.path.join(D, '*.mp3')))
open(os.path.join(D, 'manifest.js'), 'w').write('window.SFX_MANIFEST=' + json.dumps(names) + ';\n')
print(len(names), 'files', 'bgm_boss' in names and '(bgm_boss present)' or '(no bgm_boss)')
