#!/usr/bin/env node
// Store art featuring the brainrot cast (www/js/sprites.js), drawn on canvas in headless Chrome.
//   node tools/art/store-art.mjs --shots DIR --out DIR
// Writes to --out (and store-assets/ in the repo):
//   icon-512.png (32-bit RGBA), feature-1024x500.png (24-bit), 01..08-*.png 1080x1920 captioned phone screenshots
//   built from the raw gameplay captures in --shots (from capture-screenshots.mjs).
import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { forceRGBA } from './png.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '../..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const shots = path.resolve(arg('--shots', '/tmp/shots')), out = path.resolve(arg('--out', path.join(root, 'store-assets/store')));
fs.mkdirSync(out, { recursive: true });
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  const f = u.startsWith('/shots/') ? path.join(shots, u.slice(7)) : path.join(root, u);
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.png') ? 'image/png' : f.endsWith('.ttf') ? 'font/ttf' : 'text/html' }); r.end(d); });
});
await new Promise(res => srv.listen(0, '127.0.0.1', res)); const base = `http://127.0.0.1:${srv.address().port}`;
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--force-color-profile=srgb'] });
const page = await browser.newPage({ deviceScaleFactor: 1 });
await page.goto(base + '/www/js/sprites.js');
await page.setContent(`<html><head><style>@font-face{font-family:G;src:url('${base}/tools/art/fonts/ArchivoBlack-Regular.ttf')}body{margin:0}canvas{display:block}</style></head><body><canvas id=c></canvas></body></html>`);
await page.addScriptTag({ url: base + '/www/js/sprites.js' });
await page.evaluate(() => document.fonts.load('40px G'));

async function render(W, H, fnSrc, arg) {
  await page.setViewportSize({ width: W, height: H });
  const dataUrl = await page.evaluate(async ([W, H, src, arg]) => {
    const cv = document.getElementById('c'); cv.width = W; cv.height = H; const c = cv.getContext('2d'); c.clearRect(0, 0, W, H);
    const S = window.Sprites; const fn = new Function('c', 'S', 'W', 'H', 'arg', 'return (async () => {' + src + '})()');
    await fn(c, S, W, H, arg); return cv.toDataURL('image/png');
  }, [W, H, fnSrc, arg]);
  return Buffer.from(dataUrl.split(',')[1], 'base64');
}
const helpers = `
  const sky = (top, bot) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(0, 0, W, H); };
  const rays = (cx, cy, col) => { c.save(); c.translate(cx, cy); c.fillStyle = col; for (let i = 0; i < 16; i++) { c.rotate(Math.PI / 8); c.beginPath(); c.moveTo(0, 0); c.lineTo(W, -W * 0.12); c.lineTo(W, W * 0.12); c.fill(); } c.restore(); };
  const shadow = (x, y, rx) => { c.fillStyle = 'rgba(0,0,0,0.28)'; c.beginPath(); c.ellipse(x, y, rx, rx * 0.22, 0, 0, Math.PI * 2); c.fill(); };
  const word = (t, x, y, px, fill, stroke, lw) => { c.font = px + 'px G'; while (px > 20 && c.measureText(t).width > W - 90) { px -= 2; c.font = px + 'px G'; } c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.lineJoin = 'round'; c.lineWidth = lw; c.strokeStyle = stroke; c.strokeText(t, x, y); c.fillStyle = fill; c.fillText(t, x, y); };
`;
// ---- icon 512: shark-tank and toaster penguin bursting out of a gold aura ring ----
const icon = await render(512, 512, helpers + `
  c.save(); c.beginPath(); c.roundRect(0, 0, W, H, 0); c.clip();
  sky('#3b0764', '#0c4a6e'); rays(256, 300, 'rgba(250,204,21,0.13)');
  const ring = c.createRadialGradient(256, 290, 120, 256, 290, 240); ring.addColorStop(0, 'rgba(250,204,21,0.55)'); ring.addColorStop(1, 'rgba(250,204,21,0)'); c.fillStyle = ring; c.fillRect(0, 0, W, H);
  shadow(256, 470, 170);
  S.draw(c, 'boss', 2, 256, 330, 1.05);
  S.draw(c, 'trooper', 0, 150, 480, 5.2);
  S.draw(c, 'swarmA', 1, 385, 482, 3.6);
  c.restore();`);
