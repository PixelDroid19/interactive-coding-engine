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
    getModelRecords: vi.fn(async () => [{
      model: 'https://huggingface.co/mlc-ai/Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
      model_id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
      model_lib: 'qwen.wasm',
      vram_required_MB: 944.62,
      overrides: { context_window_size: 4096 },
    }]),
  });
  return { service, worker, engine, createEngine };
}

describe('LocalGenerationService', () => {
  it('conserva el corte por tokens aunque llegue en un fragmento sin texto', async () => {
    const { service, engine } = harness();
    vi.mocked(engine.chat.completions.create).mockResolvedValue({
      async *[Symbol.asyncIterator]() {
        yield { choices: [{ delta: { content: 'La actualización ocurre porque' }, finish_reason: null }] };
        yield { choices: [{ delta: {}, finish_reason: 'length' }] };
        yield { choices: [] };
      },
    });
    await expect(service.generate({ messages: [{ role: 'user', content: 'Explica.' }], maxNewTokens: 16 }))
      .resolves.toMatchObject({ text: 'La actualización ocurre porque', finishReason: 'length' });
  });

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

  it('lista modelos compatibles y consulta su caché sin crear el motor', async () => {
    const { service, createEngine } = harness({ cached: true });

    await expect(service.listModels()).resolves.toEqual([
      expect.objectContaining({
        id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
        cached: true,
        estimatedVramMB: 944.62,
      }),
    ]);
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
    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ label: 'Preparando modelo local: 50%' }));
    expect(onChunk).toHaveBeenCalledTimes(2);
    expect(second.text).toBe('Respuesta local en español.');
  });

  it('desactiva el razonamiento de Qwen3 al pedir un JSON con presupuesto acotado', async () => {
    const { service, engine } = harness();
    await service.generate({ messages: [{ role: 'user', content: 'Da una pista.' }], maxNewTokens: 160,
      expectedFormat: 'json_object', allowInvalidStructuredOutput: true }, { model: 'Qwen3-1.7B-q4f16_1-MLC' });
    expect(engine.chat.completions.create).toHaveBeenCalledWith(expect.objectContaining({ extra_body: { enable_thinking: false } }));
  });

  it.each([undefined, true])('conserva el protocolo de los laboratorios con enableThinking=%s', async enableThinking => {
    const { service, engine } = harness({ output: ['<think>Un ejemplo del laboratorio.</think>', 'Respuesta.'] });
    const onChunk = vi.fn();
    const response = await service.generate({ messages: [{ role: 'user', content: 'Compara protocolos.' }], maxNewTokens: 240,
      ...(enableThinking === undefined ? {} : { enableThinking }) }, { model: 'Qwen3-1.7B-q4f16_1-MLC', onChunk });
    const sent = vi.mocked(engine.chat.completions.create).mock.calls[0][0];
    if (enableThinking === undefined) expect(sent).not.toHaveProperty('extra_body');
    else expect(sent).toHaveProperty('extra_body', { enable_thinking: true });
    expect(onChunk).toHaveBeenCalledTimes(2);
    expect(response.text).toContain('<think>');
  });

  it('no envía la extensión de Qwen3 a otros modelos', async () => {
    const { service, engine } = harness();
    const onChunk = vi.fn();
    await service.generate({ messages: [{ role: 'user', content: 'Explica.' }], maxNewTokens: 240, enableThinking: false },
      { model: 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC', onChunk });
    expect(vi.mocked(engine.chat.completions.create).mock.calls[0][0]).not.toHaveProperty('extra_body');
    expect(onChunk).toHaveBeenCalledTimes(2);
  });

  it('entrega la explicación de Qwen3 sin prefijo interno cuando se pide una respuesta directa', async () => {
    const { service, engine } = harness({ output: ['<thi', 'nk>\n\n</think>\n\n', 'El cambio de total programa otra actualización.'] });
    const onChunk = vi.fn();
    const response = await service.generate({ messages: [{ role: 'user', content: 'Explica el ciclo.' }], maxNewTokens: 240,
      enableThinking: false }, { model: 'Qwen3-1.7B-q4f16_1-MLC', onChunk });
    expect(engine.chat.completions.create).toHaveBeenCalledWith(expect.objectContaining({ extra_body: { enable_thinking: false } }));
    expect(response.text).toBe('El cambio de total programa otra actualización.');
    expect(onChunk.mock.calls.flat().join('')).toBe(response.text);
  });

  it('no publica un borrador interno si Qwen3 ignora la petición de respuesta directa', async () => {
    const { service } = harness({ output: ['<think>', 'Okay, let us inspect the code before answering.'] });
    const onChunk = vi.fn();
    await expect(service.generate({ messages: [{ role: 'user', content: 'Explica el ciclo.' }], maxNewTokens: 240,
      enableThinking: false }, { model: 'Qwen3-1.7B-q4f16_1-MLC', onChunk }))
      .rejects.toThrow(/respuesta final/);
    expect(onChunk).not.toHaveBeenCalled();
  });

  it('valida el JSON de Qwen3 sin tratar su prefijo de razonamiento vacío como contenido', async () => {
    const { service } = harness({ output: ['<think>\n\n</think>\n\n', '{"question":"¿Qué diferencia observas?"}'] });
    await expect(service.generate({ messages: [{ role: 'user', content: 'Da una pista.' }], maxNewTokens: 160,
      expectedFormat: 'json_object', expectedJsonKeys: ['question'] }, { model: 'Qwen3-1.7B-q4f16_1-MLC' }))
      .resolves.toMatchObject({ text: '{"question":"¿Qué diferencia observas?"}' });
  });

  it.each([
    ['Qwen3-1.7B-q4f16_1-MLC', '<think>Estoy pensando.</think>'],
    ['Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC', '<think>\n</think>'],
  ])('no oculta contenido fuera del protocolo vacío de Qwen3 (%s)', async (model, prefix) => {
    const { service } = harness({ output: [prefix, '{"question":"¿Qué diferencia observas?"}'] });
    await expect(service.generate({ messages: [{ role: 'user', content: 'Da una pista.' }], maxNewTokens: 160,
      expectedFormat: 'json_object', expectedJsonKeys: ['question'] }, { model }))
      .rejects.toThrow('objeto JSON válido');
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

  it('envía a WebLLM el esquema estructurado completo cuando la herramienta lo publica', async () => {
    const schema = {
      type: 'object',
      properties: { calls: { type: 'array', maxItems: 3 } },
      required: ['calls'],
      additionalProperties: false,
    };
    const { service, engine } = harness({ output: ['{"calls":[]}'] });
    await service.generate({
      messages: [{ role: 'user', content: 'Elige herramientas.' }],
      maxNewTokens: 48,
      expectedFormat: 'json_object',
      expectedJsonKeys: ['calls'],
      expectedJsonSchema: schema,
    });

    expect(engine.chat.completions.create).toHaveBeenCalledWith(expect.objectContaining({
      response_format: { type: 'json_object', schema: JSON.stringify(schema) },
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

  it('entrega la salida JSON inválida al agente cuando este declara una recuperación validada', async () => {
    const { service } = harness({ output: ['Esto no es JSON.'] });
    await expect(service.generate({
      messages: [{ role: 'user', content: 'Devuelve JSON.' }],
      maxNewTokens: 48,
      expectedFormat: 'json_object',
      expectedJsonKeys: ['calls', 'replyStrategy'],
      allowInvalidStructuredOutput: true,
    })).resolves.toMatchObject({
      text: 'Esto no es JSON.',
      warning: expect.stringMatching(/no produjo el objeto JSON válido/i),
    });
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

  it('no restaura un motor que termina de prepararse después de liberar su sesión', async () => {
    const { service, createEngine, engine, worker } = harness();
    let finish: (engine: WebLlmEngineLike) => void = () => { throw new Error('La preparación no empezó'); };
    createEngine.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const pending = service.prepareModel();
    const outcome = pending.then(() => 'ready', error => error.name);
    await vi.waitFor(() => expect(createEngine).toHaveBeenCalledTimes(1));
    service.dispose();
    finish(engine);
    expect(await outcome).toBe('AbortError');
    expect(worker.terminate).toHaveBeenCalled();
    expect(engine.unload).toHaveBeenCalled();
    await service.prepareModel();
    expect(createEngine).toHaveBeenCalledTimes(2);
  });

  it('un fallo tardío de la preparación anterior no descarta el motor nuevo', async () => {
    const { service, createEngine } = harness();
    let fail: (reason: Error) => void = () => { throw new Error('La preparación no empezó'); };
    createEngine.mockImplementationOnce(() => new Promise((_resolve, reject) => { fail = reject; }));
    const previous = service.prepareModel().catch(() => undefined);
    await vi.waitFor(() => expect(createEngine).toHaveBeenCalledTimes(1));
    service.dispose();
    await service.prepareModel();
    fail(new Error('Falló la descarga anterior'));
    await previous;
    await service.prepareModel();
    expect(createEngine).toHaveBeenCalledTimes(2);
  });

  it('rechaza de forma explícita un equipo sin WebGPU y no crea el motor', async () => {
    const { service, createEngine } = harness({ webGpu: false });
    await expect(service.generate({ messages: [{ role: 'user', content: 'Hola' }], maxNewTokens: 16 })).rejects.toThrow(/no usa una ruta alternativa/i);
    expect(createEngine).not.toHaveBeenCalled();
  });
});
