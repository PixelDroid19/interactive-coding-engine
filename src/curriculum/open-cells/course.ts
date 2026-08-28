import type { Course, ReadingItem, ScrimCurriculumItem } from '../../types/curriculum';
import type { ScrimLessonData } from '../../types/scrim';
import { OPEN_CELLS_UNITS_07_TO_68 } from './units07to68';
import { addOpenCellsReasoning } from './reasoning';
import { createOpenCellsGuidedLessons } from './guidedLessons';
import { OPEN_CELLS_CORE_SOURCES } from './sources';

function reading(
  number: number,
  title: string,
  summary: string,
  sections: ReadingItem['sections'],
  keyPoints: string[],
  options: Partial<Pick<ReadingItem, 'handsOnLab' | 'frequentQuestions' | 'transferPrompt' | 'sources'>> = {},
): ReadingItem {
  const defaultQuestions = [
    { question: '¿Qué debería poder explicar antes de escribir código?', answer: `Explica con tus palabras esta idea: ${summary}` },
    { question: '¿Cómo sé que no solo memoricé la sintaxis?', answer: `Puedes predecir qué ocurrirá, justificar qué archivo o frontera cambiarías y comprobarlo con una salida observable.` },
  ];
  return {
    id: `open-cells-${String(number).padStart(2, '0')}-lectura`,
    type: 'reading',
    title,
    summary,
    estimatedMinutes: options.handsOnLab ? 35 : 12,
    sections: sections.map((section, index) => index === 1 && !section.example ? {
      ...section,
      example: `Situación: una persona cambia una entrada del proyecto.\nDecisión: ${section.content}\nComprobación: observa el contrato público antes y después del cambio.`,
      exampleCaption: 'Ejemplo razonado: causa, decisión y evidencia observable.',
    } : index === sections.length - 1 && !/error|equivoc|fall|confusi|cuidado|problema/i.test(`${section.title} ${section.content}`) ? {
      ...section,
      title: `Errores frecuentes · ${section.title}`,
      content: `${section.content} Un error frecuente consiste en cambiar varias fronteras a la vez; conserva una predicción y comprueba una sola causa antes de continuar.`,
    } : section),
    keyPoints,
    sources: options.sources ?? OPEN_CELLS_CORE_SOURCES,
    ...options,
    transferPrompt: options.transferPrompt ?? `Transfiere “${title}” a una aplicación de reservas: identifica la entrada, el propietario del dato y la evidencia observable que confirmaría el contrato.`,
    frequentQuestions: [...(options.frequentQuestions ?? []), ...defaultQuestions]
      .filter((entry, index, all) => all.findIndex((candidate) => candidate.question === entry.question) === index)
      .slice(0, Math.max(2, options.frequentQuestions?.length ?? 0)),
  };
}

