// Collapsible panels, map focus and the stacked layout on a narrow screen
// (docs/historial/2026-11-14-11-paneles-plegables.md).
import { check, done, goto, open, ready } from './lib.mjs';

const { browser, page, errors } = await open();
const table = async () => (await page.locator('table.scenarios tbody').innerText()).replace(/\s+/g, ' ');
const closed = async (id) => ((await page.locator(`#${id}`).getAttribute('class')) || '').includes('is-closed');
const figures = await table();

// every section folds with its own button, which says what it does
const sections = [
  ['hero-body', 'el panorama'],
  ['when-body', 'la línea de tiempo'],
  ['calendar-body', 'el calendario'],
  ['compare-body', 'la comparación'],
];
for (const [id, label] of sections) {
  const btn = page.locator(`button[aria-controls="${id}"]`);
  check(`"${label}" starts open`, !(await closed(id)) && (await btn.getAttribute('aria-expanded')) === 'true');
  await btn.click();
  await page.waitForTimeout(150);
  check(`"${label}" folds, and its button now offers to show it`, (await closed(id)) && (await btn.getAttribute('aria-label')) === `Mostrar ${label}` && (await btn.getAttribute('aria-expanded')) === 'false');
}
await page.locator('button[aria-controls="compare-body"]').click();
await page.waitForTimeout(400);
check('folding panels does not change any figure', (await table()) === figures);

// the choice survives a reload
await page.reload({ waitUntil: 'networkidle' });
await ready(page);
check('folded sections stay folded after a reload', (await closed('hero-body')) && (await closed('when-body')) && (await closed('calendar-body')) && !(await closed('compare-body')));

// the map can take the whole width, and each side panel comes back from its rail
const workspace = page.locator('.workspace');
const mapWidth = async () => Math.round((await page.locator('.col-map').boundingBox()).width);
const narrow = await mapWidth();
await page.getByRole('button', { name: 'Ampliar el mapa' }).click();
await page.waitForTimeout(700);
const cls = (await workspace.getAttribute('class')) || '';
check('"Ampliar el mapa" closes both side panels', cls.includes('sites-closed') && cls.includes('status-closed'), cls);
const wide = await mapWidth();
check('and the map grows', wide > narrow + 200, `${narrow} -> ${wide} px`);
const rail = page.locator('.col-sites .drawer-rail');
check('a closed side panel leaves a rail with its name', (await rail.isVisible()) && (await rail.innerText()).includes('Sitios'));
await rail.click();
await page.waitForTimeout(700);
check('the rail opens the panel again', !((await workspace.getAttribute('class')) || '').includes('sites-closed'));
await page.getByRole('button', { name: 'Ampliar el mapa' }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: 'Mostrar los paneles' }).click();
await page.waitForTimeout(700);
const back = (await workspace.getAttribute('class')) || '';
check('"Mostrar los paneles" brings both back', !back.includes('sites-closed') && !back.includes('status-closed'), back);

// on a phone the side panels stack and fold upwards instead of sideways
await page.setViewportSize({ width: 390, height: 844 });
await goto(page, '?s=ridge@2026-11-14T00:00~30~2&a=0&l=es');
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
check('no horizontal overflow at 390 px', overflow <= 0, String(overflow));
check('the map-focus button is hidden on a phone', !(await page.getByRole('button', { name: 'Ampliar el mapa' }).isVisible()));
await page.locator('button[aria-controls="drawer-sites"]').first().click();
await page.waitForTimeout(500);
check('on a phone the site list folds upwards', await closed('sites-fold'));

// English labels
await page.setViewportSize({ width: 1440, height: 900 });
await goto(page, '?s=ridge@2026-11-14T00:00~30~2&a=0&l=en');
check('labels are translated', (await page.locator('button[aria-controls="when-body"]').getAttribute('aria-label')).includes('the timeline'));

await browser.close();
done(errors);
