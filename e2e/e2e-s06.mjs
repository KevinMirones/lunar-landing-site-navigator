import { open, check, done } from './e2e-lib.mjs';
const FINE = 'http://localhost:8790/';
const COARSE = 'http://localhost:8791/';
const health = async (b) => (await fetch(b + 'api/health')).json();
const hf = await health(FINE);
const hc = await health(COARSE);
check('server with fine grids reports them', hf.resolutionsM.join() === '20,40,80,240', hf.resolutionsM.join());
check('server without fine grids reports 240 m and its precomputed horizons', hc.resolutionsM.join() === '240' && hc.precomputed === 36, JSON.stringify(hc));

const text = async (page, sel) => ((await page.locator(sel).first().innerText()) || '').replace(/\s+/g, ' ');
const row = async (page) => text(page, 'table.scenarios tbody tr');

// --- fine grids
let { browser, page, errors } = await open(FINE + '?s=ridge@2026-11-14T00:00~30~2&a=0&l=es');
let model = await text(page, '.status-site .model');
check('fine: the site states 20 m terrain', model.includes('topografía LOLA de 20 m') && !model.includes('precalculado'), model);
let source = await text(page, '.status-site .status-source');
check('ridge shows published coordinates and their source', source.includes('Coordenadas publicadas') && source.includes('Gläser'), source);
const fineRow = await row(page);
await page.locator('.status').screenshot({ path: 'shots/s06-status.png' });
await page.getByRole('button', { name: 'Malapert Massif' }).click(); await page.waitForTimeout(1500);
model = await text(page, '.status-site .model');
source = await text(page, '.status-site .status-source');
check('Malapert states 40 m terrain', model.includes('LOLA de 40 m'), model);
check('Malapert is a representative point of an Artemis III region', source.includes('Punto representativo') && source.includes('Artemis III'), source);
const malapert = await row(page);
check('Malapert summit: 100% light and 100% link in the 30-day mission', /100% .*100%/.test(malapert), malapert.slice(0, 120));
await page.getByRole('button', { name: 'Apollo 11' }).click(); await page.waitForTimeout(1200);
check('outside coverage the smooth Moon is announced', (await text(page, '.status-site .model')).includes('Luna lisa'));
await browser.close();
const errs = [...errors];

// --- 240 m only: catalogue sites come precomputed
({ browser, page, errors } = await open(COARSE + '?s=ridge@2026-11-14T00:00~30~2&a=0&l=es'));
model = await text(page, '.status-site .model');
check('240 m server: a catalogue site states 20 m, precomputed', model.includes('LOLA de 20 m (precalculado)'), model);
const coarseRow = await row(page);
check('the precomputed horizon gives the same scenario figures as the fine grids', coarseRow === fineRow, `${coarseRow.slice(0, 90)} <> ${fineRow.slice(0, 90)}`);
// a custom point has no precomputed horizon
await page.goto(COARSE + '?s=-89.5,-130@2026-11-14T00:00~30~2&a=0&l=es', { waitUntil: 'networkidle' }); await page.waitForTimeout(1800);
model = await text(page, '.status-site .model');
check('240 m server: a custom point states 240 m', model.includes('LOLA de 240 m') && !model.includes('precalculado'), model);
check('a custom point shows no source line', (await page.locator('.status-site .status-source').count()) === 0);
// English
await page.goto(COARSE + '?s=ridge@2026-11-14T00:00~30~2&a=0&l=en', { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
model = await text(page, '.status-site .model');
check('English wording', model.includes('20 m LOLA topography (precomputed)') && (await text(page, '.status-site .status-source')).includes('Published coordinates'), model);
// narrow screen: no horizontal overflow
await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(600);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
check('no horizontal overflow at 390 px', overflow <= 0, String(overflow));
await browser.close();
done([...errs, ...errors]);
