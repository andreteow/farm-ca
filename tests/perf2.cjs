const { open } = require('./harness.cjs');
(async () => {
  const { browser, page, errors } = await open();
  const r = await page.evaluate(async () => {
    const g = window.__hs, out = {}; g.input.noLock(); g.begin('herd', 'easy'); g.freezeT = 0; g.simulate(0.2);
    const p = g.player;
    p.pos.set(-9, 0, 32); p.yaw = 0; p.vel.set(0, 0, 0); g.input.keys.KeyW = true; g.input.keys.Space = true; g.simulate(0.42); g.input.keys.KeyW = false; g.input.keys.Space = false; g.simulate(0.6);
    out.onBale = { y: +p.pos.y.toFixed(2), z: +p.pos.z.toFixed(2) };
    const rows = [];
    g.scene.traverse(o => { if (o.isMesh) { const gm = o.geometry; let t = (gm.index ? gm.index.count : gm.attributes.position.count) / 3; if (o.isInstancedMesh) t *= o.count; if (t > 4000) rows.push([Math.round(t), o.isInstancedMesh ? 'instanced' : (o.material.vertexColors ? 'baked-plain' : (o.material.map ? 'textured' : o.material.type))]); } });
    out.big = rows.sort((a, b) => b[0] - a[0]).slice(0, 10);
    return out;
  });
  console.log(JSON.stringify(r));
  console.log('errors:', errors.filter(e => !e.includes('ERR_FAILED')).slice(0, 6));
  await browser.close();
})();
