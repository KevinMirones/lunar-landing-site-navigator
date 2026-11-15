// S13: extended catalogue and its search.
import { check, done, goto, open, ready, text, watch } from './lib.mjs';

const { browser, ctx, page, errors } = await open();
const items = page.locator('.sites li');
const names = async () => (await page.locator('.sites li .site-name').allInnerTexts()).map((t) => t.trim());
const search = page.getByRole('searchbox', { name: /Buscar sitios/ });

check('the list offers at least 35 sites (criterion 1)', (await items.count()) >= 35, `${await items.count()} sites`);

await search.fill('CLPS');
const clps = await names();
check('"CLPS" filters the list (criterion 2)', ['IM-1 Odysseus', 'IM-2 Athena', 'Blue Ghost M1', 'Mons Mouton (VIPER)'].every((n) => clps.includes(n)) && clps.length === 4, clps.join(', '));
await search.fill('1972');
const y1972 = await names();
check('"1972" finds the three landings of that year', y1972.length === 3 && ['Apollo 16', 'Apollo 17', 'Luna 20'].every((n) => y1972.includes(n)), y1972.join(', '));
await search.fill('urss luna 2');
check('words combine: "urss luna 2" finds Luna 20, 21 and 24', (await names()).join(',') === 'Luna 20,Luna 21,Luna 24', (await names()).join(', '));
await search.fill('zzz');
check('a search with no match says so', (await items.count()) === 0 && (await page.locator('.sites .empty').isVisible()));
await search.fill('');
check('clearing the search brings every site back', (await items.count()) >= 35);

// a new site works like any other, with its source
await search.fill('Apollo 12');
await page.locator('.sites li').first().locator('.site-main').click();
await ready(page);
check('a new historic site opens in the status panel', (await text(page, '.hero-head h1')).includes('Apollo 12'));
check('and says where its coordinates come from', (await text(page, '.status-site .status-source')).includes('Wikipedia'));

// it travels in a shareable link (criterion 3)
await search.fill('Luna 17');
await page.locator('.sites li').first().getByRole('button', { name: /Comparar/ }).click();
await ready(page);
await page.waitForTimeout(900);
const href = await page.evaluate(() => location.href);
check('the link names the new site', href.includes('luna17@'), href.slice(href.indexOf('?'), href.indexOf('?') + 80));
const other = await ctx.newPage();
watch(other, errors);
await goto(other, href);
check('and opens it in another tab', (await other.locator('table.scenarios tbody').innerText()).includes('Luna 17'));
await other.close();

// English
await goto(page, '?s=luna24@2026-11-14T00:00~30~2&a=0&l=en');
await page.getByRole('searchbox', { name: /Search sites/ }).fill('USSR');
check('the search works in English', (await names()).includes('Luna 24'));

await browser.close();
done(errors);
