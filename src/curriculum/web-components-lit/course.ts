import { Course, CurriculumItem } from '../../types/curriculum';
import { ScrimLessonData } from '../../types/scrim';
import { buildDebug, buildLesson, buildReading, lessonItem } from './factory';
import { buildReasoning } from './reasoning';
import { COMPONENT_SPECS_01_TO_07 } from './specs01to07';
import { COMPONENT_SPECS_08_TO_14 } from './specs08to14';
import { COMPONENT_SPECS_15_TO_20 } from './specs15to20';
import { COMPONENT_SPECS_21_TO_26 } from './specs21to26';
import { COMPONENT_SPECS_27_TO_32 } from './specs27to32';
import { COMPONENT_SPECS_33_TO_40 } from './specs33to40';
import { COMPONENT_SPECS_41_TO_45 } from './specs41to45';
import { ComponentCourseLessonSpec } from './types';

export const COMPONENT_COURSE_SPECS: ComponentCourseLessonSpec[] = [
  ...COMPONENT_SPECS_01_TO_07,
  ...COMPONENT_SPECS_08_TO_14,
  ...COMPONENT_SPECS_15_TO_20,
  ...COMPONENT_SPECS_21_TO_26,
  ...COMPONENT_SPECS_27_TO_32,
  ...COMPONENT_SPECS_33_TO_40,
  ...COMPONENT_SPECS_41_TO_45,
];

const built = COMPONENT_COURSE_SPECS.map((spec) => ({
  spec,
  lessonData: buildLesson(spec),
  reading: buildReading(spec),
  reasoning: buildReasoning(spec),
  debug: buildDebug(spec),
}));

export const COMPONENT_COURSE_SCRIMS: Record<string, ScrimLessonData> = Object.fromEntries(
  built.map(({ lessonData }) => [lessonData.id, lessonData]),
);

function itemsForModule(moduleNumber: number): CurriculumItem[] {
  return built
    .filter(({ spec }) => spec.module === moduleNumber)
    .flatMap(({ lessonData, reading, reasoning, debug }) => [lessonItem(lessonData), reading, reasoning, debug]);
}

export const COMPONENT_COURSE: Course = {
  id: 'course-web-components-lit',
  slug: 'web-components-lit',
  title: 'Web Components y Lit: interfaces profesionales',
  tagline: 'Construye componentes reales, depura sus ciclos y llévalos a producción.',
  description: 'Una ruta avanzada en JavaScript: primero domina la plataforma nativa y después usa Lit con criterio. Cada unidad construye una aplicación, profundiza con lectura y diagramas, y repara otra aplicación distinta sin revelar soluciones.',
  level: 'Advanced',
  tags: ['Web Components', 'Lit', 'Aplicaciones'],
  instructor: { name: 'Kit', role: 'Mentor de componentes web', bio: 'Explica la plataforma antes de la abstracción y convierte cada API en decisiones observables.' },
  thumbnailGradient: 'from-violet-500 to-cyan-800',
  conceptGlossary: Object.fromEntries(COMPONENT_COURSE_SPECS.map((spec) => [`componentes-lit-${String(spec.number).padStart(2, '0')}`, spec.concepts])),
  modules: [
    { id: 'wc-lit-mod-1-plataforma', title: 'Plataforma y ciclo nativo', description: 'Contrato, clases, super, ciclo y Shadow DOM.', items: itemsForModule(1) },
    { id: 'wc-lit-mod-2-api', title: 'API pública y composición', description: 'Atributos, reflexión, eventos y slots.', items: itemsForModule(2) },
    { id: 'wc-lit-mod-3-apps', title: 'Aplicaciones nativas', description: 'Estado, flujo, accesibilidad y formularios.', items: itemsForModule(3) },
    { id: 'wc-lit-mod-4-resistencia', title: 'Resistencia y pruebas nativas', description: 'Asincronía, cancelación y contratos verificables.', items: itemsForModule(4) },
    { id: 'wc-lit-mod-5-lit-templates', title: 'Lit sobre la plataforma', description: 'LitElement, templates, ramas y listas.', items: itemsForModule(5) },
    { id: 'wc-lit-mod-6-reactividad', title: 'Reactividad y estado', description: 'Propiedades, fronteras e inmutabilidad.', items: itemsForModule(6) },
    { id: 'wc-lit-mod-7-ciclo-lit', title: 'Eventos y ciclo reactivo', description: 'Formularios, super, hooks y DOM actualizado.', items: itemsForModule(7) },
    { id: 'wc-lit-mod-8-estilos', title: 'Estilos y composición pública', description: 'Temas, slots y parts.', items: itemsForModule(8) },
    { id: 'wc-lit-mod-9-directivas', title: 'Directivas y tareas', description: 'Identidad, DOM justificado y asincronía.', items: itemsForModule(9) },
    { id: 'wc-lit-mod-10-produccion', title: 'Arquitectura y producción', description: 'Controladores, contexto, testing y paquetes.', items: itemsForModule(10) },
    { id: 'wc-lit-mod-11-proyecto', title: 'Primera integración', description: 'Una aplicación completa por cortes verticales.', items: itemsForModule(11) },
    { id: 'wc-lit-mod-12-patrones', title: 'Extensión y patrones', description: 'Directivas propias, animación accesible y patrones con ciclo explícito.', items: itemsForModule(12) },
    { id: 'wc-lit-mod-13-api', title: 'Proyectos con APIs', description: 'Museo, clima, concurrencia y fallos parciales.', items: itemsForModule(13) },
    { id: 'wc-lit-mod-14-ssr', title: 'Servidor e hidratación', description: 'Componentes diseñados para más de un entorno.', items: itemsForModule(14) },
    { id: 'wc-lit-mod-15-capstone', title: 'Capstone profesional', description: 'Un sistema publicable con evidencia integral.', items: itemsForModule(15) },
    { id: 'wc-lit-mod-16-mixins', title: 'Herencia en proyectos existentes', description: 'Mixins, cadena de super y migración hacia composición.', items: itemsForModule(16) },
    { id: 'wc-lit-mod-17-grafos', title: 'Motor de grafos', description: 'Ciclos, orden topológico y evaluadores desacoplados.', items: itemsForModule(17) },
    { id: 'wc-lit-mod-18-rele-ui', title: 'Interacción de Relé', description: 'Eventos públicos, arrastre y propiedad del estado.', items: itemsForModule(18) },
    { id: 'wc-lit-mod-19-rele', title: 'Proyecto Relé', description: 'Reloj, historial, invariantes y entrega profesional.', items: itemsForModule(19) },
  ],
};
