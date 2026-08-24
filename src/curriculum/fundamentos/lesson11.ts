import { compileLesson } from '../../engine/lessonCompiler';
import { L11_CHALLENGE, L11_EVENTS, lesson11BeginnerWorkspace } from './beginnerWorkspaces';

const AUDIO_MS = 94_240;

export const LESSON_11 = compileLesson({
  id: 'fundamentos-11',
  title: '11. Eventos y botones',
  description: 'Espera un clic y ejecuta una función únicamente cuando ocurra.',
  language: 'es',
  durationMs: AUDIO_MS,
  audioUrl: '/audio/fundamentos-11.mp3?v=gemini-20260824',
  fitTimelineToDuration: true,
  initialWorkspace: lesson11BeginnerWorkspace,
  executionMode: 'browser',
  concepts: ['Qué es un evento', 'Escuchar un clic'],
  skillsRequired: ['functions', 'dom', 'get-element-by-id', 'text-content'],
  skillsIntroduced: ['events', 'click', 'add-event-listener'],
  learningObjectives: ['Explicar que un evento avisa que ocurrió una acción.', 'Conectar un clic con una función ya definida.'],
  commonMistakes: ['Llamar la función al registrar el evento en vez de entregar su nombre.', 'Escuchar el evento en un elemento distinto al botón.'],
  teachNotes: [
    { title: 'Esperar', body: 'El programa registra una función y queda esperando. Esa función no corre hasta que sucede el clic.' },
    { title: 'Entregar la función', body: 'En addEventListener se escribe el nombre de la función sin paréntesis porque el navegador debe llamarla después.' },
  ],
  beats: [
    { at: 0, type: 'chapter', title: 'Algo ocurrió' },
    { at: 300, type: 'speak', text: 'En la lección anterior la página cambió en cuanto ejecutamos el programa. Las interfaces reales también necesitan esperar acciones. Un evento es el aviso que envía el navegador cuando ocurre algo, como un clic o una tecla.' },
    { at: 13_000, type: 'switch', filePath: 'app.js' },
    { at: 13_300, type: 'speak', text: 'Primero encontramos el botón y el párrafo con sus ids. Después definimos responderAlClick. Recuerda que definir una función solo prepara sus instrucciones; todavía no las ejecuta.' },
    { at: 25_000, type: 'write', filePath: 'app.js', mode: 'replace', content: L11_EVENTS },
    { at: 25_300, type: 'speak', text: 'El método addEventListener permite escuchar eventos. Primero indicamos el evento click y después entregamos el nombre de la función sin paréntesis. Así el navegador sabe qué función debe llamar cuando ocurra el clic.' },
    { at: 39_000, type: 'run' },
    { at: 40_000, type: 'gesture', durationMs: 1_200, points: [{ x: 55, y: 48, targetArea: 'preview', clicked: true }, { x: 55, y: 64, targetArea: 'preview' }] },
    { at: 44_000, type: 'speak', text: 'El mensaje cambia solamente al pulsar el botón. Si escribiéramos responderAlClick con paréntesis al conectar el evento, la función se ejecutaría en ese momento en vez de quedar preparada para el clic.' },
    { at: 56_000, type: 'chapter', title: 'Tu turno' },
    { at: 56_200, type: 'write', filePath: 'app.js', mode: 'replace', content: L11_CHALLENGE },
    { at: 56_500, type: 'speak', text: 'Ahora modifica la respuesta de la función. El evento ya está conectado. Ejecuta el programa y comprueba dos momentos: antes del clic debe verse el mensaje inicial y después debe aparecer tu nuevo texto.' },
    {
      at: 63_000,
      type: 'challenge',
      challenge: {
        id: 'reto-evento-click',
        title: 'Reto: responde al clic',
        instructions: `Completa la respuesta del botón.

1. Conserva el evento click.
2. Dentro de responderAlClick, cambia PENDIENTE por un mensaje tuyo.
3. Ejecuta y pulsa el botón.
4. El mensaje debe cambiar después del clic.`,
        tests: [
          { id: 'mensaje-despues-click', description: 'El clic muestra una respuesta propia', validatorType: 'dom-check', domSelector: '#estado', domProperty: 'innerText', triggerClick: '#accion', regexPattern: '^(?!\\s*PENDIENTE\\s*$).+', errorMessage: 'Después del clic el mensaje todavía dice PENDIENTE.', hintTip: 'El cambio debe ocurrir dentro de la función conectada al evento.' },
        ],
        hints: [
          { level: 1, title: 'Dónde cambiar', text: 'No necesitas tocar el HTML ni el nombre del evento. Mira el cuerpo de responderAlClick.' },
          { level: 2, title: 'Cuándo ocurre', text: 'El texto debe asignarse cuando el navegador llame la función por el clic.' },
          { level: 3, title: 'Sin paréntesis', text: 'El segundo argumento de addEventListener es responderAlClick, no una llamada inmediata.' },
        ],
        solutionExplanation: 'El evento no contiene la respuesta: conecta una acción futura con una función que ya sabe qué cambiar.',
      },
    },
    { at: 70_000, type: 'write', filePath: 'app.js', mode: 'replace', content: L11_EVENTS },
    { at: 71_000, type: 'run' },
    { at: 72_000, type: 'speak', text: 'Ya puedes hacer que una página espere una acción y responda cuando ocurra. En la siguiente lección leeremos el texto que una persona escribe antes de construir la respuesta.' },
  ],
});
