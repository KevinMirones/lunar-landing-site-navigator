// Exports of the comparison (S10): two CSV downloads and a one-page printable
// report. Everything is built in the browser; the report is printed with the
// browser's own dialog, which can save it as PDF.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CommsConfig } from '../lib/comms';
import { comparisonCsv, exportName, windowsCsv, type ExportRow } from '../lib/export';
import type { Horizon } from '../lib/series';
import { fmtDate, fmtDuration, fmtLatLon, pct, useLang, useTr } from '../lib/util';
import type { ScenarioRow } from './Panels';
import { fmtWattHours } from './Power';
import { WindowStrip } from './Timeline';

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const ready = (rows: ScenarioRow[]): ExportRow[] => rows.filter((r) => r.metrics).map((r) => ({ scenario: r.scenario, site: r.site, metrics: r.metrics!, power: r.power, contact: r.contact }));

interface ReportData {
  rows: ScenarioRow[];
  /** Terrain horizon of each scenario, by scenario id. */
  horizons: Map<string, Horizon | undefined>;
  spanMs: number;
  link: string;
  comms: CommsConfig;
}

export function ExportButtons({ rows, ...report }: ReportData) {
  const tr = useTr();
  const lang = useLang();
  const [printing, setPrinting] = useState(false);
  const complete = rows.every((r) => r.metrics);
  return (
    <div className="export-buttons" data-level="expert">
      <button type="button" disabled={!complete} onClick={() => download(exportName('windows', lang), windowsCsv(ready(rows), lang))}>
        {tr('Descargar ventanas (CSV)', 'Download windows (CSV)')}
      </button>
      <button type="button" disabled={!complete} onClick={() => download(exportName('comparison', lang), comparisonCsv(ready(rows), lang))}>
        {tr('Descargar comparación (CSV)', 'Download comparison (CSV)')}
      </button>
      <button type="button" disabled={!complete} onClick={() => setPrinting(true)}>
        {tr('Imprimir informe', 'Print report')}
      </button>
      {printing && <Report rows={rows} {...report} onDone={() => setPrinting(false)} />}
    </div>
  );
}

/**
 * Mounted only to print: opens the print dialog once drawn, and goes when it closes.
 * It lives directly under <body> so the print stylesheet can drop the whole app.
 */
function Report({ rows, horizons, spanMs, link, comms, onDone }: ReportData & { onDone: () => void }) {
  const tr = useTr();
  const lang = useLang();
  useEffect(() => {
    const finish = () => onDone();
    window.addEventListener('afterprint', finish);
    const id = window.setTimeout(() => {
      window.print();
      // Some browsers never fire afterprint when the dialog is skipped.
      window.setTimeout(finish, 500);
    }, 100);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('afterprint', finish);
    };
  }, [onDone]);

  const terrain = (h: Horizon | undefined) =>
    !h ? '—' : h.model === 'lola' ? tr(`LOLA ${h.resolutionM ?? 240} m${h.precomputed ? ', precalculado' : ''}`, `LOLA ${h.resolutionM ?? 240} m${h.precomputed ? ', precomputed' : ''}`) : tr('Luna lisa', 'smooth Moon');
  const network = comms.network === 'dsn' ? tr('Red del Espacio Profundo de NASA', 'NASA Deep Space Network') : tr(`una estación en ${comms.station.lat}°, ${comms.station.lon}°`, `one station at ${comms.station.lat}°, ${comms.station.lon}°`);

  return createPortal(
    <article className="report" aria-hidden="true">
      <header>
        <h1>{tr('LUMINA: comparación de escenarios', 'LUMINA: scenario comparison')}</h1>
        <p>
          {tr('Generado el', 'Generated on')} {fmtDate(Date.now(), lang)}. {tr('Para volver a abrirla:', 'To open it again:')} <span className="report-link">{link}</span>
        </p>
      </header>
      <table>
        <thead>
          <tr>
            <th>{tr('Sitio', 'Site')}</th>
            <th>{tr('Alunizaje', 'Landing')}</th>
            <th>{tr('Ventanas por día de misión', 'Windows by mission day')}</th>
            <th>{tr('Luz', 'Light')}</th>
            <th>{tr('Noche más larga', 'Longest night')}</th>
            <th>{tr('Enlace', 'Link')}</th>
            <th>{tr('Índice', 'Index')}</th>
            <th>{tr('Batería mínima', 'Min. battery')}</th>
            {comms.network !== 'none' && <th>{tr('Contacto', 'Contact')}</th>}
            <th>{tr('Terreno', 'Terrain')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ scenario: sc, site, metrics: m, power: p, contact: c }) => (
            <tr key={sc.id}>
              <th scope="row">
                {site.name}
                <span>{fmtLatLon(site.lat, site.lon)}</span>
              </th>
              <td>
                {fmtDate(sc.landing, lang)}
                <span>
                  {sc.durationDays} d, {tr('mástil', 'mast')} {sc.mast} m
                </span>
              </td>
              <td className="report-strip">{m && <WindowStrip metrics={m} landing={sc.landing} spanMs={spanMs} durationMs={sc.durationDays * 86400e3} elapsed={Infinity} />}</td>
              <td>{m ? pct(m.sunShare) : '—'}</td>
              <td>{m ? (m.longestDarkMs > 0 ? fmtDuration(m.longestDarkMs) : tr('ninguna', 'none')) : '—'}</td>
              <td>{m ? pct(m.earthShare) : '—'}</td>
              <td>{m ? m.score : '—'}</td>
              <td>{p ? `${fmtWattHours(p.minBatteryWh)} ${p.survives ? tr('(basta)', '(enough)') : tr('(no basta)', '(not enough)')}` : '—'}</td>
              {comms.network !== 'none' && <td>{c ? `${c.contactHoursPerDay.toFixed(1)} ${tr('h/día', 'h/day')}` : '—'}</td>}
              <td>{terrain(horizons.get(sc.id))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer>
        <p>
          {tr(
            `Criterios: hay luz solar cuando se ve al menos el 2% del disco del Sol sobre el terreno; hay enlace cuando medio disco de la Tierra supera el terreno${comms.marginDeg ? ` en ${comms.marginDeg}°` : ''}${comms.network === 'none' ? '' : `; contacto: ${network}, con la Luna a más de 10° sobre la estación`}. Batería: módulo genérico del bloque Energía, cargado al alunizar.`,
            `Criteria: sunlight when at least 2% of the Sun's disc clears the terrain; link when half of Earth's disc clears the terrain${comms.marginDeg ? ` by ${comms.marginDeg}°` : ''}${comms.network === 'none' ? '' : `; contact: ${network}, with the Moon over 10° above the station`}. Battery: the generic lander of the Power block, fully charged at landing.`,
          )}
        </p>
        <p>
          {tr(
            'Límites: terreno real solo de 80°S a 90°S, con celdas de 20 a 240 m (no se ven rocas ni relieve de pocos metros); enlace geométrico, sin antenas; el índice es orientativo. Herramienta de apoyo a la planificación: no sustituye un análisis de misión. Datos: LOLA (NASA GSFC, PDS); efemérides validadas contra JPL Horizons.',
            'Limits: real terrain only from 80°S to 90°S, with 20 to 240 m cells (no boulders or metre-scale relief); geometric link, no antennas; the index is indicative. A planning aid: it does not replace a mission analysis. Data: LOLA (NASA GSFC, PDS); ephemeris validated against JPL Horizons.',
          )}
        </p>
      </footer>
    </article>,
    document.body,
  );
}
