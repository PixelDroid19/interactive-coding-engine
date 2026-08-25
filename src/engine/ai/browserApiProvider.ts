import type {
  BrowserProviderConfig,
  LearningGenerationRequest,
  LearningGenerationResult,
  LearningModelProvider,
} from './learningProvider';

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const DEFAULT_ENDPOINTS = {
  'openai-compatible': 'https://api.openai.com/v1/chat/completions',
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
  anthropic: 'https://api.anthropic.com/v1/messages',
} as const;

function endpointFor(config: BrowserProviderConfig): string {
  if (config.endpoint) return config.endpoint;
  if (config.kind === 'gemini') {
    return `${DEFAULT_ENDPOINTS.gemini}/models/${encodeURIComponent(config.model)}:generateContent`;
  }
  return DEFAULT_ENDPOINTS[config.kind];
}

function assertSafeEndpoint(endpoint: string) {
  const url = new URL(endpoint);
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]';
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) {
    throw new Error('Las APIs remotas deben usar HTTPS. Solo localhost puede usar HTTP durante el desarrollo.');
  }
}

function scrubSecret(message: string, secret: string) {
  return secret ? message.split(secret).join('[clave oculta]') : message;
}

function openAiRequest(config: BrowserProviderConfig, request: LearningGenerationRequest): RequestInit {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.2,
      ...(request.maxTokens ? { max_tokens: request.maxTokens } : {}),
      ...(request.jsonSchema ? {
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'respuesta_del_ejercicio', strict: true, schema: request.jsonSchema },
        },
      } : {}),
    }),
    signal: request.signal,
  };
}

function geminiRequest(config: BrowserProviderConfig, request: LearningGenerationRequest): RequestInit {
  const system = request.messages.filter((message) => message.role === 'system').map((message) => message.content).join('\n');
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.apiKey },
    body: JSON.stringify({
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      contents: request.messages
        .filter((message) => message.role !== 'system')
        .map((message) => ({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.content }],
        })),
      generationConfig: {
        temperature: request.temperature ?? 0.2,
        ...(request.maxTokens ? { maxOutputTokens: request.maxTokens } : {}),
        ...(request.jsonSchema ? { responseMimeType: 'application/json', responseJsonSchema: request.jsonSchema } : {}),
      },
    }),
    signal: request.signal,
  };
}

function anthropicRequest(config: BrowserProviderConfig, request: LearningGenerationRequest): RequestInit {
  const system = request.messages.filter((message) => message.role === 'system').map((message) => message.content).join('\n');
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: request.maxTokens ?? 1_024,
      ...(system ? { system } : {}),
      messages: request.messages
        .filter((message) => message.role !== 'system')
        .map((message) => ({ role: message.role, content: message.content })),
      temperature: request.temperature ?? 0.2,
    }),
    signal: request.signal,
  };
}

function responseText(kind: BrowserProviderConfig['kind'], payload: any): string {
  if (kind === 'gemini') return payload?.candidates?.[0]?.content?.parts?.map((part: any) => part.text ?? '').join('') ?? '';
  if (kind === 'anthropic') return payload?.content?.filter((part: any) => part.type === 'text').map((part: any) => part.text).join('') ?? '';
  const content = payload?.choices?.[0]?.message?.content;
  return typeof content === 'string' ? content : '';
}

export class BrowserApiProvider implements LearningModelProvider {
  private readonly config: BrowserProviderConfig;
  private readonly endpoint: string;

  constructor(config: BrowserProviderConfig, private readonly fetcher: FetchLike = fetch) {
    if (!config.apiKey.trim()) throw new Error('Escribe una clave de API para esta sesión.');
    if (!config.model.trim()) throw new Error('Elige un modelo antes de continuar.');
    this.config = { ...config };
    this.endpoint = endpointFor(this.config);
    assertSafeEndpoint(this.endpoint);
  }

  async generate(request: LearningGenerationRequest): Promise<LearningGenerationResult> {
    const init = this.config.kind === 'gemini'
      ? geminiRequest(this.config, request)
      : this.config.kind === 'anthropic'
        ? anthropicRequest(this.config, request)
        : openAiRequest(this.config, request);
    try {
      const response = await this.fetcher(this.endpoint, init);
      if (!response.ok) {
        throw new Error(`La API respondió con estado ${response.status}. Revisa la clave, el modelo y los límites del proveedor.`);
      }
      const payload = await response.json();
      const text = responseText(this.config.kind, payload);
      if (!text) throw new Error('La API respondió sin texto utilizable.');
      return {
        text,
        model: this.config.model,
        provider: this.config.kind,
        usage: this.config.kind === 'openai-compatible'
          ? { inputTokens: payload?.usage?.prompt_tokens, outputTokens: payload?.usage?.completion_tokens }
          : undefined,
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(scrubSecret(message, this.config.apiKey));
    }
  }
}

export class ProviderSessionStore {
  private readonly sessions = new Map<string, BrowserProviderConfig>();

  set(scope: string, config: BrowserProviderConfig) {
    this.sessions.set(scope, { ...config });
  }

  get(scope: string): BrowserProviderConfig | null {
    const config = this.sessions.get(scope);
    return config ? { ...config } : null;
  }

  clear(scope?: string) {
    if (scope) this.sessions.delete(scope);
    else this.sessions.clear();
  }
}
