// Number input shared by the engineering blocks (S08, S09).
import { useEffect, useState } from 'react';

interface FieldProps {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onCommit: (v: number) => void;
}

/** A number input that keeps what is being typed and commits only valid values. */
export function NumberField({ label, unit, value, min, max, step = 1, onCommit }: FieldProps) {
  const [text, setText] = useState(String(value));
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!editing) setText(String(value));
  }, [value, editing]);
  const valid = (v: number) => Number.isFinite(v) && v >= min && v <= max;
  return (
    <label className="field">
      <span>{label}</span>
      <span className="field-input">
        <input
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={text}
          aria-label={`${label} (${unit})`}
          aria-invalid={!valid(Number(text))}
          onFocus={() => setEditing(true)}
          onBlur={() => setEditing(false)}
          onChange={(e) => {
            setText(e.target.value);
            const v = Number(e.target.value);
            if (e.target.value.trim() !== '' && valid(v)) onCommit(v);
          }}
        />
        <span className="unit">{unit}</span>
      </span>
    </label>
  );
}
