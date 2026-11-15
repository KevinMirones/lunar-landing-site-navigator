// Shared helpers for the browser checks (docs/specs/S15-pruebas-de-navegador.md).
// A flow is a plain module: it opens the app with `open`, records checks with
// `check` and ends with `done`, which prints a summary and sets the exit code.
// Run them all with `npm run e2e`; it starts a server and sets E2E_URL.
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

export const BASE = (process.env.E2E_URL || 'http://localhost:8787/').replace(/\/?$/, '/');
/** Set when `npm run e2e` also started a server that holds the fine LOLA grids (E2E_HIRES=1). */
export const BASE_FINE = process.env.E2E_URL_FINE ? process.env.E2E_URL_FINE.replace(/\/?$/, '/') : null;
/** Timing bounds hold on the development laptop only, as in `npm run test:perf`. */
export const PERF = process.env.LUMINA_PERF === '1';

/** The four default scenarios on the date the pitch figures use, so no flow depends on today. */
export const DEFAULT_LINK =
  '?s=ridge@2026-11-14T00:00~30~2;shackleton-floor@2026-11-14T00:00~30~2;malapert@2026-11-14T00:00~30~2;im2@2026-11-14T00:00~30~2&a=0&l=es';

const CHANNEL = process.env.E2E_CHANNEL || (process.platform === 'win32' ? 'msedge' : 'chrome');
// Software WebGL by default: it works on every machine, CI included. Forcing the GPU
// (E2E_GPU=1) is faster where it works, but on some laptops it leaves no WebGL2 at all.
const GPU_ARGS =
  process.env.E2E_GPU === '1' ? ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

/**
 * Opens `path` (relative to BASE, or a full address) in a fresh browser context,
 * so local storage is empty and every panel starts open. Console errors and
 * uncaught exceptions are collected in `errors`; `done` counts them as failures.
 */
export async function open(path = DEFAULT_LINK, size = { width: 1440, height: 900 }) {
  const browser = await chromium.launch({ channel: CHANNEL, args: GPU_ARGS });
  const ctx = await browser.newContext({ viewport: size, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage();
  const errors = watch(page);
  await goto(page, path);
  return { browser, ctx, page, errors };
}

/** Collects the page's console errors and uncaught exceptions. */
export function watch(page, errors = []) {
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 300)));
  return errors;
}

/** Navigates and waits until the active scenario has its terrain horizon and figures. */
export async function goto(page, path) {
  await page.goto(/^https?:/.test(path) ? path : BASE + path, { waitUntil: 'networkidle' });
  await ready(page);
}

/** Waits until nothing is computing: the panorama is drawn and every scenario row has figures. */
export async function ready(page, timeout = 30000) {
  await page.waitForFunction(
    () => {
      if (document.querySelector('.panorama.loading')) return false;
      const rows = [...document.querySelectorAll('table.scenarios tbody tr')];
      return rows.length > 0 && rows.every((r) => /\d+%/.test(r.textContent || ''));
    },
    null,
    { timeout },
  );
  await page.waitForTimeout(250); // let the last state update reach the screen
}

/** Text of the first element matching `selector`, with whitespace collapsed. */
export async function text(page, selector) {
  return ((await page.locator(selector).first().innerText()) || '').replace(/\s+/g, ' ').trim();
}

let failed = 0;
export function check(name, cond, detail = '') {
  if (!cond) failed++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  [' + detail + ']' : ''}`);
}

/** A check that only makes sense where the drawing works, for example without WebGL2 on a CI machine. */
export function skip(name, why) {
  console.log(`SKIP  ${name}  [${why}]`);
}

/** Screenshot for debugging, under e2e/shots/ (ignored by git). */
export async function shot(target, name) {
  mkdirSync(new URL('./shots/', import.meta.url), { recursive: true });
  await target.screenshot({ path: new URL(`./shots/${name}.png`, import.meta.url).pathname.replace(/^\/(\w:)/, '$1') });
}

export function done(errors) {
  console.log(errors.length ? 'console errors: ' + JSON.stringify(errors.slice(0, 5)) : 'no console errors');
  console.log(failed || errors.length ? `${failed} CHECK(S) FAILED` : 'ALL CHECKS PASSED');
  process.exit(failed || errors.length ? 1 : 0);
}
