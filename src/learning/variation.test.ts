import { describe, expect, it } from 'vitest';
import { buildPostSolveVariation } from './variation';

describe('buildPostSolveVariation', () => {
  it('es estable para el mismo ejercicio y no incluye una solución', () => {
    const input = { itemId: 'javascript-04-reto', title: 'Normaliza un nombre', instructions: 'Recibe cualquier nombre.', kind: 'challenge' as const };
    const first = buildPostSolveVariation(input);
    expect(buildPostSolveVariation(input)).toEqual(first);
    expect(first.changedRequirement).not.toContain(input.instructions);
    expect(first.changedRequirement).not.toMatch(/return\s|const\s|=>/);
  });

  it('pide causa observable cuando se trata de depuración', () => {
    expect(buildPostSolveVariation({ itemId: 'x', title: 'Fallo', kind: 'debugging' }).readingPrompt).toContain('qué cambió');
  });

  it('no cambia la tarea de reflexión por renombrar un identificador técnico', () => {
    const activity = { title: 'Monitor con herencia intacta', instructions: 'Detén el intervalo al desconectar.', kind: 'challenge' as const };
    const first = buildPostSolveVariation({ ...activity, itemId: 'a' });
    const renamed = buildPostSolveVariation({ ...activity, itemId: 'b' });
    expect(renamed.changedRequirement).toBe(first.changedRequirement);
    expect(renamed.verificationPrompt).toBe(first.verificationPrompt);
    expect(renamed.readingPrompt).toBe(first.readingPrompt);
    expect(renamed.id).not.toBe(first.id);
  });

  it('sitúa la explicación en la actividad actual en vez de ignorar su título', () => {
    const activity = { itemId: 'current', kind: 'challenge' as const };
    const monitor = buildPostSolveVariation({ ...activity, title: 'Monitor con herencia intacta' });
    const form = buildPostSolveVariation({ ...activity, title: 'Formulario de perfil' });
    expect(monitor.readingPrompt).toContain('Monitor con herencia intacta');
    expect(form.readingPrompt).toContain('Formulario de perfil');
    expect(form.readingPrompt).not.toContain('Monitor con herencia intacta');
  });

  it('no trata un modelo de razonamiento como una función con entradas y salidas', () => {
    const activity = { itemId: 'same', title: 'Ordena el flujo' };
    const reasoning = buildPostSolveVariation({ ...activity, kind: 'reasoning' });
    const challenge = buildPostSolveVariation({ ...activity, kind: 'challenge' });
    expect(reasoning.readingPrompt).not.toBe(challenge.readingPrompt);
    expect(reasoning.changedRequirement).not.toBe(challenge.changedRequirement);
  });
});
