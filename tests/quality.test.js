// S14: contrast of the text colours and robustness of the remembered state.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { mergeStored } from '../src/lib/util';

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

const token = (name) => css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))[1];
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe('text contrast (WCAG AA, 4.5:1 for small text)', () => {
  for (const text of ['dust', 'dust-2', 'dust-3']) {
    for (const ground of ['chassis', 'raised', 'void']) {
      it(`--${text} on --${ground}`, () => expect(contrast(token(text), token(ground))).toBeGreaterThanOrEqual(4.5));
    }
  }
});

describe('remembered panels', () => {
  const defaults = { hero: true, when: true, compare: true };
  it('keeps what was saved', () => {
    expect(mergeStored(defaults, { hero: false })).toEqual({ hero: false, when: true, compare: true });
  });
  it('ignores unknown keys and values of another type', () => {
    expect(mergeStored(defaults, { hero: 'x', bogus: 1, when: false })).toEqual({ hero: true, when: false, compare: true });
  });
  it('ignores anything that is not an object', () => {
    for (const bad of [null, 5, 'open', [true, false]]) expect(mergeStored(defaults, bad)).toEqual(defaults);
  });
  it('gives panels added by a later version their default', () => {
    expect(mergeStored({ ...defaults, power: true }, { hero: false })).toMatchObject({ power: true, hero: false });
  });
});
