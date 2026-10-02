#!/usr/bin/env node
// Generates all app art for Brainrot: Tactical Aura Rush from code (SVG rendered by headless Chrome).
//   cd tools/art && npm install && node generate.mjs [--preview DIR]
// Needs Google Chrome (CHROME_PATH, default /usr/bin/google-chrome). Writes, relative to the repo root:
//   store-assets/icon-512.png                     Play Store icon (512x512, 32-bit RGBA)
//   store-assets/feature-graphic-1024x500.png     Play Store feature graphic (24-bit, no alpha)
//   assets/*.svg|png                              @capacitor/assets sources (icon, adaptive layers, splash)
//   android/app/src/main/res/mipmap-*/            legacy, round and adaptive launcher icons
//   android/app/src/main/res/drawable*/splash.png every splash folder Capacitor uses
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from './scenes.mjs';
import { forceRGBA } from './png.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const font = fs.readFileSync(path.join(here, 'fonts/ArchivoBlack-Regular.ttf')).toString('base64');
const previewIdx = process.argv.indexOf('--preview');
const preview = previewIdx > 0 ? process.argv[previewIdx + 1] : null;
const res = path.join(root, 'android/app/src/main/res');

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome' });
const page = await browser.newPage();

// mask: null | 'rounded' | 'circle' (legacy launcher shapes); alpha: keep transparency
async function render(svgText, W, H, out, { mask = null, alpha = true, rgba = false } = {}) {
  let body = svgText;
  if (mask) {
    const clip = mask === 'circle'
      ? `<circle cx="${W / 2}" cy="${H / 2}" r="${W / 2}"/>`
      : `<rect width="${W}" height="${H}" rx="${W * 0.18}"/>`;
    body = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><clipPath id="m">${clip}</clipPath></defs><g clip-path="url(#m)">${svgText.replace(/^<svg[^>]*>/, `<svg x="0" y="0" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`)}</g></svg>`;
  }
  await page.setViewportSize({ width: W, height: H });
  await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${body}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  let png = await page.screenshot({ omitBackground: alpha, clip: { x: 0, y: 0, width: W, height: H } });
  if (rgba) png = forceRGBA(png);
  fs.writeFileSync(out, png);
  console.log('wrote', path.relative(root, out), `${W}x${H}`);
}
const write = (p, txt) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, txt); console.log('wrote', path.relative(root, p)); };

if (preview) {
  fs.mkdirSync(preview, { recursive: true });
  await render(S.iconFull(512), 512, 512, path.join(preview, 'icon-512.png'), { rgba: true });
  await render(S.iconForeground(432), 432, 432, path.join(preview, 'fg.png'));
  await render(S.iconBackground(432), 432, 432, path.join(preview, 'bg.png'), { rgba: true });
  await render(S.splash(1280, 1920, font), 1280, 1920, path.join(preview, 'splash-port.png'));
  await render(S.splash(1920, 1280, font), 1920, 1280, path.join(preview, 'splash-land.png'));
  await render(S.featureGraphic(font), 1024, 500, path.join(preview, 'feature.png'), { alpha: false });
  await browser.close();
  process.exit(0);
}

// --- Store art ---
await render(S.iconFull(512), 512, 512, path.join(root, 'store-assets/icon-512.png'), { rgba: true });
await render(S.featureGraphic(font), 1024, 500, path.join(root, 'store-assets/feature-graphic-1024x500.png'), { alpha: false });
write(path.join(root, 'store-assets/feature-graphic.svg'), S.featureGraphic(font));

// --- @capacitor/assets sources (kept in sync so `npx capacitor-assets generate` gives the same art) ---
const A = path.join(root, 'assets');
write(path.join(A, 'icon.svg'), S.iconFull(1024));
write(path.join(A, 'icon-foreground.svg'), S.iconForeground(1024));
write(path.join(A, 'icon-background.svg'), S.iconBackground(1024));
write(path.join(A, 'splash.svg'), S.splash(2732, 2732, font));
await render(S.iconFull(1024), 1024, 1024, path.join(A, 'icon.png'));
await render(S.iconForeground(1024), 1024, 1024, path.join(A, 'icon-foreground.png'));
await render(S.iconBackground(1024), 1024, 1024, path.join(A, 'icon-background.png'));
await render(S.splash(2732, 2732, font), 2732, 2732, path.join(A, 'splash.png'));
await render(S.splash(2732, 2732, font, { night: true }), 2732, 2732, path.join(A, 'splash-dark.png'));

// --- Android launcher icons ---
const dens = { ldpi: 0.75, mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [d, k] of Object.entries(dens)) {
  const legacy = Math.round(48 * k), layer = Math.round(108 * k);
  const dir = path.join(res, `mipmap-${d}`);
  await render(S.iconFull(legacy), legacy, legacy, path.join(dir, 'ic_launcher.png'), { mask: 'rounded' });
  await render(S.iconFull(legacy), legacy, legacy, path.join(dir, 'ic_launcher_round.png'), { mask: 'circle' });
  await render(S.iconForeground(layer), layer, layer, path.join(dir, 'ic_launcher_foreground.png'));
  await render(S.iconBackground(layer), layer, layer, path.join(dir, 'ic_launcher_background.png'));
}
// Full-size 108dp layers, so the adaptive icon uses them without an inset.
const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;
write(path.join(res, 'mipmap-anydpi-v26/ic_launcher.xml'), adaptive);
write(path.join(res, 'mipmap-anydpi-v26/ic_launcher_round.xml'), adaptive);
write(path.join(res, 'values/ic_launcher_background.xml'), `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${S.PAL.navy.toUpperCase()}</color>
</resources>
`);

// --- Splash screens: every drawable folder Capacitor generates, same sizes as before ---
const port = { ldpi: [240, 320], mdpi: [320, 480], hdpi: [480, 800], xhdpi: [720, 1280], xxhdpi: [960, 1600], xxxhdpi: [1280, 1920] };
const splashes = [['drawable', 320, 480, false], ['drawable-night', 320, 480, true]];
for (const [d, [w, h]] of Object.entries(port)) {
  splashes.push([`drawable-port-${d}`, w, h, false], [`drawable-port-night-${d}`, w, h, true]);
  splashes.push([`drawable-land-${d}`, h, w, false], [`drawable-land-night-${d}`, h, w, true]);
}
// The old splash set used 1920x1280 for land-xxxhdpi and 320x240 for drawable-night; keep those exact sizes.
for (const s of splashes) { if (s[0] === 'drawable-night') { s[1] = 320; s[2] = 240; } }
for (const [dir, w, h, night] of splashes)
  await render(S.splash(w, h, font, { night }), w, h, path.join(res, dir, 'splash.png'), { alpha: false });

await browser.close();
