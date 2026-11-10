const { open } = require('./harness.cjs');
(async () => {
  const { browser, page, errors } = await open();
  await page.evaluate(() => { const g = window.__hs; g.input.noLock(); g.begin('hands', 'medium'); g.simulate(4); const p = g.player; p.alive = false; p.hp = 0; p.outT = 2; });
  let n = 0;
  for (let i = 0; i < 40 && n < 6; i++) {
    const st = await page.evaluate(() => { const g = window.__hs; g.simulate(0.5); const v = g.viewActor; const b = g.bots.find(b => b.a === v); return { fight: !!(b && b.target), shots: g.combat.shots.length, t: Math.round(100 - g.roundT), state: g.state, name: v && v.name }; });
    if (st.fight || st.shots > 0) { await page.waitForTimeout(120); await page.screenshot({ path: `shots/fight-${n++}.png` }); console.log(JSON.stringify(st)); }
    if (st.state !== 'live') break;
  }
  console.log('errors:', errors.filter(e => !e.includes('ERR_FAILED')).slice(0, 6));
  await browser.close();
})();
