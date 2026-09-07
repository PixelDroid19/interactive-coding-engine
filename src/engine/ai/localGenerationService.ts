import type { InitProgressReport, ModelRecord } from '@mlc-ai/web-llm';
import {
  DEFAULT_LOCAL_GENERATION_MODEL,
  LOCAL_GENERATION_DEVICE,
  LOCAL_GENERATION_ENGINE,
  type GenerationProgress,
  type LocalGenerationRequest,
  type LocalGenerationResult,
  type LocalModelInfo,
  type LocalModelOption,
} from './localGenerationProtocol';
import { explainLocalGenerationError } from './localGenerationErrors';
import { assessSpanishGeneration } from './localOutputQuality';
import { buildTutorModelCatalog, curateTutorModelCatalog } from './localModelCatalog';

interface StreamChunk {
  choices: Array<{ delta: { content?: string | null }; finish_reason?: LocalGenerationResult['finishReason'] | null }>;
}

export interface WebLlmEngineLike {
  chat: {
    completions: {
      create(request: Record<string, unknown>): Promise<AsyncIterable<StreamChunk>>;
    };
  };
  interruptGenerate(): void;
  unload(): Promise<void>;
}

export interface GenerationWorkerLike {
  terminate(): void;
}

interface LocalGenerationDependencies {
  hasWebGpu: () => boolean;
  createWorker: () => GenerationWorkerLike;
  createEngine: (
    worker: GenerationWorkerLike,
    model: string,
    onProgress: (report: InitProgressReport) => void,
  ) => Promise<WebLlmEngineLike>;
  hasModelInCache: (model: string) => Promise<boolean>;
  getModelRecord: (model: string) => Promise<ModelRecord | undefined>;
  getModelRecords: () => Promise<ModelRecord[]>;
}

export interface LocalGenerationOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  onProgress?: (progress: GenerationProgress) => void;
  onChunk?: (text: string) => void;
  model?: string;
}

function createGenerationWorker(): Worker {
  return new Worker(new URL('./localGeneration.worker.ts', import.meta.url), { type: 'module' });
}

const defaultDependencies: LocalGenerationDependencies = {
  hasWebGpu: () => typeof navigator !== 'undefined' && 'gpu' in navigator,
  createWorker: createGenerationWorker,
  async createEngine(worker, model, onProgress) {
    const { CreateWebWorkerMLCEngine } = await import('@mlc-ai/web-llm');
    return CreateWebWorkerMLCEngine(worker as Worker, model, {
      initProgressCallback: onProgress,
      logLevel: 'WARN',
    }) as unknown as Promise<WebLlmEngineLike>;
  },
  async hasModelInCache(model) {
    const { hasModelInCache, prebuiltAppConfig } = await import('@mlc-ai/web-llm');
    return hasModelInCache(model, prebuiltAppConfig);
  },
  async getModelRecord(model) {
    const { prebuiltAppConfig } = await import('@mlc-ai/web-llm');
    return prebuiltAppConfig.model_list.find((record) => record.model_id === model);
  },
  async getModelRecords() {
    const { prebuiltAppConfig } = await import('@mlc-ai/web-llm');
    return prebuiltAppConfig.model_list;
  },
};

function withTimeoutAndAbort<T>(
  promise: Promise<T>,
  options: LocalGenerationOptions,
  timeoutMessage: string,
  onAbort?: () => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const finish = (action: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      options.signal?.removeEventListener('abort', abort);
      action();
    };
    const abort = () => finish(() => {
      onAbort?.();
      reject(new DOMException('La generación local fue cancelada.', 'AbortError'));
    });
    const timeoutId = setTimeout(() => finish(() => {
      onAbort?.();
      reject(new Error(timeoutMessage));
    }), options.timeoutMs ?? 60_000);
    if (options.signal?.aborted) {
      abort();
      return;
    }
    options.signal?.addEventListener('abort', abort, { once: true });
    promise.then(
      (value) => finish(() => resolve(value)),
      (error) => finish(() => reject(error)),
    );
  });
}

