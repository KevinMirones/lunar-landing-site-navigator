// Runs the test suite with the timing bounds switched on. They hold on the
// development laptop, not on every machine, so `npm test` and CI only check
// results (see docs/specs/S03-ci-y-despliegue.md). Extra arguments go to vitest.
import { spawnSync } from 'node:child_process';

const run = spawnSync('npx', ['vitest', 'run', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, LUMINA_PERF: '1' },
});
process.exit(run.status ?? 1);
