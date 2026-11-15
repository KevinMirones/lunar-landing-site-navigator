// S17: terrain across the whole Moon. The default server runs without the whole-Moon grid,
// so the catalogue sites outside the pole answer with their precomputed terrain.
import { BASE_GLOBAL, check, done, goto, open, skip, text } from './lib.mjs';

const { browser, page, errors } = await open('?s=apollo11@2026-11-15T00:00~30~2&a=0&l=es');
const model = () => text(page, '.status-site .model');

// criterion 6: a catalogue site outside the pole has its terrain, with nothing to download
check('Apollo 11 has real terrain, precomputed', /LOLA de 474 m \(precalculado\)/.test(await model()), await model());
const expand = page.getByRole('button', { name: 'Ver en 3D' });
check('and the 3D view is on offer', await expand.isEnabled());
await expand.click();
const dialog = page.getByRole('dialog');
await dialog.waitFor({ timeout: 10000 });
await page.waitForFunction(() => /Terreno \d+ m/.test(document.querySelector('.t3d-hud')?.textContent || ''), null, { timeout: 15000 }).catch(() => {});
const hud = await text(page, '.t3d-hud');
check('the 3D view loads its relief', /Terreno 474 m \(precalculado\)/.test(hud), hud);
check('it opens with the ground in frame, at most 15 degrees up', Number(await page.locator('.t3d-stage').getAttribute('data-pitch')) <= 15);

// criterion 12: Earth stands some 66 degrees up at Apollo 11; the camera reaches 85
for (let i = 0; i < 24; i++) await page.keyboard.press('ArrowUp'); // 120 degrees: 85 from any start
await page.waitForTimeout(200);
check('the camera looks up to 85 degrees', (await page.locator('.t3d-stage').getAttribute('data-pitch')) === '85');
check('Earth is up', /Tierra visible/.test(await text(page, '.t3d-hud')));
await page.keyboard.press('Escape');
await page.waitForTimeout(300);

// a site walled in by mountains shows them in its horizon
await goto(page, '?s=apollo15@2026-11-15T00:00~30~2&a=0&l=es');
check('Apollo 15 has real terrain too', /LOLA de 474 m/.test(await model()), await model());

// criterion 7: a point of your own outside the pole, on a server without the whole-Moon grid
await goto(page, '?s=10,10@2026-11-15T00:00~30~2&a=0&l=es');
check('a point of your own stays on a smooth Moon, and says so', /Sin topografía para este punto/.test(await model()), await model());
check('and offers no 3D view', await page.getByRole('button', { name: 'Ver en 3D' }).isDisabled());

// criterion 5: with the whole-Moon grid installed, the same point has terrain (E2E_GLOBAL=1)
if (BASE_GLOBAL) {
  await goto(page, `${BASE_GLOBAL}?s=10,10@2026-11-15T00:00~30~2&a=0&l=es`);
  check('with the whole-Moon grid, a point of your own has terrain', /LOLA de 474 m/.test(await model()) && !/precalculado/.test(await model()), await model());
  check('and the 3D view', await page.getByRole('button', { name: 'Ver en 3D' }).isEnabled());
} else {
  skip('with the whole-Moon grid, a point of your own has terrain and the 3D view', 'needs E2E_GLOBAL=1 and npm run fetch-data -- --global');
}

await browser.close();
done(errors);
