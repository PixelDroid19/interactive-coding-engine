import type { ReadingSource } from '../../types/curriculum';
import type { AISourceId } from './types';

export const AI_SOURCES: Record<AISourceId, ReadingSource> = {
  'roadmap-ai-engineer': { title: 'AI Engineer Roadmap', url: 'https://roadmap.sh/ai-engineer', publisher: 'roadmap.sh', purpose: 'Mapa general de capacidades y responsabilidades del rol.' },
  'pyodide-usage': { title: 'Using Pyodide', url: 'https://pyodide.org/en/stable/usage/index.html', publisher: 'Pyodide', purpose: 'Ejecución de Python y paquetes dentro del navegador.' },
  'pyodide-worker': { title: 'Using Pyodide in a Web Worker', url: 'https://pyodide.org/en/stable/usage/webworker.html', publisher: 'Pyodide', purpose: 'Aislamiento del runtime para no bloquear la interfaz.' },
  'hf-llm-course': { title: 'Hugging Face LLM Course', url: 'https://huggingface.co/learn/llm-course/', publisher: 'Hugging Face', purpose: 'Fundamentos de modelos, tokenización, entrenamiento e inferencia.' },
  'transformers-js': { title: 'Transformers.js', url: 'https://huggingface.co/docs/transformers.js/index', publisher: 'Hugging Face', purpose: 'Modelos de inferencia que corren directamente en el navegador.' },
  'hf-model-hub': { title: 'Hugging Face Hub documentation', url: 'https://huggingface.co/docs/hub/models-the-hub', publisher: 'Hugging Face', purpose: 'Model cards, tareas, artefactos y evaluación de modelos publicados.' },
  'openai-prompting': { title: 'Prompt engineering', url: 'https://platform.openai.com/docs/guides/prompt-engineering', publisher: 'OpenAI', purpose: 'Ejemplo de guía de proveedor para diseñar instrucciones.' },
  'openai-function-calling': { title: 'Function calling', url: 'https://platform.openai.com/docs/guides/function-calling', publisher: 'OpenAI', purpose: 'Contrato de herramientas y argumentos estructurados.' },
  'google-prompt-design': { title: 'Prompt design strategies', url: 'https://ai.google.dev/gemini-api/docs/prompting-strategies', publisher: 'Google AI for Developers', purpose: 'Estrategias de instrucciones, ejemplos y contexto.' },
  'google-structured-output': { title: 'Structured outputs', url: 'https://ai.google.dev/gemini-api/docs/structured-output', publisher: 'Google AI for Developers', purpose: 'Respuestas JSON restringidas por esquema.' },
  'google-function-calling': { title: 'Function calling', url: 'https://ai.google.dev/gemini-api/docs/function-calling', publisher: 'Google AI for Developers', purpose: 'Declaración y ejecución de herramientas.' },
  'anthropic-prompt-engineering': { title: 'Prompt engineering overview', url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview', publisher: 'Anthropic', purpose: 'Proceso de diseño y prueba de instrucciones.' },
  'anthropic-tool-use': { title: 'Tool use', url: 'https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview', publisher: 'Anthropic', purpose: 'Esquemas, llamadas y resultados de herramientas.' },
  'anthropic-prompt-caching': { title: 'Prompt caching', url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching', publisher: 'Anthropic', purpose: 'Reutilización de prefijos de contexto y sus límites.' },
  'sentence-transformers-semantic-search': { title: 'Semantic Search', url: 'https://www.sbert.net/examples/sentence_transformer/applications/semantic-search/README.html', publisher: 'Sentence Transformers', purpose: 'Embeddings, similitud y recuperación semántica.' },
  'qdrant-vector-search': { title: 'Search', url: 'https://qdrant.tech/documentation/concepts/search/', publisher: 'Qdrant', purpose: 'Consultas vectoriales, puntuaciones y parámetros de búsqueda.' },
  'qdrant-filtering': { title: 'Filtering', url: 'https://qdrant.tech/documentation/concepts/filtering/', publisher: 'Qdrant', purpose: 'Metadatos, condiciones y combinación con búsqueda vectorial.' },
  'rag-paper': { title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', url: 'https://arxiv.org/abs/2005.11401', publisher: 'Lewis et al.', purpose: 'Artículo original que formaliza la combinación de recuperación y generación.' },
  'mcp-architecture': { title: 'Architecture overview', url: 'https://modelcontextprotocol.io/docs/learn/architecture', publisher: 'Model Context Protocol', purpose: 'Relación entre host, cliente y servidor MCP.' },
  'mcp-specification': { title: 'Model Context Protocol specification', url: 'https://modelcontextprotocol.io/specification/', publisher: 'Model Context Protocol', purpose: 'Contratos de recursos, prompts, tools y transportes.' },
  'owasp-genai-top10': { title: 'OWASP Top 10 for LLM Applications', url: 'https://genai.owasp.org/llm-top-10/', publisher: 'OWASP GenAI Security Project', purpose: 'Riesgos frecuentes y controles para aplicaciones con modelos.' },
  'owasp-prompt-injection': { title: 'Prompt Injection', url: 'https://genai.owasp.org/llmrisk/llm01-prompt-injection/', publisher: 'OWASP GenAI Security Project', purpose: 'Inyección directa e indirecta y medidas de reducción de riesgo.' },
  'ragas-metrics': { title: 'Ragas metrics', url: 'https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/', publisher: 'Ragas', purpose: 'Métricas específicas para recuperación y generación.' },
  'deepeval-evaluation': { title: 'LLM evaluation', url: 'https://deepeval.com/docs/getting-started', publisher: 'DeepEval', purpose: 'Casos, métricas y pruebas de regresión para sistemas de IA.' },
};

export function sourcesFor(ids: AISourceId[]): ReadingSource[] {
  return ids.map((id) => ({ ...AI_SOURCES[id] }));
}
