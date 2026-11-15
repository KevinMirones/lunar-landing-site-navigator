// CSV exports (docs/specs/S10-exportacion.md). Pure functions that return text;
// the browser turns it into a download. Spanish uses ";" and a decimal comma, English
// "," and a point, so each opens in columns in Excel with that regional setting.
import type { CommsResult } from './comms';
import type { PowerResult } from './power';
import type { Scenario } from './scenario';
import type { Interval, Metrics } from './series';
import type { Lang } from './sites';

export interface ExportRow {
  scenario: Scenario;
  site: { name: string; lat: number; lon: number };
  metrics: Metrics;
  power?: PowerResult | null;
  contact?: CommsResult | null;
}

const BOM = '﻿';
const HOUR = 3600e3;

const iso = (t: number) => new Date(t).toISOString().slice(0, 16) + 'Z';

function formatter(lang: Lang) {
  const sep = lang === 'es' ? ';' : ',';
  const num = (x: number, digits: number) => {
    const s = x.toFixed(digits);
    return lang === 'es' ? s.replace('.', ',') : s;
  };
  const cell = (v: string | number) => {
    const s = String(v);
    return s.includes(sep) || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const line = (cells: Array<string | number>) => cells.map(cell).join(sep);
  return { num, line };
}

const WINDOW_HEADERS: Record<Lang, string[]> = {
  es: ['escenario', 'sitio', 'latitud', 'longitud', 'alunizaje_utc', 'duracion_d', 'mastil_m', 'evento', 'inicio_utc', 'fin_utc', 'duracion_h', 'estacion'],
  en: ['scenario', 'site', 'latitude', 'longitude', 'landing_utc', 'duration_d', 'mast_m', 'event', 'start_utc', 'end_utc', 'duration_h', 'station'],
};
const EVENTS: Record<Lang, Record<'sun' | 'link' | 'contact' | 'eclipse', string>> = {
  es: { sun: 'luz_solar', link: 'enlace', contact: 'contacto', eclipse: 'eclipse' },
  en: { sun: 'sunlight', link: 'link', contact: 'contact', eclipse: 'eclipse' },
};

/** One row per window of every scenario: sunlight, link, contact (with its station) and eclipses. */
export function windowsCsv(rows: ExportRow[], lang: Lang): string {
  const { num, line } = formatter(lang);
  const out = [line(WINDOW_HEADERS[lang])];
  rows.forEach((r, k) => {
    const head = [k + 1, r.site.name, num(r.site.lat, 5), num(r.site.lon, 5), iso(r.scenario.landing), r.scenario.durationDays, r.scenario.mast];
    const add = (event: string, ivs: Interval[], station = '') => {
      for (const iv of ivs) out.push(line([...head, event, iso(iv.start), iso(iv.end), num((iv.end - iv.start) / HOUR, 2), station]));
    };
    add(EVENTS[lang].sun, r.metrics.sunIntervals);
    add(EVENTS[lang].link, r.metrics.earthIntervals);
    for (const st of r.contact?.byStation ?? []) add(EVENTS[lang].contact, st.intervals, st.name === 'own' ? (lang === 'es' ? 'propia' : 'own') : st.name);
    add(EVENTS[lang].eclipse, r.power?.eclipses ?? []);
  });
  return BOM + out.join('\r\n') + '\r\n';
}

const COMPARISON_HEADERS: Record<Lang, string[]> = {
  es: ['escenario', 'sitio', 'latitud', 'longitud', 'alunizaje_utc', 'duracion_d', 'mastil_m', 'luz_solar_pct', 'noche_mas_larga_h', 'enlace_pct', 'ambos_pct', 'indice', 'bateria_minima_wh', 'bateria_basta', 'contacto_h_dia'],
  en: ['scenario', 'site', 'latitude', 'longitude', 'landing_utc', 'duration_d', 'mast_m', 'sunlight_pct', 'longest_night_h', 'link_pct', 'both_pct', 'index', 'min_battery_wh', 'battery_enough', 'contact_h_day'],
};

/** The scenario table as it is on screen, one row per scenario. */
export function comparisonCsv(rows: ExportRow[], lang: Lang): string {
  const { num, line } = formatter(lang);
  const yes = lang === 'es' ? 'sí' : 'yes';
  const no = 'no';
  const out = [line(COMPARISON_HEADERS[lang])];
  rows.forEach((r, k) => {
    const m = r.metrics;
    out.push(
      line([
        k + 1,
        r.site.name,
        num(r.site.lat, 5),
        num(r.site.lon, 5),
        iso(r.scenario.landing),
        r.scenario.durationDays,
        r.scenario.mast,
        Math.round(m.sunShare * 100),
        num(m.longestDarkMs / HOUR, 1),
        Math.round(m.earthShare * 100),
        Math.round(m.bothShare * 100),
        m.score,
        r.power ? Math.round(r.power.minBatteryWh) : '',
        r.power ? (r.power.survives ? yes : no) : '',
        r.contact ? num(r.contact.contactHoursPerDay, 1) : '',
      ]),
    );
  });
  return BOM + out.join('\r\n') + '\r\n';
}

/** lumina-ventanas-2026-11-15.csv, lumina-windows-2026-11-15.csv, … */
export function exportName(kind: 'windows' | 'comparison', lang: Lang, now = Date.now()): string {
  const word = kind === 'windows' ? (lang === 'es' ? 'ventanas' : 'windows') : lang === 'es' ? 'comparacion' : 'comparison';
  return `lumina-${word}-${new Date(now).toISOString().slice(0, 10)}.csv`;
}
