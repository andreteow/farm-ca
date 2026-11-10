// Opens the real public website (no local stand-ins) and checks the game starts on each map with everything loaded.
const { chromium } = require('playwright');
const url = process.argv[2] || 'https://harvest-standoff.vercel.app/';
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [], hosts = new Set();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  page.on('request', (r) => hosts.add(new URL(r.url()).host));
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(4000);
  for (const map of ['mill', 'farm']) {
    const r = await page.evaluate(async (map) => {
      const g = window.__hs; if (!g) return { fail: 'game did not start' };
      g.input.noLock(); g.begin('herd', 'easy', map); await new Promise((r) => setTimeout(r, 9000)); g.freezeT = 0; g.shopOpen = false; g.simulate(5);
      return { map: g.world.name, state: g.state, soundsLoaded: g.audio.loaded(), modelsLoaded: g.actors.filter((a) => a.char.rig).length };
    }, map);
    console.log(JSON.stringify(r));
  }
  console.log('hosts contacted:', [...hosts].join(', '), '| errors:', errors.slice(0, 5));
  await browser.close();
})();
