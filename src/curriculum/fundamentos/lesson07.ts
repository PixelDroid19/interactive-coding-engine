import { compileLesson } from '../../engine/lessonCompiler';
import { L07_FN, L07_SOLUTION, lesson07Workspace } from './preDomWorkspaces';

const AUDIO_MS = 103_440;

export const LESSON_07 = compileLesson({
  id: 'fundamentos-07',
  title: '7. Funciones',
  description: 'Escribe una tarea una vez, llámala muchas, y devuelve un resultado.',
  language: 'es',
  durationMs: AUDIO_MS,
  audioUrl: '/audio/fundamentos-07.mp3?v=gemini-20260824',
  fitTimelineToDuration: true,
  initialWorkspace: lesson07Workspace,
  executionMode: 'logic',
  concepts: ['Qué es una función', 'return'],
  skillsRequired: ['variables', 'operators'],
  skillsIntroduced: ['functions'],
  learningObjectives: [
    'Definir y llamar una función con parámetros.',
    'Devolver un resultado reutilizable mediante return.',
  ],
  commonMistakes: [
    'Definir una función y esperar que se ejecute sin llamarla.',
    'Calcular un valor pero olvidar devolverlo con return.',
  ],
  teachNotes: [
    {
      title: 'Definir no ejecuta',
      body: 'function ... { } solo la guarda. Los paréntesis al final son: corre ahora, con esto.',
    },
  ],
  beats: [
    { at: 0, type: 'chapter', title: 'Una vez, muchas veces' },
    {
      at: 200,
      type: 'speak',
      text: 'Cuando una tarea se repite, copiar el mismo código una y otra vez aumenta la posibilidad de cometer errores. Una función reúne esa tarea bajo un nombre para poder usarla cuando la necesitemos.',
    },
    {
      at: 11740,
      type: 'speak',
      text: 'Una función tiene un nombre y un bloque de instrucciones. Puede recibir datos para trabajar con ellos y puede devolver un resultado al terminar.',
    },
    {
      at: 19780,
      type: 'speak',
      text: 'Aquí definimos una función llamada saludar. El nombre que aparece entre paréntesis es el dato que recibirá. Dentro construimos el saludo y usamos return para entregar el resultado.',
    },
    { at: 21000, type: 'write', filePath: 'app.js', mode: 'replace', content: L07_FN },
    { at: 26500, type: 'run' },
    {
      at: 27000,
      type: 'gesture',
      durationMs: 900,
      points: [
        { x: 54, y: 42, targetArea: 'preview' },
        { x: 58, y: 56, targetArea: 'preview' },
      ],
    },
    {
      at: 32100,
      type: 'speak',
      text: 'Definir una función prepara sus instrucciones, pero todavía no las ejecuta. Para usarla debemos llamarla por su nombre y escribir paréntesis. Dentro colocamos el dato de esa llamada.',
    },
    {
      at: 40660,
      type: 'speak',
      text: 'Los nombres que reciben los datos se llaman parámetros. return indica qué valor sale de la función. Sin return, las instrucciones pueden ejecutarse, pero quien hizo la llamada no recibe ese resultado.',
    },
    {
      at: 51020,
      type: 'speak',
      text: 'Una función resulta reutilizable cuando trabaja con sus parámetros. Si colocamos un nombre o un número fijo dentro, quizá funcione para un caso, pero fallará al recibir datos diferentes.',
    },
    {
      at: 61540,
      type: 'speak',
      text: 'Por ahora usaremos funciones con nombre y esta forma sencilla. Al leer una, pregúntate siempre qué datos entran, qué trabajo realiza y qué valor devuelve.',
    },
    { at: 71920, type: 'chapter', title: 'Tu turno' },
    {
      at: 71920,
      type: 'speak',
      text: 'Ahora crea areaRectangulo. La función debe recibir un ancho y un alto, multiplicarlos y devolver el área. Llámala con dos pares de medidas para comprobar que no depende de valores fijos.',
    },
    {
      at: 78000,
      type: 'challenge',
      challenge: {
        id: 'reto-area',
        title: 'Reto: areaRectangulo',
        instructions: `Escribe areaRectangulo(ancho, alto).

Debe calcular el área usando los dos parámetros y devolver el resultado. Después llámala dos veces con medidas distintas y muestra ambos valores.`,
        tests: [
          {
            id: 'area-3-4',
            description: 'areaRectangulo(3, 4) es 12',
            validatorType: 'function-call',
            targetFunction: 'areaRectangulo',
            args: [3, 4],
            expectedReturn: 12,
            errorMessage: 'Con 3 y 4 debería ser 12. Revisa que uses ancho * alto.',
            hintTip: 'El resultado depende de combinar ancho y alto dentro de la función.',
          },
          {
            id: 'area-10-2',
            description: 'areaRectangulo(10, 2) es 20',
            validatorType: 'function-call',
            targetFunction: 'areaRectangulo',
            args: [10, 2],
            expectedReturn: 20,
            errorMessage: 'Con 10 y 2 debería ser 20.',
            hintTip: 'La función debe usar los parámetros que recibe.',
          },
          {
            id: 'area-0-5',
            description: 'areaRectangulo(0, 5) es 0',
            validatorType: 'function-call',
            targetFunction: 'areaRectangulo',
            args: [0, 5],
            expectedReturn: 0,
            errorMessage: 'Con 0 debería ser 0. ¿Ignora un parámetro?',
            hintTip: 'Si un lado es 0, el área es 0.',
          },
        ],
        hints: [
          { level: 1, title: 'Firma', text: 'Dos parámetros: ancho y alto.' },
          { level: 2, title: 'return', text: 'Sin return no entrega el número.' },
          { level: 3, title: 'Comprueba', text: 'Prueba dos pares distintos. Si ambos dan 12, todavía usas números fijos.' },
        ],
        solutionExplanation: 'La función no depende de una interfaz. Recibe números y devuelve un número que puedes comprobar en la consola.',
      },
    },
    { at: 81000, type: 'write', filePath: 'app.js', mode: 'replace', content: L07_SOLUTION },
    { at: 83000, type: 'run' },
  ],
});
