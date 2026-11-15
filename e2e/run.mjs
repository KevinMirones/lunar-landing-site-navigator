// `npm run e2e`: starts the real server on a free port and runs every browser
// flow in this folder against the built app (docs/specs/S15-pruebas-de-navegador.md).
//
//   npm run e2e                 all flows
//   npm run e2e -- s04 paneles  only the flows whose name contains one of these words
//
//   E2E_URL=https://…           test an address that is already running instead
//   E2E_HIRES=1                 also start a server with the fine LOLA grids (for s06)
//   E2E_CHANNEL=chrome          browser to drive (default: msedge on Windows, chrome elsewhere)
//   E2E_ALLOW_NO_DEM=1          pass, with a warning, when the LOLA grid is missing (CI without data)
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const HERE = fileURLToPath(new URL('.', import.meta.url));
const filters = process.argv.slice(2);
const flows = readdirSync(HERE)
  .filter((f) => f.endsWith('.mjs') && f !== 'lib.mjs' && f !== 'run.mjs')
  .filter((f) => !filters.length || filters.some((w) => f.includes(w)))
  .sort();

const freePort = () =>
  new Promise((resolve) => {
    const s = createServer().listen(0, () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });

async function startServer(env) {
  const port = await freePort();
  const child = spawn(process.execPath, ['server/index.js'], { cwd: ROOT, env: { ...process.env, ...env, PORT: String(port) }, stdio: ['ignore', 'ignore', 'inherit'] });
  const url = `http://localhost:${port}/`;
  for (let i = 0; i < 150; i++) {
    try {
      const health = await (await fetch(url + 'api/health')).json();
      return { child, url, health };
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  child.kill();
  throw new Error('The server did not start');
}

const servers = [];
let base = process.env.E2E_URL;
let fine = null;
let code = 0;
try {
  if (!base) {
    if (!existsSync(`${ROOT}dist/index.html`)) {
      console.error('No compiled app in dist/. Run: npm run build');
      process.exit(1);
    }
    // Without the fine grids, so results are the same on every machine: catalogue
    // sites answer with their precomputed horizons either way.
    const coarse = await startServer({ LUMINA_HIRES: '0' });
    servers.push(coarse.child);
    base = coarse.url;
    if (!coarse.health.dem) {
      const msg = 'The LOLA grid is missing (npm run fetch-data): the browser checks need real terrain.';
      if (process.env.E2E_ALLOW_NO_DEM === '1') {
        console.warn(`WARNING: ${msg} Skipped.`);
        process.exit(0);
      }
      console.error(msg);
      process.exit(1);
    }
    if (process.env.E2E_HIRES === '1') {
      const hires = await startServer({ LUMINA_HIRES: '1' });
      servers.push(hires.child);
      fine = hires.url;
    }
  }

  const failed = [];
  const t0 = Date.now();
  for (const flow of flows) {
    const started = Date.now();
    console.log(`\n=== ${flow}`);
    const status = await new Promise((resolve) => {
      const child = spawn(process.execPath, [flow], { cwd: HERE, env: { ...process.env, E2E_URL: base, ...(fine ? { E2E_URL_FINE: fine } : {}) }, stdio: 'inherit' });
      child.on('exit', (c) => resolve(c ?? 1));
    });
    console.log(`--- ${flow}: ${status === 0 ? 'ok' : 'FAILED'} in ${((Date.now() - started) / 1000).toFixed(1)} s`);
    if (status !== 0) failed.push(flow);
  }
  console.log(`\n${flows.length - failed.length} of ${flows.length} flows passed in ${((Date.now() - t0) / 1000).toFixed(0)} s${failed.length ? `. Failed: ${failed.join(', ')}` : ''}`);
  code = failed.length ? 1 : 0;
} finally {
  for (const s of servers) s.kill();
}
process.exit(code);
