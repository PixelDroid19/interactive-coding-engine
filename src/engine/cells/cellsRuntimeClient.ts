import type { CellsRuntimeError, CellsWorkerRequest, CellsWorkerResponse } from './cellsWorkerProtocol';

export interface CellsWorkerLike {
  postMessage(message: CellsWorkerRequest, transfer?: Transferable[]): void;
  addEventListener(type: 'message', listener: (event: MessageEvent<CellsWorkerResponse>) => void): void;
  removeEventListener(type: 'message', listener: (event: MessageEvent<CellsWorkerResponse>) => void): void;
  terminate(): void;
}

type PendingRequest = {
  generation: number;
  resolve: (response: CellsWorkerResponse) => void;
  reject: (error: CellsRuntimeClientError) => void;
};

export class CellsRuntimeClientError extends Error implements CellsRuntimeError {
  code: CellsRuntimeError['code'];
  filePath?: string;
  line?: number;
  column?: number;
  hint?: string;

  constructor(error: CellsRuntimeError) {
    super(error.message);
    this.name = 'CellsRuntimeClientError';
    this.code = error.code;
    Object.assign(this, error);
  }
}

function requestId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `cells-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export class CellsRuntimeClient {
  private worker?: CellsWorkerLike;
  private readonly pending = new Map<string, PendingRequest>();
  private disposed = false;

  constructor(
    private readonly workerFactory: () => CellsWorkerLike = () => new Worker(
      new URL('./cellsRuntime.worker.ts', import.meta.url),
      { type: 'module', name: 'open-cells-runtime' },
    ),
    private readonly sessionId = requestId(),
  ) {}

  private ensureWorker(): CellsWorkerLike {
    if (this.disposed) throw new CellsRuntimeClientError({ code: 'CANCELLED', message: 'El runtime Cells ya está cerrado.' });
    if (!this.worker) {
      this.worker = this.workerFactory();
      this.worker.addEventListener('message', this.handleMessage);
    }
    return this.worker;
  }

  private readonly handleMessage = (event: MessageEvent<CellsWorkerResponse>): void => {
    const response = event.data;
    if (response.sessionId !== this.sessionId || response.type === 'runtime:progress') return;
    const pending = this.pending.get(response.requestId);
    if (!pending || response.generation !== pending.generation) return;
    this.pending.delete(response.requestId);
    if (response.type === 'runtime:error') {
      pending.reject(new CellsRuntimeClientError(response.payload.error));
      return;
    }
    pending.resolve(response);
  };

  private send<T extends CellsWorkerRequest['type']>(
    type: T,
    payload: Extract<CellsWorkerRequest, { type: T }>['payload'],
    generation: number,
  ): Promise<CellsWorkerResponse> {
    const worker = this.ensureWorker();
    const id = requestId();
    const message = { type, payload, generation, requestId: id, sessionId: this.sessionId } as Extract<CellsWorkerRequest, { type: T }>;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { generation, resolve, reject });
      worker.postMessage(message);
    });
  }

  createProject(scaffold: { name: string; namespace?: '@open-cells-learning' }, generation: number) {
    return this.send('project:create', { scaffold }, generation);
  }

  loadProject(workspace: Extract<CellsWorkerRequest, { type: 'project:load' }>['payload']['workspace'], generation: number) {
    return this.send('project:load', { workspace }, generation);
  }

  writeFile(path: string, content: string, generation: number) {
    return this.send('file:write', { path, content }, generation);
  }

  runCommand(command: string, generation: number) {
    return this.send('command:run', { command }, generation);
  }

  buildPreview(generation: number, runContractTests = false, testRunId?: string) {
    return this.send('preview:build', { runContractTests, ...(testRunId ? { testRunId } : {}) }, generation);
  }

  runTests(generation: number, coverage = false) {
    return this.send('tests:run', { coverage }, generation);
  }

  exportProject(generation: number) {
    return this.send('project:export', {}, generation);
  }

  cancel(targetRequestId: string, generation: number): void {
    const target = this.pending.get(targetRequestId);
    if (target) {
      this.pending.delete(targetRequestId);
      target.reject(new CellsRuntimeClientError({ code: 'CANCELLED', message: 'La operación fue cancelada.' }));
    }
    const worker = this.ensureWorker();
    worker.postMessage({
      type: 'request:cancel', requestId: requestId(), sessionId: this.sessionId, generation,
      payload: { targetRequestId },
    });
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    const error = new CellsRuntimeClientError({ code: 'CANCELLED', message: 'El runtime Cells fue cerrado.' });
    this.pending.forEach(({ reject }) => reject(error));
    this.pending.clear();
    if (this.worker) {
      this.worker.removeEventListener('message', this.handleMessage);
      this.worker.terminate();
      this.worker = undefined;
    }
  }
}
