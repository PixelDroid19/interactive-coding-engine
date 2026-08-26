import { compileLesson, file } from '../../engine/lessonCompiler';
import { createCellsAppWorkspace } from '../../engine/cells/cellsAppRecipes';
import { createCellsComponentWorkspace } from '../../engine/cells/cellsRecipes';
import type { ReadingItem } from '../../types/curriculum';
import type { ChallengeTest, ScrimLessonData, WorkspaceSnapshot } from '../../types/scrim';

interface ContractPractice {
  path: string;
  functionName: string;
  starter: string;
  complete: string;
  instructions: string;
  tests: ChallengeTest[];
  hints: [string, string, string];
}

function suffix(number: number): string {
  return String(number).padStart(2, '0');
}

function readNumber(reading: ReadingItem): number {
  const match = reading.id.match(/open-cells-(\d+)-lectura/);
  if (!match) throw new Error(`Lectura Cells sin número estable: ${reading.id}`);
  return Number(match[1]);
}

function fnTest(number: number, index: number, description: string, targetFunction: string, args: unknown[], expectedReturn: unknown): ChallengeTest {
  return {
    id: `open-cells-${suffix(number)}-reto-${index}`,
    description,
    validatorType: 'function-call',
    targetFunction,
    args,
    expectedReturn,
  };
}

function foundationPractice(number: number): ContractPractice {
  const functionName = `identificarFrontera${suffix(number)}`;
  return {
    path: `src/checkpoints/leccion-${suffix(number)}.js`,
    functionName,
    starter: `export function ${functionName}(responsabilidad) {
  // TODO: decide qué frontera es propietaria de la responsabilidad.
  return 'componente';
}
`,
    complete: `export function ${functionName}(responsabilidad) {
  const propietarios = {
    'renderizar una tarjeta': 'componente',
    'entrar y salir de una ruta': 'página',
    'coordinar rutas y canales': 'aplicación',
    'ejecutar comandos permitidos': 'runtime educativo',
  };
  return propietarios[responsabilidad];
}
`,
    instructions: 'Completa el mapa de responsabilidades. Debe distinguir componente, página, aplicación y runtime educativo sin usar una respuesta fija.',
    tests: [
      fnTest(number, 1, 'Una tarjeta pertenece al componente', functionName, ['renderizar una tarjeta'], 'componente'),
      fnTest(number, 2, 'El ciclo de ruta pertenece a una página', functionName, ['entrar y salir de una ruta'], 'página'),
      fnTest(number, 3, 'Una responsabilidad desconocida no se inventa', functionName, ['abrir un socket del sistema'], undefined),
    ],
    hints: [
      'Dibuja cuatro cajas: componente, página, aplicación y runtime educativo.',
      'La entrada cambia en cada prueba; la salida debe venir de esa entrada.',
      'Una relación nombre → propietario permite conservar también el caso desconocido.',
    ],
  };
}

function componentPractice(number: number): ContractPractice {
  const functionName = `estadoVisible${suffix(number)}`;
  return {
    path: `src/checkpoints/leccion-${suffix(number)}.js`,
    functionName,
    starter: `export function ${functionName}(estado, disabled) {
  // TODO: conserva un único estado observable y respeta disabled.
  return 'success';
}
`,
    complete: `export function ${functionName}(estado, disabled) {
  if (disabled) return 'disabled';
  const permitidos = new Set(['loading', 'empty', 'error', 'success']);
  return permitidos.has(estado) ? estado : 'empty';
}
`,
    instructions: 'Haz que el contrato visible respete disabled y conserve loading, empty, error o success. Una entrada desconocida debe producir un estado seguro.',
    tests: [
      fnTest(number, 1, 'disabled bloquea cualquier otro estado', functionName, ['success', true], 'disabled'),
      fnTest(number, 2, 'loading permanece observable', functionName, ['loading', false], 'loading'),
      fnTest(number, 3, 'Un estado desconocido no produce una pantalla imposible', functionName, ['misterio', false], 'empty'),
    ],
    hints: [
      'disabled tiene prioridad porque también bloquea interacción.',
      'No conviertas todos los estados válidos en success.',
      'Valida el conjunto de estados permitidos y decide una salida segura para lo demás.',
    ],
  };
}

