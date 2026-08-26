import { compileLesson, file, workspaceOf } from '../../engine/lessonCompiler';
import { createCellsComponentWorkspace, createCellsPracticeWorkspace } from '../../engine/cells/cellsRecipes';
import type { DebuggingExerciseItem } from '../../types/curriculum';

const SOURCE_PATH = 'src/academy-learning-card.js';
const complete = createCellsComponentWorkspace({ name: 'academy-learning-card' }).snapshot;
const starter = createCellsPracticeWorkspace().snapshot;
const completeSource = complete.files[SOURCE_PATH].content;
const starterSource = starter.files[SOURCE_PATH].content;
const PUBLIC_ENTRY_PATH = 'academy-learning-card.js';
const LOCALES_PATH = 'locales/locales.json';
const DEMO_HTML_PATH = 'demo/index.html';
const DEMO_CONTROLLER_PATH = 'demo/demo.js';
const guidedStarter = {
  ...complete,
  files: Object.fromEntries(Object.entries(complete.files).map(([path, source]) => [path, { ...source }])),
  activeFilePath: 'package.json',
};
for (const path of ['package.json', 'index.js', PUBLIC_ENTRY_PATH, SOURCE_PATH, LOCALES_PATH, DEMO_HTML_PATH, DEMO_CONTROLLER_PATH]) {
  guidedStarter.files[path] = {
    ...guidedStarter.files[path],
    content: path.endsWith('.json')
      ? '{\n  \n}\n'
      : path.endsWith('.html')
        ? '<!doctype html>\n<html lang="es"><body><!-- Aquí montaremos la demo. --></body></html>\n'
        : `// ${path}\n// Lo construiremos y después veremos quién lo consume.\n`,
  };
}

