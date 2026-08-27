import { compileLesson, type LessonBeat } from '../../engine/lessonCompiler';
import { createCellsAppWorkspace } from '../../engine/cells/cellsAppRecipes';
import { createCellsComponentWorkspace } from '../../engine/cells/cellsRecipes';
import type { ReadingItem } from '../../types/curriculum';
import type { ChallengeTest, ScrimLessonData, WorkspaceSnapshot } from '../../types/scrim';
import { createOpenCellsProjectJourney, type OpenCellsProjectJourney } from './projectJourneys';

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

function sentence(text: string): string {
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
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
  if (number <= 25) return 'locales/locales.json';
  if (number <= 30) return 'src/academy-learning-card.js';
  if (number === 31) return 'demo/demo.js';
  if (number === 35) return 'locales/locales.json';
  if (number === 36) return 'custom-elements.json';
  if (number === 37) return 'demo/demo-build.js';
  if (number === 38) return 'package.json';
  if (number <= 38) return 'test/unit/academy-learning-card.test.js';
  if (number <= 42) return 'app/scripts/app.js';
  if (number <= 46) return 'app/pages/academy-home-page/academy-home-page.js';
  if (number <= 54) return number <= 50 ? 'app/scripts/app-routes.js' : 'app/pages/academy-home-page/academy-home-page.js';
  if (number <= 57) return 'app/pages/academy-home-page/academy-home-page.js';
  if (number <= 62) return 'app/data/academy-product-data-manager.js';
  if (number <= 65) return 'test/unit/app.test.js';
  if (number <= 67) return 'package.json';
  return 'README.md';
}

function incompleteProjectFile(path: string): string {
  if (path.endsWith('.json')) return '{\n  \n}\n';
  if (path.endsWith('.html')) return '<!doctype html>\n<html lang="es">\n  <body>\n    <!-- Construiremos esta superficie durante la clase. -->\n  </body>\n</html>\n';
  if (path.endsWith('.md')) return '# Proyecto Cells\n\nDurante la clase documentaremos cómo continuar este proyecto.\n';
  if (path.endsWith('.css') || path.endsWith('.scss')) return '/* Construiremos estos estilos desde su responsabilidad pública. */\n';
  return `// ${path}\n// Construiremos este archivo y seguiremos después quién lo consume.\n`;
}

interface PreparedJourney {
  workspace: WorkspaceSnapshot;
  journey: OpenCellsProjectJourney;
  completeFiles: Record<string, string>;
}

function prepareJourney(number: number): PreparedJourney {
  const base = number <= 38
    ? createCellsComponentWorkspace({ name: 'academy-learning-card' }).snapshot
    : createCellsAppWorkspace({ name: 'academy-store-app' }).snapshot;
  const focus = focusFile(number);
  const journey = createOpenCellsProjectJourney(number, focus, base);
  const completeFiles = Object.fromEntries(journey.stops
    .filter((stop) => stop.write)
    .map((stop) => [stop.path, base.files[stop.path].content]));
  const files = Object.fromEntries(Object.entries(base.files).map(([path, source]) => [path, { ...source }]));
  for (const stop of journey.stops) {
    if (stop.write) files[stop.path] = { ...files[stop.path], content: incompleteProjectFile(stop.path) };
  }
  return {
    journey,
    completeFiles,
    workspace: {
      ...base,
      files,
      activeFilePath: journey.stops[0]?.path ?? focus,
    },
  };
}

