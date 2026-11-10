// Bundles everything in src/ into single web pages inside dist/.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const out = await build({ entryPoints: ['src/main.js'], bundle: true, format: 'iife', minify: process.argv.includes('--min'), write: false, target: 'es2020' });
const js = out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const page = readFileSync('src/page.html', 'utf8').replace('/*__BUNDLE__*/', () => js);
mkdirSync('dist', { recursive: true });
// the fragment used for the shareable preview page
writeFileSync('dist/harvest-standoff.html', page);
// a complete stand-alone page, ready for any web host
writeFileSync('dist/index.html', `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>html,body{margin:0}[hidden]{display:none!important}</style>
</head>
<body>
${page}
</body>
</html>
`);
console.log(`built: ${(page.length / 1024).toFixed(0)} KB`);
