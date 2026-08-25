import type { Course, CourseModule } from '../../types/curriculum';
import type { ScrimLessonData } from '../../types/scrim';

export const AI_ENGINEER_MODULES: CourseModule[] = [
  { id: 'ai-mod-00-trabajo', title: 'Módulo 0: Preparar el trabajo', description: 'Del problema de producto al entorno y los contratos básicos.', items: [] },
  { id: 'ai-mod-01-llm', title: 'Módulo 1: Cómo funciona un LLM', description: 'Tokens, contexto, inferencia, sampling, entrenamiento y límites.', items: [] },
  { id: 'ai-mod-02-prompts', title: 'Módulo 2: Prompt engineering', description: 'Instrucciones, ejemplos, esquemas, tools, streaming y caché.', items: [] },
  { id: 'ai-mod-03-contexto', title: 'Módulo 3: Context engineering', description: 'Selección, memoria, compactación, aislamiento y fallos de contexto.', items: [] },
  { id: 'ai-mod-04-modelos', title: 'Módulo 4: Modelos y proveedores', description: 'Modelos abiertos, locales, alojados y contratos de API.', items: [] },
  { id: 'ai-mod-05-embeddings', title: 'Módulo 5: Embeddings', description: 'Representaciones vectoriales, similitud y búsqueda semántica.', items: [] },
  { id: 'ai-mod-06-vectores', title: 'Módulo 6: Bases vectoriales', description: 'Documentos, metadatos, índices, filtros y decisiones de almacenamiento.', items: [] },
  { id: 'ai-mod-07-rag', title: 'Módulo 7: RAG', description: 'Ingesta, recuperación, generación con citas y evaluación.', items: [] },
  { id: 'ai-mod-08-agentes-mcp', title: 'Módulo 8: Agentes y MCP', description: 'Herramientas, bucles, límites, sistemas múltiples y MCP.', items: [] },
  { id: 'ai-mod-09-seguridad', title: 'Módulo 9: Seguridad, privacidad y uso responsable', description: 'Inyección, permisos, datos, sesgos, controles y registros.', items: [] },
  { id: 'ai-mod-10-evaluacion', title: 'Módulo 10: Evaluación y observabilidad', description: 'Casos, métricas, trazas, costes y regresiones.', items: [] },
  { id: 'ai-mod-11-multimodal', title: 'Módulo 11: IA multimodal y herramientas', description: 'Imagen, audio, aplicaciones multimodales y asistencia al desarrollo.', items: [] },
  { id: 'ai-mod-12-proyecto-final', title: 'Módulo 12: Proyecto final', description: 'Diseño, construcción, ataque, medición y presentación.', items: [] },
];

export const AI_ENGINEER_SCRIMS: Record<string, ScrimLessonData> = {};

export const AI_ENGINEER_COURSE: Course = {
  id: 'course-ai-engineer',
  slug: 'ai-engineer',
  title: 'AI Engineer: de fundamentos a sistemas confiables',
  tagline: 'Construye funciones de IA entendiendo datos, modelos, recuperación, agentes, seguridad y evaluación.',
  description: 'Curso progresivo con clases visuales silenciosas, lecturas con fuentes, prácticas equivalentes en JavaScript y Python, y proyectos que se prueban con casos observables.',
  level: 'Intermediate',
  tags: ['IA aplicada', 'JavaScript', 'Python'],
  instructor: {
    name: 'Kit',
    role: 'Instructor de ingeniería de IA',
    bio: 'Enseña a tratar modelos y herramientas como partes comprobables de un sistema de producto.',
  },
  thumbnailGradient: 'from-fuchsia-600 via-violet-900 to-slate-950',
  conceptGlossary: {},
  modules: AI_ENGINEER_MODULES,
};
