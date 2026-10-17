// Playwright smoke test of the web build: start a run, daily chest, and the three in-run ad offers using the
// browser ad simulator (?adsim=1), plus a check that no ad buttons show without it (web = ads no-op).
// Usage: python3 -m http.server 8812 -d www &  PW=playwright-core URL=http://localhost:8812/ CHROME=/usr/bin/google-chrome node tests/smoke.mjs
const { chromium } = await import(process.env.PW || 'playwright-core');
const URL = process.env.URL || 'http://localhost:8812/';
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const errs = []; let fails = 0;
const fail = m => { console.error('FAIL', m); fails++; }, pass = m => console.log('ok -', m);
async function page(q) {
  const p = await b.newPage({ viewport: { width: 400, height: 820 }, isMobile: true, hasTouch: true });
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(URL + q, { waitUntil: 'load' }); await p.waitForTimeout(400); return p;
}
// 1) plain web: no ad buttons anywhere
let p = await page('');
if (await p.$('#chestBtn')) pass('daily chest offered'); else fail('no chest');
await p.click('#chestBtn'); const e1 = await p.evaluate(() => meta.essence);
if (e1 > 0) pass('chest gave ◈ ' + e1); else fail('chest gave nothing');
if (await p.$('.btn.ad')) fail('ad button shown on web without adsim'); else pass('no ad buttons on plain web');
const href = await p.getAttribute('#privacyLink', 'href'); if (/test-builds\/privacy\/brainrot-aura-rush\.html$/.test(href)) pass('privacy link'); else fail('privacy link ' + href);
await p.click('text=TAP TO START'); await p.waitForTimeout(1500);
if (await p.evaluate(() => state) === 'PLAYING') pass('run started'); else fail('run did not start');
await p.evaluate(() => { squad.count = 0; gameOver(); }); await p.waitForTimeout(200);
if (await p.$('#adOffers .btn')) fail('ad offers on plain web'); else pass('game over shows no ad offers on plain web');
await p.close();

// 2) simulated ads
p = await page('?adsim=1');
await p.evaluate(() => { localStorage.clear(); }); await p.reload(); await p.waitForTimeout(400);
await p.click('#chestBtn'); await p.waitForSelector('#adChest');
const before = await p.evaluate(() => ({ e: meta.essence, a: save.chestAmt }));
await p.click('#adChest'); await p.waitForTimeout(2600);
const after = await p.evaluate(() => ({ e: meta.essence, a: save.chestAmt, led: save.ads }));
if (after.a >= before.a && after.e - before.e === after.a - before.a && after.led.chest === 1) pass(`chest reroll (${before.a} -> ${after.a})`); else fail('chest reroll ' + JSON.stringify({ before, after }));
if (await p.$('#adChest')) fail('chest reroll offered twice'); else pass('chest reroll capped at 1/day');
await p.click('text=TAP TO START'); await p.waitForTimeout(2500);
await p.evaluate(() => { runKills = 40; runAuraEarned = 1200; squad.count = 0; gameOver(); }); await p.waitForTimeout(200);
const g = await p.evaluate(() => ({ lastGained, e: meta.essence }));
if (await p.$('#revive') && await p.$('#double')) pass('game over offers revive + double (◈ +' + g.lastGained + ')'); else fail('missing offers');
await p.click('#revive'); await p.waitForTimeout(2600);
const r = await p.evaluate(() => ({ state, count: squad.count, e: meta.essence, runRevived, modal: $('endModal').style.display }));
if (r.state === 'PLAYING' && r.count >= 12 && r.modal === 'none' && r.e === g.e - g.lastGained) pass(`revived with ${r.count} troopers, essence refunded`); else fail('revive ' + JSON.stringify(r));
await p.waitForTimeout(1200);
await p.evaluate(() => { squad.count = 0; gameOver(); }); await p.waitForTimeout(200);
if (await p.$('#revive')) fail('second revive offered'); else pass('revive capped at 1/run');
const g2 = await p.evaluate(() => ({ lastGained, e: meta.essence }));
await p.click('#double'); await p.waitForTimeout(2600);
const d = await p.evaluate(() => ({ e: meta.essence, desc: $('endDesc').textContent }));
if (d.e === g2.e + g2.lastGained && /doubled/.test(d.desc)) pass('essence doubled (+' + g2.lastGained + ')'); else fail('double ' + JSON.stringify(d));
if (await p.$('#double')) fail('double offered twice'); else pass('double capped at 1/run end');
await p.click('#nextBtn'); await p.waitForTimeout(800);
await p.evaluate(() => { aura = 2000; victory(); }); await p.waitForTimeout(200);
const a0 = await p.evaluate(() => aura);
if (await p.$('#zone')) pass('zone clear offers bonus aura'); else fail('no zone bonus');
await p.click('#zone'); await p.waitForTimeout(2600);
const a1 = await p.evaluate(() => aura);
if (a1 > a0 && !(await p.$('#zone'))) pass(`bonus aura ${a0} -> ${a1}, capped at 1/zone`); else fail('zone bonus ' + a0 + ' ' + a1);
await p.click('#nextBtn'); await p.waitForTimeout(1500);
if (await p.evaluate(() => state) === 'PLAYING' && await p.evaluate(() => level) === 2) pass('zone 2 runs'); else fail('zone 2');
await p.screenshot({ path: process.env.SHOT || '/tmp/br-smoke.png' });
const led = await p.evaluate(() => save.ads.count); if (led === 4) pass('ledger counted 4 rewarded ads'); else fail('ledger ' + led);
await b.close();
if (errs.length) fail('page errors: ' + errs.join(' | ')); else pass('no page errors');
process.exitCode = fails ? 1 : 0; console.log(fails ? `${fails} failed` : 'smoke passed');
