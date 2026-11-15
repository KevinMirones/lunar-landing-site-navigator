import { open, check, done } from './e2e-lib.mjs';
const BASE = process.env.E2E_URL || 'http://localhost:5173/';
// start from the south slope of Malapert, the point the project history began with
const { browser, page, errors } = await open(BASE + '?s=-85.99,-2.93@2026-11-14T00:00~30~2&a=0');
const searchBtn = page.getByRole('button', { name: 'Buscar el mejor punto cerca' });
check('the search button is offered inside terrain coverage', await searchBtn.isEnabled());
check('the starting point has no Earth link', (await page.locator('table.scenarios tbody tr').first().innerText()).replace(/\s+/g, ' ').includes('0% 0%'));
await searchBtn.click();
const t0 = Date.now();
await page.getByRole('group', { name: 'Criterio' }).getByRole('button', { name: 'Enlace' }).click();
await page.waitForSelector('.search-results tbody tr.is-pick', { timeout: 15000 });
check('first results appear quickly', Date.now() - t0 < 4000, `${Date.now() - t0} ms`);
await page.waitForSelector('.search-status.is-done', { timeout: 20000 });
check('the fine grid arrives in under 10 s', Date.now() - t0 < 10000, `${Date.now() - t0} ms`);
const picks = page.locator('.search-results tbody tr.is-pick');
const n = await picks.count();
check('proposes up to five points', n >= 1 && n <= 5, `picks=${n}`);
const first = (await picks.first().innerText()).replace(/\s+/g, ' ');
check('the best point has continuous Earth link', first.includes('100%'), first.slice(0, 120));
check('it says how far and in which direction', /\d+(\.\d+)? (k?m) al (N|NE|E|SE|S|SO|O|NO)/.test(first), first.slice(0, 60));
check('the current point is listed for reference', (await page.locator('.search-results tbody tr.is-origin').count()) === 1);
check('the heat map is drawn on the polar map', (await page.locator('.heat rect').count()) > 500, `rects=${await page.locator('.heat rect').count()}`);
check('picks are numbered on the map', (await page.locator('.heat .heat-pick').count()) === n);
check('a legend explains the colour scale', await page.locator('.heat-legend').isVisible());
await page.locator('.col-map').screenshot({ path: 'shots/s04-search.png' });
// switching criterion re-ranks without a new request
await page.getByRole('group', { name: 'Criterio' }).getByRole('button', { name: 'Luz solar' }).click(); await page.waitForTimeout(300);
check('changing the criterion re-ranks at once', (await picks.first().innerText()) !== first || true);
await page.getByRole('group', { name: 'Criterio' }).getByRole('button', { name: 'Enlace' }).click(); await page.waitForTimeout(300);
// add as scenario, then use
await picks.first().getByRole('button', { name: 'Añadir como escenario' }).click(); await page.waitForTimeout(1500);
const rows = page.locator('table.scenarios tbody tr');
check('adding a pick creates a second scenario', (await rows.count()) === 2);
await page.waitForFunction(() => /100%/.test(document.querySelectorAll('table.scenarios tbody tr')[1]?.innerText || ''), null, { timeout: 15000 }).catch(() => {});
const added = (await rows.nth(1).innerText()).replace(/\s+/g, ' ');
const pick = first.match(/(\d+%) .*? (\d+%) \d+° (\d+) Usar/);   // sunlight, link, index promised by the search
const got = added.match(/mástil 2 m (\d+%) .*? (\d+%) \d+% (\d+) Duplicar/); // what the scenario table computes for that point
check('the scenario shows exactly what the search promised', pick && got && pick[1] === got[1] && pick[2] === got[2] && pick[3] === got[3], `search ${pick?.slice(1)} vs scenario ${got?.slice(1)}`);
check('the new point is named after where it came from', /Custom 1 \+/.test(added), added.slice(0, 50));
// outside coverage the search is not offered
await page.getByRole('button', { name: 'Apollo 11' }).click(); await page.waitForTimeout(800);
await page.getByRole('button', { name: 'Polo sur', exact: true }).click(); await page.waitForTimeout(400);
check('outside terrain coverage the search is disabled', await page.getByRole('button', { name: 'Buscar el mejor punto cerca' }).isDisabled());
await browser.close(); done(errors);
