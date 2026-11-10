// Photographs the hand-built character (left) beside the sculpted model (right) in several poses.
const { open } = require('./harness.cjs');
const kind = process.argv[2] || 'pig';
(async () => {
  const { browser, page, errors } = await open({ width: 1100, height: 700 });
  await page.evaluate((kind) => { document.getElementById('menu').hidden = true; window.__hs.compare(kind); }, kind);
  await page.waitForTimeout(900);
  const shots = [['front', 0, 0, false, 0], ['threequarter', 0, 0, false, 0.7], ['side', 0, 0, false, 1.57], ['back', 0, 0, false, 3.14], ['run', 6, 0, false, 0.6], ['aimup', 0, 0.6, false, 0.9], ['crouch', 0, 0, true, 0.5]];
  for (const [name, speed, pitch, crouch, turn] of shots) {
    await page.evaluate(([speed, pitch, crouch, turn]) => window.__hs.comparePose(speed, pitch, crouch, turn), [speed, pitch, crouch, turn]);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `shots/cmp-${kind}-${name}.png` });
  }
  console.log('errors:', errors.filter(e => !e.includes('ERR_FAILED')).slice(0, 6));
  await browser.close();
})();
