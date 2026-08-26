import { compileLesson, file, workspaceOf } from '../../engine/lessonCompiler';
import { createCellsComponentWorkspace, createCellsPracticeWorkspace } from '../../engine/cells/cellsRecipes';
import type { DebuggingExerciseItem } from '../../types/curriculum';

const SOURCE_PATH = 'src/academy-learning-card.js';
const complete = createCellsComponentWorkspace({ name: 'academy-learning-card' }).snapshot;
const starter = createCellsPracticeWorkspace().snapshot;
const completeSource = complete.files[SOURCE_PATH].content;
const starterSource = starter.files[SOURCE_PATH].content;

export const OPEN_CELLS_LESSON_06 = compileLesson({
  id: 'open-cells-06',
  title: '6. Crear tu primer componente Cells',
  description: 'Conecta una dependencia scoped, textos traducibles y un evento público dentro de un componente exportable.',
  templateId: 'cells-component',
  narrationMode: 'silent',
  initialWorkspace: starter,
  teachingFilePaths: [
    'package.json',
    SOURCE_PATH,
    'src/locales/es.js',
    'src/locales/en.js',
    'demo/index.html',
    'test/unit/academy-learning-card.test.js',
  ],
  durationMs: 92_000,
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
    { at: 0, type: 'chapter', title: 'Lee el contrato antes del código' },
    { at: 400, type: 'speak', text: 'Este proyecto no es un fragmento aislado. Tiene una entrada pública, una demo, catálogos, pruebas y archivos de configuración que podrás exportar.' },
    { at: 8_000, type: 'switch', filePath: 'package.json' },
    { at: 8_300, type: 'speak', text: 'package.json declara el paquete y los comandos Cells reales. El playground interpreta una lista segura de esos comandos, pero conserva los archivos que utilizará la CLI fuera del navegador.' },
    { at: 18_000, type: 'switch', filePath: SOURCE_PATH },
    { at: 18_300, type: 'gesture', durationMs: 2_000, points: [{ x: 34, y: 20, targetArea: 'editor' }, { x: 61, y: 31, targetArea: 'editor' }] },
    { at: 19_000, type: 'speak', text: 'La clase compone tres capacidades. LitElement conserva el renderizado. ScopedElementsMixin aporta un registro local. WidgetMixin aporta traducción y emisión de eventos.' },
    { at: 31_000, type: 'write', filePath: SOURCE_PATH, mode: 'replace', content: completeSource },
    { at: 31_500, type: 'speak', text: 'Observa la tabla scopedElements. Cada nombre usado en el template apunta a una clase importada. Esto evita registrar las dependencias globalmente y permite que otro host use una versión distinta.' },
    { at: 44_000, type: 'switch', filePath: 'src/locales/es.js' },
    { at: 44_400, type: 'speak', text: 'El componente no guarda frases de producto dentro del template. Solicita claves con this.t y los catálogos mantienen la misma forma en español e inglés.' },
    { at: 54_000, type: 'switch', filePath: SOURCE_PATH },
    { at: 54_300, type: 'speak', text: 'Cuando la persona continúa, emitEvent publica una intención con el nombre necesario. El consumidor no recibe la instancia completa ni necesita conocer un método privado.' },
    { at: 63_000, type: 'run' },
    { at: 65_000, type: 'speak', text: 'La vista previa compila estos módulos dentro del runtime Cells aislado. Después, las pruebas del laboratorio cambiarán nombre e idioma, pulsarán el botón y observarán el evento.' },
    { at: 74_000, type: 'chapter', title: 'Tu turno' },
    { at: 74_200, type: 'write', filePath: SOURCE_PATH, mode: 'replace', content: starterSource },
    { at: 75_000, type: 'speak', text: 'Ahora conecta los dos contratos que faltan. No copies una línea: sigue las relaciones tag con clase y acción con evento, y comprueba después el comportamiento en el laboratorio.' },
    {
      at: 80_000,
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
            regexPattern: "static\\s+get\\s+scopedElements[\\s\\S]*['\"]open-cells-button-default['\"]\\s*:\\s*OpenCellsButtonDefault",
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
            regexPattern: "^(?![\\s\\S]*customElements\\.define\\(\\s*['\"]open-cells-button-default)",
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
    { at: 90_000, type: 'speak', text: 'La lectura siguiente repasa el modelo y abre el proyecto completo para probar idioma, evento, cobertura y exportación.' },
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
