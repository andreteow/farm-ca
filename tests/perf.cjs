const { open } = require('./harness.cjs');
(async () => {
  const { browser, page, errors } = await open();
  const r = await page.evaluate(async () => {
    const g = window.__hs, p = () => g.player; g.input.noLock(); g.begin('herd', 'easy'); g.freezeT = 0; g.simulate(0.2);
    const out = {};
    // jump onto the hay bale just north of the start line
    p().pos.set(-9, 0, 32); p().yaw = 0; p().vel.set(0, 0, 0); g.input.keys.KeyW = true; g.input.keys.Space = true; g.simulate(0.75); g.input.keys.KeyW = false; g.input.keys.Space = false; g.simulate(0.5);
    out.onBaleHeight = +p().pos.y.toFixed(2);
    g.renderer.info.autoReset = false; g.renderer.info.reset();
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    out.calls = g.renderer.info.render.calls; out.tris = g.renderer.info.render.triangles;
    g.renderer.info.autoReset = true;
    let meshes = 0; g.scene.traverse(o => { if (o.isMesh) meshes++; }); out.meshes = meshes;
    return out;
  });
  console.log(JSON.stringify(r));
  await browser.close();
})();
