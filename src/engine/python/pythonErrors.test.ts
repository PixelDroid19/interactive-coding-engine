import { describe, expect, it } from 'vitest';
import { normalizePythonError } from './pythonErrors';

describe('normalizePythonError', () => {
  it('extrae la última línea útil del traceback de Pyodide', () => {
    const error = new Error([
      'Traceback (most recent call last):',
      '  File "<exec>", line 4, in <module>',
      "NameError: name 'total' is not defined",
    ].join('\n'));

    expect(normalizePythonError(error)).toMatchObject({
      message: "NameError: name 'total' is not defined",
      line: 4,
      column: 1,
    });
  });

  it('conserva un error simple sin inventar ubicación', () => {
    expect(normalizePythonError('No se pudo iniciar Python')).toEqual({
      message: 'No se pudo iniciar Python',
    });
  });
});
