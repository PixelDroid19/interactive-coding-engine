import type { InitProgressReport, ModelRecord } from '@mlc-ai/web-llm';
import {
  DEFAULT_LOCAL_GENERATION_MODEL,
  LOCAL_GENERATION_DEVICE,
  LOCAL_GENERATION_ENGINE,
  type GenerationProgress,
  type LocalGenerationRequest,
  type LocalGenerationResult,
  type LocalModelInfo,
} from './localGenerationProtocol';
import { explainLocalGenerationError } from './localGenerationErrors';
import { assessSpanishGeneration } from './localOutputQuality';

interface StreamChunk {
  choices: Array<{ delta: { content?: string | null } }>;
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

  constructor(private readonly dependencies: Partial<LocalGenerationDependencies> = {}) {}

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

    const generate = async () => {
      const stream = await engine.chat.completions.create({
        messages: request.messages,
        temperature: Math.max(0, Math.min(2, request.temperature ?? 0.2)),
        top_p: Math.max(0.1, Math.min(1, request.topP ?? 0.9)),
        max_tokens: Math.max(16, Math.min(256, request.maxNewTokens)),
        stream: true,
        ...(responseFormat ? { response_format: responseFormat } : {}),
      });
      let text = '';
      for await (const chunk of stream) {
        const piece = chunk.choices[0]?.delta.content ?? '';
        if (!piece) continue;
        text += piece;
        options.onChunk?.(piece);
      }
      return text.trim();
    };

    try {
      const text = await withTimeoutAndAbort(
        generate(),
        { ...options, timeoutMs: options.timeoutMs ?? 180_000 },
        'WebLLM tardó demasiado en generar la respuesta.',
        () => this.stopCurrentGeneration(false),
      );
      if (!text) throw new Error('El modelo WebGPU terminó sin producir texto.');
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
          throw new Error(`El modelo generó texto, pero no produjo el objeto JSON válido que exigía la práctica.${detail}`);
        }
      }
      const qualityIssue = assessSpanishGeneration(text);
      if (qualityIssue?.severity === 'unsafe') throw new Error(qualityIssue.message);
      return {
        text,
        warning: qualityIssue?.message,
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
    if (this.engine && this.activeModel === model) return this.engine;
    if (this.enginePromise && this.loadingModel === model) return this.enginePromise;
    if (this.enginePromise) await this.enginePromise.catch(() => undefined);
    if (this.engine && this.activeModel !== model) {
      const previousEngine = this.engine;
      const previousWorker = this.worker;
      this.engine = null;
      this.worker = null;
      this.activeModel = null;
      await previousEngine.unload();
      previousWorker?.terminate();
    }
    if (!this.enginePromise) {
      const dependencies = this.resolvedDependencies();
      this.worker = dependencies.createWorker();
      this.loadingModel = model;
      this.enginePromise = dependencies.createEngine(this.worker, model, (report) => {
        const progress = Number.isFinite(report.progress) ? Math.max(0, Math.min(1, report.progress)) : undefined;
        onProgress?.({
          status: progress !== undefined && progress < 1 ? 'download' : 'load',
          label: report.text || (progress !== undefined ? `Preparando modelo WebGPU: ${Math.round(progress * 100)}%` : 'Preparando WebLLM…'),
          progress,
        });
      }).then((engine) => {
        this.engine = engine;
        this.enginePromise = null;
        this.activeModel = model;
        this.loadingModel = null;
        return engine;
      }).catch((error) => {
        this.worker?.terminate();
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
    this.worker?.terminate();
    this.worker = null;
    this.engine = null;
    this.enginePromise = null;
    this.activeModel = null;
    this.loadingModel = null;
  }
}
