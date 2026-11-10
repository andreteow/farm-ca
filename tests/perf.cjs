const { open } = require('./harness.cjs');
(async () => {
  const { browser, page, errors } = await open();
  const r = await page.evaluate(async () => {
    const g = window.__hs; g.input.noLock(); g.begin('herd', 'easy'); g.freezeT = 0; g.shopOpen = false;
    await new Promise(r => setTimeout(r, 1500));
    g.simulate(3);
    g.renderer.info.autoReset = false; g.renderer.info.reset();
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const out = { callsPer2Frames: g.renderer.info.render.calls, trisPer2Frames: g.renderer.info.render.triangles, rigged: g.actors.filter(a => a.char.rig).length };
    g.renderer.info.autoReset = true;
    return out;
  });
  console.log(JSON.stringify(r), 'errors:', errors.filter(e => !e.includes('ERR_FAILED')).slice(0, 4));
  await browser.close();
})();
