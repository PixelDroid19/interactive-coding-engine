import { describe, expect, it, vi } from 'vitest';
import { LocalGenerationService, type GenerationWorkerLike } from './localGenerationService';
import type { GenerationWorkerInbound, GenerationWorkerOutbound } from './localGenerationProtocol';

class FakeGenerationWorker implements GenerationWorkerLike {
  readonly messages: GenerationWorkerInbound[] = [];
  terminated = false;
  private listener: ((event: MessageEvent<GenerationWorkerOutbound>) => void) | null = null;

  addEventListener(_type: 'message', listener: (event: MessageEvent<GenerationWorkerOutbound>) => void) {
    this.listener = listener;
  }

  removeEventListener() {
    this.listener = null;
  }

  postMessage(message: GenerationWorkerInbound) {
    this.messages.push(message);
    if (message.type === 'generation/inspect') {
      queueMicrotask(() => this.emit({
        type: 'generation/model-info',
        requestId: message.requestId,
        model: message.model,
        cached: false,
        downloadBytes: 238_000_000,
        dtypes: ['q4', 'q4f16'],
      }));
    }
    if (message.type === 'generation/run') {
      queueMicrotask(() => {
        this.emit({
          type: 'generation/progress',
          requestId: message.requestId,
          status: 'download',
          label: 'Descargando el modelo local…',
          progress: 0.5,
        });
        this.emit({
          type: 'generation/result',
          requestId: message.requestId,
          text: 'Respuesta local',
          model: message.model,
          device: 'webgpu',
          elapsedMs: 420,
        });
      });
    }
  }

  terminate() {
    this.terminated = true;
  }

  private emit(data: GenerationWorkerOutbound) {
    this.listener?.({ data } as MessageEvent<GenerationWorkerOutbound>);
  }
}

class SilentGenerationWorker extends FakeGenerationWorker {
  override postMessage(message: GenerationWorkerInbound) {
    this.messages.push(message);
  }
}

describe('LocalGenerationService', () => {
  it('inspecciona tamaño, caché y precisiones antes de cargar el modelo', async () => {
    const worker = new FakeGenerationWorker();
    const service = new LocalGenerationService(() => worker);

    const info = await service.inspectModel();

    expect(info).toEqual({
      model: 'onnx-community/LFM2.5-350M-ONNX',
      cached: false,
      downloadBytes: 238_000_000,
      dtypes: ['q4', 'q4f16'],
    });
    expect(worker.messages[0]).toMatchObject({ type: 'generation/inspect' });
  });

  it('genera con WebGPU, conserva los controles e informa progreso', async () => {
    const worker = new FakeGenerationWorker();
    const onProgress = vi.fn();
    const service = new LocalGenerationService(() => worker);

    const result = await service.generate({
      messages: [{ role: 'user', content: 'Resume esta idea' }],
      temperature: 0.4,
      topP: 0.9,
      maxNewTokens: 96,
    }, { onProgress });

    expect(result).toMatchObject({ text: 'Respuesta local', device: 'webgpu', elapsedMs: 420 });
    expect(worker.messages[0]).toMatchObject({
      type: 'generation/run',
      temperature: 0.4,
      topP: 0.9,
      maxNewTokens: 96,
    });
    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ progress: 0.5 }));
  });

  it('cancela la generación y libera el Worker al cerrar el laboratorio', async () => {
    const worker = new SilentGenerationWorker();
    const service = new LocalGenerationService(() => worker);
    const controller = new AbortController();
    const pending = service.generate({
      messages: [{ role: 'user', content: 'Escribe algo' }],
      maxNewTokens: 32,
    }, { signal: controller.signal });

    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(worker.messages.at(-1)).toMatchObject({ type: 'generation/cancel' });

    service.dispose();
    expect(worker.terminated).toBe(true);
  });
});
