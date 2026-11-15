// The polar map opens centred and stays on its data; its zoom buttons work; a site can leave the comparison.
import { DEFAULT_LINK, check, done, open, ready, text } from './lib.mjs';

// A point of their own selected, away from the pole: the map used to jump to it and leave black space.
const { browser, page, errors } = await open(DEFAULT_LINK.replace('?s=', '?s=-85.2,52@2026-11-14T00:00~30~2;') + '&v=polar&m=earth');
const map = page.locator('.polar');
await map.scrollIntoViewIfNeeded();
const box = await map.boundingBox();
const hoverAt = async (fx, fy) => {
  await page.mouse.move(box.x + box.width * fx, box.y + box.height * fy);
  await page.waitForTimeout(150);
  return text(page, '.polar-foot .num');
};
const scale = () => page.locator('.polar .scalebar').evaluate((e) => Math.round(e.getBoundingClientRect().width));
const zoomIn = page.getByRole('button', { name: 'Acercar' });
const zoomOut = page.getByRole('button', { name: 'Alejar' });

check('the map opens centred on the pole', /^90\.00°S/.test(await hoverAt(0.5, 0.5)), await hoverAt(0.5, 0.5));
check('it opens on the whole map, so it cannot zoom out further', await zoomOut.isDisabled());
await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
await page.mouse.down();
await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.85, { steps: 8 });
await page.mouse.up();
check('dragging the whole map does not move it', /^90\.00°S/.test(await hoverAt(0.5, 0.5)), await hoverAt(0.5, 0.5));

const s0 = await scale();
const site0 = await text(page, '.hero-head h1');
await zoomIn.click();
await page.waitForTimeout(300);
check('the + button zooms in', (await scale()) !== s0, `${s0} -> ${await scale()} px`);
check('and does not evaluate the point under it', (await text(page, '.hero-head h1')) === site0);
for (let i = 0; i < 2; i++) {
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.95, box.y + box.height * 0.95, { steps: 8 });
  await page.mouse.up();
}
check('zoomed in, it cannot be dragged off its data', /°S/.test(await hoverAt(0.02, 0.02)), await hoverAt(0.02, 0.02));
await zoomIn.click();
await page.waitForTimeout(300);
const s2 = await scale();
await zoomOut.click();
await page.waitForTimeout(300);
check('the − button zooms out', (await scale()) !== s2, `${s2} -> ${await scale()} px`);
await page.getByRole('button', { name: 'Ver todo el polo' }).click();
await page.waitForTimeout(300);
check('⌂ shows the whole pole again', (await scale()) === s0 && /^90\.00°S/.test(await hoverAt(0.5, 0.5)));

// taking sites out of the comparison from the list
const rows = () => page.locator('table.scenarios tbody tr').count();
const before = await rows();
await page.getByRole('button', { name: 'Quitar Malapert Massif de la comparación' }).click();
await ready(page);
check('a site leaves the comparison from the list', (await rows()) === before - 1, `${before} -> ${await rows()} scenarios`);
check('its × goes with it', (await page.getByRole('button', { name: 'Quitar Malapert Massif de la comparación' }).count()) === 0);
const outs = page.locator('.sites .pin-out');
while ((await outs.count()) > 1) {
  await outs.last().click();
  await page.waitForTimeout(300);
}
check('the last site cannot be taken out, and says why', (await outs.first().isDisabled()) && /único sitio/.test((await outs.first().getAttribute('title')) || ''));
await page.reload({ waitUntil: 'networkidle' });
await ready(page);
check('the comparison stays as it was left after reloading', (await rows()) === 1);

await browser.close();
done(errors);
