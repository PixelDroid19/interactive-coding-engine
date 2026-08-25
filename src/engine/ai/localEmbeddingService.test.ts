import { describe, expect, it, vi } from 'vitest';
import {
  LocalEmbeddingService,
  type EmbeddingWorkerLike,
} from './localEmbeddingService';
import type { EmbeddingWorkerInbound, EmbeddingWorkerOutbound } from './embeddingProtocol';

class FakeEmbeddingWorker implements EmbeddingWorkerLike {
  readonly messages: EmbeddingWorkerInbound[] = [];
  terminated = false;
  protected listener: ((event: MessageEvent<EmbeddingWorkerOutbound>) => void) | null = null;

  addEventListener(_type: 'message', listener: (event: MessageEvent<EmbeddingWorkerOutbound>) => void) {
    this.listener = listener;
  }

  removeEventListener() {
    this.listener = null;
  }

  postMessage(message: EmbeddingWorkerInbound) {
    this.messages.push(message);
    if (message.type !== 'embedding/run') return;
    queueMicrotask(() => {
      this.emit({
        type: 'embedding/progress',
        requestId: message.requestId,
        status: 'download',
        label: 'Descargando modelo',
        progress: 0.5,
      });
      this.emit({
        type: 'embedding/result',
        requestId: message.requestId,
        vectors: [[3, 4], [0, 2]],
        model: message.model,
      });
    });
  }

  terminate() {
    this.terminated = true;
  }

  protected emit(data: EmbeddingWorkerOutbound) {
    this.listener?.({ data } as MessageEvent<EmbeddingWorkerOutbound>);
  }
}

class FailedEmbeddingWorker extends FakeEmbeddingWorker {
  override postMessage(message: EmbeddingWorkerInbound) {
    this.messages.push(message);
    if (message.type !== 'embedding/run') return;
    queueMicrotask(() => this.emit({
      type: 'embedding/error',
      requestId: message.requestId,
      message: 'WebGPU no está disponible',
    }));
  }
}

class SilentEmbeddingWorker extends FakeEmbeddingWorker {
  override postMessage(message: EmbeddingWorkerInbound) {
    this.messages.push(message);
  }
}

describe('LocalEmbeddingService', () => {
  it('conserva el orden del lote, normaliza vectores e informa progreso', async () => {
    const worker = new FakeEmbeddingWorker();
    const onProgress = vi.fn();
    const service = new LocalEmbeddingService(() => worker);

    const result = await service.embed(['primero', 'segundo'], { onProgress });

    expect(result.mode).toBe('local-model');
    expect(result.vectors).toEqual([[0.6, 0.8], [0, 1]]);
    expect(worker.messages[0]).toMatchObject({ texts: ['primero', 'segundo'] });
    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ progress: 0.5 }));
    expect(service.modelInfo().loaded).toBe(true);
  });

  it('usa un vector didáctico etiquetado cuando el modelo local falla', async () => {
    const service = new LocalEmbeddingService(() => new FailedEmbeddingWorker());

    const result = await service.embed(['hola mundo', 'hola mundo']);

    expect(result.mode).toBe('teaching-fallback');
    expect(result.warning).toContain('WebGPU no está disponible');
    expect(result.vectors[0]).toEqual(result.vectors[1]);
    expect(Math.hypot(...result.vectors[0])).toBeCloseTo(1, 8);
  });

  it('cancela una petición pendiente sin convertirla en fallback', async () => {
    const controller = new AbortController();
    const worker = new SilentEmbeddingWorker();
    const service = new LocalEmbeddingService(() => worker);
    const request = service.embed(['cancelar'], { signal: controller.signal });

    controller.abort();

    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
  });
});
