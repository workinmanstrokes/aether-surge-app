// Unit tests: ad caps (js/ads.js) and the debug/release ad-id switch (scripts/configure.mjs). Run: npm test
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), { execFileSync } = require('node:child_process');
const ads = require('../www/js/ads.js');
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('ok -', name); };
const T0 = new Date(2026, 9, 17, 10).getTime(), T1 = new Date(2026, 9, 18, 9).getTime();
const cfg = { dailyCap: 3 };

ok('fresh ledger allows every placement', () => { const l = {}; for (const p of ['revive', 'double', 'zone', 'chest']) assert.equal(ads.gate(l, p, cfg, T0).ok, true); });
ok('daily cap blocks all placements', () => {
  const l = {}; for (let i = 0; i < 3; i++) { assert.ok(ads.gate(l, 'zone', cfg, T0).ok); ads.record(l, 'zone'); }
  assert.equal(ads.gate(l, 'revive', cfg, T0).ok, false); assert.equal(ads.gate(l, 'zone', cfg, T0).why, 'Daily ad limit reached');
});
ok('chest reroll is once per day', () => { const l = {}; ads.gate(l, 'chest', cfg, T0); ads.record(l, 'chest'); assert.equal(ads.gate(l, 'chest', cfg, T0).ok, false); assert.equal(ads.gate(l, 'double', cfg, T0).ok, true); });
ok('caps reset on a new day', () => { const l = {}; ads.gate(l, 'chest', cfg, T0); for (let i = 0; i < 3; i++) ads.record(l, 'chest'); assert.equal(ads.gate(l, 'chest', cfg, T1).ok, true); assert.equal(l.count, 0); });
ok('dayKey uses local calendar day', () => { assert.equal(ads.dayKey(T0), '2026-10-17'); assert.notEqual(ads.dayKey(T0), ads.dayKey(T1)); });

// configure.mjs in a scratch copy so the repo isn't touched
const root = path.join(__dirname, '..');
function scratch() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'brcfg-')); fs.mkdirSync(path.join(d, 'www/js'), { recursive: true }); fs.mkdirSync(path.join(d, 'android'));
  fs.copyFileSync(path.join(root, 'www/js/config.js'), path.join(d, 'www/js/config.js')); return d;
}
const REAL = { ADMOB_APP_ID: 'ca-app-pub-1111111111111111~2222222222', ADMOB_REWARDED_ID: 'ca-app-pub-1111111111111111/3333333333' };
const run = (d, args, extra) => execFileSync(process.execPath, [path.join(root, 'scripts/configure.mjs'), ...args], { cwd: d, env: { PATH: process.env.PATH, ...extra } }).toString();
ok('committed config.js carries Google TEST ids', () => { const c = fs.readFileSync(path.join(root, 'www/js/config.js'), 'utf8'); assert.match(c, /3940256099942544\/5224354917/); assert.match(c, /testing: true/); });
ok('debug build ignores real secrets', () => {
  const d = scratch(); run(d, [], REAL); const c = fs.readFileSync(path.join(d, 'www/js/config.js'), 'utf8');
  assert.match(c, /3940256099942544\/5224354917/); assert.doesNotMatch(c, /1111111111111111/); assert.equal(fs.existsSync(path.join(d, 'android/admob.properties')), false);
});
ok('release build uses real secrets', () => {
  const d = scratch(); run(d, ['--release'], REAL); const c = fs.readFileSync(path.join(d, 'www/js/config.js'), 'utf8');
  assert.match(c, /1111111111111111\/3333333333/); assert.match(c, /testing: false/);
  assert.equal(fs.readFileSync(path.join(d, 'android/admob.properties'), 'utf8').trim(), 'appId=' + REAL.ADMOB_APP_ID);
  run(d, [], {}); assert.match(fs.readFileSync(path.join(d, 'www/js/config.js'), 'utf8'), /3940256099942544\/5224354917/); // back to test
  assert.equal(fs.existsSync(path.join(d, 'android/admob.properties')), false);
});
ok('release without secrets stays on TEST ids and warns', () => { const d = scratch(); const out = run(d, ['--release'], {}); assert.match(out, /MUST NOT SHIP/); assert.match(fs.readFileSync(path.join(d, 'www/js/config.js'), 'utf8'), /testing: true/); });
ok('malformed ids are rejected', () => { const d = scratch(); assert.throws(() => run(d, ['--release'], { ...REAL, ADMOB_REWARDED_ID: 'oops' })); });
// sprite cast (js/sprites.js): original names, all roles present, sane sizes
const { CAST } = (() => { const g = {}; new Function('window', require('fs').readFileSync(path.join(root, 'www/js/sprites.js'), 'utf8'))(g); return g.Sprites; })();
ok('cast has every gameplay role with unique original names', () => {
  for (const k of ['trooper', 'leader', 'swarmA', 'swarmB', 'tank', 'boss']) { assert.ok(CAST[k], k); assert.ok(CAST[k].w > 0 && CAST[k].h > 0 && CAST[k].frames >= 2); }
  const names = Object.values(CAST).map(c => c.name); assert.equal(new Set(names).size, names.length);
  assert.ok(!names.some(nm => /bombardiro|crocodilo|cappuccina|tung|sahur|tralalero|tralala|lirili|larila|brr ?brr|patapim/i.test(nm)));
});
console.log(`\n${n} tests passed`);
