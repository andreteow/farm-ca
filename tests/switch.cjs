// Switches maps back and forth and checks nothing piles up in memory.
const { open } = require('./harness.cjs');
(async () => {
  const { browser, page, errors } = await open();
  const r = await page.evaluate(async () => {
    const g = window.__hs, out = [];
    const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    for (const m of ['mill', 'farm', 'mill', 'farm', 'mill', 'farm']) { g.loadMap(m); await frame(); out.push({ map: g.world.name, geometries: g.renderer.info.memory.geometries, textures: g.renderer.info.memory.textures, lights: g.scene.children.filter((c) => c.isLight).length, boxes: g.world.boxes.length }); }
    return out;
  });
  for (const x of r) console.log(JSON.stringify(x));
  await page.evaluate(() => document.getElementById('map-mill').click()); await page.waitForTimeout(1500);
  await page.screenshot({ path: 'shots/menu-mill.png', timeout: 60000 });
  console.log('picker:', await page.evaluate(() => ({ map: window.__hs.world.name, blurb: document.getElementById('map-blurb').textContent, checked: document.getElementById('map-mill').getAttribute('aria-checked') })));
  console.log('errors:', errors.filter(e => !e.includes('ERR_FAILED')).slice(0, 6));
  await browser.close();
})();
