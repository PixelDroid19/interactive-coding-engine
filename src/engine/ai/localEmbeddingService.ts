import { normalizeVector } from './deterministicEmbedding';
import {
  DEFAULT_EMBEDDING_MODEL,
  type EmbeddingProgress,
  type EmbeddingWorkerInbound,
  type EmbeddingWorkerOutbound,
} from './embeddingProtocol';

export interface EmbeddingWorkerLike {
  postMessage(message: EmbeddingWorkerInbound): void;
  addEventListener(type: 'message', listener: (event: MessageEvent<EmbeddingWorkerOutbound>) => void): void;
  removeEventListener(type: 'message', listener: (event: MessageEvent<EmbeddingWorkerOutbound>) => void): void;
  terminate(): void;
}

export interface EmbeddingResult {
  vectors: number[][];
  model: string;
  device: 'webgpu';
}

export interface EmbeddingOptions {
  model?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  onProgress?: (progress: EmbeddingProgress) => void;
}

interface PendingEmbedding {
  texts: string[];
  model: string;
  resolve: (result: EmbeddingResult) => void;
  reject: (error: Error) => void;
  onProgress?: (progress: EmbeddingProgress) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

function createEmbeddingWorker(): EmbeddingWorkerLike {
  return new Worker(new URL('./localEmbedding.worker.ts', import.meta.url), { type: 'module' });
}

export class LocalEmbeddingService {
  private worker: EmbeddingWorkerLike | null = null;
  private readonly pending = new Map<number, PendingEmbedding>();
  private nextRequestId = 1;
  private loaded = false;
  private activeModel = DEFAULT_EMBEDDING_MODEL;

  constructor(
    private readonly workerFactory: () => EmbeddingWorkerLike = createEmbeddingWorker,
    private readonly hasWebGpu: () => boolean = () => typeof navigator !== 'undefined' && 'gpu' in navigator,
  ) {}

  embed(texts: string[], options: EmbeddingOptions = {}): Promise<EmbeddingResult> {
    if (texts.length === 0) {
      return Promise.resolve({ vectors: [], model: options.model ?? this.activeModel, device: 'webgpu' });
    }
    if (!this.hasWebGpu()) {
      return Promise.reject(new Error('WebGPU no está disponible. Este laboratorio no usa vectores simulados ni una ruta CPU.'));
    }
    const requestId = this.nextRequestId++;
    const model = options.model ?? DEFAULT_EMBEDDING_MODEL;
    const worker = this.ensureWorker();

    return new Promise((resolve, reject) => {
      const abort = () => {
        const pending = this.pending.get(requestId);
        if (!pending) return;
        clearTimeout(pending.timeoutId);
        this.pending.delete(requestId);
        worker.postMessage({ type: 'embedding/cancel', requestId });
        reject(new DOMException('La generación de embeddings fue cancelada.', 'AbortError'));
      };
      const timeoutId = setTimeout(() => {
        const pending = this.pending.get(requestId);
        if (!pending) return;
        this.pending.delete(requestId);
        pending.reject(new Error('El modelo WebGPU tardó demasiado en responder. Reduce el lote o prueba un equipo compatible.'));
        this.restartWorker();
      }, options.timeoutMs ?? 120_000);

      this.pending.set(requestId, {
        texts: [...texts],
        model,
        resolve,
        reject,
        onProgress: options.onProgress,
        timeoutId,
      });
      if (options.signal?.aborted) {
        abort();
        return;
      }
      options.signal?.addEventListener('abort', abort, { once: true });
      worker.postMessage({ type: 'embedding/run', requestId, texts: [...texts], model });
    });
  }

  modelInfo() {
    return {
      model: this.activeModel,
      loaded: this.loaded,
      dimensions: this.loaded ? 384 : 64,
      runsInBrowser: true,
    };
  }

  dispose() {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeoutId);
      pending.reject(new DOMException('El servicio de embeddings se cerró.', 'AbortError'));
    }
    this.pending.clear();
    this.restartWorker();
  }

  private ensureWorker() {
    if (!this.worker) {
      this.worker = this.workerFactory();
      this.worker.addEventListener('message', this.handleMessage);
    }
    return this.worker;
  }

  private readonly handleMessage = (event: MessageEvent<EmbeddingWorkerOutbound>) => {
    const message = event.data;
    const pending = this.pending.get(message.requestId);
    if (!pending) return;

    if (message.type === 'embedding/progress') {
      pending.onProgress?.(message);
      return;
    }

    clearTimeout(pending.timeoutId);
    this.pending.delete(message.requestId);
    if (message.type === 'embedding/error') {
      pending.reject(new Error(message.message));
      return;
    }

    if (message.vectors.length !== pending.texts.length) {
      pending.reject(new Error('El modelo devolvió una cantidad inesperada de vectores. No se calculará un ranking con datos incompletos.'));
      return;
    }

    this.loaded = true;
    this.activeModel = message.model;
    pending.resolve({
      vectors: message.vectors.map(normalizeVector),
      model: message.model,
      device: 'webgpu',
    });
  };

  private restartWorker() {
    this.worker?.removeEventListener('message', this.handleMessage);
    this.worker?.terminate();
    this.worker = null;
    this.loaded = false;
  }
}
