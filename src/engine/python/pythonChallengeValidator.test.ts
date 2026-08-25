import { describe, expect, it } from 'vitest';
import type { CourseRuntime } from '../runtime/courseRuntime';
import type { ScrimChallenge, WorkspaceSnapshot } from '../../types/scrim';
import { runPythonChallengeValidation } from './pythonChallengeValidator';

const challenge: ScrimChallenge = {
  id: 'suma', title: 'Suma', instructions: 'Suma dos valores.', timestamp: 0, hints: [], tests: [
    { id: 'uno', description: 'Suma positivos', validatorType: 'function-call', targetFunction: 'sumar', args: [2, 3], expectedReturn: 5 },
    { id: 'dos', description: 'Suma negativos', validatorType: 'function-call', targetFunction: 'sumar', args: [-2, 1], expectedReturn: -1 },
  ],
};

const workspace: WorkspaceSnapshot = {
  activeFilePath: 'main.py', files: { 'main.py': { name: 'main.py', path: 'main.py', language: 'python', content: 'def sumar(a, b):\n    return a + b' } },
};

describe('validación de prácticas Python', () => {
  it('ejecuta todos los casos en un solo viaje al Worker', async () => {
    const run = async (received: WorkspaceSnapshot) => {
      expect(received.files['__aula_validation__.py'].content).toContain('globals().get');
      return { success: true, consoleLogs: [{ id: '1', type: 'log' as const, args: ['__AULA_PYTHON_TESTS__:[{"ok":true,"value":5},{"ok":true,"value":-1}]'], timestamp: 0 }], executionTimeMs: 1 };
    };
    const runtime: CourseRuntime = { run, dispose() {} };
    const result = await runPythonChallengeValidation(challenge, workspace, runtime);
    expect(result).toMatchObject({ allPassed: true, passedCount: 2, totalCount: 2 });
  });

  it('distingue respuesta incorrecta de fallo del evaluador', async () => {
    const runtime: CourseRuntime = { run: async () => ({ success: true, consoleLogs: [{ id: '1', type: 'log' as const, args: ['__AULA_PYTHON_TESTS__:[{"ok":true,"value":4},{"ok":false,"error":"boom"}]'], timestamp: 0 }], executionTimeMs: 1 }), dispose() {} };
    const result = await runPythonChallengeValidation(challenge, workspace, runtime);
    expect(result.tests[0]).toMatchObject({ status: 'failed', receivedValue: 4 });
    expect(result.tests[1]).toMatchObject({ status: 'failed', errorMessage: expect.stringContaining('boom') });
  });

  it('reporta errores de sintaxis de Pyodide como imposibilidad de evaluar', async () => {
    const runtime: CourseRuntime = { run: async () => ({ success: false, error: { message: 'SyntaxError: invalid syntax', line: 1 }, consoleLogs: [], executionTimeMs: 1 }), dispose() {} };
    const result = await runPythonChallengeValidation(challenge, workspace, runtime);
    expect(result.tests.every((test) => test.isEvaluationError)).toBe(true);
    expect(result.feedbackMessage).toContain('No pudimos evaluar');
  });
});
