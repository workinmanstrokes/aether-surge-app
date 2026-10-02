// SVG scene builders for Brainrot: Tactical Aura Rush app art.
// Everything is drawn from primitives (isometric voxels, gradients, paths) so the art is
// original and matches the in-game look: white/cyan voxel squad, gold "aura", cyan lane rails,
// navy/purple arena and the gold-headed Gorilla King voxel boss.
export const PAL = {
  navy: '#0f172a', ink: '#020617', indigo: '#1e1b4b', purple: '#3b0764', violet: '#6d28d9',
  cyan: '#38bdf8', cyanDeep: '#0284c7', gold: '#facc15', goldDeep: '#ca8a04', pink: '#ec4899',
  white: '#e2e8f0', slate: '#1e293b', red: '#ef4444', green: '#22c55e', bossGold: '#eab308',
};

export function shade(hex, pct) { // same maths as the game's adjustBrightness()
  const n = parseInt(hex.slice(1), 16), a = Math.round(2.55 * pct);
  const c = v => Math.max(0, Math.min(255, v + a));
  const r = c(n >> 16), g = c((n >> 8) & 255), b = c(n & 255);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// 2:1 isometric projection. World X goes down-right, Y goes down-left, Z is up.
export function iso(ox, oy, s) {
  const P = (X, Y, Z) => [ox + (X - Y) * 0.866 * s, oy + (X + Y) * 0.5 * s - Z * s];
  const poly = (pts, fill, extra = '') =>
    `<polygon points="${pts.map(p => P(...p).map(v => v.toFixed(2)).join(',')).join(' ')}" fill="${fill}" ${extra}/>`;
  // Visible faces of a box: top = base colour, +X face = -25, +Y face = -45 (game shading).
  const box = (X, Y, Z, w, d, h, col, { stroke = null, sw = 0, shades = [-25, -45] } = {}) => {
    const st = stroke ? `stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"` : '';
    return [
      poly([[X, Y + d, Z], [X + w, Y + d, Z], [X + w, Y + d, Z + h], [X, Y + d, Z + h]], shade(col, shades[1]), st),
      poly([[X + w, Y, Z], [X + w, Y + d, Z], [X + w, Y + d, Z + h], [X + w, Y, Z + h]], shade(col, shades[0]), st),
      poly([[X, Y, Z + h], [X + w, Y, Z + h], [X + w, Y + d, Z + h], [X, Y + d, Z + h]], col, st),
    ].join('');
  };
  return { P, poly, box };
}

// A squad trooper: white body, cyan helmet with a dark visor and glowing eyes, little blaster.
// (X,Y) is the centre of the footprint, unit = one body width.
export function trooper(I, X, Y, Z = 0, { outline = PAL.ink, sw = 0, eyes = PAL.gold, back = false } = {}) {
  const o = { stroke: sw ? outline : null, sw };
  const parts = [];
  parts.push(I.box(X - 0.5, Y - 0.5, Z, 1, 1, 1.15, '#ffffff', { ...o, shades: [-14, -32] })); // body
  if (back) { // seen from behind (running away from the viewer): helmet + side blaster only
    parts.push(I.box(X + 0.5, Y - 0.6, Z + 0.35, 0.24, 0.5, 0.24, '#334155', o));
    parts.push(I.box(X - 0.45, Y - 0.45, Z + 1.15, 0.9, 0.9, 0.85, PAL.cyan, o));
    parts.push(I.poly([[X - 0.3, Y + 0.452, Z + 1.3], [X + 0.3, Y + 0.452, Z + 1.3], [X + 0.3, Y + 0.452, Z + 1.42], [X - 0.3, Y + 0.452, Z + 1.42]], PAL.gold));
    return parts.join('');
  }
  parts.push(I.box(X - 0.12, Y + 0.5, Z + 0.35, 0.24, 0.55, 0.24, '#334155', o)); // blaster (sticks out +Y)
  parts.push(I.box(X - 0.08, Y + 1.0, Z + 0.39, 0.16, 0.12, 0.16, PAL.cyan, o));  // blaster tip
  parts.push(I.box(X - 0.45, Y - 0.45, Z + 1.15, 0.9, 0.9, 0.85, PAL.cyan, o));  // helmet
  // visor band on the +X face of the helmet
  parts.push(I.poly([[X + 0.452, Y - 0.38, Z + 1.42], [X + 0.452, Y + 0.38, Z + 1.42], [X + 0.452, Y + 0.38, Z + 1.72], [X + 0.452, Y - 0.38, Z + 1.72]], PAL.navy));
  parts.push(I.poly([[X + 0.455, Y - 0.27, Z + 1.5], [X + 0.455, Y - 0.1, Z + 1.5], [X + 0.455, Y - 0.1, Z + 1.64], [X + 0.455, Y - 0.27, Z + 1.64]], eyes));
  parts.push(I.poly([[X + 0.455, Y + 0.1, Z + 1.5], [X + 0.455, Y + 0.27, Z + 1.5], [X + 0.455, Y + 0.27, Z + 1.64], [X + 0.455, Y + 0.1, Z + 1.64]], eyes));
  return parts.join('');
}

// Original voxel "Gorilla King": dark armoured block body, huge fists, gold head, brow, red eyes, crown.
export function gorillaKing(I0, X, Y, Z = 0, angry = true, faceY = false) {
  // faceY mirrors the model across X=Y so the face points toward +Y (down-left on screen)
  const I = faceY ? { box: (x, y, z, w, d, h, c, o) => I0.box(X + (y - Y), Y + (x - X), z, d, w, h, c, o) } : I0;
  const eye = angry ? PAL.red : PAL.ink, p = [];
  const armor = '#64748b', o = { stroke: '#0b1222', sw: 1.2 }, ao = { ...o, shades: [-8, -20] };
  p.push(I.box(X - 1.6, Y - 1.4, Z, 0.9, 0.9, 1.0, armor, ao));       // back fist
  p.push(I.box(X - 1.2, Y - 1.2, Z, 2.4, 2.4, 2.2, armor, ao));       // torso
  p.push(I.box(X - 0.9, Y - 0.9, Z + 2.2, 1.8, 1.8, 1.5, PAL.bossGold, o)); // head
  p.push(I.box(X + 0.9, Y - 0.85, Z + 3.0, 0.25, 1.7, 0.3, shade(PAL.bossGold, -30))); // brow
  p.push(I.box(X + 0.9, Y - 0.6, Z + 2.55, 0.12, 0.4, 0.32, eye));     // eyes
  p.push(I.box(X + 0.9, Y + 0.2, Z + 2.55, 0.12, 0.4, 0.32, eye));
  p.push(I.box(X + 0.9, Y - 0.4, Z + 2.25, 0.35, 0.8, 0.25, shade(PAL.bossGold, -15))); // muzzle
  for (const [cx, cy] of [[-0.8, -0.8], [0.3, -0.8], [-0.8, 0.3], [0.3, 0.3], [-0.25, -0.25]])
    p.push(I.box(X + cx, Y + cy, Z + 3.7, 0.5, 0.5, cx === -0.25 ? 0.8 : 0.5, PAL.gold)); // crown
  p.push(I.box(X + 0.9, Y + 1.0, Z, 1.0, 1.0, 1.1, armor, ao));       // front fist
  return p.join('');
}

const aura = (cx, cy, r, id) => `
  <defs>
    <radialGradient id="${id}g" cx="50%" cy="60%" r="55%">
      <stop offset="0" stop-color="#fff7d6"/><stop offset="0.35" stop-color="${PAL.gold}"/>
      <stop offset="0.75" stop-color="${PAL.pink}" stop-opacity="0.85"/><stop offset="1" stop-color="${PAL.pink}" stop-opacity="0"/>
    </radialGradient>
    <filter id="${id}b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5"/></filter>
  </defs>
  <g transform="translate(${cx} ${cy}) scale(${r / 100})">
    <path filter="url(#${id}b)" fill="url(#${id}g)" d="M0,-120 C18,-92 10,-80 30,-70 C34,-88 48,-96 52,-104 C56,-70 74,-52 80,-20 C90,-30 96,-40 100,-46 C110,10 92,62 50,84 C30,96 -30,96 -50,84 C-92,62 -110,10 -100,-46 C-96,-40 -90,-30 -80,-20 C-74,-52 -56,-70 -52,-104 C-48,-96 -34,-88 -30,-70 C-10,-80 -18,-92 0,-120 Z"/>
  </g>`;

const sparkles = (pts, col = PAL.gold) => pts.map(([x, y, s, rot = 45]) =>
  `<rect x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" fill="${col}" transform="rotate(${rot} ${x} ${y})"/>`).join('');

function fontFace(fontB64) {
  return `<style>@font-face{font-family:'AB';src:url(data:font/ttf;base64,${fontB64}) format('truetype');}</style>`;
}

function bgArena(W, H, id, { rails = true, cx = W / 2 } = {}) {
  const m = Math.min(W, H);
  let s = `<defs><radialGradient id="${id}" cx="${cx / W}" cy="0.38" r="0.85">
    <stop offset="0" stop-color="${PAL.violet}"/><stop offset="0.35" stop-color="${PAL.purple}"/>
    <stop offset="0.75" stop-color="${PAL.indigo}"/><stop offset="1" stop-color="${PAL.ink}"/></radialGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#${id})"/>`;
  if (rails) { // perspective lane: two cyan rails converging on a horizon + lane stripes
    const hy = H * 0.30, vx = cx, half = m * 0.62;
    s += `<g opacity="0.9">`;
    s += `<polygon points="${vx - m * 0.05},${hy} ${vx + m * 0.05},${hy} ${vx + half},${H} ${vx - half},${H}" fill="${PAL.navy}" opacity="0.55"/>`;
    for (let i = 0; i < 7; i++) { // stripes, spaced in perspective
      const t = Math.pow((i + 1) / 7, 1.8), y = hy + (H - hy) * t, w = m * 0.05 + (half - m * 0.05) * t;
      s += `<line x1="${vx - w}" y1="${y}" x2="${vx + w}" y2="${y}" stroke="${PAL.cyan}" stroke-opacity="${0.12 + 0.18 * t}" stroke-width="${m * 0.008 * (0.4 + t)}"/>`;
    }
    for (const sgn of [-1, 1])
      s += `<polygon points="${vx + sgn * m * 0.05},${hy} ${vx + sgn * m * 0.058},${hy} ${vx + sgn * (half + m * 0.035)},${H} ${vx + sgn * half},${H}" fill="${PAL.cyan}"/>`;
    s += `</g>`;
  }
  return s;
}

// The squad emblem: hero trooper in a gold aura with two wingmen. Centred at (cx,cy), size ~ m.
function emblem(cx, cy, m, id, { wingmen = true, sw = 0 } = {}) {
  const s = m / 5.2;
  const I = iso(cx, cy + m * 0.30, s);
  let g = aura(cx, cy - m * 0.02, m * 0.45, id);
  g += `<ellipse cx="${cx}" cy="${cy + m * 0.33}" rx="${m * 0.36}" ry="${m * 0.1}" fill="${PAL.gold}" opacity="0.25"/>`;
  g += `<ellipse cx="${cx}" cy="${cy + m * 0.33}" rx="${m * 0.36}" ry="${m * 0.1}" fill="none" stroke="${PAL.gold}" stroke-width="${m * 0.012}"/>`;
  if (wingmen) {
    const Iw = iso(cx, cy + m * 0.30, s * 0.72);
    g += trooper(Iw, -2.05, 0.35, 0, { sw: sw * 0.7 }); // back-left (behind)
    g += trooper(Iw, 0.35, -2.05, 0, { sw: sw * 0.7 }); // back-right
  }
  g += trooper(I, 0.25, 0.25, 0, { sw });
  g += sparkles([[cx - m * 0.36, cy - m * 0.22, m * 0.035], [cx + m * 0.38, cy - m * 0.3, m * 0.045], [cx + m * 0.30, cy + m * 0.12, m * 0.028], [cx - m * 0.30, cy + m * 0.16, m * 0.03], [cx + m * 0.05, cy - m * 0.47, m * 0.03]]);
  return g;
}

const svg = (W, H, body, fontB64 = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${fontB64 ? fontFace(fontB64) : ''}${body}</svg>`;

export function iconFull(S) { // full-bleed square icon (Play icon / legacy launcher base)
  return svg(S, S, bgArena(S, S, 'ibg') + emblem(S / 2, S * 0.5, S * 0.8, 'ia', { sw: S * 0.004 }));
}
export function iconBackground(S) { // adaptive background layer (108dp canvas)
  return svg(S, S, bgArena(S, S, 'abg'));
}
export function iconForeground(S) { // adaptive foreground: keep inside the 66dp safe circle
  return svg(S, S, emblem(S / 2, S * 0.5, S * 0.5, 'fa', { sw: S * 0.003 }));
}

function wordmark(cx, cy, size, { sub = true, anchor = 'middle' } = {}) {
  const t = (txt, y, fs, fill, stroke, sw, ls = 0) =>
    `<text x="${cx}" y="${y}" font-family="AB" font-size="${fs}" text-anchor="${anchor}" letter-spacing="${ls}"
      fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" paint-order="stroke">${txt}</text>`;
  let g = `<defs><linearGradient id="wmg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fef08a"/><stop offset="0.55" stop-color="${PAL.gold}"/><stop offset="1" stop-color="${PAL.goldDeep}"/></linearGradient></defs>`;
  g += t('BRAINROT', cy + size * 0.09, size, '#713f12', '#713f12', size * 0.16); // drop
  g += t('BRAINROT', cy, size, 'url(#wmg)', PAL.ink, size * 0.12);
  if (sub) g += t('TACTICAL AURA RUSH', cy + size * 0.72, size * 0.36, PAL.cyan, PAL.ink, size * 0.08, size * 0.02);
  return g;
}

export function splash(W, H, fontB64, { night = false } = {}) {
  const m = Math.min(W, H);
  const bg = `<defs><radialGradient id="sbg" cx="0.5" cy="0.45" r="0.75">
    <stop offset="0" stop-color="${night ? PAL.purple : PAL.violet}"/><stop offset="0.45" stop-color="${night ? PAL.indigo : PAL.purple}"/>
    <stop offset="1" stop-color="${night ? PAL.ink : PAL.navy}"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#sbg)"/>`;
  const em = emblem(W / 2, H / 2 - m * 0.12, m * 0.42, 'sa', { sw: m * 0.002 });
  return svg(W, H, bg + em + wordmark(W / 2, H / 2 + m * 0.2, m * 0.13), fontB64);
}

const sign = (x, y, col, label, fs) => {
  const w = label.length * fs * 0.72 + fs;
  return `<rect x="${x - w / 2}" y="${y - fs * 1.05}" width="${w}" height="${fs * 1.5}" rx="${fs * 0.35}" fill="${PAL.navy}" stroke="${col}" stroke-width="${fs * 0.14}"/>
    <text x="${x}" y="${y}" font-family="AB" font-size="${fs}" text-anchor="middle" fill="#fff">${label}</text>`;
};

export function featureGraphic(fontB64) {
  const W = 1024, H = 500, s = 30;
  let b = bgArena(W, H, 'fbg', { rails: false, cx: W * 0.72 });
  const OX = 770, OY = 160, I = iso(OX, OY, s);
  // lane runs along Y: far end (boss) at the right edge, near end (squad) at the bottom centre
  const X0 = 0, X1 = 8, Yf = -5, Yn = 17;
  b += I.poly([[X0, Yf, 0], [X1, Yf, 0], [X1, Yn, 0], [X0, Yn, 0]], PAL.navy, 'opacity="0.9"');
  for (let y = Yf + 1; y < Yn; y += 2.4) b += I.poly([[X0, y, 0], [X1, y, 0], [X1, y + 0.12, 0], [X0, y + 0.12, 0]], PAL.cyan, 'opacity="0.22"');
  b += I.poly([[X0 - 0.28, Yf, 0], [X0, Yf, 0], [X0, Yn, 0], [X0 - 0.28, Yn, 0]], PAL.cyan);
  b += I.poly([[X1, Yf, 0], [X1 + 0.28, Yf, 0], [X1 + 0.28, Yn, 0], [X1, Yn, 0]], PAL.cyan);
  // boss telegraph strip toward the squad
  b += I.poly([[2.8, -1, 0.01], [5.2, -1, 0.01], [5.2, 12, 0.01], [2.8, 12, 0.01]], PAL.red, 'opacity="0.25"');
  const [bx, by] = I.P(4, -2.2, 0);
  b += `<ellipse cx="${bx}" cy="${by}" rx="${s * 3}" ry="${s * 1.4}" fill="#000" opacity="0.5"/>`;
  b += gorillaKing(I, 4, -2.2, 0, true, true);
  // gate pair across the lane
  b += I.box(0.15, 3.6, 0, 3.7, 0.3, 0.3, PAL.green) + I.box(4.15, 3.6, 0, 3.7, 0.3, 0.3, PAL.red);
  const [g1x, g1y] = I.P(2, 3.6, 0), [g2x, g2y] = I.P(6, 3.6, 0);
  b += sign(g1x, g1y - 14, PAL.green, '+20 SQUAD', 17) + sign(g2x, g2y - 14, PAL.red, '-10 SQUAD', 17);
  // squad in spearhead formation, seen from behind, wrapped in aura
  const [ax, ay] = I.P(2.6, 9.0, 0);
  b += aura(ax, ay - s * 1.2, s * 2.8, 'fa');
  const spots = [[2.4, 7.4], [1.7, 8.6], [3.1, 8.6], [1.0, 9.8], [2.4, 9.8], [3.8, 9.8], [0.9, 11.1], [2.0, 11.1], [3.1, 11.1], [4.2, 11.1]];
  spots.sort((a, c) => (a[0] + a[1]) - (c[0] + c[1]));
  for (const [x, y] of spots) b += trooper(iso(OX, OY, s * 0.9), x / 0.9 + 0.4, y / 0.9 + 1.2, 0, { sw: 1.1, back: true });
  const [px, py] = I.P(4.6, 12.6, 0);
  b += `<rect x="${px - 34}" y="${py - 4}" width="68" height="28" rx="14" fill="${PAL.navy}" stroke="${PAL.cyan}" stroke-width="2.5"/><text x="${px}" y="${py + 16}" font-family="AB" font-size="17" text-anchor="middle" fill="#fff">x10</text>`;
  b += sparkles([[W * 0.66, H * 0.10, 12], [W * 0.80, H * 0.06, 9], [W * 0.95, H * 0.80, 14], [W * 0.50, H * 0.93, 9], [W * 0.44, H * 0.13, 10]]);
  b += `<defs><linearGradient id="fshade" x1="0" x2="1"><stop offset="0" stop-color="${PAL.ink}" stop-opacity="0.7"/><stop offset="1" stop-color="${PAL.ink}" stop-opacity="0"/></linearGradient></defs><rect x="0" y="0" width="${W * 0.45}" height="${H}" fill="url(#fshade)"/>`;
  b += wordmark(W * 0.26, H * 0.40, 86);
  b += `<text x="${W * 0.26}" y="${H * 0.71}" font-family="AB" font-size="17" text-anchor="middle" fill="#fff" stroke="${PAL.ink}" stroke-width="5" paint-order="stroke">PICK GATES. GROW THE SQUAD. FARM AURA.</text>`;
  return svg(W, H, b, fontB64);
}
