import { Course, CurriculumItem, ScrimCurriculumItem } from '../../types/curriculum';
import { ScrimLessonData } from '../../types/scrim';
import { LESSON_01 } from './lesson01';
import { LESSON_02 } from './lesson02';
import { LESSON_03 } from './lesson03';
import { LESSON_04 } from './lesson04';
import { LESSON_05 } from './lesson05';
import { LESSON_06 } from './lesson06';
import { LESSON_07 } from './lesson07';
import { LESSON_08 } from './lesson08';
import { LESSON_09 } from './lesson09';
import { LESSON_10 } from './lesson10';
import { LESSON_11 } from './lesson11';
import { LESSON_12 } from './lesson12';
import { LESSON_13 } from './lesson13';
import { LESSON_14 } from './lesson14';
import { LESSON_15 } from './lesson15';
import { LESSON_16 } from './lesson16';
import { LESSON_17 } from './lesson17';
import { LESSON_18 } from './lesson18';
import { LESSON_19 } from './lesson19';
import { LESSON_20 } from './lesson20';
import { LESSON_21 } from './lesson21';
import { LESSON_22 } from './lesson22';
import { LESSON_23 } from './lesson23';
import { LESSON_24 } from './lesson24';
import { READING_BY_LESSON } from './readings';
import { conceptLabels } from './roadmap';
import { DEBUG_BY_LESSON } from './debugExercises';
import { REASONING_BY_LESSON } from './reasoningExercises';
import { PEDAGOGICAL_PROFILE_BY_LESSON } from './pedagogicalProfiles';

function withLessonTerms(lesson: ScrimLessonData): ScrimLessonData {
  const labels = conceptLabels(lesson.id);
  const profile = PEDAGOGICAL_PROFILE_BY_LESSON[lesson.id];
  return { ...lesson, ...(labels.length ? { concepts: labels } : {}), ...profile };
}

export const FUNDAMENTOS_SCRIMS: Record<string, ScrimLessonData> = {
  [LESSON_01.id]: withLessonTerms(LESSON_01),
  [LESSON_02.id]: withLessonTerms(LESSON_02),
  [LESSON_03.id]: withLessonTerms(LESSON_03),
  [LESSON_04.id]: withLessonTerms(LESSON_04),
  [LESSON_05.id]: withLessonTerms(LESSON_05),
  [LESSON_06.id]: withLessonTerms(LESSON_06),
  [LESSON_07.id]: withLessonTerms(LESSON_07),
  [LESSON_08.id]: withLessonTerms(LESSON_08),
  [LESSON_09.id]: withLessonTerms(LESSON_09),
  [LESSON_10.id]: withLessonTerms(LESSON_10),
  [LESSON_11.id]: withLessonTerms(LESSON_11),
  [LESSON_12.id]: withLessonTerms(LESSON_12),
  [LESSON_13.id]: withLessonTerms(LESSON_13),
  [LESSON_14.id]: withLessonTerms(LESSON_14),
  [LESSON_15.id]: withLessonTerms(LESSON_15),
  [LESSON_16.id]: withLessonTerms(LESSON_16),
  [LESSON_17.id]: withLessonTerms(LESSON_17),
  [LESSON_18.id]: withLessonTerms(LESSON_18),
  [LESSON_19.id]: withLessonTerms(LESSON_19),
  [LESSON_20.id]: withLessonTerms(LESSON_20),
  [LESSON_21.id]: withLessonTerms(LESSON_21),
  [LESSON_22.id]: withLessonTerms(LESSON_22),
  [LESSON_23.id]: withLessonTerms(LESSON_23),
  [LESSON_24.id]: withLessonTerms(LESSON_24),
};

function itemOf(lesson: ScrimLessonData): ScrimCurriculumItem {
  return {
    id: lesson.id,
    title: lesson.title,
    type: 'scrim',
    estimatedMinutes: Math.max(1, Math.ceil(lesson.durationMs / 60000)),
    description: lesson.description,
    scrimDataId: lesson.id,
  };
}

