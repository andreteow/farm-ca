// Photographs a set of viewpoints on a map: node tests/tour.cjs <map> [stop names...]
const { open } = require('./harness.cjs');
const map = process.argv[2] || 'farm';
const STOPS = {
  farm: { spawn: [0, 33, 0, 0], barnOut: [-26, 1.5, 0, 0.05], barnIn: [-31.5, -8, -2.2, -0.05], garden: [15, -3, -2.3, -0.08], yard: [0, -7.5, 0.25, 0], corn: [0, 16.5, 0, 0], culvert: [32.5, 9, 0, 0] },
  mill: { spawn: [0, 33, 0, 0], orchard: [-27, 22, 0.15, 0.02], westBridge: [-27, 11.5, 0, 0], millYard: [-23.5, 0.2, 0.45, 0.06], millIn: [-34, -9.6, -2.1, -0.02], covered: [0, 10.5, 0, 0], barrelYard: [1.5, -1.5, 0.2, 0], market: [24, -6, -0.15, 0.02], marketN: [28, -22.6, 2.9, 0.0], wade: [11, 9, 0, 0], creek: [-12, 9.5, -1.35, -0.08] },
};
(async () => {
  const { browser, page, errors } = await open();
  await page.screenshot({ path: `shots/${map}-menu.png` });
  await page.evaluate((map) => { const g = window.__hs; g.input.noLock(); g.begin('herd', 'easy', map); g.freezeT = 9999; g.shopOpen = false; }, map);
  await page.waitForTimeout(900);
  const only = process.argv.slice(3);
  for (const [name, [x, z, yaw, pitch]] of Object.entries(STOPS[map])) {
    if (only.length && !only.includes(name)) continue;
    await page.evaluate(([x, z, yaw, pitch]) => { const g = window.__hs, p = g.player; p.pos.set(x, 0, z); p.yaw = yaw; p.pitch = pitch; }, [x, z, yaw, pitch]);
    await page.waitForTimeout(450);
    await page.screenshot({ path: `shots/${map}-${name}.png` });
  }
  console.log('errors:', errors.filter(e => !e.includes('ERR_FAILED')).slice(0, 6));
  await browser.close();
})();