function scopedPractice(number: number): ContractPractice {
  const functionName = `resolverScoped${suffix(number)}`;
  return {
    path: `src/checkpoints/leccion-${suffix(number)}.js`,
    functionName,
    starter: `export function ${functionName}(tag, registro) {
  // TODO: resuelve la clase solicitada dentro de este host.
  return Object.values(registro)[0];
}
`,
    complete: `export function ${functionName}(tag, registro) {
  return registro[tag];
}
`,
    instructions: 'Resuelve la clase asociada al tag recibido. No fijes un componente concreto ni registres nada globalmente.',
    tests: [
      fnTest(number, 1, 'Resuelve el botón del host', functionName, ['academy-button', { 'academy-button': 'ButtonV1', 'academy-text': 'TextV1' }], 'ButtonV1'),
      fnTest(number, 2, 'El mismo tag puede tener otra clase en otro host', functionName, ['academy-button', { 'academy-button': 'ButtonV2' }], 'ButtonV2'),
      fnTest(number, 3, 'Un tag ausente permanece ausente', functionName, ['academy-missing', { 'academy-button': 'ButtonV1' }], undefined),
    ],
    hints: [
      'Importar una clase y resolver una etiqueta son decisiones diferentes.',
      'El parámetro tag contiene la clave que cambia entre consumidores.',
      'Consulta el registro del host con la clave recibida; no elijas su primer valor.',
    ],
  };
}

function languageEventPractice(number: number): ContractPractice {
  const functionName = `crearMensaje${suffix(number)}`;
  return {
    path: `src/checkpoints/leccion-${suffix(number)}.js`,
    functionName,
    starter: `export function ${functionName}(clave, idioma, catalogos, valores = {}) {
  // TODO: usa el idioma y conserva los placeholders del contrato.
  return catalogos.es[clave];
}
`,
    complete: `export function ${functionName}(clave, idioma, catalogos, valores = {}) {
  const plantilla = catalogos[idioma]?.[clave];
  if (plantilla === undefined) return undefined;
  return Object.entries(valores).reduce(
    (texto, [nombre, valor]) => texto.replaceAll('$' + '{' + nombre + '}', String(valor)),
    plantilla,
  );
}
`,
    instructions: 'Busca la clave en el idioma solicitado y sustituye los placeholders recibidos. Una clave ausente debe seguir siendo visible como ausencia.',
    tests: [
      fnTest(number, 1, 'Usa el catálogo español', functionName, ['greeting', 'es', { es: { greeting: 'Hola ${name}' }, en: { greeting: 'Hello ${name}' } }, { name: 'Lina' }], 'Hola Lina'),
      fnTest(number, 2, 'Cambia el mismo contrato a inglés', functionName, ['greeting', 'en', { es: { greeting: 'Hola ${name}' }, en: { greeting: 'Hello ${name}' } }, { name: 'Sam' }], 'Hello Sam'),
      fnTest(number, 3, 'No inventa una traducción ausente', functionName, ['missing', 'es', { es: {}, en: {} }, {}], undefined),
    ],
    hints: [
      'Clave, idioma y placeholders son tres entradas distintas del contrato.',
      'Primero localiza la plantilla; después sustituye datos.',
      'Recorre los valores recibidos y reemplaza cada placeholder por su valor serializable.',
    ],
  };
}

