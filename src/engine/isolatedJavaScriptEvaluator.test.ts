import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  evaluateConsoleIsolated,
  evaluateFunctionIsolated,
  isolatedEvaluatorWorkerPolicy,
} from './isolatedJavaScriptEvaluator';

afterEach(() => vi.unstubAllGlobals());

it('evalúa proveedores declarativos después de publicarlos como JSON en el Worker real', async () => {
  const blobs = new Map<string, Blob>();
  vi.stubGlobal('window', globalThis);
  vi.stubGlobal('URL', { createObjectURL(blob: Blob) { blobs.set('test-worker', blob); return 'test-worker'; }, revokeObjectURL() {} });
  vi.stubGlobal('Worker', class {
    onmessage?: (event: { data: unknown }) => void;
    onerror?: (event: { message: string }) => void;
    constructor(url: string) {
      void blobs.get(url)!.text().then((source) => {
        const self = { postMessage: (data: unknown) => this.onmessage?.({ data: structuredClone(data) }) };
        new Function('self', source)(self);
      }).catch(error => this.onerror?.({ message: String(error) }));
    }
    terminate() {}
  });
  const request = JSON.parse(JSON.stringify({ mode: 'single', args: [{ __testCallback: 'resolve', value: { titulo: 'Guía práctica' } }] }));
  expect(await evaluateFunctionIsolated(
    'async function cargar(proveedor) { return (await proveedor()).titulo.toUpperCase(); }', 'cargar', request,
  )).toMatchObject({ kind: 'single', value: 'GUÍA PRÁCTICA' });
  expect(await evaluateFunctionIsolated(
    'async function cargar(response) { return await response.json(); }', 'cargar',
    { mode: 'single', args: [{ json: { __testCallback: 'resolve', value: { titulo: 'Dato real' } } }] },
  )).toMatchObject({ kind: 'single', value: { titulo: 'Dato real' } });
  expect(await evaluateFunctionIsolated(
    'async function cargar(provider) { return await provider(); }', 'cargar',
    { mode: 'single', args: [async () => 'callback local'] },
  )).toMatchObject({ kind: 'single', value: 'callback local' });
});

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
