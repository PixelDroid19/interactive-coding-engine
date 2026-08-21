import { compileLesson } from '../../engine/lessonCompiler';
import { L05_ELSEIF, L05_IF, L05_SOLUTION, lesson05Workspace } from './pages';

const AUDIO_MS = 80_080;

export const LESSON_05 = compileLesson({
  id: 'fundamentos-05',
  title: '5. Condicionales',
  description: 'El programa elige un camino: if, else, else if.',
  audioUrl: '/audio/fundamentos-05.mp3?v=lote',
  language: 'es',
  durationMs: AUDIO_MS,
  initialWorkspace: lesson05Workspace,
  concepts: ['if / else', 'else if'],
  teachNotes: [
    {
      title: 'Un camino, no todos',
      body: 'JavaScript mira de arriba a abajo y se queda con el primer sí. El orden importa.',
    },
  ],
  beats: [
    { at: 0, type: 'chapter', title: 'Decidir' },
    {
      at: 200,
      type: 'speak',
      text: 'Hasta ahora el programa hace siempre lo mismo, de arriba a abajo. Hoy va a decidir.',
    },
    {
      at: 7000,
      type: 'speak',
      text: 'En la puerta de un edificio hay un portero. Si tienes credencial, pasas. Si no, no pasas. Eso es un if.',
    },
    {
      at: 7400,
      type: 'gesture',
      durationMs: 1000,
      points: [
        { x: 56, y: 32, targetArea: 'preview' },
        { x: 58, y: 52, targetArea: 'preview' },
      ],
    },
    {
      at: 15420,
      type: 'speak',
      text: 'Voy a escribir una edad. Si es mayor o igual a dieciocho, el mensaje dice que puedes votar. Si no, dice que todavía no.',
    },
    { at: 16800, type: 'write', filePath: 'app.js', mode: 'replace', content: L05_IF },
    { at: 22000, type: 'run' },
    {
      at: 24180,
      type: 'speak',
      text: 'La condición va entre paréntesis. Si es true, entra al primer bloque. Si no, al else.',
    },
    {
      at: 25000,
      type: 'gesture',
      durationMs: 900,
      points: [
        { x: 32, y: 28, targetArea: 'editor' },
        { x: 40, y: 48, targetArea: 'editor' },
      ],
    },
    {
      at: 31180,
      type: 'speak',
      text: 'A veces hay más de dos caminos. else if. Si la nota es noventa o más, A. Si no, pero es ochenta o más, B. Si no, C. El orden importa. JavaScript se queda con el primer sí.',
    },
    { at: 33000, type: 'write', filePath: 'app.js', mode: 'replace', content: L05_ELSEIF },
    { at: 43000, type: 'run' },
    {
      at: 46540,
      type: 'speak',
      text: 'Hay un atajo de una línea. Condición, signo de pregunta, valor si sí, dos puntos, valor si no. Sirve para cosas cortas. Si se pone largo, vuelve al if.',
    },
    {
      at: 58840,
      type: 'speak',
      text: 'Cambia la edad en el código y pulsa Run. Mira cómo cambia el mensaje. El programa no adivina. Pregunta, y elige un camino.',
    },
    { at: 68240, type: 'chapter', title: 'Tu turno' },
    {
      at: 68240,
      type: 'speak',
      text: 'Tu turno. Recibe una nota del cero al cien. Si es noventa o más, devuelve A. Si es ochenta o más, B. Si es setenta o más, C. Si no, F.',
    },
    {
      at: 73000,
      type: 'challenge',
      challenge: {
        id: 'reto-letra',
        title: 'Reto: letra de la nota',
        instructions: `Escribe una función letra(nota):
- 90 o más → A
- 80 o más → B
- 70 o más → C
- si no → F`,
        tests: [
          {
            id: 'letra-95-es-A',
            description: 'letra(95) es "A"',
            validatorType: 'function-call',
            targetFunction: 'letra',
            args: [95],
            expectedReturn: 'A',
            errorMessage: 'Con 95 debería ser A. Revisa el orden de los if.',
            hintTip: 'Pregunta 90 primero.',
          },
          {
            id: 'letra-85-es-B',
            description: 'letra(85) es "B"',
            validatorType: 'function-call',
            targetFunction: 'letra',
            args: [85],
            expectedReturn: 'B',
            errorMessage: 'Con 85 debería ser B.',
            hintTip: 'Después de 90, pregunta 80.',
          },
          {
            id: 'letra-75-es-C',
            description: 'letra(75) es "C"',
            validatorType: 'function-call',
            targetFunction: 'letra',
            args: [75],
            expectedReturn: 'C',
            errorMessage: 'Con 75 debería ser C.',
            hintTip: 'Luego 70.',
          },
          {
            id: 'letra-50-es-F',
            description: 'letra(50) es "F"',
            validatorType: 'function-call',
            targetFunction: 'letra',
            args: [50],
            expectedReturn: 'F',
            errorMessage: 'Con 50 debería ser F.',
            hintTip: 'Si no entra en A/B/C, devuelve F.',
          },
        ],
        hints: [
          { level: 1, title: 'Orden', text: 'Pregunta primero por 90, luego 80, luego 70.' },
          { level: 2, title: 'return', text: 'Cada camino devuelve una letra entre comillas.' },
          { level: 3, title: 'else', text: 'Si no es A, B ni C, return "F".' },
        ],
        solutionExplanation: 'Se evalúa de arriba a abajo. El primer sí gana.',
      },
    },
    { at: 76000, type: 'write', filePath: 'app.js', mode: 'replace', content: L05_SOLUTION },
    { at: 78500, type: 'run' },
  ],
});