function qualityPractice(number: number): ContractPractice {
  const functionName = `leerApiPublica${suffix(number)}`;
  return {
    path: `src/checkpoints/leccion-${suffix(number)}.js`,
    functionName,
    starter: `export function ${functionName}(nombre, api) {
  // TODO: comprueba lo que observaría un consumidor real.
  return api[Object.keys(api)[0]];
}
`,
    complete: `export function ${functionName}(nombre, api) {
  return api[nombre];
}
`,
    instructions: 'Consulta la parte de la API pública solicitada. La comprobación debe aceptar valores distintos y no depender del orden del objeto.',
    tests: [
      fnTest(number, 1, 'Lee una propiedad pública', functionName, ['disabled', { disabled: true, event: 'card-continue' }], true),
      fnTest(number, 2, 'Lee un evento público del mismo contrato', functionName, ['event', { disabled: false, event: 'card-continue' }], 'card-continue'),
      fnTest(number, 3, 'No inventa metadata ausente', functionName, ['slot', { disabled: true }], undefined),
    ],
    hints: [
      'Demo, pruebas y metadata son consumidores de la misma superficie pública.',
      'El nombre solicitado cambia entre pruebas; el orden del objeto no es el contrato.',
      'Usa la clave recibida para consultar la API y conserva undefined cuando no existe.',
    ],
  };
}

function applicationPractice(number: number): ContractPractice {
  const functionName = `resolverRuta${suffix(number)}`;
  return {
    path: `app/checkpoints/leccion-${suffix(number)}.js`,
    functionName,
    starter: `export function ${functionName}(nombre, rutas) {
  // TODO: navega por el name estable, no por la posición ni el path.
  return rutas[0];
}
`,
    complete: `export function ${functionName}(nombre, rutas) {
  return rutas.find((ruta) => ruta.name === nombre);
}
`,
    instructions: 'Devuelve la ruta cuyo name coincide con la intención recibida. No uses el path como sustituto ni elijas siempre la primera ruta.',
    tests: [
      fnTest(number, 1, 'Resuelve la página inicial por nombre', functionName, ['home', [{ name: 'home', path: '/' }, { name: 'detail', path: '/item/:id' }]], { name: 'home', path: '/' }),
      fnTest(number, 2, 'Resuelve otra ruta independientemente de su posición', functionName, ['detail', [{ name: 'home', path: '/' }, { name: 'detail', path: '/item/:id' }]], { name: 'detail', path: '/item/:id' }),
      fnTest(number, 3, 'Una ruta desconocida no se convierte en home', functionName, ['missing', [{ name: 'home', path: '/' }]], undefined),
    ],
    hints: [
      'path describe la URL; name expresa la identidad estable usada por navigate.',
      'Busca una ruta que cumpla la condición en lugar de confiar en una posición.',
      'Compara cada route.name con el nombre recibido y conserva el caso ausente.',
    ],
  };
}

function communicationPractice(number: number): ContractPractice {
  const functionName = `elegirCanal${suffix(number)}`;
  return {
    path: `app/checkpoints/leccion-${suffix(number)}.js`,
    functionName,
    starter: `export function ${functionName}(distancia, cambiaPagina) {
  // TODO: elige evento, canal o navegación según la frontera.
  return 'evento';
}
`,
    complete: `export function ${functionName}(distancia, cambiaPagina) {
  if (cambiaPagina) return 'navegación';
  return distancia === 'cercana' ? 'evento' : 'canal';
}
`,
    instructions: 'Elige evento para un árbol cercano, canal para participantes lejanos y navegación cuando la intención cambia de página.',
    tests: [
      fnTest(number, 1, 'Un hijo cercano comunica mediante evento', functionName, ['cercana', false], 'evento'),
      fnTest(number, 2, 'Participantes lejanos usan un canal', functionName, ['lejana', false], 'canal'),
      fnTest(number, 3, 'Cambiar de página es navegación', functionName, ['cercana', true], 'navegación'),
    ],
    hints: [
      'Decide primero si la intención cambia de página.',
      'Si la página no cambia, observa la distancia entre productor y consumidor.',
      'Prioriza navegación; después distingue árbol cercano de participantes lejanos.',
    ],
  };
}

