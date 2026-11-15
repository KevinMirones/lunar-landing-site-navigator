// S09: elevation margin and ground stations.
import { check, done, goto, open, ready, text, watch } from './lib.mjs';

const { browser, ctx, page, errors } = await open('?s=malapert@2026-11-14T00:00~30~2;apollo11@2026-11-14T00:00~30~2&a=0&l=es');
const rows = page.locator('table.scenarios tbody tr');
const cells = async (i) => rows.nth(i).locator('td.num').allInnerTexts();
const pctOf = (t) => Number(String(t).match(/(\d+)%/)?.[1]);
const pressed = async (group, name) => (await page.getByRole('group', { name: group }).getByRole('button', { name, exact: true }).getAttribute('aria-pressed')) === 'true';

check('starts with no margin and no ground network, as before S09', (await pressed('Margen de elevación', '0°')) && (await pressed('Red de tierra', 'Ninguna')));
check('with no network there is no contact row or column', (await page.locator('.tl-contact').count()) === 0 && (await page.locator('.contact-cell').count()) === 0);

// a margin can only take link time away, and the figures follow at once
const link0 = pctOf((await cells(0))[2]);
const sun0 = (await cells(0))[0];
await page.getByRole('group', { name: 'Margen de elevación' }).getByRole('button', { name: '5°', exact: true }).click();
await ready(page);
const link5 = pctOf((await cells(0))[2]);
check('a 5° margin never gives more link time', link5 <= link0, `${link0}% -> ${link5}%`);
check('and leaves the sunlight alone', (await cells(0))[0] === sun0);

// the three DSN sites
await page.getByRole('group', { name: 'Red de tierra' }).getByRole('button', { name: 'Red del Espacio Profundo' }).click();
await page.waitForTimeout(800);
const figures = await text(page, '.comms-figures');
const ratio = Number(figures.match(/\((\d+)% del tiempo con enlace\)/)?.[1]);
check('with the DSN, contact is at least 90% of the link time at Malapert (criterion 4)', ratio >= 90, figures);
check('the table gains a contact column', (await page.locator('.contact-cell').count()) === 2);
check('the timeline shows contact by station', (await page.locator('.tl-contact .band.contact').count()) > 0 && (await page.locator('.tl-station').count()) > 0);
check('the mission balance lists daily contact', (await text(page, '.mission')).includes('Contacto con estaciones, al día'));

// the settings travel in the link
await page.waitForTimeout(600);
const href = await page.evaluate(() => location.href);
check('the link carries margin and network', decodeURIComponent(href).includes('c=5~dsn'), decodeURIComponent(href).slice(-40));
const other = await ctx.newPage();
watch(other, errors);
await goto(other, href);
check('another tab shows the same contact figures', (await text(other, '.comms-figures')) === figures);
await other.close();

// one station at mid-latitude, from Apollo 11, where Earth never sets
await page.getByRole('group', { name: 'Red de tierra' }).getByRole('button', { name: 'Una estación' }).click();
await rows.nth(1).locator('th button').click();
await ready(page);
await page.waitForTimeout(500);
const single = await text(page, '.comms-figures');
const perDay = Number(single.match(/Contacto al día ([\d.]+) h/)?.[1]);
check('one station gives 5 to 14 hours a day (criterion 4 of the spec, single station)', perDay > 5 && perDay < 14, single);
check('it asks for the station’s coordinates', (await page.getByLabel('Latitud (°)').isVisible()) && (await page.getByLabel('Longitud este (°)').isVisible()));

// the point search uses the margin too: its centre cell matches the active scenario.
// A custom point a few metres off the catalogue summit, so both use the same terrain: at the exact
// coordinates of a catalogue site the server answers with its finer, precomputed horizon.
await goto(page, '?s=-85.9671,-2.2392@2026-11-14T00:00~30~2&a=0&l=es&c=5~none');
await page.getByRole('button', { name: 'Buscar el mejor punto cerca' }).click();
await page.getByRole('group', { name: 'Radio' }).getByRole('button', { name: '2 km' }).click().catch(() => {});
await page.waitForSelector('.search-results tr.is-origin', { timeout: 120000 });
const origin = await page.locator('.search-results tr.is-origin td.num').allInnerTexts();
const scenario = await cells(0);
check('with a 5° margin the search centre gives the scenario’s link (within a point)', Math.abs(pctOf(origin[2]) - pctOf(scenario[2])) <= 1, `search ${origin[2]} vs scenario ${scenario[2]}`);

// the Earth card explains a link lost to the margin
await goto(page, '?s=malapert@2026-11-14T00:00~30~2&a=0&l=es&c=5~none');
check('the Earth card follows the margin', (await text(page, '.body-card.earth .state')).length > 0, await text(page, '.body-card.earth .state'));

await browser.close();
done(errors);
