// S16: distance to the nearest permanent shadow.
import { check, done, goto, open, ready, text } from './lib.mjs';

const { browser, page, errors } = await open();
const rows = page.locator('table.scenarios tbody tr');
const health = await (await page.request.get(new URL('api/health', page.url()).href)).json();
check('the server has the shadow mask', health.psr === true, JSON.stringify(health));

const line = await text(page, '.status-psr');
check('Connecting Ridge states its nearest permanent shadow, distance and direction', /^Sombra permanente más cercana: [\d.]+ k?m al [NSEO]{1,2}\.$/.test(line), line);
check('the table gains a permanent-shadow column', (await page.locator('table.scenarios thead th').allInnerTexts()).some((t) => t.includes('Sombra permanente')));
check('the floor of Shackleton is inside it (criterion 1)', (await rows.nth(1).locator('.psr-cell').innerText()).trim() === 'dentro');
check('Connecting Ridge is not, and has a distance (criterion 2)', /[\d.]+ k?m/.test(await rows.nth(0).locator('.psr-cell').innerText()));
check('one sentence joins light and shadow', (await text(page, '.insights')).includes('energía y ciencia al alcance de un rover'));
check('the term opens its definition, which does not promise ice', await (async () => {
  await page.locator('.status-psr .term').click();
  const tip = await page.getByRole('tooltip').innerText();
  await page.keyboard.press('Escape');
  return tip.includes('no está confirmado');
})());

// the simple view keeps it: it is what interests the public most
await page.getByRole('button', { name: 'Sencilla', exact: true }).click();
check('the column stays in the simple view', await page.locator('table.scenarios thead th', { hasText: 'Sombra permanente' }).isVisible());
await page.getByRole('button', { name: 'Experta', exact: true }).click();

// the point search gives each point its distance too
await page.getByRole('button', { name: 'Buscar el mejor punto cerca' }).click();
await page.waitForSelector('.search-status.is-done', { timeout: 120000 });
const cell = (await page.locator('.search-results tr.is-pick').first().locator('td.num').nth(3).innerText()).trim();
check('every proposed point has its distance to permanent shadow (criterion 5)', /^([\d.]+ k?m|dentro|> 20 km)$/.test(cell), cell);

// outside the polar terrain there is no data
await goto(page, '?s=apollo11@2026-11-14T00:00~30~2&a=0&l=es');
check('Apollo 11 has no data (criterion 4)', (await text(page, '.status-psr')).includes('sin dato'));
await goto(page, '?s=ridge@2026-11-14T00:00~30~2&a=0&l=en');
await ready(page);
check('English wording', (await text(page, '.status-psr')).startsWith('Permanent shadow nearest:'), await text(page, '.status-psr'));

await browser.close();
done(errors);
