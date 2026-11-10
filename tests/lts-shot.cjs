// Pictures of Last Team Standing: the opening banner with the shop, and the "nowhere left to hide" moment.
const { open } = require('./harness.cjs');
(async () => {
  const { browser, page, errors } = await open();
  await page.evaluate(() => { const g = window.__hs; g.input.noLock(); g.begin('herd', 'easy', 'mill', 'lts'); g.freezeT = 9999; });
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'shots/lts-start.png' });
  await page.evaluate(() => {
    const g = window.__hs; g.shopOpen = false; g.freezeT = 0.01;
    for (const b of g.bots) b.update = () => {};
    g.simulate(0.3); g.roundT = 30.2; g.simulate(0.6);
    const p = g.player; p.pos.set(0, 0, 14); p.yaw = 0; p.pitch = 0;
    g.actors.filter((a) => a.team !== p.team).forEach((f, i) => { f.pos.set(-8 + i * 4, 0, -4 - i * 3); });
    g.simulate(0.6);
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'shots/lts-reveal.png' });
  console.log('errors:', errors.filter((e) => !e.includes('ERR_FAILED')).slice(0, 6));
  await browser.close();
})();
