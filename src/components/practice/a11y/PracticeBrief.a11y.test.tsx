import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PracticeBrief } from './PracticeBrief';

describe('PracticeBrief a11y', () => {
  it('anuncia la ayuda dinámica con aria-live polite sin alterar el diseño', () => {
    const markup = renderToStaticMarkup(
      <PracticeBrief
        action="Corrige la función total()."
        expected="Las comprobaciones pasan sin errores."
        help={<p>Compara primero la entrada con la salida.</p>}
      />,
    );

    // Estructura visual conservada
    expect(markup).toContain('Haz esto');
    expect(markup).toContain('Resultado esperado');
    expect(markup).toContain('Necesito ayuda');
    expect(markup).toContain('<details');

    // Mejora accesible: la región de ayuda dinámica se anuncia
    expect(markup).toContain('practice-brief__help-content');
    expect(markup).toContain('aria-live="polite"');
    // No se altera el diseño: no se añade role alert ni assertive
    expect(markup).not.toContain('aria-live="assertive"');
  });

  it('no introduce aria-live cuando no hay ayuda', () => {
    const markup = renderToStaticMarkup(
      <PracticeBrief action="Haz X" expected="Y" />,
    );
    expect(markup).not.toContain('aria-live');
  });
});