const FIRST_COMPONENT_UNITS: ReadingItem[] = [
  reading(1, 'Qué añade Cells sobre Lit', 'Sitúa Cells como una arquitectura de aplicaciones y componentes que se apoya en Lit sin sustituir sus fundamentos.', [
    { title: 'Lit resuelve renderizado; Cells organiza contratos', content: 'Lit ofrece templates, reactividad y ciclo de actualización. Cells añade convenciones para componentes consumibles, idioma, eventos de negocio, páginas, comunicación, datos y herramientas de proyecto. Cuando algo pertenece a Lit lo nombramos como prerrequisito; cuando pertenece a Cells practicamos su contrato concreto.' },
    { title: 'Componente, página y aplicación no son sinónimos', content: 'Un componente encapsula una responsabilidad visual reutilizable. Una página participa en navegación y ciclo de entrada o salida. Una aplicación compone páginas, rutas, canales, configuración y servicios. Elegir la frontera correcta evita componentes gigantes que conocen toda la aplicación.' },
    { title: 'El curso conserva proyectos reales', content: 'Cada práctica modifica un workspace exportable. El navegador sustituye únicamente las capacidades de proceso que no existen en la web; los archivos, nombres, imports y contratos públicos continúan siendo compatibles con un proyecto Cells.' },
  ], ['Cells se apoya en Lit.', 'Un componente no debe asumir responsabilidades de página.', 'El workspace del curso se puede exportar.'], {
    transferPrompt: 'Piensa en una pantalla de acceso: separa en una lista qué responsabilidades pertenecen al botón, al formulario, a la página y a la aplicación.',
  }),
  reading(2, 'Contratos del runtime Cells', 'Aprende a reconocer qué partes son API pública, qué partes son infraestructura y cómo evitar acoplar una app a detalles internos.', [
    { title: 'Un contrato se observa desde fuera', content: 'Tag, atributos, propiedades, eventos y contenido renderizado forman la superficie pública de un componente. Las pruebas deben usar esa superficie. Invocar un método privado o buscar una línea exacta produce ejercicios frágiles y no demuestra que el comportamiento funcione.' },
    { title: 'Mixins con responsabilidades distintas', content: 'WidgetMixin aporta idioma y emisión de eventos. ScopedElementsMixin aporta un registro local de dependencias. LitElement conserva renderizado y ciclo reactivo. El orden de composición describe qué capacidad envuelve a cuál y la cadena de super debe permanecer completa.' },
    { title: 'Runtime educativo honesto', content: 'La plataforma no puede iniciar Node, abrir puertos ni ejecutar npm desde un iframe. El Worker interpreta una lista concreta de comandos, modifica un sistema de archivos virtual y produce preview, pruebas, documentación o ZIP. La interfaz siempre indica cuándo trabaja el Worker y nunca anuncia un servidor inexistente.' },
  ], ['Las pruebas miran comportamiento público.', 'Cada mixin conserva una responsabilidad.', 'La terminal browser no simula procesos Node.'], {
    frequentQuestions: [{ question: '¿El Worker es el runtime Cells de producción?', answer: 'No. Es un runtime educativo compatible con los archivos y comandos que sí pueden representarse en el navegador. La exportación permite continuar con la CLI real.' }],
  }),
  reading(3, 'Anatomía de un proyecto Cells', 'Recorre un scaffold completo antes de editarlo para saber qué archivo responde a cada pregunta.', [
    { title: 'La entrada pública', content: 'package.json declara identidad, exports, scripts y dependencias directas. El módulo dentro de src define el custom element. custom-elements.json documenta esa API para herramientas y consumidores sin tener que ejecutar el componente.' },
    { title: 'Demo y pruebas son consumidores', content: 'La demo debe importar e instanciar el componente como lo haría otra aplicación. Las pruebas también actúan desde fuera: asignan propiedades, esperan updateComplete, interactúan y escuchan eventos. Ambas superficies detectan contratos que una revisión del archivo fuente puede pasar por alto.' },
    { title: 'Locales como contrato paralelo', content: 'Los catálogos EN y ES deben contener las mismas claves y placeholders. Una traducción faltante no debe convertirse silenciosamente en una cadena vacía: el diagnóstico visible ayuda a corregir el catálogo antes de publicar.' },
  ], ['package.json declara la entrada consumible.', 'Demo y pruebas usan la API pública.', 'Los catálogos deben conservar paridad.']),
  reading(4, 'Comandos reales en un navegador', 'Distingue intención de comando, capacidad disponible y resultado verificable sin fingir una terminal de sistema.', [
    { title: 'Una gramática pequeña y explícita', content: 'El parser acepta cells component:create, component:test, component:locales, component:documentation, component:build:demo y component:dev. Las opciones desconocidas, instalación de dependencias, puertos y watch se rechazan con un mensaje comprensible.' },
    { title: 'Mensajes tipados hacia un Worker', content: 'Cada operación lleva requestId, sessionId y generation. El identificador permite asociar respuesta y petición; la sesión evita mezclar laboratorios; la generación impide que un resultado viejo reemplace el proyecto más reciente.' },
    { title: 'Cancelación y errores normalizados', content: 'Cancelar no equivale a marcar una tarea como exitosa. El cliente rechaza la operación pendiente y el Worker recibe la orden. Los errores conservan código, archivo, línea, columna y una pista cuando esa información existe.' },
  ], ['La allowlist limita las capacidades.', 'requestId y generation evitan carreras.', 'Cancelar no produce un éxito falso.']),
  reading(5, 'Workspace virtual y exportación', 'Comprende cómo el proyecto vive en memoria, qué límites lo protegen y por qué el ZIP no es una maqueta.', [
    { title: 'Rutas POSIX dentro de una raíz', content: 'Todas las rutas se normalizan con barras, rechazan rutas absolutas y no pueden escapar mediante segmentos .. . También se detectan colisiones donde una ruta intenta ser archivo y directorio al mismo tiempo.' },
    { title: 'Versiones inmutables', content: 'Cada escritura produce un snapshot nuevo y aumenta la generación. Esto permite descartar respuestas atrasadas, persistir estados coherentes y comparar el trabajo del estudiante sin perder el proyecto anterior.' },
    { title: 'Un ZIP estándar y continuable', content: 'La exportación escribe entradas ZIP reales con CRC y conserva la jerarquía completa. package.json usa comandos Cells, de modo que el estudiante puede descomprimir el proyecto y continuar con el toolchain fuera de la plataforma.' },
  ], ['Las rutas nunca salen de la raíz virtual.', 'Cada cambio crea una generación nueva.', 'El ZIP conserva un proyecto Cells consumible.']),
  reading(6, 'Crear tu primer componente Cells', 'Aplica el modelo completo: dependencia scoped, texto traducible, evento público, preview aislado, pruebas de contrato y exportación.', [
    { title: 'Primero lee el componente', content: 'Identifica la clase base compuesta, el registro scopedElements, las propiedades, los textos traducidos y el método que responde al botón. No escribas todavía: predice qué fallará al faltar una dependencia local y qué observaría un componente padre.' },
    { title: 'Registra la clase, no el nombre global', content: 'El botón ya está importado. La tarea consiste en conectarlo al registro scoped de este host. Así dos árboles pueden resolver una misma etiqueta con implementaciones distintas sin contaminar customElements global.' },
    { title: 'Comunica una intención de negocio', content: 'La acción debe salir mediante emitEvent con un detail útil. El nombre final incorpora el tag del host; el consumidor escucha el evento público sin llamar métodos internos. Las comprobaciones aceptan cualquier nombre de estudiante y verifican el contrato, no un valor fijo.' },
  ], ['La dependencia pertenece a scopedElements.', 'El texto visible pasa por this.t.', 'La acción sale mediante emitEvent con detail.'], {
    handsOnLab: 'open-cells-playground',
    frequentQuestions: [
      { question: '¿Por qué la vista previa puede verse aunque una prueba falle?', answer: 'Renderizar una parte del componente no demuestra que composición, traducciones y comunicación pública estén completas. Las pruebas observan contratos adicionales.' },
      { question: '¿Debo memorizar la línea exacta?', answer: 'No. Debes reconocer el mapa clase importada → etiqueta local y la intención acción → evento público. El autocompletado ayuda con la sintaxis.' },
    ],
    transferPrompt: 'Si añadieras un segundo botón para descartar la tarjeta, decide qué tag registrarías, qué clave de idioma crearías y qué detalle necesitaría el evento.',
    sources: OPEN_CELLS_CORE_SOURCES,
  }),
];

