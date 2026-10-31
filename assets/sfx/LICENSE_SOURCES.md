# Forest Brawler — audio license & sources

**All audio in this folder was procedurally generated on this machine** by the scripts in `_src/`
(no samples, recordings, or third-party audio clips were used).

- **SFX** (`sfx.py` + `lib.py` + `export.py`): pure DSP synthesis in Python/NumPy/SciPy (oscillators, filtered noise, envelopes), encoded with LAME 3.100.
- **BGM** (`bgm.py`): original compositions written as MIDI (pretty_midi), rendered with FluidSynth 2.6.1 using the
  **FluidR3_GM soundfont (`/usr/share/sounds/sf2/FluidR3_GM.sf2`, MIT License, © Frank Wen)**, then loudness-normalised,
  limited and encoded with LAME. Loops are seamless (the 3x-rendered middle cycle is cut so reverb tails wrap).
- The MIT license of FluidR3_GM permits use of rendered output in commercial products; the compositions and
  synthesized sounds are original works of this project.

**License: free for commercial use** (no attribution required; crediting "FluidR3_GM soundfont (MIT)" for the BGM is courteous).

| File | Type | Duration (ffprobe) | Format | Source / method | License |
|---|---|---|---|---|---|
| `bgm_boss.mp3` | BGM (loop) | 36.049 s | MP3 2ch / 44.1 kHz | `_src/bgm.py` → MIDI → FluidSynth + FluidR3_GM (MIT); loop = 24 bars @ 160 BPM = 36.000 s (1,587,600 samples) | Original, free for commercial use |
| `bgm_stage1.mp3` | BGM (loop) | 38.426 s | MP3 2ch / 44.1 kHz | `_src/bgm.py` → MIDI → FluidSynth + FluidR3_GM (MIT) | Original, free for commercial use |
| `bgm_stage2.mp3` | BGM (loop) | 45.740 s | MP3 2ch / 44.1 kHz | `_src/bgm.py` → MIDI → FluidSynth + FluidR3_GM (MIT) | Original, free for commercial use |
| `bgm_stage3.mp3` | BGM (loop) | 41.169 s | MP3 2ch / 44.1 kHz | `_src/bgm.py` → MIDI → FluidSynth + FluidR3_GM (MIT) | Original, free for commercial use |
| `bgm_stage4.mp3` | BGM (loop) | 41.770 s | MP3 2ch / 44.1 kHz | `_src/bgm.py` → MIDI → FluidSynth + FluidR3_GM (MIT) | Original, free for commercial use |
| `bgm_stage5.mp3` | BGM (loop) | 40.046 s | MP3 2ch / 44.1 kHz | `_src/bgm.py` → MIDI → FluidSynth + FluidR3_GM (MIT) | Original, free for commercial use |
| `block_clang.mp3` | SFX | 1.019 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `boss_enrage.mp3` | SFX | 1.489 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `boss_intro.mp3` | SFX | 1.489 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `boss_intro_flame_lord.mp3` | SFX | 1.489 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `boss_intro_goblin_chief.mp3` | SFX | 1.489 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `boss_intro_vampire_count.mp3` | SFX | 1.489 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `boss_intro_yeti.mp3` | SFX | 1.489 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `coin.mp3` | SFX | 0.575 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `death.mp3` | SFX | 1.489 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `defeat.mp3` | SFX | 1.489 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `goblin_death.mp3` | SFX | 1.097 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `goblin_hit.mp3` | SFX | 0.313 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `guard_break.mp3` | SFX | 1.489 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `hit_heavy.mp3` | SFX | 0.784 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `hit_light.mp3` | SFX | 0.287 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `hurt.mp3` | SFX | 0.392 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `item_pickup.mp3` | SFX | 0.784 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `jump.mp3` | SFX | 0.340 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `land.mp3` | SFX | 0.444 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `no_mp.mp3` | SFX | 0.366 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `shop_buy.mp3` | SFX | 1.123 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `spell_fire.mp3` | SFX | 1.228 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `spell_ice.mp3` | SFX | 1.358 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `spell_thunder.mp3` | SFX | 1.489 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `spell_thunder_chain.mp3` | SFX | 1.280 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `step_1.mp3` | SFX | 0.235 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `step_2.mp3` | SFX | 0.235 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `step_run_1.mp3` | SFX | 0.209 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `step_run_2.mp3` | SFX | 0.183 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `swing_1.mp3` | SFX | 0.287 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `swing_2.mp3` | SFX | 0.313 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `swing_3.mp3` | SFX | 0.470 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `thrust.mp3` | SFX | 0.340 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `ui_click.mp3` | SFX | 0.104 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `ultimate.mp3` | SFX | 1.489 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `victory.mp3` | SFX | 1.489 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
| `whirlwind.mp3` | SFX | 1.280 s | MP3 1ch / 44.1 kHz | `_src/sfx.py` procedural DSP synthesis | Original, free for commercial use |
