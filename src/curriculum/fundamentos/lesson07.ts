import { compileLesson } from '../../engine/lessonCompiler';
import { L07_ARROW, L07_FN, L07_SOLUTION, lesson07Workspace } from './pages';

const AUDIO_MS = 84_480;

export const LESSON_07 = compileLesson({
  id: 'fundamentos-07',
  title: '7. Funciones',
  description: 'Escribe una tarea una vez, llámala muchas, y devuelve un resultado.',
  audioUrl: '/audio/fundamentos-07.mp3?v=lote',
  language: 'es',
  durationMs: AUDIO_MS,
  initialWorkspace: lesson07Workspace,
  concepts: ['function', 'return', 'parámetro', 'flecha'],
  teachNotes: [
    {
      title: 'Definir no ejecuta',
      body: 'function ... { } solo la guarda. Los paréntesis al final son: corre ahora, con esto.',
    },
  ],
  beats: [
    { at: 0, type: 'chapter', title: 'Una vez, muchas veces' },
    {
      at: 200,
      type: 'speak',
      text: 'Si copias el mismo código tres veces, en la tercera ya te equivocaste. Las funciones sirven para escribir una tarea una vez y usarla muchas.',
    },
    {
      at: 11740,
      type: 'speak',
      text: 'Una función tiene un nombre, puede recibir datos, hace un trabajo, y a veces devuelve un resultado.',
    },
    {
      at: 19780,
      type: 'speak',
      text: 'function saludar, nombre entre paréntesis. return Hola, más el nombre. Luego la llamamos. saludar Ana. saludar Luis.',
    },
    { at: 21000, type: 'write', filePath: 'app.js', mode: 'replace', content: L07_FN },
    { at: 26500, type: 'run' },
    {
      at: 27000,
      type: 'gesture',
      durationMs: 900,
      points: [
        { x: 54, y: 42, targetArea: 'preview' },
        { x: 58, y: 56, targetArea: 'preview' },
      ],
    },
    {
      at: 32100,
      type: 'speak',
      text: 'Definir no ejecuta nada. Llamar sí. Los paréntesis al final son: corre ahora, con esto.',
    },
    {
      at: 40660,
      type: 'speak',
      text: 'Los datos que entran se llaman parámetros. Lo que sale se llama return. Si no pones return, la función termina y no entrega nada útil.',
    },
    {
      at: 51020,
      type: 'speak',
      text: 'Puedes escribirla más corta, con flecha. const doble igual a n flecha n por dos. Entra n, sale el doble.',
    },
    { at: 52200, type: 'write', filePath: 'app.js', mode: 'replace', content: L07_ARROW },
    { at: 56000, type: 'run' },
    {
      at: 61540,
      type: 'speak',
      text: 'Una función no tiene que saber de dónde viene el número. Tú le das cuatro, te devuelve ocho. Eso se puede probar. Eso se puede reutilizar.',
    },
    { at: 71920, type: 'chapter', title: 'Tu turno' },
    {
      at: 71920,
      type: 'speak',
      text: 'Tu turno. Escribe areaRectangulo. Recibe ancho y alto. Devuelve el producto. En la página, llama dos veces con medidas distintas y muestra los dos resultados.',
    },
    {
      at: 78000,
      type: 'challenge',
      challenge: {
        id: 'reto-area',
        title: 'Reto: areaRectangulo',
        instructions: `function areaRectangulo(ancho, alto) {
  return ancho * alto;
}

Luego llámala dos veces, con números distintos, y pinta los dos resultados.`,
        tests: [
          {
            id: 'fn-area',
            description: 'Existe areaRectangulo',
            validatorType: 'source-regex',
            regexPattern: 'areaRectangulo\\s*\\(',
            errorMessage: 'Nombra la función areaRectangulo.',
            hintTip: 'function areaRectangulo(ancho, alto) { ... }',
          },
          {
            id: 'return-producto',
            description: 'Devuelve el producto',
            validatorType: 'source-regex',
            regexPattern: 'return\\s+ancho\\s*\\*\\s*alto',
            errorMessage: 'return ancho * alto;',
            hintTip: 'return ancho * alto;',
          },
          {
            id: 'dos-llamadas',
            description: 'La llamas al menos dos veces',
            validatorType: 'source-regex',
            regexPattern: 'areaRectangulo\\s*\\([^)]+\\)[\\s\\S]*areaRectangulo\\s*\\(',
            errorMessage: 'Llama dos veces, con medidas distintas.',
            hintTip: 'areaRectangulo(4, 3) y areaRectangulo(10, 2)',
          },
        ],
        hints: [
          { level: 1, title: 'Firma', text: 'Dos parámetros: ancho y alto.' },
          { level: 2, title: 'return', text: 'Sin return no entrega el número.' },
          { level: 3, title: 'Dos llamadas', text: 'Escribe areaRectangulo(...) dos veces.' },
        ],
        solutionExplanation: 'La función no sabe de la página. Recibe números y devuelve un número.',
      },
    },
    { at: 81000, type: 'write', filePath: 'app.js', mode: 'replace', content: L07_SOLUTION },
    { at: 83000, type: 'run' },
  ],
});
