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
    const service = new LocalEmbeddingService(() => worker, () => true);

    const result = await service.embed(['primero', 'segundo'], { onProgress });

    expect(result.device).toBe('webgpu');
    expect(result.vectors).toEqual([[0.6, 0.8], [0, 1]]);
    expect(worker.messages[0]).toMatchObject({ texts: ['primero', 'segundo'] });
    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ progress: 0.5 }));
    expect(service.modelInfo().loaded).toBe(true);
  });

  it('propaga el fallo del modelo sin fabricar vectores sustitutos', async () => {
    const service = new LocalEmbeddingService(() => new FailedEmbeddingWorker(), () => true);

    await expect(service.embed(['hola mundo', 'hola mundo'])).rejects.toThrow(/WebGPU no está disponible/i);
  });

  it('rechaza antes de crear el Worker si WebGPU no está disponible', async () => {
    const factory = vi.fn(() => new FakeEmbeddingWorker());
    const service = new LocalEmbeddingService(factory, () => false);

    await expect(service.embed(['hola'])).rejects.toThrow(/no usa vectores simulados/i);
    expect(factory).not.toHaveBeenCalled();
  });

  it('cancela una petición pendiente sin convertirla en fallback', async () => {
    const controller = new AbortController();
    const worker = new SilentEmbeddingWorker();
    const service = new LocalEmbeddingService(() => worker, () => true);
    const request = service.embed(['cancelar'], { signal: controller.signal });

    controller.abort();

    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
  });
});
