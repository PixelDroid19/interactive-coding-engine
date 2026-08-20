import { compileLesson } from '../../engine/lessonCompiler';
import { L06_FOR, L06_SOLUTION, lesson06Workspace } from './pages';

const AUDIO_MS = 82_000;

export const LESSON_06 = compileLesson({
  id: 'fundamentos-06',
  title: '6. Bucles',
  description: 'Repite un bloque con for y while. Hoy escribes FizzBuzz.',
  audioUrl: '/audio/fundamentos-06.mp3?v=lote',
  language: 'es',
  durationMs: AUDIO_MS,
  initialWorkspace: lesson06Workspace,
  concepts: ['for', 'while', 'i++', 'FizzBuzz'],
  teachNotes: [
    {
      title: 'Tres piezas del for',
      body: 'Dónde empiezo. Hasta cuándo. Qué hago al final de cada vuelta. Sin el incremento, no termina.',
    },
  ],
  beats: [
    { at: 0, type: 'chapter', title: 'Repetir' },
    {
      at: 200,
      type: 'speak',
      text: 'Si tienes que saludar a cien personas, no escribes cien líneas. Usas un bucle. Un bucle repite un bloque mientras una condición sea verdad.',
    },
    {
      at: 10360,
      type: 'speak',
      text: 'Mira esto. Quiero pintar cinco estrellas. for, let i igual a cero, mientras i sea menor que cinco, i más más.',
    },
    { at: 11800, type: 'write', filePath: 'app.js', mode: 'replace', content: L06_FOR },
    { at: 15500, type: 'run' },
    {
      at: 18500,
      type: 'gesture',
      durationMs: 1000,
      points: [
        { x: 48, y: 40, targetArea: 'preview' },
        { x: 66, y: 40, targetArea: 'preview' },
      ],
    },
    {
      at: 21120,
      type: 'speak',
      text: 'Tres piezas. Dónde empiezo: i vale cero. Hasta cuándo: mientras i sea menor que cinco. Qué hago al final de cada vuelta: i más uno.',
    },
    {
      at: 22000,
      type: 'gesture',
      durationMs: 1400,
      points: [
        { x: 30, y: 26, targetArea: 'editor' },
        { x: 44, y: 32, targetArea: 'editor' },
        { x: 36, y: 48, targetArea: 'editor' },
      ],
    },
    {
      at: 32980,
      type: 'speak',
      text: 'while es más suelto. Mientras la condición sea true, sigue. Úsalo cuando no sabes cuántas vueltas van a ser. Un for es mejor cuando sí lo sabes.',
    },
    {
      at: 45100,
      type: 'speak',
      text: 'Cuidado. Si la condición nunca se vuelve false, no para. Eso es un bucle infinito. Por eso i más más es importante. Sin eso, i nunca crece, y el for no termina.',
    },
    {
      at: 58680,
      type: 'speak',
      text: 'break corta el bucle ya. continue se salta solo esta vuelta y sigue con la siguiente.',
    },
    { at: 65500, type: 'chapter', title: 'FizzBuzz' },
    {
      at: 65500,
      type: 'speak',
      text: 'Tu turno. Del uno al veinte. Si el número se divide entre tres, escribe Fizz. Si entre cinco, Buzz. Si entre tres y cinco, FizzBuzz. Si no, el número. Eso se llama FizzBuzz. Hoy lo escribes tú.',
    },
    {
      at: 72000,
      type: 'challenge',
      challenge: {
        id: 'reto-fizzbuzz',
        title: 'Reto: FizzBuzz',
        instructions: `Del 1 al 20:
- múltiplo de 3 y 5 → FizzBuzz
- múltiplo de 3 → Fizz
- múltiplo de 5 → Buzz
- si no, el número

Pregunta primero el caso de los dos, si no FizzBuzz nunca gana.`,
        tests: [
          {
            id: 'bucle-20',
            description: 'Hay un for hasta 20',
            validatorType: 'source-regex',
            regexPattern: 'for\\s*\\([\\s\\S]*20',
            errorMessage: 'Necesito un for que llegue hasta 20.',
            hintTip: 'for (let i = 1; i <= 20; i++)',
          },
          {
            id: 'fizzbuzz',
            description: 'Escribe FizzBuzz cuando toca 3 y 5',
            validatorType: 'source-regex',
            regexPattern: 'FizzBuzz',
            errorMessage: 'Falta el texto FizzBuzz.',
            hintTip: 'if (i % 3 === 0 && i % 5 === 0)',
          },
          {
            id: 'mod-3',
            description: 'Usa el resto entre 3',
            validatorType: 'source-regex',
            regexPattern: '%\\s*3',
            errorMessage: 'Usa i % 3 === 0 para Fizz.',
            hintTip: 'i % 3 === 0',
          },
        ],
        hints: [
          { level: 1, title: 'Orden', text: 'Pregunta 3 y 5 juntos ANTES que solo 3 o solo 5.' },
          { level: 2, title: 'Resto', text: 'i % 3 === 0 significa múltiplo de 3.' },
          { level: 3, title: 'for', text: 'for (let i = 1; i <= 20; i++) { ... }' },
        ],
        solutionExplanation: 'Un for recorre. Los if eligen el texto de cada vuelta.',
      },
    },
    { at: 77000, type: 'write', filePath: 'app.js', mode: 'replace', content: L06_SOLUTION },
    { at: 80000, type: 'run' },
  ],
});
