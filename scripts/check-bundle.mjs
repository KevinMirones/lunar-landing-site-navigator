// Budget of S14: the JavaScript of the initial load, compressed, must stay under
// 350 KB. Run after `npm run build`; CI does. Code loaded on demand does not count.
import { readFileSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const LIMIT_KB = 350;
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const initial = [...html.matchAll(/<script[^>]+src="\/?([^"]+\.js)"/g)].map((m) => m[1]);
const kb = (file) => gzipSync(readFileSync(new URL(`../dist/${file}`, import.meta.url))).length / 1024;
const total = initial.reduce((sum, f) => sum + kb(f), 0);
const all = readdirSync(new URL('../dist/assets/', import.meta.url)).filter((f) => f.endsWith('.js'));
console.log(`Initial JavaScript: ${total.toFixed(0)} KB compressed (limit ${LIMIT_KB} KB), in ${initial.length} file(s); ${all.length} JavaScript file(s) in all.`);
if (total > LIMIT_KB) {
  console.error('Over budget.');
  process.exit(1);
}
