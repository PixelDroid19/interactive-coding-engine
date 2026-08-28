import { describe, expect, it } from 'vitest';
import { buildPostSolveVariation } from './variation';

describe('buildPostSolveVariation', () => {
  it('es estable para el mismo ejercicio y no incluye una solución', () => {
    const input = { itemId: 'javascript-04-reto', title: 'Normaliza un nombre', instructions: 'Recibe cualquier nombre.', kind: 'challenge' as const };
    const first = buildPostSolveVariation(input);
    expect(buildPostSolveVariation(input)).toEqual(first);
    expect(first.changedRequirement).toContain('Recibe cualquier nombre');
    expect(first.changedRequirement).not.toMatch(/return\s|const\s|=>/);
  });

  it('pide causa observable cuando se trata de depuración', () => {
    expect(buildPostSolveVariation({ itemId: 'x', title: 'Fallo', kind: 'debugging' }).readingPrompt).toContain('primera diferencia observable');
  });
});
