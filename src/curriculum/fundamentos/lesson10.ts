import { compileLesson } from '../../engine/lessonCompiler';
import { L10_CHALLENGE, L10_COUNTER, lesson10BeginnerWorkspace } from './beginnerWorkspaces';

const AUDIO_MS = 88_480;

export const LESSON_10 = compileLesson({
  id: 'fundamentos-10',
  title: '10. La página y el DOM',
  description: 'Busca elementos de una página por su id y cambia su texto sin memorizar una línea a ciegas.',
  language: 'es',
  durationMs: AUDIO_MS,
  audioUrl: '/audio/fundamentos-10.mp3?v=gemini-20260824',
  fitTimelineToDuration: true,
  initialWorkspace: lesson10BeginnerWorkspace,
  executionMode: 'browser',
  concepts: ['Qué es el DOM', 'Buscar por id y cambiar texto'],
  skillsRequired: ['strings', 'variables', 'functions', 'objects'],
  skillsIntroduced: ['dom', 'get-element-by-id', 'text-content'],
  learningObjectives: [
    'Explicar que el DOM es la representación de los elementos de la página.',
    'Buscar un elemento por su id y cambiar únicamente su texto.',
  ],
  commonMistakes: [
    'Escribir un id que no existe o cambiar sus mayúsculas.',
    'Confundir el elemento guardado en una variable con el texto que contiene.',
  ],
  teachNotes: [
    { title: 'Primero buscar', body: 'document representa la página. getElementById recibe un nombre entre comillas y devuelve el elemento con ese id.' },
    { title: 'Después cambiar', body: 'textContent es una propiedad del elemento. Al asignarle un texto nuevo, cambia lo que la persona ve.' },
  ],
  beats: [
    { at: 0, type: 'chapter', title: 'De HTML a JavaScript' },
    { at: 300, type: 'speak', text: 'Hasta ahora trabajaste con valores, variables, funciones y objetos. Con esa base ya podemos conectar JavaScript con una página. El navegador representa las etiquetas del HTML como elementos de una estructura llamada DOM.' },
    { at: 12_000, type: 'switch', filePath: 'index.html' },
    { at: 12_400, type: 'speak', text: 'En el HTML, el título y el mensaje tienen un id. Un id funciona como un nombre único dentro de la página. JavaScript puede usarlo para encontrar el elemento correcto.' },
    { at: 13_000, type: 'gesture', durationMs: 1_600, points: [{ x: 45, y: 42, targetArea: 'editor' }, { x: 52, y: 55, targetArea: 'editor' }] },
    { at: 24_000, type: 'switch', filePath: 'app.js' },
    { at: 24_300, type: 'speak', text: 'Esta línea puede leerse por partes. document representa la página y getElementById busca un elemento por su id. Entre paréntesis indicamos cuál queremos y guardamos el resultado en una variable.' },
    { at: 37_000, type: 'write', filePath: 'app.js', mode: 'replace', content: L10_COUNTER },
    { at: 37_300, type: 'speak', text: 'Una vez encontrado el elemento, su propiedad textContent contiene el texto visible. Al asignarle un valor nuevo, la página cambia. Estamos combinando ideas conocidas: objetos, propiedades, funciones y asignación.' },
    { at: 50_000, type: 'run' },
    { at: 50_300, type: 'gesture', durationMs: 1_200, points: [{ x: 55, y: 40, targetArea: 'preview' }, { x: 55, y: 58, targetArea: 'preview' }] },
    { at: 56_000, type: 'chapter', title: 'Tu turno' },
    { at: 56_100, type: 'write', filePath: 'app.js', mode: 'replace', content: L10_CHALLENGE },
    { at: 56_200, type: 'speak', text: 'Ahora cambia el título y el mensaje. Busca cada elemento usando su propio id, modifica su textContent y ejecuta el programa. Comprueba visualmente que cambien los dos textos, no solo uno.' },
    {
      at: 63_000,
      type: 'challenge',
      challenge: {
        id: 'reto-dom-dos-elementos',
        title: 'Reto: cambia dos elementos',
        instructions: `Personaliza la página sin tocar el HTML.

1. Cambia el texto de #titulo.
2. Cambia el texto de #mensaje.
3. Usa textos distintos a los originales.
4. Ejecuta y comprueba los dos resultados.`,
        tests: [
          { id: 'titulo-personalizado', description: 'El título muestra un texto nuevo', validatorType: 'dom-check', domSelector: '#titulo', domProperty: 'innerText', regexPattern: '^(?!\\s*título original\\s*$).+', errorMessage: 'El título todavía conserva el texto original.', hintTip: 'Busca el elemento cuyo id es titulo y cambia su propiedad de texto.' },
          { id: 'mensaje-personalizado', description: 'El mensaje muestra otro texto nuevo', validatorType: 'dom-check', domSelector: '#mensaje', domProperty: 'innerText', regexPattern: '^(?!\\s*este texto todavía no ha cambiado\\.\\s*$).+', errorMessage: 'El mensaje todavía conserva el texto original.', hintTip: 'El segundo elemento tiene otro id; necesita su propia búsqueda y asignación.' },
        ],
        hints: [
          { level: 1, title: 'Dos elementos', text: 'Cada id señala un elemento distinto. Necesitas trabajar con titulo y mensaje por separado.' },
          { level: 2, title: 'Busca y cambia', text: 'Primero obtén el elemento; después cambia la propiedad que contiene su texto.' },
          { level: 3, title: 'Revisa los nombres', text: 'Los ids deben coincidir exactamente con el HTML: titulo y mensaje, sin # dentro de getElementById.' },
        ],
        solutionExplanation: 'El DOM conecta lo que ya sabías con la página: una función encuentra un objeto y una propiedad permite cambiar su texto.',
      },
    },
    { at: 68_000, type: 'write', filePath: 'app.js', mode: 'replace', content: L10_COUNTER },
    { at: 69_000, type: 'run' },
    { at: 70_000, type: 'speak', text: 'Ya sabes encontrar un elemento de la página y cambiar su contenido desde JavaScript. En la siguiente lección haremos que ese cambio espere hasta que alguien pulse un botón.' },
  ],
});
