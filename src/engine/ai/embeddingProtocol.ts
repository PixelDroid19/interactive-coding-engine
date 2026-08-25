export const DEFAULT_EMBEDDING_MODEL = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';

export type EmbeddingWorkerInbound =
  | {
      type: 'embedding/run';
      requestId: number;
      texts: string[];
      model: string;
    }
  | { type: 'embedding/cancel'; requestId: number };

export type EmbeddingWorkerOutbound =
  | {
      type: 'embedding/progress';
      requestId: number;
      status: 'init' | 'download' | 'ready' | 'inference';
      label: string;
      progress?: number;
      loaded?: number;
      total?: number;
    }
  | {
      type: 'embedding/result';
      requestId: number;
      vectors: number[][];
      model: string;
    }
  | { type: 'embedding/error'; requestId: number; message: string };

export type EmbeddingProgress = Extract<EmbeddingWorkerOutbound, { type: 'embedding/progress' }>;
