const { open } = require('./harness.cjs');
(async () => {
  const { browser, page, errors } = await open();
  await page.screenshot({ path: 'shots/01-menu.png' });
  const info = await page.evaluate(() => {
    const g = window.__hs; if (!g) return { fail: 'no game object' };
    const nav = g.nav, W = g.world, N = nav.N;
    let rows = [];
    for (let j = 0; j < N; j++) { let s = ''; for (let i = 0; i < N; i++) s += nav.blocked[j * N + i] ? '#' : '.'; rows.push(s); }
    const mark = (x, z, ch) => { const i = Math.floor(x + 40), j = Math.floor(z + 40); rows[j] = rows[j].slice(0, i) + ch + rows[j].slice(i + 1); };
    const problems = [];
    const check = (name, p) => { if (nav.isBlocked(p.x, p.z)) problems.push(name + ' is inside something'); };
    for (const k in W.points) { check('point ' + k, W.points[k]); mark(W.points[k].x, W.points[k].z, k[0].toLowerCase()); }
    for (const k in W.holds) W.holds[k].forEach((h, i) => { check(`hold ${k}${i}`, h); mark(h.x, h.z, 'o'); });
    for (const t in W.spawns) W.spawns[t].forEach((s, i) => { check(`spawn ${t}${i}`, s); mark(s.x, s.z, 'S'); });
    const lens = {};
    for (const t of ['herd', 'hands']) for (const k of ['A', 'B']) {
      const s = W.spawns[t][0], p = nav.findPath(s.x, s.z, W.points[k].x, W.points[k].z);
      let d = 0; if (p) for (let i = 1; i < p.length; i++) d += Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z);
      lens[`${t}->${k}`] = p ? Math.round(d) + 'm' : 'NO PATH';
    }
    for (const site of ['A', 'B']) W.routes[site].forEach((r, ri) => {
      let prev = W.spawns.herd[0];
      for (const n of r) { const q = W.points[n]; if (!nav.findPath(prev.x, prev.z, q.x, q.z)) problems.push(`route ${site}${ri} broken at ${n}`); prev = q; }
    });
    return { map: rows.join('\n'), problems, lens, boxes: W.boxes.length };
  });
  console.log(info.map); console.log('problems:', info.problems); console.log('walk distances:', info.lens, 'boxes:', info.boxes);
  console.log('errors:', errors.slice(0, 8));
  await browser.close();
})();
