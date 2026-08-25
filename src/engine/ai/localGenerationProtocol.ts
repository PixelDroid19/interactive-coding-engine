export const DEFAULT_LOCAL_GENERATION_MODEL = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';
export const LOCAL_GENERATION_ENGINE = 'WebLLM' as const;
export const LOCAL_GENERATION_DEVICE = 'webgpu' as const;

export interface LocalChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LocalGenerationRequest {
  messages: LocalChatMessage[];
  temperature?: number;
  topP?: number;
  maxNewTokens: number;
  expectedFormat?: 'text' | 'json_object';
  expectedJsonKeys?: string[];
}

export interface LocalModelInfo {
  model: string;
  engine: typeof LOCAL_GENERATION_ENGINE;
  device: typeof LOCAL_GENERATION_DEVICE;
  cached: boolean;
  estimatedVramMB: number;
  contextWindowSize: number;
}

export interface LocalGenerationResult {
  text: string;
  warning?: string;
  model: string;
  engine: typeof LOCAL_GENERATION_ENGINE;
  device: typeof LOCAL_GENERATION_DEVICE;
  elapsedMs: number;
}

export interface GenerationProgress {
  status: 'download' | 'load' | 'inference';
  label: string;
  progress?: number;
}
