import { compileLesson } from '../../engine/lessonCompiler';
import { L04_CHALLENGE_START, L04_CMP, L04_OPS, L04_SOLUTION, lesson04Workspace } from './preDomWorkspaces';

const AUDIO_MS = 118_640;

export const LESSON_04 = compileLesson({
  id: 'fundamentos-04',
  title: '4. Operadores',
  description: 'Suma, resto, comparar con tres iguales, y combinar condiciones con y / o.',
  language: 'es',
  durationMs: AUDIO_MS,
  audioUrl: '/audio/fundamentos-04.mp3?v=gemini-20260824',
  fitTimelineToDuration: true,
  initialWorkspace: lesson04Workspace,
  executionMode: 'logic',
  concepts: ['Calcular (+, *, %)', 'Comparar (=== y &&)'],
  skillsRequired: ['variables', 'types'],
  skillsIntroduced: ['operators', 'booleans'],
  learningObjectives: [
    'Construir expresiones aritméticas a partir de variables.',
    'Interpretar una comparación como un resultado true o false.',
  ],
  commonMistakes: [
    'Confundir =, que asigna, con ===, que compara.',
    'Confundir % con porcentaje en lugar del resto de una división.',
  ],
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
      text: 'Ya sabes guardar valores en variables. El siguiente paso es usarlos. Los operadores son símbolos que nos permiten hacer cálculos, comparar valores y combinar condiciones.',
    },
    {
      at: 10180,
      type: 'speak',
      text: 'Partiremos de dos números, diez y tres. Con las mismas variables podemos sumar, restar, multiplicar y dividir. Ejecutaremos cada expresión para ver su resultado en la consola.',
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
      text: 'Los primeros símbolos resultan familiares. El signo de porcentaje necesita una explicación: en JavaScript calcula el resto de una división. Diez dividido entre tres deja un resto de uno, así que diez módulo tres produce uno.',
    },
    { at: 22000, type: 'write', filePath: 'app.js', mode: 'replace', content: L04_OPS },
    { at: 30000, type: 'run' },
    {
      at: 39560,
      type: 'speak',
      text: 'El resto tiene usos muy prácticos. Por ejemplo, un número es par cuando al dividirlo entre dos el resto es cero.',
    },
    { at: 46440, type: 'chapter', title: 'Comparar' },
    {
      at: 46440,
      type: 'speak',
      text: 'Las comparaciones responden preguntas como: ¿un valor es mayor, menor o exactamente igual a otro? Su resultado siempre es un booleano: true o false.',
    },
    {
      at: 55400,
      type: 'speak',
      text: 'No confundas asignar con comparar. Un solo signo igual guarda un valor. Tres signos iguales comprueban que coincidan tanto el valor como el tipo. Por eso el texto diez no es igual al número diez.',
    },
    { at: 57000, type: 'write', filePath: 'app.js', mode: 'replace', content: L04_CMP },
    { at: 64000, type: 'run' },
    {
      at: 69520,
      type: 'speak',
      text: 'También podemos combinar preguntas. El operador y exige que ambas condiciones sean verdaderas. El operador o acepta que al menos una lo sea. Es como necesitar una entrada y la edad mínima, frente a poder acceder con una llave o con un código.',
    },
    { at: 83700, type: 'chapter', title: 'Tu turno' },
    {
      at: 83700,
      type: 'speak',
      text: 'Ahora completa dos expresiones. esPar debe comprobar que el resto al dividir entre dos sea cero. puedeEntrar debe ser verdadero únicamente cuando se cumplan la edad mínima y la condición de tener entrada.',
    },
    { at: 87000, type: 'write', filePath: 'app.js', mode: 'replace', content: L04_CHALLENGE_START },
    {
      at: 89000,
      type: 'challenge',
      challenge: {
        id: 'reto-operadores',
        title: 'Reto: completa las expresiones',
        instructions: `Completa las dos variables y pulsa Ejecutar:

1. esPar debe ser true cuando numero es divisible entre 2.
2. puedeEntrar debe ser true solo si edad es al menos 18 y tieneEntrada es true.
3. No cambies los valores de numero, edad ni tieneEntrada.`,
        tests: [
          {
            id: 'expresion-es-par',
            description: 'esPar compara el resto con cero',
            validatorType: 'source-regex',
            regexPattern: 'const\\s+esPar\\s*=\\s*(?:numero\\s*%\\s*2\\s*===\\s*0|0\\s*===\\s*numero\\s*%\\s*2)',
            errorMessage: 'esPar todavía no usa el resto de numero dividido entre 2.',
            hintTip: 'Compara numero % 2 con cero.',
          },
          {
            id: 'expresion-puede-entrar',
            description: 'puedeEntrar exige edad y entrada',
            validatorType: 'source-regex',
            regexPattern: 'const\\s+puedeEntrar\\s*=\\s*(?:edad\\s*>=\\s*18\\s*&&\\s*tieneEntrada|tieneEntrada\\s*&&\\s*edad\\s*>=\\s*18)',
            errorMessage: 'puedeEntrar debe combinar la edad y tieneEntrada.',
            hintTip: 'Une edad >= 18 y tieneEntrada con &&.',
          },
        ],
        hints: [
          { level: 1, title: 'Par', text: 'Si numero % 2 da 0, es par.' },
          { level: 2, title: 'Y', text: 'Las dos condiciones se unen con &&.' },
          {
            level: 3,
            title: 'Comprueba por partes',
            text: 'Primero observa el resto de dividir entre 2. Después verifica por separado la edad y la entrada antes de unir ambas condiciones.',
          },
        ],
        solutionExplanation: '% da el resto. && pide las dos cosas a la vez.',
      },
    },
    { at: 93000, type: 'write', filePath: 'app.js', mode: 'replace', content: L04_SOLUTION },
    { at: 96500, type: 'run' },
  ],
});
