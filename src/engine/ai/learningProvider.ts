export type ProviderKind = 'deterministic' | 'openai-compatible' | 'gemini' | 'anthropic';

export interface LearningMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LearningGenerationRequest {
  messages: LearningMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonSchema?: Record<string, unknown>;
  signal?: AbortSignal;
}

export interface LearningGenerationResult {
  text: string;
  model: string;
  provider: ProviderKind;
  usage?: { inputTokens?: number; outputTokens?: number };
}

export interface LearningModelProvider {
  generate(request: LearningGenerationRequest): Promise<LearningGenerationResult>;
}

export interface BrowserProviderConfig {
  kind: Exclude<ProviderKind, 'deterministic'>;
  apiKey: string;
  model: string;
  endpoint?: string;
}
