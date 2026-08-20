import { compileLesson } from '../../engine/lessonCompiler';
import { L14_FP, L14_OOP, lesson14Workspace } from './pages';

const AUDIO_MS = 80_240;

export const LESSON_14 = compileLesson({
  id: 'fundamentos-14',
  title: '14. Paradigmas',
  description: 'Objetos que duran y cambian. Funciones que transforman listas. Elige según el problema.',
  audioUrl: '/audio/fundamentos-14.mp3?v=lote',
  language: 'es',
  durationMs: AUDIO_MS,
  initialWorkspace: lesson14Workspace,
  concepts: ['Objetos con estado', 'map y filter'],
  teachNotes: [
    {
      title: 'No elijas bando',
      body: 'Si el estado vive y cambia, un objeto ayuda. Si entra lista y sale lista, una función se lee mejor.',
    },
  ],
  beats: [
    { at: 0, type: 'chapter', title: 'Dos formas' },
    {
      at: 200,
      type: 'speak',
      text: 'Un paradigma es una forma de organizar el código. En JavaScript vas a ver dos todo el tiempo. Objetos con datos y acciones juntos. Y funciones que transforman datos sin revolver el original. No son religiones. Son herramientas.',
    },
    { at: 16500, type: 'chapter', title: 'Objetos que duran' },
    {
      at: 16500,
      type: 'speak',
      text: 'En la orientada a objetos agrupas datos y acciones en una cosa. Una cuenta tiene saldo. Puede depositar y retirar. El saldo no se toca desde afuera a lo loco. Se toca con métodos.',
    },
    { at: 18000, type: 'write', filePath: 'app.js', mode: 'replace', content: L14_OOP },
    { at: 22000, type: 'run' },
    {
      at: 23000,
      type: 'gesture',
      durationMs: 1000,
      points: [
        { x: 46, y: 48, targetArea: 'preview' },
        { x: 48, y: 62, targetArea: 'preview' },
      ],
    },
    {
      at: 29980,
      type: 'speak',
      text: 'Sirve cuando hay una cosa que hace cosas y dura en el tiempo. Un jugador. Un carrito. Un componente.',
    },
    { at: 37940, type: 'chapter', title: 'Entra lista, sale lista' },
    {
      at: 37940,
      type: 'speak',
      text: 'En el estilo funcional prefieres funciones que reciben datos y devuelven datos nuevos. No cambian el original si pueden evitarlo. map y filter viven aquí. Sirve cuando transformas listas. De esta lista de precios, saca los que superan cien.',
    },
    { at: 40000, type: 'write', filePath: 'app.js', mode: 'replace', content: L14_FP },
    { at: 47000, type: 'run' },
    {
      at: 50000,
      type: 'gesture',
      durationMs: 900,
      points: [
        { x: 66, y: 48, targetArea: 'preview' },
        { x: 68, y: 62, targetArea: 'preview' },
      ],
    },
    {
      at: 54780,
      type: 'speak',
      text: 'JavaScript te deja mezclar. No elijas bando. Elige según el problema. Si el estado vive y cambia, un objeto ayuda. Si es entra lista, sale lista, una función se lee mejor.',
    },
    {
      at: 68160,
      type: 'speak',
      text: 'Con esto cierra el curso de fundamentos. Ya puedes guardar datos, decidir, repetir, agrupar, y hablar de si tu solución escala. El siguiente paso es usar esto en páginas de verdad.',
    },
  ],
});
