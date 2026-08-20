import { compileLesson } from '../../engine/lessonCompiler';
import { L10_COUNTER, lesson10Workspace } from './pages';

const AUDIO_MS = 74_760;

export const LESSON_10 = compileLesson({
  id: 'fundamentos-10',
  title: '10. Scope y closures',
  description: 'Dónde vive una variable, y cómo una función puede acordarse de ella.',
  audioUrl: '/audio/fundamentos-10.mp3?v=lote',
  language: 'es',
  durationMs: AUDIO_MS,
  initialWorkspace: lesson10Workspace,
  concepts: ['scope', 'global', 'local', 'closure'],
  teachNotes: [
    {
      title: 'Las llaves son paredes',
      body: 'let y const viven en el bloque donde las declaraste. Afuera, JavaScript dice que no las conoce.',
    },
    {
      title: 'Closure',
      body: 'Una función nacida adentro puede usar las variables de afuera aunque esa de afuera ya terminó.',
    },
  ],
  beats: [
    { at: 0, type: 'chapter', title: 'Dónde vive' },
    {
      at: 200,
      type: 'speak',
      text: 'Una variable no vive en todo el programa. Vive en un sitio. Eso se llama scope. Es el lugar donde ese nombre existe.',
    },
    {
      at: 9960,
      type: 'speak',
      text: 'Si declaras algo afuera de todas las funciones, es global. Cualquiera lo puede leer. Si lo declaras adentro de una función, solo existe ahí. Afuera, JavaScript dice que no lo conoce.',
    },
    { at: 11500, type: 'switch', filePath: 'app.js' },
    {
      at: 11500,
      type: 'gesture',
      durationMs: 1000,
      points: [
        { x: 30, y: 22, targetArea: 'editor' },
        { x: 38, y: 40, targetArea: 'editor' },
      ],
    },
    {
      at: 23400,
      type: 'speak',
      text: 'Por eso const y let dentro de un if o un for también están encerrados en ese bloque. Las llaves no son solo adorno. Son paredes.',
    },
    { at: 33680, type: 'chapter', title: 'Closure' },
    {
      at: 33680,
      type: 'speak',
      text: 'Ahora lo útil. Una función puede nacer adentro de otra y acordarse de las variables de afuera, aunque la de afuera ya terminó. Eso se llama closure.',
    },
    {
      at: 44360,
      type: 'speak',
      text: 'Mira un contador. crearContador devuelve una función. Cada vez que la llamas, suma uno. El número no está suelto afuera. Está guardado en esa memoria de la función.',
    },
    {
      at: 45500,
      type: 'gesture',
      durationMs: 1200,
      points: [
        { x: 48, y: 48, targetArea: 'preview' },
        { x: 64, y: 48, targetArea: 'preview' },
        { x: 54, y: 64, targetArea: 'preview' },
      ],
    },
    {
      at: 56000,
      type: 'speak',
      text: 'Eso sirve para no ensuciar todo el programa con variables sueltas. Cada contador tiene la suya.',
    },
    { at: 62300, type: 'chapter', title: 'Tu turno' },
    {
      at: 62300,
      type: 'speak',
      text: 'Tu turno. Escribe crearContador. Sin argumentos. Devuelve una función. Cada vez que corres esa función, suma uno y devuelve el total. Dos contadores distintos no se pisan.',
    },
    {
      at: 69000,
      type: 'challenge',
      challenge: {
        id: 'reto-contador',
        title: 'Reto: crearContador',
        instructions: `function crearContador() {
  let n = 0;
  return function () {
    n = n + 1;
    return n;
  };
}

const a = crearContador();
const b = crearContador();
// a() y b() no se pisan`,
        tests: [
          {
            id: 'crear',
            description: 'Existe crearContador',
            validatorType: 'source-regex',
            regexPattern: 'function\\s+crearContador\\s*\\(',
            errorMessage: 'Nombra la función crearContador.',
            hintTip: 'function crearContador() { ... }',
          },
          {
            id: 'devuelve-fn',
            description: 'Devuelve una función',
            validatorType: 'source-regex',
            regexPattern: 'return\\s+function',
            errorMessage: 'crearContador tiene que return function () { ... }',
            hintTip: 'return function () { n = n + 1; return n; };',
          },
          {
            id: 'dos-contadores',
            description: 'Creas dos contadores',
            validatorType: 'source-regex',
            regexPattern: 'crearContador\\s*\\(\\s*\\)[\\s\\S]*crearContador\\s*\\(\\s*\\)',
            errorMessage: 'Llama crearContador dos veces, una por contador.',
            hintTip: 'const a = crearContador(); const b = crearContador();',
          },
        ],
        hints: [
          { level: 1, title: 'n adentro', text: 'let n = 0; vive dentro de crearContador.' },
          { level: 2, title: 'return function', text: 'Lo que sale es otra función, no el número.' },
          { level: 3, title: 'Dos llamadas', text: 'Cada crearContador() nace con su propio n.' },
        ],
        solutionExplanation: 'n queda encerrado. Cada contador recuerda el suyo. Eso es un closure.',
      },
    },
    { at: 71500, type: 'write', filePath: 'app.js', mode: 'replace', content: L10_COUNTER },
    { at: 73200, type: 'run' },
    {
      at: 73500,
      type: 'gesture',
      durationMs: 800,
      points: [
        { x: 48, y: 50, targetArea: 'preview', clicked: true },
        { x: 64, y: 50, targetArea: 'preview' },
      ],
    },
  ],
});
