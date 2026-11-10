const { open } = require('./harness.cjs');
(async () => {
  const { browser, page, errors } = await open();
  // real click on Play: does mouse capture work, does the match start?
  await page.click('#play');
  await page.waitForTimeout(700);
  const lockState = await page.evaluate(() => ({ locked: !!document.pointerLockElement, state: window.__hs.state, hud: !document.getElementById('hud').hidden, menu: document.getElementById('menu').hidden }));
  console.log('after Play click:', JSON.stringify(lockState));
  const r = await page.evaluate(() => {
    const g = window.__hs, p = g.player, out = {};
    g.input.noLock();
    g.freezeT = 0; g.simulate(0.1);
    // 1. walking forward
    const z0 = p.pos.z; g.input.keys.KeyW = true; g.simulate(1); g.input.keys.KeyW = false; g.simulate(0.3);
    out.walked = +(z0 - p.pos.z).toFixed(2);
    // 2. walls stop you: run north into the fence/wall for 6 seconds, then check we are not inside anything
    p.pos.set(-20, 0, 8); p.yaw = 0; g.input.keys.KeyW = true; g.simulate(3); g.input.keys.KeyW = false;
    out.stoppedByWall = +p.pos.z.toFixed(2);
    // 3. jumping onto a hay bale
    p.pos.set(-9, 0, 32); p.yaw = Math.PI; p.vel.set(0, 0, 0); g.input.keys.KeyW = true; g.input.keys.Space = true; g.simulate(0.9); g.input.keys.KeyW = false; g.input.keys.Space = false; g.simulate(0.4);
    out.onBaleHeight = +p.pos.y.toFixed(2);
    // 4. launching at an opponent standing 12 m in front
    for (const b of g.bots) { b.a.pos.set(30, 0, 30); }
    const foe = g.actors.find(a => a.team !== p.team);
    p.pos.set(0, 0, 20); p.yaw = 0; p.pitch = -0.04; p.vel.set(0, 0, 0); g.simulate(0.2);
    foe.pos.set(0, 0, 8); foe.vel.set(0, 0, 0);
    const hp0 = foe.hp, ammo0 = p.ammo;
    for (let i = 0; i < 4; i++) { g.input.fire(true); g.simulate(0.05); g.input.fire(false); foe.pos.set(0, 0, 8); g.simulate(0.3); foe.pos.set(0, 0, 8); }
    out.shotsUsed = ammo0 - p.ammo; out.foeCleanLeft = Math.round(foe.hp); out.foeAlive = foe.alive;
    // 5. swap launcher keeps separate tanks
    const before = p.ammo; p.setGadget('tomato'); const t = p.ammo; p.setGadget('squirter'); out.swapKeepsTank = p.ammo === before && t === 20;
    // 6. running makes shots scatter
    out.spreadStill = +p.spread().toFixed(4); p.vel.set(6, 0, 0); out.spreadRunning = +p.spread().toFixed(4); p.vel.set(0, 0, 0);
    out.calls = g.renderer.info.render.calls; out.tris = g.renderer.info.render.triangles;
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  console.log('errors:', errors.filter(e => !e.includes('ERR_FAILED')).slice(0, 6));
  await browser.close();
})();
