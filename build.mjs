// Bundles everything in src/ into single web pages inside dist/.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, readdirSync, existsSync } from 'node:fs';

// All sounds are glued into ONE file (faster to load, far fewer files to publish); the game gets a table of
// where each sound starts and how long it is.
const sounds = readdirSync('assets/audio').filter((f) => f.endsWith('.mp3')).sort();
const table = {}, chunks = [];
let offset = 0;
for (const f of sounds) { const b = readFileSync(`assets/audio/${f}`); table[f.slice(0, -4)] = [offset, b.length]; offset += b.length; chunks.push(b); }
writeFileSync('src/audio-pack.js', `// made by build.mjs, do not edit\nexport const AUDIO_PACK = ${JSON.stringify(table)};\n`);

const out = await build({ entryPoints: ['src/main.js'], bundle: true, format: 'iife', minify: process.argv.includes('--min'), write: false, target: 'es2020' });
const js = out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const page = readFileSync('src/page.html', 'utf8').replace('/*__BUNDLE__*/', () => js);
mkdirSync('dist', { recursive: true });
// pictures and sounds travel next to the page
rmSync('dist/assets', { recursive: true, force: true });
cpSync('assets/tex', 'dist/assets/tex', { recursive: true });
cpSync('assets/ui', 'dist/assets/ui', { recursive: true });
if (existsSync('assets/chars')) cpSync('assets/chars', 'dist/assets/chars', { recursive: true });
writeFileSync('dist/assets/audio.mp3', Buffer.concat(chunks));
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
