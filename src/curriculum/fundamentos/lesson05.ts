import { compileLesson } from '../../engine/lessonCompiler';
import { L05_CHALLENGE, L05_ELSEIF, L05_IF, L05_SOLUTION, lesson05Workspace } from './preDomWorkspaces';

const AUDIO_MS = 118_960;

export const LESSON_05 = compileLesson({
  id: 'fundamentos-05',
  title: '5. Condicionales',
  description: 'El programa elige un camino: if, else, else if.',
  language: 'es',
  durationMs: AUDIO_MS,
  audioUrl: '/audio/fundamentos-05.mp3?v=gemini-20260824',
  fitTimelineToDuration: true,
  initialWorkspace: lesson05Workspace,
  executionMode: 'logic',
  concepts: ['if / else', 'else if'],
  skillsRequired: ['booleans', 'operators', 'variables'],
  skillsIntroduced: ['conditionals'],
  learningObjectives: [
    'Elegir entre caminos usando if, else if y else.',
    'Ordenar condiciones desde la más específica a la más general.',
  ],
  commonMistakes: [
    'Preguntar primero una condición demasiado amplia y bloquear las siguientes.',
    'Escribir varias decisiones independientes cuando solo debe ganar una.',
  ],
  teachNotes: [
    {
      title: 'Un camino, no todos',
      body: 'JavaScript mira de arriba a abajo y se queda con el primer sí. El orden importa.',
    },
  ],
  beats: [
    { at: 0, type: 'chapter', title: 'Decidir' },
    {
      at: 200,
      type: 'speak',
      text: 'Hasta ahora nuestras instrucciones siempre seguían el mismo camino. Hoy aprenderás a hacer que el programa elija qué debe ocurrir según una condición.',
    },
    {
      at: 7000,
      type: 'speak',
      text: 'Piensa en la entrada de un edificio. Si tienes credencial, puedes pasar; si no la tienes, debes quedarte fuera. Un condicional expresa ese tipo de decisión.',
    },
    {
      at: 7400,
      type: 'gesture',
      durationMs: 1000,
      points: [
        { x: 56, y: 32, targetArea: 'preview' },
        { x: 58, y: 52, targetArea: 'preview' },
      ],
    },
    {
      at: 15420,
      type: 'speak',
      text: 'En este ejemplo guardamos una edad. Si es igual o mayor que dieciocho, mostramos un mensaje. En cualquier otro caso, mostramos una respuesta diferente.',
    },
    { at: 16800, type: 'write', filePath: 'app.js', mode: 'replace', content: L05_IF },
    { at: 22000, type: 'run' },
    {
      at: 24180,
      type: 'speak',
      text: 'La pregunta se escribe entre los paréntesis del if. Cuando su resultado es true, JavaScript ejecuta el primer bloque. Cuando es false, continúa por el bloque else.',
    },
    {
      at: 25000,
      type: 'gesture',
      durationMs: 900,
      points: [
        { x: 32, y: 28, targetArea: 'editor' },
        { x: 40, y: 48, targetArea: 'editor' },
      ],
    },
    {
      at: 31180,
      type: 'speak',
      text: 'Cuando existen más de dos posibilidades usamos else if. Podemos preguntar primero si la nota llega a noventa, después si llega a ochenta y luego por los demás casos. JavaScript elige la primera condición verdadera, así que el orden importa.',
    },
    { at: 33000, type: 'write', filePath: 'app.js', mode: 'replace', content: L05_ELSEIF },
    { at: 43000, type: 'run' },
    {
      at: 46540,
      type: 'speak',
      text: 'Por ahora concéntrate en seguir el recorrido: JavaScript pregunta de arriba abajo y toma un solo camino. Entender esto es más importante que memorizar muchas variantes.',
    },
    {
      at: 58840,
      type: 'speak',
      text: 'Prueba distintas edades y ejecuta de nuevo. Verás que el resultado cambia porque el programa evalúa la condición con el valor actual. No adivina; compara y decide.',
    },
    { at: 68240, type: 'chapter', title: 'Tu turno' },
    { at: 68300, type: 'write', filePath: 'app.js', mode: 'replace', content: L05_CHALLENGE },
    {
      at: 68240,
      type: 'speak',
      text: 'Ahora corrige un recorrido. La nota es ochenta y cinco, pero las condiciones están desordenadas y aparece la letra C. Colócalas desde la más exigente hasta la más general para obtener B.',
    },
    {
      at: 73000,
      type: 'challenge',
      challenge: {
        id: 'reto-letra',
        title: 'Reto: letra de la nota',
        instructions: `Corrige el orden de los condicionales sin cambiar nota.

- 90 o más → A
- 80 o más → B
- 70 o más → C
- si no → F

Con nota igual a 85, la consola debe mostrar B.`,
        tests: [
          {
            id: 'orden-condiciones',
            description: 'Las condiciones van de la más exigente a la más general',
            validatorType: 'source-regex',
            regexPattern: 'nota\\s*>=\\s*90[\\s\\S]*nota\\s*>=\\s*80[\\s\\S]*nota\\s*>=\\s*70',
            errorMessage: 'Las condiciones todavía no están ordenadas como 90, 80 y 70.',
            hintTip: 'La primera condición verdadera gana.',
          },
          {
            id: 'muestra-b',
            description: 'La salida real para 85 es B',
            validatorType: 'console-check',
            expectedValue: ['B'],
            errorMessage: 'El programa se ejecutó, pero la consola no mostró B.',
            hintTip: 'Con 85, la condición de 90 falla y la de 80 debe ganar.',
          },
        ],
        hints: [
          { level: 1, title: 'Orden', text: 'Pregunta primero por 90, luego 80, luego 70.' },
          { level: 2, title: 'Sigue el recorrido', text: 'Con 85, la pregunta de 90 falla y la de 80 debe ser la siguiente.' },
          { level: 3, title: 'Mueve bloques completos', text: 'Conserva cada letra junto a su comparación y ordena los cortes de mayor a menor.' },
        ],
        solutionExplanation: 'Se evalúa de arriba a abajo. El primer sí gana.',
      },
    },
    { at: 76000, type: 'write', filePath: 'app.js', mode: 'replace', content: L05_SOLUTION },
    { at: 78500, type: 'run' },
  ],
});
