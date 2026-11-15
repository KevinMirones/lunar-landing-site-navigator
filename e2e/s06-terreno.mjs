// S06 and S07: fine terrain, precomputed horizons and the source of each site.
// `npm run e2e` serves without the fine grids; with E2E_HIRES=1 it also starts
// a server that holds them, and the fine-grid checks run as well.
import { BASE, BASE_FINE, check, done, goto, open, shot, skip } from './lib.mjs';

const health = async (b) => (await fetch(b + 'api/health')).json();
const text = async (page, sel) => ((await page.locator(sel).first().innerText()) || '').replace(/\s+/g, ' ');
const row = async (page) => text(page, 'table.scenarios tbody tr');
const RIDGE = '?s=ridge@2026-11-14T00:00~30~2&a=0&l=es';
const errs = [];

// --- with the fine grids
let fineRow = null;
if (BASE_FINE) {
  const hf = await health(BASE_FINE);
  check('server with fine grids reports them', hf.resolutionsM.join() === '20,40,80,240', hf.resolutionsM.join());
  const { browser, page, errors } = await open(BASE_FINE + RIDGE);
  let model = await text(page, '.status-site .model');
  check('fine: the site states 20 m terrain', model.includes('topografía LOLA de 20 m') && !model.includes('precalculado'), model);
  fineRow = await row(page);
  await page.getByRole('button', { name: 'Malapert Massif' }).click();
  await page.waitForTimeout(1500);
  model = await text(page, '.status-site .model');
  check('Malapert states 40 m terrain', model.includes('LOLA de 40 m'), model);
  await browser.close();
  errs.push(...errors);
} else {
  skip('fine-grid checks', 'set E2E_HIRES=1 on a machine with npm run fetch-data -- --hires');
}

// --- 240 m only: catalogue sites come precomputed
const hc = await health(BASE);
check('server without fine grids reports 240 m and its precomputed horizons', hc.resolutionsM.join() === '240' && hc.precomputed >= 36, JSON.stringify(hc));
const { browser, page, errors } = await open(RIDGE);
let model = await text(page, '.status-site .model');
check('240 m server: a catalogue site states 20 m, precomputed', model.includes('LOLA de 20 m (precalculado)'), model);
const source = await text(page, '.status-site .status-source');
check('ridge shows published coordinates and their source', source.includes('Coordenadas publicadas') && source.includes('Gläser'), source);
if (fineRow) check('the precomputed horizon gives the same scenario figures as the fine grids', (await row(page)) === fineRow);
await shot(page.locator('.status'), 's06-status');

await page.getByRole('button', { name: 'Malapert Massif' }).click();
await page.waitForTimeout(1500);
const malapert = await row(page);
const malapertSource = await text(page, '.status-site .status-source');
check('Malapert is a representative point of an Artemis III region', malapertSource.includes('Punto representativo') && malapertSource.includes('Artemis III'), malapertSource);
check('Malapert summit: 100% light and 100% link in the 30-day mission', /100% .*100%/.test(malapert), malapert.slice(0, 120));
await page.getByRole('button', { name: 'Apollo 11' }).click();
await page.waitForTimeout(1200);
check('outside coverage the smooth Moon is announced', (await text(page, '.status-site .model')).includes('Luna lisa'));

// a custom point has no precomputed horizon
await goto(page, '?s=-89.5,-130@2026-11-14T00:00~30~2&a=0&l=es');
model = await text(page, '.status-site .model');
check('240 m server: a custom point states 240 m', model.includes('LOLA de 240 m') && !model.includes('precalculado'), model);
check('a custom point shows no source line', (await page.locator('.status-site .status-source').count()) === 0);

// English
await goto(page, '?s=ridge@2026-11-14T00:00~30~2&a=0&l=en');
model = await text(page, '.status-site .model');
check('English wording', model.includes('20 m LOLA topography (precomputed)') && (await text(page, '.status-site .status-source')).includes('Published coordinates'), model);

// narrow screen: no horizontal overflow
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(600);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
check('no horizontal overflow at 390 px', overflow <= 0, String(overflow));

await browser.close();
done([...errs, ...errors]);