function dataPractice(number: number): ContractPractice {
  const functionName = `aceptarRespuesta${suffix(number)}`;
  return {
    path: `app/checkpoints/leccion-${suffix(number)}.js`,
    functionName,
    starter: `export function ${functionName}(requestIdActual, requestIdRecibido, datos) {
  // TODO: evita que una respuesta antigua reemplace el estado actual.
  return datos;
}
`,
    complete: `export function ${functionName}(requestIdActual, requestIdRecibido, datos) {
  return requestIdActual === requestIdRecibido ? datos : undefined;
}
`,
    instructions: 'Acepta datos únicamente cuando pertenecen a la solicitud vigente. Una respuesta antigua debe quedar sin publicar.',
    tests: [
      fnTest(number, 1, 'Acepta la respuesta actual', functionName, [4, 4, ['dato nuevo']], ['dato nuevo']),
      fnTest(number, 2, 'Descarta una respuesta anterior', functionName, [5, 3, ['dato viejo']], undefined),
      fnTest(number, 3, 'Funciona con otros identificadores', functionName, [12, 12, []], []),
    ],
    hints: [
      'Abortar ayuda, pero el identificador decide quién todavía puede publicar.',
      'Compara el id vigente con el de la respuesta antes de devolver datos.',
      'Solo la igualdad de ambos ids autoriza la salida; el resto queda sin valor.',
    ],
  };
}

function deliveryPractice(number: number): ContractPractice {
  const functionName = `validarEntrega${suffix(number)}`;
  return {
    path: `app/checkpoints/leccion-${suffix(number)}.js`,
    functionName,
    starter: `export function ${functionName}(artefacto) {
  // TODO: comprueba el contrato completo de una entrega continuable.
  return Boolean(artefacto.zip);
}
`,
    complete: `export function ${functionName}(artefacto) {
  return Boolean(
    artefacto.zip
    && artefacto.tests
    && artefacto.build
    && artefacto.sinSecretos
  );
}
`,
    instructions: 'Valida una entrega completa: ZIP estándar, pruebas, build y ausencia de secretos. Un archivo descargado por sí solo no basta.',
    tests: [
      fnTest(number, 1, 'Acepta una entrega reproducible', functionName, [{ zip: true, tests: true, build: true, sinSecretos: true }], true),
      fnTest(number, 2, 'Rechaza un ZIP cuyos tests fallan', functionName, [{ zip: true, tests: false, build: true, sinSecretos: true }], false),
      fnTest(number, 3, 'Rechaza artefactos que contienen secretos', functionName, [{ zip: true, tests: true, build: true, sinSecretos: false }], false),
    ],
    hints: [
      'Una descarga prueba transporte, no funcionamiento.',
      'Enumera las cuatro evidencias independientes exigidas por la entrega.',
      'La salida es verdadera solo cuando todas las evidencias están presentes.',
    ],
  };
}

function practiceFor(number: number): ContractPractice {
  if (number <= 5) return foundationPractice(number);
  if (number <= 14) return componentPractice(number);
  if (number <= 22) return scopedPractice(number);
  if (number <= 30) return languageEventPractice(number);
  if (number <= 38) return qualityPractice(number);
  if (number <= 46) return applicationPractice(number);
  if (number <= 54) return communicationPractice(number);
  if (number <= 62) return dataPractice(number);
  return deliveryPractice(number);
}

function focusFile(number: number): string {
  if (number <= 5) return 'package.json';
  if (number <= 14) return 'src/academy-learning-card.js';
  if (number <= 22) return 'src/academy-learning-card.js';
  if (number <= 25) return 'src/locales/es.js';
  if (number <= 30) return 'src/academy-learning-card.js';
  if (number <= 38) return number >= 36 ? 'custom-elements.json' : 'test/unit/academy-learning-card.test.js';
  if (number <= 42) return 'app/scripts/app.js';
  if (number <= 46) return 'app/pages/academy-home-page/academy-home-page.js';
  if (number <= 54) return number <= 50 ? 'app/scripts/app-routes.js' : 'app/pages/academy-home-page/academy-home-page.js';
  if (number <= 57) return 'app/pages/academy-home-page/academy-home-page.js';
  if (number <= 62) return 'app/data/academy-product-data-manager.js';
  if (number <= 65) return 'test/app.test.js';
  if (number <= 67) return 'package.json';
  return 'README.md';
}

