# Witch (女巫) art: replacement set

Generated with sprite-gen `gen --provider grok`, using the hero (`ref/hero_v2_cut/idle_01.png`) as the style reference. Cut out with sprite-gen on a **green** chroma key, because magenta would eat the purple. Working files are in `/workspace/witch/`.
No game code was changed.

## What it replaces
The current witch is **not an image**. It is drawn entirely in code by `drawWitch(w,sx)` in `game.js` (around line 710), using canvas shapes: a purple trapezoid robe, a green round face, a pointed hat, a green cauldron with bubbles, and a green/purple radial glow. It appears in only one place: the in-game witch camp (`G.B.witches`, 4 per stage, `y=320`). Nearby, it shows the label "[E] 女巫 · 学习魔法 / 休息" at `y-112`.
The learn-magic menu (`drawWitchMenu`) has **no witch picture** right now. `witch_portrait.png` is new art for that screen and would need a slot added in code.

## Files
| File | Size | Purpose |
|---|---|---|
| `witch_idle_01..04.png` | 256x208 RGBA | idle loop (4 frames), replaces the code-drawn body in `drawWitch` |
| `witch_cast_01..04.png` | 256x208 RGBA | cast: 01 wind-up (staff raised), 02 swing, 03 cast (staff thrust left), 04 recover |
| `witch_portrait.png` | 1013x1387 RGBA | 半身像 for the learn-magic screen, 3/4 view looking left |
| `witch_portrait_640.png` | 467x640 RGBA | same portrait, downscaled |
| `witch_anchors.json` | n/a | canvas, anchor and per-frame info (scale, paste_x, bbox, lowest row, clipped px) |
| `preview.png` | n/a | before/after in game, all 8 frames, portrait |
| `before_ingame.png`, `after_ingame_mock.png` | 960x540 | Playwright shots; the "after" overrides `drawWitch` in the page only |

## Frame spec
- One PNG per frame. Every frame uses the same canvas, **256x208**, with true alpha (corners 0, no key colour left).
- **Feet baseline y=200** (lowest opaque row = 200 in all 8 frames). **Anchor x=128**:
  - idle: the foot centre is at x=128.
  - cast: the torso is held at the same x as in idle (about 135), so the body does not slide while the feet step.
- Side view, **facing LEFT**, toward a hero who walks in from the left. No effects or glow are baked in.
- Same storage scale as the hero atlas: draw at **s=0.625** (as `hero_atlas.json` does). The witch is 170 px tall including the hat (about 106 px on screen); the hero idle is 164 px.
- Draw call: `ctx.drawImage(img, sx-128*s, y-200*s, 256*s, 208*s)` with `s=0.625`, where `y` is the witch's ground y.
- The cauldron and green glow are **not** in the frames. Keep drawing them in code; place the cauldron behind her, at about +44 px x. Suggested idle speed: about 5 fps.

## Notes / weak points
- The idle frames come from one grok frame plus a small procedural breathing squash (y 1.0 / 0.986 / 0.976 / 0.986, x widened up to 1.1%, anchored at the feet). grok's own 4-pose idle sheets changed size and staff shape from pose to pose, which would flicker.
- In cast_02 and cast_03 the legs take a step forward (grok drew a stride). cast_04 is a separate drawing, and its staff is slightly shorter.
- cast_03 shows the staff head edge-on, so the crystal is barely visible.
- The portrait robe reads more navy than the sprite's purple.