function withPractice(lesson: ScrimLessonData): CurriculumItem[] {
  const debug = DEBUG_BY_LESSON[lesson.id];
  const reading = READING_BY_LESSON[lesson.id];
  const reasoning = REASONING_BY_LESSON[lesson.id];
  return [itemOf(lesson), ...(reading ? [reading] : []), ...(reasoning ? [reasoning] : []), ...(debug ? [debug] : [])];
}

export const FUNDAMENTOS_COURSE: Course = {
  id: 'course-fundamentos',
  slug: 'fundamentos',
  title: 'Fundamentos de programación',
  tagline: 'Aprende a programar desde cero, pausando el código en vivo.',
  description:
    'Curso para quien nunca ha programado. Cada lección se reproduce como una clase: el instructor escribe, explica y ejecuta. Tú puedes pausar, editar y comprobar que de verdad entendiste.',
  level: 'Beginner',
  tags: ['JavaScript', 'Fundamentos', 'Lógica'],
  instructor: {
    name: 'Kit',
    role: 'Instructor de fundamentos',
    bio: 'Te enseña a pensar en instrucciones exactas antes de memorizar sintaxis.',
  },
  thumbnailGradient: 'from-amber-500 to-stone-700',
  modules: [
    {
      id: 'mod-primeros-pasos',
      title: 'Módulo 1: Primeros pasos',
      description: 'Qué es un programa, cómo dividir una tarea y cómo representar datos sencillos.',
      items: [...withPractice(LESSON_01), ...withPractice(LESSON_02), ...withPractice(LESSON_03)],
    },
    {
      id: 'mod-datos',
      title: 'Módulo 2: Datos y operaciones',
      description: 'Calcular, comparar y producir valores nuevos.',
      items: [...withPractice(LESSON_04)],
    },
    {
      id: 'mod-flujo',
      title: 'Módulo 3: Control de flujo',
      description: 'Decidir con if, repetir con bucles y empaquetar tareas con funciones.',
      items: [...withPractice(LESSON_05), ...withPractice(LESSON_06), ...withPractice(LESSON_07)],
    },
    {
      id: 'mod-estructuras',
      title: 'Módulo 4: Agrupar datos',
      description: 'Listas por posición y fichas por nombre.',
      items: [...withPractice(LESSON_08), ...withPractice(LESSON_09)],
    },
    {
      id: 'mod-interfaz',
      title: 'Módulo 5: Construir una página interactiva',
      description: 'Conecta lo que ya sabes con elementos, botones y datos escritos por una persona.',
      items: [
        ...withPractice(LESSON_10),
        ...withPractice(LESSON_11),
        ...withPractice(LESSON_12),
      ],
    },
    {
      id: 'mod-proyecto',
      title: 'Módulo 6: Primer proyecto',
      description: 'Muestra arrays en la página y construye una lista de tareas pequeña.',
      items: [...withPractice(LESSON_13), ...withPractice(LESSON_14)],
    },
    {
      id: 'mod-pensamiento-desarrollador',
      title: 'Módulo 7: Pensar como desarrollador',
      description: 'Depura con evidencia, consulta contratos y representa soluciones antes de escribirlas.',
      items: [...withPractice(LESSON_15), ...withPractice(LESSON_16), ...withPractice(LESSON_17)],
    },
    {
      id: 'mod-algoritmos-pruebas',
      title: 'Módulo 8: Algoritmos y pruebas',
      description: 'Reconoce patrones de recorrido, elige operaciones y ataca los casos límite.',
      items: [...withPractice(LESSON_18), ...withPractice(LESSON_19), ...withPractice(LESSON_20)],
    },
    {
      id: 'mod-arquitectura',
      title: 'Módulo 9: Estado, módulos y arquitectura',
      description: 'Organiza el flujo de datos y las responsabilidades de una aplicación pequeña.',
      items: [...withPractice(LESSON_21), ...withPractice(LESSON_22), ...withPractice(LESSON_23)],
    },
    {
      id: 'mod-proyecto-final',
      title: 'Módulo 10: Proyecto final guiado',
      description: 'Diseña y construye un planificador por requisitos, reglas, pruebas y cortes verificables.',
      items: [...withPractice(LESSON_24)],
    },
  ],
};
