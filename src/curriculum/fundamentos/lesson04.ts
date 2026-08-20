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
  concepts: ['+', '%', '===', '&&', '||'],
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
        instructions: `1. function esPar(n) { return n % 2 === 0; }
2. function puedeEntrar(edad, tieneEntrada) { return edad >= 18 && tieneEntrada; }
3. Pulsa Run.`,
        tests: [
          {
            id: 'es-par',
            description: 'esPar usa el resto entre 2',
            validatorType: 'source-regex',
            regexPattern: 'esPar[\\s\\S]*%\\s*2',
            errorMessage: 'esPar tiene que usar n % 2.',
            hintTip: 'return n % 2 === 0;',
          },
          {
            id: 'puede-entrar',
            description: 'puedeEntrar combina edad y entrada con &&',
            validatorType: 'source-regex',
            regexPattern: 'puedeEntrar[\\s\\S]*>=\\s*18[\\s\\S]*&&',
            errorMessage: 'puedeEntrar: edad >= 18 y además tieneEntrada.',
            hintTip: 'return edad >= 18 && tieneEntrada;',
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
