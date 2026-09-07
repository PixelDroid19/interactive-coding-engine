import { describe, expect, it } from 'vitest';
import { buildReasoning } from './reasoning';
import { COMPONENT_SPECS_21_TO_26 } from './specs21to26';

describe('Consigna de razonamiento de Lit', () => {
  it('presenta el contexto de la tarea sin reutilizar el diagrama resuelto de la lectura', () => {
    const base = COMPONENT_SPECS_21_TO_26[0];
    const item = buildReasoning({
      ...base,
      appName: 'un formulario de inscripción',
      reading: { ...base.reading, diagram: 'Solución de estudio: recibir → validar → emitir.', walkthrough: 'Explicación de la secuencia resuelta.' },
    });
    expect(item.activity.prompt).toContain('un formulario de inscripción');
    expect(item.activity.prompt).not.toContain('recibir → validar → emitir');
    expect(item.activity.prompt).not.toContain('Solución de estudio');
    expect(item.activity.prompt).not.toContain('Explicación de la secuencia resuelta');
    expect(item.explanation).toBe('Explicación de la secuencia resuelta.');
  });
});