function projectBeats(
  reading: ReadingItem,
  journey: OpenCellsProjectJourney,
  completeFiles: Record<string, string>,
): { beats: LessonBeat[]; endAt: number } {
  const number = readNumber(reading);
  const spokenDuration = (text: string) => Math.max(4_800, Math.ceil(text.trim().split(/\s+/).length * 60_000 / 185) + 500);
  const paths = journey.stops.map((stop) => stop.path);
  const intro = `${reading.title}. ${reading.summary} Hoy seguiremos el recorrido ${paths.join(' → ')}. Para entender ${reading.title}, identificaremos quién posee cada dato, quién consume su salida y qué resultado observable confirma el contrato.`;
  const firstOpeners = ['Empezamos por', 'Nuestro punto de partida es', 'La primera parada está en'];
  const middleOpeners = ['Después abrimos', 'Seguimos en', 'El siguiente enlace aparece en', 'Ahora pasamos a'];
  const lastOpeners = ['Terminamos en', 'La última parada es', 'Cerramos el recorrido en'];
  const buildOpeners = ['Vamos a completar', 'Ahora sí editamos', 'Este es el archivo que modificaremos:', 'Aquí hacemos el cambio principal en'];
  const observerNotes = [
    (path: string) => `En ${reading.title}, ${path} queda intacto para comprobar el contrato desde fuera.`,
    (path: string) => `${path} actúa como consumidor del cambio y no necesita otra edición en este paso.`,
    (path: string) => `Solo inspeccionamos ${path}; cambiarlo también ocultaría la causa del resultado.`,
  ];
  const beats: LessonBeat[] = [
    { at: 0, type: 'chapter', title: 'Construye el proyecto y sigue sus conexiones' },
    { at: 500, type: 'speak', text: intro },
  ];
  let cursor = 500 + spokenDuration(intro) + 600;
  journey.stops.forEach((stop, index) => {
    const previous = journey.stops[index - 1];
    const next = journey.stops[index + 1];
    const isLast = index === journey.stops.length - 1;
    const openerIndex = number + index;
    const opening = index === 0
      ? `${firstOpeners[openerIndex % firstOpeners.length]} ${stop.path}. Este archivo ${stop.role}. Antes de tocarlo en ${reading.title}, localiza su salida pública y predice quién dependerá de ella.`
      : isLast
        ? `${lastOpeners[openerIndex % lastOpeners.length]} ${stop.path}. Este archivo ${stop.role}. Compáralo con ${previous.path}: deben colaborar sin duplicar responsabilidades.`
        : `${middleOpeners[openerIndex % middleOpeners.length]} ${stop.path}. Este archivo ${stop.role}. Revisa qué recibe de ${previous.path} y qué deja preparado para ${next.path}.`;
    const observation = stop.write
      ? opening
      : `${opening} ${observerNotes[openerIndex % observerNotes.length](stop.path)}`;
    beats.push(
      { at: cursor, type: 'switch', filePath: stop.path },
      { at: cursor + 300, type: 'gesture', durationMs: 1_500, points: [{ x: 22, y: 18, targetArea: 'editor' }, { x: 58, y: 42, targetArea: 'editor' }] },
      { at: cursor + 500, type: 'speak', text: observation },
    );
    cursor += 500 + spokenDuration(observation) + 400;
    if (stop.write) {
      const connection = next
        ? `Después lo contrastaremos con ${next.path} para verificar el contrato desde otro archivo.`
        : 'Con este cambio ya podremos ejecutar el recorrido y observar su resultado.';
      const build = `${buildOpeners[openerIndex % buildOpeners.length]} ${stop.path}. ${sentence(stop.buildExplanation)} ${connection}`;
      beats.push(
        { at: cursor, type: 'speak', text: build },
        { at: cursor + 1_200, type: 'write', filePath: stop.path, mode: 'replace', content: completeFiles[stop.path] },
      );
      cursor += spokenDuration(build) + 600;
    }
  });
  return { beats, endAt: cursor };
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
  return { required: ['cells-app-runtime', 'cells-public-testing'], introduced: ['cells-production-parity', 'cells-delivery'], representation: 'workspace limpio → test y build → ZIP → continuación con CLI' };
}

