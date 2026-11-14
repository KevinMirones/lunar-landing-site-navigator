// Entry point: starts the LUMINA API (and the built web app, when dist/ exists).
import { createSocket } from 'node:dgram';
import { existsSync } from 'node:fs';
import { createApp, DIST } from './app.js';
import { demResolutions } from './dem.js';

const PORT = process.env.PORT || 8787;

/** Address of the interface that carries the default route (no packet is sent). */
function lanAddress() {
  return new Promise((resolve) => {
    const socket = createSocket('udp4');
    const done = (ip) => {
      socket.close();
      resolve(ip);
    };
    socket.once('error', () => done(null));
    socket.connect(53, '192.0.2.1', () => done(socket.address().address));
  });
}

createApp().listen(PORT, async () => {
  const grids = demResolutions();
  console.log(`LUMINA API on http://localhost:${PORT}  (LOLA terrain: ${grids.length ? `${grids.join(', ')} m` : 'MISSING - run npm run fetch-data'})`);
  const ip = await lanAddress();
  if (ip && existsSync(DIST)) console.log(`Built app for people on your network: http://${ip}:${PORT}`);
});
