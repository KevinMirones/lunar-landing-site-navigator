// Builds docs/README.md, the index of specs and project history, from the
// front matter of each Markdown file. The index is never edited by hand:
// change a spec's `estado` and run `npm run docs:index`.
//
// Every document holds English first and Spanish below, and so does the index:
// `title` and `summary` are the English of `titulo` and `resumen`. The values of
// `estado`, `prioridad` and `tipo` stay in Spanish in the files and are shown in
// English in the English half.
//
//   node scripts/build-docs-index.mjs          write the index
//   node scripts/build-docs-index.mjs --check  fail if the index is stale or a doc is invalid
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DOCS = fileURLToPath(new URL('../docs/', import.meta.url));
const INDEX = join(DOCS, 'README.md');

const ESTADOS = ['pendiente', 'en curso', 'hecha', 'recortada'];
const PRIORIDADES = ['imprescindible', 'recortable'];
const TIPOS = ['hito', 'decisión', 'hallazgo', 'incidencia'];
const EN = {
  pendiente: 'pending',
  'en curso': 'in progress',
  hecha: 'done',
  recortada: 'cut',
  imprescindible: 'essential',
  recortable: 'can be cut',
  hito: 'milestone',
  decisión: 'decision',
  hallazgo: 'finding',
  incidencia: 'incident',
};
const en = (value) => EN[value] ?? value;

// Documents that are not specs or history entries. Missing files are skipped.
const OTHER = [
  ['../README.md', 'README del proyecto', 'Qué es LUMINA, cómo funciona y cómo arrancarlo.', 'Project README', 'What LUMINA is, how it works and how to start it.'],
  ['PLAN.md', 'Plan de implementación', 'Qué está hecho, qué falta y en qué orden; reparto, reglas de trabajo, recortes y riesgos.', 'Implementation plan', 'What is done, what is left and in what order; tracks, working rules, cuts and risks.'],
  ['PITCH.md', 'Guion para el jurado', 'Problema, resultados, demostración de tres minutos y preguntas probables.', 'Pitch for the jury', 'Problem, results, three-minute demo and likely questions.'],
  ['VALIDACION.md', 'Validación científica', 'Comparación de los resultados de LUMINA con valores publicados.', 'Scientific validation', "Comparison of LUMINA's results with published values."],
];

const errors = [];

function read(dir) {
  const folder = join(DOCS, dir);
  if (!existsSync(folder)) return [];
  return readdirSync(folder)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .sort()
    .map((file) => {
      const path = join(folder, file);
      const text = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
      const meta = {};
      const m = text.match(/^---\n([\s\S]*?)\n---\n/);
      if (!m) errors.push(`${dir}/${file}: falta la cabecera entre líneas "---"`);
      for (const line of m ? m[1].split('\n') : []) {
        const i = line.indexOf(':');
        if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
      }
      checkLinks(`${dir}/${file}`, path, text);
      return { file, rel: `${dir}/${file}`, meta };
    });
}

/** Every relative link in a document must point at a file that exists. */
function checkLinks(label, path, text) {
  for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const file = target.split('#')[0];
    if (!file) continue;
    const full = resolve(dirname(path), file);
    if (full === resolve(INDEX)) continue; // the index is this script's own output
    if (!existsSync(full)) errors.push(`${label}: enlace roto a "${target}"`);
  }
}

function need(doc, keys) {
  for (const k of keys) if (!doc.meta[k]) errors.push(`${doc.rel}: falta "${k}" en la cabecera`);
}
function oneOf(doc, key, allowed) {
  if (doc.meta[key] && !allowed.includes(doc.meta[key])) {
    errors.push(`${doc.rel}: ${key} "${doc.meta[key]}" no es válido (${allowed.join(', ')})`);
  }
}

const specs = read('specs');
const ids = new Set();
for (const s of specs) {
  need(s, ['id', 'titulo', 'title', 'estado', 'dia', 'prioridad', 'depende', 'resumen', 'summary']);
  oneOf(s, 'estado', ESTADOS);
  oneOf(s, 'prioridad', PRIORIDADES);
  if (s.meta.id && !s.file.startsWith(`${s.meta.id}-`)) errors.push(`${s.rel}: el nombre del archivo debe empezar por "${s.meta.id}-"`);
  if (ids.has(s.meta.id)) errors.push(`${s.rel}: id "${s.meta.id}" repetido`);
  ids.add(s.meta.id);
}
const deps = (s) => (s.meta.depende && s.meta.depende !== '-' ? s.meta.depende.split(',').map((d) => d.trim()) : []);
for (const s of specs) for (const d of deps(s)) if (!ids.has(d)) errors.push(`${s.rel}: depende de "${d}", que no existe`);

const history = read('historial');
for (const h of history) {
  need(h, ['fecha', 'titulo', 'title', 'tipo', 'resumen', 'summary']);
  oneOf(h, 'tipo', TIPOS);
}
for (const [file] of OTHER) {
  const path = join(DOCS, file);
  if (existsSync(path)) checkLinks(file, path, readFileSync(path, 'utf8'));
}

const count = (estado) => specs.filter((s) => s.meta.estado === estado).length;
const byId = Object.fromEntries(specs.map((s) => [s.meta.id, s]));
const link = (s) => `[${s.meta.id}](${s.rel})`;

const depsOf = (s) =>
  deps(s)
    .map((d) => (byId[d] ? link(byId[d]) : d))
    .join(', ') || '—';