function workspaceFor(number: number, practice: ContractPractice): WorkspaceSnapshot {
  const base = number <= 38
    ? createCellsComponentWorkspace({ name: 'academy-learning-card' }).snapshot
    : createCellsAppWorkspace({ name: 'academy-store-app' }).snapshot;
  return {
    ...base,
    files: {
      ...base.files,
      [practice.path]: file(practice.path, practice.starter),
    },
    activeFilePath: focusFile(number),
  };
}

function teachingFiles(number: number, practice: ContractPractice): string[] {
  const focus = focusFile(number);
  const support = number <= 38
    ? ['package.json', 'src/academy-learning-card.js', 'src/locales/es.js', 'demo/index.html']
    : ['package.json', 'app/scripts/app.js', 'app/scripts/app-routes.js', 'app/pages/academy-home-page/academy-home-page.js'];
  return [...new Set([focus, practice.path, ...support])].slice(0, 6);
}

function skillGroup(number: number): { required: string[]; introduced: string[]; representation: string } {
  if (number <= 5) return { required: ['lit-component'], introduced: ['cells-project-boundaries', 'cells-browser-runtime'], representation: 'responsabilidad → frontera propietaria → salida observable' };
  if (number <= 14) return { required: ['lit-component', 'reactive-properties'], introduced: ['cells-widget-contract', 'cells-public-state'], representation: 'propiedad pública → estado interno → render e interacción' };
  if (number <= 22) return { required: ['lit-component', 'javascript-modules'], introduced: ['cells-scoped-elements', 'cells-dependency-graph'], representation: 'tag local → registro del host → clase importada' };
  if (number <= 30) return { required: ['events', 'objects'], introduced: ['cells-i18n', 'cells-public-events'], representation: 'clave y valores → texto localizado; acción → evento público' };
  if (number <= 38) return { required: ['testing-basics'], introduced: ['cells-public-testing', 'cells-packaging'], representation: 'entrada pública → consumidor real → evidencia repetible' };
  if (number <= 46) return { required: ['lit-component', 'async-javascript'], introduced: ['cells-app-runtime', 'cells-page-lifecycle'], representation: 'ruta → página activa → entrada y cleanup' };
  if (number <= 54) return { required: ['events', 'objects'], introduced: ['cells-channels', 'cells-navigation'], representation: 'intención → evento, canal o navegación → consumidor' };
  if (number <= 62) return { required: ['promises', 'events'], introduced: ['cells-data-manager', 'cells-request-lifecycle'], representation: 'petición → estado → respuesta vigente o descarte → cleanup' };
  return { required: ['cells-components', 'cells-applications'], introduced: ['cells-production-parity', 'cells-delivery'], representation: 'workspace limpio → test y build → ZIP → continuación con CLI' };
}

