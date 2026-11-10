const { open } = require('./harness.cjs');
const team = process.argv[2] || 'herd';
const stops = {
  spawn: [0, 33, 0, 0], mates: [0, 29.5, Math.PI, -0.05], barnOut: [-26, 1.5, 0, 0.05], barnIn: [-31.5, -8, -2.2, -0.05], garden: [15, -3, -2.3, -0.08],
  yard: [0, -7.5, 0.25, 0], corn: [0, 16.5, 0, 0], hands: [0, -24.5, 0, -0.03], culvert: [32.5, 9, 0, 0], coop: [-16, 24, 0.9, 0.02],
};
(async () => {
  const { browser, page, errors } = await open();
  await page.evaluate((team) => { const g = window.__hs; g.input.noLock(); g.begin(team, 'easy'); g.freezeT = 9999; }, team);
  await page.waitForTimeout(500);
  const only = process.argv.slice(3);
  for (const [name, [x, z, yaw, pitch]] of Object.entries(stops)) {
    if (only.length && !only.includes(name)) continue;
    await page.evaluate(([x, z, yaw, pitch]) => { const g = window.__hs, p = g.player; p.pos.set(x, 0, z); p.yaw = yaw; p.pitch = pitch; }, [x, z, yaw, pitch]);
    await page.waitForTimeout(450);
    await page.screenshot({ path: `shots/tour-${name}.png` });
  }
  console.log('errors:', errors.filter(e => !e.includes('ERR_FAILED')).slice(0, 6));
  await browser.close();
})();
