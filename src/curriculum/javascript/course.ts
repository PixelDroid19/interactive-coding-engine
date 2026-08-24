import { Course, CurriculumItem } from '../../types/curriculum';
import { ScrimLessonData } from '../../types/scrim';
import { buildDebug, buildLesson, buildReading, lessonItem } from './factory';
import { JAVASCRIPT_SPECS_01_TO_08 } from './specs01to08';
import { JAVASCRIPT_SPECS_09_TO_16 } from './specs09to16';
import { JAVASCRIPT_SPECS_17_TO_24 } from './specs17to24';
import { JavaScriptLessonSpec } from './types';
import { JAVASCRIPT_REASONING_BY_LESSON } from './reasoning';

export const JAVASCRIPT_SPECS: JavaScriptLessonSpec[] = [
  ...JAVASCRIPT_SPECS_01_TO_08,
  ...JAVASCRIPT_SPECS_09_TO_16,
  ...JAVASCRIPT_SPECS_17_TO_24,
];

const built = JAVASCRIPT_SPECS.map((spec) => ({ spec, lesson: buildLesson(spec), reading: buildReading(spec), debug: buildDebug(spec) }));

export const JAVASCRIPT_SCRIMS: Record<string, ScrimLessonData> = Object.fromEntries(
  built.map(({ lesson }) => [lesson.id, lesson]),
);

function itemsForModule(moduleNumber: number): CurriculumItem[] {
  return built
    .filter(({ spec }) => spec.module === moduleNumber)
    .flatMap(({ lesson, reading, debug }) => [lessonItem(lesson), reading, JAVASCRIPT_REASONING_BY_LESSON[lesson.id], debug]);
}

export const JAVASCRIPT_COURSE: Course = {
  id: 'course-javascript',
  slug: 'javascript',
  title: 'JavaScript: del lenguaje a aplicaciones',
  tagline: 'Domina JavaScript paso a paso, entendiendo cada contrato antes de usarlo.',
  description: 'Un recorrido independiente y progresivo: sintaxis, datos, control, colecciones, DOM, asincronía, arquitectura, componentes y un proyecto final. Cada clase explica, demuestra, amplía y después te deja practicar sin mostrarte la solución.',
  level: 'Intermediate',
  tags: ['JavaScript', 'Lenguaje', 'Aplicaciones web'],
  instructor: { name: 'Kit', role: 'Instructor de JavaScript', bio: 'Explica los contratos del lenguaje y enseña a investigar sin convertir la programación en memorización.' },
  thumbnailGradient: 'from-sky-400 to-indigo-900',
  conceptGlossary: Object.fromEntries(JAVASCRIPT_SPECS.map((spec) => [`javascript-${String(spec.number).padStart(2, '0')}`, spec.concepts])),
  modules: [
    { id: 'js-mod-1-sintaxis', title: 'Módulo 1: Sintaxis y valores', description: 'Cómo se ejecuta JavaScript y cómo representar, operar y decidir con datos.', items: itemsForModule(1) },
    { id: 'js-mod-2-control', title: 'Módulo 2: Funciones y control', description: 'Contratos reutilizables, repetición, alcance y métodos de texto.', items: itemsForModule(2) },
    { id: 'js-mod-3-colecciones', title: 'Módulo 3: Colecciones y referencias', description: 'Arrays, transformaciones, objetos y copias conscientes.', items: itemsForModule(3) },
    { id: 'js-mod-4-interfaz', title: 'Módulo 4: Interfaz web', description: 'DOM, eventos y renderizado desde una fuente de verdad.', items: itemsForModule(4) },
    { id: 'js-mod-5-resistencia', title: 'Módulo 5: Código resistente', description: 'Depuración, JSON y persistencia segura en el navegador.', items: itemsForModule(5) },
    { id: 'js-mod-6-asincronia', title: 'Módulo 6: Asincronía y red', description: 'Bucle de eventos, promesas, async/await, HTTP y fetch.', items: itemsForModule(6) },
    { id: 'js-mod-7-organizacion', title: 'Módulo 7: Organización y componentes', description: 'Módulos, clases, Web Components y Shadow DOM con fronteras claras.', items: itemsForModule(7) },
    { id: 'js-mod-8-proyecto', title: 'Módulo 8: Pruebas y proyecto final', description: 'Requisitos observables, casos límite y cortes verticales.', items: itemsForModule(8) },
  ],
};
