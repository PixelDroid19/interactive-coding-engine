import { compileLesson } from '../../engine/lessonCompiler';
import {
  LESSON1_JS_BUTTON,
  LESSON1_JS_GREETING,
  LESSON1_JS_NAME,
  lesson1Workspace,
} from './workspaces';

const AUDIO_MS = 133_320;

export const LESSON_01 = compileLesson({
  id: 'fundamentos-01',
  title: '1. Tu primer programa',
  description:
    'Escribe tu primer JavaScript: guarda un nombre, muéstralo en la página y responde a un clic.',
  audioUrl: '/audio/fundamentos-01.mp3?v=voz',
  language: 'es',
  durationMs: AUDIO_MS,
  initialWorkspace: lesson1Workspace,
  concepts: ['Qué es un programa', 'Texto entre comillas'],
  teachNotes: [
    {
      title: 'Un programa son pasos en orden',
      body: 'JavaScript lee de arriba a abajo. Primero guarda datos. Después los usa. Si cambias un dato, cambia lo que ves a la derecha.',
    },
    {
      title: 'Las comillas marcan texto',
      body: 'Lo que va entre comillas es texto. let crea un dato con nombre. El más junta textos. getElementById busca un pedazo de la página.',
    },
    {
      title: 'El clic también es una instrucción',
      body: 'addEventListener le dice al botón: cuando lo pulsen, corre estas líneas. El programa puede esperar a que tú hagas algo.',
    },
  ],
  beats: [
    { at: 0, type: 'chapter', title: 'Empezamos desde cero' },
    {
      at: 400,
      type: 'speak',
      text: 'Hola. Si nunca has programado, estás bien. Hoy no vas a memorizar nada. Vas a ver cómo una página cambia cuando escribes unas líneas.',
    },
    {
      at: 11000,
      type: 'gesture',
      durationMs: 2800,
      points: [
        { x: 62, y: 26, targetArea: 'preview' },
        { x: 58, y: 44, targetArea: 'preview' },
        { x: 60, y: 66, targetArea: 'preview' },
      ],
    },
    {
      at: 11000,
      type: 'speak',
      text: 'A la derecha tienes una página de verdad. Hay un título, un espacio vacío y un botón. El botón todavía no hace nada. Eso lo vamos a cambiar nosotros.',
    },
    { at: 23000, type: 'chapter', title: 'Qué es cada archivo' },
    {
      at: 23000,
      type: 'speak',
      text: 'Hay tres archivos. HTML es la página. CSS es el aspecto. JavaScript es lo que hace que ocurra algo. Si quieres que la página haga algo, tocas JavaScript.',
    },
    {
      at: 23000,
      type: 'gesture',
      durationMs: 1800,
      points: [
        { x: 46, y: 15, targetArea: 'files' },
        { x: 48, y: 23, targetArea: 'files' },
        { x: 48, y: 31, targetArea: 'files' },
      ],
    },
    { at: 25000, type: 'switch', filePath: 'index.html' },
    {
      at: 25000,
      type: 'gesture',
      durationMs: 800,
      points: [
        { x: 48, y: 16, targetArea: 'files', clicked: true },
        { x: 34, y: 22, targetArea: 'editor' },
        { x: 36, y: 38, targetArea: 'editor' },
      ],
    },
    { at: 28000, type: 'switch', filePath: 'style.css' },
    {
      at: 28000,
      type: 'gesture',
      durationMs: 800,
      points: [
        { x: 48, y: 24, targetArea: 'files', clicked: true },
        { x: 30, y: 28, targetArea: 'editor' },
        { x: 32, y: 48, targetArea: 'editor' },
      ],
    },
    { at: 30360, type: 'switch', filePath: 'app.js' },
    {
      at: 30360,
      type: 'gesture',
      durationMs: 1000,
      points: [
        { x: 48, y: 32, targetArea: 'files', clicked: true },
        { x: 28, y: 18, targetArea: 'editor' },
        { x: 30, y: 28, targetArea: 'editor' },
      ],
    },
    {
      at: 37800,
      type: 'speak',
      text: 'Mira app.js. Está casi vacío. Las líneas con dos barras son notas para ti. JavaScript las ignora. No se ejecutan.',
    },
    { at: 48800, type: 'chapter', title: 'Guardar un dato' },
    {
      at: 48800,
      type: 'speak',
      text: 'Primero vamos a guardar un nombre. Se escribe let, luego el nombre del dato, luego igual, y el texto entre comillas.',
    },
    {
      at: 50000,
      type: 'gesture',
      durationMs: 1400,
      points: [
        { x: 26, y: 24, targetArea: 'editor' },
        { x: 38, y: 32, targetArea: 'editor' },
      ],
    },
    { at: 51120, type: 'write', filePath: 'app.js', content: LESSON1_JS_NAME },
    {
      at: 58440,
      type: 'speak',
      text: 'let crea un dato que puedes usar después. Eso se llama variable. Las comillas dicen: esto es texto. Si las quitas, JavaScript no entiende.',
    },
    { at: 69640, type: 'chapter', title: 'Mostrarlo en la página' },
    {
      at: 69640,
      type: 'speak',
      text: 'Ahora usamos ese dato. Le pedimos a la página el recuadro que se llama saludo, y le ponemos Hola, más el nombre.',
    },
    { at: 71480, type: 'switch', filePath: 'index.html' },
    {
      at: 71480,
      type: 'gesture',
      durationMs: 900,
      points: [
        { x: 40, y: 52, targetArea: 'editor' },
        { x: 44, y: 58, targetArea: 'editor' },
      ],
    },
    { at: 74000, type: 'switch', filePath: 'app.js' },
    {
      at: 74200,
      type: 'gesture',
      durationMs: 800,
      points: [
        { x: 30, y: 38, targetArea: 'editor' },
        { x: 42, y: 46, targetArea: 'editor' },
      ],
    },
    { at: 74800, type: 'write', filePath: 'app.js', content: LESSON1_JS_GREETING },
    {
      at: 77800,
      type: 'speak',
      text: 'El más junta textos. getElementById busca un pedazo de la página por su nombre. textContent es lo que se lee en pantalla.',
    },
    {
      at: 87220,
      type: 'speak',
      text: 'JavaScript lee de arriba a abajo. Primero guarda Alex, después arma el saludo. Vamos a ejecutarlo.',
    },
    { at: 92740, type: 'run' },
    {
      at: 93600,
      type: 'gesture',
      durationMs: 1100,
      points: [
        { x: 58, y: 32, targetArea: 'preview' },
        { x: 56, y: 46, targetArea: 'preview', clicked: true },
      ],
    },
    {
      at: 94740,
      type: 'speak',
      text: 'Mira. Dice Hola, Alex. Eso no estaba ahí antes. Salió de las dos líneas que escribimos.',
    },
    { at: 101620, type: 'chapter', title: 'Tu turno' },
    {
      at: 101620,
      type: 'speak',
      text: 'Ahora te toca a ti. Cambia Alex por tu nombre. Deja las comillas. Pulsa Run. El saludo tiene que usar tu nombre.',
    },
    {
      at: 109400,
      type: 'challenge',
      challenge: {
        id: 'reto-tu-nombre',
        title: 'Reto: pon tu nombre',
        instructions: `Cambia el valor de nombre.

1. En app.js busca let nombre = "Alex";
2. Cambia Alex por tu nombre. Deja las comillas.
3. Pulsa Run. A la derecha ya no debe decir Alex.`,
        tests: [
          {
            id: 'nombre-personalizado',
            description: 'nombre ya no vale "Alex"',
            validatorType: 'source-regex',
            regexPattern: 'nombre\\s*=\\s*["\'](?!Alex["\'])[^"\']+["\']',
            errorMessage: 'Sigue siendo "Alex". Cambia solo el texto entre comillas.',
            hintTip: 'Ejemplo: let nombre = "Ana";',
          },
          {
            id: 'sigue-saludando',
            description: 'El programa sigue escribiendo en #saludo',
            validatorType: 'source-regex',
            regexPattern: 'getElementById\\(\\s*["\']saludo["\']\\s*\\)',
            errorMessage: 'No borres la línea que pinta el saludo.',
            hintTip: 'Deja document.getElementById("saludo").textContent = ...',
          },
        ],
        hints: [
          {
            level: 1,
            title: 'Dónde está el texto',
            text: 'Está entre comillas, en la línea de let nombre.',
          },
          {
            level: 2,
            title: 'No toques las comillas',
            text: 'Las comillas le dicen a JavaScript que eso es texto. Cambia solo Alex.',
          },
          {
            level: 3,
            title: 'Ejecuta',
            text: 'Después de editar, pulsa Run. A la derecha tiene que aparecer tu nombre.',
          },
        ],
        solutionExplanation:
          'Una variable guarda un valor. Si cambias el valor, todas las líneas que lo usan cambian también.',
      },
    },
    {
      at: 109900,
      type: 'speak',
      text: 'Bien. Guardaste un dato y lo mostraste. Si cambias el dato, cambia lo que ves. Eso es un programa.',
    },
    { at: 117060, type: 'chapter', title: 'Responder a un clic' },
    {
      at: 117060,
      type: 'speak',
      text: 'El botón todavía no hace nada. Vamos a decirle: cuando alguien lo pulse, cambia el saludo otra vez.',
    },
    {
      at: 117200,
      type: 'gesture',
      durationMs: 1400,
      points: [
        { x: 58, y: 64, targetArea: 'preview' },
        { x: 32, y: 52, targetArea: 'editor' },
      ],
    },
    { at: 119000, type: 'write', filePath: 'app.js', content: LESSON1_JS_BUTTON },
    {
      at: 123740,
      type: 'speak',
      text: 'addEventListener significa quédate escuchando. click es el toque. Entonces corre las líneas de adentro.',
    },
    { at: 131180, type: 'run' },
    {
      at: 131180,
      type: 'gesture',
      durationMs: 900,
      points: [
        { x: 54, y: 50, targetArea: 'preview' },
        { x: 58, y: 68, targetArea: 'preview', clicked: true },
      ],
    },
    {
      at: 131180,
      type: 'speak',
      text: 'Pulsa el botón a la derecha. El programa te está esperando.',
    },
  ],
});
