// Renders a straight-down picture of the map (for artists) and a few "current look" shots.
const { open } = require('./harness.cjs');
const fs = require('fs');
(async () => {
  const { browser, page } = await open({ width: 1280, height: 720 });
  const png = await page.evaluate(() => {
    const g = window.__hs, T = window.THREE, r = g.renderer;
    const cam = new T.OrthographicCamera(-43, 43, 43, -43, 1, 300);
    cam.position.set(0, 120, 0); cam.up.set(0, 0, -1); cam.lookAt(0, 0, 0);
    const fog = g.scene.fog; g.scene.fog = null;
    r.setPixelRatio(1); r.setSize(1536, 1536, false); r.clear(); r.render(g.scene, cam);
    const url = r.domElement.toDataURL('image/png');
    g.scene.fog = fog; window.dispatchEvent(new Event('resize'));
    return url;
  });
  fs.writeFileSync('art/reference/map-topdown.png', Buffer.from(png.split(',')[1], 'base64'));
  await page.evaluate(() => { const g = window.__hs; g.input.noLock(); g.begin('herd', 'easy'); g.freezeT = 9999; });
  await page.waitForTimeout(400);
  await page.evaluate(() => { document.getElementById('hud').hidden = true; });
  for (const [name, x, z, yaw] of [['current-look-yard', 0, -7.5, 0.25], ['current-look-barn', -26, 1.5, 0], ['current-look-team', 0, 29.5, Math.PI]]) {
    await page.evaluate(([x, z, yaw]) => { const p = window.__hs.player; p.pos.set(x, 0, z); p.yaw = yaw; p.pitch = 0; }, [x, z, yaw]);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `art/reference/${name}.jpg`, type: 'jpeg', quality: 88 });
  }
  await browser.close();
})();