function responseFormatFor(request: LocalGenerationRequest) {
  if (request.expectedFormat !== 'json_object') return undefined;
  if (request.expectedJsonSchema) {
    return { type: 'json_object' as const, schema: JSON.stringify(request.expectedJsonSchema) };
  }
  const keys = [...new Set(request.expectedJsonKeys ?? [])];
  if (keys.length === 0) return { type: 'json_object' as const };
  return {
    type: 'json_object' as const,
    schema: JSON.stringify({
      type: 'object',
      properties: Object.fromEntries(keys.map((key) => [key, {}])),
      required: keys,
      additionalProperties: false,
    }),
  };
}

export class LocalGenerationService {
  private worker: GenerationWorkerLike | null = null;
  private engine: WebLlmEngineLike | null = null;
  private enginePromise: Promise<WebLlmEngineLike> | null = null;
  private activeModel: string | null = null;
  private loadingModel: string | null = null;
  private engineEpoch = 0;

  constructor(private readonly dependencies: Partial<LocalGenerationDependencies> = {}) {}

  async prepareModel(model = DEFAULT_LOCAL_GENERATION_MODEL, options: LocalGenerationOptions = {}): Promise<LocalModelInfo> {
    if (!this.resolvedDependencies().hasWebGpu()) {
      throw new Error('WebGPU no está disponible en este navegador o dispositivo. El tutor local no usa una ruta alternativa.');
    }
    try {
      await withTimeoutAndAbort(
        this.ensureEngine(model, options.onProgress),
        { ...options, timeoutMs: options.timeoutMs ?? 300_000 },
        'WebLLM tardó demasiado en preparar el modelo WebGPU.',
        () => this.stopCurrentGeneration(true),
      );
      const info = await this.inspectModel(model, options);
      return { ...info, cached: true };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      throw new Error(explainLocalGenerationError(error));
    }
  }

  async listModels(maxVramMB = 2_100, options: LocalGenerationOptions = {}): Promise<LocalModelOption[]> {
    const dependencies = this.resolvedDependencies();
    const records = await withTimeoutAndAbort(
      dependencies.getModelRecords(),
      options,
      'WebLLM tardó demasiado en consultar su catálogo de modelos.',
    );
    const candidates = curateTutorModelCatalog(buildTutorModelCatalog(records, maxVramMB));
    const cachedEntries = await withTimeoutAndAbort(
      Promise.all(candidates.map(async (candidate) => [candidate.id, await dependencies.hasModelInCache(candidate.id)] as const)),
      options,
      'La consulta de la caché de modelos tardó demasiado.',
    );
    return curateTutorModelCatalog(buildTutorModelCatalog(
      records,
      maxVramMB,
      new Set(cachedEntries.filter(([, cached]) => cached).map(([id]) => id)),
    ));
  }

  async inspectModel(model = DEFAULT_LOCAL_GENERATION_MODEL, options: LocalGenerationOptions = {}): Promise<LocalModelInfo> {
    const dependencies = this.resolvedDependencies();
    const [record, cached] = await withTimeoutAndAbort(
      Promise.all([dependencies.getModelRecord(model), dependencies.hasModelInCache(model)]),
      options,
      'La consulta de la caché del modelo tardó demasiado.',
    );
    if (!record) throw new Error(`WebLLM no reconoce el modelo ${model}.`);
    return {
      model,
      engine: LOCAL_GENERATION_ENGINE,
      device: LOCAL_GENERATION_DEVICE,
      cached,
      estimatedVramMB: record.vram_required_MB ?? 0,
      contextWindowSize: record.overrides?.context_window_size ?? 0,
    };
  }