export const OPEN_CELLS_LESSON_06 = compileLesson({
  id: 'open-cells-06',
  title: '6. Crear tu primer componente Cells',
  description: 'Conecta una dependencia scoped, textos traducibles y un evento público dentro de un componente exportable.',
  templateId: 'cells-component',
  narrationMode: 'silent',
  initialWorkspace: guidedStarter,
  teachingFilePaths: [
    'package.json',
    'index.js',
    PUBLIC_ENTRY_PATH,
    SOURCE_PATH,
    LOCALES_PATH,
    DEMO_HTML_PATH,
    DEMO_CONTROLLER_PATH,
    'test/unit/academy-learning-card.test.js',
  ],
  durationMs: 122_000,
  concepts: ['WidgetMixin', 'ScopedElementsMixin', 'this.t', 'this.emitEvent'],
  skillsRequired: ['lit-component', 'reactive-properties', 'events'],
  skillsIntroduced: ['cells-scoped-elements', 'cells-i18n', 'cells-public-events', 'cells-project-workflow'],
  learningObjectives: [
    'Explicar qué responsabilidad conserva cada mixin de la clase base.',
    'Registrar dos dependencias locales usadas por el template.',
    'Cambiar el idioma visible y observar un evento público con detail estable.',
  ],
  commonMistakes: [
    'Importar una clase y asumir que eso ya la registra dentro del Shadow DOM.',
    'Usar customElements.define para dependencias que deben permanecer aisladas.',
    'Emitir un click genérico o enviar la instancia completa en event.detail.',
  ],
  mentalModel: 'Los datos entran por propiedades, el host resuelve sus dependencias localmente, traduce el texto y devuelve intenciones mediante eventos públicos.',
  representations: [
    'propiedad → actualización Lit → DOM observable',
    'tag del template → scopedElements → clase importada',
    'acción interna → emitEvent → consumidor',
  ],
  transferPrompt: 'Diseña una tarjeta de museo con un botón “Guardar”: decide qué recibe por propiedad, qué traduce y qué detail emite sin conocer la página que la consume.',
  masteryChecks: [
    'La vista previa renderiza el texto en español e inglés.',
    'El botón se resuelve mediante scopedElements, sin registro global de la dependencia.',
    'El evento cruza Shadow DOM y conserva un payload pequeño.',
  ],
  teachNotes: [
    { title: 'Tres capas, tres responsabilidades', body: 'LitElement renderiza; ScopedElementsMixin resuelve clases dentro del host; WidgetMixin ofrece traducción y eventos.' },
    { title: 'Importar no es registrar', body: 'El import trae una clase al módulo. scopedElements decide qué etiqueta la usa dentro de este componente.' },
    { title: 'Un evento comunica una intención', body: 'El consumidor escucha una decisión de negocio y no necesita llamar métodos internos.' },
  ],
  beats: [
    { at: 0, type: 'chapter', title: 'Crea un componente Cells desde sus entradas' },
    { at: 400, type: 'speak', text: 'Vamos a crear el componente archivo por archivo. Empezamos por el paquete, seguimos sus entradas hasta la clase, añadimos locales y terminamos consumiéndolo desde una demo real.' },
    { at: 8_000, type: 'switch', filePath: 'package.json' },
    { at: 8_300, type: 'speak', text: 'package.json da identidad al paquete. type module habilita import y export; exports declara las entradas públicas; los scripts conservan desarrollo, pruebas, locales, documentación y build.' },
    { at: 10_000, type: 'write', filePath: 'package.json', mode: 'replace', content: complete.files['package.json'].content },
    { at: 19_000, type: 'switch', filePath: 'index.js' },
    { at: 19_300, type: 'speak', text: 'index.js exporta la clase desde src sin registrar todavía el tag. Esto permite importar la clase en pruebas o en composición avanzada sin ejecutar un efecto global.' },
    { at: 21_000, type: 'write', filePath: 'index.js', mode: 'replace', content: complete.files['index.js'].content },
    { at: 29_000, type: 'switch', filePath: PUBLIC_ENTRY_PATH },
    { at: 29_300, type: 'speak', text: 'La segunda entrada importa la clase y registra academy-learning-card si el tag aún no existe. Esta es la superficie sencilla que normalmente consume una aplicación.' },
    { at: 31_000, type: 'write', filePath: PUBLIC_ENTRY_PATH, mode: 'replace', content: complete.files[PUBLIC_ENTRY_PATH].content },
    { at: 39_000, type: 'switch', filePath: SOURCE_PATH },
    { at: 39_300, type: 'speak', text: 'Ahora construimos la clase. LitElement renderiza, ScopedElementsMixin resuelve dependencias locales y WidgetMixin aporta traducción y eventos. properties define learnerName como entrada pública.' },
    { at: 42_000, type: 'write', filePath: SOURCE_PATH, mode: 'replace', content: completeSource },
    { at: 51_000, type: 'switch', filePath: LOCALES_PATH },
    { at: 51_300, type: 'speak', text: 'locales.json es la fuente de idioma del componente. Inglés y español repiten claves y placeholders; el template solicita esas claves con this.t en lugar de guardar frases sueltas.' },
    { at: 53_000, type: 'write', filePath: LOCALES_PATH, mode: 'replace', content: complete.files[LOCALES_PATH].content },
    { at: 61_000, type: 'switch', filePath: DEMO_HTML_PATH },
    { at: 61_300, type: 'speak', text: 'La demo crea controles, instancia el tag público y reserva un output para observar eventos. No copia la implementación del componente.' },
    { at: 63_000, type: 'write', filePath: DEMO_HTML_PATH, mode: 'replace', content: complete.files[DEMO_HTML_PATH].content },
    { at: 70_000, type: 'switch', filePath: DEMO_CONTROLLER_PATH },
    { at: 70_300, type: 'speak', text: 'demo.js importa la entrada pública, asigna learnerName cuando cambia el input, actualiza el idioma y escucha academy-learning-card-continue como lo haría una aplicación.' },
    { at: 72_000, type: 'write', filePath: DEMO_CONTROLLER_PATH, mode: 'replace', content: complete.files[DEMO_CONTROLLER_PATH].content },
    { at: 80_000, type: 'run' },
    { at: 81_000, type: 'speak', text: 'Ejecutamos después de conectar el grafo completo. La vista debe mostrar el nombre, cambiar idioma y devolver el evento sin que la demo conozca métodos privados.' },
    { at: 89_000, type: 'chapter', title: 'Tu turno sobre el componente real' },
    { at: 89_200, type: 'write', filePath: SOURCE_PATH, mode: 'replace', content: starterSource },
    { at: 90_000, type: 'speak', text: 'Retiro únicamente el registro del botón y la emisión pública. El resto del proyecto permanece para que puedas seguir imports, template, locales y consumidor antes de corregir.' },
    {
      at: 98_000,
      type: 'challenge',
      challenge: {
        id: 'open-cells-06-reto',
        title: 'Conecta el componente sin romper su aislamiento',
        instructions: `Antes de empezar: recuerda el flujo tag → registro local → clase y acción → evento público.

Punto de partida: trabaja en src/academy-learning-card.js. El botón ya está importado, pero falta conectarlo al registro scoped y handleContinue todavía no comunica la intención.

Completa ambos contratos sin registrar la dependencia mediante customElements.define. El detail del evento debe incluir learnerName.

Cómo comprobarlo: ejecuta las comprobaciones con dos nombres, cambia el idioma y observa que el consumidor recibe el evento. Si te atascas, abre las pistas una vez cada vez; ninguna contiene la línea terminada.`,
        tests: [
          {
            id: 'cells06-scoped-button',
            description: 'La tabla scoped asocia el botón con la clase importada',
            validatorType: 'source-regex',
            regexPattern: "static\\s+get\\s+scopedElements[\\s\\S]*['\"]bbva-button-default['\"]\\s*:\\s*BbvaButtonDefault",
            errorMessage: 'El tag del botón todavía no se puede resolver dentro de este host.',
            hintTip: 'Compara el tag usado por render con la clase que ya aparece en los imports.',
          },
          {
            id: 'cells06-public-event',
            description: 'La acción emite continue con un payload que usa learnerName',
            validatorType: 'source-regex',
            regexPattern: "emitEvent\\s*\\(\\s*['\"]continue['\"]\\s*,\\s*\\{[\\s\\S]*learnerName",
            errorMessage: 'La acción todavía no expone una intención pública con el nombre de quien aprende.',
            hintTip: 'El método ya recibe el dato desde this.learnerName; decide qué campo serializable necesita el consumidor.',
          },
          {
            id: 'cells06-no-global-dependency',
            description: 'La dependencia permanece local al host',
            validatorType: 'source-regex',
            regexPattern: "^(?![\\s\\S]*customElements\\.define\\(\\s*['\"]bbva-button-default)",
            errorMessage: 'Encontramos un registro global para una dependencia que debe ser scoped.',
            hintTip: 'El host ya dispone de una tabla local; no necesita definir globalmente el botón.',
          },
        ],
        hints: [
          { level: 1, title: 'Sigue los nombres', text: 'Busca el tag exacto que renderiza el template y la clase del botón que ya está importada.' },
          { level: 2, title: 'Separa las fronteras', text: 'scopedElements resuelve dependencias; handleContinue comunica la decisión. Corrige una frontera y comprueba antes de tocar la otra.' },
          { level: 3, title: 'Piensa como consumidor', text: 'El consumidor necesita reconocer la intención y leer el nombre, pero no necesita la instancia completa ni detalles privados.' },
        ],
        solutionExplanation: 'El registro local une una etiqueta con una clase dentro del host. La acción pública transporta únicamente el dato que el consumidor necesita.',
      },
    },
    { at: 118_000, type: 'speak', text: 'La lectura siguiente repasa el recorrido completo y abre el mismo proyecto para probar idioma, evento, cobertura y exportación.' },
  ],
});

