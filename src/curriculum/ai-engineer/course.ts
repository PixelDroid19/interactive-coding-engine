import type { Course, CourseModule } from '../../types/curriculum';
import type { ScrimLessonData } from '../../types/scrim';
import { buildAiLessonBundle } from './factory';
import { AI_SPECS } from './modules';
import { AI_ENGINEER_PROJECTS_BY_MODULE } from './projects';

// Siete fases que construyen el TutorLocal, el chat educativo local del curso.
// Cada fase termina con un proyecto que integra las capacidades aprendidas.
const MODULE_DEFINITIONS: CourseModule[] = [
  {
    id: 'ai-fase-1-fundamentos',
    title: 'Pensamiento y fundamentos',
    description: 'Entradas, algoritmos, datos e inferencia: el esqueleto determinista del chat.',
    items: [],
  },
  {
    id: 'ai-fase-2-conversacion',
    title: 'Conversación con modelos',
    description: 'Roles, historial, instrucción del sistema, parámetros, streaming y salidas JSON.',
    items: [],
  },
  {
    id: 'ai-fase-3-modelo-local',
    title: 'Modelo local en el navegador',
    description: 'WebGPU, Workers, descarga y caché, selección de modelo y generación con WebLLM.',
    items: [],
  },
  {
    id: 'ai-fase-4-busqueda',
    title: 'Embeddings y búsqueda semántica',
    description: 'Vectores reales con Transformers.js sobre WebGPU, similitud y ranking top-k.',
    items: [],
  },
  {
    id: 'ai-fase-5-rag',
    title: 'Documentos y RAG',
    description: 'Lectura segura, chunking configurable, recuperación, presupuesto de contexto y citas.',
    items: [],
  },
  {
    id: 'ai-fase-6-confiable',
    title: 'Un sistema más confiable',
    description: 'Memoria, herramientas, inyección de prompts, evaluación, observabilidad y caché.',
    items: [],
  },
  {
    id: 'ai-fase-7-final',
    title: 'La aplicación completa',
    description: 'Arquitectura entera, medición con documentos propios y entrega reproducible.',
    items: [],
  },
];

const built = AI_SPECS.map((spec) => ({ spec, ...buildAiLessonBundle(spec) }));

export const AI_ENGINEER_MODULES: CourseModule[] = MODULE_DEFINITIONS.map((module, index) => ({
  ...module,
  items: [
    ...built
      .filter(({ spec }) => spec.module === index)
      .flatMap(({ item, reading, reasoning, debug }) => [item, reading, reasoning, debug]),
    ...(AI_ENGINEER_PROJECTS_BY_MODULE[index] ?? []),
  ],
}));

export const AI_ENGINEER_SCRIMS: Record<string, ScrimLessonData> = Object.fromEntries(
  built.map(({ lesson }) => [lesson.id, lesson]),
);

export const AI_ENGINEER_COURSE: Course = {
  id: 'course-ai-engineer',
  slug: 'ai-engineer',
  title: 'AI Engineer: construye un chat educativo local',
  tagline: 'Un solo producto que crece contigo: chat con reglas, modelo local en tu GPU, embeddings reales, RAG con citas y métricas.',
  description: 'Curso progresivo para personas nuevas. Cada clase añade una capacidad pequeña al TutorLocal, un chat educativo que corre entero en tu navegador con WebLLM y Transformers.js sobre WebGPU. Clases visuales silenciosas, lecturas con fuentes, prácticas equivalentes en JavaScript y Python, y proyectos que integran cada fase.',
  level: 'Beginner',
  tags: ['IA aplicada', 'JavaScript', 'Python', 'RAG local'],
  instructor: {
    name: 'Kit',
    role: 'Instructor de ingeniería de IA',
    bio: 'Enseña a construir sistemas de IA pieza por pieza, comprobando el comportamiento de cada una antes de conectarla.',
  },
  thumbnailGradient: 'from-fuchsia-600 via-violet-900 to-slate-950',
  conceptGlossary: Object.fromEntries(
    built.map(({ lesson, spec }) => [lesson.id, spec.concepts]),
  ),
  modules: AI_ENGINEER_MODULES,
};
