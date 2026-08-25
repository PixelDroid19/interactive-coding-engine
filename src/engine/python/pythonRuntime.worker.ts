/// <reference lib="webworker" />

import { loadPyodide, type PyodideInterface } from 'pyodide';
import { normalizePythonError } from './pythonErrors';
import type { PythonWorkerInbound, PythonWorkerOutbound } from './pythonWorkerProtocol';

declare const self: DedicatedWorkerGlobalScope;

const PYODIDE_VERSION = '314.0.6';
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let runtimePromise: Promise<PyodideInterface> | null = null;

function send(message: PythonWorkerOutbound) {
  self.postMessage(message);
}

function getRuntime(requestId: number) {
  if (!runtimePromise) {
    send({
      type: 'runtime/progress',
      requestId,
      stage: 'runtime',
      label: 'Preparando Python en el navegador…',
    });
    runtimePromise = loadPyodide({ indexURL: PYODIDE_INDEX_URL }).catch((error) => {
      runtimePromise = null;
      throw error;
    });
  }
  return runtimePromise;
}

async function runPython(message: Extract<PythonWorkerInbound, { type: 'runtime/run' }>) {
  const { requestId, source, packages } = message;
  try {
    const runtime = await getRuntime(requestId);
    runtime.setStdout({
      batched(text) {
        send({ type: 'runtime/stdout', requestId, text });
      },
    });
    runtime.setStderr({
      batched(text) {
        send({ type: 'runtime/stderr', requestId, text });
      },
    });

    if (packages.length > 0) {
      send({
        type: 'runtime/progress',
        requestId,
        stage: 'package',
        label: `Cargando ${packages.join(', ')}…`,
      });
      await runtime.loadPackage(packages);
    }

    await runtime.loadPackagesFromImports(source, {
      messageCallback(label) {
        send({ type: 'runtime/progress', requestId, stage: 'package', label });
      },
    });
    const result = await runtime.runPythonAsync(source, { filename: '<exec>' });
    if (result && typeof result === 'object' && 'destroy' in result) {
      (result as { destroy(): void }).destroy();
    }
    send({ type: 'runtime/result', requestId, success: true });
  } catch (error) {
    send({
      type: 'runtime/result',
      requestId,
      success: false,
      error: normalizePythonError(error),
    });
  }
}

self.addEventListener('message', (event: MessageEvent<PythonWorkerInbound>) => {
  if (event.data.type === 'runtime/run') {
    void runPython(event.data);
  }
});

export {};
