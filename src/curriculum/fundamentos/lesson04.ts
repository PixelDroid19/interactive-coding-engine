import { compileLesson } from '../../engine/lessonCompiler';
import { L04_CMP, L04_OPS, L04_SOLUTION, lesson04Workspace } from './pages';

const AUDIO_MS = 98_960;

export const LESSON_04 = compileLesson({
  id: 'fundamentos-04',
  title: '4. Operadores',
  description: 'Suma, resto, comparar con tres iguales, y combinar condiciones con y / o.',
  audioUrl: '/audio/fundamentos-04.mp3?v=lote',
  language: 'es',
  durationMs: AUDIO_MS,
  initialWorkspace: lesson04Workspace,
  concepts: ['Calcular (+, *, %)', 'Comparar (=== y &&)'],
  teachNotes: [
    {
      title: 'El porcentaje es el resto',
      body: '10 % 3 da 1. Si el resto al dividir entre 2 es 0, el número es par.',
    },
    {
      title: 'Tres iguales',
      body: 'Un igual asigna. Tres iguales comparan valor y tipo. El texto "10" no es el número 10.',
    },
  ],
  beats: [
    { at: 0, type: 'chapter', title: 'Calcular' },
    {
      at: 200,
      type: 'speak',
      text: 'Ya sabes guardar datos. Ahora hay que hacer algo con ellos. Los operadores son los símbolos que calculan, comparan o combinan.',
    },
    {
      at: 10180,
      type: 'speak',
      text: 'Mira la página. Hay dos números. Diez y tres. Vamos a sumarlos, restarlos, multiplicarlos y dividirlos.',
    },
    {
      at: 10800,
      type: 'gesture',
      durationMs: 1200,
      points: [
        { x: 48, y: 36, targetArea: 'preview' },
        { x: 62, y: 36, targetArea: 'preview' },
        { x: 54, y: 58, targetArea: 'preview' },
      ],
    },
    {
      at: 21020,
      type: 'speak',
      text: 'Más, menos, por, dividido. Y este: el porcentaje. No es un descuento. Es el resto. Diez dividido tres es tres y sobra uno. Por eso diez por ciento tres da uno.',
    },
    { at: 22000, type: 'write', filePath: 'app.js', mode: 'replace', content: L04_OPS },
    { at: 30000, type: 'run' },
    {
      at: 39560,
      type: 'speak',
      text: 'Eso sirve para saber si un número es par. Si el resto al dividir entre dos es cero, es par.',
    },
    { at: 46440, type: 'chapter', title: 'Comparar' },
    {
      at: 46440,
      type: 'speak',
      text: 'Comparar es otra cosa. Mayor, menor, igual. El resultado no es un número. Es true o false.',
    },
    {
      at: 55400,
      type: 'speak',
      text: 'Ojo con el igual. Un igual solo, asigna. Tres iguales comparan en serio: mismo valor y mismo tipo. Usa siempre tres iguales. El texto diez no es el número diez.',
    },
    { at: 57000, type: 'write', filePath: 'app.js', mode: 'replace', content: L04_CMP },
    { at: 64000, type: 'run' },
    {
      at: 69520,
      type: 'speak',
      text: 'Y luego están y, y o. La lámpara se enciende si hay corriente y el interruptor está arriba. Las dos cosas tienen que ser verdad. Puedes entrar con llave o con el código. Con una de las dos alcanza.',
    },
    { at: 83700, type: 'chapter', title: 'Tu turno' },
    {
      at: 83700,
      type: 'speak',
      text: 'Tu turno. Escribe una función esPar que reciba un número y devuelva true si el resto entre dos es cero. Y otra, puedeEntrar, que sea true si la edad es mayor o igual a dieciocho y tieneEntrada es true.',
    },
    {
      at: 89000,
      type: 'challenge',
      challenge: {
        id: 'reto-espar-entrar',
        title: 'Reto: esPar y puedeEntrar',
        instructions: `Crea dos funciones y pulsa Ejecutar:

1. esPar(n) devuelve true solo cuando n es divisible entre 2.
2. puedeEntrar(edad, tieneEntrada) devuelve true solo si la persona es mayor de edad y además tiene entrada.`,
        tests: [
          {
            id: 'esPar-par',
            description: 'esPar(4) es true',
            validatorType: 'function-call',
            targetFunction: 'esPar',
            args: [4],
            expectedReturn: true,
            errorMessage: 'esPar(4) debería ser true. ¿Usa n % 2 === 0?',
            hintTip: 'Comprueba el resto de dividir n entre 2.',
          },
          {
            id: 'esPar-impar',
            description: 'esPar(7) es false',
            validatorType: 'function-call',
            targetFunction: 'esPar',
            args: [7],
            expectedReturn: false,
            errorMessage: 'esPar(7) debería ser false.',
            hintTip: 'El resto entre 2 distinto de 0 es impar.',
          },
          {
            id: 'puedeEntrar-ok',
            description: 'puedeEntrar(20, true) es true',
            validatorType: 'function-call',
            targetFunction: 'puedeEntrar',
            args: [20, true],
            expectedReturn: true,
            errorMessage: 'Con 20 años y entrada, debe ser true.',
            hintTip: 'Une la comprobación de edad y la entrada de modo que ambas sean obligatorias.',
          },
          {
            id: 'puedeEntrar-menor',
            description: 'puedeEntrar(16, true) es false',
            validatorType: 'function-call',
            targetFunction: 'puedeEntrar',
            args: [16, true],
            expectedReturn: false,
            errorMessage: 'Con 16 aunque tenga entrada, debe ser false.',
            hintTip: 'La edad también debe ser >= 18.',
          },
          {
            id: 'puedeEntrar-sin-entrada',
            description: 'puedeEntrar(20, false) es false',
            validatorType: 'function-call',
            targetFunction: 'puedeEntrar',
            args: [20, false],
            expectedReturn: false,
            errorMessage: 'Sin entrada aunque tenga edad, debe ser false.',
            hintTip: 'Las dos condiciones con &&.',
          },
        ],
        hints: [
          { level: 1, title: 'Par', text: 'Si n % 2 da 0, es par.' },
          { level: 2, title: 'Y', text: 'Las dos condiciones se unen con &&.' },
          { level: 3, title: 'return', text: 'Las funciones tienen que devolver true o false, no solo calcular.' },
        ],
        solutionExplanation: '% da el resto. && pide las dos cosas a la vez.',
      },
    },
    { at: 93000, type: 'write', filePath: 'app.js', mode: 'replace', content: L04_SOLUTION },
    { at: 96500, type: 'run' },
  ],
});
