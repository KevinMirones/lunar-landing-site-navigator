// S11: first-person 3D view of the site (by Andrés), on the shared helpers of S15.
import { check, done, goto, open } from './lib.mjs';
// Malapert massif, where the Sun and Earth are both up on this date
const { browser, page, errors } = await open('?s=-85.99,0@2026-11-15T00:00~30~2&a=0&l=es');
const expand = page.getByRole('button', { name: 'Ver en 3D' });
check('the panorama offers the 3D view inside terrain coverage', await expand.isEnabled());
await expand.click();
const dialog = page.getByRole('dialog');
await dialog.waitFor({ timeout: 10000 });
check('the 3D view opens full screen', await dialog.isVisible());
await page.waitForFunction(() => /Terreno \d+ m/.test(document.querySelector('.t3d-hud')?.textContent || ''), null, { timeout: 15000 }).catch(() => {});
const hud = (await page.locator('.t3d-hud').innerText()).replace(/\s+/g, ' ');
check('it opens facing the Sun and says where it looks', /Mirando al (N|NE|E|SE|S|SO|O|NO) \d+°/.test(hud), hud);
check('it states the Sun and Earth as the site does', /Sol (visible \d+%|oculto)/.test(hud) && /Tierra (visible|oculta)/.test(hud), hud);
check('it loads the relief and names its resolution', /Terreno \d+ m/.test(hud), hud);
// The canvas has drawn something: not every pixel of a screenshot is the black sky.
// (A WebGL canvas cannot be read back directly once the frame has been shown.)
const shot = (await page.screenshot({ clip: { x: 0, y: 100, width: 1440, height: 600 } })).toString('base64');
const lit = await page.evaluate(async (b64) => {
  const img = new Image();
  img.src = `data:image/png;base64,${b64}`;
  await img.decode();
  const probe = document.createElement('canvas');
  probe.width = 96; probe.height = 40;
  const g = probe.getContext('2d');
  g.drawImage(img, 0, 0, 96, 40);
  const d = g.getImageData(0, 0, 96, 40).data;
  let drawn = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 40) drawn++;
  return drawn;
}, shot);
check('the landscape is drawn', lit > 200, `non-sky samples=${lit} of 3840`);
const before = hud.match(/Mirando al \S+ (\d+)°/)?.[1];
for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight');
await page.waitForTimeout(200);
const after = (await page.locator('.t3d-hud').innerText()).match(/Mirando al \S+ (\d+)°/)?.[1];
check('the arrow keys turn the camera', before && after && (Number(after) - Number(before) + 360) % 360 === 30, `${before}° -> ${after}°`);
await dialog.getByRole('button', { name: '50 m' }).click(); await page.waitForTimeout(800);
check('the mast can change from inside the view', (await dialog.getByRole('button', { name: '50 m' }).getAttribute('aria-pressed')) === 'true');
await dialog.getByRole('button', { name: '×3' }).click();
await dialog.getByRole('button', { name: 'Escala real' }).click();
await dialog.getByRole('button', { name: 'Reproducir' }).click(); await page.waitForTimeout(1200);
await dialog.getByRole('button', { name: 'Pausar' }).click();
const date3d = await page.locator('.t3d-title p').innerText();
await page.screenshot({ path: 'shots/s11-terrain.png' });
await page.keyboard.press('Escape'); await page.waitForTimeout(400);
check('Esc closes the view', (await page.locator('.t3d').count()) === 0);
check('time stays where the view left it', (await page.locator('.hero-head p').innerText()) === date3d, date3d);
check('the mast chosen in the view stays chosen', (await page.getByRole('group', { name: 'Escenario activo' }).getByRole('button', { name: '50 m' }).getAttribute('aria-pressed')) === 'true');
// where there is no topography the button is disabled and says why: a point of your own
// outside the pole, on a server without the whole-Moon grid (S17)
await goto(page, '?s=10,10@2026-11-15T00:00~30~2&a=0&l=es');
const off = page.getByRole('button', { name: 'Ver en 3D' });
check('without topography the 3D view is disabled', await off.isDisabled());
check('and explains why', /topografía/.test((await off.getAttribute('title')) || ''));
await browser.close(); done(errors);
