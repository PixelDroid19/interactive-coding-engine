import { compileLesson } from '../../engine/lessonCompiler';
import { L12_CHALLENGE, L12_FORM, lesson12BeginnerWorkspace } from './beginnerWorkspaces';

const AUDIO_MS = 81_240;

export const LESSON_12 = compileLesson({
  id: 'fundamentos-12',
  title: '12. Inputs y formularios',
  description: 'Lee lo que escribe una persona, transforma ese dato y muestra una respuesta.',
  language: 'es',
  durationMs: AUDIO_MS,
  audioUrl: '/audio/fundamentos-12.mp3?v=gemini-20260824',
  fitTimelineToDuration: true,
  initialWorkspace: lesson12BeginnerWorkspace,
  executionMode: 'browser',
  concepts: ['Leer un input', 'Entrada, proceso y salida'],
  skillsRequired: ['functions', 'dom', 'events', 'strings'],
  skillsIntroduced: ['input-value', 'form-flow'],
  learningObjectives: ['Leer el valor actual de un input.', 'Separar la transformación del dato de la actualización de la página.'],
  commonMistakes: ['Leer el elemento completo cuando se necesitaba su propiedad value.', 'Leer el valor antes del clic y conservar un dato viejo.'],
  teachNotes: [
    { title: 'value', body: 'Un input es un elemento. Su propiedad value contiene el texto escrito en este momento.' },
    { title: 'Tres pasos', body: 'Leer la entrada, transformarla con una función y escribir el resultado hace el flujo fácil de revisar.' },
  ],
  beats: [
    { at: 0, type: 'chapter', title: 'Leer antes de responder' },
    { at: 300, type: 'speak', text: 'Una interfaz se vuelve más útil cuando puede responder a lo que alguien escribe. Seguiremos un flujo sencillo: leer la entrada, transformar ese dato y mostrar una salida.' },
    { at: 10_000, type: 'switch', filePath: 'index.html' },
    { at: 10_300, type: 'speak', text: 'Este campo de texto tiene el id nombre. Es un elemento del DOM como los anteriores, pero su propiedad value contiene lo que la persona haya escrito en ese momento.' },
    { at: 20_000, type: 'switch', filePath: 'app.js' },
    { at: 20_300, type: 'write', filePath: 'app.js', mode: 'replace', content: L12_FORM },
    { at: 20_600, type: 'speak', text: 'crearSaludo recibe un nombre y devuelve el mensaje terminado. Cuando ocurre el clic, mostrarSaludo lee el value del campo, llama a crearSaludo y coloca el resultado en la página.' },
    { at: 34_000, type: 'run' },
    { at: 35_000, type: 'gesture', durationMs: 1_400, points: [{ x: 52, y: 42, targetArea: 'preview', clicked: true }, { x: 58, y: 60, targetArea: 'preview' }] },
    { at: 40_000, type: 'speak', text: 'Observa que crearSaludo no necesita conocer la página. Recibe texto y devuelve texto. Separar el cálculo de la parte visual facilita comprobar la función y reutilizarla más adelante.' },
    { at: 47_000, type: 'chapter', title: 'Tu turno' },
    { at: 47_200, type: 'write', filePath: 'app.js', mode: 'replace', content: L12_CHALLENGE },
    { at: 47_500, type: 'speak', text: 'Ahora completa crearSaludo. Usa el parámetro que recibe para construir la respuesta, en lugar de escribir un nombre fijo. El evento y la lectura del campo ya están preparados.' },
    {
      at: 53_000,
      type: 'challenge',
      challenge: {
        id: 'reto-saludo-input',
        title: 'Reto: crea un saludo',
        instructions: `Completa crearSaludo(nombre).

- Debe devolver un texto que incluya el nombre recibido.
- Con "Ana" debe incluir "Ana".
- Con "Luis" debe incluir "Luis".
- No uses un nombre fijo.`,
        tests: [
          { id: 'saluda-ana', description: 'crearSaludo("Ana") incluye Ana', validatorType: 'function-call', targetFunction: 'crearSaludo', args: ['Ana'], expectedReturn: 'Hola, Ana', errorMessage: 'El saludo de Ana no tiene el formato esperado.', hintTip: 'Une el texto del saludo con el parámetro nombre.' },
          { id: 'saluda-luis', description: 'crearSaludo("Luis") incluye Luis', validatorType: 'function-call', targetFunction: 'crearSaludo', args: ['Luis'], expectedReturn: 'Hola, Luis', errorMessage: 'La función debe usar el nombre que recibe, no uno fijo.', hintTip: 'El parámetro cambia en cada llamada.' },
        ],
        hints: [
          { level: 1, title: 'Parámetro', text: 'nombre ya contiene el texto leído del input.' },
          { level: 2, title: 'Devuelve', text: 'La función necesita return para entregar el saludo.' },
          { level: 3, title: 'Une textos', text: 'Combina el comienzo del saludo con nombre usando el operador de concatenación que ya conoces.' },
        ],
        solutionExplanation: 'El evento obtiene la entrada, pero la función pura transforma el dato. Separar ambos pasos facilita comprender y probar el programa.',
      },
    },
    { at: 60_000, type: 'write', filePath: 'app.js', mode: 'replace', content: L12_FORM },
    { at: 61_000, type: 'run' },
    { at: 62_000, type: 'speak', text: 'Ya puedes leer un dato escrito por una persona, transformarlo y mostrar una respuesta. En la siguiente lección haremos lo mismo con todos los elementos de un array.' },
  ],
});
