import { describe, expect, it, vi } from 'vitest';
import type { WorkspaceSnapshot } from '../../types/scrim';
import { PythonRuntimeClient, type PythonWorkerLike } from './pythonRuntimeClient';
import type { PythonWorkerInbound, PythonWorkerOutbound } from './pythonWorkerProtocol';

const workspace: WorkspaceSnapshot = {
  activeFilePath: 'main.py',
  files: {
    'main.py': { name: 'main.py', path: 'main.py', language: 'python', content: 'print(2 + 3)' },
  },
};

class SuccessfulWorker implements PythonWorkerLike {
  terminated = false;
  readonly messages: PythonWorkerInbound[] = [];
  protected listener: ((event: MessageEvent<PythonWorkerOutbound>) => void) | null = null;

  addEventListener(_type: 'message', listener: (event: MessageEvent<PythonWorkerOutbound>) => void) {
    this.listener = listener;
  }

  removeEventListener() {
    this.listener = null;
  }

  postMessage(message: PythonWorkerInbound) {
    this.messages.push(message);
    if (message.type !== 'runtime/run') return;
    queueMicrotask(() => {
      this.emit({ type: 'runtime/stdout', requestId: message.requestId, text: '5', line: 1 });
      this.emit({ type: 'runtime/result', requestId: message.requestId, success: true });
    });
  }

  protected emit(data: PythonWorkerOutbound) {
    this.listener?.({ data } as MessageEvent<PythonWorkerOutbound>);
  }

  terminate() {
    this.terminated = true;
  }
}

class SilentWorker extends SuccessfulWorker {
  override postMessage(message: PythonWorkerInbound) {
    this.messages.push(message);
  }
}

class ErrorWorker extends SuccessfulWorker {
  override postMessage(message: PythonWorkerInbound) {
    this.messages.push(message);
    if (message.type !== 'runtime/run') return;
    queueMicrotask(() => {
      this.emit({
        type: 'runtime/result',
        requestId: message.requestId,
        success: false,
        error: { message: 'name no_existe is not defined', line: 3, column: 1 },
      });
    });
  }
}

describe('PythonRuntimeClient', () => {
  it('recoge stdout y termina una ejecución correcta', async () => {
    const worker = new SuccessfulWorker();
    const client = new PythonRuntimeClient(() => worker);

    const result = await client.run(workspace, { timeoutMs: 100 });

    expect(result).toMatchObject({
      success: true,
      consoleLogs: [expect.objectContaining({ type: 'log', args: ['5'], sourceLine: 1 })],
    });
    expect(worker.messages).toEqual([
      expect.objectContaining({ type: 'runtime/run', source: 'print(2 + 3)', packages: [] }),
    ]);
  });

  it('convierte una excepción de Python en un error con ubicación', async () => {
    const worker = new ErrorWorker();
    const client = new PythonRuntimeClient(() => worker);

    await expect(client.run(workspace, { timeoutMs: 100 })).resolves.toMatchObject({
      success: false,
      error: { message: 'name no_existe is not defined', line: 3, column: 1 },
    });
  });

  it('reinicia el Worker después de un timeout', async () => {
    vi.useFakeTimers();
    const workers: PythonWorkerLike[] = [new SilentWorker(), new SuccessfulWorker()];
    const client = new PythonRuntimeClient(() => workers.shift()!);

    const firstRun = client.run(workspace, { timeoutMs: 25 });
    await vi.advanceTimersByTimeAsync(30);
    await expect(firstRun).resolves.toMatchObject({ success: false, error: { message: expect.stringMatching(/25 ms/) } });

    const secondRun = client.run(workspace, { timeoutMs: 100 });
    await expect(secondRun).resolves.toMatchObject({ success: true });
    vi.useRealTimers();
  });

  it('termina el Worker al cerrar el runtime', () => {
    const worker = new SuccessfulWorker();
    const client = new PythonRuntimeClient(() => worker);
    void client.run(workspace);

    client.dispose();

    expect(worker.terminated).toBe(true);
  });
});
