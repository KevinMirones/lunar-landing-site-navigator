// npm runs this after every install. On a development machine it does nothing.
// With LUMINA_DEPLOY=1 it downloads the data and compiles the web app: for hosts that
// install dependencies and start the server but run no build step, such as Hostinger's
// Express preset. Installing and this step share Hostinger's 15-minute limit, so the
// whole-Moon grid stops after 9 minutes; the next deploy carries on from there.
import { execSync } from 'node:child_process';

if (process.env.LUMINA_DEPLOY === '1') {
  const run = (cmd) => execSync(cmd, { stdio: 'inherit' });
  console.log('LUMINA_DEPLOY=1: downloading the NASA data and compiling the web app');
  run('node scripts/fetch-data.mjs --global --deadline=9');
  run('npm run build');
}
