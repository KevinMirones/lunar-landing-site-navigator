// S05: best landing dates.
import { check, done, open, ready, shot } from './lib.mjs';

const { browser, page, errors } = await open('?s=ridge@2026-11-14T00:00~30~2&a=0&l=es');
const rows = page.locator('.best-dates-table tbody tr');
const read = async () => (await rows.allInnerTexts()).map((t) => t.replace(/\s+/g, ' '));
check('the calendar has an index row', ((await page.locator('.calendar svg').textContent()) || '').includes('Índice'));
let list = await read();
check('lists up to five best dates', list.length >= 1 && list.length <= 5, `n=${list.length}`);
const index = (t) => Number(t.match(/% (\d+) Aterrizar/)?.[1]);
const dateOf = (t) => t.match(/^\d\s?(\d{2} \S+ \d{4})/)?.[1]; // the pick number is glued to the date
check('best first', list.map(index).every((v, i, a) => i === 0 || a[i - 1] >= v), list.map(index).join(','));
check('one marker per date on the calendar', (await page.locator('.cal-best').count()) === list.length);
check('the Sun filter is on by default', await page.getByLabel('Solo fechas con Sol visible en el alunizaje').isChecked());
console.log('      dates:', list.map((t) => `${dateOf(t)} (${index(t)})`).join(' | '));

// apply the best date
const top = list[0];
await rows.first().getByRole('button', { name: 'Aterrizar este día' }).click();
await ready(page);
const scenario = (await page.locator('table.scenarios tbody tr').first().innerText()).replace(/\s+/g, ' ');
check('applying a date moves the landing', scenario.includes(dateOf(top)), `${dateOf(top)} -> ${scenario.slice(0, 80)}`);
const got = Number(scenario.match(/% (\d+) Duplicar/)?.[1]);
check('the scenario index matches the promised one within a point', Math.abs(got - index(top)) <= 1, `promised ${index(top)}, scenario ${got}`);

// add another as scenario
list = await read();
const second = list.find((t) => dateOf(t) !== dateOf(top)) ?? list[1];
await rows.nth(list.indexOf(second)).getByRole('button', { name: 'Añadir como escenario' }).click();
await ready(page);
const all = page.locator('table.scenarios tbody tr');
check('adding a date creates a scenario on that day', (await all.count()) === 2 && (await all.nth(1).innerText()).replace(/\s+/g, ' ').includes(dateOf(second)), dateOf(second));

// duration changes the ranking
const before = (await read()).join('|');
await page.getByRole('button', { name: '90 d' }).click();
await ready(page);
await page.waitForTimeout(600);
check('the list follows the mission duration', (await read()).join('|') !== before);

// the filter can be turned off; a permanently shadowed site explains itself
await page.getByRole('button', { name: 'Shackleton Floor' }).click();
await ready(page);
await page.waitForTimeout(600);
check('a site without sunlight explains why there are no dates', (await rows.count()) === 0 && (await page.locator('.best-dates .empty').innerText()).includes('Desmarca'));
await page.getByLabel('Solo fechas con Sol visible en el alunizaje').uncheck();
await page.waitForTimeout(600);
check('without the filter, dates are listed again', (await rows.count()) >= 1);
await shot(page.locator('.lower'), 's05');

await browser.close();
done(errors);
