export const DEFAULT_LOCAL_GENERATION_MODEL = 'onnx-community/LFM2.5-350M-ONNX';
export const DEFAULT_LOCAL_GENERATION_DTYPE = 'q4' as const;

export interface LocalChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LocalGenerationRequest {
  messages: LocalChatMessage[];
  temperature?: number;
  topP?: number;
  maxNewTokens: number;
}

export interface LocalModelInfo {
  model: string;
  cached: boolean;
  downloadBytes: number;
  dtypes: string[];
}

export interface LocalGenerationResult {
  text: string;
  model: string;
  device: 'webgpu';
  elapsedMs: number;
}

export type GenerationWorkerInbound =
  | { type: 'generation/inspect'; requestId: number; model: string }
  | ({ type: 'generation/run'; requestId: number; model: string } & LocalGenerationRequest)
  | { type: 'generation/cancel'; requestId: number };

export type GenerationWorkerOutbound =
  | {
      type: 'generation/progress';
      requestId: number;
      status: 'inspect' | 'download' | 'load' | 'inference';
      label: string;
      progress?: number;
      loaded?: number;
      total?: number;
    }
  | { type: 'generation/chunk'; requestId: number; chunk: string }
  | ({ type: 'generation/model-info'; requestId: number } & LocalModelInfo)
  | ({ type: 'generation/result'; requestId: number } & LocalGenerationResult)
  | { type: 'generation/error'; requestId: number; message: string };

export type GenerationProgress = Extract<GenerationWorkerOutbound, { type: 'generation/progress' }>;