function scrimItem(lesson: ScrimLessonData): ScrimCurriculumItem {
  return {
    id: lesson.id,
    title: lesson.title,
    type: 'scrim',
    estimatedMinutes: Math.max(1, Math.ceil(lesson.durationMs / 60_000)),
    description: lesson.description,
    scrimDataId: lesson.id,
  };
}

function projectLabFor(number: number): ReadingItem['handsOnLab'] {
  return ({
    5: 'open-cells-component-scaffold-playground',
    6: 'open-cells-playground',
    10: 'open-cells-component-api-playground',
    14: 'open-cells-component-styles-playground',
    22: 'open-cells-playground',
    27: 'open-cells-component-i18n-playground',
    30: 'open-cells-component-api-playground',
    31: 'open-cells-component-demo-playground',
    34: 'open-cells-component-tests-playground',
    38: 'open-cells-component-delivery-playground',
    46: 'open-cells-app-playground',
    54: 'open-cells-channels-playground',
    62: 'open-cells-data-playground',
    68: 'open-cells-delivery-playground',
  } satisfies Record<number, NonNullable<ReadingItem['handsOnLab']>>)[number];
}

const ALL_OPEN_CELLS_READINGS = [...FIRST_COMPONENT_UNITS, ...OPEN_CELLS_UNITS_07_TO_68].map((source) => {
  const number = Number(source.id.match(/open-cells-(\d+)-lectura/)?.[1]);
  const handsOnLab = projectLabFor(number);
  return { ...source, handsOnLab, estimatedMinutes: handsOnLab ? 35 : 12 };
});
const OPEN_CELLS_READING_BY_ID = new Map(ALL_OPEN_CELLS_READINGS.map((source) => [source.id, source]));
const OPEN_CELLS_GUIDED_BY_ID = createOpenCellsGuidedLessons(ALL_OPEN_CELLS_READINGS);

