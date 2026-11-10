// Checks the over-the-shoulder view: camera placement, aiming at the crosshair, and wall handling.
const { open } = require('./harness.cjs');
(async () => {
  const { browser, page, errors } = await open();
  const out = await page.evaluate(() => {
    const g = window.__hs, r = {}; g.input.noLock(); g.begin('herd', 'easy'); g.freezeT = 0; g.shopOpen = false; g.simulate(0.2);
    const p = g.player; for (const b of g.bots) b.update = () => {};
    const park = () => { for (const a of g.actors) if (a !== p && a !== window.__foe) a.pos.set(a.team === p.team ? -37 : 37, 0, 37); };
    const foe = g.actors.find(a => a.team !== p.team); window.__foe = foe;
    g.setShoulder(true);
    // open ground (the start strip, looking west): opponent 14 m in front of the camera, dead centre of the crosshair
    p.pos.set(12, 0, 33.2); p.yaw = Math.PI / 2; p.pitch = 0; p.vel.set(0, 0, 0);
    park(); g.simulate(0.1);
    const cam = g.camera.position;
    r.cameraBehind = +(cam.x - p.pos.x).toFixed(2); r.cameraRight = +(p.pos.z - cam.z).toFixed(2); r.bodyVisible = p.char.root.visible;
    const T = window.THREE, dir = new T.Vector3();
    const place = () => { g.camera.getWorldDirection(dir); foe.pos.set(cam.x + dir.x * 14, 0, cam.z + dir.z * 14); foe.vel.set(0, 0, 0); foe.alive = true; };
    p.pitch = Math.atan2(0.8 - 1.84, 14); g.simulate(0.05); place(); g.simulate(0.05);
    foe.hp = 100; let fired = 0;
    for (let i = 0; i < 4; i++) { const a0 = p.ammo; g.input.fire(true); g.simulate(0.03); g.input.fire(false); fired += a0 - p.ammo; for (let k = 0; k < 8; k++) { place(); park(); g.simulate(0.05); } }
    r.shotsFired = fired; r.cleanLeft = Math.round(foe.hp); r.aimOffsetYawDeg = +((p.aim.yaw - p.yaw) * 57.3).toFixed(2);
    // back against a wall: camera must not go through it
    p.pos.set(-20, 0, 5.6); p.yaw = Math.PI; p.pitch = 0; g.simulate(0.1);
    r.wallBehind = { camZ: +g.camera.position.z.toFixed(2), wallFaceZ: 5, bodyVisible: p.char.root.visible };
    g.setShoulder(false); g.simulate(0.1);
    r.backToEyes = { camAtEye: Math.abs(g.camera.position.x - p.pos.x) < 0.01, bodyVisible: p.char.root.visible, aim: p.aim };
    g.setShoulder(true); p.pos.set(-26, 0, 2.5); p.yaw = 0.25; p.pitch = -0.05; foe.pos.set(37, 0, 37); g.simulate(0.2); g.paused = true;
    return r;
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'shots/shoulder.png' });
  console.log(JSON.stringify(out, null, 1));
  console.log('errors:', errors.filter(e => !e.includes('ERR_FAILED')).slice(0, 6));
  await browser.close();
})();
