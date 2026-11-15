// S02: shareable links.
import { check, done, goto, open, ready, watch } from './lib.mjs';

const { browser, ctx, page, errors } = await open();
const table = async (p) => (await p.locator('table.scenarios tbody').innerText()).replace(/\s+/g, ' ');

// build a non-default state
await page.locator('table.scenarios tbody tr').nth(0).getByRole('button', { name: /Duplicar/ }).click();
await page.locator('input[type=datetime-local]').fill('2027-02-03T06:30');
await page.getByRole('button', { name: '60 d' }).click();
await page.getByRole('button', { name: '10 m', exact: true }).click();
await page.getByRole('button', { name: 'Dónde se ve la Tierra' }).click();
await page.locator('.polar').click({ position: { x: 200, y: 420 } }); // custom point on the active scenario
await ready(page);
await page.locator('.timeline').focus();
for (let i = 0; i < 3; i++) await page.keyboard.press('Shift+ArrowRight');
await page.getByRole('button', { name: 'EN', exact: true }).click();
await page.waitForTimeout(900); // the address is written 300 ms after the last change
const search = await page.evaluate(() => location.search);
check('the address reflects the state', /[?&]s=/.test(search) && search.includes('l=en') && search.includes('m=earth') && search.includes('t=72'), search.slice(0, 140));
check('custom point travels as coordinates', /;-?\d+\.\d+,-?\d+\.\d+@2027-02-03T06:30~60~10/.test(decodeURIComponent(search)), decodeURIComponent(search).slice(0, 120));

// copy link
await page.getByRole('button', { name: 'Copy link' }).click();
await page.waitForTimeout(300);
check('confirms the copy', await page.getByText('Link copied').isVisible());
const copied = await page.evaluate(() => navigator.clipboard.readText());
check('clipboard holds the current address', copied === (await page.evaluate(() => location.href)), copied.slice(0, 80));

// open it elsewhere
const before = { table: await table(page), hero: await page.locator('.hero-head').innerText(), status: await page.locator('.status-site').innerText() };
const other = await ctx.newPage();
watch(other, errors);
await goto(other, copied);
const after = { table: await table(other), hero: await other.locator('.hero-head').innerText(), status: await other.locator('.status-site').innerText() };
check('same comparison table in another tab', after.table === before.table, `\n   A: ${before.table.slice(0, 150)}\n   B: ${after.table.slice(0, 150)}`);
check('same instant and site', after.hero === before.hero, `${before.hero.replace(/\n/g, ' | ')}  vs  ${after.hero.replace(/\n/g, ' | ')}`);
check(
  'same language, layer and active scenario',
  (await other.getByRole('button', { name: 'Where Earth is visible' }).getAttribute('aria-pressed')) === 'true' &&
    ((await other.locator('table.scenarios tbody tr').nth(1).getAttribute('class')) || '').includes('is-selected'),
);
check('no notice on a good link', (await other.locator('.notice').count()) === 0);
await other.close();

// playback does not touch history
const h0 = await page.evaluate(() => [history.length, location.search]);
await page.getByRole('button', { name: 'Play', exact: true }).click();
await page.waitForTimeout(1500);
const h1 = await page.evaluate(() => [history.length, location.search]);
await page.getByRole('button', { name: 'Pause', exact: true }).click();
await page.waitForTimeout(700);
const h2 = await page.evaluate(() => [history.length, location.search]);
check('playing adds no history entries and leaves the address alone', h1[0] === h0[0] && h1[1] === h0[1]);
check('pausing updates the address once', h2[0] === h0[0] && h2[1] !== h0[1]);

// damaged links
const bad = await ctx.newPage();
const badErrors = [];
bad.on('pageerror', (e) => badErrors.push(e.message));
await goto(bad, '?s=xxx');
check('a damaged link still opens the app', (await bad.locator('table.scenarios tbody tr').count()) === 4 && badErrors.length === 0, badErrors.join(';'));
check('and explains what happened', await bad.locator('.notice').isVisible());
await bad.locator('.notice button').click();
check('the notice can be dismissed', (await bad.locator('.notice').count()) === 0);
await goto(bad, '?s=ridge@2026-03-03T11:29~30~2;nope@x~1~1&a=0&l=en');
check(
  'a half-readable link keeps what it could read',
  (await bad.locator('table.scenarios tbody tr').count()) === 1 && (await bad.locator('.hero-head p').innerText()).includes('03 Mar 2026') && (await bad.locator('.notice').isVisible()),
);
await browser.close();
done(errors);