  async generate(request: LocalGenerationRequest, options: LocalGenerationOptions = {}): Promise<LocalGenerationResult> {
    if (!this.resolvedDependencies().hasWebGpu()) {
      throw new Error('WebGPU no está disponible en este navegador o dispositivo. Este laboratorio no usa una ruta alternativa.');
    }
    const model = options.model ?? DEFAULT_LOCAL_GENERATION_MODEL;
    const engine = await withTimeoutAndAbort(
      this.ensureEngine(model, options.onProgress),
      { ...options, timeoutMs: options.timeoutMs ?? 300_000 },
      'WebLLM tardó demasiado en preparar el modelo WebGPU.',
      () => this.stopCurrentGeneration(true),
    );
    options.onProgress?.({ status: 'inference', label: 'Generando con WebLLM en la GPU de este dispositivo…' });
    const startedAt = performance.now();
    const responseFormat = responseFormatFor(request);
    const isQwen3 = model.startsWith('Qwen3-');
    const enableThinking = request.enableThinking ?? (responseFormat ? false : undefined);
    // Direct tutor answers must pass protocol validation before becoming visible.
    const deferChunks = isQwen3 && request.enableThinking === false;
    let finishReason: LocalGenerationResult['finishReason'];

    const generate = async () => {
      const stream = await engine.chat.completions.create({
        messages: request.messages,
        temperature: Math.max(0, Math.min(2, request.temperature ?? 0.2)),
        top_p: Math.max(0.1, Math.min(1, request.topP ?? 0.9)),
        max_tokens: Math.max(16, Math.min(1_536, request.maxNewTokens)),
        stream: true,
        ...(responseFormat ? { response_format: responseFormat } : {}),
        ...(isQwen3 && enableThinking !== undefined ? { extra_body: { enable_thinking: enableThinking } } : {}),
      });
      let text = '';
      for await (const chunk of stream) {
        if (chunk.choices[0]?.finish_reason) finishReason = chunk.choices[0].finish_reason;
        const piece = chunk.choices[0]?.delta.content ?? '';
        if (!piece) continue;
        text += piece;
        if (!deferChunks) options.onChunk?.(piece);
      }
      return text.trim();
    };

    try {
      const rawText = await withTimeoutAndAbort(
        generate(),
        { ...options, timeoutMs: options.timeoutMs ?? 180_000 },
        'WebLLM tardó demasiado en generar la respuesta.',
        () => this.stopCurrentGeneration(false),
      );
      // Qwen3 emits empty reasoning tags even with thinking disabled. Remove
      // only that protocol prefix; nonempty reasoning must still fail JSON validation.
      const text = isQwen3 && enableThinking === false
        ? rawText.replace(/^\s*<think>\s*<\/think>\s*/u, '')
        : rawText;
      if (deferChunks && /^\s*<think>/u.test(text)) {
        throw new Error('El modelo no produjo una respuesta final. No se mostrará su borrador interno; vuelve a intentarlo con una pregunta breve.');
      }
      if (!text) throw new Error('El modelo WebGPU terminó sin producir texto.');
      let structuredWarning: string | undefined;
      if (request.expectedFormat === 'json_object') {
        try {
          const value: unknown = JSON.parse(text);
          if (!value || Array.isArray(value) || typeof value !== 'object') {
            throw new Error('La salida JSON debe ser un objeto.');
          }
          if (request.expectedJsonKeys?.length) {
            const actualKeys = Object.keys(value as Record<string, unknown>).sort();
            const expectedKeys = [...new Set(request.expectedJsonKeys)].sort();
            if (actualKeys.join('\0') !== expectedKeys.join('\0')) {
              throw new Error(`El JSON debe contener exactamente estas claves: ${expectedKeys.join(', ')}. Recibió: ${actualKeys.join(', ') || 'ninguna'}.`);
            }
          }
        } catch {
          const detail = (() => {
            try {
              const value = JSON.parse(text) as Record<string, unknown>;
              const actualKeys = value && typeof value === 'object' && !Array.isArray(value) ? Object.keys(value).sort() : [];
              const expectedKeys = [...new Set(request.expectedJsonKeys ?? [])].sort();
              return expectedKeys.length && actualKeys.join('\0') !== expectedKeys.join('\0')
                ? ` Debía contener exactamente: ${expectedKeys.join(', ')}. Recibió: ${actualKeys.join(', ') || 'ninguna'}.`
                : '';
            } catch {
              return '';
            }
          })();
          const message = `El modelo generó texto, pero no produjo el objeto JSON válido que exigía la práctica.${detail}`;
          if (!request.allowInvalidStructuredOutput) throw new Error(message);
          structuredWarning = message;
        }
      }
      const qualityIssue = assessSpanishGeneration(text);
      if (qualityIssue?.severity === 'unsafe') throw new Error(qualityIssue.message);
      if (deferChunks) options.onChunk?.(text);
      return {
        text,
        ...(finishReason ? { finishReason } : {}),
        warning: qualityIssue?.message ?? structuredWarning,
        model,
        engine: LOCAL_GENERATION_ENGINE,
        device: LOCAL_GENERATION_DEVICE,
        elapsedMs: Math.round(performance.now() - startedAt),
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      throw new Error(explainLocalGenerationError(error));
    }
  }

  dispose() {
    this.engineEpoch += 1;
    this.engine?.interruptGenerate();
    void this.engine?.unload();
    this.worker?.terminate();
    this.engine = null;
    this.enginePromise = null;
    this.activeModel = null;
    this.loadingModel = null;
    this.worker = null;
  }

  private resolvedDependencies(): LocalGenerationDependencies {
    return { ...defaultDependencies, ...this.dependencies };
  }

  private async ensureEngine(model: string, onProgress?: LocalGenerationOptions['onProgress']) {
    const epoch = this.engineEpoch;
    if (this.engine && this.activeModel === model) return this.engine;
    if (this.enginePromise && this.loadingModel === model) return this.enginePromise;
    if (this.enginePromise) await this.enginePromise.catch(() => undefined);
    if (epoch !== this.engineEpoch) throw new DOMException('La preparación fue cancelada.', 'AbortError');
    if (this.engine && this.activeModel !== model) {
      const previousEngine = this.engine;
      const previousWorker = this.worker;
      this.engine = null;
      this.worker = null;
      this.activeModel = null;
      await previousEngine.unload();
      previousWorker?.terminate();
    }
    if (epoch !== this.engineEpoch) throw new DOMException('La preparación fue cancelada.', 'AbortError');
    if (!this.enginePromise) {
      const dependencies = this.resolvedDependencies();
      const worker = dependencies.createWorker();
      this.worker = worker;
      this.loadingModel = model;
      this.enginePromise = dependencies.createEngine(worker, model, (report) => {
        if (epoch !== this.engineEpoch) return;
        const progress = Number.isFinite(report.progress) ? Math.max(0, Math.min(1, report.progress)) : undefined;
        onProgress?.({
          status: progress !== undefined && progress < 1 ? 'download' : 'load',
          label: progress !== undefined ? `Preparando modelo local: ${Math.round(progress * 100)}%` : 'Preparando modelo local…',
          progress,
        });
      }).then((engine) => {
        if (epoch !== this.engineEpoch) {
          void engine.unload().catch(() => undefined);
          throw new DOMException('La preparación fue cancelada.', 'AbortError');
        }
        this.engine = engine;
        this.enginePromise = null;
        this.activeModel = model;
        this.loadingModel = null;
        return engine;
      }).catch((error) => {
        if (epoch !== this.engineEpoch) throw error;
        worker.terminate();
        this.worker = null;
        this.enginePromise = null;
        this.loadingModel = null;
        throw error;
      });
    }
    return this.enginePromise;
  }

  private stopCurrentGeneration(discardEngine: boolean) {
    this.engine?.interruptGenerate();
    if (!discardEngine) return;
    this.engineEpoch += 1;
    this.worker?.terminate();
    this.worker = null;
    this.engine = null;
    this.enginePromise = null;
    this.activeModel = null;
    this.loadingModel = null;
  }
}