fs.writeFileSync(path.join(out, 'icon-512.png'), forceRGBA(icon));
// ---- feature graphic 1024x500 ----
const feat = await render(1024, 500, helpers + `
  sky('#2e1065', '#0e7490'); rays(512, 330, 'rgba(250,204,21,0.10)');
  c.fillStyle = 'rgba(2,6,23,0.35)'; c.fillRect(0, 380, W, 120);
  shadow(150, 455, 80); shadow(870, 455, 110); shadow(512, 470, 200);
  S.draw(c, 'boss', 2, 870, 470, 1.55);
  S.draw(c, 'tank', 1, 690, 470, 2.6);
  S.draw(c, 'swarmB', 0, 455, 480, 2.4);
  S.draw(c, 'leader', 0, 330, 450, 2.6);
  [[90, 480], [175, 486], [255, 482], [130, 430], [215, 434]].forEach(([x, y], i) => S.draw(c, 'trooper', i & 1, x, y, 3.0));
  S.draw(c, 'swarmA', 1, 565, 482, 2.4);
  word('BRAINROT', 512, 112, 92, '#facc15', '#1a1033', 16);
  word('TACTICAL AURA RUSH', 512, 172, 46, '#ffffff', '#1a1033', 10);
  word('Grow the squad. Topple Espressorilla.', 512, 222, 26, '#a5f3fc', '#1a1033', 7);`);
// re-shoot the drawn canvas as an opaque screenshot: Play wants a 24-bit feature graphic without alpha
fs.writeFileSync(path.join(out, 'feature-1024x500.png'), await page.screenshot({ clip: { x: 0, y: 0, width: 1024, height: 500 } }));
// ---- captioned phone screenshots 1080x1920 ----
const SHOTS = [
  ['02-choose-a-gate.png', 'PICK THE RIGHT GATES', 'Grow a squad of toaster penguins'],
  ['04-wide-formation.png', 'GROW A MASSIVE SQUAD', 'Recruit an army of toaster penguins'],
  ['06-gorilla-king-laser.png', 'DODGE ESPRESSORILLA', 'The Gorilla King fires a red-hot laser'],
  ['03-blast-the-swarm.png', 'BLAST THE SWARM', 'Pineapple knights incoming'],
  ['08-formation-gate.png', 'SWITCH FORMATIONS', 'Grid, Wide or Spearhead'],
  ['05-spearhead.png', 'SPEARHEAD THROUGH', 'Shark tanks and pineapple knights'],
  ['07-stage-clear.png', 'SPEND AURA ON UPGRADES', 'Get stronger every zone'],
  ['01-start.png', 'FREE DAILY CHEST', 'Plus permanent Essence upgrades'],
];
let n = 0;
for (const [file, cap, sub] of SHOTS) {
  if (!fs.existsSync(path.join(shots, file))) { console.warn('missing capture', file); continue; }
  n++;
  const png = await render(1080, 1920, helpers + `
    sky('#4c1d95', '#0f172a');
    const img = new Image(); img.src = '/shots/${file}?' + Date.now(); await img.decode();
    const top = 300, h = H - top - 40, w = h * 1080 / 1920, x = (W - w) / 2;
    c.save(); c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 40; c.beginPath(); c.roundRect(x, top, w, h, 36); c.fillStyle = '#000'; c.fill(); c.restore();
    c.save(); c.beginPath(); c.roundRect(x, top, w, h, 36); c.clip(); c.drawImage(img, x, top, w, h); c.restore();
    c.lineWidth = 6; c.strokeStyle = '#38bdf8'; c.beginPath(); c.roundRect(x, top, w, h, 36); c.stroke();
    word(${JSON.stringify(cap)}, W / 2, 150, 76, '#facc15', '#1a1033', 14);
    word(${JSON.stringify(sub)}, W / 2, 232, 44, '#ffffff', '#1a1033', 9);`);
  fs.writeFileSync(path.join(out, `${String(n).padStart(2, '0')}-${file.replace(/^\d+-/, '')}`), png);
}
await browser.close(); srv.close(); console.log(`wrote icon, feature graphic and ${n} screenshots to ${out}`);
