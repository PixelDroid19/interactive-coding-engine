import { compileLesson } from '../../engine/lessonCompiler';
import { L14_CHALLENGE, L14_PROJECT, lesson14BeginnerWorkspace } from './beginnerWorkspaces';

const AUDIO_MS = 84_280;

export const LESSON_14 = compileLesson({
  id: 'fundamentos-14',
  title: '14. Proyecto guiado: lista de tareas',
  description: 'Construye una aplicación pequeña combinando datos, funciones, decisiones, DOM y eventos.',
  language: 'es',
  durationMs: AUDIO_MS,
  audioUrl: '/audio/fundamentos-14.mp3?v=gemini-20260824',
  fitTimelineToDuration: true,
  initialWorkspace: lesson14BeginnerWorkspace,
  executionMode: 'browser',
  concepts: ['Combinar lo aprendido', 'Actualizar datos y pantalla'],
  skillsRequired: ['variables', 'functions', 'conditionals', 'arrays', 'loops', 'dom', 'events', 'input-value'],
  skillsIntroduced: ['small-project', 'state-and-render'],
  learningObjectives: ['Separar el dato guardado de su representación en pantalla.', 'Construir un flujo completo desde el input hasta una lista actualizada.'],
  commonMistakes: ['Agregar textos vacíos al array.', 'Cambiar la pantalla sin actualizar primero los datos o al revés.'],
  teachNotes: [
    { title: 'Datos primero', body: 'El array tareas es la fuente del programa. La pantalla se vuelve a dibujar a partir de ese array.' },
    { title: 'Funciones pequeñas', body: 'Una función valida y guarda; otra dibuja; otra coordina el clic. Cada una tiene una responsabilidad.' },
  ],
  beats: [
    { at: 0, type: 'chapter', title: 'Juntar las piezas' },
    { at: 300, type: 'speak', text: 'En esta lección no añadiremos sintaxis nueva. Vamos a reunir lo que ya aprendiste para construir una lista de tareas pequeña, paso a paso y sin piezas misteriosas.' },
    { at: 10_000, type: 'switch', filePath: 'app.js' },
    { at: 10_300, type: 'speak', text: 'El array tareas conserva los datos. El campo recibe el texto, el botón dispara un evento y la lista muestra el resultado. Cada una de estas piezas apareció en una lección anterior.' },
    { at: 21_000, type: 'write', filePath: 'app.js', mode: 'replace', content: L14_PROJECT },
    { at: 21_300, type: 'speak', text: 'Dividimos el trabajo entre tres funciones. agregarTarea valida y guarda el texto. dibujarTareas recorre el array y actualiza la lista. manejarClick conecta la entrada de la persona con esas dos tareas.' },
    { at: 37_000, type: 'run' },
    { at: 38_000, type: 'gesture', durationMs: 1_600, points: [{ x: 52, y: 38, targetArea: 'preview', clicked: true }, { x: 60, y: 52, targetArea: 'preview', clicked: true }, { x: 55, y: 70, targetArea: 'preview' }] },
    { at: 43_000, type: 'speak', text: 'Hay una distinción importante: la lista visible no es nuestra fuente de datos. Las tareas viven en el array. Cuando ese array cambia, volvemos a dibujar la pantalla para que ambos coincidan.' },
    { at: 52_000, type: 'chapter', title: 'Tu reto del proyecto' },
    { at: 52_200, type: 'write', filePath: 'app.js', mode: 'replace', content: L14_CHALLENGE },
    { at: 52_500, type: 'speak', text: 'Tu parte del proyecto se concentra en agregarTarea. La función debe ignorar un texto vacío, guardar un texto válido y devolver la cantidad actual de tareas. Resuelve una regla a la vez.' },
    {
      at: 59_000,
      type: 'challenge',
      challenge: {
        id: 'reto-proyecto-tareas',
        title: 'Reto del proyecto: guarda tareas válidas',
        instructions: `Completa agregarTarea(texto).

- Si texto está vacío, no agregues nada y devuelve 0.
- Si recibe "Leer", guarda la tarea y devuelve 1.
- Una segunda tarea válida debe devolver 2.
- Usa el array tareas ya creado.`,
        tests: [
          { id: 'ignora-vacio', description: 'Un texto vacío no se agrega', validatorType: 'function-call', targetFunction: 'agregarTarea', args: [''], expectedReturn: 0, errorMessage: 'La función debe ignorar el texto vacío.', hintTip: 'La decisión de salir debe ocurrir antes de push.' },
          { id: 'agrega-una', description: 'La primera tarea devuelve cantidad 1', validatorType: 'function-call', targetFunction: 'agregarTarea', args: ['Leer'], expectedReturn: 1, errorMessage: 'Una tarea válida debe guardarse en el array.', hintTip: 'Usa push con el parámetro texto y devuelve length.' },
          { id: 'acumula-dos', description: 'Dos textos elegidos por la persona producen dos tareas', validatorType: 'function-call', targetFunction: 'agregarTarea', callSequence: [{ args: ['Mi primera tarea'], expectedReturn: 1 }, { args: ['Otra tarea distinta'], expectedReturn: 2 }], errorMessage: 'La función debe usar cada texto recibido y conservar las tareas ya agregadas.', hintTip: 'Prueba dos llamadas seguidas con textos distintos y observa tareas.length.' },
        ],
        hints: [
          { level: 1, title: 'Primero valida', text: 'Pregunta si texto es una cadena vacía antes de modificar el array.' },
          { level: 2, title: 'Después guarda', text: 'push agrega el texto recibido al final de tareas.' },
          { level: 3, title: 'Devuelve la cantidad', text: 'Después de guardar, tareas.length contiene el total actual.' },
        ],
        solutionExplanation: 'La función protege el estado con una condición, agrega únicamente datos válidos y devuelve una información verificable: la cantidad.',
      },
    },
    { at: 68_000, type: 'write', filePath: 'app.js', mode: 'replace', content: L14_PROJECT },
    { at: 69_000, type: 'run' },
    { at: 70_000, type: 'speak', text: 'Terminaste un proyecto que combina varias ideas fundamentales sin saltarse pasos. A continuación aprenderás a investigar errores, comprobar comportamientos y organizar programas cada vez más completos.' },
  ],
});
