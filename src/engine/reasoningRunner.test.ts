import { describe, expect, it } from 'vitest';
import { validateReasoningAttempt } from './reasoningRunner';
import { ReasoningActivity, ReasoningAttempt } from '../types/curriculum';

describe('reasoningRunner', () => {
  it('valida una secuencia por ids y explica el primer paso fuera de lugar', () => {
    const activity: ReasoningActivity = {
      kind: 'sequence',
      prompt: 'Ordena el flujo',
      steps: [
        { id: 'leer', label: 'Leer entrada' },
        { id: 'validar', label: 'Validar' },
        { id: 'mostrar', label: 'Mostrar salida' },
      ],
      expectedOrder: ['leer', 'validar', 'mostrar'],
    };

    const failed = validateReasoningAttempt(activity, { kind: 'sequence', order: ['validar', 'leer', 'mostrar'] });
    expect(failed.allPassed).toBe(false);
    expect(failed.checks[0].message).toContain('Leer entrada');

    const passed = validateReasoningAttempt(activity, { kind: 'sequence', order: ['leer', 'validar', 'mostrar'] });
    expect(passed.allPassed).toBe(true);
  });

  it('valida una tabla de seguimiento por celdas', () => {
    const activity: ReasoningActivity = {
      kind: 'trace-table',
      prompt: 'Sigue el bucle',
      columns: ['i', 'total'],
      rows: [
        { id: 'v1', label: 'Vuelta 1' },
        { id: 'v2', label: 'Vuelta 2' },
      ],
      expectedCells: { 'v1:i': '0', 'v1:total': '2', 'v2:i': '1', 'v2:total': '5' },
    };
    const attempt: ReasoningAttempt = {
      kind: 'trace-table',
      cells: { 'v1:i': '0', 'v1:total': '2', 'v2:i': '1', 'v2:total': '5' },
    };

    expect(validateReasoningAttempt(activity, attempt).allPassed).toBe(true);
  });

  it('acepta conexiones equivalentes aunque se entreguen en otro orden', () => {
    const activity: ReasoningActivity = {
      kind: 'flowchart',
      prompt: 'Conecta el flujo',
      nodes: [
        { id: 'inicio', label: 'Inicio', role: 'start' },
        { id: 'decision', label: '¿Es válido?', role: 'decision' },
        { id: 'fin', label: 'Fin', role: 'end' },
      ],
      connectionOptions: [
        { from: 'inicio', to: 'decision' },
        { from: 'decision', to: 'fin', label: 'sí' },
        { from: 'inicio', to: 'fin' },
      ],
      expectedConnections: [
        { from: 'inicio', to: 'decision' },
        { from: 'decision', to: 'fin', label: 'sí' },
      ],
    };

    const result = validateReasoningAttempt(activity, {
      kind: 'flowchart',
      connections: [
        { from: 'decision', to: 'fin', label: 'sí' },
        { from: 'inicio', to: 'decision' },
      ],
    });

    expect(result.allPassed).toBe(true);
  });

  it('valida decisiones y dependencias sin depender de posiciones visuales', () => {
    const decision: ReasoningActivity = {
      kind: 'decision-table',
      prompt: 'Elige el resultado',
      cases: [
        { id: 'adulto', label: 'edad = 20', options: ['entra', 'no entra'] },
        { id: 'menor', label: 'edad = 15', options: ['entra', 'no entra'] },
      ],
      expectedOutcomes: { adulto: 'entra', menor: 'no entra' },
    };
    expect(validateReasoningAttempt(decision, {
      kind: 'decision-table',
      outcomes: { adulto: 'entra', menor: 'no entra' },
    }).allPassed).toBe(true);

    const dependencies: ReasoningActivity = {
      kind: 'dependency-map',
      prompt: 'Conecta módulos',
      modules: [
        { id: 'ui', label: 'Interfaz' },
        { id: 'reglas', label: 'Reglas' },
        { id: 'datos', label: 'Datos' },
      ],
      dependencyOptions: [
        { from: 'ui', to: 'reglas' },
        { from: 'reglas', to: 'datos' },
        { from: 'datos', to: 'ui' },
      ],
      expectedDependencies: [
        { from: 'ui', to: 'reglas' },
        { from: 'reglas', to: 'datos' },
      ],
    };
    expect(validateReasoningAttempt(dependencies, {
      kind: 'dependency-map',
      dependencies: [
        { from: 'reglas', to: 'datos' },
        { from: 'ui', to: 'reglas' },
      ],
    }).allPassed).toBe(true);
  });

  it('reporta un intento de tipo incompatible como error de configuración evaluable', () => {
    const activity: ReasoningActivity = {
      kind: 'sequence',
      prompt: 'Ordena',
      steps: [{ id: 'a', label: 'A' }],
      expectedOrder: ['a'],
    };

    const result = validateReasoningAttempt(activity, { kind: 'decision-table', outcomes: {} });
    expect(result.allPassed).toBe(false);
    expect(result.isEvaluationError).toBe(true);
  });
});
