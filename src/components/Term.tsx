// An underlined term with a short definition (S12 glossary). It is a button, so it
// works with the keyboard and screen readers; Escape or a click elsewhere closes it.
import { useEffect, useId, useRef, useState } from 'react';
import { GLOSSARY, type GlossaryId } from '../lib/glossary';
import { useLang } from '../lib/util';

export function Term({ id, children }: { id: GlossaryId; children?: React.ReactNode }) {
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLSpanElement>(null);
  const tipId = useId();
  const entry = GLOSSARY[id];

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', close);
    document.addEventListener('pointerdown', close);
    return () => {
      document.removeEventListener('keydown', close);
      document.removeEventListener('pointerdown', close);
    };
  }, [open]);

  return (
    <span className="term-box" ref={box}>
      <button type="button" className="term" aria-expanded={open} aria-describedby={open ? tipId : undefined} onClick={(e) => (e.stopPropagation(), setOpen((o) => !o))}>
        {children ?? entry.term[lang]}
      </button>
      {open && (
        <span id={tipId} role="tooltip" className="term-tip">
          <b>{entry.term[lang]}.</b> {entry.definition[lang]}
        </span>
      )}
    </span>
  );
}
