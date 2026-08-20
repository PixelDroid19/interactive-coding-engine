import { compileLesson } from '../../engine/lessonCompiler';
import { L12_MAP, L12_QUEUE, L12_STACK, lesson12Workspace } from './pages';

const AUDIO_MS = 65_680;

export const LESSON_12 = compileLesson({
  id: 'fundamentos-12',
  title: '12. Estructuras de datos',
  description: 'Pila, cola y mapa: el orden de llegada o el acceso por nombre.',
  audioUrl: '/audio/fundamentos-12.mp3?v=lote',
  language: 'es',
  durationMs: AUDIO_MS,
  initialWorkspace: lesson12Workspace,
  concepts: ['Pila y cola', 'Mapa por nombre'],
  teachNotes: [
    {
      title: '¿Orden o nombre?',
      body: 'Si te importa lo último que pasó, pila. Si te importa quien llegó primero, cola. Si te importa el nombre, mapa.',
    },
  ],
  beats: [
    { at: 0, type: 'chapter', title: 'Cómo guardar' },
    {
      at: 200,
      type: 'speak',
      text: 'Un array no es la única forma de guardar cosas. A veces importa el orden de llegada. A veces importa encontrar rápido por nombre. Hoy tres formas. Pila. Cola. Y un mapa de claves.',
    },
    { at: 15680, type: 'chapter', title: 'Pila' },
    {
      at: 15680,
      type: 'speak',
      text: 'Una pila solo se toca por arriba. El último que entra es el primero que sale. Deshacer en un editor es una pila. Control Z saca lo último que hiciste. push pone arriba. pop saca de arriba.',
    },
    { at: 17500, type: 'write', filePath: 'app.js', mode: 'replace', content: L12_STACK },
    { at: 22000, type: 'run' },
    {
      at: 23000,
      type: 'gesture',
      durationMs: 1100,
      points: [
        { x: 46, y: 38, targetArea: 'preview' },
        { x: 48, y: 52, targetArea: 'preview' },
      ],
    },
    { at: 29000, type: 'chapter', title: 'Cola' },
    {
      at: 29000,
      type: 'speak',
      text: 'Una cola es al revés. El primero que llega es el primero que atiende. Como un trámite. Entras atrás, sales adelante.',
    },
    { at: 30500, type: 'write', filePath: 'app.js', mode: 'replace', content: L12_QUEUE },
    { at: 34000, type: 'run' },
    {
      at: 33000,
      type: 'gesture',
      durationMs: 900,
      points: [
        { x: 62, y: 40, targetArea: 'preview' },
        { x: 70, y: 40, targetArea: 'preview' },
      ],
    },
    { at: 39060, type: 'chapter', title: 'Mapa' },
    {
      at: 39060,
      type: 'speak',
      text: 'Un mapa no busca por posición. Busca por nombre. Ana, veinticinco. Eso es casi lo que ya hiciste con objetos. Acceder por clave es inmediato. No recorres toda la lista.',
    },
    { at: 42000, type: 'write', filePath: 'app.js', mode: 'replace', content: L12_MAP },
    { at: 50000, type: 'run' },
    {
      at: 53860,
      type: 'speak',
      text: 'Cuando elijas cómo guardar datos, pregunta: ¿me importa el orden, o me importa el nombre? Esa pregunta evita código lento.',
    },
  ],
});
