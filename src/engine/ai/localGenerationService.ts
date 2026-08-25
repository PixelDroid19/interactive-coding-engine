import {
  DEFAULT_LOCAL_GENERATION_MODEL,
  type GenerationProgress,
  type GenerationWorkerInbound,
  type GenerationWorkerOutbound,
  type LocalGenerationRequest,
  type LocalGenerationResult,
  type LocalModelInfo,
} from './localGenerationProtocol';

export interface GenerationWorkerLike {
  postMessage(message: GenerationWorkerInbound): void;
  addEventListener(type: 'message', listener: (event: MessageEvent<GenerationWorkerOutbound>) => void): void;
  removeEventListener(type: 'message', listener: (event: MessageEvent<GenerationWorkerOutbound>) => void): void;
  terminate(): void;
}

interface RequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  onProgress?: (progress: GenerationProgress) => void;
  onChunk?: (text: string) => void;
}

interface PendingRequest<T> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
  onProgress?: RequestOptions['onProgress'];
  onChunk?: RequestOptions['onChunk'];
}

function createGenerationWorker(): GenerationWorkerLike {
  return new Worker(new URL('./localGeneration.worker.ts', import.meta.url), { type: 'module' });
}

export class LocalGenerationService {
  private worker: GenerationWorkerLike | null = null;
  private nextRequestId = 1;
  private readonly pending = new Map<number, PendingRequest<LocalModelInfo | LocalGenerationResult>>();

  constructor(private readonly workerFactory: () => GenerationWorkerLike = createGenerationWorker) {}

  inspectModel(model = DEFAULT_LOCAL_GENERATION_MODEL, options: RequestOptions = {}): Promise<LocalModelInfo> {
    return this.request<LocalModelInfo>(
      (requestId) => ({ type: 'generation/inspect', requestId, model }),
      options,
    );
  }

  generate(
    request: LocalGenerationRequest,
    options: RequestOptions & { model?: string } = {},
  ): Promise<LocalGenerationResult> {
    const model = options.model ?? DEFAULT_LOCAL_GENERATION_MODEL;
    return this.request<LocalGenerationResult>(
      (requestId) => ({ type: 'generation/run', requestId, model, ...structuredClone(request) }),
      { ...options, timeoutMs: options.timeoutMs ?? 180_000 },
    );
  }

  dispose() {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeoutId);
      pending.reject(new DOMException('El modelo local se cerró.', 'AbortError'));
    }
    this.pending.clear();
    this.worker?.removeEventListener('message', this.handleMessage);
    this.worker?.terminate();
    this.worker = null;
  }

  private request<T extends LocalModelInfo | LocalGenerationResult>(
    buildMessage: (requestId: number) => GenerationWorkerInbound,
    options: RequestOptions,
  ): Promise<T> {
    const requestId = this.nextRequestId++;
    const worker = this.ensureWorker();
    return new Promise<T>((resolve, reject) => {
      const abort = () => {
        const pending = this.pending.get(requestId);
        if (!pending) return;
        clearTimeout(pending.timeoutId);
        this.pending.delete(requestId);
        worker.postMessage({ type: 'generation/cancel', requestId });
        reject(new DOMException('La generación local fue cancelada.', 'AbortError'));
      };
      const timeoutId = setTimeout(() => {
        if (!this.pending.has(requestId)) return;
        this.pending.delete(requestId);
        worker.postMessage({ type: 'generation/cancel', requestId });
        reject(new Error('El modelo local tardó demasiado. Puedes reducir la salida o volver a intentarlo.'));
      }, options.timeoutMs ?? 60_000);

      this.pending.set(requestId, {
        resolve: resolve as PendingRequest<LocalModelInfo | LocalGenerationResult>['resolve'],
        reject,
        timeoutId,
        onProgress: options.onProgress,
        onChunk: options.onChunk,
      });
      if (options.signal?.aborted) {
        abort();
        return;
      }
      options.signal?.addEventListener('abort', abort, { once: true });
      worker.postMessage(buildMessage(requestId));
    });
  }

  private ensureWorker() {
    if (!this.worker) {
      this.worker = this.workerFactory();
      this.worker.addEventListener('message', this.handleMessage);
    }
    return this.worker;
  }

  private readonly handleMessage = (event: MessageEvent<GenerationWorkerOutbound>) => {
    const message = event.data;
    const pending = this.pending.get(message.requestId);
    if (!pending) return;
    if (message.type === 'generation/progress') {
      pending.onProgress?.(message);
      return;
    }
    if (message.type === 'generation/chunk') {
      pending.onChunk?.(message.chunk);
      return;
    }
    clearTimeout(pending.timeoutId);
    this.pending.delete(message.requestId);
    if (message.type === 'generation/error') {
      pending.reject(new Error(message.message));
      return;
    }
    const { type: _type, requestId: _requestId, ...result } = message;
    pending.resolve(result);
  };
}