function withReadingPractice(readings: ReadingItem[]) {
  return readings.flatMap((source) => {
    const reading = {
      ...source,
      relatedLessonId: source.id.replace(/-lectura$/, ''),
    };
    return addOpenCellsReasoning([reading]);
  });
}

function learningBlock(readings: ReadingItem[]) {
  return readings.flatMap((original) => {
    const source = OPEN_CELLS_READING_BY_ID.get(original.id) ?? original;
    const number = source.id.match(/open-cells-(\d+)-lectura/)?.[1];
    const lesson = number ? OPEN_CELLS_GUIDED_BY_ID[`open-cells-${number}`] : undefined;
    if (!lesson) throw new Error(`No existe clase guiada para ${source.id}.`);
    return [scrimItem(lesson), ...withReadingPractice([source])];
  });
}

export const OPEN_CELLS_COURSE: Course = {
  id: 'course-open-cells',
  slug: 'open-cells',
  title: 'Open Cells: componentes y aplicaciones reales',
  tagline: 'Pasa de Lit a componentes, páginas y apps Cells exportables.',
  description: 'Curso independiente de Cells. Empieza por los contratos propios del ecosistema y progresa hacia componentes, aplicaciones, rutas, canales, datos y producción sin repetir el curso de Lit ni simular servidores dentro del navegador.',
  level: 'Advanced',
  tags: ['Open Cells', 'Componentes', 'Aplicaciones'],
  instructor: {
    name: 'Kit',
    role: 'Mentor de arquitectura Cells',
    bio: 'Separa cada responsabilidad, trabaja sobre contratos observables y convierte cada práctica en un proyecto continuable.',
  },
  thumbnailGradient: 'from-emerald-500 to-slate-950',
  modules: [
    {
      id: 'open-cells-mod-1-primer-componente',
      title: 'De Lit a tu primer componente Cells',
      description: 'Runtime, workspace, scaffold y primer componente exportable.',
      items: learningBlock(FIRST_COMPONENT_UNITS),
    },
    { id: 'open-cells-mod-2-componentes', title: 'Componentes Cells', description: 'Mixins, API pública, estados y estilos consumibles.', items: learningBlock(OPEN_CELLS_UNITS_07_TO_68.slice(0, 8)) },
    { id: 'open-cells-mod-3-scoped', title: 'Composición aislada', description: 'Registros scoped, grafos e imports controlados.', items: learningBlock(OPEN_CELLS_UNITS_07_TO_68.slice(8, 16)) },
    { id: 'open-cells-mod-4-i18n-eventos', title: 'Idioma y eventos', description: 'Catálogos, recursos y comunicación pública.', items: learningBlock(OPEN_CELLS_UNITS_07_TO_68.slice(16, 24)) },
    { id: 'open-cells-mod-5-calidad', title: 'Calidad y toolchain', description: 'Demo, pruebas, coverage, documentación y paquete.', items: learningBlock(OPEN_CELLS_UNITS_07_TO_68.slice(24, 32)) },
    { id: 'open-cells-mod-6-apps', title: 'Aplicaciones Cells', description: 'Scaffold, configuración, bootstrap, páginas y ciclo.', items: learningBlock(OPEN_CELLS_UNITS_07_TO_68.slice(32, 40)) },
    { id: 'open-cells-mod-7-rutas-canales', title: 'Rutas y comunicación', description: 'Navegación, parámetros, canales y estado retenido.', items: learningBlock(OPEN_CELLS_UNITS_07_TO_68.slice(40, 48)) },
    { id: 'open-cells-mod-8-bridge-datos', title: 'Bridge y datos', description: 'Mediación, data managers, estados, carreras y cleanup.', items: learningBlock(OPEN_CELLS_UNITS_07_TO_68.slice(48, 56)) },
    { id: 'open-cells-mod-9-produccion', title: 'Producción y compatibilidad', description: 'Tests integrados, seguridad, paridad y entrega.', items: learningBlock(OPEN_CELLS_UNITS_07_TO_68.slice(56, 62)) },
  ],
};

export const OPEN_CELLS_SCRIMS: Record<string, ScrimLessonData> = OPEN_CELLS_GUIDED_BY_ID;
