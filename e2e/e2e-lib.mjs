import { chromium } from 'playwright-core';
export async function open(url = process.env.E2E_URL || 'http://localhost:5173/', size = { width: 1440, height: 900 }) {
  const browser = await chromium.launch({ channel: 'msedge', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu'] });
  const ctx = await browser.newContext({ viewport: size, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 300)));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  return { browser, ctx, page, errors };
}
let failed = 0;
export function check(name, cond, detail = '') { if (!cond) failed++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  [' + detail + ']' : ''}`); }
export function done(errors) { console.log(errors.length ? 'console errors: ' + JSON.stringify(errors.slice(0, 5)) : 'no console errors'); console.log(failed ? `${failed} CHECK(S) FAILED` : 'ALL CHECKS PASSED'); process.exit(failed || errors.length ? 1 : 0); }
