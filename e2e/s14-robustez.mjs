// S14: keyboard, adaptive quality, corrupted saved state and a server that goes away.
import { check, done, goto, open, ready, text } from './lib.mjs';

const { browser, ctx, page, errors } = await open();
const map = page.locator('.polar');
const scale = () => page.locator('.polar .scalebar').evaluate((e) => Math.round(e.getBoundingClientRect().width)); // a round distance; its bar changes length
const markerX = () => page.locator('.polar .marker').first().evaluate((g) => g.getBoundingClientRect().left);

// the polar map works with the keyboard
await map.focus();
const s0 = await scale();
await page.keyboard.press('+');
await page.waitForTimeout(300);
check('+ zooms the map in', (await scale()) !== s0, `${s0} -> ${await scale()}`);
const x0 = await markerX();
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(300);
check('arrows move it', Math.abs((await markerX()) - x0) > 5, `${x0.toFixed(0)} -> ${(await markerX()).toFixed(0)} px`);
await page.keyboard.press('0');
await page.waitForTimeout(300);
check('0 shows the whole pole again', (await scale()) === s0);
check('the map says how to use it', (await map.getAttribute('aria-label')).includes('Flechas'));

// focus is visible on the controls
await page.locator('button[aria-controls="hero-body"]').focus();
await page.keyboard.press('Shift+Tab');
await page.keyboard.press('Tab');
const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
check('a control focused with the keyboard shows it', outline !== 'none', outline);

// adaptive quality: on a slow machine playback lowers it, and a pause brings it back.
// The processor is slowed down eight times to make frames slow on any machine.
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 8 });
await page.getByRole('button', { name: 'Reproducir' }).click();
let lowest = 0;
for (let i = 0; i < 20; i++) {
  await page.waitForTimeout(500);
  lowest = Math.max(lowest, Number(await map.getAttribute('data-quality')));
}
await page.getByRole('button', { name: 'Pausar' }).click();
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
check('slow frames during playback lower the quality of the shadow map', lowest > 0, `level ${lowest}`);
await page.waitForTimeout(2500);
check('a pause brings it back to full quality', (await map.getAttribute('data-quality')) === '0');

// a corrupted or older saved state is ignored
for (const saved of ['{"hero":"x","bogus":1,"when":false}', '{not json', '[true]']) {
  await page.evaluate((v) => localStorage.setItem('lumina.panels', v), saved);
  await page.reload({ waitUntil: 'networkidle' });
  await ready(page);
  const heroOpen = !((await page.locator('#hero-body').getAttribute('class')) || '').includes('is-closed');
  check(`saved state ${saved} does not break the app`, heroOpen && (await page.locator('table.scenarios tbody tr').count()) === 4);
}
await page.evaluate(() => localStorage.clear());

// the server goes away in the middle of a session
const lone = await ctx.newPage(); // its network errors are expected, so they are not counted
await lone.goto(page.url(), { waitUntil: 'networkidle' });
await ready(lone);
await lone.route('**/api/**', (route) => route.abort());
await goto(lone, '?s=-88.5,45@2026-11-14T00:00~30~2&a=0&l=es');
check('without the server the app keeps working on a smooth Moon, and says so', (await text(lone, '.status-site .model')).includes('Sin conexión con el servidor de terreno') && (await lone.locator('table.scenarios tbody tr').count()) === 1);
await lone.close();

await browser.close();
done(errors);
