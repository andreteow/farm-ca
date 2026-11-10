// Checks the three throwables from the player's side and photographs them.
const { open } = require('./harness.cjs');
(async () => {
  const { browser, page, errors } = await open();
  const out = {};
  await page.evaluate(() => { const g = window.__hs; g.input.noLock(); g.begin('herd', 'easy'); g.player.coins = 9000; g.freezeT = 60; });
  await page.mouse.click(640, 300);
  await page.waitForTimeout(500);
  for (const k of ['Digit6', 'Digit7', 'Digit8', 'Digit2']) await page.keyboard.press(k);
  await page.waitForTimeout(400);
  out.bought = await page.evaluate(() => { const p = window.__hs.player; return { throws: p.throws, primary: p.primary, coins: p.coins }; });
  await page.screenshot({ path: 'shots/m3-shop.png' });
  await page.evaluate(() => {
    const g = window.__hs, p = g.player; g.freezeT = 0; g.simulate(0.2);
    for (const a of g.actors) if (a !== p) a.pos.set(a.team === p.team ? -37 : 37, 0, 37);
    p.pos.set(0, 0, -8); p.yaw = 0; p.pitch = 0.1; p.vel.set(0, 0, 0);
    // three opponents stand in the yard looking at the player
    const foes = g.actors.filter(a => a.team !== p.team).slice(0, 3);
    foes.forEach((f, i) => { f.pos.set(-4 + i * 4, 0, -24); f.yaw = Math.PI; });
    window.__foes = foes; window.__pin = () => { for (const a of g.actors) if (a !== p && !foes.includes(a)) a.pos.set(a.team === p.team ? -37 : 37, 0, 37); foes.forEach((f, i) => { f.pos.set(-4 + i * 4, 0, -24); f.vel.set(0, 0, 0); }); };
    for (const b of g.bots) { b.update = () => {}; }  // freeze the computer players for this check
  });
  // rooster
  await page.keyboard.press('Digit4');
  out.rooster = await page.evaluate(() => { const g = window.__hs; let t = 0; while (t < 2.2) { g.simulate(0.1); window.__pin(); t += 0.1; } return { left: g.player.throws.rooster, foesDazed: window.__foes.map(f => +f.dazeT.toFixed(2)), playerDazed: +g.player.dazeT.toFixed(2) }; });
  // mud
  await page.keyboard.press('Digit5');
  out.mud = await page.evaluate(() => { const g = window.__hs; let t = 0; while (t < 1.8) { g.simulate(0.1); window.__pin(); t += 0.1; } const pd = g.throwables.puddles[0]; return { puddles: g.throwables.puddles.length, at: pd && [+pd.x.toFixed(1), +pd.z.toFixed(1)], slowThere: pd && g.throwables.slowAt(pd.x, pd.z), slowElsewhere: g.throwables.slowAt(30, 30) }; });
  // flour
  await page.keyboard.press('Digit3');
  out.flour = await page.evaluate(() => { const g = window.__hs, p = g.player; let t = 0; while (t < 3.2) { g.simulate(0.1); window.__pin(); t += 0.1; } const c = g.throwables.clouds[0]; const f = window.__foes[1];
    return { clouds: g.throwables.clouds.length, at: c && [+c.x.toFixed(1), +c.z.toFixed(1)], radius: c && +c.r.toFixed(1), blocksSight: c && g.throwables.sightBlocked(p.pos.x, 1.6, p.pos.z, c.x + (c.x - p.pos.x), 1.4, c.z + (c.z - p.pos.z)), clearElsewhere: !g.throwables.sightBlocked(p.pos.x, 1.6, p.pos.z, 30, 1.4, 30) }; });
  await page.evaluate(() => { window.__hs.paused = true; });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'shots/m3-flour.png' });
  out.inside = await page.evaluate(() => { const g = window.__hs, c = g.throwables.clouds[0]; g.paused = false; g.player.pos.set(c.x, 0, c.z); g.simulate(0.1); g.paused = true; return { veil: +g.veil.toFixed(2) }; });
  console.log(JSON.stringify(out, null, 1));
  console.log('errors:', errors.filter(e => !e.includes('ERR_FAILED')).slice(0, 6));
  await browser.close();
})();
