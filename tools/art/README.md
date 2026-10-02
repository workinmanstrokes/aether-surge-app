# App art generator

All of the app art for **Brainrot: Tactical Aura Rush** is drawn from code here, with no stock or
third-party images. The art matches what the game draws in `www/index.html`: white/cyan voxel troopers,
gold "aura", cyan lane rails, a navy/purple arena, and the gold-headed Gorilla King voxel boss. Every
character and shape is original.

```bash
cd tools/art
npm install                 # playwright-core only; uses the system Google Chrome
node generate.mjs           # icon, adaptive layers, splash screens, feature graphic
node capture-screenshots.mjs --seed 300 --out /tmp/shots   # gameplay screenshots, 1080x1920
```

Set `CHROME_PATH` if Chrome isn't at `/usr/bin/google-chrome`. Use `node generate.mjs --preview DIR`
to render a few samples without touching the repo.

| File | What it is |
| --- | --- |
| `scenes.mjs` | SVG builders: isometric voxel helper (same face shading as the game's `drawVoxel`), trooper, Gorilla King, aura flame, wordmark, plus the icon, splash and feature-graphic layouts |
| `generate.mjs` | Renders the SVGs in headless Chrome at each exact size and writes them into the repo |
| `png.mjs` | Re-encodes opaque PNGs as 32-bit RGBA. Chrome saves opaque screenshots as 24-bit, but Play wants a 32-bit icon |
| `capture-screenshots.mjs` | Serves `www/`, plays the real game with a seeded autopilot, and saves store screenshots |
| `fonts/ArchivoBlack-Regular.ttf` | Wordmark font (SIL OFL 1.1, see `fonts/OFL.txt`). It's the closest open font to the game's Arial Black |

## Outputs

- `store-assets/icon-512.png`: Play Store icon, 512x512, 32-bit RGBA PNG
- `store-assets/feature-graphic-1024x500.png` (+ `.svg`): Play feature graphic, 24-bit PNG with no alpha
- `assets/icon*.{svg,png}`, `assets/splash*.{svg,png}`: `@capacitor/assets` sources, kept in sync
- `android/.../mipmap-{ldpi..xxxhdpi}/`: `ic_launcher` (rounded square, 48dp), `ic_launcher_round` (circle),
  and `ic_launcher_foreground` / `ic_launcher_background`, which are full 108dp adaptive layers. The
  trooper squad stays inside the 66dp safe zone. `mipmap-anydpi-v26/*.xml` points at these layers
  directly, with no inset.
- `android/.../drawable*/splash.png`: all 26 splash folders (port/land, day/night, ldpi to xxxhdpi), at the
  same sizes as before

## Screenshots

`capture-screenshots.mjs` opens the game at 432x768 CSS px with `deviceScaleFactor: 2.5`, which gives
exactly 1080x1920 device pixels. Nothing is resized afterwards. `Math.random` is seeded, so a run is
mostly repeatable. The game runs in real time, so frame timing can still vary a little. An autopilot steers with real mouse-drag events, and the script takes a shot when a named
moment happens (gate choice, swarm, wide formation, spearhead, Gorilla King telegraph, Last Stand,
crash-out). Each run restarts after the boss, because the current game freezes there (see the PR notes).
Use `--only name1,name2` to re-shoot specific moments.

The game sizes its canvas in CSS pixels, so on a 2.5x screen the browser would stretch a 432x768 bitmap.
To keep the shots crisp, the harness backs `#gameCanvas` with a devicePixelRatio-sized bitmap and
pre-scales the context. That's the only change, and it applies to the capture only. Game code, logic
and draw calls stay the same. Shipping the same DPR fix in the game would make it look this sharp on
phones too.
