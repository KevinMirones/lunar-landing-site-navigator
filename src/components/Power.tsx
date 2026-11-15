// "Energía" block of the site status (S08): a few inputs for a generic lander and
// what they give on the active scenario. The figures come from src/lib/power.ts.
import type { PanelKind, PowerConfig, PowerResult } from '../lib/power';
import { fmtDate, fmtDuration, useLang, useTr } from '../lib/util';
import { NumberField } from './NumberField';

const HOUR = 3600e3;
const DAY = 24 * HOUR;

/** Two significant figures: the inputs do not deserve more. */
export function sig2(x: number): string {
  return x === 0 ? '0' : String(Number(x.toPrecision(2)));
}
export const fmtWatts = (w: number) => (w >= 1000 ? `${sig2(w / 1000)} kW` : `${sig2(w)} W`);
export const fmtWattHours = (wh: number) => (wh >= 1000 ? `${sig2(wh / 1000)} kWh` : `${sig2(wh)} Wh`);

interface Props {
  config: PowerConfig;
  onChange: (c: PowerConfig) => void;
  /** Null while the active scenario is still computing. */
  result: PowerResult | null;
  landing: number;
  now: number;
}

export function Power({ config, onChange, result, landing, now }: Props) {
  const tr = useTr();
  const lang = useLang();
  const set = (patch: Partial<PowerConfig>) => onChange({ ...config, ...patch });
  const panels: Array<[PanelKind, string]> = [
    ['tracker', tr('Seguidor', 'Tracker')],
    ['horizontal', tr('Horizontal', 'Horizontal')],
    ['tilted', tr('Inclinado', 'Tilted')],
  ];
  const at = result ? Math.min(result.powerW.length - 1, Math.max(0, Math.round((now - result.t0) / result.stepMs))) : 0;

  let verdict = '';
  if (result) {
    if (result.survives) {
      verdict =
        result.minBatteryWh === 0
          ? tr('Sobrevive: los paneles cubren el consumo toda la misión.', 'Survives: the panels cover the load all mission.')
          : tr(`Sobrevive la noche más larga, con un ${Math.round(result.margin * 100)}% de margen.`, `Survives the longest night, with a ${Math.round(result.margin * 100)}% margin.`);
    } else {
      const day = Math.floor((result.depletedAt! - landing) / DAY);
      const left = result.nextSunAt !== null ? fmtDuration(result.nextSunAt - result.depletedAt!) : null;
      verdict = left
        ? tr(`No sobrevive: la batería se agota el día ${day}, ${left} antes de que vuelva el Sol.`, `Does not survive: the battery runs out on day ${day}, ${left} before the Sun returns.`)
        : tr(`No sobrevive: la batería se agota el día ${day} y el Sol no vuelve antes del fin de la misión.`, `Does not survive: the battery runs out on day ${day} and the Sun does not return before the mission ends.`);
    }
  }

  return (
    <div className="power">
      <p className="power-note">{tr('Valores de ejemplo de un módulo pequeño genérico, no los de una misión concreta.', 'Example values for a small generic lander, not those of any real mission.')}</p>
      <div className="power-inputs">
        <div className="segmented" role="group" aria-label={tr('Tipo de panel', 'Panel type')}>
          {panels.map(([kind, label]) => (
            <button key={kind} type="button" aria-pressed={config.panel === kind} onClick={() => set({ panel: kind })}>
              {label}
            </button>
          ))}
        </div>
        {config.panel === 'tilted' && (
          <div className="field-row">
            <NumberField label={tr('Inclinación', 'Tilt')} unit="°" value={config.tiltDeg} min={0} max={90} onCommit={(tiltDeg) => set({ tiltDeg })} />
            <NumberField label={tr('Orientación', 'Facing')} unit="°" value={config.azimuthDeg} min={0} max={359} onCommit={(azimuthDeg) => set({ azimuthDeg })} />
          </div>
        )}
        <div className="field-row">
          <NumberField label={tr('Área', 'Area')} unit="m²" value={config.areaM2} min={0.01} max={1000} step={0.1} onCommit={(areaM2) => set({ areaM2 })} />
          <NumberField label={tr('Eficiencia', 'Efficiency')} unit="%" value={Math.round(config.efficiency * 1000) / 10} min={0.1} max={100} onCommit={(e) => set({ efficiency: e / 100 })} />
        </div>
        <div className="field-row">
          <NumberField label={tr('En operación', 'Operating')} unit="W" value={config.loadW} min={0} max={100000} onCommit={(loadW) => set({ loadW })} />
          <NumberField label={tr('En hibernación', 'Hibernating')} unit="W" value={config.hibernateW} min={0} max={100000} onCommit={(hibernateW) => set({ hibernateW })} />
        </div>
        <div className="field-row">
          <NumberField label={tr('Batería', 'Battery')} unit="Wh" value={config.batteryWh} min={0} max={100000000} step={100} onCommit={(batteryWh) => set({ batteryWh })} />
        </div>
      </div>

      {result ? (
        <>
          <p className={`power-verdict ${result.survives ? 'ok' : 'bad'}`} role="status">
            {verdict}
          </p>
          <dl className="power-figures">
            <dt>{tr('Potencia ahora', 'Power now')}</dt>
            <dd className="num">{fmtWatts(result.powerW[at])}</dd>
            <dt>{tr('Energía media', 'Mean energy')}</dt>
            <dd className="num">
              {fmtWattHours(result.meanDailyWh)} {tr('al día', 'a day')}
            </dd>
            <dt>{tr('Batería mínima', 'Minimum battery')}</dt>
            <dd className="num">{fmtWattHours(result.minBatteryWh)}</dd>
          </dl>
          {result.eclipses.length > 0 && (
            <ul className="power-eclipses">
              {result.eclipses.map((e) => (
                <li key={e.peakAt}>
                  {e.totalMs > 0
                    ? tr(
                        `${fmtDate(e.peakAt, lang, false)}: la Tierra tapa el Sol por completo durante ${fmtDuration(e.totalMs)}. Sin generación en ese tramo.`,
                        `${fmtDate(e.peakAt, lang, false)}: Earth covers the whole Sun for ${fmtDuration(e.totalMs)}. No generation meanwhile.`,
                      )
                    : tr(
                        `${fmtDate(e.peakAt, lang, false)}: la Tierra tapa hasta el ${Math.round(e.maxCover * 100)}% del Sol durante ${fmtDuration(e.end - e.start)}.`,
                        `${fmtDate(e.peakAt, lang, false)}: Earth covers up to ${Math.round(e.maxCover * 100)}% of the Sun for ${fmtDuration(e.end - e.start)}.`,
                      )}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="empty">{tr('Calculando…', 'Computing…')}</p>
      )}
      <p className="power-assumptions">
        {tr(
          'Supuestos: sin polvo, sin degradación del panel, sin efecto de la temperatura y batería cargada al alunizar. El consumo es el de operación con Sol y el de hibernación sin él.',
          'Assumptions: no dust, no panel degradation, no temperature effect and a full battery at landing. The load is the operating one in sunlight and the hibernation one without it.',
        )}
      </p>
    </div>
  );
}
