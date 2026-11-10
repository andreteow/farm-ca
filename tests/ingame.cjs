const { open } = require('./harness.cjs');
(async () => {
  const { browser, page, errors } = await open();
  await page.evaluate(() => { const g = window.__hs; g.input.noLock(); g.begin('hands', 'easy'); g.freezeT = 9999; g.shopOpen = false; });
  await page.waitForTimeout(500);
  await page.evaluate(() => { const g = window.__hs, p = g.player; p.pos.set(0, 0, -28.6); p.yaw = Math.PI; p.pitch = -0.05; const foes = g.actors.filter(a => a.team !== p.team); foes.forEach((f, i) => { f.pos.set(-3 + i * 1.5, 0, -24.4); f.yaw = 0; f.crouched = i === 4; }); foes[1].alive = false; foes[1].outT = 0.5; });
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'shots/chars-ingame.png' });
  console.log('errors:', errors.filter(e => !e.includes('ERR_FAILED')).slice(0, 6));
  await browser.close();
})();