export function createOpenCellsGuidedLesson(reading: ReadingItem): ScrimLessonData {
  const number = readNumber(reading);
  const practice = practiceFor(number);
  const workspace = workspaceFor(number, practice);
  const focus = focusFile(number);
  const skills = skillGroup(number);
  const explanation = reading.sections[0]?.content ?? reading.summary;
  const observable = reading.sections[1]?.content ?? reading.keyPoints[0];
  const mistake = reading.sections.at(-1)?.content ?? reading.keyPoints.at(-1) ?? '';

  return compileLesson({
    id: `open-cells-${suffix(number)}`,
    title: `${number}. ${reading.title}`,
    description: reading.summary,
    templateId: number <= 38 ? 'cells-component' : 'cells-application',
    narrationMode: 'silent',
    durationMs: 92_000,
    initialWorkspace: workspace,
    teachingFilePaths: teachingFiles(number, practice),
    concepts: reading.keyPoints.slice(0, 3),
    skillsRequired: skills.required,
    skillsIntroduced: skills.introduced,
    learningObjectives: [
      `Explicar con palabras propias el contrato de “${reading.title}”.`,
      'Predecir una salida observable antes de modificar el workspace.',
      `Comprobar el contrato con varias entradas mediante ${practice.functionName}.`,
    ],
    commonMistakes: [mistake, 'Cambiar varias fronteras a la vez y perder la causa del resultado.'],
    mentalModel: reading.summary,
    representations: [skills.representation, `entrada variable → ${practice.functionName} → evidencia observable`],
    transferPrompt: reading.transferPrompt,
    masteryChecks: [
      observable,
      'La comprobación acepta al menos dos entradas diferentes y conserva el caso ausente o inválido.',
      'Puedes justificar qué archivo cambiarías y cuál dejarías intacto.',
    ],
    frequentQuestions: reading.frequentQuestions,
    teachNotes: reading.sections.slice(0, 3).map((section) => ({ title: section.title, body: section.content })),
    beats: [
      { at: 0, type: 'chapter', title: 'Primero construye el modelo' },
      { at: 500, type: 'speak', text: `${reading.title}. ${explanation}` },
      { at: 12_000, type: 'switch', filePath: focus },
      { at: 12_400, type: 'gesture', durationMs: 2_400, points: [{ x: 24, y: 22, targetArea: 'editor' }, { x: 61, y: 39, targetArea: 'editor' }, { x: 72, y: 64, targetArea: 'editor' }] },
      { at: 14_000, type: 'speak', text: `En ${reading.title}, este archivo es la frontera que vamos a observar. No trabaja solo: ${observable}` },
      { at: 28_000, type: 'switch', filePath: practice.path },
      { at: 28_500, type: 'speak', text: `${practice.instructions} Primero aislamos esa decisión en ${practice.functionName}; después cambiaremos varias entradas para comprobar que no depende de un ejemplo fijo.` },
      { at: 39_000, type: 'write', filePath: practice.path, mode: 'replace', content: practice.complete },
      { at: 39_500, type: 'speak', text: `La demostración hace visible este modelo: ${skills.representation}. Sigue la entrada que cambia y localiza el caso que debe permanecer ausente, bloqueado o rechazado.` },
      { at: 54_000, type: 'run' },
      { at: 55_500, type: 'speak', text: `Ahora contrasta el resultado con el error frecuente. ${mistake}` },
      { at: 68_000, type: 'chapter', title: 'Tu práctica' },
      { at: 68_300, type: 'write', filePath: practice.path, mode: 'replace', content: practice.starter },
      { at: 69_000, type: 'speak', text: `Te devuelvo el punto de partida de ${reading.title}. Predice las tres comprobaciones de ${practice.functionName} antes de escribir y corrige una sola causa cada vez.` },
      {
        at: 76_000,
        type: 'challenge',
        challenge: {
          id: `open-cells-${suffix(number)}-reto`,
          title: `Comprueba el contrato: ${reading.title}`,
          instructions: `Antes de empezar: recuerda esta relación ya explicada: ${skills.representation}.

Punto de partida: ${practice.instructions} Trabaja en ${practice.path} y escribe primero tu predicción.

Cómo comprobarlo: ejecuta las tres comprobaciones. Usan valores distintos para confirmar comportamiento, no una línea exacta. Si te atascas, abre las pistas una a la vez; ninguna contiene la función terminada.`,
          tests: practice.tests,
          hints: practice.hints.map((text, index) => ({ level: index + 1, title: ['Ubica la frontera', 'Sigue la entrada', 'Comprueba el contrato'][index], text })),
          solutionExplanation: `La solución válida conserva esta relación: ${skills.representation}. La sintaxis puede variar mientras el comportamiento público sea el mismo.`,
        },
      },
      { at: 90_000, type: 'speak', text: `Después del reto de ${reading.title}, la lectura ampliará el porqué, el razonamiento reconstruirá el flujo y la depuración te pedirá transferirlo a otro programa.` },
    ],
  });
}

export function createOpenCellsGuidedLessons(readings: ReadingItem[], preservedLesson?: ScrimLessonData): Record<string, ScrimLessonData> {
  return Object.fromEntries(readings.map((reading) => {
    const number = readNumber(reading);
    const lesson = number === 6 && preservedLesson ? preservedLesson : createOpenCellsGuidedLesson(reading);
    return [lesson.id, lesson];
  }));
}
