import { compileLesson } from '../../engine/lessonCompiler';
import { L11_BINARY, L11_LINEAR, L11_RECURSION, lesson11Workspace } from './pages';

const AUDIO_MS = 77_280;

export const LESSON_11 = compileLesson({
  id: 'fundamentos-11',
  title: '11. Algoritmos básicos',
  description: 'Buscar uno a uno, partir a la mitad, y una función que se llama a sí misma.',
  audioUrl: '/audio/fundamentos-11.mp3?v=lote',
  language: 'es',
  durationMs: AUDIO_MS,
  initialWorkspace: lesson11Workspace,
  concepts: ['Búsqueda lineal', 'Búsqueda binaria'],
  teachNotes: [
    {
      title: 'Lineal vs binaria',
      body: 'Lineal mira todos si hace falta. Binaria tira la mitad cada vez, pero la fila tiene que estar ordenada.',
    },
  ],
  beats: [
    { at: 0, type: 'chapter', title: 'El orden de los pasos' },
    {
      at: 200,
      type: 'speak',
      text: 'Un algoritmo es una lista de pasos para resolver un problema. No es magia. Es el orden. Hoy tres ideas. Buscar uno por uno. Buscar partiendo a la mitad. Y una función que se llama a sí misma.',
    },
    {
      at: 3500,
      type: 'gesture',
      durationMs: 1200,
      points: [
        { x: 46, y: 42, targetArea: 'preview' },
        { x: 66, y: 42, targetArea: 'preview' },
      ],
    },
    { at: 16000, type: 'chapter', title: 'Uno por uno' },
    {
      at: 16000,
      type: 'speak',
      text: 'Tienes una fila desordenada. Quieres el siete. Empiezas al principio. ¿Es siete? No. Siguiente. Hasta que aparece, o se acaba la fila. Eso es búsqueda lineal. En el peor caso miras todos.',
    },
    { at: 18000, type: 'write', filePath: 'app.js', mode: 'replace', content: L11_LINEAR },
    { at: 22000, type: 'run' },
    {
      at: 23000,
      type: 'gesture',
      durationMs: 1400,
      points: [
        { x: 42, y: 40, targetArea: 'preview' },
        { x: 50, y: 40, targetArea: 'preview' },
        { x: 58, y: 40, targetArea: 'preview' },
      ],
    },
    { at: 32380, type: 'chapter', title: 'A la mitad' },
    {
      at: 32380,
      type: 'speak',
      text: 'Si la fila ya está ordenada, puedes ser más listo. Miras el del medio. Si tu número es más chico, tiras la mitad derecha. Si es más grande, tiras la izquierda. Repites. Eso es búsqueda binaria. Cada pregunta tira la mitad. Por eso es rápida. Pero solo si está ordenada.',
    },
    { at: 36000, type: 'write', filePath: 'app.js', mode: 'replace', content: L11_BINARY },
    { at: 40000, type: 'run' },
    { at: 50140, type: 'chapter', title: 'Llamarte a ti mismo' },
    {
      at: 50140,
      type: 'speak',
      text: 'Una función puede llamarse a sí misma, con un problema más chico, hasta un caso que sí sabes resolver. Como bajar pisos: si estás en el uno, ya. Si no, baja uno y cuenta otra vez. Sin caso de parada, no termina. Siempre hay un ya está.',
    },
    { at: 52000, type: 'write', filePath: 'app.js', mode: 'replace', content: L11_RECURSION },
    { at: 65000, type: 'run' },
    {
      at: 68820,
      type: 'speak',
      text: 'No hace falta que lo memorices. Con que veas por qué uno hace menos pasos que el otro, ya ganaste.',
    },
  ],
});
