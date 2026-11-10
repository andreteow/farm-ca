// Opens the built game in a headless browser with the 3D library served from node_modules.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

exports.open = async function open(opts = {}) {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: opts.width || 1280, height: opts.height || 720 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message + '\n' + (e.stack || '')));
  const three = fs.readFileSync(path.join(__dirname, '../node_modules/three/build/three.min.js'), 'utf8');
  await page.route('**/three.min.js', (r) => r.fulfill({ contentType: 'application/javascript', body: three }));
  await page.route('**fonts.googleapis.com/**', (r) => r.abort());
  await page.goto('file://' + path.join(__dirname, '../dist/index.html'));
  await page.waitForTimeout(opts.wait || 1500);
  return { browser, page, errors };
};
