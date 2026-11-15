// S10: CSV downloads and the printable report.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { check, done, open } from './lib.mjs';

const { browser, page, errors } = await open();
const rows = page.locator('table.scenarios tbody tr');
const pctOf = (t) => Number(String(t).match(/(\d+)%/)?.[1]);

async function grab(name) {
  const [file] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name }).click()]);
  return { name: file.suggestedFilename(), text: readFileSync(await file.path(), 'utf8') };
}

// windows
const windows = await grab('Descargar ventanas (CSV)');
const wl = windows.text.replace(/^﻿/, '').trim().split(/\r\n/);
check('the windows file is named after the export and the day', /^lumina-ventanas-\d{4}-\d{2}-\d{2}\.csv$/.test(windows.name), windows.name);
check('it starts with a byte order mark, so Excel reads the accents', windows.text.startsWith('﻿'));
check('Spanish: columns separated by ";"', wl[0] === 'escenario;sitio;latitud;longitud;alunizaje_utc;duracion_d;mastil_m;evento;inicio_utc;fin_utc;duracion_h;estacion', wl[0]);
const firstSun = (await rows.nth(0).locator('td.num').first().innerText()).trim();
const hours = wl.filter((l) => l.startsWith('1;') && l.split(';')[7] === 'luz_solar').reduce((s, l) => s + Number(l.split(';')[10].replace(',', '.')), 0);
check('sunlight hours add up to the share in the table (criterion 2)', Math.abs((hours / (30 * 24)) * 100 - pctOf(firstSun)) <= 1, `${hours.toFixed(1)} h vs ${firstSun}`);

// comparison
const comparison = await grab('Descargar comparación (CSV)');
const cl = comparison.text.replace(/^﻿/, '').trim().split(/\r\n/);
check('the comparison has one row per scenario (criterion 3)', cl.length === 1 + (await rows.count()), `${cl.length - 1} rows`);
const index = (await rows.nth(1).locator('.score-cell').innerText()).trim();
check('with the figures of the table', cl[2].split(';')[11] === index, `${cl[2].split(';')[11]} vs ${index}`);

// the report: the print dialog is replaced, and the report is kept to print it as PDF
await page.evaluate(() => {
  window.__printed = 0;
  window.print = () => {
    window.__printed++;
    window.__report = document.querySelector('.report')?.outerHTML ?? '';
  };
});
await page.getByRole('button', { name: 'Imprimir informe' }).click();
await page.waitForFunction(() => window.__printed === 1, null, { timeout: 5000 });
const report = await page.evaluate(() => window.__report);
check('"Imprimir informe" opens the print dialog with the report', report.includes('LUMINA: comparación de escenarios'));
check('the report gives the terrain and the criteria used (criterion 4)', report.includes('LOLA 20 m') && report.includes('2% del disco del Sol') && report.includes('medio disco de la Tierra'));
check('and the link to open the comparison again', report.includes('?s=ridge@2026-11-14T00:00'));
await page.waitForTimeout(800);
check('the report goes once printed', (await page.locator('.report').count()) === 0);

// four scenarios on one A4 page (criterion 3)
await page.evaluate((html) => document.body.insertAdjacentHTML('beforeend', html), report);
const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
mkdirSync(new URL('./shots/', import.meta.url), { recursive: true });
writeFileSync(new URL('./shots/s10-report.pdf', import.meta.url), pdf); // for a look by eye
const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
check('four scenarios fit on one A4 page', pages === 1, `${pages} pages`);

// English
await page.goto(page.url().replace('l=es', 'l=en'), { waitUntil: 'networkidle' });
await page.waitForFunction(() => [...document.querySelectorAll('table.scenarios tbody tr')].every((r) => /\d+%/.test(r.textContent || '')));
const en = await grab('Download windows (CSV)');
check('English: columns separated by ","', en.text.replace(/^﻿/, '').startsWith('scenario,site,latitude') && en.name.startsWith('lumina-windows-'), en.name);

await browser.close();
done(errors);
