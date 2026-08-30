import { describe, expect, it } from 'vitest';
import {
  evaluateConsoleIsolated,
  evaluateFunctionIsolated,
  isolatedEvaluatorWorkerPolicy,
} from './isolatedJavaScriptEvaluator';

describe('evaluador JavaScript aislado', () => {
  it('bloquea las superficies de red, procesos y almacenamiento del Worker', () => {
    for (const capability of ['fetch', 'WebSocket', 'Worker', 'SharedWorker', 'BroadcastChannel', 'importScripts', 'indexedDB', 'caches']) {
      expect(isolatedEvaluatorWorkerPolicy).toContain(capability);
    }
  });

  it('conserva llamadas asíncronas y callbacks de pruebas confiables', async () => {
    const outcome = await evaluateFunctionIsolated(
      'async function cargar(proveedor) { const dato = await proveedor(); return dato.titulo.toUpperCase(); }',
      'cargar',
      { mode: 'single', args: [async () => ({ titulo: 'aislado' })] },
    );

    expect(outcome).toMatchObject({ kind: 'single', value: 'AISLADO' });
  });

  it('captura la consola sin ejecutar el programa en la ventana de la plataforma', async () => {
    await expect(evaluateConsoleIsolated('console.log("uno", 2);')).resolves.toEqual({
      kind: 'console',
      output: ['uno 2'],
    });
  });
});
