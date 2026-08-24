import { compileLesson } from '../../engine/lessonCompiler';
import { LESSON1_JS_DOS_LINEAS, LESSON1_JS_ORDEN, LESSON1_JS_START, LESSON1_JS_UNA_LINEA, lesson1Workspace } from './workspaces';

const AUDIO_MS = 122_880;

export const LESSON_01 = compileLesson({
  id: 'fundamentos-01',
  title: '1. Tu primer programa',
  description: 'Aprende la forma mínima de una instrucción antes de usar variables, funciones propias o la página.',
  language: 'es',
  durationMs: AUDIO_MS,
  audioUrl: '/audio/fundamentos-01.mp3?v=gemini-20260824',
  fitTimelineToDuration: true,
  initialWorkspace: lesson1Workspace,
  executionMode: 'logic',
  concepts: ['Una instrucción', 'Texto, paréntesis y punto y coma'],
  skillsRequired: [],
  skillsIntroduced: ['instructions', 'strings', 'function-call-syntax', 'console-output'],
  learningObjectives: [
    'Explicar que un programa ejecuta instrucciones en orden.',
    'Escribir dos llamadas a console.log con textos propios y reconocer cada signo.',
  ],
  commonMistakes: [
    'Abrir comillas o paréntesis y olvidar cerrarlos.',
    'Escribir texto sin comillas y hacer que JavaScript lo interprete como un nombre.',
  ],
  teachNotes: [
    { title: 'Una forma mínima', body: 'console.log recibe un valor entre paréntesis y lo muestra en la consola. Hoy no hace falta conocer DOM, variables ni eventos.' },
    { title: 'Cada signo tiene trabajo', body: 'El punto une console con log; los paréntesis contienen el dato; las comillas delimitan texto; el punto y coma termina la instrucción.' },
    { title: 'Orden visible', body: 'Dos instrucciones producen dos salidas en el mismo orden en que aparecen de arriba abajo.' },
  ],
  beats: [
    { at: 0, type: 'chapter', title: 'Qué es un programa' },
    { at: 500, type: 'speak', text: 'Hola, bienvenido. Vamos a empezar sin dar nada por sabido. Un programa es un conjunto de instrucciones que la computadora sigue en orden, desde la primera línea hasta la última.' },
    { at: 12_000, type: 'switch', filePath: 'app.js' },
    { at: 12_300, type: 'speak', text: 'Estas líneas que comienzan con dos barras son comentarios. Sirven para dejar notas a quien lee el código, pero JavaScript no las ejecuta. Debajo escribiremos nuestra primera instrucción.' },
    { at: 25_000, type: 'write', filePath: 'app.js', mode: 'replace', content: LESSON1_JS_UNA_LINEA },
    { at: 25_300, type: 'speak', text: 'Aquí aparece console punto log. Es una herramienta del navegador que nos permite mostrar información en la consola. No hace falta memorizarla de golpe; primero vamos a entender cada parte.' },
    { at: 39_000, type: 'gesture', durationMs: 1_600, points: [{ x: 28, y: 47, targetArea: 'editor' }, { x: 45, y: 47, targetArea: 'editor' }, { x: 68, y: 47, targetArea: 'editor' }] },
    { at: 40_000, type: 'speak', text: 'Dentro de los paréntesis colocamos lo que queremos mostrar. Las comillas indican que es texto y siempre deben abrirse y cerrarse. El punto y coma señala que la instrucción terminó.' },
    { at: 56_000, type: 'run' },
    { at: 57_000, type: 'gesture', durationMs: 1_200, points: [{ x: 48, y: 85, targetArea: 'preview', clicked: true }, { x: 55, y: 90, targetArea: 'preview' }] },
    { at: 58_000, type: 'speak', text: 'Al ejecutar el programa, la consola muestra el texto que escribimos entre comillas. El código indica qué debe ocurrir y la consola nos permite comprobar el resultado.' },
    { at: 72_000, type: 'chapter', title: 'Dos instrucciones' },
    { at: 72_300, type: 'write', filePath: 'app.js', mode: 'replace', content: LESSON1_JS_ORDEN },
    { at: 72_600, type: 'speak', text: 'Ahora tenemos dos instrucciones. JavaScript ejecuta primero la línea de arriba y después la siguiente. Si cambias su posición, también cambiará el orden de los mensajes.' },
    { at: 84_000, type: 'run' },
    { at: 86_000, type: 'speak', text: 'Si aparece un error de sintaxis, no es un fracaso. Solo significa que JavaScript no pudo entender cómo quedó escrita una instrucción. Revisa con calma las comillas, los paréntesis y el final de cada línea.' },
    { at: 98_000, type: 'chapter', title: 'Tu turno' },
    { at: 98_200, type: 'write', filePath: 'app.js', mode: 'replace', content: LESSON1_JS_START },
    { at: 98_500, type: 'speak', text: 'Ahora inténtalo tú. Escribe dos instrucciones con console punto log. En la primera, presenta tu nombre. En la segunda, cuenta que estás aprendiendo JavaScript. Recuerda colocar cada texto entre comillas y dentro de los paréntesis.' },
    {
      at: 106_000,
      type: 'challenge',
      challenge: {
        id: 'reto-primeras-instrucciones',
        title: 'Reto: tus dos primeros mensajes',
        instructions: `Escribe dos instrucciones en app.js.

1. La primera usa console.log y muestra un texto que empieza por "Me llamo".
2. La segunda usa console.log y muestra "Estoy aprendiendo JavaScript".
3. Ejecuta y abre la consola para comprobar el orden.`,
        tests: [
          { id: 'presentacion-console', description: 'Hay una instrucción que presenta tu nombre', validatorType: 'source-regex', regexPattern: 'console\\s*\\.\\s*log\\s*\\(\\s*["\\\']Me llamo[^"\\\']*["\\\']\\s*\\)\\s*;?', errorMessage: 'No encontramos un console.log con un texto que empiece por “Me llamo”.', hintTip: 'El texto completo va entre un par de comillas dentro de los paréntesis.' },
          { id: 'aprendiendo-console', description: 'Hay una segunda instrucción sobre JavaScript', validatorType: 'source-regex', regexPattern: 'console\\s*\\.\\s*log\\s*\\(\\s*["\\\']Estoy aprendiendo JavaScript["\\\']\\s*\\)\\s*;?', errorMessage: 'Falta el segundo mensaje o tiene una forma incompleta.', hintTip: 'Revisa que la segunda línea también cierre comillas y paréntesis.' },
          { id: 'mensajes-en-orden', description: 'La presentación aparece antes del mensaje de aprendizaje', validatorType: 'source-regex', regexPattern: 'console\\s*\\.\\s*log\\s*\\(\\s*["\\\']Me llamo[^"\\\']*["\\\']\\s*\\)\\s*;?[\\s\\S]*console\\s*\\.\\s*log\\s*\\(\\s*["\\\']Estoy aprendiendo JavaScript["\\\']\\s*\\)\\s*;?', errorMessage: 'Los dos mensajes existen, pero no están en el orden solicitado.', hintTip: 'JavaScript ejecuta de arriba abajo: presenta tu nombre primero.' },
        ],
        hints: [
          { level: 1, title: 'Una línea por mensaje', text: 'Cada salida necesita su propia instrucción completa.' },
          { level: 2, title: 'Revisa los pares', text: 'Cuenta dos comillas y dos paréntesis en cada línea.' },
          { level: 3, title: 'Misma forma, otro texto', text: 'La segunda instrucción tiene la misma estructura que la primera; solo cambia el texto entre comillas.' },
        ],
        solutionExplanation: 'Dos instrucciones completas producen dos mensajes en orden. La estructura se repite y el dato entre comillas cambia.',
      },
    },
    { at: 116_000, type: 'write', filePath: 'app.js', mode: 'replace', content: LESSON1_JS_DOS_LINEAS },
    { at: 117_000, type: 'run' },
    { at: 119_000, type: 'speak', text: 'Ya escribiste, ejecutaste y comprobaste tu primer programa. En la próxima lección aprenderás a convertir una meta en pasos pequeños antes de empezar a programar.' },
  ],
});
