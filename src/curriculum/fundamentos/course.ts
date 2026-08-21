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
import { READING_01 } from './reading01';
import { conceptLabels } from './roadmap';
import { DEBUG_BY_LESSON } from './debugExercises';

function withLessonTerms(lesson: ScrimLessonData): ScrimLessonData {
  const labels = conceptLabels(lesson.id);
  return labels.length ? { ...lesson, concepts: labels } : lesson;
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
  const reading = lesson.id === 'fundamentos-01' ? [READING_01] : [];
  return [...[itemOf(lesson)], ...reading, ...(debug ? [debug] : [])];
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
      description: 'Qué es un programa y cómo se ataca un problema.',
      items: [...withPractice(LESSON_01), ...withPractice(LESSON_02)],
    },
    {
      id: 'mod-datos',
      title: 'Módulo 2: Datos y operaciones',
      description: 'Guardar valores y hacer cuentas, comparaciones y combinaciones.',
      items: [...withPractice(LESSON_03), ...withPractice(LESSON_04)],
    },
    {
      id: 'mod-flujo',
      title: 'Módulo 3: Control de flujo',
      description: 'Decidir con if y repetir con bucles.',
      items: [...withPractice(LESSON_05), ...withPractice(LESSON_06)],
    },
    {
      id: 'mod-organizacion',
      title: 'Módulo 4: Organización',
      description: 'Empaquetar una tarea en una función y reutilizarla.',
      items: [...withPractice(LESSON_07)],
    },
    {
      id: 'mod-estructuras',
      title: 'Módulo 5: Estructuras de datos',
      description: 'Listas por posición y fichas por nombre.',
      items: [...withPractice(LESSON_08), ...withPractice(LESSON_09)],
    },
    {
      id: 'mod-avanzado',
      title: 'Módulo 6: Conceptos avanzados',
      description: 'Dónde vive una variable y cómo una función recuerda su entorno.',
      items: [...withPractice(LESSON_10)],
    },
    {
      id: 'mod-ciencias',
      title: 'Módulo 7: Ciencias de la computación',
      description: 'Algoritmos, estructuras, Big O y formas de organizar el código.',
      items: [
        ...withPractice(LESSON_11),
        ...withPractice(LESSON_12),
        ...withPractice(LESSON_13),
        ...withPractice(LESSON_14),
      ],
    },
  ],
};
