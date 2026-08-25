import type { RuntimeExecutionResult } from '../../types/runtime';
import type { WorkspaceSnapshot } from '../../types/scrim';
import type { CourseRuntime, RuntimeOptions } from '../runtime/courseRuntime';
import type { PythonWorkerInbound, PythonWorkerOutbound } from './pythonWorkerProtocol';

export interface PythonWorkerLike {
  postMessage(message: PythonWorkerInbound): void;
  addEventListener(type: 'message', listener: (event: MessageEvent<PythonWorkerOutbound>) => void): void;
  removeEventListener(type: 'message', listener: (event: MessageEvent<PythonWorkerOutbound>) => void): void;
  terminate(): void;
}

interface PendingRun {
  startedAt: number;
  logs: RuntimeExecutionResult['consoleLogs'];
  resolve: (result: RuntimeExecutionResult) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

const DEFAULT_TIMEOUT_MS = 8_000;

function createBrowserWorker(): PythonWorkerLike {
  return new Worker(new URL('./pythonRuntime.worker.ts', import.meta.url), { type: 'module' });
}

function collectPythonSource(workspace: WorkspaceSnapshot): string {
  const files = Object.values(workspace.files).filter(
    (file) => file.language === 'python' || file.path.endsWith('.py'),
  );
  if (files.length === 0) {
    throw new Error('Este ejercicio no contiene ningún archivo de Python.');
  }

  const active = workspace.files[workspace.activeFilePath];
  const ordered = active && files.includes(active)
    ? [active, ...files.filter((file) => file !== active)]
    : files;
  return ordered.map((file) => file.content).join('\n\n');
}

export class PythonRuntimeClient implements CourseRuntime {
  private worker: PythonWorkerLike | null = null;
  private nextRequestId = 1;
  private readonly pending = new Map<number, PendingRun>();

  constructor(private readonly workerFactory: () => PythonWorkerLike = createBrowserWorker) {}

  run(workspace: WorkspaceSnapshot, options: RuntimeOptions = {}): Promise<RuntimeExecutionResult> {
    let source: string;
    try {
      source = collectPythonSource(workspace);
    } catch (error) {
      return Promise.resolve({
        success: false,
        error: { message: error instanceof Error ? error.message : String(error) },
        consoleLogs: [],
        executionTimeMs: 0,
      });
    }

    const worker = this.ensureWorker();
    const requestId = this.nextRequestId++;
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    return new Promise((resolve) => {
      const finishAsCancelled = () => {
        const pending = this.pending.get(requestId);
        if (!pending) return;
        clearTimeout(pending.timeoutId);
        this.pending.delete(requestId);
        resolve({
          success: false,
          error: { message: 'La ejecución de Python fue cancelada.' },
          consoleLogs: pending.logs,
          executionTimeMs: performance.now() - pending.startedAt,
        });
      };

      const timeoutId = setTimeout(() => {
        const pending = this.pending.get(requestId);
        if (!pending) return;
        this.pending.delete(requestId);
        pending.resolve({
          success: false,
          error: {
            message: `La ejecución de Python superó ${timeoutMs} ms. Revisa si hay un bucle que no termina.`,
          },
          consoleLogs: pending.logs,
          executionTimeMs: performance.now() - pending.startedAt,
        });
        this.restartWorker();
      }, timeoutMs);

      this.pending.set(requestId, {
        startedAt: performance.now(),
        logs: [],
        resolve,
        timeoutId,
      });

      if (options.signal?.aborted) {
        finishAsCancelled();
        return;
      }
      options.signal?.addEventListener('abort', finishAsCancelled, { once: true });
      worker.postMessage({
        type: 'runtime/run',
        requestId,
        source,
        packages: options.packages ?? [],
      });
    });
  }

  dispose() {
    this.finishAll('El entorno de Python se cerró antes de terminar la ejecución.');
    this.worker?.removeEventListener('message', this.handleMessage);
    this.worker?.terminate();
    this.worker = null;
  }

  private ensureWorker() {
    if (!this.worker) {
      this.worker = this.workerFactory();
      this.worker.addEventListener('message', this.handleMessage);
    }
    return this.worker;
  }

  private readonly handleMessage = (event: MessageEvent<PythonWorkerOutbound>) => {
    const message = event.data;
    const pending = this.pending.get(message.requestId);
    if (!pending) return;

    if (message.type === 'runtime/stdout' || message.type === 'runtime/stderr') {
      pending.logs.push({
        id: `python-${message.requestId}-${pending.logs.length}`,
        type: message.type === 'runtime/stdout' ? 'log' : 'error',
        args: [message.text],
        timestamp: Date.now(),
        sourceLine: message.line,
      });
      return;
    }

    if (message.type !== 'runtime/result') return;

    clearTimeout(pending.timeoutId);
    this.pending.delete(message.requestId);
    pending.resolve({
      success: message.success,
      error: 'error' in message ? message.error : undefined,
      consoleLogs: pending.logs,
      executionTimeMs: performance.now() - pending.startedAt,
    });
  };

  private restartWorker() {
    this.worker?.removeEventListener('message', this.handleMessage);
    this.worker?.terminate();
    this.worker = null;
  }

  private finishAll(message: string) {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeoutId);
      pending.resolve({
        success: false,
        error: { message },
        consoleLogs: pending.logs,
        executionTimeMs: performance.now() - pending.startedAt,
      });
    }
    this.pending.clear();
  }
}
