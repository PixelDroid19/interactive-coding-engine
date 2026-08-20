import { compileLesson } from '../../engine/lessonCompiler';
import { L08_ARR, L08_PUSH, L08_SOLUTION, lesson08Workspace } from './pages';

const AUDIO_MS = 74_560;

export const LESSON_08 = compileLesson({
  id: 'fundamentos-08',
  title: '8. Arrays',
  description: 'Listas ordenadas: el primero es cero, length, push y un for para recorrer.',
  audioUrl: '/audio/fundamentos-08.mp3?v=lote',
  language: 'es',
  durationMs: AUDIO_MS,
  initialWorkspace: lesson08Workspace,
  concepts: ['array', 'índice', 'length', 'push', 'for'],
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
      text: 'Hasta ahora un dato era una cosa. Un nombre. Un número. La vida real viene en listas. Nombres de amigos. Puntos de un juego. Tareas.',
    },
    {
      at: 11860,
      type: 'speak',
      text: 'Un array es una lista ordenada. Cada sitio tiene un número. El primero es cero. No uno. Eso confunde al principio. Acuérdate: el primero es cero.',
    },
    {
      at: 24080,
      type: 'speak',
      text: 'const frutas igual a manzana, pera, uva, entre corchetes.',
    },
    { at: 24800, type: 'write', filePath: 'app.js', mode: 'replace', content: L08_ARR },
    { at: 30000, type: 'run' },
    {
      at: 30960,
      type: 'speak',
      text: 'frutas en cero es manzana. frutas.length es tres. El último está en length menos uno.',
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
      text: 'Puedes agregar al final con push. Puedes quitar el último con pop. Puedes recorrerlos con un for. O con for of, que se lee más fácil.',
    },
    { at: 45000, type: 'write', filePath: 'app.js', mode: 'replace', content: L08_PUSH },
    { at: 50000, type: 'run' },
    {
      at: 55220,
      type: 'speak',
      text: 'Hay métodos que recorren por ti. map crea una lista nueva transformando cada elemento. filter se queda con los que cumplen una condición. No hace falta entenderlos todos hoy. Con crear, leer, push y un for, ya haces mucho.',
    },
    { at: 70060, type: 'chapter', title: 'Tu turno' },
    {
      at: 70060,
      type: 'speak',
      text: 'Tu turno. Tienes un array de números. Devuelve la suma. Recorre con un for. Empieza en cero. Ve sumando cada posición.',
    },
    {
      at: 71000,
      type: 'challenge',
      challenge: {
        id: 'reto-suma',
        title: 'Reto: suma del array',
        instructions: `function suma(numeros) {
  let total = 0;
  for (let i = 0; i < numeros.length; i++) {
    total = total + numeros[i];
  }
  return total;
}`,
        tests: [
          {
            id: 'for-length',
            description: 'Hay un for que usa length',
            validatorType: 'source-regex',
            regexPattern: 'for\\s*\\([\\s\\S]*\\.length',
            errorMessage: 'Recorre con un for hasta length.',
            hintTip: 'for (let i = 0; i < numeros.length; i++)',
          },
          {
            id: 'acumula',
            description: 'Vas sumando cada posición',
            validatorType: 'source-regex',
            regexPattern: '\\+=\\s*[^;]+\\[|\\+\\s*[^;]+\\[',
            errorMessage: 'Suma cada numeros[i] al total.',
            hintTip: 'total = total + numeros[i];',
          },
        ],
        hints: [
          { level: 1, title: 'Cero', text: 'let total = 0; antes del for.' },
          { level: 2, title: 'Índice', text: 'numeros[i] es el de esa vuelta.' },
          { level: 3, title: 'return', text: 'Al final, return total.' },
        ],
        solutionExplanation: 'Un acumulador empieza en 0 y se come cada posición.',
      },
    },
    { at: 72000, type: 'write', filePath: 'app.js', mode: 'replace', content: L08_SOLUTION },
    { at: 73800, type: 'run' },
  ],
});
