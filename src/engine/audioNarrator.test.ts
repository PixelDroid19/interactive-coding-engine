import { describe, expect, it } from 'vitest';
import { splitCaptionText } from './audioNarrator';

describe('splitCaptionText', () => {
  it('mantiene frases breves y divide narraciones largas sin perder palabras', () => {
    const text = 'Primera frase breve. Segunda frase con una explicación adicional. Tercera frase para cerrar.';
    const chunks = splitCaptionText(text, 45);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 45)).toBe(true);
    expect(chunks.join(' ')).toBe(text);
  });

  it('divide una oración larga por palabras cuando no tiene pausas', () => {
    const text = 'Esta narración deliberadamente extensa necesita caber en el editor sin cubrir toda la zona de trabajo del estudiante';
    const chunks = splitCaptionText(text, 38);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join(' ')).toBe(text);
  });
});
