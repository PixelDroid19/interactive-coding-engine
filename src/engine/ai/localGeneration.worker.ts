/// <reference lib="webworker" />

import {
  ModelRegistry,
  TextStreamer,
  pipeline,
  type TextGenerationPipeline,
} from '@huggingface/transformers';
import type {
  GenerationWorkerInbound,
  GenerationWorkerOutbound,
  LocalChatMessage,
} from './localGenerationProtocol';
import { DEFAULT_LOCAL_GENERATION_DTYPE } from './localGenerationProtocol';
import { validateSpanishGeneration } from './localOutputQuality';

declare const self: DedicatedWorkerGlobalScope;

const generators = new Map<string, Promise<TextGenerationPipeline>>();
const cancelled = new Set<number>();
const MODEL_OPTIONS = { device: 'webgpu' as const, dtype: DEFAULT_LOCAL_GENERATION_DTYPE };

function send(message: GenerationWorkerOutbound) {
  self.postMessage(message);
}

function progressNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value > 1 ? value / 100 : value))
    : undefined;
}

async function inspect(message: Extract<GenerationWorkerInbound, { type: 'generation/inspect' }>) {
  try {
    send({ type: 'generation/progress', requestId: message.requestId, status: 'inspect', label: 'Consultando archivos y caché del modelo…' });
    const files = await ModelRegistry.get_pipeline_files('text-generation', message.model, MODEL_OPTIONS);
    const [metadata, cached, dtypes] = await Promise.all([
      Promise.all(files.map((file) => ModelRegistry.get_file_metadata(message.model, file))),
      ModelRegistry.is_pipeline_cached('text-generation', message.model, MODEL_OPTIONS),
      ModelRegistry.get_available_dtypes(message.model),
    ]);
    if (cancelled.delete(message.requestId)) return;
    send({
      type: 'generation/model-info',
      requestId: message.requestId,
      model: message.model,
      cached,
      downloadBytes: metadata.reduce((total, file) => total + (file.size ?? 0), 0),
      dtypes,
    });
  } catch (error) {
    send({ type: 'generation/error', requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
  }
}

function getGenerator(model: string, requestId: number) {
  let current = generators.get(model);
  if (!current) {
    send({ type: 'generation/progress', requestId, status: 'load', label: 'Preparando Transformers.js y WebGPU…' });
    current = pipeline('text-generation', model, {
      ...MODEL_OPTIONS,
      progress_callback: (event: unknown) => {
        const detail = event && typeof event === 'object' ? event as Record<string, unknown> : {};
        const totalProgress = detail.status === 'progress_total' ? progressNumber(detail.progress) : undefined;
        send({
          type: 'generation/progress',
          requestId,
          status: 'download',
          label: totalProgress === undefined ? 'Descargando archivos del modelo…' : `Descargando modelo: ${Math.round(totalProgress * 100)}%`,
          progress: totalProgress ?? progressNumber(detail.progress),
          loaded: typeof detail.loaded === 'number' ? detail.loaded : undefined,
          total: typeof detail.total === 'number' ? detail.total : undefined,
        });
      },
    });
    generators.set(model, current);
    current.catch(() => generators.delete(model));
  }
  return current;
}

function responseText(output: unknown): string {
  if (!Array.isArray(output) || output.length === 0) return '';
  const generated = (output[0] as { generated_text?: unknown }).generated_text;
  if (typeof generated === 'string') return generated.trim();
  if (Array.isArray(generated)) {
    const last = generated.at(-1) as { content?: unknown } | undefined;
    return typeof last?.content === 'string' ? last.content.trim() : '';
  }
  return '';
}

async function generate(message: Extract<GenerationWorkerInbound, { type: 'generation/run' }>) {
  try {
    if (!('gpu' in navigator)) throw new Error('WebGPU no está disponible en este navegador o dispositivo.');
    const generator = await getGenerator(message.model, message.requestId);
    if (cancelled.delete(message.requestId)) return;
    send({ type: 'generation/progress', requestId: message.requestId, status: 'inference', label: 'Generando en la GPU de este dispositivo…' });
    const startedAt = performance.now();
    const streamer = new TextStreamer(generator.tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: (chunk) => {
        if (!cancelled.has(message.requestId) && chunk) {
          send({ type: 'generation/chunk', requestId: message.requestId, chunk });
        }
      },
    });
    const output = await generator(message.messages as LocalChatMessage[], {
      max_new_tokens: Math.max(16, Math.min(256, message.maxNewTokens)),
      do_sample: (message.temperature ?? 0) > 0.01,
      temperature: Math.max(0.01, Math.min(1.5, message.temperature ?? 0.2)),
      top_p: Math.max(0.1, Math.min(1, message.topP ?? 0.9)),
      top_k: 50,
      repetition_penalty: 1.05,
      streamer,
    });
    if (cancelled.delete(message.requestId)) return;
    const text = responseText(output);
    if (!text) throw new Error('El modelo local terminó sin producir texto.');
    const qualityError = validateSpanishGeneration(text);
    if (qualityError) throw new Error(qualityError);
    send({
      type: 'generation/result',
      requestId: message.requestId,
      text,
      model: message.model,
      device: 'webgpu',
      elapsedMs: Math.round(performance.now() - startedAt),
    });
  } catch (error) {
    if (cancelled.delete(message.requestId)) return;
    send({ type: 'generation/error', requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
  }
}

self.addEventListener('message', (event: MessageEvent<GenerationWorkerInbound>) => {
  const message = event.data;
  if (message.type === 'generation/cancel') {
    cancelled.add(message.requestId);
    return;
  }
  if (message.type === 'generation/inspect') void inspect(message);
  else void generate(message);
});

export {};
