/// <reference lib="webworker" />

import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers';
import {
  type EmbeddingWorkerInbound,
  type EmbeddingWorkerOutbound,
} from './embeddingProtocol';

declare const self: DedicatedWorkerGlobalScope;

const pipelines = new Map<string, Promise<FeatureExtractionPipeline>>();
const cancelled = new Set<number>();

function send(message: EmbeddingWorkerOutbound) {
  self.postMessage(message);
}

function progressNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value > 1 ? value / 100 : value))
    : undefined;
}

function getPipeline(model: string, requestId: number) {
  let current = pipelines.get(model);
  if (!current) {
    send({ type: 'embedding/progress', requestId, status: 'init', label: 'Preparando el modelo local…' });
    current = pipeline('feature-extraction', model, {
      dtype: 'q4f16',
      device: 'webgpu',
      progress_callback: (event: unknown) => {
        const detail = event && typeof event === 'object' ? event as Record<string, unknown> : {};
        send({
          type: 'embedding/progress',
          requestId,
          status: 'download',
          label: typeof detail.file === 'string' ? `Descargando ${detail.file}` : 'Descargando el modelo local…',
          progress: progressNumber(detail.progress),
          loaded: typeof detail.loaded === 'number' ? detail.loaded : undefined,
          total: typeof detail.total === 'number' ? detail.total : undefined,
        });
      },
    });
    pipelines.set(model, current);
    current.catch(() => pipelines.delete(model));
  }
  return current;
}

function toVectors(value: unknown): number[][] {
  if (!Array.isArray(value)) throw new Error('El modelo no devolvió una matriz de vectores.');
  if (value.length > 0 && typeof value[0] === 'number') return [value as number[]];
  if (!value.every((row) => Array.isArray(row) && row.every((entry) => typeof entry === 'number'))) {
    throw new Error('El modelo devolvió valores que no son números.');
  }
  return value as number[][];
}

async function embed(message: Extract<EmbeddingWorkerInbound, { type: 'embedding/run' }>) {
  try {
    if (!('gpu' in navigator)) {
      throw new Error('WebGPU no está disponible. Este laboratorio no usa vectores simulados ni una ruta CPU.');
    }
    const extractor = await getPipeline(message.model, message.requestId);
    if (cancelled.delete(message.requestId)) return;
    send({ type: 'embedding/progress', requestId: message.requestId, status: 'inference', label: 'Calculando embeddings reales con WebGPU…' });
    const tensor = await extractor(message.texts, { pooling: 'mean', normalize: true });
    if (cancelled.delete(message.requestId)) return;
    const vectors = toVectors(tensor.tolist());
    tensor.dispose();
    send({
      type: 'embedding/result',
      requestId: message.requestId,
      vectors,
      model: message.model,
    });
  } catch (error) {
    if (cancelled.delete(message.requestId)) return;
    send({
      type: 'embedding/error',
      requestId: message.requestId,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

self.addEventListener('message', (event: MessageEvent<EmbeddingWorkerInbound>) => {
  const message = event.data;
  if (message.type === 'embedding/cancel') {
    cancelled.add(message.requestId);
    return;
  }
  void embed(message);
});

export {};
