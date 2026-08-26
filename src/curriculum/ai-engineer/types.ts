import type {
  ReadingSection,
  ReasoningActivity,
} from '../../types/curriculum';

export type AISourceId =
  | 'roadmap-ai-engineer'
  | 'pyodide-usage'
  | 'pyodide-worker'
  | 'hf-llm-course'
  | 'transformers-js'
  | 'transformers-js-v4'
  | 'lfm25-350m'
  | 'qwen25-05b'
  | 'webllm'
  | 'qwen25-webllm'
  | 'codepen-transformers-js'
  | 'hf-model-hub'
  | 'chrome-built-in-ai'
  | 'chrome-prompt-api'
  | 'chrome-summarizer-api'
  | 'chrome-writer-api'
  | 'openai-prompting'
  | 'openai-function-calling'
  | 'google-prompt-design'
  | 'google-structured-output'
  | 'google-function-calling'
  | 'anthropic-prompt-engineering'
  | 'anthropic-tool-use'
  | 'anthropic-prompt-caching'
  | 'sentence-transformers-semantic-search'
  | 'qdrant-vector-search'
  | 'qdrant-filtering'
  | 'rag-paper'
  | 'mcp-architecture'
  | 'mcp-specification'
  | 'owasp-genai-top10'
  | 'owasp-prompt-injection'
  | 'ragas-metrics'
  | 'deepeval-evaluation'
  | 'ollama-api'
  | 'lmstudio-api'
  | 'openrouter-api'
  | 'jina-embeddings'
  | 'langchain-retrieval'
  | 'llamaindex-rag'
  | 'haystack-intro'
  | 'ragflow-docs'
  | 'openai-agents-sdk'
  | 'anthropic-agent-sdk'
  | 'google-adk'
  | 'vertex-agent-builder'
  | 'langsmith-observability'
  | 'langfuse-docs'
  | 'helicone-docs'
  | 'arize-phoenix'
  | 'openai-image-audio'
  | 'google-video-understanding'
  | 'datahub-docs'
  | 'atlan-docs'
  | 'posthog-llm-analytics';

export interface AILanguageCode {
  example: string;
  starter: string;
  solution: string;
  debugStarter: string;
  packages?: string[];
}

export interface AIPracticeCase {
  args: unknown[];
  expected: unknown;
  description: string;
}

export interface AICapability {
  /** Nombre de la función o pieza que el estudiante añade al TutorLocal. */
  nombre: string;
  /** Qué gana el chat con esta pieza, en una frase. */
  descripcion: string;
}

export interface AIEngineerLessonSpec {
  number: number;
  module: number;
  title: string;
  summary: string;
  concepts: { label: string; desc: string }[];
  skillsRequired: string[];
  skillsIntroduced: string[];
  /** Capacidad que esta clase incorpora al chat del curso. */
  capacidad: AICapability;
  /** Cómo la pieza de hoy se conecta con lo que ya existe en el TutorLocal. */
  integracion: string;
  mentalModel: string;
  script: [string, string, string, string];
  javascript: AILanguageCode;
  python: AILanguageCode;
  practice: {
    title: string;
    instructions: string;
    functionName: string;
    cases: [AIPracticeCase, AIPracticeCase, ...AIPracticeCase[]];
    hints: [string, string, string];
  };
  reading: {
    sections: [ReadingSection, ReadingSection, ReadingSection, ReadingSection, ...ReadingSection[]];
    keyPoints: [string, string, ...string[]];
    questions: [{ question: string; answer: string }, ...{ question: string; answer: string }[]];
    transfer: string;
    sourceIds: [AISourceId, AISourceId, ...AISourceId[]];
  };
  reasoning: {
    activity: ReasoningActivity;
    explanation: string;
    hints: [string, string, ...string[]];
  };
  debug: {
    title: string;
    expected: string;
    observed: string;
    hints: [string, string, string];
  };
}