export function createOpenCellsGuidedLesson(reading: ReadingItem): ScrimLessonData {
  const number = readNumber(reading);
  const practice = practiceFor(number);
  const prepared = prepareJourney(number);
  const { workspace, journey, completeFiles } = prepared;
  const skills = skillGroup(number);
  const observable = reading.sections[1]?.content ?? reading.keyPoints[0];
  const mistake = reading.sections.at(-1)?.content ?? reading.keyPoints.at(-1) ?? '';
  const projectTape = projectBeats(reading, journey, completeFiles);
  const spokenDuration = (text: string) => Math.max(4_800, Math.ceil(text.trim().split(/\s+/).length * 60_000 / 185) + 500);
  const evidenceOpeners = ['Ejecutamos el proyecto y buscamos una señal concreta:', 'Ya está conectado el recorrido. La comprobación importante es esta:', 'Con los archivos enlazados, observa este contrato:'];
  const mistakeOpeners = ['Antes del ejercicio, intenta explicar este fallo:', 'Ahora piensa en el caso que suele romper este contrato:', 'Haz una última predicción sobre este error frecuente:'];
  const handoffOpeners = ['La lectura siguiente organiza lo que acabamos de ver', 'A continuación podrás repasar el modelo con calma', 'El siguiente paso separa explicación y práctica'];
  const variant = number % evidenceOpeners.length;
  const evidenceCue = `${evidenceOpeners[variant]} ${observable} Si el preview contradice tu predicción sobre ${reading.title}, vuelve al último archivo editado y sigue su salida hasta el consumidor.`;
  const mistakeCue = `${mistakeOpeners[variant]} ${mistake} En ${reading.title}, propón una causa, cambia una sola frontera y usa el preview o las pruebas para refutarla.`;
  const handoffCue = `${handoffOpeners[variant]} sobre ${reading.title}. Después, el proyecto de ${reading.title} se abrirá completo para que experimentes y compares soluciones equivalentes sin recibir una línea para copiar.`;
  const runAt = projectTape.endAt;
  const evidenceAt = runAt + 1_000;
  const mistakeAt = evidenceAt + spokenDuration(evidenceCue) + 600;
  const handoffAt = mistakeAt + spokenDuration(mistakeCue) + 600;
  const durationMs = handoffAt + spokenDuration(handoffCue) + 1_200;

  return compileLesson({
    id: `open-cells-${suffix(number)}`,
    title: `${number}. ${reading.title}`,
    description: reading.summary,
    templateId: number <= 38 ? 'cells-component' : 'cells-application',
    narrationMode: 'silent',
    initialWorkspace: workspace,
    teachingFilePaths: journey.stops.map((stop) => stop.path),
    concepts: reading.keyPoints.slice(0, 3),
    skillsRequired: skills.required,
    skillsIntroduced: skills.introduced,
    learningObjectives: [
      `Recorrer los archivos reales que colaboran en “${reading.title}” y explicar quién consume a quién.`,
      `Construir ${journey.stops.filter((stop) => stop.write).map((stop) => stop.path).join(', ')} sin aislarlo del resto del proyecto.`,
      'Ejecutar el proyecto y continuar en el laboratorio asociado para corregir el mismo contrato dentro del workspace completo.',
    ],
    commonMistakes: [mistake, 'Cambiar varias fronteras a la vez y perder la causa del resultado.'],
    mentalModel: reading.summary,
    representations: [skills.representation, 'archivo propietario → consumidor real → preview y contratos del proyecto'],
    transferPrompt: reading.transferPrompt,
    masteryChecks: [
      observable,
      'La comprobación se ejecuta sobre el proyecto completo y distingue estructura, comportamiento visible y eventos.',
      'Puedes justificar qué archivo cambiarías y cuál dejarías intacto.',
    ],
    frequentQuestions: reading.frequentQuestions,
    teachNotes: reading.sections.slice(0, 3).map((section) => ({ title: section.title, body: section.content })),
    durationMs,
    beats: [
      ...projectTape.beats,
      { at: runAt, type: 'run' },
      { at: evidenceAt, type: 'speak', text: evidenceCue },
      { at: mistakeAt, type: 'speak', text: mistakeCue },
      { at: handoffAt, type: 'speak', text: handoffCue },
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