const others = OTHER.filter(([file]) => existsSync(join(DOCS, file)));
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const english = [
  '<a id="en"></a>',
  '**English** | [Español](#es)',
  '',
  '# LUMINA documentation',
  '',
  '> Index generated with `npm run docs:index` from the front matter of each file. Do not edit it by hand.',
  '',
  '## Where to start',
  '',
  ...others.map(([file, , , title, about]) => `- [${title}](${file}): ${about}`),
  '',
  '## Specs',
  '',
  `${specs.length} specs: ${ESTADOS.map((e) => `${count(e)} ${en(e)}`).join(', ')}.`,
  '',
  '| ID | Spec | Day | Priority | Status | Depends on |',
  '| --- | --- | --- | --- | --- | --- |',
  ...specs.map((s) => `| ${s.meta.id} | [${s.meta.title}](${s.rel})<br>${s.meta.summary} | ${s.meta.dia} | ${en(s.meta.prioridad)} | ${en(s.meta.estado)} | ${depsOf(s)} |`),
  '',
  '## Project history',
  '',
  'Most recent first.',
  '',
  '| Date | Entry | Type |',
  '| --- | --- | --- |',
  ...[...history].reverse().map((h) => `| ${h.meta.fecha} | [${h.meta.title}](${h.rel})<br>${h.meta.summary} | ${en(h.meta.tipo)} |`),
  '',
  '## How to maintain this',
  '',
  '- **Every document is bilingual:** English first, Spanish below. In the front matter, `title` and `summary` are the English of `titulo` and `resumen`.',
  '- **Changing the status of a spec:** edit `estado` in its front matter (`' + ESTADOS.join('`, `') + '`, that is: ' + ESTADOS.map(en).join(', ') + ') and run `npm run docs:index`.',
  '- **Adding a spec:** copy [specs/_plantilla.md](specs/_plantilla.md) with the next number (`S18-name.md`).',
  '- **Adding a history entry:** create `historial/YYYY-MM-DD-NN-name.md` with `fecha`, `titulo`, `title`, `tipo` (`' + TIPOS.join('`, `') + '`, that is: ' + TIPOS.map(en).join(', ') + '), `resumen` and `summary`.',
  '- **Checking:** `npm run docs:check` fails if the index is out of date, a field is missing or there is a broken link.',
];

const spanish = [
  '<a id="es"></a>',
  '**Español** | [English](#en)',
  '',
  '# Documentación de LUMINA',
  '',
  '> Índice generado con `npm run docs:index` a partir de la cabecera de cada archivo. No lo edites a mano.',
  '',
  '## Por dónde empezar',
  '',
  ...others.map(([file, title, about]) => `- [${title}](${file}): ${about}`),
  '',
  '## Specs',
  '',
  `${specs.length} specs: ${[plural(count('pendiente'), 'pendiente', 'pendientes'), `${count('en curso')} en curso`, plural(count('hecha'), 'hecha', 'hechas'), plural(count('recortada'), 'recortada', 'recortadas')].join(', ')}.`,
  '',
  '| ID | Spec | Día | Prioridad | Estado | Depende de |',
  '| --- | --- | --- | --- | --- | --- |',
  ...specs.map((s) => `| ${s.meta.id} | [${s.meta.titulo}](${s.rel})<br>${s.meta.resumen} | ${s.meta.dia} | ${s.meta.prioridad} | ${s.meta.estado} | ${depsOf(s)} |`),
  '',
  '## Historial del proyecto',
  '',
  'De lo más reciente a lo más antiguo.',
  '',
  '| Fecha | Entrada | Tipo |',
  '| --- | --- | --- |',
  ...[...history].reverse().map((h) => `| ${h.meta.fecha} | [${h.meta.titulo}](${h.rel})<br>${h.meta.resumen} | ${h.meta.tipo} |`),
  '',
  '## Cómo mantener esto',
  '',
  '- **Todos los documentos son bilingües:** primero en inglés y debajo en español. En la cabecera, `title` y `summary` son la versión en inglés de `titulo` y `resumen`.',
  '- **Cambiar el estado de una spec:** edita `estado` en su cabecera (`' + ESTADOS.join('`, `') + '`) y ejecuta `npm run docs:index`.',
  '- **Añadir una spec:** copia [specs/_plantilla.md](specs/_plantilla.md) con el siguiente número (`S18-nombre.md`).',
  '- **Añadir una entrada al historial:** crea `historial/AAAA-MM-DD-NN-nombre.md` con `fecha`, `titulo`, `title`, `tipo` (`' + TIPOS.join('`, `') + '`), `resumen` y `summary`.',
  '- **Comprobar:** `npm run docs:check` falla si el índice está desactualizado, falta un campo o hay un enlace roto.',
  '',
];

const lines = [...english, '', '---', '', ...spanish];
const output = lines.join('\n');

if (errors.length) {
  console.error(`Documentación con ${errors.length} problema(s):\n` + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
if (process.argv.includes('--check')) {
  const current = existsSync(INDEX) ? readFileSync(INDEX, 'utf8').replace(/\r\n/g, '\n') : '';
  if (current !== output) {
    console.error('docs/README.md está desactualizado. Ejecuta: npm run docs:index');
    process.exit(1);
  }
  console.log(`Documentación al día: ${specs.length} specs, ${history.length} entradas de historial.`);
} else {
  writeFileSync(INDEX, output);
  console.log(`docs/README.md generado: ${specs.length} specs, ${history.length} entradas de historial.`);
}
