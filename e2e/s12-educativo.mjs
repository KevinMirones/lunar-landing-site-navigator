// S12: guided tour, simple view and glossary.
import { DEFAULT_LINK, check, done, goto, open, ready, text } from './lib.mjs';

const { browser, page, errors } = await open();
const hero = () => text(page, '.hero-head h1');
const table = async () => (await page.locator('table.scenarios tbody').innerText()).replace(/\s+/g, ' ');
const pressed = async (name) => (await page.getByRole('button', { name, exact: true }).first().getAttribute('aria-pressed')) === 'true';
const closed = async (id) => ((await page.locator(`#${id}`).getAttribute('class')) || '').includes('is-closed');

// something to put back: a folded calendar, the Earth layer, the current table and address
await page.locator('button[aria-controls="calendar-body"]').click();
await page.getByRole('button', { name: 'Dónde se ve la Tierra' }).click();
await page.waitForTimeout(900);
const before = { table: await table(), hero: await hero(), search: await page.evaluate(() => location.search) };

// step by step, with the keyboard
await page.getByRole('button', { name: 'Recorrido' }).click();
await ready(page);
const card = page.getByRole('dialog');
check('the tour opens on step 1 of 5', (await card.isVisible()) && (await text(page, '.tour-count')) === 'Paso 1 / 5');
check('step 1 shows Apollo 11 on the globe, playing', (await hero()).includes('Apollo 11') && (await pressed('Globo')) && (await page.getByRole('button', { name: 'Pausar' }).isVisible()));
await page.keyboard.press('ArrowRight');
await ready(page);
check('→ step 2: the panorama at Connecting Ridge', (await hero()).includes('Connecting Ridge') && !(await closed('hero-body')));
await page.keyboard.press('ArrowRight');
await ready(page);
check('→ step 3: the floor of Shackleton', (await hero()).includes('Shackleton Floor'));
await page.keyboard.press('ArrowLeft');
await ready(page);
check('← goes back to step 2', (await text(page, '.tour-count')) === 'Paso 2 / 5');
await page.keyboard.press('ArrowRight');
await page.keyboard.press('ArrowRight');
await ready(page);
check('step 4: Malapert with the Earth layer', (await hero()).includes('Malapert') && (await pressed('Dónde se ve la Tierra')));
await page.keyboard.press('ArrowRight');
await ready(page);
check('step 5: the comparison table, open', (await page.locator('table.scenarios tbody tr').count()) === 4 && !(await closed('compare-body')));
check('the address does not change during the tour', (await page.evaluate(() => location.search)) === before.search);
const words = (await text(page, '#tour-text')).split(/\s+/).length;
check('each text is short (40 words at most)', words <= 40, `${words} words`);

// Escape puts everything back
await page.keyboard.press('Escape');
await ready(page);
check('Escape leaves the tour', (await card.count()) === 0);
check('and the app is as it was: table, instant, layer and folded panels', (await table()) === before.table && (await hero()) === before.hero && (await pressed('Dónde se ve la Tierra')) && (await closed('calendar-body')));
await page.waitForTimeout(900);
check('and so is the address', (await page.evaluate(() => location.search)) === before.search);

// leaving half-way works the same
await page.getByRole('button', { name: 'Recorrido' }).click();
await page.keyboard.press('ArrowRight');
await ready(page);
await card.getByRole('button', { name: 'Salir' }).click();
await ready(page);
check('"Salir" at step 2 restores the app too', (await table()) === before.table && (await hero()) === before.hero);

// simple view
await page.getByRole('button', { name: 'Sencilla', exact: true }).click();
await page.waitForTimeout(400);
const visibleExpert = await page.locator('[data-level="expert"]').evaluateAll((els) => els.filter((e) => e.getClientRects().length > 0).length);
check('in the simple view no expert element is visible (criterion 5)', visibleExpert === 0, `${visibleExpert} visible`);
check('the comparison keeps sunlight, link and index', (await page.locator('table.scenarios thead th').allInnerTexts()).join('|').includes('Índice'));
check('the panorama, map and verdicts stay', (await page.locator('.panorama').isVisible()) && (await page.locator('.insights').isVisible()));
await page.waitForTimeout(900);
const simpleLink = await page.evaluate(() => location.href);
check('the link says so', simpleLink.includes('x=simple'));
await goto(page, simpleLink.slice(simpleLink.indexOf('?')));
check('and opens in the simple view (criterion 6)', (await page.locator('.app').getAttribute('data-view')) === 'simple');
await page.getByRole('button', { name: 'Experta', exact: true }).click();

// glossary
const term = page.locator('.score .term');
await term.click();
const tip = page.getByRole('tooltip');
check('a glossary term opens a short definition', (await tip.isVisible()) && (await tip.innerText()).includes('40% luz solar'));
await page.keyboard.press('Escape');
check('Escape closes it', (await tip.count()) === 0);

// English
await goto(page, DEFAULT_LINK.replace('l=es', 'l=en'));
await page.getByRole('button', { name: 'Tour' }).click();
await ready(page);
check('the tour is translated', (await text(page, '#tour-title')) === 'Near the equator' && (await text(page, '.tour-count')) === 'Step 1 / 5');

await browser.close();
done(errors);