export const OPEN_CELLS_DEBUG_06: DebuggingExerciseItem = {
  id: 'open-cells-06-depura',
  relatedLessonId: 'open-cells-06',
  type: 'debugging',
  title: 'El registro siempre devuelve el botón',
  description: 'Depura un resolvedor pequeño que representa la tabla scoped. Es otro programa: no es el componente mostrado en la clase.',
  estimatedMinutes: 9,
  executionMode: 'logic',
  templateId: 'js-only',
  initialWorkspace: workspaceOf('app.js', {
    'app.js': file('app.js', `function resolverDependencia(tag, registro) {
  return registro['open-cells-button-default'];
}
`),
  }),
  expectedBehavior: 'Devuelve la clase asociada al tag solicitado y undefined si ese tag no está registrado.',
  observedBehavior: 'Devuelve siempre la clase del botón, incluso cuando se solicita otro tag.',
  hints: [
    { level: 1, text: 'Prueba mentalmente dos tags distintos sobre el mismo objeto registro.' },
    { level: 2, text: 'El parámetro tag contiene la clave que cambia entre llamadas.' },
    { level: 3, text: 'Lee el registro con la clave recibida; no conviertas una dependencia concreta en una regla global.' },
  ],
  tests: [
    { id: 'cells06-debug-button', description: 'Resuelve el botón', validatorType: 'function-call', targetFunction: 'resolverDependencia', args: ['open-cells-button-default', { 'open-cells-button-default': 'Button', 'open-cells-type-text': 'Text' }], expectedReturn: 'Button' },
    { id: 'cells06-debug-text', description: 'Resuelve otra dependencia del mismo host', validatorType: 'function-call', targetFunction: 'resolverDependencia', args: ['open-cells-type-text', { 'open-cells-button-default': 'Button', 'open-cells-type-text': 'Text' }], expectedReturn: 'Text' },
    { id: 'cells06-debug-missing', description: 'No inventa una clase para un tag ausente', validatorType: 'function-call', targetFunction: 'resolverDependencia', args: ['academy-missing', { 'open-cells-button-default': 'Button' }], expectedReturn: undefined },
  ],
  troubleshootingTips: ['Separa el dato que cambia —tag— del contenedor que lo relaciona con una clase —registro—.'],
};
