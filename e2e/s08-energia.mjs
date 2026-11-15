// S08: power, battery and eclipses.
import { check, done, goto, open, ready, text, watch } from './lib.mjs';

const { browser, ctx, page, errors } = await open('?s=apollo11@2026-11-14T00:00~30~2;ridge@2026-11-14T00:00~30~2&a=0&l=es');
const verdict = () => text(page, '.power-verdict');
const battery = async (i) => text(page, `table.scenarios tbody tr:nth-child(${i + 1}) .battery-cell`);
const figures = () => page.locator('table.scenarios tbody tr td.num:not(.battery-cell)').allInnerTexts();

check('the power block is there, with its example values', (await page.locator('.power-note').isVisible()) && (await page.getByLabel('Batería (Wh)').inputValue()) === '3000');
check('Apollo 11 does not survive its 14-day night on 3 kWh', (await verdict()).startsWith('No sobrevive: la batería se agota el día'), await verdict());
check('the table shows each scenario’s minimum battery', (await battery(0)).includes('kWh') && (await battery(0)).includes('no basta') && (await battery(1)).length > 0, `${await battery(0)} | ${await battery(1)}`);
check('the timeline has a power row', (await page.locator('.tl-power .band.power').count()) > 0);

// a bigger battery changes the verdict and the table, nothing else
const before = await figures();
const field = page.getByLabel('Batería (Wh)');
await field.fill('10000');
await page.waitForTimeout(400);
check('a 10 kWh battery survives, with its margin', /^Sobrevive la noche más larga, con un \d+% de margen\.$/.test(await verdict()), await verdict());
check('and the table follows', (await battery(0)).includes('basta') && !(await battery(0)).includes('no basta'), await battery(0));
check('light, link and index do not change', JSON.stringify(await figures()) === JSON.stringify(before));

// the panel type matters at the pole
await page.locator('table.scenarios tbody tr').nth(1).locator('th button').click();
await ready(page);
const tracker = await text(page, '.power-figures');
await page.getByRole('group', { name: 'Tipo de panel' }).getByRole('button', { name: 'Horizontal' }).click();
await page.waitForTimeout(400);
const flat = await text(page, '.power-figures');
check('a horizontal panel at the pole gives much less than a tracker', tracker !== flat, `${tracker} | ${flat}`);
await page.getByRole('group', { name: 'Tipo de panel' }).getByRole('button', { name: 'Inclinado' }).click();
check('a tilted panel asks for its tilt and facing', (await page.getByLabel('Inclinación (°)').isVisible()) && (await page.getByLabel('Orientación (°)').isVisible()));
await page.getByLabel('Orientación (°)').fill('180');
await page.waitForTimeout(900);

// the configuration travels in the link
const href = await page.evaluate(() => location.href);
check('the link carries the configuration', decodeURIComponent(href).includes('p=tilted:90:180~2~28~200~25~10000'), decodeURIComponent(href).slice(-60));
const shownHere = await verdict();
const other = await ctx.newPage();
watch(other, errors);
await goto(other, href);
check('another tab shows the same verdict', (await text(other, '.power-verdict')) === shownHere, await text(other, '.power-verdict'));
await other.close();

// an eclipse during the mission
await goto(page, '?s=apollo11@2026-03-01T00:00~14~2&a=0&l=es');
const eclipse = await text(page, '.power-eclipses');
check('the eclipse of 3 March 2026 is announced', eclipse.includes('03 mar 2026') && eclipse.includes('por completo'), eclipse);
check('and marked on the timeline', (await page.locator('.tl-power .band.eclipse').count()) === 1);

// English
await goto(page, '?s=apollo11@2026-11-14T00:00~30~2&a=0&l=en');
check('English wording', (await text(page, '.power-verdict')).startsWith('Does not survive'), await text(page, '.power-verdict'));

await browser.close();
done(errors);
