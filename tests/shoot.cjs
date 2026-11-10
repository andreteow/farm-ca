const { open } = require('./harness.cjs');
(async () => {
  const { browser, page, errors } = await open();
  await page.evaluate(() => {
    const g = window.__hs; g.input.noLock(); g.begin('herd', 'easy'); g.freezeT = 0; g.simulate(0.2);
    const p = g.player; for (const b of g.bots) b.a.pos.set(36, 0, 36);
    const foes = g.actors.filter(a => a.team !== p.team);
    p.pos.set(-26, 0, 0.5); p.yaw = 0; p.pitch = 0.0; p.vel.set(0, 0, 0); p.setGadget('tomato');
    g.paused = true; // freeze the world so the picture is stable
    foes[0].pos.set(-26.6, 0, -4.2); foes[0].yaw = Math.PI; foes[1].pos.set(-24.4, 0, -9); foes[1].yaw = Math.PI;
    window.__burst = () => { g.paused = false; for (let i = 0; i < 7; i++) { g.input.fire(true); g.simulate(0.14); foes[0].pos.set(-26.6, 0, -4.2); foes[1].pos.set(-24.4, 0, -9); for (const b of g.bots) if (b.a !== foes[0] && b.a !== foes[1]) b.a.pos.set(36, 0, 36); } g.input.fire(false); p.pitch = 0; g.simulate(0.02); g.paused = true; return { hp0: foes[0].hp, hp1: foes[1].hp, shots: g.combat.shots.length }; };
  });
  console.log(JSON.stringify(await page.evaluate(() => window.__burst())));
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'shots/shoot.png' });
  console.log('errors:', errors.filter(e => !e.includes('ERR_FAILED')).slice(0, 6));
  await browser.close();
})();
