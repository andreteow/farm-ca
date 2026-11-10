const { open } = require('./harness.cjs');
(async () => {
  const { browser, page, errors } = await open({ width: 400, height: 780 });
  await page.screenshot({ path: 'shots/phone-menu.png' });
  const o = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, w: innerWidth }));
  console.log(JSON.stringify(o), 'errors:', errors.filter(e => !e.includes('ERR_FAILED')).slice(0, 4));
  await browser.close();
})();
