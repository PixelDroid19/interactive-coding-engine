import { compileLesson } from '../../engine/lessonCompiler';
import { L08_ARR, L08_PUSH, L08_SOLUTION, lesson08Workspace } from './preDomWorkspaces';

const AUDIO_MS = 98_080;

export const LESSON_08 = compileLesson({
  id: 'fundamentos-08',
  title: '8. Arrays',
  description: 'Listas ordenadas: el primero es cero, length, push y un for para recorrer.',
  language: 'es',
  durationMs: AUDIO_MS,
  audioUrl: '/audio/fundamentos-08.mp3?v=gemini-20260824',
  fitTimelineToDuration: true,
  initialWorkspace: lesson08Workspace,
  executionMode: 'logic',
  concepts: ['Array (lista)', 'El índice empieza en 0'],
  skillsRequired: ['variables', 'functions', 'loops'],
  skillsIntroduced: ['arrays'],
  learningObjectives: [
    'Crear, leer y modificar una lista ordenada.',
    'Recorrer todos sus elementos empezando por el índice cero.',
  ],
  commonMistakes: [
    'Tratar el primer elemento como índice 1 en lugar de índice 0.',
    'Usar length como último índice en lugar de length menos uno.',
  ],
  teachNotes: [
    {
      title: 'El primero es cero',
      body: 'frutas[0] es el primero. El último está en length - 1.',
    },
  ],
  beats: [
    { at: 0, type: 'chapter', title: 'Listas' },
    {
      at: 200,
      type: 'speak',
      text: 'Hasta ahora guardamos valores individuales. Sin embargo, muchos problemas incluyen colecciones: una lista de tareas, los puntos de varias partidas o los nombres de un grupo. Para eso existen los arrays.',
    },
    {
      at: 11860,
      type: 'speak',
      text: 'Un array es una lista ordenada. Cada posición tiene un índice que nos permite encontrar su valor. JavaScript comienza a contar los índices desde cero, así que el primer elemento ocupa la posición cero.',
    },
    {
      at: 24080,
      type: 'speak',
      text: 'Aquí creamos un array llamado frutas. Los corchetes marcan el comienzo y el final de la lista, y las comas separan sus tres elementos.',
    },
    { at: 24800, type: 'write', filePath: 'app.js', mode: 'replace', content: L08_ARR },
    { at: 30000, type: 'run' },
    {
      at: 30960,
      type: 'speak',
      text: 'Para leer el primer elemento usamos frutas y el índice cero entre corchetes. La propiedad length indica cuántos elementos hay. Como los índices empiezan en cero, el último se encuentra en length menos uno.',
    },
    {
      at: 32000,
      type: 'gesture',
      durationMs: 1100,
      points: [
        { x: 46, y: 40, targetArea: 'preview' },
        { x: 64, y: 40, targetArea: 'preview' },
        { x: 54, y: 58, targetArea: 'preview' },
      ],
    },
    {
      at: 43820,
      type: 'speak',
      text: 'El método push agrega un elemento al final y pop elimina el último. Si queremos visitar toda la lista, usamos el for que ya conoces: empezamos en cero y continuamos mientras el índice sea menor que length.',
    },
    { at: 45000, type: 'write', filePath: 'app.js', mode: 'replace', content: L08_PUSH },
    { at: 50000, type: 'run' },
    {
      at: 55220,
      type: 'speak',
      text: 'Existen muchos más métodos, pero no los necesitamos todavía. Primero asegúrate de comprender cómo crear una lista, leer posiciones, modificar su final y recorrerla paso a paso.',
    },
    { at: 70060, type: 'chapter', title: 'Tu turno' },
    {
      at: 70060,
      type: 'speak',
      text: 'Ahora recibirás un array de números y deberás devolver su suma. Crea un acumulador, recorre la lista desde el índice cero y añade el valor de cada posición.',
    },
    {
      at: 71000,
      type: 'challenge',
      challenge: {
        id: 'reto-suma',
        title: 'Reto: suma del array',
        instructions: `Escribe suma(numeros).

Recorre todo el array, acumula sus valores desde cero y devuelve el total. Un array vacío debe devolver 0.`,
        tests: [
          {
            id: 'suma-1-2-3',
            description: 'suma([1,2,3]) es 6',
            validatorType: 'function-call',
            targetFunction: 'suma',
            args: [[1, 2, 3]],
            expectedReturn: 6,
            errorMessage: 'Con [1,2,3] debería ser 6.',
            hintTip: 'Recorre y acumula.',
          },
          {
            id: 'suma-2-5-3-10',
            description: 'suma([2,5,3,10]) es 20',
            validatorType: 'function-call',
            targetFunction: 'suma',
            args: [[2, 5, 3, 10]],
            expectedReturn: 20,
            errorMessage: 'Con [2,5,3,10] debería ser 20.',
            hintTip: 'total empieza en 0 y sumas numeros[i].',
          },
          {
            id: 'suma-vacio',
            description: 'suma([]) es 0',
            validatorType: 'function-call',
            targetFunction: 'suma',
            args: [[]],
            expectedReturn: 0,
            errorMessage: 'Con array vacío debería ser 0.',
            hintTip: 'Si no hay elementos, total queda en 0.',
          },
        ],
        hints: [
          { level: 1, title: 'Cero', text: 'let total = 0; antes del for.' },
          { level: 2, title: 'Índice', text: 'numeros[i] es el de esa vuelta.' },
          { level: 3, title: 'Comprueba', text: 'Sigue total vuelta por vuelta y verifica que el array vacío conserve el cero inicial.' },
        ],
        solutionExplanation: 'Un acumulador empieza en 0 y se come cada posición.',
      },
    },
    { at: 72000, type: 'write', filePath: 'app.js', mode: 'replace', content: L08_SOLUTION },
    { at: 73800, type: 'run' },
  ],
});
