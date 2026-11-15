// Card of the guided tour (S12). A non-modal dialog: the app stays visible and
// usable behind it. Arrow keys move between steps and Escape leaves.
import { useEffect, useRef } from 'react';
import { TOUR } from '../lib/tour';
import { useLang, useTr } from '../lib/util';

interface Props {
  step: number;
  onGo: (step: number) => void;
  onExit: () => void;
}

export function Tour({ step, onGo, onExit }: Props) {
  const tr = useTr();
  const lang = useLang();
  const card = useRef<HTMLDivElement>(null);
  const s = TOUR[step];
  const last = step === TOUR.length - 1;

  useEffect(() => {
    card.current?.focus();
  }, [step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // A focused control that used the key (the timeline, a text field) wins.
      if (e.defaultPrevented || (e.target instanceof HTMLElement && e.target.closest('input, textarea, select'))) return;
      if (e.key === 'Escape') onExit();
      else if (e.key === 'ArrowRight' && !last) onGo(step + 1);
      else if (e.key === 'ArrowLeft' && step > 0) onGo(step - 1);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, last, onGo, onExit]);

  return (
    <div ref={card} className="tour" role="dialog" aria-modal="false" aria-labelledby="tour-title" aria-describedby="tour-text" tabIndex={-1}>
      <p className="tour-count num">
        {tr('Paso', 'Step')} {step + 1} / {TOUR.length}
      </p>
      <h2 id="tour-title">{s.title[lang]}</h2>
      <p id="tour-text">{s.text[lang]}</p>
      <div className="tour-actions">
        <button type="button" onClick={() => onGo(step - 1)} disabled={step === 0}>
          {tr('Anterior', 'Previous')}
        </button>
        {last ? (
          <button type="button" className="primary" onClick={onExit}>
            {tr('Terminar', 'Finish')}
          </button>
        ) : (
          <button type="button" className="primary" onClick={() => onGo(step + 1)}>
            {tr('Siguiente', 'Next')}
          </button>
        )}
        <button type="button" className="tour-exit" onClick={onExit}>
          {tr('Salir', 'Exit')}
        </button>
      </div>
      <p className="tour-keys">{tr('Flechas para avanzar o volver, Escape para salir.', 'Arrow keys to move, Escape to leave.')}</p>
    </div>
  );
}
