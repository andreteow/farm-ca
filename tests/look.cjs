const { open } = require('./harness.cjs');
(async () => {
  const { browser, page, errors } = await open();
  await page.screenshot({ path: 'shots/m2-menu.png' });
  await page.evaluate(() => { const g = window.__hs; g.input.noLock(); g.begin('hands', 'easy'); g.player.coins = 5000; });
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'shots/m2-shop.png' });
  await page.evaluate(() => { const g = window.__hs; g.buy(g.player, 'pea'); g.buy(g.player, 'overalls'); g.shopOpen = false; g.freezeT = 9999; });
  for (const [name, x, z, yaw] of [['yard', 0, -7.5, 0.25], ['barn', -26, 1.5, 0], ['garden', 15, -3, -2.3], ['mid', 0, 20, 0]]) {
    await page.evaluate(([x, z, yaw]) => { const p = window.__hs.player; p.pos.set(x, 0, z); p.yaw = yaw; p.pitch = 0; }, [x, z, yaw]);
    await page.waitForTimeout(450);
    await page.screenshot({ path: `shots/m2-${name}.png` });
  }
  console.log('errors:', errors.filter(e => !e.includes('ERR_FAILED')).slice(0, 6));
  await browser.close();
})();
