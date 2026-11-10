const { open } = require('./harness.cjs');
const team = process.argv[2] || 'herd', diff = process.argv[3] || 'easy', rounds = +(process.argv[4] || 6);
(async () => {
  const { browser, page, errors } = await open();
  await page.evaluate(([team, diff]) => { const g = window.__hs; g.input.noLock(); g.begin(team, diff); }, [team, diff]);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `shots/02-start-${team}.png` });
  const log = await page.evaluate((rounds) => {
    const g = window.__hs, out = [];
    let guard = 0;
    while (g.round <= rounds && g.state !== 'matchEnd' && guard++ < 4000) {
      const r = g.round;
      let t = 0, stuck = 0; const lastPos = new Map(), still = new Map();
      while (g.round === r && g.state !== 'roundEnd' && g.state !== 'matchEnd' && t < 140) {
        g.simulate(0.5); t += 0.5;
        for (const b of g.bots) {
          if (!b.a.alive || g.state !== 'live') continue;
          const k = b.a.name, p = lastPos.get(k);
          if (p && Math.hypot(p.x - b.a.pos.x, p.z - b.a.pos.z) < 0.05 && (b.state === 'travel' || b.state === 'seek' || b.state === 'hunt')) { still.set(k, (still.get(k) || 0) + 0.5); if (still.get(k) === 4) stuck++; } else still.set(k, 0);
          lastPos.set(k, { x: b.a.pos.x, z: b.a.pos.z });
        }
      }
      out.push({ round: r, secs: Math.round(g.constructor ? 100 - g.roundT : 0), score: { ...g.score }, herdAlive: g.actors.filter(a => a.team === 'herd' && a.alive).length, handsAlive: g.actors.filter(a => a.team === 'hands' && a.alive).length, stuck, playerAlive: g.player.alive });
      while (g.state === 'roundEnd') g.simulate(0.5);
    }
    return out;
  }, rounds);
  for (const l of log) console.log(JSON.stringify(l));
  console.log('errors:', errors.filter(e => !e.includes('ERR_FAILED')).slice(0, 6));
  await browser.close();
})();
