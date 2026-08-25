import { describe, expect, it, vi } from 'vitest';
import { LocalGenerationService, type GenerationWorkerLike, type WebLlmEngineLike } from './localGenerationService';

function stream(...parts: string[]): AsyncIterable<{ choices: Array<{ delta: { content: string } }> }> {
  return {
    async *[Symbol.asyncIterator]() {
      for (const part of parts) yield { choices: [{ delta: { content: part } }] };
    },
  };
}

function harness(options: { cached?: boolean; webGpu?: boolean; output?: string[] } = {}) {
  const worker: GenerationWorkerLike = { terminate: vi.fn() };
  const engine: WebLlmEngineLike = {
    chat: { completions: { create: vi.fn(async () => stream(...(options.output ?? ['Respuesta ', 'local en español.']))) } },
    interruptGenerate: vi.fn(),
    unload: vi.fn(async () => undefined),
  };
  const createEngine = vi.fn(async (_worker, _model, onProgress) => {
    onProgress({ progress: 0.5, timeElapsed: 10, text: 'Descargando pesos: 50%' });
    return engine;
  });
  const service = new LocalGenerationService({
    hasWebGpu: () => options.webGpu ?? true,
    createWorker: () => worker,
    createEngine,
    hasModelInCache: vi.fn(async () => options.cached ?? false),
    getModelRecord: vi.fn(async () => ({
      model: 'https://huggingface.co/mlc-ai/Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
      model_id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
      model_lib: 'qwen.wasm',
      vram_required_MB: 944.62,
      overrides: { context_window_size: 4096 },
    })),
  });
  return { service, worker, engine, createEngine };
}

describe('LocalGenerationService', () => {
  it('inspecciona la configuración y la caché sin crear ni cargar el motor', async () => {
    const { service, createEngine } = harness();

    await expect(service.inspectModel()).resolves.toEqual({
      model: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
      engine: 'WebLLM',
      device: 'webgpu',
      cached: false,
      estimatedVramMB: 944.62,
      contextWindowSize: 4096,
    });
    expect(createEngine).not.toHaveBeenCalled();
  });

  it('carga una sola vez, genera por streaming y conserva los controles del experimento', async () => {
    const { service, engine, createEngine } = harness();
    const onProgress = vi.fn();
    const onChunk = vi.fn();
    const request = {
      messages: [{ role: 'user' as const, content: 'Resume esta idea en español.' }],
      temperature: 0.4,
      topP: 0.9,
      maxNewTokens: 96,
    };

    const first = await service.generate(request, { onProgress, onChunk });
    const second = await service.generate(request);

    expect(first).toMatchObject({ text: 'Respuesta local en español.', engine: 'WebLLM', device: 'webgpu' });
    expect(createEngine).toHaveBeenCalledTimes(1);
    expect(engine.chat.completions.create).toHaveBeenCalledWith(expect.objectContaining({
      messages: request.messages,
      temperature: 0.4,
      top_p: 0.9,
      max_tokens: 96,
      stream: true,
    }));
    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ progress: 0.5 }));
    expect(onChunk).toHaveBeenCalledTimes(2);
    expect(second.text).toBe('Respuesta local en español.');
  });

  it('activa el modo JSON nativo y conserva la validación de la práctica', async () => {
    const { service, engine } = harness({ output: ['{"resultado":true}'] });
    await service.generate({
      messages: [{ role: 'user', content: 'Devuelve JSON.' }],
      maxNewTokens: 48,
      expectedFormat: 'json_object',
      expectedJsonKeys: ['resultado'],
    });

    expect(engine.chat.completions.create).toHaveBeenCalledWith(expect.objectContaining({
      response_format: {
        type: 'json_object',
        schema: JSON.stringify({
          type: 'object',
          properties: { resultado: {} },
          required: ['resultado'],
          additionalProperties: false,
        }),
      },
    }));
  });

  it('recrea el motor cuando se solicita otro modelo en lugar de etiquetar mal la salida', async () => {
    const { service, createEngine, engine, worker } = harness();
    const request = { messages: [{ role: 'user' as const, content: 'Hola' }], maxNewTokens: 24 };

    await service.generate(request, { model: 'modelo-a' });
    await service.generate(request, { model: 'modelo-b' });

    expect(createEngine).toHaveBeenNthCalledWith(1, worker, 'modelo-a', expect.any(Function));
    expect(createEngine).toHaveBeenNthCalledWith(2, worker, 'modelo-b', expect.any(Function));
    expect(engine.unload).toHaveBeenCalledTimes(1);
  });

  it('rechaza una respuesta que incumple el contrato JSON sin inventar una corrección', async () => {
    const { service } = harness({ output: ['Esto no es JSON.'] });
    await expect(service.generate({
      messages: [{ role: 'user', content: 'Devuelve JSON.' }],
      maxNewTokens: 48,
      expectedFormat: 'json_object',
    })).rejects.toThrow(/no produjo el objeto JSON válido/i);
  });

  it('rechaza campos JSON adicionales aunque la sintaxis sea válida', async () => {
    const { service } = harness({ output: ['{"problema":"pantalla","prioridad":"alta","equipo":"web","historia":"inventada"}'] });
    await expect(service.generate({
      messages: [{ role: 'user', content: 'Devuelve el esquema.' }],
      maxNewTokens: 64,
      expectedFormat: 'json_object',
      expectedJsonKeys: ['problema', 'prioridad', 'equipo'],
    })).rejects.toThrow(/exactamente: equipo, prioridad, problema.*equipo, historia, prioridad, problema/i);
  });

  it('cancela la inferencia real y libera el Worker al cerrar', async () => {
    let release: (() => void) | undefined;
    const pendingStream: AsyncIterable<{ choices: Array<{ delta: { content: string } }> }> = {
      async *[Symbol.asyncIterator]() {
        await new Promise<void>((resolve) => { release = resolve; });
        yield { choices: [{ delta: { content: 'tarde' } }] };
      },
    };
    const { service, worker, engine } = harness();
    vi.mocked(engine.chat.completions.create).mockResolvedValue(pendingStream);
    const controller = new AbortController();
    const pending = service.generate({ messages: [{ role: 'user', content: 'Escribe' }], maxNewTokens: 32 }, { signal: controller.signal });

    await vi.waitFor(() => expect(engine.chat.completions.create).toHaveBeenCalled());
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(engine.interruptGenerate).toHaveBeenCalled();
    release?.();

    service.dispose();
    expect(worker.terminate).toHaveBeenCalled();
    expect(engine.unload).toHaveBeenCalled();
  });

  it('rechaza de forma explícita un equipo sin WebGPU y no crea el motor', async () => {
    const { service, createEngine } = harness({ webGpu: false });
    await expect(service.generate({ messages: [{ role: 'user', content: 'Hola' }], maxNewTokens: 16 })).rejects.toThrow(/no usa una ruta alternativa/i);
    expect(createEngine).not.toHaveBeenCalled();
  });
});
