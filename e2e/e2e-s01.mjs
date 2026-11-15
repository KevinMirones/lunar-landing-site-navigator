import { open, check, done } from './e2e-lib.mjs';
const { browser, page, errors } = await open();
const rows = page.locator('table.scenarios tbody tr');
const rowText = async (i) => (await rows.nth(i).innerText()).replace(/\s+/g, ' ');
check('starts with four scenarios', (await rows.count()) === 4, `rows=${await rows.count()}`);
// duplicate the first scenario with another date
await rows.nth(0).getByRole('button', { name: /Duplicar/ }).click(); await page.waitForTimeout(900);
check('duplicating adds a row', (await rows.count()) === 5);
const r0 = await rowText(0), r1 = await rowText(1);
check('the copy is the same site', r0.includes('Connecting Ridge') && r1.includes('Connecting Ridge'));
check('the copy lands 7 days later', r0.includes('14 nov 2026') && r1.includes('21 nov 2026'), r1.slice(0, 90));
check('the copy is active', (await rows.nth(1).getAttribute('class') || '').includes('is-selected'));
const nums = (t) => t.match(/\d+%/g)?.join(',');
check('same site, different date -> different metrics', nums(r0) !== nums(r1), `${nums(r0)} vs ${nums(r1)}`);
// editing the date in the top bar changes only the active row
const before = [await rowText(0), await rowText(2), await rowText(3)];
await page.locator('input[type=datetime-local]').fill('2027-01-10T00:00'); await page.waitForTimeout(900);
check('top bar edits the active scenario', (await rowText(1)).includes('10 ene 2027'));
check('other rows are untouched', (await rowText(0)) === before[0] && (await rowText(2)) === before[1] && (await rowText(3)) === before[2]);
// the hero follows the active scenario
check('hero shows the active scenario date', (await page.locator('.hero-head p').innerText()).includes('10 ene 2027'));
// strips share the mission-day axis: every strip has the same left edge and width
const boxes = await page.locator('table.scenarios .strip').evaluateAll((els) => els.map((e) => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.width)]; }));
check('strips share one axis', boxes.every((b) => b[0] === boxes[0][0] && b[1] === boxes[0][1]), JSON.stringify(boxes));
// removing the active scenario activates the previous one
await rows.nth(1).getByRole('button', { name: /Eliminar/ }).click(); await page.waitForTimeout(600);
check('removing leaves four rows', (await rows.count()) === 4);
check('previous scenario becomes active', (await rows.nth(0).getAttribute('class') || '').includes('is-selected'));
// the last scenario cannot be removed
for (let i = 0; i < 3; i++) { await rows.nth(1).getByRole('button', { name: /Eliminar/ }).click(); await page.waitForTimeout(300); }
check('one scenario remains', (await rows.count()) === 1);
check('the last one cannot be removed', await rows.nth(0).getByRole('button', { name: /Eliminar/ }).isDisabled());
// limit of six
for (let i = 0; i < 7; i++) { const b = page.locator('.sites li').nth(i).getByRole('button', { name: /Comparar/ }); if (await b.isEnabled()) await b.click(); await page.waitForTimeout(250); }
check('never more than six scenarios', (await rows.count()) === 6, `rows=${await rows.count()}`);
check('"Comparar" is disabled at the limit', await page.locator('.sites li').nth(8).getByRole('button', { name: /Comparar/ }).isDisabled());
await page.screenshot({ path: 'shots/s01.png', fullPage: true });
await browser.close(); done(errors);
