import { compileLesson } from '../../engine/lessonCompiler';
import { L13_O1, L13_OLOG, L13_ON, L13_ON2, lesson13Workspace } from './pages';

const AUDIO_MS = 59_240;

export const LESSON_13 = compileLesson({
  id: 'fundamentos-13',
  title: '13. Complejidad Big O',
  description: 'Cómo crece el tiempo cuando crecen los datos: O(1), log n, n, n².',
  audioUrl: '/audio/fundamentos-13.mp3?v=lote',
  language: 'es',
  durationMs: AUDIO_MS,
  initialWorkspace: lesson13Workspace,
  concepts: ['Big O', 'O(1)', 'O(n)', 'O(n²)'],
  teachNotes: [
    {
      title: 'No es una nota',
      body: 'Big O no dice si el código es bonito. Dice qué pasa si mañana hay diez veces más datos.',
    },
  ],
  beats: [
    { at: 0, type: 'chapter', title: 'Cuando crece' },
    {
      at: 200,
      type: 'speak',
      text: 'Con diez datos, casi todo es rápido. Con diez millones, un algoritmo malo se siente eterno. Big O no es una nota. Es una forma de decir cómo crece el tiempo cuando crecen los datos.',
    },
    {
      at: 3500,
      type: 'gesture',
      durationMs: 1200,
      points: [
        { x: 52, y: 36, targetArea: 'preview' },
        { x: 54, y: 58, targetArea: 'preview' },
      ],
    },
    { at: 14680, type: 'chapter', title: 'O(1)' },
    {
      at: 14680,
      type: 'speak',
      text: 'O de uno. Tiempo fijo. Da igual diez o diez millones. Leer la primera casilla de un array es así.',
    },
    { at: 15200, type: 'write', filePath: 'app.js', mode: 'replace', content: L13_O1 },
    { at: 16800, type: 'run' },
    {
      at: 22620,
      type: 'speak',
      text: 'O log n. Crece muy despacio. Cada paso tira la mitad. Búsqueda binaria.',
    },
    { at: 23200, type: 'write', filePath: 'app.js', mode: 'replace', content: L13_OLOG },
    { at: 24500, type: 'run' },
    {
      at: 29020,
      type: 'speak',
      text: 'O de n. Crece con los datos. Si hay el doble, tarda el doble. Recorrer la lista una vez.',
    },
    { at: 29800, type: 'write', filePath: 'app.js', mode: 'replace', content: L13_ON },
    { at: 31000, type: 'run' },
    {
      at: 36660,
      type: 'speak',
      text: 'O de n al cuadrado. Por cada elemento, recorres todos otra vez. Con mil datos, un millón de comparaciones. Por eso un for dentro de otro for duele.',
    },
    { at: 38000, type: 'write', filePath: 'app.js', mode: 'replace', content: L13_ON2 },
    { at: 42000, type: 'run' },
    {
      at: 48420,
      type: 'speak',
      text: 'No memorices la tabla. Pregunta: si mañana hay diez veces más datos, ¿esto sigue vivo? Si la respuesta es que se muere, hay que cambiar el algoritmo, no la máquina.',
    },
  ],
});
