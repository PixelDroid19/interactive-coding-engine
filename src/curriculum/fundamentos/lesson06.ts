import { compileLesson } from '../../engine/lessonCompiler';
import { L06_CHALLENGE, L06_FOR, L06_SOLUTION, lesson06Workspace } from './preDomWorkspaces';

const AUDIO_MS = 100_680;

export const LESSON_06 = compileLesson({
  id: 'fundamentos-06',
  title: '6. Bucles',
  description: 'Repite un bloque con for y aprende a controlar dónde empieza y termina.',
  language: 'es',
  durationMs: AUDIO_MS,
  audioUrl: '/audio/fundamentos-06.mp3?v=gemini-20260824',
  fitTimelineToDuration: true,
  initialWorkspace: lesson06Workspace,
  executionMode: 'logic',
  concepts: ['for', 'Inicio, condición y paso'],
  skillsRequired: ['operators', 'variables', 'conditionals'],
  skillsIntroduced: ['loops'],
  learningObjectives: [
    'Reconocer las partes de un bucle for: inicio, condición y paso.',
    'Repetir una decisión sin copiar el mismo código muchas veces.',
  ],
  commonMistakes: [
    'Crear un bucle infinito porque la variable de control no cambia.',
    'Empezar o terminar una vuelta antes o después de lo necesario.',
  ],
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
      text: 'Imagina que necesitas mostrar cien mensajes parecidos. Copiar la misma instrucción cien veces sería lento y fácil de romper. Un bucle nos permite repetir un bloque mientras se cumpla una condición.',
    },
    {
      at: 10360,
      type: 'speak',
      text: 'Vamos a mostrar cinco números con un for. Dentro de sus paréntesis indicamos dónde empieza el contador, hasta cuándo debe continuar y cómo cambia después de cada vuelta.',
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
      text: 'Lee el for en tres partes. Primero, i comienza en cero. Segundo, repetimos mientras i sea menor que cinco. Tercero, al terminar cada vuelta aumentamos i en uno.',
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
      text: 'También existe while, que repite mientras una condición sea verdadera. Suele ser útil cuando no sabemos de antemano cuántas vueltas harán falta. Para un contador con límites claros, un for resulta más fácil de seguir.',
    },
    {
      at: 45100,
      type: 'speak',
      text: 'Todo bucle necesita una forma de terminar. Si i nunca cambia, la condición seguirá siendo verdadera y el programa repetirá para siempre. A eso lo llamamos un bucle infinito.',
    },
    {
      at: 58680,
      type: 'speak',
      text: 'Los límites merecen atención. Usar menor en lugar de menor o igual cambia la última vuelta que se ejecuta. Conviene seguir los valores del contador uno por uno antes de añadir más lógica.',
    },
    { at: 65500, type: 'chapter', title: 'Tu turno' },
    { at: 65600, type: 'write', filePath: 'app.js', mode: 'replace', content: L06_CHALLENGE },
    {
      at: 65500,
      type: 'speak',
      text: 'Tu ejercicio debe mostrar los números del uno al cinco, pero ahora termina en cuatro. Sigue el valor del contador en cada vuelta, corrige únicamente la condición y comprueba la salida.',
    },
    {
      at: 72000,
      type: 'challenge',
      challenge: {
        id: 'reto-limite-bucle',
        title: 'Reto: incluye el cinco',
        instructions: `Corrige el bucle para que la consola muestre, en orden:

1
2
3
4
5

No copies cinco console.log: cambia el límite del for.`,
        tests: [
          {
            id: 'sigue-siendo-bucle',
            description: 'La solución conserva un for que llega hasta cinco',
            validatorType: 'source-regex',
            regexPattern: 'for\\s*\\([\\s\\S]*i\\s*(?:<=\\s*5|<\\s*6)[\\s\\S]*i\\+\\+',
            errorMessage: 'El for todavía no incluye el límite cinco.',
            hintTip: 'Compara < con <=.',
          },
          {
            id: 'salida-uno-a-cinco',
            description: 'La consola muestra las cinco vueltas en orden',
            validatorType: 'console-check',
            expectedValue: ['1', '2', '3', '4', '5'],
            errorMessage: 'La salida todavía no contiene exactamente las cinco vueltas.',
            hintTip: 'El último valor válido debe ser cinco.',
          },
        ],
        hints: [
          { level: 1, title: 'Mira la última salida', text: 'El bucle llega a cuatro. La condición deja de cumplirse justo antes de cinco.' },
          { level: 2, title: 'Dos comparadores', text: 'Menor que excluye el límite. Menor o igual lo incluye.' },
          { level: 3, title: 'Un solo cambio', text: 'Conserva inicio, incremento y cuerpo. Ajusta únicamente el comparador del límite.' },
        ],
        solutionExplanation: 'El for ya repetía correctamente. Cambiar el límite hizo que la quinta vuelta también se ejecutara.',
      },
    },
    { at: 77000, type: 'write', filePath: 'app.js', mode: 'replace', content: L06_SOLUTION },
    { at: 80000, type: 'run' },
  ],
});
