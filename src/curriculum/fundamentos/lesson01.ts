import { compileLesson } from '../../engine/lessonCompiler';
import {
  LESSON1_JS_DOS_LINEAS,
  LESSON1_JS_ORDEN,
  LESSON1_JS_UNA_LINEA,
  lesson1Workspace,
} from './workspaces';

// NOTA: las voces nuevas se grabarán después. Este valor es una estimación
// a partir de los beats; cuando llegue fundamentos-01.mp3 hay que medirlo,
// actualizar AUDIO_MS y re-sincronizar los `at`, y subir ?v= en audioUrl.
const AUDIO_MS = 176_000;

export const LESSON_01 = compileLesson({
  id: 'fundamentos-01',
  title: '1. Tu primer programa',
  description:
    'Descubre qué es un programa y escribe tus primeras instrucciones: busca un recuadro de la página y escribe texto dentro.',
  audioUrl: '/audio/fundamentos-01.mp3?v=voz2',
  language: 'es',
  durationMs: AUDIO_MS,
  initialWorkspace: lesson1Workspace,
  concepts: ['Qué es un programa', 'Texto entre comillas'],
  teachNotes: [
    {
      title: 'Un programa son instrucciones en orden',
      body: 'JavaScript lee tu archivo de arriba abajo y ejecuta cada línea una tras otra. Como una receta: si cambias el orden, cambia el resultado.',
    },
    {
      title: 'El patrón busca-y-escribe',
      body: 'document.getElementById("linea1") busca el recuadro con ese id. .textContent = "texto" escribe dentro. Con esas dos piezas ya puedes poner cualquier texto en la página.',
    },
    {
      title: 'El orden manda',
      body: 'Si dos instrucciones escriben en el mismo recuadro, la última gana. Es la primera consecuencia práctica de leer de arriba abajo.',
    },
  ],
  beats: [
    { at: 0, type: 'chapter', title: 'La idea' },
    {
      at: 400,
      type: 'speak',
      text: 'Hola. Bienvenido. Hoy vas a escribir tu primer programa. Y antes de tocar nada, te voy a dar una sola idea. La más importante.',
    },
    {
      at: 9500,
      type: 'speak',
      text: 'Un programa es una lista de instrucciones que la computadora sigue en orden, de arriba abajo. Una tras otra. Como una receta de cocina: primero un paso, luego el siguiente. Si cambias el orden, cambia el resultado.',
    },
    {
      at: 23000,
      type: 'speak',
      text: 'Eso es todo lo que necesitas saber para empezar. Lo demás lo vas a ver haciendo.',
    },
    { at: 28000, type: 'chapter', title: 'Conocer el taller' },
    {
      at: 28400,
      type: 'speak',
      text: 'A la derecha tienes una página de verdad. Un título, dos espacios vacíos. Todavía no dicen nada. Eso lo vamos a arreglar nosotros hoy.',
    },
    {
      at: 37000,
      type: 'gesture',
      durationMs: 2400,
      points: [
        { x: 60, y: 30, targetArea: 'preview' },
        { x: 58, y: 48, targetArea: 'preview' },
        { x: 58, y: 62, targetArea: 'preview' },
      ],
    },
    {
      at: 39500,
      type: 'speak',
      text: 'A la izquierda hay tres archivos. HTML es la página: qué hay dentro. CSS es el aspecto: cómo se ve. Y JavaScript es lo que hace que ocurra algo. Nosotros vamos a trabajar solo en app.js. Los otros dos ya están listos.',
    },
    {
      at: 53500,
      type: 'gesture',
      durationMs: 1600,
      points: [
        { x: 46, y: 15, targetArea: 'files' },
        { x: 48, y: 23, targetArea: 'files' },
        { x: 48, y: 31, targetArea: 'files' },
      ],
    },
    { at: 55500, type: 'switch', filePath: 'app.js' },
    {
      at: 55500,
      type: 'gesture',
      durationMs: 900,
      points: [
        { x: 48, y: 32, targetArea: 'files', clicked: true },
        { x: 28, y: 18, targetArea: 'editor' },
        { x: 30, y: 28, targetArea: 'editor' },
      ],
    },
    {
      at: 57500,
      type: 'speak',
      text: 'Mira app.js. Está casi vacío. Las líneas que empiezan con dos barras son notas para ti. JavaScript las ignora, no las ejecuta.',
    },
    { at: 66500, type: 'chapter', title: 'Tu primera instrucción' },
    {
      at: 66900,
      type: 'speak',
      text: 'Vamos a escribir texto en la página con una sola línea. El patrón tiene dos partes: primero buscas el recuadro, después escribes dentro.',
    },
    {
      at: 74500,
      type: 'gesture',
      durationMs: 1200,
      points: [
        { x: 26, y: 24, targetArea: 'editor' },
        { x: 40, y: 32, targetArea: 'editor' },
      ],
    },
    { at: 76000, type: 'write', filePath: 'app.js', content: LESSON1_JS_UNA_LINEA },
    {
      at: 82500,
      type: 'speak',
      text: 'Esta línea dice: busca el recuadro llamado linea1, y pon dentro el texto Mi primer programa. El nombre del recuadro va entre comillas, y el texto también.',
    },
    { at: 92000, type: 'run' },
    {
      at: 92800,
      type: 'gesture',
      durationMs: 1100,
      points: [
        { x: 58, y: 34, targetArea: 'preview' },
        { x: 56, y: 46, targetArea: 'preview', clicked: true },
      ],
    },
    {
      at: 94000,
      type: 'speak',
      text: 'Mira. Apareció. Esa línea es tu primer programa de verdad.',
    },
    {
      at: 99500,
      type: 'speak',
      text: 'Y como un programa son varias instrucciones, vamos a poner una segunda línea debajo.',
    },
    { at: 105000, type: 'write', filePath: 'app.js', content: LESSON1_JS_DOS_LINEAS },
    {
      at: 111500,
      type: 'speak',
      text: 'Ahora busca el recuadro linea2 y escribe dentro Escrito con JavaScript. Ejecutamos.',
    },
    { at: 118000, type: 'run' },
    {
      at: 118800,
      type: 'gesture',
      durationMs: 1000,
      points: [
        { x: 56, y: 44, targetArea: 'preview' },
        { x: 58, y: 58, targetArea: 'preview' },
      ],
    },
    {
      at: 119900,
      type: 'speak',
      text: 'Las dos aparecieron, en el orden en que las escribiste. Primero arriba, después abajo. Eso es un programa.',
    },
    { at: 127500, type: 'chapter', title: 'Tu turno' },
    {
      at: 127900,
      type: 'speak',
      text: 'Ahora te toca a ti. Escribe un programa de dos líneas: en linea1 pon tu nombre, y en linea2 tu comida favorita. Después pulsa Ejecutar.',
    },
    {
      at: 138500,
      type: 'challenge',
      challenge: {
        id: 'reto-tu-presentacion',
        title: 'Reto: tu presentación',
        instructions: `Escribe un programa de dos líneas.

1. Busca el recuadro "linea1" y escribe tu nombre.
2. Busca el recuadro "linea2" y escribe tu comida favorita.
3. Pulsa Ejecutar y mira la página.`,
        tests: [
          {
            id: 'linea1-tiene-texto',
            description: 'El recuadro linea1 muestra tu nombre',
            validatorType: 'dom-check',
            domSelector: '#linea1',
            domProperty: 'innerText',
            errorMessage: 'linea1 está vacío. Necesita una instrucción que escriba ahí tu nombre.',
            hintTip: 'Una instrucción por recuadro, igual que en la clase.',
          },
          {
            id: 'linea2-tiene-texto',
            description: 'El recuadro linea2 muestra tu comida favorita',
            validatorType: 'dom-check',
            domSelector: '#linea2',
            domProperty: 'innerText',
            errorMessage: 'linea2 está vacío. Le falta su propia instrucción.',
            hintTip: 'Copia el patrón de la primera línea y cambia el recuadro y el texto.',
          },
          {
            id: 'usa-linea1',
            description: 'Tu código busca el recuadro linea1',
            validatorType: 'source-regex',
            regexPattern: 'getElementById\\(\\s*["\']linea1["\']\\s*\\)',
            errorMessage: 'No encontramos ninguna instrucción para linea1.',
            hintTip: 'El nombre del recuadro va entre comillas, sin #.',
          },
          {
            id: 'usa-linea2',
            description: 'Tu código busca el recuadro linea2',
            validatorType: 'source-regex',
            regexPattern: 'getElementById\\(\\s*["\']linea2["\']\\s*\\)',
            errorMessage: 'No encontramos ninguna instrucción para linea2.',
            hintTip: 'Cada recuadro necesita su propia instrucción.',
          },
        ],
        hints: [
          {
            level: 1,
            title: 'Dónde escribir',
            text: 'Debajo de las notas, una instrucción por línea. Cada recuadro de la página necesita la suya.',
          },
          {
            level: 2,
            title: 'El patrón',
            text: 'Busca el recuadro por su id entre comillas, y pon el texto con textContent. Igual que en los ejemplos de la clase.',
          },
          {
            level: 3,
            title: 'Comprueba',
            text: 'Después de escribir, pulsa Ejecutar. Si algo no aparece, revisa que las comillas estén cerradas y que el id coincida con el recuadro.',
          },
        ],
        solutionExplanation:
          'Un programa ejecuta sus instrucciones en orden. Cada instrucción busca un recuadro y escribe texto dentro. Dos instrucciones, dos resultados en pantalla.',
      },
    },
    {
      at: 139000,
      type: 'speak',
      text: 'Bien. Acabas de escribir un programa que llena la página con cosas tuyas. Guarda esa sensación: eso es programar.',
    },
    { at: 145000, type: 'chapter', title: 'El orden manda' },
    {
      at: 145400,
      type: 'speak',
      text: 'Una última cosa sobre el orden. Mira lo que pasa cuando dos instrucciones escriben en el mismo recuadro.',
    },
    { at: 151000, type: 'write', filePath: 'app.js', content: LESSON1_JS_ORDEN },
    { at: 154000, type: 'run' },
    {
      at: 154800,
      type: 'gesture',
      durationMs: 1000,
      points: [
        { x: 56, y: 40, targetArea: 'preview' },
        { x: 58, y: 54, targetArea: 'preview' },
      ],
    },
    {
      at: 155500,
      type: 'speak',
      text: 'Escribimos Hola y después Adiós en el mismo recuadro. ¿Y qué se ve? Adiós. La última instrucción pisa a la anterior, porque JavaScript lee de arriba abajo.',
    },
    {
      at: 166000,
      type: 'speak',
      text: 'Con esto ya sabes lo esencial: un programa es una lista de instrucciones en orden, y tú ya sabes escribirlas. Nos vemos en la siguiente.',
    },
  ],
});
