import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PracticeBrief } from './PracticeBrief';
import { splitPracticeCopy } from './practiceCopy';

describe('PracticeBrief', () => {
  it('prioriza una accion y un resultado breve, con la ayuda cerrada', () => {
    const markup = renderToStaticMarkup(
      <PracticeBrief
        action="Corrige la función total()."
        expected="Las comprobaciones pasan sin errores."
        help={<p>Compara primero la entrada con la salida.</p>}
      />,
    );

    expect(markup).toContain('Haz esto');
    expect(markup).toContain('Corrige la función total().');
    expect(markup).toContain('Resultado esperado');
    expect(markup).not.toContain('Debe ocurrir');
    expect(markup).toContain('Las comprobaciones pasan sin errores.');
    expect(markup).toContain('Necesito ayuda');
    expect(markup).toContain('<details');
    expect(markup).not.toContain('<details open=""');
  });
});

describe('splitPracticeCopy', () => {
  it('separa el contrato largo sin cortar ni perder informacion', () => {
    expect(splitPracticeCopy(
      'Construye el núcleo del tutor con una regla determinista. Recibe un texto, recorta espacios y devuelve una respuesta distinta para vacío, pregunta y mensaje normal. La entrega debe funcionar con datos diferentes.',
      'first',
    )).toEqual({
      action: 'Construye el núcleo del tutor con una regla determinista.',
      context: 'Recibe un texto, recorta espacios y devuelve una respuesta distinta para vacío, pregunta y mensaje normal. La entrega debe funcionar con datos diferentes.',
    });
  });

  it('puede priorizar la petición final cuando primero aparece el contexto', () => {
    expect(splitPracticeCopy(
      'Entrada → proceso → salida. Cada flecha entrega datos al paso siguiente. Marca la última flecha correcta y la primera que falla.',
      'last',
    ).action).toBe('Marca la última flecha correcta y la primera que falla.');
  });
});
