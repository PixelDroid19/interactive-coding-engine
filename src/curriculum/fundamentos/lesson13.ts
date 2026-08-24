import { compileLesson } from '../../engine/lessonCompiler';
import { L13_CHALLENGE, L13_LIST, L13_SOLUTION, lesson13BeginnerWorkspace } from './beginnerWorkspaces';

const AUDIO_MS = 89_560;

export const LESSON_13 = compileLesson({
  id: 'fundamentos-13',
  title: '13. Listas en la página',
  description: 'Recorre un array y crea un elemento visible por cada dato.',
  language: 'es',
  durationMs: AUDIO_MS,
  audioUrl: '/audio/fundamentos-13.mp3?v=gemini-20260824',
  fitTimelineToDuration: true,
  initialWorkspace: lesson13BeginnerWorkspace,
  executionMode: 'browser',
  concepts: ['De array a lista', 'Crear y agregar elementos'],
  skillsRequired: ['arrays', 'loops', 'dom', 'functions'],
  skillsIntroduced: ['create-element', 'append-child', 'render-list'],
  learningObjectives: ['Relacionar cada dato de un array con una fila visible.', 'Vaciar y volver a dibujar una lista sin duplicar contenido.'],
  commonMistakes: ['Crear siempre el mismo texto en lugar de usar el elemento actual.', 'Olvidar limpiar la lista antes de volver a dibujarla.'],
  teachNotes: [
    { title: 'Una vuelta, una fila', body: 'El bucle recorre datos conocidos. En cada vuelta crea un li y usa el valor actual como texto.' },
    { title: 'Dibujar de nuevo', body: 'Vaciar la lista antes de recorrer evita duplicados cuando los datos cambian.' },
  ],
  beats: [
    { at: 0, type: 'chapter', title: 'Datos que se ven' },
    { at: 300, type: 'speak', text: 'Ya sabes guardar varios datos en un array y recorrerlos con un bucle. Ahora usaremos cada vuelta para crear un elemento visible en la página.' },
    { at: 9_000, type: 'switch', filePath: 'app.js' },
    { at: 9_300, type: 'speak', text: 'Comenzamos con tres tareas y una lista vacía. La función mostrarTareas recibe el array, limpia lo que había en pantalla y lo recorre con el mismo for de la lección de arrays.' },
    { at: 19_000, type: 'write', filePath: 'app.js', mode: 'replace', content: L13_LIST },
    { at: 19_300, type: 'speak', text: 'En cada vuelta, createElement crea un elemento de lista. Luego textContent coloca la tarea actual y appendChild añade esa fila a la lista visible. Una vuelta produce una fila.' },
    { at: 33_000, type: 'run' },
    { at: 34_000, type: 'gesture', durationMs: 1_200, points: [{ x: 52, y: 42, targetArea: 'preview' }, { x: 52, y: 66, targetArea: 'preview' }] },
    { at: 38_000, type: 'speak', text: 'Al terminar usamos length para mostrar la cantidad total. No apareció una estructura de datos nueva: acabamos de combinar arrays, bucles y operaciones del DOM que ya habías aprendido por separado.' },
    { at: 44_000, type: 'chapter', title: 'Tu turno' },
    { at: 44_200, type: 'write', filePath: 'app.js', mode: 'replace', content: L13_CHALLENGE },
    { at: 44_500, type: 'speak', text: 'Ahora completa resumenLista. La función recibe un array y debe devolver un texto con la cantidad de elementos y el primero de ellos. Usa length y recuerda que el primer índice es cero.' },
    {
      at: 49_000,
      type: 'challenge',
      challenge: {
        id: 'reto-resumen-lista',
        title: 'Reto: resume una lista',
        instructions: `Completa resumenLista(items).

Debe devolver exactamente:
"3 tareas · Primera: Leer"

cuando recibe ["Leer", "Practicar", "Descansar"]. Usa el array recibido, no datos fijos.`,
        tests: [
          { id: 'resumen-tres', description: 'Resume una lista de tres tareas', validatorType: 'function-call', targetFunction: 'resumenLista', args: [['Leer', 'Practicar', 'Descansar']], expectedReturn: '3 tareas · Primera: Leer', errorMessage: 'El resumen debe incluir la cantidad y el primer elemento.', hintTip: 'La cantidad está en length y el primer elemento en la posición cero.' },
          { id: 'resumen-dos', description: 'Funciona con otros datos', validatorType: 'function-call', targetFunction: 'resumenLista', args: [['Comprar', 'Cocinar']], expectedReturn: '2 tareas · Primera: Comprar', errorMessage: 'La función parece depender del ejemplo de tres tareas.', hintTip: 'Usa el parámetro items en todas las partes del resultado.' },
        ],
        hints: [
          { level: 1, title: 'Cantidad', text: 'items.length cambia según el array recibido.' },
          { level: 2, title: 'Primera', text: 'Los arrays comienzan en la posición cero.' },
          { level: 3, title: 'Construye el texto', text: 'Une cantidad, las palabras del formato y el primer elemento.' },
        ],
        solutionExplanation: 'Una función puede resumir cualquier array cuando usa el parámetro, length y la posición cero en lugar de copiar el ejemplo.',
      },
    },
    { at: 54_000, type: 'write', filePath: 'app.js', mode: 'replace', content: L13_SOLUTION },
    { at: 55_000, type: 'run' },
    { at: 56_000, type: 'speak', text: 'Ya sabes convertir los datos de un array en elementos visibles. En la siguiente lección reuniremos entradas, eventos, funciones, arrays y DOM en un proyecto guiado.' },
  ],
});
