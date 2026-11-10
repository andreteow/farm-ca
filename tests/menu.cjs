// Takes a picture of the menu in each game mode, and checks the words change with the mode.
const { open } = require('./harness.cjs');
(async () => {
  const { browser, page, errors } = await open({ height: +(process.argv[2] || 720) });
  for (const mode of ['pumpkin', 'lts']) {
    await page.evaluate((m) => document.getElementById('mode-' + m).click(), mode);
    await page.waitForTimeout(300);
    const info = await page.evaluate(() => ({ herd: document.getElementById('job-herd').textContent, how: document.getElementById('how-0').textContent, useKey: getComputedStyle(document.getElementById('key-use')).display, panel: Math.round(document.querySelector('#menu .panel').getBoundingClientRect().height), mode: window.__hs.mode }));
    console.log(mode, JSON.stringify(info));
    await page.screenshot({ path: `shots/menu-${mode}.png` });
  }
  console.log('errors:', errors.slice(0, 5));
  await browser.close();
})();
