const { open } = require('./harness.cjs');
(async () => {
  const { browser, page, errors } = await open({ width: 1600, height: 620 });
  await page.evaluate(() => { document.getElementById('menu').hidden = true; window.__hs.lineup(); });
  await page.waitForTimeout(1800);
  await page.evaluate(() => window.__hs.lineupPose(0, 0, false, 0.5));
  await page.screenshot({ path: 'shots/lineup-front.png' });
  await page.evaluate(() => { window.__hs.camFixed = { pos: [-3.2, 1.3, 22.6], look: [-3.2, 0.95, 20] }; });
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'shots/lineup-herd.png' });
  await page.evaluate(() => { window.__hs.lineupPose(5, 0.15, false, -0.5); window.__hs.camFixed = { pos: [2.9, 1.3, 22.6], look: [2.9, 0.95, 20] }; });
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'shots/lineup-hands.png' });
  console.log('errors:', errors.filter(e => !e.includes('ERR_FAILED')).slice(0, 6));
  await browser.close();
})();
